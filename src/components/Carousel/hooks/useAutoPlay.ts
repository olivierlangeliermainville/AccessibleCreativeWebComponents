
import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Motion } from './useMotion'

type Easing = (t: number) => number

type AutoPlayOptions = {
    motion: Motion
    running: boolean                 // autoplay should be moving right now
    canRun: boolean                  // autoplay is on and nobody is dragging
    speed: number | undefined        // slides per second: glide mode. Without it, step mode.
    interval: number                 // ms between steps (step mode)
    settled: number                  // a move of any kind restarts the step wait
    setSettled: (slide: number) => void
    glideDirection: 1 | -1
    playPauseEasingDuration: number
    releaseEasingDuration: number
    directionChangeDuration: number
    easings: { playPause: Easing; release: Easing; directionChange: Easing }
}

export function useAutoPlay({
    motion,
    running,
    canRun,
    speed,
    interval,
    settled,
    setSettled,
    glideDirection,
    playPauseEasingDuration,
    releaseEasingDuration,
    directionChangeDuration,
    easings,
}: AutoPlayOptions) {
    const { goBy, drawnRef, targetRef, springFrameRef, paint } = motion

    // Effects keep the goBy from the render they started in, so they call the latest one through a ref
    const goByRef = useRef(goBy)
    useLayoutEffect(() => {
        goByRef.current = goBy
    })

    // Easing curves are often passed inline, which makes a new function every render. Reading them
    // through a ref keeps them out of the effect's dependencies, so they can't restart it.
    const easingsRef = useRef(easings)
    useLayoutEffect(() => {
        easingsRef.current = easings
    })

    // Step mode: wait `interval` ms, then spring one slide.
    // `settled` is a dependency, so any move (including a manual one) restarts the wait.
    useEffect(() => {
        if (!running || speed) return

        let frame = 0
        let lastTime = performance.now()
        let elapsedMs = 0 // since the last step

        const tick = (now: number) => {
            // Clamped to 0..50 ms: no jump after a hidden tab, and the first frame's timestamp
            // can be slightly earlier than the performance.now() above
            elapsedMs += Math.max(0, Math.min(now - lastTime, 50))
            lastTime = now

            if (elapsedMs >= interval) {
                elapsedMs = 0
                goByRef.current(1)
            }
            frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [running, interval, speed, settled])

    // Glide mode: every frame, move by glideVelocityRef (slides per second).
    // The effect restarts whenever the goal changes (resume, pause, direction flip, drag release) and
    // eases from the current velocity to `speed` in the glide direction (running) or 0 (paused).
    // The velocity lives in a ref so it survives those restarts.
    const glideVelocityRef = useRef(0)
    const afterReleaseRef = useRef(false) // a drag release can use its own, slower ease

    useEffect(() => {
        if (!speed || !canRun) {
            glideVelocityRef.current = 0 // not gliding, or a drag has taken over
            return
        }
        const goalVelocity = running ? speed * glideDirection : 0
        // Opposite signs only: a velocity of 0 (resuming, or released without momentum) is not a reversal
        const reversingDirection = goalVelocity * glideVelocityRef.current < 0
        const ease = afterReleaseRef.current
            ? { duration: releaseEasingDuration, easing: easingsRef.current.release }
            : reversingDirection
            ? { duration: directionChangeDuration, easing: easingsRef.current.directionChange }
            : { duration: playPauseEasingDuration, easing: easingsRef.current.playPause }
        afterReleaseRef.current = false
        if (goalVelocity === 0 && glideVelocityRef.current === 0) return // already still

        let fromVelocity = glideVelocityRef.current // rest, a flick, or the middle of an earlier ease
        let easeElapsedMs = 0
        let frame = 0
        let lastTime = performance.now()

        const tick = (now: number) => {
            // Same clamp as the step loop
            const deltaMs = Math.max(0, Math.min(now - lastTime, 50))
            lastTime = now

            if (springFrameRef.current !== null) {
                // A spring owns the position until it ends at rest (a Prev/Next press, or a drag
                // release in step mode), so the ease starts over from zero afterwards
                glideVelocityRef.current = 0
                fromVelocity = 0
                easeElapsedMs = 0
            } else {
                // Zero duration means no easing. At progress 1 it lands exactly on the goal, so a curve
                // that ends at 0.9999 can't leave a paused carousel creeping forever.
                easeElapsedMs += deltaMs
                const progress = ease.duration > 0 ? Math.min(easeElapsedMs / ease.duration, 1) : 1
                glideVelocityRef.current =
                    progress >= 1
                        ? goalVelocity
                        : fromVelocity + (goalVelocity - fromVelocity) * ease.easing(progress)

                if (glideVelocityRef.current !== 0) {
                    drawnRef.current += (glideVelocityRef.current * deltaMs) / 1000
                    const slide = Math.round(drawnRef.current)
                    if (slide !== targetRef.current) {
                        targetRef.current = slide // keeps a later Prev/Next building from where we are
                        setSettled(slide)         // once per slide: this is what assistive tech follows
                    }
                    paint()
                }
            }

            // Eased all the way to a stop: no more frames until it is resumed
            if (goalVelocity === 0 && glideVelocityRef.current === 0) return
            frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [
        running,
        canRun,
        speed,
        glideDirection,
        playPauseEasingDuration,
        releaseEasingDuration,
        directionChangeDuration,
        drawnRef,
        targetRef,
        springFrameRef,
        paint,
        setSettled,
    ])

    return { glideVelocityRef, afterReleaseRef }
}
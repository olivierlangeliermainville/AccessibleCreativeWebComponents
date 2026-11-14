import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Sign } from '../internal'
import type { ResolvedAutoPlay } from '../options'
import type { Motion } from './useMotion'

type AutoPlayArgs = {
    motion: Motion
    settings: ResolvedAutoPlay
    running: boolean                   // autoplay should be moving right now
    canRun: boolean                    // autoplay is on and nobody is dragging
    direction: Sign                    // which way it is heading
    settled: number                    // a move of any kind restarts the step wait
    setSettled: (slide: number) => void
}

export function useAutoPlay({ motion, settings, running, canRun, direction, settled, setSettled }: AutoPlayArgs) {
    const { goBy, drawnRef, targetRef, springFrameRef, paint } = motion
    const { speed, interval } = settings
    const pauseMs = settings.ease.pause.duration
    const releaseMs = settings.ease.release.duration
    const reverseMs = settings.ease.reverse.duration

    // Effects keep the values from the render they started in, so these are read through refs.
    // Easing curves in particular are often passed inline: a new function every render.
    const goByRef = useRef(goBy)
    const directionRef = useRef(direction)
    const easeRef = useRef(settings.ease)
    useLayoutEffect(() => {
        goByRef.current = goBy
        directionRef.current = direction
        easeRef.current = settings.ease
    })

    // Step mode: wait `interval` ms, then spring one slide the way autoplay is heading.
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
                goByRef.current(directionRef.current)
            }
            frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [running, interval, speed, settled])

    // Glide mode: every frame, move by glideVelocityRef (slides per second).
    // The effect restarts whenever the goal changes (resume, pause, turning round, drag release) and
    // eases from the current velocity to `speed` in the current direction (running) or 0 (paused).
    // The velocity lives in a ref so it survives those restarts.
    const glideVelocityRef = useRef(0)
    const afterReleaseRef = useRef(false) // a drag release can use its own ease

    useEffect(() => {
        if (!speed || !canRun) {
            glideVelocityRef.current = 0 // not gliding, or a drag has taken over
            return
        }
        const goalVelocity = running ? speed * direction : 0
        // Opposite signs only: a velocity of 0 (resuming, or released without momentum) is not a reversal
        const reversing = goalVelocity * glideVelocityRef.current < 0
        const ease = afterReleaseRef.current
            ? { duration: releaseMs, easing: easeRef.current.release.easing }
            : reversing
            ? { duration: reverseMs, easing: easeRef.current.reverse.easing }
            : { duration: pauseMs, easing: easeRef.current.pause.easing }
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
        direction,
        pauseMs,
        releaseMs,
        reverseMs,
        drawnRef,
        targetRef,
        springFrameRef,
        paint,
        setSettled,
    ])

    return { glideVelocityRef, afterReleaseRef }
}
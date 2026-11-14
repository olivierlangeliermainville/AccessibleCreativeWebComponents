import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { SETTLE } from '../defaults'
import { clamp } from '../helpers'
import type { DrawSlide } from '../internal'

type MotionOptions = {
    infinite: boolean
    maxPosition: number
    duration: number // ms Prev/Next take to settle
    reduced: boolean
    setSettled: (slide: number) => void
    setHasMoved: (hasMoved: boolean) => void
    onFrame: (drawnPosition: number) => void // told the drawn position on every paint
}

// The moving part: where the slides are drawn, and the spring that moves them between slides.
// Animation loops read and write these refs directly, so they never see stale state.
export function useMotion({ infinite, maxPosition, duration, reduced, setSettled, setHasMoved, onFrame }: MotionOptions) {
    const drawnRef = useRef(0) // drawn position in slides (fractional): the source of truth while moving

    // --- Painting -------------------------------------------------------------------

    // Slides register a draw function. paint() calls each one with the drawn position, and the
    // slide writes its own transform to the DOM, which keeps React out of the per-frame work.
    const drawersRef = useRef(new Set<DrawSlide>())
    const registerSlide = useCallback((draw: DrawSlide) => {
        drawersRef.current.add(draw)
        return () => {
            drawersRef.current.delete(draw)
        }
    }, [])

    // paint() only reads refs, so a copy held by an old animation loop is never stale
    const viewRef = useRef({ infinite, maxPosition, onFrame })
    useLayoutEffect(() => {
        viewRef.current = { infinite, maxPosition, onFrame }
    })

    // `force` redraws every slide, including the far-off ones that are normally skipped
    const paint = useCallback((force = false) => {
        const { infinite, maxPosition, onFrame } = viewRef.current
        const drawnPosition = infinite ? drawnRef.current : clamp(drawnRef.current, 0, maxPosition)
        drawersRef.current.forEach((draw) => draw(drawnPosition, force))
        onFrame(drawnPosition)
    }, [])

    // After every render (child effects run first, so the slides are registered): put each slide in place
    useLayoutEffect(() => {
        paint(true)
    })

    // --- Spring ---------------------------------------------------------------------

    const targetRef = useRef(0)                        // slide the spring is heading to (glide keeps it in sync)
    const springVelocityRef = useRef(0)                // slides per second
    const springFrameRef = useRef<number | null>(null) // set while the spring is running

    useEffect(
        () => () => {
            if (springFrameRef.current !== null) cancelAnimationFrame(springFrameRef.current)
        },
        []
    )

    const stopSpring = () => {
        if (springFrameRef.current !== null) {
            cancelAnimationFrame(springFrameRef.current)
            springFrameRef.current = null
        }
    }

    // Springs the drawn position to `target`, starting with the velocity it is given
    const animateTo = (target: number, velocity = 0, ms = duration) => {
        stopSpring()
        targetRef.current = target
        setSettled(target)
        setHasMoved(true)

        if (reduced || ms <= 0) {
            drawnRef.current = target
            springVelocityRef.current = 0
            paint()
            return
        }

        // Critically damped: settles in about `ms` without wobble
        const omega = SETTLE / (ms / 1000)
        const distance = target - drawnRef.current
        const direction = Math.sign(distance)
        const maxSpeed = omega * Math.abs(distance)
        springVelocityRef.current =
            velocity * direction > 0 ? Math.min(Math.abs(velocity), maxSpeed) * direction : 0
        let lastTime = performance.now()

        const tick = (now: number) => {
            let remainingSeconds = Math.min((now - lastTime) / 1000, 1 / 20)
            lastTime = now
            // Small fixed steps keep the spring stable even when a frame is slow
            while (remainingSeconds > 0) {
                const stepSeconds = Math.min(remainingSeconds, 1 / 120)
                const acceleration =
                    -omega * omega * (drawnRef.current - target) - 2 * omega * springVelocityRef.current
                springVelocityRef.current += acceleration * stepSeconds
                drawnRef.current += springVelocityRef.current * stepSeconds
                remainingSeconds -= stepSeconds
            }

            const done =
                Math.abs(drawnRef.current - target) < 0.0005 && Math.abs(springVelocityRef.current) < 0.01
            if (done) {
                drawnRef.current = target
                springVelocityRef.current = 0
                springFrameRef.current = null
            }
            paint()
            if (!done) springFrameRef.current = requestAnimationFrame(tick)
        }
        springFrameRef.current = requestAnimationFrame(tick)
    }

    // Builds on the slide we are heading to, so fast clicks add up.
    // Prev/Next never call this when they can't move.
    const goBy = (steps: number) => {
        const base = infinite ? targetRef.current : Math.min(targetRef.current, maxPosition)
        animateTo(infinite ? base + steps : clamp(base + steps, 0, maxPosition), springVelocityRef.current)
    }

    return {
        drawnRef,
        targetRef,
        springVelocityRef,
        springFrameRef,
        registerSlide,
        paint,
        stopSpring,
        animateTo,
        goBy,
    }
}

export type Motion = ReturnType<typeof useMotion>
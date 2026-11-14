import {useRef, useLayoutEffect, useEffect, useCallback} from 'react'
import { type MotionFrame } from '../types'

// hooks/useMotionReadout.ts
export function useMotionReadout(sectionRef: { current: HTMLElement | null }, cssVariables: boolean) {
    const listenersRef = useRef(new Set<(frame: MotionFrame) => void>())
    const frameRef = useRef<MotionFrame>({ position: 0, velocity: 0, direction: 0 })
    const lastRef = useRef({ position: 0, time: 0 })
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const cssVariablesRef = useRef(cssVariables)
    useLayoutEffect(() => { cssVariablesRef.current = cssVariables })
    useEffect(() => () => clearTimeout(idleTimerRef.current), [])

    const publish = useCallback((frame: MotionFrame) => {
        frameRef.current = frame
        listenersRef.current.forEach((listener) => listener(frame))
        const section = sectionRef.current
        if (cssVariablesRef.current && section) {
            section.style.setProperty('--carousel-position', frame.position.toFixed(3))
            section.style.setProperty('--carousel-velocity', frame.velocity.toFixed(3))
        }
    }, [sectionRef])

    const onFrame = useCallback((position: number) => {
        const last = lastRef.current
        if (position === last.position) return            // nothing moved: not a real frame
        const now = performance.now()
        const seconds = (now - last.time) / 1000
        lastRef.current = { position, time: now }
        if (seconds <= 0) return

        const measured = (position - last.position) / seconds
        const velocity = frameRef.current.velocity + (measured - frameRef.current.velocity) * 0.25 // smoothed
        const direction = Math.abs(velocity) < 0.02 ? 0 : velocity > 0 ? 1 : -1
        publish({ position, velocity, direction })

        clearTimeout(idleTimerRef.current)                 // frames stop when the motion stops,
        idleTimerRef.current = setTimeout(() => publish({ position, velocity: 0, direction: 0 }), 120) // so a timer reports it
    }, [publish])

    const subscribeFrame = useCallback((listener: (frame: MotionFrame) => void) => {
        listenersRef.current.add(listener)
        return () => { listenersRef.current.delete(listener) }
    }, [])

    return { onFrame, subscribeFrame }
}
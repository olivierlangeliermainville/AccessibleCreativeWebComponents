import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Direction } from '../types'

const THRESHOLD = 10 // px of scrolling that counts: smaller movements are ignored

// Calls `onTurn` when the page starts scrolling the other way: down is forward, up is backward
// (flipped by `inverse`). It only listens while `enabled`, so a carousel that isn't steered by
// scroll adds no scroll listener to the page.
export function useScrollSteer(enabled: boolean, inverse: boolean, onTurn: (direction: Direction) => void) {
    const onTurnRef = useRef(onTurn)
    useLayoutEffect(() => {
        onTurnRef.current = onTurn
    })

    useEffect(() => {
        if (!enabled) return

        let lastY = window.scrollY
        let lastDirection: Direction | null = null

        const onScroll = () => {
            const delta = window.scrollY - lastY
            if (Math.abs(delta) <= THRESHOLD) return
            lastY = window.scrollY

            const direction: Direction = delta > 0 !== inverse ? 'forward' : 'backward'
            if (direction === lastDirection) return // only turns count, so a drag's say isn't overruled
            lastDirection = direction
            onTurnRef.current(direction)
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [enabled, inverse])
}
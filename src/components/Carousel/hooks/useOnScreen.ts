import { useEffect, useState } from 'react'

// Whether `ref`'s element is scrolled into view. Always true while disabled.
export function useOnScreen(ref: { current: Element | null }, enabled = true) {
    const [onScreen, setOnScreen] = useState(true) // assumed visible until the observer says otherwise

    useEffect(() => {
        const element = ref.current
        if (!enabled || !element || typeof IntersectionObserver === 'undefined') return

        const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0 })
        observer.observe(element)
        return () => observer.disconnect()
    }, [ref, enabled])

    return !enabled || onScreen
}
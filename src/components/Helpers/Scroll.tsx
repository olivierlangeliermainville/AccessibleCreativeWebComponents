import { useEffect, useRef, useState } from "react"

type ScrollDirection = 1 | -1 

export function useScrollDirection(threshold = 0, inverse = false) {
    const [direction, setDirection] = useState<ScrollDirection>(-1)
    const lastY = useRef<number>(0)

    useEffect(() => {
        lastY.current = window.scrollY

        const updateScrollData = () => {
            const currentY = window.scrollY
            const delta = currentY - lastY.current

            // Ignore tiny movements
            if (Math.abs(delta) <= threshold) return


            setDirection((delta > 0) !== inverse ? -1 : 1)
            lastY.current = currentY
        }

        window.addEventListener("scroll", updateScrollData, { passive: true })

        return () => window.removeEventListener("scroll", updateScrollData)
    }, [threshold, inverse])

    return direction
}
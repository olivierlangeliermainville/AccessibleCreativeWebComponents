import { useCarousel } from "./context"
import { useRef, useEffect, useLayoutEffect} from 'react'
import { type MotionFrame } from "./types"
export function useCarouselState() {
    const { activeIndex, slideCount, playing, dragging, canPrev, canNext, goTo, goBy, setPlaying } = useCarousel()
    return {
        activeIndex, slideCount, playing, dragging, canPrev, canNext, goTo,
        next: () => { if (canNext) goBy(1) },
        prev: () => { if (canPrev) goBy(-1) },
        play: () => setPlaying(true),
        pause: () => setPlaying(false),
    }
}

export function useCarouselFrame(callback: (frame: MotionFrame) => void) {
    const { subscribeFrame } = useCarousel()
    const callbackRef = useRef(callback)
    useLayoutEffect(() => { callbackRef.current = callback })
    useEffect(() => subscribeFrame((frame) => callbackRef.current(frame)), [subscribeFrame])
}
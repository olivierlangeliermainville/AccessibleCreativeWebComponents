import { useEffect, useLayoutEffect, useRef } from 'react'
import { useCarousel } from './context'
import type { MotionFrame } from './types'

// For building your own controls inside <Carousel>: dots, a counter, a custom play button.
// Only values that change once per slide or per interaction, so it re-renders rarely.
export function useCarouselState() {
    const { activeIndex, slideCount, playing, dragging, direction, canPrev, canNext, goTo, step, setPlaying } =
        useCarousel()
    return {
        activeIndex,  // the first visible slide, 0-based
        slideCount,
        playing,      // false once the user has paused autoplay
        dragging,
        direction,    // 'forward' | 'backward': where autoplay is heading
        canPrev,
        canNext,
        goTo,
        next: () => step(1),   // like the Next button: moves one slide, and steers if `steer.buttons` is on
        prev: () => step(-1),
        play: () => setPlaying(true),
        pause: () => setPlaying(false),
    }
}

// Runs `callback` on every frame while the carousel moves, without re-rendering your component.
// For things that follow the motion: parallax, a 3D scene, a canvas.
export function useCarouselFrame(callback: (frame: MotionFrame) => void) {
    const { subscribeFrame } = useCarousel()

    const callbackRef = useRef(callback)
    useLayoutEffect(() => {
        callbackRef.current = callback
    })

    useEffect(() => subscribeFrame((frame) => callbackRef.current(frame)), [subscribeFrame])
}
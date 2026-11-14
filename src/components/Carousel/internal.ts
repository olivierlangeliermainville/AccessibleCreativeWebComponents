import type { CarouselLabels, CarouselType, Direction, MotionFrame } from './types'

// Internal types. These are not part of the public API and can change freely.

/** What a slide registers with the carousel. `force` redraws it even when it is far off-screen. */
export type DrawSlide = (drawnPosition: number, force: boolean) => void

/** +1 forward, -1 backward: the form the maths wants. The public API uses 'forward' / 'backward'. */
export type Sign = 1 | -1

export const toSign = (direction: Direction): Sign => (direction === 'forward' ? 1 : -1)
export const toDirection = (sign: Sign): Direction => (sign === 1 ? 'forward' : 'backward')

/**
 * Everything the carousel's parts (Track, Slide, Prev, Next, PlayPause) and the public hooks can use.
 * Values first, then the things they can call.
 */
export type CarouselContextValue = {
    // ----- values
    type: CarouselType
    gap: number                 // px
    labels: CarouselLabels
    slideCount: number          // real slides, not copies
    visibleCount: number        // whole slides that fit in the track
    settledPosition: number     // slide we are on or heading to
    activeIndex: number         // settledPosition wrapped into 0..slideCount-1
    direction: Direction        // where autoplay is heading
    playing: boolean            // false once the user has paused autoplay
    dragging: boolean
    draggable: boolean
    autoPlayable: boolean       // autoplay is configured
    canPrev: boolean
    canNext: boolean

    // ----- things to call
    step: (sign: Sign) => void  // what Prev and Next do: move one slide, and steer if that is switched on
    goTo: (index: number) => void
    setPlaying: (playing: boolean) => void
    startDrag: () => void
    moveDrag: (slides: number) => void       // distance dragged in slides, right = positive
    releaseDrag: (velocity: number) => void  // slides per second, forward = positive
    registerSlide: (draw: DrawSlide) => () => void
    subscribeFrame: (listener: (frame: MotionFrame) => void) => () => void
    setSlideCount: (count: number) => void
    setVisibleCount: (count: number) => void
}
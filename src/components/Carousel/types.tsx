import type { defaultLabels } from './defaults'
import type { Dispatch, SetStateAction } from 'react'
export type CarouselType = 'default' | 'infinite'

// ------- Drag ---------------------------------

export type DragOptions = {
    momentum?: boolean     // flicks carry across several slides (default false)
    reach?: number         // seconds of extra travel a flick adds (default 0.25)
    maxSlides?: number     // most slides one flick can add (default 8)
    friction?: number      // above 0. Higher stops sooner, lower glides longer (default 1)
    duration?: number      // ms: settle time when there is no flick (defaults to `duration`)
    minDuration?: number   // ms: shortest flick settle (default 0)
    maxDuration?: number   // ms: longest flick settle (default 10000)
}

// ------- Scroll ---------------------------------

export type ScrollOptions = {
    inverse?: boolean                // scroll up moves forward, down moves backward (default false)
    directionChangeDuration?: number // ms: how long to interpolate the scroll direction change (default 200)
    directionChangeEasing?:(t: number) => number
}

// ------- AutoPlay ---------------------------------

type AutoPlayBase = {
    pauseOnHover?: boolean // pause when the pointer is over the carousel (default true). Turning it off is not recommended: it makes the carousel hard to use for people with motor impairments.
    pauseOnFocus?: boolean // pause when a child has keyboard focus (default true). Turning it off is not recommended, for the same reason.
    playPauseButton?: boolean // whether <CarouselPlayPause> renders (default true). Without a way to pause, autoplay fails WCAG 2.2.2 unless the page provides its own control.
    pauseOffScreen?: boolean
    dragDirectionChange?: boolean
    buttonDirectionChange?: boolean
}

// Step: wait, then move one slide
type StepAutoPlay = AutoPlayBase & {
    interval?: number // ms between moves (default 5000)
    speed?: never
    playPauseEasingDuration?: never
    playPauseEasing?: never
    releaseEasingDuration?: never
    releaseEasing?: never
    scrollInfluence?: never
}

// Glide: move continuously, never settling on a slide
type GlideAutoPlay = AutoPlayBase & {
    speed: number // slides per second
    interval?: never
    playPauseEasingDuration?: number           // ms to ease between standstill and `speed` on pause/resume (default 0)
    playPauseEasing?: (t: number) => number    // curve for that ease: progress 0..1 in, eased 0..1 out (default linear)
    releaseEasingDuration?: number             // ms to ease from the release velocity to `speed` after a drag (defaults to playPauseEasingDuration)
    releaseEasing?: (t: number) => number      // curve for that ease (defaults to playPauseEasing)
    scrollInfluence?: boolean | ScrollOptions // Whether a user scroll changes the autoplay direction (default false).
}

export type AutoPlayOptions = StepAutoPlay | GlideAutoPlay


// ------- Carousel ---------------------------------

// What a slide registers with the carousel. `drawnPosition` is in slides (fractional);
// `force` makes it redraw even if it is far off-screen.
export type DrawSlide = (drawnPosition: number, force: boolean) => void

export type Direction = 1 | -1 | null;

export type CarouselLabels = typeof defaultLabels

export type CarouselContextValue = {
    activeIndex: number
    slideCount: number
    settledPosition: number // slide we are on or heading to (whole number)
    registerSlide: (draw: DrawSlide) => () => void
    glideDirection: number
    visibleCount: number    // how many whole slides fit in the track
    gap: number             // px
    type: CarouselType
    labels: CarouselLabels
    canPrev: boolean
    canNext: boolean
    draggable: boolean
    dragging: boolean
    autoPlayable: boolean
    playing: boolean
    playPauseButton: boolean
    buttonDirectionChange: boolean
    goTo: (index: number) => void
    subscribeFrame: (listener: (frame: MotionFrame) => void) => () => void
    setManualDirection: Dispatch<SetStateAction<Direction>>
    setPlaying: (playing: boolean) => void
    setSlideCount: (count: number) => void
    setVisibleCount: (count: number) => void
    goBy: (steps: number) => void
    startDrag: () => void
    moveDrag: (slides: number) => void      // distance dragged, in slides (right = positive)
    releaseDrag: (velocity: number) => void // slides per second, forward = positive
}

export type NameProps = { 'aria-label': string } | { 'aria-labelledby': string }

export type SharedProps = {
    gap?: number             // px between slides
    duration?: number        // ms: how long Prev and Next take to settle
    reducedMotion?: boolean  // omit to follow the system setting
    drag?: boolean | DragOptions
    labels?: Partial<CarouselLabels>
    onSlideChange?: (index: number) => void
    onPlayingChange?: (playing: boolean) => void
    onDragChange?: (dragging: boolean) => void
    cssVariables?: boolean
}

// `type` is the discriminant: its value decides which shape applies
export type ModeProps =
    | { type?: 'default'; autoPlay?: never }
    | { type: 'infinite'; autoPlay?: boolean | AutoPlayOptions }

export type CarouselProps = Omit<React.ComponentPropsWithoutRef<'section'>, 'aria-label' | 'aria-labelledby'> &
    NameProps &
    SharedProps &
    ModeProps

export type ButtonProps = React.ComponentPropsWithoutRef<'button'>



// ------- Callback, hooks, etc... ---------------------------------


export type MotionFrame = {
    position: number      // drawn position in slides, fractional
    velocity: number      // slides per second, positive = forward
    direction: -1 | 0 | 1 // 0 while standing still
}
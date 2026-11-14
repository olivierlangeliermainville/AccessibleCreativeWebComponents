import type { defaultLabels } from './defaults'

// =============================================================================================
// Public types: everything a user of the package can pass in, or get back.
// Internal types live in ./internal.
// =============================================================================================

export type CarouselType = 'default' | 'infinite'

/** Which way autoplay is heading. Forward is toward the next slide, so the slides move left. */
export type Direction = 'forward' | 'backward'

/** Reshapes progress: 0..1 in, 0..1 out. Linear is `(t) => t`. */
export type Easing = (t: number) => number

/** How a change of speed plays out. */
export type Ease = {
    duration?: number // ms
    easing?: Easing   // default: linear
}

// ---------------------------------------------------------------------------------------------
// Drag
// ---------------------------------------------------------------------------------------------

/** Tuning for flicks. Only used when `momentum` is on. */
export type MomentumOptions = {
    reach?: number       // seconds of extra travel a flick adds (default 0.25)
    maxSlides?: number   // most slides one flick can add (default 8)
    friction?: number    // above 0. Higher stops sooner, lower glides longer (default 1)
    minDuration?: number // ms: shortest flick settle (default 0)
    maxDuration?: number // ms: longest flick settle (default 10000)
}

export type DragOptions = {
    /** Flicks carry across several slides. `true` for the defaults, or tune it. Default: false. */
    momentum?: boolean | MomentumOptions
    /** ms the carousel takes to settle after a release without a flick. Defaults to `duration`. */
    settle?: number
}

// ---------------------------------------------------------------------------------------------
// Autoplay
//
// Two modes, told apart by which of `interval` and `speed` you give:
//   step  - waits `interval` ms, then moves one slide
//   glide - moves continuously at `speed` slides per second
// Everything else is shared, except `ease`, which only glide has: a step is already a spring.
// ---------------------------------------------------------------------------------------------

/** What turns autoplay around. Whichever acted last decides the direction. */
export type SteerOptions = {
    /** Page scroll: scrolling down goes forward, up goes backward. `{ inverse: true }` flips that. */
    scroll?: boolean | { inverse?: boolean }
    /** Letting go of a drag sets the direction you pushed. */
    drag?: boolean
    /** Prev and Next set the direction. */
    buttons?: boolean
}

/**
 * When autoplay holds still. All default to true. Turning off `hover` or `focus` is not
 * recommended: a carousel that keeps moving is hard to use with a mouse, a switch or a keyboard.
 */
export type PauseOptions = {
    hover?: boolean     // while the pointer is over the carousel
    focus?: boolean     // once something inside has keyboard focus, until the user presses play
    offScreen?: boolean // while the carousel is scrolled out of view
}

type AutoPlayBase = {
    /** Where it heads first. Default: 'forward'. */
    direction?: Direction
    steer?: SteerOptions
    pauseOn?: PauseOptions
}

/** Glide only: how the speed changes. Durations default to 0, except `reverse` (200). */
export type GlideEase = {
    pause?: Ease   // slowing to a stop, and picking up again
    release?: Ease // after letting go of a drag. Defaults to `pause`.
    reverse?: Ease // turning round
}

export type StepAutoPlay = AutoPlayBase & {
    interval?: number // ms between moves (default 5000)
    speed?: never
    ease?: never
}

export type GlideAutoPlay = AutoPlayBase & {
    speed: number // slides per second
    interval?: never
    ease?: GlideEase
}

export type AutoPlayOptions = StepAutoPlay | GlideAutoPlay

// ---------------------------------------------------------------------------------------------
// Text and readouts
// ---------------------------------------------------------------------------------------------

/** Every string a screen reader hears from the carousel. Replace any of them to translate. */
export type CarouselLabels = typeof defaultLabels

/**
 * One reading of the motion, taken on every frame while the carousel moves.
 * Positive means forward. Velocity is in slides per second.
 */
export type MotionFrame = {
    position: number      // drawn position in slides, fractional
    velocity: number      // smoothed
    direction: -1 | 0 | 1 // 0 while standing still
}

// ---------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------

/** The carousel needs a name for screen readers: give one of these. */
export type NameProps = { 'aria-label': string } | { 'aria-labelledby': string }

export type SharedProps = {
    gap?: number            // px between slides (default 0)
    duration?: number       // ms Prev and Next take to settle (default 300)
    reducedMotion?: boolean // omit to follow the system setting
    drag?: boolean | DragOptions
    labels?: Partial<CarouselLabels>

    onSlideChange?: (index: number) => void       // the first visible slide changed (0-based)
    onPlayingChange?: (playing: boolean) => void  // the user paused or resumed autoplay
    onDragChange?: (dragging: boolean) => void    // a drag started or ended

    /** Write --carousel-position and --carousel-velocity on the carousel while it moves. Default: false. */
    cssVariables?: boolean
}

/** Autoplay needs `type="infinite"`: a carousel with ends has nowhere to keep going. */
export type ModeProps =
    | { type?: 'default'; autoPlay?: never }
    | { type: 'infinite'; autoPlay?: boolean | AutoPlayOptions }

export type CarouselProps = Omit<React.ComponentPropsWithoutRef<'section'>, 'aria-label' | 'aria-labelledby'> &
    NameProps &
    SharedProps &
    ModeProps

export type ButtonProps = React.ComponentPropsWithoutRef<'button'>
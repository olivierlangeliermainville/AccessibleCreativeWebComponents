// The package entry point. Import from the folder or from './Carousel': both give the same thing.
export {
    Carousel,
    CarouselTrack,
    CarouselSlide,
    CarouselPrev,
    CarouselNext,
    CarouselPlayPause,
    CarouselDots,
} from './Carousel'

// Hooks for building your own controls and effects
export { useCarouselState, useCarouselFrame } from './public'

// The public types. Internals (./internal) are deliberately left out.
export type {
    CarouselProps,
    CarouselLabels,
    CarouselType,
    Direction,
    Easing,
    Ease,
    DragOptions,
    MomentumOptions,
    AutoPlayOptions,
    StepAutoPlay,
    GlideAutoPlay,
    GlideEase,
    SteerOptions,
    DotsProps,
    PauseOptions,
    MotionFrame,
} from './types'
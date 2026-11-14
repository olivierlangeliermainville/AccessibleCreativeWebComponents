import CarouselRoot, {
    CarouselTrack,
    CarouselSlide,
    CarouselPrev,
    CarouselNext,
    CarouselPlayPause,
} from './Carousel'

export const Carousel = Object.assign(CarouselRoot, {
    Track: CarouselTrack,
    Slide: CarouselSlide,
    Prev: CarouselPrev,
    Next: CarouselNext,
    PlayPause: CarouselPlayPause,
})

export { CarouselTrack, CarouselSlide, CarouselPrev, CarouselNext, CarouselPlayPause }
export { useCarouselState, useCarouselFrame } from './public'
export type { CarouselProps, MotionFrame } from './types'
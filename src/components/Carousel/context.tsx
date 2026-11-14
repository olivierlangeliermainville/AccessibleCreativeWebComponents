import { createContext, useContext } from 'react'
import type { CarouselContextValue } from './types'

export const CarouselContext = createContext<CarouselContextValue | null>(null)

export function useCarousel() {
    const context = useContext(CarouselContext)
    if (!context) throw new Error('Carousel parts must be used inside <Carousel>')
    return context
}

export const SlideContext = createContext({
    ringIndex: 0,   // position in the ring (real slides + copies)
    ringSize: 0,    // number of slides in the ring
    slideIndex: 0,  // index among your real slides
    slideCount: 0,  // number of real slides
    isClone: false,
})
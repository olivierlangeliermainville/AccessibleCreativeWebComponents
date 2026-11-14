"use client"
import { useContext, useLayoutEffect, useRef } from 'react'
import { mod } from './helpers'
import { useCarousel, SlideContext } from './context'

export function CarouselSlide({ children, style, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const { settledPosition, visibleCount, gap, type, labels, registerSlide } = useCarousel()
    const { ringIndex, ringSize, slideIndex, slideCount, isClone } = useContext(SlideContext)
    const slideRef = useRef<HTMLDivElement | null>(null)
    const wasNearRef = useRef(true) // was it near the screen when it was last drawn?

    // Offsets run over [-1, ringSize - 2]: one slide waits on the left, the rest line up on the right.
    // A slide leaving that window reappears at the other end, off-screen, so the wrap is invisible.
    const isLooping = type === 'infinite' && slideCount > 1 && ringSize > 0
    const wrapOffset = (offset: number) => (isLooping ? mod(offset + 1, ringSize) - 1 : offset)

    // 100% is the slide's own width, so one step = width + gap. This stays exact for fractional
    // widths, where pixel steps from offsetWidth (which rounds) would drift along a long ring.
    const toTransform = (offset: number) => `translateX(calc(${offset} * (100% + ${gap}px)))`

    const restOffset = wrapOffset(ringIndex - settledPosition)

    // The draw function is registered once, so it reads the latest values from here
    const latestRef = useRef({ wrapOffset, toTransform, ringIndex, visibleCount })
    useLayoutEffect(() => {
        latestRef.current = { wrapOffset, toTransform, ringIndex, visibleCount }
    })
    useLayoutEffect(
        () =>
            registerSlide((drawnPosition, force) => {
                const element = slideRef.current
                if (!element) return
                const { wrapOffset, toTransform, ringIndex, visibleCount } = latestRef.current
                const offset = wrapOffset(ringIndex - drawnPosition)

                // "Near" is the screen plus a slide or two on each side. A slide that is far now and was
                // far when last drawn can't be seen at either spot, so skip it. It is drawn once on the
                // way out and again as soon as it comes back near.
                const near = offset > -2 && offset < visibleCount + 1
                if (!near && !wasNearRef.current && !force) return
                wasNearRef.current = near

                element.style.transform = toTransform(offset)
                // Only near slides get a compositor layer, promoted just before they scroll in
                element.style.willChange = near ? 'transform' : 'auto'
            }),
        [registerSlide]
    )

    // Only on-screen slides are exposed to screen readers and the keyboard. This uses the settled
    // position so nothing flickers mid-animation. A copy is exposed only when the visible window
    // lands on it, so each real slide is exposed at most once.
    const isVisible = restOffset >= 0 && restOffset < visibleCount && (!isClone || slideCount >= visibleCount)

    return (
        <div
            // `inert` is set as a property: React 18 ignores the attribute, React 19 treats it as boolean
            ref={(element) => {
                slideRef.current = element
                if (element) element.inert = !isVisible
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={slideCount > 0 ? labels.slide(slideIndex + 1, slideCount) : undefined}
            aria-hidden={isVisible ? undefined : true}
            data-active={isVisible ? '' : undefined}
            data-carousel-clone={isClone ? '' : undefined}
            {...props}
            data-carousel-slide=""
            style={{
                gridArea: '1 / 1',
                justifySelf: 'start', // keep the slide's own width instead of stretching
                // Resting position, which is what the server renders. While moving, paint() overwrites
                // it before the browser draws.
                transform: toTransform(restOffset),
                ...style,
            }}
        >
            {children}
        </div>
    )
}
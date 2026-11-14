"use client"
import { Children, isValidElement, useLayoutEffect, useRef } from 'react'
import { mod } from './helpers'
import { useCarousel, SlideContext } from './context'

export function CarouselTrack({ children, style, ...props }: React.ComponentPropsWithoutRef<'div'>) {
    const {
        setSlideCount,
        setVisibleCount,
        gap,
        type,
        settledPosition,
        visibleCount,
        draggable,
        dragging,
        startDrag,
        moveDrag,
        releaseDrag,
    } = useCarousel()
    const trackRef = useRef<HTMLDivElement>(null)
    const pointerStartXRef = useRef<number | null>(null) // null when no pointer is down
    const dragOriginXRef = useRef(0)       // where the drag really began (after the 5px threshold)
    const stepPxRef = useRef(1)            // slide width + gap in px, measured on pointer down
    const dragStartedRef = useRef(false)
    const justDraggedRef = useRef(false)   // swallows the click that follows a drag
    const samplesRef = useRef<{ x: number; t: number }[]>([])

    // --- Ring of slides -------------------------------------------------------------

    const slideElements = Children.toArray(children).filter(isValidElement)
    const slideCount = slideElements.length
    const infinite = type === 'infinite' && slideCount > 1

    // Repeat the slides to fill the track plus a spare on each side. The +3 stops a wrapping
    // slide from popping in at a partly visible edge.
    const copyCount = infinite ? Math.ceil((visibleCount + 3) / slideCount) : 1
    const ring = Array.from({ length: slideCount * copyCount }, (_, ringIndex) => ({
        slide: slideElements[ringIndex % slideCount],
        ringIndex,
        slideIndex: ringIndex % slideCount,
        isClone: ringIndex >= slideCount,
    }))

    // Screen readers and Tab follow DOM order, not drawn order, so the visible slides must be
    // consecutive in the DOM. The DOM list starts at a "seam" that moves in blocks, so the visible
    // run never wraps past its end. A block is at least 4 (the ring has at least visibleCount + 3
    // slides), so the list is reordered only occasionally.
    const ringSize = ring.length
    const blockSize = ringSize - visibleCount + 1
    const seam = infinite ? mod(Math.floor(settledPosition / blockSize) * blockSize, ringSize) : 0
    const domOrder = [...ring.slice(seam), ...ring.slice(0, seam)]

    useLayoutEffect(() => {
        setSlideCount(slideCount)
    }, [slideCount, setSlideCount])

    // --- Measure how many whole slides fit ------------------------------------------

    useLayoutEffect(() => {
        const track = trackRef.current
        if (!track) return

        const measure = () => {
            const slide = track.querySelector<HTMLElement>('[data-carousel-slide]')
            if (!slide) return
            // offsetWidth ignores transforms, so it is the slide's real width
            const fitCount = Math.floor((track.clientWidth + gap) / (slide.offsetWidth + gap))
            setVisibleCount(Math.max(1, fitCount))
        }

        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(track)
        const firstSlide = track.querySelector('[data-carousel-slide]')
        if (firstSlide) observer.observe(firstSlide)
        return () => observer.disconnect()
    }, [gap, slideCount, setVisibleCount])

    // --- Drag and swipe -------------------------------------------------------------

    // Pointer speed over the last ~100 ms, in px per ms (negative = moving left)
    const getPointerVelocity = (releaseTime: number) => {
        const samples = samplesRef.current
        if (samples.length < 2) return 0
        const firstSample = samples[0]
        const lastSample = samples[samples.length - 1]

        // The pointer stopped before lifting: no flick
        if (releaseTime - lastSample.t > 50) return 0

        const elapsedMs = lastSample.t - firstSample.t
        return elapsedMs > 0 ? (lastSample.x - firstSample.x) / elapsedMs : 0
    }

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        const slide = trackRef.current?.querySelector<HTMLElement>('[data-carousel-slide]')
        stepPxRef.current = slide ? slide.offsetWidth + gap : 1
        pointerStartXRef.current = event.clientX
        dragOriginXRef.current = event.clientX
        samplesRef.current = [{ x: event.clientX, t: event.timeStamp }]
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (pointerStartXRef.current === null) return

        samplesRef.current.push({ x: event.clientX, t: event.timeStamp })
        while (samplesRef.current.length > 2 && event.timeStamp - samplesRef.current[0].t > 100) {
            samplesRef.current.shift()
        }

        if (!dragStartedRef.current) {
            if (Math.abs(event.clientX - pointerStartXRef.current) < 5) return // so clicks still work
            dragStartedRef.current = true
            dragOriginXRef.current = event.clientX // measure from here, so the slides don't jump
            event.currentTarget.setPointerCapture(event.pointerId)
            startDrag()
        }

        moveDrag((event.clientX - dragOriginXRef.current) / stepPxRef.current)
    }

    const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (pointerStartXRef.current === null) return
        const wasDragging = dragStartedRef.current
        pointerStartXRef.current = null
        dragStartedRef.current = false
        if (!wasDragging) return

        justDraggedRef.current = true
        setTimeout(() => {
            justDraggedRef.current = false
        }, 0)

        // px per ms → slides per second, with forward (dragging left) positive
        releaseDrag((-getPointerVelocity(event.timeStamp) * 1000) / stepPxRef.current)
    }

    const dragProps = draggable
        ? {
              onPointerDown,
              onPointerMove,
              onPointerUp: onPointerEnd,
              onPointerCancel: onPointerEnd,
              onClickCapture: (event: React.MouseEvent) => {
                  if (justDraggedRef.current) {
                      event.preventDefault()
                      event.stopPropagation()
                  }
              },
          }
        : {}

    return (
        // overflow hidden clips off-screen slides; the grid keeps the height of the tallest slide
        <div
            {...props}
            ref={trackRef}
            data-dragging={dragging ? '' : undefined}
            {...dragProps}
            style={{
                display: 'grid',
                overflow: 'hidden',
                touchAction: 'pan-y', // vertical page scrolling still works on touch
                ...style,
            }}
        >
            {domOrder.map(({ slide, ringIndex, slideIndex, isClone }) => (
                <SlideContext.Provider
                    key={`${slide.key ?? slideIndex}-${isClone ? ringIndex : 'real'}`}
                    value={{ ringIndex, ringSize, slideIndex, slideCount, isClone }}
                >
                    {slide}
                </SlideContext.Provider>
            ))}
        </div>
    )
}
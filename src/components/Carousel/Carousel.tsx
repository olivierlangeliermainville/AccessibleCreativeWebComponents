"use client"
import { useRef, useState } from 'react'
import type { CarouselProps, Direction } from './types'
import { toDirection, toSign, type Sign } from './internal'
import { defaultLabels } from './defaults'
import { visuallyHidden, useSystemReducedMotion, mod } from './helpers'
import { resolveAutoPlay, resolveDrag } from './options'
import { CarouselContext } from './context'
import { useMotion } from './hooks/useMotion'
import { useAutoPlay } from './hooks/useAutoPlay'
import { useDrag } from './hooks/useDrag'
import { useOnScreen } from './hooks/useOnScreen'
import { useOnChange } from './hooks/useOnChange'
import { useMotionReadout } from './hooks/useMotionReadout'
import { useScrollSteer } from './hooks/useScrollSteer'

import { CarouselTrack } from './CarouselTrack'
import { CarouselSlide } from './CarouselSlide'
import { CarouselPrev, CarouselNext, CarouselPlayPause } from './CarouselControls'
import { CarouselDots } from './CarouselDots'

export function Carousel({
    children,
    type = 'default',
    gap = 0,
    duration = 300,
    reducedMotion,
    drag = false,
    autoPlay = false,
    labels: labelOverrides,
    onSlideChange,
    onPlayingChange,
    onDragChange,
    cssVariables = false,
    ...props
}: CarouselProps) {
    // --- Options --------------------------------------------------------------------

    const dragSettings = resolveDrag(drag, duration)
    const autoPlaySettings = resolveAutoPlay(autoPlay)
    const { steer, pauseOn } = autoPlaySettings
    const labels = { ...defaultLabels, ...labelOverrides }

    // --- State ----------------------------------------------------------------------

    // State holds what changes rarely and what React renders from. The drawn position changes
    // every frame, so it lives in a ref inside useMotion and is written to the DOM by paint().
    const [settled, setSettled] = useState(0)           // slide we are on or heading to
    const [slideCount, setSlideCount] = useState(0)
    const [visibleCount, setVisibleCount] = useState(1) // whole slides that fit in the track
    const [dragging, setDragging] = useState(false)
    const [hasMoved, setHasMoved] = useState(false)     // false until the first move: nothing is announced on load
    const [playing, setPlaying] = useState(true)        // the user's choice: play/pause button or keyboard focus
    const [hovered, setHovered] = useState(false)       // temporary pause while the mouse is over the carousel
    // Where autoplay is heading. One value: it starts as the option, and whichever of scroll, drag or
    // buttons acts last changes it.
    const [direction, setDirection] = useState<Direction>(autoPlaySettings.direction)

    const systemReduced = useSystemReducedMotion()
    const reduced = reducedMotion ?? systemReduced
    const carouselRef = useRef<HTMLElement>(null)

    const infinite = type === 'infinite' && slideCount > 1
    // Infinite mode can always move; default mode only when the slides overflow
    const scrollable = infinite || slideCount > visibleCount
    const maxPosition = Math.max(0, slideCount - visibleCount)

    // Default mode stops at the last slide; a resize can't leave us past it
    const settledPosition = infinite ? settled : Math.min(settled, maxPosition)
    const activeIndex = slideCount > 0 ? mod(settledPosition, slideCount) : 0
    const canPrev = scrollable && (infinite || settledPosition > 0)
    const canNext = scrollable && (infinite || settledPosition < maxPosition)

    // --- Motion ---------------------------------------------------------------------

    const { onFrame, subscribeFrame } = useMotionReadout(carouselRef, cssVariables)
    const motion = useMotion({ infinite, maxPosition, duration, reduced, setSettled, setHasMoved, onFrame })

    // --- Autoplay -------------------------------------------------------------------

    const onScreen = useOnScreen(carouselRef, pauseOn.offScreen && autoPlaySettings.enabled)

    // autoPlayOn:  autoplay is on and allowed to move
    // canRun:      ...and nobody is dragging (a drag takes over instantly)
    // autoPlaying: ...and the user hasn't paused it (button or keyboard focus)
    // running:     ...and not held by hover or by being scrolled out of view (glide mode eases into these)
    const autoPlayOn = autoPlaySettings.enabled && infinite && !reduced
    const canRun = autoPlayOn && !dragging
    const autoPlaying = canRun && playing
    const running = autoPlaying && !hovered && onScreen

    useScrollSteer(autoPlayOn && steer.scroll, steer.scrollInverse, setDirection)

    const { glideVelocityRef, afterReleaseRef } = useAutoPlay({
        motion,
        settings: autoPlaySettings,
        running,
        canRun,
        direction: toSign(direction),
        settled,
        setSettled,
    })

    // --- Drag -----------------------------------------------------------------------

    const { startDrag, moveDrag, releaseDrag } = useDrag({
        motion,
        settings: dragSettings,
        infinite,
        maxPosition,
        setDragging,
        onTurn: autoPlayOn && steer.drag ? setDirection : undefined,
        glide: {
            handoff: !!autoPlaySettings.speed && autoPlayOn && playing,
            velocityRef: glideVelocityRef,
            afterReleaseRef,
            setHovered,
        },
    })

    // --- What the parts and the public hooks can do ----------------------------------

    // What Prev and Next do. Steering is part of it, so a press turns autoplay if that is switched on.
    const step = (sign: Sign) => {
        if (sign === 1 ? !canNext : !canPrev) return
        motion.goBy(sign)
        if (autoPlayOn && steer.buttons) setDirection(toDirection(sign))
    }

    const goTo = (index: number) => {
        // In infinite mode, take the shorter way round
        const steps = infinite
            ? mod(index - activeIndex + slideCount / 2, slideCount) - slideCount / 2
            : index - settledPosition
        if (steps !== 0) motion.goBy(steps)
    }

    // --- What the carousel tells its users --------------------------------------------

    useOnChange(activeIndex, onSlideChange)
    useOnChange(playing, onPlayingChange)
    useOnChange(dragging, onDragChange)

    // Announced after Prev/Next or a drag, because focus stays on the button. It reads the settled
    // position, so it speaks once per move. Silent while autoplay is on, including while hover or
    // scrolling out of view holds it, or it would announce a slide every time the carousel scrolled away.
    const firstShown = activeIndex + 1
    const lastShown =
        visibleCount >= slideCount ? firstShown : mod(settledPosition + visibleCount - 1, slideCount) + 1
    const status = hasMoved && !dragging && !autoPlaying ? labels.status(firstShown, lastShown, slideCount) : ''

    return (
        <CarouselContext.Provider
            value={{
                type,
                gap,
                labels,
                slideCount,
                visibleCount,
                settledPosition,
                activeIndex,
                direction,
                playing,
                dragging,
                draggable: dragSettings.draggable && scrollable,
                autoPlayable: autoPlaySettings.enabled,
                canPrev,
                canNext,
                step,
                goTo,
                setPlaying,
                startDrag,
                moveDrag,
                releaseDrag,
                registerSlide: motion.registerSlide,
                subscribeFrame,
                setSlideCount,
                setVisibleCount,
            }}
        >
            <section
                ref={carouselRef}
                aria-roledescription="carousel"
                {...props}
                // These wrap your own handlers instead of replacing them
                onPointerEnter={(event) => {
                    props.onPointerEnter?.(event)
                    // Mouse only: touch has no "leave", so it would stay paused
                    if (pauseOn.hover && event.pointerType === 'mouse') setHovered(true)
                }}
                onPointerLeave={(event) => {
                    props.onPointerLeave?.(event)
                    setHovered(false)
                }}
                onFocus={(event) => {
                    props.onFocus?.(event)
                    // Keyboard focus pauses until the user presses play. Not for mouse clicks,
                    // or clicking the pause button would un-pause itself.
                    if (pauseOn.focus && event.target.matches(':focus-visible')) setPlaying(false)
                }}
            >
                {children}
                <div role="status" aria-atomic="true" style={visuallyHidden}>
                    {status}
                </div>
            </section>
        </CarouselContext.Provider>
    )
}

// The parts hang off the component, so <Carousel.Track> and friends work. They are attached here, next
// to the root, so nothing depends on the folder's index having run first. This file exports only
// components, which is what Fast Refresh needs: the hooks are in ./public, and the index has the lot.
Carousel.Track = CarouselTrack
Carousel.Slide = CarouselSlide
Carousel.Prev = CarouselPrev
Carousel.Next = CarouselNext
Carousel.PlayPause = CarouselPlayPause
Carousel.Dots = CarouselDots

export { CarouselTrack, CarouselSlide, CarouselPrev, CarouselNext, CarouselPlayPause, CarouselDots }
export default Carousel
"use client"
import { useRef, useState } from 'react'
import type { CarouselProps, Direction } from './types'
import { defaultLabels } from './defaults'
import { visuallyHidden, useSystemReducedMotion, mod } from './helpers'
import { resolveAutoPlayOptions, resolveDragOptions, resolveScrollOptions } from './options'
import { CarouselContext } from './context'
import { useMotion } from './hooks/useMotion'
import { useAutoPlay } from './hooks/useAutoPlay'
import { useDrag } from './hooks/useDrag'
import { useOnScreen } from './hooks/useOnScreen'
import { useOnChange } from './hooks/useOnChange'
import { useMotionReadout } from './hooks/useMotionReadout'
import { useScrollDirection } from '../Helpers/Scroll'

// The parts live in their own files. They are re-exported here so imports from './Carousel' still work.
export { CarouselTrack } from './CarouselTrack'
export { CarouselSlide } from './CarouselSlide'
export { CarouselPrev, CarouselNext, CarouselPlayPause } from './CarouselControls'

export default function Carousel({
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
    cssVariables = true,
    ...props
}: CarouselProps) {
    // --- Options --------------------------------------------------------------------

    const dragSettings = resolveDragOptions(drag, duration)
    const {
        dragDirectionChange,
        buttonDirectionChange,
        pauseOffScreen,
        interval,
        speed,
        scrollInfluence,
        playPauseEasingDuration,
        releaseEasingDuration,
        pauseOnHover,
        pauseOnFocus,
        playPauseButton,
        releaseEasing,
        playPauseEasing,
    } = resolveAutoPlayOptions(autoPlay)
    const { inverse, directionChangeDuration, directionChangeEasing } = resolveScrollOptions(scrollInfluence)
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
    const [manualDirection, setManualDirection] = useState<Direction>(null)
    const systemReduced = useSystemReducedMotion()
    const reduced = reducedMotion ?? systemReduced
    const carouselRef = useRef<HTMLElement>(null)

    const infinite = type === 'infinite' && slideCount > 1
    // Infinite mode can always move; default mode only when the slides overflow
    const scrollable = infinite || slideCount > visibleCount
    const maxPosition = Math.max(0, slideCount - visibleCount)

    // Default mode stops at the last slide; a resize can't leave us past it
    const settledPosition = infinite ? settled : Math.min(settled, maxPosition)

    // --- Motion ---------------------------------------------------------------------
    const { onFrame, subscribeFrame } = useMotionReadout(carouselRef, cssVariables)
    const motion = useMotion({ infinite, maxPosition, duration, reduced, setSettled, setHasMoved, onFrame })

    // --- Glide direction ------------------------------------------------------------

    // The glide goes the way the last scroll or drag decided. The hook listens to page scroll whether
    // or not scrollInfluence is on, so its value only counts when it is.
    const scrollValue = useScrollDirection(10, inverse)

    // A scroll flip hands control back to the scroll, so it clears the drag's direction.
    // State adjusted during render, the pattern React recommends over an effect for this.
    const [lastScroll, setLastScroll] = useState(scrollValue)
    if (scrollValue !== lastScroll) {
        setLastScroll(scrollValue)
        if (scrollInfluence) setManualDirection(null)
    }

    const glideDirection =
        manualDirection ?? (scrollInfluence ? scrollValue : null) ?? -1

    // --- Autoplay -------------------------------------------------------------------

    const onScreen = useOnScreen(carouselRef, pauseOffScreen && !!autoPlay)

    // autoPlayOn:  autoplay is on and allowed to move
    // canRun:      ...and nobody is dragging (a drag takes over instantly)
    // autoPlaying: ...and the user hasn't paused it (button or keyboard focus)
    // running:     ...and not held by hover or by being scrolled out of view (glide mode eases into these)
    const autoPlayOn = !!autoPlay && infinite && !reduced
    const canRun = autoPlayOn && !dragging
    const autoPlaying = canRun && playing
    const running = autoPlaying && !hovered && onScreen

    const { glideVelocityRef, afterReleaseRef } = useAutoPlay({
        motion,
        running,
        canRun,
        speed,
        interval,
        settled,
        setSettled,
        glideDirection,
        playPauseEasingDuration,
        releaseEasingDuration,
        directionChangeDuration,
        easings: { playPause: playPauseEasing, release: releaseEasing, directionChange: directionChangeEasing },
    })

    // --- Drag -----------------------------------------------------------------------

    const { startDrag, moveDrag, releaseDrag } = useDrag({
        motion,
        settings: dragSettings,
        infinite,
        maxPosition,
        setDragging,
        setManualDirection,
        glide: {
            handoff: !!speed && autoPlayOn && playing,
            velocityRef: glideVelocityRef,
            afterReleaseRef,
            dragDirectionChange,
            setHovered,
        },
    })

    // --- Announcements --------------------------------------------------------------

    // Announced after Prev/Next or a drag, because focus stays on the button. It reads the settled
    // position, so it speaks once per move. Silent while autoplay is on, including while hover or
    // scrolling out of view holds it, or it would announce a slide every time the carousel scrolled away.
    const firstShown = (slideCount > 0 ? mod(settledPosition, slideCount) : 0) + 1
    const lastShown =
        visibleCount >= slideCount ? firstShown : mod(settledPosition + visibleCount - 1, slideCount) + 1
    const status = hasMoved && !dragging && !autoPlaying ? labels.status(firstShown, lastShown, slideCount) : ''

    // Callbacks
    const activeIndex = slideCount > 0 ? mod(settledPosition, slideCount) : 0
    useOnChange(activeIndex, onSlideChange)
    useOnChange(playing, onPlayingChange)
    useOnChange(dragging, onDragChange)

    const goTo = (index: number) => {
    const steps = infinite
        ? mod(index - activeIndex + slideCount / 2, slideCount) - slideCount / 2 // the shorter way round
        : index - settledPosition
    if (steps !== 0) motion.goBy(steps)
}

    return (
        <CarouselContext.Provider
            value={{
                activeIndex,
                slideCount,
                goTo,
                subscribeFrame,
                settledPosition,
                registerSlide: motion.registerSlide,
                glideDirection,
                visibleCount,
                gap,
                type,
                labels,
                canPrev: scrollable && (infinite || settledPosition > 0),
                canNext: scrollable && (infinite || settledPosition < maxPosition),
                draggable: dragSettings.draggable && scrollable,
                dragging,
                autoPlayable: !!autoPlay,
                playing,
                playPauseButton,
                buttonDirectionChange,
                setManualDirection,
                setPlaying,
                setSlideCount,
                setVisibleCount,
                goBy: motion.goBy,
                startDrag,
                moveDrag,
                releaseDrag,
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
                    if (pauseOnHover && event.pointerType === 'mouse') setHovered(true)
                }}
                onPointerLeave={(event) => {
                    props.onPointerLeave?.(event)
                    setHovered(false)
                }}
                onFocus={(event) => {
                    props.onFocus?.(event)
                    // Keyboard focus pauses until the user presses play. Not for mouse clicks,
                    // or clicking the pause button would un-pause itself.
                    if (pauseOnFocus && event.target.matches(':focus-visible')) setPlaying(false)
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
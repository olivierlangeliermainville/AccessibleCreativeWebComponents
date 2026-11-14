import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { SETTLE } from '../defaults'
import { clamp } from '../helpers'
import type { resolveDragOptions } from '../options'
import type { Motion } from './useMotion'
import { type Direction } from '../types'

type Ref<T> = { current: T }

type DragOptions = {
    motion: Motion
    settings: ReturnType<typeof resolveDragOptions>
    infinite: boolean
    maxPosition: number
    setManualDirection: Dispatch<SetStateAction<Direction>>
    setDragging: (dragging: boolean) => void
    // What a release hands to a running glide instead of snapping to a slide
    glide: {
        handoff: boolean // autoplay is gliding and not paused by the user
        velocityRef: Ref<number>
        afterReleaseRef: Ref<boolean>
        dragDirectionChange: boolean
        setHovered: (hovered: boolean) => void
    }
}

export function useDrag({ motion, settings, infinite, maxPosition, setDragging, glide, setManualDirection }: DragOptions) {
    const { drawnRef, springVelocityRef, stopSpring, animateTo, paint } = motion
    const { momentum, reach, maxSlides, friction, releaseDuration, minDuration, maxDuration } = settings
    // Destructured so the refs are written to directly: the compiler rejects writing through a hook argument
    const {
        handoff,
        velocityRef: glideVelocityRef,
        afterReleaseRef,
        dragDirectionChange,
        setHovered,
    } = glide
    const dragStartRef = useRef(0) // drawn position when the drag began
    const dragFrameRef = useRef<number | null>(null)

    useEffect(
        () => () => {
            if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current)
        },
        []
    )

    const startDrag = () => {
        stopSpring() // grab the carousel, even mid-flight
        dragStartRef.current = drawnRef.current
        springVelocityRef.current = 0
        setDragging(true)
    }

    const moveDrag = (slides: number) => {
        const next = dragStartRef.current - slides
        drawnRef.current = infinite ? next : clamp(next, 0, maxPosition)
        // At most one paint per frame, however fast the pointer reports
        if (dragFrameRef.current === null) {
            dragFrameRef.current = requestAnimationFrame(() => {
                dragFrameRef.current = null
                paint()
            })
        }
    }

    const releaseDrag = (velocity: number) => {
        setDragging(false)
        if (dragFrameRef.current !== null) {
            cancelAnimationFrame(dragFrameRef.current)
            dragFrameRef.current = null
        }

        const releaseVelocity = momentum ? velocity : 0

        // Glide mode aims for `speed` instead of snapping to a slide: carry the release velocity into
        // the glide, and clear the hover pause (the mouse is still over the carousel). Only the
        // button or keyboard focus keeps it paused.
        if (handoff) {
            if (dragDirectionChange) {
                // The way the user pushed: the release velocity, or how far they dragged if there is none
                const pushed = releaseVelocity !== 0 ? releaseVelocity : drawnRef.current - dragStartRef.current
                if (Math.abs(pushed) > 0.05) setManualDirection(pushed > 0 ? 1 : -1) // ignore tiny nudges
            }
            glideVelocityRef.current = releaseVelocity
            afterReleaseRef.current = true
            setHovered(false)
            return
        }

        const startSlide = Math.round(dragStartRef.current)
        const draggedSlides = drawnRef.current - dragStartRef.current
        const flickSlides = clamp(releaseVelocity * reach, -maxSlides, maxSlides)

        let target = Math.round(drawnRef.current + flickSlides)

        // Ending on the starting slide still moves one if there was a clear flick or a drag past 20%.
        // A flick wins over the drag direction.
        if (target === startSlide) {
            if (Math.abs(flickSlides) > 0.1) target = startSlide + Math.sign(flickSlides)
            else if (Math.abs(draggedSlides) > 0.2) target = startSlide + Math.sign(draggedSlides)
        }
        if (!infinite) target = clamp(target, 0, maxPosition)

        // A flick sets its own duration: the spring settles at the speed it was thrown
        const distance = Math.abs(target - drawnRef.current)
        const flickSpeed = Math.abs(releaseVelocity)
        const movingToward = Math.sign(target - drawnRef.current) === Math.sign(releaseVelocity)

        let ms = releaseDuration
        if (momentum && movingToward && flickSpeed > 0.5 && distance > 0) {
            const flickMs = (SETTLE * distance * 1000) / flickSpeed / Math.max(friction, 0.01)
            ms = clamp(flickMs, minDuration, maxDuration)
        }

        animateTo(target, releaseVelocity, ms)
    }

    return { startDrag, moveDrag, releaseDrag }
}
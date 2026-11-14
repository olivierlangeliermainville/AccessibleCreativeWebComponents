import { useEffect, useRef } from 'react'
import { SETTLE } from '../defaults'
import { clamp } from '../helpers'
import type { ResolvedDrag } from '../options'
import type { Direction } from '../types'
import type { Motion } from './useMotion'

type Ref<T> = { current: T }

// A release faster than this (slides per second) is a glitch in the pointer timestamps, not a flick
const MAX_RELEASE_SPEED = 30

type DragArgs = {
    motion: Motion
    settings: ResolvedDrag
    infinite: boolean
    maxPosition: number
    setDragging: (dragging: boolean) => void
    // Given when letting go should steer autoplay: told which way the user pushed
    onTurn?: (direction: Direction) => void
    // What a release hands to a running glide instead of snapping to a slide
    glide: {
        handoff: boolean // autoplay is gliding and not paused by the user
        velocityRef: Ref<number>
        afterReleaseRef: Ref<boolean>
        setHovered: (hovered: boolean) => void
    }
}

export function useDrag({ motion, settings, infinite, maxPosition, setDragging, onTurn, glide }: DragArgs) {
    const { drawnRef, springVelocityRef, stopSpring, animateTo, paint } = motion
    const { momentum, reach, maxSlides, friction, settle, minDuration, maxDuration } = settings
    // Destructured so the refs are written to directly: the compiler rejects writing through a hook argument
    const { handoff, velocityRef: glideVelocityRef, afterReleaseRef, setHovered } = glide
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

        const releaseVelocity = momentum ? clamp(velocity, -MAX_RELEASE_SPEED, MAX_RELEASE_SPEED) : 0
        const draggedSlides = drawnRef.current - dragStartRef.current

        // The way the user pushed: the release velocity, or how far they dragged if there is none.
        // Tiny nudges don't count.
        const pushed = releaseVelocity !== 0 ? releaseVelocity : draggedSlides
        if (onTurn && Math.abs(pushed) > 0.05) onTurn(pushed > 0 ? 'forward' : 'backward')

        // Glide mode aims for `speed` instead of snapping to a slide: carry the release velocity into
        // the glide, and clear the hover pause (the mouse is still over the carousel). Only the
        // button or keyboard focus keeps it paused.
        if (handoff) {
            glideVelocityRef.current = releaseVelocity
            afterReleaseRef.current = true
            setHovered(false)
            return
        }

        const startSlide = Math.round(dragStartRef.current)
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

        let ms = settle
        if (momentum && movingToward && flickSpeed > 0.5 && distance > 0) {
            const flickMs = (SETTLE * distance * 1000) / flickSpeed / friction
            ms = clamp(flickMs, minDuration, maxDuration)
        }

        animateTo(target, releaseVelocity, ms)
    }

    return { startDrag, moveDrag, releaseDrag }
}
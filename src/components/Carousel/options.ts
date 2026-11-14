import type { AutoPlayOptions, DragOptions, ScrollOptions } from './types'

// Default easing. It lives at module scope because the React Compiler can't handle arrow
// functions as destructuring defaults and would skip the whole component.
export const linear = (t: number) => t

export function resolveDragOptions(drag: boolean | DragOptions, duration: number) {
    const {
        momentum = false,
        reach = 0.25,
        maxSlides = 8,
        friction = 1,
        duration: releaseDuration = duration,
        minDuration = 0,
        maxDuration = 10000,
    }: DragOptions = typeof drag === 'object' ? drag : {}
    return {
        draggable: drag !== false,
        momentum,
        reach,
        maxSlides,
        friction,
        releaseDuration,
        minDuration,
        maxDuration,
    }
}

export function resolveAutoPlayOptions(autoPlay: boolean | AutoPlayOptions) {
    const {
        dragDirectionChange = false,
        buttonDirectionChange = false,
        pauseOffScreen = true,
        interval = 5000,
        speed,
        scrollInfluence = false,
        playPauseEasingDuration = 0,
        releaseEasingDuration = playPauseEasingDuration,
        pauseOnHover = true,
        pauseOnFocus = true,
        playPauseButton = true,
        releaseEasing = linear,
        playPauseEasing = linear,
    }: AutoPlayOptions = typeof autoPlay === 'object' ? autoPlay : {}
    return {
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
    }
}

export function resolveScrollOptions(scrollInfluence: boolean | ScrollOptions) {
    const {
        inverse = false,
        directionChangeDuration = 200,
        directionChangeEasing = linear,
    }: ScrollOptions = typeof scrollInfluence === 'object' ? scrollInfluence : {}
    return { inverse, directionChangeDuration, directionChangeEasing }
}
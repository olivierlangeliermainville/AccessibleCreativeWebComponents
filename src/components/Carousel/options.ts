import type { AutoPlayOptions, DragOptions, Easing } from './types'

// Every default lives here. The rest of the code receives options already filled in, so nothing
// else has to know what "not given" means.

export const linear: Easing = (t) => t

// ---------------------------------------------------------------------------------------------
// Drag
// ---------------------------------------------------------------------------------------------

export function resolveDrag(drag: boolean | DragOptions, duration: number) {
    const options: DragOptions = typeof drag === 'object' ? drag : {}
    const momentum = options.momentum
    const tuning = typeof momentum === 'object' ? momentum : {}
    return {
        draggable: drag !== false,
        momentum: !!momentum,
        reach: tuning.reach ?? 0.25,
        maxSlides: tuning.maxSlides ?? 8,
        friction: Math.max(tuning.friction ?? 1, 0.01),
        minDuration: tuning.minDuration ?? 0,
        maxDuration: tuning.maxDuration ?? 10000,
        settle: options.settle ?? duration,
    }
}
export type ResolvedDrag = ReturnType<typeof resolveDrag>

// ---------------------------------------------------------------------------------------------
// Autoplay
// ---------------------------------------------------------------------------------------------

type ResolvedEase = { duration: number; easing: Easing }

export function resolveAutoPlay(autoPlay: boolean | AutoPlayOptions) {
    const options: AutoPlayOptions = typeof autoPlay === 'object' ? autoPlay : {}
    const steer = options.steer ?? {}
    const scroll = steer.scroll
    const pauseOn = options.pauseOn ?? {}
    const ease = options.ease ?? {}

    const pause: ResolvedEase = {
        duration: ease.pause?.duration ?? 0,
        easing: ease.pause?.easing ?? linear,
    }
    return {
        enabled: !!autoPlay,
        speed: options.speed,                  // given: glide mode. Not given: step mode.
        interval: options.interval ?? 5000,
        direction: options.direction ?? 'forward',
        steer: {
            scroll: !!scroll,
            scrollInverse: typeof scroll === 'object' && !!scroll.inverse,
            drag: !!steer.drag,
            buttons: !!steer.buttons,
        },
        pauseOn: {
            hover: pauseOn.hover ?? true,
            focus: pauseOn.focus ?? true,
            offScreen: pauseOn.offScreen ?? true,
        },
        ease: {
            pause,
            // A release eases like a pause unless told otherwise
            release: {
                duration: ease.release?.duration ?? pause.duration,
                easing: ease.release?.easing ?? pause.easing,
            },
            reverse: {
                duration: ease.reverse?.duration ?? 200,
                easing: ease.reverse?.easing ?? linear,
            },
        },
    }
}
export type ResolvedAutoPlay = ReturnType<typeof resolveAutoPlay>
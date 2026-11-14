"use client"
import type { ButtonProps } from './types'
import type { Sign } from './internal'
import { useCarousel } from './context'

// aria-disabled, not disabled: a disabled button drops focus when it reaches an end
function CarouselButton({ sign, onClick, ...props }: ButtonProps & { sign: Sign }) {
    const { step, canPrev, canNext, labels } = useCarousel()
    const isEnabled = sign === 1 ? canNext : canPrev
    return (
        <button
            aria-label={sign === 1 ? labels.next : labels.prev}
            aria-disabled={isEnabled ? undefined : true}
            {...props}
            type="button"
            onClick={(event) => {
                if (!isEnabled) return
                onClick?.(event)
                step(sign)
            }}
        />
    )
}

export function CarouselPrev(props: ButtonProps) {
    return <CarouselButton sign={-1} {...props} />
}

export function CarouselNext(props: ButtonProps) {
    return <CarouselButton sign={1} {...props} />
}

// Place this first inside <Carousel> so it is first in the Tab order. It renders nothing when there
// is no autoplay, so you can leave it in. The label says what pressing it will do, so it needs no
// aria-pressed.
export function CarouselPlayPause({ onClick, ...props }: ButtonProps) {
    const { playing, setPlaying, autoPlayable, labels } = useCarousel()
    if (!autoPlayable) return null
    return (
        <button
            aria-label={playing ? labels.pause : labels.play}
            {...props}
            type="button"
            onClick={(event) => {
                onClick?.(event)
                setPlaying(!playing)
            }}
        />
    )
}
"use client"
import type { ButtonProps } from './types'
import { useCarousel } from './context'

// aria-disabled, not disabled: a disabled button drops focus when it reaches an end
function CarouselButton({ direction, onClick, ...props }: ButtonProps & { direction: 1 | -1 }) {
    const { goBy, canPrev, canNext, labels, buttonDirectionChange, setManualDirection , type } = useCarousel()
    const isEnabled = direction === 1 ? canNext : canPrev


    return (
        <button
            aria-label={direction === 1 ? labels.next : labels.prev}
            aria-disabled={isEnabled ? undefined : true}
            {...props}
            type="button"
            onClick={(event) => {
                if (!isEnabled) return
                onClick?.(event)
                goBy(direction)
                if(type=="infinite" && buttonDirectionChange){
                    setManualDirection(direction)
                }
            }}
        />
    )
}

export function CarouselPrev(props: ButtonProps) {
    return <CarouselButton direction={-1} {...props} />
}

export function CarouselNext(props: ButtonProps) {
    return <CarouselButton direction={1} {...props} />
}

// Place this first inside <Carousel> so it is first in the Tab order.
// The label says what pressing it will do, so it needs no aria-pressed.
export function CarouselPlayPause({ onClick, ...props }: ButtonProps) {
    const { playing, setPlaying, autoPlayable, labels, playPauseButton } = useCarousel()
    if (!autoPlayable || !playPauseButton) return null
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
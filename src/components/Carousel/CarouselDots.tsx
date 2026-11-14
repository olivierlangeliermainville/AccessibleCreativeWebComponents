"use client"
import type { DotsProps } from './types'
import { useCarousel } from './context'

// One button per place the carousel can go: pick one to go there. Style the row with `className`, the
// dots with `dotClassName`, and put something in each dot with a function as children.
export function CarouselDots({ dotClassName, children, ...props }: DotsProps) {
    const { activeIndex, slideCount, visibleCount, type, labels, goTo } = useCarousel()

    // A carousel with ends can only reach slideCount - visibleCount + 1 positions, so that many dots:
    // with 8 slides and 4 showing, the last three slides can't be a place to stop. One that loops can
    // stop on every slide.
    const count = type === 'infinite' ? slideCount : Math.max(1, slideCount - visibleCount + 1)
    if (count <= 1) return null // nothing to choose between

    return (
        <div role="group" aria-label={labels.dots} {...props}>
            {Array.from({ length: count }, (_, index) => {
                const active = index === activeIndex
                return (
                    <button
                        key={index}
                        type="button"
                        className={dotClassName}
                        aria-label={labels.goTo(index + 1)}
                        aria-current={active ? 'true' : undefined}
                        onClick={() => goTo(index)}
                    >
                        {children?.({ index, active, count })}
                    </button>
                )
            })}
        </div>
    )
}
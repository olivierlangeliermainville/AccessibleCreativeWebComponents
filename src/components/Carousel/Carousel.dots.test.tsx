import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { Carousel } from './index'

// jsdom has no layout, so give every element a size: the track is 300px wide and each slide is
// 100px wide, which means 3 slides fit at once.
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 100 })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 300 })
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
})

beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
        addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(), onchange: null,
    })) as unknown as typeof window.matchMedia
})

function setup({ slides = 6, dots = {}, ...props }: Record<string, unknown> & { slides?: number; dots?: Record<string, unknown> } = {}) {
    return render(
        <Carousel aria-label="Test" reducedMotion {...(props as object)}>
            <Carousel.Track>
                {Array.from({ length: slides }, (_, i) => (
                    <Carousel.Slide key={i}>Slide {i + 1}</Carousel.Slide>
                ))}
            </Carousel.Track>
            <Carousel.Next>Next</Carousel.Next>
            <Carousel.Dots {...dots} />
        </Carousel>
    )
}
const dots = () => screen.getAllByRole('button', { name: /^Go to slide/ })
const current = () => dots().findIndex((dot) => dot.getAttribute('aria-current') === 'true')
const next = () => screen.getByRole('button', { name: 'Next slide' })

describe('Carousel.Dots', () => {
    it('is a labelled group of buttons', () => {
        setup({ type: 'infinite' })
        expect(screen.getByRole('group', { name: 'Choose slide' })).toBeInTheDocument()
        dots().forEach((dot) => expect(dot).toHaveAttribute('type', 'button'))
    })

    it('has a dot for every slide in infinite mode', () => {
        setup({ type: 'infinite', slides: 6 })
        expect(dots()).toHaveLength(6)
        expect(dots().map((d) => d.getAttribute('aria-label'))).toEqual([1, 2, 3, 4, 5, 6].map((n) => `Go to slide ${n}`))
    })

    it('has a dot for each place it can stop in default mode', () => {
        // 6 slides with 3 showing: it can stop at slide 1, 2, 3 or 4
        setup({ slides: 6 })
        expect(dots()).toHaveLength(4)
    })

    it('draws nothing when there is nothing to choose between', () => {
        setup({ slides: 3 }) // all three already fit
        expect(screen.queryByRole('group', { name: 'Choose slide' })).toBeNull()
    })

    it('marks the current dot, and moves the mark', () => {
        setup({ type: 'infinite' })
        expect(current()).toBe(0)
        expect(dots().filter((d) => d.hasAttribute('aria-current'))).toHaveLength(1)
        fireEvent.click(next())
        expect(current()).toBe(1)
    })

    it('goes to a slide when its dot is clicked', () => {
        setup({ type: 'infinite' })
        fireEvent.click(dots()[3])
        expect(current()).toBe(3)
    })

    it('takes the short way round in infinite mode', () => {
        const onSlideChange = vi.fn()
        setup({ type: 'infinite', onSlideChange })
        fireEvent.click(dots()[5]) // slide 6 is one step back from slide 1
        expect(current()).toBe(5)
        expect(onSlideChange).toHaveBeenCalledWith(5)
    })

    it('can reach the last dot in default mode', () => {
        setup({ slides: 6 })
        fireEvent.click(dots()[3])
        expect(current()).toBe(3)
        expect(next()).toHaveAttribute('aria-disabled', 'true') // it is at the end
    })

    it('puts the row’s props on the wrapper, and dotClassName on every dot', () => {
        setup({ type: 'infinite', dots: { className: 'row', id: 'my-dots', dotClassName: 'dot' } })
        const group = screen.getByRole('group', { name: 'Choose slide' })
        expect(group).toHaveClass('row')
        expect(group).toHaveAttribute('id', 'my-dots')
        dots().forEach((dot) => expect(dot).toHaveClass('dot'))
    })

    it('lets the group be renamed without renaming the dots', () => {
        setup({ type: 'infinite', dots: { 'aria-label': 'Pick a photo' } })
        expect(screen.getByRole('group', { name: 'Pick a photo' })).toBeInTheDocument()
        expect(dots().map((d) => d.getAttribute('aria-label'))).toContain('Go to slide 1')
        expect(dots().map((d) => d.getAttribute('aria-label'))).toContain('Go to slide 2')
    })

    it('draws what a function gives for each dot', () => {
        render(
            <Carousel aria-label="Test" type="infinite" reducedMotion>
                <Carousel.Track>
                    {[1, 2, 3, 4].map((n) => (
                        <Carousel.Slide key={n}>Slide {n}</Carousel.Slide>
                    ))}
                </Carousel.Track>
                <Carousel.Dots>{({ index, active, count }) => `${index + 1}/${count}${active ? '*' : ''}`}</Carousel.Dots>
            </Carousel>
        )
        expect(dots().map((d) => d.textContent)).toEqual(['1/4*', '2/4', '3/4', '4/4'])
    })

    it('is translated with labels', () => {
        setup({
            type: 'infinite',
            labels: { dots: 'Choisir une diapositive', goTo: (index: number) => `Aller à la diapositive ${index}` },
        })
        expect(screen.getByRole('group', { name: 'Choisir une diapositive' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Aller à la diapositive 2' })).toBeInTheDocument()
    })

    it('has no axe violations', async () => {
        const { container } = setup({ type: 'infinite' })
        expect((await axe(container)).violations).toHaveLength(0)
    })
})
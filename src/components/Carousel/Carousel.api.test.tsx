import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { Carousel, useCarouselState, useCarouselFrame } from './index'
import type { MotionFrame } from './index'
import { resolveAutoPlay, resolveDrag } from './options'

// ---------------------------------------------------------------------------------------------
// Option resolution: every default, in one place, with no DOM
// ---------------------------------------------------------------------------------------------

describe('resolveDrag', () => {
    it('is off when false, and on with no momentum by default', () => {
        expect(resolveDrag(false, 300).draggable).toBe(false)
        const on = resolveDrag(true, 300)
        expect(on).toMatchObject({ draggable: true, momentum: false, settle: 300 })
    })

    it('takes momentum as true, or as tuning', () => {
        expect(resolveDrag({ momentum: true }, 300)).toMatchObject({ momentum: true, reach: 0.25, maxSlides: 8, friction: 1 })
        expect(resolveDrag({ momentum: { reach: 1, maxSlides: 3, friction: 2 } }, 300)).toMatchObject({
            momentum: true, reach: 1, maxSlides: 3, friction: 2,
        })
    })

    it('settles in `settle` ms, defaulting to the carousel duration', () => {
        expect(resolveDrag({}, 400).settle).toBe(400)
        expect(resolveDrag({ settle: 90 }, 400).settle).toBe(90)
    })

    it('never lets friction reach zero', () => {
        expect(resolveDrag({ momentum: { friction: 0 } }, 300).friction).toBeGreaterThan(0)
    })
})

describe('resolveAutoPlay', () => {
    it('is disabled when false, and step mode when given nothing', () => {
        expect(resolveAutoPlay(false).enabled).toBe(false)
        const on = resolveAutoPlay(true)
        expect(on).toMatchObject({ enabled: true, speed: undefined, interval: 5000, direction: 'forward' })
    })

    it('is glide mode when a speed is given', () => {
        expect(resolveAutoPlay({ speed: 0.5 }).speed).toBe(0.5)
    })

    it('pauses on hover, focus and off-screen unless told not to', () => {
        expect(resolveAutoPlay(true).pauseOn).toEqual({ hover: true, focus: true, offScreen: true })
        expect(resolveAutoPlay({ pauseOn: { hover: false } }).pauseOn).toEqual({ hover: false, focus: true, offScreen: true })
    })

    it('steers nothing unless told to', () => {
        expect(resolveAutoPlay(true).steer).toEqual({ scroll: false, scrollInverse: false, drag: false, buttons: false })
        expect(resolveAutoPlay({ steer: { scroll: true, drag: true } }).steer).toMatchObject({ scroll: true, scrollInverse: false, drag: true, buttons: false })
        expect(resolveAutoPlay({ steer: { scroll: { inverse: true } } }).steer).toMatchObject({ scroll: true, scrollInverse: true })
    })

    it('has no easing by default, except a short one for turning round', () => {
        const { ease } = resolveAutoPlay({ speed: 1 })
        expect(ease.pause.duration).toBe(0)
        expect(ease.release.duration).toBe(0)
        expect(ease.reverse.duration).toBe(200)
        expect(ease.pause.easing(0.3)).toBe(0.3)
    })

    it('eases a release like a pause unless told otherwise', () => {
        const curve = (t: number) => t * t
        const { ease } = resolveAutoPlay({ speed: 1, ease: { pause: { duration: 800, easing: curve } } })
        expect(ease.release.duration).toBe(800)
        expect(ease.release.easing).toBe(curve)

        const own = resolveAutoPlay({ speed: 1, ease: { pause: { duration: 800 }, release: { duration: 2000 } } }).ease
        expect(own.release.duration).toBe(2000)
    })
})

// ---------------------------------------------------------------------------------------------
// Behaviour, with fake time so autoplay, steering and easing are exact
// ---------------------------------------------------------------------------------------------

beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 100 })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 300 })
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
    Element.prototype.setPointerCapture = vi.fn()
})

beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(),
        addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(), onchange: null,
    })) as unknown as typeof window.matchMedia
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})
afterEach(() => vi.useRealTimers())

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

// Reads what the public hooks give, from inside the carousel
let state: ReturnType<typeof useCarouselState>
let frames: MotionFrame[]
function Probe() {
    state = useCarouselState()
    useCarouselFrame((frame) => frames.push(frame))
    return null
}
const velocity = () => (frames.length ? frames[frames.length - 1].velocity : 0)

function renderCarousel(props: Record<string, unknown> = {}, slides = 6) {
    frames = []
    return render(
        <Carousel aria-label="Test" type="infinite" {...props}>
            <Carousel.Track>
                {Array.from({ length: slides }, (_, i) => (
                    <Carousel.Slide key={i}>Slide {i + 1}</Carousel.Slide>
                ))}
            </Carousel.Track>
            <Carousel.Prev>Prev</Carousel.Prev>
            <Carousel.Next>Next</Carousel.Next>
            <Carousel.PlayPause>Play</Carousel.PlayPause>
            <Probe />
        </Carousel>
    )
}
const prev = () => screen.getByRole('button', { name: 'Previous slide' })
const next = () => screen.getByRole('button', { name: 'Next slide' })
const section = () => screen.getByRole('region', { name: 'Test' })

describe('glide direction', () => {
    it('heads forward by default, like step mode', async () => {
        renderCarousel({ autoPlay: { speed: 1 } })
        await advance(1000)
        expect(velocity()).toBeGreaterThan(0.8)
        expect(state.direction).toBe('forward')
    })

    it('starts backward when asked', async () => {
        renderCarousel({ autoPlay: { speed: 1, direction: 'backward' } })
        await advance(1000)
        expect(velocity()).toBeLessThan(-0.8)
        expect(state.direction).toBe('backward')
    })
})

describe('step direction', () => {
    it('steps forward by default', async () => {
        const onSlideChange = vi.fn()
        renderCarousel({ autoPlay: { interval: 1000 }, onSlideChange })
        await advance(1100)
        expect(onSlideChange).toHaveBeenLastCalledWith(1)
    })

    it('steps backward when asked', async () => {
        const onSlideChange = vi.fn()
        renderCarousel({ autoPlay: { interval: 1000, direction: 'backward' }, onSlideChange })
        await advance(1100)
        expect(onSlideChange).toHaveBeenLastCalledWith(5)
    })
})

describe('steering with the buttons', () => {
    it('does nothing unless switched on', async () => {
        renderCarousel({ autoPlay: { speed: 1 } })
        await advance(500)
        fireEvent.click(prev())
        await advance(1500)
        expect(state.direction).toBe('forward')
        expect(velocity()).toBeGreaterThan(0.8)
    })

    it('turns a glide round, and back', async () => {
        renderCarousel({ autoPlay: { speed: 1, steer: { buttons: true } } })
        await advance(500)
        fireEvent.click(prev())
        await advance(1500)
        expect(state.direction).toBe('backward')
        expect(velocity()).toBeLessThan(-0.8)

        fireEvent.click(next())
        await advance(1500)
        expect(state.direction).toBe('forward')
        expect(velocity()).toBeGreaterThan(0.8)
    })

    it('turns step autoplay too: after Prev it keeps stepping backward', async () => {
        const onSlideChange = vi.fn()
        renderCarousel({ autoPlay: { interval: 1000, steer: { buttons: true } }, onSlideChange })
        fireEvent.click(prev())
        expect(onSlideChange).toHaveBeenLastCalledWith(5) // the press itself moved back one
        await advance(1500)                                // the wait restarts after a move
        expect(onSlideChange).toHaveBeenLastCalledWith(4) // and the next automatic step goes backward
    })

    it('is what useCarouselState.next and prev do too', async () => {
        renderCarousel({ autoPlay: { speed: 1, steer: { buttons: true } } })
        await advance(300)
        await act(async () => { state.prev() })
        await advance(1500)
        expect(state.direction).toBe('backward')
    })
})

describe('steering with a drag', () => {
    const track = () => document.querySelector<HTMLElement>('[data-carousel-slide]')!.parentElement as HTMLElement
    function drag(from: number, to: number) {
        const opts = { pointerId: 1, pointerType: 'mouse' }
        fireEvent.pointerDown(track(), { clientX: from, button: 0, ...opts })
        const direction = to > from ? 1 : -1
        for (let x = from + direction * 10; direction * (to - x) > 0; x += direction * 10) {
            fireEvent.pointerMove(track(), { clientX: x, ...opts })
        }
        fireEvent.pointerMove(track(), { clientX: to, ...opts })
        fireEvent.pointerUp(track(), { clientX: to, ...opts })
    }

    it('sets the direction you pushed (glide)', async () => {
        renderCarousel({ drag: true, autoPlay: { speed: 1, steer: { drag: true } } })
        await advance(300)
        drag(300, 100)  // dragging left pushes forward
        await advance(300)
        expect(state.direction).toBe('forward')
        drag(100, 300)  // dragging right pushes backward
        await advance(1500)
        expect(state.direction).toBe('backward')
        expect(velocity()).toBeLessThan(-0.8)
    })

    it('sets the direction you pushed (step)', async () => {
        renderCarousel({ drag: true, autoPlay: { interval: 1000, steer: { drag: true } } })
        drag(100, 300)
        await advance(100)
        expect(state.direction).toBe('backward')
    })

    it('ignores a tiny nudge', async () => {
        renderCarousel({ drag: true, autoPlay: { speed: 1, steer: { drag: true } } })
        await advance(300)
        drag(300, 297) // under the 5px threshold, so it is not a drag at all
        await advance(300)
        expect(state.direction).toBe('forward')
    })

    it('does nothing unless switched on', async () => {
        renderCarousel({ drag: true, autoPlay: { speed: 1 } })
        await advance(300)
        drag(100, 300)
        await advance(300)
        expect(state.direction).toBe('forward')
    })
})

describe('steering with page scroll', () => {
    const scrollTo = (y: number) => {
        Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
        act(() => { window.dispatchEvent(new Event('scroll')) })
    }

    it('goes forward as the page scrolls down, backward as it scrolls up', async () => {
        renderCarousel({ autoPlay: { speed: 1, steer: { scroll: true } } })
        scrollTo(200)
        expect(state.direction).toBe('forward')
        scrollTo(100)
        expect(state.direction).toBe('backward')
        scrollTo(300)
        expect(state.direction).toBe('forward')
    })

    it('can be flipped with inverse', async () => {
        renderCarousel({ autoPlay: { speed: 1, steer: { scroll: { inverse: true } } } })
        scrollTo(200)
        expect(state.direction).toBe('backward')
        scrollTo(100)
        expect(state.direction).toBe('forward')
    })

    it('ignores movements under 10px', async () => {
        renderCarousel({ autoPlay: { speed: 1, direction: 'backward', steer: { scroll: true } } })
        scrollTo(6)
        expect(state.direction).toBe('backward')
    })

    it('adds no scroll listener when scroll does not steer', () => {
        const add = vi.spyOn(window, 'addEventListener')
        renderCarousel({ autoPlay: { speed: 1 } })
        expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(0)
        add.mockRestore()
    })

    it('adds one when it does, and removes it on unmount', () => {
        const add = vi.spyOn(window, 'addEventListener')
        const remove = vi.spyOn(window, 'removeEventListener')
        const { unmount } = renderCarousel({ autoPlay: { speed: 1, steer: { scroll: true } } })
        expect(add.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1)
        unmount()
        expect(remove.mock.calls.filter(([type]) => type === 'scroll')).toHaveLength(1)
        add.mockRestore(); remove.mockRestore()
    })

    it('does not let a later scroll overrule a drag or button that came after it', async () => {
        renderCarousel({ autoPlay: { speed: 1, steer: { scroll: true, buttons: true } } })
        scrollTo(200)                 // forward
        fireEvent.click(prev())       // the button turns it backward
        expect(state.direction).toBe('backward')
        scrollTo(260)                 // still scrolling down: not a turn, so the button keeps the say
        expect(state.direction).toBe('backward')
        scrollTo(100)                 // a real turn (up) wins again
        expect(state.direction).toBe('backward')
        scrollTo(300)
        expect(state.direction).toBe('forward')
    })
})

describe('easing', () => {
    it('stops at once with no pause easing', async () => {
        renderCarousel({ autoPlay: { speed: 1 } })
        await advance(1000)
        fireEvent.click(screen.getByRole('button', { name: 'Stop slide rotation' }))
        await advance(400)
        expect(Math.abs(velocity())).toBeLessThan(0.05)
    })

    it('slows over the pause duration, then stops', async () => {
        renderCarousel({ autoPlay: { speed: 1, ease: { pause: { duration: 1500 } } } })
        await advance(2000)
        fireEvent.click(screen.getByRole('button', { name: 'Stop slide rotation' }))
        await advance(300)
        expect(velocity()).toBeGreaterThan(0.3) // still moving a little way into the ease
        await advance(2000)
        expect(Math.abs(velocity())).toBeLessThan(0.05)
    })

    it('eases back up when resumed', async () => {
        renderCarousel({ autoPlay: { speed: 1, ease: { pause: { duration: 1000 } } } })
        await advance(1500)
        fireEvent.click(screen.getByRole('button', { name: 'Stop slide rotation' }))
        await advance(2000)
        fireEvent.click(screen.getByRole('button', { name: 'Start slide rotation' }))
        await advance(150)
        expect(velocity()).toBeLessThan(0.5)    // not at full speed yet
        await advance(2000)
        expect(velocity()).toBeGreaterThan(0.9)
    })
})

describe('pausing', () => {
    // The pointer events a mouse makes when it moves onto, and off, the carousel
    const hover = () => fireEvent.pointerEnter(section(), { pointerType: 'mouse' })
    const unhover = () => fireEvent.pointerLeave(section(), { pointerType: 'mouse' })

    it('holds still while hovered, by default', async () => {
        renderCarousel({ autoPlay: { speed: 1 } })
        await advance(1000)
        hover()
        await advance(1000)
        expect(Math.abs(velocity())).toBeLessThan(0.05)
        unhover()
        await advance(1000)
        expect(velocity()).toBeGreaterThan(0.8)
    })

    it('keeps going while hovered with pauseOn.hover off', async () => {
        renderCarousel({ autoPlay: { speed: 1, pauseOn: { hover: false } } })
        await advance(1000)
        hover()
        await advance(1000)
        expect(velocity()).toBeGreaterThan(0.8)
    })

    it('does not pause for touch, which has no way to leave', async () => {
        renderCarousel({ autoPlay: { speed: 1 } })
        await advance(1000)
        fireEvent.pointerEnter(section(), { pointerType: 'touch' })
        await advance(1000)
        expect(velocity()).toBeGreaterThan(0.8)
    })
})

describe('the parts', () => {
    it('Carousel.PlayPause renders nothing without autoplay', () => {
        renderCarousel({})
        expect(screen.queryByRole('button', { name: /slide rotation/ })).toBeNull()
    })

    it('Carousel.PlayPause renders with autoplay and flips its label', async () => {
        renderCarousel({ autoPlay: { interval: 1000 } })
        const button = screen.getByRole('button', { name: 'Stop slide rotation' })
        fireEvent.click(button)
        expect(screen.getByRole('button', { name: 'Start slide rotation' })).toBeInTheDocument()
    })

    it('writes no CSS variables unless asked', async () => {
        renderCarousel({ autoPlay: { speed: 1 } })
        await advance(1000)
        expect(section().style.getPropertyValue('--carousel-velocity')).toBe('')
    })

    it('writes them when asked', async () => {
        renderCarousel({ autoPlay: { speed: 1 }, cssVariables: true })
        await advance(1000)
        expect(parseFloat(section().style.getPropertyValue('--carousel-velocity'))).toBeGreaterThan(0.8)
    })
})

describe('the public hooks', () => {
    it('useCarouselState: goTo takes the shorter way round', async () => {
        renderCarousel({ reducedMotion: true })
        await act(async () => { state.goTo(4) })
        expect(state.activeIndex).toBe(4)
        await act(async () => { state.goTo(0) })
        expect(state.activeIndex).toBe(0)
    })

    it('useCarouselState: next and prev wrap in infinite mode', async () => {
        renderCarousel({ reducedMotion: true })
        await act(async () => { state.prev() })
        expect(state.activeIndex).toBe(5)
        await act(async () => { state.next() })
        expect(state.activeIndex).toBe(0)
    })

    it('callbacks do not fire on mount, and fire on change', async () => {
        const onSlideChange = vi.fn()
        const onPlayingChange = vi.fn()
        renderCarousel({ reducedMotion: true, onSlideChange, onPlayingChange, autoPlay: true })
        expect(onSlideChange).not.toHaveBeenCalled()
        fireEvent.click(next())
        expect(onSlideChange).toHaveBeenCalledWith(1)
        fireEvent.click(screen.getByRole('button', { name: 'Stop slide rotation' }))
        expect(onPlayingChange).toHaveBeenCalledWith(false)
    })
})
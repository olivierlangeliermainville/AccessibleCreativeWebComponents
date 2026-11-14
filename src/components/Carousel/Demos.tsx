import { useEffect, useRef, useState } from 'react'
import { spring } from '../Helpers/Easings'
import { Carousel } from './Carousel'
import { useCarouselState, useCarouselFrame } from './public'

// ---------------------------------------------------------------------------------------------
// Small pieces the demos share
// ---------------------------------------------------------------------------------------------

const navButton =
    'rounded-md bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20 aria-disabled:cursor-not-allowed aria-disabled:opacity-30'

const cardClass = 'grid aspect-square w-full place-items-center rounded-xl text-3xl font-semibold text-white'
const cardColor = (n: number) => `hsl(${(n * 47) % 360} 65% 45%)`

function Card({ n, focusable = false }: { n: number; focusable?: boolean }) {
    if (focusable) {
        return (
            <button className={`${cardClass} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`} style={{ background: cardColor(n) }}>
                {n}
            </button>
        )
    }
    return (
        <div className={cardClass} style={{ background: cardColor(n) }}>
            {n}
        </div>
    )
}

// Called like a function, not used as <Slides />: the track only looks at its direct children,
// so the slides must be right there in its children array.
function slides(count: number, { width = 'w-40', focusable = false } = {}) {
    return Array.from({ length: count }, (_, i) => (
        <Carousel.Slide key={i} className={width}>
            <Card n={i + 1} focusable={focusable} />
        </Carousel.Slide>
    ))
}

function NavButtons() {
    return (
        <div className="mt-3 flex gap-2">
            <Carousel.Prev className={navButton}>←</Carousel.Prev>
            <Carousel.Next className={navButton}>→</Carousel.Next>
        </div>
    )
}

// Uses useCarouselState, so it has to sit inside <Carousel>
function PlayPauseButton() {
    const { playing } = useCarouselState()
    return <Carousel.PlayPause className={navButton}>{playing ? '⏸ Pause' : '▶ Play'}</Carousel.PlayPause>
}

// ---------------------------------------------------------------------------------------------
// 1. Default mode: stops at the ends
// ---------------------------------------------------------------------------------------------

export function BasicDemo() {
    return (
        <Carousel aria-label="Basic carousel" gap={16} drag>
            <Carousel.Track>{slides(8, { focusable: true })}</Carousel.Track>
            <NavButtons />
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 2. Infinite: loops, and pads itself with copies when there are too few slides
// ---------------------------------------------------------------------------------------------

export function InfiniteDemo() {
    return (
        <Carousel type="infinite" aria-label="Infinite carousel" gap={16} drag={{ momentum: true }}>
            <Carousel.Track>{slides(4, { focusable: true })}</Carousel.Track>
            <NavButtons />
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 3. Hero slider: one slide at a time, step autoplay, dots, and a callback
// ---------------------------------------------------------------------------------------------

const heroSlides = [
    { title: 'Spring physics', style: 'from-indigo-500 to-purple-600' },
    { title: 'Drag with momentum', style: 'from-emerald-500 to-teal-600' },
    { title: 'Accessible by default', style: 'from-orange-500 to-rose-600' },
    { title: 'Tiny and dependency free', style: 'from-sky-500 to-blue-700' },
]

export function HeroDemo() {
    const [title, setTitle] = useState(heroSlides[0].title)
    return (
        <>
            <Carousel
                type="infinite"
                aria-label="Hero slider"
                drag
                autoPlay={{ interval: 3500 }}
                onSlideChange={(index) => setTitle(heroSlides[index].title)}
            >
                <Carousel.Track className="overflow-hidden rounded-xl">
                    {heroSlides.map((slide, i) => (
                        <Carousel.Slide key={i} className="w-full">
                            <div
                                className={`grid h-56 place-items-center bg-linear-to-br text-2xl font-semibold text-white ${slide.style}`}
                            >
                                {slide.title}
                            </div>
                        </Carousel.Slide>
                    ))}
                </Carousel.Track>
                <div className="mt-3 flex items-center justify-between">
                    <Carousel.Dots
                        className="flex items-center gap-2"
                        dotClassName="h-2.5 w-2.5 cursor-pointer rounded-full bg-white/40 transition-all hover:bg-white/70 aria-[current=true]:w-6 aria-[current=true]:bg-white"
                    />
                    <PlayPauseButton />
                </div>
            </Carousel>
            <p className="mt-3 text-sm text-neutral-400">
                onSlideChange says: now showing <b className="text-white">{title}</b>
            </p>
        </>
    )
}

// ---------------------------------------------------------------------------------------------
// 4. Dots: Carousel.Dots draws the slide pickers
// ---------------------------------------------------------------------------------------------

// The current dot has aria-current="true", so that is what the styles hang off
const dotClass =
    'h-2.5 w-2.5 cursor-pointer rounded-full bg-white/40 transition-all hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white aria-[current=true]:w-6 aria-[current=true]:bg-white'

const numberClass =
    'grid size-8 cursor-pointer place-items-center rounded-lg bg-white/10 text-sm hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white aria-[current=true]:bg-white aria-[current=true]:text-black'

export function DotsDemo() {
    return (
        <div className="space-y-10">
            <div>
                <p className="mb-2 text-sm text-neutral-400">
                    Default mode, 8 slides: a dot for each place it can stop, so fewer dots than slides.
                </p>
                <Carousel aria-label="Dots in default mode" gap={16} drag>
                    <Carousel.Track>{slides(8, { width: 'w-40' })}</Carousel.Track>
                    <Carousel.Dots className="mt-3 flex justify-center gap-2" dotClassName={dotClass} />
                </Carousel>
            </div>

            <div>
                <p className="mb-2 text-sm text-neutral-400">
                    Infinite with autoplay: numbered dots, drawn by a function. A dot goes the short way round.
                </p>
                <Carousel type="infinite" aria-label="Numbered dots" drag autoPlay={{ interval: 3000 }}>
                    <Carousel.Track className="overflow-hidden rounded-xl">
                        {heroSlides.map((slide, i) => (
                            <Carousel.Slide key={i} className="w-full">
                                <div
                                    className={`grid h-40 place-items-center bg-linear-to-br text-xl font-semibold text-white ${slide.style}`}
                                >
                                    {slide.title}
                                </div>
                            </Carousel.Slide>
                        ))}
                    </Carousel.Track>
                    <div className="mt-3 flex items-center justify-between">
                        <Carousel.Dots className="flex gap-1.5" dotClassName={numberClass}>
                            {({ index }) => index + 1}
                        </Carousel.Dots>
                        <PlayPauseButton />
                    </div>
                </Carousel>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------
// 5. Glide: constant motion that eases to a stop on pause and on hover
// ---------------------------------------------------------------------------------------------

export function GlideDemo() {
    return (
        <Carousel
            type="infinite"
            aria-label="Gliding carousel"
            gap={16}
            drag={{ momentum: true }}
            autoPlay={{ speed: 0.6, ease: { pause: { duration: 900 } } }}
        >
            <Carousel.Track>{slides(6, { width: 'w-32' })}</Carousel.Track>
            <div className="mt-3">
                <PlayPauseButton />
            </div>
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 6. Spring release: flick it, it bounces, and carries on the way you threw it
// ---------------------------------------------------------------------------------------------

const bouncy = spring({ bounce: 0.3 }) // created once, outside the component

export function SpringDemo() {
    return (
        <Carousel
            type="infinite"
            aria-label="Spring release carousel"
            gap={16}
            drag={{ momentum: true }}
            autoPlay={{
                speed: 0.7,
                steer: { drag: true },
                pauseOn: { hover: false },
                ease: { pause: { duration: 600 }, release: { duration: 2400, easing: bouncy } },
            }}
        >
            <Carousel.Track>{slides(6, { width: 'w-32' })}</Carousel.Track>
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 7. Scroll influence: scrolling the page steers the glide
// ---------------------------------------------------------------------------------------------

export function ScrollDemo() {
    return (
        <Carousel
            type="infinite"
            aria-label="Scroll steered carousel"
            gap={16}
            autoPlay={{
                speed: 0.8,
                steer: { scroll: true },
                pauseOn: { hover: false },
                ease: { pause: { duration: 600 }, reverse: { duration: 600 } },
            }}
        >
            <Carousel.Track>{slides(6, { width: 'w-32' })}</Carousel.Track>
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 8. Button direction: Prev and Next also steer the glide
// ---------------------------------------------------------------------------------------------

export function ButtonDirectionDemo() {
    return (
        <Carousel
            type="infinite"
            aria-label="Button steered carousel"
            gap={16}
            autoPlay={{
                speed: 0.8,
                direction: 'backward',
                steer: { buttons: true },
                pauseOn: { hover: false },
                ease: { pause: { duration: 600 }, reverse: { duration: 600 } },
            }}
        >
            <Carousel.Track>{slides(6, { width: 'w-32' })}</Carousel.Track>
            <NavButtons />
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 9. Step autoplay steered by the buttons: the same options work in both autoplay modes
// ---------------------------------------------------------------------------------------------

export function StepSteerDemo() {
    return (
        <Carousel
            type="infinite"
            aria-label="Step carousel steered by buttons"
            gap={16}
            drag
            autoPlay={{ interval: 2200, steer: { buttons: true, drag: true } }}
        >
            <Carousel.Track>{slides(6, { width: 'w-32' })}</Carousel.Track>
            <div className="mt-3 flex items-center gap-2">
                <Carousel.Prev className={navButton}>←</Carousel.Prev>
                <Carousel.Next className={navButton}>→</Carousel.Next>
                <PlayPauseButton />
                <DirectionLabel />
            </div>
        </Carousel>
    )
}

// Shows the direction hook value, so you can see Prev, Next and dragging turn it
function DirectionLabel() {
    const { direction } = useCarouselState()
    return <span className="ml-2 text-sm text-neutral-400">heading {direction}</span>
}

// ---------------------------------------------------------------------------------------------
// 10. CSS variables: style anything by how fast the carousel moves
// ---------------------------------------------------------------------------------------------

export function VelocityDemo() {
    return (
        <Carousel
            type="infinite"
            aria-label="Velocity styled carousel"
            gap={16}
            cssVariables
            drag={{ momentum: true }}
            autoPlay={{ speed: 0.4, pauseOn: { hover: false }, ease: { pause: { duration: 800 }, release: { duration: 1800 } } }}
        >
            <Carousel.Track className="py-4">
                {Array.from({ length: 6 }, (_, i) => (
                    // The effect goes on an element inside the slide: the slide's own transform is used for position
                    <Carousel.Slide key={i} className="w-32">
                        <div
                            className={cardClass}
                            style={{
                                background: cardColor(i + 1),
                                transform: 'skewX(calc(var(--carousel-velocity, 0) * -8deg))',
                                scale: 'calc(1 - min(abs(var(--carousel-velocity, 0)), 4) * 0.04)',
                            }}
                        >
                            {i + 1}
                        </div>
                    </Carousel.Slide>
                ))}
            </Carousel.Track>
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 11. Frame hook: follow the motion without re-rendering
// ---------------------------------------------------------------------------------------------

function Backdrop() {
    const ref = useRef<HTMLDivElement>(null)
    useCarouselFrame(({ position }) => {
        if (ref.current) ref.current.style.backgroundPositionX = `${position * -40}px`
    })
    return (
        <div
            ref={ref}
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 3px)', backgroundSize: '40px 40px' }}
        />
    )
}

function Meters() {
    const positionRef = useRef<HTMLSpanElement>(null)
    const velocityRef = useRef<HTMLSpanElement>(null)
    const directionRef = useRef<HTMLSpanElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const rendersRef = useRef<HTMLSpanElement>(null)
    const renderCount = useRef(0)

    // Counts how many times this component renders, to show that frames do not cause renders
    useEffect(() => {
        renderCount.current += 1
        if (rendersRef.current) rendersRef.current.textContent = String(renderCount.current)
    })

    useCarouselFrame(({ position, velocity, direction }) => {
        if (positionRef.current) positionRef.current.textContent = position.toFixed(2)
        if (velocityRef.current) velocityRef.current.textContent = velocity.toFixed(2)
        if (directionRef.current) directionRef.current.textContent = ['backward', 'still', 'forward'][direction + 1]
        if (barRef.current) barRef.current.style.width = `${Math.min(Math.abs(velocity) / 3, 1) * 100}%`
    })

    return (
        <div className="relative mt-4 grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm sm:grid-cols-4">
            <span>position <b ref={positionRef} className="text-emerald-300">0.00</b></span>
            <span>velocity <b ref={velocityRef} className="text-emerald-300">0.00</b></span>
            <span>direction <b ref={directionRef} className="text-emerald-300">still</b></span>
            <span>renders <b ref={rendersRef} className="text-amber-300">1</b></span>
            <div className="col-span-full mt-1 h-1.5 overflow-hidden rounded bg-white/10">
                <div ref={barRef} className="h-full w-0 bg-emerald-400" />
            </div>
        </div>
    )
}

export function FrameDemo() {
    return (
        <Carousel
            type="infinite"
            aria-label="Frame hook carousel"
            gap={16}
            drag={{ momentum: true }}
            autoPlay={{ speed: 0.5, pauseOn: { hover: false }, ease: { pause: { duration: 800 }, release: { duration: 1800 } } }}
            className="relative overflow-hidden rounded-xl bg-neutral-900 p-6"
        >
            <Backdrop />
            <Carousel.Track className="relative">{slides(6, { width: 'w-28' })}</Carousel.Track>
            <Meters />
        </Carousel>
    )
}

// ---------------------------------------------------------------------------------------------
// 12. Your own words, and reduced motion
// ---------------------------------------------------------------------------------------------

const french = {
    prev: 'Précédent',
    next: 'Suivant',
    pause: 'Arrêter la rotation',
    play: 'Démarrer la rotation',
    slide: (index: number, count: number) => `${index} sur ${count}`,
    status: (first: number, last: number, count: number) =>
        first === last ? `Diapositive ${first} sur ${count}` : `Diapositives ${first} à ${last} sur ${count}`,
}

function FrenchPlayPause() {
    const { playing } = useCarouselState()
    return <Carousel.PlayPause className={navButton}>{playing ? '⏸ Pause' : '▶ Lecture'}</Carousel.PlayPause>
}

export function LabelsDemo() {
    const [reduced, setReduced] = useState(false)
    return (
        <>
            <label className="mb-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
                Reduce motion (slides jump instead of gliding)
            </label>
            <Carousel
                type="infinite"
                aria-label="Carrousel de démonstration"
                gap={16}
                labels={french}
                reducedMotion={reduced}
                autoPlay={{ interval: 3000 }}
            >
                <Carousel.Track>{slides(5)}</Carousel.Track>
                <div className="mt-3 flex gap-2">
                    <Carousel.Prev className={navButton}>←</Carousel.Prev>
                    <Carousel.Next className={navButton}>→</Carousel.Next>
                    <FrenchPlayPause />
                </div>
            </Carousel>
        </>
    )
}

// ---------------------------------------------------------------------------------------------
// 13. Pause off-screen: scroll away and compare the two counters
// ---------------------------------------------------------------------------------------------

export function OffScreenDemo() {
    const [pausingChanges, setPausingChanges] = useState(0)
    const [runningChanges, setRunningChanges] = useState(0)
    return (
        <div>
            <div className="sticky top-3 z-10 rounded-lg bg-neutral-800 p-3 text-sm shadow-lg">
                Slide changes so far: carousel A (pauses off-screen) <b className="text-emerald-300">{pausingChanges}</b>
                {' · '}carousel B (keeps running) <b className="text-amber-300">{runningChanges}</b>
            </div>
            <p className="mt-4 mb-2 text-sm text-neutral-400">A: pauseOffScreen is on</p>
            <Carousel
                type="infinite"
                aria-label="Carousel A"
                gap={8}
                autoPlay={{ speed: 1.5, pauseOn: { offScreen: true, hover: false } }}
                onSlideChange={() => setPausingChanges((n) => n + 1)}
            >
                <Carousel.Track>{slides(4, { width: 'w-20' })}</Carousel.Track>
            </Carousel>
            <p className="mt-6 mb-2 text-sm text-neutral-400">B: pauseOffScreen is off</p>
            <Carousel
                type="infinite"
                aria-label="Carousel B"
                gap={8}
                autoPlay={{ speed: 1.5, pauseOn: { offScreen: false, hover: false } }}
                onSlideChange={() => setRunningChanges((n) => n + 1)}
            >
                <Carousel.Track>{slides(4, { width: 'w-20' })}</Carousel.Track>
            </Carousel>
            <div className="grid h-[110vh] place-items-start pt-8 text-neutral-500">Keep scrolling, then look at the counters ↑</div>
        </div>
    )
}
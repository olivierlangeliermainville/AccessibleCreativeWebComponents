import type { ReactNode } from 'react'
import {
    BasicDemo,
    InfiniteDemo,
    HeroDemo,
    GlideDemo,
    SpringDemo,
    ScrollDemo,
    ButtonDirectionDemo,
    StepSteerDemo,
    VelocityDemo,
    FrameDemo,
    OffScreenDemo,
    LabelsDemo,
} from './demos'

function Demo({ title, description, props, children }: { title: string; description: string; props: string; children: ReactNode }) {
    return (
        <article>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-neutral-400">{description}</p>
            <code className="mt-2 block overflow-x-auto rounded bg-white/5 px-3 py-2 text-xs whitespace-pre text-emerald-300">{props}</code>
            <div className="mt-4">{children}</div>
        </article>
    )
}

export function Showcase() {
    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-100">
            <div className="mx-auto max-w-3xl space-y-20 px-6 py-16">
                <header>
                    <h1 className="text-3xl font-bold">Carousel showcase</h1>
                    <p className="mt-2 text-neutral-400">
                        Every demo below is one <code>&lt;Carousel&gt;</code> with different props. Try dragging, tabbing,
                        hovering and scrolling.
                    </p>
                </header>

                <Demo
                    title="1. Default mode"
                    description="Stops at both ends and disables the button that can't move. Drag it, or Tab through the cards: only the visible ones can take focus."
                    props="<Carousel drag gap={16}>"
                >
                    <BasicDemo />
                </Demo>

                <Demo
                    title="2. Infinite loop"
                    description="Four slides, but the track is full: it quietly adds hidden copies so the loop has no gap. Flick it for momentum."
                    props={`<Carousel type="infinite" drag={{ momentum: true }}>`}
                >
                    <InfiniteDemo />
                </Demo>

                <Demo
                    title="3. Hero slider"
                    description="One slide at a time with step autoplay, dots built with useCarouselState, a play/pause button, and an onSlideChange callback."
                    props={`<Carousel type="infinite" autoPlay={{ interval: 3500 }} onSlideChange={...}>`}
                >
                    <HeroDemo />
                </Demo>

                <Demo
                    title="4. Glide"
                    description="Constant motion instead of steps. Hover it, or press pause: it eases to a stop and eases back up."
                    props={`autoPlay={{ speed: 0.6, ease: { pause: { duration: 900 } } }}`}
                >
                    <GlideDemo />
                </Demo>

                <Demo
                    title="5. Spring release"
                    description="Flick it and let go. It coasts, bounces on a spring curve, and carries on in the direction you threw it."
                    props={`autoPlay={{ speed: 0.7, steer: { drag: true },\n  ease: { release: { duration: 2400, easing: spring({ bounce: 0.3 }) } } }}`}
                >
                    <SpringDemo />
                </Demo>

                <Demo
                    title="6. Scroll steers it"
                    description="Scroll the page up and the carousel turns around. Scroll down and it turns back."
                    props={`autoPlay={{ speed: 0.8, steer: { scroll: true }, ease: { reverse: { duration: 600 } } }}`}
                >
                    <ScrollDemo />
                </Demo>

                <Demo
                    title="7. Buttons steer it"
                    description="It starts out heading backward. Prev and Next turn the glide round, with a short ease."
                    props={`autoPlay={{ speed: 0.8, direction: 'backward', steer: { buttons: true } }}`}
                >
                    <ButtonDirectionDemo />
                </Demo>

                <Demo
                    title="8. Steering works in step mode too"
                    description="The same options steer step autoplay: press Prev and it keeps stepping backward. Drag it the other way and it turns again. The label shows the direction."
                    props={`autoPlay={{ interval: 2200, steer: { buttons: true, drag: true } }}`}
                >
                    <StepSteerDemo />
                </Demo>

                <Demo
                    title="9. Style it by speed"
                    description="The carousel writes --carousel-velocity as a CSS variable. Here the cards lean into the motion and shrink a little. Drag and fling it."
                    props={`<Carousel cssVariables>   skewX(calc(var(--carousel-velocity) * -8deg))`}
                >
                    <VelocityDemo />
                </Demo>

                <Demo
                    title="10. Follow the motion"
                    description="useCarouselFrame gives a parallax backdrop and these live numbers every frame. Watch 'renders': the meters update without re-rendering."
                    props={`useCarouselFrame(({ position, velocity, direction }) => { ... })`}
                >
                    <FrameDemo />
                </Demo>

                <Demo
                    title="11. Your own words, and reduced motion"
                    description="Every string a screen reader hears can be replaced. Use a screen reader to hear the French labels. The checkbox forces reduced motion."
                    props={`<Carousel labels={french} reducedMotion={reduced} autoPlay={{ interval: 3000 }}>`}
                >
                    <LabelsDemo />
                </Demo>

                <Demo
                    title="12. Pause off-screen"
                    description="Two identical fast glides. Scroll down until they leave the screen: carousel A stops working, B keeps going. The sticky counters show it."
                    props={`autoPlay={{ speed: 1.5, pauseOn: { offScreen: true } }}   vs   offScreen: false`}
                >
                    <OffScreenDemo />
                </Demo>
            </div>
        </main>
    )
}
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Accordion } from "./components/Accordion";
import { Carousel } from "./components/Carousel";
import { Showcase } from "./components/Carousel/Showcase";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="p-4 w-full">
      <Accordion type="single">
        <Accordion.Item className="border-t border-white">
          <Accordion.Trigger className="cursor-pointer w-full text-start py-1">
            Label
          </Accordion.Trigger>
          <Accordion.Panel className="pb-4">
            <p>Content</p>
            <button>test</button>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item className="border-t border-white">
          <Accordion.Trigger className="cursor-pointer w-full text-start py-1">
            Label
          </Accordion.Trigger>
          <Accordion.Panel className="pb-4">
            <p>Content</p>
            <button>test</button>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
    {/* <div className="p-4 w-full flex items-center h-[100vh]">
      <Carousel
        type="infinite"
        autoPlay={{
          dragDirectionChange:true,
          buttonDirectionChange:true,
          pauseOffScreen:true,
          speed: 1,
          playPauseEasingDuration: 2000,
          releaseEasingDuration: 3000,
          pauseOnHover: false,
          pauseOnFocus: false,
          scrollInfluence: true
        }}
        gap={16}
        duration={400}
        drag={{ momentum: true, friction: 1.0 }}
        aria-label="Featured"
        className="w-full"
      >
        <Carousel.Track className="w-full ">
          <Carousel.Slide className="w-42">
            <button className="flex items-center justify-center h-42 aspect-square bg-white rounded-sm">
              One
            </button>
          </Carousel.Slide>
          <Carousel.Slide className="w-42">
            <button className="flex items-center justify-center h-42 aspect-square bg-white rounded-sm">
              Two
            </button>
          </Carousel.Slide>
          <Carousel.Slide className="w-42">
            <button className="flex items-center justify-center h-42 aspect-square bg-white rounded-sm">
              Three
            </button>
          </Carousel.Slide>
        </Carousel.Track>
        <Carousel.Prev>←</Carousel.Prev>
        <Carousel.Next>→</Carousel.Next>
      </Carousel>
    </div> */}
    <Showcase/>
  </StrictMode>,
);

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { stepIndex, type BannerSlide } from "@/lib/banners";

const INTERVAL_MS = 6000;

/** The content is `max-w-7xl` (80rem): the rail fills what is left of each margin, minus a gap. */
const RAIL_WIDTH = "min(15rem, calc((100vw - 80rem) / 2 - 1.5rem))";

/**
 * One vertical banner pinned in a side margin of the page. Several images fade
 * into one another; it stays visible while the page scrolls. Hidden below 2xl,
 * where the margins are too narrow to hold it.
 */
export function SideBannerRail({ slides, side }: { slides: BannerSlide[]; side: "left" | "right" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => stepIndex(current, count, 1)), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  return (
    <aside
      aria-label="TechLium"
      style={{ width: RAIL_WIDTH }}
      className={`fixed top-32 z-10 hidden h-[calc(100vh-9rem)] max-h-[52rem] overflow-hidden rounded-sm bg-surface shadow-card 2xl:block ${side === "left" ? "left-3" : "right-3"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, position) => {
        // eslint-disable-next-line @next/next/no-img-element
        const image = <img src={slide.image_url} alt={slide.title ?? ""} className="h-full w-full object-cover" draggable={false} />;
        const external = slide.link_url !== null && /^https?:\/\//i.test(slide.link_url);
        const visible = position === Math.min(index, count - 1);

        return (
          <div key={slide.id} aria-hidden={!visible} className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {slide.link_url ? (
              external ? (
                <a href={slide.link_url} target="_blank" rel="noopener noreferrer" tabIndex={visible ? 0 : -1} className="block h-full">
                  {image}
                </a>
              ) : (
                <Link href={slide.link_url} tabIndex={visible ? 0 : -1} className="block h-full">
                  {image}
                </Link>
              )
            ) : (
              image
            )}
          </div>
        );
      })}
    </aside>
  );
}

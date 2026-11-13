"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppearance } from "@/components/AppearanceProvider";

/**
 * Previous / next buttons for a horizontally scrolling row of product cards
 * (the element with id `target`): each click moves the row by one product.
 */
export function ShelfControls({ target, tone = "light" }: { target: string; tone?: "light" | "dark" }) {
  const { tr } = useAppearance();
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const row = document.getElementById(target);
    if (!row) return;
    setEdges({ start: row.scrollLeft <= 1, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 1 });
  }, [target]);

  useEffect(() => {
    const row = document.getElementById(target);
    if (!row) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    update();
    row.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      row.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [target, update]);

  function step(direction: 1 | -1) {
    const row = document.getElementById(target);
    const card = row?.firstElementChild as HTMLElement | null;
    if (!row || !card) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: "smooth" });
  }

  // "light" sits on a coloured header (the flash sale); "dark" on the page itself.
  const button =
    tone === "dark"
      ? "rounded-full bg-line p-1.5 text-ink transition-colors hover:bg-gold-highlight disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-line"
      : "rounded-full bg-white/15 p-1.5 text-white transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/15";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => step(-1)} disabled={edges.start} aria-label={tr("Produit précédent")} className={button}>
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button type="button" onClick={() => step(1)} disabled={edges.end} aria-label={tr("Produit suivant")} className={button}>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

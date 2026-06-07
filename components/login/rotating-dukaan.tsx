"use client";

import { useEffect, useState } from "react";

/** Words that complete: "Run your entire ___ from one dashboard" */
const HERO_ROTATING_WORDS = [
  "Shop",
  "Business",
  "Vyapaar",
  "Store",
  "Retail",
  "Trade",
  "Kirana",
  "Outlet",
] as const;

const TYPE_MS = 90;
const DELETE_MS = 55;
const HOLD_MS = 2000;
const PAUSE_BETWEEN_WORDS_MS = 180;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function RotatingDukaan() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState<string>(HERO_ROTATING_WORDS[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  const target = HERO_ROTATING_WORDS[wordIndex];

  useEffect(() => {
    if (prefersReducedMotion()) {
      const interval = setInterval(() => {
        setWordIndex((i) => {
          const next = (i + 1) % HERO_ROTATING_WORDS.length;
          setDisplayed(HERO_ROTATING_WORDS[next]);
          return next;
        });
      }, 3000);
      return () => clearInterval(interval);
    }

    const targetChars = Array.from(target);

    if (!isDeleting && displayed === target) {
      const hold = setTimeout(() => setIsDeleting(true), HOLD_MS);
      return () => clearTimeout(hold);
    }

    if (isDeleting) {
      if (displayed.length === 0) {
        const pause = setTimeout(() => {
          setWordIndex((i) => (i + 1) % HERO_ROTATING_WORDS.length);
          setIsDeleting(false);
        }, PAUSE_BETWEEN_WORDS_MS);
        return () => clearTimeout(pause);
      }

      const tick = setTimeout(() => {
        setDisplayed((current) => Array.from(current).slice(0, -1).join(""));
      }, DELETE_MS);
      return () => clearTimeout(tick);
    }

    if (displayed !== target) {
      const tick = setTimeout(() => {
        const nextLength = Array.from(displayed).length + 1;
        setDisplayed(targetChars.slice(0, nextLength).join(""));
      }, TYPE_MS);
      return () => clearTimeout(tick);
    }
  }, [displayed, isDeleting, target]);

  return (
    <span className="vyapaar-word-slot" aria-live="polite" aria-atomic="true">
      <span className="dukaan-word font-bold">
        {displayed}
        <span className="dukaan-type-cursor" aria-hidden>
          |
        </span>
      </span>
    </span>
  );
}

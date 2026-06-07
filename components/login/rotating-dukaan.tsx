"use client";

import { useEffect, useState } from "react";

const MAHAJAAN_WORDS = [
  { lang: "en", text: "Mahajaan" },
  { lang: "hi", text: "महाजन" },
  { lang: "gu", text: "મહાજન" },
  { lang: "mr", text: "महाजन" },
  { lang: "pa", text: "ਮਹਾਜਨ" },
  { lang: "ta", text: "மகாஜன்" },
  { lang: "te", text: "మహాజన్" },
  { lang: "ml", text: "മഹാജൻ" },
  { lang: "ur", text: "مہاجن" },
] as const;

const LANG_FONT: Record<(typeof MAHAJAAN_WORDS)[number]["lang"], string> = {
  en: "var(--font-geist-sans), system-ui, sans-serif",
  hi: "var(--font-dukaan-deva), sans-serif",
  gu: "var(--font-dukaan-gu), sans-serif",
  mr: "var(--font-dukaan-deva), sans-serif",
  pa: "var(--font-dukaan-pa), sans-serif",
  ta: "var(--font-dukaan-ta), sans-serif",
  te: "var(--font-dukaan-te), sans-serif",
  ml: "var(--font-dukaan-ml), sans-serif",
  ur: "var(--font-dukaan-ur), sans-serif",
};

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
  const [displayed, setDisplayed] = useState<string>(MAHAJAAN_WORDS[0].text);
  const [isDeleting, setIsDeleting] = useState(false);

  const word = MAHAJAAN_WORDS[wordIndex];
  const target = word.text;

  useEffect(() => {
    if (prefersReducedMotion()) {
      const interval = setInterval(() => {
        setWordIndex((i) => {
          const next = (i + 1) % MAHAJAAN_WORDS.length;
          setDisplayed(MAHAJAAN_WORDS[next].text);
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
          setWordIndex((i) => (i + 1) % MAHAJAAN_WORDS.length);
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
      <span
        className="dukaan-word font-bold"
        style={{ fontFamily: LANG_FONT[word.lang] }}
        lang={word.lang}
      >
        {displayed}
        <span className="dukaan-type-cursor" aria-hidden>
          |
        </span>
      </span>
    </span>
  );
}

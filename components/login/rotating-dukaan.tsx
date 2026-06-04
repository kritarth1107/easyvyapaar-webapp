"use client";

import { useEffect, useState } from "react";

const VYAPAAR_WORDS = [
  { lang: "en", text: "Vyapaar" },
  { lang: "hi", text: "व्यापार" },
  { lang: "gu", text: "વ્યાપાર" },
  { lang: "mr", text: "व्यापार" },
  { lang: "pa", text: "ਵਿਆਪਾਰ" },
  { lang: "ta", text: "வியாபாரம்" },
  { lang: "te", text: "వ్యాపారం" },
  { lang: "ml", text: "വ്യാപാരം" },
  { lang: "ur", text: "ویاپار" },
] as const;

const LANG_FONT: Record<(typeof VYAPAAR_WORDS)[number]["lang"], string> = {
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
  const [displayed, setDisplayed] = useState<string>(VYAPAAR_WORDS[0].text);
  const [isDeleting, setIsDeleting] = useState(false);

  const word = VYAPAAR_WORDS[wordIndex];
  const target = word.text;

  useEffect(() => {
    if (prefersReducedMotion()) {
      const interval = setInterval(() => {
        setWordIndex((i) => {
          const next = (i + 1) % VYAPAAR_WORDS.length;
          setDisplayed(VYAPAAR_WORDS[next].text);
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
          setWordIndex((i) => (i + 1) % VYAPAAR_WORDS.length);
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

"use client";

import { useEffect, useRef } from "react";

const HIDE_DELAY_MS = 700;
const ACTIVE_CLASS = "scrollbar-brand--active";

/**
 * Hides scrollbar until the user hovers or scrolls the element.
 */
export function useScrollbarAutohide<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const show = () => {
      el.classList.add(ACTIVE_CLASS);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        el.classList.remove(ACTIVE_CLASS);
      }, HIDE_DELAY_MS);
    };

    el.addEventListener("scroll", show, { passive: true });

    return () => {
      el.removeEventListener("scroll", show);
      if (hideTimer) clearTimeout(hideTimer);
      el.classList.remove(ACTIVE_CLASS);
    };
  }, []);

  return ref;
}

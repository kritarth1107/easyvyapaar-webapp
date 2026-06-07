"use client";

import { useEffect, useState } from "react";

/** Viewports at or below Tailwind `lg` (1023px) — phones and tablets. */
const MOBILE_TABLET_QUERY = "(max-width: 1023px)";

export function useIsMobileOrTablet(): boolean | null {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_TABLET_QUERY);
    const update = () => setIsMobileOrTablet(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobileOrTablet;
}

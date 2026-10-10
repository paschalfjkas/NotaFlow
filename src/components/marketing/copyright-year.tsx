"use client";

import { useEffect, useState } from "react";

const BUILD_YEAR = 2026;

/**
 * Renders the current year, read after mount so the non-deterministic
 * `new Date()` call never runs during Next.js's static prerender (Cache
 * Components rejects reading it directly in the render body of either a
 * server or client component).
 */
export function CopyrightYear() {
  const [year, setYear] = useState(BUILD_YEAR);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate one-time read of the current year on mount, required to keep this out of the prerendered shell.
    setYear(new Date().getFullYear());
  }, []);
  return <>{year}</>;
}

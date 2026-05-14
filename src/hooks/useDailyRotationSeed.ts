import { useEffect, useState } from "react";
import { getCurrentRotationSeed } from "@/data/articles";

/**
 * Returns the current daily rotation seed and forces a re-render at the
 * next LOCAL midnight, so the article bundle visibly rotates each day even
 * if the app stays open or is restored from cache. Also re-syncs when the
 * tab becomes visible again (e.g. user opens the app the next morning).
 */
export function useDailyRotationSeed(): number {
  const [seed, setSeed] = useState(() => getCurrentRotationSeed());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const scheduleNextMidnight = () => {
      const now = new Date();
      const next = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        5, // small buffer past midnight
      );
      const ms = Math.max(1000, next.getTime() - now.getTime());
      timer = setTimeout(() => {
        setSeed(getCurrentRotationSeed());
        scheduleNextMidnight();
      }, ms);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setSeed(getCurrentRotationSeed());
      }
    };

    scheduleNextMidnight();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, []);

  return seed;
}

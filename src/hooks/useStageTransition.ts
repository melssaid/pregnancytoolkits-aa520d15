/**
 * useStageTransition — Detects when the user's `journeyStage` shifts
 * (fertility → pregnant → postpartum, or any direction) and exposes
 * the most recent transition so a celebratory sheet can appear once.
 *
 * The hook persists the last-seen stage in localStorage so the sheet
 * shows exactly once per real transition, even across reloads. We
 * intentionally never trigger on first-ever mount when there is no
 * prior recorded stage — only on actual changes.
 */
import { useEffect, useState, useCallback } from "react";
import { useUserProfile, type JourneyStage } from "@/hooks/useUserProfile";

const LAST_STAGE_KEY = "journey_last_seen_stage_v1";

export interface StageTransition {
  from: JourneyStage;
  to: JourneyStage;
  at: string;
}

export function useStageTransition() {
  const { profile } = useUserProfile();
  const [transition, setTransition] = useState<StageTransition | null>(null);

  useEffect(() => {
    let prev: JourneyStage | null = null;
    try {
      prev = localStorage.getItem(LAST_STAGE_KEY) as JourneyStage | null;
    } catch {}

    const current = profile.journeyStage;
    if (!prev) {
      // First ever mount → just record, don't celebrate.
      try { localStorage.setItem(LAST_STAGE_KEY, current); } catch {}
      return;
    }
    if (prev !== current) {
      setTransition({ from: prev, to: current, at: new Date().toISOString() });
      try { localStorage.setItem(LAST_STAGE_KEY, current); } catch {}
    }
  }, [profile.journeyStage]);

  const dismiss = useCallback(() => setTransition(null), []);

  return { transition, dismiss };
}

/**
 * useJourneyDateChangeLog
 *
 * Tracks changes to key journey dates (`dueDate`, `birthDate`,
 * `lastPeriodDate`) in a small append-only log persisted to
 * localStorage. The log is read by `JourneyDateChangeLog` to show the
 * user a concise audit trail — what changed, from what, to what, and
 * how long ago.
 *
 * Design notes:
 *   • Append-only, capped to MAX_ENTRIES so storage stays bounded.
 *   • Records the *change* only — no entry is added on first set
 *     when the previous value was already empty, to avoid noise.
 *     Wait — we DO record first-time entries because they are
 *     meaningful milestones; we just mark `previous` as null.
 *   • Pure local storage; no network/cloud sync (per privacy policy).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { safeParseLocalStorage, safeSaveToLocalStorage } from "@/lib/safeStorage";
import { useUserProfile } from "@/hooks/useUserProfile";

export type JourneyDateField = "dueDate" | "birthDate" | "lastPeriodDate";

export interface JourneyDateChangeEntry {
  /** Stable id for React keys / future deletions. */
  id: string;
  /** Which date field was modified. */
  field: JourneyDateField;
  /** Previous ISO date value (null for first-time set). */
  previous: string | null;
  /** New ISO date value (null when cleared). */
  next: string | null;
  /** When the change was recorded. */
  changedAt: string;
}

const STORAGE_KEY = "journey_date_change_log_v1";
const MAX_ENTRIES = 25;

function readLog(): JourneyDateChangeEntry[] {
  return safeParseLocalStorage<JourneyDateChangeEntry[]>(STORAGE_KEY, []);
}

function writeLog(entries: JourneyDateChangeEntry[]) {
  // Newest first, capped.
  const trimmed = entries.slice(0, MAX_ENTRIES);
  safeSaveToLocalStorage(STORAGE_KEY, trimmed);
}

export function useJourneyDateChangeLog() {
  const { profile } = useUserProfile();
  const [entries, setEntries] = useState<JourneyDateChangeEntry[]>(() => readLog());

  // Snapshot of last-seen values; seeded once so the first render
  // doesn't generate spurious entries for already-set dates.
  const lastSeen = useRef<Record<JourneyDateField, string | null>>({
    dueDate: profile.dueDate ?? null,
    birthDate: profile.journeyHistory?.postpartum?.birthDate ?? null,
    lastPeriodDate: profile.lastPeriodDate ?? null,
  });
  const seeded = useRef(false);

  useEffect(() => {
    const current: Record<JourneyDateField, string | null> = {
      dueDate: profile.dueDate ?? null,
      birthDate: profile.journeyHistory?.postpartum?.birthDate ?? null,
      lastPeriodDate: profile.lastPeriodDate ?? null,
    };

    if (!seeded.current) {
      lastSeen.current = current;
      seeded.current = true;
      return;
    }

    const additions: JourneyDateChangeEntry[] = [];
    (Object.keys(current) as JourneyDateField[]).forEach((field) => {
      const prev = lastSeen.current[field];
      const next = current[field];
      if (prev === next) return;
      additions.push({
        id: `${field}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        field,
        previous: prev,
        next,
        changedAt: new Date().toISOString(),
      });
    });

    if (additions.length === 0) return;

    lastSeen.current = current;
    setEntries((prev) => {
      const merged = [...additions.reverse(), ...prev].slice(0, MAX_ENTRIES);
      writeLog(merged);
      return merged;
    });
  }, [
    profile.dueDate,
    profile.journeyHistory?.postpartum?.birthDate,
    profile.lastPeriodDate,
  ]);

  const clear = useCallback(() => {
    setEntries([]);
    writeLog([]);
  }, []);

  return { entries, clear };
}

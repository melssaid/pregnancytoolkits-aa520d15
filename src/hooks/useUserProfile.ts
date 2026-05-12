/**
 * Central User Profile Hook
 * Single source of truth for: pregnancy week, weight, last period date, height
 * All tools read from / write to this hook instead of isolated localStorage keys
 */
import { useState, useEffect, useCallback } from "react";
import { safeSaveToLocalStorage, safeParseLocalStorage } from "@/lib/safeStorage";

export type JourneyStage = 'fertility' | 'pregnant' | 'postpartum';

/**
 * Lightweight per-stage memory carried across journey transitions so the
 * user keeps a continuous narrative (e.g. when moving from fertility →
 * pregnancy → postpartum). All fields are optional and additive — older
 * profiles auto-upgrade with an empty `journeyHistory` object.
 */
export interface JourneyHistory {
  fertility?: {
    startedAt?: string;
    longestCycle?: number | null;
    completedAt?: string;
  };
  pregnancy?: {
    startedAt?: string;
    prePregnancyWeight?: number | null;
    dueDate?: string | null;
    completedAt?: string;
  };
  postpartum?: {
    startedAt?: string;
    birthDate?: string;
    babyName?: string | null;
  };
}

export interface UserProfile {
  isPregnant: boolean;
  journeyStage: JourneyStage;
  pregnancyWeek: number;
  weight: number | null;
  prePregnancyWeight: number | null;
  height: number | null;
  lastPeriodDate: string | null;
  dueDate: string | null;
  mood: string;
  bloodType: string | null;
  healthConditions: string[];
  goals: string[];
  /** Per-stage timeline memory; empty by default for older profiles. */
  journeyHistory?: JourneyHistory;
  /**
   * When true (default), the journey stage is auto-derived from data
   * the user enters (e.g. a future `dueDate` → pregnant; a past
   * `birthDate` → postpartum). The user can disable this from the
   * Journey Map to keep manual control.
   */
  autoStageDetection?: boolean;
  updatedAt: string;
}

const PROFILE_KEY = "user_central_profile_v1";
const LEGACY_PROFILE_KEY_PREFIX = "profile_";

const DEFAULT_PROFILE: UserProfile = {
  isPregnant: true,
  journeyStage: 'pregnant',
  pregnancyWeek: 0,
  weight: null,
  prePregnancyWeight: null,
  height: null,
  lastPeriodDate: null,
  dueDate: null,
  mood: "Good",
  bloodType: null,
  healthConditions: [],
  goals: [],
  journeyHistory: {},
  autoStageDetection: true,
  updatedAt: new Date().toISOString(),
};

/** Migrate data from legacy UserProfileService format */
function migrateLegacyProfile(): Partial<UserProfile> {
  try {
    const userId = localStorage.getItem("pregnancy_user_id");
    if (!userId) return {};
    const legacyRaw = localStorage.getItem(`${LEGACY_PROFILE_KEY_PREFIX}${userId}`);
    if (!legacyRaw) return {};
    const legacy = JSON.parse(legacyRaw);
    return {
      pregnancyWeek: legacy.pregnancy_week ?? undefined,
      weight: legacy.weight ? Number(legacy.weight) : undefined,
      mood: legacy.mood ?? undefined,
    };
  } catch {
    return {};
  }
}

/** Compute pregnancy week from last period date */
export function computeWeekFromLMP(lmpDate: string): number {
  const lmp = new Date(lmpDate);
  const now = new Date();
  const diffMs = now.getTime() - lmp.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7);
  return Math.max(1, Math.min(42, week));
}

/** Compute due date from last period date */
export function computeDueDateFromLMP(lmpDate: string): string {
  const lmp = new Date(lmpDate);
  lmp.setDate(lmp.getDate() + 280); // Naegele's rule: LMP + 280 days
  return lmp.toISOString().split("T")[0];
}

const PROFILE_CHANGE_EVENT = "user-profile:changed";

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = safeParseLocalStorage<UserProfile | null>(PROFILE_KEY, null);
    if (saved) return saved;
    // First load: try to migrate from legacy
    const legacy = migrateLegacyProfile();
    return { ...DEFAULT_PROFILE, ...legacy };
  });

  // Persist to localStorage on every change + broadcast to other hook instances
  useEffect(() => {
    safeSaveToLocalStorage(PROFILE_KEY, profile);
    try {
      window.dispatchEvent(
        new CustomEvent(PROFILE_CHANGE_EVENT, { detail: profile })
      );
    } catch {}
  }, [profile]);

  // Listen for updates from other instances of this hook (and other tabs)
  useEffect(() => {
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<UserProfile>).detail;
      if (!next) return;
      setProfile(prev => (prev.updatedAt === next.updatedAt ? prev : next));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PROFILE_KEY || !e.newValue) return;
      try {
        const next = JSON.parse(e.newValue) as UserProfile;
        setProfile(prev => (prev.updatedAt === next.updatedAt ? prev : next));
      } catch {}
    };
    window.addEventListener(PROFILE_CHANGE_EVENT, onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROFILE_CHANGE_EVENT, onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Auto-compute week from LMP if no week overridden
  useEffect(() => {
    if (profile.lastPeriodDate) {
      const computedWeek = computeWeekFromLMP(profile.lastPeriodDate);
      const computedDue = computeDueDateFromLMP(profile.lastPeriodDate);
      // Only update if values actually changed to prevent re-render loops
      setProfile(prev => {
        const nextDue = prev.dueDate ?? computedDue;
        const histDue = prev.journeyHistory?.pregnancy?.dueDate ?? null;
        const dueInSync = histDue === nextDue;
        if (prev.pregnancyWeek === computedWeek && nextDue === prev.dueDate && dueInSync) {
          return prev; // No change — skip update
        }
        return {
          ...prev,
          pregnancyWeek: computedWeek,
          dueDate: nextDue,
          journeyHistory: {
            ...(prev.journeyHistory ?? {}),
            pregnancy: {
              ...(prev.journeyHistory?.pregnancy ?? {}),
              dueDate: nextDue,
            },
          },
        };
      });
    }
   
  }, [profile.lastPeriodDate]);

  /**
   * Daily auto-sync of pregnancy week ↔ lastPeriodDate.
   *
   * - Backfill: if the user is pregnant and has entered a `pregnancyWeek`
   *   but no `lastPeriodDate`, we anchor an LMP at (today − week*7 days)
   *   so the week can advance automatically going forward.
   * - Daily refresh: re-derive the current week from the anchored LMP on
   *   mount, when the tab becomes visible, and once per day via a timer.
   *   This guarantees the displayed week stays accurate even if the app
   *   is left open across midnight.
   */
  useEffect(() => {
    const sync = () => {
      setProfile(prev => {
        // Backfill LMP from a manually-entered week
        if (
          prev.journeyStage === "pregnant" &&
          !prev.lastPeriodDate &&
          prev.pregnancyWeek &&
          prev.pregnancyWeek >= 1 &&
          prev.pregnancyWeek <= 42
        ) {
          const lmp = new Date();
          lmp.setDate(lmp.getDate() - prev.pregnancyWeek * 7);
          const lmpIso = lmp.toISOString().split("T")[0];
          const dueIso = computeDueDateFromLMP(lmpIso);
          return {
            ...prev,
            lastPeriodDate: lmpIso,
            dueDate: prev.dueDate ?? dueIso,
            journeyHistory: {
              ...(prev.journeyHistory ?? {}),
              pregnancy: {
                ...(prev.journeyHistory?.pregnancy ?? {}),
                dueDate: prev.dueDate ?? dueIso,
              },
            },
          };
        }
        // Daily refresh of week from existing LMP
        if (prev.lastPeriodDate) {
          const week = computeWeekFromLMP(prev.lastPeriodDate);
          if (week !== prev.pregnancyWeek) {
            return { ...prev, pregnancyWeek: week };
          }
        }
        return prev;
      });
    };

    sync();
    const onVisible = () => { if (document.visibilityState === "visible") sync(); };
    document.addEventListener("visibilitychange", onVisible);
    // Re-check every hour — cheap and catches midnight rollover when the
    // tab is left open.
    const interval = window.setInterval(sync, 60 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  // Mirror profile.dueDate → journeyHistory.pregnancy.dueDate so JourneyMap
  // and the Today dashboard always read the same value.
  useEffect(() => {
    if (!profile.dueDate) return;
    if (profile.journeyHistory?.pregnancy?.dueDate === profile.dueDate) return;
    setProfile(prev => ({
      ...prev,
      journeyHistory: {
        ...(prev.journeyHistory ?? {}),
        pregnancy: {
          ...(prev.journeyHistory?.pregnancy ?? {}),
          dueDate: prev.dueDate,
        },
      },
    }));
  }, [profile.dueDate, profile.journeyHistory?.pregnancy?.dueDate]);

  /**
   * Smart stage auto-detection.
   *
   * Heuristic (only runs when `autoStageDetection !== false`):
   *   • postpartum.birthDate in the past → `postpartum`
   *   • pregnancy.dueDate in the future (or LMP set) → `pregnant`
   *   • otherwise leave the existing stage untouched
   *
   * We never *downgrade* postpartum back to pregnant automatically,
   * since a recorded birthDate is a strong, irreversible signal.
   * History timestamps are seeded so the timeline stays accurate.
   */
  useEffect(() => {
    if (profile.autoStageDetection === false) return;

    const now = Date.now();
    const h = profile.journeyHistory ?? {};
    const birthDateStr = h.postpartum?.birthDate;
    const dueDateStr = h.pregnancy?.dueDate ?? profile.dueDate;

    let nextStage: JourneyStage | null = null;
    if (birthDateStr) {
      const birthMs = new Date(birthDateStr).getTime();
      if (!isNaN(birthMs) && birthMs <= now) nextStage = 'postpartum';
    }
    if (!nextStage && dueDateStr) {
      const dueMs = new Date(dueDateStr).getTime();
      if (!isNaN(dueMs) && dueMs > now) nextStage = 'pregnant';
    }
    if (!nextStage && profile.lastPeriodDate) {
      nextStage = 'pregnant';
    }

    if (!nextStage || nextStage === profile.journeyStage) return;
    // Never auto-downgrade postpartum → pregnant
    if (profile.journeyStage === 'postpartum' && nextStage === 'pregnant') return;

    setProfile(prev => {
      if (prev.journeyStage === nextStage) return prev;
      const nowIso = new Date().toISOString();
      const nextHistory: JourneyHistory = { ...(prev.journeyHistory ?? {}) };
      // Mark outgoing
      if (prev.journeyStage === 'fertility' && nextHistory.fertility && !nextHistory.fertility.completedAt) {
        nextHistory.fertility = { ...nextHistory.fertility, completedAt: nowIso };
      } else if (prev.journeyStage === 'pregnant' && nextHistory.pregnancy && !nextHistory.pregnancy.completedAt) {
        nextHistory.pregnancy = { ...nextHistory.pregnancy, completedAt: nowIso };
      }
      // Seed incoming
      if (nextStage === 'pregnant') {
        nextHistory.pregnancy = { startedAt: nowIso, ...(nextHistory.pregnancy ?? {}) };
      } else if (nextStage === 'postpartum') {
        nextHistory.postpartum = { startedAt: nowIso, ...(nextHistory.postpartum ?? {}) };
      }
      return {
        ...prev,
        journeyStage: nextStage!,
        isPregnant: nextStage === 'pregnant',
        journeyHistory: nextHistory,
        updatedAt: nowIso,
      };
    });
  }, [
    profile.autoStageDetection,
    profile.journeyHistory?.postpartum?.birthDate,
    profile.journeyHistory?.pregnancy?.dueDate,
    profile.dueDate,
    profile.lastPeriodDate,
    profile.journeyStage,
  ]);

  const updateProfile = useCallback((updates: Partial<Omit<UserProfile, "updatedAt">>) => {
    setProfile(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setPregnancyWeek = useCallback((week: number) => {
    updateProfile({ pregnancyWeek: Math.max(1, Math.min(42, week)) });
  }, [updateProfile]);

  const setWeight = useCallback((kg: number | null) => {
    updateProfile({ weight: kg });
  }, [updateProfile]);

  const setLastPeriodDate = useCallback((date: string | null) => {
    if (date) {
      const due = computeDueDateFromLMP(date);
      updateProfile({ lastPeriodDate: date, dueDate: due });
    } else {
      updateProfile({ lastPeriodDate: null });
    }
  }, [updateProfile]);

  return {
    profile,
    updateProfile,
    setPregnancyWeek,
    setWeight,
    setLastPeriodDate,
  };
}

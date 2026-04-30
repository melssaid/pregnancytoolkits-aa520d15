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

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = safeParseLocalStorage<UserProfile | null>(PROFILE_KEY, null);
    if (saved) return saved;
    // First load: try to migrate from legacy
    const legacy = migrateLegacyProfile();
    return { ...DEFAULT_PROFILE, ...legacy };
  });

  // Persist to localStorage on every change
  useEffect(() => {
    safeSaveToLocalStorage(PROFILE_KEY, profile);
  }, [profile]);

  // Auto-compute week from LMP if no week overridden
  useEffect(() => {
    if (profile.lastPeriodDate) {
      const computedWeek = computeWeekFromLMP(profile.lastPeriodDate);
      const computedDue = computeDueDateFromLMP(profile.lastPeriodDate);
      // Only update if values actually changed to prevent re-render loops
      setProfile(prev => {
        if (prev.pregnancyWeek === computedWeek && (prev.dueDate || computedDue) === (prev.dueDate ?? computedDue)) {
          return prev; // No change — skip update
        }
        return {
          ...prev,
          pregnancyWeek: computedWeek,
          dueDate: prev.dueDate ?? computedDue,
        };
      });
    }
   
  }, [profile.lastPeriodDate]);

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

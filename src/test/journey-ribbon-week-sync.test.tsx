/**
 * Ribbon + week reactivity tests
 * --------------------------------
 * Validates that the canonical date inputs (`lastPeriodDate`, `dueDate`,
 * `birthDate`) drive two user-visible surfaces correctly:
 *
 *   1. `JourneyProgressRibbon` — the active station (`aria-current="step"`)
 *      lands on fertility / pregnant / postpartum based on the dates.
 *   2. `pregnancyWeek` — auto-derived from LMP via Naegele's rule and
 *      clamped to [1, 42].
 *
 * Because `useUserProfile` is a per-component `useState` store (not a
 * shared context), each scenario seeds the profile through `localStorage`
 * and mounts a fresh tree. This mirrors how the app rehydrates the
 * profile on real navigation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act, waitFor, cleanup } from "@testing-library/react";
import "@/i18n";

import { JourneyProgressRibbon } from "@/components/journey/JourneyProgressRibbon";
import { LanguageProvider } from "@/contexts/LanguageContext";
import {
  useUserProfile,
  computeDueDateFromLMP,
  computeWeekFromLMP,
  type UserProfile,
} from "@/hooks/useUserProfile";

const PROFILE_KEY = "user_central_profile_v1";

const isoDaysFromNow = (days: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
};

const dateOnlyDaysAgo = (days: number) =>
  isoDaysFromNow(-days).split("T")[0];

const baseProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  isPregnant: true,
  journeyStage: "fertility",
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
  ...overrides,
});

const seedProfile = (overrides: Partial<UserProfile>) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(baseProfile(overrides)));
};

/**
 * Tiny probe: subscribes to the same hook the ribbon does, so assertions
 * against `pregnancyWeek` / `journeyStage` describe the exact state the
 * ribbon is rendering against (auto-detection effects flush in the same
 * tick as the ribbon).
 */
function Probe() {
  const { profile } = useUserProfile();
  return (
    <>
      <output data-testid="week">{profile.pregnancyWeek}</output>
      <output data-testid="stage">{profile.journeyStage}</output>
      <output data-testid="due">{profile.dueDate ?? ""}</output>
    </>
  );
}

const mount = () =>
  render(
    <LanguageProvider>
      <JourneyProgressRibbon onStationSelect={() => {}} />
      <Probe />
    </LanguageProvider>,
  );

const getActiveStationStage = (): string | null => {
  const active = document.querySelector('[aria-current="step"]');
  return active?.getAttribute("data-ribbon-station");
};

describe("Journey ribbon + week sync", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("renders the fertility station when the seeded stage is fertility", async () => {
    seedProfile({
      journeyStage: "fertility",
      autoStageDetection: false,
      journeyHistory: { fertility: { startedAt: isoDaysFromNow(-30) } },
    });
    mount();
    await waitFor(() =>
      expect(getActiveStationStage()).toBe("fertility"),
    );
  });

  it("activates the pregnant station and computes week from a recorded LMP", async () => {
    const lmp = "2025-01-01";
    seedProfile({ lastPeriodDate: lmp, journeyStage: "fertility" });
    mount();

    // Auto-effects in useUserProfile compute week + due, then auto-detect
    // upgrades to pregnant.
    await waitFor(() => {
      expect(screen.getByTestId("stage").textContent).toBe("pregnant");
      expect(getActiveStationStage()).toBe("pregnant");
    });

    expect(screen.getByTestId("week").textContent).toBe(
      String(computeWeekFromLMP(lmp)),
    );
    expect(screen.getByTestId("due").textContent).toBe(
      computeDueDateFromLMP(lmp),
    );
  });

  it("activates the pregnant station when only a future dueDate is set", async () => {
    seedProfile({
      journeyStage: "fertility",
      dueDate: isoDaysFromNow(120),
    });
    mount();
    await waitFor(() => expect(getActiveStationStage()).toBe("pregnant"));
  });

  it("activates the postpartum station when a past birthDate is recorded", async () => {
    seedProfile({
      journeyStage: "pregnant",
      dueDate: isoDaysFromNow(-7),
      journeyHistory: {
        pregnancy: { startedAt: isoDaysFromNow(-280) },
        postpartum: {
          birthDate: isoDaysFromNow(-7),
          startedAt: isoDaysFromNow(-7),
        },
      },
    });
    mount();
    await waitFor(() => {
      expect(screen.getByTestId("stage").textContent).toBe("postpartum");
      expect(getActiveStationStage()).toBe("postpartum");
    });
  });

  it("clamps pregnancyWeek to 42 when LMP is far in the past", async () => {
    seedProfile({
      journeyStage: "pregnant",
      lastPeriodDate: dateOnlyDaysAgo(365 * 2),
    });
    mount();
    await waitFor(() =>
      expect(screen.getByTestId("week").textContent).toBe("42"),
    );
  });

  it("never auto-downgrades postpartum back to pregnant when a future dueDate is also present", async () => {
    seedProfile({
      journeyStage: "postpartum",
      dueDate: isoDaysFromNow(60), // illogical but possible
      journeyHistory: {
        postpartum: {
          birthDate: isoDaysFromNow(-3),
          startedAt: isoDaysFromNow(-3),
        },
      },
    });
    mount();

    // Give the auto-detect effect every chance to run.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("stage").textContent).toBe("postpartum");
    expect(getActiveStationStage()).toBe("postpartum");
  });
});

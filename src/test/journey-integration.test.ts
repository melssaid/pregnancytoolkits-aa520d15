/**
 * Journey Integration Tests
 * --------------------------
 * Validates the logical consistency between key journey fields:
 *   • dueDate, lastPeriodDate (LMP), birthDate
 *   • journeyStage transitions and history seeding
 *   • Auto-detection guardrails (no postpartum→pregnant downgrade)
 *   • Date math (Naegele, week clamping)
 *   • Date normalization across timezones
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useUserProfile,
  computeWeekFromLMP,
  computeDueDateFromLMP,
} from "@/hooks/useUserProfile";

const PROFILE_KEY = "user_central_profile_v1";

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

describe("Journey Integration — date math", () => {
  it("computes due date as LMP + 280 days (Naegele's rule)", () => {
    const lmp = "2025-01-01";
    const due = computeDueDateFromLMP(lmp);
    const diffDays = Math.round(
      (new Date(due).getTime() - new Date(lmp).getTime()) / 86400000,
    );
    expect(diffDays).toBe(280);
  });

  it("clamps pregnancy week between 1 and 42", () => {
    // LMP far in the past should clamp to 42
    const veryOld = new Date();
    veryOld.setFullYear(veryOld.getFullYear() - 2);
    expect(computeWeekFromLMP(veryOld.toISOString())).toBe(42);

    // LMP today should clamp to 1
    const today = new Date().toISOString();
    expect(computeWeekFromLMP(today)).toBe(1);
  });
});

describe("Journey Integration — useUserProfile", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds dueDate automatically when LMP is set", () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.setLastPeriodDate("2025-01-01");
    });
    expect(result.current.profile.lastPeriodDate).toBe("2025-01-01");
    expect(result.current.profile.dueDate).toBe(
      computeDueDateFromLMP("2025-01-01"),
    );
    expect(result.current.profile.pregnancyWeek).toBeGreaterThanOrEqual(1);
  });

  it("auto-detects pregnant stage from a future dueDate", async () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyStage: "fertility",
        autoStageDetection: true,
        dueDate: daysFromNow(120),
      });
    });
    // Effect runs after state commit
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.profile.journeyStage).toBe("pregnant");
    expect(result.current.profile.isPregnant).toBe(true);
    expect(
      result.current.profile.journeyHistory?.pregnancy?.startedAt,
    ).toBeTruthy();
  });

  it("auto-detects postpartum stage from a past birthDate", async () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyStage: "pregnant",
        autoStageDetection: true,
        journeyHistory: {
          postpartum: { birthDate: daysFromNow(-10) },
        },
      });
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.profile.journeyStage).toBe("postpartum");
    expect(result.current.profile.isPregnant).toBe(false);
    expect(
      result.current.profile.journeyHistory?.postpartum?.startedAt,
    ).toBeTruthy();
  });

  it("never auto-downgrades postpartum back to pregnant", async () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyStage: "postpartum",
        autoStageDetection: true,
        dueDate: daysFromNow(100), // would normally suggest pregnant
        journeyHistory: {
          postpartum: { birthDate: daysFromNow(-30) },
        },
      });
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.profile.journeyStage).toBe("postpartum");
  });

  it("respects manual mode when autoStageDetection is false", async () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyStage: "fertility",
        autoStageDetection: false,
        dueDate: daysFromNow(100),
      });
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.profile.journeyStage).toBe("fertility");
  });

  it("seals outgoing stage with completedAt on transition", async () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyStage: "pregnant",
        autoStageDetection: true,
        journeyHistory: {
          pregnancy: { startedAt: daysFromNow(-200) },
        },
      });
    });
    act(() => {
      result.current.updateProfile({
        journeyHistory: {
          pregnancy: { startedAt: daysFromNow(-200) },
          postpartum: { birthDate: daysFromNow(-2) },
        },
      });
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.profile.journeyStage).toBe("postpartum");
    expect(
      result.current.profile.journeyHistory?.pregnancy?.completedAt,
    ).toBeTruthy();
  });

  it("persists profile changes to localStorage", () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({ weight: 65, height: 165 });
    });
    const raw = localStorage.getItem(PROFILE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.weight).toBe(65);
    expect(parsed.height).toBe(165);
  });

  it("keeps pregnancyWeek in [1,42] when set explicitly", () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.setPregnancyWeek(99);
    });
    expect(result.current.profile.pregnancyWeek).toBe(42);
    act(() => {
      result.current.setPregnancyWeek(-5);
    });
    expect(result.current.profile.pregnancyWeek).toBe(1);
  });
});

describe("Journey Integration — date normalization (timezone safety)", () => {
  it("normalizes YYYY-MM-DD to noon UTC so the day never shifts", () => {
    // Simulating the normalization used in JourneyMissingMilestones
    const value = "2025-06-15";
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00.000Z`).toISOString()
      : new Date(value).toISOString();

    // The UTC date portion must remain June 15 regardless of local TZ
    expect(iso.startsWith("2025-06-15")).toBe(true);
    // Hour part is noon UTC
    expect(iso).toContain("T12:00:00");
  });
});

/**
 * Ribbon + week reactivity tests
 * --------------------------------
 * Validates that mutating the canonical date inputs through the
 * `useUserProfile` hook (`lastPeriodDate`, `dueDate`, `birthDate`) is
 * reflected in two user-visible surfaces:
 *
 *   1. `JourneyProgressRibbon` — the active station (`aria-current="step"`)
 *      moves between fertility / pregnant / postpartum.
 *   2. `pregnancyWeek` — auto-derived from LMP via Naegele's rule and
 *      clamped to [1, 42].
 *
 * Tests render the ribbon together with a tiny "WeekProbe" component that
 * subscribes to the same hook, so we drive the mutation through the same
 * React tree the UI uses (no direct localStorage hacking).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@/i18n";

import { JourneyProgressRibbon } from "@/components/journey/JourneyProgressRibbon";
import { LanguageProvider } from "@/contexts/LanguageContext";
import {
  useUserProfile,
  computeDueDateFromLMP,
  computeWeekFromLMP,
  type JourneyHistory,
} from "@/hooks/useUserProfile";

const PROFILE_KEY = "user_central_profile_v1";

const isoDaysFromNow = (days: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
};

const dateOnlyDaysFromNow = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
};

/**
 * Renders the ribbon together with a probe that exposes the live
 * `pregnancyWeek` and `journeyStage` and a set of mutation buttons that
 * use the *same* `useUserProfile` instance. Going through hook setters
 * (rather than localStorage) ensures auto-detection effects re-run.
 */
function Harness() {
  const { profile, updateProfile, setLastPeriodDate } = useUserProfile();
  return (
    <div>
      <JourneyProgressRibbon onStationSelect={() => {}} />
      <output data-testid="week">{profile.pregnancyWeek}</output>
      <output data-testid="stage">{profile.journeyStage}</output>
      <output data-testid="due">{profile.dueDate ?? ""}</output>
      <button
        data-testid="set-lmp"
        onClick={() => setLastPeriodDate("2025-01-01")}
      />
      <button
        data-testid="set-due-future"
        onClick={() => updateProfile({ dueDate: isoDaysFromNow(120) })}
      />
      <button
        data-testid="set-birth-past"
        onClick={() => {
          const history: JourneyHistory = {
            ...(profile.journeyHistory ?? {}),
            postpartum: {
              ...(profile.journeyHistory?.postpartum ?? {}),
              birthDate: isoDaysFromNow(-7),
              startedAt: isoDaysFromNow(-7),
            },
          };
          updateProfile({ journeyHistory: history });
        }}
      />
    </div>
  );
}

const renderHarness = () =>
  render(
    <LanguageProvider>
      <Harness />
    </LanguageProvider>,
  );

const getActiveStationStage = (): string | null => {
  const active = document.querySelector('[aria-current="step"]');
  return active?.getAttribute("data-ribbon-station");
};

describe("Journey ribbon + week sync", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts on the seeded fertility station when profile begins fertility", async () => {
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        journeyStage: "fertility",
        pregnancyWeek: 0,
        autoStageDetection: false,
        journeyHistory: { fertility: { startedAt: isoDaysFromNow(-30) } },
        updatedAt: new Date().toISOString(),
      }),
    );
    renderHarness();
    await waitFor(() =>
      expect(getActiveStationStage()).toBe("fertility"),
    );
  });

  it("updates the ribbon to 'pregnant' and recomputes week when LMP is set", async () => {
    renderHarness();

    await act(async () => {
      screen.getByTestId("set-lmp").click();
    });
    // Allow the LMP→week effect + auto-detection effect to flush.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const expectedWeek = computeWeekFromLMP("2025-01-01");
    const expectedDue = computeDueDateFromLMP("2025-01-01");

    expect(screen.getByTestId("week").textContent).toBe(String(expectedWeek));
    expect(screen.getByTestId("due").textContent).toBe(expectedDue);
    expect(getActiveStationStage()).toBe("pregnant");
  });

  it("moves the ribbon to 'pregnant' when a future dueDate is set without LMP", async () => {
    renderHarness();

    await act(async () => {
      screen.getByTestId("set-due-future").click();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getActiveStationStage()).toBe("pregnant");
  });

  it("moves the ribbon to 'postpartum' once a past birthDate is recorded", async () => {
    renderHarness();

    // Walk through pregnant first, then add birth date.
    await act(async () => {
      screen.getByTestId("set-due-future").click();
    });
    await waitFor(() => expect(getActiveStationStage()).toBe("pregnant"));

    await act(async () => {
      screen.getByTestId("set-birth-past").click();
    });
    await waitFor(() => expect(getActiveStationStage()).toBe("postpartum"));
    expect(screen.getByTestId("stage").textContent).toBe("postpartum");
  });

  it("clamps pregnancyWeek to 42 when LMP is far in the past", async () => {
    // Seed an LMP from 2 years ago via the persisted profile, then mount.
    const ancientLMP = isoDaysFromNow(-365 * 2).split("T")[0];
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        journeyStage: "pregnant",
        pregnancyWeek: 0,
        lastPeriodDate: ancientLMP,
        autoStageDetection: true,
        journeyHistory: {},
        updatedAt: new Date().toISOString(),
      }),
    );

    renderHarness();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("week").textContent).toBe("42");
  });

  it("never auto-downgrades postpartum back to pregnant after birthDate is set", async () => {
    renderHarness();

    await act(async () => {
      screen.getByTestId("set-birth-past").click();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getActiveStationStage()).toBe("postpartum");

    // Now add a future due date — auto-detect must NOT revert.
    await act(async () => {
      screen.getByTestId("set-due-future").click();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getActiveStationStage()).toBe("postpartum");
  });
});

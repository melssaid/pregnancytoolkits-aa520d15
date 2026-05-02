/**
 * Tests for the diff-aware aria-live announcements emitted by
 * `JourneyMissingMilestones` when validation warnings appear, change, or
 * resolve. We assert that:
 *
 *   • Adding a draft date that triggers a blocking error fires an
 *     ASSERTIVE announcement that names the milestone label and the
 *     "Error" severity.
 *   • A non-blocking warning (e.g. dueDateTooOld) goes to the POLITE
 *     region with the "Warning" severity word.
 *   • Removing/correcting the draft fires a "resolved" announcement
 *     into the polite region.
 *
 * The component renders two `JourneyLiveRegion`s — polite then
 * assertive — so we look them up by `aria-live` value.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@/i18n";

import { JourneyMissingMilestones } from "@/components/journey/JourneyMissingMilestones";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { UserProfile } from "@/hooks/useUserProfile";

const PROFILE_KEY = "user_central_profile_v1";

const isoNoon = (offsetDays: number) => {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString();
};

const dateOnly = (offsetDays: number) => isoNoon(offsetDays).slice(0, 10);

const seed = (overrides: Partial<UserProfile>) => {
  const base: UserProfile = {
    isPregnant: false,
    journeyStage: "pregnant",
    pregnancyWeek: 10,
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
    autoStageDetection: false,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(base));
};

const mount = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <JourneyMissingMilestones />
      </LanguageProvider>
    </MemoryRouter>,
  );

const getRegions = () => {
  const regions = Array.from(
    document.querySelectorAll('[role="status"][aria-live]'),
  ) as HTMLElement[];
  // Polite region is rendered before the assertive one.
  const polite = regions.find((r) => r.getAttribute("aria-live") === "polite")!;
  const assertive = regions.find((r) => r.getAttribute("aria-live") === "assertive")!;
  return { polite, assertive, all: regions };
};

const setDraft = (label: RegExp, value: string) => {
  const input = screen.getByLabelText(label) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
};

describe("JourneyMissingMilestones — aria-live warning announcements", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it("renders both polite and assertive live regions", async () => {
    seed({
      journeyStage: "postpartum",
      journeyHistory: { postpartum: { startedAt: isoNoon(-5) } },
    });
    mount();
    await waitFor(() => {
      const { polite, assertive } = getRegions();
      expect(polite).toBeInTheDocument();
      expect(assertive).toBeInTheDocument();
    });
  });

  it("announces blocking errors assertively with milestone label + 'Error'", async () => {
    // Missing postpartum.birthDate — input a future date to trigger the
    // 'future' error.
    seed({
      journeyStage: "postpartum",
      journeyHistory: { postpartum: { startedAt: isoNoon(-5) } },
    });
    mount();

    await act(async () => {
      setDraft(/birth/i, dateOnly(7));
    });

    await waitFor(() => {
      const { assertive } = getRegions();
      const txt = assertive.textContent ?? "";
      expect(txt.toLowerCase()).toContain("error");
      // Milestone label should be quoted in the message.
      expect(txt.toLowerCase()).toMatch(/birth/);
    });
  });

  it("routes non-blocking warnings to the polite region with 'Warning'", async () => {
    // Missing pregnancy.dueDate — set a date >14 days in the past while
    // stage=pregnant → triggers the soft `dueDateTooOld` hint.
    seed({ journeyStage: "pregnant" });
    mount();

    await act(async () => {
      setDraft(/due date/i, dateOnly(-30));
    });

    await waitFor(() => {
      const { polite, assertive } = getRegions();
      const politeTxt = (polite.textContent ?? "").toLowerCase();
      expect(politeTxt).toContain("warning");
      expect(politeTxt).toMatch(/due/);
      // The error region should not have escalated this hint.
      expect((assertive.textContent ?? "").toLowerCase()).not.toContain(
        "warning",
      );
    });
  });

  it("announces a 'resolved' message politely once a warning clears", async () => {
    seed({ journeyStage: "pregnant" });
    mount();

    // First, trigger the soft warning.
    await act(async () => {
      setDraft(/due date/i, dateOnly(-30));
    });
    await waitFor(() =>
      expect(getRegions().polite.textContent?.toLowerCase()).toContain("warning"),
    );

    // Then clear it by entering a valid future due date.
    await act(async () => {
      setDraft(/due date/i, dateOnly(60));
    });

    await waitFor(() => {
      const txt = (getRegions().polite.textContent ?? "").toLowerCase();
      expect(txt).toMatch(/resolved|résolu|resuelto|behoben|giderildi|تم حل/);
      expect(txt).toMatch(/due/);
    });
  });
});

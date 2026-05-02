/**
 * Journey aria-live announcement tests
 * ------------------------------------
 * Verifies that the shared `JourneyLiveRegion` + `useJourneyLiveAnnouncer`
 * primitive, and its consumers (JourneyTimeline, JourneyAutoDetectToggle),
 * announce *specific* changes correctly:
 *
 *   • Adding a new milestone date  → "<label> (<stage>) added on <date>."
 *   • Removing a milestone date    → "<label> (<stage>) recorded on <date> was removed."
 *   • Editing a milestone date     → "<label> (<stage>) changed from <old> to <new>."
 *   • Changing the current stage   → "Current stage changed from <a> to <b>."
 *   • Bulk changes (>3)            → falls back to a count summary.
 *   • Auto-detect toggle           → "Smart stage detection turned on/off."
 *
 * The cache-busting suffix (zero-width space + timestamp) used to force
 * screen-reader replays must be stripped from the visible textContent so
 * users only hear the meaningful sentence.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@/i18n"; // initialise i18next once for the whole test file

import {
  JourneyLiveRegion,
  useJourneyLiveAnnouncer,
} from "@/components/journey/JourneyLiveRegion";
import { JourneyTimeline } from "@/components/journey/JourneyTimeline";
import { JourneyAutoDetectToggle } from "@/components/journey/JourneyAutoDetectToggle";
import { useUserProfile } from "@/hooks/useUserProfile";
import { renderHook } from "@testing-library/react";
import { LanguageProvider } from "@/contexts/LanguageContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

const PROFILE_KEY = "user_central_profile_v1";

function getLiveRegion(container: HTMLElement): HTMLElement {
  const region = container.querySelector('[role="status"][aria-live]');
  if (!region) throw new Error("Live region not found");
  return region as HTMLElement;
}

/** Wait for React effects + microtasks so the live region picks up updates. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

// ---------------------------------------------------------------------------
// 1. Shared primitive — politeness, atomicity, and suffix stripping.
// ---------------------------------------------------------------------------
describe("JourneyLiveRegion primitive", () => {
  function Harness({ initial }: { initial: string }) {
    const { announce, message } = useJourneyLiveAnnouncer();
    return (
      <>
        <button onClick={() => announce(initial)}>announce</button>
        <button onClick={() => announce("")}>clear</button>
        <JourneyLiveRegion message={message} />
      </>
    );
  }

  it("renders a polite, atomic, sr-only status region", () => {
    const { container } = render(<JourneyLiveRegion message="" />);
    const region = getLiveRegion(container);
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.getAttribute("aria-atomic")).toBe("true");
    expect(region.getAttribute("role")).toBe("status");
    expect(region.className).toContain("sr-only");
  });

  it("upgrades to assertive when requested", () => {
    const { container } = render(
      <JourneyLiveRegion message="urgent" assertive />,
    );
    expect(getLiveRegion(container).getAttribute("aria-live")).toBe(
      "assertive",
    );
  });

  it("strips the cache-busting suffix from the visible textContent", () => {
    const raw = `Hello world \u200B${Date.now()}`;
    const { container } = render(<JourneyLiveRegion message={raw} />);
    expect(getLiveRegion(container).textContent).toBe("Hello world");
  });

  it("re-announces identical messages by mutating the suffix", () => {
    const { result } = renderHook(() => useJourneyLiveAnnouncer());
    act(() => result.current.announce("Same message"));
    const first = result.current.message;
    act(() => result.current.announce("Same message"));
    const second = result.current.message;
    expect(first).not.toBe(second);
    // Visible text must remain identical for the user.
    const strip = (s: string) => s.replace(/\s\u200B\d+$/, "");
    expect(strip(first)).toBe(strip(second));
  });

  it("clearing the announcer empties the region", () => {
    const { result } = renderHook(() => useJourneyLiveAnnouncer());
    act(() => result.current.announce("Hi"));
    expect(result.current.message).not.toBe("");
    act(() => result.current.announce(""));
    expect(result.current.message).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 2. JourneyTimeline diff announcements.
// ---------------------------------------------------------------------------
describe("JourneyTimeline aria-live diffs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Helper: seed the central profile *before* mounting the timeline so the
   * very first render establishes a baseline silently. Subsequent updates
   * via `updateProfile` should then trigger announcements.
   */
  function seedProfile(history: Record<string, unknown>) {
    const profile = {
      isPregnant: true,
      journeyStage: "pregnant",
      pregnancyWeek: 12,
      weight: null,
      prePregnancyWeight: null,
      height: null,
      lastPeriodDate: null,
      dueDate: null,
      mood: "Good",
      bloodType: null,
      healthConditions: [],
      goals: [],
      journeyHistory: history,
      autoStageDetection: false, // keep manual to avoid stage drift in tests
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  it("announces a newly added milestone naming label, stage and date", async () => {
    seedProfile({
      pregnancy: { startedAt: "2025-01-01T12:00:00.000Z" },
    });
    const { container } = render(<JourneyTimeline />, { wrapper });
    await flush();

    // Add a due date through the central profile.
    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyHistory: {
          pregnancy: {
            startedAt: "2025-01-01T12:00:00.000Z",
            dueDate: "2025-10-08T12:00:00.000Z",
          },
        },
      });
    });
    await flush();

    const text = getLiveRegion(container).textContent ?? "";
    // English bundle words for "Due date" + "Pregnancy" + the formatted date.
    expect(text.toLowerCase()).toContain("added on");
    expect(text.toLowerCase()).toMatch(/due/);
    // The 2025 year confirms the actual date was interpolated, not a placeholder.
    expect(text).toContain("2025");
  });

  it("announces a removed milestone with the date it had", async () => {
    seedProfile({
      pregnancy: {
        startedAt: "2025-01-01T12:00:00.000Z",
        dueDate: "2025-10-08T12:00:00.000Z",
      },
    });
    const { container } = render(<JourneyTimeline />, { wrapper });
    await flush();

    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyHistory: {
          pregnancy: { startedAt: "2025-01-01T12:00:00.000Z" }, // dueDate removed
        },
      });
    });
    await flush();

    const text = getLiveRegion(container).textContent ?? "";
    expect(text.toLowerCase()).toContain("removed");
    // Should still mention the original date so the user knows *what* was removed.
    expect(text).toContain("2025");
  });

  it("announces an edited milestone with both old and new dates", async () => {
    seedProfile({
      pregnancy: {
        startedAt: "2025-01-01T12:00:00.000Z",
        dueDate: "2025-10-08T12:00:00.000Z",
      },
    });
    const { container } = render(<JourneyTimeline />, { wrapper });
    await flush();

    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyHistory: {
          pregnancy: {
            startedAt: "2025-01-01T12:00:00.000Z",
            dueDate: "2025-11-15T12:00:00.000Z",
          },
        },
      });
    });
    await flush();

    const text = getLiveRegion(container).textContent ?? "";
    expect(text.toLowerCase()).toContain("changed from");
    expect(text.toLowerCase()).toContain("to");
    // Both years/months should be mentioned.
    expect(text).toContain("2025");
    expect(text.toLowerCase()).toMatch(/oct|nov/);
  });

  it("announces a stage change naming both source and target stage", async () => {
    seedProfile({
      pregnancy: { startedAt: "2025-01-01T12:00:00.000Z" },
    });
    const { container } = render(<JourneyTimeline />, { wrapper });
    await flush();

    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({ journeyStage: "postpartum" });
    });
    await flush();

    const text = getLiveRegion(container).textContent ?? "";
    expect(text.toLowerCase()).toMatch(/stage|current/);
    // Mentions both stage names (not just the count of changes).
    expect(text.toLowerCase()).toMatch(/pregnan/);
    expect(text.toLowerCase()).toMatch(/postpartum/);
  });

  it("falls back to a count summary when more than 3 items change at once", async () => {
    seedProfile({});
    const { container } = render(<JourneyTimeline />, { wrapper });
    await flush();

    const { result } = renderHook(() => useUserProfile());
    act(() => {
      result.current.updateProfile({
        journeyHistory: {
          fertility: {
            startedAt: "2024-01-01T12:00:00.000Z",
            completedAt: "2024-06-01T12:00:00.000Z",
          },
          pregnancy: {
            startedAt: "2024-06-15T12:00:00.000Z",
            dueDate: "2025-03-22T12:00:00.000Z",
          },
          postpartum: {
            startedAt: "2025-03-23T12:00:00.000Z",
            birthDate: "2025-03-22T12:00:00.000Z",
          },
        },
      });
    });
    await flush();

    const text = getLiveRegion(container).textContent ?? "";
    // Should mention an aggregate count rather than enumerate each change.
    expect(text.toLowerCase()).toMatch(/\d+\s+timeline items? updated|updated/);
    // No date strings expected in the summary form.
    expect(text.toLowerCase()).not.toContain("added on");
  });

  it("does not announce anything on the very first render (baseline)", async () => {
    seedProfile({
      pregnancy: { startedAt: "2025-01-01T12:00:00.000Z" },
    });
    const { container } = render(<JourneyTimeline />, { wrapper });
    await flush();
    expect(getLiveRegion(container).textContent ?? "").toBe("");
  });
});

// ---------------------------------------------------------------------------
// 3. JourneyAutoDetectToggle aria-live announcements.
// ---------------------------------------------------------------------------
describe("JourneyAutoDetectToggle aria-live", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("announces 'turned on' / 'turned off' when toggled", async () => {
    const { container } = render(<JourneyAutoDetectToggle />, { wrapper });
    const switchEl = screen.getByRole("switch");

    // Switch starts ON by default → click turns it OFF.
    act(() => {
      switchEl.click();
    });
    await flush();
    let text = getLiveRegion(container).textContent ?? "";
    expect(text.toLowerCase()).toContain("turned off");

    // Toggle back ON.
    act(() => {
      switchEl.click();
    });
    await flush();
    text = getLiveRegion(container).textContent ?? "";
    expect(text.toLowerCase()).toContain("turned on");
  });
});

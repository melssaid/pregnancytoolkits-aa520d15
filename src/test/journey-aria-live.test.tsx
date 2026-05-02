/**
 * Journey aria-live announcement tests
 * ------------------------------------
 * Verifies that:
 *
 *   1. The shared `JourneyLiveRegion` + `useJourneyLiveAnnouncer` primitive
 *      renders a polite, atomic, sr-only region; supports assertive mode;
 *      strips its cache-busting suffix from visible text; and forces a
 *      re-announce when the same message is posted twice.
 *
 *   2. The pure `buildJourneyTimelineAnnouncement` helper used by
 *      `JourneyTimeline` produces *specific* messages naming exactly what
 *      changed for adds, removes, edits, stage changes, and bulk updates.
 *
 *   3. `JourneyAutoDetectToggle` announces "turned on / turned off"
 *      via the same shared primitive when the switch is toggled.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, renderHook, screen, act } from "@testing-library/react";
import "@/i18n"; // initialise i18next once for the whole test file

import {
  JourneyLiveRegion,
  useJourneyLiveAnnouncer,
} from "@/components/journey/JourneyLiveRegion";
import { JourneyAutoDetectToggle } from "@/components/journey/JourneyAutoDetectToggle";
import { LanguageProvider } from "@/contexts/LanguageContext";
import {
  buildJourneyTimelineAnnouncement,
  type AnnouncementPoint,
  DETAIL_CAP,
} from "@/components/journey/buildTimelineAnnouncement";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

function getLiveRegion(container: HTMLElement): HTMLElement {
  const region = container.querySelector('[role="status"][aria-live]');
  if (!region) throw new Error("Live region not found");
  return region as HTMLElement;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

// ---------------------------------------------------------------------------
// 1. Shared primitive — politeness, atomicity, suffix stripping, replay.
// ---------------------------------------------------------------------------
describe("JourneyLiveRegion primitive", () => {
  it("renders a polite, atomic, sr-only status region", () => {
    const { container } = render(<JourneyLiveRegion message="" />);
    const region = getLiveRegion(container);
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.getAttribute("aria-atomic")).toBe("true");
    expect(region.getAttribute("role")).toBe("status");
    expect(region.className).toContain("sr-only");
  });

  it("upgrades to assertive when requested", () => {
    const { container } = render(<JourneyLiveRegion message="urgent" assertive />);
    expect(getLiveRegion(container).getAttribute("aria-live")).toBe("assertive");
  });

  it("strips the cache-busting suffix from visible textContent", () => {
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
// 2. Pure timeline-announcement builder — covers every diff type.
// ---------------------------------------------------------------------------
describe("buildJourneyTimelineAnnouncement", () => {
  // Tiny i18n stub matching the keys we ship in en.json so tests don't
  // depend on the full translation bundle resolution.
  const t = (key: string, vars: Record<string, string | number>): string => {
    switch (key) {
      case "journey.map.srAnnounce.pointAdded":
        return `${vars.label} (${vars.stage}) added on ${vars.date}.`;
      case "journey.map.srAnnounce.pointRemoved":
        return `${vars.label} (${vars.stage}) recorded on ${vars.date} was removed.`;
      case "journey.map.srAnnounce.pointChanged":
        return `${vars.label} (${vars.stage}) changed from ${vars.from} to ${vars.to}.`;
      case "journey.map.srAnnounce.stageChangedFromTo":
        return `Current stage changed from ${vars.from} to ${vars.to}.`;
      case "journey.map.srAnnounce.stageChangedInitial":
        return `Current stage set to ${vars.to}.`;
      case "journey.map.srAnnounce.multipleChanges":
        return `${vars.count} timeline items updated.`;
      default:
        return key;
    }
  };
  const fmt = (iso: string) => iso.split("T")[0]; // deterministic, TZ-safe

  const point = (
    id: string,
    iso: string,
    label = "Due date",
    stage = "Pregnancy",
  ): AnnouncementPoint => ({ id, iso, label, stage });

  it("returns an empty string on the first render baseline (prev=null)", () => {
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: null,
      currentPoints: new Map([["pregnancy-due", point("pregnancy-due", "2025-10-08T12:00:00.000Z")]]),
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe("");
  });

  it("announces a newly added milestone naming label, stage and date", () => {
    const prev = new Map<string, AnnouncementPoint>();
    const cur = new Map([
      ["pregnancy-due", point("pregnancy-due", "2025-10-08T12:00:00.000Z")],
    ]);
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: prev,
      currentPoints: cur,
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe("Due date (Pregnancy) added on 2025-10-08.");
  });

  it("announces a removed milestone with the date it had", () => {
    const prev = new Map([
      ["pregnancy-due", point("pregnancy-due", "2025-10-08T12:00:00.000Z")],
    ]);
    const cur = new Map<string, AnnouncementPoint>();
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: prev,
      currentPoints: cur,
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe(
      "Due date (Pregnancy) recorded on 2025-10-08 was removed.",
    );
  });

  it("announces an edited milestone with both old and new dates", () => {
    const prev = new Map([
      ["pregnancy-due", point("pregnancy-due", "2025-10-08T12:00:00.000Z")],
    ]);
    const cur = new Map([
      ["pregnancy-due", point("pregnancy-due", "2025-11-15T12:00:00.000Z")],
    ]);
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: prev,
      currentPoints: cur,
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe(
      "Due date (Pregnancy) changed from 2025-10-08 to 2025-11-15.",
    );
  });

  it("announces a stage change naming both source and target stage", () => {
    const same = new Map([
      ["pregnancy-start", point("pregnancy-start", "2025-01-01T12:00:00.000Z", "Started", "Pregnancy")],
    ]);
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: same,
      currentPoints: same,
      stageChange: {
        from: "pregnant",
        to: "postpartum",
        fromLocalized: "Pregnancy",
        toLocalized: "Postpartum",
      },
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe("Current stage changed from Pregnancy to Postpartum.");
  });

  it("uses the initial-stage variant when there is no previous stage", () => {
    const empty = new Map<string, AnnouncementPoint>();
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: empty,
      currentPoints: empty,
      stageChange: {
        from: null,
        to: "pregnant",
        toLocalized: "Pregnancy",
      },
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe("Current stage set to Pregnancy.");
  });

  it(`falls back to a count summary when more than ${DETAIL_CAP} items change`, () => {
    const prev = new Map<string, AnnouncementPoint>();
    const cur = new Map<string, AnnouncementPoint>([
      ["fertility-start", point("fertility-start", "2024-01-01T12:00:00.000Z", "Start", "Fertility")],
      ["fertility-end", point("fertility-end", "2024-06-01T12:00:00.000Z", "Completed", "Fertility")],
      ["pregnancy-start", point("pregnancy-start", "2024-06-15T12:00:00.000Z", "Start", "Pregnancy")],
      ["pregnancy-due", point("pregnancy-due", "2025-03-22T12:00:00.000Z", "Due", "Pregnancy")],
      ["postpartum-birth", point("postpartum-birth", "2025-03-22T12:00:00.000Z", "Birth", "Postpartum")],
    ]);
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: prev,
      currentPoints: cur,
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe("5 timeline items updated.");
    expect(out).not.toContain("added on");
  });

  it("composes stage change + per-point change into one polite sentence", () => {
    const prev = new Map([
      ["pregnancy-due", point("pregnancy-due", "2025-10-08T12:00:00.000Z")],
    ]);
    const cur = new Map([
      ["pregnancy-due", point("pregnancy-due", "2025-11-15T12:00:00.000Z")],
    ]);
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: prev,
      currentPoints: cur,
      stageChange: {
        from: "pregnant",
        to: "postpartum",
        fromLocalized: "Pregnancy",
        toLocalized: "Postpartum",
      },
      formatDate: fmt,
      translate: t,
    });
    // Stage change comes first, then the per-point change, separated by " ".
    expect(out).toBe(
      "Current stage changed from Pregnancy to Postpartum. Due date (Pregnancy) changed from 2025-10-08 to 2025-11-15.",
    );
  });

  it("emits nothing when current and previous snapshots are identical", () => {
    const same = new Map([
      ["pregnancy-due", point("pregnancy-due", "2025-10-08T12:00:00.000Z")],
    ]);
    const out = buildJourneyTimelineAnnouncement({
      prevPoints: same,
      currentPoints: same,
      formatDate: fmt,
      translate: t,
    });
    expect(out).toBe("");
  });
});

// ---------------------------------------------------------------------------
// 3. JourneyAutoDetectToggle aria-live integration.
// ---------------------------------------------------------------------------
describe("JourneyAutoDetectToggle aria-live", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("announces 'turned on' / 'turned off' when toggled", async () => {
    const { container } = render(<JourneyAutoDetectToggle />, { wrapper });
    const switchEl = screen.getByRole("switch");

    // Default ON → click turns it OFF.
    act(() => {
      switchEl.click();
    });
    await flush();
    expect(getLiveRegion(container).textContent?.toLowerCase() ?? "").toContain(
      "turned off",
    );

    // Toggle back ON.
    act(() => {
      switchEl.click();
    });
    await flush();
    expect(getLiveRegion(container).textContent?.toLowerCase() ?? "").toContain(
      "turned on",
    );
  });
});

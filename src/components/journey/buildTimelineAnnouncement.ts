/**
 * buildJourneyTimelineAnnouncement
 * --------------------------------
 * Pure helper that turns the *delta* between two timeline snapshots
 * (plus an optional stage change) into a single human-readable polite
 * announcement string for the JourneyLiveRegion.
 *
 * Extracted out of JourneyTimeline so it can be unit-tested without
 * mounting any React tree, i18n provider, or LanguageContext, and so
 * the wording rules live in one well-typed place.
 *
 * Rules (kept in sync with the live JourneyTimeline behaviour):
 *   • If `prevPoints` is null → first render baseline; return "".
 *   • If stage changed       → "Current stage changed from <a> to <b>."
 *   • Per-point diff:
 *       - added   → "<label> (<stage>) added on <date>."
 *       - removed → "<label> (<stage>) recorded on <date> was removed."
 *       - changed → "<label> (<stage>) changed from <old> to <new>."
 *   • If total > DETAIL_CAP  → fall back to "<n> timeline items updated."
 */
import type { JourneyStage } from "@/hooks/useUserProfile";

export interface AnnouncementPoint {
  id: string;
  iso: string;
  label: string;
  stage: string; // localized stage name
}

export interface BuildAnnouncementInput {
  /** null = first render → no announcement should be produced. */
  prevPoints: Map<string, AnnouncementPoint> | null;
  /** Current snapshot keyed by stable id. */
  currentPoints: Map<string, AnnouncementPoint>;
  /** Stage change, if any. */
  stageChange?: {
    from: JourneyStage | null;
    to: JourneyStage;
    fromLocalized?: string;
    toLocalized: string;
  };
  /** Date formatter; receives an ISO date and returns a localized string. */
  formatDate: (iso: string) => string;
  /**
   * Translation lookup, mirroring i18next's `t()` shape we actually use.
   * Receives a key and an interpolation map, returns the rendered string.
   * Tests can pass a tiny stub with the same keys we ship in en.json.
   */
  translate: (key: string, vars: Record<string, string | number>) => string;
}

export const DETAIL_CAP = 3;

export function buildJourneyTimelineAnnouncement(
  input: BuildAnnouncementInput,
): string {
  const { prevPoints, currentPoints, stageChange, formatDate, translate } =
    input;

  if (prevPoints === null) return "";

  const messages: string[] = [];

  // ---- Stage change ----
  if (stageChange) {
    if (stageChange.from && stageChange.from !== stageChange.to) {
      messages.push(
        translate("journey.map.srAnnounce.stageChangedFromTo", {
          from: stageChange.fromLocalized ?? stageChange.from,
          to: stageChange.toLocalized,
        }),
      );
    } else if (!stageChange.from) {
      messages.push(
        translate("journey.map.srAnnounce.stageChangedInitial", {
          to: stageChange.toLocalized,
        }),
      );
    }
  }

  // ---- Per-point diff ----
  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ id: string; from: string; to: string }> = [];

  currentPoints.forEach((p, id) => {
    const prev = prevPoints.get(id);
    if (!prev) {
      added.push(id);
    } else if (prev.iso !== p.iso) {
      changed.push({ id, from: prev.iso, to: p.iso });
    }
  });
  prevPoints.forEach((_p, id) => {
    if (!currentPoints.has(id)) removed.push(id);
  });

  const total = added.length + removed.length + changed.length;
  if (total > DETAIL_CAP) {
    messages.push(
      translate("journey.map.srAnnounce.multipleChanges", { count: total }),
    );
  } else {
    const labelOf = (id: string) =>
      currentPoints.get(id) ?? prevPoints.get(id)!;

    added.forEach((id) => {
      const p = labelOf(id);
      messages.push(
        translate("journey.map.srAnnounce.pointAdded", {
          label: p.label,
          stage: p.stage,
          date: formatDate(p.iso),
        }),
      );
    });
    changed.forEach(({ id, from, to }) => {
      const p = labelOf(id);
      messages.push(
        translate("journey.map.srAnnounce.pointChanged", {
          label: p.label,
          stage: p.stage,
          from: formatDate(from),
          to: formatDate(to),
        }),
      );
    });
    removed.forEach((id) => {
      const p = labelOf(id);
      const iso = prevPoints.get(id)?.iso ?? p.iso;
      messages.push(
        translate("journey.map.srAnnounce.pointRemoved", {
          label: p.label,
          stage: p.stage,
          date: formatDate(iso),
        }),
      );
    });
  }

  return messages.join(" ");
}

/**
 * JourneyTimeline — A horizontal, scrollable chronological line that
 * unifies every meaningful date across the user's journey:
 *   • fertility.startedAt / completedAt
 *   • pregnancy.startedAt / completedAt / dueDate
 *   • postpartum.startedAt / birthDate
 *
 * Design intent:
 *   • One continuous axis (no separate per-stage lines) so the user
 *     can see the *flow* of their journey in time.
 *   • Markers are sorted chronologically and color-coded by stage
 *     (uses the same accent hues as `useStageTheme`).
 *   • Future-dated milestones (e.g. an upcoming due date) get a
 *     dashed ring + muted label.
 *   • Fully RTL aware: scroll direction is preserved by the browser;
 *     we just flip flex direction so the earliest event sits at the
 *     start of the reading flow.
 *   • Keyboard / screen-reader friendly: each marker is a `<button>`
 *     when actionable, otherwise a `<div role="listitem">`.
 */
import { useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CircleDot, Stethoscope, Baby, CalendarDays, CalendarCheck, Sparkles, Link2, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserProfile, type JourneyStage, computeDueDateFromLMP } from "@/hooks/useUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalized } from "@/lib/dateLocale";
import { cn } from "@/lib/utils";
import {
  JourneyLiveRegion,
  useJourneyLiveAnnouncer,
} from "@/components/journey/JourneyLiveRegion";

/**
 * Origin of a milestone — explains *why* this point exists on the timeline.
 *   • manual     → user typed it directly
 *   • derived    → auto-seeded from another field (e.g. startedAt = birthDate)
 *   • computed   → calculated by formula (e.g. dueDate from LMP via Naegele)
 *   • auto       → produced by stage auto-detection (e.g. completedAt on transition)
 */
type PointOrigin = "manual" | "derived" | "computed" | "auto";

interface TimelinePoint {
  id: string;
  date: Date;
  stage: JourneyStage;
  kind: "startedAt" | "completedAt" | "dueDate" | "birthDate";
  labelKey: string;
  /** Why this point exists. */
  origin: PointOrigin;
  /** Optional source field name (i18n key suffix) for derived/computed points. */
  sourceKey?: string;
}

const STAGE_ICON: Record<JourneyStage, LucideIcon> = {
  fertility: CircleDot,
  pregnant: Stethoscope,
  postpartum: Baby,
};

const ORIGIN_ICON: Record<PointOrigin, LucideIcon> = {
  manual: UserCheck,
  derived: Link2,
  computed: Sparkles,
  auto: Sparkles,
};

// Tailwind-safe accent hues per stage
const STAGE_HUE: Record<JourneyStage, string> = {
  fertility: "150 55% 45%", // sage
  pregnant: "340 70% 55%", // rose
  postpartum: "270 50% 60%", // lavender
};

export const JourneyTimeline = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const { profile } = useUserProfile();
  const scrollerRef = useRef<HTMLDivElement>(null);

  const points: TimelinePoint[] = useMemo(() => {
    const h = profile.journeyHistory ?? {};

    // ---- Origin inference ------------------------------------------------
    // We compare related fields to figure out *why* each milestone exists.
    //   • dueDate matches LMP+280d  → computed (Naegele)
    //   • postpartum.startedAt === postpartum.birthDate → derived from birthDate
    //   • pregnancy.startedAt close to LMP (±2 days) → derived from LMP
    //   • completedAt without an explicit user edit → auto (stage transition)
    //   • everything else                        → manual
    const sameDay = (a?: string | null, b?: string | null) => {
      if (!a || !b) return false;
      const da = new Date(a);
      const db = new Date(b);
      if (isNaN(da.getTime()) || isNaN(db.getTime())) return false;
      return Math.abs(da.getTime() - db.getTime()) < 36 * 60 * 60 * 1000; // ≤36h
    };

    const lmp = profile.lastPeriodDate ?? null;
    const lmpDue = lmp ? computeDueDateFromLMP(lmp) : null;

    const pregStartOrigin: PointOrigin = sameDay(h.pregnancy?.startedAt, lmp)
      ? "derived"
      : "manual";
    const dueOrigin: PointOrigin = sameDay(h.pregnancy?.dueDate, lmpDue)
      ? "computed"
      : "manual";
    const postStartOrigin: PointOrigin = sameDay(
      h.postpartum?.startedAt,
      h.postpartum?.birthDate,
    )
      ? "derived"
      : "manual";

    const raw: Array<TimelinePoint | null> = [
      h.fertility?.startedAt && {
        id: "fertility-start",
        date: new Date(h.fertility.startedAt),
        stage: "fertility",
        kind: "startedAt",
        labelKey: "journey.map.fields.startedAt",
        origin: "manual" as PointOrigin,
      },
      h.fertility?.completedAt && {
        id: "fertility-end",
        date: new Date(h.fertility.completedAt),
        stage: "fertility",
        kind: "completedAt",
        labelKey: "journey.map.fields.completedAt",
        origin: "auto" as PointOrigin,
        sourceKey: "stageTransition",
      },
      h.pregnancy?.startedAt && {
        id: "pregnancy-start",
        date: new Date(h.pregnancy.startedAt),
        stage: "pregnant",
        kind: "startedAt",
        labelKey: "journey.map.fields.startedAt",
        origin: pregStartOrigin,
        sourceKey: pregStartOrigin === "derived" ? "lastPeriodDate" : undefined,
      },
      h.pregnancy?.dueDate && {
        id: "pregnancy-due",
        date: new Date(h.pregnancy.dueDate),
        stage: "pregnant",
        kind: "dueDate",
        labelKey: "journey.map.fields.dueDate",
        origin: dueOrigin,
        sourceKey: dueOrigin === "computed" ? "lastPeriodDate" : undefined,
      },
      h.pregnancy?.completedAt && {
        id: "pregnancy-end",
        date: new Date(h.pregnancy.completedAt),
        stage: "pregnant",
        kind: "completedAt",
        labelKey: "journey.map.fields.completedAt",
        origin: "auto" as PointOrigin,
        sourceKey: "stageTransition",
      },
      h.postpartum?.startedAt && {
        id: "postpartum-start",
        date: new Date(h.postpartum.startedAt),
        stage: "postpartum",
        kind: "startedAt",
        labelKey: "journey.map.fields.startedAt",
        origin: postStartOrigin,
        sourceKey: postStartOrigin === "derived" ? "birthDate" : undefined,
      },
      h.postpartum?.birthDate && {
        id: "postpartum-birth",
        date: new Date(h.postpartum.birthDate),
        stage: "postpartum",
        kind: "birthDate",
        labelKey: "journey.map.fields.birthDate",
        origin: "manual" as PointOrigin,
      },
    ] as Array<TimelinePoint | null>;

    return raw
      .filter((p): p is TimelinePoint => !!p && !isNaN(p.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [profile.journeyHistory, profile.lastPeriodDate]);

  // Auto-scroll to "today" / nearest marker when the timeline mounts
  useEffect(() => {
    if (!scrollerRef.current || points.length === 0) return;
    const now = Date.now();
    let nearestIdx = 0;
    let nearestDelta = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.date.getTime() - now);
      if (d < nearestDelta) {
        nearestDelta = d;
        nearestIdx = i;
      }
    });
    const node = scrollerRef.current.querySelector<HTMLElement>(
      `[data-tl-idx="${nearestIdx}"]`,
    );
    node?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [points]);

  // ---- Live-region announcements ----
  // Detect timeline diffs (additions/removals/date edits) and stage changes
  // since the last render, and surface a *specific* polite message naming
  // exactly what changed (which date, which stage, from → to value).
  const { announce, message: liveMessage } = useJourneyLiveAnnouncer();
  const prevPointsRef = useRef<Map<string, string> | null>(null); // id -> ISO date
  const prevStageRef = useRef<JourneyStage | null>(null);

  useEffect(() => {
    const currentMap = new Map(points.map((p) => [p.id, p.date.toISOString()]));
    const prevMap = prevPointsRef.current;

    if (prevMap === null) {
      // First render — establish baseline silently.
      prevPointsRef.current = currentMap;
      prevStageRef.current = profile.journeyStage;
      return;
    }

    const fmtDate = (iso: string) => formatLocalized(iso, "PP", i18n.language);
    const labelOf = (id: string) => {
      const p = points.find((x) => x.id === id);
      if (p) return { label: t(p.labelKey), stage: t(`journey.ribbon.stages.${p.stage}`) };
      // Removed entry — derive label/stage from the id (e.g. "pregnancy-due").
      const [stageKey, kind] = id.split("-");
      const stageMap: Record<string, JourneyStage> = {
        fertility: "fertility",
        pregnancy: "pregnant",
        postpartum: "postpartum",
      };
      const stage = stageMap[stageKey] ?? "pregnant";
      const kindLabelMap: Record<string, string> = {
        start: "journey.map.fields.startedAt",
        end: "journey.map.fields.completedAt",
        due: "journey.map.fields.dueDate",
        birth: "journey.map.fields.birthDate",
      };
      return {
        label: t(kindLabelMap[kind] ?? "journey.map.fields.startedAt"),
        stage: t(`journey.ribbon.stages.${stage}`),
      };
    };

    const messages: string[] = [];

    // Stage change — name both old and new stage.
    if (prevStageRef.current !== profile.journeyStage) {
      const toName = t(`journey.ribbon.stages.${profile.journeyStage}`);
      messages.push(
        prevStageRef.current
          ? t("journey.map.srAnnounce.stageChangedFromTo", {
              from: t(`journey.ribbon.stages.${prevStageRef.current}`),
              to: toName,
              defaultValue: `Current stage changed from ${prevStageRef.current} to ${profile.journeyStage}.`,
            })
          : t("journey.map.srAnnounce.stageChangedInitial", {
              to: toName,
              defaultValue: `Current stage set to ${profile.journeyStage}.`,
            }),
      );
    }

    // Per-point diff: added, removed, or date edited.
    const added: string[] = [];
    const removed: string[] = [];
    const changed: Array<{ id: string; from: string; to: string }> = [];

    currentMap.forEach((iso, id) => {
      if (!prevMap.has(id)) {
        added.push(id);
      } else if (prevMap.get(id) !== iso) {
        changed.push({ id, from: prevMap.get(id) as string, to: iso });
      }
    });
    prevMap.forEach((_iso, id) => {
      if (!currentMap.has(id)) removed.push(id);
    });

    const totalChanges = added.length + removed.length + changed.length;
    // Cap detailed lines so the announcement stays digestible; if too many
    // changed at once (rare) fall back to a count summary.
    const DETAIL_CAP = 3;

    if (totalChanges > DETAIL_CAP) {
      messages.push(
        t("journey.map.srAnnounce.multipleChanges", {
          count: totalChanges,
          defaultValue: `${totalChanges} timeline items updated.`,
        }),
      );
    } else {
      added.forEach((id) => {
        const { label, stage } = labelOf(id);
        const iso = currentMap.get(id)!;
        messages.push(
          t("journey.map.srAnnounce.pointAdded", {
            label,
            stage,
            date: fmtDate(iso),
            defaultValue: `${label} (${stage}) added on ${fmtDate(iso)}.`,
          }),
        );
      });
      changed.forEach(({ id, from, to }) => {
        const { label, stage } = labelOf(id);
        messages.push(
          t("journey.map.srAnnounce.pointChanged", {
            label,
            stage,
            from: fmtDate(from),
            to: fmtDate(to),
            defaultValue: `${label} (${stage}) changed from ${fmtDate(from)} to ${fmtDate(to)}.`,
          }),
        );
      });
      removed.forEach((id) => {
        const { label, stage } = labelOf(id);
        const iso = prevMap.get(id) as string;
        messages.push(
          t("journey.map.srAnnounce.pointRemoved", {
            label,
            stage,
            date: fmtDate(iso),
            defaultValue: `${label} (${stage}) recorded on ${fmtDate(iso)} was removed.`,
          }),
        );
      });
    }

    if (messages.length > 0) {
      // Shared announcer handles re-announce + sr-only rendering.
      announce(messages.join(" "));
    }

    prevPointsRef.current = currentMap;
    prevStageRef.current = profile.journeyStage;
  }, [points, profile.journeyStage, t, i18n.language, announce]);

  // Shared sr-only live region — kept as a JSX expression so we can drop
  // it into either the empty or populated branch below.
  const LiveRegion = <JourneyLiveRegion message={liveMessage} />;

  if (points.length === 0) {
    return (
      <div
        role="region"
        aria-labelledby="journey-timeline-heading"
        aria-describedby="journey-timeline-subtitle journey-timeline-status"
        className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-5 text-center"
      >
        <div
          aria-hidden
          className="mx-auto mb-2 h-10 w-10 rounded-2xl bg-muted/60 flex items-center justify-center"
        >
          <CalendarDays className="h-5 w-5 text-muted-foreground/80" />
        </div>
        <h2 id="journey-timeline-heading" className="text-xs font-bold text-foreground">
          {t("journey.map.timeline.emptyTitle", "Your timeline is empty")}
        </h2>
        <p id="journey-timeline-subtitle" className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
          {t(
            "journey.map.timeline.emptyHint",
            "Add your key dates below to build a personal timeline of your journey.",
          )}
        </p>
        <span id="journey-timeline-status" className="sr-only">
          {t("journey.map.srStatus.timelineEmpty", "No points on the timeline yet.")}
        </span>
        {LiveRegion}
      </div>
    );
  }

  const todayMs = Date.now();

  return (
    <section
      aria-labelledby="journey-timeline-heading"
      className="rounded-2xl border border-border/60 bg-card/50 p-3 sm:p-4"
    >
      <header className="flex items-center justify-between gap-2 mb-3">
        <h2
          id="journey-timeline-heading"
          className="text-sm font-bold text-foreground"
        >
          {t("journey.map.timeline.title", "Journey timeline")}
        </h2>
        <span
          id="journey-timeline-subtitle"
          className="text-[10px] font-semibold text-muted-foreground"
        >
          {t("journey.map.timeline.count", { count: points.length })}
        </span>
        <span id="journey-timeline-status" className="sr-only">
          {t("journey.map.srStatus.timelineCount", { count: points.length, defaultValue: `${points.length} timeline markers` })}
        </span>
      </header>

      <div
        ref={scrollerRef}
        role="list"
        aria-label={t("journey.map.timeline.title", "Journey timeline")}
        className={cn(
          "relative overflow-x-auto overflow-y-hidden pb-2 -mx-1 px-1",
          "[scrollbar-width:thin]",
        )}
      >
        {/* The continuous axis line */}
        <div
          aria-hidden
          className="absolute left-3 right-3 top-[34px] h-px bg-gradient-to-r from-border/40 via-border to-border/40"
        />

        <ol
          className={cn(
            "relative flex items-start gap-4 sm:gap-6 min-w-max px-2",
            isRTL && "flex-row-reverse",
          )}
        >
          {points.map((p, idx) => {
            const Icon = STAGE_ICON[p.stage];
            const hue = STAGE_HUE[p.stage];
            const isFuture = p.date.getTime() > todayMs;
            const isBirth = p.kind === "birthDate";
            const isDue = p.kind === "dueDate";

            const handleJump = () => {
              const node = document.querySelector<HTMLElement>(
                `[data-stage-card="${p.stage}"]`,
              );
              node?.scrollIntoView({ behavior: "smooth", block: "center" });
            };
            const stageName = t(`journey.ribbon.stages.${p.stage}`);
            const OriginIcon = ORIGIN_ICON[p.origin];
            // Resolved origin reason — short chip text + verbose tooltip/aria.
            const originChip = t(`journey.map.timeline.originBadge.${p.origin}`, {
              defaultValue:
                p.origin === "manual"
                  ? "Manual"
                  : p.origin === "derived"
                    ? "Derived"
                    : p.origin === "computed"
                      ? "Auto-calc"
                      : "Auto",
            });
            const sourceLabel = p.sourceKey
              ? t(`journey.map.timeline.sourceLabel.${p.sourceKey}`, {
                  defaultValue: p.sourceKey,
                })
              : "";
            const originReason = sourceLabel
              ? t(`journey.map.timeline.originReason.${p.origin}WithSource`, {
                  source: sourceLabel,
                  defaultValue: `Auto-filled from ${sourceLabel}`,
                })
              : t(`journey.map.timeline.originReason.${p.origin}`, {
                  defaultValue:
                    p.origin === "manual"
                      ? "Entered manually"
                      : "Auto-filled by the app",
                });
            const ariaLabel = `${stageName} – ${t(p.labelKey)} – ${formatLocalized(
              p.date.toISOString(),
              "PP",
              i18n.language,
            )} – ${originReason}`;

            return (
              <li
                key={p.id}
                data-tl-idx={idx}
                className="flex flex-col items-center w-[88px] sm:w-[104px] shrink-0"
              >
                <button
                  type="button"
                  onClick={handleJump}
                  aria-label={ariaLabel}
                  title={originReason}
                  className={cn(
                    "flex flex-col items-center w-full rounded-xl p-1 -m-1 transition-all",
                    "outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                    "hover:bg-muted/40 active:scale-[0.97]",
                  )}
                >
                  {/* Year/Month label above the dot keeps the axis tidy */}
                  <span className="text-[10px] font-semibold text-muted-foreground mb-1 truncate max-w-full">
                    {formatLocalized(p.date.toISOString(), "MMM yyyy", i18n.language)}
                  </span>

                  {/* The marker itself sits on the axis line */}
                  <div
                    className={cn(
                      "relative h-[18px] w-[18px] rounded-full flex items-center justify-center",
                      "border-2 transition-transform",
                      isFuture ? "border-dashed" : "border-solid",
                    )}
                    style={{
                      background: isFuture
                        ? "hsl(var(--background))"
                        : `hsl(${hue} / 0.18)`,
                      borderColor: `hsl(${hue})`,
                    }}
                    aria-hidden
                  >
                    {(isBirth || isDue) && (
                      <CalendarCheck
                        className="h-2.5 w-2.5"
                        style={{ color: `hsl(${hue})` }}
                      />
                    )}
                  </div>

                  {/* Stage chip + label */}
                  <div className="mt-2 flex flex-col items-center gap-1 text-center">
                    <div
                      className="h-7 w-7 rounded-xl flex items-center justify-center"
                      style={{
                        background: `hsl(${hue} / 0.12)`,
                        color: `hsl(${hue})`,
                      }}
                      aria-hidden
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-2">
                      {t(p.labelKey)}
                    </p>
                    <p className="text-[9px] text-muted-foreground leading-tight">
                      {formatLocalized(p.date.toISOString(), "PP", i18n.language)}
                    </p>

                    {/* Origin badge — explains *why* this milestone exists. */}
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
                        "text-[8.5px] font-bold leading-none border",
                        p.origin === "manual"
                          ? "border-border/60 bg-muted/40 text-muted-foreground"
                          : "border-transparent text-foreground",
                      )}
                      style={
                        p.origin === "manual"
                          ? undefined
                          : {
                              background: `hsl(${hue} / 0.14)`,
                              color: `hsl(${hue})`,
                            }
                      }
                      aria-label={originReason}
                    >
                      <OriginIcon className="h-2.5 w-2.5" aria-hidden />
                      {originChip}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {LiveRegion}
    </section>
  );
};

export default JourneyTimeline;

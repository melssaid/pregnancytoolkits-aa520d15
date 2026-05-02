/**
 * JourneyMissingMilestones — Surfaces a clear, friendly state when the
 * user is missing key dates that power the timeline (dueDate, birthDate,
 * stage start dates). Each missing milestone is shown as a row with a
 * small inline date input + Save button, so the user can complete the
 * timeline without leaving the Journey Map.
 *
 * Design rules:
 *   • Only suggests dates relevant to stages the user has actually
 *     touched, plus the current stage. We never nag for unrelated
 *     fields.
 *   • Optimistic, local-first writes via `useUserProfile.updateProfile`.
 *   • Renders nothing when everything is filled (no clutter).
 *   • Fully RTL + 7-locale + keyboard accessible.
 */
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPlus, Check, AlertCircle, ExternalLink, AlertTriangle } from "lucide-react";
import {
  useUserProfile,
  type JourneyHistory,
  type JourneyStage,
} from "@/hooks/useUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  validateMilestoneDraft,
  hasBlockingError,
  type MilestoneWarning,
  type WarningCode,
} from "./validateMilestoneDraft";
import {
  JourneyLiveRegion,
  useJourneyLiveAnnouncer,
} from "./JourneyLiveRegion";

type MilestoneId =
  | "fertility.startedAt"
  | "pregnancy.dueDate"
  | "pregnancy.startedAt"
  | "postpartum.birthDate"
  | "postpartum.startedAt";

interface Milestone {
  id: MilestoneId;
  stage: JourneyStage;
  labelKey: string;
  hintKey: string;
  /** When true, this is a high-priority hint shown more prominently. */
  important?: boolean;
  /**
   * Optional deep-link to a richer tool that captures this same date.
   * The tool reads the `focus` query param and auto-opens / scrolls to
   * the matching field, so the user lands exactly where they need to be.
   */
  tool?: { path: string; focus: string };
}

const TOOL_DEEP_LINKS: Partial<Record<MilestoneId, { path: string; focus: string }>> = {
  "pregnancy.dueDate": { path: "/tools/due-date-calculator", focus: "lmp" },
  "pregnancy.startedAt": { path: "/tools/due-date-calculator", focus: "lmp" },
  "postpartum.birthDate": { path: "/tools/baby-growth", focus: "birthDate" },
  "fertility.startedAt": { path: "/tools/cycle-tracker", focus: "lastPeriod" },
};

const todayISO = () => new Date().toISOString().split("T")[0];

export const JourneyMissingMilestones = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserProfile();
  const [drafts, setDrafts] = useState<Partial<Record<MilestoneId, string>>>({});
  const [saved, setSaved] = useState<Partial<Record<MilestoneId, boolean>>>({});

  const missing: Milestone[] = useMemo(() => {
    const h = profile.journeyHistory ?? {};
    const stage = profile.journeyStage;
    const list: Milestone[] = [];

    // Pregnancy: due date is the single most useful field.
    const hasPregHistory = !!h.pregnancy || stage === "pregnant" || stage === "postpartum";
    if (hasPregHistory && !h.pregnancy?.dueDate && !profile.dueDate) {
      list.push({
        id: "pregnancy.dueDate",
        stage: "pregnant",
        labelKey: "journey.map.fields.dueDate",
        hintKey: "journey.map.missing.hints.dueDate",
        important: stage === "pregnant",
      });
    }
    if (hasPregHistory && !h.pregnancy?.startedAt) {
      list.push({
        id: "pregnancy.startedAt",
        stage: "pregnant",
        labelKey: "journey.map.fields.startedAt",
        hintKey: "journey.map.missing.hints.pregnancyStart",
      });
    }

    // Postpartum: birth date is the anchor.
    const hasPostHistory = !!h.postpartum || stage === "postpartum";
    if (hasPostHistory && !h.postpartum?.birthDate) {
      list.push({
        id: "postpartum.birthDate",
        stage: "postpartum",
        labelKey: "journey.map.fields.birthDate",
        hintKey: "journey.map.missing.hints.birthDate",
        important: stage === "postpartum",
      });
    }

    // Fertility: only suggest start date if user is actively in fertility
    // or has any fertility history.
    if ((stage === "fertility" || h.fertility) && !h.fertility?.startedAt) {
      list.push({
        id: "fertility.startedAt",
        stage: "fertility",
        labelKey: "journey.map.fields.startedAt",
        hintKey: "journey.map.missing.hints.fertilityStart",
      });
    }

    return list.map((m) => ({ ...m, tool: TOOL_DEEP_LINKS[m.id] }));
  }, [profile]);

  const handleOpenTool = useCallback(
    (m: Milestone) => {
      if (!m.tool) return;
      haptic("tap");
      navigate(`${m.tool.path}?focus=${encodeURIComponent(m.tool.focus)}`);
    },
    [navigate],
  );

  const warningsByMilestone = useMemo(() => {
    const map: Partial<Record<MilestoneId, MilestoneWarning[]>> = {};
    for (const m of missing) {
      const value = drafts[m.id];
      if (!value) continue;
      map[m.id] = validateMilestoneDraft({
        id: m.id,
        value,
        history: profile.journeyHistory ?? {},
        stage: profile.journeyStage,
      });
    }
    return map;
  }, [drafts, missing, profile.journeyHistory, profile.journeyStage]);

  // ── A11y: announce when warnings appear / clear / change severity ──
  // Screen-reader users don't see border colors; the diff effect below
  // emits a polite (or assertive on errors) message naming the milestone
  // label and which specific issue changed. We track previous codes per
  // milestone so we only announce real transitions, not steady state.
  const { announce, message } = useJourneyLiveAnnouncer();
  const { announce: announceAssertive, message: assertiveMessage } =
    useJourneyLiveAnnouncer();
  const previousCodesRef = useRef<Partial<Record<MilestoneId, WarningCode[]>>>({});

  useEffect(() => {
    const prev = previousCodesRef.current;
    const next: Partial<Record<MilestoneId, WarningCode[]>> = {};
    const politeParts: string[] = [];
    const assertiveParts: string[] = [];

    for (const m of missing) {
      const warnings = warningsByMilestone[m.id] ?? [];
      const codes = warnings.map((w) => w.code).sort();
      next[m.id] = codes;

      const prevCodes = (prev[m.id] ?? []).slice().sort();
      if (codes.join("|") === prevCodes.join("|")) continue;

      const label = t(m.labelKey);
      const added = codes.filter((c) => !prevCodes.includes(c));
      const removed = prevCodes.filter((c) => !codes.includes(c));

      for (const code of added) {
        const w = warnings.find((x) => x.code === code)!;
        const wording = t(`journey.map.missing.warnings.${code}`, {
          defaultValue: t("journey.map.missing.warnings.generic", "This date looks inconsistent."),
        });
        const severityLabel =
          w.severity === "error"
            ? t("journey.map.missing.srAnnounce.errorSeverity", "Error")
            : t("journey.map.missing.srAnnounce.warningSeverity", "Warning");
        const sentence = t("journey.map.missing.srAnnounce.added", {
          label,
          severity: severityLabel,
          message: wording,
          defaultValue: "{{label}} — {{severity}}: {{message}}",
        });
        if (w.severity === "error") assertiveParts.push(sentence);
        else politeParts.push(sentence);
      }

      for (const code of removed) {
        // We no longer have the original severity — use a neutral
        // "resolved" wording naming the milestone + code.
        const wording = t(`journey.map.missing.warnings.${code}`, {
          defaultValue: t("journey.map.missing.warnings.generic", "This date looks inconsistent."),
        });
        politeParts.push(
          t("journey.map.missing.srAnnounce.cleared", {
            label,
            message: wording,
            defaultValue: "{{label}} — issue resolved: {{message}}",
          }),
        );
      }
    }

    previousCodesRef.current = next;

    if (assertiveParts.length) announceAssertive(assertiveParts.join(". "));
    if (politeParts.length) announce(politeParts.join(". "));
  }, [warningsByMilestone, missing, t, announce, announceAssertive]);


  const handleSave = useCallback(
    (m: Milestone) => {
      const value = drafts[m.id];
      if (!value) return;
      // Block saves when validator detected an impossible state.
      const warnings = warningsByMilestone[m.id] ?? [];
      if (hasBlockingError(warnings)) return;
      haptic("tap");

      // Normalize date-only inputs (YYYY-MM-DD) to noon UTC so localized
      // formatters never shift the visible day across timezones.
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00.000Z`).toISOString()
        : new Date(value).toISOString();
      const prev: JourneyHistory = profile.journeyHistory ?? {};
      const next: JourneyHistory = { ...prev };

      if (m.id === "pregnancy.dueDate") {
        next.pregnancy = { ...(prev.pregnancy ?? {}), dueDate: iso };
        updateProfile({ journeyHistory: next, dueDate: iso });
      } else if (m.id === "pregnancy.startedAt") {
        next.pregnancy = { ...(prev.pregnancy ?? {}), startedAt: iso };
        updateProfile({ journeyHistory: next });
      } else if (m.id === "postpartum.birthDate") {
        // Birth date is the natural anchor for postpartum: seed
        // `postpartum.startedAt` from it when missing so the timeline
        // and change-log stay coherent without a second prompt.
        next.postpartum = {
          ...(prev.postpartum ?? {}),
          birthDate: iso,
          startedAt: prev.postpartum?.startedAt ?? iso,
        };
        updateProfile({ journeyHistory: next });
      } else if (m.id === "postpartum.startedAt") {
        next.postpartum = { ...(prev.postpartum ?? {}), startedAt: iso };
        updateProfile({ journeyHistory: next });
      } else if (m.id === "fertility.startedAt") {
        next.fertility = { ...(prev.fertility ?? {}), startedAt: iso };
        updateProfile({ journeyHistory: next });
      }

      setSaved((s) => ({ ...s, [m.id]: true }));
    },
    [drafts, warningsByMilestone, profile.journeyHistory, updateProfile],
  );

  if (missing.length === 0) return null;

  return (
    <Card
      role="region"
      aria-labelledby="missing-milestones-heading"
      className="p-3 sm:p-4 rounded-2xl border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/10"
    >
      <header className="flex items-start gap-2.5 mb-3">
        <div
          aria-hidden
          className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
        >
          <AlertCircle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2
            id="missing-milestones-heading"
            className="text-sm font-bold text-foreground"
          >
            {t("journey.map.missing.title", "Complete your timeline")}
          </h2>
          <p
            id="journey-milestones-subtitle"
            className="mt-0.5 text-xs text-muted-foreground leading-relaxed"
          >
            {t(
              "journey.map.missing.subtitle",
              "Add a few key dates so your timeline reflects your real journey.",
            )}
          </p>
        </div>
        <span id="journey-milestones-status" className="sr-only" aria-live="polite">
          {t("journey.map.srStatus.milestonesCount", {
            count: missing.length,
            defaultValue: `${missing.length} missing dates need completion`,
          })}
        </span>
      </header>

      <ul className="space-y-2.5">
        {missing.map((m) => {
          const isSaved = saved[m.id];
          const draft = drafts[m.id] ?? "";
          const warnings = warningsByMilestone[m.id] ?? [];
          const blocking = hasBlockingError(warnings);
          const warnDescId = warnings.length ? `milestone-warn-${m.id}` : undefined;

          return (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border bg-card/60 p-2.5",
                blocking
                  ? "border-destructive/60"
                  : m.important
                  ? "border-amber-400/50"
                  : "border-border/60",
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    {t(m.labelKey)}
                    <span className="ms-1.5 text-[10px] font-semibold text-muted-foreground">
                      · {t(`journey.ribbon.stages.${m.stage}`)}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                    {t(m.hintKey)}
                  </p>
                </div>
                {isSaved && (
                  <span
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"
                    aria-live="polite"
                  >
                    <Check className="h-3 w-3" aria-hidden />
                    {t("journey.map.missing.saved", "Saved")}
                  </span>
                )}
              </div>

              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <Input
                  type="date"
                  value={draft}
                  max={
                    m.id === "pregnancy.dueDate" ? undefined : todayISO()
                  }
                  onChange={(e) => {
                    setDrafts((d) => ({ ...d, [m.id]: e.target.value }));
                    setSaved((s) => ({ ...s, [m.id]: false }));
                  }}
                  aria-label={t(m.labelKey)}
                  aria-invalid={blocking || undefined}
                  aria-describedby={warnDescId}
                  className={cn(
                    "h-9 text-xs flex-1",
                    blocking && "border-destructive focus-visible:ring-destructive/40",
                  )}
                />
                <Button
                  type="button"
                  size="sm"
                  variant={m.important ? "default" : "secondary"}
                  disabled={!draft || blocking}
                  onClick={() => handleSave(m)}
                  className="h-9 px-3 text-xs font-bold"
                >
                  <CalendarPlus className="h-3.5 w-3.5 me-1" aria-hidden />
                  {t("journey.map.missing.add", "Add")}
                </Button>
              </div>

              {warnings.length > 0 && (
                <ul
                  id={warnDescId}
                  role="alert"
                  aria-live="polite"
                  className="mt-2 space-y-1"
                >
                  {warnings.map((w) => (
                    <li
                      key={w.code}
                      className={cn(
                        "flex items-start gap-1.5 text-[11px] font-semibold leading-snug",
                        w.severity === "error"
                          ? "text-destructive"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" aria-hidden />
                      <span>
                        {t(`journey.map.missing.warnings.${w.code}`, {
                          defaultValue: t("journey.map.missing.warnings.generic", "This date looks inconsistent."),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {m.tool && !isSaved && (
                <button
                  type="button"
                  onClick={() => handleOpenTool(m)}
                  className={cn(
                    "mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded",
                    isRTL && "flex-row-reverse",
                  )}
                  aria-label={t("journey.map.missing.openTool", {
                    field: t(m.labelKey),
                    defaultValue: "Open tool to set {{field}}",
                  })}
                >
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  {t("journey.map.missing.openInTool", "Open in dedicated tool")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default JourneyMissingMilestones;

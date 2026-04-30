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
import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPlus, Check, AlertCircle } from "lucide-react";
import {
  useUserProfile,
  type JourneyHistory,
  type JourneyStage,
} from "@/hooks/useUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

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
}

const todayISO = () => new Date().toISOString().split("T")[0];

export const JourneyMissingMilestones = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
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

    return list;
  }, [profile]);

  const handleSave = useCallback(
    (m: Milestone) => {
      const value = drafts[m.id];
      if (!value) return;
      haptic("tap");

      const iso = new Date(value).toISOString();
      const prev: JourneyHistory = profile.journeyHistory ?? {};
      const next: JourneyHistory = { ...prev };

      if (m.id === "pregnancy.dueDate") {
        next.pregnancy = { ...(prev.pregnancy ?? {}), dueDate: iso };
        updateProfile({ journeyHistory: next, dueDate: iso });
      } else if (m.id === "pregnancy.startedAt") {
        next.pregnancy = { ...(prev.pregnancy ?? {}), startedAt: iso };
        updateProfile({ journeyHistory: next });
      } else if (m.id === "postpartum.birthDate") {
        next.postpartum = { ...(prev.postpartum ?? {}), birthDate: iso };
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
    [drafts, profile.journeyHistory, updateProfile],
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
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {t(
              "journey.map.missing.subtitle",
              "Add a few key dates so your timeline reflects your real journey.",
            )}
          </p>
        </div>
      </header>

      <ul className="space-y-2.5">
        {missing.map((m) => {
          const isSaved = saved[m.id];
          const draft = drafts[m.id] ?? "";

          return (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border bg-card/60 p-2.5",
                m.important
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
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [m.id]: e.target.value }))
                  }
                  aria-label={t(m.labelKey)}
                  className="h-9 text-xs flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={m.important ? "default" : "secondary"}
                  disabled={!draft}
                  onClick={() => handleSave(m)}
                  className="h-9 px-3 text-xs font-bold"
                >
                  <CalendarPlus className="h-3.5 w-3.5 me-1" aria-hidden />
                  {t("journey.map.missing.add", "Add")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default JourneyMissingMilestones;

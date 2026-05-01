/**
 * JourneyMap — A reflective, formal page that lays out the user's
 * three-stage journey (Fertility → Pregnancy → Motherhood), surfaces
 * any persisted `journeyHistory`, and lets the user inspect (or, with
 * intent, switch) the active station via the same JourneyProgressRibbon
 * used on the dashboard.
 *
 * Design intent:
 *   • Serious tone — never gamified. No badges, no streaks.
 *   • Stage cards mirror `useStageTheme` so the page harmonises with
 *     the rest of the journey-aware surfaces.
 *   • Switching stages requires a confirmation dialog so the change
 *     is deliberate; we never silently mutate `journeyStage`.
 *   • Fully RTL/keyboard/aria compliant; dates use the localized
 *     formatter so all 7 locales render correctly.
 */
import { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEOHead";
import { BackButton } from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserProfile, type JourneyStage } from "@/hooks/useUserProfile";
import { useStageTheme, JOURNEY_STAGE_ORDER } from "@/hooks/useStageTheme";
import { JourneyProgressRibbon } from "@/components/journey/JourneyProgressRibbon";
import { JourneyMemoriesPanel } from "@/components/journey/JourneyMemoriesPanel";
import { JourneyTimeline } from "@/components/journey/JourneyTimeline";
import { JourneyAutoDetectToggle } from "@/components/journey/JourneyAutoDetectToggle";
import { JourneyMissingMilestones } from "@/components/journey/JourneyMissingMilestones";
import { JourneyDateChangeLog } from "@/components/journey/JourneyDateChangeLog";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalized } from "@/lib/dateLocale";
import { CircleDot, Stethoscope, Baby, CalendarDays, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

const STAGE_ICONS: Record<JourneyStage, typeof CircleDot> = {
  fertility: CircleDot,
  pregnant: Stethoscope,
  postpartum: Baby,
};

interface StageEntry {
  stage: JourneyStage;
  startedAt?: string;
  completedAt?: string;
  notes: Array<{ labelKey: string; value: string }>;
}

const JourneyMap = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const { profile, updateProfile } = useUserProfile();
  const stageTheme = useStageTheme();

  const [pendingStage, setPendingStage] = useState<JourneyStage | null>(null);

  const fmt = useCallback(
    (iso?: string | null) =>
      iso ? formatLocalized(iso, "PPP", i18n.language) : null,
    [i18n.language],
  );

  const entries: StageEntry[] = useMemo(() => {
    const h = profile.journeyHistory ?? {};
    return [
      {
        stage: "fertility",
        startedAt: h.fertility?.startedAt,
        completedAt: h.fertility?.completedAt,
        notes: [
          h.fertility?.longestCycle != null
            ? {
                labelKey: "journey.map.fields.longestCycle",
                value: t("journey.map.units.days", { count: h.fertility.longestCycle }),
              }
            : null,
        ].filter(Boolean) as StageEntry["notes"],
      },
      {
        stage: "pregnant",
        startedAt: h.pregnancy?.startedAt,
        completedAt: h.pregnancy?.completedAt,
        notes: [
          h.pregnancy?.dueDate
            ? { labelKey: "journey.map.fields.dueDate", value: fmt(h.pregnancy.dueDate) ?? "" }
            : null,
          h.pregnancy?.prePregnancyWeight != null
            ? {
                labelKey: "journey.map.fields.prePregnancyWeight",
                value: t("journey.map.units.kg", { count: h.pregnancy.prePregnancyWeight }),
              }
            : null,
        ].filter(Boolean) as StageEntry["notes"],
      },
      {
        stage: "postpartum",
        startedAt: h.postpartum?.startedAt,
        notes: [
          h.postpartum?.birthDate
            ? { labelKey: "journey.map.fields.birthDate", value: fmt(h.postpartum.birthDate) ?? "" }
            : null,
          h.postpartum?.babyName
            ? { labelKey: "journey.map.fields.babyName", value: h.postpartum.babyName }
            : null,
        ].filter(Boolean) as StageEntry["notes"],
      },
    ];
  }, [profile.journeyHistory, fmt, t]);

  const activeIndex = JOURNEY_STAGE_ORDER.indexOf(profile.journeyStage);

  const scrollToStage = useCallback((stage: JourneyStage) => {
    const node = document.querySelector<HTMLElement>(`[data-stage-card="${stage}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    // Brief focus ring for accessibility/visual confirmation.
    node.setAttribute("tabindex", "-1");
    node.focus({ preventScroll: true });
  }, []);

  const handleStageSelect = useCallback((stage: JourneyStage) => {
    haptic("tap");
    if (stage === profile.journeyStage) {
      scrollToStage(stage);
      return;
    }
    setPendingStage(stage);
  }, [profile.journeyStage, scrollToStage]);

  const handleRibbonStation = useCallback((stage: JourneyStage) => {
    haptic("tap");
    scrollToStage(stage);
  }, [scrollToStage]);

  const confirmStageChange = useCallback(() => {
    if (!pendingStage) return;
    const now = new Date().toISOString();
    const prev = profile.journeyHistory ?? {};

    const nextHistory = { ...prev };
    // Mark the outgoing stage as completed (if it has a record).
    const outgoing = profile.journeyStage;
    if (outgoing === "fertility" && nextHistory.fertility) {
      nextHistory.fertility = { ...nextHistory.fertility, completedAt: now };
    } else if (outgoing === "pregnant" && nextHistory.pregnancy) {
      nextHistory.pregnancy = { ...nextHistory.pregnancy, completedAt: now };
    }

    // Seed the incoming stage with a startedAt timestamp if missing.
    if (pendingStage === "fertility") {
      nextHistory.fertility = { startedAt: now, ...(nextHistory.fertility ?? {}) };
    } else if (pendingStage === "pregnant") {
      nextHistory.pregnancy = { startedAt: now, ...(nextHistory.pregnancy ?? {}) };
    } else if (pendingStage === "postpartum") {
      nextHistory.postpartum = { startedAt: now, ...(nextHistory.postpartum ?? {}) };
    }

    updateProfile({
      journeyStage: pendingStage,
      isPregnant: pendingStage === "pregnant",
      journeyHistory: nextHistory,
    });
    setPendingStage(null);
  }, [pendingStage, profile.journeyStage, profile.journeyHistory, updateProfile]);

  return (
    <Layout>
      <SEOHead
        title={t("journey.map.seo.title", "My Journey")}
        description={t("journey.map.seo.description", "Visualize your stages and history")}
      />

      <main
        role="main"
        aria-labelledby="journey-page-title"
        dir={isRTL ? "rtl" : "ltr"}
        className={`relative pb-24 bg-gradient-to-b ${stageTheme.gradient} min-h-screen`}
      >
        <header className="container px-3 sm:px-4 pt-4 pb-2" role="banner">
          <BackButton />
          <motion.h1
            id="journey-page-title"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-foreground"
          >
            {t("journey.map.title", "My Journey")}
          </motion.h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t(
              "journey.map.subtitle",
              "An overview of where you have been, where you are, and what comes next.",
            )}
          </p>

          <nav
            className="mt-3"
            aria-label={t("journey.map.nav.stages", "Journey stages navigation")}
          >
            <JourneyProgressRibbon onStationSelect={handleRibbonStation} />
          </nav>
        </header>

        {/* Unified container — single padding/gap rhythm matching SmartDashboard tabs.
            All sections share px-3 sm:px-4 horizontally and space-y-4 sm:space-y-5 vertically. */}
        <div className="container px-3 sm:px-4 mt-3 space-y-4 sm:space-y-5 pb-6">
          <h2 id="journey-timeline-heading" className="sr-only">
            {t("journey.map.regions.timeline", "Chronological timeline")}
          </h2>
          <section aria-labelledby="journey-timeline-heading">
            <JourneyTimeline />
          </section>

          <h2 id="journey-milestones-heading" className="sr-only">
            {t("journey.map.regions.milestones", "Missing milestones")}
          </h2>
          <section aria-labelledby="journey-milestones-heading">
            <JourneyMissingMilestones />
          </section>

          <h2 id="journey-changelog-heading" className="sr-only">
            {t("journey.map.regions.changelog", "Date change log")}
          </h2>
          <section aria-labelledby="journey-changelog-heading">
            <JourneyDateChangeLog />
          </section>

          <h2 id="journey-autodetect-heading" className="sr-only">
            {t("journey.map.regions.autodetect", "Auto-detect settings")}
          </h2>
          <section aria-labelledby="journey-autodetect-heading">
            <JourneyAutoDetectToggle />
          </section>

          <h2 id="journey-stages-heading" className="sr-only">
            {t("journey.map.regions.stages", "Journey stages overview")}
          </h2>
          <section aria-labelledby="journey-stages-heading" className="space-y-4 sm:space-y-5">
          {entries.map((entry, idx) => {
            const Icon = STAGE_ICONS[entry.stage];
            const isActive = entry.stage === profile.journeyStage;
            const isPast = idx < activeIndex;
            const isFuture = idx > activeIndex;
            const stageLabel = t(`journey.ribbon.stages.${entry.stage}`);
            const statusKey = isActive
              ? "journey.map.status.current"
              : isPast
                ? "journey.map.status.past"
                : "journey.map.status.upcoming";

            return (
              <motion.div
                key={entry.stage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
              >
                <Card
                  data-stage-card={entry.stage}
                  id={`stage-${entry.stage}`}
                  role="article"
                  aria-labelledby={`stage-heading-${entry.stage}`}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "relative p-4 rounded-2xl border-border/60 transition-all",
                    isActive && "ring-2 ring-primary/40 shadow-md",
                    isFuture && "opacity-75",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      aria-hidden
                      className="shrink-0 h-11 w-11 rounded-2xl flex items-center justify-center"
                      style={{
                        background: isActive
                          ? `hsl(${stageTheme.accentHue} 65% 55% / 0.18)`
                          : "hsl(var(--muted) / 0.5)",
                        color: isActive
                          ? `hsl(${stageTheme.accentHue} 60% 40%)`
                          : "hsl(var(--muted-foreground))",
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <h2 id={`stage-heading-${entry.stage}`} className="text-base font-bold text-foreground truncate">
                          {stageLabel}
                        </h2>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            isActive && "bg-primary/15 text-primary",
                            isPast && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            isFuture && "bg-muted/60 text-muted-foreground",
                          )}
                        >
                          {t(statusKey)}
                        </span>
                      </div>

                      {/* History notes */}
                      {entry.notes.length > 0 || entry.startedAt || entry.completedAt ? (
                        <dl className="mt-2 grid grid-cols-1 gap-1 text-xs">
                          {entry.startedAt && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              <dt className="font-semibold">{t("journey.map.fields.startedAt")}:</dt>
                              <dd className="text-foreground/80">{fmt(entry.startedAt)}</dd>
                            </div>
                          )}
                          {entry.completedAt && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                              <dt className="font-semibold">{t("journey.map.fields.completedAt")}:</dt>
                              <dd className="text-foreground/80">{fmt(entry.completedAt)}</dd>
                            </div>
                          )}
                          {entry.notes.map((n) => (
                            <div key={n.labelKey} className="flex items-center gap-2 text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" aria-hidden />
                              <dt className="font-semibold">{t(n.labelKey)}:</dt>
                              <dd className="text-foreground/80 truncate">{n.value}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {t("journey.map.empty", "No records for this stage yet.")}
                        </p>
                      )}

                      {!isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStageSelect(entry.stage)}
                          className="mt-3 h-8 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10"
                          aria-label={t("journey.map.switchTo", { stage: stageLabel })}
                        >
                          {t("journey.map.switchTo", { stage: stageLabel })}
                          <ArrowRight className={cn("h-3.5 w-3.5 ms-1", isRTL && "rotate-180")} aria-hidden />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          </section>

          <h2 id="journey-memories-heading" className="sr-only">
            {t("journey.map.regions.memories", "Saved memories")}
          </h2>
          <section aria-labelledby="journey-memories-heading">
            <JourneyMemoriesPanel />
          </section>
        </div>
      </main>

      <AlertDialog open={pendingStage !== null} onOpenChange={(o) => !o && setPendingStage(null)}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("journey.map.confirm.title", "Switch journey stage?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStage &&
                t("journey.map.confirm.description", {
                  stage: t(`journey.ribbon.stages.${pendingStage}`),
                  defaultValue: "This will set your active stage to {{stage}}.",
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("journey.map.confirm.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStageChange}>
              {t("journey.map.confirm.confirm", "Confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default JourneyMap;

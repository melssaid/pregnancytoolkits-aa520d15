/**
 * TodayActivityLog — compact, calm log of what was completed today,
 * with direct "next step" links so the user always knows what to do next.
 *
 * Reads the same localStorage signals as useTrackingStats so it stays in
 * sync without duplicating data. No gamification, no points, no streaks.
 */
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Check, ChevronLeft, ChevronRight, Pill, Droplets, Utensils, Hand, Dumbbell, Sparkles,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import type { SavedAIResult } from "@/hooks/useSavedResults";

function hasSavedToday(toolId: string): boolean {
  const all = safeParseLocalStorage<SavedAIResult[]>(
    "ai-saved-results", [],
    (d): d is SavedAIResult[] => Array.isArray(d),
  );
  const today = new Date().toDateString();
  return all.some(r => r.toolId === toolId && new Date(r.savedAt).toDateString() === today);
}

interface LogEntry {
  id: string;
  done: boolean;
  icon: typeof Pill;
  labelAr: string;
  labelEn: string;
  detail?: string;
  /** Where to go to extend this activity (or do it for the first time). */
  nextHref: string;
  nextLabelAr: string;
  nextLabelEn: string;
}

export const TodayActivityLog = memo(function TodayActivityLog() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const isAr = i18n.language === "ar";
  const { stats, profile, isPregnant } = useDashboardData();
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  const entries: LogEntry[] = useMemo(() => {
    const v = stats.dailyTracking.vitaminsTaken;
    const w = stats.dailyTracking.waterGlasses;
    const k = stats.dailyTracking.todayKicks;
    const mealDone = hasSavedToday("ai-meal-suggestion");
    const fitnessDone = hasSavedToday("ai-fitness-coach");
    const kicksRelevant = isPregnant && (profile.pregnancyWeek || 0) >= 28;

    const list: LogEntry[] = [
      {
        id: "vitamin",
        done: v >= 1,
        icon: Pill,
        labelAr: "الفيتامين اليومي",
        labelEn: "Daily vitamin",
        detail: v > 0 ? `${v}` : undefined,
        nextHref: "/tools/vitamin-tracker",
        nextLabelAr: v >= 1 ? "عرض السجل" : "تسجيل الآن",
        nextLabelEn: v >= 1 ? "View log" : "Log now",
      },
      {
        id: "water",
        done: w >= 8,
        icon: Droplets,
        labelAr: "الترطيب",
        labelEn: "Hydration",
        detail: `${w}/8`,
        nextHref: "#hydration-tracker",
        nextLabelAr: w >= 8 ? "تم اليوم" : "أضيفي كأساً",
        nextLabelEn: w >= 8 ? "Done today" : "Add a glass",
      },
      {
        id: "meal",
        done: mealDone,
        icon: Utensils,
        labelAr: "وجبة اليوم",
        labelEn: "Today's meal",
        nextHref: "/tools/ai-meal-suggestion",
        nextLabelAr: mealDone ? "اقتراح آخر" : "اقتراح وجبة",
        nextLabelEn: mealDone ? "Suggest another" : "Plan a meal",
      },
      {
        id: "fitness",
        done: fitnessDone,
        icon: Dumbbell,
        labelAr: "حركة اليوم",
        labelEn: "Movement",
        nextHref: "/tools/ai-fitness-coach",
        nextLabelAr: fitnessDone ? "تمرين آخر" : "خطة تمرين",
        nextLabelEn: fitnessDone ? "Another set" : "Get a plan",
      },
    ];

    if (kicksRelevant) {
      list.push({
        id: "kicks",
        done: k >= 10,
        icon: Hand,
        labelAr: "حركة الطفل",
        labelEn: "Baby kicks",
        detail: k > 0 ? `${k}` : undefined,
        nextHref: "/tools/kick-counter",
        nextLabelAr: k >= 10 ? "جلسة جديدة" : "ابدئي العدّ",
        nextLabelEn: k >= 10 ? "New session" : "Start counting",
      });
    }

    return list;
  }, [stats.dailyTracking, profile.pregnancyWeek, isPregnant]);

  const doneCount = entries.filter(e => e.done).length;
  const hasAnyDone = doneCount > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label={isAr ? "سجل اليوم" : "Today's activity"}
      className="relative overflow-hidden rounded-3xl border border-primary/15
                 bg-gradient-to-br from-primary/[0.04] via-card to-accent/[0.04]
                 shadow-[0_4px_18px_-10px_hsl(var(--primary)/0.18)]"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15">
          <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary/80">
            {t("activityLog.kicker", isAr ? "سجل اليوم" : "Today")}
          </p>
          <p className="text-[13px] font-extrabold text-foreground leading-tight">
            {hasAnyDone
              ? t("activityLog.summary", {
                  defaultValue: isAr ? "أنجزتِ {{n}} من {{total}}" : "{{n}} of {{total}} done",
                  n: doneCount,
                  total: entries.length,
                })
              : t("activityLog.empty", isAr ? "لم تُسجَّل أنشطة بعد اليوم" : "No activity logged yet today")}
          </p>
        </div>
      </div>

      {/* Entries */}
      <ul className="px-2 pb-2.5">
        {entries.map((e) => {
          const Icon = e.icon;
          return (
            <li key={e.id}>
              <Link
                to={e.nextHref.startsWith("#") ? "#" : e.nextHref}
                onClick={(ev) => {
                  if (e.nextHref.startsWith("#")) {
                    ev.preventDefault();
                    document.getElementById(e.nextHref.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                className="group flex items-center gap-2.5 px-2 py-2 rounded-2xl
                           hover:bg-primary/[0.04] active:bg-primary/[0.07]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={`${isAr ? e.labelAr : e.labelEn} — ${isAr ? e.nextLabelAr : e.nextLabelEn}`}
              >
                {/* Status dot */}
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 ${
                    e.done
                      ? "bg-gradient-to-br from-done/20 to-done/10 ring-1 ring-done/30"
                      : "bg-muted/40 ring-1 ring-border/40"
                  }`}
                >
                  {e.done ? (
                    <Check className="h-3.5 w-3.5 text-done" strokeWidth={3} />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
                  )}
                </span>

                {/* Label + detail */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[12.5px] font-bold leading-tight truncate ${
                    e.done ? "text-foreground" : "text-foreground/85"
                  }`}>
                    {isAr ? e.labelAr : e.labelEn}
                    {e.detail && (
                      <span className="ms-1.5 text-[11px] font-extrabold text-primary tabular-nums">
                        {e.detail}
                      </span>
                    )}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground leading-tight truncate">
                    {isAr ? e.nextLabelAr : e.nextLabelEn}
                  </p>
                </div>

                <Chevron className="h-3.5 w-3.5 text-primary/45 flex-shrink-0
                                    group-hover:text-primary transition-colors" />
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
});

export default TodayActivityLog;

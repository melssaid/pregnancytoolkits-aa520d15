/**
 * DailyFocusRibbon — Single most-urgent action for the user, right now.
 *
 * Replaces the cognitive load of 10+ equal-weight cards with one clear,
 * scientifically-prioritized prompt (vitamin → water → meal → kicks).
 * Includes a calm, ungamified progress ribbon (n/total today).
 */
import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useLanguage } from "@/contexts/LanguageContext";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import type { SavedAIResult } from "@/hooks/useSavedResults";
import { pickDailyFocus, countCompleted, DAILY_TASK_TOTAL } from "@/lib/dailyFocus";
import { haptic } from "@/lib/haptics";
import { publishDataChange } from "@/lib/dataBus";
import { getUserId } from "@/hooks/useSupabase";

function hasSavedToday(toolId: string): boolean {
  const all = safeParseLocalStorage<SavedAIResult[]>(
    "ai-saved-results", [],
    (d): d is SavedAIResult[] => Array.isArray(d),
  );
  const today = new Date().toDateString();
  return all.some(r => r.toolId === toolId && new Date(r.savedAt).toDateString() === today);
}

export const DailyFocusRibbon = memo(function DailyFocusRibbon() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { profile, stats, hour, isPregnant } = useDashboardData();

  const inputs = useMemo(() => ({
    hour,
    vitaminsTaken: stats.dailyTracking.vitaminsTaken,
    waterGlasses: stats.dailyTracking.waterGlasses,
    todayKicks: stats.dailyTracking.todayKicks,
    week: profile.pregnancyWeek || 0,
    isPregnant,
    mealLoggedToday: hasSavedToday("ai-meal-suggestion"),
    fitnessLoggedToday: hasSavedToday("ai-fitness-coach"),
  }), [hour, stats.dailyTracking, profile.pregnancyWeek, isPregnant]);

  const focus = useMemo(() => pickDailyFocus(inputs), [inputs]);
  const completed = useMemo(() => countCompleted(inputs), [inputs]);
  const pct = Math.round((completed / DAILY_TASK_TOTAL) * 100);
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  if (!focus) return null;

  const Icon = focus.icon;
  const isAnchor = focus.href.startsWith("#");

  const handleClick = (e: React.MouseEvent) => {
    haptic("tap");
    if (isAnchor) {
      e.preventDefault();
      const el = document.getElementById(focus.href.slice(1));
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-primary/20
                 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.05]
                 shadow-[0_4px_18px_-8px_hsl(var(--primary)/0.18)]"
    >
      {/* Top: focus action */}
      <Link
        to={isAnchor ? "#" : focus.href}
        onClick={handleClick}
        aria-label={t(focus.labelKey, focus.fallbackLabel)}
        className="flex items-center gap-3.5 px-4 pt-4 pb-3 active:scale-[0.99] transition-transform
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-3xl"
      >
        <div
          aria-hidden="true"
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
                     bg-gradient-to-br from-primary/15 to-accent/15
                     ring-1 ring-primary/15"
        >
          <Icon className="w-5 h-5 text-primary" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary/80 mb-0.5">
            {t("dailyFocus.title", "بؤرة اليوم")}
          </p>
          <p className="text-[15px] font-extrabold text-foreground leading-snug truncate">
            {t(focus.labelKey, focus.fallbackLabel)}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
            {t(focus.reasonKey, focus.fallbackReason)}
          </p>
        </div>
        <Chevron className="w-4 h-4 text-primary/50 flex-shrink-0" />
      </Link>

      {/* Bottom: progress ribbon — calm, no gamification */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-semibold text-muted-foreground tracking-wide">
            {t("dailyFocus.dayProgress", "تقدّم اليوم")}
          </span>
          <span className="text-[10px] font-bold tabular-nums text-foreground/70">
            {completed}/{DAILY_TASK_TOTAL}
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </div>
    </motion.div>
  );
});

export default DailyFocusRibbon;

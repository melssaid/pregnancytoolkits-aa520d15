import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { TodayStoryHero } from "@/components/dashboard/TodayStoryHero";
import { RiskAlertCard } from "@/components/dashboard/RiskAlertCard";
import { DailyPriorities } from "@/components/dashboard/DailyPriorities";
import { HydrationTracker } from "@/components/dashboard/HydrationTracker";
import { NutritionTipCard } from "@/components/dashboard/NutritionTipCard";
import { DailyHealthChallengeCard } from "@/components/dashboard/DailyHealthChallengeCard";
import { BabySizeCard } from "@/components/dashboard/BabySizeCard";
import { BirthCountdownCard } from "@/components/dashboard/BirthCountdownCard";
import { UnifiedToolsGrid } from "@/components/dashboard/UnifiedToolsGrid";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { FertilityCycleCard } from "@/components/dashboard/FertilityCycleCard";
import { PostpartumRecoveryTimeline } from "@/components/journey/PostpartumRecoveryTimeline";
import { WelcomeMomentCard } from "@/components/dashboard/WelcomeMomentCard";
import { DailyFocusRibbon } from "@/components/dashboard/DailyFocusRibbon";
import { NextMilestoneCard } from "@/components/dashboard/NextMilestoneCard";
import { DayCompletionState } from "@/components/dashboard/DayCompletionState";
import { TodayActivityLog } from "@/components/dashboard/TodayActivityLog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserProfile } from "@/hooks/useUserProfile";
import { countCompleted, DAILY_TASK_TOTAL } from "@/lib/dailyFocus";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import type { SavedAIResult } from "@/hooks/useSavedResults";

function _hasSavedToday(toolId: string): boolean {
  const all = safeParseLocalStorage<SavedAIResult[]>(
    "ai-saved-results", [],
    (d): d is SavedAIResult[] => Array.isArray(d),
  );
  const today = new Date().toDateString();
  return all.some(r => r.toolId === toolId && new Date(r.savedAt).toDateString() === today);
}

/**
 * "Today" tab — primary daily focus.
 * Order is dynamic based on time of day (morning/afternoon/evening).
 * Cards self-hide when their underlying data is empty.
 *
 * Refactor (Option A): each card appears EXACTLY ONCE per render path.
 * Time slot only changes the relative ORDER of the daily cards — never
 * mounts duplicates.
 */
export const TodayTab = memo(function TodayTab() {
  const { t } = useTranslation();
  const { profile, stats, bloodPressure, timeSlot, isPregnant, dataCheck } = useDashboardData();
  const { profile: userProfile } = useUserProfile();
  // SSoT: useUserProfile.journeyStage is the single source of truth for the
  // active stage across the dashboard AND /my-journey. No fallback heuristic.
  const stage = userProfile.journeyStage;
  const isFertility = stage === "fertility";
  const isPostpartum = stage === "postpartum";

  // Only show pregnancy-tied content when the user has set a real week
  const hasRealWeek = stage === "pregnant" && profile.pregnancyWeek >= 4;

  // ── Dynamic ordering of the SAME set of daily cards ───────────────
  // Each card key appears exactly once in the array — the time slot
  // simply re-orders the relative emphasis (morning → nutrition first,
  // afternoon → hydration first, evening → challenge first).
  const dailyCards: Array<{ key: string; node: React.ReactNode } | null> = (() => {
    const nutrition = hasRealWeek ? { key: "nut", node: <NutritionTipCard /> } : null;
    const hydration = { key: "hyd", node: <HydrationTracker /> };
    const baby = hasRealWeek ? { key: "baby", node: <BabySizeCard /> } : null;
    const challenge = { key: "ch", node: <DailyHealthChallengeCard /> };

    if (timeSlot === "morning") return [nutrition, hydration, baby, challenge];
    if (timeSlot === "afternoon") return [hydration, nutrition, baby, challenge];
    return [challenge, nutrition, hydration, baby]; // evening
  })();

  // Smart empty state: brand-new user with no profile and no data
  const isBrandNew = !isPregnant && !dataCheck.hasAnyData;

  // Day-completion check — if every essential task is done, show the
  // calm "you're done for today" panel instead of the focus ribbon.
  const completed = countCompleted({
    hour: new Date().getHours(),
    vitaminsTaken: stats.dailyTracking.vitaminsTaken,
    waterGlasses: stats.dailyTracking.waterGlasses,
    todayKicks: stats.dailyTracking.todayKicks,
    week: profile.pregnancyWeek || 0,
    isPregnant,
    mealLoggedToday: _hasSavedToday("ai-meal-suggestion"),
    fitnessLoggedToday: _hasSavedToday("ai-fitness-coach"),
  });
  const dayDone = completed >= DAILY_TASK_TOTAL;

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* One-time gentle welcome after onboarding */}
      <WelcomeMomentCard />

      <TodayStoryHero />

      <RiskAlertCard
        bloodPressure={bloodPressure}
        todayKicks={stats.dailyTracking.todayKicks}
        week={profile.pregnancyWeek}
      />

      {/* Single-action focus OR calm completion state */}
      {dayDone ? <DayCompletionState /> : <DailyFocusRibbon />}

      {/* Compact log of what was done today + direct next-step links */}
      <TodayActivityLog />

      {/* Next pregnancy milestone — gives "next-step certainty" */}
      <NextMilestoneCard />

      <DailyPriorities
        vitaminsTaken={stats.dailyTracking.vitaminsTaken}
        todayKicks={stats.dailyTracking.todayKicks}
        waterGlasses={stats.dailyTracking.waterGlasses}
        upcomingAppointments={stats.planning.upcomingAppointments}
      />

      {/* Stage-specific hero — one card per stage to avoid clutter.
          Postpartum uses the recovery timeline as its primary identity card;
          PostpartumCareCard is reached via UnifiedToolsGrid links. */}
      {isFertility && <FertilityCycleCard />}
      {isPostpartum && <PostpartumRecoveryTimeline />}

      {/* Unified tools grid — single navigation surface (replaces the
          duplicated QuickProblemSolver shortcuts that overlapped with it). */}
      <UnifiedToolsGrid />

      {/* Brand-new user nudge */}
      {isBrandNew && (
        <EmptyStateCard
          icon={Sparkles}
          title={t("dashboardV2.todayEmpty.title")}
          description={t("dashboardV2.todayEmpty.desc")}
          ctaLabel={t("dashboardV2.todayEmpty.cta")}
          ctaHref="/discover"
        />
      )}

      {/* Time-based section — single, deduplicated set of daily cards */}
      <div className="space-y-4">
        {dailyCards.filter(Boolean).map((c) => (
          <div key={c!.key}>{c!.node}</div>
        ))}
      </div>

      {/* Birth countdown only in last trimester (pregnancy stage) */}
      {stage === "pregnant" && isPregnant && profile.pregnancyWeek >= 28 && <BirthCountdownCard />}
    </div>
  );
});

export default TodayTab;

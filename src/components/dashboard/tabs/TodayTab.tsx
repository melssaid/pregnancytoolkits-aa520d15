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
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserProfile } from "@/hooks/useUserProfile";

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
  const hasRealWeek = isPregnant && profile.pregnancyWeek >= 4 && stage === "pregnant";

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

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      <TodayStoryHero />

      <RiskAlertCard
        bloodPressure={bloodPressure}
        todayKicks={stats.dailyTracking.todayKicks}
        week={profile.pregnancyWeek}
      />

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

import { memo } from "react";
import { Sparkles, Activity, Brain, LineChart, ClipboardList, Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HealthScoreRing } from "@/components/dashboard/HealthScoreRing";
import { HolisticAIAnalysisCard } from "@/components/dashboard/HolisticAIAnalysisCard";
import { SonarHistoryTrendsCard } from "@/components/dashboard/SonarHistoryTrendsCard";
import { DataSourcesPanel } from "@/components/dashboard/DataSourcesPanel";
import { SignalsPreviewPanel } from "@/components/dashboard/SignalsPreviewPanel";
import { WeeklyComparisonCard } from "@/components/dashboard/WeeklyComparisonCard";
import { MoodTrendCard } from "@/components/dashboard/MoodTrendCard";
import { WeeklySymptomsCard } from "@/components/dashboard/WeeklySymptomsCard";
import { WeightTrendCard } from "@/components/dashboard/WeightTrendCard";
import { FetalMovementCard } from "@/components/dashboard/FetalMovementCard";
import { RecentMealFitnessSummary } from "@/components/dashboard/RecentMealFitnessSummary";
import { UltrasoundSummaryCard } from "@/components/dashboard/UltrasoundSummaryCard";
import { DailyNutritionCard } from "@/components/dashboard/DailyNutritionCard";
import { WeeklyKickFrequencyChart } from "@/components/charts/WeeklyKickFrequencyChart";
import { WeeklyHydrationChart } from "@/components/charts/WeeklyHydrationChart";
import { WeeklyContractionFrequencyChart } from "@/components/charts/WeeklyContractionFrequencyChart";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserProfile } from "@/hooks/useUserProfile";

/**
 * "Insights" tab — clinical-grade analytics layout.
 *
 * Sections (top → bottom = overview → granular):
 *   A. Overview       → HealthScoreRing
 *   B. Vital Signals  → SignalsPreviewPanel + DataSourcesPanel (transparency)
 *   C. Deep Analysis  → HolisticAIAnalysisCard + SonarHistoryTrendsCard
 *   D. Stage Summary  → Ultrasound, Nutrition, Weekly comparison
 *   E. Trend Charts   → Kicks, hydration, contractions
 *   F. Detailed Logs  → Mood, symptoms, weight, movement, meals
 */

interface SectionProps {
  icon: React.ElementType;
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Section = ({ icon: Icon, label, hint, children }: SectionProps) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2 px-1">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-[13px] font-bold text-foreground leading-tight tracking-tight">
          {label}
        </h2>
        {hint && (
          <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5 truncate">
            {hint}
          </p>
        )}
      </div>
      <div className="h-px w-8 bg-gradient-to-l from-border to-transparent shrink-0" />
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

export const InsightsTab = memo(function InsightsTab() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { stats, dataCheck, isPregnant } = useDashboardData();
  const { profile: userProfile } = useUserProfile();
  const stage = userProfile.journeyStage || (isPregnant ? "pregnant" : "pregnant");
  const isPregnancyStage = stage === "pregnant";

  const hasAnyInsight =
    dataCheck.hasMoodData || dataCheck.hasWeight || dataCheck.hasSymptomsData ||
    dataCheck.hasRecentActivity || dataCheck.hasHydration || dataCheck.hasContractions ||
    stats.dailyTracking.todayKicks > 0 || dataCheck.hasKickSessions ||
    dataCheck.hasSleepData;

  const hasCharts =
    (isPregnancyStage && dataCheck.hasKickSessions) ||
    dataCheck.hasHydration ||
    (isPregnancyStage && dataCheck.hasContractions);
  const hasDetail =
    dataCheck.hasMoodData || dataCheck.hasSymptomsData || dataCheck.hasWeight ||
    (isPregnancyStage && (stats.dailyTracking.todayKicks > 0 || dataCheck.hasKickSessions)) ||
    dataCheck.hasRecentActivity;

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {/* ───── A · OVERVIEW ───── */}
      <Section
        icon={Gauge}
        label={isRTL ? "نظرة عامة" : "Overview"}
        hint={isRTL ? "مؤشر صحي شامل لحالتك اليوم" : "At-a-glance wellness score"}
      >
        <HealthScoreRing />
      </Section>

      {/* ───── B · VITAL SIGNALS ───── */}
      <Section
        icon={Activity}
        label={isRTL ? "المؤشرات الحيوية" : "Vital Signals"}
        hint={isRTL ? "إشارات مباشرة من بياناتك ومصادرها" : "Live signals & data sources"}
      >
        <SignalsPreviewPanel />
        <DataSourcesPanel />
      </Section>

      {/* ───── C · DEEP ANALYSIS ───── */}
      <Section
        icon={Brain}
        label={isRTL ? "التحليل العميق" : "Deep Analysis"}
        hint={isRTL ? "تركيب ذكي شامل وسجل التحاليل السابقة" : "AI synthesis & historical trends"}
      >
        <HolisticAIAnalysisCard />
        <SonarHistoryTrendsCard />
      </Section>

      {/* ───── D · STAGE SUMMARY ───── */}
      <Section
        icon={ClipboardList}
        label={isRTL ? "ملخص هذه المرحلة" : "Stage Summary"}
        hint={isRTL ? "السونار، التغذية، والمقارنة الأسبوعية" : "Ultrasound, nutrition & weekly comparison"}
      >
        {isPregnancyStage && <UltrasoundSummaryCard />}
        <DailyNutritionCard />
        {isPregnancyStage && isPregnant && <WeeklyComparisonCard />}
      </Section>

      {/* ───── E · TREND CHARTS ───── */}
      {hasCharts && (
        <Section
          icon={LineChart}
          label={isRTL ? "اتجاهات أسبوعية" : "Weekly Trends"}
          hint={isRTL ? "رسوم بيانية تظهر عند توفر البيانات" : "Charts appear when data exists"}
        >
          {isPregnancyStage && dataCheck.hasKickSessions && <WeeklyKickFrequencyChart />}
          {dataCheck.hasHydration && <WeeklyHydrationChart />}
          {isPregnancyStage && dataCheck.hasContractions && <WeeklyContractionFrequencyChart />}
        </Section>
      )}

      {/* ───── F · DETAILED LOGS ───── */}
      {hasDetail && (
        <Section
          icon={Sparkles}
          label={isRTL ? "السجلات التفصيلية" : "Detailed Logs"}
          hint={isRTL ? "المزاج، الأعراض، الوزن، الحركة، والوجبات" : "Mood, symptoms, weight, movement & meals"}
        >
          {dataCheck.hasMoodData && <MoodTrendCard />}
          {dataCheck.hasSymptomsData && <WeeklySymptomsCard />}
          {dataCheck.hasWeight && <WeightTrendCard />}
          {isPregnancyStage && (stats.dailyTracking.todayKicks > 0 || dataCheck.hasKickSessions) && (
            <FetalMovementCard todayKicks={stats.dailyTracking.todayKicks} />
          )}
          {dataCheck.hasRecentActivity && <RecentMealFitnessSummary />}
        </Section>
      )}

      {/* Smart empty state */}
      {!hasAnyInsight && (
        <EmptyStateCard
          icon={Sparkles}
          title={t("dashboardV2.insightsEmpty.title")}
          description={t("dashboardV2.insightsEmpty.desc")}
          ctaLabel={t("dashboardV2.insightsEmpty.cta")}
          ctaHref="/tools/wellness-diary"
        />
      )}
    </div>
  );
});

export default InsightsTab;

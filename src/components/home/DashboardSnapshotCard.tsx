import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Activity,
  Pill,
  ListChecks,
  Check,
  Circle,
  Hand,
  Utensils,
  Dumbbell,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import type { SavedAIResult } from "@/hooks/useSavedResults";

/**
 * Compact dashboard snapshot displayed at the top of the homepage.
 * Native-app pattern (Apple Health / Google Fit): summary card + CTA to full dashboard.
 * Includes today's priorities (no water) inline so the user sees actionable items
 * without leaving home.
 */

function hasSavedToday(toolId: string): boolean {
  const all = safeParseLocalStorage<SavedAIResult[]>(
    "ai-saved-results",
    [],
    (d): d is SavedAIResult[] => Array.isArray(d)
  );
  const today = new Date().toDateString();
  return all.some(
    (r) => r.toolId === toolId && new Date(r.savedAt).toDateString() === today
  );
}

const DashboardSnapshotCard = memo(function DashboardSnapshotCard() {
  const { t, i18n } = useTranslation();
  const { stats, week, isPregnant } = useDashboardData();
  const isRtl = i18n.language === "ar";
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const todayKicks = stats?.dailyTracking?.todayKicks || 0;
  const vitamins = stats?.dailyTracking?.vitaminsTaken || 0;

  const mealDoneToday = useMemo(() => hasSavedToday("ai-meal-suggestion"), []);
  const fitnessDoneToday = useMemo(() => hasSavedToday("ai-fitness-coach"), []);

  const priorities = useMemo(
    () => [
      {
        id: "kicks",
        icon: Hand,
        label: t("dailyDashboard.priorities.kicks", "ركلات الجنين"),
        done: todayKicks >= 10,
        href: "/tools/kick-counter",
      },
      {
        id: "meals",
        icon: Utensils,
        label: t("dailyDashboard.priorities.meals", "وجبة اليوم"),
        done: mealDoneToday,
        href: "/tools/ai-meal-suggestion",
      },
      {
        id: "fitness",
        icon: Dumbbell,
        label: t("dailyDashboard.priorities.fitness", "نشاط بدني"),
        done: fitnessDoneToday,
        href: "/tools/ai-fitness-coach",
      },
    ],
    [todayKicks, mealDoneToday, fitnessDoneToday, t]
  );

  const completed = priorities.filter((p) => p.done).length;

  const quickStats = [
    {
      icon: Activity,
      value: todayKicks,
      label: t("dashboard.kicks", "ركلات"),
      color: "hsl(340,55%,55%)",
    },
    {
      icon: Pill,
      value: vitamins,
      label: t("dashboard.vitamins", "فيتامين"),
      color: "hsl(280,45%,55%)",
    },
    {
      icon: ListChecks,
      value: `${completed}/${priorities.length}`,
      label: t("dashboard.priorities", "أولويات"),
      color: "hsl(160,50%,42%)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[hsl(340,40%,88%)]/60 bg-gradient-to-br from-[hsl(340,55%,97%)] via-[hsl(320,40%,97%)] to-[hsl(290,40%,97%)] dark:from-[hsl(340,30%,12%)] dark:via-[hsl(320,25%,11%)] dark:to-[hsl(290,25%,11%)] dark:border-[hsl(340,25%,25%)]/60 shadow-[0_2px_14px_-4px_hsl(340_50%_55%_/_0.18)]"
    >
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute -top-8 -end-8 w-32 h-32 rounded-full bg-gradient-to-br from-[hsl(340,60%,75%)]/30 to-transparent blur-2xl" />

      {/* Header — links to full dashboard */}
      <Link
        to="/dashboard"
        className="relative block px-3.5 pt-3.5 pb-2.5 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(340,55%,55%)] to-[hsl(320,50%,50%)] flex items-center justify-center shadow-[0_2px_8px_-1px_hsl(340_50%_55%_/_0.4)] shrink-0">
              <LayoutDashboard
                className="w-[18px] h-[18px] text-white"
                strokeWidth={2.2}
              />
            </div>
            <div className="min-w-0">
              <h3
                className="text-[13px] font-bold text-foreground leading-tight truncate"
                style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
              >
                {t("dashboard.snapshotTitle", "لوحتي")}
              </h3>
              {isPregnant && week > 0 && (
                <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">
                  {t("dashboard.weekLabel", "الأسبوع")} {week}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[hsl(340,55%,45%)] dark:text-[hsl(340,50%,70%)] shrink-0">
            <span>{t("dashboard.openCta", "فتح")}</span>
            <Chevron className="w-3.5 h-3.5" strokeWidth={2.4} />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-card/70 dark:bg-card/40 backdrop-blur-sm border border-border/30"
              >
                <Icon
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: stat.color }}
                  strokeWidth={2.2}
                />
                <div className="min-w-0 flex items-baseline gap-1">
                  <span className="text-[12px] font-extrabold text-foreground leading-none tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-[9.5px] text-muted-foreground leading-none truncate">
                    {stat.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Link>

      {/* Priorities checklist — inline actionable shortcuts (no water) */}
      <div className="relative px-3.5 pb-3.5 pt-1">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10.5px] font-bold text-foreground/80 tracking-tight">
            {t("dailyDashboard.priorities.title", "أولويات اليوم")}
          </span>
          <span className="text-[9.5px] font-bold tabular-nums text-[hsl(340,55%,45%)] dark:text-[hsl(340,50%,70%)] bg-[hsl(340,55%,55%)]/10 px-1.5 py-0.5 rounded-full">
            {completed}/{priorities.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {priorities.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.id}
                to={p.href}
                className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-xl border transition-all active:scale-[0.96] min-w-0 ${
                  p.done
                    ? "bg-[hsl(160,50%,42%)]/8 border-[hsl(160,50%,42%)]/25"
                    : "bg-card/70 dark:bg-card/40 border-border/30 hover:border-[hsl(340,45%,70%)]/50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                    p.done
                      ? "bg-[hsl(160,50%,42%)]/15"
                      : "bg-muted/60 dark:bg-muted/30"
                  }`}
                >
                  {p.done ? (
                    <Check
                      className="w-3 h-3 text-[hsl(160,50%,38%)]"
                      strokeWidth={3}
                    />
                  ) : (
                    <Icon
                      className="w-3 h-3 text-foreground/55"
                      strokeWidth={2.2}
                    />
                  )}
                </div>
                <span
                  className={`text-[9.5px] font-semibold leading-tight truncate ${
                    p.done
                      ? "text-[hsl(160,50%,32%)] dark:text-[hsl(160,40%,75%)]"
                      : "text-foreground/80"
                  }`}
                >
                  {p.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

export default DashboardSnapshotCard;

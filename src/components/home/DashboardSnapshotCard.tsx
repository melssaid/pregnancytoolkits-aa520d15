import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Hand,
  Utensils,
  Dumbbell,
  Check,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import type { SavedAIResult } from "@/hooks/useSavedResults";

/**
 * Premium dashboard snapshot — hero card on the homepage.
 * Inspiration: Apple Health, Oura, Whoop, Google Fit.
 * Hierarchy: hero metric (week) → today's pulse (stats) → actionable priorities → CTA.
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
  const { stats, week, isPregnant, timeSlot } = useDashboardData();
  const isRtl = i18n.language === "ar";

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
  const progressPct = (completed / priorities.length) * 100;


  // Progress ring geometry
  const ringSize = 44;
  const stroke = 3.5;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-white/70 dark:border-white/5
                 bg-gradient-to-br from-[hsl(345,60%,98%)] via-[hsl(330,45%,97%)] to-[hsl(295,40%,97%)]
                 dark:from-[hsl(340,28%,11%)] dark:via-[hsl(320,22%,10%)] dark:to-[hsl(290,22%,10%)]
                 shadow-[-14px_22px_48px_-18px_hsl(340_70%_45%_/_0.45),-6px_12px_24px_-10px_hsl(290_55%_45%_/_0.30),0_2px_6px_-2px_hsl(340_40%_40%_/_0.16),inset_0_1px_0_0_hsl(0_0%_100%/0.85)]
                 dark:shadow-[-14px_22px_44px_-14px_hsl(0_0%_0%/0.7),-6px_10px_20px_-8px_hsl(0_0%_0%/0.45),inset_0_1px_0_0_hsl(0_0%_100%/0.06)]"
    >
      {/* Layered ambient lights — Apple Health style depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
        <div className="absolute -top-16 -end-12 w-48 h-48 rounded-full bg-[radial-gradient(circle,hsl(340,75%,72%)_0%,transparent_65%)] opacity-30 blur-2xl" />
        <div className="absolute -bottom-20 -start-10 w-44 h-44 rounded-full bg-[radial-gradient(circle,hsl(280,65%,72%)_0%,transparent_65%)] opacity-25 blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/10" />
      </div>

      {/* ── Hero row: greeting + week + CTA ─────────────────────────── */}
      <Link
        to="/dashboard"
        className="relative block px-4 pt-4 pb-3 group active:scale-[0.995] transition-transform"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left: greeting + hero metric */}
          <div className="min-w-0 flex-1">
            {isPregnant && week > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[34px] leading-none font-black text-foreground tracking-tight tabular-nums"
                  style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
                >
                  {week}
                </span>
                <span className="text-[12px] font-bold text-[hsl(340,30%,18%)] dark:text-[hsl(340,20%,90%)] leading-tight">
                  {t("dashboard.weekLabel", "الأسبوع")}
                </span>
              </div>
            ) : (
              <h3
                className="text-[20px] leading-tight font-black text-foreground tracking-tight"
                style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
              >
                {t("dashboard.snapshotTitle", "لوحتي")}
              </h3>
            )}
          </div>

          {/* Right: progress ring with CTA — hero focal element */}
          <div className="relative shrink-0 flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="absolute inset-0 -rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="hsl(340,30%,88%)"
                strokeOpacity="0.5"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="url(#snapshot-ring-grad)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              />
              <defs>
                <linearGradient id="snapshot-ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(340,70%,58%)" />
                  <stop offset="100%" stopColor="hsl(290,55%,55%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(340,60%,55%)] to-[hsl(310,55%,50%)] shadow-[0_3px_10px_-2px_hsl(340_55%_55%_/_0.55),inset_0_1px_0_0_hsl(0_0%_100%/0.4)] group-active:scale-95 transition-transform">
              <ArrowUpRight
                className={`w-3.5 h-3.5 text-white ${isRtl ? "scale-x-[-1]" : ""}`}
                strokeWidth={2.6}
              />
            </div>
          </div>
        </div>

        {/* ── Today's pulse: 2 quick stats inline ─────────────────── */}
        <div className="mt-3 flex items-center gap-2">
          <StatChip
            value={todayKicks}
            label={t("dashboard.kicks", "ركلات")}
            color="hsl(340,60%,52%)"
          />
          <StatChip
            value={vitamins}
            label={t("dashboard.vitamins", "فيتامين")}
            color="hsl(280,50%,55%)"
          />
          <div className="ms-auto flex items-baseline gap-0.5 px-1">
            <span className="text-[14px] font-black tabular-nums text-foreground leading-none">
              {completed}
            </span>
            <span className="text-[10px] font-bold text-[hsl(340,15%,28%)] dark:text-[hsl(340,15%,82%)] leading-none">
              /{priorities.length}
            </span>
          </div>
        </div>
      </Link>

      {/* ── Priorities strip — actionable, premium pills ────────────── */}
      <div className="relative px-4 pb-4 pt-1">
        <div className="grid grid-cols-3 gap-1.5">
          {priorities.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
              >
                <Link
                  to={p.href}
                  className={`group/pill relative flex items-center justify-center gap-1.5 px-2 py-2 rounded-2xl border transition-all duration-200 active:scale-[0.96] min-w-0 overflow-hidden ${
                    p.done
                      ? "bg-gradient-to-br from-[hsl(160,55%,94%)] to-[hsl(160,45%,90%)] dark:from-[hsl(160,30%,16%)] dark:to-[hsl(160,25%,13%)] border-[hsl(160,50%,75%)]/50 dark:border-[hsl(160,40%,30%)]/50"
                      : "bg-white/70 dark:bg-white/[0.04] border-white/80 dark:border-white/[0.06] hover:border-[hsl(340,50%,75%)]/60 backdrop-blur-sm"
                  }`}
                >
                  {p.done && (
                    <div className="relative w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[hsl(160,55%,45%)] to-[hsl(160,55%,38%)] shadow-[0_2px_5px_-1px_hsl(160_55%_42%_/_0.45)]">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.2} />
                    </div>
                  )}
                  <span
                    className={`text-[10px] font-bold leading-tight truncate ${
                      p.done
                        ? "text-[hsl(160,70%,18%)] dark:text-[hsl(160,45%,82%)]"
                        : "text-[hsl(340,20%,18%)] dark:text-[hsl(340,15%,90%)]"
                    }`}
                  >
                    {p.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

/* ── Stat chip — compact, glassy ─────────────────────────────────── */
const StatChip = memo(function StatChip({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-white/90 dark:border-white/[0.06] shadow-[0_1px_3px_-1px_hsl(340_40%_40%_/_0.18)] dark:shadow-none backdrop-blur-sm">
      <div className="flex items-baseline gap-1 min-w-0">
        <span className="text-[12px] font-extrabold leading-none tabular-nums" style={{ color }}>
          {value}
        </span>
        <span className="text-[10px] font-semibold text-[hsl(340,18%,28%)] dark:text-[hsl(340,15%,82%)] leading-none truncate">
          {label}
        </span>
      </div>
    </div>
  );
});

export default DashboardSnapshotCard;

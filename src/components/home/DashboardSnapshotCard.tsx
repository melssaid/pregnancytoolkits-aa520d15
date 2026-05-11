import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
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
  const { stats, week, isPregnant } = useDashboardData();
  const isRtl = i18n.language === "ar";

  const todayKicks = stats?.dailyTracking?.todayKicks || 0;
  const vitamins = stats?.dailyTracking?.vitaminsTaken || 0;

  // Live-sync tick: bumps when tools save results or storage changes,
  // so meal/fitness checkmarks update without reloading the page.
  const [syncTick, setSyncTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const bump = () => setSyncTick((n) => n + 1);
    const onStorage = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === "ai-saved-results" ||
        e.key.startsWith("daily-tracking") ||
        e.key.startsWith("kick-counter") ||
        e.key.startsWith("vitamin")
      ) {
        bump();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") bump();
    };
    window.addEventListener("ai-results-saved", bump);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("ai-results-saved", bump);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Trigger a brief refresh indicator whenever syncTick increments (skip mount).
  const firstSyncRef = useRef(true);
  useEffect(() => {
    if (firstSyncRef.current) {
      firstSyncRef.current = false;
      return;
    }
    setIsRefreshing(true);
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      setIsRefreshing(false);
    }, 900);
    return () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [syncTick]);

  const mealDoneToday = useMemo(() => hasSavedToday("ai-meal-suggestion"), [syncTick]);
  const fitnessDoneToday = useMemo(() => hasSavedToday("ai-fitness-coach"), [syncTick]);

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
      className="relative"
      style={{
        // Soft, subtle outer shadow only — depth comes from the inner gradient.
        filter:
          "drop-shadow(0 6px 14px hsl(340 50% 40% / 0.10)) drop-shadow(0 2px 4px hsl(340 30% 30% / 0.06))",
      }}
    >
      {/* Top concave curve — mirrors the header's bottom curve pixel-for-pixel.
          Uses identical viewBox (0 0 1440 120) and responsive heights so the
          gap between header and card stays parallel at every breakpoint. */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block w-full h-[14px] sm:h-[20px] md:h-[26px] -mb-px"
      >
        <path
          d="M0,0 C210,120 515,120 720,120 C925,120 1230,120 1440,0 L1440,120 L0,120 Z"
          className="fill-[hsl(345,70%,96%)] dark:fill-[hsl(340,28%,12%)]"
        />
      </svg>
      <div
        className="relative overflow-hidden rounded-b-[28px]
                   bg-gradient-to-br from-[hsl(345,70%,96%)] via-[hsl(330,55%,93%)] to-[hsl(290,50%,90%)]
                   dark:from-[hsl(340,30%,12%)] dark:via-[hsl(320,26%,11%)] dark:to-[hsl(285,26%,13%)]"
      >
      {/* Inner color shading — richer rose→lavender depth inside the card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -end-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,hsl(340,80%,70%)_0%,transparent_70%)] opacity-45 blur-2xl" />
        <div className="absolute -bottom-24 -start-14 w-52 h-52 rounded-full bg-[radial-gradient(circle,hsl(280,70%,68%)_0%,transparent_70%)] opacity-40 blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-32 rounded-full bg-[radial-gradient(ellipse,hsl(320,65%,75%)_0%,transparent_75%)] opacity-25 blur-3xl" />
      </div>

      {/* ── Hero row: greeting + week + CTA ─────────────────────────── */}
      <Link
        to="/dashboard"
        className="relative block px-4 pt-3.5 sm:pt-4 md:pt-5 pb-3 group active:scale-[0.995] transition-transform"
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
            {/* Refresh pulse — tiny dot that blinks when values sync */}
            <AnimatePresence>
              {isRefreshing && (
                <motion.span
                  key="refresh-dot"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  className="absolute -top-0.5 -end-0.5 flex h-2.5 w-2.5"
                  aria-hidden="true"
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[hsl(340,75%,60%)] opacity-70 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-br from-[hsl(340,75%,60%)] to-[hsl(290,60%,55%)] ring-2 ring-white/80 dark:ring-[hsl(340,28%,11%)]/80" />
                </motion.span>
              )}
            </AnimatePresence>
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
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={completed}
                initial={{ opacity: 0, y: -6, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.85 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="text-[14px] font-black tabular-nums text-foreground leading-none inline-block"
              >
                {completed}
              </motion.span>
            </AnimatePresence>
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
                      ? "bg-gradient-to-br from-[hsl(160,55%,94%)] to-[hsl(160,45%,90%)] dark:from-[hsl(160,30%,16%)] dark:to-[hsl(160,25%,13%)] border-[hsl(160,50%,75%)]/50 dark:border-[hsl(160,40%,30%)]/50 shadow-[-6px_8px_16px_-6px_hsl(160_55%_38%_/_0.35),-2px_3px_6px_-2px_hsl(160_50%_40%_/_0.22),inset_0_1px_0_0_hsl(0_0%_100%/0.7)] dark:shadow-[-6px_8px_14px_-6px_hsl(0_0%_0%/0.55),inset_0_1px_0_0_hsl(0_0%_100%/0.05)]"
                      : "bg-white/75 dark:bg-white/[0.04] border-white/80 dark:border-white/[0.06] hover:border-[hsl(340,50%,75%)]/60 backdrop-blur-sm shadow-[-6px_8px_16px_-6px_hsl(340_65%_45%_/_0.32),-2px_3px_6px_-2px_hsl(290_50%_45%_/_0.22),inset_0_1px_0_0_hsl(0_0%_100%/0.85)] dark:shadow-[-6px_8px_14px_-6px_hsl(0_0%_0%/0.55),inset_0_1px_0_0_hsl(0_0%_100%/0.05)]"
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
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/85 dark:bg-white/[0.04] border border-white/90 dark:border-white/[0.06] shadow-[-5px_6px_12px_-5px_hsl(340_65%_45%_/_0.32),-2px_3px_6px_-2px_hsl(290_50%_45%_/_0.22),inset_0_1px_0_0_hsl(0_0%_100%/0.85)] dark:shadow-[-5px_6px_12px_-5px_hsl(0_0%_0%/0.55),inset_0_1px_0_0_hsl(0_0%_100%/0.05)] backdrop-blur-sm">
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

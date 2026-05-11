import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Hand, Utensils, Dumbbell, Check } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useStageTheme } from "@/hooks/useStageTheme";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import type { SavedAIResult } from "@/hooks/useSavedResults";

/**
 * Dashboard snapshot — refined homepage hero card.
 * Design intent:
 *  - Calm, premium surface that harmonises with the app's stage theme.
 *  - Soft rounded geometry (rounded-3xl) — no oversized concave curves.
 *  - Tokenised colors via useStageTheme for true theme cohesion.
 *  - Tight, balanced spacing; clear hierarchy: week → pulse → priorities.
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
  const theme = useStageTheme();
  const isRtl = i18n.language === "ar";

  const todayKicks = stats?.dailyTracking?.todayKicks || 0;
  const vitamins = stats?.dailyTracking?.vitaminsTaken || 0;

  // Live-sync: refresh derived values when storage / save events fire.
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

  const firstSyncRef = useRef(true);
  useEffect(() => {
    if (firstSyncRef.current) {
      firstSyncRef.current = false;
      return;
    }
    setIsRefreshing(true);
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => setIsRefreshing(false), 900);
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
  const ringSize = 42;
  const stroke = 3;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  const accent = theme.accentHue;
  const accentAlt = theme.accentHueAlt;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl overflow-hidden border border-border/40 bg-card"
      style={{
        boxShadow:
          `0 1px 0 0 hsl(0 0% 100% / 0.6) inset, 0 8px 24px -12px hsl(${accent} 40% 35% / 0.18), 0 2px 6px -2px hsl(${accent} 30% 30% / 0.08)`,
      }}
    >
      {/* Tokenised stage-aware tint — subtle, harmonised with app theme */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: `linear-gradient(135deg, hsl(${accent} 55% 97%) 0%, hsl(${accentAlt} 45% 96%) 55%, hsl(${accent} 35% 95%) 100%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dark:opacity-100 opacity-0"
        style={{
          background: `linear-gradient(135deg, hsl(${accent} 28% 11%) 0%, hsl(${accentAlt} 24% 12%) 100%)`,
        }}
      />
      {/* Soft accent glow — single, restrained */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -end-16 w-48 h-48 rounded-full blur-3xl opacity-40"
        style={{
          background: `radial-gradient(circle, hsl(${accent} 70% 70%) 0%, transparent 70%)`,
        }}
      />

      {/* ── Hero row ────────────────────────────────────────────────── */}
      <Link
        to="/dashboard"
        className="relative block px-4 pt-4 pb-3 group active:scale-[0.995] transition-transform"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isPregnant && week > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[32px] leading-none font-black text-foreground tracking-tight tabular-nums"
                  style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
                >
                  {week}
                </span>
                <span className="text-[12px] font-bold text-muted-foreground leading-tight">
                  {t("dashboard.weekLabel", "الأسبوع")}
                </span>
              </div>
            ) : (
              <h3
                className="text-[19px] leading-tight font-black text-foreground tracking-tight"
                style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
              >
                {t("dashboard.snapshotTitle", "لوحتي")}
              </h3>
            )}
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground/90 leading-tight truncate">
              {t("dashboard.snapshotSubtitle", "ملخص يومك")}
            </p>
          </div>

          {/* Progress ring + CTA */}
          <div
            className="relative shrink-0 flex items-center justify-center"
            style={{ width: ringSize, height: ringSize }}
          >
            <svg width={ringSize} height={ringSize} className="absolute inset-0 -rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={`hsl(${accent} 25% 85%)`}
                strokeOpacity="0.6"
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
                  <stop offset="0%" stopColor={`hsl(${accent} 65% 55%)`} />
                  <stop offset="100%" stopColor={`hsl(${accentAlt} 55% 52%)`} />
                </linearGradient>
              </defs>
            </svg>
            <div
              className="relative flex items-center justify-center w-7 h-7 rounded-full group-active:scale-95 transition-transform"
              style={{
                background: `linear-gradient(135deg, hsl(${accent} 60% 52%), hsl(${accentAlt} 55% 48%))`,
                boxShadow: `0 3px 10px -2px hsl(${accent} 55% 45% / 0.45), inset 0 1px 0 0 hsl(0 0% 100% / 0.35)`,
              }}
            >
              <ArrowUpRight
                className={`w-3.5 h-3.5 text-white ${isRtl ? "scale-x-[-1]" : ""}`}
                strokeWidth={2.6}
              />
            </div>
            <AnimatePresence>
              {isRefreshing && (
                <motion.span
                  key="refresh-dot"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  className="absolute -top-0.5 -end-0.5 flex h-2 w-2"
                  aria-hidden
                >
                  <span
                    className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping"
                    style={{ background: `hsl(${accent} 70% 60%)` }}
                  />
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full ring-2 ring-card"
                    style={{
                      background: `linear-gradient(135deg, hsl(${accent} 70% 58%), hsl(${accentAlt} 60% 52%))`,
                    }}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <div className="mt-3 flex items-center gap-1.5">
          <StatChip
            value={todayKicks}
            label={t("dashboard.kicks", "ركلات")}
            color={`hsl(${accent} 55% 48%)`}
          />
          <StatChip
            value={vitamins}
            label={t("dashboard.vitamins", "فيتامين")}
            color={`hsl(${accentAlt} 50% 48%)`}
          />
          <div className="ms-auto flex items-baseline gap-0.5 px-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={completed}
                initial={{ opacity: 0, y: -5, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.85 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="text-[14px] font-black tabular-nums text-foreground leading-none inline-block"
              >
                {completed}
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] font-bold text-muted-foreground leading-none">
              /{priorities.length}
            </span>
          </div>
        </div>
      </Link>

      {/* ── Priorities strip ────────────────────────────────────────── */}
      <div className="relative px-4 pb-4 pt-1">
        <div className="grid grid-cols-3 gap-1.5">
          {priorities.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.05, duration: 0.3 }}
              >
                <Link
                  to={p.href}
                  className={`group/pill relative flex items-center justify-center gap-1.5 px-2 py-2 rounded-2xl border transition-all duration-200 active:scale-[0.96] min-w-0 overflow-hidden ${
                    p.done
                      ? "bg-[hsl(160,45%,95%)] dark:bg-[hsl(160,28%,14%)] border-[hsl(160,40%,75%)]/50 dark:border-[hsl(160,30%,28%)]/60"
                      : "bg-card/80 dark:bg-white/[0.04] border-border/60 backdrop-blur-sm"
                  }`}
                  style={
                    !p.done
                      ? {
                          boxShadow: `0 1px 2px 0 hsl(${accent} 40% 30% / 0.06), inset 0 1px 0 0 hsl(0 0% 100% / 0.6)`,
                        }
                      : undefined
                  }
                >
                  {p.done ? (
                    <div className="relative w-4 h-4 rounded-full flex items-center justify-center shrink-0 bg-[hsl(160,55%,42%)] shadow-[0_2px_4px_-1px_hsl(160_55%_42%_/_0.4)]">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.2} />
                    </div>
                  ) : (
                    <Icon
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: `hsl(${accent} 50% 50%)` }}
                      strokeWidth={2.2}
                    />
                  )}
                  <span
                    className={`text-[10px] font-bold leading-tight truncate ${
                      p.done
                        ? "text-[hsl(160,55%,22%)] dark:text-[hsl(160,40%,82%)]"
                        : "text-foreground/85"
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

/* ── Stat chip ─────────────────────────────────────────────────────── */
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
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-card/85 dark:bg-white/[0.04] border border-border/50 backdrop-blur-sm shadow-[0_1px_2px_0_hsl(0_0%_0%/0.04),inset_0_1px_0_0_hsl(0_0%_100%/0.6)]">
      <div className="flex items-baseline gap-1 min-w-0">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: -5, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.85 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="text-[12px] font-extrabold leading-none tabular-nums inline-block"
            style={{ color }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] font-semibold text-muted-foreground leading-none truncate">
          {label}
        </span>
      </div>
    </div>
  );
});

export default DashboardSnapshotCard;

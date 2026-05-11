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
        // Shorter, single-word labels — fit comfortably in 3-col grid on 360px
        label: t("dailyDashboard.priorities.kicksShort", isRtl ? "ركلات" : "Kicks"),
        done: todayKicks >= 10,
        href: "/tools/kick-counter",
      },
      {
        id: "meals",
        icon: Utensils,
        label: t("dailyDashboard.priorities.mealsShort", isRtl ? "وجبة" : "Meal"),
        done: mealDoneToday,
        href: "/tools/ai-meal-suggestion",
      },
      {
        id: "fitness",
        icon: Dumbbell,
        label: t("dailyDashboard.priorities.fitnessShort", isRtl ? "نشاط" : "Move"),
        done: fitnessDoneToday,
        href: "/tools/ai-fitness-coach",
      },
    ],
    [todayKicks, mealDoneToday, fitnessDoneToday, t, isRtl]
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
  // Horizontal sweep — in RTL we run from right (saturated) to left (soft),
  // matching the natural Arabic reading flow.
  const gradAngle = isRtl ? 270 : 90;

  // ── Smart subtitle: contextual sentence reflects today's progress.
  const subtitle = useMemo(() => {
    if (completed === priorities.length) {
      return t("dashboard.snapshotComplete", "أحسنتِ، أكملتِ مهام اليوم");
    }
    if (completed === 0) {
      return t("dashboard.snapshotStart", "ابدئي يومكِ بخطوة بسيطة");
    }
    return t("dashboard.snapshotProgress", "تابعي — تبقّى القليل");
  }, [completed, priorities.length, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-t-[34px] rounded-b-3xl overflow-hidden border border-border/40 bg-card"
      style={{
        boxShadow:
          `0 1px 0 0 hsl(0 0% 100% / 0.6) inset, 0 12px 28px -12px hsl(${accent} 60% 35% / 0.30), 0 2px 6px -2px hsl(${accent} 40% 25% / 0.12)`,
      }}
    >
      {/* Soft cream-to-rose gradient — gentle, premium, low-saturation */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(${gradAngle}deg, hsl(${accent} 55% 92%) 0%, hsl(35 60% 96%) 55%, hsl(40 70% 97%) 100%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dark:opacity-100 opacity-0"
        style={{
          background: `linear-gradient(${gradAngle}deg, hsl(${accent} 35% 22%) 0%, hsl(${accent} 25% 16%) 55%, hsl(35 20% 12%) 100%)`,
        }}
      />
      {/* Subtle sheen on the cream side to lift depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 end-0 w-1/3"
        style={{
          background: `linear-gradient(${isRtl ? 90 : 270}deg, hsl(0 0% 100% / 0.45), transparent)`,
        }}
      />
      {/* Concave top arc — mirrors the header's curved bottom for harmony */}
      <svg
        aria-hidden
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-0 left-0 right-0 h-[14px] sm:h-[18px] z-[1]"
      >
        <path
          d="M0,0 L0,8 C320,40 1120,40 1440,8 L1440,0 Z"
          fill={`hsl(${accent} 50% 100% / 0.55)`}
        />
      </svg>

      {/* ── Hero row ────────────────────────────────────────────────── */}
      <Link
        to="/dashboard"
        className="relative block px-4 sm:px-5 pt-3.5 sm:pt-4 pb-3 group active:scale-[0.995] transition-transform"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isPregnant && week > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-[12px] font-bold text-foreground/75 dark:text-foreground/80 leading-[1.2]">
                  {t("dashboard.weekLabel", "الأسبوع")}
                </span>
                <span
                  className="text-[30px] sm:text-[32px] leading-[1] font-black text-foreground tracking-tight tabular-nums"
                  style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
                >
                  {week}
                </span>
              </div>
            ) : (
              <h3
                className="text-[18px] sm:text-[19px] leading-[1.2] font-black text-foreground tracking-tight"
                style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
              >
                {t("dashboard.snapshotTitle", "لوحتي اليومية")}
              </h3>
            )}
            <p className="mt-1 text-[11.5px] font-semibold text-foreground/80 dark:text-foreground/85 leading-[1.35] truncate">
              {subtitle}
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
                background: `linear-gradient(${gradAngle}deg, hsl(${accent} 60% 52%), hsl(${accentAlt} 55% 48%))`,
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
                      background: `linear-gradient(${gradAngle}deg, hsl(${accent} 70% 58%), hsl(${accentAlt} 60% 52%))`,
                    }}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <div className="mt-3.5 flex items-center gap-2">
          <StatChip
            value={todayKicks}
            label={t("dashboard.kicks", "ركلات")}
            colorLight={`hsl(${accent} 70% 32%)`}
            colorDark={`hsl(${accent} 75% 78%)`}
            isRefreshing={isRefreshing}
          />
          <StatChip
            value={vitamins}
            label={t("dashboard.vitamins", "فيتامين")}
            colorLight={`hsl(${accentAlt} 65% 32%)`}
            colorDark={`hsl(${accentAlt} 70% 78%)`}
            isRefreshing={isRefreshing}
          />
          <div className="ms-auto flex items-baseline gap-0.5 px-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={completed}
                initial={{ opacity: 0, y: -5, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.85 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="text-[14px] font-black tabular-nums text-foreground leading-[1] inline-block"
              >
                {completed}
              </motion.span>
            </AnimatePresence>
            <span className="text-[11px] font-bold text-foreground/65 dark:text-foreground/70 leading-[1]">
              /{priorities.length}
            </span>
          </div>
        </div>
      </Link>

      {/* ── Priorities strip ────────────────────────────────────────── */}
      <div className="relative px-4 sm:px-5 pb-3 pt-1">
        <div className="grid grid-cols-3 gap-2">
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
                  className={`group/pill relative flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-2xl border transition-all duration-200 active:scale-[0.96] min-w-0 overflow-hidden ${
                    p.done
                      ? ""
                      : "bg-card/80 dark:bg-white/[0.04] border-border/60 backdrop-blur-sm"
                  }`}
                  style={
                    p.done
                      ? {
                          background: `linear-gradient(${gradAngle}deg, hsl(${accent} 70% 94%), hsl(${accentAlt} 60% 96%))`,
                          borderColor: `hsl(${accent} 55% 80% / 0.55)`,
                          boxShadow: `0 1px 2px 0 hsl(${accent} 50% 40% / 0.08), inset 0 1px 0 0 hsl(0 0% 100% / 0.7)`,
                        }
                      : {
                          boxShadow: `0 1px 2px 0 hsl(${accent} 40% 30% / 0.06), inset 0 1px 0 0 hsl(0 0% 100% / 0.6)`,
                        }
                  }
                >
                  {p.done ? (
                    <div
                      className="relative w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `linear-gradient(${gradAngle}deg, hsl(${accent} 65% 52%), hsl(${accentAlt} 58% 50%))`,
                        boxShadow: `0 2px 4px -1px hsl(${accent} 60% 45% / 0.45)`,
                      }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.2} />
                    </div>
                  ) : (
                    <Icon
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: `hsl(${accent} 65% 38%)` }}
                      strokeWidth={2.4}
                    />
                  )}
                  <span
                    className={`text-[10.5px] font-bold leading-[1.25] truncate ${
                      p.done ? "" : "text-foreground/90 dark:text-foreground/95"
                    }`}
                    style={
                      p.done ? { color: `hsl(${accent} 55% 22%)` } : undefined
                    }
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
  colorLight,
  colorDark,
  isRefreshing = false,
}: {
  value: number | string;
  label: string;
  colorLight: string;
  colorDark: string;
  isRefreshing?: boolean;
}) {
  return (
    <div
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-card/90 dark:bg-white/[0.06] border border-border/60 backdrop-blur-sm shadow-[0_1px_2px_0_hsl(0_0%_0%/0.05),inset_0_1px_0_0_hsl(0_0%_100%/0.65)] overflow-hidden"
      style={
        {
          "--chip-color-light": colorLight,
          "--chip-color-dark": colorDark,
        } as React.CSSProperties
      }
    >
      {/* Skeleton shimmer overlay during refresh */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.span
            key="chip-shimmer"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer-chip 1.1s ease-in-out infinite",
            }}
          />
        )}
      </AnimatePresence>
      <style>{`@keyframes shimmer-chip{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <motion.div
        animate={{ opacity: isRefreshing ? 0.55 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative flex items-baseline gap-1 min-w-0"
      >
        <span className="inline-block text-center tabular-nums" style={{ minWidth: "1.1ch" }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={String(value)}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="text-[12.5px] font-extrabold leading-[1] tabular-nums inline-block text-[var(--chip-color-light)] dark:text-[var(--chip-color-dark)]"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="text-[10.5px] font-semibold text-foreground/70 dark:text-foreground/75 leading-[1] truncate">
          {label}
        </span>
      </motion.div>
    </div>
  );
});

export default DashboardSnapshotCard;

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useTrackingStats } from "@/hooks/useTrackingStats";
import { useOptimizedMotion } from "@/hooks/useOptimizedMotion";

export function HealthScoreRing() {
  const { t } = useTranslation();
  const { stats } = useTrackingStats();
  const m = useOptimizedMotion();

  // Real data presence — never render synthetic 0/100 score
  const hasWater = stats.dailyTracking.waterGlasses > 0;
  const hasKicks = stats.dailyTracking.todayKicks > 0;
  const hasVitamins = stats.dailyTracking.vitaminsTaken > 0;
  const hasActivity = !!stats.dailyTracking.lastWeight || stats.postpartum.sleepHoursToday > 0;
  const hasAnyRealData = hasWater || hasKicks || hasVitamins || hasActivity;
  if (!hasAnyRealData) return null;

  // Calculate score from 4 pillars (each 25 points max) — only from logged data
  const waterScore = Math.min(stats.dailyTracking.waterGlasses / 8, 1) * 25;
  const kickScore = Math.min(stats.dailyTracking.todayKicks / 10, 1) * 25;
  const vitaminScore = Math.min(stats.dailyTracking.vitaminsTaken / 3, 1) * 25;
  const activityScore = (stats.dailyTracking.lastWeight ? 12.5 : 0) + (stats.postpartum.sleepHoursToday > 0 ? 12.5 : 0);

  const totalScore = Math.round(waterScore + kickScore + vitaminScore + activityScore);
  const progress = totalScore / 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - progress * circumference;

  const scoreColor = totalScore >= 70 ? "text-done" : totalScore >= 40 ? "text-yellow-500" : "text-red-400";
  const scoreLabel = totalScore >= 70 ? t("healthScore.great") : totalScore >= 40 ? t("healthScore.good") : t("healthScore.needsWork");

  const pillars = [
    { label: t("healthScore.water"), value: Math.round(waterScore), max: 25, color: "bg-blue-400" },
    { label: t("healthScore.kicks"), value: Math.round(kickScore), max: 25, color: "bg-pink-400" },
    { label: t("healthScore.vitamins"), value: Math.round(vitaminScore), max: 25, color: "bg-[hsl(var(--success))]" },
    { label: t("healthScore.activity"), value: Math.round(activityScore), max: 25, color: "bg-purple-400" },
  ];

  return (
    <Card className="p-5 bg-card border-border/40 rounded-3xl shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-extrabold text-foreground tracking-tight">{t("healthScore.title")}</h3>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 ${scoreColor}`}>
          {scoreLabel}
        </span>
      </div>
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/20" />
            <motion.circle
              cx="48" cy="48" r="42" fill="none"
              stroke="url(#healthGrad)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: m.disabled ? strokeDashoffset : circumference }}
              animate={{ strokeDashoffset }}
              transition={m.longTransition}
            />
            <defs>
              <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(142, 60%, 50%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              {...m.pop}
              className={`text-3xl font-black tabular-nums leading-none ${scoreColor}`}
            >
              {totalScore}
            </motion.span>
            <span className="text-[10px] font-semibold text-muted-foreground mt-0.5">/100</span>
          </div>
        </div>

        {/* Pillars breakdown */}
        <div className="flex-1 space-y-2">
          {pillars.map((p) => (
            <div key={p.label} className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground w-20 leading-tight whitespace-normal break-words" style={{ overflowWrap: 'anywhere' }}>{p.label}</span>
              <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${p.color} origin-left rtl:origin-right`}
                  style={{ width: `${(p.value / p.max) * 100}%`, willChange: m.disabled ? "auto" : "transform" }}
                  initial={{ scaleX: m.disabled ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={m.longTransition}
                />
              </div>
              <span className="text-[10px] font-bold text-foreground tabular-nums w-7 text-end">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

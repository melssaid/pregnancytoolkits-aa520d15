import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Radar, TrendingUp, TrendingDown, Minus, Calendar, Coins, Activity, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useSavedResults } from "@/hooks/useSavedResults";

type Trend = "up" | "down" | "flat";

interface RunPoint {
  id: string;
  date: Date;
  week?: number;
  pointsCost: number;
  engagementScore?: number;
  riskFlags: number;
  positiveSignals: number;
}

const SPARK_W = 220;
const SPARK_H = 36;

function trendOf(values: number[]): Trend {
  const xs = values.filter((n) => Number.isFinite(n));
  if (xs.length < 2) return "flat";
  const half = Math.max(1, Math.floor(xs.length / 2));
  const first = xs.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const second = xs.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, xs.length - half);
  const diff = second - first;
  const pct = first === 0 ? Math.abs(diff) : Math.abs(diff) / Math.abs(first);
  if (pct < 0.05) return "flat";
  return diff > 0 ? "up" : "down";
}

function buildSparkline(values: number[]): { path: string; dots: Array<{ x: number; y: number }> } {
  const valid = values.map((v, i) => ({ v, i })).filter((p) => Number.isFinite(p.v));
  if (valid.length < 2) return { path: "", dots: [] };
  const min = Math.min(...valid.map((p) => p.v));
  const max = Math.max(...valid.map((p) => p.v));
  const range = max - min || 1;
  const pad = 4;
  const innerW = SPARK_W - pad * 2;
  const innerH = SPARK_H - pad * 2;
  const step = innerW / Math.max(1, values.length - 1);
  const dots = valid.map((p) => ({
    x: pad + p.i * step,
    y: pad + innerH - ((p.v - min) / range) * innerH,
  }));
  const path = dots.map((d, i) => `${i === 0 ? "M" : "L"}${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(" ");
  return { path, dots };
}

function trendColor(t: Trend, positiveIsUp = true): string {
  if (t === "flat") return "hsl(var(--muted-foreground))";
  const isGood = positiveIsUp ? t === "up" : t === "down";
  return isGood ? "hsl(142 70% 40%)" : "hsl(35 85% 50%)";
}

function TrendIcon({ trend, positiveIsUp = true }: { trend: Trend; positiveIsUp?: boolean }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return <Icon className="w-3 h-3" style={{ color: trendColor(trend, positiveIsUp) }} />;
}

export const SonarHistoryTrendsCard = memo(function SonarHistoryTrendsCard() {
  const { t, i18n } = useTranslation();
  const { results } = useSavedResults("holistic-dashboard");

  const runs: RunPoint[] = useMemo(() => {
    return [...results]
      .map((r) => {
        const meta = (r?.meta || {}) as Record<string, any>;
        return {
          id: r.id,
          date: new Date(r.savedAt),
          week: typeof meta.week === "number" ? meta.week : undefined,
          pointsCost: typeof meta.pointsCost === "number" ? meta.pointsCost : 7,
          engagementScore: typeof meta.engagementScore === "number" ? meta.engagementScore : undefined,
          riskFlags: typeof meta.riskFlags === "number" ? meta.riskFlags : 0,
          positiveSignals: typeof meta.positiveSignals === "number" ? meta.positiveSignals : 0,
        } as RunPoint;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [results]);

  // Empty state
  if (runs.length === 0) {
    return (
      <Card className="overflow-hidden border-0 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, hsl(280 50% 97%), hsl(330 50% 97%))",
          border: "1px solid hsl(280 30% 90% / 0.5)",
        }}
      >
        <CardContent className="p-4 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl mx-auto bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center">
            <Radar className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-[14px] text-foreground">
            {t("dashboardV2.sonarHistory.title")}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[260px] mx-auto">
            {t("dashboardV2.sonarHistory.empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const last = runs[runs.length - 1];
  const first = runs[0];

  const engagementSeries = runs.map((r) => r.engagementScore ?? 0);
  const riskSeries = runs.map((r) => r.riskFlags);
  const positiveSeries = runs.map((r) => r.positiveSignals);

  const engagementTrend = trendOf(engagementSeries);
  const riskTrend = trendOf(riskSeries);
  const positiveTrend = trendOf(positiveSeries);

  const totalPoints = runs.reduce((s, r) => s + r.pointsCost, 0);
  const avgEngagement = engagementSeries.length
    ? Math.round(engagementSeries.reduce((a, b) => a + b, 0) / engagementSeries.length)
    : 0;

  const daysSpan = Math.max(
    1,
    Math.round((last.date.getTime() - first.date.getTime()) / 86_400_000) || 1,
  );

  // Pick which series to plot in the sparkline (engagement is most descriptive)
  const spark = buildSparkline(engagementSeries);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric" });

  return (
    <Card
      className="overflow-hidden border-0 rounded-2xl relative"
      style={{
        background:
          "linear-gradient(135deg, hsl(280 50% 97%) 0%, hsl(320 50% 97%) 50%, hsl(340 55% 97%) 100%)",
        boxShadow:
          "0 6px 22px -10px hsl(280 50% 50% / 0.18), 0 2px 6px -2px hsl(330 40% 40% / 0.12)",
        border: "1px solid hsl(280 30% 88% / 0.6)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, hsl(280 70% 80% / 0.4), transparent 50%), radial-gradient(circle at 0% 100%, hsl(330 60% 80% / 0.3), transparent 50%)",
        }}
      />

      <CardContent className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 p-2 rounded-xl"
            style={{
              background: "linear-gradient(135deg, hsl(280 60% 55%), hsl(var(--primary)))",
              boxShadow: "0 4px 12px -2px hsl(280 60% 50% / 0.4)",
            }}
          >
            <Radar className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[14px] text-foreground leading-tight">
              {t("dashboardV2.sonarHistory.title")}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {t("dashboardV2.sonarHistory.subtitle", { count: runs.length, days: daysSpan })}
            </p>
          </div>
        </div>

        {/* Sparkline (engagement over runs) */}
        {spark.path && (
          <div
            className="rounded-xl p-3"
            style={{ background: "hsl(0 0% 100% / 0.55)", border: "1px solid hsl(280 30% 90% / 0.5)" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-foreground/80">
                {t("dashboardV2.sonarHistory.engagementOverRuns")}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold tabular-nums" style={{ color: trendColor(engagementTrend) }}>
                <TrendIcon trend={engagementTrend} />
                {avgEngagement}%
              </span>
            </div>
            <svg width="100%" height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="sonar-spark" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="hsl(280 60% 55%)" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
              </defs>
              <motion.path
                d={spark.path}
                fill="none"
                stroke="url(#sonar-spark)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {spark.dots.map((d, i) => (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={i === spark.dots.length - 1 ? 3 : 2}
                  fill={i === spark.dots.length - 1 ? "hsl(var(--primary))" : "hsl(280 60% 55%)"}
                />
              ))}
            </svg>
          </div>
        )}

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-2">
          <StatTile
            icon={Activity}
            label={t("dashboardV2.sonarHistory.stats.positiveSignals")}
            value={String(last.positiveSignals)}
            sub={t("dashboardV2.sonarHistory.lastRunShort")}
            trend={positiveTrend}
            positiveIsUp
            iconColor="hsl(142 70% 40%)"
          />
          <StatTile
            icon={AlertCircle}
            label={t("dashboardV2.sonarHistory.stats.watchOuts")}
            value={String(last.riskFlags)}
            sub={t("dashboardV2.sonarHistory.lastRunShort")}
            trend={riskTrend}
            positiveIsUp={false}
            iconColor="hsl(35 85% 50%)"
          />
          <StatTile
            icon={Sparkles}
            label={t("dashboardV2.sonarHistory.stats.engagement")}
            value={`${last.engagementScore ?? 0}%`}
            sub={t("dashboardV2.sonarHistory.avgShort", { value: avgEngagement })}
            trend={engagementTrend}
            positiveIsUp
            iconColor="hsl(280 60% 55%)"
          />
          <StatTile
            icon={Coins}
            label={t("dashboardV2.sonarHistory.stats.pointsSpent")}
            value={String(totalPoints)}
            sub={t("dashboardV2.sonarHistory.runs", { count: runs.length })}
            trend="flat"
            positiveIsUp
            iconColor="hsl(45 85% 50%)"
          />
        </div>

        {/* Recent runs list (max 3) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t("dashboardV2.sonarHistory.recentRuns")}
            </span>
            <Link
              to="/settings"
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              {t("dashboardV2.sonarHistory.manageSources")}
            </Link>
          </div>
          <div className="rounded-xl overflow-hidden divide-y divide-border/40" style={{ background: "hsl(0 0% 100% / 0.5)", border: "1px solid hsl(280 30% 90% / 0.5)" }}>
            {[...runs].reverse().slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-2 px-2.5 py-2 text-[11px]">
                <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground/85 tabular-nums">
                  {dateFmt.format(r.date)}
                </span>
                {r.week !== undefined && (
                  <span className="text-foreground/60 tabular-nums">
                    {t("dashboardV2.sonarHistory.weekShort", { week: r.week })}
                  </span>
                )}
                <div className="flex-1" />
                <span className="flex items-center gap-1 text-done font-medium tabular-nums">
                  ●{r.positiveSignals}
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-medium tabular-nums">
                  ●{r.riskFlags}
                </span>
                <span className="flex items-center gap-0.5 text-foreground/60 font-medium tabular-nums">
                  <Coins className="w-2.5 h-2.5" />
                  {r.pointsCost}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

interface StatTileProps {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  sub: string;
  trend: Trend;
  positiveIsUp: boolean;
  iconColor: string;
}

function StatTile({ icon: Icon, label, value, sub, trend, positiveIsUp, iconColor }: StatTileProps) {
  return (
    <div
      className="rounded-xl p-2.5 space-y-0.5"
      style={{ background: "hsl(0 0% 100% / 0.55)", border: "1px solid hsl(280 30% 90% / 0.4)" }}
    >
      <div className="flex items-center justify-between gap-1">
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
        <TrendIcon trend={trend} positiveIsUp={positiveIsUp} />
      </div>
      <div className="text-[16px] font-bold text-foreground leading-tight tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground leading-snug">{label}</div>
      <div className="text-[9px] text-muted-foreground/70 leading-snug">{sub}</div>
    </div>
  );
}

export default SonarHistoryTrendsCard;

import { readKickSessions } from "@/lib/kickSessionsStore";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { getUserId } from "@/hooks/useSupabase";

interface MetricComparison {
  label: string;
  thisWeek: number;
  lastWeek: number;
  unit: string;
}

export function WeeklyComparisonCard() {
  const { t } = useTranslation();

  const userId = getUserId();
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const todayStr = today.toISOString().split("T")[0];
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split("T")[0];

  // Water this week vs last week
  const waterLogs = JSON.parse(localStorage.getItem(`water_logs_${userId}`) || "[]");
  const waterThisWeek = waterLogs.filter((l: any) => l.date >= weekAgoStr && l.date <= todayStr).reduce((s: number, l: any) => s + (l.glasses || 1), 0);
  const waterLastWeek = waterLogs.filter((l: any) => l.date >= twoWeeksAgoStr && l.date < weekAgoStr).reduce((s: number, l: any) => s + (l.glasses || 1), 0);

  // Kicks — unified canonical store
  const kickSessions = readKickSessions();
  const kicksThisWeek = kickSessions.filter((s: any) => s.started_at >= weekAgoStr).reduce((sum: number, s: any) => sum + (s.total_kicks || 0), 0);
  const kicksLastWeek = kickSessions.filter((s: any) => s.started_at >= twoWeeksAgoStr && s.started_at < weekAgoStr).reduce((sum: number, s: any) => sum + (s.total_kicks || 0), 0);

  // Vitamins
  const vitaminLogs = JSON.parse(localStorage.getItem("vitamin-tracker-logs") || "{}");
  const vitDates = Object.keys(vitaminLogs);
  const vitThisWeek = vitDates.filter(d => d >= weekAgoStr && d <= todayStr).length;
  const vitLastWeek = vitDates.filter(d => d >= twoWeeksAgoStr && d < weekAgoStr).length;

  const metrics: MetricComparison[] = [
    { label: t("weeklyComparison.water"), thisWeek: waterThisWeek, lastWeek: waterLastWeek, unit: t("weeklyComparison.glasses") },
    { label: t("weeklyComparison.kicks"), thisWeek: kicksThisWeek, lastWeek: kicksLastWeek, unit: "" },
    { label: t("weeklyComparison.vitamins"), thisWeek: vitThisWeek, lastWeek: vitLastWeek, unit: t("weeklyComparison.days") },
  ];

  const hasData = metrics.some(m => m.thisWeek > 0 || m.lastWeek > 0);
  if (!hasData) return null;

  return (
    <Card className="p-4 bg-card border-border/50">
      <h3 className="text-base font-bold text-foreground mb-3">{t("weeklyComparison.title")}</h3>
      <div className="space-y-2">
        {metrics.map((m) => {
          const diff = m.thisWeek - m.lastWeek;
          const trend = diff > 0 ? "up" : diff < 0 ? "down" : "same";
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between"
            >
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{m.thisWeek} {m.unit}</span>
                {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-done" />}
                {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                {trend === "same" && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                {diff !== 0 && (
                  <span className={`text-[10px] font-semibold ${trend === "up" ? "text-done" : "text-red-400"}`}>
                    {diff > 0 ? "+" : ""}{diff}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

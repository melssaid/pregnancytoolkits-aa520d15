import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ToolFrame } from "@/components/ToolFrame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Clock, Trash2, TrendingUp, BarChart3, Sparkles, Brain, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInMinutes, startOfDay, subDays, eachDayOfInterval } from "date-fns";
import { formatLocalized } from "@/lib/dateLocale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSmartInsight } from "@/hooks/useSmartInsight";
import { AIActionButton } from "@/components/ai/AIActionButton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { AIResponseFrame } from "@/components/ai/AIResponseFrame";
import { PrintableReport } from "@/components/PrintableReport";
import { Progress } from "@/components/ui/progress";
import { emitDataChange, STORAGE_KEYS } from "@/lib/dataBus";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";

interface SleepSession {
  id: string;
  startTime: string;
  endTime: string | null;
  type: "nap" | "night";
}

const STORAGE_KEY = "baby-sleep-tracker-data";

const BabySleepTracker = () => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { trackAction } = useAnalytics("baby-sleep-tracker");
  const { generate, isLoading: aiLoading, content: aiAdvice } = useSmartInsight({
    section: "sleep", toolType: "sleep-analysis",
  });

  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [activeSleep, setActiveSleep] = useState<SleepSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAiAdvice, setShowAiAdvice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed.filter((s: SleepSession) => s.endTime));
        const active = parsed.find((s: SleepSession) => !s.endTime);
        if (active) setActiveSleep(active);
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!activeSleep) { setElapsedTime(0); return; }
    const interval = setInterval(() => {
      setElapsedTime(differenceInMinutes(new Date(), new Date(activeSleep.startTime)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSleep]);

  const saveToStorage = (newSessions: SleepSession[], active: SleepSession | null) => {
    const toSave = active ? [...newSessions, active] : newSessions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave.slice(-100)));
    emitDataChange(STORAGE_KEYS.BABY_SLEEP);
  };

  const startSleep = (type: "nap" | "night") => {
    const newSession: SleepSession = {
      id: Date.now().toString(), startTime: new Date().toISOString(), endTime: null, type,
    };
    setActiveSleep(newSession);
    saveToStorage(sessions, newSession);
    trackAction("sleep_started", { type });
  };

  const endSleep = () => {
    if (!activeSleep) return;
    const completed = { ...activeSleep, endTime: new Date().toISOString() };
    const updated = [completed, ...sessions];
    setSessions(updated);
    setActiveSleep(null);
    saveToStorage(updated, null);
    trackAction("sleep_ended", {
      type: activeSleep.type,
      duration: differenceInMinutes(new Date(), new Date(activeSleep.startTime)),
    });
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    saveToStorage(updated, activeSleep);
  };

  const formatDuration = (mins: number) => {
    if (mins < 0) mins = 0;
    const hours = Math.floor(mins / 60);
    const remaining = Math.abs(mins % 60);
    if (hours > 0) return `${hours}h ${remaining}m`;
    return `${mins}m`;
  };

  const getTodayStats = () => {
    const today = startOfDay(new Date()).toISOString();
    const todaySessions = sessions.filter(
      (s) => new Date(s.startTime) >= new Date(today) && s.endTime
    );
    let totalMinutes = 0, napMinutes = 0, nightMinutes = 0;
    todaySessions.forEach((s) => {
      if (s.endTime) {
        const mins = Math.max(0, differenceInMinutes(new Date(s.endTime), new Date(s.startTime)));
        totalMinutes += mins;
        if (s.type === "nap") napMinutes += mins;
        else nightMinutes += mins;
      }
    });
    return { count: todaySessions.length, totalMinutes, napMinutes, nightMinutes };
  };

  const getLast7DaysAverage = () => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    let totalMinutes = 0;
    days.forEach((day) => {
      const dayStart = startOfDay(day);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);
      const daySessions = sessions.filter((s) => {
        const d = new Date(s.startTime);
        return d >= dayStart && d < nextDay && s.endTime;
      });
      daySessions.forEach((s) => {
        if (s.endTime) totalMinutes += Math.max(0, differenceInMinutes(new Date(s.endTime), new Date(s.startTime)));
      });
    });
    return Math.round(totalMinutes / 7);
  };

  const getBabyAgeEstimate = () => {
    const avgDailyMinutes = getLast7DaysAverage();
    const avgHours = avgDailyMinutes / 60;
    if (avgHours >= 14) return "newborn (0-3 months)";
    if (avgHours >= 12) return "infant (4-12 months)";
    if (avgHours >= 11) return "toddler (1-2 years)";
    return "child (2+ years)";
  };

  const getSleepQuality = () => {
    if (sessions.length < 3) return null;
    const weeklyAvg = getLast7DaysAverage();
    const avgHours = weeklyAvg / 60;
    const score = avgHours >= 12 && avgHours <= 17 ? 90 : avgHours >= 10 && avgHours <= 19 ? 70 : avgHours >= 8 ? 50 : 30;
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    let daysWithData = 0;
    days.forEach((day) => {
      const dayStart = startOfDay(day);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);
      if (sessions.some((s) => new Date(s.startTime) >= dayStart && new Date(s.startTime) < nextDay && s.endTime)) daysWithData++;
    });
    return Math.min(100, score + Math.round((daysWithData / 7) * 10));
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return t("toolsInternal.babySleep.qualityExcellent", "Excellent");
    if (score >= 60) return t("toolsInternal.babySleep.qualityGood", "Good");
    if (score >= 40) return t("toolsInternal.babySleep.qualityFair", "Fair");
    return t("toolsInternal.babySleep.qualityNeedsAttention", "Needs Attention");
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  // 7-day chart data
  const weeklyChart = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);
      let nap = 0, night = 0;
      sessions.filter((s) => {
        const d = new Date(s.startTime);
        return d >= dayStart && d < nextDay && s.endTime;
      }).forEach((s) => {
        if (s.endTime) {
          const mins = Math.max(0, differenceInMinutes(new Date(s.endTime), new Date(s.startTime)));
          if (s.type === "nap") nap += mins;
          else night += mins;
        }
      });
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      return {
        day: t(`toolsInternal.vitaminTracker.days_${dayNames[day.getDay()]}`),
        nap, night, total: nap + night,
        isToday: dayStart.toDateString() === new Date().toDateString(),
      };
    });
  }, [sessions, t]);

  const maxDailyMins = Math.max(60, ...weeklyChart.map((d) => d.total));

  const getAIAdvice = async () => {
    if (sessions.length < 2) { setShowAiAdvice(true); return; }
    const stats = getTodayStats();
    const weeklyAvg = getLast7DaysAverage();
    const ageEstimate = getBabyAgeEstimate();
    const recentSessions = sessions.slice(0, 10);
    const napCount = recentSessions.filter((s) => s.type === "nap").length;
    const nightCount = recentSessions.filter((s) => s.type === "night").length;
    const avgNapDuration = napCount > 0
      ? recentSessions.filter((s) => s.type === "nap" && s.endTime)
          .reduce((sum, s) => sum + differenceInMinutes(new Date(s.endTime!), new Date(s.startTime)), 0) / napCount
      : 0;

    setShowAiAdvice(true);
    await generate({
      prompt: `As a pediatric sleep wellness guide, analyze this baby's sleep data and provide supportive advice:\n\n**Baby's Estimated Age:** ${ageEstimate}\n**Today's Total Sleep:** ${formatDuration(stats.totalMinutes)}\n**7-Day Daily Average:** ${formatDuration(weeklyAvg)}\n**Recent Naps:** ${napCount} (avg ${Math.round(avgNapDuration)} mins each)\n**Recent Night Sleeps:** ${nightCount}\n\nProvide 3 specific tips to improve this baby's sleep schedule. Keep response under 150 words. Be encouraging and supportive.`,
    });
  };

  const stats = getTodayStats();
  const weeklyAvg = getLast7DaysAverage();
  const sleepQuality = getSleepQuality();

  return (
    <ToolFrame
      title={t("toolsInternal.babySleep.title")}
      subtitle={t("toolsInternal.babySleep.subtitle")}
      mood="nurturing" toolId="baby-sleep-tracker"
    >
      <div className="space-y-4">
        {/* Active Session or Start Buttons */}
        <AnimatePresence mode="wait">
          {activeSleep ? (
            <motion.div key="active" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <Card className="border-primary/30 overflow-hidden">
                <div className={`h-1.5 ${activeSleep.type === "night" ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gradient-to-r from-amber-400 to-orange-400"}`} />
                <CardContent className="pt-6 pb-5 text-center">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-3"
                  >
                    <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                      activeSleep.type === "night"
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/25"
                        : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-400/25"
                    }`}>
                      {activeSleep.type === "night"
                        ? <Moon className="h-8 w-8 text-white" />
                        : <Sun className="h-8 w-8 text-white" />
                      }
                    </div>
                  </motion.div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {activeSleep.type === "night" ? t("toolsInternal.babySleep.nightSleep") : t("toolsInternal.babySleep.napTime")} {t("toolsInternal.babySleep.inProgress")}
                  </p>
                  <div className="text-2xl font-extrabold text-foreground mb-1 tabular-nums">
                    {formatDuration(elapsedTime)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-4">
                    {t("toolsInternal.babySleep.startedAt", "Started at")} {formatLocalized(new Date(activeSleep.startTime), "HH:mm", currentLanguage)}
                  </p>
                  <Button onClick={endSleep} size="lg" className="w-full rounded-xl text-sm font-bold">
                    {t("toolsInternal.babySleep.endSleep")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="start" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="grid grid-cols-2 gap-3">
                {([{ type: "nap" as const, icon: Sun, gradient: "from-amber-400 to-orange-500", shadow: "shadow-amber-400/20", label: "startNap" },
                   { type: "night" as const, icon: Moon, gradient: "from-indigo-500 to-purple-600", shadow: "shadow-indigo-500/20", label: "nightSleep" }
                ]).map(({ type, icon: Icon, gradient, shadow, label }) => (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => startSleep(type)}
                    className="p-5 rounded-2xl border border-border/30 bg-card hover:bg-muted/30 transition-all text-center space-y-2.5"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto shadow-lg ${shadow}`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-xs font-bold text-foreground">{t(`toolsInternal.babySleep.${label}`)}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="py-2.5 px-2 text-center">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-extrabold text-foreground tabular-nums">{formatDuration(stats.totalMinutes)}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{t("toolsInternal.babySleep.totalToday")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-2 text-center">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-1">
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm font-extrabold text-foreground tabular-nums">{formatDuration(weeklyAvg)}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{t("toolsInternal.babySleep.avgSleep")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-2 text-center">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-1">
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-sm font-extrabold text-foreground tabular-nums">{stats.count}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{t("toolsInternal.babySleep.sessions")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sleep Quality */}
        {sleepQuality !== null && (
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  {t("toolsInternal.babySleep.sleepQuality", "Sleep Quality")}
                </span>
                <span className={`text-xs font-bold ${getQualityColor(sleepQuality)}`}>
                  {getQualityLabel(sleepQuality)} ({sleepQuality}%)
                </span>
              </div>
              <Progress value={sleepQuality} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* 7-Day Sleep Chart */}
        {sessions.length > 0 && (
          <Card>
            <CardContent className="pt-3 pb-3">
              <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                {t("toolsInternal.babySleep.weeklyChart", "7-Day Sleep")}
              </h3>
              <div className="flex items-end gap-1.5 h-24">
                {weeklyChart.map((day, i) => {
                  const nightH = (day.night / maxDailyMins) * 100;
                  const napH = (day.nap / maxDailyMins) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                        {day.total > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {day.night > 0 && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${nightH}%` }}
                                className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-purple-400 min-h-[2px]"
                                style={{ height: `${nightH}%` }}
                              />
                            )}
                            {day.nap > 0 && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${napH}%` }}
                                className="w-full rounded-t-md bg-gradient-to-t from-amber-400 to-orange-300 min-h-[2px]"
                                style={{ height: `${napH}%` }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-1 rounded-full bg-muted" />
                        )}
                      </div>
                      <span className={`text-[8px] font-medium ${day.isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {day.day}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-indigo-500 to-purple-400" />
                  {t("toolsInternal.babySleep.night")}
                </span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-amber-400 to-orange-300" />
                  {t("toolsInternal.babySleep.naps")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Breakdown */}
        {stats.count > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <Card className="bg-amber-500/5 border-amber-500/15">
              <CardContent className="py-3 px-3 text-center">
                <Sun className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-sm font-extrabold text-foreground tabular-nums">{formatDuration(stats.napMinutes)}</p>
                <p className="text-[9px] text-muted-foreground">{t("toolsInternal.babySleep.naps")}</p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-500/5 border-indigo-500/15">
              <CardContent className="py-3 px-3 text-center">
                <Moon className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                <p className="text-sm font-extrabold text-foreground tabular-nums">{formatDuration(stats.nightMinutes)}</p>
                <p className="text-[9px] text-muted-foreground">{t("toolsInternal.babySleep.night")}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Advice */}
        <AIActionButton
          onClick={getAIAdvice}
          isLoading={aiLoading}
          label={t("toolsInternal.babySleep.getAISleepAdvice")}
          loadingLabel={t("toolsInternal.babySleep.analyzing")}
          toolType="sleep-analysis"
          section="sleep"
        />

        <AnimatePresence>
          {showAiAdvice && aiAdvice && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <PrintableReport title={t("toolsInternal.babySleep.aiSleepAdvisor")}>
                <AIResponseFrame content={aiAdvice} title={t("toolsInternal.babySleep.aiSleepAdvisor")} icon={Sparkles} />
              </PrintableReport>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {t("toolsInternal.babySleep.recentSessions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pb-3">
              {sessions.slice(0, 8).map((session) => {
                const duration = session.endTime
                  ? Math.max(0, differenceInMinutes(new Date(session.endTime), new Date(session.startTime)))
                  : 0;
                return (
                  <div key={session.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/10">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        session.type === "nap" ? "bg-amber-500/10" : "bg-indigo-500/10"
                      }`}>
                        {session.type === "nap"
                          ? <Sun className="h-3 w-3 text-amber-500" />
                          : <Moon className="h-3 w-3 text-indigo-500" />
                        }
                      </div>
                      <span className="text-[11px] font-semibold text-foreground">{formatDuration(duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatLocalized(new Date(session.startTime), "MMM d, HH:mm", currentLanguage)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSession(session.id)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </ToolFrame>
  );
};

export default BabySleepTracker;

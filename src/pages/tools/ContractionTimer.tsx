import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { emitDataChange } from "@/lib/dataBus";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Square, Timer, TrendingUp, Activity, Clock, Zap, Heart,
  AlertTriangle, BarChart3, Vibrate, ChevronDown, RotateCcw,
} from "lucide-react";
import { ContextualWarningBanner, WhenToCallDoctorCard, EvidenceInfoBlock } from "@/components/safety";
import { haptic } from "@/lib/haptics";
import { ToolFrame } from "@/components/ToolFrame";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContractionChart } from "@/components/contraction/ContractionChart";
import { ContractionHistory } from "@/components/contraction/ContractionHistory";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { useInAppReview } from "@/hooks/useInAppReview";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";

interface Contraction {
  id: string;
  start: number;
  end: number | null;
  duration: number;
  intensity?: "light" | "moderate" | "strong";
}

const STORAGE_KEY = "contraction_timer_data";
const MAX_TIMER_SECONDS = 300; // 5 min arc max

function loadContractions(): Contraction[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveContractions(data: Contraction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(-50)));
  emitDataChange(STORAGE_KEY);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Phase = "none" | "early" | "active" | "transition";

function detectPhase(avgDuration: number, avgInterval: number, count: number): Phase {
  if (count < 3) return "none";
  if (avgInterval <= 180 && avgDuration >= 60) return "transition";
  if (avgInterval <= 300 && avgDuration >= 45) return "active";
  if (avgInterval <= 1800 && avgDuration >= 20) return "early";
  return "none";
}

const PHASE_CONFIG = {
  none: { gradient: "from-muted to-muted", color: "text-muted-foreground", icon: Heart },
  early: { gradient: "from-amber-500 to-orange-400", color: "text-amber-600 dark:text-amber-400", icon: Heart },
  active: { gradient: "from-orange-500 to-red-400", color: "text-orange-600 dark:text-orange-400", icon: Zap },
  transition: { gradient: "from-red-600 to-rose-500", color: "text-destructive", icon: AlertTriangle },
};

const INTENSITY_OPTIONS = [
  { id: "light" as const, emoji: "😌", gradient: "from-emerald-400 to-teal-400" },
  { id: "moderate" as const, emoji: "😣", gradient: "from-amber-400 to-orange-400" },
  { id: "strong" as const, emoji: "😰", gradient: "from-red-500 to-rose-500" },
] as const;

export default function ContractionTimer() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [contractions, setContractions] = useState<Contraction[]>(() => loadContractions());
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [intensity, setIntensity] = useState<"light" | "moderate" | "strong">("moderate");
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const handleStart = useCallback(() => { haptic('tap'); setIsActive(true); }, []);

  const { maybePromptReview } = useInAppReview();

  const handleStop = useCallback(() => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const newContraction: Contraction = {
      id: `c_${Date.now()}`, start: startTimeRef.current, end: Date.now(), duration, intensity,
    };
    const updated = [newContraction, ...contractions];
    setContractions(updated);
    saveContractions(updated);
    setIsActive(false);
    haptic('success');
    // Prompt for review after 5+ tracked contractions (engaged user, positive moment)
    if (updated.length >= 5) {
      maybePromptReview('contraction_timer_used');
    }
  }, [contractions, intensity, maybePromptReview]);

  const handleClear = useCallback(() => {
    setContractions([]);
    saveContractions([]);
  }, []);




  const handleDelete = useCallback((id: string) => {
    const updated = contractions.filter((c) => c.id !== id);
    setContractions(updated);
    saveContractions(updated);
  }, [contractions]);

  // Stats
  const stats = useMemo(() => {
    if (contractions.length < 1) return null;
    const durations = contractions.map((c) => c.duration);
    const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const intervals: number[] = [];
    for (let i = 0; i < contractions.length - 1; i++) {
      const gap = Math.floor((contractions[i].start - (contractions[i + 1].end || contractions[i + 1].start)) / 1000);
      if (gap > 0) intervals.push(gap);
    }
    const avgInterval = intervals.length > 0 ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : 0;

    let regularity = 0;
    if (intervals.length >= 2) {
      const mean = avgInterval;
      const variance = intervals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / intervals.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
      regularity = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
    }

    let trend: "shortening" | "stable" | "lengthening" = "stable";
    if (intervals.length >= 3) {
      const recent = intervals.slice(0, 3);
      const older = intervals.slice(-3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      if (recentAvg < olderAvg * 0.8) trend = "shortening";
      else if (recentAvg > olderAvg * 1.2) trend = "lengthening";
    }

    const sessionStart = contractions[contractions.length - 1].start;
    const sessionEnd = contractions[0].end || contractions[0].start;
    const sessionDuration = Math.floor((sessionEnd - sessionStart) / 1000);

    return { count: contractions.length, avgDuration, avgInterval, regularity, trend, sessionDuration };
  }, [contractions]);

  const phase = stats ? detectPhase(stats.avgDuration, stats.avgInterval, stats.count) : "none";
  const phaseConf = PHASE_CONFIG[phase];
  const PhaseIcon = phaseConf.icon;

  // Timer arc
  const arcProgress = Math.min(elapsed / MAX_TIMER_SECONDS, 1);
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // 5-1-1 rule check
  const fiveOneOne = stats && stats.avgInterval > 0 && stats.avgInterval <= 300 && stats.avgDuration >= 60;

  const [timeSinceLast, setTimeSinceLast] = useState(0);
  useEffect(() => {
    if (contractions.length === 0 || isActive) return;
    const update = () => {
      const last = contractions[0];
      setTimeSinceLast(Math.floor((Date.now() - (last.end || last.start)) / 1000));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [contractions, isActive]);

  return (
    <ToolFrame
      title={t("toolsInternal.contractionTimer.title", "عداد الانقباضات")}
      subtitle={t("toolsInternal.contractionTimer.subtitle", "تتبعي مدة الانقباضات والفترات بينها")}
      customIcon="contraction-timer"
      mood="calm"
      toolId="contraction-timer"
      howToSteps={[
        { name: "Tap Start when a contraction begins", text: "When you feel a contraction starting, tap the large Start button to begin timing its duration." },
        { name: "Tap Stop when it ends", text: "Tap Stop the moment the contraction fades. The app records duration and the interval since the previous contraction." },
        { name: "Watch for the 5-1-1 pattern", text: "When contractions are 5 minutes apart, 1 minute long, for 1 hour straight, contact your healthcare provider — active labor may have begun." },
      ]}
    >
      <div className="space-y-4">

        {/* ═══════ TIMER HERO ═══════ */}
        <Card className="overflow-hidden">
          <div className={`h-1.5 bg-gradient-to-r ${isActive ? "from-destructive via-red-400 to-orange-400" : phase !== "none" ? phaseConf.gradient : "from-primary to-primary/60"}`} />
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col items-center">

              {/* Circular Timer */}
              <div className="relative w-40 h-40 mb-4">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
                  {/* Background track */}
                  <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  {/* Progress arc */}
                  <motion.circle
                    cx="64" cy="64" r={RADIUS} fill="none"
                    stroke={isActive ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - arcProgress) }}
                    transition={{ duration: 0.3 }}
                  />
                  {/* Tick marks every 30s */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const angle = (i / 10) * 2 * Math.PI - Math.PI / 2;
                    const x1 = 64 + (RADIUS - 4) * Math.cos(angle);
                    const y1 = 64 + (RADIUS - 4) * Math.sin(angle);
                    const x2 = 64 + (RADIUS + 2) * Math.cos(angle);
                    const y2 = 64 + (RADIUS + 2) * Math.sin(angle);
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" />;
                  })}
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isActive && (
                    <motion.div
                      className="absolute inset-4 rounded-full border-2 border-destructive/20"
                      animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  <span className={`text-3xl font-extrabold tabular-nums ${isActive ? "text-destructive" : "text-foreground"}`}>
                    {formatDuration(elapsed)}
                  </span>
                  {isActive ? (
                    <motion.p
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-[10px] text-destructive font-semibold mt-0.5 flex items-center gap-1"
                    >
                      <Vibrate className="w-3 h-3" />
                      {t("toolsInternal.contractionTimer.recording", "جارٍ التسجيل...")}
                    </motion.p>
                  ) : contractions.length > 0 ? (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t("toolsInternal.contractionTimer.timeSinceLast", "منذ آخر انقباض")}: {formatDuration(timeSinceLast)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t("toolsInternal.contractionTimer.tapToStart", "اضغطي للبدء")}
                    </p>
                  )}
                </div>
              </div>

              {/* Intensity Selector (visible when active) */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3"
                  >
                    <p className="text-[10px] text-muted-foreground text-center mb-1.5">
                      {t("toolsInternal.contractionTimer.selectIntensity", "شدة الانقباض")}
                    </p>
                    <div className="flex gap-2">
                      {INTENSITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setIntensity(opt.id)}
                          className={`flex flex-col items-center gap-0.5 px-3.5 py-2 rounded-xl border transition-all ${
                            intensity === opt.id
                              ? `bg-gradient-to-br ${opt.gradient} text-white border-transparent shadow-md`
                              : "border-border/30 bg-card hover:bg-muted/40"
                          }`}
                        >
                          <span className="text-lg">{opt.emoji}</span>
                          <span className={`text-[9px] font-semibold ${intensity === opt.id ? "text-white" : "text-muted-foreground"}`}>
                            {t(`toolsInternal.contractionTimer.intensity${opt.id.charAt(0).toUpperCase() + opt.id.slice(1)}`, opt.id)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              {!isActive ? (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={handleStart}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-destructive text-destructive-foreground font-bold text-sm shadow-lg shadow-destructive/25 hover:opacity-90 transition-opacity"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  {t("toolsInternal.contractionTimer.startContraction", "بدء انقباض")}
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={handleStop}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-foreground text-background font-bold text-sm shadow-lg"
                >
                  <Square className="w-5 h-5" fill="currentColor" />
                  {t("toolsInternal.contractionTimer.stop", "انتهى")}
                </motion.button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══════ LABOR PHASE ═══════ */}
        {phase !== "none" && stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`overflow-hidden border ${
              phase === "transition" ? "border-destructive/20 bg-destructive/5" :
              phase === "active" ? "border-orange-500/20 bg-orange-500/5" :
              "border-amber-500/20 bg-amber-500/5"
            }`}>
              <div className={`h-1 bg-gradient-to-r ${phaseConf.gradient}`} />
              <CardContent className="py-3 px-3.5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${phaseConf.gradient} flex items-center justify-center shadow-sm`}>
                    <PhaseIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${phaseConf.color}`}>
                      {t(`toolsInternal.contractionTimer.phase${phase.charAt(0).toUpperCase() + phase.slice(1)}`, phase)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {t(`toolsInternal.contractionTimer.phase${phase.charAt(0).toUpperCase() + phase.slice(1)}Desc`)}
                    </p>
                  </div>
                </div>

                {/* Phase progress bar */}
                <div className="flex items-center gap-1 mb-1">
                  {(["early", "active", "transition"] as const).map((p) => (
                    <div key={p} className="flex-1">
                      <div className={`h-1.5 rounded-full transition-all ${
                        p === "early" ? (phase === "early" || phase === "active" || phase === "transition" ? `bg-gradient-to-r ${PHASE_CONFIG[p].gradient}` : "bg-muted") :
                        p === "active" ? (phase === "active" || phase === "transition" ? `bg-gradient-to-r ${PHASE_CONFIG[p].gradient}` : "bg-muted") :
                        phase === "transition" ? `bg-gradient-to-r ${PHASE_CONFIG[p].gradient}` : "bg-muted"
                      }`} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                  <span>{t("toolsInternal.contractionTimer.phaseEarly", "مبكرة")}</span>
                  <span>{t("toolsInternal.contractionTimer.phaseActive", "نشطة")}</span>
                  <span>{t("toolsInternal.contractionTimer.phaseTransition", "انتقال")}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══════ 5-1-1 RULE INDICATOR ═══════ */}
        {fiveOneOne && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border-destructive/30 bg-destructive/8">
              <CardContent className="py-3 px-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-destructive">
                      {t("toolsInternal.contractionTimer.fiveOneOneAlert", "قاعدة 5-1-1 تحققت!")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("toolsInternal.contractionTimer.fiveOneOneDesc", "الانقباضات كل 5 دقائق، مدة دقيقة، لمدة ساعة. اتصلي بطبيبك.")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══════ QUICK STATS ═══════ */}
        {stats && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2">
            {[
              { icon: Activity, value: stats.count.toString(), label: t("toolsInternal.contractionTimer.total", "انقباض"), color: "text-primary", iconBg: "bg-primary/10" },
              { icon: Timer, value: formatDuration(stats.avgDuration), label: t("toolsInternal.contractionTimer.avgDuration", "متوسط المدة"), color: "text-destructive", iconBg: "bg-destructive/10" },
              { icon: Clock, value: stats.avgInterval > 0 ? formatDuration(stats.avgInterval) : "--", label: t("toolsInternal.contractionTimer.avgInterval", "متوسط الفاصل"), color: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-500/10" },
            ].map((card, i) => (
              <Card key={i}>
                <CardContent className="py-2.5 px-2 text-center">
                  <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center mx-auto mb-1`}>
                    <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                  </div>
                  <span className={`text-sm font-extrabold tabular-nums ${card.color}`}>{card.value}</span>
                  <span className="text-[9px] text-muted-foreground block leading-tight mt-0.5">{card.label}</span>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* ═══════ EXTENDED STATS ROW ═══════ */}
        {stats && stats.count >= 2 && (
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="py-2.5 px-2 text-center">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-1">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <span className={`text-sm font-extrabold tabular-nums ${stats.regularity >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {stats.regularity}%
                </span>
                <span className="text-[9px] text-muted-foreground block leading-tight mt-0.5">
                  {t("toolsInternal.contractionTimer.regularity", "الانتظام")}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-2.5 px-2 text-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className={`text-sm font-extrabold tabular-nums ${
                  stats.trend === "shortening" ? "text-destructive" : stats.trend === "lengthening" ? "text-emerald-600" : "text-muted-foreground"
                }`}>
                  {stats.trend === "shortening"
                    ? t("toolsInternal.contractionTimer.trendShortening", "تقارب")
                    : stats.trend === "lengthening"
                    ? t("toolsInternal.contractionTimer.trendLengthening", "تباعد")
                    : t("toolsInternal.contractionTimer.trendStable", "مستقر")}
                </span>
                <span className="text-[9px] text-muted-foreground block leading-tight mt-0.5">
                  {t("toolsInternal.contractionTimer.trend", "الاتجاه")}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-2.5 px-2 text-center">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-sm font-extrabold tabular-nums text-foreground">
                  {formatDuration(stats.sessionDuration)}
                </span>
                <span className="text-[9px] text-muted-foreground block leading-tight mt-0.5">
                  {t("toolsInternal.contractionTimer.sessionTime", "مدة الجلسة")}
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && stats.count >= 2 && (
          <button onClick={handleClear} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 active:scale-95 transition-all">
            <RotateCcw className="w-3 h-3" />
            {t("toolsInternal.contractionTimer.clear", "مسح الكل")}
          </button>
        )}

        {/* ═══════ EMPTY STATE — no contractions logged yet ═══════ */}
        {contractions.length === 0 && !isActive && (
          <ToolEmptyState
            icon={Activity}
            title={t("tools.empty.contractions.title")}
            description={t("tools.empty.contractions.desc")}
            ctaLabel={t("tools.empty.contractions.cta")}
            ctaDirection="up"
            onCta={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
        )}

        {/* ═══════ CHART & HISTORY TABS ═══════ */}
        {contractions.length >= 2 && (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="chart" className="text-xs gap-1">
                <BarChart3 className="w-3 h-3" />
                {t("toolsInternal.contractionTimer.chartTab", "الرسم البياني")}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs gap-1">
                <Clock className="w-3 h-3" />
                {t("toolsInternal.contractionTimer.historyTab", "السجل")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <ContractionChart contractions={contractions} />
            </TabsContent>
            <TabsContent value="history">
              <ContractionHistory contractions={contractions} onDelete={handleDelete} onClear={handleClear} />
            </TabsContent>
          </Tabs>
        )}

        {contractions.length === 1 && (
          <ContractionHistory contractions={contractions} onDelete={handleDelete} onClear={handleClear} />
        )}

        {/* ═══════ AI ANALYSIS ═══════ */}
        {contractions.length >= 3 && stats && (
          <AIInsightCard
            title={t("toolsInternal.contractionTimer.aiAnalysisTitle", "تحليل ذكي للانقباضات")}
            aiType="contraction-analysis"
            prompt={`Analyze my contraction data:
- Total contractions: ${contractions.length}
- Average duration: ${stats.avgDuration} seconds
- Average interval: ${stats.avgInterval} seconds
- Regularity: ${stats.regularity}%
- Trend: ${stats.trend}
- Shortest contraction: ${Math.min(...contractions.map(c => c.duration))} seconds
- Longest contraction: ${Math.max(...contractions.map(c => c.duration))} seconds
- Session started: ${contractions.length > 0 ? new Date(contractions[contractions.length - 1].start).toLocaleTimeString() : 'N/A'}
- Latest contraction: ${contractions.length > 0 ? new Date(contractions[0].start).toLocaleTimeString() : 'N/A'}
- Recent 5 durations (seconds): ${contractions.slice(0, 5).map(c => c.duration).join(', ')}
- Recent intensities: ${contractions.slice(0, 5).map(c => c.intensity || 'moderate').join(', ')}

Analyze contraction pattern, regularity, and labor progression. Provide guidance on when to go to the hospital based on the 5-1-1 rule. Include safety recommendations.`}
            context={{ week: 38 }}
            buttonText={t("toolsInternal.contractionTimer.aiAnalysisButton", "تحليل الانقباضات بالذكاء الاصطناعي")}
            icon={<TrendingUp className="w-4 h-4" />}
            showPrintButton
            showDisclaimer
            printTitle={t("toolsInternal.contractionTimer.title", "عداد الانقباضات")}
          />
        )}

        {/* Evidence: 5-1-1 Rule */}
        <EvidenceInfoBlock
          title={t("safety.evidence.fiveOneOne.title")}
          content={t("safety.evidence.fiveOneOne.content")}
          source={t("safety.evidence.fiveOneOne.source")}
        />

        {/* Active labor warning */}
        {stats && stats.avgInterval > 0 && stats.avgInterval <= 300 && stats.avgDuration >= 45 && (
          <ContextualWarningBanner level="urgent" message={t("safety.banners.activeLabor")} />
        )}

        <WhenToCallDoctorCard context="contraction" />
      </div>
    </ToolFrame>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pill, Check, Lightbulb, TrendingUp, Calendar, Sparkles, Clock, Award, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ToolFrame } from '@/components/ToolFrame';
import { AIInsightCard } from '@/components/ai/AIInsightCard';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { loadFromLocalStorage, saveToLocalStorage } from '@/services/localStorageServices';
import { emitDataChange } from '@/lib/dataBus';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyLog {
  [vitaminKey: string]: string;
}

const STORAGE_KEY = 'vitamin-tracker-logs';
const VITAMINS = ['folicAcid', 'iron', 'calcium', 'vitaminD', 'omega3', 'prenatal'] as const;

const VITAMIN_GRADIENTS: Record<string, string> = {
  folicAcid: 'from-pink-500 to-rose-400',
  iron: 'from-red-500 to-red-400',
  calcium: 'from-sky-500 to-blue-400',
  vitaminD: 'from-amber-400 to-yellow-300',
  omega3: 'from-teal-500 to-emerald-400',
  prenatal: 'from-purple-500 to-violet-400',
};

const VITAMIN_BG: Record<string, string> = {
  folicAcid: 'bg-pink-500/10 border-pink-500/20',
  iron: 'bg-red-500/10 border-red-500/20',
  calcium: 'bg-sky-500/10 border-sky-500/20',
  vitaminD: 'bg-amber-400/10 border-amber-400/20',
  omega3: 'bg-teal-500/10 border-teal-500/20',
  prenatal: 'bg-purple-500/10 border-purple-500/20',
};

const VITAMIN_ICONS: Record<string, string> = {
  folicAcid: '💊',
  iron: '🩸',
  calcium: '🦴',
  vitaminD: '☀️',
  omega3: '🐟',
  prenatal: '💎',
};

const VITAMIN_TIMING: Record<string, string> = {
  folicAcid: 'morning',
  iron: 'evening',
  calcium: 'afternoon',
  vitaminD: 'morning',
  omega3: 'withMeal',
  prenatal: 'morning',
};

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function getWeekLogs(allLogs: Record<string, DailyLog>): number {
  const now = new Date();
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayLog = allLogs[key];
    if (dayLog) count += Object.keys(dayLog).length;
  }
  return count;
}

function getStreak(allLogs: Record<string, DailyLog>): number {
  const now = new Date();
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayLog = allLogs[key];
    if (dayLog && Object.keys(dayLog).length > 0) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getBestStreak(allLogs: Record<string, DailyLog>): number {
  const now = new Date();
  let best = 0;
  let current = 0;
  for (let i = 0; i < 180; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayLog = allLogs[key];
    if (dayLog && Object.keys(dayLog).length > 0) {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

const VitaminTracker: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [allLogs, setAllLogs] = useState<Record<string, DailyLog>>({});
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const stored = loadFromLocalStorage<Record<string, DailyLog>>(STORAGE_KEY);
    if (stored) setAllLogs(stored);
  }, []);

  const todayKey = getTodayKey();
  const todayLog = allLogs[todayKey] || {};
  const takenCount = Object.keys(todayLog).length;
  const totalVitamins = VITAMINS.length;
  const progress = (takenCount / totalVitamins) * 100;

  const weeklyCount = useMemo(() => getWeekLogs(allLogs), [allLogs]);
  const streak = useMemo(() => getStreak(allLogs), [allLogs]);
  const bestStreak = useMemo(() => getBestStreak(allLogs), [allLogs]);

  // Weekly heatmap data (last 7 days)
  const weekHeatmap = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      const dayLog = allLogs[key] || {};
      const count = Object.keys(dayLog).length;
      days.push({
        date: d,
        key,
        count,
        percentage: Math.round((count / totalVitamins) * 100),
        isToday: i === 0,
      });
    }
    return days;
  }, [allLogs, totalVitamins]);

  const toggleVitamin = useCallback((vitaminKey: string) => {
    const today = getTodayKey();
    const currentDayLog = allLogs[today] || {};

    if (currentDayLog[vitaminKey]) {
      toast({
        title: t('toolsInternal.vitaminTracker.alreadyTaken'),
        description: t('toolsInternal.vitaminTracker.alreadyTakenDesc', { name: t(`toolsInternal.vitaminTracker.vitamins.${vitaminKey}`) }),
      });
      return;
    }

    const updated = {
      ...allLogs,
      [today]: { ...currentDayLog, [vitaminKey]: new Date().toISOString() },
    };
    setAllLogs(updated);
    saveToLocalStorage(STORAGE_KEY, updated);
    emitDataChange(STORAGE_KEY);

    const newTakenCount = Object.keys(updated[today]).length;

    if (newTakenCount === totalVitamins) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      toast({
        title: t('toolsInternal.vitaminTracker.allDone'),
        description: t('toolsInternal.vitaminTracker.allDoneDesc'),
      });
    } else {
      toast({
        title: t('toolsInternal.vitaminTracker.logged'),
        description: t('toolsInternal.vitaminTracker.loggedDesc', { name: t(`toolsInternal.vitaminTracker.vitamins.${vitaminKey}`) }),
      });
    }
  }, [allLogs, toast, t, totalVitamins]);

  const aiPrompt = useMemo(() => {
    const taken = Object.keys(todayLog).map(k => t(`toolsInternal.vitaminTracker.vitamins.${k}`)).join(', ');
    const week = profile.pregnancyWeek || 20;
    return `Pregnancy week ${week}. Vitamins taken today: ${taken || 'none'}. Weekly intake count: ${weeklyCount}. Streak: ${streak} days. Analyze the vitamin routine and provide personalized recommendations.`;
  }, [todayLog, profile.pregnancyWeek, weeklyCount, streak, t]);

  const getDayName = (date: Date) => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return t(`toolsInternal.vitaminTracker.days_${days[date.getDay()]}`);
  };

  return (
    <ToolFrame
      toolId="vitamin-tracker"
      title={t('tools.vitaminTracker.title', 'Vitamin Tracker')}
      subtitle={t('toolsInternal.vitaminTracker.subtitle')}
      icon={Pill}
    >
      <div className="space-y-4">
        {/* Celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-primary/20 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="text-5xl mb-3"
                >
                  🎉
                </motion.div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {t('toolsInternal.vitaminTracker.allDone')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('toolsInternal.vitaminTracker.allDoneDesc')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Progress Ring */}
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-pink-500 to-amber-400" style={{ width: `${progress}%` }} />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-4">
              {/* Circular progress */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <motion.circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progress / 100) }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-foreground">{takenCount}</span>
                  <span className="text-[9px] text-muted-foreground">/ {totalVitamins}</span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground mb-1">
                  {t('toolsInternal.vitaminTracker.todaysProgress')}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {takenCount === totalVitamins
                    ? t('toolsInternal.vitaminTracker.completedMessage')
                    : t('toolsInternal.vitaminTracker.remainingMessage', { count: totalVitamins - takenCount })}
                </p>
                {/* Mini stat badges */}
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" /> {streak} {t('toolsInternal.vitaminTracker.streakDays')}
                  </span>
                  {bestStreak > streak && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Award className="w-3 h-3" /> {bestStreak}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vitamin Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {VITAMINS.map((vit, i) => {
            const isTaken = !!todayLog[vit];
            const timing = VITAMIN_TIMING[vit];
            return (
              <motion.button
                key={vit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => toggleVitamin(vit)}
                disabled={isTaken}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-2xl border transition-all duration-300 ${
                  isTaken
                    ? `${VITAMIN_BG[vit]} shadow-sm`
                    : 'bg-card border-border/30 hover:border-border/60 active:scale-[0.96]'
                }`}
              >
                {/* Taken checkmark */}
                {isTaken && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute top-1.5 ${isRTL ? 'left-1.5' : 'right-1.5'} w-5 h-5 rounded-full bg-gradient-to-br ${VITAMIN_GRADIENTS[vit]} flex items-center justify-center shadow-sm`}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}

                <span className="text-2xl">{VITAMIN_ICONS[vit]}</span>
                <p className={`text-[11px] font-bold text-center leading-tight ${isTaken ? 'text-foreground' : 'text-foreground/80'}`}>
                  {t(`toolsInternal.vitaminTracker.vitamins.${vit}`)}
                </p>
                <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full ${
                  isTaken
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground bg-muted/50'
                }`}>
                  <Clock className="w-2.5 h-2.5" />
                  {t(`toolsInternal.vitaminTracker.timing.${timing}`)}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* 7-Day Heatmap */}
        <Card>
          <CardContent className="pt-3 pb-3">
            <h3 className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {t('toolsInternal.vitaminTracker.weeklyOverview')}
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {weekHeatmap.map((day) => {
                const intensity = day.percentage === 0 ? 'bg-muted' :
                  day.percentage <= 33 ? 'bg-red-400/40' :
                  day.percentage <= 66 ? 'bg-amber-400/50' :
                  day.percentage < 100 ? 'bg-emerald-400/50' :
                  'bg-emerald-500/70';
                return (
                  <div key={day.key} className="text-center">
                    <span className="text-[8px] text-muted-foreground block mb-1">
                      {getDayName(day.date)}
                    </span>
                    <div
                      className={`w-full aspect-square rounded-lg ${intensity} ${
                        day.isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                      } flex items-center justify-center`}
                    >
                      <span className="text-[10px] font-bold text-foreground/70">
                        {day.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <span className="text-[8px] text-muted-foreground">{t('toolsInternal.vitaminTracker.less')}</span>
              <div className="flex gap-0.5">
                {['bg-muted', 'bg-red-400/40', 'bg-amber-400/50', 'bg-emerald-400/50', 'bg-emerald-500/70'].map((c, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                ))}
              </div>
              <span className="text-[8px] text-muted-foreground">{t('toolsInternal.vitaminTracker.more')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="py-2.5 px-2 text-center">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <p className="text-base font-extrabold text-foreground tabular-nums">{weeklyCount}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{t('toolsInternal.vitaminTracker.thisWeek')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-2 text-center">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-1">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-base font-extrabold text-foreground tabular-nums">{streak}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{t('toolsInternal.vitaminTracker.currentStreak')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-2 text-center">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-1">
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-base font-extrabold text-foreground tabular-nums">{bestStreak}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{t('toolsInternal.vitaminTracker.bestStreak')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Smart Tip */}
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="py-3 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                {t('toolsInternal.vitaminTracker.tipTitle')}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('toolsInternal.vitaminTracker.tipContent')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <AIInsightCard
          toolType="vitamin-advice"
          section="medications"
          prompt={aiPrompt}
          title={t('toolsInternal.vitaminTracker.aiAnalysisTitle')}
          buttonText={t('toolsInternal.vitaminTracker.analyzeRoutine')}
        />
      </div>
    </ToolFrame>
  );
};

export default VitaminTracker;

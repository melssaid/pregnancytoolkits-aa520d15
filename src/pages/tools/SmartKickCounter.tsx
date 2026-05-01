import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Baby, Play, TrendingUp, Clock, Loader2, Save, Zap } from 'lucide-react';
import { ContextualWarningBanner, WhenToCallDoctorCard, EvidenceInfoBlock } from '@/components/safety';
import { KickPatternVisualizer } from '@/components/kick-counter/KickPatternVisualizer';
import { AIInsightCard } from '@/components/ai/AIInsightCard';
import { AIMovementAnalysis } from '@/components/kick-counter/AIMovementAnalysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { KickService } from '@/services/localStorageServices';
import { ToolFrame } from '@/components/ToolFrame';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolEmptyState } from '@/components/tools/ToolEmptyState';


import { useUserProfile } from '@/hooks/useUserProfile';
import { useInAppReview } from '@/hooks/useInAppReview';
import { haptic } from '@/lib/haptics';

const SmartKickCounter: React.FC = () => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [kicks, setKicks] = useState<{ time: string }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { profile: userProfile } = useUserProfile();
  const { maybePromptReview } = useInAppReview();
  const [currentWeek, setCurrentWeek] = useState(userProfile.pregnancyWeek || 0);
  const [history, setHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Sync week from central profile
    if (userProfile.pregnancyWeek) setCurrentWeek(userProfile.pregnancyWeek);
  }, [userProfile.pregnancyWeek]);

  useEffect(() => {
    loadData();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const activeSession = await KickService.getActiveSession();
      if (activeSession) {
        setSessionId(activeSession.id);
        setKicks(activeSession.kicks || []);
        setStartTime(new Date(activeSession.started_at));
        setIsActive(true);
      }
      
      const sessionHistory = await KickService.getHistory(10);
      setHistory(sessionHistory);
      
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const session = await KickService.startSession(currentWeek);
      setSessionId(session.id);
      setStartTime(new Date());
      setIsActive(true);
      setKicks([]);
      setElapsedTime(0);
      setNotes('');
      
      toast({
        title: t('toolsInternal.kickCounter.sessionStarted'),
        description: t('toolsInternal.kickCounter.sessionStartedDesc')
      });
    } catch (error: any) {
      toast({
        title: t('toolsInternal.kickCounter.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const recordKick = async () => {
    if (!isActive || !sessionId) return;
    
    const timestamp = new Date().toISOString();
    const newKicks = await KickService.addKick(sessionId, kicks, timestamp);
    setKicks(newKicks);
    
    haptic('tap');
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      setIsSaving(true);
      const durationMinutes = Math.floor(elapsedTime / 60);
      
      await KickService.endSession(sessionId, durationMinutes, notes);
      
      setIsActive(false);
      setSessionId(null);
      
      toast({
        title: t('toolsInternal.kickCounter.sessionSaved'),
        description: t('toolsInternal.kickCounter.sessionSavedDesc', { kicks: kicks.length, minutes: durationMinutes })
      });
      
      const sessionHistory = await KickService.getHistory(10);
      setHistory(sessionHistory);
      maybePromptReview('kick_count_complete');


      
    } catch (error: any) {
      toast({
        title: t('toolsInternal.kickCounter.saveError'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAverageKicks = () => {
    if (history.length === 0) return 0;
    const total = history.reduce((sum, s) => sum + s.total_kicks, 0);
    return Math.round(total / history.length);
  };

  const getMovementScore = () => {
    if (history.length === 0) return 0;
    const avgKicks = getAverageKicks();
    const avgDuration = history.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / history.length;
    
    // Score based on kicks per hour ratio (10 kicks in 2 hours = 100%)
    const kicksPerHour = avgDuration > 0 ? (avgKicks / avgDuration) * 60 : 0;
    const score = Math.min(100, Math.round((kicksPerHour / 5) * 100));
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent';
    if (score >= 50) return 'text-primary';
    return 'text-muted-foreground';
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('toolsInternal.kickCounter.loading')}</p>
        </div>
      </div>
    );
  }

  const movementScore = getMovementScore();

  return (
    <ToolFrame
      title={t('toolsInternal.kickCounter.title')}
      subtitle={t('toolsInternal.kickCounter.subtitle', { week: currentWeek })}
      customIcon="baby-growth"
      mood="nurturing"
      toolId="smart-kick-counter"
      howToSteps={[
        { name: "Start a kick counting session", text: "Sit comfortably or lie on your side. Tap the large kick button each time you feel your baby move." },
        { name: "Count 10 movements", text: "Continue tapping for each kick, roll, or flutter. Most healthy babies reach 10 movements within 1-2 hours." },
        { name: "Review your daily pattern", text: "Save the session to build a personal movement chart. Compare daily patterns and discuss any concerns with your healthcare provider." },
      ]}
    >
      <div className="space-y-4">
        {/* ═══ 1. Main Counter — primary action stays at the top ═══ */}
        <Card className="shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Timer Bar */}
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2.5 border-b border-primary/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-destructive"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-muted-foreground">{t('toolsInternal.kickCounter.recording')}</span>
                </div>
                <div className="font-mono text-sm font-bold text-foreground tabular-nums">
                  {formatTime(elapsedTime)}
                </div>
              </motion.div>
            )}

            <div className="p-5 pb-6">
              {/* Kick Counter Circle */}
              <div className="flex flex-col items-center">
                {/* Main Tap Area */}
                <div className="relative">
                  {/* Outer pulse rings - only when active */}
                  {isActive && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/20"
                        animate={{ scale: [1, 1.3, 1.3], opacity: [0.4, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        style={{ margin: -8 }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/15"
                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                        style={{ margin: -8 }}
                      />
                    </>
                  )}

                  <motion.div
                    className={`relative w-44 h-44 rounded-full flex items-center justify-center cursor-pointer select-none transition-colors duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30'
                        : 'bg-gradient-to-br from-muted to-muted/80 shadow-lg'
                    }`}
                    onClick={isActive ? recordKick : undefined}
                    whileTap={isActive ? { scale: 0.92 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    {/* Inner glow ring */}
                    {isActive && (
                      <div className="absolute inset-2 rounded-full border border-primary-foreground/20" />
                    )}

                    <div className="text-center z-10">
                      <AnimatePresence mode="popLayout">
                        <motion.div
                          key={kicks.length}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          className={`text-4xl font-bold leading-none ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                        >
                          {kicks.length}
                        </motion.div>
                      </AnimatePresence>
                      <div className={`text-sm mt-1 font-medium ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/60'}`}>
                        {t('toolsInternal.kickCounter.kicks')}
                      </div>
                    </div>

                    {/* Ripple effect on tap */}
                    {isActive && kicks.length > 0 && (
                      <motion.div
                        key={`ripple-${kicks.length}`}
                        className="absolute inset-0 rounded-full bg-primary-foreground/20"
                        initial={{ scale: 0.5, opacity: 0.6 }}
                        animate={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Gesture Hint - Before starting */}
                {!isActive && (
                  <motion.div 
                    className="mt-6 flex flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm text-muted-foreground text-center max-w-[220px] leading-relaxed">
                      {t('toolsInternal.kickCounter.startHint')}
                    </p>
                    <Button
                      className="px-8 h-12 text-sm font-bold rounded-2xl shadow-lg shadow-primary/20"
                      onClick={startSession}
                    >
                      <Play className="w-4 h-4 me-2" />
                      {t('toolsInternal.kickCounter.startNewSession')}
                    </Button>
                  </motion.div>
                )}

                {/* Active State - Tap hint with animated hand */}
                {isActive && (
                  <motion.div 
                    className="mt-5 flex flex-col items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Animated tap gesture */}
                    <motion.div
                      className="flex items-center gap-2 text-primary"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <motion.span 
                        className="text-2xl"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        👆
                      </motion.span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {t('toolsInternal.kickCounter.tapCircle')}
                      </span>
                    </motion.div>

                    {/* Last kick time */}
                    {kicks.length > 0 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-muted-foreground/60"
                      >
                        {t('toolsInternal.kickCounter.lastKick')}: {new Date(kicks[kicks.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </motion.p>
                    )}

                    {/* Goal progress indicator */}
                    <div className="w-full max-w-[200px]">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">{t('toolsInternal.kickCounter.goal')}</span>
                        <span className="text-[10px] font-bold text-primary">{kicks.length}/10</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (kicks.length / 10) * 100)}%` }}
                          transition={{ type: "spring", stiffness: 100 }}
                        />
                      </div>
                    </div>

                    {/* End Session Button */}
                    <Button
                      variant="outline"
                      className="h-10 text-xs rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 mt-1"
                      onClick={endSession}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5 me-1.5" />
                      )}
                      {t('toolsInternal.kickCounter.endAndSave')}
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Notes - Compact */}
              {isActive && kicks.length >= 3 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4"
                >
                  <Textarea
                    placeholder={t('toolsInternal.kickCounter.notesPlaceholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none text-xs rounded-xl"
                    rows={2}
                  />
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Success celebration when goal reached */}
        <AnimatePresence>
          {isActive && kicks.length === 10 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 text-center"
            >
              <motion.span 
                className="text-3xl block mb-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                🎉
              </motion.span>
               <p className="text-sm font-bold text-foreground">{t('toolsInternal.kickCounter.goalReached')}</p>
               <p className="text-xs text-muted-foreground mt-1">{t('toolsInternal.kickCounter.goalReachedDesc')}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Empty state — no past sessions yet, gentle nudge to start ═══ */}
        {history.length === 0 && !isActive && (
          <ToolEmptyState
            icon={Baby}
            title={t('tools.empty.kickCounter.title')}
            description={t('tools.empty.kickCounter.desc')}
            ctaLabel={t('tools.empty.kickCounter.cta')}
            ctaDirection="up"
            onCta={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        )}

        {/* ═══ 2. Movement Score + Quick Stats — summary of past sessions,
                  shown AFTER the counter so the primary action is unobstructed ═══ */}
        {history.length > 0 && (
          <Card className="border-primary/15 overflow-hidden">
            <CardContent className="p-0">
              {/* Score row */}
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/10">
                <div className="relative w-11 h-11 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/20" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3.5"
                      strokeDasharray={`${(movementScore / 100) * 113} 113`} strokeLinecap="round"
                      className={getScoreColor(movementScore)} />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${getScoreColor(movementScore)}`}>{movementScore}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">{t('toolsInternal.kickCounter.movementScore')}</p>
                  <p className="text-[10px] text-muted-foreground">{t('toolsInternal.kickCounter.basedOnSessions', { count: history.length })}</p>
                </div>
              </div>
              {/* Mini stats row */}
              <div className="grid grid-cols-3 divide-x divide-border/10">
                <div className="p-2.5 text-center">
                  <div className="text-sm font-bold text-foreground">{getAverageKicks()}</div>
                  <p className="text-[9px] text-muted-foreground">{t('toolsInternal.kickCounter.avgKicks')}</p>
                </div>
                <div className="p-2.5 text-center">
                  <div className="text-sm font-bold text-foreground">{history.length}</div>
                  <p className="text-[9px] text-muted-foreground">{t('toolsInternal.kickCounter.sessions')}</p>
                </div>
                <div className="p-2.5 text-center">
                  <div className="text-sm font-bold text-foreground">
                    {history.length > 0 
                      ? Math.round(history.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / history.length)
                      : 0}
                  </div>
                  <p className="text-[9px] text-muted-foreground">{t('toolsInternal.kickCounter.avgMin')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ 3. Analysis Flow — Pattern → AI → History (connected) ═══ */}
        {history.length >= 2 && (
          <div className="rounded-2xl border border-border/20 overflow-hidden">
            {/* Pattern Visualizer */}
            <div className="p-0">
              <KickPatternVisualizer
                sessions={history.slice(0, 7).map((s: any) => ({
                  date: new Date(s.started_at).toISOString().split('T')[0],
                  kicks: s.total_kicks,
                  duration: s.duration_minutes || 0,
                  startTime: new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }))}
              />
            </div>

            {/* AI Movement Analysis — multi-phase: rule summary → deep AI (1 point) */}
            {history.length >= 3 && (
              <div className="border-t border-border/10 bg-muted/5 p-3">
                <AIMovementAnalysis
                  sessions={history.slice(0, 14).map((s: any) => ({
                    date: new Date(s.started_at).toISOString().split('T')[0],
                    kicks: s.total_kicks,
                    duration: s.duration_minutes || 0,
                    startTime: new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  }))}
                  currentWeek={currentWeek}
                  movementScore={movementScore}
                  avgKicks={getAverageKicks()}
                  avgDurationMinutes={
                    history.length > 0
                      ? Math.round(history.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) / history.length)
                      : 0
                  }
                />
              </div>
            )}

            {/* Recent Sessions — inside same container */}
            <div className="border-t border-border/10">
              <div className="px-3.5 py-2.5">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {t('toolsInternal.kickCounter.recentSessions')}
                </h4>
              </div>
              <div className="px-3.5 pb-3 space-y-1.5 max-h-52 overflow-y-auto">
                {history.map((session: any, index: number) => (
                  <motion.div
                    key={session.id || index}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Baby className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-foreground">
                          {session.total_kicks} {t('toolsInternal.kickCounter.movements')}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {t('toolsInternal.kickCounter.minWeek', { min: session.duration_minutes, week: session.week })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(session.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Safety Section — connected ═══ */}
        <div className="space-y-3">
          <EvidenceInfoBlock
            title={t("safety.evidence.kickCounting.title")}
            content={t("safety.evidence.kickCounting.content")}
            source={t("safety.evidence.kickCounting.source")}
          />

          {/* Active labor warning */}
          {kicks.length > 0 && kicks.length < 10 && elapsedTime > 7200 && (
            <ContextualWarningBanner
              level="warning"
              message={t("safety.banners.lowKicks")}
            />
          )}

          <WhenToCallDoctorCard context="kickCounter" />
        </div>
      </div>
    </ToolFrame>
  );
};

export default SmartKickCounter;
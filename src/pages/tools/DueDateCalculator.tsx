import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Info, Calendar, Save, Bell, Trash2, CalendarIcon } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ToolFrame } from "@/components/ToolFrame";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import { addDays, addWeeks, differenceInDays, format } from "date-fns";
import { formatLocalized } from "@/lib/dateLocale";
import { useToast } from "@/components/ui/use-toast";
import { safeParseLocalStorage, safeSaveToLocalStorage } from "@/lib/safeStorage";
import { useNotifications } from "@/hooks/useNotifications";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInAppReview } from "@/hooks/useInAppReview";
import { VideoLibrary } from "@/components/VideoLibrary";
import { dueDateVideosByLang } from "@/data/videoData";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";


interface SavedDueDate {
  id: string;
  lmpDate: string;
  dueDate: string;
  calculatedAt: string;
  reminderSet: boolean;
}

const isValidSaved = (data: unknown): data is SavedDueDate[] => {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' && item !== null && 
    typeof (item as SavedDueDate).id === 'string'
  );
};

export default function DueDateCalculator() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { maybePromptReview } = useInAppReview();
  const { profile: userProfile, setLastPeriodDate: saveProfileLMP } = useUserProfile();
  const [lmpDate, setLmpDate] = useState<Date | undefined>(
    userProfile.lastPeriodDate ? new Date(userProfile.lastPeriodDate + "T00:00:00") : undefined
  );
  const [lmpPopoverOpen, setLmpPopoverOpen] = useState(false);
  const lmpFieldRef = useRef<HTMLDivElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link from JourneyMissingMilestones: focus & open the LMP picker.
  useEffect(() => {
    if (searchParams.get("focus") !== "lmp") return;
    const id = window.setTimeout(() => {
      lmpFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setLmpPopoverOpen(true);
      // Clean the URL so a refresh doesn't re-trigger.
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchParams, setSearchParams]);
  const [savedDates, setSavedDates] = useState<SavedDueDate[]>([]);
  const [result, setResult] = useState<{
    dueDate: Date;
    currentWeeks: number;
    currentDays: number;
    trimester: number;
    conception: Date;
    firstTrimesterEnd: Date;
    secondTrimesterEnd: Date;
  } | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const saved = safeParseLocalStorage<SavedDueDate[]>('savedDueDates', [], isValidSaved);
    setSavedDates(saved);
    isInitialized.current = true;
   
  }, []);

  useEffect(() => {
    if (!isInitialized.current) return;
    safeSaveToLocalStorage('savedDueDates', savedDates);
  }, [savedDates]);

  const calculateFromLMP = () => {
    if (!lmpDate) return;
    const lmpStr = format(lmpDate, 'yyyy-MM-dd');
    saveProfileLMP(lmpStr);
    calculate(lmpDate);
  };

  const calculate = (lmp: Date) => {
    const conception = addWeeks(lmp, 2);
    const dueDate = addDays(lmp, 280);
    const today = new Date();
    const totalDaysPregnant = differenceInDays(today, lmp);
    const currentWeeks = Math.floor(totalDaysPregnant / 7);
    const currentDays = totalDaysPregnant % 7;
    let trimester = 1;
    if (currentWeeks >= 28) trimester = 3;
    else if (currentWeeks >= 14) trimester = 2;
    setResult({
      dueDate,
      currentWeeks: Math.max(0, currentWeeks),
      currentDays: Math.max(0, currentDays),
      trimester,
      conception,
      firstTrimesterEnd: addWeeks(lmp, 13),
      secondTrimesterEnd: addWeeks(lmp, 27),
    });
    maybePromptReview('due_date_calculated');
  };

  const saveResult = () => {
    if (!result || !lmpDate) return;
    const newSaved: SavedDueDate = {
      id: Date.now().toString(),
      lmpDate: format(lmpDate, 'yyyy-MM-dd'),
      dueDate: result.dueDate.toISOString(),
      calculatedAt: new Date().toISOString(),
      reminderSet: false,
    };
    setSavedDates(prev => [newSaved, ...prev].slice(0, 5));
    toast({ title: t('toolsInternal.dueDate.saved'), description: t('toolsInternal.dueDate.savedDesc') });
  };

  const setReminder = (saved: SavedDueDate) => {
    const dueDate = new Date(saved.dueDate);
    const formattedDate = formatLocalized(dueDate, "MMMM d, yyyy", currentLanguage);
    
    addNotification({
      type: 'appointment',
      title: t('toolsInternal.dueDate.dueDateReminderTitle'),
      message: t('toolsInternal.dueDate.dueDateReminderMessage', { date: formattedDate }),
      actionUrl: '/tools/birth-prep',
    });

    setSavedDates(prev => prev.map(s => 
      s.id === saved.id ? { ...s, reminderSet: true } : s
    ));

    toast({ 
      title: t('toolsInternal.dueDate.reminderSetTitle'), 
      description: t('toolsInternal.dueDate.reminderSetDesc', { date: formattedDate })
    });
  };

  const deleteResult = (id: string) => {
    setSavedDates(prev => prev.filter(s => s.id !== id));
    toast({ title: t('toolsInternal.dueDate.deleted'), description: t('toolsInternal.dueDate.deletedDesc') });
  };



  return (
    <ToolFrame 
      title={t('tools.dueDateCalculator.title')} 
      subtitle={t('tools.dueDateCalculator.description')}
      customIcon="calendar"
      mood="nurturing"
      toolId="due-date-calculator"
      howToSteps={[
        { name: "Enter your last menstrual period (LMP)", text: "Tap the date field and select the first day of your last menstrual period from the calendar." },
        { name: "Calculate your due date", text: "The app instantly calculates your estimated due date using Naegele's rule (LMP + 280 days) and shows your current pregnancy week." },
        { name: "Save and get reminders", text: "Save your result to track your pregnancy progress week by week and enable optional reminders for important milestones." },
      ]}
    >
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
            <Card>
              <CardContent className="pt-5 space-y-4">
                    <div
                      ref={lmpFieldRef}
                      data-focused={lmpPopoverOpen && !lmpDate ? "true" : "false"}
                      className="space-y-2 scroll-mt-24 rounded-2xl p-1 transition-shadow data-[focused=true]:ring-2 data-[focused=true]:ring-primary/40"
                    >
                      <Label className="text-xs">{t('toolsInternal.dueDate.lmpLabel')}</Label>
                      <div className="flex gap-2">
                        <Popover open={lmpPopoverOpen} onOpenChange={setLmpPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal h-11 border-border/60", !lmpDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                              {lmpDate ? formatLocalized(lmpDate, "PPP", currentLanguage) : <span>{t('toolsInternal.dueDate.pickDate', 'Pick a date')}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarUI
                              mode="single"
                              selected={lmpDate}
                              onSelect={(date) => { setLmpDate(date); setLmpPopoverOpen(false); }}
                              disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        {lmpDate && (
                          <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => { setLmpDate(undefined); setResult(null); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {lmpDate && userProfile.lastPeriodDate && format(lmpDate, 'yyyy-MM-dd') === userProfile.lastPeriodDate && (
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          {t('toolsInternal.dueDate.fromProfile', 'Pre-filled from your profile')}
                        </p>
                      )}
                    </div>
                    <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}>
                      <Button onClick={calculateFromLMP} className="w-full h-11 font-medium shadow-sm" disabled={!lmpDate}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('toolsInternal.dueDate.calculateBtn')}
                      </Button>
                    </motion.div>
              </CardContent>
            </Card>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Due date — hero display */}
                <div className="rounded-2xl bg-primary p-5 text-center shadow-md">
                  <p className="text-lg font-bold text-primary-foreground">
                    {formatLocalized(result.dueDate, "d MMMM yyyy", currentLanguage)}
                  </p>
                  <p className="text-[11px] text-primary-foreground/70 mt-1 font-medium">
                    {t('toolsInternal.dueDate.weeksAndDays', { weeks: result.currentWeeks, days: result.currentDays })} • {t('toolsInternal.dueDate.trimester', { number: result.trimester })}
                  </p>
                </div>

                {/* Milestones — compact grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t('toolsInternal.dueDate.conception'), date: result.conception },
                    { label: t('toolsInternal.dueDate.secondTrimester'), date: result.firstTrimesterEnd },
                    { label: t('toolsInternal.dueDate.thirdTrimester'), date: result.secondTrimesterEnd },
                  ].map(({ label, date }) => (
                    <div key={label} className="rounded-xl bg-card p-2.5 border border-border/30 text-center">
                      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
                      <p className="text-xs font-semibold text-foreground mt-1">
                        {formatLocalized(date, "d MMM", currentLanguage)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Save button — inline */}
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button onClick={saveResult} variant="outline" className="w-full gap-1.5 text-[11px] h-9">
                    <Save className="h-3.5 w-3.5 shrink-0" />
                    {t('toolsInternal.dueDate.save')}
                  </Button>
                </motion.div>

                {/* AI Weekly Insights */}
                <AIInsightCard
                  title={t('toolsInternal.dueDate.aiGuideTitle')}
                  prompt={`I am currently ${result.currentWeeks} weeks and ${result.currentDays} days pregnant (Trimester ${result.trimester}). My due date is ${formatLocalized(result.dueDate, "MMMM d, yyyy", currentLanguage)}.

Please provide a comprehensive weekly guide:

## Week ${result.currentWeeks} Development
What's happening with my baby this week (size comparison, key developments)

## Your Body This Week
Physical changes and symptoms I might experience

## This Week's Checklist
5-6 specific tasks or appointments for week ${result.currentWeeks}

## Nutrition Focus
Key nutrients and foods to focus on this week

## Exercise Tips
Safe exercises for trimester ${result.trimester}

## Self-Care Reminder
A supportive message for this stage of pregnancy`}
                  context={{ week: result.currentWeeks, trimester: result.trimester }}
                  variant="banner"
                  buttonText={t('toolsInternal.dueDate.getWeeklyGuide')}
                />
              </motion.div>
            )}

            {savedDates.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {t('toolsInternal.dueDate.savedDueDates')}
                  </p>
                  <div className="space-y-2">
                    {savedDates.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 border border-border/30 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground text-xs break-words">
                            {t('toolsInternal.dueDate.due')}: {formatLocalized(new Date(saved.dueDate), "MMMM d, yyyy", currentLanguage)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {t('toolsInternal.dueDate.calculated')}: {formatLocalized(new Date(saved.calculatedAt), "MMM d, yyyy", currentLanguage)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!saved.reminderSet ? (
                            <motion.div whileTap={{ scale: 0.9 }}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setReminder(saved)}
                                className="gap-1 h-8 px-2 text-xs"
                              >
                                <Bell className="h-3.5 w-3.5" />
                                {t('toolsInternal.dueDate.remind')}
                              </Button>
                            </motion.div>
                          ) : (
                            <span className="text-[10px] text-primary px-2 py-1 bg-primary/8 rounded-full flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              {t('toolsInternal.dueDate.reminderSet')}
                            </span>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => deleteResult(saved.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <VideoLibrary
              videosByLang={dueDateVideosByLang}
              title={t('toolsInternal.dueDate.videosTitle')}
              subtitle={t('toolsInternal.dueDate.videosSubtitle')}
            />

            <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t('toolsInternal.dueDate.info')}
              </p>
            </div>
        </motion.div>
    </ToolFrame>
  );
}

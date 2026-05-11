import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Baby, Heart, Flower2, CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatLocalized } from '@/lib/dateLocale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { JourneyStage } from '@/hooks/useUserProfile';
import { WhyWeAsk } from '@/components/onboarding/WhyWeAsk';

interface Props {
  journeyStage: JourneyStage;
  onJourneyChange: (stage: JourneyStage) => void;
  week: string;
  onWeekChange: (w: string) => void;
  lmpDate: Date | undefined;
  onLmpChange: (d: Date | undefined) => void;
  onNext: () => void;
  onBack: () => void;
}

export const OnboardingStep2Journey: React.FC<Props> = ({
  journeyStage, onJourneyChange, week, onWeekChange, lmpDate, onLmpChange, onNext, onBack,
}) => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  const isRtl = i18n.language === 'ar';
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const [lmpOpen, setLmpOpen] = useState(false);

  const stages: { key: JourneyStage; icon: React.ElementType; labelKey: string; gradient: string; shadow: string }[] = [
    { key: 'fertility', icon: Flower2, labelKey: 'onboarding.step2.fertility', gradient: 'from-[hsl(15,70%,55%)] to-[hsl(30,80%,60%)]', shadow: 'shadow-[0_4px_20px_-4px_hsl(15,70%,55%,0.35)]' },
    { key: 'pregnant', icon: Baby, labelKey: 'onboarding.step2.pregnant', gradient: 'from-[hsl(340,65%,52%)] to-[hsl(320,50%,58%)]', shadow: 'shadow-[0_4px_20px_-4px_hsl(340,65%,52%,0.35)]' },
    { key: 'postpartum', icon: Heart, labelKey: 'onboarding.step2.postpartum', gradient: 'from-[hsl(290,35%,52%)] to-[hsl(270,40%,58%)]', shadow: 'shadow-[0_4px_20px_-4px_hsl(290,35%,52%,0.35)]' },
  ];

  return (
    <motion.div
      key="step2"
      className="flex h-full flex-col"
      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-5 pt-4 pb-2 text-center">
        <h2 className="text-lg font-black text-foreground">
          {t('onboarding.step2.title', 'Where are you in your journey?')}
        </h2>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-3 space-y-2">
        {/* Journey stage cards */}
        <div className="space-y-2">
          {stages.map(({ key, icon: Icon, labelKey, gradient, shadow }) => (
            <button
              key={key}
              onClick={() => onJourneyChange(key)}
              className={cn(
                "w-full py-3 px-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-3",
                journeyStage === key
                  ? `bg-gradient-to-r ${gradient} border-transparent ${shadow} scale-[1.02]`
                  : "bg-card/80 border-border/20 hover:border-border/40 hover:shadow-md"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                journeyStage === key ? "bg-white/25" : "bg-muted/60"
              )}>
                <Icon className={cn("w-4.5 h-4.5", journeyStage === key ? "text-white" : "text-foreground/60")} />
              </div>
              <p className={cn("text-sm font-bold", journeyStage === key ? "text-white" : "text-foreground")}>
                {t(labelKey)}
              </p>
            </button>
          ))}
        </div>

        {/* Pregnant-specific fields */}
        {journeyStage === 'pregnant' && (
          <div className="space-y-2 pt-1">
            <div>
              <label className="text-sm font-semibold text-foreground/70 mb-1 flex items-center gap-1.5">
                {t('onboarding.pregnancyWeek', 'Week')} (1–42)
                <WhyWeAsk reason={t('onboarding.why.week', 'يحدد أسبوع الحمل توقيت الفحوص والملخصات الأسبوعية المخصّصة لكِ.')} />
              </label>
              <input
                type="number"
                min={1} max={42}
                value={week}
                onChange={e => onWeekChange(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="20"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground/70 mb-1 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                {t('onboarding.lastPeriod', 'Last Period')} ({t('onboarding.optional', 'optional')})
                <WhyWeAsk reason={t('onboarding.why.lmp', 'تاريخ آخر دورة يحسب الأسبوع وموعد الولادة المتوقع تلقائيًا — أدقّ من إدخال الأسبوع يدويًا.')} />
              </label>
              <div className="flex gap-1.5">
                <Popover open={lmpOpen} onOpenChange={setLmpOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("flex-1 justify-start text-left font-normal h-11 text-sm rounded-xl", !lmpDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="me-2 h-4 w-4 text-primary shrink-0" />
                      {lmpDate ? formatLocalized(lmpDate, "PPP", currentLanguage) : t('onboarding.selectDate', 'Pick a date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[400]" align="start">
                    <Calendar
                      mode="single"
                      selected={lmpDate}
                      onSelect={(d) => { onLmpChange(d); setLmpOpen(false); }}
                      disabled={(d) => d > new Date() || d < new Date("2020-01-01")}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {lmpDate && (
                  <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onLmpChange(undefined)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-4 pb-4 flex gap-2.5">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack} className="flex-1 py-3.5 rounded-2xl border border-border/40 bg-card text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-muted/40 transition-colors text-foreground/70 shadow-sm">
          <BackIcon className="w-4 h-4" /> {t('onboarding.back', 'Back')}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onNext} className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
          {t('onboarding.next', 'Continue')} <NextIcon className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JourneyStage } from '@/hooks/useUserProfile';
import { WhyWeAsk } from '@/components/onboarding/WhyWeAsk';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CONDITIONS_BY_STAGE: Record<JourneyStage, string[]> = {
  fertility: ['pcos', 'thyroidDisorder', 'highBloodPressure', 'none'],
  pregnant: ['gestationalDiabetes', 'highBloodPressure', 'twinPregnancy', 'thyroidDisorder', 'none'],
  postpartum: ['postpartumDepression', 'highBloodPressure', 'thyroidDisorder', 'none'],
};

interface Props {
  journeyStage: JourneyStage;
  weight: string;
  onWeightChange: (w: string) => void;
  height: string;
  onHeightChange: (h: string) => void;
  bloodType: string;
  onBloodTypeChange: (bt: string) => void;
  healthConditions: string[];
  onHealthConditionsChange: (conditions: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const OnboardingStep3Health: React.FC<Props> = ({
  journeyStage, weight, onWeightChange, height, onHeightChange,
  bloodType, onBloodTypeChange,
  healthConditions, onHealthConditionsChange,
  onNext, onBack,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const conditions = CONDITIONS_BY_STAGE[journeyStage] || CONDITIONS_BY_STAGE.pregnant;

  const toggleCondition = (c: string) => {
    if (c === 'none') {
      onHealthConditionsChange(['none']);
      return;
    }
    const without = healthConditions.filter(x => x !== 'none');
    if (without.includes(c)) {
      onHealthConditionsChange(without.filter(x => x !== c));
    } else {
      onHealthConditionsChange([...without, c]);
    }
  };

  return (
    <motion.div
      key="step3"
      className="flex h-full flex-col"
      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground leading-tight">
            {t('onboarding.step3.title', 'Your Health Data')}
          </h2>
          <p className="text-sm text-foreground/60 font-medium leading-snug">
            {t('onboarding.step3.subtitle', 'Helps us give accurate recommendations')}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-3 space-y-3">
        {/* Weight, Height & Blood Type */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-bold text-foreground mb-1 flex items-center gap-1">
              {t('onboarding.weight', 'Weight')} (kg)
              <WhyWeAsk reason={t('onboarding.why.weight', 'يساعدنا على متابعة منحنى الوزن الصحي خلال الحمل وتنبيهكِ عند الزيادات السريعة.')} />
            </label>
            <input
              type="number" min={30} max={200} step={0.1}
              value={weight}
              onChange={e => onWeightChange(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="65"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-1 flex items-center gap-1">
              {t('onboarding.height', 'Height')} (cm)
              <WhyWeAsk reason={t('onboarding.why.height', 'الطول مع الوزن يحسب مؤشر كتلة الجسم لتوصيات تغذية أدق.')} />
            </label>
            <input
              type="number" min={100} max={220}
              value={height}
              onChange={e => onHeightChange(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              placeholder="165"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-1 flex items-center gap-1">
              {t('onboarding.step3.bloodType', 'Blood Type')}
              <WhyWeAsk reason={t('onboarding.why.bloodType', 'فصيلة الدم مهمة في حالات الطوارئ ولمتابعة عامل Rh — اختياري بالكامل.')} />
            </label>
            <Select value={bloodType} onValueChange={onBloodTypeChange}>
              <SelectTrigger className="h-11 text-sm rounded-xl">
                <SelectValue placeholder={t('onboarding.step3.selectBloodType', 'Select')} />
              </SelectTrigger>
              <SelectContent className="z-[400]">
                <SelectItem value="unknown">{t('onboarding.step3.unknown', 'Unknown')}</SelectItem>
                {BLOOD_TYPES.map(bt => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Health Conditions */}
        <div>
          <label className="text-sm font-bold text-foreground block mb-2">
            {t('onboarding.step3.healthConsiderations', 'Health Considerations')}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {conditions.map((c) => {
              const isSelected = healthConditions.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-start transition-colors",
                    isSelected
                      ? "bg-primary/8 border-primary/30 text-primary font-semibold"
                      : "bg-transparent border-border/40 text-foreground/70 hover:bg-muted/40"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                  )}>
                    {isSelected && <span className="text-primary-foreground text-[9px] font-bold">✓</span>}
                  </div>
                  <span className="leading-tight">{t(`onboarding.step3.condition.${c}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
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

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserProfile, computeWeekFromLMP } from '@/hooks/useUserProfile';
import type { JourneyStage } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { preloadAllLanguages } from '@/i18n';
import { safeSaveToLocalStorage } from '@/lib/safeStorage';

import { OnboardingStep1Welcome } from '@/components/onboarding/OnboardingStep1Welcome';
import { OnboardingStep2Journey } from '@/components/onboarding/OnboardingStep2Journey';
import { OnboardingStep3Health } from '@/components/onboarding/OnboardingStep3Health';
import { OnboardingStep4Goals } from '@/components/onboarding/OnboardingStep4Goals';
import { OnboardingStep5Privacy } from '@/components/onboarding/OnboardingStep5Privacy';

const ONBOARDING_KEY = 'onboarding_disclaimer_accepted';
const FIRST_VISIT_KEY = 'language_selected_first_visit';
const TOTAL_STEPS = 5;

interface OnboardingDisclaimerProps {
  /** When true, opens immediately regardless of localStorage flag.
   *  Used by Settings → "Update journey profile" to re-edit fields. */
  forceOpen?: boolean;
  /** Called whenever the modal closes (after finish OR external dismiss). */
  onClose?: () => void;
}

export function OnboardingDisclaimer({ forceOpen, onClose }: OnboardingDisclaimerProps = {}) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const { i18n } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const { profile, updateProfile, setLastPeriodDate } = useUserProfile();
  const isRtl = i18n.language === 'ar';

  const detectedLang = currentLanguage || navigator.language?.split('-')[0] || 'en';
  const [selectedLang, setSelectedLang] = useState(detectedLang);
  const [journeyStage, setJourneyStage] = useState<JourneyStage>(profile.journeyStage || 'pregnant');
  const [week, setWeek] = useState(profile.pregnancyWeek ? String(profile.pregnancyWeek) : '');
  const [lmpDate, setLmpDate] = useState<Date | undefined>(
    profile.lastPeriodDate ? new Date(profile.lastPeriodDate + "T00:00:00") : undefined
  );
  const [weight, setWeight] = useState(profile.weight ? String(profile.weight) : '');
  const [height, setHeight] = useState(profile.height ? String(profile.height) : '');
  const [bloodType, setBloodType] = useState(profile.bloodType ?? '');
  const [healthConditions, setHealthConditions] = useState<string[]>(profile.healthConditions || []);
  const [goals, setGoals] = useState<string[]>(profile.goals || []);
  const [notifVitamins, setNotifVitamins] = useState(false);
  const [notifWater, setNotifWater] = useState(false);
  const [notifAppointments, setNotifAppointments] = useState(false);

  useEffect(() => {
    if (show) preloadAllLanguages();
  }, [show]);

  useEffect(() => {
    if (forceOpen) {
      setShow(true);
      return;
    }
    const accepted = localStorage.getItem(ONBOARDING_KEY);
    if (!accepted) setShow(true);
  }, [forceOpen]);

  const handleFinish = () => {
    const isPregnant = journeyStage === 'pregnant';
    const updates: Record<string, unknown> = {
      isPregnant,
      journeyStage,
      healthConditions: healthConditions.filter(c => c !== 'none'),
      goals,
    };

    if (isPregnant) {
      const weekNum = parseInt(week);
      if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 42) {
        updates.pregnancyWeek = weekNum;
      }
      if (lmpDate) {
        setLastPeriodDate(format(lmpDate, 'yyyy-MM-dd'));
      }
    }

    const w = parseFloat(weight);
    if (!isNaN(w) && w > 0 && w < 300) updates.weight = w;
    const h = parseFloat(height);
    if (!isNaN(h) && h > 0 && h < 300) updates.height = h;
    updates.bloodType = (bloodType && bloodType !== 'unknown') ? bloodType : null;

    updateProfile(updates);

    safeSaveToLocalStorage('notif_pref_vitamins', notifVitamins);
    safeSaveToLocalStorage('notif_pref_water', notifWater);
    safeSaveToLocalStorage('notif_pref_appointments', notifAppointments);

    if (selectedLang !== currentLanguage) changeLanguage(selectedLang);
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
    setShow(false);
    onClose?.();

    // Open the app cleanly from the top after onboarding finishes
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    });
  };

  const handleLmpChange = (d: Date | undefined) => {
    setLmpDate(d);
    if (d) {
      const lmpStr = format(d, 'yyyy-MM-dd');
      const computed = computeWeekFromLMP(lmpStr);
      setWeek(String(computed));
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            className="w-full max-w-[360px] h-[min(88vh,32rem)] rounded-2xl bg-card border border-border/40 shadow-xl overflow-hidden flex flex-col"
            dir={isRtl ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Step dots — clean, consistent, no broken bar */}
            <div className="flex justify-center items-center gap-1.5 pt-4 pb-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(i => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 ease-out",
                    i === step
                      ? "bg-primary w-6"
                      : i < step
                        ? "bg-primary/50 w-1.5"
                        : "bg-muted-foreground/20 w-1.5"
                  )}
                />
              ))}
            </div>

            <div className="flex-1 min-h-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`step-${step}`}
                  className="h-full"
                  initial={{ opacity: 0, x: isRtl ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? 16 : -16 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 1 && (
                    <OnboardingStep1Welcome
                      selectedLang={selectedLang}
                      onSelectLang={setSelectedLang}
                      onNext={() => setStep(2)}
                    />
                  )}
                  {step === 2 && (
                    <OnboardingStep2Journey
                      journeyStage={journeyStage}
                      onJourneyChange={setJourneyStage}
                      week={week}
                      onWeekChange={setWeek}
                      lmpDate={lmpDate}
                      onLmpChange={handleLmpChange}
                      onNext={() => setStep(3)}
                      onBack={() => setStep(1)}
                    />
                  )}
                  {step === 3 && (
                    <OnboardingStep3Health
                      journeyStage={journeyStage}
                      weight={weight}
                      onWeightChange={setWeight}
                      height={height}
                      onHeightChange={setHeight}
                      bloodType={bloodType}
                      onBloodTypeChange={setBloodType}
                      healthConditions={healthConditions}
                      onHealthConditionsChange={setHealthConditions}
                      onNext={() => setStep(4)}
                      onBack={() => setStep(2)}
                    />
                  )}
                  {step === 4 && (
                    <OnboardingStep4Goals
                      goals={goals}
                      onGoalsChange={setGoals}
                      notifVitamins={notifVitamins}
                      onNotifVitaminsChange={setNotifVitamins}
                      notifWater={notifWater}
                      onNotifWaterChange={setNotifWater}
                      notifAppointments={notifAppointments}
                      onNotifAppointmentsChange={setNotifAppointments}
                      onNext={() => setStep(5)}
                      onBack={() => setStep(3)}
                    />
                  )}
                  {step === 5 && (
                    <OnboardingStep5Privacy
                      onFinish={handleFinish}
                      onBack={() => setStep(4)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Shield, Zap, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const logoImage = "/splash-logo-v2.webp";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
];

const valueProps: Record<string, { v1: string; v2: string; v3: string }> = {
  en: { v1: '10 free smart analyses/month', v2: 'Full privacy — data stays on your device', v3: '36+ professional tools' },
  ar: { v1: '10 تحليلات ذكية مجانية/شهر', v2: 'خصوصية كاملة — بياناتك على جهازك فقط', v3: '36+ أداة احترافية' },
  de: { v1: '10 kostenlose Analysen/Monat', v2: 'Volle Privatsphäre — Daten bleiben lokal', v3: '36+ professionelle Tools' },
  tr: { v1: 'Ayda 10 ücretsiz analiz', v2: 'Tam gizlilik — veriler cihazınızda kalır', v3: '36+ profesyonel araç' },
  fr: { v1: '10 analyses gratuites/mois', v2: 'Confidentialité totale — données locales', v3: '36+ outils professionnels' },
  es: { v1: '10 análisis gratuitos/mes', v2: 'Privacidad total — datos en tu dispositivo', v3: '36+ herramientas profesionales' },
  pt: { v1: '10 análises gratuitas/mês', v2: 'Privacidade total — dados no seu dispositivo', v3: '36+ ferramentas profissionais' },
};

const deviceLangLabel: Record<string, string> = {
  en: 'Device Language',
  ar: 'لغة الجهاز',
  de: 'Gerätesprache',
  tr: 'Cihaz Dili',
  fr: 'Langue de l\'appareil',
  es: 'Idioma del dispositivo',
  pt: 'Idioma do dispositivo',
};

const orChooseLabel: Record<string, string> = {
  en: 'or choose manually',
  ar: 'أو اختاري يدوياً',
  de: 'oder manuell wählen',
  tr: 'veya manuel seçin',
  fr: 'ou choisir manuellement',
  es: 'o elegir manualmente',
  pt: 'ou escolher manualmente',
};

interface Props {
  selectedLang: string;
  onSelectLang: (code: string) => void;
  onNext: () => void;
}

function getDeviceLanguageName(): string {
  const raw = navigator.language || 'en';
  try {
    const display = new Intl.DisplayNames([raw], { type: 'language' });
    return display.of(raw) || raw;
  } catch {
    return raw;
  }
}

export const OnboardingStep1Welcome: React.FC<Props> = ({ selectedLang, onSelectLang, onNext }) => {
  const { t, i18n } = useTranslation();
  const { changeLanguage } = useLanguage();
  const isRtl = i18n.language === 'ar';
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const lang = i18n.language?.split('-')[0] || 'en';
  const vp = valueProps[lang] || valueProps.en;

  const deviceLangCode = navigator.language?.split('-')[0] || 'en';
  const isDeviceSelected = selectedLang === 'auto' || (selectedLang === deviceLangCode && !languages.some(l => l.code === selectedLang && selectedLang !== deviceLangCode));

  const handleLangSelect = (code: string) => {
    onSelectLang(code);
    changeLanguage(code);
  };

  const handleDeviceLang = () => {
    const supported = languages.find(l => l.code === deviceLangCode);
    const code = supported ? deviceLangCode : 'en';
    onSelectLang(code);
    changeLanguage(code);
  };

  return (
    <motion.div
      key="step1"
      className="flex h-full flex-col"
      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo & Title */}
      <div className="px-5 pt-5 pb-2 flex items-center gap-3">
        <motion.div
          className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <img src={logoImage} alt="App Logo" width={56} height={56} loading="eager" decoding="async" fetchPriority="high" className="w-full h-full object-cover" />
        </motion.div>
        <div className="min-w-0">
          <h2 className="text-xl font-black text-foreground leading-tight" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800 }}>
            {t('onboarding.title', 'Welcome to Your Journey')}
          </h2>
          <p className="mt-1 text-[10px] font-semibold text-muted-foreground/90 leading-tight">
            {t('onboarding.timeBadge', '~60 ثانية · يمكن تعديل كل شيء لاحقًا')}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-2 space-y-2 overflow-y-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-1 space-y-1.5">
          {[
            { icon: Zap, text: vp.v1 },
            { icon: Shield, text: vp.v2 },
            { icon: Check, text: vp.v3 },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold text-foreground/80 leading-snug">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <div>
          <button
            onClick={handleDeviceLang}
            style={{ background: 'linear-gradient(135deg, hsl(var(--background) / 0.18), hsl(var(--secondary) / 0.72), hsl(var(--primary) / 0.12))' }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-200",
              isDeviceSelected
                ? "border-primary/30 shadow-sm"
                : "border-border/30 hover:border-border/50"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
              isDeviceSelected ? "bg-primary/15" : "bg-background/70"
            )}>
              <Smartphone className={cn("w-4.5 h-4.5", isDeviceSelected ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 text-start">
              <p className={cn("text-sm font-bold leading-tight", isDeviceSelected ? "text-primary" : "text-foreground")}>
                {deviceLangLabel[lang] || deviceLangLabel.en}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">{getDeviceLanguageName()}</p>
            </div>
            {isDeviceSelected && <Check className="w-4.5 h-4.5 text-primary flex-shrink-0" />}
          </button>
        </div>

        <div className="px-2 py-1 flex items-center gap-3">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
            {orChooseLabel[lang] || orChooseLabel.en}
          </span>
          <div className="flex-1 h-px bg-border/40" />
        </div>

        <div className="pb-1">
          <div className="grid grid-cols-2 gap-1">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLangSelect(l.code)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors text-start",
                  selectedLang === l.code
                    ? "bg-primary/8 border-primary/30"
                    : "bg-transparent border-transparent hover:bg-muted/60"
                )}
              >
                <span className="text-sm">{l.flag}</span>
                <span className={cn("text-xs font-medium truncate", selectedLang === l.code ? "text-primary" : "text-foreground/70")}>
                  {l.name}
                </span>
                {selectedLang === l.code && <Check className="w-3.5 h-3.5 text-primary ms-auto flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
        >
          {t('onboarding.next', 'Continue')} <NextIcon className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

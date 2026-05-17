import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Loader2, Crown } from 'lucide-react';
import { UpgradeCard } from './UpgradeCard';
import { useAIUsage } from '@/contexts/AIUsageContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { resolveWeight, type AIToolType, type SmartSection } from '@/services/smartEngine/types';

interface AIActionButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
  icon?: React.ElementType;
  className?: string;
  variant?: 'default' | 'compact';
  /** Set false to hide the usage indicator below the button */
  showUsage?: boolean; // defaults to true — every AI button is plan-bound
  /** Tool type to show point cost hint */
  toolType?: AIToolType;
  /** Section to resolve tool type from if toolType not provided */
  section?: SmartSection;
}

// Localized cost-hint labels. costFmt(n) renders the actual weight (1, 2, 5, 7…)
// and supports Arabic plural forms (نقطة / نقطتين / نقاط).
const usageLabels: Record<string, {
  remaining: string; of: string; free: string; pro: string;
  limitReached: string; resetsMonthly: string; unlockMore: string;
  costFree: string; costFmt: (n: number) => string;
  upgradeTitle: string; upgradeSub: string; upgradeCta: string;
}> = {
  en: { remaining: 'remaining', of: 'of', free: 'Free', pro: 'PRO', limitReached: 'Monthly limit reached', resetsMonthly: 'Resets monthly', unlockMore: 'Unlock 75 Monthly Analyses', costFree: 'Free ✨', costFmt: (n) => `Uses ${n} ${n === 1 ? 'credit' : 'credits'}`, upgradeTitle: 'Want more analyses?', upgradeSub: 'Get 75 smart analyses every month', upgradeCta: 'View Plans' },
  ar: { remaining: 'متبقي', of: 'من', free: 'مجاني', pro: 'PRO', limitReached: 'تم استنفاد الحد الشهري', resetsMonthly: 'يتجدد شهرياً', unlockMore: 'احصلي على 75 تحليل شهرياً', costFree: 'مجاني ✨', costFmt: (n) => n === 1 ? 'تستهلك نقطة واحدة' : n === 2 ? 'تستهلك نقطتين' : `تستهلك ${n} نقاط`, upgradeTitle: 'تريدين تحليلات أكثر؟', upgradeSub: '75 تحليل ذكي كل شهر', upgradeCta: 'عرض الباقات' },
  de: { remaining: 'übrig', of: 'von', free: 'Gratis', pro: 'PRO', limitReached: 'Monatslimit erreicht', resetsMonthly: 'Monatlich zurückgesetzt', unlockMore: '75 Analysen pro Monat freischalten', costFree: 'Kostenlos ✨', costFmt: (n) => `Verbraucht ${n} ${n === 1 ? 'Credit' : 'Credits'}`, upgradeTitle: 'Mehr Analysen gewünscht?', upgradeSub: '75 smarte Analysen pro Monat', upgradeCta: 'Pläne ansehen' },
  fr: { remaining: 'restants', of: 'sur', free: 'Gratuit', pro: 'PRO', limitReached: 'Limite mensuelle atteinte', resetsMonthly: 'Réinitialisation mensuelle', unlockMore: 'Débloquer 75 analyses par mois', costFree: 'Gratuit ✨', costFmt: (n) => `Utilise ${n} ${n === 1 ? 'crédit' : 'crédits'}`, upgradeTitle: 'Plus d\'analyses ?', upgradeSub: '75 analyses intelligentes par mois', upgradeCta: 'Voir les offres' },
  es: { remaining: 'restantes', of: 'de', free: 'Gratis', pro: 'PRO', limitReached: 'Límite mensual alcanzado', resetsMonthly: 'Se renueva mensualmente', unlockMore: 'Desbloquear 75 análisis mensuales', costFree: 'Gratis ✨', costFmt: (n) => `Usa ${n} ${n === 1 ? 'crédito' : 'créditos'}`, upgradeTitle: '¿Más análisis?', upgradeSub: '75 análisis inteligentes al mes', upgradeCta: 'Ver planes' },
  pt: { remaining: 'restantes', of: 'de', free: 'Grátis', pro: 'PRO', limitReached: 'Limite mensal atingido', resetsMonthly: 'Renova mensalmente', unlockMore: 'Desbloquear 75 análises mensais', costFree: 'Grátis ✨', costFmt: (n) => `Usa ${n} ${n === 1 ? 'crédito' : 'créditos'}`, upgradeTitle: 'Quer mais análises?', upgradeSub: '75 análises inteligentes por mês', upgradeCta: 'Ver planos' },
  tr: { remaining: 'kalan', of: '/', free: 'Ücretsiz', pro: 'PRO', limitReached: 'Aylık limit doldu', resetsMonthly: 'Aylık sıfırlanır', unlockMore: 'Aylık 75 analiz açın', costFree: 'Ücretsiz ✨', costFmt: (n) => `${n} kredi kullanır`, upgradeTitle: 'Daha fazla analiz?', upgradeSub: 'Ayda 75 akıllı analiz', upgradeCta: 'Planları gör' },
};

/**
 * Unified AI action button with integrated usage counter.
 * When quota is exhausted, transforms into a premium upgrade CTA.
 */
export const AIActionButton: React.FC<AIActionButtonProps> = ({
  onClick,
  isLoading,
  label,
  loadingLabel,
  disabled,
  icon: CustomIcon,
  className = '',
  variant = 'default',
  showUsage = true,
  toolType,
  section,
}) => {
  const Icon = CustomIcon || Brain;
  const navigate = useNavigate();
  const isCompact = variant === 'compact';
  const { remaining, used, limit, isLimitReached, tier } = useAIUsage();
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'en';
  const labels = usageLabels[lang] || usageLabels.en;
  const isFree = tier === 'free';
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const weight = resolveWeight(toolType, section);

  // Gradient bar style based on remaining percentage
  const getBarGradient = () => {
    if (isLimitReached) return 'linear-gradient(90deg, hsl(0 72% 51%), hsl(0 72% 40%))';
    const remainPct = (remaining / limit) * 100;
    if (remainPct <= 15) return 'linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%))';
    if (remainPct <= 40) return 'linear-gradient(90deg, hsl(38 92% 50%), hsl(25 95% 53%))';
    return 'linear-gradient(90deg, hsl(var(--primary)), hsl(330 65% 50%))';
  };

  // When exhausted, show upgrade button instead of dead state
  if (isLimitReached) {
    return (
      <div className="space-y-2">
        <motion.button
          onClick={() => navigate('/pricing-demo')}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          className={`relative w-full overflow-hidden rounded-xl group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${className}`}
        >
          <div
            className={`w-full flex items-center justify-center gap-2 font-semibold text-white transition-all duration-300 ${isCompact ? 'px-4 h-10 text-xs rounded-xl' : 'px-5 h-[52px] text-sm rounded-xl'}`}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(340 55% 50%) 50%, hsl(280 45% 45%) 100%)',
              boxShadow: '0 4px 16px -2px hsl(var(--primary) / 0.25)',
            }}
          >
            <Crown className={`shrink-0 ${isCompact ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'}`} />
            <span className="min-w-0 whitespace-normal text-center leading-tight">{labels.unlockMore}</span>
          </div>
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full rtl:translate-x-full rtl:group-hover:-translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            aria-hidden
          />
        </motion.button>

        {showUsage && (
          <div className="flex items-center gap-2.5 px-1">
            
            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px hsl(0 0% 0% / 0.08)' }}>
              <div className="h-full rounded-full w-full" style={{ background: getBarGradient() }} />
            </div>
            <span className="text-[11px] text-muted-foreground font-semibold tabular-nums shrink-0">
              0 <span className="text-foreground/50 font-medium">/ {limit}</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  const effectiveDisabled = disabled || isLoading;

  return (
    <div className="space-y-2">
      <motion.button
        onClick={onClick}
        disabled={effectiveDisabled}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.01 }}
        className={`
          relative w-full overflow-hidden rounded-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
          ${className}
        `}
      >
        {/* Background gradient */}
        <div
          className={`
            w-full flex items-center justify-center gap-2
            font-semibold text-white
            transition-all duration-300
            ${isCompact ? 'px-4 h-10 text-xs rounded-xl' : 'px-5 h-[52px] text-sm rounded-xl'}
          `}
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(330 65% 50%) 50%, hsl(270 55% 50%) 100%)',
            boxShadow: isLoading
              ? 'none'
              : '0 4px 16px -2px hsl(var(--primary) / 0.35), 0 1px 4px hsl(var(--primary) / 0.2)',
          }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2.5">
              <Loader2 className={`animate-spin shrink-0 ${isCompact ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'}`} />
              <span className="min-w-0 whitespace-normal text-center leading-tight">{loadingLabel || label}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Icon className={`shrink-0 ${isCompact ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'}`} />
              <span className="min-w-0 whitespace-normal text-center leading-tight">{label}</span>
            </div>
          )}
        </div>

        {/* Shimmer sweep on hover */}
        <span
          className="absolute inset-0 -translate-x-full group-hover:translate-x-full rtl:translate-x-full rtl:group-hover:-translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          aria-hidden
        />
      </motion.button>

      {/* Usage indicator — unified gradient bar */}
      {showUsage && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 px-1">
            
            <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px hsl(0 0% 0% / 0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: getBarGradient() }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-semibold tabular-nums shrink-0">
              {remaining} <span className="text-foreground/50 font-medium">/ {limit}</span>
            </span>
          </div>

          {/* Cost hint + upgrade CTA for free users */}
          {isFree && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground/70 text-center font-medium px-1">
                {weight === 0 ? labels.costFree : labels.costFmt(weight)}
              </p>
              <UpgradeCard />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIActionButton;

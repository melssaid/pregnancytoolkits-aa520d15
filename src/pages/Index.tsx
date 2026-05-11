import { useMemo, memo, useState, useCallback, useEffect, lazy, Suspense } from "react";
import { useAIUsage } from "@/contexts/AIUsageContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { ChevronRight, ChevronLeft, ChevronDown, Lock, LockOpen, ShieldCheck, Clock, Sparkles, Brain, Gift, Crown, Share2, Zap, Check } from "lucide-react";
import PregnancyHeartIcon from "@/components/PregnancyHeartIcon";
import BabyFootprintsIcon from "@/components/BabyFootprintsIcon";
import RockingBabyIcon from "@/components/RockingBabyIcon";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { getJourneyCategories, getToolsByCategory, JourneyKey, Tool } from "@/lib/tools-data";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
// WelcomeCard & QuickActions removed — superseded by DashboardSnapshotCard
// and StageAwareSuggestionsCard which together cover greeting + tip + actions.
import { getToolTitle } from "@/lib/toolCopy";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CouponRedeemer } from "@/components/settings/CouponRedeemer";
import { SectionFeaturedArticles } from "@/components/articles/SectionFeaturedArticles";
import DashboardSnapshotCard from "@/components/home/DashboardSnapshotCard";
import StageAwareSuggestionsCard from "@/components/home/StageAwareSuggestionsCard";
import JourneyPromptCard from "@/components/home/JourneyPromptCard";
import { useUserProfile } from "@/hooks/useUserProfile";

// Lazy-load below-the-fold banner — shaves initial JS for faster LCP/TTI
const Preg10PromoBanner = lazy(() => import("@/components/home/Preg10PromoBanner"));

// Map journeyStage → journey card key
const stageToJourneyKey: Record<string, JourneyKey> = {
  fertility: "planning",
  pregnant: "pregnant",
  postpartum: "postpartum",
};



// ── Category styling lookup — brand-cohesive rose palette ────────────────
const categoryStyles: Record<string, { iconColor: string; iconBg: string; toolHover: string; hoverShadow: string; hoverBorder: string }> = {
  "categories.smartAssistant": { iconColor: "text-[hsl(340,55%,55%)] dark:text-[hsl(340,50%,65%)]", iconBg: "bg-[hsl(340,50%,95%)] dark:bg-[hsl(340,40%,18%)]", toolHover: "hover:bg-[hsl(340,40%,96%)] dark:hover:bg-[hsl(340,30%,14%)]", hoverShadow: "hover:shadow-[0_2px_12px_-2px_hsl(340,50%,55%,0.15)]", hoverBorder: "hover:border-[hsl(340,40%,85%)] dark:hover:border-[hsl(340,30%,25%)]" },
  "categories.fertility":     { iconColor: "text-[hsl(350,60%,58%)] dark:text-[hsl(350,55%,65%)]", iconBg: "bg-[hsl(350,55%,94%)] dark:bg-[hsl(350,40%,18%)]", toolHover: "hover:bg-[hsl(350,40%,96%)] dark:hover:bg-[hsl(350,30%,14%)]", hoverShadow: "hover:shadow-[0_2px_12px_-2px_hsl(350,55%,58%,0.15)]", hoverBorder: "hover:border-[hsl(350,40%,85%)] dark:hover:border-[hsl(350,30%,25%)]" },
  "categories.pregnancy":     { iconColor: "text-[hsl(340,65%,52%)] dark:text-[hsl(340,60%,62%)]", iconBg: "bg-[hsl(340,50%,94%)] dark:bg-[hsl(340,35%,18%)]", toolHover: "hover:bg-[hsl(340,35%,96%)] dark:hover:bg-[hsl(340,25%,14%)]", hoverShadow: "hover:shadow-[0_2px_12px_-2px_hsl(340,60%,52%,0.15)]", hoverBorder: "hover:border-[hsl(340,35%,85%)] dark:hover:border-[hsl(340,25%,25%)]" },
  "categories.nutrition":     { iconColor: "text-[hsl(15,65%,55%)] dark:text-[hsl(15,60%,62%)]",   iconBg: "bg-[hsl(15,55%,94%)] dark:bg-[hsl(15,35%,18%)]",   toolHover: "hover:bg-[hsl(15,40%,96%)] dark:hover:bg-[hsl(15,30%,14%)]", hoverShadow: "hover:shadow-[0_2px_12px_-2px_hsl(15,60%,55%,0.15)]", hoverBorder: "hover:border-[hsl(15,35%,85%)] dark:hover:border-[hsl(15,25%,25%)]" },
  "categories.wellness":      { iconColor: "text-[hsl(160,40%,45%)] dark:text-[hsl(160,35%,55%)]", iconBg: "bg-[hsl(160,35%,94%)] dark:bg-[hsl(160,25%,18%)]", toolHover: "hover:bg-[hsl(160,30%,96%)] dark:hover:bg-[hsl(160,20%,14%)]", hoverShadow: "hover:shadow-[0_2px_12px_-2px_hsl(160,35%,45%,0.15)]", hoverBorder: "hover:border-[hsl(160,25%,85%)] dark:hover:border-[hsl(160,18%,25%)]" },
  
  "categories.preparation":   { iconColor: "text-[hsl(170,35%,45%)] dark:text-[hsl(170,30%,55%)]", iconBg: "bg-[hsl(170,30%,94%)] dark:bg-[hsl(170,22%,18%)]", toolHover: "hover:bg-[hsl(170,25%,96%)] dark:hover:bg-[hsl(170,20%,14%)]", hoverShadow: "hover:shadow-[0_2px_12px_-2px_hsl(170,30%,45%,0.15)]", hoverBorder: "hover:border-[hsl(170,22%,85%)] dark:hover:border-[hsl(170,18%,25%)]" },
  "categories.postpartum":    { iconColor: "text-[hsl(310,35%,52%)] dark:text-[hsl(310,30%,62%)]", iconBg: "bg-[hsl(310,30%,94%)] dark:bg-[hsl(310,22%,18%)]", toolHover: "hover:bg-[hsl(310,25%,96%)] dark:hover:bg-[hsl(310,20%,14%)]", hoverShadow: "hover:shadow-[0_2px_12px_-2px_hsl(310,30%,52%,0.15)]", hoverBorder: "hover:border-[hsl(310,22%,85%)] dark:hover:border-[hsl(310,18%,25%)]" },
};

// Journey-specific icon colors — match each section's header gradient
const journeyIconStyles: Record<JourneyKey, { iconColor: string; iconBg: string }> = {
  planning:   { iconColor: "text-[hsl(15,70%,55%)] dark:text-[hsl(15,65%,62%)]",   iconBg: "bg-[hsl(15,55%,94%)] dark:bg-[hsl(15,35%,18%)]" },
  pregnant:   { iconColor: "text-[hsl(340,65%,52%)] dark:text-[hsl(340,60%,62%)]", iconBg: "bg-[hsl(340,50%,94%)] dark:bg-[hsl(340,35%,18%)]" },
  postpartum: { iconColor: "text-[hsl(290,35%,52%)] dark:text-[hsl(290,30%,62%)]", iconBg: "bg-[hsl(290,30%,94%)] dark:bg-[hsl(290,22%,18%)]" },
};

// ── Journey card theming — emotionally resonant, brand-cohesive ─────────
interface JourneyConfig {
  key: JourneyKey;
  icon?: LucideIcon;
  customIcon?: "footprints" | "rockingBaby" | "pregnancyHeart";
  headerGradient: string;
  headerText: string;
  bg: string;
  border: string;
  iconBg: string;
}

const journeyConfigs: JourneyConfig[] = [
  {
    // Planning/Fertility — Warm Coral-Peach: hope, warmth, anticipation
    key: "planning",
    customIcon: "rockingBaby",
    headerGradient: "bg-gradient-to-r from-[hsl(15,70%,62%)] via-[hsl(25,65%,65%)] to-[hsl(340,50%,65%)] dark:from-[hsl(15,65%,50%)] dark:via-[hsl(25,60%,52%)] dark:to-[hsl(340,45%,55%)]",
    headerText: "text-white",
    iconBg: "bg-white/20",
    bg: "from-[hsl(20,40%,97%)] via-[hsl(30,30%,97%)] to-[hsl(340,25%,97%)] dark:from-[hsl(20,20%,10%)] dark:via-[hsl(30,15%,9%)] dark:to-[hsl(340,15%,10%)]",
    border: "border-[hsl(20,30%,90%)] dark:border-[hsl(20,15%,18%)]",
  },
  {
    // Pregnancy — Deep Rose-Pink: love, strength, the core journey
    key: "pregnant",
    customIcon: "pregnancyHeart",
    headerGradient: "bg-gradient-to-r from-[hsl(340,65%,52%)] via-[hsl(345,60%,56%)] to-[hsl(350,55%,60%)] dark:from-[hsl(340,60%,45%)] dark:via-[hsl(345,55%,48%)] dark:to-[hsl(350,50%,52%)]",
    headerText: "text-white",
    iconBg: "bg-white/20",
    bg: "from-[hsl(340,30%,97%)] via-[hsl(345,25%,97%)] to-[hsl(350,20%,97%)] dark:from-[hsl(340,20%,10%)] dark:via-[hsl(345,15%,9%)] dark:to-[hsl(350,12%,10%)]",
    border: "border-[hsl(340,25%,90%)] dark:border-[hsl(340,15%,18%)]",
  },
  {
    // Postpartum/Baby — Soft Mauve-Lavender: tenderness, nurturing calm
    key: "postpartum",
    customIcon: "footprints",
    headerGradient: "bg-gradient-to-r from-[hsl(320,40%,58%)] via-[hsl(300,30%,60%)] to-[hsl(280,35%,62%)] dark:from-[hsl(320,35%,48%)] dark:via-[hsl(300,25%,50%)] dark:to-[hsl(280,30%,52%)]",
    headerText: "text-white",
    iconBg: "bg-white/20",
    bg: "from-[hsl(320,25%,97%)] via-[hsl(300,20%,97%)] to-[hsl(280,20%,97%)] dark:from-[hsl(320,15%,10%)] dark:via-[hsl(300,12%,9%)] dark:to-[hsl(280,12%,10%)]",
    border: "border-[hsl(310,20%,90%)] dark:border-[hsl(310,12%,18%)]",
  },
];

// ── Tool row component ──────────────────────────────────────────────────
const ToolRow = memo(function ToolRow({ tool, isRTL, isLocked = false, journeyKey }: { tool: Tool; isRTL: boolean; isLocked?: boolean; journeyKey?: JourneyKey }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'en';
  const navigate = useNavigate();
  const ToolIconComp = tool.icon;
  const hasPng = !!tool.pngIcon;
  const catStyle = categoryStyles[tool.categoryKey] || { iconColor: "text-muted-foreground", iconBg: "bg-muted/30", toolHover: "hover:bg-muted/50", hoverShadow: "hover:shadow-sm", hoverBorder: "hover:border-border/30" };
  const jStyle = journeyKey ? journeyIconStyles[journeyKey] : null;
  const style = { ...catStyle, ...(jStyle || {}) };

  const handleClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      navigate("/pricing-demo");
    }
  };

  const [imgError, setImgError] = useState(false);

  return (
    <Link to={isLocked ? "#" : tool.href} onClick={handleClick} className="block">
      <div className={`group flex flex-col items-center gap-1 p-2.5 rounded-xl bg-card/60 backdrop-blur-sm ${style.toolHover} border border-border/10 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.97] ${isLocked ? "opacity-50" : ""}`}>
        <div className={`relative w-9 h-9 rounded-lg ${style.iconBg} flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${isLocked ? "grayscale-[30%]" : ""}`}>
          {hasPng && !imgError ? (
            <img src={tool.pngIcon} alt="" className="w-4.5 h-4.5 object-contain opacity-75" loading="lazy" onError={() => setImgError(true)} />
          ) : (
            <ToolIconComp className={`w-4 h-4 ${style.iconColor} opacity-80`} strokeWidth={1.8} />
          )}
          {isLocked && (
            <div className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center border border-border/20">
              <Lock className="w-2 h-2 text-muted-foreground/60" />
            </div>
          )}
        </div>
        <span className="text-[9px] font-semibold text-foreground/75 leading-tight text-center line-clamp-2 min-h-[24px] flex items-center" style={{ fontFamily: "'Tajawal', sans-serif", overflowWrap: 'anywhere' }}>
          {getToolTitle(tool, t, lang)}
        </span>
      </div>
    </Link>
  );
});




// ── Journey card ────────────────────────────────────────────────────────


const JourneyCard = memo(function JourneyCard({ config, index, isSubscriptionActive, tier, isOpen, onToggle }: { config: JourneyConfig; index: number; isSubscriptionActive: boolean; tier?: import('@/hooks/useSubscriptionStatus').SubscriptionTier; isOpen: boolean; onToggle: () => void }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Icon = config.icon;

  const categories = useMemo(() => getJourneyCategories(config.key), [config.key]);
  const allJourneyTools = useMemo(() => {
    return categories
      .flatMap(catKey => getToolsByCategory(catKey))
      .sort((a, b) => a.priority - b.priority);
  }, [categories]);

  const totalTools = allJourneyTools.length;
  if (totalTools === 0) return null;

  

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} overflow-hidden backdrop-blur-md bg-opacity-80 dark:bg-opacity-75 animate-fade-in journey-card-glow relative journey-card-shimmer transition-all duration-500`}
      style={{
        animationDelay: `${index * 120}ms`,
        boxShadow: isOpen
          ? '0 10px 40px -6px hsl(340 50% 40% / 0.22), 0 2px 10px hsl(0 0% 0% / 0.08), inset 0 0 0 1px hsl(340 40% 55% / 0.10), inset 0 0 50px hsl(340 70% 60% / 0.05)'
          : '0 6px 32px -4px hsl(340 40% 40% / 0.18), 0 2px 8px hsl(0 0% 0% / 0.08), inset 0 0 0 1px hsl(340 30% 50% / 0.06)',
      }}
    >
      {/* Active section indicator — vertical accent bar (RTL-aware) */}
      <AnimatePresence>
        {isOpen && (
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.4 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className={`absolute top-[68px] bottom-2 w-[3px] rounded-full pointer-events-none z-10 ${isRTL ? 'right-0' : 'left-0'}`}
            style={{
              background: `linear-gradient(180deg, transparent 0%, hsl(340 70% 60% / 0.55) 20%, hsl(320 60% 55% / 0.55) 80%, transparent 100%)`,
              boxShadow: '0 0 8px hsl(340 70% 60% / 0.35)',
              transformOrigin: 'center',
            }}
          />
        )}
      </AnimatePresence>
      {/* Gradient Header — premium Pregnancy+ style */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`journey-tools-${config.key}`}
        className={`${config.headerGradient} px-4 py-4 relative z-20 overflow-hidden w-full text-start min-h-[68px] flex items-center cursor-pointer`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="absolute -top-6 -end-6 w-28 h-28 rounded-full bg-white/8 blur-2xl" />
        
        <div className="relative flex items-center gap-3 w-full">
          <div className="flex-1 min-w-0">
            <h2 className={`text-[22px] sm:text-2xl font-black ${config.headerText} tracking-tight leading-tight break-words ar-heading`} style={{ overflowWrap: 'anywhere', textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              {t(`journeys.${config.key}`)}
            </h2>
            <p className={`text-xs ${config.headerText} opacity-80 mt-2.5 leading-snug break-words font-medium`}>
              {t(`journeys.${config.key}Desc`)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              animate={{
                rotate: isOpen ? 180 : 0,
              }}
              transition={{
                rotate: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
              }}
              className="relative flex h-9 min-w-[3.4rem] items-center justify-center overflow-hidden rounded-full px-3"
              style={{
                background: isOpen
                  ? 'linear-gradient(135deg, hsl(0 0% 100% / 0.26), hsl(0 0% 100% / 0.12))'
                  : 'linear-gradient(135deg, hsl(0 0% 100% / 0.18), hsl(0 0% 100% / 0.08))',
                boxShadow: isOpen
                  ? 'inset 0 0 0 1px hsl(0 0% 100% / 0.28), 0 4px 12px hsl(0 0% 0% / 0.10)'
                  : 'inset 0 0 0 1px hsl(0 0% 100% / 0.22), 0 6px 18px hsl(340 40% 30% / 0.16)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-y-0 -left-1/3 w-1/2 rounded-full bg-white/20 blur-md"
                animate={{ x: [0, 56, 0], opacity: isOpen ? 0.18 : [0.08, 0.3, 0.08] }}
                transition={{ duration: isOpen ? 1.6 : 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <ChevronDown
                className={`w-5 h-5 ${config.headerText} relative z-10 drop-shadow-sm`}
                strokeWidth={2.75}
              />
            </motion.div>
          </div>
        </div>
      </button>

      {/* Collapsible Tools */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
              opacity: { duration: 0.4, ease: "easeInOut" }
            }}
            className="overflow-hidden"
            id={`journey-tools-${config.key}`}
          >
            <div className="px-2 pb-2.5 pt-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {allJourneyTools.map((tool, toolIdx) => {
                  // Wave-pattern stagger: row-based delay creates a cascading reveal
                  const row = Math.floor(toolIdx / 3);
                  const col = toolIdx % 3;
                  const waveDelay = 0.06 + row * 0.07 + col * 0.04;
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 14, scale: 0.92, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 6, scale: 0.96, filter: "blur(2px)" }}
                      transition={{
                        duration: 0.45,
                        delay: waveDelay,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <ToolRow tool={tool} isRTL={isRTL} isLocked={false} journeyKey={config.key} />
                    </motion.div>
                  );
                })}
              </div>
              <SectionFeaturedArticles sectionKey={config.key} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Footer Card — Premium CTA: world-class subscription design ─────────
const FooterCard = memo(function FooterCard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.split('-')[0] || 'en';
  const { remaining, limit, isLimitReached, tier, refresh } = useAIUsage();

  useEffect(() => { refresh(); }, [refresh]);
  const isAr = lang === 'ar';
  const isFree = tier === 'free';
  const usagePercent = limit > 0 ? (remaining / limit) * 100 : 0;
  const isPremium = tier === 'premium';

  const labels: Record<string, {
    title: string; cta: string; ctaPrice: string; trust: string;
    feat1: string; feat2: string; feat3: string;
    exhaustedTitle: string; exhaustedCta: string;
    premiumTitle: string; premiumDesc: string;
  }> = {
    en: {
      title: 'Unlock Your Full Journey', cta: 'Start Your Premium Journey', ctaPrice: '$2.99/mo', trust: '✨ Free trial · Cancel anytime',
      feat1: '75 smart analyses every month', feat2: 'All 36+ premium tools unlocked', feat3: 'Tailored guidance just for you',
      exhaustedTitle: 'You’ve used all your analyses', exhaustedCta: 'Continue with Premium',
      premiumTitle: 'Premium Member', premiumDesc: '60 monthly AI analyses ready',
    },
    ar: {
      title: 'افتحي رحلتكِ الكاملة', cta: 'ابدئي رحلتكِ المميزة', ctaPrice: '$2.99/شهر', trust: '✨ تجربة مجانية · إلغاء في أي وقت',
      feat1: '٦٠ تحليلاً ذكياً كل شهر', feat2: 'كل الأدوات المميزة (٣٦+)', feat3: 'إرشادات مخصصة لرحلتكِ',
      exhaustedTitle: 'انتهت تحليلاتكِ المجانية', exhaustedCta: 'تابعي مع Premium',
      premiumTitle: 'عضوة مميزة', premiumDesc: 'لديكِ ٦٠ تحليلاً شهرياً جاهزاً',
    },
    de: {
      title: 'Entfalte deine Reise', cta: 'Premium-Reise starten', ctaPrice: '$2.99/Monat', trust: '✨ Gratis testen · Jederzeit kündbar',
      feat1: '75 smarte Analysen / Monat', feat2: 'Alle 36+ Premium-Tools', feat3: 'Persönlich auf dich zugeschnitten',
      exhaustedTitle: 'Analysen aufgebraucht', exhaustedCta: 'Mit Premium fortfahren',
      premiumTitle: 'Premium-Mitglied', premiumDesc: '60 KI-Analysen pro Monat verfügbar',
    },
    fr: {
      title: 'Libère ton parcours', cta: 'Lancer mon parcours Premium', ctaPrice: '$2.99/mois', trust: '✨ Essai gratuit · Annulation à tout moment',
      feat1: '75 analyses intelligentes / mois', feat2: 'Tous les 36+ outils Premium', feat3: 'Conseils sur mesure pour toi',
      exhaustedTitle: 'Analyses épuisées', exhaustedCta: 'Continuer avec Premium',
      premiumTitle: 'Membre Premium', premiumDesc: '75 analyses IA mensuelles prêtes',
    },
    es: {
      title: 'Desbloquea tu viaje', cta: 'Comienza tu viaje Premium', ctaPrice: '$2.99/mes', trust: '✨ Prueba gratis · Cancela cuando quieras',
      feat1: '75 análisis inteligentes al mes', feat2: 'Todas las 36+ herramientas Premium', feat3: 'Consejos personalizados para ti',
      exhaustedTitle: 'Análisis agotados', exhaustedCta: 'Continuar con Premium',
      premiumTitle: 'Miembro Premium', premiumDesc: '75 análisis IA mensuales listos',
    },
    pt: {
      title: 'Desbloqueie sua jornada', cta: 'Começar jornada Premium', ctaPrice: '$2.99/mês', trust: '✨ Teste grátis · Cancele quando quiser',
      feat1: '75 análises inteligentes / mês', feat2: 'Todas as 36+ ferramentas Premium', feat3: 'Dicas feitas para você',
      exhaustedTitle: 'Análises esgotadas', exhaustedCta: 'Continuar com Premium',
      premiumTitle: 'Membro Premium', premiumDesc: '75 análises IA mensais prontas',
    },
    tr: {
      title: 'Yolculuğunu Aç', cta: 'Premium Yolculuğa Başla', ctaPrice: '$2.99/ay', trust: '✨ Ücretsiz deneme · Her an iptal',
      feat1: 'Ayda 75 akıllı analiz', feat2: 'Tüm 36+ Premium araç açık', feat3: 'Sana özel rehberlik',
      exhaustedTitle: 'Analizlerin tükendi', exhaustedCta: 'Premium ile Devam Et',
      premiumTitle: 'Premium Üye', premiumDesc: 'Aylık 75 AI analiz hazır',
    },
  };
  const l = labels[lang] || labels.en;
  const showExhausted = isLimitReached && isFree;

  // Premium member card
  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3"
      >
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-card text-start shadow-[var(--shadow-card)]">
          <div className="h-[3px] bg-gradient-to-r from-primary/15 via-primary/45 to-primary/15" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="mb-1 inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                Premium
              </div>
              <h4 className="text-sm font-extrabold leading-tight text-foreground" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                {l.premiumTitle}
              </h4>
              <p className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
                {l.premiumDesc}
              </p>
            </div>
            <div className="min-w-[4.75rem] rounded-xl border border-border bg-secondary px-2.5 py-2 text-center">
              <span className="text-base font-extrabold tabular-nums text-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
                {remaining}
              </span>
              <div className="text-[10px] font-medium text-muted-foreground">/ {limit}</div>
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="h-[6px] overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-4"
    >
      <div
        onClick={() => navigate('/pricing-demo')}
        className={`w-full cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 ${
          showExhausted
            ? 'bg-gradient-to-br from-destructive/[0.06] via-card to-destructive/[0.03] border-destructive/25'
            : 'bg-gradient-to-br from-[hsl(300,25%,97%)] via-card to-[hsl(340,20%,96%)] border-[hsl(340,25%,88%)] dark:from-[hsl(300,15%,12%)] dark:via-card dark:to-[hsl(340,15%,11%)] dark:border-[hsl(340,15%,20%)]'
        }`}
        style={{
          boxShadow: showExhausted
            ? '0 4px 20px -4px hsl(12 60% 55% / 0.15), 0 2px 8px -2px hsl(12 60% 55% / 0.1)'
            : '0 4px 24px -6px hsl(340 50% 55% / 0.18), 0 2px 10px -3px hsl(300 30% 55% / 0.08), 0 1px 4px -1px hsl(340 40% 50% / 0.06)'
        }}
      >
        {/* Top accent */}
        <div className={`h-[3px] relative overflow-hidden ${
          showExhausted
            ? 'bg-gradient-to-r from-destructive/40 via-destructive to-destructive/40'
            : 'bg-gradient-to-r from-[hsl(340,50%,65%)]/40 via-[hsl(340,60%,55%)] to-[hsl(300,35%,60%)]/50'
        }`}>
          <motion.div
            className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-100%', '400%'] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'linear' }}
          />
        </div>

        <div className="px-4 pt-4 pb-3">
          {/* Header with crown */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              {showExhausted && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-destructive/25 blur-lg"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center border ${
                showExhausted
                  ? 'bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/25'
                  : 'bg-gradient-to-br from-[hsl(340,50%,90%)] to-[hsl(300,30%,92%)] border-[hsl(340,40%,85%)]'
              }`}>
                <Crown className={`w-6 h-6 ${showExhausted ? 'text-destructive' : 'text-primary'}`} strokeWidth={1.8} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-black text-foreground leading-tight tracking-tight" style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 800 }}>
                {showExhausted ? l.exhaustedTitle : l.title}
              </h4>
            </div>
          </div>

          {/* Features list */}
          {!showExhausted && (
            <div className="space-y-1.5 mb-4">
              {[l.feat1, l.feat2, l.feat3].map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-primary" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80">{feat}</span>
                </div>
              ))}
            </div>
          )}

          {/* Usage bar for free users */}
          {isFree && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                  {isAr ? 'التحليلات المتبقية' : 'Remaining analyses'}
                </span>
                <span className="text-xs font-extrabold text-primary tabular-nums">
                  {remaining}<span className="text-[10px] text-foreground/60 font-semibold">/{limit}</span>
                </span>
              </div>
              <div className="h-[6px] rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full relative overflow-hidden ${isLimitReached ? 'bg-destructive' : 'bg-gradient-to-r from-[hsl(340,60%,55%)] to-[hsl(300,35%,58%)]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {usagePercent >= 70 && !isLimitReached && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    />
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {/* Big CTA Button */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white shadow-md ${
              showExhausted
                ? 'bg-gradient-to-r from-destructive to-destructive/80'
                : 'bg-gradient-to-r from-[hsl(340,60%,50%)] via-primary to-[hsl(300,40%,55%)]'
            }`}
          >
            <Crown className="w-4 h-4" strokeWidth={2} />
            <span>{showExhausted ? l.exhaustedCta : l.cta}</span>
            <span className="text-white/70 text-xs font-normal">— {l.ctaPrice}</span>
          </motion.div>

          {/* Trust line */}
          <p className="text-center text-[10px] text-muted-foreground mt-2 font-medium">
            {l.trust}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

// ── Coupon + Share Row ──────────────────────────────────────────────────
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.pregnancytoolkits.android";

const CouponAndShareRow = memo(function CouponAndShareRow() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'en';
  const isAr = lang === 'ar';
  const [couponOpen, setCouponOpen] = useState(false);

  const handleShare = async () => {
    const shareText = isAr
      ? '🤰 جربي "أدوات الحمل الذكية" — أكثر من 30 أداة مجانية لمتابعة الحمل وحاسبة الولادة ونصائح يومية!\n⭐ مجاني وخاص'
      : '🤰 Try "Pregnancy Toolkits" — 30+ free smart tools for pregnancy tracking & daily tips!\n⭐ Free & Private';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Pregnancy Toolkits', text: shareText, url: PLAY_STORE_URL });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${PLAY_STORE_URL}`);
        toast.success(isAr ? 'تم نسخ الرابط ✓' : 'Link copied ✓');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${shareText}\n${PLAY_STORE_URL}`);
          toast.success(isAr ? 'تم نسخ الرابط ✓' : 'Link copied ✓');
        } catch {}
      }
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-3 flex gap-2"
      >
        {/* Coupon CTA */}
        <button
          onClick={() => setCouponOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[hsl(340,30%,96%)] to-[hsl(35,40%,96%)] border border-[hsl(340,30%,88%)] hover:from-[hsl(340,35%,94%)] hover:to-[hsl(35,45%,94%)] active:scale-[0.98] transition-all dark:from-[hsl(340,20%,14%)] dark:to-[hsl(35,20%,14%)] dark:border-[hsl(340,15%,22%)]"
          style={{ boxShadow: '0 2px 12px -3px hsl(340 40% 55% / 0.12), 0 1px 4px -1px hsl(340 30% 50% / 0.06)' }}
        >
          <Gift className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
          <span className="text-xs font-semibold text-foreground/70">
            {isAr ? 'لديكِ قسيمة؟' : 'Have a coupon?'}
          </span>
        </button>

        {/* Share CTA */}
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[hsl(290,20%,96%)] to-[hsl(310,25%,96%)] border border-[hsl(290,20%,88%)] hover:from-[hsl(290,25%,94%)] hover:to-[hsl(310,30%,94%)] active:scale-[0.98] transition-all dark:from-[hsl(290,15%,14%)] dark:to-[hsl(310,15%,14%)] dark:border-[hsl(290,10%,22%)]"
          style={{ boxShadow: '0 2px 12px -3px hsl(290 25% 55% / 0.1), 0 1px 4px -1px hsl(310 20% 50% / 0.05)' }}
        >
          <Share2 className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
          <span className="text-xs font-semibold text-foreground/70">
            {isAr ? 'شاركي' : 'Share'}
          </span>
        </button>
      </motion.div>

      {/* Coupon Dialog */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent className="max-w-[340px] rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-center text-base font-bold">
              {isAr ? '🎁 تفعيل قسيمة' : '🎁 Redeem Coupon'}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              {isAr ? 'أدخلي رمز القسيمة لفتح المميزات المدفوعة' : 'Enter your coupon code to unlock premium features'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <CouponRedeemer />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});


// ── Main page ───────────────────────────────────────────────────────────
const Index = () => {
  const { t, i18n } = useTranslation();
  const { tier, isUnlocked, isLoading: subLoading } = useSubscriptionStatus();
  const { profile: userProfile } = useUserProfile();
  const lang = i18n.language?.split('-')[0] || 'en';

  // Fixed, predictable order — planning → pregnant → postpartum.
  // The user's stage only controls which section auto-opens, not the layout.
  const orderedJourneyConfigs = journeyConfigs;

  const [openJourneyKey, setOpenJourneyKey] = useState<JourneyKey | null>(() => {
    try {
      const savedOpen = localStorage.getItem("journey-open");
      if (savedOpen && journeyConfigs.some((config) => config.key === savedOpen)) {
        return savedOpen as JourneyKey;
      }

      const savedStates = localStorage.getItem("journey-states");
      if (savedStates) {
        const states = JSON.parse(savedStates) as Partial<Record<JourneyKey, boolean>>;
        const found = journeyConfigs.find((config) => states[config.key])?.key;
        if (found) return found;
      }
    } catch {}

    // Default: auto-open the user's current stage
    return stageToJourneyKey[userProfile.journeyStage] || null;
  });

  useEffect(() => {
    try {
      if (openJourneyKey) {
        localStorage.setItem("journey-open", openJourneyKey);
        localStorage.setItem("journey-states", JSON.stringify({ [openJourneyKey]: true }));
        return;
      }

      localStorage.removeItem("journey-open");
      localStorage.setItem("journey-states", JSON.stringify({}));
    } catch {}
  }, [openJourneyKey]);

  const handleJourneyToggle = useCallback((journeyKey: JourneyKey) => {
    setOpenJourneyKey((current) => (current === journeyKey ? null : journeyKey));
  }, []);

  return (
    <Layout>
      <SEOHead />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-[hsl(300,20%,95%)]/30 via-primary/5 to-transparent z-30 dark:from-[hsl(300,15%,8%)]/30" />

      <section className="pt-2 pb-0 relative z-10">
        <div className="px-2.5 sm:px-4 md:px-6 lg:px-8 max-w-4xl mx-auto space-y-2 pb-6">

          {/* Multi-choice journey prompt — auto-hides after answer */}
          <JourneyPromptCard />

          {/* Dashboard snapshot — native app pattern */}
          <DashboardSnapshotCard />

          {/* Unified daily focus strip — tip + next action + stage tools rail */}
          <StageAwareSuggestionsCard />

          {orderedJourneyConfigs.map((config, index) => (
            <JourneyCard
              key={config.key}
              config={config}
              index={index}
              isSubscriptionActive={subLoading || isUnlocked}
              tier={subLoading ? undefined : tier}
              isOpen={openJourneyKey === config.key}
              onToggle={() => handleJourneyToggle(config.key)}
            />
          ))}

          {/* Below-the-fold — content-visibility defers offscreen layout/paint */}
          <div style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 600px' }} className="space-y-3">
            {/* Exclusive gift banner — below journeys, above footer */}
            <Suspense fallback={null}>
              <Preg10PromoBanner lang={lang} />
            </Suspense>

            <FooterCard />

            {/* Coupon + Share row */}
            <CouponAndShareRow />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;

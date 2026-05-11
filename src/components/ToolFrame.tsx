import { useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BackButton } from "./BackButton";
import { RelatedTools } from "./RelatedTools";
import { ToolRelatedArticles } from "./articles/ToolRelatedArticles";
import { ToolIcon, hasToolIcon } from "./ToolIcon";
import { BottomNavigation } from "./BottomNavigation";
import { LanguageDropdown } from "./LanguageDropdown";
import { trackToolUsage } from "@/hooks/useInAppReview";

import { FertilityDailyTip } from "./FertilityDailyTip";
import { ToolRating } from "./ToolRating";
import { ResetDataButton } from "./ResetDataButton";

import { SEOHead } from "./SEOHead";
const logoImage = "/logo.webp";

const FERTILITY_TOOL_IDS = new Set([
  "cycle-tracker", "due-date-calculator", "fertility-academy",
  "nutrition-supplements", "preconception-checkup",
]);

/** Tools that store user-entered tracking data and benefit from a Reset control. */
const RESETTABLE_TOOL_IDS = new Set([
  "smart-kick-counter", "contraction-timer", "vitamin-tracker",
  "smart-weight-gain", "diaper-tracker", "baby-sleep-tracker",
  "baby-growth", "ai-bump-photos", "ai-birth-plan",
  "ai-hospital-bag", "smart-grocery-list",
]);


interface ToolFrameProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  customIcon?: string;
  mood?: "calm" | "nurturing" | "empowering" | "joyful";
  toolId?: string;
  showRelated?: boolean;
  noCard?: boolean;
  /** HowTo schema steps for SEO rich snippets */
  howToSteps?: { name: string; text: string }[];
}

// Unified Warm Rose-to-Lavender ambient palette across all tool pages.
// The page background is fully transparent so the global body gradient
// (cream → blush → lavender) flows through the ToolFrame, header, and
// inner sections. Only the accent hue varies per mood to keep buttons,
// icons, and highlights distinct.
const moodStyles = {
  calm: {
    accent: "from-indigo-500 to-violet-600",
    iconBg: "bg-gradient-to-br from-indigo-400 to-violet-500",
    border: "border-violet-200/40",
    glow: "from-violet-300/25",
    badge: "from-indigo-500/10 to-violet-500/10",
  },
  nurturing: {
    accent: "from-rose-500 to-pink-600",
    iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",
    border: "border-rose-200/40",
    glow: "from-rose-300/25",
    badge: "from-rose-500/10 to-pink-500/10",
  },
  empowering: {
    accent: "from-amber-500 to-rose-500",
    iconBg: "bg-gradient-to-br from-amber-400 to-rose-400",
    border: "border-amber-200/40",
    glow: "from-amber-300/25",
    badge: "from-amber-500/10 to-rose-500/10",
  },
  joyful: {
    accent: "from-pink-500 to-purple-600",
    iconBg: "bg-gradient-to-br from-pink-400 to-purple-500",
    border: "border-pink-200/40",
    glow: "from-pink-300/25",
    badge: "from-pink-500/10 to-purple-500/10",
  },
};

export function ToolFrame({ 
  children, 
  title, 
  subtitle, 
  icon: Icon,
  customIcon,
  mood = "nurturing",
  toolId,
  showRelated = true,
  noCard = false,
  howToSteps,
}: ToolFrameProps) {
  const { t, i18n } = useTranslation();
  const styles = moodStyles[mood];
  const isRTL = i18n.language === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  
  // Check if we have a custom icon for this tool
  const hasCustomIcon = toolId && hasToolIcon(toolId);

  // Track tool usage for smart review prompts
  useEffect(() => {
    if (toolId) trackToolUsage(toolId);
  }, [toolId]);

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden overflow-y-auto">
      <SEOHead title={title} description={subtitle} howToSteps={howToSteps} />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-32 -right-32 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-br ${styles.glow} to-transparent rounded-full blur-3xl opacity-60`} />
        <div className={`absolute -bottom-32 -left-32 w-72 md:w-96 h-72 md:h-96 bg-gradient-to-tr ${styles.glow} to-transparent rounded-full blur-3xl opacity-40`} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Sticky Header — translucent so the ambient gradient flows through */}
        <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10 shadow-sm overflow-hidden">
          {/* Subtle top accent line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          
          <div dir="ltr" className="px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <BackButton />
            </div>
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <motion.div 
                className="relative flex items-center justify-center"
                style={{ width: 64, height: 64 }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.08, 0.97, 1], opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                {/* Rotating ring */}
                <motion.div
                  className="absolute rounded-full border border-primary/15"
                  style={{ width: 60, height: 60 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                {/* Heart particles */}
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const angle = (i / 6) * 360;
                  const radius = 28;
                  const isPink = i % 2 === 1;
                  return (
                    <motion.span
                      key={i}
                      className={`absolute ${isPink ? 'text-pink-400 drop-shadow-[0_0_6px_rgba(244,114,182,0.6)]' : 'text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]'}`}
                      style={{ fontSize: isPink ? 9 : 8 }}
                      animate={isPink ? {
                        x: [
                          Math.cos((angle * Math.PI) / 180) * radius,
                          Math.cos(((angle + 180) * Math.PI) / 180) * (radius * 0.7),
                          Math.cos(((angle + 360) * Math.PI) / 180) * radius,
                        ],
                        y: [
                          Math.sin((angle * Math.PI) / 180) * radius,
                          Math.sin(((angle + 180) * Math.PI) / 180) * (radius * 0.7),
                          Math.sin(((angle + 360) * Math.PI) / 180) * radius,
                        ],
                        scale: [0.6, 1.5, 0.6],
                        opacity: [0.3, 0.9, 0.3],
                        rotate: [0, 20, -20, 0],
                      } : {
                        x: [
                          Math.cos((angle * Math.PI) / 180) * radius,
                          Math.cos(((angle + 360) * Math.PI) / 180) * radius,
                        ],
                        y: [
                          Math.sin((angle * Math.PI) / 180) * radius,
                          Math.sin(((angle + 360) * Math.PI) / 180) * radius,
                        ],
                        scale: [0.8, 1.3, 0.8],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={isPink ? {
                        x: { duration: 12, repeat: Infinity, ease: "easeInOut" },
                        y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
                        opacity: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
                        rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                      } : {
                        x: { duration: 8, repeat: Infinity, ease: "linear" },
                        y: { duration: 8, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                        opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                      }}
                    >
                      ♥
                    </motion.span>
                  );
                })}
                {/* Aura */}
                <motion.div
                  className="absolute rounded-full bg-primary/8 blur-lg"
                  style={{ width: 54, height: 54 }}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="h-12 w-12 rounded-full overflow-hidden shadow-lg">
                  <img 
                    src={logoImage} 
                    alt="Pregnancy Toolkits" 
                    width={48}
                    height={48}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover scale-[1.35]"
                  />
                </div>
              </motion.div>
            </Link>
            <div className="flex-shrink-0">
              <LanguageDropdown />
            </div>
          </div>
        </header>

        {/* Title + Benefit — Unified Hero Strip */}
        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="px-4 sm:px-6 pt-4 pb-2"
        >
          {/* Title */}
          <h1 className="text-[13px] font-extrabold text-foreground tracking-tight leading-snug mb-3">
            {title}
          </h1>

          {/* Benefit Card — Elegant inline design */}
          {toolId && t(`toolBenefits.${toolId}`, '') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
              className="relative rounded-xl overflow-hidden"
            >
              {/* Background layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.05]" />
              <div className="absolute inset-0 border border-primary/10 rounded-xl" />
              
              {/* Content */}
              <div className="relative p-3">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                    <Lightbulb className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-foreground/90 mb-1">
                      {t('toolBenefits.heading', 'What do I benefit from this tool?')}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {t(`toolBenefits.${toolId}`)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.section>

        {/* Main Content Card */}
        <section className="px-4 sm:px-6 pb-4">
          {noCard ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
              className="tool-content overflow-hidden [&_*]:min-w-0"
              dir={dir}
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
              className="relative bg-card backdrop-blur-xl rounded-2xl overflow-hidden border border-border/50 shadow-card"
            >
              {/* Top accent stripe */}
              <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-primary/50 via-primary/25 to-accent/35" />
              
              {/* Content */}
              <div className="relative p-4 sm:p-5 pt-5 overflow-hidden [&_*]:min-w-0" dir={dir} style={{ textAlign: isRTL ? "right" : "left" }}>
                {children}
              </div>
            </motion.div>
          )}


          {/* Fertility Expert tip — only for fertility tools */}
          {toolId && FERTILITY_TOOL_IDS.has(toolId) && (
            <div className="mt-4">
              <FertilityDailyTip titleKey="fertilityExpert.title" />
            </div>
          )}

          {/* Tool Rating */}
          {toolId && (
            <div className="mt-4">
              <ToolRating toolId={toolId} />
            </div>
          )}

          {/* Per-tool reset control */}
          {toolId && RESETTABLE_TOOL_IDS.has(toolId) && (
            <div className="mt-3 flex justify-center">
              <ResetDataButton toolId={toolId} variant="ghost" />
            </div>
          )}

          {/* Related Tools */}
          {showRelated && toolId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <RelatedTools currentToolId={toolId} maxItems={3} />
            </motion.div>
          )}
        </section>

        {/* Related Articles — placed just before the footer */}
        {toolId && (
          <section className="px-4 sm:px-6 pb-6">
            <ToolRelatedArticles toolId={toolId} maxItems={3} />
          </section>
        )}

        {/* Elegant Footer Disclaimer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="px-4 sm:px-6 pb-8"
        >
          <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted/15 border border-border/25">
            <ShieldCheck className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
            <p className="text-[8px] text-muted-foreground/50 font-medium text-center tracking-wide leading-relaxed">
              {t('app.medicalDisclaimer')}
            </p>
          </div>
        </motion.footer>



        {/* Bottom Navigation for Mobile */}
        <BottomNavigation />
      </div>
    </div>
  );
}

export default ToolFrame;

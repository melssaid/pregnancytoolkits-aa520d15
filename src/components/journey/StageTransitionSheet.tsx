/**
 * StageTransitionSheet — A formal, one-time celebratory sheet shown
 * when the user transitions across a journey stage.
 *
 * Tone:
 *   • Serious, gentle, never gamified — no points, no badges.
 *   • A single message of acknowledgement + a soft CTA to the new
 *     stage's landing context (Journey Map by default).
 *   • Auto-dismissable; the underlying hook only fires once per real
 *     transition.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sprout, Heart, Baby } from "lucide-react";
import { useStageTransition } from "@/hooks/useStageTransition";
import { useStageTheme } from "@/hooks/useStageTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import type { JourneyStage } from "@/hooks/useUserProfile";

const STAGE_ICON: Record<JourneyStage, typeof Sprout> = {
  fertility: Sprout,
  pregnant: Heart,
  postpartum: Baby,
};

export function StageTransitionSheet() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const theme = useStageTheme();
  const { transition, dismiss } = useStageTransition();

  if (!transition) return null;

  const Icon = STAGE_ICON[transition.to];
  const stageLabel = t(`journey.ribbon.stages.${transition.to}`);

  const handleViewJourney = () => {
    dismiss();
    navigate("/my-journey");
  };

  return (
    <Sheet open={!!transition} onOpenChange={(o) => !o && dismiss()}>
      <SheetContent
        side="bottom"
        dir={isRTL ? "rtl" : "ltr"}
        className="rounded-t-3xl border-t border-border/60 px-5 py-6 max-h-[85vh]"
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            {/* Themed medallion */}
            <div className="relative h-16 w-16 mb-4">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-3xl"
                style={{ background: theme.glow, filter: "blur(14px)" }}
                animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.1, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
              <span
                className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-white/70 dark:border-white/15 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.7)]"
                style={{
                  background: `linear-gradient(160deg, hsl(${theme.accentHue} 70% 95%) 0%, hsl(${theme.accentHueAlt} 60% 90%) 100%)`,
                }}
              >
                <Icon
                  className="h-7 w-7"
                  strokeWidth={2.2}
                  style={{ color: `hsl(${theme.accentHue} 60% 38%)` }}
                  aria-hidden
                />
              </span>
            </div>

            <h2
              className="text-xl font-black text-foreground"
              style={{ fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', sans-serif" }}
            >
              {t("journey.transition.title", "A new chapter")}
            </h2>
            <p className="mt-2 text-sm text-foreground/85 leading-relaxed max-w-sm">
              {t("journey.transition.message", {
                stage: stageLabel,
                defaultValue: "You are entering: {{stage}}.",
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-sm">
              {t(
                "journey.transition.subtitle",
                "We have updated your companion to match this stage.",
              )}
            </p>

            <div className="mt-5 flex w-full max-w-sm flex-col gap-2">
              <Button onClick={handleViewJourney} className="w-full rounded-2xl">
                {t("journey.transition.viewJourney", "View my journey")}
              </Button>
              <Button
                variant="ghost"
                onClick={dismiss}
                className="w-full rounded-2xl text-muted-foreground"
              >
                {t("journey.transition.dismiss", "Continue")}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}

export default StageTransitionSheet;

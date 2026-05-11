/**
 * NextMilestoneCard — Shows the next pregnancy/journey milestone with
 * a clear "X days from now" anchor. Provides "next-step certainty"
 * (NHS Digital Service Manual).
 *
 * Milestones are static per-week markers (anatomy scan, glucose test,
 * GBS, etc.) — derived from week, not from an external API.
 */
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { haptic } from "@/lib/haptics";

interface Milestone {
  week: number;
  labelKey: string;
  fallback: string;
}

// Evidence-aligned with WHO ANC schedule + ACOG routine antenatal markers,
// rephrased in wellness/non-diagnostic language.
const MILESTONES: Milestone[] = [
  { week: 8,  labelKey: "milestones.w8",  fallback: "أول زيارة متابعة" },
  { week: 12, labelKey: "milestones.w12", fallback: "نهاية الثلث الأول" },
  { week: 16, labelKey: "milestones.w16", fallback: "متابعة منتصف الثلث الثاني" },
  { week: 20, labelKey: "milestones.w20", fallback: "زيارة منتصف الحمل" },
  { week: 24, labelKey: "milestones.w24", fallback: "فحص متابعة سكر الحمل" },
  { week: 28, labelKey: "milestones.w28", fallback: "بداية الثلث الثالث — متابعة الحركة يوميًا" },
  { week: 32, labelKey: "milestones.w32", fallback: "متابعة نمو الطفل" },
  { week: 36, labelKey: "milestones.w36", fallback: "تجهيز خطة الولادة" },
  { week: 40, labelKey: "milestones.w40", fallback: "موعد الولادة المتوقع" },
];

export const NextMilestoneCard = memo(function NextMilestoneCard() {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const week = profile.pregnancyWeek || 0;

  const next = useMemo(() => {
    if (week < 1 || profile.journeyStage !== "pregnant") return null;
    return MILESTONES.find(m => m.week > week) ?? null;
  }, [week, profile.journeyStage]);

  if (!next) return null;

  const weeksAway = next.week - week;
  const daysAway = weeksAway * 7;
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  const handle = () => {
    haptic("tap");
    navigate("/my-journey");
  };

  return (
    <motion.button
      type="button"
      onClick={handle}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full text-start rounded-3xl border border-primary/15
                 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.05]
                 p-4 active:scale-[0.99] transition-transform
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={t("nextMilestone.aria", "الميل-ستون التالي")}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0
                        bg-gradient-to-br from-primary/15 to-accent/15 ring-1 ring-primary/15">
          <CalendarDays className="w-4 h-4 text-primary" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary/80 mb-0.5">
            {t("nextMilestone.title", "المحطة القادمة")}
          </p>
          <p className="text-[14px] font-extrabold text-foreground leading-snug">
            {t(next.labelKey, next.fallback)}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
            {t("nextMilestone.weekN", { defaultValue: "الأسبوع {{w}}", w: next.week })}
            {" · "}
            {weeksAway === 1
              ? t("nextMilestone.inDays", { defaultValue: "بعد {{d}} يومًا", d: daysAway })
              : t("nextMilestone.inWeeks", { defaultValue: "بعد {{w}} أسابيع", w: weeksAway })}
          </p>
        </div>
        <Chevron className="w-4 h-4 text-primary/50 flex-shrink-0" />
      </div>
    </motion.button>
  );
});

export default NextMilestoneCard;

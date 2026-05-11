import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getStageContent } from "@/lib/stageAwareContent";

/**
 * Daily Insight strip — visually subordinate companion to the hero
 * DashboardSnapshotCard above. Pattern matches world-class apps
 * (Flo "Today's tip", Ovia "Insight of the day"): a single rotating
 * tip + one most-relevant CTA. Avoids duplicating the snapshot's
 * priorities grid and lets the hero stay the page's focal point.
 */
const StageAwareSuggestionsCard = memo(function StageAwareSuggestionsCard() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = isRTL ? "ar" : "en";
  const { profile } = useUserProfile();

  const stage = profile.journeyStage;
  if (!stage) return null;

  const week = profile.pregnancyWeek || 0;
  const content = getStageContent(stage, week, lang);
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  // Show only the single most relevant tool — supporting CTA, not a grid.
  const primary = content.tools[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="relative rounded-2xl border border-border/40 bg-card/70 backdrop-blur-sm px-3.5 py-3 sm:px-4"
      aria-label={isRTL ? "نصيحة اليوم" : "Today's insight"}
    >
      <div className="flex items-start gap-3">
        {/* Icon badge */}
        <div
          className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background:
              "linear-gradient(135deg, hsl(340 55% 92%), hsl(35 60% 95%))",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.6)",
          }}
        >
          <Sparkles
            className="h-3.5 w-3.5 text-[hsl(340,60%,48%)]"
            strokeWidth={2.4}
          />
        </div>

        {/* Tip + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[hsl(340,55%,42%)] dark:text-[hsl(340,45%,72%)]">
              {isRTL ? "نصيحة اليوم" : "Today's tip"}
            </span>
            <span className="text-[10px] font-bold text-foreground/55">
              {content.contextLabel}
            </span>
          </div>
          <p
            className="text-[12.5px] font-semibold leading-snug text-foreground/85"
            style={{
              fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
            }}
          >
            {content.tip}
          </p>

          {/* Single contextual CTA — most relevant tool only */}
          {primary && (
            <Link
              to={primary.href}
              className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[hsl(340,60%,45%)] dark:text-[hsl(340,55%,72%)] hover:underline underline-offset-4"
            >
              <span aria-hidden="true">{primary.emoji}</span>
              <span>
                {lang === "ar" ? primary.titleAr : primary.titleEn}
              </span>
              <ChevronIcon className="h-3 w-3" strokeWidth={2.6} />
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
});

export default StageAwareSuggestionsCard;

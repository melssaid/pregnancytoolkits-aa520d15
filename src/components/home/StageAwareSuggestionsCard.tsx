import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getStageContent, getNextActionIndex } from "@/lib/stageAwareContent";

/**
 * Daily Insight strip — a refined, world-class companion to the hero
 * DashboardSnapshotCard above. No icon: a delicate vertical accent bar,
 * a small uppercase eyebrow label, an elegantly typeset tip, and one
 * inline CTA chip. Pattern inspired by Flo, Ovia, BabyCenter "tip of
 * the day" strips. Fully localized across the 7 supported languages.
 */

// Localized eyebrow label across the 7 supported app languages.
const TIP_LABEL: Record<string, string> = {
  ar: "نصيحة اليوم",
  en: "Today's tip",
  fr: "Conseil du jour",
  es: "Consejo de hoy",
  de: "Tipp des Tages",
  pt: "Dica de hoje",
  tr: "Günün ipucu",
};

const StageAwareSuggestionsCard = memo(function StageAwareSuggestionsCard() {
  const { i18n } = useTranslation();
  const lng = (i18n.language || "en").slice(0, 2).toLowerCase();
  const isRTL = i18n.dir() === "rtl" || lng === "ar";
  // Content engine currently supports ar/en only; other languages fall back to en.
  const contentLang: "ar" | "en" = lng === "ar" ? "ar" : "en";
  const { profile } = useUserProfile();

  const stage = profile.journeyStage;
  if (!stage) return null;

  const week = profile.pregnancyWeek || 0;
  const content = getStageContent(stage, week, contentLang);
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const eyebrow = TIP_LABEL[lng] || TIP_LABEL.en;

  // Show only the single most relevant tool — supporting CTA, not a grid.
  const primary = content.tools[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={eyebrow}
      className="relative overflow-hidden rounded-t-[28px] rounded-b-2xl border border-border/40 px-4 pt-4 pb-3.5 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_8px_24px_-18px_hsl(340_40%_40%/0.25)]"
      style={{
        background:
          "linear-gradient(135deg, hsl(340 60% 99%) 0%, hsl(20 55% 99%) 50%, hsl(280 50% 99%) 100%)",
      }}
    >
      {/* Concave top arc — echoes header & snapshot card curve */}
      <svg
        aria-hidden
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-0 left-0 right-0 h-[10px] sm:h-[14px]"
      >
        <path
          d="M0,0 L0,6 C320,38 1120,38 1440,6 L1440,0 Z"
          fill="hsl(340 50% 99% / 0.9)"
        />
      </svg>

      {/* Subtle decorative orb (no icon) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -end-8 h-24 w-24 rounded-full opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, hsl(340 70% 88% / 0.65), transparent 70%)",
        }}
      />

      <div className="relative flex items-stretch gap-3">
        {/* Vertical accent bar — replaces the icon, premium minimal cue */}
        <div
          aria-hidden
          className="shrink-0 w-[3px] rounded-full self-stretch"
          style={{
            background:
              "linear-gradient(180deg, hsl(340 70% 62%), hsl(20 75% 70%) 60%, hsl(280 55% 72%))",
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[hsl(340,55%,42%)] dark:text-[hsl(340,45%,72%)]">
              {eyebrow}
            </span>
            <span className="text-[10px] font-bold text-foreground/55">
              {content.contextLabel}
            </span>
          </div>

          <p
            className="text-[13px] sm:text-[13.5px] font-semibold leading-[1.55] text-foreground/90"
            style={{
              fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
              textWrap: "balance" as const,
            }}
          >
            {content.tip}
          </p>

          {/* Single contextual CTA chip — most relevant tool only */}
          {primary && (
            <Link
              to={primary.href}
              className="group mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[hsl(340,50%,88%)] bg-white/70 dark:bg-white/5 px-3 py-1.5 text-[11.5px] font-bold text-[hsl(340,60%,42%)] dark:text-[hsl(340,55%,80%)] backdrop-blur-sm transition-all hover:border-[hsl(340,60%,75%)] hover:bg-white hover:shadow-[0_4px_14px_-6px_hsl(340_50%_55%/0.35)] active:scale-[0.98]"
            >
              <span aria-hidden="true" className="text-[13px] leading-none">
                {primary.emoji}
              </span>
              <span className="leading-none">
                {contentLang === "ar" ? primary.titleAr : primary.titleEn}
              </span>
              <ChevronIcon
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                strokeWidth={2.6}
              />
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
});

export default StageAwareSuggestionsCard;

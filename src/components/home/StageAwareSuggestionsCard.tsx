import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getStageContent, getNextActionIndex } from "@/lib/stageAwareContent";

/**
 * Compact "Daily focus" strip — merges the previous tip card + follow-up
 * tools card into ONE space-efficient row.
 *  - Top line: tiny TIP eyebrow + tip text (2-line clamp)
 *  - Bottom line: horizontal scroll chips, "next action" first (highlighted),
 *    rest of stage tools follow in order.
 * Replaces two stacked cards with a single curved strip — saves ~140px
 * vertical space before the journey sections.
 */

const TIP_LABEL: Record<string, string> = {
  ar: "نصيحة اليوم",
  en: "Today's tip",
  fr: "Conseil",
  es: "Consejo",
  de: "Tipp",
  pt: "Dica",
  tr: "İpucu",
};

const StageAwareSuggestionsCard = memo(function StageAwareSuggestionsCard() {
  const { i18n } = useTranslation();
  const lng = (i18n.language || "en").slice(0, 2).toLowerCase();
  const isRTL = i18n.dir() === "rtl" || lng === "ar";
  const contentLang: "ar" | "en" = lng === "ar" ? "ar" : "en";
  const { profile } = useUserProfile();

  const stage = profile.journeyStage;
  if (!stage) return null;

  const week = profile.pregnancyWeek || 0;
  const content = getStageContent(stage, week, contentLang);
  const nextIdx = getNextActionIndex(stage, week);
  const eyebrow = TIP_LABEL[lng] || TIP_LABEL.en;

  // Order: next action first, then rest in original order
  const ordered = [
    content.tools[nextIdx],
    ...content.tools.filter((_, i) => i !== nextIdx),
  ].filter(Boolean);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={eyebrow}
      className="relative overflow-hidden rounded-t-[24px] rounded-b-2xl border border-border/40 px-3 pt-2.5 pb-2 shadow-[0_1px_0_hsl(0_0%_100%/0.6)_inset,0_6px_18px_-14px_hsl(340_40%_40%/0.22)]"
      style={{
        background:
          "linear-gradient(135deg, hsl(340 60% 99%) 0%, hsl(20 55% 99%) 50%, hsl(280 50% 99%) 100%)",
      }}
    >
      {/* Concave top arc — subtle harmony with hero card */}
      <svg
        aria-hidden
        viewBox="0 0 1440 32"
        preserveAspectRatio="none"
        className="pointer-events-none absolute top-0 left-0 right-0 h-[8px]"
      >
        <path
          d="M0,0 L0,4 C320,30 1120,30 1440,4 L1440,0 Z"
          fill="hsl(340 50% 99% / 0.9)"
        />
      </svg>

      {/* Tip line */}
      <div className="relative flex items-start gap-2">
        <div
          aria-hidden
          className="shrink-0 mt-1 w-[3px] h-[26px] rounded-full"
          style={{
            background:
              "linear-gradient(180deg, hsl(340 70% 62%), hsl(20 75% 70%))",
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[hsl(340,55%,42%)] dark:text-[hsl(340,45%,72%)]">
              {eyebrow}
            </span>
            <span className="text-[9px] font-bold text-foreground/50">
              · {content.contextLabel}
            </span>
          </div>
          <p
            className="mt-0.5 text-[12px] font-semibold leading-[1.4] text-foreground/85 line-clamp-2"
            style={{
              fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
              textWrap: "balance" as const,
            }}
          >
            {content.tip}
          </p>
        </div>
      </div>

      {/* Tools chip rail — next action first, then rest */}
      <div
        className="relative mt-2 flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {ordered.map((t, i) => {
          const isNext = i === 0;
          return (
            <Link
              key={t.href}
              to={t.href}
              aria-current={isNext ? "true" : undefined}
              className={`group shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-[0.97] ${
                isNext
                  ? "border border-[hsl(340,55%,75%)] bg-white text-[hsl(340,60%,40%)] shadow-[0_2px_8px_-3px_hsl(340_50%_55%/0.4)]"
                  : "border border-border/50 bg-white/60 text-foreground/75 hover:bg-white"
              }`}
            >
              <span aria-hidden className="text-[12px] leading-none">
                {t.emoji}
              </span>
              <span className="leading-none whitespace-nowrap">
                {contentLang === "ar" ? t.titleAr : t.titleEn}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
});

export default StageAwareSuggestionsCard;

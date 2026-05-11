import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getStageContent, getNextActionIndex } from "@/lib/stageAwareContent";

/**
 * Follow-up tools for the current stage/week — shows the *remaining*
 * suggestions after the "Next action" already surfaced in the tip strip.
 * Eliminates duplication and gives the user an ordered "what's next after
 * that" list. Pattern: Flo "Also recommended", Ovia "More for this week".
 */
const FOLLOWUP_LABEL: Record<string, string> = {
  ar: "أيضًا لهذه المرحلة",
  en: "Also for this stage",
  fr: "Aussi pour cette étape",
  es: "También para esta etapa",
  de: "Auch für diese Phase",
  pt: "Também para esta fase",
  tr: "Bu aşama için ayrıca",
};

const StageToolsFollowUp = memo(function StageToolsFollowUp() {
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

  // Remaining tools — preserve original order, drop the one already shown.
  const rest = content.tools.filter((_, i) => i !== nextIdx);
  if (rest.length === 0) return null;

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const heading = FOLLOWUP_LABEL[lng] || FOLLOWUP_LABEL.en;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={heading}
      className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm px-3.5 py-3"
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-foreground/70">
          {heading}
        </h3>
        <span className="text-[10px] font-bold text-foreground/50">
          {content.contextLabel}
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rest.map((t, i) => (
          <li key={t.href}>
            <Link
              to={t.href}
              className="group flex items-center gap-2.5 rounded-xl border border-transparent bg-background/50 hover:bg-background hover:border-[hsl(340,40%,90%)] hover:shadow-[0_4px_14px_-8px_hsl(340_40%_50%/0.3)] transition-all px-2.5 py-2 active:scale-[0.99]"
            >
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[14px]"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(340 55% 95%), hsl(20 55% 96%))",
                }}
              >
                {t.emoji}
              </span>
              <span className="flex-1 min-w-0 truncate text-[12.5px] font-bold text-foreground/85">
                {contentLang === "ar" ? t.titleAr : t.titleEn}
              </span>
              <span
                aria-hidden
                className="text-[9px] font-extrabold tabular-nums text-foreground/40"
              >
                {String(i + 2).padStart(2, "0")}
              </span>
              <ChevronIcon
                className="h-3.5 w-3.5 text-foreground/40 group-hover:text-[hsl(340,60%,50%)] transition-colors"
                strokeWidth={2.5}
              />
            </Link>
          </li>
        ))}
      </ul>
    </motion.section>
  );
});

export default StageToolsFollowUp;

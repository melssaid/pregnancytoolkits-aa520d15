import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getStageContent } from "@/lib/stageAwareContent";

/**
 * Home suggestion card — adapts daily tip + 4 tools to the user's
 * journey stage (fertility / pregnant / postpartum) and current week.
 *
 * Renders nothing if no journey stage is set yet (onboarding not completed).
 */
const StageAwareSuggestionsCard = memo(function StageAwareSuggestionsCard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const lang = isRTL ? "ar" : "en";
  const { profile } = useUserProfile();

  const stage = profile.journeyStage;
  if (!stage) return null;

  const week = profile.pregnancyWeek || 0;
  const content = getStageContent(stage, week, lang);
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl overflow-hidden border border-border/40 bg-card p-4 sm:p-5"
      style={{
        boxShadow:
          "0 1px 0 0 hsl(0 0% 100% / 0.6) inset, 0 8px 24px -12px hsl(340 50% 35% / 0.20)",
      }}
      aria-label={isRTL ? "مقترحات مخصصة لكِ" : "Personalized suggestions"}
    >
      {/* Soft cream-rose backdrop — harmonizes with snapshot card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(340 55% 96%) 0%, hsl(35 60% 97%) 60%, hsl(40 70% 98%) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dark:opacity-100 opacity-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(340 30% 18%) 0%, hsl(340 22% 14%) 60%, hsl(35 18% 12%) 100%)",
        }}
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles
              className="w-3.5 h-3.5 text-[hsl(340,60%,52%)] dark:text-[hsl(340,55%,68%)]"
              strokeWidth={2.4}
            />
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[hsl(340,55%,38%)] dark:text-[hsl(340,45%,72%)]">
              {isRTL ? "مقترح لكِ" : "For you"}
            </span>
          </div>
          <span className="text-[11px] font-bold text-foreground/65">
            {content.contextLabel}
          </span>
        </div>

        {/* Tip */}
        <p
          className="text-[13.5px] font-semibold leading-relaxed text-foreground/90 mb-3"
          style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
        >
          {content.tip}
        </p>

        {/* Tools strip */}
        <div className="grid grid-cols-2 gap-1.5">
          {content.tools.slice(0, 4).map((tool) => (
            <Link
              key={tool.href}
              to={tool.href}
              className="group flex items-center gap-2 px-2.5 py-2 rounded-xl bg-card/80 dark:bg-white/[0.05] border border-border/50 hover:border-primary/40 active:scale-[0.97] transition-all min-w-0"
            >
              <span className="text-base shrink-0" aria-hidden="true">
                {tool.emoji}
              </span>
              <span
                className="flex-1 text-[11.5px] font-bold text-foreground/85 leading-tight truncate"
                style={{ overflowWrap: "anywhere" }}
              >
                {lang === "ar" ? tool.titleAr : tool.titleEn}
              </span>
              <ChevronIcon
                className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0"
                strokeWidth={2.2}
              />
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
});

export default StageAwareSuggestionsCard;

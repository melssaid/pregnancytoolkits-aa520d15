/**
 * DayCompletionState — Quiet "you're done for today" panel.
 *
 * Self-Determination Theory: acknowledging Competence (not awarding
 * points) increases intrinsic motivation. No badges, no streaks.
 */
import { memo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

export const DayCompletionState = memo(function DayCompletionState() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl border border-primary/15
                 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.05]
                 px-4 py-3.5 flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0
                      bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/20">
        <Check className="w-4 h-4 text-primary" strokeWidth={3} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-extrabold text-foreground leading-tight">
          {t("dayCompletion.title", "تمّت مهام اليوم")}
        </p>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          {t("dayCompletion.subtitle", "ارتاحي الآن — نراكِ غدًا")}
        </p>
      </div>
    </motion.div>
  );
});

export default DayCompletionState;

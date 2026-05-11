import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion } from "framer-motion";

const TRIMESTER_NUTRIENTS: Record<number, string[]> = {
  1: ["folicAcid", "iron", "vitaminB6", "ginger"],
  2: ["calcium", "omega3", "vitaminD", "protein"],
  3: ["iron", "fiber", "magnesium", "vitaminK"],
};

export function NutritionTipCard() {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const week = profile.pregnancyWeek;
  const trimester = week <= 12 ? 1 : week <= 26 ? 2 : 3;

  const nutrients = TRIMESTER_NUTRIENTS[trimester] || TRIMESTER_NUTRIENTS[2];
  // Rotate daily
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayNutrient = nutrients[dayOfYear % nutrients.length];

  return (
    <Card className="p-4 bg-card border-border/50">
      <div className="mb-2">
        <h3 className="text-base font-bold text-foreground">{t("nutritionTip.title")}</h3>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[hsl(var(--success-soft))]/100 rounded-xl p-3"
      >
        <p className="text-xs font-bold text-foreground mb-1">
          {t(`nutritionTip.nutrients.${todayNutrient}.name`)}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t(`nutritionTip.nutrients.${todayNutrient}.benefit`)}
        </p>
        <p className="text-[10px] text-done dark:text-done mt-1.5 font-semibold">
          💡 {t(`nutritionTip.nutrients.${todayNutrient}.source`)}
        </p>
      </motion.div>
    </Card>
  );
}

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";

const BABY_SIZE_DATA: Record<number, { emoji: string; weightG: number; lengthCm: number }> = {
  4: { emoji: "🌰", weightG: 1, lengthCm: 0.1 },
  5: { emoji: "🫘", weightG: 1, lengthCm: 0.2 },
  6: { emoji: "🫐", weightG: 1, lengthCm: 0.4 },
  7: { emoji: "🫐", weightG: 1, lengthCm: 1 },
  8: { emoji: "🍇", weightG: 1, lengthCm: 1.6 },
  9: { emoji: "🫒", weightG: 2, lengthCm: 2.3 },
  10: { emoji: "🍊", weightG: 4, lengthCm: 3.1 },
  11: { emoji: "🍋", weightG: 7, lengthCm: 4.1 },
  12: { emoji: "🍑", weightG: 14, lengthCm: 5.4 },
  13: { emoji: "🍋", weightG: 23, lengthCm: 7.4 },
  14: { emoji: "🍋", weightG: 43, lengthCm: 8.7 },
  15: { emoji: "🍎", weightG: 70, lengthCm: 10 },
  16: { emoji: "🥑", weightG: 100, lengthCm: 11.6 },
  17: { emoji: "🥕", weightG: 140, lengthCm: 13 },
  18: { emoji: "🫑", weightG: 190, lengthCm: 14.2 },
  19: { emoji: "🥭", weightG: 240, lengthCm: 15.3 },
  20: { emoji: "🍌", weightG: 300, lengthCm: 16.4 },
  21: { emoji: "🥥", weightG: 360, lengthCm: 26.7 },
  22: { emoji: "🌽", weightG: 430, lengthCm: 27.8 },
  23: { emoji: "🍆", weightG: 501, lengthCm: 28.9 },
  24: { emoji: "🌽", weightG: 600, lengthCm: 30 },
  25: { emoji: "🥦", weightG: 660, lengthCm: 34.6 },
  26: { emoji: "🥬", weightG: 760, lengthCm: 35.6 },
  27: { emoji: "🥬", weightG: 875, lengthCm: 36.6 },
  28: { emoji: "🍆", weightG: 1005, lengthCm: 37.6 },
  29: { emoji: "🎃", weightG: 1153, lengthCm: 38.6 },
  30: { emoji: "🥥", weightG: 1319, lengthCm: 39.9 },
  31: { emoji: "🥥", weightG: 1502, lengthCm: 41.1 },
  32: { emoji: "🍍", weightG: 1702, lengthCm: 42.4 },
  33: { emoji: "🍍", weightG: 1918, lengthCm: 43.7 },
  34: { emoji: "🍈", weightG: 2146, lengthCm: 45 },
  35: { emoji: "🍈", weightG: 2383, lengthCm: 46.2 },
  36: { emoji: "🍉", weightG: 2622, lengthCm: 47.4 },
  37: { emoji: "🍉", weightG: 2859, lengthCm: 48.6 },
  38: { emoji: "🍉", weightG: 3083, lengthCm: 49.8 },
  39: { emoji: "🍉", weightG: 3288, lengthCm: 50.7 },
  40: { emoji: "🎃", weightG: 3462, lengthCm: 51.2 },
  41: { emoji: "🎃", weightG: 3597, lengthCm: 51.7 },
  42: { emoji: "🎃", weightG: 3685, lengthCm: 51.7 },
};

export function BabySizeCard() {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const week = profile.pregnancyWeek;

  // Hide the card unless the user has set their actual pregnancy week.
  // No synthetic fallback to week 20.
  if (!week || week < 4) return null;
  const data = BABY_SIZE_DATA[week];
  if (!data) return null;
  const prevData = BABY_SIZE_DATA[Math.max(4, week - 1)];

  return (
    <Card className="p-5 bg-card border-border/40 rounded-3xl shadow-lg shadow-primary/5 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-extrabold text-foreground tracking-tight">{t("babySize.title")}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          {t("babySize.weekLabel", { week })}
        </span>
      </div>
      <div className="flex items-center gap-5">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="text-6xl flex-shrink-0"
        >
          {data.emoji}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/40 bg-background/60 px-3 py-2.5 min-w-0">
              <p className="text-2xl font-black text-foreground tabular-nums leading-tight whitespace-nowrap">
                {data.weightG >= 1000 ? `${(data.weightG / 1000).toFixed(1)}` : data.weightG}
                <span className="text-sm font-bold text-muted-foreground ms-1">{data.weightG >= 1000 ? "kg" : "g"}</span>
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-1 truncate">{t("babySize.weight")}</p>
            </div>
            <div className="rounded-2xl border border-border/40 bg-background/60 px-3 py-2.5 min-w-0">
              <p className="text-2xl font-black text-foreground tabular-nums leading-tight whitespace-nowrap">
                {data.lengthCm}<span className="text-sm font-bold text-muted-foreground ms-1">cm</span>
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-1 truncate">{t("babySize.length")}</p>
            </div>
          </div>
          {prevData && data.weightG > prevData.weightG && (
            <p className="text-[11px] text-done dark:text-done font-semibold mt-2 break-words">
              +{data.weightG - prevData.weightG}g {t("babySize.sinceLastWeek")}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

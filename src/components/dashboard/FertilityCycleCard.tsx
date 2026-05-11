import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CalendarHeart, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { safeParseLocalStorage } from "@/lib/safeStorage";

interface CycleData {
  lastPeriodStart?: string;
  cycleLength?: number;
  periodLength?: number;
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Fertility-stage hero card on the dashboard.
 * Computes today's cycle day, current phase, and next predicted period
 * from local cycle-tracker data. Falls back to a setup CTA if no data.
 */
export const FertilityCycleCard = memo(function FertilityCycleCard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  const data = safeParseLocalStorage<CycleData>(
    "cycle-tracker-data",
    {},
    (d): d is CycleData => typeof d === "object" && d !== null
  );

  const computed = useMemo(() => {
    if (!data.lastPeriodStart) return null;
    const start = new Date(data.lastPeriodStart);
    if (isNaN(start.getTime())) return null;
    const cycleLen = data.cycleLength || 28;
    const periodLen = data.periodLength || 5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diff = daysBetween(start, today);
    const cycleDay = ((diff % cycleLen) + cycleLen) % cycleLen + 1;
    const ovulationDay = cycleLen - 14;
    const fertileStart = ovulationDay - 5;
    const fertileEnd = ovulationDay + 1;

    let phaseKey: "menstrual" | "follicular" | "fertile" | "luteal" = "luteal";
    if (cycleDay <= periodLen) phaseKey = "menstrual";
    else if (cycleDay >= fertileStart && cycleDay <= fertileEnd) phaseKey = "fertile";
    else if (cycleDay < fertileStart) phaseKey = "follicular";

    const daysUntilNext = cycleLen - cycleDay + 1;
    return { cycleDay, phaseKey, daysUntilNext, cycleLen };
  }, [data]);

  if (!computed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link to="/tools/cycle-tracker" className="block">
          <Card className="relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-fuchsia-500/10 p-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 text-pink-600 dark:text-pink-400 ring-1 ring-border/40">
                <CalendarHeart className="h-6 w-6" strokeWidth={1.85} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-foreground">
                  {t("dashboardV2.fertilityCard.setupTitle", "تتبع الدورة")}
                </h3>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  {t("dashboardV2.fertilityCard.setupDesc", "ابدئي إعداد دورتكِ لتلقي توقعات يومية")}
                </p>
              </div>
              <Chevron className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  const phaseLabel = t(`dashboardV2.fertilityCard.phase.${computed.phaseKey}`,
    { defaultValue: computed.phaseKey });
  const phaseTone =
    computed.phaseKey === "fertile"
      ? "from-emerald-500/15 via-teal-500/8 to-emerald-500/15 text-done dark:text-done"
      : computed.phaseKey === "menstrual"
      ? "from-rose-500/15 via-pink-500/8 to-rose-500/15 text-rose-700 dark:text-rose-300"
      : computed.phaseKey === "follicular"
      ? "from-amber-500/12 via-yellow-500/6 to-amber-500/12 text-amber-700 dark:text-amber-300"
      : "from-violet-500/12 via-purple-500/6 to-violet-500/12 text-violet-700 dark:text-violet-300";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to="/tools/cycle-tracker" className="block">
        <Card className={`relative overflow-hidden rounded-2xl border-border/40 bg-gradient-to-br ${phaseTone} p-4 hover:border-primary/40 transition-colors`}>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-background/85 backdrop-blur-sm ring-1 ring-border/40 shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
                {t("dashboardV2.fertilityCard.day", "يوم")}
              </span>
              <span className="text-2xl font-extrabold text-foreground tabular-nums leading-none mt-0.5">
                {computed.cycleDay}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 opacity-80" />
                <span className="text-[13px] font-bold">
                  {phaseLabel}
                </span>
              </div>
              <p className="text-[12.5px] text-foreground/80 mt-1 leading-snug">
                {t("dashboardV2.fertilityCard.nextPeriod", { count: computed.daysUntilNext, defaultValue: `الدورة القادمة بعد ${computed.daysUntilNext} يوم` })}
              </p>
            </div>
            <Chevron className="h-4 w-4 text-foreground/50 flex-shrink-0" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
});

export default FertilityCycleCard;

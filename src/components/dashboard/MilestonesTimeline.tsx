import { motion } from "framer-motion";
import { Heart, Baby, Eye, Target, Star, Footprints, ArrowDown, Gift, Stethoscope, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useOptimizedMotion } from "@/hooks/useOptimizedMotion";

interface Milestone {
  week: number;
  key: string;
  icon: React.ReactNode;
  color: string;
}

const MILESTONES: Milestone[] = [
  { week: 6, key: "heartbeat", icon: <Heart className="w-4 h-4" />, color: "text-red-400 bg-red-500/10" },
  { week: 12, key: "firstTrimesterEnd", icon: <Star className="w-4 h-4" />, color: "text-yellow-500 bg-yellow-500/10" },
  { week: 16, key: "feelMovement", icon: <Footprints className="w-4 h-4" />, color: "text-purple-400 bg-purple-500/10" },
  { week: 20, key: "halfwayThere", icon: <Target className="w-4 h-4" />, color: "text-blue-500 bg-blue-500/10" },
  { week: 24, key: "viability", icon: <Star className="w-4 h-4" />, color: "text-green-500 bg-green-500/10" },
  { week: 28, key: "thirdTrimester", icon: <Stethoscope className="w-4 h-4" />, color: "text-orange-400 bg-orange-500/10" },
  { week: 32, key: "babyPosition", icon: <Baby className="w-4 h-4" />, color: "text-pink-400 bg-pink-500/10" },
  { week: 36, key: "fullTerm", icon: <Gift className="w-4 h-4" />, color: "text-emerald-500 bg-emerald-500/10" },
  { week: 40, key: "dueDate", icon: <Baby className="w-4 h-4" />, color: "text-primary bg-primary/10" },
];

export function MilestonesTimeline() {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const currentWeek = profile.pregnancyWeek;
  const mo = useOptimizedMotion();

  // Show 2 past + current zone + 2 future
  const currentIdx = MILESTONES.findIndex(m => m.week > currentWeek);
  const activeIdx = currentIdx === -1 ? MILESTONES.length : currentIdx;
  const startIdx = Math.max(0, activeIdx - 2);
  const visible = MILESTONES.slice(startIdx, startIdx + 5);

  return (
    <Card className="p-4 bg-card border-border/50">
      <h3 className="text-base font-bold text-foreground mb-4">{t("milestones.title")}</h3>
      <div className="space-y-0">
        {visible.map((m, i) => {
          const passed = currentWeek >= m.week;
          const isCurrent = currentWeek >= m.week && (i === visible.length - 1 || currentWeek < visible[i + 1]?.week);
          const isLast = i === visible.length - 1;
          const weeksUntil = m.week - currentWeek;
          const colorClasses = m.color.split(" ");
          const textColor = colorClasses[0];
          const bgColor = colorClasses[1];

          return (
            <div key={m.key}>
              <motion.div
                {...mo.slideIn(i)}
                style={{ willChange: mo.disabled ? "auto" : "transform, opacity" }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  isCurrent ? "bg-primary/5 ring-1 ring-primary/20" : ""
                }`}
              >
                {/* Icon circle */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  passed ? bgColor : "bg-muted/30"
                }`}>
                  <span className={passed ? textColor : "text-muted-foreground/40"}>
                    {m.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${passed ? "text-foreground" : "text-muted-foreground/60"}`}>
                    {t(`milestones.${m.key}`)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("milestones.week", { week: m.week })}
                    {isCurrent && <span className="text-primary font-bold ms-1">← {t("milestones.now")}</span>}
                  </p>
                </div>

                {/* Time badge */}
                <div className="flex-shrink-0">
                  {passed ? (
                    <span className="text-[9px] font-bold badge-done-soft px-2 py-0.5 rounded-full">✓</span>
                  ) : (
                    <span className="text-[9px] font-semibold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                      {weeksUntil > 0 ? t("milestones.weeksLeft", { count: weeksUntil }) : ""}
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Arrow connector */}
              {!isLast && (
                <div className="flex justify-start ps-[22px] py-0.5">
                  <ChevronDown className={`w-3.5 h-3.5 ${
                    passed ? "text-primary/40" : "text-muted-foreground/20"
                  }`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

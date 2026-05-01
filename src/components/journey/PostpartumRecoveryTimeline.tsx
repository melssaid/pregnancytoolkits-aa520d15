/**
 * PostpartumRecoveryTimeline — A serene, formal 0-52 week timeline
 * surfaced on the Today tab when the user is in the postpartum stage.
 *
 * Design intent:
 *   • Five phases, each with a brief, non-clinical reminder of what
 *     the body and mind typically attend to during that window.
 *   • Past phases are quiet (✓), the current phase is highlighted, and
 *     future phases are dim previews.
 *   • Strictly wellness-tone — never gamified, never medical advice.
 */
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { BedDouble, HeartPulse, Activity, Dumbbell, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = {
  key: string;
  startWeek: number;
  endWeek: number;
  icon: typeof BedDouble;
};

const PHASES: Phase[] = [
  { key: "rest",      startWeek: 0,  endWeek: 6,  icon: BedDouble },
  { key: "healing",   startWeek: 6,  endWeek: 12, icon: HeartPulse },
  { key: "rhythm",    startWeek: 12, endWeek: 24, icon: Activity },
  { key: "strength",  startWeek: 24, endWeek: 40, icon: Dumbbell },
  { key: "longTerm",  startWeek: 40, endWeek: 52, icon: Compass },
];

/** Resolve current postpartum week from `journeyHistory.postpartum.birthDate`
 *  if available, else from `journeyHistory.postpartum.startedAt`, else 0. */
function resolvePostpartumWeek(
  birthDate?: string | null,
  startedAt?: string | null,
): number {
  const ref = birthDate ?? startedAt;
  if (!ref) return 0;
  const ms = Date.now() - new Date(ref).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24 * 7)));
}

export const PostpartumRecoveryTimeline = memo(function PostpartumRecoveryTimeline() {
  const { t } = useTranslation();
  const { profile } = useUserProfile();

  const week = useMemo(
    () =>
      resolvePostpartumWeek(
        profile.journeyHistory?.postpartum?.birthDate,
        profile.journeyHistory?.postpartum?.startedAt,
      ),
    [profile.journeyHistory?.postpartum?.birthDate, profile.journeyHistory?.postpartum?.startedAt],
  );

  const currentIdx = PHASES.findIndex((p) => week >= p.startWeek && week < p.endWeek);
  const activeIdx = currentIdx === -1 ? PHASES.length - 1 : currentIdx;

  return (
    <Card className="p-4 rounded-2xl border-border/60 bg-gradient-to-br from-card via-card to-[hsl(290,30%,98%)]">
      <header className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-foreground">
          {t("journey.recovery.title", "Recovery timeline")}
        </h3>
        <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
          {t("journey.recovery.weekLabel", { count: week, defaultValue: "Week {{count}}" })}
        </span>
      </header>

      <ol className="space-y-2" role="list">
        {PHASES.map((phase, i) => {
          const Icon = phase.icon;
          const isPast = i < activeIdx;
          const isActive = i === activeIdx;

          return (
            <motion.li
              key={phase.key}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors",
                isActive && "bg-primary/5 ring-1 ring-primary/20",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                  isActive && "bg-[hsl(290,40%,90%)] text-[hsl(290,50%,40%)]",
                  isPast && "bg-emerald-500/10 text-emerald-600",
                  !isActive && !isPast && "bg-muted/40 text-muted-foreground/50",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-bold truncate",
                  isActive ? "text-foreground" : isPast ? "text-foreground/80" : "text-muted-foreground/70",
                )}>
                  {t(`journey.recovery.phases.${phase.key}.title`)}
                  <span className="sr-only">
                    {" — "}
                    {isActive
                      ? t("journey.recovery.status.current", "current phase")
                      : isPast
                        ? t("journey.recovery.status.completed", "completed")
                        : t("journey.recovery.status.upcoming", "upcoming")}
                  </span>
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {t("journey.recovery.weekRange", {
                    from: phase.startWeek, to: phase.endWeek,
                    defaultValue: "Week {{from}}–{{to}}",
                  })}
                  {" · "}
                  {t(`journey.recovery.phases.${phase.key}.note`)}
                </p>
              </div>
              {isPast && (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full" aria-hidden>
                  ✓
                </span>
              )}
            </motion.li>
          );
        })}
      </ol>
    </Card>
  );
});

export default PostpartumRecoveryTimeline;

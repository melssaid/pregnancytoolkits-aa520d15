import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, Circle, Droplets, Hand, Dumbbell, Utensils, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import type { SavedAIResult } from "@/hooks/useSavedResults";

interface DailyPrioritiesProps {
  vitaminsTaken: number;
  todayKicks: number;
  waterGlasses: number;
  upcomingAppointments: number;
}

interface PriorityItem {
  id: string;
  labelKey: string;
  done: boolean;
  icon: React.ElementType;
  href: string;
  detail?: string;
}

function hasSavedToday(toolId: string): boolean {
  const all = safeParseLocalStorage<SavedAIResult[]>('ai-saved-results', [], (d): d is SavedAIResult[] => Array.isArray(d));
  const today = new Date().toDateString();
  return all.some(r => r.toolId === toolId && new Date(r.savedAt).toDateString() === today);
}

export const DailyPriorities = memo(function DailyPriorities({
  vitaminsTaken, todayKicks, waterGlasses, upcomingAppointments,
}: DailyPrioritiesProps) {
  const { t } = useTranslation();

  const mealDoneToday = useMemo(() => hasSavedToday('ai-meal-suggestion'), []);
  const fitnessDoneToday = useMemo(() => hasSavedToday('ai-fitness-coach'), []);

  // Ordered by maternal priority: vitamins (folic acid) → hydration → nutrition → movement → fitness
  const items: PriorityItem[] = useMemo(() => [
    {
      id: "vitamins",
      labelKey: "dailyDashboard.priorities.vitamins",
      done: vitaminsTaken >= 1,
      icon: Pill,
      href: "/tools/vitamin-tracker",
      detail: vitaminsTaken > 0 ? `✓` : undefined,
    },
    {
      id: "water",
      labelKey: "dailyDashboard.priorities.water",
      done: waterGlasses >= 8,
      icon: Droplets,
      href: "#hydration-tracker",
      detail: `${waterGlasses}/8`,
    },
    {
      id: "meals",
      labelKey: "dailyDashboard.priorities.meals",
      done: mealDoneToday,
      icon: Utensils,
      href: "/tools/ai-meal-suggestion",
    },
    {
      id: "kicks",
      labelKey: "dailyDashboard.priorities.kicks",
      done: todayKicks >= 10,
      icon: Hand,
      href: "/tools/kick-counter",
      detail: todayKicks > 0 ? `${todayKicks}` : undefined,
    },
    {
      id: "fitness",
      labelKey: "dailyDashboard.priorities.fitness",
      done: fitnessDoneToday,
      icon: Dumbbell,
      href: "/tools/ai-fitness-coach",
    },
  ], [vitaminsTaken, todayKicks, waterGlasses, mealDoneToday, fitnessDoneToday]);

  const completedCount = items.filter(i => i.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl border border-border/40 bg-card p-5 shadow-lg shadow-primary/5"
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-lg font-extrabold text-foreground tracking-tight leading-tight">{t("dailyDashboard.priorities.title")}</h3>
        <span
          className="text-sm font-bold tabular-nums text-primary-foreground bg-primary px-3 py-1 rounded-full flex-shrink-0"
          aria-label={`${completedCount}/${items.length}`}
        >
          {completedCount}/{items.length}
        </span>
      </div>

      <ul className="space-y-2.5" role="list">
        {items.map((item, i) => {
          const isAnchor = item.href.startsWith("#");
          const handleClick = (e: React.MouseEvent) => {
            if (isAnchor) {
              e.preventDefault();
              const el = document.getElementById(item.href.slice(1));
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          };
          const stateLabel = item.done
            ? t("common.done", "Done")
            : t("common.notDone", "Not done");
          return (
            <li key={item.id}>
              <Link
                to={isAnchor ? "#" : item.href}
                onClick={handleClick}
                aria-label={`${t(item.labelKey)} — ${stateLabel}${item.detail ? ` (${item.detail})` : ""}`}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-colors min-w-0 border ${
                    item.done
                      ? "bg-primary/12 border-primary/30"
                      : "bg-muted/40 border-border/60 hover:bg-muted/60"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.done
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border-2 border-border"
                    }`}
                  >
                    {item.done ? (
                      <Check className="w-[22px] h-[22px]" strokeWidth={3} />
                    ) : (
                      <item.icon className="w-[22px] h-[22px] text-foreground" strokeWidth={2} />
                    )}
                  </div>
                  <span
                    className={`text-[15px] font-bold flex-1 min-w-0 leading-snug whitespace-normal break-words ${
                      item.done ? "text-primary" : "text-foreground"
                    }`}
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {t(item.labelKey)}
                  </span>
                  <span className="sr-only">{stateLabel}</span>
                  {item.detail && (
                    <span
                      aria-hidden="true"
                      className={`text-[13px] font-bold tabular-nums px-2.5 py-1 rounded-full flex-shrink-0 border ${
                        item.done
                          ? "text-primary-foreground bg-primary border-primary"
                          : "text-foreground bg-background border-border"
                      }`}
                    >
                      {item.detail}
                    </span>
                  )}
                </motion.div>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
});

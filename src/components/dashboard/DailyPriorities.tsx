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
        <span className="text-xs font-bold tabular-nums text-primary bg-primary/10 px-3 py-1 rounded-full flex-shrink-0">
          {completedCount}/{items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => {
          const isAnchor = item.href.startsWith("#");
          const handleClick = (e: React.MouseEvent) => {
            if (isAnchor) {
              e.preventDefault();
              const el = document.getElementById(item.href.slice(1));
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          };
          return (
            <Link key={item.id} to={isAnchor ? "#" : item.href} onClick={handleClick} className="block">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * i }}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-colors min-w-0 ${
                  item.done ? "bg-primary/8" : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.done ? "bg-primary/15" : "bg-background/80 border border-border/40"
                }`}>
                  {item.done ? (
                    <Check className="w-[18px] h-[18px] text-primary" strokeWidth={2.5} />
                  ) : (
                    <item.icon className="w-[18px] h-[18px] text-foreground/70" strokeWidth={1.85} />
                  )}
                </div>
                <span className={`text-[14px] font-bold flex-1 min-w-0 leading-snug whitespace-normal break-words ${item.done ? "text-primary" : "text-foreground"}`} style={{ overflowWrap: "anywhere" }}>
                  {t(item.labelKey)}
                </span>
                {item.detail && (
                  <span className={`text-[11px] font-bold tabular-nums px-2.5 py-1 rounded-full flex-shrink-0 ${
                    item.done ? "text-primary bg-primary/12" : "text-foreground/75 bg-muted"
                  }`}>
                    {item.detail}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
});

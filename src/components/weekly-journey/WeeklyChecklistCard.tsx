import { memo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { safeParseLocalStorage, safeSaveToLocalStorage } from "@/lib/safeStorage";

interface Props {
  week: number;
}

const STORAGE_PREFIX = "weekly-checklist-";

export const WeeklyChecklistCard = memo(function WeeklyChecklistCard({ week }: Props) {
  const { t } = useTranslation();

  const items: string[] = [];
  for (let i = 0; i < 6; i++) {
    const key = `weeklyJourney.weeks.w${week}.checklist.${i}`;
    const val = t(key, { defaultValue: "" });
    if (val && val !== key) items.push(val);
  }

  const [checked, setChecked] = useState<boolean[]>(() => {
    const saved = safeParseLocalStorage<boolean[]>(`${STORAGE_PREFIX}${week}`, []);
    return items.map((_, i) => saved[i] || false);
  });

  useEffect(() => {
    const saved = safeParseLocalStorage<boolean[]>(`${STORAGE_PREFIX}${week}`, []);
    setChecked(items.map((_, i) => saved[i] || false));
   
  }, [week]);

  const toggle = useCallback((index: number) => {
    setChecked(prev => {
      const next = [...prev];
      next[index] = !next[index];
      safeSaveToLocalStorage(`${STORAGE_PREFIX}${week}`, next);
      return next;
    });
  }, [week]);

  if (items.length === 0) return null;

  const completedCount = checked.filter(Boolean).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <Card className="card-achievement border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl badge-done flex items-center justify-center">
                <ListChecks className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{t("weeklyJourney.sections.checklist")}</h3>
            </div>
            <span className="text-[10px] font-bold text-done tabular-nums">
              {completedCount}/{items.length}
            </span>
          </div>

          <Progress value={progress} className="h-1.5 mb-3" />

          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Checkbox
                  checked={checked[i]}
                  onCheckedChange={() => toggle(i)}
                  className="border-[hsl(var(--success-ring))] data-[state=checked]:bg-[hsl(var(--success))] data-[state=checked]:border-[hsl(var(--success))]"
                />
                <span className={`text-xs leading-relaxed transition-all ${checked[i] ? 'line-through text-muted-foreground/50' : 'text-muted-foreground'}`}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
});

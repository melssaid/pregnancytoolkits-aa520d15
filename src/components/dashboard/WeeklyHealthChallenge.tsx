import { memo, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Footprints, Dumbbell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Challenge {
  id: string;
  icon: typeof Droplets;
  titleKey: string;
  target: number;
  unit: string;
}

const CHALLENGES: Challenge[] = [
  { id: 'water', icon: Droplets, titleKey: 'challenge.water', target: 8, unit: 'challenge.glasses' },
  { id: 'walk', icon: Footprints, titleKey: 'challenge.walk', target: 15, unit: 'challenge.minutes' },
  { id: 'exercise', icon: Dumbbell, titleKey: 'challenge.exercise', target: 1, unit: 'challenge.session' },
];

function getWeeklyChallenge(): Challenge {
  const weekOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (86400000 * 7));
  return CHALLENGES[weekOfYear % CHALLENGES.length];
}

export const WeeklyHealthChallenge = memo(function WeeklyHealthChallenge() {
  const { t } = useTranslation();
  const challenge = useMemo(() => getWeeklyChallenge(), []);

  const storageKey = `pt_challenge_${challenge.id}_${new Date().toDateString()}`;
  const [progress, setProgress] = useState(() => {
    try { return parseInt(localStorage.getItem(storageKey) || '0', 10); } catch { return 0; }
  });

  const increment = useCallback(() => {
    setProgress(prev => {
      const next = Math.min(prev + 1, challenge.target);
      try { localStorage.setItem(storageKey, String(next)); } catch {}
      return next;
    });
  }, [storageKey, challenge.target]);

  const pct = Math.round((progress / challenge.target) * 100);
  const done = progress >= challenge.target;
  const Icon = challenge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-gradient-to-r from-primary/[0.04] to-transparent border border-border/20 p-3"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${done ? 'bg-[hsl(var(--success-soft))]/100' : 'bg-primary/10'}`}>
          {done ? <Check className="w-4 h-4 text-done" /> : <Icon className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              {t('challenge.daily', { defaultValue: 'تحدي اليوم' })}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
              {progress}/{challenge.target}
            </span>
          </div>
          <p className="text-sm font-extrabold text-foreground mt-0.5">
            {t(challenge.titleKey, { target: challenge.target, defaultValue: challenge.id })}
          </p>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${done ? 'gradient-success' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        {!done && (
          <button
            onClick={increment}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold hover:opacity-90 transition-opacity"
          >
            +1
          </button>
        )}
      </div>
    </motion.div>
  );
});

import { useState, useEffect } from "react";
import { Target, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion } from "framer-motion";
import { safeSaveToLocalStorage, safeParseLocalStorage } from "@/lib/safeStorage";

interface Challenge {
  key: string;
  emoji: string;
}

const CHALLENGES: Challenge[] = [
  { key: "walk15min", emoji: "🚶‍♀️" },
  { key: "drink8glasses", emoji: "💧" },
  { key: "breathing5min", emoji: "🧘‍♀️" },
  { key: "eatFruit", emoji: "🍎" },
  { key: "stretchMorning", emoji: "🤸‍♀️" },
  { key: "kegelExercise", emoji: "💪" },
  { key: "readBabyBook", emoji: "📖" },
  { key: "sleepEarly", emoji: "😴" },
  { key: "prenatalVitamin", emoji: "💊" },
  { key: "warmBath", emoji: "🛁" },
  { key: "journaling", emoji: "📝" },
  { key: "noScreen30min", emoji: "📵" },
];

const STORAGE_KEY = "daily_health_challenge_v1";

export function DailyHealthChallengeCard() {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const today = new Date().toISOString().split("T")[0];

  const [completedToday, setCompletedToday] = useState<string[]>(() => {
    const saved = safeParseLocalStorage<{ date: string; completed: string[] }>(STORAGE_KEY, { date: "", completed: [] });
    return saved.date === today ? saved.completed : [];
  });

  // Pick 3 daily challenges (deterministic by date)
  const dayIndex = Math.floor(Date.now() / 86400000);
  const todayChallenges = [
    CHALLENGES[dayIndex % CHALLENGES.length],
    CHALLENGES[(dayIndex + 3) % CHALLENGES.length],
    CHALLENGES[(dayIndex + 7) % CHALLENGES.length],
  ];

  const toggleChallenge = (key: string) => {
    setCompletedToday(prev => {
      const updated = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      safeSaveToLocalStorage(STORAGE_KEY, { date: today, completed: updated });
      return updated;
    });
  };

  const completedCount = todayChallenges.filter(c => completedToday.includes(c.key)).length;

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.05] border-primary/15">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground">{t("dailyChallenge.title")}</h3>
        </div>
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{completedCount}/3</span>
      </div>
      <div className="space-y-2">
        {todayChallenges.map((c, i) => {
          const done = completedToday.includes(c.key);
          return (
            <motion.button
              key={c.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => toggleChallenge(c.key)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors ${
                done ? "bg-[hsl(var(--success-soft))]/100" : "bg-muted/30"
              }`}
            >
              <span className="text-base">{c.emoji}</span>
              <span className={`text-xs flex-1 ${done ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                {t(`dailyChallenge.challenges.${c.key}`)}
              </span>
              {done && <Check className="w-4 h-4 text-done" />}
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}

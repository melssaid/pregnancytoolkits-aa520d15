import { Layout } from "@/components/Layout";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Trophy, Share2 } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import { useMemo } from "react";
import { openWhatsApp } from "@/lib/whatsappShare";
import { cn } from "@/lib/utils";

interface AchievementData {
  toolsUsed: number;
  daysActive: number;
  kicksLogged: number;
  weightEntries: number;
  waterGlasses: number;
}

function getAchievements(): AchievementData {
  try {
    const keys = Object.keys(localStorage);
    const toolsUsed = keys.filter(k => k.startsWith("tool_visited_")).length;
    const kicks = safeParseLocalStorage<any[]>("kick_sessions", [], Array.isArray);
    const weights = safeParseLocalStorage<any[]>("weight-entries", [], Array.isArray);
    const water = safeParseLocalStorage<number>("hydration_today", 0);
    
    // Count distinct dates of activity
    const activityDates = new Set<string>();
    keys.forEach(k => {
      if (k.includes("_date_") || k.includes("_log_")) {
        const match = k.match(/\d{4}-\d{2}-\d{2}/);
        if (match) activityDates.add(match[0]);
      }
    });

    return {
      toolsUsed,
      daysActive: Math.max(activityDates.size, 1),
      kicksLogged: kicks.length,
      weightEntries: weights.length,
      waterGlasses: typeof water === 'number' ? water : 0,
    };
  } catch {
    return { toolsUsed: 0, daysActive: 1, kicksLogged: 0, weightEntries: 0, waterGlasses: 0 };
  }
}

export default function WeeklyAchievements() {
  const { t, i18n } = useTranslation();
  const { profile } = useUserProfile();
  const isRtl = i18n.language === 'ar';
  const data = useMemo(getAchievements, []);
  const week = profile.pregnancyWeek || 0;

  const stats = [
    { value: data.toolsUsed, label: t('achievements.toolsUsed', 'Tools Used'), color: 'text-pink-500' },
    { value: data.daysActive, label: t('achievements.daysActive', 'Days Active'), color: 'text-violet-500' },
    { value: data.kicksLogged, label: t('achievements.kicksLogged', 'Kick Sessions'), color: 'text-emerald-500' },
    { value: data.weightEntries, label: t('achievements.weightEntries', 'Weight Entries'), color: 'text-amber-500' },
  ];

  const handleShare = () => {
    const msg = `🏆 *${t('achievements.shareTitle', 'My Weekly Achievements!')}*

📊 ${t('achievements.toolsUsed', 'Tools Used')}: *${data.toolsUsed}*
📅 ${t('achievements.daysActive', 'Days Active')}: *${data.daysActive}*
👣 ${t('achievements.kicksLogged', 'Kick Sessions')}: *${data.kicksLogged}*
⚖️ ${t('achievements.weightEntries', 'Weight Entries')}: *${data.weightEntries}*
${week > 0 ? `\n🤰 ${t('achievements.weekProgress', { week, defaultValue: 'Week {{week}} of pregnancy' })}` : ''}

━━━━━━━━━━━━━━━━━━━━
🤰 _Pregnancy Toolkits_`;

    openWhatsApp(msg);
  };

  return (
    <Layout showBack>
      <SEOHead title={t("achievements.seoTitle", "My Achievements")} noindex />
      <div className="container max-w-lg pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl badge-done flex items-center justify-center">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            {t('achievements.title', 'Your Achievements')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('achievements.subtitle', 'Track your wellness journey progress')}
          </p>
        </motion.div>

        {/* Progress ring */}
        {week > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 mx-auto w-fit"
          >
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className="stroke-muted/30" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                  strokeDasharray={`${(week / 42) * 264} 264`}
                  strokeLinecap="round"
                  className="stroke-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{week}</span>
                <span className="text-[9px] text-muted-foreground font-medium">/ 42 {t('achievements.weeks', 'weeks')}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border/50 text-center"
            >
              <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
              <p className="text-[11px] text-foreground/60 font-medium mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Share button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
        >
          <Share2 className="h-4 w-4" />
          {t('achievements.shareWhatsApp', 'Share on WhatsApp')}
        </motion.button>
      </div>
    </Layout>
  );
}

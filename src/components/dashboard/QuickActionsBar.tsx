import { memo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Bot, Hand, Gauge, Heart, Camera, Utensils, Dumbbell, Moon } from "lucide-react";

const actions = [
  { id: "pregnancy-assistant", icon: Bot,          href: "/tools/pregnancy-assistant",  labelKey: "assistant", accent: "from-violet-500/15 to-violet-500/5" },
  { id: "kick-counter",        icon: Hand,         href: "/tools/kick-counter",         labelKey: "kicks",     accent: "from-pink-500/15 to-pink-500/5" },
  { id: "weight-gain",         icon: Gauge,        href: "/tools/weight-gain",          labelKey: "weight",    accent: "from-[hsl(var(--success))]/15 to-[hsl(var(--success))]/5" },
  { id: "ai-meal-suggestion",  icon: Utensils,     href: "/tools/ai-meal-suggestion",   labelKey: "meals",     accent: "from-orange-500/15 to-orange-500/5" },
  { id: "wellness-diary",      icon: Heart,        href: "/tools/wellness-diary",       labelKey: "symptoms",  accent: "from-rose-500/15 to-rose-500/5" },
  { id: "ai-fitness-coach",    icon: Dumbbell,     href: "/tools/ai-fitness-coach",     labelKey: "fitness",   accent: "from-blue-500/15 to-blue-500/5" },
  { id: "pregnancy-comfort",   icon: Moon,         href: "/tools/pregnancy-comfort",    labelKey: "comfort",   accent: "from-indigo-500/15 to-indigo-500/5" },
  { id: "ai-bump-photos",      icon: Camera,       href: "/tools/ai-bump-photos",       labelKey: "photos",    accent: "from-purple-500/15 to-purple-500/5" },
];

export const QuickActionsBar = memo(function QuickActionsBar() {
  const { t } = useTranslation();

  return (
    <motion.nav
      aria-labelledby="quick-actions-heading"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <h3
        id="quick-actions-heading"
        className="text-sm font-extrabold text-foreground mb-2.5 whitespace-normal leading-tight"
      >
        {t("dailyDashboard.quickActions.title")}
      </h3>
      <ul role="list" className="grid grid-cols-4 gap-1.5">
        {actions.map((action, i) => {
          const label = t(`dailyDashboard.quickActions.${action.labelKey}`);
          return (
            <li key={action.id}>
              <Link
                to={action.href}
                aria-label={label}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.025 * i }}
                  whileTap={{ scale: 0.93 }}
                  className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-2xl transition-all duration-200 bg-gradient-to-b ${action.accent} hover:shadow-sm active:shadow-none`}
                >
                  <div className="relative w-9 h-9 rounded-xl bg-background/80 backdrop-blur-sm border border-border/20 flex items-center justify-center shadow-sm">
                    <action.icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.75} />
                  </div>
                  <span className="text-[10px] font-medium text-foreground/80 text-center leading-tight line-clamp-2 whitespace-normal overflow-wrap-anywhere">
                    {label}
                  </span>
                </motion.div>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
});

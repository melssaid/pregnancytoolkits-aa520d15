import { readKickSessions } from "@/lib/kickSessionsStore";
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Bot, Hand, Gauge, Heart, Camera, Utensils, Dumbbell, Moon,
  Pill, Baby, Stethoscope, ShoppingBag, Briefcase, Sparkles,
  ChevronRight, ChevronLeft,
  CalendarHeart, GraduationCap, ClipboardCheck,
  HeartPulse, Brain, MessageCircleHeart, Droplets,
} from "lucide-react";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import { useUserProfile, type JourneyStage } from "@/hooks/useUserProfile";

interface ToolItem {
  id: string;
  href: string;
  icon: any;
  labelKey: string;
  labelAr: string;
  labelEn: string;
  count: number;
  accent: string;
  iconColor: string;
  stages: JourneyStage[];
}

function safeArr(key: string): any[] {
  return safeParseLocalStorage<any[]>(key, [], (d): d is any[] => Array.isArray(d));
}

function getUserId(): string | null {
  try { return localStorage.getItem("pregnancy_user_id"); } catch { return null; }
}

/**
 * Unified, professional tools grid — replaces QuickActionsBar + MyToolsQuickGrid.
 * Active tools (with data) are sorted first with usage count badge.
 * Tools without data appear as suggestions below.
 */
export const UnifiedToolsGrid = memo(function UnifiedToolsGrid() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const { profile } = useUserProfile();
  const stage: JourneyStage = profile.journeyStage || "pregnant";

  const tools = useMemo<ToolItem[]>(() => {
    const uid = getUserId();
    const kicks = readKickSessions().filter((k: any) => k.ended_at);
    const vits = uid ? safeArr(`vitamin_logs_${uid}`) : [];
    const contractions = safeArr("contraction_timer_data");
    const weights = safeArr("weight_gain_entries");
    const diapers = safeArr("diaperEntries");
    const symptoms = safeArr("quick_symptom_logs");
    const wellness = safeArr("wellness-diary-entries");
    const groceries = safeArr("pregnancyGroceryList");
    const bag = safeArr("hospital-bag-items");
    const birthPlans = safeArr("birthPlans");
    const cycles = safeArr("cycle-tracker-data");
    const sleepLogs = safeArr("baby-sleep-logs");
    const cryLogs = safeArr("baby-cry-logs");
    const growthEntries = safeArr("baby-growth-entries");
    const meals = safeArr("ai-saved-results").filter((r: any) => r.toolId === "ai-meal-suggestion");
    const fitness = safeArr("ai-saved-results").filter((r: any) => r.toolId === "ai-fitness-coach");

    return [
      // ── Universal — visible across all stages ────────────────────────────
      { id: "assistant", href: "/tools/pregnancy-assistant", icon: Bot,
        labelKey: "dailyDashboard.quickActions.assistant", labelAr: "المساعدة", labelEn: "Assistant",
        count: 0, accent: "from-violet-500/12 to-violet-500/[0.04]", iconColor: "text-violet-600 dark:text-violet-400",
        stages: ["fertility", "pregnant", "postpartum"] },
      { id: "wellness", href: "/tools/wellness-diary", icon: Heart,
        labelKey: "dailyDashboard.quickActions.symptoms", labelAr: "العافية", labelEn: "Wellness",
        count: symptoms.length + wellness.length, accent: "from-rose-500/12 to-rose-500/[0.04]", iconColor: "text-rose-600 dark:text-rose-400",
        stages: ["fertility", "pregnant", "postpartum"] },
      { id: "vitamins", href: "/tools/vitamin-tracker", icon: Pill,
        labelKey: "dashboard.myTools.vitamins", labelAr: "الفيتامينات", labelEn: "Vitamins",
        count: vits.length, accent: "from-amber-500/12 to-amber-500/[0.04]", iconColor: "text-amber-600 dark:text-amber-400",
        stages: ["fertility", "pregnant", "postpartum"] },
      { id: "meals", href: "/tools/ai-meal-suggestion", icon: Utensils,
        labelKey: "dailyDashboard.quickActions.meals", labelAr: "الوجبات", labelEn: "Meals",
        count: meals.length, accent: "from-orange-500/12 to-orange-500/[0.04]", iconColor: "text-orange-600 dark:text-orange-400",
        stages: ["fertility", "pregnant", "postpartum"] },
      { id: "fitness", href: "/tools/ai-fitness-coach", icon: Dumbbell,
        labelKey: "dailyDashboard.quickActions.fitness", labelAr: "اللياقة", labelEn: "Fitness",
        count: fitness.length, accent: "from-blue-500/12 to-blue-500/[0.04]", iconColor: "text-blue-600 dark:text-blue-400",
        stages: ["fertility", "pregnant", "postpartum"] },

      // ── Fertility / Pre-pregnancy ────────────────────────────────────────
      { id: "cycle", href: "/tools/cycle-tracker", icon: CalendarHeart,
        labelKey: "dashboard.myTools.cycle", labelAr: "الدورة", labelEn: "Cycle",
        count: cycles.length, accent: "from-pink-400/12 to-pink-400/[0.04]", iconColor: "text-pink-500 dark:text-pink-300",
        stages: ["fertility"] },
      { id: "fertilityAcademy", href: "/tools/fertility-academy", icon: GraduationCap,
        labelKey: "dashboard.myTools.fertilityAcademy", labelAr: "أكاديمية الخصوبة", labelEn: "Fertility Academy",
        count: 0, accent: "from-emerald-500/12 to-emerald-500/[0.04]", iconColor: "text-done dark:text-done",
        stages: ["fertility"] },
      { id: "preconception", href: "/tools/preconception-checkup", icon: ClipboardCheck,
        labelKey: "dashboard.myTools.preconception", labelAr: "فحص ما قبل الحمل", labelEn: "Preconception Check",
        count: 0, accent: "from-teal-500/12 to-teal-500/[0.04]", iconColor: "text-teal-600 dark:text-teal-400",
        stages: ["fertility"] },

      // ── Pregnancy ────────────────────────────────────────────────────────
      { id: "kicks", href: "/tools/kick-counter", icon: Hand,
        labelKey: "dailyDashboard.quickActions.kicks", labelAr: "حركات الجنين", labelEn: "Movements",
        count: kicks.length, accent: "from-pink-500/12 to-pink-500/[0.04]", iconColor: "text-pink-600 dark:text-pink-400",
        stages: ["pregnant"] },
      { id: "weight", href: "/tools/weight-gain", icon: Gauge,
        labelKey: "dailyDashboard.quickActions.weight", labelAr: "الوزن", labelEn: "Weight",
        count: weights.length, accent: "from-emerald-500/12 to-emerald-500/[0.04]", iconColor: "text-done dark:text-done",
        stages: ["pregnant"] },
      { id: "comfort", href: "/tools/pregnancy-comfort", icon: Moon,
        labelKey: "dailyDashboard.quickActions.comfort", labelAr: "الراحة", labelEn: "Comfort",
        count: 0, accent: "from-indigo-500/12 to-indigo-500/[0.04]", iconColor: "text-indigo-600 dark:text-indigo-400",
        stages: ["pregnant"] },
      { id: "contractions", href: "/tools/contraction-timer", icon: HeartPulse,
        labelKey: "dashboard.myTools.contractions", labelAr: "الانقباضات", labelEn: "Contractions",
        count: contractions.length, accent: "from-red-500/12 to-red-500/[0.04]", iconColor: "text-red-600 dark:text-red-400",
        stages: ["pregnant"] },
      { id: "photos", href: "/tools/ai-bump-photos", icon: Camera,
        labelKey: "dailyDashboard.quickActions.photos", labelAr: "الصور", labelEn: "Photos",
        count: 0, accent: "from-purple-500/12 to-purple-500/[0.04]", iconColor: "text-purple-600 dark:text-purple-400",
        stages: ["pregnant"] },
      { id: "grocery", href: "/tools/smart-grocery-list", icon: ShoppingBag,
        labelKey: "dashboard.myTools.grocery", labelAr: "قائمة التسوق", labelEn: "Grocery",
        count: groceries.length, accent: "from-lime-500/12 to-lime-500/[0.04]", iconColor: "text-lime-600 dark:text-lime-400",
        stages: ["pregnant", "postpartum"] },
      { id: "bag", href: "/tools/ai-hospital-bag", icon: Briefcase,
        labelKey: "dashboard.myTools.hospitalBag", labelAr: "حقيبة المستشفى", labelEn: "Hospital Bag",
        count: bag.length, accent: "from-fuchsia-500/12 to-fuchsia-500/[0.04]", iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
        stages: ["pregnant"] },
      { id: "birthPlan", href: "/tools/ai-birth-plan", icon: Sparkles,
        labelKey: "dashboard.myTools.birthPlan", labelAr: "خطة الولادة", labelEn: "Birth Plan",
        count: birthPlans.length, accent: "from-rose-400/12 to-rose-400/[0.04]", iconColor: "text-rose-500 dark:text-rose-300",
        stages: ["pregnant"] },

      // ── Postpartum / Baby care ───────────────────────────────────────────
      { id: "babyGrowth", href: "/tools/baby-growth", icon: Baby,
        labelKey: "dashboard.myTools.babyGrowth", labelAr: "نمو الطفل", labelEn: "Baby Growth",
        count: growthEntries.length, accent: "from-sky-500/12 to-sky-500/[0.04]", iconColor: "text-sky-600 dark:text-sky-400",
        stages: ["postpartum"] },
      { id: "diaper", href: "/tools/diaper-tracker", icon: Droplets,
        labelKey: "dashboard.myTools.diaper", labelAr: "حفاضات الطفل", labelEn: "Diaper",
        count: diapers.length, accent: "from-cyan-500/12 to-cyan-500/[0.04]", iconColor: "text-cyan-600 dark:text-cyan-400",
        stages: ["postpartum"] },
      { id: "babySleep", href: "/tools/baby-sleep-tracker", icon: Moon,
        labelKey: "dashboard.myTools.babySleep", labelAr: "نوم الطفل", labelEn: "Baby Sleep",
        count: sleepLogs.length, accent: "from-indigo-500/12 to-indigo-500/[0.04]", iconColor: "text-indigo-600 dark:text-indigo-400",
        stages: ["postpartum"] },
      { id: "cryTranslator", href: "/tools/baby-cry-translator", icon: MessageCircleHeart,
        labelKey: "dashboard.myTools.cryTranslator", labelAr: "ترجمة بكاء الطفل", labelEn: "Cry Translator",
        count: cryLogs.length, accent: "from-pink-500/12 to-pink-500/[0.04]", iconColor: "text-pink-600 dark:text-pink-400",
        stages: ["postpartum"] },
      { id: "lactation", href: "/tools/ai-lactation-prep", icon: Stethoscope,
        labelKey: "dashboard.myTools.lactation", labelAr: "الرضاعة الطبيعية", labelEn: "Lactation",
        count: 0, accent: "from-amber-400/12 to-amber-400/[0.04]", iconColor: "text-amber-500 dark:text-amber-300",
        stages: ["pregnant", "postpartum"] },
      { id: "mentalHealth", href: "/tools/postpartum-mental-health", icon: Brain,
        labelKey: "dashboard.myTools.mentalHealth", labelAr: "الصحة النفسية", labelEn: "Mental Wellness",
        count: 0, accent: "from-violet-400/12 to-violet-400/[0.04]", iconColor: "text-violet-500 dark:text-violet-300",
        stages: ["postpartum"] },
    ];
  }, []);

  // Filter to current stage, then sort: with-data first, then empty suggestions
  const sorted = useMemo(() => {
    const stageTools = tools.filter(t => t.stages.includes(stage));
    const withData = stageTools.filter(t => t.count > 0);
    const empty = stageTools.filter(t => t.count === 0);
    return [...withData, ...empty];
  }, [tools, stage]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      aria-labelledby="dashboard-tools-heading"
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          id="dashboard-tools-heading"
          className="text-xl font-extrabold text-foreground tracking-tight"
        >
          {t("dashboardV2.tools.title")}
        </h2>
        <Link
          to="/discover"
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[13px] font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {t("dashboardV2.tools.viewAll")}
          <Chevron className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Professional row layout — guarantees full label visibility on 320px screens.
          Single column under 380px, 2 columns from 380px+. No more cramped 3-col grid. */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
        {sorted.map((tool, i) => {
          const Icon = tool.icon;
          const hasData = tool.count > 0;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.02 * i, duration: 0.22 }}
            >
              <Link
                to={tool.href}
                className={`tool-card-pro group relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br ${tool.accent} px-3.5 py-3.5 hover:border-primary/40 active:scale-[0.98] min-w-0`}
              >
                {/* Soft directional sheen on hover */}
                <span aria-hidden className="pointer-events-none absolute -top-1/2 -end-1/2 h-[140%] w-[60%] rotate-12 bg-gradient-to-b from-white/30 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className={`tool-icon-halo flex h-11 w-11 items-center justify-center rounded-2xl border border-border/40 bg-background/80 backdrop-blur-sm shadow-sm flex-shrink-0 ${tool.iconColor}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.85} />
                </div>
                <span className="flex-1 min-w-0 text-[15px] font-bold leading-snug text-foreground break-words" style={{ overflowWrap: "anywhere" }}>
                  {t(tool.labelKey, tool.labelEn)}
                </span>
                {hasData && (
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[13px] font-black tabular-nums ${tool.iconColor} bg-background/80 rounded-full ps-1.5 pe-2.5 py-1 min-w-[34px] justify-center shadow-sm border border-border/30`}>
                    <span className={`tool-active-dot h-1.5 w-1.5 rounded-full bg-current`} />
                    {tool.count}
                  </span>
                )}
                <Chevron className="flex-shrink-0 h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
});

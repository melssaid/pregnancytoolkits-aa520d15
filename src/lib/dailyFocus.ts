/**
 * dailyFocus — picks the single most-actionable task for the user
 * right now, based on time of day + data gaps.
 *
 * Scientific basis: BJ Fogg's B = MAP — a single high-Ability prompt
 * outperforms a wall of choices. NHS Digital Service Manual recommends
 * one "next best action" surface on health dashboards.
 *
 * No gamification, no points, no streaks. Pure utility.
 */
import { Droplets, Pill, Hand, Utensils, Dumbbell, BookOpen, type LucideIcon } from "lucide-react";

export interface DailyFocus {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  icon: LucideIcon;
  href: string;
  reasonKey: string;
  fallbackReason: string;
}

export interface FocusInputs {
  hour: number;                    // 0-23
  vitaminsTaken: number;
  waterGlasses: number;
  todayKicks: number;
  week: number;                    // 0 if not pregnant
  isPregnant: boolean;
  mealLoggedToday: boolean;
  fitnessLoggedToday: boolean;
}

/**
 * Returns the single most-urgent action right now, or null if everything
 * essential is already done (caller should render DayCompletionState).
 */
export function pickDailyFocus(input: FocusInputs): DailyFocus | null {
  const { hour, vitaminsTaken, waterGlasses, todayKicks, week, isPregnant, mealLoggedToday } = input;

  // Morning (5-11): vitamin first (folic acid absorption peaks early)
  if (hour < 11) {
    if (vitaminsTaken < 1) {
      return {
        id: "vitamin",
        labelKey: "dailyFocus.vitamin.label",
        fallbackLabel: "سجّلي فيتامين الصباح",
        icon: Pill,
        href: "/tools/vitamin-tracker",
        reasonKey: "dailyFocus.vitamin.reason",
        fallbackReason: "أفضل وقت لامتصاص حمض الفوليك",
      };
    }
    if (waterGlasses < 2) {
      return {
        id: "water",
        labelKey: "dailyFocus.waterMorning.label",
        fallbackLabel: "اشربي كأس ماء الآن",
        icon: Droplets,
        href: "#hydration-tracker",
        reasonKey: "dailyFocus.waterMorning.reason",
        fallbackReason: "بداية يومكِ تحتاج ترطيبًا",
      };
    }
  }

  // Afternoon (11-17): hydration + meals
  if (hour >= 11 && hour < 17) {
    if (waterGlasses < 5) {
      return {
        id: "water",
        labelKey: "dailyFocus.water.label",
        fallbackLabel: "اشربي كأس ماء",
        icon: Droplets,
        href: "#hydration-tracker",
        reasonKey: "dailyFocus.water.reason",
        fallbackReason: "أنتِ بحاجة لكأسين على الأقل قبل المساء",
      };
    }
    if (!mealLoggedToday) {
      return {
        id: "meal",
        labelKey: "dailyFocus.meal.label",
        fallbackLabel: "خططي لوجبة صحية",
        icon: Utensils,
        href: "/tools/ai-meal-suggestion",
        reasonKey: "dailyFocus.meal.reason",
        fallbackReason: "اقتراح وجبة مناسب لمرحلتكِ",
      };
    }
  }

  // Evening (17-23): kicks (≥28w), then movement reflection
  if (hour >= 17) {
    if (isPregnant && week >= 28 && todayKicks < 10) {
      return {
        id: "kicks",
        labelKey: "dailyFocus.kicks.label",
        fallbackLabel: "سجّلي حركة الطفل",
        icon: Hand,
        href: "/tools/kick-counter",
        reasonKey: "dailyFocus.kicks.reason",
        fallbackReason: "الراحة المسائية أنسب وقت لمراقبة الحركة",
      };
    }
    if (waterGlasses < 8) {
      return {
        id: "water",
        labelKey: "dailyFocus.waterEvening.label",
        fallbackLabel: "أكملي كؤوس الماء",
        icon: Droplets,
        href: "#hydration-tracker",
        reasonKey: "dailyFocus.waterEvening.reason",
        fallbackReason: "تبقّى لكِ القليل لإكمال هدف اليوم",
      };
    }
  }

  // Generic fall-through gaps any time
  if (vitaminsTaken < 1) {
    return {
      id: "vitamin",
      labelKey: "dailyFocus.vitaminAny.label",
      fallbackLabel: "لا تنسي الفيتامين اليوم",
      icon: Pill,
      href: "/tools/vitamin-tracker",
      reasonKey: "dailyFocus.vitaminAny.reason",
      fallbackReason: "تناول الفيتامين اليومي يدعم تطوّر الطفل",
    };
  }
  if (waterGlasses < 8) {
    return {
      id: "water",
      labelKey: "dailyFocus.water.label",
      fallbackLabel: "اشربي كأس ماء",
      icon: Droplets,
      href: "#hydration-tracker",
      reasonKey: "dailyFocus.water.reason",
      fallbackReason: "ابقَي رطبة طوال اليوم",
    };
  }

  if (isPregnant && week > 0) {
    return {
      id: "weekly",
      labelKey: "dailyFocus.weekly.label",
      fallbackLabel: "اقرئي ملخص الأسبوع",
      icon: BookOpen,
      href: "/tools/weekly-summary",
      reasonKey: "dailyFocus.weekly.reason",
      fallbackReason: "تطورات هذا الأسبوع جاهزة لكِ",
    };
  }

  return null;
}

/** Total daily tasks tracked (mirrors DailyPriorities) */
export const DAILY_TASK_TOTAL = 5;

export function countCompleted(input: FocusInputs): number {
  let n = 0;
  if (input.vitaminsTaken >= 1) n++;
  if (input.waterGlasses >= 8) n++;
  if (input.mealLoggedToday) n++;
  if (input.todayKicks >= 10 || !input.isPregnant || input.week < 28) n++;
  if (input.fitnessLoggedToday) n++;
  return n;
}

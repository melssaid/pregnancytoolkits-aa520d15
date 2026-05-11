/**
 * useStageTheme — Unified, stage-adaptive theming hook.
 *
 * Extends the older `useTrimesterTheme` (which only served pregnancy)
 * to cover all three journey stages with a serious, refined palette
 * aligned to the project's Warm Rose-to-Lavender brand strategy.
 *
 * Returns a typed token bundle the dashboard, ribbon, and any future
 * journey-aware component can consume without recomputing colors.
 *
 * Design intent (psychological grounding):
 *  - fertility       → warm coral, "hope and anticipation"
 *  - pregnant T1     → emerald, "the seed, quiet growth"
 *  - pregnant T2     → rose, "blossoming, the core"
 *  - pregnant T3     → violet/amber, "ripening and readiness"
 *  - postpartum 0-6w → soft lavender, "healing and stillness"
 *  - postpartum 6w+  → warm mauve + gold, "nurturing strength"
 */
import { useMemo } from 'react';
import { useUserProfile, type JourneyStage } from '@/hooks/useUserProfile';

export type StageThemeKey =
  | 'fertility'
  | 'pregnant-t1'
  | 'pregnant-t2'
  | 'pregnant-t3'
  | 'postpartum-early'
  | 'postpartum-late';

export interface StageTheme {
  /** Discrete identifier for the active sub-stage */
  key: StageThemeKey;
  /** Top-level journey stage */
  stage: JourneyStage;
  /** Tailwind gradient classes for soft page backgrounds */
  gradient: string;
  /** Primary accent hue (HSL hue value, 0-360) */
  accentHue: number;
  /** Secondary accent hue, for ribbons / dual-tone surfaces */
  accentHueAlt: number;
  /** Ribbon-ready linear-gradient string (from→via→to) using HSL */
  ribbonGradient: string;
  /** Glow color for the active ribbon dot (HSL with alpha) */
  glow: string;
  /** A single, discreet emoji used sparingly (never in serious headers) */
  emoji: string;
  /** Short, formal label key (consumer should translate) */
  labelKey: string;
}

const THEMES: Record<StageThemeKey, StageTheme> = {
  fertility: {
    key: 'fertility',
    stage: 'fertility',
    gradient: 'from-[hsl(15,60%,97%)] via-card to-[hsl(25,55%,97%)]',
    accentHue: 15,
    accentHueAlt: 25,
    ribbonGradient:
      'linear-gradient(90deg, hsl(15 70% 60%) 0%, hsl(25 70% 62%) 50%, hsl(340 50% 62%) 100%)',
    glow: 'hsl(15 70% 55% / 0.45)',
    emoji: '🌱',
    labelKey: 'journey.ribbon.stages.fertility',
  },
  'pregnant-t1': {
    key: 'pregnant-t1',
    stage: 'pregnant',
    gradient: 'from-[hsl(160,40%,97%)] via-card to-[hsl(150,35%,97%)]',
    accentHue: 160,
    accentHueAlt: 150,
    ribbonGradient:
      'linear-gradient(90deg, hsl(160 50% 50%) 0%, hsl(150 45% 55%) 100%)',
    glow: 'hsl(160 50% 45% / 0.45)',
    emoji: '🌱',
    labelKey: 'journey.ribbon.stages.pregnant',
  },
  'pregnant-t2': {
    key: 'pregnant-t2',
    stage: 'pregnant',
    gradient: 'from-[hsl(340,40%,97%)] via-card to-[hsl(345,35%,97%)]',
    accentHue: 340,
    accentHueAlt: 345,
    ribbonGradient:
      'linear-gradient(90deg, hsl(340 65% 55%) 0%, hsl(345 60% 58%) 100%)',
    glow: 'hsl(340 65% 50% / 0.45)',
    emoji: '🌸',
    labelKey: 'journey.ribbon.stages.pregnant',
  },
  'pregnant-t3': {
    key: 'pregnant-t3',
    stage: 'pregnant',
    gradient: 'from-[hsl(280,35%,97%)] via-card to-[hsl(310,30%,97%)]',
    accentHue: 280,
    accentHueAlt: 310,
    ribbonGradient:
      'linear-gradient(90deg, hsl(280 48% 56%) 0%, hsl(310 42% 60%) 100%)',
    glow: 'hsl(295 42% 52% / 0.42)',
    emoji: '👶',
    labelKey: 'journey.ribbon.stages.pregnant',
  },
  'postpartum-early': {
    key: 'postpartum-early',
    stage: 'postpartum',
    gradient: 'from-[hsl(280,30%,97%)] via-card to-[hsl(300,25%,97%)]',
    accentHue: 280,
    accentHueAlt: 300,
    ribbonGradient:
      'linear-gradient(90deg, hsl(280 40% 60%) 0%, hsl(300 35% 62%) 100%)',
    glow: 'hsl(290 40% 55% / 0.40)',
    emoji: '🤍',
    labelKey: 'journey.ribbon.stages.postpartum',
  },
  'postpartum-late': {
    key: 'postpartum-late',
    stage: 'postpartum',
    gradient: 'from-[hsl(310,30%,97%)] via-card to-[hsl(35,35%,97%)]',
    accentHue: 310,
    accentHueAlt: 35,
    ribbonGradient:
      'linear-gradient(90deg, hsl(310 45% 58%) 0%, hsl(330 40% 60%) 50%, hsl(35 55% 62%) 100%)',
    glow: 'hsl(320 40% 55% / 0.45)',
    emoji: '✨',
    labelKey: 'journey.ribbon.stages.postpartum',
  },
};

/** Resolve the active sub-stage from profile data. */
function resolveStageKey(stage: JourneyStage, week: number): StageThemeKey {
  if (stage === 'fertility') return 'fertility';
  if (stage === 'postpartum') {
    return week >= 6 ? 'postpartum-late' : 'postpartum-early';
  }
  // pregnant
  if (week <= 13) return 'pregnant-t1';
  if (week <= 26) return 'pregnant-t2';
  return 'pregnant-t3';
}

export function useStageTheme(): StageTheme {
  const { profile } = useUserProfile();
  return useMemo(
    () => THEMES[resolveStageKey(profile.journeyStage, profile.pregnancyWeek || 0)],
    [profile.journeyStage, profile.pregnancyWeek],
  );
}

/** Ordered list of top-level stages for the progress ribbon. */
export const JOURNEY_STAGE_ORDER: JourneyStage[] = ['fertility', 'pregnant', 'postpartum'];

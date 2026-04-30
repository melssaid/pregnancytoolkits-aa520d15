/**
 * JourneyProgressRibbon — A formal, three-station progress indicator:
 *
 *     ◉ Fertility ─────── ◯ Pregnancy ─────── ◯ Motherhood
 *
 * v2 — refined visuals:
 *   • Each station now sits inside a soft glass medallion (rounded-2xl
 *     framed icon) instead of a bare dot.
 *   • The connecting line is a continuous hairline rail with a
 *     stage-themed gradient progress fill that stops at the active
 *     station. Past segments are saturated; future segments dim.
 *   • Active medallion has a quiet pulse + ring; never gamified.
 *   • Fully RTL-aware, keyboard-accessible, screen-reader friendly.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sprout, Heart, Baby } from 'lucide-react';
import { useStageTheme, JOURNEY_STAGE_ORDER } from '@/hooks/useStageTheme';
import { useUserProfile, type JourneyStage } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

const STAGE_LABEL_KEY: Record<JourneyStage, string> = {
  fertility: 'journey.ribbon.stages.fertility',
  pregnant: 'journey.ribbon.stages.pregnant',
  postpartum: 'journey.ribbon.stages.postpartum',
};

const STAGE_ICON: Record<JourneyStage, typeof Sprout> = {
  fertility: Sprout,
  pregnant: Heart,
  postpartum: Baby,
};

interface Props {
  /** Optional click handler — typically opens the Journey Map page. */
  onSelect?: () => void;
  /**
   * Optional per-station handler. When provided, each station becomes
   * a focusable button and supports ←/→ keyboard navigation. If absent,
   * the ribbon falls back to the wrapper-level `onSelect`.
   */
  onStationSelect?: (stage: JourneyStage) => void;
  className?: string;
}

export const JourneyProgressRibbon = memo(function JourneyProgressRibbon({
  onSelect,
  onStationSelect,
  className,
}: Props) {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const theme = useStageTheme();
  const activeStage = profile.journeyStage;
  const activeIndex = JOURNEY_STAGE_ORDER.indexOf(activeStage);

  const ariaLabel = t('journey.ribbon.ariaLabel', 'Journey progress');

  // Progress percent across the full rail (0 → 50 → 100)
  const progressPct =
    activeIndex <= 0 ? 8 : activeIndex === 1 ? 50 : 92;

  const handleStationKey = (e: React.KeyboardEvent, stage: JourneyStage, idx: number) => {
    if (!onStationSelect) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStationSelect(stage);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const nextIdx = (idx + dir + JOURNEY_STAGE_ORDER.length) % JOURNEY_STAGE_ORDER.length;
      const target = document.querySelector<HTMLElement>(
        `[data-ribbon-station="${JOURNEY_STAGE_ORDER[nextIdx]}"]`,
      );
      target?.focus();
    }
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'relative w-full select-none',
        onSelect && !onStationSelect && 'cursor-pointer',
        className,
      )}
      onClick={onStationSelect ? undefined : onSelect}
      role={onSelect && !onStationSelect ? 'button' : 'group'}
      tabIndex={onSelect && !onStationSelect ? 0 : -1}
      onKeyDown={(e) => {
        if (onStationSelect || !onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="relative flex items-start gap-1 px-2 pt-1.5 pb-2">
        {/* ── Connecting rail ──────────────────────────────────────────
            The rail spans station-center to station-center. We anchor
            it at the medallion vertical center (~ h-9/2 = 18px from top
            + the 6px pt offset on the wrapper => ~24px). */}
        <div
          aria-hidden
          className="absolute left-[14%] right-[14%] top-[24px] h-px rounded-full"
          style={{
            background:
              'linear-gradient(90deg, hsl(var(--foreground) / 0.10) 0%, hsl(var(--foreground) / 0.18) 50%, hsl(var(--foreground) / 0.10) 100%)',
          }}
        />
        {/* Active progress fill — saturated, themed gradient, animated width */}
        <motion.div
          aria-hidden
          className="absolute top-[23px] h-[3px] rounded-full"
          style={{
            left: '14%',
            background: theme.ribbonGradient,
            boxShadow: `0 0 8px ${theme.glow}`,
          }}
          initial={false}
          animate={{ width: `calc(${progressPct - 14}% )` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />

        {JOURNEY_STAGE_ORDER.map((stage, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;
          const isFuture = idx > activeIndex;
          const label = t(STAGE_LABEL_KEY[stage]);
          const Icon = STAGE_ICON[stage];

          const stationLabel = isActive
            ? t('journey.ribbon.stationCurrent', { stage: label, defaultValue: '{{stage}} (current)' })
            : t('journey.ribbon.stationGoTo', { stage: label, defaultValue: 'Go to {{stage}}' });

          const Wrapper: any = onStationSelect ? 'button' : 'div';
          const wrapperProps = onStationSelect
            ? {
                type: 'button',
                'data-ribbon-station': stage,
                'aria-label': stationLabel,
                'aria-current': isActive ? ('step' as const) : undefined,
                onClick: (e: React.MouseEvent) => {
                  e.stopPropagation();
                  onStationSelect(stage);
                },
                onKeyDown: (e: React.KeyboardEvent) => handleStationKey(e, stage, idx),
                tabIndex: 0,
              }
            : {};

          return (
            <Wrapper
              key={stage}
              {...wrapperProps}
              className={cn(
                'relative z-10 flex flex-1 flex-col items-center gap-1 min-w-0',
                onStationSelect &&
                  'cursor-pointer rounded-2xl bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-transform active:scale-[0.97]',
              )}
            >
              {/* Framed medallion */}
              <div className="relative h-9 w-9 shrink-0">
                {/* Quiet pulse halo for the active station */}
                {isActive && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-2xl"
                    style={{ background: theme.glow, filter: 'blur(7px)' }}
                    animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                <span
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-2xl',
                    'border backdrop-blur-sm transition-all duration-300',
                    isActive &&
                      'border-white/70 dark:border-white/15 shadow-[0_4px_12px_-4px_hsl(var(--primary)/0.35),inset_0_1px_0_0_hsl(0_0%_100%/0.7)]',
                    isPast && 'border-white/55 dark:border-white/10',
                    isFuture && 'border-border/60',
                  )}
                  style={{
                    background: isActive
                      ? `linear-gradient(160deg, hsl(${theme.accentHue} 70% 96%) 0%, hsl(${theme.accentHueAlt} 60% 92%) 100%)`
                      : isPast
                        ? `hsl(${theme.accentHue} 35% 95%)`
                        : 'hsl(var(--muted) / 0.5)',
                  }}
                >
                  <Icon
                    className={cn(
                      'transition-all duration-300',
                      isActive ? 'h-4 w-4' : 'h-3.5 w-3.5',
                    )}
                    strokeWidth={isActive ? 2.4 : 2}
                    style={{
                      color: isActive
                        ? `hsl(${theme.accentHue} 60% 38%)`
                        : isPast
                          ? `hsl(${theme.accentHue} 40% 50%)`
                          : 'hsl(var(--muted-foreground))',
                    }}
                    aria-hidden
                  />
                </span>

                {/* Tiny "you are here" caret under active station */}
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-1 rounded-full"
                    style={{ background: `hsl(${theme.accentHue} 65% 50%)` }}
                  />
                )}
              </div>

              {/* Station label */}
              <span
                className={cn(
                  'text-[10px] leading-tight tracking-tight truncate text-center',
                  isActive ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground',
                )}
                style={{ fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', sans-serif" }}
                title={label}
              >
                {label}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </nav>
  );
});

export default JourneyProgressRibbon;

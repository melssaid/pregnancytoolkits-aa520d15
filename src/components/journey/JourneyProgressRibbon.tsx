/**
 * JourneyProgressRibbon — A discreet, always-visible companion that
 * communicates the user's place along the three-stage journey:
 *
 *     Fertility  ──●──  Pregnancy  ──○──  Motherhood
 *
 * Design intent:
 *   • Serious, restrained, never playful — we do not gamify this bar.
 *   • The active station pulses softly; inactive stations are quiet.
 *   • Colour follows `useStageTheme` so the ribbon harmonises with
 *     the surrounding page (T1 emerald, T2 rose, T3 violet/amber, etc.).
 *   • Fully RTL-aware: when `dir="rtl"` the visual order is mirrored
 *     by the natural flexbox flow (no hard left/right hacks).
 *   • All text is translated; labels stay short to fit small screens.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStageTheme, JOURNEY_STAGE_ORDER } from '@/hooks/useStageTheme';
import { useUserProfile, type JourneyStage } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

const STAGE_LABEL_KEY: Record<JourneyStage, string> = {
  fertility: 'journey.ribbon.stages.fertility',
  pregnant: 'journey.ribbon.stages.pregnant',
  postpartum: 'journey.ribbon.stages.postpartum',
};

interface Props {
  /** Optional click handler — typically opens the future Journey Map page. */
  onSelect?: () => void;
  className?: string;
}

export const JourneyProgressRibbon = memo(function JourneyProgressRibbon({
  onSelect,
  className,
}: Props) {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const theme = useStageTheme();
  const activeStage = profile.journeyStage;
  const activeIndex = JOURNEY_STAGE_ORDER.indexOf(activeStage);

  const ariaLabel = t('journey.ribbon.ariaLabel', 'Journey progress');

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'relative w-full select-none',
        onSelect && 'cursor-pointer',
        className,
      )}
      onClick={onSelect}
      role={onSelect ? 'button' : 'group'}
      tabIndex={onSelect ? 0 : -1}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Subtle background rail */}
      <div className="relative flex items-center gap-2 px-1 py-2">
        {/* The continuous coloured rail behind the stations */}
        <div
          aria-hidden
          className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-[2px] rounded-full opacity-25"
          style={{ background: theme.ribbonGradient }}
        />

        {JOURNEY_STAGE_ORDER.map((stage, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;
          const isFuture = idx > activeIndex;
          const label = t(STAGE_LABEL_KEY[stage]);

          return (
            <div
              key={stage}
              className="relative z-10 flex flex-1 items-center gap-1.5 min-w-0"
            >
              {/* Station dot */}
              <div className="relative flex h-6 w-6 items-center justify-center shrink-0">
                {isActive && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{ background: theme.glow, filter: 'blur(6px)' }}
                    animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <span
                  className={cn(
                    'relative h-2.5 w-2.5 rounded-full ring-1 transition-colors',
                    isActive && 'h-3 w-3 ring-2 ring-white/60 dark:ring-white/30',
                    isPast && 'ring-foreground/15',
                    isFuture && 'ring-foreground/10',
                  )}
                  style={{
                    background: isActive
                      ? `hsl(${theme.accentHue} 65% 55%)`
                      : isPast
                        ? `hsl(${theme.accentHue} 30% 70%)`
                        : 'hsl(var(--muted-foreground) / 0.35)',
                  }}
                />
              </div>

              {/* Station label — kept tight for small screens; truncates gracefully */}
              <span
                className={cn(
                  'text-[10.5px] font-semibold tracking-tight leading-tight truncate',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
                style={{ fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', sans-serif" }}
                title={label}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
});

export default JourneyProgressRibbon;

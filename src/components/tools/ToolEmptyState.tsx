/**
 * ToolEmptyState — A unified, friendly empty-state for in-tool history,
 * charts, or session lists when the user has not yet recorded any data.
 *
 * Distinct from `EmptyStateCard` (dashboard-level): this component lives
 * inside an active tool, so its CTA is typically a callback that scrolls
 * the user to the primary action (e.g. the "Start" button) rather than
 * a navigation link.
 *
 * Tone: warm, inviting, never blaming. Uses the curved design language
 * (rounded-2xl, dashed border) so the user reads "ready when you are"
 * instead of "broken / missing".
 *
 * Mobile-first, RTL-aware, and respects the design system's semantic
 * tokens — no hard-coded colours.
 */
import { memo, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ToolEmptyStateProps {
  /** Lucide-style icon component rendered in the medallion. */
  icon: ElementType;
  /** Short, hopeful headline (e.g. "No sessions yet"). */
  title: string;
  /** One-line explanation of what to do next. */
  description: string;
  /** Optional CTA label — e.g. "Start your first session". */
  ctaLabel?: string;
  /** Optional callback invoked when the CTA is pressed. */
  onCta?: () => void;
  /**
   * Direction the CTA arrow points. "up" = scroll up to the primary
   * action above the empty list. "down" = scroll down. Defaults to "up"
   * because empty histories almost always sit below the recorder.
   */
  ctaDirection?: "up" | "down";
  /** Optional secondary content — e.g. a short tips list. */
  children?: ReactNode;
  className?: string;
}

export const ToolEmptyState = memo(function ToolEmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaDirection = "up",
  children,
  className,
}: ToolEmptyStateProps) {
  const { isRTL } = useLanguage();
  const Arrow = ctaDirection === "up" ? ArrowUp : ArrowDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      dir={isRTL ? "rtl" : "ltr"}
      className={cn(
        "rounded-2xl border border-dashed border-border/60 bg-card/60 p-5 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>

      <h3 className="text-sm font-bold text-foreground mb-1 leading-tight">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-snug mb-3">
        {description}
      </p>

      {ctaLabel && onCta && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
        >
          <Arrow className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          {ctaLabel}
        </button>
      )}

      {children && (
        <div className="mt-3 text-[11px] text-muted-foreground/80">
          {children}
        </div>
      )}
    </motion.div>
  );
});

export default ToolEmptyState;

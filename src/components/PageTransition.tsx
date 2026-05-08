import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  variant?: "default" | "tool";
}

/**
 * Page transition matching the splash video reveal:
 * - fade-in + subtle slide-up
 * - 700ms cubic-bezier(0.22,1,0.36,1) (same easing as splash)
 * - "tool" variant adds a slightly larger slide for tool screens
 *
 * Keyed on pathname so each navigation re-triggers the animation.
 */
export function PageTransition({ children, variant = "default" }: PageTransitionProps) {
  const { pathname } = useLocation();
  const animationClass =
    variant === "tool" ? "page-transition-tool" : "page-transition";

  return (
    <div key={pathname} className={`w-full min-h-screen ${animationClass}`}>
      {children}
    </div>
  );
}

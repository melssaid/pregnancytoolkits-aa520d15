/**
 * JourneySkipLinks
 *
 * Keyboard-only skip navigation for the Journey page. Renders a list of
 * visually-hidden anchors that become visible on focus, allowing keyboard
 * and screen-reader users to jump directly to any section without tabbing
 * through every interactive element.
 *
 * Targets must expose matching `id` attributes on their <section> wrappers.
 */
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

interface SkipTarget {
  id: string;
  labelKey: string;
  fallback: string;
}

const TARGETS: SkipTarget[] = [
  { id: "journey-timeline-section", labelKey: "journey.map.skip.timeline", fallback: "Skip to timeline" },
  { id: "journey-milestones-section", labelKey: "journey.map.skip.milestones", fallback: "Skip to milestones" },
  { id: "journey-changelog-section", labelKey: "journey.map.skip.changelog", fallback: "Skip to change log" },
  { id: "journey-autodetect-section", labelKey: "journey.map.skip.autodetect", fallback: "Skip to auto-detect" },
  { id: "journey-stages-section", labelKey: "journey.map.skip.stages", fallback: "Skip to stages" },
  { id: "journey-memories-section", labelKey: "journey.map.skip.memories", fallback: "Skip to memories" },
];

export function JourneySkipLinks() {
  const { t } = useTranslation();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const node = document.getElementById(id);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    // Make the section temporarily focusable so subsequent Tab continues from here
    const prevTabIndex = node.getAttribute("tabindex");
    node.setAttribute("tabindex", "-1");
    node.focus({ preventScroll: true });
    // Restore original tabindex after blur to keep DOM clean
    const restore = () => {
      if (prevTabIndex === null) node.removeAttribute("tabindex");
      else node.setAttribute("tabindex", prevTabIndex);
      node.removeEventListener("blur", restore);
    };
    node.addEventListener("blur", restore);
  }, []);

  return (
    <nav
      aria-label={t("journey.map.skip.nav", "Skip navigation")}
      className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-2 focus-within:start-2 focus-within:z-[100] focus-within:bg-background focus-within:border focus-within:border-border focus-within:rounded-xl focus-within:shadow-lg focus-within:p-2 focus-within:flex focus-within:flex-col focus-within:gap-1"
    >
      {TARGETS.map((target) => (
        <a
          key={target.id}
          href={`#${target.id}`}
          onClick={(e) => handleClick(e, target.id)}
          className="text-xs font-semibold px-3 py-1.5 rounded-md text-foreground hover:bg-muted focus:bg-primary/15 focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {t(target.labelKey, target.fallback)}
        </a>
      ))}
    </nav>
  );
}

export default JourneySkipLinks;

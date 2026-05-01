/**
 * JourneyLiveRegion — A tiny, shared accessibility primitive used across
 * the Journey surfaces (Timeline, AutoDetect toggle, future panels).
 *
 * Why a dedicated component?
 *   • The pattern was duplicated in JourneyTimeline + JourneyAutoDetectToggle:
 *       1. A visually-hidden polite live region.
 *       2. A "cache-busting" suffix so that *identical* messages still
 *          re-trigger an announcement (otherwise screen readers ignore
 *          unchanged textContent).
 *   • Centralising it gives us one well-tested implementation, consistent
 *     wording style, and a single place to evolve politeness / atomicity
 *     policy.
 *
 * Exports
 * -------
 *   • `useJourneyLiveAnnouncer()` — returns `{ announce, message }`.
 *     `announce(text)` queues a string for the next render; `message` is
 *     the value that should be passed to <JourneyLiveRegion message=… />.
 *   • `<JourneyLiveRegion message=… assertive? />` — the sr-only span.
 *
 * The cache-busting suffix is a single zero-width space + timestamp at
 * the end of the string; it is stripped before being read aloud so the
 * user only hears the meaningful content.
 */
import { useCallback, useState } from "react";

const SUFFIX_RE = /\s\u200B\d+$/;

/** Strip the announce-replay suffix so screen readers only hear content. */
const stripSuffix = (raw: string) => raw.replace(SUFFIX_RE, "");

export function useJourneyLiveAnnouncer() {
  const [message, setMessage] = useState("");

  /**
   * Queue an announcement. Pass an empty string or `null` to clear.
   * Repeated identical messages still re-announce thanks to the suffix.
   */
  const announce = useCallback((text: string | null | undefined) => {
    if (!text) {
      setMessage("");
      return;
    }
    setMessage(`${text} \u200B${Date.now()}`);
  }, []);

  return { announce, message };
}

interface JourneyLiveRegionProps {
  /** Raw message coming from `useJourneyLiveAnnouncer().message`. */
  message: string;
  /**
   * When true, uses `aria-live="assertive"` for urgent/error states.
   * Defaults to polite — appropriate for status updates that should not
   * interrupt the user.
   */
  assertive?: boolean;
  /** Optional stable id for diagnostics / external aria-describedby use. */
  id?: string;
}

export function JourneyLiveRegion({
  message,
  assertive = false,
  id,
}: JourneyLiveRegionProps) {
  return (
    <span
      id={id}
      role="status"
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
      className="sr-only"
    >
      {stripSuffix(message)}
    </span>
  );
}

export default JourneyLiveRegion;

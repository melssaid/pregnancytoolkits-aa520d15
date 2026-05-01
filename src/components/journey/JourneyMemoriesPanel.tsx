/**
 * JourneyMemoriesPanel — surfaces real, persisted artefacts that
 * belong to the user's journey:
 *   • Saved AI results (`useSavedResults`) — the user's reflections
 *   • Bump photos count (`useBumpPhotosStorage`) — visual record
 *   • Tracking entries from local storage (kicks, contractions, weight)
 *
 * The panel is intentionally read-only and serves as a "memory shelf"
 * on the JourneyMap page. Counts and the most recent saved-result
 * snippet are shown — never gamified, never noisy.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Bookmark, Camera, Activity, ChevronRight } from "lucide-react";
import { useSavedResults } from "@/hooks/useSavedResults";
import { useBumpPhotosStorage } from "@/hooks/useBumpPhotosStorage";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import { STORAGE_KEYS } from "@/lib/dataBus";
import { formatLocalized } from "@/lib/dateLocale";
import { cn } from "@/lib/utils";

interface Stat {
  key: string;
  labelKey: string;
  value: number;
  icon: typeof Bookmark;
  href?: string;
  accent: string;
}

export function JourneyMemoriesPanel({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const { allResults } = useSavedResults();
  const { photos } = useBumpPhotosStorage();

  // Local-storage tracking counts — synchronous read, no network.
  const trackingCounts = useMemo(() => {
    const kicks = safeParseLocalStorage<unknown[]>(STORAGE_KEYS.KICK_SESSIONS, [], (d): d is unknown[] => Array.isArray(d));
    const contractions = safeParseLocalStorage<unknown[]>(STORAGE_KEYS.CONTRACTIONS, [], (d): d is unknown[] => Array.isArray(d));
    const weight = safeParseLocalStorage<unknown[]>(STORAGE_KEYS.WEIGHT_ENTRIES, [], (d): d is unknown[] => Array.isArray(d));
    const symptoms = safeParseLocalStorage<unknown[]>(STORAGE_KEYS.SYMPTOM_LOGS, [], (d): d is unknown[] => Array.isArray(d));
    return {
      kicks: kicks.length,
      contractions: contractions.length,
      weight: weight.length,
      symptoms: symptoms.length,
    };
  }, []);

  const totalTracking =
    trackingCounts.kicks + trackingCounts.contractions + trackingCounts.weight + trackingCounts.symptoms;

  const stats: Stat[] = [
    {
      key: "saved",
      labelKey: "journey.map.memories.savedResults",
      value: allResults.length,
      icon: Bookmark,
      accent: "text-amber-600 bg-amber-500/10",
    },
    {
      key: "photos",
      labelKey: "journey.map.memories.photos",
      value: photos.length,
      icon: Camera,
      href: "/tools/ai-bump-photos",
      accent: "text-rose-600 bg-rose-500/10",
    },
    {
      key: "tracking",
      labelKey: "journey.map.memories.trackingEntries",
      value: totalTracking,
      icon: Activity,
      href: "/dashboard",
      accent: "text-emerald-600 bg-emerald-500/10",
    },
  ];

  const recentSaved = allResults.slice(0, 3);

  if (allResults.length === 0 && photos.length === 0 && totalTracking === 0) {
    return null;
  }

  return (
    <section className={cn("space-y-3", className)} aria-labelledby="journey-memories-heading">
      <h2
        id="journey-memories-heading"
        className="text-sm font-bold text-foreground px-1"
        style={{ fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', sans-serif" }}
      >
        {t("journey.map.memories.title", "Your records")}
      </h2>

      {/* Quick stat strip */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => {
          const Icon = s.icon;
          const inner = (
            <Card
              className={cn(
                "h-full p-2.5 rounded-2xl border-border/60 flex flex-col items-center justify-center gap-1 text-center",
                "transition-all hover:shadow-sm",
                s.href && "hover:border-primary/40",
              )}
            >
              <span className={cn("h-8 w-8 rounded-xl flex items-center justify-center", s.accent)} aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-base font-black text-foreground leading-none tabular-nums">{s.value}</span>
              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">
                {t(s.labelKey)}
              </span>
            </Card>
          );
          return s.href ? (
            <Link
              key={s.key}
              to={s.href}
              className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-2xl"
              aria-label={`${t(s.labelKey)}: ${s.value}`}
            >
              {inner}
            </Link>
          ) : (
            <div key={s.key} className="h-full">{inner}</div>
          );
        })}
      </div>

      {/* Recent saved results — succinct preview list */}
      {recentSaved.length > 0 && (
        <Card className="rounded-2xl border-border/60 overflow-hidden">
          <ul className="divide-y divide-border/50" role="list">
            {recentSaved.map((r) => (
              <li key={r.id}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <Bookmark className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatLocalized(r.savedAt, "PP", i18n.language)}
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 rtl:rotate-180" aria-hidden />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}

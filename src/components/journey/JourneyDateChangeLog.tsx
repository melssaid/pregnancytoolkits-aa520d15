/**
 * JourneyDateChangeLog
 *
 * Concise audit trail of changes to the user's key journey dates
 * (`dueDate`, `birthDate`, `lastPeriodDate`). Renders nothing when
 * the log is empty so the page stays calm for new users.
 *
 * Each row shows: which field changed, the from → to values, and a
 * relative "X ago" timestamp localized to the active app language.
 */
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ArrowRight, Trash2 } from "lucide-react";
import { useJourneyDateChangeLog, type JourneyDateField } from "@/hooks/useJourneyDateChangeLog";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalized, getDateLocale } from "@/lib/dateLocale";
import { cn } from "@/lib/utils";

const FIELD_LABEL_KEY: Record<JourneyDateField, string> = {
  dueDate: "journey.map.fields.dueDate",
  birthDate: "journey.map.fields.birthDate",
  lastPeriodDate: "journey.map.changeLog.fields.lastPeriodDate",
};

export const JourneyDateChangeLog = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useLanguage();
  const { entries, clear } = useJourneyDateChangeLog();

  if (entries.length === 0) return null;

  const dateLocale = getDateLocale(i18n.language);
  const fmtDate = (iso: string | null) =>
    iso ? formatLocalized(iso, "PP", i18n.language) : t("journey.map.changeLog.empty");

  return (
    <Card
      className="p-4 rounded-2xl border-border/60 bg-card/70 backdrop-blur-sm"
      aria-labelledby="journey-changelog-title"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            aria-hidden
            className="h-9 w-9 rounded-2xl flex items-center justify-center bg-primary/10 text-primary"
          >
            <History className="h-4 w-4" />
          </div>
          <div>
            <h3
              id="journey-changelog-title"
              className="text-sm font-bold text-foreground"
            >
              {t("journey.map.changeLog.title", "Date change history")}
            </h3>
            <p
              id="journey-changelog-subtitle"
              className="text-[11px] text-muted-foreground"
            >
              {t("journey.map.changeLog.subtitle", "Recent updates to your key dates")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive"
          aria-label={t("journey.map.changeLog.clear", "Clear history")}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
      <span id="journey-changelog-status" className="sr-only" aria-live="polite">
        {t("journey.map.srStatus.changelogCount", {
          count: entries.length,
          defaultValue: `${entries.length} edits recorded`,
        })}
      </span>

      <ul className="mt-3 space-y-2" role="list">
        {entries.slice(0, 8).map((entry) => {
          const fieldLabel = t(FIELD_LABEL_KEY[entry.field]);
          const ago = formatDistanceToNow(new Date(entry.changedAt), {
            addSuffix: true,
            locale: dateLocale,
          });
          const isFirstSet = entry.previous === null && entry.next !== null;
          const isCleared = entry.next === null && entry.previous !== null;

          return (
            <li
              key={entry.id}
              className="rounded-xl border border-border/40 bg-background/60 p-2.5"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[12px] font-semibold text-foreground">
                  {fieldLabel}
                </span>
                <span className="text-[10px] text-muted-foreground">{ago}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                {isFirstSet ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {t("journey.map.changeLog.added", "Added")}
                    </span>
                    <span className="text-foreground/80">{fmtDate(entry.next)}</span>
                  </span>
                ) : isCleared ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                      {t("journey.map.changeLog.cleared", "Cleared")}
                    </span>
                    <span className="line-through text-foreground/60">
                      {fmtDate(entry.previous)}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="line-through text-foreground/60">
                      {fmtDate(entry.previous)}
                    </span>
                    <ArrowRight
                      className={cn("h-3 w-3 shrink-0", isRTL && "rotate-180")}
                      aria-hidden
                    />
                    <span className="sr-only">
                      {t("journey.map.changeLog.changedTo", "changed to")}
                    </span>
                    <span className="text-foreground/90 font-semibold">
                      {fmtDate(entry.next)}
                    </span>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {entries.length > 8 && (
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          {t("journey.map.changeLog.more", { count: entries.length - 8 })}
        </p>
      )}
    </Card>
  );
};

export default JourneyDateChangeLog;

/**
 * JourneyAutoDetectToggle — Lets the user enable/disable smart stage
 * auto-detection. When ON, useUserProfile derives `journeyStage` from
 * `dueDate` / `birthDate` / LMP. When OFF, the user keeps full manual
 * control (still possible via the JourneyProgressRibbon / JourneyMap).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { haptic } from "@/lib/haptics";

export const JourneyAutoDetectToggle = () => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useUserProfile();
  const enabled = profile.autoStageDetection !== false;
  const [announcement, setAnnouncement] = useState("");

  const handleToggle = (next: boolean) => {
    haptic("tap");
    updateProfile({ autoStageDetection: next });
    const msg = next
      ? t("journey.map.srAnnounce.autoDetectTurnedOn", "Smart stage detection turned on.")
      : t("journey.map.srAnnounce.autoDetectTurnedOff", "Smart stage detection turned off.");
    // Append a unique suffix so identical messages still re-announce.
    setAnnouncement(`${msg} \u200B${Date.now()}`);
  };

  return (
    <Card className="p-3 sm:p-4 rounded-2xl border-border/60">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary"
        >
          <BadgeCheck className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <label
              id="journey-autodetect-title"
              htmlFor="auto-stage-toggle"
              className="text-sm font-bold text-foreground cursor-pointer"
            >
              {t("journey.map.autoDetect.title", "Smart stage detection")}
            </label>
            <Switch
              id="auto-stage-toggle"
              checked={enabled}
              onCheckedChange={handleToggle}
              aria-label={t("journey.map.autoDetect.title", "Smart stage detection")}
              aria-describedby="journey-autodetect-subtitle journey-autodetect-status"
            />
          </div>
          <p
            id="journey-autodetect-subtitle"
            className="mt-1 text-xs text-muted-foreground leading-relaxed"
          >
            {enabled
              ? t(
                  "journey.map.autoDetect.descriptionOn",
                  "Your stage updates automatically from dates you record (due date, birth date).",
                )
              : t(
                  "journey.map.autoDetect.descriptionOff",
                  "Auto-detection is off. You control your stage manually.",
                )}
          </p>
          <span id="journey-autodetect-status" className="sr-only" aria-live="polite">
            {enabled
              ? t("journey.map.srStatus.autoDetectOn", "Smart stage detection is currently on.")
              : t("journey.map.srStatus.autoDetectOff", "Smart stage detection is off; you control the stage manually.")}
          </span>
        </div>
      </div>
      {/* Polite live region announcing toggle changes (assertive for explicit user action). */}
      <span
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement.replace(/\s\u200B\d+$/, "")}
      </span>
    </Card>
  );
};

export default JourneyAutoDetectToggle;

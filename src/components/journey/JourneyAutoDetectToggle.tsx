/**
 * JourneyAutoDetectToggle — Lets the user enable/disable smart stage
 * auto-detection. When ON, useUserProfile derives `journeyStage` from
 * `dueDate` / `birthDate` / LMP. When OFF, the user keeps full manual
 * control (still possible via the JourneyProgressRibbon / JourneyMap).
 */
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

  const handleToggle = (next: boolean) => {
    haptic("tap");
    updateProfile({ autoStageDetection: next });
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
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
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
        </div>
      </div>
    </Card>
  );
};

export default JourneyAutoDetectToggle;

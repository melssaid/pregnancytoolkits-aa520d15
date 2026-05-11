/**
 * TrustStrip — Always-visible privacy + scope reminder at the top of
 * the dashboard. HIMSS Trust Framework: persistent trust signals raise
 * disclosure willingness without shouting.
 *
 * Quiet, single-line, low-contrast. Never CTAs.
 */
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Heart } from "lucide-react";

export const TrustStrip = memo(function TrustStrip() {
  const { t } = useTranslation();
  return (
    <div
      role="note"
      aria-label={t("trustStrip.aria", "ملاحظة الخصوصية والنطاق")}
      className="flex items-center justify-center gap-3 px-3 py-1.5
                 text-[10px] font-medium text-muted-foreground/80
                 leading-tight select-none"
    >
      <span className="inline-flex items-center gap-1">
        <Shield className="w-3 h-3" strokeWidth={2.2} />
        {t("trustStrip.privacy", "بياناتكِ على جهازكِ فقط")}
      </span>
      <span aria-hidden className="text-muted-foreground/30">·</span>
      <span className="inline-flex items-center gap-1">
        <Heart className="w-3 h-3" strokeWidth={2.2} />
        {t("trustStrip.scope", "مرافقة عافية لا تشخيص طبي")}
      </span>
    </div>
  );
});

export default TrustStrip;

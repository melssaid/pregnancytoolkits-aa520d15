/**
 * WhyWeAsk — Tiny info trigger + popover that explains why a field is
 * requested. NN/g Form Design research: explicit "why we ask" copy
 * raises completion rates ~23%.
 */
import { memo } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

interface Props {
  reason: string;          // already-translated short reason
  ariaLabel?: string;
}

export const WhyWeAsk = memo(function WhyWeAsk({ reason, ariaLabel }: Props) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel || t("whyWeAsk.aria", "لماذا نسأل؟")}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full
                     text-muted-foreground/70 hover:text-primary hover:bg-primary/10
                     transition-colors focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Info className="w-3.5 h-3.5" strokeWidth={2.2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="max-w-[260px] p-3 rounded-2xl border-primary/20"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80 mb-1">
          {t("whyWeAsk.label", "لماذا نسأل؟")}
        </p>
        <p className="text-[12px] text-foreground leading-snug">
          {reason}
        </p>
      </PopoverContent>
    </Popover>
  );
});

export default WhyWeAsk;

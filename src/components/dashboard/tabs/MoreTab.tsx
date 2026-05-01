import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DoctorVisitPrepCard } from "@/components/dashboard/DoctorVisitPrepCard";
import { PartnerSummaryCard } from "@/components/dashboard/PartnerSummaryCard";
import { ContractionSummaryCard } from "@/components/dashboard/ContractionSummaryCard";
import { UsageStatsNudge } from "@/components/dashboard/UsageStatsNudge";
import { AppRatingCard } from "@/components/dashboard/AppRatingCard";
import { DynamicFAQ } from "@/components/DynamicFAQ";
import { ResetDataButton } from "@/components/ResetDataButton";
import { useDashboardData } from "@/hooks/useDashboardData";

/**
 * "More" tab — preparation, partner, FAQ, app actions.
 * Pregnancy-only and contraction-dependent cards self-hide.
 */
export const MoreTab = memo(function MoreTab() {
  const { t } = useTranslation();
  const { profile, isPregnant, dataCheck } = useDashboardData();

  return (
    <div className="space-y-4 sm:space-y-5 pb-6">
      {isPregnant && <DoctorVisitPrepCard />}
      {isPregnant && <PartnerSummaryCard />}
      {isPregnant && profile.pregnancyWeek >= 32 && dataCheck.hasContractions && <ContractionSummaryCard />}

      <UsageStatsNudge />
      <AppRatingCard />
      <DynamicFAQ />

      {/* Back to home */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          to="/"
          className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-primary/[0.04] p-4 hover:shadow-md hover:border-primary/30 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">
              {t("dashboardV2.moreTab.backHome")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("dashboardV2.moreTab.backHomeDesc")}
            </p>
          </div>
        </Link>
      </motion.div>

      {/* Danger zone: full dashboard reset */}
      {dataCheck.hasAnyData && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 space-y-2">
          <p className="text-sm font-bold text-foreground">
            {t("reset.dangerZone")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("reset.dangerZoneDesc")}
          </p>
          <ResetDataButton variant="outline" />
        </div>
      )}
    </div>
  );
});

export default MoreTab;

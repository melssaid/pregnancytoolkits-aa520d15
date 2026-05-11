import { memo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { LayoutDashboard, ChevronLeft, ChevronRight, Activity, Pill, Droplets } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

/**
 * Compact dashboard snapshot displayed at top of homepage.
 * Native-app pattern (Apple Health / Google Fit): summary card + CTA to full dashboard.
 */
const DashboardSnapshotCard = memo(function DashboardSnapshotCard() {
  const { t, i18n } = useTranslation();
  const { stats, week, isPregnant } = useDashboardData();
  const isRtl = i18n.language === "ar";
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  const todayKicks = stats?.dailyTracking?.todayKicks || 0;
  const vitamins = stats?.dailyTracking?.vitaminsTaken || 0;
  const water = stats?.dailyTracking?.waterGlasses || 0;

  const quickStats = [
    { icon: Activity, value: todayKicks, label: t("dashboard.kicks", "ركلات"), color: "hsl(340,55%,55%)" },
    { icon: Pill, value: vitamins, label: t("dashboard.vitamins", "فيتامين"), color: "hsl(280,45%,55%)" },
    { icon: Droplets, value: water, label: t("dashboard.water", "ماء"), color: "hsl(200,55%,55%)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[hsl(340,40%,88%)]/60 bg-gradient-to-br from-[hsl(340,55%,97%)] via-[hsl(320,40%,97%)] to-[hsl(290,40%,97%)] dark:from-[hsl(340,30%,12%)] dark:via-[hsl(320,25%,11%)] dark:to-[hsl(290,25%,11%)] dark:border-[hsl(340,25%,25%)]/60 shadow-[0_2px_14px_-4px_hsl(340_50%_55%_/_0.18)]"
    >
      {/* Decorative gradient blob */}
      <div className="pointer-events-none absolute -top-8 -end-8 w-32 h-32 rounded-full bg-gradient-to-br from-[hsl(340,60%,75%)]/30 to-transparent blur-2xl" />

      <Link
        to="/dashboard"
        className="relative block p-3.5 active:scale-[0.985] transition-transform"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(340,55%,55%)] to-[hsl(320,50%,50%)] flex items-center justify-center shadow-[0_2px_8px_-1px_hsl(340_50%_55%_/_0.4)] shrink-0">
              <LayoutDashboard className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-bold text-foreground leading-tight truncate" style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}>
                {t("dashboard.snapshotTitle", "لوحتي")}
              </h3>
              {isPregnant && week > 0 && (
                <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">
                  {t("dashboard.weekLabel", "الأسبوع")} {week}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[hsl(340,55%,45%)] dark:text-[hsl(340,50%,70%)] shrink-0">
            <span>{t("dashboard.openCta", "فتح")}</span>
            <Chevron className="w-3.5 h-3.5" strokeWidth={2.4} />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-card/70 dark:bg-card/40 backdrop-blur-sm border border-border/30"
              >
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: stat.color }} strokeWidth={2.2} />
                <div className="min-w-0 flex items-baseline gap-1">
                  <span className="text-[12px] font-extrabold text-foreground leading-none">{stat.value}</span>
                  <span className="text-[9.5px] text-muted-foreground leading-none truncate">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Link>
    </motion.div>
  );
});

export default DashboardSnapshotCard;

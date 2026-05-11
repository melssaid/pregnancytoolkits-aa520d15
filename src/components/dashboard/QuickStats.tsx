import { motion } from "framer-motion";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface QuickStatsProps {
  weight?: number;
  height?: number;
  kicks?: number;
  mood?: string;
  waterGlasses?: number;
  nextAppointment?: string;
}

function calcBMI(weight: number, heightCm: number) {
  if (!weight || !heightCm || heightCm < 100) return null;
  const hm = heightCm / 100;
  return Math.round((weight / (hm * hm)) * 10) / 10;
}

export function QuickStats({ 
  weight = 0, 
  height = 0,
  kicks = 0, 
  mood = "",
  waterGlasses = 0,
  nextAppointment
}: QuickStatsProps) {
  const { t } = useTranslation();
  const bmi = calcBMI(weight, height);

  const stats = [
    {
      id: "weight",
      labelKey: "dashboard.quickStats.weight",
      value: weight > 0 ? `${weight}` : "—",
      unit: weight > 0 ? "kg" : "",
      href: "/tools/weight-gain",
      color: "text-primary",
    },
    {
      id: "kicks",
      labelKey: "dashboard.quickStats.kicksToday",
      value: kicks > 0 ? String(kicks) : "—",
      unit: "",
      href: "/tools/kick-counter",
      color: "text-primary",
    },
    {
      id: "mood",
      labelKey: "dashboard.quickStats.mood",
      value: mood ? t(`dashboard.quickStats.moods.${mood.toLowerCase()}`, mood) : "—",
      unit: "",
      href: "/tools/mental-health-coach",
      color: "text-destructive",
    },
    {
      id: "water",
      labelKey: "dashboard.quickStats.water",
      value: `${waterGlasses}/8`,
      unit: "",
      href: "#hydration-tracker",
      color: "text-primary",
    },
  ];

  return (
    <section
      aria-label={t("dashboard.quickStats.title", "Quick stats")}
      className="space-y-2"
    >
      {/* Row layout — value + label on one line, no breakage on 320px */}
      <ul role="list" className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-1.5">
        {stats.map((stat, i) => {
          const label = t(stat.labelKey);
          const valueText = stat.value === "—" ? t("common.noData", "no data") : `${stat.value}${stat.unit ? ` ${stat.unit}` : ""}`;
          return (
            <li key={stat.id}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <Link
                  to={stat.href}
                  aria-label={`${label}: ${valueText}`}
                  className="tool-card-pro group flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl bg-gradient-to-br from-card to-card/60 border border-border/40 hover:border-primary/40 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <p className="text-[14px] text-foreground font-bold leading-snug flex-1 min-w-0 break-words" style={{ overflowWrap: "anywhere" }}>
                    {label}
                  </p>
                  <p aria-hidden="true" className={`text-lg font-extrabold leading-none tabular-nums flex-shrink-0 group-hover:scale-105 transition-transform ${stat.color}`}>
                    {stat.value}
                    {stat.unit && <span className="text-[11px] font-medium text-muted-foreground ms-0.5">{stat.unit}</span>}
                  </p>
                </Link>
              </motion.div>
            </li>
          );
        })}
      </ul>

      {/* BMI + Appointment row */}
      {(bmi !== null || nextAppointment) && (
        <div className="flex gap-1.5">
          {bmi !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex-1"
            >
              <Link
                to="/settings"
                className="flex flex-col p-3.5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-all group"
              >
                <p className="text-[13px] text-foreground font-bold">{t("dashboard.quickStats.bmi", "BMI")}</p>
                <p className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-none mt-1.5">
                  {bmi}
                  <span className={`text-[12px] font-semibold ms-1.5 ${
                    bmi < 18.5 ? 'text-primary' : bmi < 25 ? 'text-emerald-600' : bmi < 30 ? 'text-amber-600' : 'text-destructive'
                  }`}>
                    {bmi < 18.5
                      ? t("settings.profile.bmi.underweight", "↓")
                      : bmi < 25
                      ? "✓"
                      : bmi < 30
                      ? t("settings.profile.bmi.overweight", "↑")
                      : t("settings.profile.bmi.obese", "↑↑")}
                  </span>
                </p>
              </Link>
            </motion.div>
          )}

          {nextAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-1"
            >
              <Link
                to="/tools/ai-meal-suggestion"
                className="flex flex-col p-3.5 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all group"
              >
                <p className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors leading-snug whitespace-normal break-words">
                  {t("dashboard.quickStats.nextAppointment")}
                </p>
                <p className="text-[12px] text-foreground/85 font-medium whitespace-normal break-words mt-1">{nextAppointment}</p>
              </Link>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
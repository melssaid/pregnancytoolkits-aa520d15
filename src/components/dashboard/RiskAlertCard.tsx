import { memo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BookmarkPlus, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { ContextualWarningBanner } from "@/components/safety";
import { getUserId } from "@/hooks/useSupabase";
import { haptic } from "@/lib/haptics";
import { safeSaveToLocalStorage, safeParseLocalStorage } from "@/lib/safeStorage";

interface RiskAlertCardProps {
  bloodPressure?: string;
  todayKicks: number;
  week: number;
}

interface Alert {
  level: "info" | "warning" | "urgent";
  message: string;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function safeJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function buildAlerts(
  t: (key: string, defaultValue?: string) => any,
  week: number,
  todayKicks: number,
  bloodPressure?: string
): Alert[] {
  const alerts: Alert[] = [];
  const today = getToday();
  const userId = getUserId();

  // ── 1. Blood Pressure ──
  if (bloodPressure) {
    const [sys, dia] = bloodPressure.split("/").map(Number);
    if (sys > 140 || dia > 90) {
      alerts.push({ level: "urgent", message: t("safety.banners.highBP", "ضغط الدم مرتفع — تواصلي مع طبيبتك فوراً") });
    } else if (sys < 90 || dia < 60) {
      alerts.push({ level: "warning", message: t("safety.banners.lowBP", "ضغط الدم منخفض — احرصي على شرب السوائل والراحة") });
    }
  }

  // ── 2. Low Kick Count (≥28 weeks) ──
  if (week >= 28 && todayKicks > 0 && todayKicks < 10) {
    alerts.push({ level: "warning", message: t("safety.banners.lowKicks", "عدد الركلات أقل من 10 اليوم — راقبي الحركة وتواصلي مع الطبيبة") });
  }

  // ── 3. Weight Trend ──
  try {
    const weightLogs = safeJSON<any[]>(`weight_logs_${userId}`, []);
    if (weightLogs.length >= 2) {
      const sorted = [...weightLogs].sort((a, b) => new Date(b.date || b.logged_at).getTime() - new Date(a.date || a.logged_at).getTime());
      const latest = sorted[0]?.weight;
      const prev = sorted[1]?.weight;
      if (latest && prev) {
        const diff = latest - prev;
        if (diff > 2) {
          alerts.push({ level: "warning", message: t("smartAlerts.rapidWeightGain", "زيادة سريعة في الوزن (+{{kg}} كجم) — استشيري طبيبتك").replace("{{kg}}", diff.toFixed(1)) });
        } else if (diff < -1.5) {
          alerts.push({ level: "info", message: t("smartAlerts.weightLoss", "انخفاض في الوزن — تأكدي من تغذيتك وشرب السوائل") });
        }
      }
    }
  } catch { /* ignore */ }

  // ── 4. Hydration ──
  try {
    const waterLogs = safeJSON<any[]>(`water_logs_${userId}`, []);
    const todayWater = waterLogs.filter((l: any) => l.date?.startsWith(today));
    const glasses = todayWater.reduce((sum: number, l: any) => sum + (l.glasses || 1), 0);
    const hour = new Date().getHours();
    if (hour >= 14 && glasses < 3) {
      alerts.push({ level: "info", message: t("smartAlerts.lowHydration", "لم تشربي كمية كافية من الماء اليوم — حاولي شرب المزيد 💧") });
    }
  } catch { /* ignore */ }

  // ── 5. Mood Check ──
  try {
    const symptomLogs = safeJSON<any[]>("quick_symptom_logs", []);
    const todayLog = symptomLogs.find((l: any) => l.date === today);
    if (todayLog?.mood && todayLog.mood <= 2) {
      alerts.push({ level: "info", message: t("smartAlerts.lowMood", "مزاجك منخفض اليوم — تذكري أنكِ تقومين بعمل رائع 💗 لا تترددي في طلب الدعم") });
    }
  } catch { /* ignore */ }

  // ── 6. No Vitamin Logged Today ──
  try {
    const vitaminLogsRaw = localStorage.getItem('vitamin-tracker-logs');
    if (vitaminLogsRaw) {
      const vitaminObj = JSON.parse(vitaminLogsRaw);
      const todayVitamins = Object.keys(vitaminObj[today] || {});
      const hour = new Date().getHours();
      if (hour >= 12 && todayVitamins.length === 0 && Object.keys(vitaminObj).length > 0) {
        alerts.push({ level: "info", message: t("smartAlerts.noVitaminToday", "لم تسجلي تناول الفيتامينات اليوم — لا تنسي مكملاتك 💊") });
      }
    }
  } catch { /* ignore */ }

  // ── 7. Severe Symptoms ──
  try {
    const symptomLogs = safeJSON<any[]>("quick_symptom_logs", []);
    const todayLog = symptomLogs.find((l: any) => l.date === today);
    const severeSymptoms = ["swelling", "dizziness", "headache"];
    const todaySymptoms: string[] = todayLog?.symptoms || [];
    const hasSevere = todaySymptoms.filter(s => severeSymptoms.includes(s));
    if (hasSevere.length >= 2 && week >= 20) {
      alerts.push({
        level: "warning",
        message: t("smartAlerts.preeclampsiaSigns", "تعانين من تورم ودوخة/صداع معاً — هذه قد تكون علامات تسمم حمل، تواصلي مع طبيبتك"),
      });
    }
  } catch { /* ignore */ }

  // ── 8. No kicks logged (≥28 weeks, afternoon) ──
  if (week >= 28 && todayKicks === 0 && new Date().getHours() >= 16) {
    alerts.push({ level: "info", message: t("smartAlerts.noKicksToday", "لم تسجلي حركة الجنين اليوم — خصصي وقتاً لمراقبة الركلات") });
  }

  return alerts;
}

export const RiskAlertCard = memo(function RiskAlertCard({ bloodPressure, todayKicks, week }: RiskAlertCardProps) {
  const { t } = useTranslation();

  const [alerts, setAlerts] = useState<Alert[]>(() => buildAlerts(t as any, week, todayKicks, bloodPressure));

  const refresh = useCallback(() => {
    setAlerts(buildAlerts(t as any, week, todayKicks, bloodPressure));
  }, [t, week, todayKicks, bloodPressure]);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  if (alerts.length === 0) return null;

  const saveToJournal = (alert: Alert) => {
    haptic("tap");
    try {
      const key = "appointment_notes_v1";
      const existing = safeParseLocalStorage<Array<{ id: string; date: string; note: string; level: string }>>(
        key, [], (d): d is any => Array.isArray(d),
      );
      existing.unshift({
        id: `risk-${Date.now()}`,
        date: new Date().toISOString(),
        note: alert.message,
        level: alert.level,
      });
      safeSaveToLocalStorage(key, existing.slice(0, 50));
      toast.success(t("riskAlert.savedToJournal", "تم الحفظ في سجل الزيارة"));
    } catch {
      toast.error(t("common.saveError", "تعذّر الحفظ"));
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const showCTAs = alert.level !== "info";
        return (
          <div key={`${alert.level}-${i}`} className="space-y-1.5">
            <ContextualWarningBanner level={alert.level} message={alert.message} />
            {showCTAs && (
              <div className="flex items-center gap-2 ps-1">
                <button
                  type="button"
                  onClick={() => saveToJournal(alert)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                             text-[11px] font-bold text-foreground bg-background/70
                             border border-border/50 hover:bg-background active:scale-[0.97]
                             transition-all"
                >
                  <BookmarkPlus className="w-3 h-3" strokeWidth={2.4} />
                  {t("riskAlert.saveToJournal", "احفظي في السجل")}
                </button>
                <Link
                  to="/tools/doctor-visit-prep"
                  onClick={() => haptic("tap")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                             text-[11px] font-bold text-primary-foreground
                             bg-gradient-to-r from-primary to-accent active:scale-[0.97]
                             transition-all shadow-[0_2px_8px_-3px_hsl(var(--primary)/0.4)]"
                >
                  <Stethoscope className="w-3 h-3" strokeWidth={2.4} />
                  {t("riskAlert.contactDoctor", "تواصلي مع الطبيبة")}
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

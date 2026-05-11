import { readKickSessions, writeKickSessions } from "@/lib/kickSessionsStore";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  Sparkles,
  Heart,
  Baby,
  Stethoscope,
  Droplet,
  Activity,
  Scale,
  Pill,
  ShoppingBag,
  Camera,
  ListChecks,
  Filter,
  CalendarClock,
  CalendarHeart,
  Briefcase,
  Bone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { safeParseLocalStorage, safeSaveToLocalStorage } from "@/lib/safeStorage";
import { formatLocalized } from "@/lib/dateLocale";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

/**
 * ResultsArchiveCalendar — v2 (Professional Calendar)
 * --------------------------------------------------------------
 * يجمع كل بيانات المستخدم من 12 مصدراً عبر التطبيق، يصنّفها حسب
 * الشهر، ويعرض:
 *   • شبكة أيام شهرية بنقاط نشاط (heatmap-lite)
 *   • فلترة حسب نوع المصدر
 *   • إحصائيات شهرية موجزة
 *   • عرض/حذف لكل سجل
 * --------------------------------------------------------------
 */

type Source =
  | "saved"
  | "weekly"
  | "birthPlan"
  | "wellness"
  | "babyGrowth"
  | "kicks"
  | "contractions"
  | "weight"
  | "vitamins"
  | "diaper"
  | "symptoms"
  | "groceries"
  | "appointments"
  | "dueDates"
  | "hospitalBag"
  | "backPain";

interface ArchivedResult {
  id: string;
  toolId: string;
  toolName: string;
  date: string; // ISO
  preview: string;
  content: string;
  href: string;
  source: Source;
}

const SOURCE_META: Record<Source, { icon: any; color: string; tone: string }> = {
  saved: { icon: Sparkles, color: "text-primary", tone: "bg-primary/10" },
  weekly: { icon: FileText, color: "text-violet-500", tone: "bg-violet-500/10" },
  birthPlan: { icon: Heart, color: "text-rose-500", tone: "bg-rose-500/10" },
  wellness: { icon: Stethoscope, color: "text-done", tone: "bg-[hsl(var(--success-soft))]/100" },
  babyGrowth: { icon: Baby, color: "text-amber-500", tone: "bg-amber-500/10" },
  kicks: { icon: Activity, color: "text-pink-500", tone: "bg-pink-500/10" },
  contractions: { icon: Activity, color: "text-red-500", tone: "bg-red-500/10" },
  weight: { icon: Scale, color: "text-blue-500", tone: "bg-blue-500/10" },
  vitamins: { icon: Pill, color: "text-orange-500", tone: "bg-orange-500/10" },
  diaper: { icon: Baby, color: "text-cyan-500", tone: "bg-cyan-500/10" },
  symptoms: { icon: Stethoscope, color: "text-fuchsia-500", tone: "bg-fuchsia-500/10" },
  groceries: { icon: ShoppingBag, color: "text-lime-500", tone: "bg-lime-500/10" },
  appointments: { icon: CalendarClock, color: "text-indigo-500", tone: "bg-indigo-500/10" },
  dueDates: { icon: CalendarHeart, color: "text-rose-400", tone: "bg-rose-400/10" },
  hospitalBag: { icon: Briefcase, color: "text-violet-500", tone: "bg-violet-500/10" },
  backPain: { icon: Bone, color: "text-teal-500", tone: "bg-teal-500/10" },
};

const sourceLabel = (s: Source, t: (k: string, d?: string) => string): string => {
  const map: Record<Source, [string, string]> = {
    saved: ["dashboard.archive.src.saved", "محفوظات AI"],
    weekly: ["dashboard.archive.src.weekly", "ملخص أسبوعي"],
    birthPlan: ["dashboard.archive.src.birthPlan", "خطة ولادة"],
    wellness: ["dashboard.archive.src.wellness", "يوميات عافية"],
    babyGrowth: ["dashboard.archive.src.babyGrowth", "نمو الطفل"],
    kicks: ["dashboard.archive.src.kicks", "حركات الجنين"],
    contractions: ["dashboard.archive.src.contractions", "انقباضات"],
    weight: ["dashboard.archive.src.weight", "الوزن"],
    vitamins: ["dashboard.archive.src.vitamins", "فيتامينات"],
    diaper: ["dashboard.archive.src.diaper", "حفاضات"],
    symptoms: ["dashboard.archive.src.symptoms", "أعراض"],
    groceries: ["dashboard.archive.src.groceries", "قائمة تسوق"],
    appointments: ["dashboard.archive.src.appointments", "مواعيد"],
    dueDates: ["dashboard.archive.src.dueDates", "موعد الولادة"],
    hospitalBag: ["dashboard.archive.src.hospitalBag", "حقيبة المستشفى"],
    backPain: ["dashboard.archive.src.backPain", "تمارين الظهر"],
  };
  const [k, d] = map[s];
  return t(k, d);
};

// Map a saved-result toolId to its actual tool route.
const SAVED_TOOL_ROUTES: Record<string, string> = {
  "weekly-summary": "/tools/weekly-summary",
  "ai-birth-plan": "/tools/ai-birth-plan",
  "wellness-diary": "/tools/wellness-diary",
  "baby-growth": "/tools/baby-growth",
  "kick-counter": "/tools/kick-counter",
  "contraction-timer": "/tools/contraction-timer",
  "weight-gain": "/tools/weight-gain",
  "vitamin-tracker": "/tools/vitamin-tracker",
  "diaper-tracker": "/tools/diaper-tracker",
  "smart-grocery-list": "/tools/smart-grocery-list",
  "ai-hospital-bag": "/tools/ai-hospital-bag",
  "ai-meal-suggestion": "/tools/ai-meal-suggestion",
  "ai-fitness-coach": "/tools/ai-fitness-coach",
  "ai-symptom-analyzer": "/tools/ai-symptom-analyzer",
  "ai-back-pain-relief": "/tools/ai-back-pain-relief",
  "ai-craving-alternatives": "/tools/ai-craving-alternatives",
  "ai-lactation-prep": "/tools/ai-lactation-prep",
  "ai-partner-guide": "/tools/ai-partner-guide",
  "ai-birth-position": "/tools/ai-birth-position",
  "ai-pregnancy-skincare": "/tools/ai-pregnancy-skincare",
  "ai-bump-photos": "/tools/ai-bump-photos",
  "smart-pregnancy-plan": "/tools/smart-pregnancy-plan",
  "smart-kick-counter": "/tools/kick-counter",
  "smart-weight-gain": "/tools/weight-gain",
  "smart-appointment-reminder": "/tools/smart-appointment-reminder",
  "pregnancy-assistant": "/tools/pregnancy-assistant",
  "pregnancy-comfort": "/tools/pregnancy-comfort",
  "postpartum-mental-health": "/tools/postpartum-mental-health-coach",
  "due-date-calculator": "/tools/due-date-calculator",
  "cycle-tracker": "/tools/cycle-tracker",
};

const resolveSavedHref = (toolId?: string): string => {
  if (!toolId) return "/dashboard";
  if (SAVED_TOOL_ROUTES[toolId]) return SAVED_TOOL_ROUTES[toolId];
  // Fallback: try the conventional /tools/<toolId> path.
  return `/tools/${toolId}`;
};

const hrefFor: Record<Source, string> = {
  saved: "/dashboard", // fallback; per-record href is computed in collectAllResults
  weekly: "/tools/weekly-summary",
  birthPlan: "/tools/ai-birth-plan",
  wellness: "/tools/wellness-diary",
  babyGrowth: "/tools/baby-growth",
  kicks: "/tools/kick-counter",
  contractions: "/tools/contraction-timer",
  weight: "/tools/weight-gain",
  vitamins: "/tools/vitamin-tracker",
  diaper: "/tools/diaper-tracker",
  symptoms: "/tools/wellness-diary",
  groceries: "/tools/smart-grocery-list",
  appointments: "/tools/smart-appointment-reminder",
  dueDates: "/tools/due-date-calculator",
  hospitalBag: "/tools/ai-hospital-bag",
  backPain: "/tools/ai-back-pain-relief",
};

function collectAllResults(t: (k: string, d?: string) => string): ArchivedResult[] {
  const out: ArchivedResult[] = [];
  const safe = (key: string) => safeParseLocalStorage<any[]>(key, [], (d): d is any[] => Array.isArray(d));

  // 1) Unified saved
  safe("ai-saved-results").forEach((r) => {
    const toolId = r.toolId || "saved";
    out.push({
      id: r.id, toolId,
      toolName: r.title || sourceLabel("saved", t),
      date: r.savedAt,
      preview: (r.content || "").replace(/[#*_\n]/g, " ").slice(0, 120),
      content: r.content || "", href: resolveSavedHref(r.toolId), source: "saved",
    });
  });

  // 2) Weekly summaries
  safe("weekly-summary-data").forEach((w) => {
    out.push({
      id: "weekly-" + w.generatedAt, toolId: "weekly-summary",
      toolName: `${sourceLabel("weekly", t)} — ${t("dashboard.recentResults.week", "Week")} ${w.week}`,
      date: w.generatedAt,
      preview: (w.content || "").replace(/[#*_\n]/g, " ").slice(0, 120),
      content: w.content || "", href: hrefFor.weekly, source: "weekly",
    });
  });

  // 3) Birth plans
  safe("birthPlans").forEach((p) => {
    out.push({
      id: "plan-" + p.id, toolId: "ai-birth-plan", toolName: sourceLabel("birthPlan", t),
      date: p.date,
      preview: (p.generatedPlan || "").replace(/[#*_\n]/g, " ").slice(0, 120),
      content: p.generatedPlan || "", href: hrefFor.birthPlan, source: "birthPlan",
    });
  });

  // 4) Wellness diary
  safe("wellness-diary-entries")
    .filter((e) => e.aiInsight && e.aiInsight.length > 10)
    .forEach((e) => {
      out.push({
        id: "wellness-" + e.id, toolId: "wellness-diary", toolName: sourceLabel("wellness", t),
        date: e.date,
        preview: (e.aiInsight || "").replace(/[#*_\n]/g, " ").slice(0, 120),
        content: e.aiInsight || "", href: hrefFor.wellness, source: "wellness",
      });
    });

  // 5) Baby growth
  safe("baby-growth-entries").forEach((g) => {
    out.push({
      id: "grow-" + g.id, toolId: "baby-growth", toolName: sourceLabel("babyGrowth", t),
      date: g.date,
      preview: `${g.weight}kg / ${g.height}cm — ${t("dashboard.recentResults.month", "Month")} ${g.ageMonths}`,
      content: `Weight: ${g.weight}kg\nHeight: ${g.height}cm\nAge: ${g.ageMonths} months`,
      href: hrefFor.babyGrowth, source: "babyGrowth",
    });
  });

  // 6) Kick sessions — unified canonical store
  const userId = (() => {
    try { return localStorage.getItem("pregnancy_user_id"); } catch { return null; }
  })();
  readKickSessions().filter((k: any) => k.ended_at).forEach((k: any) => {
    out.push({
      id: "kick-" + k.id, toolId: "kick-counter", toolName: sourceLabel("kicks", t),
      date: k.started_at,
      preview: `${k.total_kicks} ${t("dashboard.archive.kicks", "حركة")} • ${k.duration_minutes ?? 0} min`,
      content: `Total: ${k.total_kicks}\nDuration: ${k.duration_minutes ?? 0} min\nNotes: ${k.notes || "-"}`,
      href: hrefFor.kicks, source: "kicks",
    });
  });
  if (userId) {
    safe(`vitamin_logs_${userId}`).forEach((v) => {
      out.push({
        id: "vit-" + v.id, toolId: "vitamin-tracker", toolName: sourceLabel("vitamins", t),
        date: v.taken_at,
        preview: `${v.vitamin_name}${v.dosage ? " — " + v.dosage : ""}`,
        content: `${v.vitamin_name}\n${v.dosage || ""}`,
        href: hrefFor.vitamins, source: "vitamins",
      });
    });
  }

  // 7) Contractions
  safe("contraction_timer_data").forEach((c, i) => {
    if (!c.startTime) return;
    out.push({
      id: "ctn-" + (c.id || i + "-" + c.startTime), toolId: "contraction-timer", toolName: sourceLabel("contractions", t),
      date: new Date(c.startTime).toISOString(),
      preview: `${t("dashboard.archive.duration", "مدة")}: ${c.duration ?? "-"}s`,
      content: `Start: ${c.startTime}\nDuration: ${c.duration ?? "-"}s\nIntensity: ${c.intensity ?? "-"}`,
      href: hrefFor.contractions, source: "contractions",
    });
  });

  // 8) Weight entries
  safe("weight_gain_entries").forEach((w, i) => {
    out.push({
      id: "w-" + (w.id || i), toolId: "weight-gain", toolName: sourceLabel("weight", t),
      date: w.date || new Date().toISOString(),
      preview: `${w.weight}kg • ${t("dashboard.recentResults.week", "Week")} ${w.week ?? "-"}`,
      content: `Weight: ${w.weight}kg\nWeek: ${w.week ?? "-"}`,
      href: hrefFor.weight, source: "weight",
    });
  });

  // 9) Diaper entries
  safe("diaperEntries").forEach((d, i) => {
    out.push({
      id: "dp-" + (d.id || i), toolId: "diaper-tracker", toolName: sourceLabel("diaper", t),
      date: d.timestamp || d.date || new Date().toISOString(),
      preview: `${d.type || "-"}${d.notes ? " • " + d.notes.slice(0, 40) : ""}`,
      content: `Type: ${d.type || "-"}\nNotes: ${d.notes || "-"}`,
      href: hrefFor.diaper, source: "diaper",
    });
  });

  // 10) Symptom logs
  safe("quick_symptom_logs").forEach((s, i) => {
    const sym = Array.isArray(s.symptoms) ? s.symptoms.join(", ") : (s.symptom || "-");
    out.push({
      id: "sym-" + (s.id || i + "-" + s.date), toolId: "symptoms", toolName: sourceLabel("symptoms", t),
      date: s.date || s.loggedAt || new Date().toISOString(),
      preview: sym.slice(0, 100),
      content: sym,
      href: hrefFor.symptoms, source: "symptoms",
    });
  });

  // 11) Appointments (per-user key written by supabaseServices)
  if (userId) {
    safe(`appointments_${userId}`).forEach((a, i) => {
      const when = a.appointment_date || a.date || a.scheduled_for || a.created_at;
      if (!when) return;
      const title = a.title || a.doctor_name || a.type || t("dashboard.archive.src.appointments", "موعد");
      const note = a.notes || a.location || "";
      out.push({
        id: "appt-" + (a.id || i + "-" + when),
        toolId: "smart-appointment-reminder",
        toolName: sourceLabel("appointments", t),
        date: new Date(when).toISOString(),
        preview: `${title}${note ? " • " + String(note).slice(0, 60) : ""}`,
        content: `${title}\n${note}`,
        href: hrefFor.appointments,
        source: "appointments",
      });
    });
  }
  // Legacy non-scoped appointments key (used by MedicalSummaryCard reads)
  safe("appointments").forEach((a, i) => {
    const when = a.appointment_date || a.date || a.scheduled_for || a.created_at;
    if (!when) return;
    const title = a.title || a.doctor_name || a.type || t("dashboard.archive.src.appointments", "موعد");
    out.push({
      id: "appt-legacy-" + (a.id || i + "-" + when),
      toolId: "smart-appointment-reminder",
      toolName: sourceLabel("appointments", t),
      date: new Date(when).toISOString(),
      preview: `${title}${a.notes ? " • " + String(a.notes).slice(0, 60) : ""}`,
      content: `${title}\n${a.notes || ""}`,
      href: hrefFor.appointments,
      source: "appointments",
    });
  });

  // 12) Saved due-date calculations
  safe("savedDueDates").forEach((d, i) => {
    const when = d.savedAt || d.date || d.createdAt;
    if (!when) return;
    out.push({
      id: "due-" + (d.id || i + "-" + when),
      toolId: "due-date-calculator",
      toolName: sourceLabel("dueDates", t),
      date: new Date(when).toISOString(),
      preview: `${t("dashboard.archive.dueDate", "موعد متوقع")}: ${
        d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "-"
      }`,
      content: `Method: ${d.method || "-"}\nLMP: ${d.lmp || "-"}\nDue: ${d.dueDate || "-"}`,
      href: hrefFor.dueDates,
      source: "dueDates",
    });
  });

  // 13) Hospital bag items (snapshot per checked item)
  safe("hospital-bag-items")
    .filter((b) => b && (b.checked || b.packed) && (b.checkedAt || b.updatedAt || b.addedAt))
    .forEach((b, i) => {
      const when = b.checkedAt || b.updatedAt || b.addedAt;
      out.push({
        id: "bag-" + (b.id || i + "-" + when),
        toolId: "ai-hospital-bag",
        toolName: sourceLabel("hospitalBag", t),
        date: new Date(when).toISOString(),
        preview: `✓ ${b.name || b.label || b.item || "item"}`,
        content: `${b.name || b.label || b.item}\n${b.category || ""}`,
        href: hrefFor.hospitalBag,
        source: "hospitalBag",
      });
    });

  // 14) Back-pain exercises completed today (snapshot)
  try {
    const lastDate = localStorage.getItem("backPainLastDate");
    const completed = safeParseLocalStorage<string[]>(
      "backPainCompletedToday",
      [],
      (d): d is string[] => Array.isArray(d)
    );
    if (lastDate && completed.length > 0) {
      out.push({
        id: "backpain-" + lastDate,
        toolId: "ai-back-pain-relief",
        toolName: sourceLabel("backPain", t),
        date: new Date(lastDate).toISOString(),
        preview: `✓ ${completed.length} ${t("dashboard.archive.exercises", "تمرين")}`,
        content: completed.join("\n"),
        href: hrefFor.backPain,
        source: "backPain",
      });
    }
  } catch {}

  return out
    .filter((r) => r.date && !isNaN(new Date(r.date).getTime()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function deleteResult(item: ArchivedResult) {
  try {
    const userId = localStorage.getItem("pregnancy_user_id");
    const filter = (key: string, predicate: (r: any) => boolean) => {
      const arr = safeParseLocalStorage<any[]>(key, [], (d): d is any[] => Array.isArray(d));
      safeSaveToLocalStorage(key, arr.filter((r) => !predicate(r)));
    };
    switch (item.source) {
      case "saved": filter("ai-saved-results", (r) => r.id === item.id); break;
      case "weekly": filter("weekly-summary-data", (r) => "weekly-" + r.generatedAt === item.id); break;
      case "birthPlan": filter("birthPlans", (r) => "plan-" + r.id === item.id); break;
      case "wellness": filter("wellness-diary-entries", (r) => "wellness-" + r.id === item.id); break;
      case "babyGrowth": filter("baby-growth-entries", (r) => "grow-" + r.id === item.id); break;
      case "kicks": {
        const remaining = readKickSessions().filter((r: any) => "kick-" + r.id !== item.id);
        writeKickSessions(remaining);
        break;
      }
      case "vitamins": if (userId) filter(`vitamin_logs_${userId}`, (r) => "vit-" + r.id === item.id); break;
      case "weight": filter("weight_gain_entries", (r) => "w-" + r.id === item.id); break;
      case "diaper": filter("diaperEntries", (r) => "dp-" + r.id === item.id); break;
      case "symptoms": filter("quick_symptom_logs", (r) => "sym-" + r.id === item.id); break;
      case "contractions": filter("contraction_timer_data", (r) => "ctn-" + r.id === item.id); break;
      case "appointments":
        if (item.id.startsWith("appt-legacy-")) {
          filter("appointments", (r) => "appt-legacy-" + (r.id || "") === item.id || ("appt-legacy-" + r.id + "-" + (r.appointment_date || r.date || r.scheduled_for || r.created_at)) === item.id);
        } else if (userId) {
          filter(`appointments_${userId}`, (r) => "appt-" + (r.id || "") === item.id || ("appt-" + r.id + "-" + (r.appointment_date || r.date || r.scheduled_for || r.created_at)) === item.id);
        }
        break;
      case "dueDates":
        filter("savedDueDates", (r) => "due-" + (r.id || "") === item.id || ("due-" + r.id + "-" + (r.savedAt || r.date || r.createdAt)) === item.id);
        break;
      case "hospitalBag":
        filter("hospital-bag-items", (r) => "bag-" + (r.id || "") === item.id || ("bag-" + r.id + "-" + (r.checkedAt || r.updatedAt || r.addedAt)) === item.id);
        break;
      case "backPain":
        try {
          localStorage.removeItem("backPainCompletedToday");
          localStorage.removeItem("backPainLastDate");
        } catch {}
        break;
    }
  } catch {}
}

export function ResultsArchiveCalendar() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [expanded, setExpanded] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Source | "all">("all");
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  const tHelper = (k: string, d?: string) => t(k, d ?? k) as string;
  const all = useMemo(() => collectAllResults(tHelper), [t, tick]);

  const monthGroups = useMemo(() => {
    const map = new Map<string, ArchivedResult[]>();
    all.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return map;
  }, [all]);

  const availableMonths = useMemo(
    () => Array.from(monthGroups.keys()).sort((a, b) => b.localeCompare(a)),
    [monthGroups]
  );

  if (availableMonths.length === 0) return null;

  const safeOffset = Math.max(0, Math.min(monthOffset, availableMonths.length - 1));
  const activeMonthKey = availableMonths[safeOffset];
  const [year, month] = activeMonthKey.split("-").map(Number);
  const activeDate = new Date(year, month, 1);
  const monthLabel = formatLocalized(activeDate, "MMMM yyyy", i18n.language);
  const allMonthResults = monthGroups.get(activeMonthKey) || [];

  // Filter & day-filter
  const filteredResults = allMonthResults
    .filter((r) => filter === "all" || r.source === filter)
    .filter((r) => activeDay === null || new Date(r.date).getDate() === activeDay);

  // Build day grid for the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const dayActivity = new Map<number, number>();
  allMonthResults.forEach((r) => {
    const d = new Date(r.date).getDate();
    dayActivity.set(d, (dayActivity.get(d) || 0) + 1);
  });

  // Per-source counts (for filter chips)
  const sourceCounts = new Map<Source, number>();
  allMonthResults.forEach((r) => sourceCounts.set(r.source, (sourceCounts.get(r.source) || 0) + 1));
  const activeSources = Array.from(sourceCounts.keys());

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const weekdayLabels = isRtl
    ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
    : ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm">
      <CardContent className="p-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between gap-2"
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div className="text-start">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {t("dashboard.archive.title", "أرشيف نتائجي")}
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{all.length}</Badge>
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {t("dashboard.archive.subtitle", "{{count}} نتيجة عبر {{months}} شهراً", {
                  count: all.length,
                  months: availableMonths.length,
                })}
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {/* Month selector */}
              <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-primary/5 via-primary/[0.08] to-primary/5 rounded-2xl p-2.5">
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl"
                  onClick={() => { setMonthOffset((o) => Math.min(availableMonths.length - 1, o + 1)); setActiveDay(null); }}
                  disabled={safeOffset >= availableMonths.length - 1}
                  aria-label={t("dashboard.archive.prev", "Previous month")}
                >
                  <PrevIcon className="w-4 h-4" />
                </Button>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-foreground tracking-tight">{monthLabel}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("dashboard.archive.entriesCount", "{{count}} نتيجة", { count: allMonthResults.length })}
                  </p>
                </div>
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl"
                  onClick={() => { setMonthOffset((o) => Math.max(0, o - 1)); setActiveDay(null); }}
                  disabled={safeOffset <= 0}
                  aria-label={t("dashboard.archive.next", "Next month")}
                >
                  <NextIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* Day grid heatmap */}
              <div className="mt-3 p-2 rounded-2xl bg-muted/30">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekdayLabels.map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-semibold text-muted-foreground">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={"pad-" + i} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const count = dayActivity.get(day) || 0;
                    const isToday = isCurrentMonth && today.getDate() === day;
                    const selected = activeDay === day;
                    const intensity = count === 0 ? "bg-background/40 text-muted-foreground/40"
                      : count === 1 ? "bg-primary/20 text-primary"
                      : count < 4 ? "bg-primary/40 text-primary-foreground"
                      : "bg-primary text-primary-foreground";
                    return (
                      <button
                        key={day}
                        onClick={() => setActiveDay(selected ? null : count > 0 ? day : null)}
                        disabled={count === 0}
                        className={`aspect-square rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${intensity} ${
                          selected ? "ring-2 ring-primary ring-offset-1 ring-offset-background scale-110" : ""
                        } ${isToday ? "outline outline-1 outline-primary/60" : ""} ${count > 0 ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
                        aria-label={`${day} — ${count} entries`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {activeDay && (
                  <button
                    onClick={() => setActiveDay(null)}
                    className="mt-2 text-[10px] text-primary font-semibold hover:underline w-full text-center"
                  >
                    × {t("dashboard.archive.clearDay", "إظهار كل أيام الشهر")}
                  </button>
                )}
              </div>

              {/* Source filter chips */}
              {activeSources.length > 1 && (
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                  <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
                  <button
                    onClick={() => setFilter("all")}
                    className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                      filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t("dashboard.archive.all", "الكل")} ({allMonthResults.length})
                  </button>
                  {activeSources.map((s) => {
                    const meta = SOURCE_META[s];
                    const Icon = meta.icon;
                    const active = filter === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setFilter(active ? "all" : s)}
                        className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                          active ? "bg-primary text-primary-foreground" : `${meta.tone} ${meta.color} hover:opacity-80`
                        }`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {sourceLabel(s, tHelper)} ({sourceCounts.get(s)})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Results list */}
              <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pe-1">
                {filteredResults.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    {activeDay
                      ? t("dashboard.archive.emptyDay", "لا توجد نتائج في هذا اليوم")
                      : t("dashboard.archive.empty", "لا توجد نتائج هذا الشهر")}
                  </p>
                ) : (
                  filteredResults.map((r) => {
                    const meta = SOURCE_META[r.source];
                    const Icon = meta.icon;
                    return (
                      <div key={r.id} className="rounded-xl bg-muted/30 border border-border/30 overflow-hidden hover:border-primary/30 transition-colors">
                        <div className="flex items-start gap-2 p-2.5">
                          <div className={`w-8 h-8 rounded-lg ${meta.tone} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{r.toolName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatLocalized(r.date, "d MMM • HH:mm", i18n.language)}
                            </p>
                            <p className="text-[10px] text-muted-foreground/80 line-clamp-2 mt-0.5">{r.preview}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              size="sm" variant="ghost" className="h-6 text-[10px] px-2"
                              onClick={() => setOpenId(openId === r.id ? null : r.id)}
                            >
                              {openId === r.id
                                ? t("dashboard.archive.hide", "إخفاء")
                                : t("dashboard.archive.view", "عرض")}
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-6 px-2"
                              onClick={() => {
                                deleteResult(r);
                                setTick((n) => n + 1);
                                if (openId === r.id) setOpenId(null);
                              }}
                              aria-label={t("dashboard.archive.delete", "Delete")}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {openId === r.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-1 max-h-[260px] overflow-y-auto border-t border-border/30 bg-background/60">
                                <MarkdownRenderer content={r.content} />
                                <Link
                                  to={r.href}
                                  className="block text-center text-[11px] text-primary font-semibold mt-2 hover:underline"
                                >
                                  {t("dashboard.archive.openTool", "فتح الأداة")} →
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

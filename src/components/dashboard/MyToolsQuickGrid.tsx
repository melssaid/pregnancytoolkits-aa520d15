import { readKickSessions } from "@/lib/kickSessionsStore";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useOptimizedMotion } from "@/hooks/useOptimizedMotion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Scale,
  Pill,
  Baby,
  ShoppingBag,
  Briefcase,
  Stethoscope,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { safeParseLocalStorage } from "@/lib/safeStorage";

/**
 * MyToolsQuickGrid
 * --------------------------------------------------------------
 * شبكة بطاقات احترافية للأدوات الشخصية التي يدخل فيها المستخدم
 * بياناته يومياً، مع عرض آخر إدخال/عدد. تُربط مع التقويم الأرشيفي
 * (ResultsArchiveCalendar) لتوفير ملاحة سلسة.
 * --------------------------------------------------------------
 */

interface ToolItem {
  id: string;
  href: string;
  icon: any;
  labelKey: string;
  labelDefault: string;
  count: number;
  lastDate?: string;
  color: string;
  ring: string;
}

function getUserId(): string | null {
  try { return localStorage.getItem("pregnancy_user_id"); } catch { return null; }
}

function safeArr(key: string): any[] {
  return safeParseLocalStorage<any[]>(key, [], (d): d is any[] => Array.isArray(d));
}

function lastDateOf(arr: any[], dateField: string): string | undefined {
  if (!arr.length) return undefined;
  const sorted = [...arr]
    .map((r) => r[dateField])
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  return sorted[0];
}

export function MyToolsQuickGrid() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const m = useOptimizedMotion();

  const items = useMemo<ToolItem[]>(() => {
    const uid = getUserId();
    const kicks = readKickSessions().filter((k: any) => k.ended_at);
    const vits = uid ? safeArr(`vitamin_logs_${uid}`) : [];
    const contractions = safeArr("contraction_timer_data");
    const weights = safeArr("weight_gain_entries");
    const diapers = safeArr("diaperEntries");
    const groceries = safeArr("pregnancyGroceryList");
    const bag = safeArr("hospital-bag-items");
    const symptoms = safeArr("quick_symptom_logs");
    const wellness = safeArr("wellness-diary-entries");
    const birthPlans = safeArr("birthPlans");

    const list: ToolItem[] = [
      {
        id: "kicks", href: "/tools/kick-counter", icon: Activity,
        labelKey: "dashboard.myTools.kicks", labelDefault: "حركات الجنين",
        count: kicks.length, lastDate: lastDateOf(kicks, "started_at"),
        color: "text-pink-500", ring: "from-pink-500/15 to-pink-500/5",
      },
      {
        id: "contractions", href: "/tools/contraction-timer", icon: Heart,
        labelKey: "dashboard.myTools.contractions", labelDefault: "انقباضات",
        count: contractions.length, lastDate: lastDateOf(contractions, "startTime"),
        color: "text-red-500", ring: "from-red-500/15 to-red-500/5",
      },
      {
        id: "weight", href: "/tools/weight-gain", icon: Scale,
        labelKey: "dashboard.myTools.weight", labelDefault: "الوزن",
        count: weights.length, lastDate: lastDateOf(weights, "date"),
        color: "text-blue-500", ring: "from-blue-500/15 to-blue-500/5",
      },
      {
        id: "vitamins", href: "/tools/vitamin-tracker", icon: Pill,
        labelKey: "dashboard.myTools.vitamins", labelDefault: "فيتامينات",
        count: vits.length, lastDate: lastDateOf(vits, "taken_at"),
        color: "text-orange-500", ring: "from-orange-500/15 to-orange-500/5",
      },
      {
        id: "diaper", href: "/tools/diaper-tracker", icon: Baby,
        labelKey: "dashboard.myTools.diaper", labelDefault: "حفاضات الطفل",
        count: diapers.length, lastDate: lastDateOf(diapers, "timestamp") || lastDateOf(diapers, "date"),
        color: "text-cyan-500", ring: "from-cyan-500/15 to-cyan-500/5",
      },
      {
        id: "symptoms", href: "/tools/wellness-diary", icon: Stethoscope,
        labelKey: "dashboard.myTools.symptoms", labelDefault: "يوميات العافية",
        count: symptoms.length + wellness.length,
        lastDate: lastDateOf([...symptoms, ...wellness], "date"),
        color: "text-fuchsia-500", ring: "from-fuchsia-500/15 to-fuchsia-500/5",
      },
      {
        id: "grocery", href: "/tools/smart-grocery-list", icon: ShoppingBag,
        labelKey: "dashboard.myTools.grocery", labelDefault: "قائمة التسوق",
        count: groceries.length,
        color: "text-lime-500", ring: "from-lime-500/15 to-lime-500/5",
      },
      {
        id: "bag", href: "/tools/ai-hospital-bag", icon: Briefcase,
        labelKey: "dashboard.myTools.hospitalBag", labelDefault: "حقيبة المستشفى",
        count: bag.length,
        color: "text-violet-500", ring: "from-violet-500/15 to-violet-500/5",
      },
      {
        id: "birthPlan", href: "/tools/ai-birth-plan", icon: Sparkles,
        labelKey: "dashboard.myTools.birthPlan", labelDefault: "خطة الولادة",
        count: birthPlans.length, lastDate: lastDateOf(birthPlans, "date"),
        color: "text-rose-500", ring: "from-rose-500/15 to-rose-500/5",
      },
    ];

    // Show only items the user has interacted with (count > 0). If none, show top 4 as suggestions.
    const withData = list.filter((i) => i.count > 0);
    return withData.length > 0 ? withData : list.slice(0, 4);
  }, []);

  if (items.length === 0) return null;

  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.03]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2 tracking-tight">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="truncate">{t("dashboard.myTools.title", "أدواتي")}</span>
          </h3>
          <span className="text-[12px] font-medium text-muted-foreground truncate max-w-[55%] text-end">
            {t("dashboard.myTools.subtitle", "اضغطي لمتابعة بياناتك")}
          </span>
        </div>

        {/* Row layout — full label always visible, scales to 2 cols at 380px+ */}
        <ul
          role="list"
          aria-label={t("dashboard.myTools.title", "أدواتي")}
          className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2"
        >
          {items.map((it, i) => {
            const Icon = it.icon;
            const label = t(it.labelKey, it.labelDefault);
            return (
              <li key={it.id}>
                <motion.div
                  {...m.fadeUp(i)}
                  style={{ willChange: m.disabled ? "auto" : "transform, opacity" }}
                >
                  <Link
                    to={it.href}
                    aria-label={it.count > 0 ? `${label} (${it.count})` : label}
                    className={`tool-card-pro group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3.5 bg-gradient-to-br ${it.ring} border border-border/40 hover:border-primary/40 active:scale-[0.98] min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                  >
                    {/* Sheen on hover */}
                    <span aria-hidden className="pointer-events-none absolute -top-1/2 -end-1/2 h-[140%] w-[60%] rotate-12 bg-gradient-to-b from-white/30 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className={`tool-icon-halo w-11 h-11 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center flex-shrink-0 ${it.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="flex-1 min-w-0 text-[15px] font-bold text-foreground leading-snug break-words" style={{ overflowWrap: "anywhere" }}>
                      {label}
                    </p>
                    {it.count > 0 && (
                      <span aria-hidden="true" className={`flex-shrink-0 inline-flex items-center gap-1 text-[13px] font-extrabold ${it.color} bg-background/80 rounded-full ps-1.5 pe-2.5 py-1 min-w-[34px] justify-center tabular-nums shadow-sm border border-border/30`}>
                        <span className="tool-active-dot h-1.5 w-1.5 rounded-full bg-current" />
                        {it.count}
                      </span>
                    )}
                    <Chevron aria-hidden="true" className="flex-shrink-0 w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all" />
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>

        <p className="text-[9px] text-muted-foreground/70 text-center mt-3">
          {t("dashboard.myTools.archiveHint", "💡 جميع البيانات تُحفظ يومياً في «أرشيف نتائجي» أدناه")}
        </p>
      </CardContent>
    </Card>
  );
}

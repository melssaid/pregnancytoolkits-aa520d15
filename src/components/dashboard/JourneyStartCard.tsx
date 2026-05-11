import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Baby, Flower2, Heart, Sparkles, ArrowRight } from "lucide-react";
import { useUserProfile, type JourneyStage } from "@/hooks/useUserProfile";
import { haptic } from "@/lib/haptics";

/**
 * Soft, calm onboarding-style card shown on the home dashboard when:
 *  - the user has no journey selected, OR
 *  - the user is in "pregnant" stage but hasn't entered a real week yet.
 *
 * Same warm rose→lavender gradient family used across the dashboard.
 * Pure presentation + local profile updates — no business logic changes.
 */
export function JourneyStartCard() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { profile, updateProfile, setPregnancyWeek } = useUserProfile();
  const stage = profile.journeyStage;
  const needsWeek = stage === "pregnant" && (!profile.pregnancyWeek || profile.pregnancyWeek < 4);

  const [weekInput, setWeekInput] = useState<string>("");

  const stages: Array<{
    id: JourneyStage;
    icon: typeof Baby;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
  }> = useMemo(() => [
    {
      id: "fertility",
      icon: Flower2,
      titleAr: "أحاول الحمل",
      titleEn: "Trying to conceive",
      descAr: "تتبّع الإباضة والدورة",
      descEn: "Cycle & ovulation",
    },
    {
      id: "pregnant",
      icon: Baby,
      titleAr: "حامل حالياً",
      titleEn: "I'm pregnant",
      descAr: "متابعة أسبوعية للحمل",
      descEn: "Weekly pregnancy",
    },
    {
      id: "postpartum",
      icon: Heart,
      titleAr: "بعد الولادة",
      titleEn: "After birth",
      descAr: "تعافي ورعاية الطفل",
      descEn: "Recovery & baby care",
    },
  ], []);

  const handlePickStage = (id: JourneyStage) => {
    haptic("tap");
    updateProfile({ journeyStage: id });
  };

  const handleSaveWeek = () => {
    const n = parseInt(weekInput, 10);
    if (!Number.isFinite(n)) return;
    haptic("success");
    setPregnancyWeek(n);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.05] p-4"
    >
      <div className="pointer-events-none absolute -top-10 -end-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -start-10 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
            <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
          </span>
          <h3 className="text-[14px] font-extrabold text-foreground tracking-tight">
            {isAr ? "ابدئي رحلتكِ" : "Start your journey"}
          </h3>
        </div>
        <p className="text-[12px] text-muted-foreground leading-snug mb-3">
          {needsWeek
            ? (isAr
                ? "أدخلي أسبوع الحمل الحالي لعرض المتابعة الأسبوعية المخصصة لكِ."
                : "Enter your current pregnancy week to unlock weekly tracking.")
            : (isAr
                ? "اختاري مرحلتكِ لنعرض لكِ الأدوات والنصائح المناسبة."
                : "Pick your stage so we can tailor the right tools for you.")}
        </p>

        {/* Stage chips */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {stages.map(s => {
            const active = stage === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => handlePickStage(s.id)}
                aria-pressed={active}
                className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all ${
                  active
                    ? "border-primary/40 bg-gradient-to-br from-primary/12 to-accent/12 shadow-[0_2px_10px_-4px_hsl(var(--primary)/0.35)]"
                    : "border-border/40 bg-background/50 hover:border-primary/25"
                }`}
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  active ? "bg-gradient-to-br from-primary/25 to-accent/25" : "bg-muted/50"
                }`}>
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2.2} />
                </span>
                <span className={`text-[10.5px] font-bold leading-tight ${active ? "text-foreground" : "text-foreground/80"}`}>
                  {isAr ? s.titleAr : s.titleEn}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight line-clamp-1">
                  {isAr ? s.descAr : s.descEn}
                </span>
              </button>
            );
          })}
        </div>

        {/* Week input — only for pregnant + no real week */}
        {needsWeek && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-background/70 p-2 backdrop-blur-sm">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={42}
              value={weekInput}
              onChange={e => setWeekInput(e.target.value)}
              placeholder={isAr ? "أسبوع 1–42" : "Week 1–42"}
              className="flex-1 bg-transparent text-[13px] font-bold text-foreground placeholder:text-muted-foreground/70 outline-none px-2 tabular-nums"
              aria-label={isAr ? "أسبوع الحمل" : "Pregnancy week"}
            />
            <button
              onClick={handleSaveWeek}
              disabled={!weekInput}
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-[12px] font-bold text-primary-foreground shadow-sm disabled:opacity-50"
            >
              {isAr ? "حفظ" : "Save"}
              <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

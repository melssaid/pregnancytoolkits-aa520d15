import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Baby, Flower2, Heart, Sparkles, ArrowRight, X, HelpCircle } from "lucide-react";
import { useUserProfile, type JourneyStage } from "@/hooks/useUserProfile";
import { haptic } from "@/lib/haptics";

/**
 * Inline multi-choice prompt shown on the homepage:
 *   "هل أنتِ حامل؟"  →  pick one of three stages.
 *   - Pregnant   → reveals a week input (1–42), saves to profile + LMP.
 *   - Fertility  → sets stage to "fertility".
 *   - Postpartum → sets stage to "postpartum".
 *
 * Auto-hides after the user confirms (flag stored in localStorage), and
 * stays hidden once a real pregnancy week is set. Dismissible via the X.
 *
 * Pure presentation + local profile updates — no business logic changes.
 */
const STORAGE_KEY = "journey-prompt:answered-v1";

export default function JourneyPromptCard() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { profile, updateProfile, setPregnancyWeek, setLastPeriodDate } = useUserProfile();

  const hasRealWeek = profile.journeyStage === "pregnant" && (profile.pregnancyWeek ?? 0) >= 4;
  const stageConfirmed = profile.journeyStage === "fertility" || profile.journeyStage === "postpartum";

  const [answered, setAnswered] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [dismissed, setDismissed] = useState(false);
  const [showWeekInput, setShowWeekInput] = useState(false);
  const [weekInput, setWeekInput] = useState<string>("");

  // If the user already has a confirmed stage or a real week, mark answered.
  useEffect(() => {
    if (hasRealWeek || stageConfirmed) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setAnswered(true);
    }
  }, [hasRealWeek, stageConfirmed]);

  const visible = !dismissed && !answered && !hasRealWeek && !stageConfirmed;

  const stages = useMemo(() => ([
    { id: "pregnant"   as JourneyStage, icon: Baby,    titleAr: "نعم، حامل",    titleEn: "Yes, pregnant",   descAr: "متابعة أسبوعية",     descEn: "Weekly tracking" },
    { id: "fertility"  as JourneyStage, icon: Flower2, titleAr: "أحاول الحمل",   titleEn: "Trying",          descAr: "إباضة ودورة",         descEn: "Cycle & ovulation" },
    { id: "postpartum" as JourneyStage, icon: Heart,   titleAr: "بعد الولادة",   titleEn: "After birth",     descAr: "تعافٍ ورعاية الطفل",   descEn: "Recovery & baby" },
  ]), []);

  if (!visible) return null;

  const finishAndHide = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setAnswered(true);
  };

  const handlePick = (id: JourneyStage) => {
    haptic("tap");
    updateProfile({ journeyStage: id });
    if (id === "pregnant") {
      setShowWeekInput(true); // wait for week before hiding
    } else {
      finishAndHide();
    }
  };

  const handleSaveWeek = () => {
    const n = parseInt(weekInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > 42) return;
    haptic("success");
    const lmp = new Date();
    lmp.setDate(lmp.getDate() - n * 7);
    setLastPeriodDate(lmp.toISOString().split("T")[0]);
    setPregnancyWeek(n);
    finishAndHide();
  };

  const handleDismiss = () => {
    haptic("tap");
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-[hsl(340,40%,98%)] via-[hsl(20,30%,98%)] to-[hsl(300,25%,98%)] dark:from-[hsl(340,15%,11%)] dark:via-[hsl(20,12%,10%)] dark:to-[hsl(300,12%,11%)] p-4"
        style={{ boxShadow: "0 4px 20px -6px hsl(340 50% 55% / 0.18)" }}
      >
        {/* Soft botanical glows */}
        <div className="pointer-events-none absolute -top-10 -end-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -start-10 h-28 w-28 rounded-full bg-accent/10 blur-3xl" />

        {/* Dismiss */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={isAr ? "إخفاء" : "Dismiss"}
          className="absolute top-2 end-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-background/60 transition-colors"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>

        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
              <HelpCircle className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            </span>
            <h3 className="text-[14px] font-extrabold text-foreground tracking-tight" style={{ fontFamily: "'Tajawal', sans-serif" }}>
              {isAr ? "هل أنتِ حامل؟" : "Are you pregnant?"}
            </h3>
          </div>
          <p className="text-[12px] text-muted-foreground leading-snug mb-3">
            {showWeekInput
              ? (isAr
                  ? "رائع! أدخلي أسبوع الحمل الحالي ليتم تحديثه تلقائيًا كل يوم."
                  : "Lovely — enter your current pregnancy week and it will update daily.")
              : (isAr
                  ? "اختاري مرحلتكِ لنخصّص لكِ النصائح والأدوات المناسبة."
                  : "Pick your stage so we can tailor tips and tools for you.")}
          </p>

          {/* Stage chips */}
          {!showWeekInput && (
            <div className="grid grid-cols-3 gap-2">
              {stages.map(s => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handlePick(s.id)}
                    className="group relative flex flex-col items-center gap-1.5 rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-2.5 text-center transition-all hover:border-primary/30 hover:-translate-y-[1px] hover:shadow-[0_2px_10px_-4px_hsl(var(--primary)/0.3)] active:scale-[0.97]"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15">
                      <Icon className="h-4 w-4 text-primary" strokeWidth={2.2} />
                    </span>
                    <span className="text-[10.5px] font-bold leading-tight text-foreground/85" style={{ fontFamily: "'Tajawal', sans-serif" }}>
                      {isAr ? s.titleAr : s.titleEn}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-tight line-clamp-1">
                      {isAr ? s.descAr : s.descEn}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Week input — only after picking "pregnant" */}
          {showWeekInput && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 rounded-xl border border-primary/25 bg-background/70 p-2 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary/70 ms-1 flex-shrink-0" strokeWidth={2.2} />
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={42}
                value={weekInput}
                onChange={e => setWeekInput(e.target.value)}
                placeholder={isAr ? "أسبوع 1–42" : "Week 1–42"}
                className="flex-1 bg-transparent text-[13px] font-bold text-foreground placeholder:text-muted-foreground/70 outline-none px-1 tabular-nums"
                aria-label={isAr ? "أسبوع الحمل" : "Pregnancy week"}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveWeek}
                disabled={!weekInput}
                className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-1.5 text-[12px] font-bold text-primary-foreground shadow-sm disabled:opacity-50"
              >
                {isAr ? "حفظ" : "Save"}
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

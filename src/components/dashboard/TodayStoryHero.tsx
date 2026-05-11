import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Quote, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { haptic } from "@/lib/haptics";
import { safeParseLocalStorage, safeSaveToLocalStorage } from "@/lib/safeStorage";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useOptimizedMotion } from "@/hooks/useOptimizedMotion";
import roseDecor from "@/assets/rose-right.png";
import { DailyTipCard } from "@/components/dashboard/DailyTipCard";

interface DailyLog {
  date: string;
  mood: number;
  symptoms: string[];
  week?: number;
}

const STORAGE_KEY = "quick_symptom_logs";

/**
 * Premium professional hero — Apple Health × Flo style.
 * - Large progress ring (140px)
 * - Time-based greeting
 * - Formal mood quick-tap (icons + labels, no emojis)
 * - Hides pregnancy data if week <= 0
 */
export const TodayStoryHero = memo(function TodayStoryHero() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { profile, week, timeSlot, isPregnant } = useDashboardData();
  const m = useOptimizedMotion();

  // Mood state
  const today = new Date().toISOString().split("T")[0];
  const [logs, setLogs] = useState<DailyLog[]>(() =>
    safeParseLocalStorage<DailyLog[]>(STORAGE_KEY, [])
  );
  const todayLog = useMemo(() => logs.find(l => l.date === today), [logs, today]);
  const [selectedMood, setSelectedMood] = useState<number>(todayLog?.mood || 0);
  const [justSaved, setJustSaved] = useState(false);

  // Sync state if logs change externally
  useEffect(() => {
    const onStorage = () => {
      const fresh = safeParseLocalStorage<DailyLog[]>(STORAGE_KEY, []);
      setLogs(fresh);
      const todayFresh = fresh.find(l => l.date === today);
      if (todayFresh) setSelectedMood(todayFresh.mood);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [today]);

  // Time-based wellness tip (translated via i18n in 7 languages) — greeting label removed per design
  const greeting = useMemo(() => {
    const slot = timeSlot;
    return {
      tip: t(`dashboardV2.greeting.${slot}Tip`),
    };
  }, [timeSlot, t]);

  // Pregnancy progress — only real data, no synthetic fallback
  const hasRealWeek = isPregnant && week > 0;
  const progress = hasRealWeek ? Math.min(100, (week / 40) * 100) : 0;
  const trimester = week <= 13 ? 1 : week <= 26 ? 2 : 3;
  // Days remaining — ONLY computed from a real dueDate set by the user.
  // No (40 - week) fallback to avoid synthetic numbers.
  const daysRemaining = profile.dueDate
    ? Math.max(0, Math.ceil((new Date(profile.dueDate).getTime() - Date.now()) / 86400000))
    : null;

  // Ring math (compact 116px → fits 320px viewports without crushing stats)
  const ringSize = 116;
  const ringRadius = 50;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDash = (progress / 100) * circumference;

  // Formal mood scale — translated, no emojis
  const moods = [
    { value: 1, key: "difficult",  color: "hsl(0,55%,55%)" },
    { value: 2, key: "low",        color: "hsl(25,65%,55%)" },
    { value: 3, key: "neutral",    color: "hsl(45,60%,50%)" },
    { value: 4, key: "good",       color: "hsl(160,45%,45%)" },
    { value: 5, key: "excellent",  color: "hsl(180,50%,40%)" },
  ];

  const handleMoodTap = useCallback(
    (value: number) => {
      haptic("tap");
      setSelectedMood(value);

      const newLog: DailyLog = {
        date: today,
        mood: value,
        symptoms: todayLog?.symptoms || [],
        week: week || undefined,
      };
      const updated = [...logs.filter(l => l.date !== today), newLog].slice(-30);
      safeSaveToLocalStorage(STORAGE_KEY, updated);
      setLogs(updated);
      setJustSaved(true);
      window.dispatchEvent(new Event("storage"));
      setTimeout(() => setJustSaved(false), 1800);
    },
    [today, todayLog, logs, week]
  );

  return (
    <motion.div
      initial={m.disabled ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={m.transition}
      style={{ willChange: m.disabled ? "auto" : "transform, opacity" }}
      className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-lg shadow-primary/5"
    >
      {/* Decorative rose — replaces generic glow for a refined botanical accent */}
      <img
        src={roseDecor}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none select-none absolute -top-6 -end-6 h-36 w-36 object-contain opacity-[0.18] mix-blend-multiply dark:opacity-25 dark:mix-blend-screen rtl:scale-x-[-1]"
      />
      <div className="pointer-events-none absolute -bottom-20 -start-20 h-44 w-44 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative px-5 pt-6 pb-4">
        {/* Wellness tip — extracted reusable component */}
        <div className="mb-5">
          <DailyTipCard tip={greeting.tip} ariaLabel={t("dashboardV2.greeting.tipAria", { defaultValue: "Daily wellness tip" })} />
        </div>


        {/* Pregnancy section — only render with real user data */}
        {hasRealWeek ? (
          <div className="flex items-center gap-3 sm:gap-4 mb-5">
            {/* Compact Progress Ring */}
            <div className="relative flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
              <svg viewBox="0 0 116 116" className="w-full h-full -rotate-90">
                <circle cx="58" cy="58" r={ringRadius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity={0.2} />
                <motion.circle
                  cx="58" cy="58" r={ringRadius}
                  fill="none"
                  stroke="url(#heroProgressGrad)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: m.disabled ? circumference - strokeDash : circumference }}
                  animate={{ strokeDashoffset: circumference - strokeDash }}
                  transition={m.longTransition}
                />
                <defs>
                  <linearGradient id="heroProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="60%" stopColor="hsl(340, 60%, 60%)" />
                    <stop offset="100%" stopColor="hsl(300, 50%, 65%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  {...m.pop}
                  className="text-[2.5rem] font-black leading-none text-foreground tabular-nums"
                  style={{ fontFamily: isAr ? "'Tajawal', sans-serif" : undefined }}
                >
                  {week}
                </motion.span>
                <span className="mt-0.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {t("dashboardV2.progress.week")}
                </span>
              </div>
            </div>

            {/* Stats column — horizontal rows for full label visibility */}
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-primary">
                {t(`dashboardV2.progress.trimester${trimester}`)}
              </p>

              <div className="space-y-1.5">
                {daysRemaining !== null && (
                  <div className="flex items-baseline justify-between gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2.5 backdrop-blur-sm">
                    <span className="text-[13px] font-bold text-foreground/85 truncate">
                      {t("dashboardV2.progress.daysLeft")}
                    </span>
                    <span className="text-2xl font-black leading-none text-foreground tabular-nums shrink-0">
                      {daysRemaining}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2.5 backdrop-blur-sm">
                  <span className="text-[13px] font-bold text-foreground/85 truncate">
                    {t("dashboardV2.progress.complete")}
                  </span>
                  <span className="text-2xl font-black leading-none text-foreground tabular-nums shrink-0 whitespace-nowrap">
                    {Math.round(progress)}<span className="text-sm">%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Non-pregnant: simple welcome panel */
          <div className="flex items-center gap-3 mb-5 rounded-2xl border border-border/40 bg-background/60 p-4">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {t("dashboardV2.progress.welcomeWellness")}
            </p>
          </div>
        )}

        {/* Mood Quick-Tap — formal scale */}
        {(() => {
          const activeMood = moods.find(x => x.value === selectedMood);
          const tint = activeMood?.color ?? "hsl(var(--primary))";
          // SVG dot pattern — encoded once, tinted via currentColor
          const dotPattern =
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'><circle cx='1.5' cy='1.5' r='0.9' fill='%23000' fill-opacity='0.18'/></svg>\")";
          return (
        <div className="relative rounded-2xl border border-border/40 p-3.5 backdrop-blur-sm overflow-hidden transition-colors duration-500"
             style={{ borderColor: activeMood ? `${tint}55` : undefined }}>
          {/* Tinted base gradient (animates with active mood) */}
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            initial={false}
            animate={{
              background: activeMood
                ? `linear-gradient(135deg, ${tint}1f 0%, ${tint}10 45%, hsl(var(--background)/0.75) 100%)`
                : `linear-gradient(135deg, hsl(var(--muted)/0.55) 0%, hsl(var(--background)/0.85) 100%)`,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Subtle dot-grid texture overlay */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.35] mix-blend-overlay"
            style={{ backgroundImage: dotPattern, backgroundSize: "14px 14px" }}
          />
          {/* Soft radial glow following active color */}
          {activeMood && (
            <motion.div
              aria-hidden
              key={activeMood.key}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 0.55, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 h-24 w-40 rounded-full blur-2xl pointer-events-none"
              style={{ backgroundColor: tint }}
            />
          )}
          <div className="relative z-10">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[14px] font-extrabold text-foreground tracking-tight">
              {t("dashboardV2.mood.title")}
            </p>
            {justSaved && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-done dark:text-done"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                {t("dashboardV2.mood.saved")}
              </motion.span>
            )}
          </div>

          <div className="flex items-stretch justify-between gap-1.5">
            {moods.map(m => {
              const active = selectedMood === m.value;
              const label = t(`dashboardV2.mood.${m.key}`);
              const desc = t(`dashboardV2.mood.desc.${m.key}`, { defaultValue: "" });
              return (
                <Tooltip key={m.value} delayDuration={150}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ y: -1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 22 }}
                      onClick={() => handleMoodTap(m.value)}
                      className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-2xl overflow-hidden transition-all duration-300 border ${
                        active
                          ? "border-primary/35 shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.35),inset_0_1px_0_0_hsl(0_0%_100%/0.6)]"
                          : "border-border/30 hover:border-border/60 shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.4)]"
                      }`}
                      style={{
                        background: active
                          ? `linear-gradient(160deg, ${m.color}22 0%, ${m.color}10 55%, hsl(var(--background)) 100%)`
                          : "linear-gradient(160deg, hsl(var(--muted)/0.55) 0%, hsl(var(--background)/0.85) 100%)",
                      }}
                      aria-label={desc ? `${label} — ${desc}` : label}
                      aria-pressed={active}
                    >
                      {/* Top inner highlight */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-70"
                        style={{
                          background:
                            "linear-gradient(to bottom, hsl(0 0% 100% / 0.35), transparent)",
                        }}
                      />
                      {/* Soft color glow when active */}
                      {active && (
                        <motion.span
                          aria-hidden
                          layoutId="mood-glow"
                          className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 h-8 w-10 rounded-full blur-xl"
                          style={{ backgroundColor: m.color, opacity: 0.45 }}
                        />
                      )}
                      <span
                        className="relative z-10 block rounded-full transition-all duration-300"
                        style={{
                          width: active ? 12 : 10,
                          height: active ? 12 : 10,
                          background: `radial-gradient(circle at 30% 25%, hsl(0 0% 100% / 0.85), ${m.color} 65%)`,
                          boxShadow: active
                            ? `0 2px 6px ${m.color}66, inset 0 -1px 2px hsl(0 0% 0% / 0.18)`
                            : `inset 0 -1px 2px hsl(0 0% 0% / 0.12)`,
                          opacity: active ? 1 : 0.7,
                        }}
                      />
                      <span
                        className={`relative z-10 text-[9px] font-bold leading-tight text-center break-words px-0.5 transition-colors ${
                          active ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-center">
                    <p className="text-[11px] font-bold text-foreground mb-0.5">{label}</p>
                    {desc && <p className="text-[10px] leading-snug text-muted-foreground">{desc}</p>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Animated selected-mood label */}
          <div className="relative mt-2.5 h-9 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {selectedMood > 0 ? (
                (() => {
                  const sel = moods.find(x => x.value === selectedMood)!;
                  const selLabel = t(`dashboardV2.mood.${sel.key}`);
                  const selDesc = t(`dashboardV2.mood.desc.${sel.key}`, { defaultValue: "" });
                  return (
                    <motion.div
                      key={sel.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 flex items-center justify-center gap-2 px-3"
                    >
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: sel.color, boxShadow: `0 0 8px ${sel.color}99` }}
                      />
                      <span className="text-[12px] font-extrabold text-foreground tracking-tight">
                        {selLabel}
                      </span>
                      {selDesc && (
                        <span className="text-[11px] text-muted-foreground line-clamp-1 leading-snug">
                          — {selDesc}
                        </span>
                      )}
                    </motion.div>
                  );
                })()
              ) : (
                <motion.p
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] font-medium text-muted-foreground/70 italic"
                >
                  {t("dashboardV2.mood.tapToSelect", { defaultValue: t("dashboardV2.mood.title") })}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
          );
        })()}
      </div>
    </motion.div>
  );
});

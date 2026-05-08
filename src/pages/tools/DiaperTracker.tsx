import { useState, useEffect } from "react";
import { emitDataChange } from "@/lib/dataBus";
import { useTranslation } from "react-i18next";
import { ToolFrame } from "@/components/ToolFrame";
import { Card, CardContent } from "@/components/ui/card";
import { DiaperChart } from "@/components/diaper/DiaperChart";
import { DiaperHistory } from "@/components/diaper/DiaperHistory";
import { DiaperAIAnalysis } from "@/components/diaper/DiaperAIAnalysis";
import { Info, Droplet, Circle, Clock, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ToolEmptyState } from "@/components/tools/ToolEmptyState";

type DiaperType = "wet" | "dirty" | "both";

interface DiaperEntry {
  id: string;
  time: string;
  type: DiaperType;
}

const DAILY_GOAL = 8;

const DiaperTracker = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [entries, setEntries] = useState<DiaperEntry[]>([]);
  const [lastAdded, setLastAdded] = useState<DiaperType | null>(null);
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [showHint, setShowHint] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("diaperEntries");
    if (saved) {
      const parsed = JSON.parse(saved);
      setEntries(parsed);
      // Check if today has entries - if not, show hint
      const today = new Date().toDateString();
      const hasTodayEntries = parsed.some((e: DiaperEntry) => new Date(e.time).toDateString() === today);
      if (hasTodayEntries) setShowHint(false);
    }
    setInitialLoad(false);
  }, []);

  // Hide hint after first tap today
  useEffect(() => {
    if (!showHint) return;
    const today = new Date().toDateString();
    const todayCount = entries.filter(e => new Date(e.time).toDateString() === today).length;
    if (todayCount > 0) {
      const timer = setTimeout(() => setShowHint(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [entries, showHint]);

  // Live timer
  const lastChangeTime = entries.length > 0 ? entries[0].time : null;
  useEffect(() => {
    if (!lastChangeTime) return;
    const update = () => {
      const diff = Date.now() - new Date(lastChangeTime).getTime();
      const totalSeconds = Math.floor(diff / 1000);
      setElapsed({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastChangeTime]);

  const persist = (updated: DiaperEntry[]) => {
    setEntries(updated);
    localStorage.setItem("diaperEntries", JSON.stringify(updated));
    emitDataChange("diaperEntries");
  };

  const addEntry = (type: DiaperType) => {
    const newEntry: DiaperEntry = {
      id: Date.now().toString(),
      time: new Date().toISOString(),
      type,
    };
    const updated = [newEntry, ...entries].slice(0, 90);
    persist(updated);
    setLastAdded(type);
    if (navigator.vibrate) navigator.vibrate(30);
    setTimeout(() => setLastAdded(null), 800);
  };

  const undoLast = (type: DiaperType) => {
    const today = new Date().toDateString();
    const idx = entries.findIndex(
      (e) => e.type === type && new Date(e.time).toDateString() === today
    );
    if (idx !== -1) {
      persist(entries.filter((_, i) => i !== idx));
    }
  };

  const deleteEntry = (id: string) => {
    persist(entries.filter((e) => e.id !== id));
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayEntries = entries.filter(
      (e) => new Date(e.time).toDateString() === today
    );
    return {
      wet: todayEntries.filter((e) => e.type === "wet").length,
      dirty: todayEntries.filter((e) => e.type === "dirty").length,
      both: todayEntries.filter((e) => e.type === "both").length,
      total: todayEntries.length,
    };
  };

  const stats = getTodayStats();
  const progress = Math.min((stats.total / DAILY_GOAL) * 100, 100);
  const isComplete = stats.total >= DAILY_GOAL;
  const isUrgent = elapsed.hours >= 3;
  const isWarning = elapsed.hours >= 2;

  return (
    <ToolFrame
      title={t('diaperPage.title')}
      subtitle={t('diaperPage.subtitle')}
      customIcon="mother-baby"
      mood="nurturing"
      toolId="diaper-tracker"
    >
      <div className="space-y-4">
        {/* ═══ Hero Card ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="overflow-hidden border-primary/15 shadow-xl">
            <CardContent className="p-0">

              {/* Timer strip with status */}
              <div className={`flex items-center justify-between px-4 py-3 border-b border-border/30 ${
                isUrgent 
                  ? 'bg-gradient-to-r from-destructive/10 to-destructive/5' 
                  : isWarning 
                    ? 'bg-gradient-to-r from-orange-500/10 to-orange-500/5' 
                    : 'bg-gradient-to-r from-primary/8 to-primary/3'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg ${
                    isUrgent ? 'bg-destructive/15' : isWarning ? 'bg-orange-500/15' : 'bg-primary/10'
                  }`}>
                    <Clock className={`h-3.5 w-3.5 ${
                      isUrgent ? 'text-destructive' : isWarning ? 'text-orange-500' : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {t('diaperPage.timeSinceLastChange')}
                    </span>
                    {isUrgent && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] text-destructive font-medium mt-0.5"
                      >
                        {t('diaperPage.timeToChange')}
                      </motion.span>
                    )}
                  </div>
                </div>
                {lastChangeTime ? (
                  <div className="flex items-baseline gap-0.5 font-mono shrink-0" dir="ltr">
                    {[
                      { val: elapsed.hours, label: 'h' },
                      { val: elapsed.minutes, label: 'm' },
                      { val: elapsed.seconds, label: 's' },
                    ].map((u, i) => (
                      <span key={i} className="flex items-baseline">
                        {i > 0 && <span className="text-muted-foreground/50 text-xs mx-0.5">:</span>}
                        <span className={`text-base font-bold tabular-nums ${
                          isUrgent ? 'text-destructive' : 'text-foreground'
                        }`}>
                          {String(u.val).padStart(2, '0')}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground font-mono">--:--:--</span>
                )}
              </div>

              {/* Main action area */}
              <div className="p-5">
                {/* Gesture hint */}
                <AnimatePresence>
                  {(showHint && !initialLoad) && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-center mb-4"
                    >
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-flex items-center gap-1.5 text-primary"
                      >
                        <span className="text-lg">👇</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('diaperPage.tapToRecord')}
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Counter buttons - redesigned as large tap targets */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Wet */}
                  <DiaperActionButton
                    count={stats.wet}
                    label={t('diaperPage.wet')}
                    emoji="🫧"
                    gradientFrom="from-blue-500/15"
                    gradientTo="to-blue-400/5"
                    borderColor="border-blue-500/20"
                    textColor="text-blue-600"
                    isActive={lastAdded === "wet"}
                    onAdd={() => addEntry("wet")}
                    onUndo={() => undoLast("wet")}
                  />

                  {/* Dirty */}
                  <DiaperActionButton
                    count={stats.dirty}
                    label={t('diaperPage.dirty')}
                    emoji="🍂"
                    gradientFrom="from-amber-500/15"
                    gradientTo="to-amber-400/5"
                    borderColor="border-amber-500/20"
                    textColor="text-amber-600"
                    isActive={lastAdded === "dirty"}
                    onAdd={() => addEntry("dirty")}
                    onUndo={() => undoLast("dirty")}
                  />

                  {/* Both */}
                  <DiaperActionButton
                    count={stats.both}
                    label={t('diaperPage.both')}
                    emoji="👶"
                    gradientFrom="from-primary/15"
                    gradientTo="to-primary/5"
                    borderColor="border-primary/20"
                    textColor="text-primary"
                    isActive={lastAdded === "both"}
                    onAdd={() => addEntry("both")}
                    onUndo={() => undoLast("both")}
                  />
                </div>
              </div>

              {/* Goal progress */}
              <div className="px-5 py-3 bg-muted/20 border-t border-border/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {t('diaperPage.todayStats')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isComplete && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-xs"
                      >
                        ✅
                      </motion.span>
                    )}
                    <span className={`text-[11px] font-bold ${isComplete ? 'text-green-600' : 'text-foreground'}`}>
                      {stats.total}/{DAILY_GOAL}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isComplete 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                        : 'bg-gradient-to-r from-primary/60 to-primary'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {isComplete && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-green-600 font-medium text-center mt-1.5"
                  >
                    {t('diaperPage.goalReached')}
                  </motion.p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Last change quick info */}
        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground"
          >
            <span>{t('diaperPage.lastChange')}:</span>
            <span className="font-medium text-foreground">
              {new Date(entries[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-medium">
              {entries[0].type === 'wet' ? '🫧' : entries[0].type === 'dirty' ? '🍂' : '👶'}
              {' '}
              {t(`diaperPage.${entries[0].type}`)}
            </span>
          </motion.div>
        )}

        {/* Empty state — no diaper entries yet */}
        {entries.length === 0 && (
          <ToolEmptyState
            icon={Droplet}
            title={t("tools.empty.diaper.title")}
            description={t("tools.empty.diaper.desc")}
            ctaLabel={t("tools.empty.diaper.cta")}
            ctaDirection="up"
            onCta={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
        )}

        {/* Weekly Chart */}
        <DiaperChart entries={entries} />

        {/* AI Analysis */}
        <DiaperAIAnalysis entries={entries} todayStats={stats} />

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-start gap-2.5 rounded-2xl bg-muted/40 p-3.5 border border-border/30">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/60 leading-relaxed">
              {t('diaperPage.info')}
            </p>
          </div>
        </motion.div>

        {/* History grouped by day */}
        <DiaperHistory entries={entries} onDelete={deleteEntry} />

        {/* WhatsApp Share */}
        <div className="flex justify-end">
          <WhatsAppShareButton onClick={() => {
            const text = formatStatsShare(
              { title: t('diaperPage.title'), emoji: '👶' },
              [
                { emoji: '🫧', label: t('diaperPage.wet'), value: String(stats.wet) },
                { emoji: '🍂', label: t('diaperPage.dirty'), value: String(stats.dirty) },
                { emoji: '👶', label: t('diaperPage.both'), value: String(stats.both) },
                { emoji: '📊', label: t('diaperPage.total'), value: `${stats.total}/${DAILY_GOAL}` },
              ]
            );
            openWhatsApp(text);
          }} />
        </div>
      </div>
    </ToolFrame>
  );
};

/* ═══ Diaper Action Button ═══ */
interface DiaperActionButtonProps {
  count: number;
  label: string;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  textColor: string;
  isActive: boolean;
  onAdd: () => void;
  onUndo: () => void;
  isTotalButton?: boolean;
}

const DiaperActionButton = ({
  count, label, emoji, gradientFrom, gradientTo, borderColor, textColor,
  isActive, onAdd, onUndo, isTotalButton
}: DiaperActionButtonProps) => (
  <motion.div
    className={`relative flex flex-col items-center rounded-2xl border transition-all duration-200 overflow-hidden ${borderColor} ${
      isActive ? 'shadow-md scale-[0.97]' : 'shadow-sm'
    }`}
    whileTap={{ scale: 0.94 }}
  >
    {/* Tap target */}
    <button
      onClick={onAdd}
      className={`w-full pt-4 pb-2 px-2 flex flex-col items-center gap-1.5 bg-gradient-to-b ${gradientFrom} ${gradientTo} active:brightness-95 transition-all`}
    >
      {/* Emoji icon */}
      <motion.span 
        className="text-3xl"
        animate={isActive ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {emoji}
      </motion.span>

      {/* Count */}
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: -10, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.7 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
          className={`text-3xl font-bold tabular-nums ${textColor}`}
        >
          {count}
        </motion.span>
      </AnimatePresence>

      {/* Label */}
      <span className="text-xs text-muted-foreground font-medium">{label}</span>

      {/* Ripple on tap */}
      {isActive && (
        <motion.div
          className={`absolute inset-0 ${gradientFrom.replace('/15', '/10')}`}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </button>

    {/* Undo button - only for individual types */}
    {!isTotalButton && count > 0 && (
      <button
        onClick={(e) => { e.stopPropagation(); onUndo(); }}
        className="w-full py-1.5 flex items-center justify-center border-t border-border/30 bg-background/50 hover:bg-muted/50 transition-colors"
      >
        <Minus className="h-3 w-3 text-muted-foreground" />
      </button>
    )}

    {/* Plus indicator for total */}
    {isTotalButton && (
      <div className="w-full py-1.5 flex items-center justify-center border-t border-border/30 bg-background/50">
        <Plus className="h-3 w-3 text-primary/50" />
      </div>
    )}
  </motion.div>
);

export default DiaperTracker;

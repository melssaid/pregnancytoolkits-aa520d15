import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Sparkles, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Baby, Calendar, MessageCircle, HandHeart, Shield, Clock,
  Star, ArrowRight, ArrowLeft, BookOpen, Lightbulb,
} from "lucide-react";
import { AIResponseFrame } from "@/components/ai/AIResponseFrame";
import { PrintableReport } from "@/components/PrintableReport";
import { AIActionButton } from "@/components/ai/AIActionButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToolFrame } from "@/components/ToolFrame";
import MedicalDisclaimer from "@/components/compliance/MedicalDisclaimer";
import { useSmartInsight } from "@/hooks/useSmartInsight";
import { useSettings } from "@/hooks/useSettings";
import { VideoLibrary } from "@/components/VideoLibrary";
import { partnerVideosByLang } from "@/data/videoData";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";
import { formatChecklistShare, openWhatsApp } from "@/lib/whatsappShare";

// ── Topic Configuration ──────────────────────────────────────────
const TOPICS = [
  { key: "emotional", icon: Heart, gradient: "from-rose-500 to-pink-400", bg: "bg-rose-500/10 border-rose-500/20" },
  { key: "physical", icon: HandHeart, gradient: "from-amber-500 to-orange-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "appointments", icon: Calendar, gradient: "from-blue-500 to-sky-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { key: "communication", icon: MessageCircle, gradient: "from-violet-500 to-purple-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { key: "bonding", icon: Baby, gradient: "from-teal-500 to-emerald-400", bg: "bg-teal-500/10 border-teal-500/20" },
  { key: "labor", icon: Clock, gradient: "from-red-500 to-rose-400", bg: "bg-red-500/10 border-red-500/20" },
  { key: "postpartum", icon: Shield, gradient: "from-indigo-500 to-blue-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  { key: "intimacy", icon: Star, gradient: "from-pink-500 to-fuchsia-400", bg: "bg-pink-500/10 border-pink-500/20" },
] as const;

const PARTNER_TYPES = ["husband"] as const;
const TRIMESTERS = ["first", "second", "third"] as const;

// ── Daily Checklist Keys ─────────────────────────────────────────
const DAILY_CHECKLIST_KEYS = [
  "checkAsk", "checkMassage", "checkTask", "checkRead",
  "checkWater", "checkListen", "checkCompliment",
] as const;

const STORAGE_KEY = "partner-guide-checklist";

const AIPartnerGuide = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { settings } = useSettings();
  const { generate, isLoading, content } = useSmartInsight({ section: "pregnancy-plan", toolType: "partner-guide" });

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [trimester, setTrimester] = useState<string>("second");
  const [partnerType, setPartnerType] = useState<string>("husband");
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [checkedActions, setCheckedActions] = useState<string[]>(() => {
    try {
      const today = new Date().toDateString();
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) return parsed.items;
      }
    } catch {}
    return [];
  });

  // Save checklist
  const toggleCheck = useCallback((key: string) => {
    setCheckedActions(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: new Date().toDateString(), items: next }));
      return next;
    });
  }, []);

  const checklistProgress = Math.round((checkedActions.length / DAILY_CHECKLIST_KEYS.length) * 100);

  const currentLang = i18n.language;

  const getAdvice = useCallback(async () => {
    const topicLabel = t(`toolsInternal.partnerGuide.topics.${selectedTopic}.label`);
    const topicDesc = t(`toolsInternal.partnerGuide.topics.${selectedTopic}.desc`);
    const partnerLabel = t(`toolsInternal.partnerGuide.${partnerType}`);
    const langMap: Record<string, string> = { ar: "Arabic", de: "German", tr: "Turkish", fr: "French", es: "Spanish", pt: "Portuguese" };
    const langInstruction = currentLang !== "en" ? `IMPORTANT: Respond ENTIRELY in ${langMap[currentLang] || "English"}. All text must be in this language.` : "";

    const prompt = `${langInstruction}

As a pregnancy support guide, provide guidance for a ${partnerLabel} supporting their pregnant partner:

**Pregnancy Week:** ${settings.pregnancyWeek || "Not specified"}
**Trimester:** ${trimester}
**Topic:** ${topicLabel} - ${topicDesc}

Provide compassionate, practical advice including:
1. **Understanding Her Experience** - What she's going through physically and emotionally
2. **Daily Support Actions** - Specific things to do every day
3. **Things to Say** - Helpful phrases and responses
4. **Things to Avoid** - Common mistakes partners make
5. **Special Gestures** - Meaningful ways to show love
6. **Preparing Together** - Activities to do as a couple
7. **Red Flags** - When to encourage professional help

Be warm, practical, and specific. Include real examples.`;

    await generate({ prompt, context: { week: Number(settings.pregnancyWeek) || 0 } });
  }, [selectedTopic, partnerType, trimester, settings.pregnancyWeek, currentLang, t, generate]);

  if (!disclaimerAccepted) {
    return (
      <MedicalDisclaimer
        onAccept={() => setDisclaimerAccepted(true)}
        toolName={t("toolsInternal.partnerGuide.title")}
      />
    );
  }

  return (
    <ToolFrame
      title={t("toolsInternal.partnerGuide.title")}
      subtitle={t("toolsInternal.partnerGuide.subtitle")}
      customIcon="partner-guide"
      mood="nurturing"
      toolId="ai-partner-guide"
    >
      <div className="space-y-4">

        {/* ═══════ HERO CARD ═══════ */}
        <Card className="overflow-hidden border-primary/15">
          <div className="h-1.5 bg-gradient-to-r from-rose-400 via-primary to-pink-400" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-foreground">{t("toolsInternal.partnerGuide.heroTitle")}</h2>
                <p className="text-[11px] text-muted-foreground leading-snug">{t("toolsInternal.partnerGuide.heroDesc")}</p>
              </div>
            </div>

            {/* Trimester selector */}
            <div className="space-y-2.5">

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">{t("toolsInternal.partnerGuide.trimester")}</p>
                <div className="flex gap-1.5">
                  {TRIMESTERS.map(tri => (
                    <button
                      key={tri}
                      onClick={() => setTrimester(tri)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center ${
                        trimester === tri
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted/40 text-muted-foreground border border-transparent hover:bg-muted/60"
                      }`}
                    >
                      {t(`toolsInternal.partnerGuide.trimester${tri === "first" ? "1" : tri === "second" ? "2" : "3"}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════ TOPIC GRID ═══════ */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <BookOpen className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground">{t("toolsInternal.partnerGuide.whatHelpWith")}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              const isSelected = selectedTopic === topic.key;
              return (
                <motion.button
                  key={topic.key}
                  onClick={() => setSelectedTopic(topic.key)}
                  whileTap={{ scale: 0.97 }}
                  className={`relative p-3 rounded-2xl border text-start transition-all duration-200 ${
                    isSelected
                      ? `${topic.bg} border-primary/30 shadow-sm`
                      : "bg-card/80 border-border/40 hover:border-border/60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${topic.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground leading-snug">
                        {t(`toolsInternal.partnerGuide.topics.${topic.key}.label`)}
                      </p>
                      <p className="text-[9px] text-muted-foreground leading-snug mt-0.5">
                        {t(`toolsInternal.partnerGuide.topics.${topic.key}.desc`)}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="topic-check"
                      className="absolute top-1.5 end-1.5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ═══════ AI BUTTON ═══════ */}
        <AIActionButton
          onClick={getAdvice}
          isLoading={isLoading}
          disabled={!selectedTopic}
          label={t("toolsInternal.partnerGuide.getAdvice")}
          loadingLabel={t("toolsInternal.partnerGuide.gettingAdvice")}
          icon={Sparkles}
          toolType="partner-guide"
          section="pregnancy-plan"
        />

        {/* ═══════ AI RESPONSE ═══════ */}
        {content && (
          <PrintableReport title={t("toolsInternal.partnerGuide.getAdvice")} isLoading={isLoading}>
            <AIResponseFrame
              content={content}
              isLoading={isLoading}
              title={t("toolsInternal.partnerGuide.getAdvice")}
              icon={Heart}
            />
          </PrintableReport>
        )}

        {/* ═══════ DAILY SUPPORT CHECKLIST ═══════ */}
        <Card className="overflow-hidden border-primary/10">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground">{t("toolsInternal.partnerGuide.dailyChecklist")}</h3>
                  <p className="text-[9px] text-muted-foreground">{t("toolsInternal.partnerGuide.dailyChecklistDesc")}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                {checkedActions.length}/{DAILY_CHECKLIST_KEYS.length}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-muted/50 mb-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${checklistProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="space-y-1.5">
              {DAILY_CHECKLIST_KEYS.map((key, i) => {
                const isChecked = checkedActions.includes(key);
                return (
                  <motion.button
                    key={key}
                    onClick={() => toggleCheck(key)}
                    initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all text-start ${
                      isChecked ? "bg-emerald-500/5" : "hover:bg-muted/40"
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className={`text-[11px] leading-snug ${isChecked ? "text-emerald-700 dark:text-emerald-400 line-through opacity-70" : "text-foreground font-medium"}`}>
                      {t(`toolsInternal.partnerGuide.${key}`)}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {checklistProgress === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 text-center"
              >
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  🎉 {t("toolsInternal.partnerGuide.allDone")}
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* ═══════ QUICK TIPS ACCORDION ═══════ */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-foreground">{t("toolsInternal.partnerGuide.proTips")}</h3>
          </div>
          <div className="space-y-1.5">
            {(["doSay", "dontSay", "gestureIdeas"] as const).map((tipKey, i) => {
              const isOpen = expandedTip === tipKey;
              const colors = i === 0 ? "border-emerald-500/30 bg-emerald-500/5" : i === 1 ? "border-destructive/20 bg-destructive/5" : "border-amber-500/20 bg-amber-500/5";
              const emoji = i === 0 ? "✅" : i === 1 ? "🚫" : "💡";
              return (
                <div key={tipKey} className={`rounded-2xl border transition-all ${isOpen ? colors : "border-border/40 bg-card/80"}`}>
                  <button
                    onClick={() => setExpandedTip(isOpen ? null : tipKey)}
                    className="w-full flex items-center justify-between p-3 text-start"
                  >
                    <span className="text-[12px] font-bold text-foreground flex items-center gap-2">
                      <span>{emoji}</span>
                      {t(`toolsInternal.partnerGuide.tips.${tipKey}.title`)}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          <ul className="space-y-1.5">
                            {[1, 2, 3, 4].map(n => {
                              const text = t(`toolsInternal.partnerGuide.tips.${tipKey}.item${n}`, "");
                              if (!text) return null;
                              return (
                                <li key={n} className="flex items-start gap-2 text-[11px] text-foreground leading-relaxed">
                                  <span className="text-[9px] mt-0.5 shrink-0">{emoji}</span>
                                  <span className="font-semibold">{text}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════ VIDEOS ═══════ */}
        <VideoLibrary
          videosByLang={partnerVideosByLang(t)}
          title={t("toolsInternal.partnerGuide.partnerVideos")}
          subtitle={t("toolsInternal.partnerGuide.partnerVideosSubtitle")}
          accentColor="rose"
        />
      </div>
      <WhatsAppShareButton
        onClick={() => {
          const items = DAILY_CHECKLIST_KEYS.map(k => ({
            name: t(`toolsInternal.partnerGuide.${k}`),
            done: checkedActions.includes(k),
          }));
          const text = formatChecklistShare(
            { title: t("toolsInternal.partnerGuide.title"), emoji: "💝" },
            items
          );
          openWhatsApp(text);
        }}
        className="!fixed bottom-20 end-4 z-40 shadow-xl"
      />
    </ToolFrame>
  );
};

export default AIPartnerGuide;

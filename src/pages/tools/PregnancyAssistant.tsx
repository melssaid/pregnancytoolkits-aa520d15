import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Send, Bot, Loader2, Heart, Baby, Coffee, Apple, Stethoscope,
  Moon, Dumbbell, UtensilsCrossed, SmilePlus, Sparkles, RotateCcw, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolFrame } from "@/components/ToolFrame";
import { useSmartChat, type ChatMessage } from "@/hooks/useSmartChat";
import { useResetOnLanguageChange } from "@/hooks/useResetOnLanguageChange";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MiniUsageBar } from "@/components/ai/MiniUsageBar";
import { useUserProfile } from "@/hooks/useUserProfile";
import { safeParseLocalStorage } from "@/lib/safeStorage";
import { STORAGE_KEYS, subscribeToData } from "@/lib/dataBus";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickQuestions = [
  { icon: Baby,             textKey: "pregnancyAssistant.quickQuestions.symptoms",   gradient: "from-pink-500 to-rose-400",       bg: "bg-pink-50" },
  { icon: Coffee,           textKey: "pregnancyAssistant.quickQuestions.coffee",     gradient: "from-amber-500 to-orange-400",    bg: "bg-amber-50" },
  { icon: Stethoscope,      textKey: "pregnancyAssistant.quickQuestions.labor",      gradient: "from-blue-500 to-indigo-400",     bg: "bg-blue-50" },
  { icon: Apple,            textKey: "pregnancyAssistant.quickQuestions.vitamins",   gradient: "from-emerald-500 to-green-400",   bg: "bg-emerald-50" },
  { icon: Moon,             textKey: "pregnancyAssistant.quickQuestions.sleep",      gradient: "from-indigo-500 to-violet-400",   bg: "bg-indigo-50" },
  { icon: Dumbbell,         textKey: "pregnancyAssistant.quickQuestions.exercise",   gradient: "from-teal-500 to-cyan-400",       bg: "bg-teal-50" },
  { icon: UtensilsCrossed,  textKey: "pregnancyAssistant.quickQuestions.nutrition", gradient: "from-lime-500 to-green-400",      bg: "bg-lime-50" },
  { icon: SmilePlus,        textKey: "pregnancyAssistant.quickQuestions.emotions",   gradient: "from-purple-500 to-fuchsia-400",  bg: "bg-purple-50" },
];

// Send only the last 8 turns to AI to keep context tight & cost low.
const MAX_CONTEXT_TURNS = 8;

/** Build a compact dashboard snapshot the AI can use for personalized answers. */
function useDashboardContext() {
  const { profile } = useUserProfile();
  const [tick, setTick] = useState(0);

  // Re-read snapshot whenever any tracked tool publishes a change.
  useEffect(() => {
    const trackedKeys = [
      STORAGE_KEYS.KICK_SESSIONS,
      STORAGE_KEYS.CONTRACTIONS,
      STORAGE_KEYS.WEIGHT_ENTRIES,
      STORAGE_KEYS.SYMPTOM_LOGS,
      STORAGE_KEYS.VITAMIN_LOGS,
    ];
    return subscribeToData(() => setTick((n) => n + 1), trackedKeys);
  }, []);

  return useMemo(() => {
    const symptomsRaw = safeParseLocalStorage<Array<{ symptom?: string; date?: string }>>(
      STORAGE_KEYS.SYMPTOM_LOGS,
      []
    );
    const weightRaw = safeParseLocalStorage<Array<{ weight?: number; date?: string }>>(
      STORAGE_KEYS.WEIGHT_ENTRIES,
      []
    );
    const kicksRaw = safeParseLocalStorage<Array<{ count?: number; date?: string }>>(
      STORAGE_KEYS.KICK_SESSIONS,
      []
    );

    const recentSymptoms = symptomsRaw.slice(-5).map((s) => s.symptom).filter(Boolean);
    const lastWeight = weightRaw.length ? weightRaw[weightRaw.length - 1].weight : null;
    const recentKickCount = kicksRaw.slice(-3).reduce((sum, k) => sum + (k.count || 0), 0);

    return {
      pregnancyWeek: profile.pregnancyWeek || null,
      journeyStage: profile.journeyStage,
      mood: profile.mood || null,
      currentWeight: profile.weight ?? lastWeight ?? null,
      height: profile.height ?? null,
      healthConditions: profile.healthConditions?.length ? profile.healthConditions : null,
      recentSymptoms: recentSymptoms.length ? recentSymptoms : null,
      recentKicks72h: recentKickCount || null,
    };
  }, [profile, tick]);
}

export default function PregnancyAssistant() {
  const { t } = useTranslation();
  const dashboardContext = useDashboardContext();
  const [liveSearch, setLiveSearch] = useState(false);
  const { sendChat, isLoading, error } = useSmartChat({
    section: "pregnancy-plan",
    toolType: liveSearch ? "live-search" : "pregnancy-assistant",
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useResetOnLanguageChange(() => setMessages([]));

  // Auto-scroll only when a new message is added (not on every token tick).
  const lastMessageCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = { role: "user", content: trimmed };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      // Keep only the most recent turns to control token cost / latency.
      const trimmedHistory = updatedMessages.slice(-MAX_CONTEXT_TURNS);
      const chatHistory: ChatMessage[] = trimmedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let assistantContent = "";
      await sendChat({
        messages: chatHistory,
        context: { dashboard: dashboardContext },
        onDelta: (chunk) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, { role: "assistant", content: assistantContent }];
          });
        },
        onDone: () => {},
      });
    },
    [messages, isLoading, sendChat, dashboardContext]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setInput("");
  }, []);

  const headerAction =
    messages.length > 0 ? (
      <button
        type="button"
        onClick={resetChat}
        className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        {t("pregnancyAssistant.newChat", "محادثة جديدة")}
      </button>
    ) : null;

  return (
    <ToolFrame
      title={t("tools.pregnancyAssistant.title")}
      subtitle={t("pregnancyAssistant.subtitle")}
      customIcon="chat-assistant"
      mood="nurturing"
      toolId="pregnancy-assistant"
      noCard
    >
      <div className="space-y-3">
        {messages.length === 0 ? (
          <WelcomeView
            onSend={sendMessage}
            week={dashboardContext.pregnancyWeek}
          />
        ) : (
          <div className="space-y-4 px-1">
            {/* Reset action above messages */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/70">
                {t("pregnancyAssistant.contextNote", "الردود مبنية على بياناتكِ في لوحة التحكم")}
              </span>
              {headerAction}
            </div>

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm bg-gradient-to-br from-primary to-pink-500 text-primary-foreground rounded-te-sm"
                    dir="auto"
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-start">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl overflow-hidden shadow-sm border border-primary/15">
                    <div
                      className="h-1 w-full"
                      style={{
                        background:
                          "linear-gradient(90deg, hsl(var(--primary)), hsl(330 70% 55%), hsl(280 60% 55%))",
                      }}
                    />
                    <div className="px-3.5 py-3 bg-card" dir="auto">
                      <div className="prose prose-sm max-w-none text-sm text-start">
                        <MarkdownRenderer content={msg.content} accentColor="primary" />
                      </div>
                      <p className="text-[7px] text-muted-foreground/30 text-end mt-2">
                        {t("ai.resultDisclaimer")}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                        animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
            <Heart className="w-3.5 h-3.5 text-destructive shrink-0" />
            <p className="text-xs text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Sticky input */}
        <div className="sticky bottom-[4.5rem] z-30 mt-10 mb-3 bg-background/95 backdrop-blur-md rounded-2xl border border-border/40 shadow-lg">
          <LiveSearchToggle enabled={liveSearch} onToggle={setLiveSearch} />
          <InputArea
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            onSend={sendMessage}
            liveSearch={liveSearch}
          />
        </div>

        <div className="pb-1">
          <TrustIndicators />
        </div>
      </div>
    </ToolFrame>
  );
}

/* ─── Welcome View ─── */
function WelcomeView({
  onSend,
  week,
}: {
  onSend: (text: string) => void;
  week: number | null;
}) {
  const { t } = useTranslation();

  return (
    <div className="pt-2 pb-2">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-pink-500 to-rose-400 flex items-center justify-center shadow-lg shadow-primary/30 rotate-3">
            <Bot className="w-8 h-8 text-white drop-shadow-sm" />
          </div>
          <motion.div
            className="absolute -top-1.5 -right-1.5"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center shadow-md ring-2 ring-background">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary/30 rotate-3"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-1.5 max-w-xs"
        >
          <h3 className="text-base font-bold text-foreground">
            {t("pregnancyAssistant.hello")}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t("pregnancyAssistant.askAnything")}
          </p>
          {week ? (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
              <Sparkles className="w-2.5 h-2.5" />
              {t("pregnancyAssistant.weekBadge", "الأسبوع {{week}}", { week })}
            </span>
          ) : null}
        </motion.div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
          {quickQuestions.map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 200, damping: 15 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSend(t(q.textKey))}
              className={`group relative flex items-center gap-2 p-2.5 rounded-xl ${q.bg} border border-border/30 hover:border-primary/30 hover:shadow-md transition-shadow duration-200 text-start overflow-hidden min-w-0`}
            >
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${q.gradient} shadow-sm shrink-0`}>
                <q.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-foreground/80 leading-tight line-clamp-2 break-words">
                {t(q.textKey)}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Live Search Toggle ─── */
function LiveSearchToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40 transition-colors rounded-t-2xl ${
        enabled
          ? "bg-gradient-to-r from-primary/10 via-pink-500/10 to-purple-500/10"
          : "bg-transparent hover:bg-muted/40"
      }`}
      aria-pressed={enabled}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            enabled
              ? "bg-gradient-to-br from-primary to-pink-500 shadow-md shadow-primary/30"
              : "bg-muted"
          }`}
        >
          <Globe className={`w-3.5 h-3.5 ${enabled ? "text-primary-foreground" : "text-muted-foreground"}`} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <span className={`text-[12px] font-bold leading-tight ${enabled ? "text-primary" : "text-foreground"}`}>
            {t("pregnancyAssistant.liveSearch.title", "البحث الحي بالاستشهادات")}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {enabled
              ? t("pregnancyAssistant.liveSearch.onHint", "تكلفة 5 نقاط لكل بحث")
              : t("pregnancyAssistant.liveSearch.offHint", "اعتمد على مصادر الويب الموثوقة")}
          </span>
        </div>
      </div>
      <div
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
          enabled ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow-sm transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

/* ─── Input Area ─── */
function InputArea({
  input,
  setInput,
  isLoading,
  onSend,
  liveSearch,
}: {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  onSend: (text: string) => void;
  liveSearch: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="p-2.5">
      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            liveSearch
              ? t("pregnancyAssistant.liveSearch.placeholder", "اطرحي سؤالاً للبحث في أحدث المصادر...")
              : t("pregnancyAssistant.placeholder")
          }
          className="min-h-[44px] max-h-[120px] resize-none rounded-xl border-0 bg-transparent shadow-none text-sm flex-1 focus-visible:ring-0 text-start py-2.5"
          dir="auto"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend(input);
            }
          }}
        />
        <Button
          onClick={() => onSend(input)}
          disabled={!input.trim() || isLoading}
          size="icon"
          aria-label={t("pregnancyAssistant.send", "إرسال")}
          className={`h-11 w-11 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shrink-0 ${
            liveSearch
              ? "bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-500/90 hover:to-pink-500/90 shadow-purple-500/20"
              : "bg-gradient-to-br from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 shadow-primary/20"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

/* ─── Trust Indicators ─── */
function TrustIndicators() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap justify-center gap-3 text-[10px] sm:text-xs text-muted-foreground pb-2">
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        <span>{t("pregnancyAssistant.trustIndicators.available")}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>{t("pregnancyAssistant.trustIndicators.medical")}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
        <span>{t("pregnancyAssistant.trustIndicators.secure")}</span>
      </div>
    </div>
  );
}

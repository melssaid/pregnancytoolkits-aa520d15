import { memo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crown, Loader2, ChevronDown, ChevronUp, Bookmark, BookmarkCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { AIErrorBanner } from "@/components/ai/AIErrorBanner";
import { UsagePulseFooter } from "@/components/ai/UsagePulseFooter";
import { MiniUsageBar } from "@/components/ai/MiniUsageBar";
import { useSmartInsight } from "@/hooks/useSmartInsight";
import { useAIUsage } from "@/contexts/AIUsageContext";
import { useHolisticDashboardSnapshot } from "@/hooks/useHolisticDashboardSnapshot";
import { HolisticTimelineChart } from "@/components/dashboard/HolisticTimelineChart";
import { useSavedResults } from "@/hooks/useSavedResults";
import { useSonarSettings } from "@/lib/sonarSettings";
import { Link } from "react-router-dom";
import { Settings2 } from "lucide-react";

/**
 * Premium "Holistic AI Analysis" card — synthesises ALL tracked dashboard
 * data into one executive wellness brief via the Pro model. Cost: 7 points.
 */
export const HolisticAIAnalysisCard = memo(function HolisticAIAnalysisCard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";
  const { snapshot, derivedInsights, contextSummary, dataRichness, hasMinimumData, sourcesCount } =
    useHolisticDashboardSnapshot();
  const { isLimitReached } = useAIUsage();

  const { generate, isLoading, content, error, errorType, clearError } = useSmartInsight({
    section: "pregnancy-plan",
    toolType: "holistic-dashboard",
  });
  const { save, isSaved, unsaveByContent, results: savedResults } = useSavedResults("holistic-dashboard");
  const { settings: sonar } = useSonarSettings();

  const [hasGenerated, setHasGenerated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [pulseKey, setPulseKey] = useState(0);
  const prevContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (content && !isLoading && prevContentRef.current !== content) {
      prevContentRef.current = content;
      setPulseKey((k) => k + 1);
    }
    if (!content) prevContentRef.current = null;
  }, [content, isLoading]);

  const handleGenerate = async () => {
    if (isLoading || isLimitReached || !hasMinimumData) return;
    clearError();
    setHasGenerated(true);
    setIsExpanded(true);

    // Pull optional sources per Sonar settings
    const lastSavedReport = sonar.includeSavedReport ? savedResults?.[0] : null;
    const nutritionResults = sonar.includeNutritionCard
      ? (() => {
          try {
            const raw = localStorage.getItem("ai-saved-results");
            const all = raw ? JSON.parse(raw) : [];
            return Array.isArray(all)
              ? all.filter((r: any) => r?.toolId === "ai-meal-suggestion").slice(-2)
              : [];
          } catch { return []; }
        })()
      : [];

    const sections: string[] = [];
    sections.push(
      `Below is a pre-computed holistic wellness brief of my dashboard tracking data. ` +
      `It already includes derived trends, averages, risk flags, and positive signals — ` +
      `please ANALYSE and synthesise it (do not just restate the numbers). ` +
      `Connect related signals where meaningful.`,
    );

    sections.push(`\n### Sonar Scope: ${sonar.scope.toUpperCase()} (window: ${sonar.timelineWindow}d)`);

    if (sonar.scope === "snapshot" || sonar.scope === "both") {
      sections.push(`\n### Snapshot Brief\n${contextSummary}`);
    }
    if (sonar.scope === "timeline" || sonar.scope === "both") {
      sections.push(
        `\n### Timeline Reference\n` +
        `Refer to the user's last ${sonar.timelineWindow}-day trend chart (weight, mood, hydration, symptoms). ` +
        `Comment on direction/consistency only when meaningful.`,
      );
    }
    if (lastSavedReport?.content) {
      const excerpt = String(lastSavedReport.content).slice(0, 600).replace(/\s+/g, " ");
      sections.push(`\n### Previous Saved Report (excerpt)\n${excerpt}`);
    }
    if (nutritionResults.length > 0) {
      const titles = nutritionResults
        .map((m: any) => m?.title || m?.summary)
        .filter(Boolean)
        .join(" • ");
      if (titles) sections.push(`\n### Recent Nutrition Card\nRecent meal suggestions: ${titles}`);
    }

    await generate({
      prompt: sections.join("\n"),
      context: {
        language: lang,
        weekNumber: snapshot.profile.pregnancyWeek,
        riskFlagsCount: derivedInsights.riskFlags.length,
        positiveSignalsCount: derivedInsights.positiveSignals.length,
        engagementScore: derivedInsights.engagementScore,
        sonarScope: sonar.scope,
        sonarWindow: sonar.timelineWindow,
        sonarIncludeSavedReport: sonar.includeSavedReport,
        sonarIncludeNutrition: sonar.includeNutritionCard,
      },
      skipCache: hasGenerated,
    });
  };

  return (
    <Card
      className="overflow-hidden border-0 relative"
      style={{
        background:
          "linear-gradient(135deg, hsl(340 60% 97%) 0%, hsl(320 50% 96%) 50%, hsl(280 50% 96%) 100%)",
        boxShadow:
          "0 8px 28px -10px hsl(330 50% 50% / 0.25), 0 2px 6px -2px hsl(280 40% 40% / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.6)",
        border: "1px solid hsl(45 70% 75% / 0.4)",
      }}
    >
      {/* Decorative shimmer */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 80% 0%, hsl(45 90% 80% / 0.4), transparent 50%), radial-gradient(circle at 0% 100%, hsl(280 70% 80% / 0.3), transparent 50%)",
        }}
      />

      <CardContent className="relative pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-[15px] text-foreground leading-tight">
                {t("dashboardV2.holistic.title")}
              </h3>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(45 90% 50%), hsl(35 90% 50%))",
                  boxShadow: "0 2px 6px -1px hsl(35 80% 45% / 0.4)",
                }}
              >
                <Crown className="w-2.5 h-2.5" />
                {t("dashboardV2.holistic.cost")}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
              {t("dashboardV2.holistic.subtitle")}
            </p>
          </div>
        </div>

        {/* Data richness bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">
              {t("dashboardV2.holistic.dataRichness", { value: dataRichness })}
            </span>
            <span className="text-foreground/60 tabular-nums font-semibold">{sourcesCount}/10</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "hsl(0 0% 0% / 0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(var(--primary)), hsl(330 65% 55%), hsl(280 60% 55%))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${dataRichness}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Sonar source chip + settings link */}
        <Link
          to="/settings"
          className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] hover:bg-white/50 transition-colors"
          style={{ background: "hsl(0 0% 100% / 0.4)", border: "1px solid hsl(330 30% 90% / 0.5)" }}
        >
          <span className="flex items-center gap-1.5 text-foreground/75 font-medium min-w-0 truncate">
            <Settings2 className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {t(`settings.sonar.scope.${sonar.scope}.label`)}
              {(sonar.scope === "timeline" || sonar.scope === "both") && ` · ${sonar.timelineWindow}d`}
            </span>
          </span>
          <span className="text-primary font-semibold shrink-0">
            {t("settings.sonar.changeShort")}
          </span>
        </Link>

        {/* Min data warning */}
        {!hasMinimumData && (
          <p className="text-[12px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 leading-relaxed">
            {t("dashboardV2.holistic.minDataNeeded")}
          </p>
        )}

        {/* Preview chip — shows derived insights count BEFORE consuming points */}
        {hasMinimumData && !hasGenerated && (derivedInsights.positiveSignals.length > 0 || derivedInsights.riskFlags.length > 0) && (
          <div className="flex items-center justify-center gap-2 text-[11px] text-foreground/70 bg-white/40 rounded-lg px-2.5 py-1.5">
            {derivedInsights.positiveSignals.length > 0 && (
              <span className="flex items-center gap-1 font-medium">
                <span className="text-done">●</span>
                {t("dashboardV2.holistic.preview.positive", { count: derivedInsights.positiveSignals.length })}
              </span>
            )}
            {derivedInsights.positiveSignals.length > 0 && derivedInsights.riskFlags.length > 0 && (
              <span className="text-foreground/30">•</span>
            )}
            {derivedInsights.riskFlags.length > 0 && (
              <span className="flex items-center gap-1 font-medium">
                <span className="text-amber-600">●</span>
                {t("dashboardV2.holistic.preview.watchouts", { count: derivedInsights.riskFlags.length })}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        {!hasGenerated && (
          <motion.button
            onClick={handleGenerate}
            disabled={isLoading || !hasMinimumData || isLimitReached}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            className="w-full relative overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div
              className="w-full flex items-center justify-center gap-2 px-5 h-[52px] font-semibold text-white text-[14px] rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(330 65% 50%) 50%, hsl(280 55% 50%) 100%)",
                boxShadow:
                  "0 4px 18px -2px hsl(var(--primary) / 0.45), 0 1px 4px hsl(280 50% 40% / 0.25)",
              }}
            >
              {isLoading ? (
                <Loader2 className="w-[18px] h-[18px] animate-spin shrink-0" />
              ) : (
                <Sparkles className="w-[18px] h-[18px] shrink-0" />
              )}
              <span className="leading-tight">{t("dashboardV2.holistic.cta")}</span>
            </div>
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full rtl:translate-x-full rtl:group-hover:-translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
              aria-hidden
            />
          </motion.button>
        )}

        <MiniUsageBar toolType="holistic-dashboard" section="pregnancy-plan" hideHint />

        {/* Error */}
        {error && (
          <AIErrorBanner
            errorType={errorType}
            message={error}
            onRetry={() => {
              setHasGenerated(false);
              handleGenerate();
            }}
            onDismiss={clearError}
          />
        )}

        {/* Result */}
        <AnimatePresence>
          {hasGenerated && (content || isLoading) && !error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-1 border-t border-primary/15 space-y-3">
                {/* Compact 7/30-day timeline (weight, mood, hydration, symptoms) */}
                {(sonar.scope === "timeline" || sonar.scope === "both") && (
                  <HolisticTimelineChart initialRange={sonar.timelineWindow} />
                )}

                {content && (
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <button
                      onClick={() => setIsExpanded((v) => !v)}
                      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>
                        {isExpanded
                          ? t("toolsInternal.aiInsights.clickToCollapse")
                          : t("toolsInternal.aiInsights.clickToExpand")}
                      </span>
                    </button>
                    {(() => {
                      const saved = isSaved(content);
                      return (
                        <button
                          onClick={() =>
                            saved
                              ? unsaveByContent(content)
                              : save({
                                  toolId: "holistic-dashboard",
                                  title: t("dashboardV2.holistic.title"),
                                  content,
                                  meta: {
                                    pointsCost: 7,
                                    week: snapshot.profile.pregnancyWeek,
                                    riskFlags: derivedInsights.riskFlags.length,
                                    positiveSignals: derivedInsights.positiveSignals.length,
                                    engagementScore: derivedInsights.engagementScore,
                                  },
                                })
                          }
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full transition-all"
                          style={{
                            background: saved ? "hsl(var(--primary) / 0.12)" : "hsl(0 0% 100% / 0.55)",
                            color: saved ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.7)",
                            border: `1px solid ${saved ? "hsl(var(--primary) / 0.3)" : "hsl(0 0% 0% / 0.08)"}`,
                          }}
                        >
                          {saved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                          {t(saved ? "dashboardV2.holistic.saved" : "dashboardV2.holistic.save")}
                        </button>
                      );
                    })()}
                  </div>
                )}

                {isLoading && !content && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="relative my-3 overflow-hidden rounded-2xl px-5 py-6"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--accent) / 0.06))",
                      border: "1px solid hsl(var(--primary) / 0.18)",
                      boxShadow: "0 4px 20px -8px hsl(var(--primary) / 0.25)",
                    }}
                  >
                    {/* Animated shimmer sweep */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(110deg, transparent 30%, hsl(var(--primary) / 0.10) 50%, transparent 70%)",
                      }}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                    />

                    <div className="relative flex flex-col items-center justify-center gap-3">
                      {/* Pro dual-ring spinner */}
                      <div className="relative w-12 h-12">
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            border: "2.5px solid hsl(var(--primary) / 0.15)",
                            borderTopColor: "hsl(var(--primary))",
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                          className="absolute inset-1.5 rounded-full"
                          style={{
                            border: "2px solid hsl(var(--accent) / 0.15)",
                            borderBottomColor: "hsl(var(--accent))",
                          }}
                          animate={{ rotate: -360 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Sparkles className="w-4 h-4 text-primary" />
                        </motion.div>
                      </div>

                      {/* Bold loading label */}
                      <span className="text-[13px] font-extrabold text-primary tracking-tight text-center">
                        {t("toolsInternal.aiInsights.generatingInsights")}
                      </span>

                      {/* Animated dots */}
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                            transition={{
                              duration: 1.1,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {content && isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MarkdownRenderer content={content} />
                  </motion.div>
                )}

                {hasGenerated && !isLoading && content && (
                  <UsagePulseFooter
                    toolType="holistic-dashboard"
                    section="pregnancy-plan"
                    justConsumed={pulseKey > 0}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
});

export default HolisticAIAnalysisCard;

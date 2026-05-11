import { lazy, Suspense, useState, useEffect, useCallback, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { useSmartConversionPrompt } from "@/hooks/useSmartConversionPrompt";
import { useTrimesterTheme } from "@/hooks/useTrimesterTheme";
import { useStageTheme } from "@/hooks/useStageTheme";
import { JourneyProgressRibbon } from "@/components/journey/JourneyProgressRibbon";
import { TrustStrip } from "@/components/dashboard/TrustStrip";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sun, BarChart3, Calendar, LayoutGrid } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { subscribeToData, STORAGE_KEYS } from "@/lib/dataBus";

// Maps a canonical storage key to the i18n key used in the toast title.
// Anything unmapped falls back to a generic "dashboard updated" message.
const TOOL_KEY_LABELS: Record<string, string> = {
  [STORAGE_KEYS.KICK_SESSIONS]:  "dashboardV2.toolNames.kicks",
  [STORAGE_KEYS.CONTRACTIONS]:   "dashboardV2.toolNames.contractions",
  [STORAGE_KEYS.WEIGHT_ENTRIES]: "dashboardV2.toolNames.weight",
  [STORAGE_KEYS.SYMPTOM_LOGS]:   "dashboardV2.toolNames.symptoms",
  [STORAGE_KEYS.VITAMIN_LOGS]:   "dashboardV2.toolNames.vitamins",
  [STORAGE_KEYS.DIAPER_ENTRIES]: "dashboardV2.toolNames.diapers",
  [STORAGE_KEYS.BABY_SLEEP]:     "dashboardV2.toolNames.sleep",
  [STORAGE_KEYS.BABY_GROWTH]:    "dashboardV2.toolNames.growth",
  [STORAGE_KEYS.APPOINTMENTS]:   "dashboardV2.toolNames.appointments",
  [STORAGE_KEYS.SAVED_RESULTS]:  "dashboardV2.toolNames.saved",
};

const TRACKED_KEYS = Object.keys(TOOL_KEY_LABELS);

// Today tab is eager — first paint
import { TodayTab } from "@/components/dashboard/tabs/TodayTab";
import { DashboardTabSkeleton } from "@/components/dashboard/DashboardTabSkeleton";

// Lazy-loaded tabs to shrink initial bundle
const InsightsTab = lazy(() => import("@/components/dashboard/tabs/InsightsTab"));
const ArchiveTab = lazy(() => import("@/components/dashboard/tabs/ArchiveTab"));
const MoreTab = lazy(() => import("@/components/dashboard/tabs/MoreTab"));

const TAB_KEY = "dashboard_active_tab";
type TabKey = "today" | "insights" | "archive" | "more";

const SmartDashboard = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  useSmartConversionPrompt();
  const trimesterTheme = useTrimesterTheme();
  const stageTheme = useStageTheme();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const saved = sessionStorage.getItem(TAB_KEY) as TabKey | null;
      if (saved && ["today", "insights", "archive", "more"].includes(saved)) return saved;
    } catch {}
    return "today";
  });

  // Restore scroll per-tab
  useEffect(() => {
    try {
      const y = sessionStorage.getItem(`dashboard_tab_scroll_${activeTab}`);
      if (y) window.scrollTo(0, parseInt(y, 10));
      else window.scrollTo(0, 0);
    } catch {}
  }, [activeTab]);

  // Save scroll position
  useEffect(() => {
    const onScroll = () => {
      try {
        sessionStorage.setItem(`dashboard_tab_scroll_${activeTab}`, String(window.scrollY));
      } catch {}
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeTab]);

  // ── Toast on any tracked tool save ────────────────────────────────────────
  // Subscribe once. Throttle to 1.5s so rapid writes (e.g. kick counter)
  // collapse into a single toast. Auto-dismisses after 2s; sonner inherits
  // page direction from <html dir="…"> so RTL works without extra config,
  // but we pass `dir` explicitly to be safe.
  const lastToastAtRef = useRef(0);
  useEffect(() => {
    const unsubscribe = subscribeToData((payload) => {
      // Only react to saves originating from this tab — cross-tab "storage"
      // events would create noise on the dashboard while another tab is open.
      if (payload.source !== "self") return;

      const now = Date.now();
      if (now - lastToastAtRef.current < 1500) return;
      lastToastAtRef.current = now;

      const labelKey = TOOL_KEY_LABELS[payload.key];
      const message = labelKey
        ? t("dashboardV2.toasts.toolUpdated", "تم تحديث {{tool}}", {
            tool: t(labelKey),
          })
        : t("dashboardV2.toasts.dashboardUpdated", "تم تحديث لوحة التحكم");

      toast(message, {
        duration: 2000,
        // Sonner reads direction from the document <html dir="…">, which is
        // already kept in sync with the active language by ToolFrame/Layout.
        className: `text-sm rounded-2xl ${isRTL ? "text-right" : "text-left"}`,
      });
    }, TRACKED_KEYS);

    return unsubscribe;
  }, [t, isRTL]);

  const handleTabChange = useCallback((value: string) => {
    haptic("tap");
    const next = value as TabKey;
    try { sessionStorage.setItem(TAB_KEY, next); } catch {}
    setActiveTab(next);
  }, []);

  // Decorative emblem removed — header is now title-only.


  // Each tab gets its own gradient + accent for the active glass pill icon
  const tabs: Array<{
    key: TabKey; icon: typeof Sun; tKey: string;
    grad: string; activeIcon: string; iconShadow: string;
  }> = [
    { key: "today",    icon: Sun,        tKey: "dashboardV2.tabs.today",
      grad: "from-amber-400/90 to-orange-500/90",   activeIcon: "text-amber-500",  iconShadow: "drop-shadow-[0_1px_3px_hsl(35_95%_55%/0.55)]" },
    { key: "insights", icon: BarChart3,  tKey: "dashboardV2.tabs.insights",
      grad: "from-sky-400/90 to-cyan-500/90",       activeIcon: "text-sky-500",    iconShadow: "drop-shadow-[0_1px_3px_hsl(200_95%_55%/0.55)]" },
    { key: "archive",  icon: Calendar,   tKey: "dashboardV2.tabs.archive",
      grad: "from-[hsl(345_85%_72%)]/90 to-[hsl(15_88%_68%)]/90",   activeIcon: "text-[hsl(345_75%_55%)]",iconShadow: "drop-shadow-[0_1px_3px_hsl(345_80%_55%/0.55)]" },
    { key: "more",     icon: LayoutGrid, tKey: "dashboardV2.tabs.more",
      grad: "from-fuchsia-400/90 to-purple-500/90", activeIcon: "text-fuchsia-500",iconShadow: "drop-shadow-[0_1px_3px_hsl(290_85%_60%/0.55)]" },
  ];

  return (
    <Layout>
      <SEOHead
        title={t("dashboardV2.seo.title")}
        description={t("dashboardV2.seo.description")}
      />

      <main dir={isRTL ? "rtl" : "ltr"} className={`relative pb-24 bg-gradient-to-b ${stageTheme.gradient}`}>
        {/* Premium page header — title + discreet journey ribbon */}
        <header className="container relative z-10 px-3 sm:px-4 pt-5 pb-2">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-foreground">
              {t("dashboardV2.header.title")}
            </h1>
          </motion.div>

          {/* Always-visible journey ribbon — discreet, formal, never gamified */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2.5"
          >
            <JourneyProgressRibbon onSelect={() => navigate("/my-journey")} />
          </motion.div>

          {/* Persistent trust signal — privacy + scope */}
          <TrustStrip />
        </header>


        <Tabs value={activeTab} onValueChange={handleTabChange} dir={isRTL ? "rtl" : "ltr"} className="relative z-10">
          {/* ═══════════════════════════════════════════════════════════
              STICKY GLASS TAB BAR — refined frosted dock with layered
              inner shadow, dual-tone gradient, ambient sheen.
              ═══════════════════════════════════════════════════════════ */}
          <div
            className="sticky top-[3.25rem] sm:top-[4rem] z-30 px-3 sm:px-4 pt-2.5 pb-2.5
                       bg-gradient-to-b from-background/85 via-background/70 to-background/40
                       backdrop-blur-2xl
                       border-b border-white/25 dark:border-white/5
                       shadow-[0_10px_28px_-14px_hsl(var(--primary)/0.22)]"
          >
            <TabsList
              className="relative grid h-auto w-full grid-cols-4 gap-1 rounded-2xl p-1.5
                         bg-gradient-to-b from-white/55 via-white/40 to-white/30
                         dark:from-white/[0.07] dark:via-white/[0.04] dark:to-white/[0.02]
                         backdrop-blur-xl
                         border border-white/55 dark:border-white/10
                         shadow-[inset_0_1.5px_0_0_hsl(0_0%_100%/0.75),inset_0_-1px_0_0_hsl(220_30%_50%/0.08),0_4px_14px_-4px_hsl(var(--primary)/0.12)]
                         ring-1 ring-white/30 dark:ring-white/5"
              aria-label={t("dashboardV2.header.sectionsAria")}
            >
              {/* Inner ambient sheen — soft top-down highlight for glass depth */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
                style={{
                  background:
                    "radial-gradient(120% 100% at 50% -20%, hsl(0 0% 100% / 0.55) 0%, transparent 55%)",
                }}
              />

              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className={`group relative flex h-12 sm:h-14 flex-col items-center justify-center gap-0.5
                               rounded-xl border-0 bg-transparent
                               text-[10px] font-bold
                               transition-[color,transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                               data-[state=active]:shadow-none
                               focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background/40
                               active:scale-[0.97]
                               ${isActive
                                 ? `${tab.activeIcon} -translate-y-[1px]`
                                 : "text-muted-foreground hover:text-foreground/85 hover:-translate-y-[0.5px]"}`}
                  >
                    {/* Inactive hover veil — soft frosted layer that fades in */}
                    {!isActive && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-xl
                                   bg-gradient-to-b from-white/55 via-white/30 to-white/10
                                   dark:from-white/[0.08] dark:via-white/[0.04] dark:to-transparent
                                   opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100
                                   transition-opacity duration-300 ease-out"
                      />
                    )}

                    {/* Active glass pill — animated layout transition between tabs */}
                    {isActive && (
                      <motion.span
                        layoutId="dashboard-tab-glass"
                        className="absolute inset-0 rounded-xl
                                   bg-gradient-to-b from-white/95 via-white/75 to-white/60
                                   dark:from-white/20 dark:via-white/10 dark:to-white/5
                                   backdrop-blur-md
                                   border border-white/80 dark:border-white/15
                                   shadow-[inset_0_1.5px_0_0_hsl(0_0%_100%/0.95),inset_0_-1px_0_0_hsl(var(--primary)/0.08),0_6px_16px_-6px_hsl(var(--primary)/0.32)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.6 }}
                      />
                    )}

                    {/* Active underline accent — thin gradient bar at base for crisp identity */}
                    {isActive && (
                      <motion.span
                        layoutId="dashboard-tab-underline"
                        aria-hidden
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] w-7 sm:w-8 rounded-full
                                   bg-gradient-to-r from-transparent via-primary to-transparent
                                   shadow-[0_0_6px_hsl(var(--primary)/0.45)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Per-tab icon medallion: vivid gradient swatch when active, soft halo on hover when inactive */}
                    <span
                      className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg
                                  transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isActive
                          ? `bg-gradient-to-br ${tab.grad} shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.55),0_2px_6px_-2px_hsl(var(--primary)/0.35)] scale-105`
                          : "bg-transparent group-hover:bg-white/40 dark:group-hover:bg-white/5 group-hover:scale-[1.06]"
                      }`}
                    >
                      <Icon
                        className={`transition-all duration-300 ease-out ${
                          isActive
                            ? `h-[15px] w-[15px] sm:h-4 sm:w-4 text-white ${tab.iconShadow}`
                            : "h-[17px] w-[17px] sm:h-[18px] sm:w-[18px] group-hover:text-foreground/85"
                        }`}
                        strokeWidth={isActive ? 2.4 : 2}
                      />
                    </span>
                    <span
                      className={`relative z-10 leading-tight mt-0.5 text-[9px] sm:text-[10px] text-center px-0.5
                                  transition-all duration-300 ${
                                    isActive ? "tracking-[0.01em]" : "tracking-normal"
                                  }`}
                    >
                      {t(tab.tKey)}
                    </span>
                  </TabsTrigger>
                );
              })}

              {/* ═══════════════════════════════════════════════════════════
                  GRADUATED SHADOW DIVIDERS — elegant bands between tab sections
                  Three separators between four tabs, each with layered
                  graduated shadows fading at top & bottom for a glass-ridge feel.
                  ═══════════════════════════════════════════════════════════ */}
              {[1, 2, 3].map((pos) => (
                <div
                  key={`tab-band-${pos}`}
                  className="absolute top-2 bottom-2 pointer-events-none select-none"
                  style={{ left: `${pos * 25}%`, transform: "translateX(-50%)" }}
                >
                  {/* Soft ambient halo — primary-tinted glow for atmosphere */}
                  <div className="absolute inset-y-0 -inset-x-3 rounded-full bg-gradient-to-b from-transparent via-primary/[0.06] via-50% to-transparent blur-[4px]" />
                  {/* Core graduated ridge line — crisp hairline divider */}
                  <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-[1.5px] rounded-full bg-gradient-to-b from-transparent via-border/50 via-45% to-transparent" />
                  {/* Top highlight pearl — adds glassy depth & focal point */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white/70 dark:bg-white/20 blur-[1.5px]" />
                  {/* Inner glass highlight strand — subtle vertical sheen */}
                  <div className="absolute inset-y-2.5 left-1/2 -translate-x-1/2 w-px rounded-full bg-gradient-to-b from-transparent via-white/45 via-45% to-transparent" />
                </div>
              ))}
            </TabsList>
          </div>

          {/* Tab contents */}
          <div className="container px-3 sm:px-4 pt-4">
            <TabsContent value="today" className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-300">
              <TodayTab />
            </TabsContent>

            <TabsContent value="insights" className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-300">
              <Suspense fallback={<DashboardTabSkeleton tab="insights" />}>
                <InsightsTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="archive" className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-300">
              <Suspense fallback={<DashboardTabSkeleton tab="archive" />}>
                <ArchiveTab />
              </Suspense>
            </TabsContent>

            <TabsContent value="more" className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-300">
              <Suspense fallback={<DashboardTabSkeleton tab="more" />}>
                <MoreTab />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </Layout>
  );
};

export default SmartDashboard;

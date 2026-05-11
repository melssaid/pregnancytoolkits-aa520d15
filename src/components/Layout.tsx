import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Shield, Heart, Settings, Crown, Bell, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
const logoImage = "/logo.webp";
import { useTranslation } from "react-i18next";
import { BackButton } from "./BackButton";
import { BottomNavigation } from "./BottomNavigation";
import { EncryptionIndicator } from "./EncryptionIndicator";
import { LanguageDropdown } from "./LanguageDropdown";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { NotificationsPanel } from "./dashboard/NotificationsPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { TrialExpiryBanner } from "./TrialExpiryBanner";
import { BreadcrumbSchema } from "./BreadcrumbSchema";
import { lazy, Suspense } from "react";
import { getTotalToolsCount } from "@/lib/tools-data";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useEngagementSignals } from "@/hooks/useEngagementSignals";

const SmartInstallBanner = lazy(() => import("./SmartInstallBanner"));


interface LayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  compactBackHeader?: boolean;
}

export function Layout({ children, showBack = false, compactBackHeader = false }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const { tier } = useSubscriptionStatus();
  const isPremium = tier === "premium";
  const { unreadCount } = useNotifications();
  useEngagementSignals();
  const isRtl = i18n.language === 'ar';
  const trustItems = [
    t('layout.trustBar.scienceBacked', 'Science-Backed'),
    t('layout.trustBar.aiTools', { count: getTotalToolsCount(), defaultValue: '{{count}}+ Smart Tools' }),
    t('layout.trustBar.premium'),
  ];

  // Smooth sticky header transition on scroll
  const { scrollY } = useScroll();
  const rawHeight = useTransform(scrollY, [0, 80], [72, 56]);
  const rawLogo = useTransform(scrollY, [0, 80], [54, 40]);
  const rawShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 1px 2px hsl(340 40% 30% / 0.04)", "0 8px 24px -12px hsl(340 50% 35% / 0.18)"]
  );
  const rawBg = useTransform(scrollY, [0, 80], ["hsl(var(--card) / 0.96)", "hsl(var(--card) / 0.88)"]);
  const headerHeight = useSpring(rawHeight, { stiffness: 180, damping: 26, mass: 0.4 });
  const logoSize = useSpring(rawLogo, { stiffness: 180, damping: 26, mass: 0.4 });

  return (
    <div
      className="min-h-screen bg-background flex flex-col overflow-x-hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingInlineStart: 'env(safe-area-inset-left)',
        paddingInlineEnd: 'env(safe-area-inset-right)',
      }}
    >
      <BreadcrumbSchema />
      {/* Trial Expiry Banner */}
      <TrialExpiryBanner />
      {/* Trust Bar - Above header */}
      <motion.div 
        className="relative overflow-hidden border-b border-border/40 bg-primary text-primary-foreground shadow-banner"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15 pointer-events-none" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 4.5, ease: 'linear' }}
        />
        <div className="relative px-3 pb-2 pt-2">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1.5 backdrop-blur-sm">
            {trustItems.map((item, index) => (
              <div key={item} className="flex min-w-0 items-center gap-2">
                {index > 0 && <span className="h-1 w-1 rounded-full bg-primary-foreground/55" aria-hidden="true" />}
                <motion.span
                  className={`min-w-0 truncate ${isRtl ? 'text-[10px]' : 'text-[9px]'} font-extrabold tracking-[0.08em] text-primary-foreground/95 ${index === 2 ? 'hidden sm:inline' : ''}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 + index * 0.08, duration: 0.45, ease: 'easeOut' }}
                >
                  {item}
                </motion.span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-[2px] overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary-foreground/15 via-primary-foreground/55 to-primary-foreground/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          />
          <motion.div
            className="absolute h-full w-1/3 bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[1px]"
            initial={{ x: '-100%' }}
            animate={{ x: '500%' }}
            transition={{ delay: 0.8, duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>


      {/* Header - flush with trust bar, refined curved bottom with soft side shadow */}
      <motion.header
        className="relative sticky top-0 z-50 border-b border-border/40 backdrop-blur-md will-change-transform"
        style={{ backgroundColor: rawBg, boxShadow: rawShadow }}
      >
        {/* Curved bottom edge — responsive: subtler on mobile, deeper on tablets+ */}
        <div className="absolute -bottom-[10px] sm:-bottom-[14px] md:-bottom-[18px] left-0 right-0 h-[14px] sm:h-[20px] md:h-[26px] overflow-visible pointer-events-none z-10">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <filter id="header-curve-shadow" x="-8%" y="-20%" width="116%" height="180%">
                <feDropShadow dx="-3" dy="6" stdDeviation="8" floodColor="hsl(340 65% 52%)" floodOpacity="0.10" />
                <feDropShadow dx="3" dy="6" stdDeviation="8" floodColor="hsl(340 65% 52%)" floodOpacity="0.10" />
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="hsl(25 20% 18%)" floodOpacity="0.06" />
              </filter>
            </defs>
            <path
              d="M0,0 L0,14 C210,120 515,120 720,120 C925,120 1230,120 1440,14 L1440,0 Z"
              className="fill-card"
              filter="url(#header-curve-shadow)"
            />
          </svg>
        </div>
        <motion.div dir={showBack ? 'ltr' : undefined} style={{ height: headerHeight }} className={`mx-auto flex max-w-4xl items-center ${showBack ? 'justify-between' : 'justify-center'} px-3 sm:px-4`}>
          {showBack ? (
            /* Sub-pages: back button + logo + name on left */
            <div className="flex items-center gap-2.5">
              <BackButton />
              <Link to="/" className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 80, height: 80 }}>
                  {/* Rotating ring */}
                  <>
                    <motion.div
                      className="absolute rounded-full border border-primary/15"
                      style={{ width: 76, height: 76 }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const angle = (i / 6) * 360;
                      const radius = 34;
                      const isPink = i % 2 === 1;
                      return (
                        <motion.span
                          key={i}
                          className={`absolute ${isPink ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]' : 'text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]'}`}
                          style={{ fontSize: isPink ? 11 : 10 }}
                          animate={isPink ? {
                            x: [
                              Math.cos((angle * Math.PI) / 180) * radius,
                              Math.cos(((angle + 180) * Math.PI) / 180) * (radius * 0.7),
                              Math.cos(((angle + 360) * Math.PI) / 180) * radius,
                            ],
                            y: [
                              Math.sin((angle * Math.PI) / 180) * radius,
                              Math.sin(((angle + 180) * Math.PI) / 180) * (radius * 0.7),
                              Math.sin(((angle + 360) * Math.PI) / 180) * radius,
                            ],
                            scale: [0.6, 1.5, 0.6],
                            opacity: [0.3, 0.9, 0.3],
                            rotate: [0, 20, -20, 0],
                          } : {
                            x: [
                              Math.cos((angle * Math.PI) / 180) * radius,
                              Math.cos(((angle + 360) * Math.PI) / 180) * radius,
                            ],
                            y: [
                              Math.sin((angle * Math.PI) / 180) * radius,
                              Math.sin(((angle + 360) * Math.PI) / 180) * radius,
                            ],
                            scale: [0.8, 1.3, 0.8],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={isPink ? {
                            x: { duration: 12, repeat: Infinity, ease: "easeInOut" },
                            y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
                            opacity: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
                            rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                          } : {
                            x: { duration: 8, repeat: Infinity, ease: "linear" },
                            y: { duration: 8, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                            opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
                          }}
                        >
                          ♥
                        </motion.span>
                      );
                    })}
                    <motion.div
                      className="absolute rounded-full bg-primary/8 blur-lg"
                      style={{ width: 68, height: 68 }}
                      animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </>
                  <div className="rounded-full overflow-hidden shadow-lg h-11 w-11">
                    <img
                      src={logoImage}
                      alt="Pregnancy Toolkits"
                      width={44}
                      height={44}
                      className="w-full h-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  </div>
                </div>
                {!compactBackHeader && (
                  <span className="text-[13px] font-extrabold text-foreground tracking-tight leading-snug break-words" style={{ fontFamily: "'Tajawal', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700 }}>
                    {t('app.name')}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            /* Homepage: centered logo only, no title */
            <>
              {/* Left spacer for centering */}
              <div className="absolute left-3 flex items-center gap-2 sm:left-4">
                <LanguageDropdown variant="compact" />
              </div>
              <Link to="/" className="relative z-30 flex items-center justify-center -translate-y-[4px] sm:-translate-y-[6px] md:-translate-y-[8px]">
                <span
                  aria-hidden="true"
                  className="absolute inset-1 rounded-full bg-primary/15 blur-md opacity-70"
                />
                <motion.div
                  style={{ width: logoSize, height: logoSize }}
                  className="relative z-10 overflow-hidden rounded-full border border-border/60 bg-card/95 ring-[3px] sm:ring-4 ring-background/95 shadow-[0_10px_22px_-14px_hsl(var(--foreground)/0.4)]"
                >
                  <img
                    src={logoImage}
                    alt="Pregnancy Toolkits"
                    width={68}
                    height={68}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                  />
                </motion.div>
              </Link>
              <div className="absolute right-3 flex items-center gap-1.5 sm:right-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <button
                      type="button"
                      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground/75 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:text-foreground hover:bg-card active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      title={t('settings.notifications', 'التنبيهات')}
                      aria-label={t('settings.notifications', 'التنبيهات')}
                    >
                      <Bell className="h-[16px] w-[16px]" strokeWidth={2.2} aria-hidden="true" focusable="false" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center border border-card">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md p-0 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2.5 bg-background/95 backdrop-blur-md border-b border-border/50">
                      <SheetClose asChild>
                        <button
                          type="button"
                          aria-label={t('common.back', 'رجوع')}
                          className="flex items-center gap-1.5 h-9 px-2.5 rounded-full text-foreground/80 hover:bg-secondary/70 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {isRtl ? <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} /> : <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />}
                          <span className="text-[12px] font-bold">{t('common.back', 'رجوع')}</span>
                        </button>
                      </SheetClose>
                      <span className="ms-auto text-[13px] font-extrabold text-foreground/90">
                        {t('settings.notifications', 'التنبيهات')}
                      </span>
                    </div>
                    <div className="p-4"><NotificationsPanel /></div>
                  </SheetContent>
                </Sheet>
                {!isPremium && (
                  <Link
                    to="/pricing-demo"
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-secondary-foreground shadow-sm transition-all duration-300 hover:border-primary/25 hover:bg-secondary/90 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    title={t('pricing.upgradeTitle', 'Upgrade to PRO')}
                    aria-label={t('pricing.upgradeTitle', 'Upgrade to PRO')}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Crown className="h-[16px] w-[16px]" strokeWidth={2} aria-hidden="true" focusable="false" />
                    </motion.div>
                    <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-card bg-primary" />
                  </Link>
                )}
                <div className="hidden md:flex">
                  <EncryptionIndicator />
                </div>
                <Link
                  to="/settings"
                  className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground/75 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:text-foreground hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  title={t('settings.title', 'Settings')}
                  aria-label={t('settings.title', 'Settings')}
                >
                  <Settings className="h-[16px] w-[16px]" strokeWidth={2.2} aria-hidden="true" focusable="false" />
                </Link>
              </div>
            </>
          )}

          {showBack && (
            <div className="flex items-center gap-1.5">
              <LanguageDropdown variant="compact" />
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="relative flex items-center justify-center w-9 h-9 rounded-full border border-border/60 bg-card/80 text-foreground/75 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:text-foreground active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    title={t('settings.notifications', 'التنبيهات')}
                    aria-label={t('settings.notifications', 'التنبيهات')}
                  >
                    <Bell className="w-[16px] h-[16px]" strokeWidth={2.2} aria-hidden="true" focusable="false" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center border border-card">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side={isRtl ? 'left' : 'right'} className="w-full sm:max-w-md p-0 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2.5 bg-background/95 backdrop-blur-md border-b border-border/50">
                    <SheetClose asChild>
                      <button
                        type="button"
                        aria-label={t('common.back', 'رجوع')}
                        className="flex items-center gap-1.5 h-9 px-2.5 rounded-full text-foreground/80 hover:bg-secondary/70 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {isRtl ? <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} /> : <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />}
                        <span className="text-[12px] font-bold">{t('common.back', 'رجوع')}</span>
                      </button>
                    </SheetClose>
                    <span className="ms-auto text-[13px] font-extrabold text-foreground/90">
                      {t('settings.notifications', 'التنبيهات')}
                    </span>
                  </div>
                  <div className="p-4"><NotificationsPanel /></div>
                </SheetContent>
              </Sheet>
              {!isPremium && (
                <Link
                  to="/pricing-demo"
                  className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/20 via-rose-400/15 to-pink-500/10 border border-amber-400/30 hover:border-amber-400/50 shadow-[0_2px_12px_-2px_hsl(340,50%,55%/0.2)] hover:shadow-[0_4px_16px_-2px_hsl(340,50%,55%/0.3)] transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  title={t('pricing.upgradeTitle', 'Upgrade to PRO')}
                  aria-label={t('pricing.upgradeTitle', 'Upgrade to PRO')}
                >
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Crown className="w-[16px] h-[16px] text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.4)] group-hover:text-amber-400 transition-colors" strokeWidth={2.2} aria-hidden="true" focusable="false" />
                  </motion.div>
                  <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 border-2 border-background animate-pulse" />
                </Link>
              )}
              <div className="hidden md:flex">
                <EncryptionIndicator />
              </div>
              <Link
                to="/settings"
                className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-foreground/75 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:text-foreground hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                title={t('settings.title', 'Settings')}
                aria-label={t('settings.title', 'Settings')}
              >
                <Settings className="h-[16px] w-[16px]" strokeWidth={2.2} aria-hidden="true" focusable="false" />
              </Link>
            </div>
          )}
        </motion.div>
      </motion.header>


      {/* Decorative Side Borders */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 via-primary/50 to-primary/30 z-40" />
      <div className="hidden lg:block fixed right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 via-primary/50 to-primary/30 z-40" />

      {/* Main Content */}
      <main className="pt-2 sm:pt-3 md:pt-5">
        {children}

        {/* Bottom Navigation for Mobile */}
        <BottomNavigation />
        {/* Smart Install Banner */}
        <Suspense fallback={null}><SmartInstallBanner /></Suspense>
      </main>


      {/* Footer */}
      <footer className="border-t border-border/30 bg-gradient-to-b from-card to-muted/20 py-8 pb-28 md:pb-8">
        <div className="container max-w-lg mx-auto px-4">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center gap-3 mb-5">
            <img src={logoImage} alt="Logo" width={36} height={36} loading="eager" decoding="async" fetchPriority="high" className="h-9 w-9 rounded-full object-cover shadow-sm" />
            <span className="text-xs font-semibold text-muted-foreground/60">{t('app.name')}</span>
          </div>



          {/* Navigation Links */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            <Link to="/privacy" className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card border border-border/20 hover:border-primary/20 hover:bg-primary/[0.04] transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Shield className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.8} />
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                {t('layout.footer.privacy', 'Privacy')}
              </span>
            </Link>
            <Link to="/terms" className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card border border-border/20 hover:border-primary/20 hover:bg-primary/[0.04] transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                {t('layout.footer.terms', 'Terms')}
              </span>
            </Link>
            <Link to="/contact" className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card border border-border/20 hover:border-primary/20 hover:bg-primary/[0.04] transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Heart className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.8} />
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                {t('layout.footer.contact', 'Contact')}
              </span>
            </Link>
            <Link to="/testimonials" className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card border border-border/20 hover:border-primary/20 hover:bg-primary/[0.04] transition-all duration-200 group">
              <div className="w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                {t('layout.footer.testimonials', 'Reviews')}
              </span>
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-[10px] text-muted-foreground/50 text-center font-medium">
            {t('app.footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}

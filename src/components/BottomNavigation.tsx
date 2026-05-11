import { forwardRef, useState, memo, useMemo } from "react";
import { Home, LayoutDashboard, Grid3X3, Menu, Search, Bell, Settings, X, Crown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { SearchDialog } from "./SearchDialog";
import { NotificationsPanel } from "./dashboard/NotificationsPanel";
import { useNotifications } from "@/hooks/useNotifications";
import { toolsData } from "@/lib/tools-data";
import { useAIUsage } from "@/contexts/AIUsageContext";

const NAV_ITEMS = [
  { id: "home", icon: Home, labelKey: "nav.home", href: "/" },
  { id: "dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/dashboard" },
  { id: "ai-tools", icon: Grid3X3, labelKey: "nav.aiTools", href: null },
  { id: "more", icon: Menu, labelKey: "nav.more", href: null },
] as const;

export const BottomNavigation = memo(forwardRef<HTMLDivElement, Record<string, never>>(
  function BottomNavigation(_, ref) {
    const location = useLocation();
    const { t } = useTranslation();
    const [searchOpen, setSearchOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [aiToolsOpen, setAiToolsOpen] = useState(false);
    const { unreadCount } = useNotifications();
    const { tier, remaining } = useAIUsage();
    const isPremium = tier === 'premium';

    const aiTools = useMemo(() => toolsData.filter(tool => tool.hasAI), []);

    const isActive = (href: string | null) => {
      if (!href) return false;
      if (href === "/") return location.pathname === "/" && !location.hash;
      if (href.startsWith("/#")) return location.pathname === "/" && location.hash === href.slice(1);
      return location.pathname.startsWith(href);
    };

    const isAiToolActive = aiToolsOpen || aiTools.some(tool => location.pathname.startsWith(tool.href));

    const handleMoreAction = (action: "search" | "notifications" | "settings") => {
      setMoreOpen(false);
      if (action === "search") {
        setTimeout(() => setSearchOpen(true), 150);
      } else if (action === "notifications") {
        setTimeout(() => setNotificationsOpen(true), 150);
      }
      // settings navigates via Link
    };

    const moreItems = [
      { id: "search", icon: Search, labelKey: "nav.search", action: "search" as const },
      { id: "notifications", icon: Bell, labelKey: "nav.alerts", action: "notifications" as const, badge: unreadCount },
      { id: "settings", icon: Settings, labelKey: "nav.settings", action: "settings" as const, href: "/settings" },
    ];

    return (
      <>
        {/* Notifications Panel */}
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              key="notif-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {notificationsOpen && (
            <motion.div
              key="notif-panel"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_: any, info: PanInfo) => {
                if (info.offset.y > 80) setNotificationsOpen(false);
              }}
              className="fixed bottom-[4.5rem] left-2 right-2 z-50 max-h-[70vh] overflow-auto rounded-2xl bg-card border border-border/40 shadow-2xl md:hidden touch-pan-x"
            >
              <div className="p-4">
                <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
                <NotificationsPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Tools Panel */}
        <AnimatePresence>
          {aiToolsOpen && (
            <motion.div
              key="ai-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiToolsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md md:hidden"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {aiToolsOpen && (
            <motion.div
              key="ai-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 400, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.4 }}
              onDragEnd={(_: any, info: PanInfo) => {
                if (info.offset.y > 100 || info.velocity.y > 500) setAiToolsOpen(false);
              }}
              className="fixed bottom-[4.5rem] left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl bg-card border-t border-border/30 md:hidden overflow-hidden"
              style={{
                boxShadow: '0 -8px 40px -10px hsl(340 65% 52% / 0.25), 0 -2px 15px -5px hsl(25 20% 18% / 0.1)',
              }}
            >
              {/* Decorative top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />
              
              <div className="p-4 pb-2">
                {/* Drag handle */}
                <div className="w-12 h-1.5 bg-muted-foreground/15 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
                
                {/* Header with sparkle animation */}
                <div className="flex items-center gap-2.5 px-1 mb-4">
                  <motion.div
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/15 flex items-center justify-center"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Grid3X3 className="w-4.5 h-4.5 text-primary" strokeWidth={2} />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-tight">
                      {t("nav.aiTools")}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      {aiTools.length} {t("nav.aiTools")}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Tools grid */}
              <div className="overflow-y-auto max-h-[calc(70vh-7.5rem)] px-3 pb-4 scrollbar-hide">
                <div className="grid grid-cols-3 gap-2">
                  {aiTools.map((tool, idx) => {
                    const ToolIcon = tool.icon;
                    const isToolActive = location.pathname.startsWith(tool.href);
                    return (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.4), duration: 0.25 }}
                      >
                        <Link
                          to={tool.href}
                          onClick={() => setAiToolsOpen(false)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all duration-200 active:scale-[0.94] ${
                            isToolActive
                              ? 'bg-primary/12 border border-primary/25 shadow-sm'
                              : 'bg-muted/30 border border-transparent hover:bg-muted/60 hover:border-border/40'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                            isToolActive
                              ? 'bg-gradient-to-br from-primary/25 to-primary/10 shadow-sm'
                              : 'bg-card border border-border/40'
                          }`}>
                            <ToolIcon
                              className={`w-5 h-5 transition-colors duration-200 ${
                                isToolActive ? 'text-primary' : 'text-foreground'
                              }`}
                              strokeWidth={1.8}
                            />
                          </div>
                          <span className={`text-[11px] font-semibold leading-tight break-words ${
                            isToolActive ? 'text-primary' : 'text-foreground'
                          }`}>
                            {t(tool.titleKey)}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* More Menu Panel */}
        <AnimatePresence>
          {moreOpen && (
            <motion.div
              key="more-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {moreOpen && (
            <motion.div
              key="more-panel"
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed bottom-[4.5rem] end-2 z-50 w-52 rounded-2xl bg-card border border-border/50 shadow-2xl md:hidden overflow-hidden"
            >
              <div className="p-2 space-y-0.5">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  
                  if (item.href) {
                    return (
                      <Link
                        key={item.id}
                        to={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/80 hover:bg-muted/60 transition-colors active:scale-[0.97]"
                      >
                        <Icon className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={1.8} />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMoreAction(item.action)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/80 hover:bg-muted/60 transition-colors active:scale-[0.97]"
                    >
                      <div className="relative">
                        <Icon className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={1.8} />
                        {item.badge && item.badge > 0 ? (
                          <span className="absolute -top-1.5 -end-1.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[7px] font-bold rounded-full flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        ) : null}
                      </div>
                      <span>{t(item.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer — always reserves space so content never hides under the pinned nav */}
        <div className="h-[4.5rem]" />

        {/* Bottom Navigation — always pinned (app-style), visible across viewports */}
        <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
          <div className="relative">
            {/* Top accent line — gold for premium, soft rose for free */}
            <div className={`absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent ${
              isPremium 
                ? 'via-[hsl(40,75%,55%)]' 
                : 'via-[hsl(340,50%,80%)]'
            } to-transparent z-10`} />

            {/* Remaining analyses badge — centered top */}
            {!isPremium && (
              <Link
                to="/pricing-demo"
                className="absolute -top-3 z-20 w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(45,85%,55%)] to-[hsl(35,75%,45%)] flex items-center justify-center shadow-lg shadow-[hsl(40,70%,50%,0.3)] ring-2 ring-card"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              >
                <Crown className="w-3.5 h-3.5 text-white" strokeWidth={2.5} fill="currentColor" />
              </Link>
            )}

            {/* Premium crown badge — centered */}
            {isPremium && (
              <div
                className="absolute -top-3 z-20"
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              >
                <motion.div
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(45,80%,60%)] to-[hsl(35,70%,45%)] flex items-center justify-center shadow-lg ring-2 ring-card"
                  animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 8px hsl(40,75%,55%,0.3)', '0 0 16px hsl(40,75%,55%,0.6)', '0 0 8px hsl(40,75%,55%,0.3)'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Crown className="w-3.5 h-3.5 text-white" strokeWidth={2.5} fill="currentColor" />
                </motion.div>
              </div>
            )}
            
            {/* Background — warm white with soft rose tint & top shadow */}
            <div className="absolute inset-0 bg-[hsl(340,15%,99%)] backdrop-blur-xl" style={{ boxShadow: '0 -6px 28px -6px hsl(340 40% 65% / 0.14), 0 -2px 10px -3px hsl(300 25% 60% / 0.06)' }} />
            
            <div className="relative flex items-center justify-evenly px-2 py-2">
              {NAV_ITEMS.map((item, idx) => {
                const active = item.id === "more" ? moreOpen : item.id === "ai-tools" ? isAiToolActive : isActive(item.href);
                const Icon = item.icon;
                const isLast = idx === NAV_ITEMS.length - 1;

                const separator = !isLast ? (
                  <div key={`sep-${idx}`} className="w-px h-6 bg-border/50 self-center" />
                ) : null;

                const isDashboardActive = active && item.id === 'dashboard';

                const iconContent = (
                  <div className={`relative p-2 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.92] ${
                    isDashboardActive
                      ? '-translate-y-[3px] scale-[1.06]'
                      : active
                        ? 'bg-gradient-to-t from-[hsl(340,25%,90%)] to-[hsl(340,15%,95%)]'
                        : ''
                  }`}>
                    {/* iOS/Android-style filled pill — animated shared layout */}
                    {isDashboardActive && (
                      <motion.span
                        layoutId="bottom-nav-active-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(340,60%,52%)] to-[hsl(320,55%,48%)] shadow-[0_6px_18px_-4px_hsl(340_55%_50%_/_0.55),inset_0_1px_0_0_hsl(0_0%_100%/0.35)] ring-1 ring-[hsl(340,60%,42%)]/40"
                        transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 }}
                      />
                    )}

                    {item.id === "more" && moreOpen ? (
                      <X className="w-5 h-5 relative z-10 text-primary transition-colors duration-200" strokeWidth={2.2} />
                    ) : item.id === "ai-tools" && aiToolsOpen ? (
                      <X className="w-5 h-5 relative z-10 text-primary transition-colors duration-200" strokeWidth={2.2} />
                    ) : (
                      <Icon
                        className={`relative z-10 transition-all duration-300 ${
                          isDashboardActive
                            ? "w-[19px] h-[19px] text-white drop-shadow-[0_1px_2px_hsl(340_60%_30%/0.5)]"
                            : active
                              ? "w-[18px] h-[18px] text-[hsl(340,50%,45%)]"
                              : "w-[18px] h-[18px] text-foreground/50"
                        }`}
                        strokeWidth={isDashboardActive ? 2.6 : active ? 2.4 : 1.8}
                        fill={isDashboardActive ? 'currentColor' : 'none'}
                        fillOpacity={isDashboardActive ? 0.18 : 0}
                      />
                    )}

                    {/* Notification badge on More button */}
                    {item.id === "more" && unreadCount > 0 && !moreOpen && (
                      <span className="absolute top-0.5 end-0.5 w-3.5 h-3.5 bg-destructive text-destructive-foreground text-[7px] font-bold rounded-full flex items-center justify-center ring-1.5 ring-card z-20">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}

                    {/* Active indicator — glowing dot for dashboard, underline for others */}
                    {isDashboardActive && (
                      <motion.div
                        layoutId="dashboard-indicator"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[hsl(340,60%,50%)] rounded-full shadow-[0_0_10px_hsl(340_55%_55%_/_0.85)] z-20"
                      />
                    )}
                    {active && item.id !== 'dashboard' && (
                      <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-gradient-to-r from-transparent via-[hsl(340,50%,55%)] to-transparent rounded-full" />
                    )}
                  </div>
                );

                const labelClass = `text-[9px] tracking-wide transition-all duration-300 mt-1 ${
                  isDashboardActive
                    ? "text-[hsl(340,60%,38%)] font-extrabold"
                    : active
                      ? "text-[hsl(340,30%,35%)] font-semibold"
                      : "text-foreground/50 font-semibold"
                }`;


                let navElement: React.ReactNode;

                if (item.id === "more") {
                  navElement = (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMoreOpen(!moreOpen);
                        setAiToolsOpen(false);
                        setNotificationsOpen(false);
                      }}
                      className="flex flex-col items-center gap-0 px-3 py-0.5 transition-all relative"
                    >
                      {iconContent}
                      <span className={labelClass}>{t(item.labelKey)}</span>
                    </button>
                  );
                } else if (item.id === "ai-tools") {
                  navElement = (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAiToolsOpen(!aiToolsOpen);
                        setMoreOpen(false);
                        setNotificationsOpen(false);
                      }}
                      className="flex flex-col items-center gap-0 px-3 py-0.5 transition-all relative"
                    >
                      {iconContent}
                      <span className={labelClass}>{t(item.labelKey)}</span>
                    </button>
                  );
                } else if (item.href?.startsWith("/#")) {
                  navElement = (
                    <Link
                      key={item.id}
                      to={item.href}
                      onClick={() => {
                        setMoreOpen(false);
                        setAiToolsOpen(false);
                        setNotificationsOpen(false);
                        // Scroll to section if already on home
                        if (location.pathname === "/") {
                          const sectionId = item.href!.slice(2);
                          const el = document.getElementById(sectionId);
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="flex flex-col items-center gap-0 px-3 py-0.5 transition-all"
                    >
                      {iconContent}
                      <span className={labelClass}>{t(item.labelKey)}</span>
                    </Link>
                  );
                } else {
                  navElement = (
                    <Link
                      key={item.id}
                      to={item.href!}
                      onClick={(e) => {
                        setMoreOpen(false);
                        setAiToolsOpen(false);
                        setNotificationsOpen(false);
                        // If already on home, scroll to top instead of navigating
                        if (item.href === "/" && location.pathname === "/") {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      className="flex flex-col items-center gap-0 px-3 py-0.5 transition-all"
                    >
                      {iconContent}
                      <span className={labelClass}>{t(item.labelKey)}</span>
                    </Link>
                  );
                }

                return (
                  <div key={item.id} className="contents">{navElement}{separator}</div>
                );
              })}
            </div>
          </div>
        </nav>

        <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      </>
    );
  }
));

BottomNavigation.displayName = "BottomNavigation";

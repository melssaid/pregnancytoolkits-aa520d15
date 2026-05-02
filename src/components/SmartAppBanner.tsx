import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.pregnancytoolkits.android";
const BANNER_DISMISSED_KEY = "pt_app_banner_dismissed";

/**
 * Smart App Banner — shows only on mobile web (not inside TWA/PWA).
 * Encourages Google Play install. Hidden inside the app.
 */
export function SmartAppBanner() {
  // Treated as a standalone app — never show web install banner.
  return null;
  // eslint-disable-next-line no-unreachable
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show inside TWA or standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    // Don't show on desktop
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Don't show if dismissed recently (7 days)
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    if (isMobile && !isStandalone) {
      // Show after a 3-second delay
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    setVisible(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-card border-b border-border shadow-lg animate-in slide-in-from-top duration-300"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={dismiss} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <img src="/logo.webp" alt="App" width={40} height={40} loading="eager" decoding="async" fetchPriority="high" className="h-10 w-10 rounded-xl" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">Pregnancy Toolkits</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {t("smartBanner.subtitle", "Free on Google Play • 33+ Tools")}
          </p>
        </div>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
          onClick={() => {}}
        >
          {t("smartBanner.cta", "GET")}
        </a>
      </div>
    </div>
  );
}

export default SmartAppBanner;

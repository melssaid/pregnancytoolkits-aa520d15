/**
 * WelcomeMomentCard — One-time gentle welcome shown after onboarding.
 *
 * NN/g: ~60% of first-session users abandon if dropped into a busy
 * dashboard with no orientation. This card provides one focused
 * "first-action" + a clear dismissal so it never becomes noise.
 */
import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, X, Droplets, Pill, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { haptic } from "@/lib/haptics";

const KEY = "welcome_moment_dismissed_v1";

export const WelcomeMomentCard = memo(function WelcomeMomentCard() {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  const dismiss = () => {
    haptic("tap");
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  };

  if (!show) return null;

  const steps = [
    { icon: Droplets, labelKey: "welcomeMoment.s1", fallback: "اشربي كأس ماء", href: "#hydration-tracker" },
    { icon: Pill,     labelKey: "welcomeMoment.s2", fallback: "سجّلي فيتامين اليوم", href: "/tools/vitamin-tracker" },
    { icon: BookOpen, labelKey: "welcomeMoment.s3", fallback: "اقرئي ملخص الأسبوع", href: "/tools/weekly-summary" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-primary/25
                   bg-gradient-to-br from-primary/[0.08] via-accent/[0.04] to-transparent
                   p-4 shadow-[0_8px_28px_-12px_hsl(var(--primary)/0.25)]"
      >
        <button
          onClick={dismiss}
          aria-label={t("common.dismiss", "إغلاق")}
          className="absolute top-2.5 end-2.5 w-7 h-7 rounded-full flex items-center justify-center
                     text-muted-foreground/70 hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 pe-8">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center
                          bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/20">
            <Sparkles className="w-4 h-4 text-primary" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-extrabold text-foreground leading-tight">
              {t("welcomeMoment.title", "مرحبًا بكِ — رحلتكِ بدأت")}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {t("welcomeMoment.subtitle", "ثلاث خطوات بسيطة لبداية يومكِ")}
            </p>
          </div>
        </div>

        <ul className="space-y-1.5">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isAnchor = s.href.startsWith("#");
            const handleClick = (e: React.MouseEvent) => {
              haptic("tap");
              if (isAnchor) {
                e.preventDefault();
                document.getElementById(s.href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            };
            return (
              <li key={i}>
                <Link
                  to={isAnchor ? "#" : s.href}
                  onClick={handleClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl
                             bg-background/60 border border-border/40
                             hover:bg-background/90 active:scale-[0.99] transition-all
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={2.4} />
                  </span>
                  <span className="text-[13px] font-bold text-foreground flex-1 leading-snug">
                    {t(s.labelKey, s.fallback)}
                  </span>
                  <span className="text-[10px] font-extrabold text-muted-foreground/60 tabular-nums">
                    {i + 1}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
});

export default WelcomeMomentCard;

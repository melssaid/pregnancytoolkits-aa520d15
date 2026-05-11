import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, Plus, ExternalLink, Copy, Smartphone, Bell, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { PushBlockerReason } from '@/lib/pushNotifications';

interface Props {
  reason: Exclude<PushBlockerReason, null>;
}

/**
 * Smart diagnostic card shown when Web Push isn't directly available.
 * Replaces the blunt "not supported" message with an actionable path forward.
 */
export function NotificationFallbackCard({ reason }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      toast.success(t('settings.notifications.linkCopied', 'تم نسخ الرابط'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('settings.notifications.copyFailed', 'تعذّر النسخ'));
    }
  };

  // ── iOS Safari, not installed to Home Screen ──
  if (reason === 'ios-not-installed') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-accent/8 to-primary/5 border border-primary/15 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
            <Smartphone className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-snug">
              {t('settings.notifications.iosTitle', 'فعّلي التنبيهات على iPhone بثلاث خطوات')}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              {t('settings.notifications.iosDesc', 'iOS يدعم التذكيرات بعد تثبيت التطبيق على الشاشة الرئيسية فقط')}
            </p>
          </div>
        </div>

        <ol className="space-y-2 pt-1">
          <Step n={1} icon={<Share className="w-3.5 h-3.5" />}
            text={t('settings.notifications.iosStep1', 'اضغطي زر المشاركة في Safari (الأيقونة في الأسفل)')} />
          <Step n={2} icon={<Plus className="w-3.5 h-3.5" />}
            text={t('settings.notifications.iosStep2', 'اختاري "إضافة إلى الشاشة الرئيسية"')} />
          <Step n={3} icon={<Bell className="w-3.5 h-3.5" />}
            text={t('settings.notifications.iosStep3', 'افتحي التطبيق من الأيقونة الجديدة وفعّلي التنبيهات')} />
        </ol>

        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {t('settings.notifications.inAppFallbackNote', 'حتى ذلك الحين، تظهر تذكيراتك داخل التطبيق على أيقونة الجرس 🔔')}
          </p>
        </div>
      </div>
    );
  }

  // ── In-app browser (Instagram / Facebook / TikTok / WeChat) ──
  if (reason === 'in-app-browser') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-accent/8 to-primary/5 border border-primary/15 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
            <ExternalLink className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-snug">
              {t('settings.notifications.inAppTitle', 'افتحي التطبيق في المتصفح الكامل')}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              {t('settings.notifications.inAppDesc', 'متصفح التطبيقات المدمج (Instagram / Facebook) لا يدعم التذكيرات. افتحي الرابط في Safari أو Chrome')}
            </p>
          </div>
        </div>

        <button
          onClick={copyLink}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-[13px] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {t('settings.notifications.linkCopied', 'تم نسخ الرابط')}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {t('settings.notifications.copyAppLink', 'نسخ رابط التطبيق')}
            </>
          )}
        </button>

        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {t('settings.notifications.inAppFallbackNote', 'حتى ذلك الحين، تظهر تذكيراتك داخل التطبيق على أيقونة الجرس 🔔')}
          </p>
        </div>
      </div>
    );
  }

  // ── Incognito / Private mode ──
  if (reason === 'incognito') {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/8 to-primary/5 border border-amber-500/20 p-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground leading-snug">
              {t('settings.notifications.incognitoTitle', 'الوضع الخاص يمنع التذكيرات')}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              {t('settings.notifications.incognitoDesc', 'افتحي التطبيق في نافذة عادية (غير متخفية) لتفعيل تذكيرات الجهاز')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Truly unsupported (very old browser) ──
  return (
    <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--success-soft))]/100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-done" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-foreground leading-snug">
            {t('settings.notifications.fallbackTitle', 'تذكيراتك تعمل داخل التطبيق')}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            {t('settings.notifications.fallbackDesc', 'متصفحك لا يدعم تنبيهات الجهاز، لكن جميع تذكيراتك ستظهر على أيقونة الجرس 🔔 عند فتح التطبيق')}
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span className="flex items-center gap-1.5 text-[11.5px] text-foreground leading-relaxed">
        <span className="text-primary">{icon}</span>
        {text}
      </span>
    </li>
  );
}

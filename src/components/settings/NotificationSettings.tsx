import { useState, useEffect, useMemo } from 'react';
import { Bell, BellOff, BellRing, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { sendDailyScheduleToSW } from '@/lib/scheduleNotifications';
import { detectPushBlocker } from '@/lib/pushNotifications';
import { NotificationFallbackCard } from '@/components/notifications/NotificationFallbackCard';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NotificationSettings() {
  const { t } = useTranslation();
  const { supported, permission, enabled, enablePush, disablePush } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  const [weeklyEnabled, setWeeklyEnabled] = useState(() => {
    try { return localStorage.getItem('weeklyNotificationsEnabled') !== 'false'; }
    catch { return true; }
  });

  const handleTogglePush = async () => {
    if (enabled) {
      disablePush();
      toast.success(t('settings.notifications.disabled', 'Notifications disabled'));
      return;
    }
    setLoading(true);
    const success = await enablePush();
    setLoading(false);
    if (success) {
      toast.success(t('settings.notifications.enabled', 'Notifications enabled! 🔔'));
      sendDailyScheduleToSW();
    } else if (permission === 'denied') {
      toast.error(t('settings.notifications.blocked', 'Notifications are blocked by your browser. Please enable them in device settings.'));
    }
  };

  const handleToggleWeekly = (checked: boolean) => {
    setWeeklyEnabled(checked);
    localStorage.setItem('weeklyNotificationsEnabled', String(checked));
    if (checked) {
      toast.success(t('settings.notifications.weeklyOn', 'Weekly updates enabled'));
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-3 py-2">
        <BellOff className="w-5 h-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {t('settings.notifications.notSupported', 'Push notifications are not supported on this device')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero Enable Card — prominent CTA when not enabled */}
      {!enabled && permission !== 'denied' && (
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-primary/15 p-4 text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <BellRing className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">
            {t('settings.notifications.heroTitle', 'فعّلي التنبيهات لتصلك التذكيرات')}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            {t('settings.notifications.heroDesc', 'نصائح أسبوعية، تذكير بالفيتامينات والماء، وتحديثات تطور الطفل')}
          </p>
          <button
            onClick={handleTogglePush}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t('settings.notifications.enabling', 'جاري التفعيل...')}
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                {t('settings.notifications.enableNow', 'تفعيل الآن')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Push Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            enabled ? "bg-[hsl(var(--success-soft))]/100" : "bg-muted"
          )}>
            {enabled ? (
              <BellRing className="w-4.5 h-4.5 text-done" />
            ) : (
              <Bell className="w-4.5 h-4.5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">
              {t('settings.notifications.pushToggle', 'Push Notifications')}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {enabled
                ? t('settings.notifications.activeDesc', 'Receiving notifications')
                : t('settings.notifications.inactiveDesc', 'Enable to receive alerts')
              }
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleTogglePush}
          disabled={loading || permission === 'denied'}
        />
      </div>

      {permission === 'denied' && (
        <div className="rounded-xl bg-destructive/10 px-3 py-2.5">
          <p className="text-[11px] text-destructive font-medium">
            {t('settings.notifications.blocked', 'Notifications are blocked. Please enable them in your device settings.')}
          </p>
        </div>
      )}

      {/* Weekly Updates Toggle */}
      {enabled && (
        <div className="border-t border-border/40 pt-4 space-y-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {t('settings.notifications.typesTitle', 'Notification Types')}
          </p>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">
                {t('settings.notifications.weeklyUpdates', 'Weekly Pregnancy Updates')}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {t('settings.notifications.weeklyDesc', 'Baby development & tips every week')}
              </p>
            </div>
            <Switch checked={weeklyEnabled} onCheckedChange={handleToggleWeekly} />
          </div>
        </div>
      )}

      {/* Status */}
      {enabled && (
        <div className="flex items-center gap-2 pt-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-done" />
          <p className="text-[10px] text-done font-medium">
            {t('settings.notifications.statusActive', 'You will receive notifications even when the app is closed')}
          </p>
        </div>
      )}
    </div>
  );
}

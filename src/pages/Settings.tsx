import React, { useState, useEffect, lazy, Suspense } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, User, Download, Trash2, 
  ChevronRight, ChevronLeft, Lock, RotateCcw,
  Bell, Info, Mail, ExternalLink, Radar, Edit3
} from 'lucide-react';
const OnboardingDisclaimer = lazy(() =>
  import('@/components/OnboardingDisclaimer').then(m => ({ default: m.OnboardingDisclaimer }))
);
import { SonarIntegrationSettings } from '@/components/settings/SonarIntegrationSettings';
import { useAIUsage } from '@/contexts/AIUsageContext';
import { toast } from 'sonner';
import { DataBackupManager } from '@/components/settings/DataBackupManager';
import { CouponRedeemer } from '@/components/settings/CouponRedeemer';
import { PointsBreakdownCard } from '@/components/settings/PointsBreakdownCard';
import { EncryptionManager } from '@/components/settings/EncryptionManager';
import { AccountDeletion } from '@/components/settings/AccountDeletion';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { ProfileEditor } from '@/components/settings/ProfileEditor';
import { Layout } from '@/components/Layout';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type SettingsView = 'main' | 'profile' | 'language' | 'security' | 'backup' | 'delete' | 'notifications' | 'sonar' | 'reonboard';

const APP_VERSION = '1.0.16';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [activeView, setActiveView] = useState<SettingsView>('main');
  const { used, limit, remaining, resetUsage } = useAIUsage();
  const isDeveloperToolsVisible = import.meta.env.DEV && typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const navigate = useNavigate();
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const applyHash = () => {
      const hash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '') as SettingsView;
      const valid: SettingsView[] = ['profile', 'language', 'security', 'backup', 'delete', 'notifications', 'sonar'];
      if (hash && valid.includes(hash)) {
        setActiveView(hash);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const settingsGroups = [
    {
      title: t('settings.generalSection', 'General'),
      items: [
        {
          id: 'profile' as SettingsView,
          icon: User,
          label: t('settings.profile.title'),
          desc: t('settings.profile.desc'),
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-500/10',
        },
        {
          id: 'reonboard' as SettingsView,
          icon: Edit3,
          label: t('settings.reonboard.title', 'تحديث ملف الرحلة'),
          desc: t('settings.reonboard.desc', 'إعادة فتح خطوات التسجيل لتعديل بياناتكِ'),
          iconColor: 'text-pink-500',
          iconBg: 'bg-pink-500/10',
        },
        {
          id: 'language' as SettingsView,
          icon: Globe,
          label: t('settings.language.sectionTitle'),
          desc: t('settings.language.desc'),
          iconColor: 'text-emerald-500',
          iconBg: 'bg-emerald-500/10',
        },
        {
          id: 'notifications' as SettingsView,
          icon: Bell,
          label: t('settings.notifications.title', 'Notifications'),
          desc: t('settings.notifications.desc', 'Weekly updates & reminders'),
          iconColor: 'text-orange-500',
          iconBg: 'bg-orange-500/10',
        },
      ],
    },
    {
      title: t('settings.aiSection', 'AI Tools'),
      items: [
        {
          id: 'sonar' as SettingsView,
          icon: Radar,
          label: t('settings.sonar.title'),
          desc: t('settings.sonar.subtitle'),
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
        },
      ],
    },
    {
      title: t('settings.dataSection', 'Data & Privacy'),
      items: [
        {
          id: 'backup' as SettingsView,
          icon: Download,
          label: t('settings.backup.title'),
          desc: t('settings.backup.description'),
          iconColor: 'text-violet-500',
          iconBg: 'bg-violet-500/10',
        },
        {
          id: 'security' as SettingsView,
          icon: Lock,
          label: t('settings.securityPrivacy'),
          desc: t('settings.securityDesc'),
          iconColor: 'text-amber-500',
          iconBg: 'bg-amber-500/10',
        },
      ],
    },
  ];

  const renderSubView = () => {
    switch (activeView) {
      case 'profile': return <ProfileEditor compact />;
      case 'language': return <LanguageSelector compact />;
      case 'security': return <EncryptionManager compact />;
      case 'backup': return <DataBackupManager compact />;
      case 'delete': return <AccountDeletion compact />;
      case 'notifications': return <NotificationSettings />;
      case 'sonar': return <SonarIntegrationSettings compact />;
      default: return null;
    }
  };

  const getSubViewTitle = () => {
    if (activeView === 'notifications') return t('settings.notifications.title', 'Notifications');
    const allItems = settingsGroups.flatMap(g => g.items);
    const item = allItems.find(i => i.id === activeView);
    return item?.label || t('settings.title');
  };

  return (
    <Layout showBack>
      <SEOHead title={t('settings.title')} description="Manage your preferences, data privacy, encryption and language settings" />
      <div className="container py-4 pb-24 max-w-lg mx-auto">

        <AnimatePresence mode="wait">
          {activeView === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Page Title */}
              <div className="pt-1 pb-1">
                <h1 className="text-xl font-black text-foreground">{t('settings.title')}</h1>
              </div>

              {/* Settings Groups */}
              {settingsGroups.map((group, gi) => (
                <div key={gi} className="space-y-1.5">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    {group.title}
                  </h3>
                  <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border/40">
                    {group.items.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (gi * 3 + i) * 0.03 }}
                          onClick={() => {
                            if (item.id === 'language') navigate('/language');
                            else if (item.id === 'reonboard') setShowOnboarding(true);
                            else setActiveView(item.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors active:scale-[0.99]"
                        >
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", item.iconBg)}>
                            <Icon className={cn("w-4 h-4", item.iconColor)} />
                          </div>
                          <div className="flex-1 text-start min-w-0">
                            <span className="text-[13px] font-semibold text-foreground block leading-tight">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground line-clamp-1">{item.desc}</span>
                          </div>
                          <ChevronIcon className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {isDeveloperToolsVisible && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    {t('settings.aiSection', 'AI Tools')}
                  </h3>
                  <div className="rounded-2xl border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <RotateCcw className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-semibold text-foreground block leading-tight">
                          {t('settings.aiReset.title')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {t('settings.aiReset.status', { used, limit, remaining })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        resetUsage();
                        toast.success(t('settings.aiReset.success'));
                      }}
                      className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors active:scale-[0.98]"
                    >
                      {t('settings.aiReset.button')}
                    </button>
                  </div>
                </div>
              )}

              {/* Points Breakdown */}
              <PointsBreakdownCard />

              {/* Coupon Redeemer */}
              <div className="rounded-2xl border bg-card p-4">
                <CouponRedeemer />
              </div>

              {/* Support & About */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {t('settings.supportSection', 'Support')}
                </h3>
                <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border/40">
                  <a
                    href="mailto:pregnancytoolkits@gmail.com"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 text-start min-w-0">
                      <span className="text-[13px] font-semibold text-foreground block leading-tight">
                        {t('settings.contactSupport', 'Contact Support')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">pregnancytoolkits@gmail.com</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                  </a>

                  <Link
                    to="/privacy"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-start min-w-0">
                      <span className="text-[13px] font-semibold text-foreground block leading-tight">
                        {t('settings.dataPrivacy')}
                      </span>
                    </div>
                    <ChevronIcon className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                  </Link>

                  <Link
                    to="/terms"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 text-start min-w-0">
                      <span className="text-[13px] font-semibold text-foreground block leading-tight">
                        {t('layout.footer.terms')}
                      </span>
                    </div>
                    <ChevronIcon className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                  </Link>

                  {/* Delete Account - moved here as last item */}
                  <button
                    onClick={() => setActiveView('delete')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 text-start min-w-0">
                      <span className="text-[13px] font-semibold text-red-500 block leading-tight">
                        {t('settings.deleteAccount.title')}
                      </span>
                    </div>
                    <ChevronIcon className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 pb-4">
                <p className="text-[9px] text-muted-foreground/50 leading-relaxed max-w-[260px] mx-auto">
                  {t('settings.medicalNote')}
                </p>
                <p className="text-[9px] text-muted-foreground/40 mt-1">v{APP_VERSION}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Sub-view Header */}
              <button
                onClick={() => setActiveView('main')}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors active:scale-[0.97] mb-1"
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span className="font-medium">{t('settings.title')}</span>
              </button>

              <h2 className="text-lg font-bold text-foreground">{getSubViewTitle()}</h2>

              {/* Sub-view Content */}
              <div className="rounded-2xl border bg-card p-4">
                {renderSubView()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingDisclaimer
            forceOpen
            onClose={() => setShowOnboarding(false)}
          />
        </Suspense>
      )}
    </Layout>
  );
};

export default Settings;

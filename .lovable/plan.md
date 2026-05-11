## المشكلة
حالياً عند عدم توفر `serviceWorker` أو `Notification` API يظهر للمستخدمة سطر واحد جامد:
> "Push notifications are not supported on this device"

هذا غير احترافي لأن:
- **iOS Safari** لا يدعم Web Push إلا بعد تثبيت التطبيق على الشاشة الرئيسية (PWA installed) — وهي خطوة لا يعرفها 90% من المستخدمين.
- **متصفحات داخل التطبيقات** (Instagram, Facebook, TikTok in-app browser) تحجب SW — والحل بسيط: فتح الرابط في Safari/Chrome.
- **الوضع الخاص (Incognito)** يُعطّل SW مؤقتاً.
- لا يوجد **بديل داخل التطبيق** لمن يتعذّر تفعيل الـ Push.

## الحل (3 طبقات)

### الطبقة 1 — تشخيص ذكي بدلاً من رسالة جامدة
استبدال `NotificationSettings` "not supported" ببطاقة تشخيصية تحدّد السبب الفعلي وتعرض المسار المناسب:

| الحالة المُكتشفة | الرسالة + الإجراء |
|---|---|
| iOS Safari + غير مُثبّت | بطاقة "ثبّتي التطبيق أولاً" مع شرح مرئي 3 خطوات: زر Share → "Add to Home Screen" → افتحي من الأيقونة |
| In-app browser (IG/FB/TikTok) | بطاقة "افتحي في Safari/Chrome" مع زر نسخ الرابط |
| Incognito/Private mode | تنبيه "الوضع الخاص يمنع التذكيرات — افتحي في نافذة عادية" |
| Android بدون SW (نادر) | زر "تثبيت التطبيق" يستدعي `useSmartInstallPrompt` الموجود |
| غير مدعوم فعلاً (متصفح قديم جداً) | عرض البديل: التذكيرات داخل التطبيق |

### الطبقة 2 — تذكيرات داخل التطبيق (Fallback لأي جهاز)
نظام `In-App Reminders` يعمل بدون Push:
- يُجدوِل المهام في `localStorage` (فيتامينات، ماء، مواعيد، أسبوعي).
- عند فتح التطبيق إذا تجاوز الوقت المحدّد → يضاف إشعار في `NotificationsPanel` (شارة على الجرس) + Toast لطيف.
- يستخدم نفس واجهة التحكّم (نفس الـ Switches) — المستخدمة لا تشعر بالفرق.
- يُسجَّل آخر ظهور لتجنّب التكرار.

### الطبقة 3 — تكامل مع `OnboardingStep6Notifications`
نفس منطق التشخيص يُستخدم في خطوة الـ Onboarding، فلا تظهر رسالة "غير مدعوم" خلال التهيئة بل: "اختاري طريقتك المفضّلة للتذكيرات".

## التغييرات التقنية (للمرجع)

1. **`src/lib/pushNotifications.ts`**
   - إضافة `detectPushBlocker()` يُرجع: `'ios-not-installed' | 'in-app-browser' | 'incognito' | 'unsupported' | null`.
   - كاشف iOS: `/iPhone|iPad|iPod/.test(navigator.userAgent)`
   - كاشف standalone: `window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone`
   - كاشف in-app browser: regex على UA لـ `Instagram|FBAN|FBAV|Line|MicroMessenger|TikTok`

2. **`src/components/settings/NotificationSettings.tsx`**
   - استبدال كتلة `if (!supported)` بمكوّن جديد `<NotificationFallbackCard reason={...} />`.
   - عند `permission === 'denied'`: تحسين الرسالة بزر "افتحي إعدادات المتصفح" + شرح خطوات لكل OS.

3. **مكوّن جديد `src/components/notifications/NotificationFallbackCard.tsx`**
   - 3 قوالب: iOS install guide / in-app browser / incognito.
   - رسوم توضيحية بأيقونات Lucide (`Share`, `Plus`, `ExternalLink`).
   - زر CTA رئيسي حسب الحالة (نسخ رابط، فتح خارجي، إلخ).

4. **مكوّن جديد `src/components/notifications/IOSInstallGuide.tsx`**
   - 3 خطوات مرئية مع pills رقمية وأيقونة Share الرسمية لـ iOS.

5. **خدمة جديدة `src/lib/inAppReminders.ts`**
   - `scheduleInApp(reminder)` / `checkPendingReminders()` تُستدعى من `App.tsx` عند فتح التطبيق.
   - تكتب في `notifications` (نفس `useNotifications`) → تظهر في الجرس.
   - تستهلك إعدادات `notificationSettings` الموجودة (vitamin/water/cycle...).

6. **`src/App.tsx`** (أو `Index.tsx`)
   - استدعاء `checkPendingReminders()` عند الـ mount.

7. **`src/components/onboarding/OnboardingStep6Notifications.tsx`**
   - استخدام نفس `detectPushBlocker()` لعرض التشخيص بدلاً من تخطّي الخطوة.

## النتيجة
- لا توجد جهاز "محروم" — كل مستخدمة لديها مسار واضح للتذكيرات.
- iOS Safari بدون تثبيت → دليل مرئي للتثبيت ثم تفعيل.
- متصفحات داخل التطبيقات → خطوة فتح خارجية.
- أي حالة استثنائية → تذكيرات داخل التطبيق تعمل بلا Push.

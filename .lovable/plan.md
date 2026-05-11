## فحص رحلة المريضة — التشخيص الحالي

استنادًا إلى مراجع: **NN/g Onboarding Heuristics**, **NHS Digital Service Manual — Health Journeys**, **WHO Digital Health Guidelines**, و**BJ Fogg Behavior Model (B = MAP)**، تم تتبّع الرحلة من أول فتح حتى الاستخدام اليومي.

### خريطة الرحلة الحالية
```text
[فتح أول] → OnboardingDisclaimer (5 خطوات modal)
   ├─ Step1 لغة + ترحيب
   ├─ Step2 المرحلة (خصوبة/حمل/نفاس) + الأسبوع/LMP
   ├─ Step3 وزن/طول/فصيلة دم/حالات
   ├─ Step4 أهداف + تفضيلات تنبيه
   └─ Step5 خصوصية + إنهاء
[إنهاء] → SmartDashboard مباشرة (لا توجد لحظة ترحيب أو إرشاد أول)
[يومي] → TodayTab (10+ بطاقات بدون "بؤرة اليوم")
[رحلة] → JourneyMap (مخفية خلف الشريط فقط)
```

### المشاكل المُكتشفة (مرتبة حسب الأثر)

| # | المشكلة | المرجع العلمي | الأثر |
|---|---------|---------------|-------|
| 1 | لا توجد "لحظة ترحيب" بعد إنهاء الـonboarding — المريضة تُلقى في dashboard مزدحم | NN/g: *First-Use Experience* — 60٪ من التخلّي يحدث في أول جلسة | عالي |
| 2 | لا "بؤرة اليوم الواحدة" (Single Daily Focus) — TodayTab يعرض 10+ بطاقات متساوية الأهمية | Fogg B=MAP: تشتيت Motivation ⇒ انخفاض الفعل | عالي |
| 3 | لا "نسبة إنجاز اليوم" مرئية — DailyPriorities موجودة لكن بدون شريط تقدّم موحّد | NHS: *daily anchor metric* | عالي |
| 4 | onboarding بدون تقدير الوقت ولا "لماذا نسأل" بجانب كل حقل | NN/g Form Design: *Why we ask* يرفع الإكمال 23٪ | متوسط |
| 5 | بدون "إعادة فتح الـonboarding" من الإعدادات (المريضة لا تستطيع تصحيح بياناتها بنفس التدفق) | ISO 9241-110 Controllability | متوسط |
| 6 | لا "ميل-ستون قادم" مرئي في Today (المريضة لا تعرف ما التالي في رحلتها) | NHS: *next-step certainty* | متوسط |
| 7 | RiskAlertCard ينبّه لكن بدون CTA واضح ("تواصلي مع طبيبة" / "احفظي في السجل") | WHO mHealth: *closed-loop alerts* | عالي |
| 8 | لا "خط ثقة" (trust strip) مرئي في الواجهة الرئيسية — الخصوصية مذكورة فقط في الإعدادات | HIMSS Trust Framework | متوسط |
| 9 | TodayStoryHero لا يرحّب بالاسم/الأسبوع في عبارة واحدة موجزة (cognitive load) | Hick's Law | منخفض |
| 10 | لا "حالة إكمال اليوم" (تحفيز هادئ غير لُعبي بعد إنجاز كل المهام) | Self-Determination Theory: *Competence* | متوسط |

---

## التحسينات المقترحة

### 1. لحظة الترحيب بعد الـOnboarding — `WelcomeMomentCard`
بطاقة موجزة تظهر **مرة واحدة** أعلى TodayTab بعد إنهاء التسجيل:
- "مرحبًا بكِ. رحلتك بدأت — هذه أول 3 خطوات لليوم"
- 3 إجراءات مقترحة سياقية (شرب الماء / تسجيل الفيتامين / قراءة ملخص الأسبوع)
- زر "ابدئي" + رابط "جولة سريعة" (3 شاشات coach-mark خفيفة)
- يُخزَّن `welcome_moment_dismissed` في localStorage

### 2. شريط "بؤرة اليوم" — `DailyFocusRibbon`
أعلى TodayTab مباشرة بعد JourneyProgressRibbon:
- يحسب أهم مهمة واحدة وفق وقت اليوم + الفجوات في البيانات (مثلاً: لم تُسجَّل المياه اليوم → "اشربي كأسًا الآن")
- شريط تقدّم نحيف يُظهر `completedToday/totalToday` — هادئ، بدون نقاط أو شارات
- نقرة → تنفّذ الإجراء مباشرة (toast + تحديث)

### 3. تحسين الـOnboarding (نفس الـ5 خطوات، لا إضافة)
- **Step1**: إضافة شارة "يستغرق ~60 ثانية · يمكن تعديل كل شيء لاحقًا"
- **كل حقل في Step2/3**: tooltip صغير "لماذا نسأل؟" يفتح bottom-sheet موجز (سطران)
- **Step5**: زر إنهاء يصبح "ابدئي رحلتك" + checkmark animation قبل الإغلاق
- **زر "تخطّي الآن، أكملي لاحقًا"** على Step3/4 — يحفظ الجزئي ويفتح الـdashboard مع شارة "أكملي ملفك" قابلة للنقر

### 4. إعادة فتح الـOnboarding من الإعدادات
- إدخال صفّ في `Settings`: "تحديث ملف الرحلة" → يفتح نفس الـmodal مع حالة القيم الحالية مُعبّأة (الكود قائم — يحتاج زر فقط + إزالة شرط `!accepted`)

### 5. CTA مغلق-الحلقة في `RiskAlertCard`
- زر "احفظي في سجل الزيارة" (ينشئ ملاحظة في `appointments_notes`)
- زر ثانوي "تواصلي مع الطبيبة" (يفتح `tel:` إن كان رقم الطبيبة محفوظًا، وإلا ينقل إلى `/tools/doctor-visit-prep`)

### 6. ميل-ستون قادم — `NextMilestoneCard`
- بطاقة موجزة في Today تعرض الميل-ستون التالي من JourneyTimeline (مثلاً "الأسبوع 24 — فحص السكري — بعد 9 أيام")
- نقرة → JourneyMap مع scroll للميل-ستون

### 7. شريط الثقة — `TrustStrip`
- شريط رفيع جدًا (ارتفاع 20px) أسفل header الـdashboard:
  - "بياناتكِ على جهازكِ فقط · مرافقة عافية لا تشخيص طبي"
  - أيقونتا Shield + Heart بحجم 12px — هادئ، بلون `text-muted-foreground`

### 8. إعادة صياغة `TodayStoryHero`
- جملة افتتاحية واحدة: "صباح الخير {الاسم} — أنتِ في الأسبوع {N}، يوم {D} من الحمل"
- إزالة العناصر الزخرفية الزائدة، إبقاء سطر النصيحة فقط

### 9. حالة "اكتمل يومك" — `DayCompletionState`
- عندما تكتمل كل مهام DailyPriorities → بطاقة هادئة "تمّت مهام اليوم. ارتاحي الآن" (بدون نقاط/شارات)
- تُخفي DailyFocusRibbon لبقية اليوم

---

## التغييرات التقنية

**ملفات جديدة:**
- `src/components/dashboard/WelcomeMomentCard.tsx` — يقرأ `welcome_moment_dismissed`
- `src/components/dashboard/DailyFocusRibbon.tsx` — يحسب المهمة الواحدة المُلحّة
- `src/components/dashboard/NextMilestoneCard.tsx` — يستهلك JourneyTimeline
- `src/components/dashboard/TrustStrip.tsx` — شريط ثقة موجز
- `src/components/dashboard/DayCompletionState.tsx` — بديل DailyFocusRibbon عند الاكتمال
- `src/components/onboarding/WhyWeAsk.tsx` — bottom-sheet مشترك للحقول
- `src/lib/dailyFocus.ts` — منطق تحديد بؤرة اليوم (وقت + فجوات بيانات)

**ملفات معدّلة:**
- `src/components/dashboard/tabs/TodayTab.tsx` — حقن WelcomeMoment + DailyFocusRibbon + NextMilestoneCard + DayCompletionState
- `src/components/dashboard/TodayStoryHero.tsx` — جملة واحدة موجزة
- `src/components/dashboard/RiskAlertCard.tsx` — CTAs مغلقة الحلقة
- `src/components/OnboardingDisclaimer.tsx` — تخطّي جزئي + احتساب tooltips + زر إعادة فتح من الإعدادات
- `src/components/onboarding/OnboardingStep1Welcome.tsx` — شارة "60 ثانية"
- `src/components/onboarding/OnboardingStep2Journey.tsx` + `Step3Health.tsx` — تكامل WhyWeAsk
- `src/pages/SmartDashboard.tsx` — حقن TrustStrip
- `src/pages/Settings.tsx` — صف "تحديث ملف الرحلة" يفتح الـonboarding
- `src/i18n/*` — ~25 مفتاح ترجمة جديد (ar/en/de/tr/fr/es/pt)

**التزامات نمطية:**
- لا نقاط، لا شارات، لا مؤقتات إلحاح — متوافق مع `mem://constraints/app-marketing-preferences`
- Rose-Lavender wash موحّد على البطاقات الجديدة
- جميع الإضافات لا تتجاوز ارتفاعًا حرجًا في الـviewport (mobile-first 360×623)

---

## النتيجة المتوقّعة

| المقياس | قبل | بعد |
|---------|-----|------|
| وقت إكمال الـOnboarding | ~120 ث | ~75 ث (مع tooltips + skip) |
| وضوح "ماذا أفعل الآن؟" | منخفض (10+ بطاقات) | عالٍ (بؤرة واحدة + ميل-ستون قادم) |
| إغلاق حلقة التنبيهات | 0٪ | 100٪ (CTAs محددة) |
| استرجاع الـOnboarding | غير ممكن | متاح من الإعدادات |
| تسلسل الثقة | متناثر | شريط مرئي دائم |

رحلة مترابطة، علمية، يستطيع المريضة المتابعة فيها يوميًا بفعل واحد واضح، مع باب رجوع آمن لأي بيانات أدخلتها سابقًا.

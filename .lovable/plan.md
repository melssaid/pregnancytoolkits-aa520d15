# توحيد "لوحة اليوم" و"صفحة رحلتي"

## المشكلة المختصرة

يوجد ثلاث مصادر للحقيقة تتصارع فيما بينها فتظهر بيانات غير متطابقة:

1. `profile.journeyStage` (المرحلة النشطة)
2. `profile.dueDate` و `profile.pregnancyWeek` (المحسوبان من LMP في `useUserProfile`)
3. `profile.journeyHistory.pregnancy.dueDate` / `.startedAt` / `.completedAt` (تُحرَّر من صفحة رحلتي)

نتيجةً لذلك:

- الضغط على محطة في صفحة رحلتي يضع `journeyStage` يدويًا، ثم يقوم `useUserProfile.autoStageDetection` فورًا بإرجاعها لأن `dueDate` ما زال موجودًا → المرحلة النشطة تختلف بين الصفحتين.
- `completedAt`/`startedAt` تُختم بـ`now()` حتى لو لم تكن المرحلة قد بدأت/انتهت فعلًا → الخط الزمني يصبح غير منطقي (تواريخ متراكمة في نفس اللحظة).
- `journeyHistory.pregnancy.dueDate` لا يُزامَن مع `profile.dueDate`، فالأسبوع المعروض على لوحة اليوم (محسوب من LMP) يختلف عن الموعد المعروض في صفحة رحلتي.
- المسميات والنبرة مختلفة: لوحة اليوم تستخدم نبرة يومية ("لوحتي اليومية / اليوم")، بينما صفحة رحلتي تستخدم نبرة رسمية بمصطلحات مختلفة (`journey.map.regions.stages` "Journey stages overview"…).

## القرار

**`useUserProfile` (لوحة اليوم) هو المرجع الوحيد.** صفحة رحلتي تصبح *عرضًا وقراءةً* للحالة، وأي تعديل فيها يكتب في نفس الحقول التي تقرأها لوحة اليوم — بدون كتابة موازية في `journeyHistory` تخلق نسخًا متضاربة.

## الخطة (واجهة فقط — لا تغيير في منطق التتبع/الـAI)

### 1) مصدر واحد للمرحلة النشطة
- في `TodayTab.tsx` احذف الـfallback `(isPregnant ? "pregnant" : "pregnant")` واعتمد `userProfile.journeyStage` مباشرةً.
- في صفحة رحلتي (`JourneyMap.tsx`) عند تأكيد تبديل المرحلة:
  - اضبط `autoStageDetection: false` تلقائيًا حتى لا تُرجع لوحة اليوم المرحلة فورًا.
  - أظهر في حوار التأكيد سطرًا توضيحيًا: "سيتم إيقاف الاكتشاف التلقائي للمرحلة بناءً على تواريخك."
  - لا تختم `completedAt`/`startedAt` بـ`now()` لمرحلة لم تبدأ فعلًا — اكتبها فقط للمرحلة الخارجة *إن* كان لها `startedAt` سابق، ولا تلمس المرحلة القادمة إن لم يوجد تاريخ حقيقي.

### 2) مصدر واحد للموعد المتوقع والأسبوع
- وحِّد `profile.dueDate` و `journeyHistory.pregnancy.dueDate`:
  - في `useUserProfile`: عند تغيير `profile.dueDate` أو `lastPeriodDate`، انسخ القيمة المحسوبة إلى `journeyHistory.pregnancy.dueDate` تلقائيًا.
  - في `JourneyMap` و `JourneyTimeline`: اقرأ `dueDate` من `profile.dueDate` أولًا والـhistory بديلًا.
- `JourneyTimeline` يعرض `profile.pregnancyWeek` المحسوب من LMP (نفس ما يظهر على لوحة اليوم) بدل الاعتماد على `journeyHistory.pregnancy.startedAt` الذي قد يكون مختومًا بـ`now()`.

### 3) خط زمني منطقي
- استبعد من `JourneyTimeline` أي نقطة `startedAt`/`completedAt` تساوي `updatedAt` للملف الشخصي بفارق < 60 ثانية (إشارة إلى أنها مولّدة تلقائيًا للحظتها وليست حدثًا حقيقيًا). أي: لا نعرض "بداية مرحلة" مزيفة.
- إذا كان `pregnancy.startedAt` غير موجود لكن `lastPeriodDate` موجود → اشتق نقطة "بداية الحمل" من LMP بدلًا من تركها فارغة أو ختمها بـ`now()`.
- رتّب النقاط زمنيًا واسقط أي نقطة `completedAt` تأتي قبل `startedAt` لنفس المرحلة.

### 4) توحيد المسميات والنبرة
- المسميات الرسمية الموحّدة من `journey.ribbon.stages.*` (الخصوبة / الحمل / الأمومة) تستخدم في:
  - شريط `JourneyProgressRibbon` (موجود).
  - بطاقات صفحة رحلتي (موجود).
  - أي عنوان فرعي في `TodayStoryHero` يشير إلى المرحلة (تحقّق وعدّل إن وُجد نص محلي).
- وحِّد العنوان: "رحلتي" (بدون "اليوم") لصفحة `/my-journey`، و "لوحتي اليومية" للوحة اليوم — واضح أن الأولى نظرة شاملة والثانية يومية.
- أزل من صفحة رحلتي عبارة "review or switch the active one" واستبدلها بنص يقرّ بأن المرحلة تُحدَّث تلقائيًا من تواريخك، وأن التبديل اليدوي يوقف هذا التلقائية.

### 5) إشارة بصرية للتزامن
- في رأس صفحة رحلتي أضف شريطًا صغيرًا أسفل الـribbon يعرض نفس الأسبوع/الموعد الظاهرَين في لوحة اليوم (مثلًا: "الأسبوع 24 — الموعد المتوقع 12 سبتمبر")، ليكون التطابق مرئيًا للمستخدم.

## الملفات المتأثرة

- `src/hooks/useUserProfile.ts` — مزامنة `dueDate` مع `journeyHistory.pregnancy.dueDate`.
- `src/pages/JourneyMap.tsx` — منطق `confirmStageChange`، نص الإرشاد، شريط الأسبوع/الموعد.
- `src/components/journey/JourneyTimeline.tsx` — تصفية النقاط الوهمية، اشتقاق نقطة الحمل من LMP، فرز.
- `src/components/dashboard/tabs/TodayTab.tsx` — حذف الـfallback وتثبيت `journeyStage`.
- `src/components/dashboard/TodayStoryHero.tsx` — مراجعة المسميات (إن لزم) لتطابق `journey.ribbon.stages.*`.

## ما هو خارج نطاق هذه الخطة

- لا تغيير في الـAI أو الـquota أو التخزين.
- لا تغيير في تصميم الـribbon أو ألوان `useStageTheme`.
- لا حذف لأي محطة من المراحل الثلاث.

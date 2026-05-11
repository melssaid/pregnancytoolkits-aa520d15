## المشكلة
بطاقتا "تحدي اليوم" و"تحدي الأسبوع" في الصفحة الرئيسية تستخدمان ألوانًا خارج لوحة الوردي–اللافندر:
- `DailyHealthChallengeCard`: أيقونة Target بلون `text-orange-500` وخلفية بطاقة محايدة (`bg-card`) بدون wash متناسق.
- `WeeklyHealthChallenge`: شريط التقدم في الحالة غير المكتملة بلون `bg-primary` صلب — يبدو حادًا مقارنة بباقي البطاقات الناعمة.

## الحل
توحيد البطاقتين على نفس wash التدرّج الناعم المعتمد في باقي بطاقات اللوحة (وردي → لافندر بشفافية منخفضة)، مع جعل الأيقونات والـ accents تتبع `--primary` و`--accent` بدل ألوان حرّة.

### التغييرات التقنية

1. **`src/components/dashboard/DailyHealthChallengeCard.tsx`**
   - استبدال `bg-card border-border/50` بـ `bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.05] border-primary/15`.
   - استبدال أيقونة Target من `text-orange-500` إلى `text-primary`، ووضعها داخل دائرة `w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15` لتطابق نمط باقي رؤوس البطاقات.
   - عدّاد `0/3` يبقى `text-primary` لكن مع `bg-primary/10 px-2 py-0.5 rounded-full` كـ pill متناسق.

2. **`src/components/dashboard/WeeklyHealthChallenge.tsx`**
   - توسيع الخلفية: `from-primary/[0.05] via-accent/[0.04] to-transparent` بدل التدرّج الحالي أحادي الجانب.
   - شريط التقدم في الحالة الجارية: `bg-gradient-to-r from-primary to-accent` بدل `bg-primary` الصلب — تدرج ناعم متطابق مع `--success` لكن بألوان البراند الأساسية.
   - زر `+1`: `bg-gradient-to-r from-primary to-accent` بدل `bg-primary` للحفاظ على نفس الإيقاع البصري.
   - أيقونة الدائرة في حالة عدم الإكمال: `bg-gradient-to-br from-primary/12 to-accent/12` بدل `bg-primary/10`.

### النتيجة
كلا البطاقتين تتبعان نفس وصفة التدرّج الناعم المستخدمة في `WeeklyComparisonCard`, `BabySizeCard`, `NotificationFallbackCard` — لا ألوان حرّة، ولا تباين حاد، فقط تدرج وردي–لافندر مريح للعين بنفس أسلوب الصفحة الرئيسية.

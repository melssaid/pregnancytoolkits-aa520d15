/**
 * Stage + week aware content engine
 *
 * Produces a contextual daily tip and a short list of recommended tools
 * tailored to the user's journey stage (fertility / pregnant / postpartum)
 * and — for pregnancy — the current week.
 *
 * Bilingual (Arabic primary, English fallback). Tips are wellness-only
 * (no medical/diagnostic terminology), aligned with project tone rules.
 */

export type JourneyStage = "fertility" | "pregnant" | "postpartum";
export type Lang = "ar" | "en";

export interface ToolRec {
  href: string;
  titleAr: string;
  titleEn: string;
  emoji: string;
}

interface BandTip { ar: string; en: string }
interface PregnancyBand {
  /** inclusive lower week bound */
  from: number;
  /** inclusive upper week bound */
  to: number;
  tips: BandTip[];
  tools: ToolRec[];
}

// ── Pregnancy bands by trimester / phase ───────────────────────────────
const PREGNANCY_BANDS: PregnancyBand[] = [
  {
    from: 1, to: 13,
    tips: [
      { ar: "ركّزي على الراحة وشرب الماء — جسمكِ يبني الكثير في الثلث الأول.", en: "Prioritize rest and hydration — your body is doing intense work in the first trimester." },
      { ar: "تناولي الفوليك أسيد بانتظام، وقسّمي وجباتكِ إلى وجبات صغيرة لتخفيف الغثيان.", en: "Take folic acid daily and split meals into smaller portions to ease nausea." },
      { ar: "سجّلي أعراض اليوم لمتابعة نمط جسمكِ بدقة.", en: "Log today's symptoms to track your body's pattern accurately." },
    ],
    tools: [
      { href: "/tools/due-date-calculator", titleAr: "حاسبة موعد الولادة", titleEn: "Due Date Calculator", emoji: "📅" },
      { href: "/tools/vitamin-tracker", titleAr: "متابعة الفيتامينات", titleEn: "Vitamin Tracker", emoji: "💊" },
      { href: "/tools/ai-meal-suggestion", titleAr: "اقتراح وجبة اليوم", titleEn: "Today's Meal", emoji: "🥗" },
      { href: "/tools/ai-symptom-analyzer", titleAr: "محلّل الأعراض", titleEn: "Symptom Notes", emoji: "📝" },
    ],
  },
  {
    from: 14, to: 27,
    tips: [
      { ar: "هذه أفضل مرحلة لممارسة نشاط بدني خفيف — مشي 20 دقيقة يوميًا.", en: "This is the sweet spot for gentle activity — try 20 minutes of daily walking." },
      { ar: "ابدئي بمتابعة حركات الجنين بانتظام بعد الأسبوع 18.", en: "Start tracking baby's movements regularly after week 18." },
      { ar: "وزنكِ يبدأ بالزيادة الطبيعية — تابعيه أسبوعيًا.", en: "Healthy weight gain begins now — track it weekly." },
    ],
    tools: [
      { href: "/tools/kick-counter", titleAr: "عدّاد الركلات", titleEn: "Kick Counter", emoji: "🦶" },
      { href: "/tools/ai-fitness-coach", titleAr: "مدرّبة اللياقة", titleEn: "Fitness Coach", emoji: "🏃‍♀️" },
      { href: "/tools/weight-gain", titleAr: "متابعة الوزن", titleEn: "Weight Tracker", emoji: "⚖️" },
      { href: "/tools/fetal-growth", titleAr: "تطوّر الطفل", titleEn: "Baby Growth", emoji: "👶" },
    ],
  },
  {
    from: 28, to: 36,
    tips: [
      { ar: "حان وقت تجهيز حقيبة المستشفى تدريجيًا.", en: "Time to gradually prepare your hospital bag." },
      { ar: "احرصي على عدّ ركلات الطفل يوميًا — 10 حركات خلال ساعتين.", en: "Count baby's kicks daily — aim for 10 movements within two hours." },
      { ar: "ابدئي بتمارين التنفّس استعدادًا للولادة.", en: "Begin breathing exercises to prepare for delivery." },
    ],
    tools: [
      { href: "/tools/ai-hospital-bag", titleAr: "حقيبة المستشفى", titleEn: "Hospital Bag", emoji: "🧳" },
      { href: "/tools/ai-birth-plan", titleAr: "خطة الولادة", titleEn: "Birth Plan", emoji: "📋" },
      { href: "/tools/kick-counter", titleAr: "عدّاد الركلات", titleEn: "Kick Counter", emoji: "🦶" },
      { href: "/tools/ai-back-pain-relief", titleAr: "تخفيف آلام الظهر", titleEn: "Back Pain Relief", emoji: "💆‍♀️" },
    ],
  },
  {
    from: 37, to: 42,
    tips: [
      { ar: "أنتِ في المرحلة النهائية — استمعي لجسمكِ ولا تتردّدي في الراحة.", en: "Final stretch — listen to your body and rest often." },
      { ar: "وقّتي الانقباضات عند بدئها لمتابعة انتظامها.", en: "Time contractions when they begin to track their rhythm." },
      { ar: "راجعي خطة الولادة وحقيبة المستشفى مرة أخيرة.", en: "Review your birth plan and hospital bag one last time." },
    ],
    tools: [
      { href: "/tools/contraction-timer", titleAr: "موقّت الانقباضات", titleEn: "Contraction Timer", emoji: "⏱️" },
      { href: "/tools/ai-birth-position", titleAr: "وضعيات الولادة", titleEn: "Birth Positions", emoji: "🤱" },
      { href: "/tools/ai-birth-plan", titleAr: "خطة الولادة", titleEn: "Birth Plan", emoji: "📋" },
      { href: "/tools/ai-lactation-prep", titleAr: "تحضير الرضاعة", titleEn: "Lactation Prep", emoji: "🍼" },
    ],
  },
];

// ── Fertility & postpartum (no week segmentation) ──────────────────────
const FERTILITY_TIPS: BandTip[] = [
  { ar: "تابعي دورتكِ لمعرفة أيام التبويض بدقة.", en: "Track your cycle to identify ovulation days accurately." },
  { ar: "ابدئي بتناول الفوليك أسيد قبل الحمل بثلاثة أشهر.", en: "Start folic acid three months before conception." },
  { ar: "النوم المنتظم والغذاء المتوازن يدعمان الخصوبة.", en: "Regular sleep and balanced nutrition support fertility." },
];
const FERTILITY_TOOLS: ToolRec[] = [
  { href: "/tools/cycle-tracker", titleAr: "متابعة الدورة", titleEn: "Cycle Tracker", emoji: "🌸" },
  { href: "/tools/due-date-calculator", titleAr: "حاسبة موعد الولادة", titleEn: "Due Date Calculator", emoji: "📅" },
  { href: "/tools/preconception-checkup", titleAr: "فحص ما قبل الحمل", titleEn: "Preconception Checkup", emoji: "✅" },
  { href: "/tools/fertility-academy", titleAr: "أكاديمية الخصوبة", titleEn: "Fertility Academy", emoji: "📚" },
];

const POSTPARTUM_TIPS: BandTip[] = [
  { ar: "جسمكِ يتعافى — أعطِ نفسكِ الوقت ولا تقارني نفسكِ بأحد.", en: "Your body is recovering — give yourself time and don't compare." },
  { ar: "النوم متى ما نام الطفل قاعدة ذهبية في الأسابيع الأولى.", en: "Sleep when the baby sleeps — a golden rule in the early weeks." },
  { ar: "تابعي وزن الطفل ونومه ورضاعته يوميًا.", en: "Track baby's weight, sleep, and feeding daily." },
];
const POSTPARTUM_TOOLS: ToolRec[] = [
  { href: "/tools/baby-sleep-tracker", titleAr: "متابعة نوم الطفل", titleEn: "Baby Sleep", emoji: "😴" },
  { href: "/tools/diaper-tracker", titleAr: "متابعة الحفاضات", titleEn: "Diaper Tracker", emoji: "🍼" },
  { href: "/tools/baby-growth", titleAr: "نموّ الطفل", titleEn: "Baby Growth", emoji: "📏" },
  { href: "/tools/postpartum-recovery", titleAr: "تعافي ما بعد الولادة", titleEn: "Postpartum Recovery", emoji: "💗" },
];

// ── Helpers ─────────────────────────────────────────────────────────────
function dayOfYear(): number {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function pickBand(week: number): PregnancyBand {
  return (
    PREGNANCY_BANDS.find((b) => week >= b.from && week <= b.to) ??
    PREGNANCY_BANDS[0]
  );
}

export interface StageContent {
  tip: string;
  tools: ToolRec[];
  /** Localized "for week N" or stage label, used as a small headline */
  contextLabel: string;
}

export function getStageContent(
  stage: JourneyStage,
  week: number,
  lang: Lang = "ar",
): StageContent {
  const idx = dayOfYear();

  if (stage === "fertility") {
    const tip = FERTILITY_TIPS[idx % FERTILITY_TIPS.length];
    return {
      tip: lang === "ar" ? tip.ar : tip.en,
      tools: FERTILITY_TOOLS,
      contextLabel: lang === "ar" ? "مرحلة التخطيط" : "Planning stage",
    };
  }

  if (stage === "postpartum") {
    const tip = POSTPARTUM_TIPS[idx % POSTPARTUM_TIPS.length];
    return {
      tip: lang === "ar" ? tip.ar : tip.en,
      tools: POSTPARTUM_TOOLS,
      contextLabel: lang === "ar" ? "ما بعد الولادة" : "Postpartum",
    };
  }

  // Pregnancy
  const safeWeek = week > 0 ? Math.min(42, week) : 1;
  const band = pickBand(safeWeek);
  const tip = band.tips[idx % band.tips.length];
  return {
    tip: lang === "ar" ? tip.ar : tip.en,
    tools: band.tools,
    contextLabel:
      lang === "ar" ? `الأسبوع ${safeWeek}` : `Week ${safeWeek}`,
  };
}

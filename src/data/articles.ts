
import { getToolById } from "@/lib/tools-data";
import planningCycleImage from "@/assets/articles/planning-cycle-clean.jpg";
import planningNutritionImage from "@/assets/articles/planning-nutrition-clean.jpg";
import pregnancyWeeklyImage from "@/assets/articles/pregnancy-weekly-clean.jpg";
import pregnancyBirthImage from "@/assets/articles/pregnancy-birth-clean.jpg";
import pregnancyKicksImage from "@/assets/articles/pregnancy-kicks.jpg";
import postpartumRecoveryImage from "@/assets/articles/postpartum-recovery-clean.jpg";
import postpartumBondingImage from "@/assets/articles/postpartum-bonding-clean.jpg";
import postpartumSleepImage from "@/assets/articles/postpartum-sleep-clean.jpg";
import { estimateArabicReadTime, getArabicArticleContent, getArabicArticleExcerpt } from "@/content/articles-ar";

const articleImageRegistry = {
  planningCycleImage,
  planningNutritionImage,
  pregnancyWeeklyImage,
  pregnancyBirthImage,
  pregnancyKicksImage,
  postpartumRecoveryImage,
  postpartumBondingImage,
  postpartumSleepImage,
} as const;

const sectionFallbackImage: Record<ArticleSectionKey, string> = {
  planning: planningCycleImage,
  pregnant: pregnancyWeeklyImage,
  postpartum: postpartumRecoveryImage,
};

export type ArticleSectionKey = "planning" | "pregnant" | "postpartum";
export type ArticleType = "article" | "research" | "discovery";
export type SupportedArticleLanguage = "ar" | "en" | "de" | "fr" | "es" | "tr" | "pt";

type LocalizedMap = Record<SupportedArticleLanguage, string>;

type ArticleSeed = {
  id: string;
  slug: string;
  sectionKey: ArticleSectionKey;
  type: ArticleType;
  image: string;
  readTime: number;
  tags: ArticleTag[];
  relatedToolIds: string[];
  relatedArticleIds: string[];
  featuredInSection: boolean;
  featuredGlobal: boolean;
  popularityWeight: number;
  order: number;
  titles: LocalizedMap;
};

export type ArticleTag =
  | "fertility"
  | "timing"
  | "cycle-awareness"
  | "patterns"
  | "readiness"
  | "nutrition"
  | "vitamins"
  | "sleep"
  | "routine"
  | "tracking"
  | "planning"
  | "ovulation"
  | "mindset"
  | "support"
  | "mistakes"
  | "research"
  | "decision-making"
  | "weekly-guide"
  | "growth"
  | "body-changes"
  | "comfort"
  | "movement"
  | "fitness"
  | "partner"
  | "energy"
  | "weight"
  | "birth-prep"
  | "hospital-bag"
  | "essentials"
  | "birth-plan"
  | "baby-movements"
  | "awareness"
  | "contractions"
  | "wellbeing"
  | "attention"
  | "recovery"
  | "rest"
  | "feeding"
  | "bonding"
  | "newborn"
  | "crying"
  | "organization"
  | "balance"
  | "first-weeks"
  | "discovery";

export interface ArticleRecord {
  id: string;
  slug: string;
  sectionKey: ArticleSectionKey;
  sectionLabel: string;
  type: ArticleType;
  typeLabel: string;
  title: string;
  excerpt: string;
  intro: string;
  heroAlt: string;
  image: string;
  readTime: number;
  readTimeLabel: string;
  tags: ArticleTag[];
  tagLabels: string[];
  sections: { heading: string; body: string }[];
  publishedAt: string;
  updatedAt: string;
  relatedToolIds: string[];
  relatedArticleIds: string[];
  featuredInSection: boolean;
  featuredGlobal: boolean;
  popularityWeight: number;
  order: number;
}

const SUPPORTED_LANGUAGES: SupportedArticleLanguage[] = ["ar", "en", "de", "fr", "es", "tr", "pt"];
const ARTICLE_RELEASE_START = Date.UTC(2025, 0, 1);
const TWO_WEEKS_IN_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const uiCopy = {
  ar: {
    sectionIntro: "محتوى مختار بعناية لهذه المرحلة",
    sectionTitles: {
      planning: "مقالات التخطيط والخصوبة",
      pregnant: "مقالات رحلتكِ الحالية",
      postpartum: "مقالات ما بعد الولادة والعناية",
    },
    featuredLabel: "مقال بارز",
    readAlso: "اقرئي أيضًا",
    suggested: "مقترح لكِ",
    mostRead: "الأكثر قراءة هذا الأسبوع",
    mostReadDesc: "اختيارات تحريرية مرتبطة بما تبحث عنه المستخدمات داخل التطبيق.",
    relatedArticles: "مقالات مرتبطة بالسياق",
    relatedArticlesDesc: "تنقّل ذكي بين المقالات المتقاربة وبين الأدوات الأنسب لهذه الخطوة.",
    readNext: "الخطوة التالية في القراءة",
    readNextDesc: "مقالة تكمّل الفكرة الحالية وتدفعكِ بسلاسة إلى الخطوة التالية.",
    similarArticles: "مقالات مشابهة",
    similarArticlesDesc: "اختيارات قريبة من نفس المرحلة أو نفس الموضوع لقراءة أعمق.",
    relatedTools: "أدوات مرتبطة بهذه القراءة",
    relatedToolsDesc: "ابدئي من الأداة التي تكمل هذه الفكرة مباشرة داخل التطبيق.",
    suggestedTool: "أداة مرتبطة",
    keyPoints: "محاور سريعة",
    readArticle: "اقرئي المقال",
    continueReading: "تابعي القراءة",
    backToHome: "العودة للرئيسية",
    articleNotFound: "المقال غير متاح حالياً",
    articleNotFoundDesc: "قد يكون هذا المقال ضمن دفعة نشر لاحقة أو تم نقله إلى قسم آخر.",
    whyNow: "الآن",
    practicalView: "عملياً",
    nextStep: "بعد ذلك",
    publishedOn: "تاريخ النشر",
    updatedOn: "آخر تحديث",
    professionalDesk: "فريق Pregnancy Toolkits التحريري",
    discoverMore: "اكتشفي المزيد",
  },
  en: {
    sectionIntro: "Curated reading for this stage",
    sectionTitles: {
      planning: "Planning & fertility reads",
      pregnant: "Pregnancy editorial picks",
      postpartum: "Postpartum & baby reads",
    },
    featuredLabel: "Featured read",
    readAlso: "Read also",
    suggested: "Suggested next",
    mostRead: "Most read this week",
    mostReadDesc: "Editorial picks aligned with what users explore most inside the app.",
    relatedArticles: "Related reads",
    relatedArticlesDesc: "Move naturally between connected articles and the most relevant tools.",
    readNext: "Read next",
    readNextDesc: "A follow-up piece that extends the idea and keeps the journey moving.",
    similarArticles: "Similar articles",
    similarArticlesDesc: "More reads from the same stage or topic for deeper discovery.",
    relatedTools: "Tools linked to this read",
    relatedToolsDesc: "Jump into the tool that best complements this idea right now.",
    suggestedTool: "Related tool",
    keyPoints: "Quick focus points",
    readArticle: "Read article",
    continueReading: "Continue reading",
    backToHome: "Back to home",
    articleNotFound: "Article not available yet",
    articleNotFoundDesc: "This article may be scheduled for a later release wave or moved to another section.",
    whyNow: "Why it matters now",
    practicalView: "Practical perspective",
    nextStep: "What to do next",
    publishedOn: "Published",
    updatedOn: "Updated",
    professionalDesk: "Pregnancy Toolkits Editorial Desk",
    discoverMore: "Discover more",
  },
  de: {
    sectionIntro: "Kuratiertes Lesen für diese Phase",
    sectionTitles: {
      planning: "Planung & Fruchtbarkeit",
      pregnant: "Redaktionelle Auswahl zur Schwangerschaft",
      postpartum: "Lesestoff für Wochenbett & Baby",
    },
    featuredLabel: "Empfohlen",
    readAlso: "Weiterlesen",
    suggested: "Als Nächstes",
    mostRead: "Meistgelesen diese Woche",
    mostReadDesc: "Redaktionelle Empfehlungen passend zu den beliebtesten Themen in der App.",
    relatedArticles: "Verwandte Artikel",
    relatedArticlesDesc: "Wechsle fließend zwischen passenden Artikeln und hilfreichen Tools.",
    readNext: "Als Nächstes lesen",
    readNextDesc: "Ein Anschlussartikel, der die aktuelle Idee sinnvoll erweitert.",
    similarArticles: "Ähnliche Artikel",
    similarArticlesDesc: "Weitere passende Texte aus derselben Phase oder demselben Thema.",
    relatedTools: "Passende Tools zu diesem Artikel",
    relatedToolsDesc: "Starte direkt mit dem Tool, das diese Idee am besten ergänzt.",
    suggestedTool: "Passendes Tool",
    keyPoints: "Wichtige Punkte",
    readArticle: "Artikel lesen",
    continueReading: "Weiterlesen",
    backToHome: "Zur Startseite",
    articleNotFound: "Artikel derzeit nicht verfügbar",
    articleNotFoundDesc: "Dieser Artikel erscheint möglicherweise in einer späteren Veröffentlichungswelle.",
    whyNow: "Warum das jetzt wichtig ist",
    practicalView: "Praktischer Blick",
    nextStep: "Nächster Schritt",
    publishedOn: "Veröffentlicht",
    updatedOn: "Aktualisiert",
    professionalDesk: "Pregnancy Toolkits Redaktion",
    discoverMore: "Mehr entdecken",
  },
  fr: {
    sectionIntro: "Une lecture choisie pour cette étape",
    sectionTitles: {
      planning: "Articles planification & fertilité",
      pregnant: "Sélection éditoriale grossesse",
      postpartum: "Lectures post-partum & bébé",
    },
    featuredLabel: "À la une",
    readAlso: "À lire aussi",
    suggested: "Suggestion suivante",
    mostRead: "Les plus lus cette semaine",
    mostReadDesc: "Des choix éditoriaux alignés sur ce que les utilisatrices explorent le plus dans l’app.",
    relatedArticles: "Articles liés",
    relatedArticlesDesc: "Passe naturellement entre les lectures proches et les outils les plus utiles.",
    readNext: "Lire ensuite",
    readNextDesc: "Une lecture qui prolonge naturellement l’idée actuelle.",
    similarArticles: "Articles similaires",
    similarArticlesDesc: "D’autres contenus proches de la même étape ou du même sujet.",
    relatedTools: "Outils liés à cette lecture",
    relatedToolsDesc: "Ouvre l’outil qui complète le mieux cette idée dès maintenant.",
    suggestedTool: "Outil lié",
    keyPoints: "Points clés",
    readArticle: "Lire l’article",
    continueReading: "Continuer la lecture",
    backToHome: "Retour à l’accueil",
    articleNotFound: "Article indisponible pour le moment",
    articleNotFoundDesc: "Cet article peut être prévu pour une vague de publication ultérieure.",
    whyNow: "Pourquoi c’est utile maintenant",
    practicalView: "Point de vue pratique",
    nextStep: "Prochaine étape",
    publishedOn: "Publié le",
    updatedOn: "Mis à jour le",
    professionalDesk: "Rédaction Pregnancy Toolkits",
    discoverMore: "Découvrir plus",
  },
  es: {
    sectionIntro: "Lecturas seleccionadas para esta etapa",
    sectionTitles: {
      planning: "Lecturas de planificación y fertilidad",
      pregnant: "Selección editorial del embarazo",
      postpartum: "Lecturas de posparto y bebé",
    },
    featuredLabel: "Destacado",
    readAlso: "Lee también",
    suggested: "Siguiente sugerencia",
    mostRead: "Lo más leído esta semana",
    mostReadDesc: "Selecciones editoriales alineadas con lo que más exploran las usuarias en la app.",
    relatedArticles: "Artículos relacionados",
    relatedArticlesDesc: "Muévete de forma natural entre artículos conectados y herramientas útiles.",
    readNext: "Sigue con esto",
    readNextDesc: "Una lectura que amplía esta idea y te lleva al siguiente paso.",
    similarArticles: "Artículos similares",
    similarArticlesDesc: "Más lecturas de la misma etapa o del mismo tema para profundizar.",
    relatedTools: "Herramientas ligadas a esta lectura",
    relatedToolsDesc: "Abre la herramienta que mejor complementa esta idea ahora mismo.",
    suggestedTool: "Herramienta ligada",
    keyPoints: "Puntos clave",
    readArticle: "Leer artículo",
    continueReading: "Seguir leyendo",
    backToHome: "Volver al inicio",
    articleNotFound: "Artículo aún no disponible",
    articleNotFoundDesc: "Este artículo puede estar programado para una próxima tanda de publicación.",
    whyNow: "Por qué importa ahora",
    practicalView: "Enfoque práctico",
    nextStep: "Qué hacer después",
    publishedOn: "Publicado",
    updatedOn: "Actualizado",
    professionalDesk: "Equipo editorial de Pregnancy Toolkits",
    discoverMore: "Descubrir más",
  },
  tr: {
    sectionIntro: "Bu dönem için özenle seçilmiş içerik",
    sectionTitles: {
      planning: "Planlama ve doğurganlık yazıları",
      pregnant: "Gebelik editör seçimleri",
      postpartum: "Doğum sonrası ve bebek içerikleri",
    },
    featuredLabel: "Öne çıkan",
    readAlso: "Bunu da oku",
    suggested: "Sıradaki öneri",
    mostRead: "Bu haftanın en çok okunanları",
    mostReadDesc: "Uygulamada en çok keşfedilen konularla uyumlu editoryal seçimler.",
    relatedArticles: "İlgili yazılar",
    relatedArticlesDesc: "Bağlantılı yazılar ve uygun araçlar arasında doğal şekilde ilerle.",
    readNext: "Sıradaki okuma",
    readNextDesc: "Mevcut fikri doğal biçimde devam ettiren bir yazı.",
    similarArticles: "Benzer yazılar",
    similarArticlesDesc: "Aynı dönemden veya konudan daha fazla okuma önerisi.",
    relatedTools: "Bu yazıyla bağlantılı araçlar",
    relatedToolsDesc: "Bu fikri en iyi tamamlayan araca hemen geç.",
    suggestedTool: "İlgili araç",
    keyPoints: "Hızlı odak noktaları",
    readArticle: "Yazıyı oku",
    continueReading: "Okumaya devam et",
    backToHome: "Ana sayfaya dön",
    articleNotFound: "Yazı şu anda mevcut değil",
    articleNotFoundDesc: "Bu yazı daha sonraki bir yayın dalgası için planlanmış olabilir.",
    whyNow: "Neden şimdi önemli",
    practicalView: "Pratik bakış",
    nextStep: "Sonraki adım",
    publishedOn: "Yayınlandı",
    updatedOn: "Güncellendi",
    professionalDesk: "Pregnancy Toolkits Editör Masası",
    discoverMore: "Daha fazlasını keşfet",
  },
  pt: {
    sectionIntro: "Leitura selecionada para esta fase",
    sectionTitles: {
      planning: "Leituras de planejamento e fertilidade",
      pregnant: "Seleção editorial da gravidez",
      postpartum: "Leituras de pós-parto e bebê",
    },
    featuredLabel: "Em destaque",
    readAlso: "Leia também",
    suggested: "Próxima sugestão",
    mostRead: "Mais lidos da semana",
    mostReadDesc: "Escolhas editoriais alinhadas ao que as usuárias mais exploram no app.",
    relatedArticles: "Artigos relacionados",
    relatedArticlesDesc: "Passe com naturalidade entre leituras conectadas e ferramentas úteis.",
    readNext: "Leia a seguir",
    readNextDesc: "Uma leitura que amplia a ideia atual e conduz ao próximo passo.",
    similarArticles: "Artigos semelhantes",
    similarArticlesDesc: "Mais conteúdos da mesma fase ou do mesmo tema para aprofundar.",
    relatedTools: "Ferramentas ligadas a esta leitura",
    relatedToolsDesc: "Abra a ferramenta que melhor complementa esta ideia agora.",
    suggestedTool: "Ferramenta relacionada",
    keyPoints: "Pontos-chave",
    readArticle: "Ler artigo",
    continueReading: "Continuar leitura",
    backToHome: "Voltar ao início",
    articleNotFound: "Artigo ainda não disponível",
    articleNotFoundDesc: "Este artigo pode estar programado para uma próxima onda de publicação.",
    whyNow: "Por que isso importa agora",
    practicalView: "Visão prática",
    nextStep: "Próximo passo",
    publishedOn: "Publicado",
    updatedOn: "Atualizado",
    professionalDesk: "Equipe editorial Pregnancy Toolkits",
    discoverMore: "Descobrir mais",
  },
} as const;

const typeLabels: Record<ArticleType, LocalizedMap> = {
  article: {
    ar: "مقال",
    en: "Article",
    de: "Artikel",
    fr: "Article",
    es: "Artículo",
    tr: "Makale",
    pt: "Artigo",
  },
  research: {
    ar: "بحث مبسط",
    en: "Research brief",
    de: "Forschungsnotiz",
    fr: "Recherche simple",
    es: "Investigación breve",
    tr: "Araştırma özeti",
    pt: "Pesquisa breve",
  },
  discovery: {
    ar: "اكتشاف",
    en: "Discovery",
    de: "Entdeckung",
    fr: "Découverte",
    es: "Descubrimiento",
    tr: "Keşif",
    pt: "Descoberta",
  },
};

const sectionLabels: Record<ArticleSectionKey, LocalizedMap> = {
  planning: {
    ar: "التخطيط والخصوبة",
    en: "Planning & fertility",
    de: "Planung & Fruchtbarkeit",
    fr: "Planification & fertilité",
    es: "Planificación y fertilidad",
    tr: "Planlama ve doğurganlık",
    pt: "Planejamento e fertilidade",
  },
  pregnant: {
    ar: "الحمل",
    en: "Pregnancy",
    de: "Schwangerschaft",
    fr: "Grossesse",
    es: "Embarazo",
    tr: "Gebelik",
    pt: "Gravidez",
  },
  postpartum: {
    ar: "ما بعد الولادة والطفل",
    en: "Postpartum & baby",
    de: "Wochenbett & Baby",
    fr: "Post-partum & bébé",
    es: "Posparto y bebé",
    tr: "Doğum sonrası ve bebek",
    pt: "Pós-parto e bebê",
  },
};

const tagLabels: Record<ArticleTag, LocalizedMap> = {
  fertility: { ar: "خصوبة", en: "Fertility", de: "Fruchtbarkeit", fr: "Fertilité", es: "Fertilidad", tr: "Doğurganlık", pt: "Fertilidade" },
  timing: { ar: "توقيت", en: "Timing", de: "Timing", fr: "Timing", es: "Tiempo", tr: "Zamanlama", pt: "Momento" },
  "cycle-awareness": { ar: "وعي بالدورة", en: "Cycle awareness", de: "Zyklusbewusstsein", fr: "Cycle", es: "Ciclo", tr: "Döngü farkındalığı", pt: "Ciclo" },
  patterns: { ar: "أنماط", en: "Patterns", de: "Muster", fr: "Repères", es: "Patrones", tr: "Örüntüler", pt: "Padrões" },
  readiness: { ar: "جاهزية", en: "Readiness", de: "Bereitschaft", fr: "Préparation", es: "Preparación", tr: "Hazırlık", pt: "Preparação" },
  nutrition: { ar: "تغذية", en: "Nutrition", de: "Ernährung", fr: "Nutrition", es: "Nutrición", tr: "Beslenme", pt: "Nutrição" },
  vitamins: { ar: "فيتامينات", en: "Vitamins", de: "Vitamine", fr: "Vitamines", es: "Vitaminas", tr: "Vitaminler", pt: "Vitaminas" },
  sleep: { ar: "نوم", en: "Sleep", de: "Schlaf", fr: "Sommeil", es: "Sueño", tr: "Uyku", pt: "Sono" },
  routine: { ar: "روتين", en: "Routine", de: "Routine", fr: "Routine", es: "Rutina", tr: "Rutin", pt: "Rotina" },
  tracking: { ar: "تتبع", en: "Tracking", de: "Tracking", fr: "Suivi", es: "Seguimiento", tr: "Takip", pt: "Acompanhamento" },
  planning: { ar: "تخطيط", en: "Planning", de: "Planung", fr: "Planification", es: "Planificación", tr: "Planlama", pt: "Planejamento" },
  ovulation: { ar: "إباضة", en: "Ovulation", de: "Ovulation", fr: "Ovulation", es: "Ovulación", tr: "Yumurtlama", pt: "Ovulação" },
  mindset: { ar: "تهيئة نفسية", en: "Mindset", de: "Mentalität", fr: "État d’esprit", es: "Mentalidad", tr: "Zihniyet", pt: "Mentalidade" },
  support: { ar: "دعم", en: "Support", de: "Unterstützung", fr: "Soutien", es: "Apoyo", tr: "Destek", pt: "Apoio" },
  mistakes: { ar: "أخطاء شائعة", en: "Common mistakes", de: "Häufige Fehler", fr: "Erreurs fréquentes", es: "Errores comunes", tr: "Yaygın hatalar", pt: "Erros comuns" },
  research: { ar: "رؤية بحثية", en: "Research lens", de: "Forschung", fr: "Recherche", es: "Investigación", tr: "Araştırma", pt: "Pesquisa" },
  "decision-making": { ar: "قرار", en: "Decision-making", de: "Entscheidung", fr: "Décision", es: "Decisión", tr: "Karar", pt: "Decisão" },
  "weekly-guide": { ar: "دليل أسبوعي", en: "Weekly guide", de: "Wochenguide", fr: "Guide hebdomadaire", es: "Guía semanal", tr: "Haftalık rehber", pt: "Guia semanal" },
  growth: { ar: "نمو", en: "Growth", de: "Wachstum", fr: "Croissance", es: "Crecimiento", tr: "Gelişim", pt: "Crescimento" },
  "body-changes": { ar: "تغيّرات الجسم", en: "Body changes", de: "Körperveränderungen", fr: "Changements du corps", es: "Cambios del cuerpo", tr: "Vücut değişimleri", pt: "Mudanças no corpo" },
  comfort: { ar: "راحة", en: "Comfort", de: "Wohlbefinden", fr: "Confort", es: "Comodidad", tr: "Rahatlık", pt: "Conforto" },
  movement: { ar: "حركة", en: "Movement", de: "Bewegung", fr: "Mouvement", es: "Movimiento", tr: "Hareket", pt: "Movimento" },
  fitness: { ar: "لياقة", en: "Fitness", de: "Fitness", fr: "Forme", es: "Actividad", tr: "Egzersiz", pt: "Atividade" },
  partner: { ar: "الشريك", en: "Partner", de: "Partner", fr: "Partenaire", es: "Pareja", tr: "Partner", pt: "Parceiro" },
  energy: { ar: "طاقة", en: "Energy", de: "Energie", fr: "Énergie", es: "Energía", tr: "Enerji", pt: "Energia" },
  weight: { ar: "وزن", en: "Weight", de: "Gewicht", fr: "Poids", es: "Peso", tr: "Kilo", pt: "Peso" },
  "birth-prep": { ar: "تجهيز للولادة", en: "Birth prep", de: "Geburtsvorbereitung", fr: "Préparation à la naissance", es: "Preparación al parto", tr: "Doğum hazırlığı", pt: "Preparação para o parto" },
  "hospital-bag": { ar: "حقيبة الولادة", en: "Hospital bag", de: "Kliniktasche", fr: "Sac maternité", es: "Bolsa del hospital", tr: "Hastane çantası", pt: "Mala da maternidade" },
  essentials: { ar: "أساسيات", en: "Essentials", de: "Essentials", fr: "Essentiels", es: "Esenciales", tr: "Temeller", pt: "Essenciais" },
  "birth-plan": { ar: "خطة ولادة", en: "Birth plan", de: "Geburtsplan", fr: "Projet de naissance", es: "Plan de parto", tr: "Doğum planı", pt: "Plano de parto" },
  "baby-movements": { ar: "حركات الطفل", en: "Baby movements", de: "Kindsbewegungen", fr: "Mouvements du bébé", es: "Movimientos del bebé", tr: "Bebek hareketleri", pt: "Movimentos do bebê" },
  awareness: { ar: "انتباه", en: "Awareness", de: "Achtsamkeit", fr: "Attention", es: "Atención", tr: "Farkındalık", pt: "Atenção" },
  contractions: { ar: "انقباضات", en: "Contractions", de: "Wehen", fr: "Contractions", es: "Contracciones", tr: "Kasılmalar", pt: "Contrações" },
  wellbeing: { ar: "رفاه", en: "Wellbeing", de: "Wohlbefinden", fr: "Bien-être", es: "Bienestar", tr: "İyi oluş", pt: "Bem-estar" },
  attention: { ar: "ملاحظة هادئة", en: "Calm attention", de: "Ruhe & Aufmerksamkeit", fr: "Observation calme", es: "Atención tranquila", tr: "Sakin dikkat", pt: "Atenção tranquila" },
  recovery: { ar: "تعافٍ", en: "Recovery", de: "Erholung", fr: "Récupération", es: "Recuperación", tr: "Toparlanma", pt: "Recuperação" },
  rest: { ar: "راحة", en: "Rest", de: "Ruhe", fr: "Repos", es: "Descanso", tr: "Dinlenme", pt: "Descanso" },
  feeding: { ar: "تغذية الطفل", en: "Feeding", de: "Füttern", fr: "Alimentation", es: "Alimentación", tr: "Besleme", pt: "Alimentação" },
  bonding: { ar: "ارتباط", en: "Bonding", de: "Bindung", fr: "Lien", es: "Vínculo", tr: "Bağ kurma", pt: "Vínculo" },
  newborn: { ar: "مولود جديد", en: "Newborn", de: "Neugeborenes", fr: "Nouveau-né", es: "Recién nacido", tr: "Yenidoğan", pt: "Recém-nascido" },
  crying: { ar: "بكاء", en: "Crying", de: "Weinen", fr: "Pleurs", es: "Llanto", tr: "Ağlama", pt: "Choro" },
  organization: { ar: "تنظيم", en: "Organization", de: "Organisation", fr: "Organisation", es: "Organización", tr: "Düzen", pt: "Organização" },
  balance: { ar: "توازن", en: "Balance", de: "Balance", fr: "Équilibre", es: "Equilibrio", tr: "Denge", pt: "Equilíbrio" },
  "first-weeks": { ar: "الأسابيع الأولى", en: "First weeks", de: "Erste Wochen", fr: "Premières semaines", es: "Primeras semanas", tr: "İlk haftalar", pt: "Primeiras semanas" },
  discovery: { ar: "اكتشاف", en: "Discovery", de: "Entdeckung", fr: "Découverte", es: "Descubrimiento", tr: "Keşif", pt: "Descoberta" },
};

const bodyTemplates = {
  ar: {
    article: [
      'يأتي هذا المقال ليمنحكِ صورة أوضح حول "{{title}}" داخل مرحلة {{section}}، مع تركيز عملي يساعدكِ على ترتيب التفاصيل بدل التشوش بينها.',
      "بدلاً من المعلومة المبعثرة، ستجدين هنا قراءة مختصرة تجمع بين الإيقاع اليومي، والخيارات الأبسط، وما يمكن تطبيقه بهدوء مع الأدوات المرتبطة داخل التطبيق.",
      "بعد هذه القراءة، يصبح الانتقال إلى الأداة المناسبة أو المقال التالي أكثر سلاسة، لأن السياق هنا مبني على ما تبحث عنه المستخدمات بالفعل في هذه المرحلة.",
    ],
    research: [
      'هذا الملخص البحثي حول "{{title}}" يقدّم لكِ فكرة واضحة بلغة مبسطة، حتى تفهمي لماذا تكرّر هذا الموضوع في توصيات العناية اليومية ضمن {{section}}.',
      "الهدف ليس إغراقكِ بالتفاصيل، بل تحويل الخلاصة إلى قرارات أخف: ماذا تراقبين، وما الذي يستحق التنظيم، وأين تبدأين أولاً.",
      "استخدمي هذه القراءة كبوصلة سريعة، ثم انتقلي إلى الأداة المرتبطة أو المقال التالي عندما تحتاجين خطوة أكثر عملية.",
    ],
    discovery: [
      'في هذا الاكتشاف التحريري حول "{{title}}" نلتقط فكرة صغيرة لكنها مؤثرة، وغالباً ما تغيّر جودة اليوم أكثر مما نتوقع داخل {{section}}.',
      "اللمسة هنا جمالية وعملية معًا: ربط الإيقاع اليومي بالملاحظة الهادئة، ثم تحويل ذلك إلى قرار أبسط يمكن تكراره.",
      "عندما تشعرين أن التفاصيل كثيرة، فهذه الزاوية المختصرة تساعدكِ على رؤية الرابط بين القراءة والأداة والمقال التالي.",
    ],
  },
  en: {
    article: [
      'This article gives you a clearer view of "{{title}}" within {{section}}, with a practical angle that helps you organize the details instead of feeling scattered.',
      "Rather than another loose tip, it turns the idea into a calm, usable perspective you can connect with the right tool inside the app.",
      "Once you finish this read, moving into the next article or companion tool should feel more natural and more relevant to your current stage.",
    ],
    research: [
      'This research brief on "{{title}}" keeps the science approachable, so you can understand why the topic appears so often in day-to-day guidance for {{section}}.',
      "The goal is not to overload you with detail, but to turn the evidence into lighter decisions: what to notice, what to organize, and where to begin.",
      "Use it as a smart lens, then continue into a related tool or the next article when you want a more actionable step.",
    ],
    discovery: [
      'This discovery piece on "{{title}}" highlights a small but influential idea that often changes the quality of the day more than expected during {{section}}.',
      "It blends editorial warmth with practical value, linking daily rhythm, gentle observation, and the next helpful action.",
      "If everything feels like too much at once, this shorter angle helps reconnect the article, the tool, and the next recommended read.",
    ],
  },
  de: {
    article: [
      'Dieser Artikel gibt dir einen klareren Blick auf "{{title}}" in der Phase {{section}} und ordnet die wichtigsten Punkte in einer ruhigen, praktischen Weise.',
      "Statt lose Tipps aneinanderzureihen, verbindet er Alltag, Beobachtung und die passenden Tools in der App zu einem klaren nächsten Schritt.",
      "Nach dem Lesen fällt der Übergang zum nächsten Artikel oder zum passenden Tool deutlich leichter.",
    ],
    research: [
      'Diese Forschungsnotiz zu "{{title}}" macht das Thema verständlich, damit du erkennst, warum es in Empfehlungen für {{section}} so oft auftaucht.',
      "Es geht nicht um zu viele Details, sondern um leichtere Entscheidungen: worauf du achten kannst, was du strukturierst und womit du beginnst.",
      "Nutze den Text als klare Orientierung und wechsle danach in ein passendes Tool oder einen verbundenen Artikel.",
    ],
    discovery: [
      'Diese Entdeckung zu "{{title}}" zeigt eine kleine, aber wirksame Idee, die im Alltag von {{section}} überraschend viel verändern kann.',
      "Die Perspektive verbindet sanfte Beobachtung, Tagesrhythmus und einen praktischen nächsten Schritt.",
      "Wenn dir gerade vieles gleichzeitig begegnet, hilft diese kompakte Sicht dabei, Artikel, Tool und nächsten Impuls wieder zusammenzubringen.",
    ],
  },
  fr: {
    article: [
      'Cet article t’offre une vision plus nette de "{{title}}" dans la phase {{section}}, avec une approche pratique qui remet les priorités dans le bon ordre.',
      "Au lieu d’une information isolée, tu y trouves une lecture courte qui relie rythme quotidien, observation calme et bon outil dans l’application.",
      "Une fois la lecture terminée, le passage vers l’article suivant ou l’outil associé devient plus fluide.",
    ],
    research: [
      'Cette note de recherche sur "{{title}}" garde l’essentiel clair et accessible, pour comprendre pourquoi ce sujet revient souvent dans les repères liés à {{section}}.',
      "L’idée n’est pas d’ajouter de la complexité, mais de transformer l’essentiel en décisions plus légères et plus concrètes.",
      "Lis-la comme un repère rapide, puis poursuis vers un outil lié ou un autre article quand tu veux une suite plus pratique.",
    ],
    discovery: [
      'Cette découverte éditoriale autour de "{{title}}" met en lumière une idée discrète mais très utile dans la qualité du quotidien pendant {{section}}.',
      "Elle relie douceur, observation et action simple à répéter sans surcharger la lecture.",
      "Quand tout semble dense, ce format plus court aide à reconnecter la lecture, l’outil et la suite logique.",
    ],
  },
  es: {
    article: [
      'Este artículo te da una mirada más clara sobre "{{title}}" en la etapa de {{section}}, con un enfoque práctico que ordena lo importante.',
      "En lugar de consejos sueltos, convierte la idea en una lectura breve conectada con el ritmo diario y con la herramienta adecuada dentro de la app.",
      "Al terminar, pasar al siguiente artículo o a la herramienta relacionada se siente mucho más natural.",
    ],
    research: [
      'Este resumen de investigación sobre "{{title}}" mantiene la información accesible, para que entiendas por qué el tema aparece tanto dentro de {{section}}.',
      "No busca cargarte de detalles, sino convertir la evidencia en decisiones más ligeras: qué notar, qué organizar y por dónde empezar.",
      "Úsalo como una guía breve y luego continúa con la herramienta o la lectura que mejor complemente tu momento.",
    ],
    discovery: [
      'Este descubrimiento editorial sobre "{{title}}" resalta una idea pequeña pero muy influyente en la calidad del día durante {{section}}.',
      "La perspectiva une ritmo cotidiano, observación tranquila y una acción sencilla que puedes repetir.",
      "Cuando sientas que hay demasiadas cosas a la vez, esta pieza corta te ayuda a volver a conectar lectura, herramienta y siguiente paso.",
    ],
  },
  tr: {
    article: [
      'Bu yazı, {{section}} döneminde "{{title}}" konusuna daha net bakmanı sağlar ve önemli noktaları pratik bir sıraya yerleştirir.',
      "Dağınık tavsiyeler yerine, günlük ritim ile uygulamadaki doğru araç arasında bağ kuran kısa ve kullanışlı bir perspektif sunar.",
      "Okumayı bitirdiğinde ilgili araca ya da sonraki yazıya geçmek daha doğal hissettirir.",
    ],
    research: [
      '"{{title}}" hakkındaki bu araştırma özeti, konuyu anlaşılır tutar ve neden {{section}} döneminde sık vurgulandığını açıklar.',
      "Amaç seni ayrıntıya boğmak değil; neyi fark edeceğin, neyi düzenleyeceğin ve nereden başlayacağın konusunda daha hafif kararlar sunmaktır.",
      "Bunu hızlı bir bakış olarak kullan, sonra istersen ilgili araca ya da bir sonraki yazıya geç.",
    ],
    discovery: [
      '"{{title}}" üzerine bu keşif yazısı, {{section}} döneminde günün kalitesini beklenenden fazla etkileyen küçük ama güçlü bir fikri öne çıkarır.',
      "Yumuşak gözlem, günlük ritim ve sonraki faydalı adım arasında zarif bir bağ kurar.",
      "Her şey aynı anda yoğun geldiğinde, bu kısa format yazı, araç ve sonraki öneri arasındaki bağı yeniden kurmaya yardım eder.",
    ],
  },
  pt: {
    article: [
      'Este artigo oferece uma visão mais clara sobre "{{title}}" na fase de {{section}}, com um olhar prático que organiza o que realmente importa.',
      "Em vez de dicas soltas, ele transforma a ideia em uma leitura breve conectada ao ritmo diário e à ferramenta certa dentro do app.",
      "Depois da leitura, avançar para o próximo artigo ou para a ferramenta relacionada fica mais natural.",
    ],
    research: [
      'Este resumo de pesquisa sobre "{{title}}" mantém o tema acessível, para mostrar por que ele aparece com tanta frequência em {{section}}.',
      "A proposta não é sobrecarregar você, mas transformar a evidência em decisões mais leves: o que observar, o que organizar e por onde começar.",
      "Use o texto como uma lente rápida e depois siga para a ferramenta ou leitura que melhor complemente este momento.",
    ],
    discovery: [
      'Esta descoberta editorial sobre "{{title}}" destaca uma ideia pequena, mas muito influente, na qualidade do dia durante {{section}}.',
      "Ela conecta ritmo diário, observação calma e uma ação simples que pode ser repetida com leveza.",
      "Quando parecer que há informação demais ao mesmo tempo, esta peça curta ajuda a reconectar artigo, ferramenta e próximo passo.",
    ],
  },
} as const;

const articleSeeds: ArticleSeed[] = [
  {
    "id": "planning-01",
    "slug": "fertility-window-guide",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningCycleImage",
    "readTime": 4,
    "tags": [
      "fertility",
      "timing",
      "cycle-awareness"
    ],
    "relatedToolIds": [
      "cycle-tracker",
      "fertility-academy",
      "due-date-calculator"
    ],
    "relatedArticleIds": [
      "ovulation-practical-guide",
      "when-to-use-cycle-tracking"
    ],
    "featuredInSection": true,
    "featuredGlobal": true,
    "popularityWeight": 96,
    "titles": {
      "ar": "نافذة الخصوبة بوضوح",
      "en": "Understanding your fertility window",
      "de": "Das Fruchtbarkeitsfenster verstehen",
      "fr": "Comprendre la fenêtre de fertilité",
      "es": "Entender la ventana fértil",
      "tr": "Doğurganlık dönemini anlamak",
      "pt": "Entender a janela fértil"
    },
    "order": 0
  },
  {
    "id": "planning-02",
    "slug": "cycle-quality-signals",
    "sectionKey": "planning",
    "type": "research",
    "image": "planningCycleImage",
    "readTime": 5,
    "tags": [
      "cycle-awareness",
      "patterns",
      "readiness"
    ],
    "relatedToolIds": [
      "cycle-tracker",
      "preconception-checkup",
      "fertility-academy"
    ],
    "relatedArticleIds": [
      "fertility-window-guide",
      "sleep-and-fertility"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 84,
    "titles": {
      "ar": "إشارات جودة الدورة",
      "en": "Cycle quality signals to notice",
      "de": "Wichtige Signale der Zyklusqualität",
      "fr": "Signaux à repérer dans le cycle",
      "es": "Señales clave de la calidad del ciclo",
      "tr": "Döngü kalitesinde dikkat edilmesi gereken sinyaller",
      "pt": "Sinais importantes da qualidade do ciclo"
    },
    "order": 1
  },
  {
    "id": "planning-03",
    "slug": "preconception-nutrition-readiness",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningNutritionImage",
    "readTime": 4,
    "tags": [
      "nutrition",
      "vitamins",
      "readiness"
    ],
    "relatedToolIds": [
      "nutrition-supplements",
      "preconception-checkup",
      "smart-grocery-list"
    ],
    "relatedArticleIds": [
      "micronutrients-for-conception",
      "sleep-and-fertility"
    ],
    "featuredInSection": true,
    "featuredGlobal": true,
    "popularityWeight": 92,
    "titles": {
      "ar": "الاستعداد الغذائي قبل الحمل",
      "en": "Nutrition readiness before pregnancy",
      "de": "Ernährungsstart vor der Schwangerschaft",
      "fr": "Préparer la nutrition avant la grossesse",
      "es": "Preparación nutricional antes del embarazo",
      "tr": "Hamilelik öncesi beslenme hazırlığı",
      "pt": "Preparação nutricional antes da gravidez"
    },
    "order": 2
  },
  {
    "id": "planning-04",
    "slug": "sleep-and-fertility",
    "sectionKey": "planning",
    "type": "research",
    "image": "planningNutritionImage",
    "readTime": 4,
    "tags": [
      "sleep",
      "fertility",
      "routine"
    ],
    "relatedToolIds": [
      "wellness-diary",
      "cycle-tracker",
      "preconception-checkup"
    ],
    "relatedArticleIds": [
      "daily-routine-discovery",
      "cycle-quality-signals"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 83,
    "titles": {
      "ar": "النوم ودوره في الخصوبة",
      "en": "Sleep and fertility balance",
      "de": "Schlaf und Fruchtbarkeit im Gleichgewicht",
      "fr": "Sommeil et équilibre de fertilité",
      "es": "Sueño y equilibrio de la fertilidad",
      "tr": "Uyku ve doğurganlık dengesi",
      "pt": "Sono e equilíbrio da fertilidade"
    },
    "order": 3
  },
  {
    "id": "planning-05",
    "slug": "when-to-use-cycle-tracking",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningCycleImage",
    "readTime": 3,
    "tags": [
      "tracking",
      "cycle-awareness",
      "planning"
    ],
    "relatedToolIds": [
      "cycle-tracker",
      "fertility-academy",
      "preconception-checkup"
    ],
    "relatedArticleIds": [
      "fertility-window-guide",
      "decision-from-tracking-to-plan"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 79,
    "titles": {
      "ar": "متى يفيد تتبع الدورة فعلاً؟",
      "en": "When cycle tracking helps most",
      "de": "Wann Zyklustracking am meisten hilft",
      "fr": "Quand le suivi du cycle aide le plus",
      "es": "Cuándo ayuda más seguir el ciclo",
      "tr": "Döngü takibi en çok ne zaman fayda sağlar",
      "pt": "Quando o acompanhamento do ciclo ajuda mais"
    },
    "order": 4
  },
  {
    "id": "planning-06",
    "slug": "ovulation-practical-guide",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningCycleImage",
    "readTime": 4,
    "tags": [
      "ovulation",
      "timing",
      "planning"
    ],
    "relatedToolIds": [
      "cycle-tracker",
      "fertility-academy",
      "due-date-calculator"
    ],
    "relatedArticleIds": [
      "fertility-window-guide",
      "common-trying-to-conceive-mistakes"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 88,
    "titles": {
      "ar": "فهم الإباضة بشكل عملي",
      "en": "A practical guide to ovulation",
      "de": "Ovulation praktisch verstehen",
      "fr": "Comprendre l’ovulation de façon pratique",
      "es": "Entender la ovulación de forma práctica",
      "tr": "Yumurtlamayı pratik şekilde anlamak",
      "pt": "Entender a ovulação de forma prática"
    },
    "order": 5
  },
  {
    "id": "planning-07",
    "slug": "emotional-planning-before-pregnancy",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningCycleImage",
    "readTime": 4,
    "tags": [
      "mindset",
      "planning",
      "support"
    ],
    "relatedToolIds": [
      "pregnancy-assistant",
      "preconception-checkup",
      "wellness-diary"
    ],
    "relatedArticleIds": [
      "daily-routine-discovery",
      "decision-from-tracking-to-plan"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 75,
    "titles": {
      "ar": "الاستعداد النفسي قبل الحمل",
      "en": "Emotional planning before pregnancy",
      "de": "Mentale Vorbereitung vor der Schwangerschaft",
      "fr": "Préparation émotionnelle avant la grossesse",
      "es": "Preparación emocional antes del embarazo",
      "tr": "Hamilelik öncesi duygusal hazırlık",
      "pt": "Planejamento emocional antes da gravidez"
    },
    "order": 6
  },
  {
    "id": "planning-08",
    "slug": "common-trying-to-conceive-mistakes",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningNutritionImage",
    "readTime": 5,
    "tags": [
      "mistakes",
      "planning",
      "fertility"
    ],
    "relatedToolIds": [
      "fertility-academy",
      "preconception-checkup",
      "cycle-tracker"
    ],
    "relatedArticleIds": [
      "ovulation-practical-guide",
      "fertility-window-guide"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 81,
    "titles": {
      "ar": "أخطاء شائعة عند محاولة الحمل",
      "en": "Common mistakes while trying to conceive",
      "de": "Häufige Fehler beim Kinderwunsch",
      "fr": "Erreurs fréquentes quand on essaie de concevoir",
      "es": "Errores comunes al intentar concebir",
      "tr": "Hamile kalmaya çalışırken yapılan yaygın hatalar",
      "pt": "Erros comuns ao tentar engravidar"
    },
    "order": 7
  },
  {
    "id": "planning-09",
    "slug": "daily-routine-discovery",
    "sectionKey": "planning",
    "type": "discovery",
    "image": "planningNutritionImage",
    "readTime": 3,
    "tags": [
      "routine",
      "sleep",
      "readiness"
    ],
    "relatedToolIds": [
      "wellness-diary",
      "cycle-tracker",
      "smart-pregnancy-plan"
    ],
    "relatedArticleIds": [
      "sleep-and-fertility",
      "emotional-planning-before-pregnancy"
    ],
    "featuredInSection": false,
    "featuredGlobal": true,
    "popularityWeight": 86,
    "titles": {
      "ar": "اكتشاف: الروتين اليومي يصنع فرقاً",
      "en": "Discovery: daily routine matters more",
      "de": "Entdeckung: Die tägliche Routine zählt",
      "fr": "Découverte : la routine quotidienne compte",
      "es": "Descubrimiento: la rutina diaria sí importa",
      "tr": "Keşif: günlük rutin gerçekten etkili",
      "pt": "Descoberta: a rotina diária faz diferença"
    },
    "order": 8
  },
  {
    "id": "planning-10",
    "slug": "micronutrients-for-conception",
    "sectionKey": "planning",
    "type": "research",
    "image": "planningNutritionImage",
    "readTime": 5,
    "tags": [
      "nutrition",
      "vitamins",
      "research"
    ],
    "relatedToolIds": [
      "nutrition-supplements",
      "smart-grocery-list",
      "preconception-checkup"
    ],
    "relatedArticleIds": [
      "preconception-nutrition-readiness",
      "daily-routine-discovery"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 77,
    "titles": {
      "ar": "بحث مبسط: المغذيات الدقيقة",
      "en": "Research brief: micronutrients for conception",
      "de": "Kurz erklärt: Mikronährstoffe bei Kinderwunsch",
      "fr": "Recherche simple : micronutriments et conception",
      "es": "Investigación simple: micronutrientes y concepción",
      "tr": "Kısa araştırma: gebe kalma için mikro besinler",
      "pt": "Pesquisa simples: micronutrientes para concepção"
    },
    "order": 9
  },
  {
    "id": "planning-11",
    "slug": "decision-from-tracking-to-plan",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningCycleImage",
    "readTime": 4,
    "tags": [
      "decision-making",
      "tracking",
      "planning"
    ],
    "relatedToolIds": [
      "cycle-tracker",
      "smart-pregnancy-plan",
      "preconception-checkup"
    ],
    "relatedArticleIds": [
      "when-to-use-cycle-tracking",
      "emotional-planning-before-pregnancy"
    ],
    "featuredInSection": true,
    "featuredGlobal": false,
    "popularityWeight": 80,
    "titles": {
      "ar": "متى تنتقلين من التتبع إلى الخطة؟",
      "en": "When to move from tracking to a plan",
      "de": "Wann aus Tracking ein Plan werden sollte",
      "fr": "Quand passer du suivi au vrai plan",
      "es": "Cuándo pasar del seguimiento al plan",
      "tr": "Takipten plana ne zaman geçmeli",
      "pt": "Quando sair do acompanhamento para um plano"
    },
    "order": 10
  },
  {
    "id": "pregnant-01",
    "slug": "pregnancy-week-by-week-guide",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyWeeklyImage",
    "readTime": 5,
    "tags": [
      "weekly-guide",
      "growth",
      "planning"
    ],
    "relatedToolIds": [
      "weekly-summary",
      "fetal-growth",
      "pregnancy-assistant"
    ],
    "relatedArticleIds": [
      "body-changes-during-pregnancy",
      "daily-movement-during-pregnancy"
    ],
    "featuredInSection": true,
    "featuredGlobal": true,
    "popularityWeight": 99,
    "titles": {
      "ar": "دليلكِ أسبوعاً بأسبوع",
      "en": "Your week-by-week pregnancy guide",
      "de": "Dein Schwangerschaftsleitfaden Woche für Woche",
      "fr": "Ton guide grossesse semaine après semaine",
      "es": "Tu guía de embarazo semana a semana",
      "tr": "Hafta hafta gebelik rehberin",
      "pt": "Seu guia de gravidez semana a semana"
    },
    "order": 11
  },
  {
    "id": "pregnant-02",
    "slug": "body-changes-during-pregnancy",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyWeeklyImage",
    "readTime": 4,
    "tags": [
      "body-changes",
      "comfort",
      "weekly-guide"
    ],
    "relatedToolIds": [
      "pregnancy-comfort",
      "weekly-summary",
      "wellness-diary"
    ],
    "relatedArticleIds": [
      "pregnancy-week-by-week-guide",
      "sleep-during-pregnancy"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 90,
    "titles": {
      "ar": "فهم تغيرات الجسم أثناء الحمل",
      "en": "Understanding body changes in pregnancy",
      "de": "Körperveränderungen in der Schwangerschaft verstehen",
      "fr": "Comprendre les changements du corps pendant la grossesse",
      "es": "Entender los cambios del cuerpo en el embarazo",
      "tr": "Gebelikte vücut değişimlerini anlamak",
      "pt": "Entender as mudanças do corpo na gravidez"
    },
    "order": 12
  },
  {
    "id": "pregnant-03",
    "slug": "daily-movement-during-pregnancy",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyWeeklyImage",
    "readTime": 4,
    "tags": [
      "movement",
      "fitness",
      "energy"
    ],
    "relatedToolIds": [
      "ai-fitness-coach",
      "wellness-diary",
      "smart-pregnancy-plan"
    ],
    "relatedArticleIds": [
      "light-activity-research",
      "sleep-during-pregnancy"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 82,
    "titles": {
      "ar": "الحركة اليومية للحامل",
      "en": "Daily movement during pregnancy",
      "de": "Tägliche Bewegung in der Schwangerschaft",
      "fr": "Le mouvement au quotidien pendant la grossesse",
      "es": "Movimiento diario durante el embarazo",
      "tr": "Gebelikte günlük hareket",
      "pt": "Movimento diário durante a gravidez"
    },
    "order": 13
  },
  {
    "id": "pregnant-04",
    "slug": "sleep-during-pregnancy",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyWeeklyImage",
    "readTime": 4,
    "tags": [
      "sleep",
      "comfort",
      "routine"
    ],
    "relatedToolIds": [
      "pregnancy-comfort",
      "wellness-diary",
      "weekly-summary"
    ],
    "relatedArticleIds": [
      "sleep-wellbeing-discovery",
      "body-changes-during-pregnancy"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 87,
    "titles": {
      "ar": "النوم أثناء الحمل",
      "en": "Sleeping better during pregnancy",
      "de": "Besser schlafen in der Schwangerschaft",
      "fr": "Mieux dormir pendant la grossesse",
      "es": "Dormir mejor durante el embarazo",
      "tr": "Gebelikte daha iyi uyumak",
      "pt": "Dormir melhor durante a gravidez"
    },
    "order": 14
  },
  {
    "id": "pregnant-05",
    "slug": "smart-pregnancy-nutrition",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "planningNutritionImage",
    "readTime": 4,
    "tags": [
      "nutrition",
      "energy",
      "routine"
    ],
    "relatedToolIds": [
      "ai-meal-suggestion",
      "smart-grocery-list",
      "vitamin-tracker"
    ],
    "relatedArticleIds": [
      "weight-gain-with-balance",
      "light-activity-research"
    ],
    "featuredInSection": false,
    "featuredGlobal": true,
    "popularityWeight": 89,
    "titles": {
      "ar": "التغذية الذكية خلال الحمل",
      "en": "Smart nutrition during pregnancy",
      "de": "Smarte Ernährung in der Schwangerschaft",
      "fr": "Nutrition intelligente pendant la grossesse",
      "es": "Nutrición inteligente durante el embarazo",
      "tr": "Gebelikte akıllı beslenme",
      "pt": "Nutrição inteligente durante a gravidez"
    },
    "order": 15
  },
  {
    "id": "pregnant-06",
    "slug": "weight-gain-with-balance",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "planningNutritionImage",
    "readTime": 4,
    "tags": [
      "weight",
      "nutrition",
      "tracking"
    ],
    "relatedToolIds": [
      "weight-gain",
      "ai-meal-suggestion",
      "weekly-summary"
    ],
    "relatedArticleIds": [
      "smart-pregnancy-nutrition",
      "light-activity-research"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 84,
    "titles": {
      "ar": "زيادة الوزن بتوازن",
      "en": "Balanced weight gain through pregnancy",
      "de": "Ausgewogene Gewichtszunahme in der Schwangerschaft",
      "fr": "Une prise de poids équilibrée pendant la grossesse",
      "es": "Aumento de peso equilibrado en el embarazo",
      "tr": "Gebelikte dengeli kilo artışı",
      "pt": "Ganho de peso equilibrado na gravidez"
    },
    "order": 16
  },
  {
    "id": "pregnant-07",
    "slug": "physical-comfort-routines",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyWeeklyImage",
    "readTime": 3,
    "tags": [
      "comfort",
      "rest",
      "movement"
    ],
    "relatedToolIds": [
      "pregnancy-comfort",
      "ai-fitness-coach",
      "wellness-diary"
    ],
    "relatedArticleIds": [
      "body-changes-during-pregnancy",
      "sleep-during-pregnancy"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 78,
    "titles": {
      "ar": "روتين الراحة الجسدية",
      "en": "Physical comfort routines that help",
      "de": "Routinen für mehr körperliches Wohlbefinden",
      "fr": "Des routines pour plus de confort physique",
      "es": "Rutinas que aportan comodidad física",
      "tr": "Fiziksel rahatlık sağlayan rutinler",
      "pt": "Rotinas que melhoram o conforto físico"
    },
    "order": 17
  },
  {
    "id": "pregnant-08",
    "slug": "birth-preparation-checklist",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyBirthImage",
    "readTime": 5,
    "tags": [
      "birth-prep",
      "planning",
      "hospital-bag"
    ],
    "relatedToolIds": [
      "ai-hospital-bag",
      "ai-birth-plan",
      "smart-appointment-reminder"
    ],
    "relatedArticleIds": [
      "hospital-bag-essentials",
      "birth-plan-that-feels-real"
    ],
    "featuredInSection": true,
    "featuredGlobal": true,
    "popularityWeight": 93,
    "titles": {
      "ar": "تجهيز الولادة بثقة",
      "en": "Birth preparation with more confidence",
      "de": "Geburtsvorbereitung mit mehr Sicherheit",
      "fr": "Préparer l’accouchement avec confiance",
      "es": "Prepararte para el parto con confianza",
      "tr": "Doğuma güvenle hazırlanmak",
      "pt": "Preparar o parto com mais confiança"
    },
    "order": 18
  },
  {
    "id": "pregnant-09",
    "slug": "hospital-bag-essentials",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyBirthImage",
    "readTime": 3,
    "tags": [
      "hospital-bag",
      "essentials",
      "birth-prep"
    ],
    "relatedToolIds": [
      "ai-hospital-bag",
      "baby-gear-recommender",
      "smart-appointment-reminder"
    ],
    "relatedArticleIds": [
      "birth-preparation-checklist",
      "birth-plan-that-feels-real"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 88,
    "titles": {
      "ar": "ماذا تضعين في حقيبة المستشفى؟",
      "en": "Hospital bag essentials that matter",
      "de": "Was wirklich in die Kliniktasche gehört",
      "fr": "Les essentiels du sac pour la maternité",
      "es": "Lo esencial para la bolsa del hospital",
      "tr": "Hastane çantasında gerçekten gerekli olanlar",
      "pt": "O essencial para a mala da maternidade"
    },
    "order": 19
  },
  {
    "id": "pregnant-10",
    "slug": "birth-plan-that-feels-real",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyBirthImage",
    "readTime": 4,
    "tags": [
      "birth-plan",
      "planning",
      "support"
    ],
    "relatedToolIds": [
      "ai-birth-plan",
      "ai-partner-guide",
      "ai-hospital-bag"
    ],
    "relatedArticleIds": [
      "birth-preparation-checklist",
      "partner-support-before-birth"
    ],
    "featuredInSection": true,
    "featuredGlobal": false,
    "popularityWeight": 91,
    "titles": {
      "ar": "خطة ولادة واقعية ومرنة",
      "en": "A birth plan that feels realistic",
      "de": "Ein Geburtsplan, der realistisch bleibt",
      "fr": "Un projet de naissance réaliste et souple",
      "es": "Un plan de parto realista y flexible",
      "tr": "Gerçekçi ve esnek bir doğum planı",
      "pt": "Um plano de parto realista e flexível"
    },
    "order": 20
  },
  {
    "id": "pregnant-11",
    "slug": "baby-movements-explained",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyKicksImage",
    "readTime": 4,
    "tags": [
      "baby-movements",
      "tracking",
      "awareness"
    ],
    "relatedToolIds": [
      "kick-counter",
      "weekly-summary",
      "pregnancy-assistant"
    ],
    "relatedArticleIds": [
      "movement-patterns-that-feel-reassuring",
      "pregnancy-week-by-week-guide"
    ],
    "featuredInSection": false,
    "featuredGlobal": true,
    "popularityWeight": 90,
    "titles": {
      "ar": "فهم ركلات الطفل",
      "en": "Understanding baby movements",
      "de": "Kindsbewegungen besser verstehen",
      "fr": "Mieux comprendre les mouvements du bébé",
      "es": "Entender los movimientos del bebé",
      "tr": "Bebeğin hareketlerini anlamak",
      "pt": "Entender os movimentos do bebê"
    },
    "order": 21
  },
  {
    "id": "pregnant-12",
    "slug": "contraction-timer-confidence",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyBirthImage",
    "readTime": 3,
    "tags": [
      "contractions",
      "timing",
      "birth-prep"
    ],
    "relatedToolIds": [
      "contraction-timer",
      "ai-birth-plan",
      "smart-appointment-reminder"
    ],
    "relatedArticleIds": [
      "birth-preparation-checklist",
      "signs-that-deserve-attention"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 83,
    "titles": {
      "ar": "متى يفيدكِ مؤقت الانقباضات؟",
      "en": "When a contraction timer helps",
      "de": "Wann ein Wehen-Timer wirklich hilft",
      "fr": "Quand le minuteur de contractions aide vraiment",
      "es": "Cuándo ayuda un temporizador de contracciones",
      "tr": "Kasılma sayacı ne zaman işe yarar",
      "pt": "Quando o contador de contrações ajuda"
    },
    "order": 22
  },
  {
    "id": "pregnant-13",
    "slug": "sleep-wellbeing-discovery",
    "sectionKey": "pregnant",
    "type": "discovery",
    "image": "pregnancyWeeklyImage",
    "readTime": 3,
    "tags": [
      "sleep",
      "wellbeing",
      "discovery"
    ],
    "relatedToolIds": [
      "pregnancy-comfort",
      "wellness-diary",
      "weekly-summary"
    ],
    "relatedArticleIds": [
      "sleep-during-pregnancy",
      "physical-comfort-routines"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 80,
    "titles": {
      "ar": "اكتشاف: النوم يغيّر يومكِ بالكامل",
      "en": "Discovery: sleep shapes your whole day",
      "de": "Entdeckung: Schlaf verändert den ganzen Tag",
      "fr": "Découverte : le sommeil change toute la journée",
      "es": "Descubrimiento: el sueño cambia todo tu día",
      "tr": "Keşif: uyku tüm gününü etkiler",
      "pt": "Descoberta: o sono muda o seu dia inteiro"
    },
    "order": 23
  },
  {
    "id": "pregnant-14",
    "slug": "light-activity-research",
    "sectionKey": "pregnant",
    "type": "research",
    "image": "pregnancyWeeklyImage",
    "readTime": 4,
    "tags": [
      "movement",
      "research",
      "energy"
    ],
    "relatedToolIds": [
      "ai-fitness-coach",
      "weight-gain",
      "wellness-diary"
    ],
    "relatedArticleIds": [
      "daily-movement-during-pregnancy",
      "smart-pregnancy-nutrition"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 76,
    "titles": {
      "ar": "بحث مبسط: النشاط الخفيف مفيد",
      "en": "Research brief: the value of light activity",
      "de": "Kurz erklärt: Warum leichte Aktivität zählt",
      "fr": "Recherche simple : l’intérêt de l’activité légère",
      "es": "Investigación simple: valor de la actividad ligera",
      "tr": "Kısa araştırma: hafif aktivitenin değeri",
      "pt": "Pesquisa simples: o valor da atividade leve"
    },
    "order": 24
  },
  {
    "id": "pregnant-15",
    "slug": "signs-that-deserve-attention",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyBirthImage",
    "readTime": 4,
    "tags": [
      "attention",
      "awareness",
      "support"
    ],
    "relatedToolIds": [
      "pregnancy-assistant",
      "smart-appointment-reminder",
      "maternal-health-awareness"
    ],
    "relatedArticleIds": [
      "contraction-timer-confidence",
      "birth-preparation-checklist"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 85,
    "titles": {
      "ar": "علامات تستحق الانتباه بهدوء",
      "en": "Signs that deserve calm attention",
      "de": "Signale, denen du ruhig Aufmerksamkeit schenken solltest",
      "fr": "Signes à observer avec calme",
      "es": "Señales que merecen atención tranquila",
      "tr": "Sakin şekilde dikkat etmeye değer işaretler",
      "pt": "Sinais que merecem atenção tranquila"
    },
    "order": 25
  },
  {
    "id": "pregnant-16",
    "slug": "partner-support-before-birth",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyBirthImage",
    "readTime": 4,
    "tags": [
      "partner",
      "support",
      "birth-prep"
    ],
    "relatedToolIds": [
      "ai-partner-guide",
      "ai-birth-plan",
      "ai-hospital-bag"
    ],
    "relatedArticleIds": [
      "birth-plan-that-feels-real",
      "birth-preparation-checklist"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 79,
    "titles": {
      "ar": "كيف يقدّم الشريك دعماً فعلياً؟",
      "en": "How a partner can support well",
      "de": "Wie Partner wirklich gut unterstützen können",
      "fr": "Comment le partenaire peut aider concrètement",
      "es": "Cómo puede apoyar mejor la pareja",
      "tr": "Partner nasıl gerçekten iyi destek olur",
      "pt": "Como o parceiro pode apoiar de verdade"
    },
    "order": 26
  },
  {
    "id": "postpartum-01",
    "slug": "early-postpartum-recovery",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumRecoveryImage",
    "readTime": 5,
    "tags": [
      "recovery",
      "rest",
      "routine"
    ],
    "relatedToolIds": [
      "postpartum-recovery",
      "postpartum-mental-health",
      "wellness-diary"
    ],
    "relatedArticleIds": [
      "first-weeks-guide",
      "balance-after-birth"
    ],
    "featuredInSection": true,
    "featuredGlobal": true,
    "popularityWeight": 95,
    "titles": {
      "ar": "التعافي المبكر بعد الولادة",
      "en": "Early postpartum recovery",
      "de": "Frühe Erholung nach der Geburt",
      "fr": "Le rétablissement au début du post-partum",
      "es": "Recuperación temprana en el posparto",
      "tr": "Doğum sonrası erken toparlanma",
      "pt": "Recuperação inicial no pós-parto"
    },
    "order": 27
  },
  {
    "id": "postpartum-02",
    "slug": "feeding-preparation-and-confidence",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumBondingImage",
    "readTime": 4,
    "tags": [
      "feeding",
      "bonding",
      "routine"
    ],
    "relatedToolIds": [
      "ai-lactation-prep",
      "baby-growth",
      "postpartum-recovery"
    ],
    "relatedArticleIds": [
      "feeding-and-bonding-rhythm",
      "first-weeks-guide"
    ],
    "featuredInSection": true,
    "featuredGlobal": false,
    "popularityWeight": 90,
    "titles": {
      "ar": "الرضاعة والاستعداد بثقة",
      "en": "Feeding preparation with confidence",
      "de": "Still- und Fütterungsstart mit Sicherheit",
      "fr": "Bien préparer l’alimentation du bébé",
      "es": "Preparar la alimentación con confianza",
      "tr": "Beslenmeye güvenle hazırlanmak",
      "pt": "Preparar a alimentação com confiança"
    },
    "order": 28
  },
  {
    "id": "postpartum-03",
    "slug": "newborn-sleep-rhythm",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumSleepImage",
    "readTime": 4,
    "tags": [
      "sleep",
      "newborn",
      "routine"
    ],
    "relatedToolIds": [
      "baby-sleep-tracker",
      "baby-cry-translator",
      "diaper-tracker"
    ],
    "relatedArticleIds": [
      "fragmented-sleep-research",
      "routine-and-reassurance-discovery"
    ],
    "featuredInSection": true,
    "featuredGlobal": true,
    "popularityWeight": 94,
    "titles": {
      "ar": "بدايات نوم الطفل",
      "en": "Understanding newborn sleep rhythm",
      "de": "Den Schlafrhythmus des Neugeborenen verstehen",
      "fr": "Comprendre le rythme de sommeil du nouveau-né",
      "es": "Entender el ritmo de sueño del recién nacido",
      "tr": "Yenidoğanın uyku ritmini anlamak",
      "pt": "Entender o ritmo de sono do recém-nascido"
    },
    "order": 29
  },
  {
    "id": "postpartum-04",
    "slug": "why-babies-cry",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumBondingImage",
    "readTime": 3,
    "tags": [
      "crying",
      "patterns",
      "comfort"
    ],
    "relatedToolIds": [
      "baby-cry-translator",
      "baby-sleep-tracker",
      "diaper-tracker"
    ],
    "relatedArticleIds": [
      "newborn-sleep-rhythm",
      "first-day-organization"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 86,
    "titles": {
      "ar": "لماذا يبكي الطفل؟",
      "en": "Why babies cry and what to notice",
      "de": "Warum Babys weinen und was auffällt",
      "fr": "Pourquoi les bébés pleurent et quoi observer",
      "es": "Por qué lloran los bebés y qué notar",
      "tr": "Bebekler neden ağlar ve neye dikkat edilmeli",
      "pt": "Por que os bebês choram e o que observar"
    },
    "order": 30
  },
  {
    "id": "postpartum-05",
    "slug": "baby-growth-tracking-basics",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumBondingImage",
    "readTime": 4,
    "tags": [
      "growth",
      "tracking",
      "feeding"
    ],
    "relatedToolIds": [
      "baby-growth",
      "diaper-tracker",
      "baby-sleep-tracker"
    ],
    "relatedArticleIds": [
      "feeding-preparation-and-confidence",
      "first-weeks-guide"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 82,
    "titles": {
      "ar": "أساسيات تتبع نمو الطفل",
      "en": "Baby growth tracking basics",
      "de": "Grundlagen zum Verfolgen des Babywachstums",
      "fr": "Les bases du suivi de la croissance du bébé",
      "es": "Bases para seguir el crecimiento del bebé",
      "tr": "Bebek gelişimini takip etmenin temelleri",
      "pt": "Noções básicas para acompanhar o crescimento do bebê"
    },
    "order": 31
  },
  {
    "id": "postpartum-06",
    "slug": "first-day-organization",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumRecoveryImage",
    "readTime": 3,
    "tags": [
      "routine",
      "organization",
      "support"
    ],
    "relatedToolIds": [
      "diaper-tracker",
      "baby-sleep-tracker",
      "postpartum-recovery"
    ],
    "relatedArticleIds": [
      "why-babies-cry",
      "balance-after-birth"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 75,
    "titles": {
      "ar": "تنظيم اليوم الأول مع المولود",
      "en": "Organizing the first days with baby",
      "de": "Die ersten Tage mit Baby gut organisieren",
      "fr": "Organiser les premiers jours avec bébé",
      "es": "Organizar los primeros días con el bebé",
      "tr": "Bebekle ilk günleri düzenlemek",
      "pt": "Organizar os primeiros dias com o bebê"
    },
    "order": 32
  },
  {
    "id": "postpartum-07",
    "slug": "balance-after-birth",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumRecoveryImage",
    "readTime": 4,
    "tags": [
      "balance",
      "rest",
      "mindset"
    ],
    "relatedToolIds": [
      "postpartum-mental-health",
      "postpartum-recovery",
      "wellness-diary"
    ],
    "relatedArticleIds": [
      "early-postpartum-recovery",
      "fragmented-sleep-research"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 81,
    "titles": {
      "ar": "استعادة التوازن بعد الولادة",
      "en": "Finding balance after birth",
      "de": "Nach der Geburt wieder ins Gleichgewicht finden",
      "fr": "Retrouver son équilibre après la naissance",
      "es": "Recuperar el equilibrio después del parto",
      "tr": "Doğumdan sonra dengeyi yeniden bulmak",
      "pt": "Recuperar o equilíbrio após o parto"
    },
    "order": 33
  },
  {
    "id": "postpartum-08",
    "slug": "fragmented-sleep-research",
    "sectionKey": "postpartum",
    "type": "research",
    "image": "postpartumSleepImage",
    "readTime": 4,
    "tags": [
      "sleep",
      "research",
      "recovery"
    ],
    "relatedToolIds": [
      "baby-sleep-tracker",
      "postpartum-mental-health",
      "wellness-diary"
    ],
    "relatedArticleIds": [
      "newborn-sleep-rhythm",
      "balance-after-birth"
    ],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 74,
    "titles": {
      "ar": "بحث مبسط: النوم المتقطع",
      "en": "Research brief: fragmented sleep",
      "de": "Kurz erklärt: zerstückelter Schlaf im Alltag",
      "fr": "Recherche simple : le sommeil fractionné",
      "es": "Investigación simple: el sueño fragmentado",
      "tr": "Kısa araştırma: bölünmüş uyku",
      "pt": "Pesquisa simples: sono fragmentado"
    },
    "order": 34
  },
  {
    "id": "postpartum-09",
    "slug": "routine-and-reassurance-discovery",
    "sectionKey": "postpartum",
    "type": "discovery",
    "image": "postpartumSleepImage",
    "readTime": 3,
    "tags": [
      "routine",
      "comfort",
      "discovery"
    ],
    "relatedToolIds": [
      "baby-sleep-tracker",
      "diaper-tracker",
      "baby-cry-translator"
    ],
    "relatedArticleIds": [
      "newborn-sleep-rhythm",
      "why-babies-cry"
    ],
    "featuredInSection": false,
    "featuredGlobal": true,
    "popularityWeight": 88,
    "titles": {
      "ar": "اكتشاف: الروتين يصنع طمأنينة",
      "en": "Discovery: routine builds reassurance",
      "de": "Entdeckung: Routine schafft Sicherheit",
      "fr": "Découverte : la routine apporte de l’apaisement",
      "es": "Descubrimiento: la rutina crea calma",
      "tr": "Keşif: rutin güven hissi oluşturur",
      "pt": "Descoberta: a rotina traz tranquilidade"
    },
    "order": 35
  },
  {
    "id": "postpartum-10",
    "slug": "first-weeks-guide",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumBondingImage",
    "readTime": 5,
    "tags": [
      "first-weeks",
      "support",
      "feeding"
    ],
    "relatedToolIds": [
      "postpartum-recovery",
      "ai-lactation-prep",
      "baby-growth"
    ],
    "relatedArticleIds": [
      "early-postpartum-recovery",
      "feeding-preparation-and-confidence"
    ],
    "featuredInSection": true,
    "featuredGlobal": false,
    "popularityWeight": 89,
    "titles": {
      "ar": "دليل الأسابيع الأولى",
      "en": "A guide for the first weeks",
      "de": "Ein Leitfaden für die ersten Wochen",
      "fr": "Guide des premières semaines",
      "es": "Guía para las primeras semanas",
      "tr": "İlk haftalar için rehber",
      "pt": "Guia para as primeiras semanas"
    },
    "order": 36
  },
  {
    "id": "planning-12",
    "slug": "modern-fertility-foundations",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningCycleImage",
    "readTime": 5,
    "tags": ["fertility", "readiness", "planning"],
    "relatedToolIds": ["fertility-academy", "preconception-checkup", "cycle-tracker"],
    "relatedArticleIds": ["fertility-window-guide", "preconception-nutrition-readiness"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 86,
    "titles": {
      "ar": "أساسيات الخصوبة الحديثة",
      "en": "Modern fertility foundations",
      "de": "Moderne Grundlagen der Fruchtbarkeit",
      "fr": "Les bases modernes de la fertilité",
      "es": "Bases modernas de la fertilidad",
      "tr": "Modern doğurganlık temelleri",
      "pt": "Bases modernas da fertilidade"
    },
    "order": 37
  },
  {
    "id": "planning-13",
    "slug": "partner-collaboration-conception",
    "sectionKey": "planning",
    "type": "article",
    "image": "planningCycleImage",
    "readTime": 5,
    "tags": ["partner", "support", "planning"],
    "relatedToolIds": ["preconception-checkup", "fertility-academy", "wellness-diary"],
    "relatedArticleIds": ["emotional-planning-before-pregnancy", "fertility-window-guide"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 81,
    "titles": {
      "ar": "تعاون الشريك في رحلة الإنجاب",
      "en": "Partner collaboration on the path to conception",
      "de": "Partnerschaft auf dem Weg zur Empfängnis",
      "fr": "La collaboration du partenaire vers la conception",
      "es": "La colaboración de la pareja hacia la concepción",
      "tr": "Gebelik yolunda eş iş birliği",
      "pt": "Colaboração do parceiro no caminho para a concepção"
    },
    "order": 38
  },
  {
    "id": "planning-14",
    "slug": "preconception-stress-reduction",
    "sectionKey": "planning",
    "type": "discovery",
    "image": "planningNutritionImage",
    "readTime": 4,
    "tags": ["mindset", "wellbeing", "readiness"],
    "relatedToolIds": ["wellness-diary", "fertility-academy", "preconception-checkup"],
    "relatedArticleIds": ["emotional-planning-before-pregnancy", "sleep-and-fertility"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 78,
    "titles": {
      "ar": "تخفيف التوتر قبل الحمل",
      "en": "Reducing stress before pregnancy",
      "de": "Stress vor der Schwangerschaft reduzieren",
      "fr": "Réduire le stress avant la grossesse",
      "es": "Reducir el estrés antes del embarazo",
      "tr": "Hamilelik öncesi stresi azaltmak",
      "pt": "Reduzir o estresse antes da gravidez"
    },
    "order": 39
  },
  {
    "id": "pregnant-17",
    "slug": "trimester-transitions-explained",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyWeeklyImage",
    "readTime": 6,
    "tags": ["weekly-guide", "body-changes", "awareness"],
    "relatedToolIds": ["pregnancy-week-tracker", "due-date-calculator", "weekly-summary"],
    "relatedArticleIds": ["pregnancy-week-by-week-guide", "body-changes-during-pregnancy"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 87,
    "titles": {
      "ar": "انتقالات الثلث بوضوح",
      "en": "Trimester transitions explained",
      "de": "Übergänge zwischen den Trimestern erklärt",
      "fr": "Les transitions entre trimestres expliquées",
      "es": "Las transiciones entre trimestres explicadas",
      "tr": "Trimester geçişleri açıklanıyor",
      "pt": "Transições entre trimestres explicadas"
    },
    "order": 40
  },
  {
    "id": "pregnant-18",
    "slug": "managing-pregnancy-fatigue",
    "sectionKey": "pregnant",
    "type": "article",
    "image": "pregnancyWeeklyImage",
    "readTime": 5,
    "tags": ["energy", "rest", "wellbeing"],
    "relatedToolIds": ["wellness-diary", "pregnancy-week-tracker", "sleep-during-pregnancy"],
    "relatedArticleIds": ["sleep-during-pregnancy", "body-changes-during-pregnancy"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 84,
    "titles": {
      "ar": "إدارة إرهاق الحمل",
      "en": "Managing pregnancy fatigue",
      "de": "Mit Schwangerschaftsmüdigkeit umgehen",
      "fr": "Gérer la fatigue de grossesse",
      "es": "Manejar la fatiga del embarazo",
      "tr": "Hamilelik yorgunluğuyla baş etmek",
      "pt": "Gerir o cansaço da gravidez"
    },
    "order": 41
  },
  {
    "id": "pregnant-19",
    "slug": "hydration-during-pregnancy",
    "sectionKey": "pregnant",
    "type": "discovery",
    "image": "pregnancyWeeklyImage",
    "readTime": 4,
    "tags": ["nutrition", "wellbeing", "routine"],
    "relatedToolIds": ["smart-grocery-list", "nutrition-supplements", "wellness-diary"],
    "relatedArticleIds": ["smart-pregnancy-nutrition", "weight-gain-with-balance"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 80,
    "titles": {
      "ar": "الترطيب أثناء الحمل",
      "en": "Hydration during pregnancy",
      "de": "Hydration in der Schwangerschaft",
      "fr": "L’hydratation pendant la grossesse",
      "es": "La hidratación durante el embarazo",
      "tr": "Hamilelikte sıvı dengesi",
      "pt": "A hidratação durante a gravidez"
    },
    "order": 42
  },
  {
    "id": "postpartum-11",
    "slug": "postpartum-mood-awareness",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumRecoveryImage",
    "readTime": 6,
    "tags": ["wellbeing", "awareness", "recovery"],
    "relatedToolIds": ["postpartum-recovery", "wellness-diary", "ai-lactation-prep"],
    "relatedArticleIds": ["early-postpartum-recovery", "balance-after-birth"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 88,
    "titles": {
      "ar": "وعي المزاج بعد الولادة",
      "en": "Postpartum mood awareness",
      "de": "Stimmungsbewusstsein nach der Geburt",
      "fr": "Conscience de l’humeur post-partum",
      "es": "Conciencia del ánimo posparto",
      "tr": "Doğum sonrası ruh hali farkındalığı",
      "pt": "Consciência do humor pós-parto"
    },
    "order": 43
  },
  {
    "id": "postpartum-12",
    "slug": "breastfeeding-vs-bottle-decision",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumBondingImage",
    "readTime": 6,
    "tags": ["feeding", "decision-making", "newborn"],
    "relatedToolIds": ["ai-lactation-prep", "baby-growth", "postpartum-recovery"],
    "relatedArticleIds": ["feeding-preparation-and-confidence", "first-weeks-guide"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 85,
    "titles": {
      "ar": "قرار الرضاعة الطبيعية أو الصناعية",
      "en": "Breastfeeding vs bottle: making the decision",
      "de": "Stillen oder Flasche: die Entscheidung treffen",
      "fr": "Allaitement ou biberon : faire le choix",
      "es": "Lactancia o biberón: tomar la decisión",
      "tr": "Anne sütü mü biberon mu: kararı vermek",
      "pt": "Amamentar ou mamadeira: tomar a decisão"
    },
    "order": 44
  },
  {
    "id": "postpartum-13",
    "slug": "returning-to-movement-postpartum",
    "sectionKey": "postpartum",
    "type": "article",
    "image": "postpartumRecoveryImage",
    "readTime": 5,
    "tags": ["movement", "recovery", "fitness"],
    "relatedToolIds": ["postpartum-recovery", "wellness-diary", "baby-growth"],
    "relatedArticleIds": ["early-postpartum-recovery", "balance-after-birth"],
    "featuredInSection": false,
    "featuredGlobal": false,
    "popularityWeight": 82,
    "titles": {
      "ar": "العودة إلى الحركة بعد الولادة",
      "en": "Returning to movement after birth",
      "de": "Nach der Geburt zur Bewegung zurückkehren",
      "fr": "Revenir au mouvement après l’accouchement",
      "es": "Volver al movimiento después del parto",
      "tr": "Doğumdan sonra harekete dönüş",
      "pt": "Voltar ao movimento após o parto"
    },
    "order": 45
  }
] as ArticleSeed[];

const resolveLang = (lang?: string): SupportedArticleLanguage => {
  const base = (lang || "en").split("-")[0] as SupportedArticleLanguage;
  return SUPPORTED_LANGUAGES.includes(base) ? base : "en";
};

const getLocalized = (map: LocalizedMap, lang: SupportedArticleLanguage) => map[lang] || map.en;

const formatReadTime = (minutes: number, lang: SupportedArticleLanguage) => {
  const labels: Record<SupportedArticleLanguage, string> = {
    ar: `${minutes} دقائق`,
    en: `${minutes} min read`,
    de: `${minutes} Min.`,
    fr: `${minutes} min`,
    es: `${minutes} min`,
    tr: `${minutes} dk`,
    pt: `${minutes} min`,
  };
  return labels[lang];
};

const formatDateLabel = (isoDate: string, lang: SupportedArticleLanguage) => {
  const localeMap: Record<SupportedArticleLanguage, string> = {
    ar: "ar-EG",
    en: "en-US",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    tr: "tr-TR",
    pt: "pt-PT",
  };

  return new Intl.DateTimeFormat(localeMap[lang], {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
};

const createPublishedAt = (order: number) => {
  const waveIndex = Math.floor(order / 2);
  return new Date(ARTICLE_RELEASE_START + waveIndex * TWO_WEEKS_IN_MS).toISOString();
};

const createUpdatedAt = (publishedAt: string) => new Date(new Date(publishedAt).getTime() + 7 * DAY_IN_MS).toISOString();

const interpolate = (template: string, values: Record<string, string>) =>
  template.replace(/{{(.*?)}}/g, (_, key) => values[key.trim()] ?? "");

const getTagLabels = (tags: ArticleTag[], lang: SupportedArticleLanguage) => tags.map((tag) => getLocalized(tagLabels[tag], lang));

const joinTagList = (tags: string[], lang: SupportedArticleLanguage) => {
  if (!tags.length) return "";
  const separatorMap: Record<SupportedArticleLanguage, string> = {
    ar: "، ",
    en: ", ",
    de: ", ",
    fr: ", ",
    es: ", ",
    tr: ", ",
    pt: ", ",
  };
  return tags.join(separatorMap[lang]);
};

const arabicTagGuidance: Record<ArticleTag, { focus: string; action: string; caution: string }> = {
  fertility: {
    focus: "المقصود بالخصوبة هنا هو معرفة الأيام الأعلى احتمالاً للحمل بدل الاعتماد على التخمين العام.",
    action: "راقبي انتظام الدورة، واربطي أيام الجماع بالأيام القريبة من الإباضة لا بكل أيام الشهر.",
    caution: "لا تبني قرارك على تطبيق واحد أو إحساس عابر من دون ملاحظة نمط دورتك لعدة أشهر.",
  },
  timing: {
    focus: "التوقيت الجيد يعني اختيار نافذة قصيرة فعالة، لا تكرار المحاولة بلا خطة.",
    action: "ابدئي قبل الإباضة بيومين إلى ثلاثة وواصلي بهدوء حتى يوم الإباضة المتوقع.",
    caution: "المبالغة في تتبع التوقيت قد تزيد الضغط النفسي من دون فائدة إذا لم يكن هناك انتظام أساسي بالدورة.",
  },
  "cycle-awareness": {
    focus: "وعي الدورة يساعدك على فهم طولها، توقيت الإباضة، وما إذا كانت الإشارات الشهرية مستقرة أم لا.",
    action: "سجلي أول يوم نزف، طول الدورة، وأي تغير ثابت في الأعراض أو الإفرازات.",
    caution: "إهمال الفروق الواضحة بين دورة وأخرى قد يؤخر ملاحظة مشكلة تستحق المتابعة.",
  },
  patterns: {
    focus: "الأنماط أهم من الملاحظات المنفصلة؛ ما يتكرر شهرياً له قيمة أكبر من عرض حدث مرة واحدة.",
    action: "ابحثي عن التكرار في مدة الدورة، شدة الألم، شكل النزف، وتغير الطاقة أو النوم.",
    caution: "لا تعتبري كل اختلاف بسيط علامة مشكلة ما لم يكن متكرراً أو متصاعداً.",
  },
  readiness: {
    focus: "الجاهزية قبل الحمل تعني تهيئة الجسم والروتين، لا انتظار لحظة مثالية بالكامل.",
    action: "ابدئي بتثبيت النوم، الغذاء الأساسي، ومراجعة الفيتامينات والعادات اليومية قبل محاولة الحمل.",
    caution: "تأجيل كل شيء حتى تشعري بالكمال الكامل يجعل الاستعداد أطول وأثقل من اللازم.",
  },
  nutrition: {
    focus: "التغذية هنا مرتبطة بجودة الروتين اليومي، وليست قائمة مثالية يصعب الالتزام بها.",
    action: "ركزي على البروتين، الخضار، الماء، ووجبات ثابتة تقلل الفوضى الغذائية خلال اليوم.",
    caution: "لا تعتمدي على المكملات وحدها إذا كان الأكل نفسه ضعيفاً أو غير منتظم.",
  },
  vitamins: {
    focus: "الفيتامينات الداعمة قبل الحمل أو خلاله تفيد عندما تؤخذ بانتظام ووفق الحاجة الفعلية.",
    action: "راجعي حمض الفوليك، الحديد، فيتامين د، وأي توصية طبية مرتبطة بنتائجك أو تاريخك الصحي.",
    caution: "الإفراط في المكملات أو جمع عدة منتجات متشابهة ليس بديلاً عن خطة واضحة.",
  },
  sleep: {
    focus: "النوم ليس تفصيلاً جانبياً؛ انتظامه ينعكس على الطاقة، المزاج، والقدرة على الالتزام بأي خطة صحية.",
    action: "استهدفي وقت نوم ثابتاً، وقللي المنبهات والسهر المتكرر خصوصاً قبل منتصف الليل.",
    caution: "تكرار النوم المتقطع أو القصير قد يربك الإحساس بالجوع والطاقة ويضعف الالتزام اليومي.",
  },
  routine: {
    focus: "الروتين الجيد يقلل القرارات الصغيرة المرهقة ويجعل العادات الصحية أسهل في التطبيق.",
    action: "ثبتي مواعيد الاستيقاظ والوجبات والنوم، واجعلي أبسط العادات قابلة للتكرار يومياً.",
    caution: "كثرة التغيير المستمر في الجدول تجعل حتى الخطوات الصحيحة غير مستقرة النتائج.",
  },
  tracking: {
    focus: "التتبع مفيد عندما يجيب عن سؤال واضح، مثل موعد الإباضة أو تغير الوزن أو نمط الأعراض.",
    action: "اختاري مؤشرين أو ثلاثة فقط وسجليها بانتظام بدلاً من تتبع كل شيء دفعة واحدة.",
    caution: "إذا تحول التتبع إلى ضغط يومي أو قراءة متوترة لكل رقم، فراجعي ما تحتاجين تتبعه فعلاً.",
  },
  planning: {
    focus: "التخطيط الجيد يختصر الخطوات ويمنع التردد بين نصائح كثيرة متعارضة.",
    action: "حددي ما ستفعلينه هذا الأسبوع فقط: متابعة، غذاء، موعد، أو تجهيز أساسي واحد.",
    caution: "الخطة الطويلة جداً قد تبدو جميلة لكنها غالباً لا تُنفذ كما هي.",
  },
  ovulation: {
    focus: "الإباضة لا تُفهم من يوم واحد فقط، بل من مجموعة إشارات مثل التوقيت، الإفرازات، واختبارات التبويض.",
    action: "قارني بين طول الدورة، ألم الإباضة إن وجد، وتغير الإفرازات أو شرائط LH إذا كنت تستخدمينها.",
    caution: "لا تفترضي أن الإباضة تقع دائماً في اليوم الرابع عشر؛ هذا ليس صحيحاً لكل النساء.",
  },
  mindset: {
    focus: "الاستعداد النفسي يقلل التوتر المتراكم ويمنحك قدرة أفضل على التعامل مع الانتظار والمتابعة.",
    action: "اتركي مساحة للراحة، واتفقي مع نفسك على حدود القراءة والبحث حتى لا يتحول الموضوع إلى استنزاف.",
    caution: "مراقبة كل عرض وكل نتيجة بشكل مفرط قد يرفع القلق أكثر مما يضيف فائدة.",
  },
  support: {
    focus: "الدعم العملي أهم من الكلام العام؛ المهم من يساعدك في القرار أو الروتين أو التخفيف اليومي.",
    action: "حددي من يمكنه مساعدتك في المواعيد أو المتابعة أو تجهيز ما تحتاجينه الآن.",
    caution: "الاعتماد على التوقعات غير المعلنة يسبب خيبة؛ اطلبي المساعدة بشكل واضح ومحدد.",
  },
  mistakes: {
    focus: "الأخطاء الشائعة غالباً ليست خطيرة، لكنها تضيّع الوقت عندما تتكرر بلا مراجعة.",
    action: "راجعي ما إذا كنت تؤخرين الفحوص، تبالغين في التتبع، أو تعتمدين نصائح غير مناسبة لوضعك.",
    caution: "تكرار الخطأ نفسه مع تغيير أشياء كثيرة في الوقت ذاته يجعل معرفة السبب أصعب.",
  },
  research: {
    focus: "المقصود بالرؤية البحثية هنا تبسيط الفكرة العلمية إلى معنى عملي واضح، لا استعراض المصطلحات.",
    action: "خذي من المعلومة ما يفيد قرارك اليومي: ما الذي تلاحظينه؟ وما الذي يستحق المتابعة؟",
    caution: "لا تحولي كل نتيجة بحثية إلى قاعدة شخصية صارمة من دون النظر لسياقك الصحي.",
  },
  "decision-making": {
    focus: "اتخاذ القرار هنا يعني متى تكتفين بالملاحظة ومتى تنتقلين إلى خطوة أو أداة أو موعد فعلي.",
    action: "حددي قراراً واحداً بعد القراءة: الاستمرار في التتبع، تعديل عادة، أو حجز متابعة.",
    caution: "التردد الطويل بين خيارات كثيرة قد يستهلك وقتاً أكثر من تنفيذ خطوة صغيرة واضحة.",
  },
  "weekly-guide": {
    focus: "الدليل الأسبوعي يفيدك عندما يوضح ما المتوقع هذا الأسبوع دون تهويل أو وعود مبالغ فيها.",
    action: "قارني بين أعراضك العامة، تطور جسمك، وما يحتاج عناية عملية خلال هذا الأسبوع فقط.",
    caution: "لا تقلقي إذا اختلفت التفاصيل الدقيقة عن وصف أسبوعك؛ المهم هو الاتجاه العام لا التطابق الحرفي.",
  },
  growth: {
    focus: "متابعة النمو تعطيك صورة عامة عن التغير التدريجي، لا حكماً يومياً على كل تفصيلة.",
    action: "استخدمي المقارنات الأسبوعية الهادئة بدلاً من التحقق المتكرر خلال اليوم الواحد.",
    caution: "لا تربطي كل اختلاف في الإحساس مباشرة بتوقف النمو أو وجود مشكلة.",
  },
  "body-changes": {
    focus: "تغيرات الجسم في هذه المرحلة طبيعية غالباً، لكن فهمها يساعدك على التفرقة بين المتوقع والمزعج فعلاً.",
    action: "راقبي التغيرات التي تؤثر على النوم، الحركة، أو الراحة وحددي ما الذي يحتاج تخفيفاً عملياً.",
    caution: "إهمال الألم المتكرر أو التورم أو الصداع الشديد ليس مثل تقبل التغيرات الطبيعية البسيطة.",
  },
  comfort: {
    focus: "الراحة لا تعني الكسل، بل تقليل الضغط الجسدي بطريقة تساعدك على الاستمرار بشكل أفضل.",
    action: "عدلي وضعية الجلوس والنوم، واستخدمي وسادة داعمة أو حركة خفيفة تخفف الشد الجسدي.",
    caution: "تحمل الانزعاج طوال اليوم من دون تعديل بسيط للروتين يضاعف الإرهاق عادة.",
  },
  movement: {
    focus: "الحركة المقصودة هنا هي الحركة الآمنة المنتظمة التي تحسن الدورة الدموية والراحة والطاقة.",
    action: "اختاري مشياً خفيفاً أو تمارين بسيطة منتظمة بدل نشاط متقطع ثم توقف طويل.",
    caution: "الإجهاد الزائد أو تجاهل إشارات التعب ليس دليلاً على فاعلية التمرين.",
  },
  fitness: {
    focus: "اللياقة في هذه المرحلة تقاس بالاستمرارية والملاءمة، لا بالشدة العالية أو الإنجاز السريع.",
    action: "اجعلي هدفك الحفاظ على النشاط والمرونة والتنفس الجيد أكثر من حرق السعرات.",
    caution: "المقارنة بخطتك قبل الحمل قد تدفعك لمجهود غير مناسب لمرحلتك الحالية.",
  },
  partner: {
    focus: "وجود الشريك هنا جزء من التنظيم والدعم وتخفيف العبء، وليس حضوراً رمزياً فقط.",
    action: "حددي معه ما المطلوب الآن: متابعة المواعيد، تجهيز الحقيبة، أو دعمك أثناء الانقباضات أو الولادة.",
    caution: "ترك دور الشريك غامضاً حتى اللحظة الأخيرة يزيد الارتباك وقت الحاجة الفعلية.",
  },
  energy: {
    focus: "مستوى الطاقة مؤشر مهم على جودة النوم والغذاء والجهد اليومي، وليس مجرد شعور متقلب.",
    action: "وزعي المهام على ساعات النشاط الأعلى، وخففي ما يمكن تأجيله عندما يهبط النشاط بوضوح.",
    caution: "الاعتماد على الكافيين أو الدفع القسري للجسم لا يعالج سبب انخفاض الطاقة الحقيقي.",
  },
  weight: {
    focus: "متابعة الوزن تعطي اتجاهاً عاماً أفضل من التركيز على تغير يوم أو يومين فقط.",
    action: "راقبي الزيادة على مدى أسابيع مع النظر للطعام، الحركة، والاحتباس الطبيعي للسوائل.",
    caution: "القلق من كل رقم منفصل قد يقود إلى قرارات غذائية متشددة وغير مفيدة.",
  },
  "birth-prep": {
    focus: "الاستعداد للولادة ينجح عندما يتحول إلى تجهيزات واضحة بدل قائمة طويلة مؤجلة.",
    action: "ابدئي بالحقيبة، الخطة، أرقام التواصل، وما تحتاجينه في الأيام الأولى بعد الولادة.",
    caution: "ترك التجهيزات للأسبوع الأخير يزيد الضغط ويجعل التفاصيل الأساسية أسهل للنسيان.",
  },
  "hospital-bag": {
    focus: "حقيبة المستشفى الجيدة تحتوي ما تحتاجينه فعلاً أثناء الإقامة القصيرة، لا كل ما قد يخطر في بالك.",
    action: "قسّمي المحتويات إلى: أوراق، ملابس مريحة، مستلزمات شخصية، واحتياجات الطفل الأساسية.",
    caution: "الحشو الزائد يجعل الوصول إلى المهم أصعب عندما تكونين متعبة أو مستعجلة.",
  },
  essentials: {
    focus: "الأساسيات هي ما يخدم الاستخدام الحقيقي أولاً، لا ما يبدو جميلاً أو شائعاً فقط.",
    action: "اسألي نفسك: هل سأستخدم هذا منذ الأيام الأولى؟ وهل له بديل موجود بالفعل؟",
    caution: "شراء التفاصيل الثانوية مبكراً قد يستهلك الميزانية ويؤخر ما هو أهم.",
  },
  "birth-plan": {
    focus: "خطة الولادة النافعة هي خطة مرنة توضّح تفضيلاتك الأساسية ولا تتجاهل احتمال تغير الظروف.",
    action: "اكتبي رغباتك في الألم، الحركة، المرافق، الرضاعة الأولى، وما تريدين من الفريق معرفته.",
    caution: "تحويل الخطة إلى سيناريو صارم بالكامل قد يزيد الإحباط إذا تغير مسار الولادة طبياً.",
  },
  "baby-movements": {
    focus: "فهم حركات الطفل يعني معرفة نمطك المعتاد، لا عدّاً عشوائياً بلا سياق.",
    action: "اختاري وقتاً هادئاً يومياً لملاحظة الحركة ودوّني أي تغير واضح عن النمط المألوف لديك.",
    caution: "المقارنة مع تجربة شخص آخر أقل فائدة من ملاحظة التغير عن نمط طفلك أنتِ.",
  },
  awareness: {
    focus: "الانتباه الهادئ يساعدك على ملاحظة ما يتغير فعلاً من دون توتر زائد أو تجاهل.",
    action: "ركزي على مؤشر واحد مهم كل مرة بدلاً من مراقبة كل التفاصيل معاً.",
    caution: "إما التهويل لكل عرض أو تجاهله بالكامل كلاهما يضعف جودة القرار.",
  },
  contractions: {
    focus: "الانقباضات تُفهم من انتظامها ومدتها وحدتها، لا من الإحساس بالألم وحده.",
    action: "سجلي بداية كل انقباضة ومدتها والفاصل بينها حتى تعرفي إن كان النمط يتقارب ويثبت.",
    caution: "الاعتماد على الذاكرة وقت الألم يجعل التقييم أقل دقة من استخدام مؤقت بسيط.",
  },
  wellbeing: {
    focus: "الرفاه اليومي يتشكل من النوم والغذاء والحركة والضغط النفسي مجتمعة لا من عامل واحد فقط.",
    action: "اختاري عادة صغيرة مستمرة تدعم يومك كله بدلاً من تغييرات كبيرة لا تدوم.",
    caution: "إهمال الأساسيات أياماً طويلة ثم محاولة التعويض دفعة واحدة نادراً ما ينجح.",
  },
  attention: {
    focus: "بعض الإشارات تستحق انتباهاً أسرع لأنها تخرج عن المعتاد أو تتصاعد بوضوح.",
    action: "قيّمي ما إذا كان العرض جديداً، شديداً، أو متكرراً بطريقة مختلفة عن المعتاد لديك.",
    caution: "عدم التفريق بين أمر مزعج عابر وإشارة متصاعدة قد يؤخر طلب التقييم المناسب.",
  },
  recovery: {
    focus: "التعافي بعد الولادة يحتاج وقتاً وخطة بسيطة تراعي الجسد والطاقة والمجهود اليومي.",
    action: "ركزي على الراحة المتقطعة، التغذية، السوائل، ومراقبة ما إذا كان التحسن يتحرك للأمام أسبوعاً بعد أسبوع.",
    caution: "محاولة العودة السريعة لكل المهام قد تطيل التعب وتؤخر التعافي الحقيقي.",
  },
  rest: {
    focus: "الراحة جزء أساسي من الخطة، خصوصاً عندما يكون النوم ليلاً متقطعاً أو الجهد عالياً.",
    action: "استفيدي من فترات قصيرة للراحة خلال النهار بدل انتظار وقت طويل قد لا يأتي.",
    caution: "الاستمرار في الأداء بنفس الوتيرة رغم قلة النوم يراكم الإرهاق بسرعة.",
  },
  feeding: {
    focus: "التغذية هنا قد تعني تغذية الأم أو تجهيز الرضاعة والطعام المبكر للطفل وفق المرحلة.",
    action: "حضّري الأساسيات مسبقاً واطلبي المساندة العملية في الساعات الأولى المزدحمة.",
    caution: "مقارنة البداية لديك ببدايات الآخرين قد تربكك أكثر مما تفيدك.",
  },
  bonding: {
    focus: "الارتباط مع الطفل يتكون من تكرار لحظات بسيطة ومتواصلة، لا من لحظة مثالية واحدة.",
    action: "استفيدي من اللمس، النظر، الصوت الهادئ، والوجود القريب المتكرر خلال اليوم.",
    caution: "عدم الشعور الفوري بصورة مثالية لا يعني غياب الارتباط أو وجود مشكلة بحد ذاته.",
  },
  newborn: {
    focus: "العناية بالمولود الجديد تصبح أسهل عندما تفهمين الإيقاع العام للنوم، الرضاعة، والبكاء.",
    action: "تابعي الأساسيات أولاً: الرضعات، الحفاضات، والنوم، ثم ابني روتينك حولها.",
    caution: "الإفراط في شراء حلول كثيرة قبل فهم نمط طفلك قد يضيف فوضى أكثر من الراحة.",
  },
  crying: {
    focus: "البكاء رسالة أولية غالباً: جوع، تعب، حاجة للتغيير، أو رغبة في التهدئة والقرب.",
    action: "ابدئي بالاحتياجات الأساسية ثم انتقلي للتهدئة التدريجية وملاحظة ما يتكرر.",
    caution: "القفز لتفسيرات معقدة قبل مراجعة الأسباب البسيطة يستهلك طاقة بلا ضرورة.",
  },
  organization: {
    focus: "التنظيم يقلل الفوضى الذهنية ويختصر وقت البحث عن الأشياء أو القرارات الصغيرة المتكررة.",
    action: "رتبي ما تحتاجينه يومياً في أماكن ثابتة وجهزي المهام المتكررة مسبقاً قدر الإمكان.",
    caution: "ترك كل شيء للحظة الحاجة يزيد الإجهاد خصوصاً مع قلة النوم.",
  },
  balance: {
    focus: "التوازن لا يعني أداء كل شيء بالتساوي، بل معرفة ما يكفي اليوم وما يمكن تأجيله.",
    action: "خففي أولوياتك إلى الضروري والمهم فقط، واسمحي لنفسك بهامش أقل من الكمال.",
    caution: "محاولة الحفاظ على نفس مستوى الإنتاجية القديم بعد الولادة غالباً غير واقعية.",
  },
  "first-weeks": {
    focus: "الأسابيع الأولى تمر أسرع عندما يكون توقعك واقعياً لما يحتاجه جسدك وطفلك في هذه المرحلة.",
    action: "ركزي على الاحتياجات الأساسية، ووزعي المساعدة حول النوم والطعام والزيارات والتنظيم البسيط.",
    caution: "الإرهاق في هذه الفترة طبيعي، لكن تجاهل الاحتياج للمساندة ليس حلاً جيداً.",
  },
  discovery: {
    focus: "زاوية الاكتشاف هنا تبرز فكرة صغيرة لكنها مؤثرة في جودة يومك عندما تطبق بانتظام.",
    action: "جربي الفكرة في يومك مباشرة وراقبي الفرق خلال عدة أيام لا من أول مرة فقط.",
    caution: "إذا كانت الفكرة نافعة فثبتيها ببساطة، ولا تحوليها إلى روتين معقد زائد.",
  },
};

const buildArabicArticleText = (seed: ArticleSeed) => {
  const customContent = getArabicArticleContent(seed.slug);
  if (customContent) {
    return [
      { heading: "", body: customContent.intro },
      ...customContent.sections,
    ];
  }

  return [];
};

const getExcerpt = (seed: ArticleSeed, lang: SupportedArticleLanguage) => {
  const title = getLocalized(seed.titles, lang);
  const section = getLocalized(sectionLabels[seed.sectionKey], lang);
  const tagList = getTagLabels(seed.tags.slice(0, 3), lang).join(" • ");

  if (lang === "ar") {
    const customExcerpt = getArabicArticleExcerpt(seed.slug);
    if (customExcerpt) return customExcerpt;
    return `${title} مقال عملي لمدة ${seed.readTime} دقائق يشرح الموضوع نفسه بوضوح داخل ${section} مع خطوات قابلة للتطبيق فوراً.`;
  }

  const templates: Record<SupportedArticleLanguage, string> = {
    ar: `${title} قراءة مختصرة تساعدكِ على فهم ${section} بطريقة عملية، مع تركيز على ${tagList}.`,
    en: `${title} is a concise, practical read built around ${section.toLowerCase()} with a focus on ${tagList.toLowerCase()}.`,
    de: `${title} ist eine kompakte, praktische Lektüre zu ${section} mit Fokus auf ${tagList}.`,
    fr: `${title} est une lecture courte et pratique autour de ${section.toLowerCase()} avec un accent sur ${tagList.toLowerCase()}.`,
    es: `${title} es una lectura breve y práctica sobre ${section.toLowerCase()} con foco en ${tagList.toLowerCase()}.`,
    tr: `${title}, ${section.toLowerCase()} için ${tagList.toLowerCase()} odağında kısa ve pratik bir okuma sunar.`,
    pt: `${title} é uma leitura breve e prática sobre ${section.toLowerCase()}, com foco em ${tagList.toLowerCase()}.`,
  };

  return templates[lang];
};

const buildSections = (seed: ArticleSeed, lang: SupportedArticleLanguage) => {
  if (lang === "ar") {
    return buildArabicArticleText(seed);
  }

  const title = getLocalized(seed.titles, lang);
  const section = getLocalized(sectionLabels[seed.sectionKey], lang);
  const templates = bodyTemplates[lang][seed.type];
  const copy = uiCopy[lang];
  const localizedTags = getTagLabels(seed.tags.slice(0, 3), lang);
  const tagList = joinTagList(localizedTags, lang);

  const expansions: Record<SupportedArticleLanguage, [string, string, string]> = {
    ar: [
      `عندما تبحثين عن قراءة تستغرق نحو ${seed.readTime} دقائق، فأنتِ غالباً تريدين فهماً سريعاً لكن واضحاً، وليس مجرد سطور تمهيدية. لهذا صيغ هذا الجزء ليضع الفكرة الأساسية أمامكِ مباشرة، ثم يشرح كيف ترتبط بحياتكِ اليومية بدون تعقيد. ${tagList ? `كما يربط الموضوع بمحاور مثل ${tagList} حتى تصبح الصورة مترابطة وليست مجزأة.` : ""}`,
      `الجانب العملي هنا مهم، لأن كثيراً من المقالات تتوقف عند الوصف ولا تنتقل إلى ما يمكن فعله فعلاً. في هذا المقال نحاول تحويل الفكرة إلى سلوك بسيط: ما الذي تلاحظينه أولاً، ما الذي يمكنكِ ترتيبه بهدوء، وكيف تفرّقين بين ما يحتاج انتباهاً الآن وما يمكن تأجيله. ${tagList ? `هذا الربط بين ${tagList} يمنحكِ قراءة أقرب للواقع اليومي.` : ""}`,
      `بعد إنهاء هذا المقال، يفترض أن تكون لديكِ خلاصة قابلة للاستخدام لا مجرد معلومة عابرة. الفكرة ليست أن تقرئي أكثر فقط، بل أن تخرجي بصورة أهدأ، وخطوة أوضح، وقدرة أفضل على الانتقال إلى الأداة المناسبة أو المقال التالي عندما تحتاجين التوسع.`
    ],
    en: [
      `If you are opening a ${seed.readTime}-minute read, you likely want something genuinely useful, not a placeholder summary. This section is written to surface the core idea quickly, then connect it to everyday decisions in a calm and readable way. ${tagList ? `It also ties the topic back to themes like ${tagList} so the article feels coherent rather than fragmented.` : ""}`,
      `The practical angle matters because many short reads stop at description and never help with action. Here, the goal is to translate the idea into something usable: what to notice first, what to organize next, and how to separate what matters now from what can wait a little longer. ${tagList ? `That is where ${tagList} becomes more than labels and starts to feel relevant.` : ""}`,
      `By the end of the article, you should have a clearer takeaway rather than a loose impression. The point is not only to read more, but to leave with a steadier understanding, a lighter next step, and a more natural path into the related tool or follow-up article.`
    ],
    de: [
      `Wenn du einen Text mit etwa ${seed.readTime} Minuten Lesezeit öffnest, erwartest du meist mehr als nur eine kurze Einleitung. Dieser Abschnitt bringt die Hauptidee direkt auf den Punkt und verbindet sie mit alltagsnahen Entscheidungen. ${tagList ? `Themen wie ${tagList} sorgen dabei für einen klaren Zusammenhang.` : ""}`,
      `Der praktische Nutzen ist entscheidend, denn viele kurze Beiträge bleiben rein beschreibend. Hier wird die Idee in konkrete Orientierung übersetzt: worauf du zuerst achten kannst, was du ruhig ordnest und was noch warten darf. ${tagList ? `So wirken auch ${tagList} nicht zufällig, sondern sinnvoll eingebettet.` : ""}`,
      `Am Ende soll nicht nur ein Eindruck bleiben, sondern eine verwendbare Erkenntnis. Du gehst idealerweise mit mehr Klarheit, einem ruhigeren Gefühl und einem logischen nächsten Schritt weiter.`
    ],
    fr: [
      `Quand tu ouvres une lecture d’environ ${seed.readTime} minutes, tu attends en général plus qu’un simple résumé. Cette partie pose donc l’idée centrale rapidement, puis la relie à des choix concrets du quotidien. ${tagList ? `Les thèmes comme ${tagList} renforcent cette cohérence.` : ""}`,
      `L’intérêt pratique compte beaucoup, car de nombreux textes courts restent descriptifs. Ici, l’objectif est de transformer l’idée en repères utilisables: quoi observer d’abord, quoi organiser ensuite, et ce qui peut attendre un peu. ${tagList ? `Ainsi, ${tagList} prend une vraie place dans la lecture.` : ""}`,
      `À la fin, tu dois repartir avec quelque chose de clair et réutilisable, pas avec une impression vague. L’article veut t’aider à lire avec sérénité puis à passer naturellement vers l’outil ou la suite.`
    ],
    es: [
      `Cuando abres una lectura de unos ${seed.readTime} minutos, normalmente esperas algo más que una introducción breve. Por eso esta parte presenta la idea central con claridad y la conecta con decisiones reales del día a día. ${tagList ? `También enlaza temas como ${tagList} para que todo tenga continuidad.` : ""}`,
      `La parte práctica importa porque muchos textos cortos se quedan solo en la descripción. Aquí la intención es convertir la idea en algo útil: qué observar primero, qué ordenar después y qué puede esperar un poco más. ${tagList ? `Así, ${tagList} deja de ser una etiqueta y gana sentido.` : ""}`,
      `Al terminar, la idea es que te quedes con una conclusión clara y aprovechable. No se trata solo de leer más, sino de salir con más calma y con un siguiente paso lógico.`
    ],
    tr: [
      `Yaklaşık ${seed.readTime} dakikalık bir yazı açtığında, çoğu zaman sadece giriş cümleleri değil gerçekten işe yarayan bir içerik beklersin. Bu bölüm ana fikri hızlıca verir ve onu günlük kararlarla ilişkilendirir. ${tagList ? `${tagList} gibi başlıklar da bu bütünlüğü destekler.` : ""}`,
      `Pratik taraf önemlidir; çünkü birçok kısa yazı sadece anlatır ama yön vermez. Burada amaç fikri kullanılabilir hale getirmektir: önce neyi fark edeceğin, sonra neyi düzenleyeceğin ve neyin biraz bekleyebileceği. ${tagList ? `Böylece ${tagList} daha anlamlı hale gelir.` : ""}`,
      `Yazının sonunda akılda dağınık bir izlenim değil, daha net bir sonuç kalmalıdır. Böylece sonraki adıma ya da ilgili araca daha doğal biçimde geçebilirsin.`
    ],
    pt: [
      `Quando você abre uma leitura de cerca de ${seed.readTime} minutos, normalmente espera mais do que um resumo rápido. Esta parte apresenta a ideia central com clareza e a conecta a decisões reais do cotidiano. ${tagList ? `Temas como ${tagList} ajudam a manter essa coerência.` : ""}`,
      `O lado prático importa porque muitos textos curtos param na explicação. Aqui, a proposta é transformar a ideia em algo útil: o que observar primeiro, o que organizar depois e o que pode esperar um pouco mais. ${tagList ? `Assim, ${tagList} deixa de ser apenas rótulo e ganha contexto.` : ""}`,
      `Ao terminar, você deve sair com uma conclusão mais clara e utilizável. O objetivo não é apenas ler mais, mas seguir com mais calma e com um próximo passo natural.`
    ],
  };

  return [
    { heading: copy.whyNow, body: `${interpolate(templates[0], { title, section })}\n\n${expansions[lang][0]}` },
    { heading: copy.practicalView, body: `${interpolate(templates[1], { title, section })}\n\n${expansions[lang][1]}` },
    { heading: copy.nextStep, body: `${interpolate(templates[2], { title, section })}\n\n${expansions[lang][2]}` },
  ];
};

const mapSeedToArticle = (seed: ArticleSeed, lang: SupportedArticleLanguage): ArticleRecord => {
  const publishedAt = createPublishedAt(seed.order);
  const updatedAt = createUpdatedAt(publishedAt);
  const title = getLocalized(seed.titles, lang);
  const sections = buildSections(seed, lang);
  const arabicContent = lang === "ar" ? getArabicArticleContent(seed.slug) : null;
  const resolvedReadTime = arabicContent ? estimateArabicReadTime(arabicContent) : seed.readTime;
  const resolvedImage = articleImageRegistry[seed.image as keyof typeof articleImageRegistry] || sectionFallbackImage[seed.sectionKey];

  return {
    id: seed.id,
    slug: seed.slug,
    sectionKey: seed.sectionKey,
    sectionLabel: getLocalized(sectionLabels[seed.sectionKey], lang),
    type: seed.type,
    typeLabel: getLocalized(typeLabels[seed.type], lang),
    title,
    excerpt: getExcerpt(seed, lang),
    intro: sections[0].body,
    heroAlt: title,
    image: resolvedImage,
    readTime: resolvedReadTime,
    readTimeLabel: formatReadTime(resolvedReadTime, lang),
    tags: seed.tags,
    tagLabels: getTagLabels(seed.tags, lang),
    sections,
    publishedAt,
    updatedAt,
    relatedToolIds: seed.relatedToolIds,
    relatedArticleIds: seed.relatedArticleIds,
    featuredInSection: seed.featuredInSection,
    featuredGlobal: seed.featuredGlobal,
    popularityWeight: seed.popularityWeight,
    order: seed.order,
  };
};

export const articleUiCopy = (lang?: string) => uiCopy[resolveLang(lang)];

export const getVisibleArticleSeeds = (date: Date = new Date()) => {
  const now = date.getTime();
  return articleSeeds.filter((seed) => new Date(createPublishedAt(seed.order)).getTime() <= now);
};

export const getLocalizedArticles = (lang?: string, date: Date = new Date()) => {
  const resolved = resolveLang(lang);
  return getVisibleArticleSeeds(date)
    .map((seed) => mapSeedToArticle(seed, resolved))
    .sort((a, b) => b.popularityWeight - a.popularityWeight || a.order - b.order);
};

export const getLocalizedArticleBySlug = (slug: string, lang?: string, date: Date = new Date()) => {
  const resolved = resolveLang(lang);
  const seed = getVisibleArticleSeeds(date).find((item) => item.slug === slug);
  return seed ? mapSeedToArticle(seed, resolved) : null;
};

// Rotate the featured rail DAILY from the static multilingual catalog
// (no daily AI generation). Same rotation seed applies to all languages so the
// swap cadence is consistent across ar/en/de/fr/es/tr/pt.
const ROTATION_DAYS = 1;
const getDaySeed = (date: Date = new Date()) =>
  Math.floor(
    Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_IN_MS) /
      ROTATION_DAYS,
  );

export const getFeaturedSectionBundle = (sectionKey: ArticleSectionKey, lang?: string, date: Date = new Date()) => {
  const resolved = resolveLang(lang);
  const daySeed = getDaySeed(date);
  const pool = getVisibleArticleSeeds(date)
    .filter((seed) => seed.sectionKey === sectionKey)
    .sort((a, b) => Number(b.featuredInSection) - Number(a.featuredInSection) || b.popularityWeight - a.popularityWeight || a.order - b.order);

  if (pool.length === 0) {
    return { main: null as ArticleRecord | null, secondary: [] as ArticleRecord[] };
  }

  const featuredPool = pool.filter((seed) => seed.featuredInSection);
  const primarySource = featuredPool.length ? featuredPool : pool;
  const mainSeed = primarySource[daySeed % primarySource.length];

  // Rotate the secondary list daily as well, so the whole section refreshes
  // every day (not just the headline).
  const others = pool.filter((seed) => seed.slug !== mainSeed.slug);
  const rotatedSecondary = others.length
    ? others.map((_, index) => others[(index + (daySeed % others.length)) % others.length])
    : [];

  // Prefer related articles for continuity, but fill remaining slots from the
  // rotated pool so each day shows a different combination.
  const relatedSeeds = mainSeed.relatedArticleIds
    .map((slug) => others.find((candidate) => candidate.slug === slug))
    .filter(Boolean) as ArticleSeed[];

  const combined = [...relatedSeeds, ...rotatedSecondary];
  const uniqueSecondary: ArticleSeed[] = [];
  combined.forEach((seed) => {
    if (!uniqueSecondary.find((item) => item.slug === seed.slug)) {
      uniqueSecondary.push(seed);
    }
  });

  return {
    main: mapSeedToArticle(mainSeed, resolved),
    secondary: uniqueSecondary.slice(0, 2).map((seed) => mapSeedToArticle(seed, resolved)),
  };
};

export const getGlobalFeaturedArticles = (lang?: string, maxItems: number = 4, date: Date = new Date()) => {
  const resolved = resolveLang(lang);
  const daySeed = getDaySeed(date);
  const pool = getVisibleArticleSeeds(date)
    .filter((seed) => seed.featuredGlobal)
    .sort((a, b) => b.popularityWeight - a.popularityWeight || a.order - b.order);

  if (pool.length === 0) return [] as ArticleRecord[];

  const rotated = pool.map((_, index) => pool[(index + (daySeed % pool.length)) % pool.length]);
  return rotated.slice(0, maxItems).map((seed) => mapSeedToArticle(seed, resolved));
};

export const getRelatedArticles = (slug: string, lang?: string, maxItems: number = 3, date: Date = new Date()) => {
  const resolved = resolveLang(lang);
  const visible = getVisibleArticleSeeds(date);
  const current = visible.find((seed) => seed.slug === slug);
  if (!current) return [] as ArticleRecord[];

  const relatedSeedPool = [
    ...current.relatedArticleIds.map((relatedSlug) => visible.find((seed) => seed.slug === relatedSlug)).filter(Boolean) as ArticleSeed[],
    ...visible.filter((seed) => seed.sectionKey === current.sectionKey && seed.slug !== slug && !current.relatedArticleIds.includes(seed.slug)),
    ...visible.filter((seed) => seed.slug !== slug && seed.sectionKey !== current.sectionKey),
  ];

  const unique: ArticleSeed[] = [];
  relatedSeedPool.forEach((seed) => {
    if (!unique.find((item) => item.slug === seed.slug) && seed.slug !== slug) {
      unique.push(seed);
    }
  });

  return unique.slice(0, maxItems).map((seed) => mapSeedToArticle(seed, resolved));
};

export const getNextArticle = (slug: string, lang?: string, date: Date = new Date()) => {
  const resolved = resolveLang(lang);
  const visible = getVisibleArticleSeeds(date);
  const current = visible.find((seed) => seed.slug === slug);
  if (!current) return null;

  const nextSeed = current.relatedArticleIds
    .map((relatedSlug) => visible.find((seed) => seed.slug === relatedSlug))
    .find(Boolean)
    || visible
      .filter((seed) => seed.sectionKey === current.sectionKey && seed.slug !== slug)
      .sort((a, b) => Math.abs(a.order - current.order) - Math.abs(b.order - current.order) || b.popularityWeight - a.popularityWeight)[0]
    || visible.find((seed) => seed.slug !== slug)
    || null;

  return nextSeed ? mapSeedToArticle(nextSeed, resolved) : null;
};

export const getSimilarArticles = (slug: string, lang?: string, maxItems: number = 2, date: Date = new Date()) => {
  const resolved = resolveLang(lang);
  const visible = getVisibleArticleSeeds(date);
  const current = visible.find((seed) => seed.slug === slug);
  if (!current) return [] as ArticleRecord[];

  const similarPool = [
    ...current.relatedArticleIds
      .slice(1)
      .map((relatedSlug) => visible.find((seed) => seed.slug === relatedSlug))
      .filter(Boolean) as ArticleSeed[],
    ...visible.filter((seed) => seed.sectionKey === current.sectionKey && seed.slug !== slug && !current.relatedArticleIds.includes(seed.slug)),
    ...visible.filter((seed) => seed.slug !== slug && seed.sectionKey !== current.sectionKey),
  ];

  const unique: ArticleSeed[] = [];
  similarPool.forEach((seed) => {
    if (!unique.find((item) => item.slug === seed.slug) && seed.slug !== slug) {
      unique.push(seed);
    }
  });

  return unique.slice(0, maxItems).map((seed) => mapSeedToArticle(seed, resolved));
};

export const getArticleCountBySection = (date: Date = new Date()) => {
  const visible = getVisibleArticleSeeds(date);
  return {
    planning: visible.filter((item) => item.sectionKey === "planning").length,
    pregnant: visible.filter((item) => item.sectionKey === "pregnant").length,
    postpartum: visible.filter((item) => item.sectionKey === "postpartum").length,
  };
};

export const getRelatedToolRecords = (article: Pick<ArticleRecord, "relatedToolIds">) => article.relatedToolIds.map((id) => getToolById(id)).filter(Boolean);

export const getArticleDateLabel = (isoDate: string, lang?: string) => formatDateLabel(isoDate, resolveLang(lang));

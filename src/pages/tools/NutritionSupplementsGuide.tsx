import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CheckCircle, Apple, Pill, Sparkles, Salad } from "lucide-react";
import { ToolFrame } from "@/components/ToolFrame";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoLibrary } from "@/components/VideoLibrary";
import { nutritionSupplementsVideosByLang } from "@/data/videoData";

const CATEGORY_KEYS = [
  "folateRich", "ironSources", "omega3", "antioxidants",
  "zinc", "vitaminD", "calcium", "protein",
  "hydration", "avoidList",
];

const VITAMIN_KEYS = [
  "folicAcid", "iron", "vitaminD", "omega3DHA",
  "calcium", "iodine", "zinc", "vitaminB12",
  "vitaminC", "vitaminE", "coq10", "probiotics",
];

/* ── Local Design Components ─────────────────────────────────────── */

const NumberBadge = ({ n, gradient }: { n: number; gradient: string }) => (
  <div
    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
    style={{ background: gradient }}
  >
    {n}
  </div>
);

const SectionHeader = ({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <span className="text-xs font-bold text-foreground flex-1">{label}</span>
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{count}</span>
  </div>
);

const ContentBlock = ({ icon: Icon, children, color }: { icon: React.ElementType; children: React.ReactNode; color: string }) => (
  <div className="rounded-xl border border-border/40 bg-gradient-to-br from-background to-muted/30 p-3 flex gap-2.5">
    <div className="w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center" style={{ background: `${color}15` }}>
      <Icon className="w-3 h-3" style={{ color }} />
    </div>
    <p className="whitespace-pre-line text-[13px] font-semibold leading-[1.9] text-foreground flex-1">{children}</p>
  </div>
);

const TipBlock = ({ icon: Icon, children, color, isRTL }: { icon: React.ElementType; children: React.ReactNode; color: string; isRTL: boolean }) => (
  <div
    className={`rounded-xl p-2.5 flex items-start gap-2 ${isRTL ? 'border-r-3' : 'border-l-3'}`}
    style={{ borderColor: color, background: `${color}08` }}
  >
    <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color }} />
    <span className="text-xs font-bold text-foreground leading-relaxed">{children}</span>
  </div>
);

export default function NutritionSupplementsGuide() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const dir = isRTL ? "rtl" : "ltr";
  const lang = i18n.language?.split('-')[0] || 'en';
  const [expandedNutrition, setExpandedNutrition] = useState<string | null>(null);
  const [expandedVitamin, setExpandedVitamin] = useState<string | null>(null);
  const [checkedVitamins, setCheckedVitamins] = useState<string[]>([]);

  const toggleCheck = (key: string) => {
    setCheckedVitamins(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const NUTRITION_GRADIENT = "linear-gradient(135deg, hsl(160,45%,45%), hsl(140,40%,50%))";
  const NUTRITION_COLOR = "hsl(160,45%,45%)";
  const SUPPLEMENT_GRADIENT = "linear-gradient(135deg, hsl(35,80%,50%), hsl(25,75%,55%))";
  const SUPPLEMENT_COLOR = "hsl(35,80%,50%)";

  return (
    <ToolFrame title={t('tools.nutritionSupplements.title')} subtitle={t('tools.nutritionSupplements.description')} mood="joyful" toolId="nutrition-supplements">
      <div className="space-y-3" dir={dir} style={{ textAlign: isRTL ? "right" : "left" }}>

        <Tabs defaultValue="nutrition" dir={dir}>
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="nutrition" className="text-xs gap-1.5">
              <Apple className="w-3.5 h-3.5" />
              {t('tools.nutritionSupplements.nutritionTab')}
            </TabsTrigger>
            <TabsTrigger value="supplements" className="text-xs gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              {t('tools.nutritionSupplements.supplementsTab')}
            </TabsTrigger>
          </TabsList>

          {/* NUTRITION TAB */}
          <TabsContent value="nutrition" className="space-y-2 mt-0">
            <SectionHeader icon={Salad} label={t('tools.nutritionSupplements.nutritionTab')} count={CATEGORY_KEYS.length} color={NUTRITION_COLOR} />

            {CATEGORY_KEYS.map((key, i) => {
              const isOpen = expandedNutrition === key;
              return (
                <motion.div key={key} initial={{ opacity: 0, x: isRTL ? 14 : -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.22 }}>
                  <div
                    className={`rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                      isOpen
                        ? 'border-[hsl(160,45%,45%,0.3)] bg-[hsl(160,45%,45%,0.04)] shadow-md'
                        : 'border-border/50 hover:border-[hsl(160,45%,45%,0.2)] bg-card/80'
                    } ${isRTL ? 'border-r-3' : 'border-l-3'}`}
                    style={{ [isRTL ? 'borderRightColor' : 'borderLeftColor']: isOpen ? NUTRITION_COLOR : 'transparent' }}
                    onClick={() => setExpandedNutrition(isOpen ? null : key)}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <NumberBadge n={i + 1} gradient={NUTRITION_GRADIENT} />
                          <span className="text-sm font-bold text-foreground">{t(`toolsInternal.preconceptionNutrition.categories.${key}.title`)}</span>
                        </div>
                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/70">
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </motion.span>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} className="overflow-hidden">
                          <div className="mx-3 mb-3 space-y-2">
                            <ContentBlock icon={Apple} color={NUTRITION_COLOR}>
                              {t(`toolsInternal.preconceptionNutrition.categories.${key}.description`)}
                            </ContentBlock>
                            <TipBlock icon={Sparkles} color={NUTRITION_COLOR} isRTL={isRTL}>
                              {t(`toolsInternal.preconceptionNutrition.categories.${key}.foods`)}
                            </TipBlock>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* SUPPLEMENTS TAB */}
          <TabsContent value="supplements" className="space-y-2 mt-0">
            <div className="flex items-center justify-between mb-2">
              <SectionHeader icon={Pill} label={t('tools.nutritionSupplements.supplementsTab')} count={VITAMIN_KEYS.length} color={SUPPLEMENT_COLOR} />
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{checkedVitamins.length}/{VITAMIN_KEYS.length}</span>
            </div>

            {VITAMIN_KEYS.map((key, i) => {
              const isOpen = expandedVitamin === key;
              const isChecked = checkedVitamins.includes(key);
              return (
                <motion.div key={key} initial={{ opacity: 0, x: isRTL ? 14 : -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03, duration: 0.22 }}>
                  <div
                    className={`rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                      isChecked
                        ? 'border-primary/30 bg-primary/5'
                        : isOpen
                          ? 'border-[hsl(35,80%,50%,0.3)] bg-[hsl(35,80%,50%,0.04)] shadow-md'
                          : 'border-border/50 hover:border-[hsl(35,80%,50%,0.2)] bg-card/80'
                    } ${isRTL ? 'border-r-3' : 'border-l-3'}`}
                    style={{ [isRTL ? 'borderRightColor' : 'borderLeftColor']: isChecked ? 'hsl(var(--primary))' : isOpen ? SUPPLEMENT_COLOR : 'transparent' }}
                  >
                    <div className="p-3" onClick={() => setExpandedVitamin(isOpen ? null : key)}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <button onClick={e => { e.stopPropagation(); toggleCheck(key); }} className="shrink-0" type="button">
                            <CheckCircle className={`w-5 h-5 transition-colors ${isChecked ? 'text-primary' : 'text-muted-foreground/25'}`} />
                          </button>
                          <span className="text-sm font-bold text-foreground">{t(`toolsInternal.prenatalVitamins.vitamins.${key}.title`)}</span>
                        </div>
                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/70">
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </motion.span>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: "easeOut" }} className="overflow-hidden">
                          <div className="mx-3 mb-3 space-y-2">
                            <ContentBlock icon={Pill} color={SUPPLEMENT_COLOR}>
                              {t(`toolsInternal.prenatalVitamins.vitamins.${key}.description`)}
                            </ContentBlock>
                            <TipBlock icon={Sparkles} color={SUPPLEMENT_COLOR} isRTL={isRTL}>
                              {t(`toolsInternal.prenatalVitamins.vitamins.${key}.dosage`)}
                            </TipBlock>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>

      </div>

      {/* Promotional Video */}
      <div className="mt-4 rounded-xl overflow-hidden border border-border/40">
        <video
          ref={(el) => {
            if (el) {
              el.muted = true;
              el.play().catch(() => {});
            }
          }}
          src={lang === 'ar' ? '/videos/nutrition-promo-ar.mp4' : '/videos/nutrition-promo.mp4'}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="w-full"
          style={{ maxHeight: 280 }}
        />
      </div>

      {/* Video Library */}
      <VideoLibrary
        videosByLang={nutritionSupplementsVideosByLang}
        title={t('tools.nutritionSupplements.videosTitle', 'Educational Videos')}
        subtitle={t('tools.nutritionSupplements.videosSubtitle', 'Learn about prenatal nutrition and supplements')}
      />
    </ToolFrame>
  );
}

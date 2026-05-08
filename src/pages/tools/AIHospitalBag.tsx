import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Briefcase, Baby, User, Heart, Plus, RotateCcw, CheckCircle2, Circle, ChevronDown, ChevronUp, Star, ShieldCheck, Package } from "lucide-react";
import WhatsAppShareButton from "@/components/WhatsAppShareButton";
import { formatChecklistShare, openWhatsApp } from "@/lib/whatsappShare";
import { AIResponseFrame } from "@/components/ai/AIResponseFrame";
import { PrintableReport } from '@/components/PrintableReport';
import { AIActionButton } from "@/components/ai/AIActionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ToolFrame } from "@/components/ToolFrame";
import MedicalDisclaimer from "@/components/compliance/MedicalDisclaimer";
import { useSmartInsight } from "@/hooks/useSmartInsight";
import { useSettings } from "@/hooks/useSettings";
import { safeParseLocalStorage, safeSaveToLocalStorage } from "@/lib/safeStorage";
import { VideoLibrary } from "@/components/VideoLibrary";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { hospitalBagVideosByLang } from "@/data/videoData";

interface BagItem {
  id: string;
  nameKey: string;
  category: "mom" | "baby" | "partner" | "documents";
  packed: boolean;
  priority: "essential" | "recommended" | "optional";
}

const defaultItems: BagItem[] = [
  { id: "1", nameKey: "toolsInternal.hospitalBag.items.hospitalID", category: "documents", packed: false, priority: "essential" },
  { id: "2", nameKey: "toolsInternal.hospitalBag.items.birthPlanCopies", category: "documents", packed: false, priority: "essential" },
  { id: "3", nameKey: "toolsInternal.hospitalBag.items.nightgown", category: "mom", packed: false, priority: "essential" },
  { id: "4", nameKey: "toolsInternal.hospitalBag.items.supportiveBras", category: "mom", packed: false, priority: "essential" },
  { id: "5", nameKey: "toolsInternal.hospitalBag.items.toiletries", category: "mom", packed: false, priority: "essential" },
  { id: "6", nameKey: "toolsInternal.hospitalBag.items.slippersSocks", category: "mom", packed: false, priority: "recommended" },
  { id: "7", nameKey: "toolsInternal.hospitalBag.items.goingHomeOutfitMom", category: "mom", packed: false, priority: "essential" },
  { id: "8", nameKey: "toolsInternal.hospitalBag.items.moisturizer", category: "mom", packed: false, priority: "recommended" },
  { id: "9", nameKey: "toolsInternal.hospitalBag.items.hairTies", category: "mom", packed: false, priority: "optional" },
  { id: "10", nameKey: "toolsInternal.hospitalBag.items.phoneCharger", category: "mom", packed: false, priority: "essential" },
  { id: "11", nameKey: "toolsInternal.hospitalBag.items.lipBalm", category: "mom", packed: false, priority: "optional" },
  { id: "12", nameKey: "toolsInternal.hospitalBag.items.goingHomeOutfitBaby", category: "baby", packed: false, priority: "essential" },
  { id: "13", nameKey: "toolsInternal.hospitalBag.items.carSeat", category: "baby", packed: false, priority: "essential" },
  { id: "14", nameKey: "toolsInternal.hospitalBag.items.swaddleBlankets", category: "baby", packed: false, priority: "essential" },
  { id: "15", nameKey: "toolsInternal.hospitalBag.items.newbornDiapers", category: "baby", packed: false, priority: "recommended" },
  { id: "16", nameKey: "toolsInternal.hospitalBag.items.babyHat", category: "baby", packed: false, priority: "recommended" },
  { id: "17", nameKey: "toolsInternal.hospitalBag.items.changeOfClothes", category: "partner", packed: false, priority: "recommended" },
  { id: "18", nameKey: "toolsInternal.hospitalBag.items.snacksDrinks", category: "partner", packed: false, priority: "recommended" },
  { id: "19", nameKey: "toolsInternal.hospitalBag.items.cameraCharger", category: "partner", packed: false, priority: "optional" },
  { id: "20", nameKey: "toolsInternal.hospitalBag.items.babyWipes", category: "baby", packed: false, priority: "essential" },
  { id: "21", nameKey: "toolsInternal.hospitalBag.items.babyOil", category: "baby", packed: false, priority: "recommended" },
  { id: "22", nameKey: "toolsInternal.hospitalBag.items.nursingPads", category: "mom", packed: false, priority: "essential" },
  { id: "23", nameKey: "toolsInternal.hospitalBag.items.maternityPads", category: "mom", packed: false, priority: "essential" },
  { id: "24", nameKey: "toolsInternal.hospitalBag.items.waterBottle", category: "mom", packed: false, priority: "recommended" },
  { id: "25", nameKey: "toolsInternal.hospitalBag.items.babyMittens", category: "baby", packed: false, priority: "recommended" },
  { id: "26", nameKey: "toolsInternal.hospitalBag.items.underwear", category: "mom", packed: false, priority: "essential" },
  { id: "27", nameKey: "toolsInternal.hospitalBag.items.towel", category: "mom", packed: false, priority: "recommended" },
  { id: "28", nameKey: "toolsInternal.hospitalBag.items.handSanitizer", category: "mom", packed: false, priority: "recommended" },
  { id: "29", nameKey: "toolsInternal.hospitalBag.items.babyBottles", category: "baby", packed: false, priority: "recommended" },
  { id: "30", nameKey: "toolsInternal.hospitalBag.items.pacifier", category: "baby", packed: false, priority: "optional" },
  { id: "31", nameKey: "toolsInternal.hospitalBag.items.extraBlanket", category: "baby", packed: false, priority: "recommended" },
  { id: "32", nameKey: "toolsInternal.hospitalBag.items.snacksMom", category: "mom", packed: false, priority: "recommended" },
  { id: "33", nameKey: "toolsInternal.hospitalBag.items.diaperCream", category: "baby", packed: false, priority: "recommended" },
];

const CATEGORY_CONFIG = {
  mom: { icon: User, gradient: "from-pink-500 to-rose-400", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  baby: { icon: Baby, gradient: "from-blue-500 to-cyan-400", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  partner: { icon: Heart, gradient: "from-purple-500 to-violet-400", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  documents: { icon: Briefcase, gradient: "from-amber-500 to-orange-400", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
};

const PRIORITY_CONFIG = {
  essential: { icon: ShieldCheck, label: "toolsInternal.hospitalBag.essential", gradient: "from-red-500 to-rose-500", textColor: "text-destructive" },
  recommended: { icon: Star, label: "toolsInternal.hospitalBag.recommended", gradient: "from-amber-500 to-orange-400", textColor: "text-amber-600 dark:text-amber-400" },
  optional: { icon: Package, label: "toolsInternal.hospitalBag.optional", gradient: "from-muted-foreground to-muted-foreground", textColor: "text-muted-foreground" },
};

const AIHospitalBag = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { generate, isLoading, content, reset } = useSmartInsight({
    section: 'pregnancy-plan',
    toolType: 'hospital-bag',
  });

  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [items, setItems] = useState<BagItem[]>(() => {
    const stored = safeParseLocalStorage<unknown>("hospital-bag-items", null);

    if (!Array.isArray(stored) || stored.length === 0) return defaultItems;

    const legacyEnglishToKey: Record<string, string> = {
      "Hospital ID & Insurance cards": "toolsInternal.hospitalBag.items.hospitalID",
      "Birth plan copies": "toolsInternal.hospitalBag.items.birthPlanCopies",
      "Comfortable nightgown/robe": "toolsInternal.hospitalBag.items.nightgown",
      "Nightgown": "toolsInternal.hospitalBag.items.nightgown",
      "Comfortable supportive bras (2-3)": "toolsInternal.hospitalBag.items.supportiveBras",
      "Supportive bras (2-3)": "toolsInternal.hospitalBag.items.supportiveBras",
      "Supportive bras": "toolsInternal.hospitalBag.items.supportiveBras",
      "Toiletries bag": "toolsInternal.hospitalBag.items.toiletries",
      "Slippers & socks": "toolsInternal.hospitalBag.items.slippersSocks",
      "Going home outfit (Mom)": "toolsInternal.hospitalBag.items.goingHomeOutfitMom",
      "Moisturizing cream": "toolsInternal.hospitalBag.items.moisturizer",
      "Hair ties & headband": "toolsInternal.hospitalBag.items.hairTies",
      "Phone charger (long cord)": "toolsInternal.hospitalBag.items.phoneCharger",
      "Phone charger": "toolsInternal.hospitalBag.items.phoneCharger",
      "Lip balm": "toolsInternal.hospitalBag.items.lipBalm",
      "Going home outfit (Baby)": "toolsInternal.hospitalBag.items.goingHomeOutfitBaby",
      "Car seat (installed)": "toolsInternal.hospitalBag.items.carSeat",
      "Swaddle blankets (2)": "toolsInternal.hospitalBag.items.swaddleBlankets",
      "Newborn diapers": "toolsInternal.hospitalBag.items.newbornDiapers",
      "Baby hat": "toolsInternal.hospitalBag.items.babyHat",
      "Change of clothes": "toolsInternal.hospitalBag.items.changeOfClothes",
      "Snacks & drinks": "toolsInternal.hospitalBag.items.snacksDrinks",
      "Camera/phone charger": "toolsInternal.hospitalBag.items.cameraCharger",
      "Baby wipes": "toolsInternal.hospitalBag.items.babyWipes",
      "Baby oil/lotion": "toolsInternal.hospitalBag.items.babyOil",
      "Nursing pads": "toolsInternal.hospitalBag.items.nursingPads",
      "Maternity pads": "toolsInternal.hospitalBag.items.maternityPads",
      "Water bottle": "toolsInternal.hospitalBag.items.waterBottle",
      "Baby mittens & socks": "toolsInternal.hospitalBag.items.babyMittens",
      "Underwear (disposable)": "toolsInternal.hospitalBag.items.underwear",
      "Towel": "toolsInternal.hospitalBag.items.towel",
      "Hand sanitizer": "toolsInternal.hospitalBag.items.handSanitizer",
      "Baby bottles": "toolsInternal.hospitalBag.items.babyBottles",
      "Pacifier": "toolsInternal.hospitalBag.items.pacifier",
      "Extra blanket": "toolsInternal.hospitalBag.items.extraBlanket",
      "Snacks for mom": "toolsInternal.hospitalBag.items.snacksMom",
      "Diaper cream": "toolsInternal.hospitalBag.items.diaperCream",
    };

    const normalizeLegacyLabel = (value: string) =>
      value.trim().toLowerCase().replace(/[–—−]/g, "-").replace(/['']/g, "'").replace(/\s+/g, " ");

    const legacyNormalizedToKey = new Map(
      Object.entries(legacyEnglishToKey).map(([k, v]) => [normalizeLegacyLabel(k), v] as const)
    );

    const supportedLangs = ["en", "ar", "de", "tr", "fr", "es", "pt"] as const;
    const localizedNormalizedToKey = new Map<string, string>();
    for (const key of defaultItems.map((i) => i.nameKey)) {
      for (const lng of supportedLangs) {
        const label = i18n.t(key, { lng, defaultValue: "" }) as string;
        if (!label || label === key) continue;
        localizedNormalizedToKey.set(normalizeLegacyLabel(label), key);
      }
    }

    const defaultKeySet = new Set(defaultItems.map((i) => i.nameKey));
    const defaultIdToKey = new Map(defaultItems.map((i) => [i.id, i.nameKey] as const));

    const packedByKey = new Map<string, boolean>();
    const customItems: BagItem[] = [];

    const usedIds = new Set(defaultItems.map((i) => i.id));
    const makeUniqueId = (preferredId: string) => {
      const base = preferredId || Date.now().toString();
      if (!usedIds.has(base)) { usedIds.add(base); return base; }
      let idx = 1;
      while (usedIds.has(`${base}-c${idx}`)) idx += 1;
      const next = `${base}-c${idx}`;
      usedIds.add(next);
      return next;
    };

    for (const raw of stored) {
      const item = raw && typeof raw === "object" ? (raw as any) : {};
      const legacyLabel = typeof raw === "string" ? raw : "";
      const rawId = typeof item?.id === "string" ? item.id : "";
      const rawNameKey = typeof item?.nameKey === "string" ? item.nameKey : "";
      const packed = !!item?.packed;
      const sourceLabel = rawNameKey || (typeof item?.name === "string" ? item.name : "") || legacyLabel;

      if (rawId && defaultIdToKey.has(rawId)) {
        packedByKey.set(defaultIdToKey.get(rawId)!, packed);
        continue;
      }

      const legacyLookup = legacyEnglishToKey[sourceLabel] || legacyNormalizedToKey.get(normalizeLegacyLabel(sourceLabel)) || "";
      const localizedLookup = localizedNormalizedToKey.get(normalizeLegacyLabel(sourceLabel)) || "";
      const resolvedKey = sourceLabel.startsWith("toolsInternal.")
        ? sourceLabel
        : sourceLabel.startsWith("hospitalBag.")
          ? `toolsInternal.${sourceLabel}`
          : legacyLookup || localizedLookup;

      if (resolvedKey && defaultKeySet.has(resolvedKey)) {
        packedByKey.set(resolvedKey, packed);
        continue;
      }

      const customName = sourceLabel;
      if (!customName.trim()) continue;

      const category: BagItem["category"] =
        item?.category === "mom" || item?.category === "baby" || item?.category === "partner" || item?.category === "documents"
          ? item.category : "mom";
      const priority: BagItem["priority"] =
        item?.priority === "essential" || item?.priority === "recommended" || item?.priority === "optional"
          ? item.priority : "optional";

      customItems.push({ id: makeUniqueId(rawId), nameKey: customName, category, packed, priority });
    }

    return [
      ...defaultItems.map((d) => ({ ...d, packed: packedByKey.get(d.nameKey) ?? d.packed })),
      ...customItems,
    ];
  });
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "mom" | "baby" | "partner" | "documents">("all");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    safeSaveToLocalStorage("hospital-bag-items", items);
  }, []);

  const togglePacked = (itemId: string) => {
    const updated = items.map(item => item.id === itemId ? { ...item, packed: !item.packed } : item);
    setItems(updated);
    safeSaveToLocalStorage("hospital-bag-items", updated);
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const updated: BagItem[] = [...items, {
      id: Date.now().toString(), nameKey: newItem, category: "mom" as const, packed: false, priority: "optional" as const
    }];
    setItems(updated);
    safeSaveToLocalStorage("hospital-bag-items", updated);
    setNewItem("");
  };

  const resetList = () => {
    if (window.confirm(t('toolsInternal.hospitalBag.resetConfirm'))) {
      localStorage.removeItem("hospital-bag-items");
      setItems(defaultItems);
      toast.success(t('toolsInternal.hospitalBag.resetSuccess'));
    }
  };

  const getItemDisplayName = (item: BagItem): string => {
    const key = item.nameKey || "";
    if (!key) return "";
    if (key.startsWith("toolsInternal.")) return t(key);
    if (key.startsWith("hospitalBag.")) return t(`toolsInternal.${key}`);
    return key;
  };

  const handleShareWhatsApp = () => {
    const shareItems = items.map(item => ({
      name: getItemDisplayName(item),
      done: item.packed,
      category: item.category,
    }));
    const cats = [
      { key: 'documents', emoji: '📄', label: t('toolsInternal.hospitalBag.documents') },
      { key: 'mom', emoji: '👩', label: t('toolsInternal.hospitalBag.mom') },
      { key: 'baby', emoji: '👶', label: t('toolsInternal.hospitalBag.baby') },
      { key: 'partner', emoji: '👨', label: t('toolsInternal.hospitalBag.partner') },
    ];
    const text = formatChecklistShare(
      { title: t('toolsInternal.hospitalBag.title'), emoji: '🧳' },
      shareItems, undefined, cats
    );
    openWhatsApp(text);
  };

  const getPersonalizedList = async () => {
    const currentLang = i18n.language;
    const langNames: Record<string, string> = {
      en: 'English', ar: 'Arabic', de: 'German', tr: 'Turkish', fr: 'French', es: 'Spanish', pt: 'Portuguese'
    };
    const currentLangName = langNames[currentLang] || 'English';
    const langInstruction = currentLang !== 'en'
      ? `IMPORTANT: Respond ENTIRELY in ${currentLangName}. All text, headers, and recommendations must be in ${currentLangName}.`
      : '';

    const prompt = `${langInstruction}

As a birth preparation guide, create a personalized hospital bag packing list:

**Pregnancy Week:** ${settings.pregnancyWeek || "Not specified"}
**Due Date:** ${settings.dueDate || "Not set"}
**Birth Plan:** ${settings.birthPlan || "Not specified"}

Provide a comprehensive, personalized hospital bag checklist organized by:
1. **For Mom** - Clothing, comfort items, toiletries
2. **For Baby** - Clothing, essentials
3. **For Partner** - Support items
4. **Documents** - Must-have paperwork
5. **Pro Tips** - Things most people forget
6. **By Trimester** - When to start packing what

Include seasonal considerations and hospital-specific recommendations.`;

    await generate({ prompt, context: { week: Number(settings.pregnancyWeek) || 0 } });
  };

  const packedCount = items.filter(i => i.packed).length;
  const progress = Math.round((packedCount / items.length) * 100);
  const filteredItems = selectedCategory === "all" ? items : items.filter(i => i.category === selectedCategory);

  // Group items by category for display
  const categories = (["mom", "baby", "partner", "documents"] as const);
  const getCatItems = (cat: string) => {
    const catItems = filteredItems.filter(i => i.category === cat);
    // Sort: essential first, then recommended, then optional
    return catItems.sort((a, b) => {
      const order = { essential: 0, recommended: 1, optional: 2 };
      return order[a.priority] - order[b.priority];
    });
  };

  // SVG Progress Ring
  const RING_R = 28;
  const RING_C = 2 * Math.PI * RING_R;

  if (!disclaimerAccepted) {
    return <MedicalDisclaimer onAccept={() => setDisclaimerAccepted(true)} toolName={t('toolsInternal.hospitalBag.title')} />;
  }

  return (
    <ToolFrame title={t('toolsInternal.hospitalBag.title')} subtitle={t('toolsInternal.hospitalBag.subtitle')} customIcon="checklist" mood="empowering" toolId="ai-hospital-bag">
      <div className="space-y-4">
        {/* ═══════ HERO PROGRESS ═══════ */}
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4">
              {/* Progress Ring */}
              <div className="relative w-[72px] h-[72px] shrink-0">
                <svg className="w-[72px] h-[72px] -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r={RING_R} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                  <motion.circle
                    cx="32" cy="32" r={RING_R} fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={RING_C}
                    animate={{ strokeDashoffset: RING_C * (1 - progress / 100) }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-extrabold text-foreground tabular-nums">{progress}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground mb-1">{t('toolsInternal.hospitalBag.progress')}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {t('toolsInternal.hospitalBag.itemsPacked', { packed: packedCount, total: items.length })}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Button variant="ghost" size="sm" onClick={resetList} className="h-7 text-[10px] gap-1 text-muted-foreground px-2">
                    <RotateCcw className="w-3 h-3" />
                    {t('toolsInternal.hospitalBag.resetList')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Category mini-cards */}
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {categories.map(cat => {
                const config = CATEGORY_CONFIG[cat];
                const CatIcon = config.icon;
                const catItems = items.filter(i => i.category === cat);
                const catPacked = catItems.filter(i => i.packed).length;
                const catPct = catItems.length > 0 ? Math.round((catPacked / catItems.length) * 100) : 0;
                return (
                  <div key={cat} className={`p-2 rounded-xl border ${config.bg} text-center`}>
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center mx-auto mb-1 shadow-sm`}>
                      <CatIcon className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-[11px] font-extrabold text-foreground tabular-nums">{catPacked}/{catItems.length}</p>
                    <p className="text-[8px] text-muted-foreground leading-tight">{t(`toolsInternal.hospitalBag.${cat}`)}</p>
                    <div className="mt-1 h-1 rounded-full bg-background/50 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${catPct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ═══════ CATEGORY FILTER ═══════ */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(["all", ...categories] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            const CatIcon = cat === "all" ? Package : CATEGORY_CONFIG[cat].icon;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border/30 text-muted-foreground hover:border-border/60'
                }`}
              >
                <CatIcon className="w-3 h-3" />
                {cat === "all" ? t('toolsInternal.hospitalBag.all') : t(`toolsInternal.hospitalBag.${cat}`)}
              </button>
            );
          })}
        </div>

        {/* ═══════ ITEMS LIST — Grouped by Category ═══════ */}
        {(selectedCategory === "all" ? categories : [selectedCategory]).map(cat => {
          const catItems = getCatItems(cat);
          if (catItems.length === 0) return null;
          const config = CATEGORY_CONFIG[cat];
          const CatIcon = config.icon;
          const catPacked = catItems.filter(i => i.packed).length;

          return (
            <div key={cat} className="space-y-1.5">
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                className="w-full flex items-center justify-between px-1 py-1"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-4 rounded-full bg-gradient-to-b ${config.gradient}`} />
                  <CatIcon className={`w-3.5 h-3.5 ${config.color}`} />
                  <h3 className={`text-xs font-bold ${config.color}`}>{t(`toolsInternal.hospitalBag.${cat}`)}</h3>
                  <span className="text-[10px] text-muted-foreground tabular-nums">({catPacked}/{catItems.length})</span>
                </div>
                {expandedCategory === cat ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {(expandedCategory === cat || expandedCategory === null) && (
                  <motion.div
                    initial={expandedCategory !== null ? { opacity: 0, height: 0 } : false}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {catItems.map((item, idx) => {
                      const isPacked = item.packed;
                      const priorityConf = PRIORITY_CONFIG[item.priority];

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <Card className={`transition-all duration-200 ${isPacked ? 'bg-muted/30 border-primary/15' : ''}`}>
                            <CardContent className="p-2.5">
                              <div className="flex items-center gap-2.5">
                                <button onClick={() => togglePacked(item.id)} className="shrink-0">
                                  {isPacked ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <CheckCircle2 className="w-5 h-5 text-primary" />
                                    </motion.div>
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground/30 hover:text-primary/50 transition-colors" />
                                  )}
                                </button>
                                <span className={`text-[12px] font-semibold leading-snug flex-1 min-w-0 ${isPacked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {getItemDisplayName(item)}
                                </span>
                                {item.priority === "essential" && (
                                  <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 shrink-0 border-destructive/30 ${priorityConf.textColor} bg-destructive/5`}>
                                    <ShieldCheck className="w-2.5 h-2.5 me-0.5" />
                                    {t(priorityConf.label)}
                                  </Badge>
                                )}
                                {item.priority === "recommended" && (
                                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 shrink-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                                    <Star className="w-2.5 h-2.5 me-0.5" />
                                    {t(priorityConf.label)}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* ═══════ ADD CUSTOM ITEM ═══════ */}
        <div className="flex gap-2">
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={t('toolsInternal.hospitalBag.addCustomItem')} onKeyPress={(e) => e.key === "Enter" && addItem()} className="text-sm" />
          <Button onClick={addItem} size="icon" className="shrink-0"><Plus className="w-4 h-4" /></Button>
        </div>

        {/* ═══════ AI BUTTON ═══════ */}
        <AIActionButton onClick={getPersonalizedList} isLoading={isLoading} label={t('toolsInternal.hospitalBag.getAIList')} loadingLabel={t('toolsInternal.hospitalBag.generating')} icon={Briefcase} toolType="hospital-bag" section="pregnancy-plan" />

        {content && (
          <PrintableReport title={t('toolsInternal.hospitalBag.title')} isLoading={isLoading}>
            <AIResponseFrame content={content} isLoading={isLoading} title={t('toolsInternal.hospitalBag.title')} />
          </PrintableReport>
        )}

        {/* Educational Videos */}
        <VideoLibrary videosByLang={hospitalBagVideosByLang(t)} title={t('toolsInternal.hospitalBag.hospitalBagVideos')} subtitle={t('toolsInternal.hospitalBag.hospitalBagVideosSubtitle')} accentColor="blue" />
      </div>
      <WhatsAppShareButton
        onClick={handleShareWhatsApp}
        className="!fixed bottom-20 end-4 z-40 shadow-xl"
      />
    </ToolFrame>
  );
};

export default AIHospitalBag;

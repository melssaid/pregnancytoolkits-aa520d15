import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolFrame } from '@/components/ToolFrame';
import { MedicalDisclaimer } from '@/components/compliance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Check, Star, Baby, ShoppingBag, Home, Car, Heart, Utensils, Moon, Shirt, Thermometer, RotateCcw, ChevronDown, ChevronUp, DollarSign, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { getUserId } from '@/hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';

interface GearItem {
  id: string;
  nameKey: string;
  category: 'essential' | 'recommended' | 'nice-to-have';
  type: 'feeding' | 'sleeping' | 'travel' | 'clothing' | 'health' | 'nursery';
  descriptionKey: string;
  priceRange: '$' | '$$' | '$$$';
  tipsKey: string;
  whenNeededKey: string;
}

const gearList: GearItem[] = [
  // Essential - Travel
  { id: '1', nameKey: 'babyGear.items.carSeat', category: 'essential', type: 'travel', descriptionKey: 'babyGear.descriptions.carSeat', priceRange: '$$', tipsKey: 'babyGear.tips.carSeat', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  // Essential - Sleeping
  { id: '2', nameKey: 'babyGear.items.crib', category: 'essential', type: 'sleeping', descriptionKey: 'babyGear.descriptions.crib', priceRange: '$$', tipsKey: 'babyGear.tips.crib', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  { id: '12', nameKey: 'babyGear.items.swaddles', category: 'essential', type: 'sleeping', descriptionKey: 'babyGear.descriptions.swaddles', priceRange: '$', tipsKey: 'babyGear.tips.swaddles', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  // Essential - Health
  { id: '3', nameKey: 'babyGear.items.diapers', category: 'essential', type: 'health', descriptionKey: 'babyGear.descriptions.diapers', priceRange: '$', tipsKey: 'babyGear.tips.diapers', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  // Essential - Feeding
  { id: '4', nameKey: 'babyGear.items.bottles', category: 'essential', type: 'feeding', descriptionKey: 'babyGear.descriptions.bottles', priceRange: '$', tipsKey: 'babyGear.tips.bottles', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  // Essential - Clothing
  { id: '5', nameKey: 'babyGear.items.onesies', category: 'essential', type: 'clothing', descriptionKey: 'babyGear.descriptions.onesies', priceRange: '$', tipsKey: 'babyGear.tips.onesies', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  { id: '13', nameKey: 'babyGear.items.thermometer', category: 'essential', type: 'health', descriptionKey: 'babyGear.descriptions.thermometer', priceRange: '$', tipsKey: 'babyGear.tips.thermometer', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  { id: '14', nameKey: 'babyGear.items.burpCloths', category: 'essential', type: 'feeding', descriptionKey: 'babyGear.descriptions.burpCloths', priceRange: '$', tipsKey: 'babyGear.tips.burpCloths', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  // Recommended
  { id: '6', nameKey: 'babyGear.items.stroller', category: 'recommended', type: 'travel', descriptionKey: 'babyGear.descriptions.stroller', priceRange: '$$', tipsKey: 'babyGear.tips.stroller', whenNeededKey: 'babyGear.whenNeeded.firstWeeks' },
  { id: '7', nameKey: 'babyGear.items.monitor', category: 'recommended', type: 'nursery', descriptionKey: 'babyGear.descriptions.monitor', priceRange: '$$', tipsKey: 'babyGear.tips.monitor', whenNeededKey: 'babyGear.whenNeeded.firstWeeks' },
  { id: '8', nameKey: 'babyGear.items.breastPump', category: 'recommended', type: 'feeding', descriptionKey: 'babyGear.descriptions.breastPump', priceRange: '$$', tipsKey: 'babyGear.tips.breastPump', whenNeededKey: 'babyGear.whenNeeded.afterBirth' },
  { id: '10', nameKey: 'babyGear.items.diaperBag', category: 'recommended', type: 'travel', descriptionKey: 'babyGear.descriptions.diaperBag', priceRange: '$', tipsKey: 'babyGear.tips.diaperBag', whenNeededKey: 'babyGear.whenNeeded.afterBirth' },
  { id: '11', nameKey: 'babyGear.items.bathtub', category: 'recommended', type: 'health', descriptionKey: 'babyGear.descriptions.bathtub', priceRange: '$', tipsKey: 'babyGear.tips.bathtub', whenNeededKey: 'babyGear.whenNeeded.firstWeeks' },
  { id: '15', nameKey: 'babyGear.items.changingPad', category: 'recommended', type: 'nursery', descriptionKey: 'babyGear.descriptions.changingPad', priceRange: '$', tipsKey: 'babyGear.tips.changingPad', whenNeededKey: 'babyGear.whenNeeded.beforeBirth' },
  { id: '16', nameKey: 'babyGear.items.nightLight', category: 'recommended', type: 'nursery', descriptionKey: 'babyGear.descriptions.nightLight', priceRange: '$', tipsKey: 'babyGear.tips.nightLight', whenNeededKey: 'babyGear.whenNeeded.firstWeeks' },
  // Nice to Have
  { id: '9', nameKey: 'babyGear.items.swing', category: 'nice-to-have', type: 'nursery', descriptionKey: 'babyGear.descriptions.swing', priceRange: '$$', tipsKey: 'babyGear.tips.swing', whenNeededKey: 'babyGear.whenNeeded.firstMonth' },
  { id: '17', nameKey: 'babyGear.items.bouncer', category: 'nice-to-have', type: 'nursery', descriptionKey: 'babyGear.descriptions.bouncer', priceRange: '$$', tipsKey: 'babyGear.tips.bouncer', whenNeededKey: 'babyGear.whenNeeded.firstMonth' },
  { id: '18', nameKey: 'babyGear.items.playMat', category: 'nice-to-have', type: 'nursery', descriptionKey: 'babyGear.descriptions.playMat', priceRange: '$', tipsKey: 'babyGear.tips.playMat', whenNeededKey: 'babyGear.whenNeeded.firstMonth' },
];

const typeIcons: Record<string, React.ElementType> = {
  feeding: Utensils,
  sleeping: Moon,
  travel: Car,
  clothing: Shirt,
  health: Heart,
  nursery: Home,
};

const TYPE_COLORS: Record<string, string> = {
  feeding: 'from-orange-500 to-amber-400',
  sleeping: 'from-indigo-500 to-blue-400',
  travel: 'from-emerald-500 to-teal-400',
  clothing: 'from-pink-500 to-rose-400',
  health: 'from-red-500 to-rose-400',
  nursery: 'from-purple-500 to-violet-400',
};

const CATEGORY_CONFIG = {
  essential: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', gradient: 'from-red-500 to-rose-500', icon: AlertCircle },
  recommended: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', gradient: 'from-primary to-blue-500', icon: Star },
  'nice-to-have': { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', gradient: 'from-gray-400 to-gray-500', icon: Heart },
};

const STORAGE_KEY = 'baby_gear_checked';

export default function BabyGearRecommender() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    try {
      const userId = getUserId();
      const saved = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (saved) setCheckedItems(JSON.parse(saved));
    } catch {}
  }, []);

  const saveCheckedItems = useCallback((items: string[]) => {
    try {
      const userId = getUserId();
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(items));
    } catch {}
  }, []);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const updated = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      saveCheckedItems(updated);
      return updated;
    });
  };

  const resetAll = () => {
    setCheckedItems([]);
    saveCheckedItems([]);
  };

  // Group by category
  const categories = ['essential', 'recommended', 'nice-to-have'] as const;

  const filteredByType = useMemo(() => {
    if (selectedType === 'all') return gearList;
    return gearList.filter(i => i.type === selectedType);
  }, [selectedType]);

  const getCategoryItems = (cat: string) => filteredByType.filter(i => i.category === cat);

  const essentials = gearList.filter(i => i.category === 'essential');
  const essentialsChecked = essentials.filter(i => checkedItems.includes(i.id)).length;
  const totalChecked = checkedItems.length;

  // Budget estimate
  const budgetEstimate = useMemo(() => {
    const priceMap = { '$': 25, '$$': 100, '$$$': 250 };
    let remaining = 0;
    let bought = 0;
    gearList.forEach(item => {
      const price = priceMap[item.priceRange];
      if (checkedItems.includes(item.id)) {
        bought += price;
      } else {
        remaining += price;
      }
    });
    return { bought, remaining, total: bought + remaining };
  }, [checkedItems]);

  const typeFilters = ['all', 'feeding', 'sleeping', 'travel', 'clothing', 'health', 'nursery'];

  if (showDisclaimer) {
    return (
      <MedicalDisclaimer
        toolName={t('babyGear.title')}
        onAccept={() => setShowDisclaimer(false)}
      />
    );
  }

  return (
    <ToolFrame
      title={t('babyGear.title')}
      subtitle={t('babyGear.subtitle')}
      mood="joyful"
      toolId="baby-gear"
      icon={Package}
    >
      <div className="space-y-4">
        {/* Hero Progress */}
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-destructive via-primary to-muted-foreground" />
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-primary" />
                {t('babyGear.essentialsProgress')}
              </h3>
              <Button variant="ghost" size="sm" onClick={resetAll} className="h-7 text-[10px] gap-1 text-muted-foreground">
                <RotateCcw className="w-3 h-3" />
                {t('babyGear.reset')}
              </Button>
            </div>

            {/* Visual category progress */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {categories.map(cat => {
                const items = gearList.filter(i => i.category === cat);
                const checked = items.filter(i => checkedItems.includes(i.id)).length;
                const pct = Math.round((checked / items.length) * 100);
                const config = CATEGORY_CONFIG[cat];
                const CatIcon = config.icon;
                return (
                  <div key={cat} className={`p-2.5 rounded-xl border ${config.border} ${config.bg} text-center`}>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center mx-auto mb-1.5 shadow-sm`}>
                      <CatIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-sm font-extrabold text-foreground tabular-nums">{checked}/{items.length}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">
                      {t(`babyGear.categories.${cat === 'nice-to-have' ? 'niceToHave' : cat}`)}
                    </p>
                    <div className="mt-1.5 h-1 rounded-full bg-background/50 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Budget estimate */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/10">
              <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">{t('babyGear.budgetEstimate')}</p>
                <p className="text-xs font-bold text-foreground">
                  ~${budgetEstimate.remaining} {t('babyGear.remaining')}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                ${budgetEstimate.bought}/${budgetEstimate.total}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Type Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {typeFilters.map(type => {
            const TypeIcon = type === 'all' ? Package : typeIcons[type];
            const isActive = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1 whitespace-nowrap text-[10px] font-medium px-2.5 py-1.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border/30 text-muted-foreground hover:border-border/60'
                }`}
              >
                <TypeIcon className="w-3 h-3" />
                {t(`babyGear.types.${type === 'all' ? 'all' : type}`)}
              </button>
            );
          })}
        </div>

        {/* Items by Category */}
        {categories.map(cat => {
          const items = getCategoryItems(cat);
          if (items.length === 0) return null;
          const config = CATEGORY_CONFIG[cat];

          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className={`w-1 h-4 rounded-full bg-gradient-to-b ${config.gradient}`} />
                <h3 className={`text-xs font-bold ${config.color}`}>
                  {t(`babyGear.categories.${cat === 'nice-to-have' ? 'niceToHave' : cat}`)}
                </h3>
                <span className="text-[10px] text-muted-foreground">({items.length})</span>
              </div>

              <div className="space-y-1.5">
                {items.map((item, idx) => {
                  const TypeIcon = typeIcons[item.type];
                  const isChecked = checkedItems.includes(item.id);
                  const isExpanded = expandedItem === item.id;
                  const typeColor = TYPE_COLORS[item.type];

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Card className={`transition-all duration-200 ${
                        isChecked ? 'bg-muted/30 border-primary/15' : ''
                      }`}>
                        <CardContent className="p-2.5">
                          <div className="flex items-start gap-2.5">
                            {/* Check button */}
                            <button
                              onClick={() => toggleItem(item.id)}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {isChecked ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  <CheckCircle2 className="w-5 h-5 text-primary" />
                                </motion.div>
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground/30 hover:text-primary/50 transition-colors" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${typeColor} flex items-center justify-center flex-shrink-0`}>
                                    <TypeIcon className="w-3 h-3 text-white" />
                                  </div>
                                  <h4 className={`text-[11px] font-semibold leading-snug ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {t(item.nameKey)}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 font-bold">
                                    {item.priceRange}
                                  </Badge>
                                  <button
                                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                    className="p-0.5 rounded hover:bg-muted/60 transition-colors"
                                  >
                                    {isExpanded ?
                                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> :
                                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    }
                                  </button>
                                </div>
                              </div>

                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                {t(item.descriptionKey)}
                              </p>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2 space-y-1.5">
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-accent/5">
                                        {t(item.whenNeededKey)}
                                      </Badge>
                                      <div className="bg-muted/30 rounded-lg p-2">
                                        <p className="text-[10px] text-muted-foreground">
                                          <Star className="w-2.5 h-2.5 inline me-1 text-amber-500" />
                                          <strong>{t('babyGear.tip')}:</strong> {t(item.tipsKey)}
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredByType.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t('babyGear.noItemsFound')}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            {t('babyGear.disclaimer')}
          </p>
        </div>
      </div>
    </ToolFrame>
  );
}

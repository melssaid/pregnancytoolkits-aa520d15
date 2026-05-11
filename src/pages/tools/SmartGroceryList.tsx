import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolFrame } from '@/components/ToolFrame';
import { MedicalDisclaimer } from '@/components/compliance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, Check, Plus, Trash2, Sparkles,
  TrendingUp, Target, Brain, Zap, Heart, BarChart3, ChefHat, Calendar,
  Droplets, Flame, Dumbbell, CheckCircle2, Clock, RefreshCw, Leaf,
  Apple, Milk, Egg, Fish, Wheat, Cherry, Carrot, Bean, Nut
} from 'lucide-react';
import { safeParseLocalStorage, safeSaveToLocalStorage } from '@/lib/safeStorage';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { WeekSlider } from '@/components/WeekSlider';
import { AIInsightCard } from '@/components/ai/AIInsightCard';
import WhatsAppShareButton from '@/components/WhatsAppShareButton';
import { formatChecklistShare, openWhatsApp } from '@/lib/whatsappShare';

import { ToolHubNav, NUTRITION_HUB_TABS } from '@/components/ToolHubNav';

interface GroceryItem {
  id: string;
  nameKey?: string;
  name?: string;
  category: 'produce' | 'dairy' | 'protein' | 'grains' | 'other';
  isChecked: boolean;
  pregnancyBenefitKey?: string;
  pregnancyBenefit?: string;
  nutrients?: {
    protein?: number;
    iron?: number;
    folate?: number;
    calcium?: number;
    omega3?: number;
  };
}

interface NutritionGoal {
  name: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

const suggestedItems: GroceryItem[] = [
  // Produce (10 items)
  { id: '1', nameKey: 'groceryList.groceryItems.spinach', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.spinach', nutrients: { iron: 15, folate: 25, calcium: 5 } },
  { id: '2', nameKey: 'groceryList.groceryItems.avocados', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.avocados', nutrients: { omega3: 10, folate: 15 } },
  { id: '7', nameKey: 'groceryList.groceryItems.sweetPotatoes', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.sweetPotatoes', nutrients: { folate: 8, iron: 5 } },
  { id: '8', nameKey: 'groceryList.groceryItems.berries', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.berries', nutrients: { folate: 5 } },
  { id: '10', nameKey: 'groceryList.groceryItems.oranges', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.oranges', nutrients: { folate: 10 } },
  { id: '13', nameKey: 'groceryList.groceryItems.broccoli', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.broccoli', nutrients: { folate: 15, calcium: 6, iron: 4 } },
  { id: '14', nameKey: 'groceryList.groceryItems.bananas', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.bananas', nutrients: { folate: 6 } },
  { id: '15', nameKey: 'groceryList.groceryItems.carrots', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.carrots', nutrients: { folate: 4 } },
  { id: '16', nameKey: 'groceryList.groceryItems.kale', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.kale', nutrients: { iron: 10, folate: 12, calcium: 8 } },
  { id: '17', nameKey: 'groceryList.groceryItems.mangoes', category: 'produce', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.mangoes', nutrients: { folate: 11 } },
  // Dairy (4 items)
  { id: '3', nameKey: 'groceryList.groceryItems.greekYogurt', category: 'dairy', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.greekYogurt', nutrients: { protein: 12, calcium: 20 } },
  { id: '18', nameKey: 'groceryList.groceryItems.cheese', category: 'dairy', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.cheese', nutrients: { protein: 8, calcium: 25 } },
  { id: '19', nameKey: 'groceryList.groceryItems.milk', category: 'dairy', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.milk', nutrients: { protein: 6, calcium: 22 } },
  { id: '20', nameKey: 'groceryList.groceryItems.cottageCheese', category: 'dairy', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.cottageCheese', nutrients: { protein: 14, calcium: 10 } },
  // Protein (8 items)
  { id: '4', nameKey: 'groceryList.groceryItems.eggs', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.eggs', nutrients: { protein: 15, iron: 8 } },
  { id: '5', nameKey: 'groceryList.groceryItems.salmon', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.salmon', nutrients: { protein: 20, omega3: 40 } },
  { id: '6', nameKey: 'groceryList.groceryItems.lentils', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.lentils', nutrients: { protein: 18, iron: 20, folate: 30 } },
  { id: '12', nameKey: 'groceryList.groceryItems.chickenBreast', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.chickenBreast', nutrients: { protein: 25, iron: 6 } },
  { id: '21', nameKey: 'groceryList.groceryItems.beef', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.beef', nutrients: { protein: 22, iron: 18 } },
  { id: '22', nameKey: 'groceryList.groceryItems.chickpeas', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.chickpeas', nutrients: { protein: 14, iron: 12, folate: 20 } },
  { id: '23', nameKey: 'groceryList.groceryItems.tofu', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.tofu', nutrients: { protein: 16, calcium: 15, iron: 10 } },
  { id: '24', nameKey: 'groceryList.groceryItems.sardines', category: 'protein', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.sardines', nutrients: { protein: 18, omega3: 30, calcium: 12 } },
  // Grains (4 items)
  { id: '9', nameKey: 'groceryList.groceryItems.wholeGrainBread', category: 'grains', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.wholeGrainBread', nutrients: { iron: 10, folate: 12 } },
  { id: '25', nameKey: 'groceryList.groceryItems.oats', category: 'grains', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.oats', nutrients: { iron: 12, folate: 8, protein: 5 } },
  { id: '26', nameKey: 'groceryList.groceryItems.quinoa', category: 'grains', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.quinoa', nutrients: { protein: 12, iron: 14, folate: 10 } },
  { id: '27', nameKey: 'groceryList.groceryItems.brownRice', category: 'grains', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.brownRice', nutrients: { iron: 6, folate: 5 } },
  // Other (4 items)
  { id: '11', nameKey: 'groceryList.groceryItems.almonds', category: 'other', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.almonds', nutrients: { protein: 8, calcium: 10, omega3: 5 } },
  { id: '28', nameKey: 'groceryList.groceryItems.walnuts', category: 'other', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.walnuts', nutrients: { omega3: 20, protein: 6 } },
  { id: '29', nameKey: 'groceryList.groceryItems.chia', category: 'other', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.chia', nutrients: { omega3: 25, calcium: 8, iron: 6 } },
  { id: '30', nameKey: 'groceryList.groceryItems.dates', category: 'other', isChecked: false, pregnancyBenefitKey: 'groceryList.benefits.dates', nutrients: { iron: 8, folate: 4 } },
];

const getWeeklyRecommendations = (t: (key: string) => string): Record<string, string[]> => ({
  '1': [t('groceryList.weeklyRecommendations.folateRich'), t('groceryList.weeklyRecommendations.wholeGrains'), t('groceryList.weeklyRecommendations.leanProteins')],
  '2': [t('groceryList.weeklyRecommendations.ironRich'), t('groceryList.weeklyRecommendations.omega3Sources'), t('groceryList.weeklyRecommendations.calciumFoods')],
  '3': [t('groceryList.weeklyRecommendations.highFiber'), t('groceryList.weeklyRecommendations.vitaminD'), t('groceryList.weeklyRecommendations.hydratingFoods')],
});

const categoryIcons: Record<string, React.ElementType> = {
  produce: Leaf,
  dairy: Milk,
  protein: Fish,
  grains: Wheat,
  other: Cherry
};

const categoryColors: Record<string, string> = {
  produce: 'hsl(142 71% 45%)',
  dairy: 'hsl(217 91% 60%)',
  protein: 'hsl(0 84% 60%)',
  grains: 'hsl(45 93% 47%)',
  other: 'hsl(262 83% 58%)'
};

const categoryBg: Record<string, string> = {
  produce: 'bg-green-500/10',
  dairy: 'bg-blue-500/10',
  protein: 'bg-red-500/10',
  grains: 'bg-amber-500/10',
  other: 'bg-violet-500/10'
};

const categoryText: Record<string, string> = {
  produce: 'text-green-600',
  dairy: 'text-blue-600',
  protein: 'text-red-600',
  grains: 'text-amber-600',
  other: 'text-violet-600'
};

const isGroceryItemArray = (data: unknown): data is GroceryItem[] => {
  return Array.isArray(data) && data.every(item =>
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    ('name' in item || 'nameKey' in item) &&
    'category' in item &&
    typeof (item as GroceryItem).isChecked === 'boolean'
  );
};

export default function SmartGroceryList() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'produce' | 'dairy' | 'protein' | 'grains' | 'other'>('all');
  const [currentWeek, setCurrentWeek] = useState(20);
  const [activeTab, setActiveTab] = useState('list');
  
  const isInitialized = useRef(false);

  useEffect(() => {
    const saved = safeParseLocalStorage<GroceryItem[]>(
      'pregnancyGroceryList',
      suggestedItems,
      isGroceryItemArray
    );
    setItems(saved);
    isInitialized.current = true;
  }, []);

  const saveItems = useCallback((newItems: GroceryItem[]) => {
    const success = safeSaveToLocalStorage('pregnancyGroceryList', newItems);
    if (!success) {
      toast.error(t('groceryList.saveFailed'));
    }
  }, [t]);

  useEffect(() => {
    if (isInitialized.current) {
      saveItems(items);
    }
  }, [items, saveItems]);

  const addItem = () => {
    if (!newItem.trim()) return;
    const item: GroceryItem = {
      id: Date.now().toString(),
      name: newItem,
      category: 'other',
      isChecked: false
    };
    setItems([...items, item]);
    setNewItem('');
    toast.success(t('groceryList.itemAdded'));
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addSuggested = (suggested: GroceryItem) => {
    const itemName = suggested.nameKey ? t(suggested.nameKey) : suggested.name;
    if (!items.find(i => (i.nameKey ? t(i.nameKey) : i.name) === itemName)) {
      setItems([...items, { ...suggested, id: Date.now().toString() }]);
      toast.success(`${itemName} ${t('groceryList.addedToList')}`);
    }
  };

  const clearChecked = () => {
    const count = items.filter(item => item.isChecked).length;
    setItems(items.filter(item => !item.isChecked));
    toast.success(t('groceryList.itemsCleared', { count }));
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  const checkedCount = items.filter(i => i.isChecked).length;

  const calculateNutrition = () => {
    const totals = { protein: 0, iron: 0, folate: 0, calcium: 0, omega3: 0 };
    items.forEach(item => {
      if (item.nutrients) {
        totals.protein += item.nutrients.protein || 0;
        totals.iron += item.nutrients.iron || 0;
        totals.folate += item.nutrients.folate || 0;
        totals.calcium += item.nutrients.calcium || 0;
        totals.omega3 += item.nutrients.omega3 || 0;
      }
    });
    return totals;
  };

  const nutrition = calculateNutrition();

  const nutritionGoals: NutritionGoal[] = [
    { name: t('groceryList.nutrients.protein'), current: nutrition.protein, target: 100, unit: '%', icon: Dumbbell, color: 'hsl(0 84% 60%)' },
    { name: t('groceryList.nutrients.iron'), current: nutrition.iron, target: 100, unit: '%', icon: Droplets, color: 'hsl(45 93% 47%)' },
    { name: t('groceryList.nutrients.folate'), current: nutrition.folate, target: 100, unit: '%', icon: Leaf, color: 'hsl(142 71% 45%)' },
    { name: t('groceryList.nutrients.calcium'), current: nutrition.calcium, target: 100, unit: '%', icon: Heart, color: 'hsl(217 91% 60%)' },
    { name: t('groceryList.nutrients.omega3'), current: nutrition.omega3, target: 100, unit: '%', icon: Brain, color: 'hsl(262 83% 58%)' },
  ];

  const categoryData = [
    { name: t('groceryList.categoryNames.produce'), value: items.filter(i => i.category === 'produce').length, color: categoryColors.produce },
    { name: t('groceryList.categoryNames.dairy'), value: items.filter(i => i.category === 'dairy').length, color: categoryColors.dairy },
    { name: t('groceryList.categoryNames.protein'), value: items.filter(i => i.category === 'protein').length, color: categoryColors.protein },
    { name: t('groceryList.categoryNames.grains'), value: items.filter(i => i.category === 'grains').length, color: categoryColors.grains },
    { name: t('groceryList.categoryNames.other'), value: items.filter(i => i.category === 'other').length, color: categoryColors.other },
  ].filter(d => d.value > 0);
  
  const weeklyRecommendations = getWeeklyRecommendations(t);

  const nutritionChartData = nutritionGoals.map(goal => ({
    name: goal.name,
    current: Math.min(goal.current, 100),
    target: 100,
    fill: goal.color
  }));

  if (showDisclaimer) {
    return (
      <MedicalDisclaimer
        toolName={t('groceryList.title')}
        onAccept={() => setShowDisclaimer(false)}
      />
    );
  }

  const notInList = suggestedItems.filter(s => 
    !items.find(i => (i.nameKey ? t(i.nameKey) : i.name) === (s.nameKey ? t(s.nameKey) : s.name))
  );

  return (
    <ToolFrame
      title={t('groceryList.title')}
      subtitle={t('groceryList.subtitle')}
      mood="joyful"
      toolId="grocery-list"
    >
      <ToolHubNav tabs={NUTRITION_HUB_TABS} />
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/15 p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground text-sm">{t('groceryList.smartNutrition')}</h2>
              <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                {t('groceryList.smartNutritionDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: ShoppingCart, value: items.length, label: t('groceryList.items'), bg: 'bg-primary/8', border: 'border-primary/15', iconColor: 'text-primary', valueColor: 'text-primary' },
            { icon: CheckCircle2, value: checkedCount, label: t('groceryList.done'), bg: 'bg-[hsl(var(--success-soft))]', border: 'border-[hsl(var(--success-ring))]/40', iconColor: 'text-done', valueColor: 'text-done' },
            { icon: Target, value: `${Math.round((nutrition.folate + nutrition.iron + nutrition.calcium) / 3)}%`, label: t('groceryList.score'), bg: 'bg-amber-500/8', border: 'border-amber-500/15', iconColor: 'text-amber-600', valueColor: 'text-amber-600' },
            { icon: Leaf, value: items.filter(i => i.pregnancyBenefitKey).length, label: t('groceryList.super'), bg: 'bg-violet-500/8', border: 'border-violet-500/15', iconColor: 'text-violet-600', valueColor: 'text-violet-600' },
          ].map((stat, i) => (
            <Card key={i} className={`${stat.bg} ${stat.border}`}>
              <CardContent className="p-2.5 text-center">
                <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.iconColor}`} />
                <p className={`text-base font-bold ${stat.valueColor}`}>{stat.value}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="list" className="gap-1.5 text-xs">
              <ShoppingCart className="w-3.5 h-3.5" />
              {t('groceryList.list')}
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              {t('groceryList.analysis')}
            </TabsTrigger>
            <TabsTrigger value="planner" className="gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              {t('groceryList.planner')}
            </TabsTrigger>
          </TabsList>

          {/* Shopping List Tab */}
          <TabsContent value="list" className="space-y-3 mt-3">
            {/* Add Item */}
            <div className="flex gap-2">
              <Input
                placeholder={t('groceryList.addItem')}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                className="flex-1 h-10 text-sm"
              />
              <Button onClick={addItem} size="sm" className="shrink-0 h-10 w-10 p-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              <div className="flex-1">
                <Progress 
                  value={items.length > 0 ? (checkedCount / items.length) * 100 : 0} 
                  className="h-2"
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {checkedCount}/{items.length}
              </span>
              {checkedCount > 0 && (
                <button 
                  onClick={clearChecked}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  {t('groceryList.clear')}
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'produce', 'dairy', 'protein', 'grains', 'other'] as const).map(cat => {
                const count = cat === 'all' ? items.length : items.filter(i => i.category === cat).length;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`h-9 rounded-lg text-xs font-medium transition-all text-center ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted border border-border/40'
                    }`}
                  >
                    {t(`groceryList.categories.${cat}`)}
                    <span className={`ms-1 text-[10px] ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Items List */}
            <Card>
              <CardHeader className="py-2.5 px-3">
                <CardTitle className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                    {t('groceryList.yourList')}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {filteredItems.length} {t('groceryList.items')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground">{t('groceryList.noItems')}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {filteredItems.map(item => {
                      const CatIcon = categoryIcons[item.category];
                      return (
                        <div 
                          key={item.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            item.isChecked 
                              ? 'bg-muted/30 border-border/30' 
                              : 'border-border/50 hover:border-primary/20 hover:bg-muted/20'
                          }`}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleItem(item.id)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                              item.isChecked 
                                ? 'bg-primary border-primary' 
                                : 'border-muted-foreground/40 hover:border-primary'
                            }`}
                          >
                            {item.isChecked && <Check className="w-3 h-3 text-primary-foreground" />}
                          </button>

                          {/* Category Icon */}
                          <div className={`w-8 h-8 rounded-lg ${categoryBg[item.category]} flex items-center justify-center shrink-0`}>
                            <CatIcon className={`w-4 h-4 ${categoryText[item.category]}`} />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <span className={`block text-sm font-medium leading-tight ${item.isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {item.nameKey ? t(item.nameKey) : item.name}
                            </span>
                            {(item.pregnancyBenefitKey || item.pregnancyBenefit) && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                {item.pregnancyBenefitKey ? t(item.pregnancyBenefitKey) : item.pregnancyBenefit}
                              </p>
                            )}
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommended Superfoods */}
            {notInList.length > 0 && (
              <Card>
                <CardHeader className="py-2.5 px-3">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {t('groceryList.recommendedSuperfoods')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    {notInList.slice(0, 8).map(item => {
                      const CatIcon = categoryIcons[item.category];
                      return (
                        <button
                          key={item.id}
                          onClick={() => addSuggested(item)}
                          className="flex items-center gap-2 p-2 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-start"
                        >
                          <div className={`w-7 h-7 rounded-md ${categoryBg[item.category]} flex items-center justify-center shrink-0`}>
                            <CatIcon className={`w-3.5 h-3.5 ${categoryText[item.category]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground">
                              {item.nameKey ? t(item.nameKey) : item.name}
                            </p>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Nutrition Analysis Tab */}
          <TabsContent value="nutrition" className="space-y-3 mt-3">
            <Card>
              <CardHeader className="py-2.5 px-3">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  {t('groceryList.dailyNutritionGoals')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 space-y-3">
                {nutritionGoals.map((goal) => {
                  const GoalIcon = goal.icon;
                  const percentage = Math.min((goal.current / goal.target) * 100, 100);
                  return (
                    <div key={goal.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
                            <GoalIcon className="w-3.5 h-3.5" style={{ color: goal.color }} />
                          </div>
                          <span className="text-xs font-medium">{goal.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: goal.color }}>
                          {goal.current}%
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardHeader className="py-2.5 px-3">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" />
                    {t('groceryList.categoriesChart')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  {categoryData.length > 0 ? (
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3} dataKey="value">
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px', padding: '6px 10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-36 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-muted-foreground/20" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2.5 px-3">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    {t('groceryList.nutrientsChart')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nutritionChartData} layout="vertical">
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                        <Bar dataKey="current" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <AIInsightCard
              title={t('toolsInternal.aiInsights.nutritionAnalysis')}
              prompt={`Analyze this pregnancy grocery list for week ${currentWeek} and provide personalized nutrition advice:
Items: ${items.map(i => i.nameKey ? t(i.nameKey) : i.name).join(', ')}
Current nutrition coverage: Protein: ${nutrition.protein}%, Iron: ${nutrition.iron}%, Folate: ${nutrition.folate}%, Calcium: ${nutrition.calcium}%, Omega-3: ${nutrition.omega3}%
Provide: 1. Overall nutrition score 2. Missing nutrients and foods to add 3. Week ${currentWeek} recommendations 4. Meal combination suggestions`}
              buttonText="Analyze"
              section="nutrition"
              toolType="grocery-list"
              context={{ week: currentWeek, trimester: currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3 }}
            />
          </TabsContent>

          {/* Weekly Planner Tab */}
          <TabsContent value="planner" className="space-y-3 mt-3">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
              <WeekSlider week={currentWeek} onChange={setCurrentWeek} label="" showTrimester />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                {t('groceryList.weekFocus', { week: currentWeek })}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(weeklyRecommendations[String(currentWeek % 3 + 1)] || weeklyRecommendations['1']).map((rec, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs py-1 px-2.5 bg-background">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-primary" />
                    {rec}
                  </Badge>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader className="py-2.5 px-3">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <ChefHat className="w-3.5 h-3.5 text-primary" />
                  {t('groceryList.dailyMealIdeas')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 space-y-2">
                {[
                  { meal: t('groceryList.meals.breakfast'), icon: Clock, suggestion: t('groceryList.mealSuggestions.breakfast'), bg: 'bg-amber-500/10', text: 'text-amber-600' },
                  { meal: t('groceryList.meals.lunch'), icon: Flame, suggestion: t('groceryList.mealSuggestions.lunch'), bg: 'bg-green-500/10', text: 'text-green-600' },
                  { meal: t('groceryList.meals.dinner'), icon: Heart, suggestion: t('groceryList.mealSuggestions.dinner'), bg: 'bg-primary/10', text: 'text-primary' },
                  { meal: t('groceryList.meals.snacks'), icon: Zap, suggestion: t('groceryList.mealSuggestions.snacks'), bg: 'bg-violet-500/10', text: 'text-violet-600' },
                ].map((item) => {
                  const MealIcon = item.icon;
                  return (
                    <div key={item.meal} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                        <MealIcon className={`w-4 h-4 ${item.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{item.meal}</p>
                        <p className="text-[11px] text-muted-foreground">{item.suggestion}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <AIInsightCard
              title={t('groceryList.aiWeeklyMealPlan')}
              prompt={`Create a personalized weekly meal plan for pregnancy week ${currentWeek} using these available groceries:
Items: ${items.map(i => i.nameKey ? t(i.nameKey) : i.name).join(', ')}
Provide a structured 7-day meal plan with breakfast, lunch, dinner, and snacks.`}
              buttonText="Generate Plan"
              section="nutrition"
              toolType="grocery-list"
              context={{ week: currentWeek, trimester: currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3 }}
            />

            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newItems = suggestedItems.filter(
                    item => !items.find(i => (i.nameKey ? t(i.nameKey) : i.name) === (item.nameKey ? t(item.nameKey) : item.name))
                  ).map(item => ({ ...item, id: Date.now().toString() + item.id }));
                  if (newItems.length > 0) {
                    setItems(prev => [...prev, ...newItems]);
                    toast.success(t('groceryList.superfoodsAdded', { count: newItems.length }));
                  } else {
                    toast.info(t('groceryList.allSuperfoodsInList'));
                  }
                }}
                className="gap-1.5 h-8 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('groceryList.addAllSuperfoods')}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setItems(suggestedItems.map(i => ({ ...i, id: Date.now().toString() + i.id, isChecked: false })))}
                className="gap-1.5 h-8 px-3 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('groceryList.reset')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

      </div>
      <WhatsAppShareButton
        onClick={() => {
          const shareItems = items.map(i => ({
            name: i.name || (i.nameKey ? t(i.nameKey) : ''),
            done: i.isChecked,
          }));
          const text = formatChecklistShare(
            { title: t('groceryList.title'), emoji: '🛒' },
            shareItems
          );
          openWhatsApp(text);
        }}
        className="!fixed bottom-20 end-4 z-40 shadow-xl"
      />
    </ToolFrame>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ToolFrame } from '@/components/ToolFrame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, ChevronDown, ChevronUp, Archive, Trash2, Clock, Loader2, AlertCircle, CheckCircle2, Heart, Shield, Baby, Sparkles } from 'lucide-react';
import { useSmartInsight } from '@/hooks/useSmartInsight';
import { AIActionButton } from '@/components/ai/AIActionButton';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { AIResponseFrame } from '@/components/ai/AIResponseFrame';
import { safeParseLocalStorage, safeSaveToLocalStorage } from '@/lib/safeStorage';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PrintableReport } from '@/components/PrintableReport';
import { Progress } from '@/components/ui/progress';
import { ToolHubNav, BIRTH_HUB_TABS } from '@/components/ToolHubNav';

const MAX_SAVED_PLANS = 9;

interface BirthPlanPreference {
  id: string;
  labelKey: string;
  optionKeys: string[];
}

interface SavedPlan {
  id: string;
  date: string;
  preferences: Record<string, string>;
  notes: string;
  generatedPlan: string;
}

const CATEGORY_ICONS = [Heart, Shield, Baby, Sparkles];
const CATEGORY_GRADIENTS = [
  "from-pink-500 to-rose-400",
  "from-blue-500 to-indigo-400",
  "from-purple-500 to-violet-400",
  "from-amber-500 to-orange-400",
];
const CATEGORY_COLORS = [
  "text-pink-600 dark:text-pink-400",
  "text-blue-600 dark:text-blue-400",
  "text-purple-600 dark:text-purple-400",
  "text-amber-600 dark:text-amber-400",
];

const birthPlanCategories: { titleKey: string; preferences: BirthPlanPreference[] }[] = [
  {
    titleKey: "toolsInternal.birthPlan.categories.laborEnvironment",
    preferences: [
      { id: "lighting", labelKey: "toolsInternal.birthPlan.prefs.lighting.label", optionKeys: ["toolsInternal.birthPlan.prefs.lighting.dim", "toolsInternal.birthPlan.prefs.lighting.natural", "toolsInternal.birthPlan.prefs.lighting.bright", "toolsInternal.birthPlan.prefs.lighting.noPreference"] },
      { id: "music", labelKey: "toolsInternal.birthPlan.prefs.music.label", optionKeys: ["toolsInternal.birthPlan.prefs.music.relaxing", "toolsInternal.birthPlan.prefs.music.nature", "toolsInternal.birthPlan.prefs.music.silence", "toolsInternal.birthPlan.prefs.music.ownPlaylist"] },
      { id: "movement", labelKey: "toolsInternal.birthPlan.prefs.movement.label", optionKeys: ["toolsInternal.birthPlan.prefs.movement.walk", "toolsInternal.birthPlan.prefs.movement.ball", "toolsInternal.birthPlan.prefs.movement.shower", "toolsInternal.birthPlan.prefs.movement.bedRest"] },
    ]
  },
  {
    titleKey: "toolsInternal.birthPlan.categories.painManagement",
    preferences: [
      { id: "painRelief", labelKey: "toolsInternal.birthPlan.prefs.painRelief.label", optionKeys: ["toolsInternal.birthPlan.prefs.painRelief.natural", "toolsInternal.birthPlan.prefs.painRelief.epidural", "toolsInternal.birthPlan.prefs.painRelief.iv", "toolsInternal.birthPlan.prefs.painRelief.openToAll"] },
      { id: "laborSupport", labelKey: "toolsInternal.birthPlan.prefs.laborSupport.label", optionKeys: ["toolsInternal.birthPlan.prefs.laborSupport.partner", "toolsInternal.birthPlan.prefs.laborSupport.doula", "toolsInternal.birthPlan.prefs.laborSupport.family", "toolsInternal.birthPlan.prefs.laborSupport.medical"] },
      { id: "relaxation", labelKey: "toolsInternal.birthPlan.prefs.relaxation.label", optionKeys: ["toolsInternal.birthPlan.prefs.relaxation.breathing", "toolsInternal.birthPlan.prefs.relaxation.massage", "toolsInternal.birthPlan.prefs.relaxation.aromatherapy", "toolsInternal.birthPlan.prefs.relaxation.hypnobirthing"] },
    ]
  },
  {
    titleKey: "toolsInternal.birthPlan.categories.deliveryPreferences",
    preferences: [
      { id: "birthPosition", labelKey: "toolsInternal.birthPlan.prefs.birthPosition.label", optionKeys: ["toolsInternal.birthPlan.prefs.birthPosition.natural", "toolsInternal.birthPlan.prefs.birthPosition.squatting", "toolsInternal.birthPlan.prefs.birthPosition.sideLying", "toolsInternal.birthPlan.prefs.birthPosition.supine"] },
      { id: "pushing", labelKey: "toolsInternal.birthPlan.prefs.pushing.label", optionKeys: ["toolsInternal.birthPlan.prefs.pushing.coached", "toolsInternal.birthPlan.prefs.pushing.spontaneous", "toolsInternal.birthPlan.prefs.pushing.noPreference"] },
      { id: "episiotomy", labelKey: "toolsInternal.birthPlan.prefs.episiotomy.label", optionKeys: ["toolsInternal.birthPlan.prefs.episiotomy.avoid", "toolsInternal.birthPlan.prefs.episiotomy.ifNecessary", "toolsInternal.birthPlan.prefs.episiotomy.noPreference"] },
    ]
  },
  {
    titleKey: "toolsInternal.birthPlan.categories.afterBirth",
    preferences: [
      { id: "firstMoments", labelKey: "toolsInternal.birthPlan.prefs.firstMoments.label", optionKeys: ["toolsInternal.birthPlan.prefs.firstMoments.immediately", "toolsInternal.birthPlan.prefs.firstMoments.afterChecks", "toolsInternal.birthPlan.prefs.firstMoments.partnerFirst"] },
      { id: "cordClamping", labelKey: "toolsInternal.birthPlan.prefs.cordClamping.label", optionKeys: ["toolsInternal.birthPlan.prefs.cordClamping.delayed", "toolsInternal.birthPlan.prefs.cordClamping.immediate", "toolsInternal.birthPlan.prefs.cordClamping.partnerCut", "toolsInternal.birthPlan.prefs.cordClamping.noPreference"] },
      { id: "feeding", labelKey: "toolsInternal.birthPlan.prefs.feeding.label", optionKeys: ["toolsInternal.birthPlan.prefs.feeding.breastfeeding", "toolsInternal.birthPlan.prefs.feeding.formula", "toolsInternal.birthPlan.prefs.feeding.combination", "toolsInternal.birthPlan.prefs.feeding.undecided"] },
    ]
  },
];

export default function AIBirthPlanGenerator() {
  const { t, i18n } = useTranslation();
  const [preferences, setPreferences] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([birthPlanCategories[0].titleKey]));
  const [showArchive, setShowArchive] = useState(false);
  const { generate, isLoading, error, content: streamedContent, reset } = useSmartInsight({
    section: 'pregnancy-plan',
    toolType: 'birth-plan',
  });
  const isInitialized = useRef(false);

  const totalPrefs = birthPlanCategories.reduce((sum, c) => sum + c.preferences.length, 0);
  const filledPrefs = Object.keys(preferences).filter(k => preferences[k]).length;
  const completionPct = Math.round((filledPrefs / totalPrefs) * 100);

  useEffect(() => {
    const saved = safeParseLocalStorage<SavedPlan[]>('birthPlans', [], (data): data is SavedPlan[] => Array.isArray(data));
    setSavedPlans(saved);
    isInitialized.current = true;
  }, []);

  useEffect(() => {
    if (isInitialized.current && savedPlans.length > 0) {
      safeSaveToLocalStorage('birthPlans', savedPlans);
    }
  }, [savedPlans]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) newSet.delete(title); else newSet.add(title);
      return newSet;
    });
  };

  const handlePreferenceChange = (id: string, value: string) => {
    setPreferences(prev => ({ ...prev, [id]: value }));
  };

  const generatePlan = useCallback(async () => {
    const selectedPrefs = Object.entries(preferences)
      .filter(([_, value]) => value)
      .map(([key, value]) => {
        const allPrefs = birthPlanCategories.flatMap(c => c.preferences);
        const pref = allPrefs.find(p => p.id === key);
        return `${pref ? t(pref.labelKey) : key}: ${value}`;
      })
      .join('\n');

    if (!selectedPrefs) { toast.error(t('toolsInternal.birthPlan.selectPreference')); return; }
    setGeneratedPlan('');
    const langCode = i18n.language?.split('-')[0] || 'en';
    const langNames: Record<string, string> = { en: 'English', ar: 'Arabic', de: 'German', tr: 'Turkish', fr: 'French', es: 'Spanish', pt: 'Portuguese' };

    const prompt = `IMPORTANT: Write ENTIRE response in ${langNames[langCode] || 'English'}.\nCreate a comprehensive birth plan:\n${selectedPrefs}\n${additionalNotes ? `Notes: ${additionalNotes}` : ''}\nInclude introduction, organized sections, backup plans, and a flexibility note.`;

    await generate({
      prompt,
      onDelta: (text) => setGeneratedPlan(prev => prev + text),
    });
    toast.success(t('toolsInternal.birthPlan.planGenerated'));
  }, [preferences, additionalNotes, generate, t, i18n.language]);

  const savePlan = useCallback(() => {
    if (!generatedPlan) { toast.error(t('toolsInternal.birthPlan.selectPreference')); return; }
    if (savedPlans.length >= MAX_SAVED_PLANS) { toast.error(t('toolsInternal.birthPlan.storageFull')); return; }
    const newPlan: SavedPlan = { id: `plan-${Date.now()}`, date: new Date().toISOString(), preferences, notes: additionalNotes, generatedPlan };
    setSavedPlans(prev => [newPlan, ...prev]);
    toast.success(t('toolsInternal.birthPlan.planSaved'));
  }, [generatedPlan, preferences, additionalNotes, savedPlans.length, t]);

  const deletePlan = useCallback((id: string) => {
    setSavedPlans(prev => prev.filter(p => p.id !== id));
    toast.success(t('toolsInternal.birthPlan.planDeleted'));
  }, [t]);

  const loadPlan = useCallback((plan: SavedPlan) => {
    setPreferences(plan.preferences);
    setAdditionalNotes(plan.notes);
    setGeneratedPlan(plan.generatedPlan);
    setShowArchive(false);
    toast.success(t('toolsInternal.birthPlan.planLoaded'));
  }, [t]);

  return (
    <ToolFrame title={t('toolsInternal.birthPlan.title')} subtitle={t('toolsInternal.birthPlan.subtitle')} icon={FileText} mood="nurturing" toolId="ai-birth-plan">
      <ToolHubNav tabs={BIRTH_HUB_TABS} />
      <div className="space-y-4">
        {/* ═══════ PROGRESS HERO ═══════ */}
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-pink-500 via-purple-400 to-blue-500" />
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                {t('toolsInternal.birthPlan.title')}
              </h3>
              <Badge variant="outline" className="text-[10px] tabular-nums">
                {filledPrefs}/{totalPrefs}
              </Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500"
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {t('toolsInternal.birthPlan.preferencesSet', { count: filledPrefs })}
            </p>
          </CardContent>
        </Card>

        {/* ═══════ CATEGORY SECTIONS ═══════ */}
        {birthPlanCategories.map((category, catIdx) => {
          const isExpanded = expandedSections.has(category.titleKey);
          const CatIcon = CATEGORY_ICONS[catIdx];
          const gradient = CATEGORY_GRADIENTS[catIdx];
          const color = CATEGORY_COLORS[catIdx];
          const catFilled = category.preferences.filter(p => preferences[p.id]).length;

          return (
            <Card key={category.titleKey} className="overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${gradient}`} />
              <CardContent className="p-0">
                <button onClick={() => toggleSection(category.titleKey)} className="w-full p-3 flex items-center justify-between text-start">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                      <CatIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-[13px] font-bold ${color}`}>{t(category.titleKey)}</h3>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {catFilled}/{category.preferences.length} {t('toolsInternal.birthPlan.selected', 'selected')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {catFilled === category.preferences.length && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-4">
                        {category.preferences.map((pref) => (
                          <div key={pref.id}>
                            <label className="text-xs font-semibold text-foreground mb-2 block">{t(pref.labelKey)}</label>
                            <div className="flex flex-wrap gap-1.5">
                              {pref.optionKeys.map((optionKey) => {
                                const optionValue = t(optionKey);
                                const isSelected = preferences[pref.id] === optionValue;
                                return (
                                  <button
                                    key={optionKey}
                                    onClick={() => handlePreferenceChange(pref.id, optionValue)}
                                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-xl border transition-all ${
                                      isSelected
                                        ? `bg-gradient-to-br ${gradient} text-white border-transparent shadow-sm`
                                        : 'bg-card border-border/40 text-muted-foreground hover:border-border/80 hover:bg-muted/30'
                                    }`}
                                  >
                                    {isSelected && <CheckCircle2 className="w-3 h-3 inline me-1" />}
                                    {optionValue}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}

        {/* ═══════ ADDITIONAL NOTES ═══════ */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <label className="text-xs font-semibold text-foreground mb-2 block">{t('toolsInternal.birthPlan.additionalNotes')}</label>
            <Textarea placeholder={t('toolsInternal.birthPlan.notesPlaceholder')} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={3} className="text-sm" />
          </CardContent>
        </Card>

        {/* ═══════ GENERATE BUTTON ═══════ */}
        <AIActionButton
          onClick={generatePlan}
          isLoading={isLoading}
          label={t('toolsInternal.birthPlan.generateButton')}
          loadingLabel={t('toolsInternal.birthPlan.generating')}
          toolType="birth-plan"
          section="pregnancy-plan"
        />

        {error && <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-3 text-destructive text-xs">{error}</CardContent></Card>}

        {/* ═══════ GENERATED PLAN ═══════ */}
        {generatedPlan && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={savePlan} disabled={savedPlans.length >= MAX_SAVED_PLANS} className="text-xs">
              {t('common.save')}
            </Button>
            <PrintableReport title={t('toolsInternal.birthPlan.title')} isLoading={isLoading}>
              <AIResponseFrame
                content={generatedPlan}
                title={t('toolsInternal.birthPlan.yourBirthPlan')}
                icon={FileText}
                toolId="ai-birth-plan"
              />
            </PrintableReport>
          </div>
        )}

        {/* ═══════ SAVED PLANS ARCHIVE ═══════ */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <button onClick={() => setShowArchive(!showArchive)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-foreground">{t('toolsInternal.birthPlan.savedPlans', { count: savedPlans.length, max: MAX_SAVED_PLANS })}</h3>
                </div>
              </div>
              {showArchive ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-muted-foreground"
                  animate={{ width: `${(savedPlans.length / MAX_SAVED_PLANS) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              {savedPlans.length >= MAX_SAVED_PLANS && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{t('toolsInternal.birthPlan.storageFull')}</p>
              )}
            </div>
            <AnimatePresence>
              {showArchive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {savedPlans.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('toolsInternal.birthPlan.noSavedPlans')}</p>
                    ) : (
                      savedPlans.map((plan) => (
                        <Card key={plan.id} className="bg-muted/30">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">{t('toolsInternal.birthPlan.planTitle')} - {format(new Date(plan.date), 'MMM d, yyyy')}</p>
                                <p className="text-[10px] text-muted-foreground">{t('toolsInternal.birthPlan.preferencesSet', { count: Object.keys(plan.preferences).length })}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => loadPlan(plan)} className="text-xs h-7">{t('toolsInternal.birthPlan.load')}</Button>
                              <Button size="sm" variant="ghost" onClick={() => deletePlan(plan.id)} className="h-7"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </ToolFrame>
  );
}

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { emitDataChange } from "@/lib/dataBus";
import { useTranslation } from 'react-i18next';
import { Gauge, Plus, Trash2, TrendingUp, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ToolFrame } from '@/components/ToolFrame';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { AIInsightCard } from '@/components/ai/AIInsightCard';

// Advanced sub-components
import { WeeklySummaryHero } from '@/components/weight-gain/WeeklySummaryHero';
import { WeightGainChart } from '@/components/weight-gain/WeightGainChart';
import { BMIScaleBar } from '@/components/weight-gain/BMIScaleBar';
import { WeeklyRateGauge } from '@/components/weight-gain/WeeklyRateGauge';
import { WeeklyGoalCard } from '@/components/weight-gain/WeeklyGoalCard';
import { TrimesterComparison } from '@/components/weight-gain/TrimesterComparison';
import { WeightDistributionCard } from '@/components/weight-gain/WeightDistributionCard';
import { MedicalTipCard } from '@/components/weight-gain/MedicalTipCard';
import { ToolEmptyState } from '@/components/tools/ToolEmptyState';

// ═══════════════════════════════════════════════════════════════
// Types & Storage
// ═══════════════════════════════════════════════════════════════
interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  week: number;
}

const STORAGE_KEY = 'weight_gain_entries';

function loadEntries(): WeightEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Migrate legacy entries that used `weightKg` instead of `weight`
    return parsed.map((e: any) => ({
      ...e,
      weight: e.weight ?? e.weightKg ?? 0,
    }));
  } catch {
    return [];
  }
}

function saveEntries(entries: WeightEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  emitDataChange(STORAGE_KEY);
}

// ═══════════════════════════════════════════════════════════════
// IOM Weight Gain Guidelines (by pre-pregnancy BMI)
// ═══════════════════════════════════════════════════════════════
function getExpectedGainForWeek(week: number, bmiCategory: string): { min: number; max: number } {
  // Total expected gain ranges (kg) by BMI category
  const totalRanges: Record<string, { min: number; max: number }> = {
    underweight: { min: 12.5, max: 18.0 },
    normal:      { min: 11.5, max: 16.0 },
    overweight:  { min: 7.0,  max: 11.5 },
    obese:       { min: 5.0,  max: 9.0  },
  };
  const range = totalRanges[bmiCategory] || totalRanges.normal;
  
  // Linear interpolation — first trimester ~0.5-2kg, rest is linear
  if (week <= 13) {
    const firstTriMax = 2.0;
    const ratio = week / 13;
    return { min: ratio * 0.5, max: ratio * firstTriMax };
  }
  const remainingWeeks = 42 - 13;
  const weeksBeyondFirst = week - 13;
  const firstTriGainMin = 0.5;
  const firstTriGainMax = 2.0;
  return {
    min: firstTriGainMin + ((range.min - firstTriGainMin) / remainingWeeks) * weeksBeyondFirst,
    max: firstTriGainMax + ((range.max - firstTriGainMax) / remainingWeeks) * weeksBeyondFirst,
  };
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

function getCurrentTrimester(week: number): 'first' | 'second' | 'third' {
  if (week <= 13) return 'first';
  if (week <= 26) return 'second';
  return 'third';
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
const SmartWeightGainAnalyzer: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<number>(profile.pregnancyWeek || 20);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    if (profile.pregnancyWeek) setSelectedWeek(profile.pregnancyWeek);
  }, [profile.pregnancyWeek]);

  const currentWeek = selectedWeek;
  const heightCm = profile.height || 165;
  const prePregnancyWeight = profile.prePregnancyWeight || 60;
  const heightM = heightCm / 100;
  const bmi = prePregnancyWeight / (heightM * heightM);
  const bmiCategory = getBMICategory(bmi);
  const trimester = getCurrentTrimester(currentWeek);

  // Check if selected week already has an entry
  const weekHasEntry = entries.some(e => e.week === selectedWeek);

  // ── Add / Delete entries ──
  const addEntry = useCallback(() => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0 || weight > 300) {
      toast({ title: t('common.error'), description: t('toolsInternal.weightGain.invalidWeight', 'Invalid weight'), variant: 'destructive' });
      return;
    }
    const entry: WeightEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      weight,
      week: selectedWeek,
    };
    // Replace existing entry for same week or add new
    const filtered = entries.filter(e => e.week !== selectedWeek);
    const updated = [...filtered, entry];
    setEntries(updated);
    saveEntries(updated);
    setNewWeight('');
    toast({ title: t('toolsInternal.weightGain.added') });
  }, [newWeight, entries, selectedWeek, toast, t]);

  const deleteEntry = useCallback((id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  }, [entries]);

  // ── Computed analysis ──
  const analysis = useMemo(() => {
    if (entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
    const totalGain = latest.weight - prePregnancyWeight;
    
    // Weekly rate
    let weeklyRate: number | null = null;
    if (sorted.length >= 2) {
      const first = sorted[0];
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeks = Math.max((new Date(latest.date).getTime() - new Date(first.date).getTime()) / msPerWeek, 0.1);
      weeklyRate = (latest.weight - first.weight) / weeks;
    }

    const expected = getExpectedGainForWeek(currentWeek, bmiCategory);
    const status: 'below' | 'above' | 'normal' | null = 
      totalGain < expected.min ? 'below' : totalGain > expected.max ? 'above' : 'normal';

    return {
      latestWeight: latest.weight,
      previousWeight: previous?.weight ?? null,
      totalGain,
      weeklyRate,
      status,
      targetMin: expected.min,
      targetMax: expected.max,
    };
  }, [entries, prePregnancyWeight, currentWeek, bmiCategory]);

  // ── Current BMI (based on latest weight) ──
  const currentBmi = useMemo(() => {
    if (analysis) return analysis.latestWeight / (heightM * heightM);
    return bmi;
  }, [analysis, heightM, bmi]);

  // ── Chart data (weeks 4-42) ──
  const chartData = useMemo(() => {
    const data: { week: number; min: number; max: number; actual: number | null }[] = [];
    for (let w = 4; w <= 42; w += 2) {
      const expected = getExpectedGainForWeek(w, bmiCategory);
      const weekEntry = entries.find(e => e.week === w);
      data.push({
        week: w,
        min: parseFloat(expected.min.toFixed(1)),
        max: parseFloat(expected.max.toFixed(1)),
        actual: weekEntry ? parseFloat((weekEntry.weight - prePregnancyWeight).toFixed(1)) : null,
      });
    }
    return data;
  }, [entries, prePregnancyWeight, bmiCategory]);

  // ── Healthy rate range based on BMI ──
  const healthyRateRange = useMemo(() => {
    if (currentWeek <= 13) return { min: 0.04, max: 0.15 };
    const ranges: Record<string, { min: number; max: number }> = {
      underweight: { min: 0.44, max: 0.58 },
      normal: { min: 0.35, max: 0.50 },
      overweight: { min: 0.23, max: 0.33 },
      obese: { min: 0.17, max: 0.27 },
    };
    return ranges[bmiCategory] || ranges.normal;
  }, [currentWeek, bmiCategory]);

  // ── AI prompt context ──
  const aiPrompt = useMemo(() => {
    if (!analysis) return '';
    return `Analyze pregnancy weight gain data:
- Week: ${currentWeek}, Trimester: ${trimester}
- Pre-pregnancy weight: ${prePregnancyWeight}kg, BMI: ${bmi.toFixed(1)} (${bmiCategory})
- Current weight: ${analysis.latestWeight}kg, Total gain: ${analysis.totalGain.toFixed(1)}kg
- Weekly rate: ${analysis.weeklyRate?.toFixed(2) ?? 'N/A'} kg/week
- Expected range: ${analysis.targetMin.toFixed(1)}–${analysis.targetMax.toFixed(1)}kg
- Status: ${analysis.status}
- Entries: ${entries.length}

Provide personalized advice with: 1) Assessment 2) Nutritional tips 3) Exercise recommendations 4) Weekly targets 5) When to consult doctor.`;
  }, [analysis, currentWeek, trimester, prePregnancyWeight, bmi, bmiCategory, entries.length]);

  return (
    <ToolFrame
      toolId="weight-gain"
      title={t('tools.weightGain.title', 'Weight Wellness Guide')}
      subtitle={t('tools.weightGain.subtitle', 'Track and analyze your pregnancy weight gain')}
      icon={Gauge}
    >
      <div className="space-y-4">
        {/* ① تسجيل الوزن — الإجراء الأساسي أولاً */}
        <Card className="overflow-hidden border-primary/20">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 pb-3 rtl:bg-gradient-to-l">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-primary" />
              </div>
              {t('toolsInternal.weightGain.addWeightEntry', 'Log Your Weight')}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 ms-10">
              {t('toolsInternal.weightGain.addWeightDesc', 'Select your week and log your current weight')}
            </p>
          </div>
          <CardContent className="p-4 pt-3 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-muted-foreground">
                  {t('toolsInternal.weightGain.pregnancyWeek', 'Pregnancy Week')}
                </label>
                <span className="text-xs font-medium text-muted-foreground">
                  {selectedWeek <= 13
                    ? t('toolsInternal.weightGain.trimester1', 'First Trimester')
                    : selectedWeek <= 26
                    ? t('toolsInternal.weightGain.trimester2', 'Second Trimester')
                    : t('toolsInternal.weightGain.trimester3', 'Third Trimester')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-primary tabular-nums leading-none min-w-[2.5rem] text-center">{selectedWeek}</span>
                <div className="flex-1">
                  <Slider
                    value={[selectedWeek]}
                    onValueChange={([v]) => setSelectedWeek(v)}
                    min={4}
                    max={42}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums">4</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">42</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-border/40" />
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-2.5 block">
                {t('toolsInternal.weightGain.currentWeightKg', 'Current Weight (kg)')}
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  placeholder={t('toolsInternal.weightGain.weightPlaceholder', 'Weight in kg')}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addEntry()}
                  className="text-base font-bold h-12"
                />
                <Button onClick={addEntry} className="h-12 px-5 gap-2 text-sm font-bold">
                  {weekHasEntry ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {weekHasEntry
                    ? t('toolsInternal.weightGain.updateEntry', 'Update')
                    : t('toolsInternal.weightGain.addEntryFull', 'Log Weight')}
                </Button>
              </div>
              {weekHasEntry && (
                <p className="text-xs text-primary/80 mt-2 font-semibold">
                  {t('toolsInternal.weightGain.weekAlreadyLogged', 'This week already has an entry — it will be updated')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ② ملخص الأسبوع — يظهر بعد أول إدخال */}
        {analysis && (
          <WeeklySummaryHero
            currentWeek={currentWeek}
            latestWeight={analysis.latestWeight}
            previousWeight={analysis.previousWeight}
            totalGain={analysis.totalGain}
            targetMin={analysis.targetMin}
            targetMax={analysis.targetMax}
            status={analysis.status}
            t={t}
          />
        )}

        {/* ③ مؤشر كتلة الجسم */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-bold text-muted-foreground mb-1">{t('toolsInternal.weightGain.bmiTitle', 'Body Mass Index')}</h3>
            <p className="text-[10px] text-muted-foreground/70 mb-3">
              {t('toolsInternal.weightGain.bmiDesc', 'Your BMI helps determine healthy weight gain targets')}
            </p>
            <BMIScaleBar bmi={analysis ? currentBmi : bmi} t={t} />
            {analysis && Math.abs(currentBmi - bmi) > 0.5 && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {t('toolsInternal.weightGain.bmiPrePregnancy', 'Pre-pregnancy BMI')}: {bmi.toFixed(1)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ④ الرسم البياني */}
        {entries.length >= 1 && (
          <WeightGainChart chartData={chartData} t={t} />
        )}

        {/* ⑤ معدل الأسبوعي */}
        {analysis?.weeklyRate !== null && analysis?.weeklyRate !== undefined && (
          <WeeklyRateGauge
            rate={analysis.weeklyRate}
            healthyMin={healthyRateRange.min}
            healthyMax={healthyRateRange.max}
            t={t}
          />
        )}

        {/* ⑥ هدف الأسبوع القادم */}
        {analysis && (
          <WeeklyGoalCard
            currentWeek={currentWeek}
            currentWeight={analysis.latestWeight}
            prePregnancyWeight={prePregnancyWeight}
            getExpectedGainForWeek={(w) => getExpectedGainForWeek(w, bmiCategory)}
            t={t}
          />
        )}

        {/* ⑦ مقارنة الثلاثات */}
        {entries.length >= 1 && (
          <TrimesterComparison
            entries={entries}
            prePregnancyWeight={prePregnancyWeight}
            currentTrimester={trimester}
            t={t}
          />
        )}

        {/* ⑧ توزيع الوزن */}
        <WeightDistributionCard t={t} />

        {/* ⑨ نصيحة طبية */}
        <MedicalTipCard trimester={trimester} t={t} />

        {/* ⑩ تحليل ذكي */}
        {analysis && (
          <AIInsightCard
            title={t('toolsInternal.weightGain.aiAnalysis', 'AI Weight Analysis')}
            prompt={aiPrompt}
            toolType="weight-analysis"
            section="weight"
            context={{ week: currentWeek }}
          />
        )}

        {/* ⑪ سجل القراءات */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('toolsInternal.weightGain.history', 'History')}
              {entries.length > 0 && <span className="text-muted-foreground font-normal ms-2">({entries.length})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <ToolEmptyState
                icon={Gauge}
                title={t('tools.empty.weight.title')}
                description={t('tools.empty.weight.desc')}
                ctaLabel={t('tools.empty.weight.cta')}
                ctaDirection="up"
                onCta={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...entries].sort((a, b) => b.week - a.week).map(entry => (
                  <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                    <div>
                      <span className="font-semibold text-foreground">{entry.weight} kg</span>
                      <span className="text-xs text-muted-foreground ms-2">
                        {t('toolsInternal.weightGain.week', 'Week')} {entry.week}
                      </span>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolFrame>
  );
};

export default SmartWeightGainAnalyzer;

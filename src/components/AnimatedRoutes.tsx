import { Routes, Route, Navigate } from "react-router-dom";
import { PageTransition } from "./PageTransition";
import { Suspense, lazy, useState, useEffect } from "react";
import { PageSkeleton } from "./PageSkeleton";

/**
 * Returns null while splash video is active (initial load),
 * then shows PageSkeleton for internal navigation transitions.
 */
/**
 * During initial app load: returns null (the HTML splash overlay covers everything).
 * On subsequent lazy-load navigations: shows PageSkeleton (logo + dots).
 * 
 * Key insight: We never show PageSkeleton during the initial load sequence.
 * The splash video handles the "loading" state until the app is ready.
 * PageSkeleton is ONLY for internal route transitions after the app has loaded.
 */
let initialLoadComplete = false;

function SmartFallback() {
  const [showSkeleton, setShowSkeleton] = useState(() => {
    // If initial load is already complete, this is an internal navigation → show skeleton
    return initialLoadComplete;
  });

  useEffect(() => {
    if (showSkeleton) return;
    
    // Mark initial load as complete once splash ends + app renders
    const onSplashEnd = () => {
      // Don't show skeleton now — the app content will render directly
      // But mark that future Suspense fallbacks should show the skeleton
      initialLoadComplete = true;
    };
    
    window.addEventListener("html-splash-ended", onSplashEnd, { once: true });
    
    // If splash is already gone, mark complete
    if (!document.getElementById("splash-overlay")) {
      initialLoadComplete = true;
      // Still don't show skeleton for this render — Index is eagerly loaded
    }
    
    return () => window.removeEventListener("html-splash-ended", onSplashEnd);
  }, [showSkeleton]);

  // During initial load: return null (splash overlay is visible)
  // During internal navigation: show branded skeleton
  if (!showSkeleton) return null;
  return <PageSkeleton />;
}

// EAGER LOADED - Main page for instant display
import Index from "@/pages/Index";

// ═══════════════════════════════════════════════════════════════
// LAZY LOADED PAGES - 35 Curated Professional Tools
// ═══════════════════════════════════════════════════════════════
const SmartDashboard = lazy(() => import("@/pages/SmartDashboard"));
const JourneyMap = lazy(() => import("@/pages/JourneyMap"));
const DailyInsights = lazy(() => import("@/pages/DailyInsights"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Contact = lazy(() => import("@/pages/Contact"));
const PricingDemo = lazy(() => import("@/pages/PricingDemo"));
const ArticlePage = lazy(() => import("@/pages/ArticlePage"));

// AI-POWERED CORE TOOLS
const PregnancyAssistant = lazy(() => import("@/pages/tools/PregnancyAssistant"));
const WellnessDiary = lazy(() => import("@/pages/tools/AISymptomAnalyzer"));
const AIMealSuggestion = lazy(() => import("@/pages/tools/AIMealSuggestion"));
const WeeklySummary = lazy(() => import("@/pages/tools/WeeklySummary"));
const SmartAppointmentReminder = lazy(() => import("@/pages/tools/SmartAppointmentReminder"));
const AICravingAlternatives = lazy(() => import("@/pages/tools/AICravingAlternatives"));
const SmartGroceryList = lazy(() => import("@/pages/tools/SmartGroceryList"));
const SmartPregnancyPlan = lazy(() => import("@/pages/tools/SmartPregnancyPlan"));



// AI 2026 TOOLS
const PregnancyComfort = lazy(() => import("@/pages/tools/PregnancyComfort"));
const AIHospitalBag = lazy(() => import("@/pages/tools/AIHospitalBag"));
const AIPartnerGuide = lazy(() => import("@/pages/tools/AIPartnerGuide"));
const AIBirthPosition = lazy(() => import("@/pages/tools/AIBirthPosition"));
const AIPregnancySkincare = lazy(() => import("@/pages/tools/AIPregnancySkincare"));
const AIBumpPhotos = lazy(() => import("@/pages/tools/AIBumpPhotos"));

// AI WELLNESS
const AIFitnessCoach = lazy(() => import("@/pages/tools/AIFitnessCoach"));
const AIBackPainRelief = lazy(() => import("@/pages/tools/AIBackPainRelief"));
const VitaminTracker = lazy(() => import("@/pages/tools/VitaminTracker"));


// AI LABOR
const AIBirthPlanGenerator = lazy(() => import("@/pages/tools/AIBirthPlanGenerator"));

// FERTILITY & PLANNING
const CycleTracker = lazy(() => import("@/pages/tools/CycleTracker"));
const DueDateCalculator = lazy(() => import("@/pages/tools/DueDateCalculator"));

const FertilityAcademy = lazy(() => import("@/pages/tools/FertilityAcademy"));
const NutritionSupplementsGuide = lazy(() => import("@/pages/tools/NutritionSupplementsGuide"));

const PreconceptionCheckup = lazy(() => import("@/pages/tools/PreconceptionCheckup"));

// PREGNANCY TRACKING
const FetalDevelopment3D = lazy(() => import("@/pages/tools/FetalDevelopment3D"));
const SmartKickCounter = lazy(() => import("@/pages/tools/SmartKickCounter"));
const ContractionTimer = lazy(() => import("@/pages/tools/ContractionTimer"));
const SmartWeightGainAnalyzer = lazy(() => import("@/pages/tools/SmartWeightGainAnalyzer"));

// MENTAL HEALTH
const PostpartumMentalHealthCoach = lazy(() => import("@/pages/tools/PostpartumMentalHealthCoach"));

// MATERNAL HEALTH AWARENESS (merged)
const MaternalHealthAwareness = lazy(() => import("@/pages/tools/MaternalHealthAwareness"));

// PREPARATION
const BabyGearRecommender = lazy(() => import("@/pages/tools/BabyGearRecommender"));

// POSTPARTUM
const AILactationPrep = lazy(() => import("@/pages/tools/AILactationPrep"));
const PostpartumRecoveryGuide = lazy(() => import("@/pages/tools/PostpartumRecoveryGuide"));
const BabyCryTranslator = lazy(() => import("@/pages/tools/BabyCryTranslator"));
const BabySleepTracker = lazy(() => import("@/pages/tools/BabySleepTracker"));
const BabyGrowth = lazy(() => import("@/pages/tools/BabyGrowth"));
const DiaperTracker = lazy(() => import("@/pages/tools/DiaperTracker"));

// VIDEO LIBRARY
const VideoLibraryPage = lazy(() => import("@/pages/VideoLibraryPage"));
const LandingEN = lazy(() => import("@/pages/LandingEN"));
const LandingAR = lazy(() => import("@/pages/LandingAR"));
const LandingDE = lazy(() => import("@/pages/LandingDE"));
const LandingFR = lazy(() => import("@/pages/LandingFR"));
const LandingES = lazy(() => import("@/pages/LandingES"));
const LandingTR = lazy(() => import("@/pages/LandingTR"));
const LandingPT = lazy(() => import("@/pages/LandingPT"));
const LocalizedSEOLanding = lazy(() => import("@/pages/LocalizedSEOLanding"));
const AIUsageDashboard = lazy(() => import("@/pages/AIUsageDashboard"));
const KeywordLibrary = lazy(() => import("@/pages/KeywordLibrary"));
const ASOGenerator = lazy(() => import("@/pages/ASOGenerator"));
const LanguageSelection = lazy(() => import("@/pages/LanguageSelection"));
const ToolLanding = lazy(() => import("@/pages/ToolLanding"));
const WhyUs = lazy(() => import("@/pages/WhyUs"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const DiscoverTools = lazy(() => import("@/pages/DiscoverTools"));
const AdminUsageDashboardPage = lazy(() => import("@/pages/AdminUsageDashboard"));
const AdminNotifications = lazy(() => import("@/pages/AdminNotifications"));
const AdminCoupons = lazy(() => import("@/pages/AdminCoupons"));
const WeeklyAchievements = lazy(() => import("@/pages/WeeklyAchievements"));


export function AnimatedRoutes() {
  return (
    <Suspense fallback={<SmartFallback />}>
      <Routes>
        {/* Main Pages */}
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/en" element={<PageTransition><LandingEN /></PageTransition>} />
        <Route path="/ar" element={<PageTransition><LandingAR /></PageTransition>} />
        <Route path="/de" element={<PageTransition><LandingDE /></PageTransition>} />
        <Route path="/fr" element={<PageTransition><LandingFR /></PageTransition>} />
        <Route path="/es" element={<PageTransition><LandingES /></PageTransition>} />
        <Route path="/tr" element={<PageTransition><LandingTR /></PageTransition>} />
        <Route path="/pt" element={<PageTransition><LandingPT /></PageTransition>} />
        {/* SEO Landing Pages per tool */}
        <Route path="/tool/:toolSlug" element={<PageTransition><ToolLanding /></PageTransition>} />
        {/* Multilingual SEO Landing (44 languages, indexable, not in nav) */}
        <Route path="/seo/:lang" element={<PageTransition><LocalizedSEOLanding /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><SmartDashboard /></PageTransition>} />
        <Route path="/my-journey" element={<PageTransition><JourneyMap /></PageTransition>} />
        <Route path="/daily-insights" element={<PageTransition><DailyInsights /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/language" element={<PageTransition><LanguageSelection /></PageTransition>} />
        <Route path="/language-styles" element={<Navigate to="/settings" replace />} />
        <Route path="/pricing-demo" element={<PageTransition><PricingDemo /></PageTransition>} />
        <Route path="/icon-preview" element={<Navigate to="/" replace />} />
        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><TermsOfService /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/articles/:slug" element={<PageTransition><ArticlePage /></PageTransition>} />
        
        {/* AI-POWERED CORE TOOLS */}
        <Route path="/tools/pregnancy-assistant" element={<PageTransition variant="tool"><PregnancyAssistant /></PageTransition>} />
        <Route path="/tools/wellness-diary" element={<PageTransition variant="tool"><WellnessDiary /></PageTransition>} />
        <Route path="/tools/ai-meal-suggestion" element={<PageTransition variant="tool"><AIMealSuggestion /></PageTransition>} />
        <Route path="/tools/weekly-summary" element={<PageTransition variant="tool"><WeeklySummary /></PageTransition>} />
        <Route path="/tools/smart-appointment-reminder" element={<PageTransition variant="tool"><SmartAppointmentReminder /></PageTransition>} />
        <Route path="/tools/ai-craving-alternatives" element={<PageTransition variant="tool"><AICravingAlternatives /></PageTransition>} />
        <Route path="/tools/smart-grocery-list" element={<PageTransition variant="tool"><SmartGroceryList /></PageTransition>} />
        <Route path="/tools/smart-plan" element={<PageTransition variant="tool"><SmartPregnancyPlan /></PageTransition>} />
        <Route path="/tools/smart-pregnancy-plan" element={<Navigate to="/tools/smart-plan" replace />} />
        
        

        {/* PREGNANCY COMFORT (merged sleep + nausea) */}
        <Route path="/tools/pregnancy-comfort" element={<PageTransition variant="tool"><PregnancyComfort /></PageTransition>} />
        <Route path="/tools/ai-sleep-optimizer" element={<Navigate to="/tools/pregnancy-comfort" replace />} />
        <Route path="/tools/ai-nausea-relief" element={<Navigate to="/tools/pregnancy-comfort" replace />} />
        <Route path="/tools/ai-hospital-bag" element={<PageTransition variant="tool"><AIHospitalBag /></PageTransition>} />
        <Route path="/tools/ai-partner-guide" element={<PageTransition variant="tool"><AIPartnerGuide /></PageTransition>} />
        <Route path="/tools/ai-birth-position" element={<PageTransition variant="tool"><AIBirthPosition /></PageTransition>} />
        <Route path="/tools/ai-skincare" element={<PageTransition variant="tool"><AIPregnancySkincare /></PageTransition>} />
        <Route path="/tools/ai-bump-photos" element={<PageTransition variant="tool"><AIBumpPhotos /></PageTransition>} />

        {/* AI WELLNESS */}
        <Route path="/tools/ai-fitness-coach" element={<PageTransition variant="tool"><AIFitnessCoach /></PageTransition>} />
        <Route path="/tools/ai-back-pain-relief" element={<PageTransition variant="tool"><AIBackPainRelief /></PageTransition>} />
        <Route path="/tools/vitamin-tracker" element={<PageTransition variant="tool"><VitaminTracker /></PageTransition>} />
        

        {/* AI LABOR */}
        <Route path="/tools/ai-birth-plan" element={<PageTransition variant="tool"><AIBirthPlanGenerator /></PageTransition>} />
        <Route path="/tools/labor-progress" element={<Navigate to="/tools/ai-birth-plan" replace />} />

        {/* FERTILITY & PLANNING */}
        <Route path="/tools/cycle-tracker" element={<PageTransition variant="tool"><CycleTracker /></PageTransition>} />
        <Route path="/tools/due-date-calculator" element={<PageTransition variant="tool"><DueDateCalculator /></PageTransition>} />
        
        <Route path="/tools/fertility-academy" element={<PageTransition variant="tool"><FertilityAcademy /></PageTransition>} />
        <Route path="/tools/nutrition-supplements" element={<PageTransition variant="tool"><NutritionSupplementsGuide /></PageTransition>} />
        <Route path="/tools/tww-companion" element={<Navigate to="/tools/fertility-academy" replace />} />
        <Route path="/tools/preconception-checkup" element={<PageTransition variant="tool"><PreconceptionCheckup /></PageTransition>} />

        {/* LEGACY REDIRECTS — merged fertility tools */}
        <Route path="/tools/fertility-signs" element={<Navigate to="/tools/fertility-academy" replace />} />
        <Route path="/tools/stress-fertility" element={<Navigate to="/tools/fertility-academy" replace />} />
        <Route path="/tools/preconception-nutrition" element={<Navigate to="/tools/nutrition-supplements" replace />} />
        <Route path="/tools/prenatal-vitamins" element={<Navigate to="/tools/nutrition-supplements" replace />} />

        {/* PREGNANCY TRACKING */}
        <Route path="/tools/fetal-growth" element={<PageTransition variant="tool"><FetalDevelopment3D /></PageTransition>} />
        <Route path="/tools/kick-counter" element={<PageTransition variant="tool"><SmartKickCounter /></PageTransition>} />
        <Route path="/tools/contraction-timer" element={<PageTransition variant="tool"><ContractionTimer /></PageTransition>} />
        <Route path="/tools/weight-gain" element={<PageTransition variant="tool"><SmartWeightGainAnalyzer /></PageTransition>} />

        {/* MENTAL HEALTH */}
        <Route path="/tools/mental-health-coach" element={<PageTransition variant="tool"><PostpartumMentalHealthCoach /></PageTransition>} />

        {/* MATERNAL HEALTH AWARENESS (merged diabetes + preeclampsia) */}
        <Route path="/tools/maternal-health" element={<PageTransition variant="tool"><MaternalHealthAwareness /></PageTransition>} />
        <Route path="/tools/gestational-diabetes" element={<Navigate to="/tools/maternal-health" replace />} />
        <Route path="/tools/preeclampsia-risk" element={<Navigate to="/tools/maternal-health" replace />} />

        {/* PREPARATION */}
        <Route path="/tools/baby-gear-recommender" element={<PageTransition variant="tool"><BabyGearRecommender /></PageTransition>} />

        {/* POSTPARTUM */}
        <Route path="/tools/ai-lactation-prep" element={<PageTransition variant="tool"><AILactationPrep /></PageTransition>} />
        <Route path="/tools/postpartum-recovery" element={<PageTransition variant="tool"><PostpartumRecoveryGuide /></PageTransition>} />
        <Route path="/tools/baby-cry-translator" element={<PageTransition variant="tool"><BabyCryTranslator /></PageTransition>} />
        <Route path="/tools/baby-sleep-tracker" element={<PageTransition variant="tool"><BabySleepTracker /></PageTransition>} />
        <Route path="/tools/baby-growth" element={<PageTransition variant="tool"><BabyGrowth /></PageTransition>} />
        <Route path="/tools/diaper-tracker" element={<PageTransition variant="tool"><DiaperTracker /></PageTransition>} />

        {/* VIDEO LIBRARY */}
        <Route path="/videos" element={<PageTransition><VideoLibraryPage /></PageTransition>} />

        {/* NEW PAGES */}
        <Route path="/why-us" element={<PageTransition><WhyUs /></PageTransition>} />
        <Route path="/testimonials" element={<PageTransition><Testimonials /></PageTransition>} />
        <Route path="/discover" element={<PageTransition><DiscoverTools /></PageTransition>} />
        <Route path="/achievements" element={<PageTransition><WeeklyAchievements /></PageTransition>} />
        <Route path="/welcome-result" element={<Navigate to="/" replace />} />

        {/* ADMIN */}
        <Route path="/admin/ai-usage" element={<PageTransition><AIUsageDashboard /></PageTransition>} />
        <Route path="/admin/keywords" element={<PageTransition><KeywordLibrary /></PageTransition>} />
        <Route path="/admin/aso-generator" element={<PageTransition><ASOGenerator /></PageTransition>} />
        <Route path="/admin/usage" element={<PageTransition><AdminUsageDashboardPage /></PageTransition>} />
        <Route path="/admin/notifications" element={<PageTransition><AdminNotifications /></PageTransition>} />
        <Route path="/admin/coupons" element={<PageTransition><AdminCoupons /></PageTransition>} />

        {/* LEGACY REDIRECTS — deleted tools */}
        <Route path="/tools/smart-walking-coach" element={<Navigate to="/tools/ai-fitness-coach" replace />} />
        <Route path="/tools/smart-stretch-reminder" element={<Navigate to="/tools/ai-fitness-coach" replace />} />
        <Route path="/tools/kegel-exercise" element={<Navigate to="/tools/ai-fitness-coach" replace />} />
        <Route path="/tools/smart-snack-planner" element={<Navigate to="/tools/ai-meal-suggestion" replace />} />
        <Route path="/tools/forbidden-foods" element={<Navigate to="/tools/ai-meal-suggestion" replace />} />

        {/* 404 */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </Suspense>
  );
}

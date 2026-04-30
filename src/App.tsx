import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SmartScrollRestoration } from "@/components/SmartScrollRestoration";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { AIUsageProvider } from "@/contexts/AIUsageContext";
import { SmartErrorBoundary } from "@/components/SmartErrorBoundary";
import { useEffect, useState, lazy, Suspense } from "react";
import { initializeAuth } from "@/lib/auth";
import { toast } from "sonner";
import { prefetchCriticalRoutes } from "@/lib/routePrefetch";
import { captureAttribution } from "@/hooks/useAttribution";


// Lazy-load OnboardingDisclaimer — heavy imports (Calendar, date-fns) only needed on first visit
const OnboardingDisclaimer = lazy(() => import("@/components/OnboardingDisclaimer").then(m => ({ default: m.OnboardingDisclaimer })));
const SubscriptionSuccessSheet = lazy(() => import("@/components/SubscriptionSuccessSheet"));
const GuidedTour = lazy(() => import("@/components/GuidedTour"));
const OfflineBanner = lazy(() => import("@/components/OfflineBanner").then(m => ({ default: m.OfflineBanner })));
const UpdateAvailableBanner = lazy(() => import("@/components/UpdateAvailableBanner").then(m => ({ default: m.UpdateAvailableBanner })));
const StageTransitionSheet = lazy(() => import("@/components/journey/StageTransitionSheet").then(m => ({ default: m.StageTransitionSheet })));


const queryClient = new QueryClient();
const CHUNK_RECOVERY_KEY = "pt_chunk_recovery_done";

const recoverFromChunkError = async () => {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("pt-cache-v") || key.includes("vite") || key.includes("workbox"))
        .map((key) => caches.delete(key))
    );
  }
};

const App = () => {
  const [successSheet, setSuccessSheet] = useState<{ open: boolean; plan: 'monthly' | 'yearly' | null }>({ open: false, plan: null });

  

  // Initialize anonymous auth & prefetch critical routes
  useEffect(() => {
    initializeAuth();
    prefetchCriticalRoutes();
    captureAttribution();
  }, []);

  // Listen for subscription-activated event from PricingDemo
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const plan = detail?.plan === 'yearly' ? 'yearly' : 'monthly';
      setSuccessSheet({ open: true, plan });
    };
    window.addEventListener('subscription-activated', handler);
    return () => window.removeEventListener('subscription-activated', handler);
  }, []);


  // Handle dynamic import failures (e.g., after app updates)
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason);
      
      // Check if it's a dynamic import error
      if (message.includes('Failed to fetch dynamically imported module') || 
          message.includes('Loading chunk') ||
          message.includes('Loading CSS chunk')) {
        event.preventDefault();

        const alreadyRecovered = sessionStorage.getItem(CHUNK_RECOVERY_KEY) === "1";
        if (alreadyRecovered) {
          // Don't show error on second attempt — just let it pass
          console.warn("[ChunkRecovery] Already recovered once this session, skipping reload.");
          return;
        }

        sessionStorage.setItem(CHUNK_RECOVERY_KEY, "1");
        
        // Only clear stale caches, don't force reload immediately
        void recoverFromChunkError().then(() => {
          toast.info("Updating app...", {
            description: "Please wait a moment.",
            duration: 2000,
          });
          // Use a gentle retry: re-navigate to the same route instead of hard reload
          setTimeout(() => {
            window.location.reload();
          }, 500);
        });
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AIUsageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SmartErrorBoundary>
          <SmartScrollRestoration />
          <AnimatedRoutes />
          <Suspense fallback={null}><OnboardingDisclaimer /></Suspense>
          
          <Suspense fallback={null}><GuidedTour /></Suspense>
          <Suspense fallback={null}><UpdateAvailableBanner /></Suspense>
          <Suspense fallback={null}><StageTransitionSheet /></Suspense>
          <Suspense fallback={null}>
            <SubscriptionSuccessSheet
              open={successSheet.open}
              planType={successSheet.plan}
              onClose={() => setSuccessSheet({ open: false, plan: null })}
            />
          </Suspense>
        </SmartErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
      </AIUsageProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;

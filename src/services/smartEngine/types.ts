/**
 * Unified Smart Engine — Shared Types
 * Single source of truth for all AI interactions across the app.
 */

// ── Section Contexts (14 domains the engine supports) ──
export type SmartSection =
  | "pregnancy-plan"
  | "symptoms"
  | "nutrition"
  | "movement"
  | "appointments"
  | "sleep"
  | "mental-wellbeing"
  | "medications"
  | "weight"
  | "postpartum"
  | "lab-checks"
  | "safety"
  | "bump-photos"
  | "kick-analysis";

// ── AI Tool Types (maps to edge function types) ──
export type AIToolType =
  | "symptom-analysis" | "meal-suggestion" | "pregnancy-assistant" | "weekly-summary"
  | "posture-coach" | "walking-coach" | "stretch-reminder" | "back-pain-relief"
  | "leg-cramp-preventer" | "smoothie-generator" | "daily-tips" | "labor-tracker"
  | "appointment-prep" | "kick-analysis" | "sleep-analysis" | "sleep-meditation" | "sleep-routine" | "vitamin-advice"
  | "bump-photos" | "baby-cry-analysis" | "postpartum-recovery"
  | "hospital-bag" | "birth-position" | "partner-guide" | "lactation-prep"
  | "nausea-relief" | "skincare-advice" | "birth-plan" | "mental-health"
  | "pregnancy-plan" | "baby-growth-analysis"
  | "weight-analysis" | "contraction-analysis"
  | "craving-alternatives" | "grocery-list"
  | "live-search" // Perplexity Sonar — real-time web search with citations
  | "holistic-dashboard"; // Holistic dashboard-wide AI analysis (premium 7-point tool)

// ── Section → AI Tool Type mapping ──
export const SECTION_TOOL_MAP: Record<SmartSection, AIToolType> = {
  "pregnancy-plan": "pregnancy-plan",
  "symptoms": "symptom-analysis",
  "nutrition": "meal-suggestion",
  "movement": "back-pain-relief",
  "appointments": "appointment-prep",
  "sleep": "sleep-analysis",
  "mental-wellbeing": "mental-health",
  "medications": "vitamin-advice",
  "weight": "weight-analysis",
  "postpartum": "postpartum-recovery",
  "lab-checks": "pregnancy-assistant",
  "safety": "symptom-analysis",
  "bump-photos": "bump-photos",
  "kick-analysis": "kick-analysis",
};

// ── Quota cost weights ──
export type InsightWeight = 0 | 1 | 2 | 5 | 7;

/**
 * TOOL_WEIGHT_REGISTRY — THE SINGLE SOURCE OF TRUTH for AI request costs.
 * Keyed by AIToolType. Every tool defaults to weight 1.
 * Only high-cost tools (image analysis) are explicitly listed as weight 2.
 *
 * THIS MUST NEVER BE BYPASSED. All weight resolution goes through resolveWeight().
 */
export const TOOL_WEIGHT_REGISTRY: Record<AIToolType, InsightWeight> = {
  // ── Standard AI tools — minimum 2 points (all AI buttons must consume quota) ──
  "symptom-analysis": 2,
  "meal-suggestion": 2,
  "pregnancy-assistant": 2,
  "posture-coach": 2,
  "walking-coach": 2,
  "stretch-reminder": 2,
  "back-pain-relief": 2,
  "leg-cramp-preventer": 2,
  "smoothie-generator": 2,
  "daily-tips": 2,
  "labor-tracker": 2,
  "appointment-prep": 2,
  "sleep-analysis": 2,
  "sleep-meditation": 2,
  "sleep-routine": 2,
  "vitamin-advice": 2,
  "baby-cry-analysis": 2,
  "hospital-bag": 2,
  "birth-position": 2,
  "partner-guide": 2,
  "lactation-prep": 2,
  "nausea-relief": 2,
  "skincare-advice": 2,
  "baby-growth-analysis": 2,
  "craving-alternatives": 2,
  "grocery-list": 2,
  // ── Heavy / multi-step AI tools — 2 pts (already minimum) ──
  "weekly-summary": 2,          // high-value editorial — recap of full week
  "kick-analysis": 2,           // deep multi-session pattern analysis
  "postpartum-recovery": 2,     // multi-phase recovery plan
  "birth-plan": 2,              // comprehensive personalized birth plan
  "mental-health": 2,           // sensitive deep emotional analysis
  "pregnancy-plan": 2,          // flagship holistic plan
  "weight-analysis": 2,         // trend analysis across multiple weeks
  "contraction-analysis": 2,    // critical pattern analysis (labor signals)
  // ── Premium-tier multimodal & research ──
  "bump-photos": 5,             // ultrasound photo analysis — multimodal vision
  "live-search": 5,             // Perplexity Sonar — real-time web search
  "holistic-dashboard": 7,      // Premium dashboard-wide cross-data analysis (Pro model)
};

/**
 * Resolve the weight for a given tool/section.
 * Uses TOOL_WEIGHT_REGISTRY as the ONLY source.
 * Components MUST NOT pass weight manually — this function is the authority.
 */
export function resolveWeight(toolType?: AIToolType, section?: SmartSection): InsightWeight {
  if (toolType && TOOL_WEIGHT_REGISTRY[toolType] !== undefined) {
    return TOOL_WEIGHT_REGISTRY[toolType];
  }
  // Fallback: resolve toolType from section, then look up registry
  if (section) {
    const mapped = SECTION_TOOL_MAP[section];
    if (mapped && TOOL_WEIGHT_REGISTRY[mapped] !== undefined) {
      return TOOL_WEIGHT_REGISTRY[mapped];
    }
  }
  return 1; // safe default
}

// ── Quota tiers ──
export interface QuotaTier {
  monthly: number;
  label: string;
}

export const QUOTA_TIERS: Record<string, QuotaTier> = {
  free: { monthly: 8, label: "Free" },
  premium: { monthly: 75, label: "Premium" },
};

// ── Quota state ──
export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  tier: "free" | "premium";
  monthKey: string; // "2026-03"
  isExhausted: boolean;
  isNearLimit: boolean;
  adminBypass: boolean;
}

// ── Unified AI Request ──
export interface SmartRequest {
  section: SmartSection;
  toolType?: AIToolType; // override the default section→tool mapping
  messages: SmartMessage[];
  context?: SmartContext;
  // weight is resolved centrally by resolveWeight() — do NOT pass manually
}

export interface SmartMessage {
  role: "user" | "assistant";
  content: string | SmartContentPart[];
}

export interface SmartContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface SmartContext {
  week?: number;
  trimester?: number;
  symptoms?: string[];
  preferences?: string[];
  weight?: number;
  contractionData?: unknown;
  sleepData?: unknown;
  language?: string;
  [key: string]: unknown; // extensible for section-specific data
}

// ── Unified AI Response ──
export interface SmartResponse {
  content: string;
  section: SmartSection;
  timestamp: number;
  cached: boolean;
  cost: InsightWeight;
}

// ── Cache entry ──
export interface CacheEntry {
  content: string;
  section: SmartSection;
  timestamp: number;
  expiresAt: number;
  contentHash: string;
}

// ── Error types ──
export type SmartErrorType = "quota_exhausted" | "rate_limit" | "payment" | "network" | "auth" | "unknown";

export interface SmartError {
  type: SmartErrorType;
  message: string;
  retryable: boolean;
}

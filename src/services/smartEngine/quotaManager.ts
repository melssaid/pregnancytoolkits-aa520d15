/**
 * Unified Quota Manager
 * Tracks monthly AI usage with weighted costs.
 * Local-first with server sync capability via check-quota.
 *
 * FREE: 10 points/month | PREMIUM: 60 points/month
 * Coupon bonuses ACCUMULATE on top of base limit (server is source of truth).
 * Weights: standard=1, heavy/photo=2, premium-vision/search=5, holistic=7, free=0
 */

import { QUOTA_TIERS, type InsightWeight, type QuotaState } from "./types";

const STORAGE_KEY = "smart_quota_v2";
const ADMIN_BYPASS_KEY = "smart_admin_bypass";
const SERVER_SNAPSHOT_KEY = "smart_quota_server_snapshot_v1";
const DRIFT_LOG_KEY = "smart_quota_drift_log_v1";
const SERVER_SNAPSHOT_TTL_MS = 5 * 60_000; // 5 min — after this, fall back to local
const MAX_DRIFT_LOG_ENTRIES = 20;

// ── Server snapshot: authoritative state from check-quota ──
interface ServerSnapshot {
  used: number;
  limit: number;
  tier: "free" | "premium";
  baseLimit: number;
  couponBonus: number;
  periodStart: string;
  receivedAt: number;       // local epoch ms when snapshot was stored
  responseVersion: string;  // = periodStart, used as version tag
  /**
   * Local `stored.used` value at the moment this snapshot was taken.
   * Used to add any local consumption that happened AFTER the snapshot,
   * so the displayed `used` reflects fresh AI calls before the next sync.
   */
  localUsedAtSnapshot?: number;
}

interface DriftEntry {
  at: number;
  field: "limit" | "used" | "tier" | "couponBonus";
  server: number | string;
  client: number | string;
  delta?: number;
}

function readServerSnapshot(): ServerSnapshot | null {
  try {
    const raw = localStorage.getItem(SERVER_SNAPSHOT_KEY);
    if (!raw) return null;
    const snap = JSON.parse(raw) as ServerSnapshot;
    if (Date.now() - snap.receivedAt > SERVER_SNAPSHOT_TTL_MS) return null; // stale
    return snap;
  } catch { return null; }
}

function writeServerSnapshot(snap: ServerSnapshot): void {
  try { localStorage.setItem(SERVER_SNAPSHOT_KEY, JSON.stringify(snap)); } catch { /* full */ }
}

function logDrift(entries: DriftEntry[]): void {
  if (entries.length === 0) return;
  // Console-visible warning
  console.warn("[quotaManager] Server↔Client drift detected:", entries);
  // Persist for diagnostics (ring buffer)
  try {
    const raw = localStorage.getItem(DRIFT_LOG_KEY);
    const existing: DriftEntry[] = raw ? JSON.parse(raw) : [];
    const merged = [...existing, ...entries].slice(-MAX_DRIFT_LOG_ENTRIES);
    localStorage.setItem(DRIFT_LOG_KEY, JSON.stringify(merged));
  } catch { /* ignore */ }
}

/**
 * Diagnostic info about where the displayed quota numbers come from.
 * Used by UI badges/tooltips to reduce user confusion about local vs server data.
 */
export interface QuotaSourceInfo {
  /** "snapshot" = server snapshot is authoritative (fresh, within TTL).
   *  "local"    = no fresh snapshot; numbers come purely from localStorage. */
  source: "snapshot" | "local";
  /** Epoch ms when the current snapshot was received from the server. null if local-only. */
  snapshotAt: number | null;
  /** Seconds until the snapshot expires (TTL). null when local-only. */
  expiresInSec: number | null;
  /** TTL of a snapshot in seconds (constant). */
  ttlSec: number;
  /** Local consumption added on top of snapshot baseline (immediate decrement). */
  pendingLocalDelta: number;
}

/**
 * Returns where the currently displayed quota numbers come from
 * (server snapshot vs local) plus freshness info — for badges/tooltips.
 */
export function getQuotaSourceInfo(): QuotaSourceInfo {
  // Read local quota first so a month rollover can invalidate any stale snapshot
  // before we decide whether the server snapshot is still authoritative.
  const local = readQuota();
  const snap = readServerSnapshot();
  if (!snap) {
    return {
      source: "local",
      snapshotAt: null,
      expiresInSec: null,
      ttlSec: SERVER_SNAPSHOT_TTL_MS / 1000,
      pendingLocalDelta: 0,
    };
  }
  const baseline = snap.localUsedAtSnapshot ?? local.used;
  const delta = Math.max(0, local.used - baseline);
  const expiresInMs = Math.max(0, SERVER_SNAPSHOT_TTL_MS - (Date.now() - snap.receivedAt));
  return {
    source: "snapshot",
    snapshotAt: snap.receivedAt,
    expiresInSec: Math.floor(expiresInMs / 1000),
    ttlSec: SERVER_SNAPSHOT_TTL_MS / 1000,
    pendingLocalDelta: delta,
  };
}

/**
 * Read the most recent drift log entries (diagnostic helper for admin dashboards).
 */
export function getDriftLog(): DriftEntry[] {
  try {
    const raw = localStorage.getItem(DRIFT_LOG_KEY);
    return raw ? (JSON.parse(raw) as DriftEntry[]) : [];
  } catch { return []; }
}

/**
 * Record an authoritative snapshot from check-quota. This becomes the source
 * of truth for getQuotaState() until it expires (5 min) or is overwritten.
 */
export function recordServerSnapshot(payload: {
  used: number;
  limit: number;
  tier: "free" | "premium";
  baseLimit?: number;
  couponBonus?: number;
  periodStart?: string;
}): void {
  const snap: ServerSnapshot = {
    used: payload.used,
    limit: payload.limit,
    tier: payload.tier,
    baseLimit: payload.baseLimit ?? (QUOTA_TIERS[payload.tier]?.monthly ?? 10),
    couponBonus: payload.couponBonus ?? Math.max(0, payload.limit - (QUOTA_TIERS[payload.tier]?.monthly ?? 10)),
    periodStart: payload.periodStart ?? new Date().toISOString(),
    receivedAt: Date.now(),
    responseVersion: payload.periodStart ?? new Date().toISOString(),
    localUsedAtSnapshot: readQuota().used,
  };
  writeServerSnapshot(snap);
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface StoredQuota {
  monthKey: string;
  used: number;
  tier: "free" | "premium";
  bonusCredits?: number;      // coupon-based override limit
  promoBonusCredits?: number; // additive promo bonus (legacy)
  couponCreditsById?: Record<string, number>;
}

// ── Storage helpers ──
function normalizeCouponCredits(stored: StoredQuota): Record<string, number> {
  const entries = Object.entries(stored.couponCreditsById || {}).filter(([, value]) => Number.isFinite(value) && value > 0);
  if (entries.length > 0) return Object.fromEntries(entries);
  if ((stored.bonusCredits || 0) > 0) return { legacy: stored.bonusCredits || 0 };
  return {};
}

function calculateCouponBonus(stored: StoredQuota): number {
  return Object.values(normalizeCouponCredits(stored)).reduce((sum, value) => sum + value, 0);
}

function readQuota(): StoredQuota {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: StoredQuota = JSON.parse(raw);
      // Reset if month changed
      if (parsed.monthKey === getCurrentMonthKey()) return parsed;
      try {
        localStorage.removeItem(SERVER_SNAPSHOT_KEY);
      } catch {
        // Safe to ignore: localStorage may be unavailable or already cleared in private mode/tests.
      }
    }
  } catch { /* corrupted */ }
  return { monthKey: getCurrentMonthKey(), used: 0, tier: "free" };
}

function writeQuota(data: StoredQuota): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

function isAdminBypass(): boolean {
  try {
    return localStorage.getItem(ADMIN_BYPASS_KEY) === "true";
  } catch {
    return false;
  }
}

// ── Public API ──

export function getQuotaState(): QuotaState {
  const stored = readQuota();
  const bypass = isAdminBypass();
  const tierConfig = QUOTA_TIERS[stored.tier] || QUOTA_TIERS.free;
  const couponPoints = calculateCouponBonus(stored);
  const promoBonus = stored.promoBonusCredits || 0;

  // Local-computed values (kept for fallback + drift detection)
  const localLimit = bypass ? 999 : tierConfig.monthly + couponPoints + promoBonus;
  const localUsed = stored.used;
  const localTier = stored.tier;

  // ── Prefer authoritative server snapshot when available & fresh ──
  const snap = bypass ? null : readServerSnapshot();

  let used = localUsed;
  let limit = localLimit;
  let tier = localTier;

  if (snap) {
    // Server is the source of truth for limit/tier — adopt its values
    limit = snap.limit;
    tier = snap.tier;

    // For `used`: take server baseline + any local consumption that happened
    // AFTER the snapshot was recorded. This keeps the UI counter responsive
    // (decrements immediately after each AI call) without waiting for the
    // next server sync, while still honoring server truth for the baseline.
    const baseline = snap.localUsedAtSnapshot ?? localUsed;
    const localDelta = Math.max(0, localUsed - baseline);
    used = snap.used + localDelta;

    // Log any drift between local computation and server truth
    const drifts: DriftEntry[] = [];
    if (snap.limit !== localLimit) {
      drifts.push({ at: Date.now(), field: "limit", server: snap.limit, client: localLimit, delta: snap.limit - localLimit });
    }
    if (snap.used !== baseline) {
      drifts.push({ at: Date.now(), field: "used", server: snap.used, client: baseline, delta: snap.used - baseline });
    }
    if (snap.tier !== localTier) {
      drifts.push({ at: Date.now(), field: "tier", server: snap.tier, client: localTier });
    }
    if (snap.couponBonus !== couponPoints) {
      drifts.push({ at: Date.now(), field: "couponBonus", server: snap.couponBonus, client: couponPoints, delta: snap.couponBonus - couponPoints });
    }
    if (drifts.length > 0) logDrift(drifts);
  }

  const remaining = Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    tier,
    monthKey: stored.monthKey,
    isExhausted: used >= limit && !bypass,
    isNearLimit: remaining <= 2 && remaining > 0 && !bypass,
    adminBypass: bypass,
  };
}


/**
 * Check if user can afford a request with the given weight.
 */
export function canAfford(weight: InsightWeight = 1): boolean {
  const state = getQuotaState();
  if (state.adminBypass) return true;
  return state.remaining >= weight;
}

/**
 * Consume quota after a successful AI call.
 */
export function consumeQuota(weight: InsightWeight = 1): QuotaState {
  const stored = readQuota();
  stored.used += weight;
  stored.monthKey = getCurrentMonthKey(); // ensure current month
  writeQuota(stored);
  const state = getQuotaState();
  // Notify listeners (AIUsageContext) so they can immediately refresh + resync server snapshot.
  // Wrapped in try/catch — must not break consumption if dispatch fails (SSR/tests).
  try {
    if (typeof window !== 'undefined' && weight > 0) {
      window.dispatchEvent(new CustomEvent('quota-consumed', {
        detail: { weight, used: state.used, remaining: state.remaining, at: Date.now() },
      }));
    }
  } catch { /* ignore */ }
  return state;
}

/**
 * Sync usage from server response headers.
 */
export function syncFromServer(serverUsed: number, serverTier?: "free" | "premium", serverLimit?: number): void {
  if (isAdminBypass()) return;
  const stored = readQuota();
  if (serverTier) stored.tier = serverTier;
  stored.used = serverUsed;
  if (typeof serverLimit === "number" && Number.isFinite(serverLimit)) {
    const tierConfig = QUOTA_TIERS[stored.tier] || QUOTA_TIERS.free;
    const promoBonus = stored.promoBonusCredits || 0;
    const reconciledCouponBonus = Math.max(0, serverLimit - tierConfig.monthly - promoBonus);
    stored.bonusCredits = reconciledCouponBonus;
    stored.couponCreditsById = reconciledCouponBonus > 0 ? { server_sync: reconciledCouponBonus } : {};
  }
  stored.monthKey = getCurrentMonthKey();
  writeQuota(stored);
}


/**
 * Update subscription tier.
 */
export function setTier(tier: "free" | "premium"): void {
  if (isAdminBypass()) return;
  const stored = readQuota();
  stored.tier = tier;
  writeQuota(stored);
}

/**
 * Temporarily set tier to premium for an active coupon.
 * ✅ bonusPoints يُضاف تراكمياً فوق الحد الأساسي ويتراكم مع قسائم أخرى.
 */
export function applyCouponTier(expiresAt: string, bonusPoints?: number, couponKey?: string): void {
  if (new Date(expiresAt) <= new Date()) return;
  const stored = readQuota();
  stored.tier = "premium";
  if (bonusPoints && bonusPoints > 0) {
    const key = couponKey || `${expiresAt}:${bonusPoints}`;
    const couponCredits = normalizeCouponCredits(stored);
    couponCredits[key] = bonusPoints;
    stored.couponCreditsById = couponCredits;
    stored.bonusCredits = Object.values(couponCredits).reduce((sum, value) => sum + value, 0);
  }
  writeQuota(stored);
}

// ── Idempotency guard for coupon sync ──
// Prevents the same check-quota response from being applied twice (e.g. when
// AIUsageContext re-mounts or multiple tabs broadcast the same payload).
const COUPON_SYNC_GUARD_KEY = "smart_coupon_sync_guard_v1";
const COUPON_SYNC_TTL_MS = 60_000; // 60s — safety window; older payloads can re-apply
const COUPON_SYNC_CHANNEL = "smart_coupon_sync_v1";

interface CouponSyncGuard {
  hash: string;          // fingerprint of the coupon set
  version: string;       // server response version (period_start or explicit version)
  appliedAt: number;     // epoch ms
}

// In-memory mirror of the last guard — avoids repeated localStorage reads/writes
// when syncCouponBonuses is called many times with the same payload.
let inMemoryGuard: CouponSyncGuard | null = null;

// Cross-tab dedupe channel. Created lazily; gracefully no-op when unsupported.
let bcInstance: BroadcastChannel | null = null;
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (bcInstance) return bcInstance;
  try {
    bcInstance = new BroadcastChannel(COUPON_SYNC_CHANNEL);
    bcInstance.onmessage = (ev: MessageEvent) => {
      const msg = ev?.data as CouponSyncGuard | undefined;
      if (!msg || typeof msg.hash !== "string" || typeof msg.version !== "string") return;
      // Adopt the remote guard if newer — prevents this tab from re-applying.
      if (!inMemoryGuard || msg.appliedAt > inMemoryGuard.appliedAt) {
        inMemoryGuard = msg;
        try { localStorage.setItem(COUPON_SYNC_GUARD_KEY, JSON.stringify(msg)); } catch { /* full */ }
      }
    };
  } catch { bcInstance = null; }
  return bcInstance;
}

function fingerprintCoupons(coupons: Array<{ couponId?: string; expiresAt: string; bonusPoints: number }>): string {
  const normalized = coupons
    .map((c) => `${c.couponId || ""}|${c.expiresAt}|${c.bonusPoints}`)
    .sort()
    .join(";");
  // Lightweight non-crypto hash (FNV-1a 32-bit) — sufficient for dedupe.
  let h = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function readCouponSyncGuard(): CouponSyncGuard | null {
  if (inMemoryGuard) return inMemoryGuard;
  try {
    const raw = localStorage.getItem(COUPON_SYNC_GUARD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CouponSyncGuard;
    inMemoryGuard = parsed;
    return parsed;
  } catch { return null; }
}

function writeCouponSyncGuard(guard: CouponSyncGuard): void {
  inMemoryGuard = guard;
  try { localStorage.setItem(COUPON_SYNC_GUARD_KEY, JSON.stringify(guard)); } catch { /* full */ }
  // Notify other tabs so they skip re-applying the same payload.
  try { getBroadcastChannel()?.postMessage(guard); } catch { /* ignore */ }
}

/**
 * Sync active coupon bonuses from server.
 * Idempotent: skips re-application when (hash, version) matches the last apply
 * within COUPON_SYNC_TTL_MS — prevents double-counting on re-mount/multi-tab.
 *
 * @param coupons       active coupons returned by check-quota
 * @param responseVersion optional version tag (e.g. period_start ISO string)
 *                      from the same check-quota response — pairs with hash to
 *                      uniquely identify the payload.
 * @returns true if applied, false if skipped as duplicate
 */
export function syncCouponBonuses(
  coupons: Array<{ couponId?: string; expiresAt: string; bonusPoints: number }>,
  responseVersion?: string
): boolean {
  // Ensure cross-tab listener is wired before first dedupe check.
  getBroadcastChannel();

  const activeCoupons = coupons.filter((coupon) => coupon?.bonusPoints > 0 && new Date(coupon.expiresAt) > new Date());
  const hash = fingerprintCoupons(activeCoupons);
  const version = responseVersion || "v0";

  const prev = readCouponSyncGuard();
  const now = Date.now();
  if (prev && prev.hash === hash && prev.version === version && (now - prev.appliedAt) < COUPON_SYNC_TTL_MS) {
    // Same payload, same version, within TTL → already applied; skip writes entirely.
    return false;
  }

  const stored = readQuota();
  const couponCreditsById = Object.fromEntries(
    activeCoupons.map((coupon) => [coupon.couponId || `${coupon.expiresAt}:${coupon.bonusPoints}`, coupon.bonusPoints])
  );

  stored.couponCreditsById = couponCreditsById;
  stored.bonusCredits = Object.values(couponCreditsById).reduce((sum, value) => sum + value, 0);
  if (stored.bonusCredits > 0) stored.tier = "premium";
  writeQuota(stored);

  writeCouponSyncGuard({ hash, version, appliedAt: now });
  return true;
}


/**
 * Admin reset for testing. ONLY available in development.
 */
export function resetQuota(): void {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    console.warn('[quotaManager] resetQuota blocked in production');
    return;
  }
  localStorage.setItem(ADMIN_BYPASS_KEY, "true");
  writeQuota({ monthKey: getCurrentMonthKey(), used: 0, tier: "premium" });
}

/**
 * Clear admin bypass.
 * THIS MUST NEVER BE EXPOSED IN PRODUCTION — only reachable via direct import in tests.
 */
export function clearAdminBypass(): void {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    console.warn('[quotaManager] clearAdminBypass blocked in production');
    return;
  }
  localStorage.removeItem(ADMIN_BYPASS_KEY);
}

// ── Temporary Bonus Points (promo until Google Play billing connected) ──
const BONUS_KEY = "smart_bonus_claimed_v1";
// Promo expires after 6 days from first deploy — set a fixed end date
const PROMO_END_DATE = new Date("2026-04-04T23:59:59Z");
const BONUS_AMOUNT = 5;

interface BonusClaim {
  monthKey: string;
  claimed: boolean;
}

function readBonusClaim(): BonusClaim | null {
  try {
    const raw = localStorage.getItem(BONUS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted */ }
  return null;
}

/**
 * Check if the bonus promo is still active and hasn't been claimed this month.
 */
export function canClaimBonus(): boolean {
  if (new Date() > PROMO_END_DATE) return false;
  const claim = readBonusClaim();
  if (!claim) return true;
  // Already claimed this month
  if (claim.monthKey === getCurrentMonthKey() && claim.claimed) return false;
  // New month — can claim again
  return true;
}

/**
 * Check if promo period is still active.
 */
export function isPromoActive(): boolean {
  return new Date() <= PROMO_END_DATE;
}

/**
 * Claim 5 bonus points. Reduces used count (grants free credits).
 * Can only be claimed once per month during promo period.
 */
export function claimBonus(): { success: boolean; newState: QuotaState } {
  if (!canClaimBonus()) {
    return { success: false, newState: getQuotaState() };
  }
  const stored = readQuota();
  stored.promoBonusCredits = (stored.promoBonusCredits || 0) + BONUS_AMOUNT;
  stored.monthKey = getCurrentMonthKey();
  writeQuota(stored);
  // Mark as claimed
  try {
    localStorage.setItem(BONUS_KEY, JSON.stringify({
      monthKey: getCurrentMonthKey(),
      claimed: true,
    }));
  } catch { /* storage full */ }
  return { success: true, newState: getQuotaState() };
}

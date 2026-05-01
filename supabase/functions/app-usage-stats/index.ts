import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ToolRow = {
  tool_id: string;
  session_id: string;
  action_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type SessionBucket = "app" | "web";

type SessionDebugEntry = {
  sessionId: string;
  bucket: SessionBucket;
  reason: string;
  matchedRules: string[];
  matchedActionType: string;
  matchedAt: string;
  firstSeen: string;
  lastSeen: string;
  events: number;
  inspected: {
    platform: string;
    host: string;
    userAgent: string;
    source: string;
    runtime: string;
  };
};

const APP_PLATFORM_RE = /wv|android.*version\//i;
const APP_HOST_RE = /(android|app|twa|webview)/i;
const APP_USER_AGENT_RE = /;\s*wv\)|\bwv\b|android.+version\/|webview|twa/i;
const APP_RUNTIME_RE = /(capacitor|cordova|reactnative|twa|webview)/i;
const APP_SOURCE_RE = /(android|app|native|twa|webview)/i;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function pickString(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function inspectMetadata(row: ToolRow) {
  return {
    platform: pickString(row.metadata, ["platform"]),
    host: pickString(row.metadata, ["host", "hostname"]),
    userAgent: pickString(row.metadata, ["user_agent", "userAgent", "ua"]),
    source: pickString(row.metadata, ["source", "channel", "client"]),
    runtime: pickString(row.metadata, ["runtime", "environment"]),
  };
}

function classifyRow(row: ToolRow) {
  const inspected = inspectMetadata(row);
  const matchedRules: string[] = [];

  if (inspected.platform && APP_PLATFORM_RE.test(inspected.platform)) {
    matchedRules.push(`platform:${inspected.platform}`);
  }
  if (inspected.host && APP_HOST_RE.test(inspected.host)) {
    matchedRules.push(`host:${inspected.host}`);
  }
  if (inspected.userAgent && APP_USER_AGENT_RE.test(inspected.userAgent)) {
    matchedRules.push(`ua:${inspected.userAgent}`);
  }
  if (inspected.source && APP_SOURCE_RE.test(inspected.source)) {
    matchedRules.push(`source:${inspected.source}`);
  }
  if (inspected.runtime && APP_RUNTIME_RE.test(inspected.runtime)) {
    matchedRules.push(`runtime:${inspected.runtime}`);
  }

  return {
    bucket: (matchedRules.length ? "app" : "web") as SessionBucket,
    reason: matchedRules.length ? `Matched ${matchedRules.join(" • ")}` : "No app markers matched in platform/host/userAgent/source/runtime",
    matchedRules,
    inspected,
  };
}

function bucketOf(row: ToolRow, sessionBuckets: Map<string, SessionBucket>): SessionBucket {
  return sessionBuckets.get(row.session_id) || classifyRow(row).bucket;
}

function extractLang(row: ToolRow) {
  const raw = typeof row.metadata?.lang === "string" ? row.metadata.lang : "unknown";
  return raw.slice(0, 5);
}

function extractDuration(row: ToolRow) {
  const raw = row.metadata?.duration_seconds;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return null;
}

function normalizePath(toolId: string) {
  if (toolId === "_home") return "/";
  if (toolId.startsWith("tools_")) return `/tools/${toolId.replace(/^tools_/, "").replace(/_/g, "-")}`;
  if (toolId.startsWith("articles_")) return `/articles/${toolId.replace(/^articles_/, "").replace(/_/g, "-")}`;
  return `/${toolId.replace(/_/g, "-")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url = new URL(req.url);
    const hours = Math.min(Math.max(Number(url.searchParams.get("hours") || 48), 1), 168);
    const liveMinutes = Math.min(Math.max(Number(url.searchParams.get("liveMinutes") || 5), 1), 30);
    const dailyDays = Math.min(Math.max(Number(url.searchParams.get("days") || 7), 1), 30);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined,
    );

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
    const liveFrom = new Date(now.getTime() - liveMinutes * 60 * 1000).toISOString();
    const dailyFrom = new Date(now.getTime() - dailyDays * 24 * 60 * 60 * 1000).toISOString();

    // Paginated fetch — Supabase caps each request at 1000 rows by default.
    // We page through up to 50k rows to ensure accuracy on busy days.
    const fetchAllRows = async <T,>(
      from_iso: string,
      columns: string,
      maxRows = 50000,
    ): Promise<T[]> => {
      const pageSize = 1000;
      const all: T[] = [];
      for (let offset = 0; offset < maxRows; offset += pageSize) {
        const { data: page, error: pageErr } = await adminClient
          .from("tool_analytics")
          .select(columns)
          .gte("created_at", from_iso)
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (pageErr) throw pageErr;
        if (!page || page.length === 0) break;
        all.push(...(page as T[]));
        if (page.length < pageSize) break;
      }
      return all;
    };

    const data = await fetchAllRows<ToolRow>(from, "tool_id, session_id, action_type, metadata, created_at", 10000);
    const dailyData = await fetchAllRows<{ session_id: string; action_type: string; tool_id: string; created_at: string }>(
      dailyFrom,
      "session_id, action_type, tool_id, created_at",
      50000,
    );

    // Push subscriptions distribution (live snapshot)
    const { data: pushData } = await adminClient
      .from("push_subscriptions")
      .select("user_language");


    const rows = (data || []) as ToolRow[];
    const sessionGroups = new Map<string, ToolRow[]>();
    for (const row of rows) {
      const existing = sessionGroups.get(row.session_id) || [];
      existing.push(row);
      sessionGroups.set(row.session_id, existing);
    }

    const sessionBuckets = new Map<string, SessionBucket>();
    const sessionDebug: SessionDebugEntry[] = Array.from(sessionGroups.entries()).map(([sessionId, sessionRows]) => {
      const chronological = [...sessionRows].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const sessionStartRow = chronological.find((row) => row.action_type === "session_start");
      const firstMatchedRow = chronological.find((row) => classifyRow(row).bucket === "app");
      const classificationRow = firstMatchedRow || sessionStartRow || chronological[0];
      const classification = classifyRow(classificationRow);

      sessionBuckets.set(sessionId, classification.bucket);

      return {
        sessionId,
        bucket: classification.bucket,
        reason: classification.reason,
        matchedRules: classification.matchedRules,
        matchedActionType: classificationRow.action_type,
        matchedAt: classificationRow.created_at,
        firstSeen: chronological[0]?.created_at ?? "",
        lastSeen: chronological[chronological.length - 1]?.created_at ?? "",
        events: chronological.length,
        inspected: classification.inspected,
      };
    }).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));

    const rowsByBucket = {
      app: rows.filter((row) => bucketOf(row, sessionBuckets) === "app"),
      web: rows.filter((row) => bucketOf(row, sessionBuckets) === "web"),
    };

    const summarize = (subset: ToolRow[]) => {
      const sessionStarts = subset.filter((row) => row.action_type === "session_start");
      const pageViews = subset.filter((row) => row.action_type === "page_view" || row.action_type === "view");
      const toolViews = subset.filter((row) => row.action_type === "tool_view");
      const liveSessions = new Set(
        subset
          .filter((row) => row.created_at >= liveFrom && ["session_start", "heartbeat", "page_view", "tool_view", "view"].includes(row.action_type))
          .map((row) => row.session_id),
      ).size;

      const topPages = Object.entries(
        pageViews.reduce<Record<string, number>>((acc, row) => {
          acc[row.tool_id] = (acc[row.tool_id] || 0) + 1;
          return acc;
        }, {}),
      )
        .map(([tool_id, views]) => ({ tool_id, path: normalizePath(tool_id), views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 12);

      const byHourMap = subset.reduce<Record<string, { hour: string; views: number; sessions: Set<string> }>>((acc, row) => {
        const date = new Date(row.created_at);
        const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")} ${String(date.getUTCHours()).padStart(2, "0")}:00`;
        if (!acc[key]) acc[key] = { hour: key, views: 0, sessions: new Set() };
        if (["page_view", "tool_view", "view"].includes(row.action_type)) acc[key].views += 1;
        acc[key].sessions.add(row.session_id);
        return acc;
      }, {});

      const hourly = Object.values(byHourMap)
        .sort((a, b) => a.hour.localeCompare(b.hour))
        .map((entry) => ({ hour: entry.hour, views: entry.views, sessions: entry.sessions.size }));

      const languages = Object.entries(
        sessionStarts.reduce<Record<string, number>>((acc, row) => {
          const lang = extractLang(row);
          acc[lang] = (acc[lang] || 0) + 1;
          return acc;
        }, {}),
      )
        .map(([lang, count]) => ({ lang, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const avgDurationSeconds = (() => {
        const durations = subset
          .filter((row) => row.action_type === "session_end")
          .map(extractDuration)
          .filter((value): value is number => value !== null && value > 0);
        if (!durations.length) return null;
        return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
      })();

      return {
        totalEvents: subset.length,
        totalViews: pageViews.length + toolViews.length,
        pageViews: pageViews.length,
        toolViews: toolViews.length,
        uniqueSessions: new Set(subset.map((row) => row.session_id)).size,
        sessionStarts: sessionStarts.length,
        liveSessions,
        avgDurationSeconds,
        topPages,
        hourly,
        languages,
      };
    };

    // ===== Daily aggregates: DAU + PWA installs + app opens =====
    const dailyRows = (dailyData || []) as Array<{ session_id: string; action_type: string; tool_id: string; created_at: string }>;
    const dailyMap = new Map<string, { date: string; sessions: Set<string>; pageViews: number; pwaInstalls: number; appOpens: number }>();

    // seed last N days with zeros
    for (let i = dailyDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      dailyMap.set(key, { date: key, sessions: new Set(), pageViews: 0, pwaInstalls: 0, appOpens: 0 });
    }

    for (const row of dailyRows) {
      const d = new Date(row.created_at);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      const bucket = dailyMap.get(key);
      if (!bucket) continue;
      bucket.sessions.add(row.session_id);
      if (row.action_type === "page_view" || row.action_type === "view" || row.action_type === "tool_view") bucket.pageViews += 1;
      if (row.action_type === "pwa_install" || row.tool_id === "pwa_install") bucket.pwaInstalls += 1;
      if (row.action_type === "app_open" || row.action_type === "session_start") bucket.appOpens += 1;
    }

    const daily = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: d.date,
        dau: d.sessions.size,
        pageViews: d.pageViews,
        pwaInstalls: d.pwaInstalls,
        appOpens: d.appOpens,
      }));

    const totals = daily.reduce(
      (acc, d) => ({
        dau: acc.dau + d.dau,
        pageViews: acc.pageViews + d.pageViews,
        pwaInstalls: acc.pwaInstalls + d.pwaInstalls,
        appOpens: acc.appOpens + d.appOpens,
      }),
      { dau: 0, pageViews: 0, pwaInstalls: 0, appOpens: 0 },
    );

    // ===== Countries last 24h (derived from locale region, e.g. ar-BH → BH) =====
    const last24hIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const countryCounts = new Map<string, { country: string; sessions: Set<string>; langs: Set<string> }>();
    for (const row of rows) {
      if (row.action_type !== "session_start") continue;
      if (row.created_at < last24hIso) continue;
      const lang = extractLang(row); // e.g. "ar-BH" or "en"
      const parts = lang.split("-");
      const country = parts.length >= 2 && parts[1] ? parts[1].toUpperCase() : "??";
      if (!countryCounts.has(country)) {
        countryCounts.set(country, { country, sessions: new Set(), langs: new Set() });
      }
      const entry = countryCounts.get(country)!;
      entry.sessions.add(row.session_id);
      entry.langs.add(lang);
    }
    const countriesLast24h = Array.from(countryCounts.values())
      .map((e) => ({ country: e.country, sessions: e.sessions.size, langs: Array.from(e.langs) }))
      .sort((a, b) => b.sessions - a.sessions);

    // ===== Push subscriptions distribution =====
    const pushRows = (pushData || []) as Array<{ user_language: string }>;
    const pushByLang: Record<string, number> = {};
    for (const row of pushRows) {
      const lang = (row.user_language || "unknown").slice(0, 5);
      pushByLang[lang] = (pushByLang[lang] || 0) + 1;
    }
    const pushSubscriptions = {
      total: pushRows.length,
      byLanguage: Object.entries(pushByLang)
        .map(([lang, count]) => ({ lang, count }))
        .sort((a, b) => b.count - a.count),
    };

    return json({
      generatedAt: now.toISOString(),
      rangeHours: hours,
      liveWindowMinutes: liveMinutes,
      dailyDays,
      app: summarize(rowsByBucket.app),
      web: summarize(rowsByBucket.web),
      combined: summarize(rows),
      sessionDebug: sessionDebug.slice(0, 150),
      daily,
      dailyTotals: totals,
      pushSubscriptions,
      countriesLast24h,
    });
  } catch (error) {
    console.error("[app-usage-stats]", error);
    return json({ error: "Failed to fetch analytics" }, 500);
  }
});
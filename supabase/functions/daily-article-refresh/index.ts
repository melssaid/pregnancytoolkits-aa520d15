import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ARTICLE_SEED_REGISTRY } from "./article-seed-registry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_LANGS = ["ar", "en", "de", "fr", "es", "tr", "pt"] as const;
const CONTENT_MODEL = "google/gemini-2.5-flash";
const MAX_TOKENS = 4500;
const REQUEST_TIMEOUT_MS = 60000;
const MAX_RETRIES = 1;

const sectionLabel = (section: string, lang: string) => {
  const map: Record<string, Record<string, string>> = {
    planning: { ar: "التخطيط والخصوبة", en: "planning & fertility", de: "Planung & Fruchtbarkeit", fr: "planification & fertilité", es: "planificación y fertilidad", tr: "planlama ve doğurganlık", pt: "planejamento e fertilidade" },
    pregnant: { ar: "رحلة الحمل", en: "pregnancy journey", de: "Schwangerschaftsreise", fr: "parcours de grossesse", es: "trayecto del embarazo", tr: "gebelik yolculuğu", pt: "jornada da gravidez" },
    postpartum: { ar: "ما بعد الولادة والعناية بالطفل", en: "postpartum & baby care", de: "Wochenbett & Babypflege", fr: "post-partum & soins bébé", es: "posparto y cuidado del bebé", tr: "doğum sonrası ve bebek bakımı", pt: "pós-parto e cuidados com o bebê" },
  };
  return map[section]?.[lang] || map[section]?.en || section;
};

const buildPrompt = (seed: (typeof ARTICLE_SEED_REGISTRY)[number], lang: string) => {
  const title = (seed.titles as Record<string, string>)[lang] || seed.titles.en;
  const sectionName = sectionLabel(seed.section, lang);
  const isArabic = lang === "ar";

  // CEO Persona for Arabic: female address, formal, assertive, concise.
  // Wellness companion tone — never medical diagnosis or device terminology.
  const personaLine = isArabic
    ? "اكتبي بصيغة المؤنث المخاطب (أنتِ)، بلغة عربية فصحى أنيقة وواثقة وموجزة، بأسلوب 'رفيقة العافية' دون تشخيص طبي أو ألفاظ سريرية. لا تبدئي بتحيات أو تقديم طويل. ادخلي مباشرة في صلب الموضوع."
    : "Write in a warm, supportive, professional 'wellness companion' voice for women. Avoid clinical diagnosis or medical-device language. Use 'you' naturally. No greetings or long intros — go straight to value.";

  const safetyRules = isArabic
    ? "ممنوع: كلمات (تشخيص، علاج، دواء، جنين/جنيني — استخدمي 'الطفل' أو 'البيبي'، جهاز طبي). إذا كان الموضوع حساسًا (نزيف، ألم شديد، حركة قليلة)، اذكري ضرورة استشارة الطبيبة بأسلوب لطيف دون تهويل، ولا تعطي توصيات دوائية."
    : "Forbidden: words like 'diagnosis', 'treatment', 'prescribe', 'fetal' (use 'baby'), 'medical device'. For sensitive topics (bleeding, severe pain, low movement), gently remind to consult a clinician — never alarm, never recommend medication.";

  return `Topic: "${title}" — Section: ${sectionName}.

${personaLine}

${safetyRules}

Write a focused, useful article (550-750 words) in ${lang} that genuinely answers what a reader searches for on this exact topic.

Output strict JSON ONLY (no markdown wrapper) with these exact keys:
- title_override: string (refined title, max 80 chars)
- excerpt_override: string (1-2 sentences hook, max 200 chars)
- intro_override: string (one paragraph opening, 2-3 sentences — no greetings)
- markdown_body: string (4 sections each starting with "## " heading; each section 80-130 words; use short bullets where useful; NO h1; NO triple backticks; close all quotes)
- seo_description: string (max 155 chars, plain text)
- reading_minutes: integer (3-6)

Rules:
- Stay tightly on the exact topic. No filler intros like "In this article we will discuss".
- Practical, actionable, non-diagnostic. Wellness tone, never medical advice.
- Keep total markdown_body under 3500 characters to ensure clean JSON.
- Tags to weave naturally: ${seed.tags.join(", ")}.
- Return valid JSON, properly escaped, single object.`;
};

const callAI = async (prompt: string, apiKey: string): Promise<any> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: CONTENT_MODEL,
        temperature: 0.4,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a multilingual wellness editorial writer. Output ONLY a single valid JSON object. Never wrap in markdown. Always close all strings." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      const err: any = new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
};

// Try to repair common JSON issues from truncated AI output.
const safeParseJSON = (raw: string): any | null => {
  if (!raw) return null;
  let text = raw.trim();
  // Strip code fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try { return JSON.parse(text); } catch {}
  // Attempt: cut at last closing brace
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace > 0) {
    try { return JSON.parse(text.slice(0, lastBrace + 1)); } catch {}
  }
  // Attempt: close unterminated string + brace
  try { return JSON.parse(text + '"}'); } catch {}
  try { return JSON.parse(text + "}"); } catch {}
  return null;
};

interface ProcessResult { ok: boolean; error?: string; }

const processSeedLang = async (
  admin: any,
  seed: (typeof ARTICLE_SEED_REGISTRY)[number],
  lang: string,
  effectiveDate: string,
  apiKey: string,
): Promise<ProcessResult> => {
  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const aiData = await callAI(buildPrompt(seed, lang), apiKey);
      const raw = aiData.choices?.[0]?.message?.content ?? "";
      const parsed = safeParseJSON(raw);
      if (!parsed) {
        lastError = `JSON parse failed (attempt ${attempt + 1})`;
        continue;
      }
      const body = typeof parsed.markdown_body === "string" ? parsed.markdown_body.trim() : "";
      if (body.length < 200) {
        lastError = `markdown_body too short (${body.length} chars)`;
        continue;
      }
      const { error } = await admin.from("article_daily_content").upsert({
        slug: seed.slug,
        language: lang,
        title_override: parsed.title_override ?? null,
        excerpt_override: parsed.excerpt_override ?? null,
        intro_override: parsed.intro_override ?? null,
        markdown_body: body,
        seo_description: parsed.seo_description ?? null,
        reading_minutes: typeof parsed.reading_minutes === "number" ? parsed.reading_minutes : null,
        effective_date: effectiveDate,
        is_published: true,
      }, { onConflict: "slug,language,effective_date" });
      if (error) {
        lastError = `DB upsert failed: ${error.message}`;
        continue;
      }
      return { ok: true };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  return { ok: false, error: lastError };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey || !lovableApiKey) {
    return new Response(JSON.stringify({ error: "Missing backend configuration" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const body = await req.json().catch(() => ({}));
  const slugFilter: Set<string> | null = Array.isArray(body.slugs) && body.slugs.length
    ? new Set(body.slugs as string[]) : null;
  const languages: string[] = Array.isArray(body.languages) && body.languages.length
    ? body.languages : [...SUPPORTED_LANGS];
  const effectiveDate: string = typeof body.effectiveDate === "string"
    ? body.effectiveDate : new Date().toISOString().slice(0, 10);

  const targets = ARTICLE_SEED_REGISTRY.filter((s) => !slugFilter || slugFilter.has(s.slug));

  const runInsert = await admin.from("article_refresh_runs").insert({
    run_date: effectiveDate, status: "started", source_model: CONTENT_MODEL, languages,
  }).select("id").single();
  const runId = runInsert.data?.id;

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Sequential per-seed AND per-language to respect AI gateway rate limits (free tier).
  // ~600ms gap between calls keeps us safely under common per-minute caps.
  for (const seed of targets) {
    const results: ProcessResult[] = [];
    for (const lang of languages) {
      results.push(await processSeedLang(admin, seed, lang, effectiveDate, lovableApiKey));
      await sleep(600);
    }
    results.forEach((r, idx) => {
      if (r.ok) processed += 1;
      else {
        failed += 1;
        errors.push(`${seed.slug}/${languages[idx]}: ${r.error}`);
      }
    });

    // Lightweight progress checkpoint (silent failure on update is OK).
    if (runId) {
      await admin.from("article_refresh_runs").update({
        processed_count: processed,
        notes: `processed ${processed}, failed ${failed}, last seed ${seed.slug}`,
      }).eq("id", runId);
    }
  }

  if (runId) {
    await admin.from("article_refresh_runs").update({
      status: failed === 0 ? "completed" : (processed > 0 ? "partial" : "failed"),
      processed_count: processed,
      finished_at: new Date().toISOString(),
      error_message: errors.length ? errors.slice(0, 10).join(" | ") : null,
    }).eq("id", runId);
  }

  return new Response(JSON.stringify({
    ok: failed === 0,
    processed,
    failed,
    total: targets.length * languages.length,
    sampleErrors: errors.slice(0, 5),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});

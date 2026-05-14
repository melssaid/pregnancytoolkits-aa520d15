#!/usr/bin/env node
/**
 * Sitemap generator — runs via predev/prebuild.
 * Sources:
 *   • Routes from src/components/AnimatedRoutes.tsx
 *   • Tools from src/lib/tools-data.ts (slugs)
 *   • Articles from src/data/articles.ts
 *   • Locales from src/data/seoLocales.ts
 * Outputs sitemap.xml (index) + 4 sub-sitemaps for Google/Bing crawl efficiency.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BASE_URL = "https://pregnancytoolkits.lovable.app";
const PUBLIC = resolve(ROOT, "public");
const TODAY = new Date().toISOString().split("T")[0];

const HREFLANGS = ["en", "ar", "de", "fr", "es", "tr", "pt"];

// ---- Extract public routes from AnimatedRoutes.tsx ----
const routesSrc = readFileSync(resolve(ROOT, "src/components/AnimatedRoutes.tsx"), "utf8");
const routeRegex = /<Route\s+path="([^"]+)"\s+element=\{<PageTransition[^>]*>/g;
const allRoutes = [...routesSrc.matchAll(routeRegex)].map((m) => m[1]);
const EXCLUDE_PATTERNS = [/^\/admin/, /:/, /\*/, /^\/welcome-result$/, /^\/icon-preview$/, /^\/language-styles$/, /^\/share-target$/];
const publicRoutes = allRoutes.filter((p) => !EXCLUDE_PATTERNS.some((re) => re.test(p)));
const toolRoutes = publicRoutes.filter((p) => p.startsWith("/tools/"));
const pageRoutes = publicRoutes.filter((p) => !p.startsWith("/tools/"));

// ---- Extract article slugs ----
let articleSlugs = [];
try {
  const articlesSrc = readFileSync(resolve(ROOT, "src/data/articles.ts"), "utf8");
  const slugRegex = /slug:\s*['"]([a-z0-9-]+)['"]/g;
  articleSlugs = [...new Set([...articlesSrc.matchAll(slugRegex)].map((m) => m[1]))];
} catch { /* ignore */ }

// ---- Build XML ----
function urlEntry({ path, priority = "0.7", changefreq = "weekly", withHreflang = false }) {
  const loc = `${BASE_URL}${path}`;
  const alts = withHreflang
    ? HREFLANGS.map((lng) => `    <xhtml:link rel="alternate" hreflang="${lng}" href="${BASE_URL}${path}?lang=${lng}" />`).join("\n") +
      `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`
    : "";
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${alts ? "\n" + alts : ""}
  </url>`;
}

function buildSet(entries, withHreflang = false) {
  const ns = withHreflang
    ? `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`
    : `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${ns}\n${entries.map((e) => urlEntry({ ...e, withHreflang })).join("\n")}\n</urlset>\n`;
}

// 1. Pages sitemap (priority pages with hreflang)
const pagesXml = buildSet(
  [
    { path: "/", priority: "1.0", changefreq: "daily" },
    ...pageRoutes.map((path) => ({ path, priority: "0.8", changefreq: "weekly" })),
    ...HREFLANGS.map((lng) => ({ path: `/seo/${lng}`, priority: "0.9", changefreq: "monthly" })),
  ],
  true,
);

// 2. Tools sitemap
const toolsXml = buildSet(toolRoutes.map((path) => ({ path, priority: "0.9", changefreq: "monthly" })), true);

// 3. Articles sitemap
const articlesXml = buildSet(
  articleSlugs.map((slug) => ({ path: `/articles/${slug}`, priority: "0.6", changefreq: "monthly" })),
  false,
);

// 4. Locales (alt-language landing pages)
const localesXml = buildSet(
  HREFLANGS.map((lng) => ({ path: `/${lng}`, priority: "0.8", changefreq: "monthly" })),
  true,
);

// Index
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-pages.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-tools.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-articles.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-locales.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
</sitemapindex>
`;

writeFileSync(resolve(PUBLIC, "sitemap-pages.xml"), pagesXml);
writeFileSync(resolve(PUBLIC, "sitemap-tools.xml"), toolsXml);
writeFileSync(resolve(PUBLIC, "sitemap-articles.xml"), articlesXml);
writeFileSync(resolve(PUBLIC, "sitemap-locales.xml"), localesXml);
writeFileSync(resolve(PUBLIC, "sitemap.xml"), indexXml);

const total = pageRoutes.length + 1 + HREFLANGS.length * 2 + toolRoutes.length + articleSlugs.length;
console.log(`✓ sitemap index + 4 sub-sitemaps written (${total} URLs · ${toolRoutes.length} tools · ${articleSlugs.length} articles)`);

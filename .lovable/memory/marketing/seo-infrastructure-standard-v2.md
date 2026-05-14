---
name: SEO infrastructure standard v2
description: Sitemap generator (4 sub-sitemaps), robots.txt with AI-bot allow-list, llms.txt, JSON-LD WebSite+Org, store-listing files per language
type: feature
---

# SEO Infrastructure Standard

## Sitemap mechanism
- `scripts/generate-sitemap.mjs` runs on `predev` and `prebuild` (wired in `package.json`).
- Generates a sitemap **index** (`public/sitemap.xml`) plus 4 sub-sitemaps:
  - `sitemap-pages.xml` — homepage + landing pages + `/seo/{lang}` (with hreflang)
  - `sitemap-tools.xml` — every `/tools/*` route from `AnimatedRoutes.tsx`
  - `sitemap-articles.xml` — slugs scraped from `src/data/articles.ts`
  - `sitemap-locales.xml` — `/{en,ar,de,fr,es,tr,pt}` landing pages
- Excludes `/admin/*`, `:slug` placeholders, `*` catchall, and redirect-only routes.
- Adds `<xhtml:link rel="alternate" hreflang>` per Google guidelines.

## robots.txt
- `public/robots.txt` declares all 5 sitemaps via `Sitemap:` directives.
- Explicit Allow for AI bots: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider` — needed for AI Overviews / SGE visibility.
- Disallow `/admin/`, `/share-target`, `/welcome-result`.

## llms.txt
- `public/llms.txt` follows the llmstxt.org spec (H1 + summary + H2 link sections).
- Lists Core Tools, AI-Powered Tools, Pages, Optional. Refresh when new tool routes are added.

## JSON-LD in `index.html`
- First script block: `WebSite` (with `SearchAction` → `/discover?q={search_term_string}`) + `Organization` (with `sameAs` Google Play link). Drives Sitelinks Search Box.
- Second script block: existing `WebApplication`+`MobileApplication`+`FAQPage` — do not duplicate WebSite there.

## Store listing assets
- `store-listing/{en,ar,de,fr,es,tr,pt}.md` — Google Play title, short desc, full desc with keyword sections (fertility, pregnancy, breastfeeding/lactation per spec).
- Update version + categories in `twa-manifest.json` when shipping new build (current: v1.0.18, code 18, categories `["health_and_fitness", "parenting", "lifestyle"]`).

## CI
- `.github/workflows/seo-audit.yml` runs Lighthouse CI on PRs against `main`. Config in `.lighthouserc.json` enforces SEO ≥ 0.95.

## Do NOT
- Do not hand-edit `public/sitemap*.xml` — run the generator instead.
- Do not duplicate canonical tags between `index.html` (sitewide) and per-route `Helmet` (`SEOHead.tsx` already owns per-route canonical).
- Do not add `_redirects`/`netlify.toml`/`vercel.json` — Lovable hosting ignores them.

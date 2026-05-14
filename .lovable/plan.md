# خطة شاملة لتحسين SEO وترتيب التطبيق في Google Play والنشر

## 1. مراجعة ما هو موجود فعلاً (الوضع الحالي)

البنية التحتية للـ SEO قوية جداً ويجب البناء عليها لا استبدالها:

- `index.html`: Title, description, keywords, canonical, hreflang (7 لغات), OG/Twitter, viewport — موجود.
- `src/components/SEOHead.tsx`: Helmet ديناميكي لكل صفحة + JSON-LD (BreadcrumbList, SoftwareApplication, Article, HowTo).
- `public/sitemap.xml`: 129 رابط — لكنه يدوي، لا يتم توليده آلياً.
- `public/robots.txt`: موجود لكن ينقص توجيه `Sitemap:` وقواعد لـ AI bots.
- `public/manifest.json`: PWA كامل مع shortcuts و share_target و screenshots.
- `twa-manifest.json`: TWA جاهز لـ Play Store (v1.0.17, fullscreen, Play Billing).
- Edge functions: `og-image`, `prerender`, `rss-feed`, `indexnow-ping`, `pinterest-image`, `daily-article-refresh`.
- `src/pages/LocalizedSEOLanding.tsx` + `seoLocales.ts`: صفحات هبوط مفهرسة لكل لغة.
- `public/_headers`, `public/_redirects`: موجودة (ملاحظة: Lovable لا يقرأ `_redirects`).

## 2. ما سيتم إنجازه

### أ) SEO تقني (Web)

1. **Sitemap حي (Generator)**: `scripts/generate-sitemap.mjs` يُشغَّل في `predev`/`prebuild`، يقرأ:
  - كل routes من `App.tsx`
  - كل أداة من `tools-data.ts`
  - كل مقال من `articles-ar.ts` و `article-seed-registry.ts`
  - كل locale من `seoLocales.ts` (`/seo/{lang}`)
  - يضيف `<xhtml:link rel="alternate" hreflang>` داخل كل URL (Google يوصي بهذا في Sitemap بدل `<link>` فقط).
2. **Sitemap Index**: تقسيم لـ `sitemap-tools.xml`, `sitemap-articles.xml`, `sitemap-locales.xml`, `sitemap-pages.xml` تحت `sitemap.xml` index — أفضل لمواقع +500 URL مستقبلاً.
3. **robots.txt**: إضافة `Sitemap: https://pregnancytoolkits.lovable.app/sitemap.xml`، السماح صراحة لـ `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended` (لزيادة الظهور في AI Search/SGE)، ومنع `/admin/*` و `/share-target`.
4. **JSON-LD إضافي في `index.html**`:
  - `MobileApplication` schema يربط بحزمة Google Play (يعزز ظهور بطاقة التطبيق في SERP).
  - `Organization` مع `sameAs` لقنوات التواصل.
  - `WebSite` مع `SearchAction` (Sitelinks Search Box).
5. **Core Web Vitals**: مراجعة `webVitals.ts`، إضافة `fetchpriority="high"` على hero image + lazy loading قاطع لكل ما تحت الطية، وتقليل preload للخطوط (preload واحد بدل اثنين متطابقين في `index.html`).
6. **Image SEO**: التأكد أن كل `<img>` فيها `alt` وصفي + `width`/`height` لمنع CLS، تحويل الصور الكبيرة في `screenshots/` لـ WebP/AVIF.
7. **Internal Linking**: تفعيل `RelatedTools` و `RelatedToolLinks` في كل صفحة أداة (إن لم يكن مفعلاً).

### ب) AI Search & Discoverability

8. `**llms.txt**` و `**llms-full.txt**` في `public/`: ملخص للتطبيق وأدواته للـ LLMs (Anthropic, OpenAI, Perplexity).
9. **IndexNow التلقائي**: ربط `indexnow-ping` بـ Github Action عند كل deploy لإخطار Bing/Yandex بالصفحات الجديدة.
10. **Submit to Google Search Console**: التحقق من النطاق وتقديم Sitemap (تنفيذ عبر أداة `google_search_console`).

### ج) Multilingual & Hreflang Audit

11. **توسيع hreflang في `index.html**`: حالياً يستخدم `?lang=` لكن routes الفعلية مختلفة — ضبطها لتشير لـ `/seo/{lang}` و `/{lang}` landing pages الموجودة.
12. **توليد OG image لكل لغة** عبر `og-image` edge function في كل صفحة `LocalizedSEOLanding`.

### د) Google Play ASO (App Store Optimization)

13. **تحديث `twa-manifest.json**`:
  - رفع `appVersionCode` لـ 18 و `appVersionName` لـ 1.0.18.
    - إضافة `categories: ["health_and_fitness", "parenting"]`.
14. **Play Store Listing Assets** (يولّدها script جديد `scripts/generate-play-listing.mjs`):
  - عنوان قصير (30 حرف): `Pregnancy Tracker & Toolkit`
    - عنوان طويل (50 حرف): `Pregnancy Tracker — 33+ Tools, Due Date, Kicks`
    - وصف قصير (80 حرف) محسّن للكلمات المفتاحية.
    - وصف طويل (4000 حرف) لكل من 7 لغات، يبدأ بأقوى كلمتين مفتاحيتين، ويحتوي bullet points (Play خوارزمية تفضل ذلك).
    - حفظها في `store-listing/{lang}.md`.
    - أضف 100 كلمة اضافية للبحث فيما يخص الخصوبة والحمل والرضاعة.
15. **Screenshots requirements**: التحقق من وجود 8 screenshots بـ 1080x1920 + feature graphic 1024x500. إن نقصت، توليد عبر `imagegen` (مع نصوص قوية بكل لغة).
16. **Asset Links validation**: التأكد أن `public/.well-known/assetlinks.json` مطابق لـ SHA-256 fingerprints في `twa-manifest.json` (يوجد بالفعل، تحقق فقط).
17. **Data Safety form**: مذكرة جاهزة للنسخ في `PWA_STORE_PUBLISHING.md` تطابق `mem://compliance/google-play-data-safety-standard`.

### هـ) آليات الانتشار والنمو (Growth)

18. **Web Share API + Branch links**: تحسين `whatsappShare.ts` ليولد روابط عميقة `https://pregnancytoolkits.lovable.app/?ref=share&utm_source=wa` تتبع المصدر.
19. **Referral coupons**: تفعيل `mem://features/coupons/promotion-system` على بطاقة المشاركة (موجودة، فقط ربط).
20. **Open Graph dynamic per tool**: استدعاء `og-image` edge function بـ params لكل أداة (عنوان الأداة + اللغة) — يزيد CTR في WhatsApp/Facebook.
21. **RSS auto-discovery**: إضافة `<link rel="alternate" type="application/rss+xml">` في `index.html` يشير لـ `/functions/v1/rss-feed`.
22. **Smart App Banner**: مراجعة `SmartAppBanner.tsx` ليحوّل لـ Play Store على Android بدل التثبيت كـ PWA فقط.

### و) Monitoring & Continuous SEO

23. **GitHub Action `seo-audit.yml**`: يشغّل Lighthouse CI على كل PR ويفشل إذا SEO < 95 أو Performance < 80.
24. **Sitemap auto-ping**: cron يومي يستدعي `indexnow-ping` ويضرب `https://www.google.com/ping?sitemap=...` (مهمل لكن لا يضر) و Bing.

## 3. الملفات والتغييرات (تفاصيل تقنية)

```text
NEW:
  scripts/generate-sitemap.mjs        # يولد sitemap.xml + sitemap-*.xml
  scripts/generate-play-listing.mjs   # يولد store-listing/{lang}.md
  public/llms.txt                     # AI summary
  public/llms-full.txt                # full AI context
  store-listing/{en,ar,de,fr,es,tr,pt}.md
  .github/workflows/seo-audit.yml     # Lighthouse CI
  src/components/MobileAppSchema.tsx  # JSON-LD Component

EDIT:
  index.html                          # تنظيف preload, إضافة WebSite+MobileApp JSON-LD, RSS link, hreflang fix
  public/robots.txt                   # +Sitemap, +AI bots, +Disallow admin
  package.json                        # predev/prebuild → generate-sitemap
  twa-manifest.json                   # bump version, categories
  src/components/SmartAppBanner.tsx   # Play Store deep link
  src/components/SEOHead.tsx          # WebSite SearchAction schema
  supabase/functions/indexnow-ping    # bulk submit on demand

VERIFY (no edit unless broken):
  public/.well-known/assetlinks.json
  public/manifest.json
  src/pages/LocalizedSEOLanding.tsx
```

## 4. النتائج المتوقعة

- **Web SEO**: Lighthouse SEO 100/100، فهرسة كاملة (+500 URL ديناميكي مستقبلاً)، ظهور Sitelinks Search Box.
- **Google Play**: ترتيب أعلى عبر ASO، CTR أعلى من بطاقات SERP لظهور MobileApplication schema.
- **AI Search**: ظهور في Perplexity/ChatGPT/Google AI Overviews عبر `llms.txt`.
- **Growth**: روابط مشاركة قابلة للتتبع، OG ديناميكي لكل أداة → CTR أعلى في الشبكات الاجتماعية.

## 5. أسئلة قبل التنفيذ

1. **التحقق من Google Search Console**: هل تريد أن أنفّذ التحقق التلقائي للنطاق `pregnancytoolkits.lovable.app` عبر meta tag؟ (يستلزم نشر بعد إضافة الـ tag).
2. **توليد screenshots جديدة لـ Play Store**: هل لديك screenshots حالية بدقة 1080×1920 وfeature graphic 1024×500، أم أولّدها بـ AI image generation (سيكلف credits)؟
3. **رفع نسخة جديدة فعلياً (AAB)**: هل تريد أن أبني `.aab` جديد بـ versionCode 18 جاهز للرفع، أم تكفي تحديثات metadata الآن؟
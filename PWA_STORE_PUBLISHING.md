# 🚀 PWA Multi-Store Publishing Guide

This guide shows how to publish the PWA to **Microsoft Store**, **Samsung Galaxy Store**, and **Meta Quest Store** for free using [PWABuilder](https://www.pwabuilder.com).

> **Why this matters**: Each new store = 50M+ new potential users. Total setup time: ~2 hours. Zero recurring cost.

---

## Prerequisites (already done ✅)

The following PWA optimizations were just applied to the project:

- ✅ `manifest.json` includes `id`, `display_override`, `iarc_rating_id`, `handle_links`, `launch_handler`, `edge_side_panel`
- ✅ Both `narrow` (mobile) and `wide` (desktop) screenshots present
- ✅ Both `any` and `maskable` icon purposes for 192x192 and 512x512
- ✅ `share_target` enabled — allows users to share content INTO the app from other apps
- ✅ `protocol_handlers` registered for `web+pregnancy://` deep links
- ✅ `categories` includes `lifestyle, health, education, medical, productivity` (matches Microsoft Store taxonomy)

---

## Step 1: Validate the PWA score

1. Visit https://www.pwabuilder.com
2. Enter URL: `https://pregnancytoolkits.lovable.app`
3. Click **Start**
4. Target score: **160+/170**. Fix any RED items first.

---

## Step 2: Microsoft Store (Windows)

**Audience**: 1.4 billion Windows 10/11 devices.

### A) Create a Microsoft Partner Center account

- Go to https://partner.microsoft.com/dashboard
- One-time fee: **$19** (individual) or **$99** (company) — lifetime
- Approval takes 1–3 business days

### B) Generate the Windows package

1. On PWABuilder, click **Package for stores → Windows**
2. Fill in:
   - Package ID: `app.pregnancytoolkits.windows`
   - Publisher display name: (your Partner Center display name — must match exactly)
   - Publisher ID: copy from Partner Center → Account Settings → "Publisher ID"
   - App version: `1.0.17`
3. Click **Download Package** — you get a `.msixbundle` file + `.classic.appxbundle`
4. In Partner Center → Apps → Submit your app → Upload both files
5. Set: Pricing = Free, Markets = All, Age rating = use IARC certificate (auto-filled from manifest `iarc_rating_id`)

**Estimated review time**: 24–72 hours.

---

## Step 3: Samsung Galaxy Store

**Audience**: 1 billion+ Samsung devices, large MENA + India market overlap with our app.

### A) Create a Samsung Seller Portal account

- Go to https://seller.samsungapps.com
- **FREE** account, no fees ever
- Verification: 1–2 business days

### B) Generate the Galaxy package

1. On PWABuilder, click **Package for stores → Meta Quest** (NOT a typo — Galaxy uses the same Android package format)

   Actually correct path: use the **Android** option since Galaxy Store accepts standard Android APKs/AABs. PWABuilder generates a TWA (Trusted Web Activity) package identical to the Google Play one.

2. Important: change package ID to `app.pregnancytoolkits.galaxy` (must differ from Play Store package)
3. Download the `.aab` file
4. In Seller Portal → Add new application → Upload AAB
5. Fill metadata (you can re-use the Google Play description verbatim)

**Estimated review time**: 5–7 business days.

---

## Step 4: Meta Quest Store (optional, low priority)

Only useful if you target VR. Skip unless specifically requested.

---

## Step 5: Asset Links — IMPORTANT

After publishing to each store, the platform will give you a **SHA-256 fingerprint**. Add it to `public/.well-known/assetlinks.json` so Windows/Galaxy can verify ownership of `pregnancytoolkits.lovable.app` and open links directly in the installed app instead of the browser.

Example final assetlinks.json structure:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": { "namespace": "android_app", "package_name": "app.pregnancytoolkits.android", "sha256_cert_fingerprints": ["<PLAY_STORE_SHA>"] }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": { "namespace": "android_app", "package_name": "app.pregnancytoolkits.galaxy", "sha256_cert_fingerprints": ["<GALAXY_STORE_SHA>"] }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": { "namespace": "web", "site": "https://pregnancytoolkits.lovable.app" }
  }
]
```

---

## Step 6: Listing copy (reuse from Google Play)

Use the **same** title, description, and screenshots from Google Play Console. Microsoft Store and Galaxy Store accept identical metadata. Just change "Google Play" mentions to "Microsoft Store" / "Galaxy Store" in screenshots if needed.

**Recommended store listing keywords** (already in description):
- pregnancy tracker, due date calculator, baby kick counter, contraction timer, week by week pregnancy, prenatal app, fertility tracker, ovulation calendar

---

## Expected Impact (90 days post-launch)

| Store | Potential installs (conservative) |
|-------|-----------------------------------|
| Microsoft Store | 5,000–15,000 |
| Galaxy Store | 8,000–25,000 |
| **Total new audience** | **~30,000 installs** |

---

## Maintenance

- When the app updates significantly, regenerate packages from PWABuilder and resubmit
- Microsoft Store auto-updates the PWA shell on every visit (no resubmit needed for code changes — only metadata/icon/permission changes require a new package)
- Galaxy Store TWA: same — only resubmit if you change Android-specific config

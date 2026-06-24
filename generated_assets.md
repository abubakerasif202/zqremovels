# ZQ Removals - Generated SEO Assets

This document tracks the image assets generated for SEO purposes, detailing their prompts, settings, and post-generation SEO optimization requirements.

---

## 1. Test Asset: ZQ Removals Logo

![ZQ Removals Logo](file:///C:/Users/abuba/.gemini/antigravity-cli/brain/890e74a5-81ab-46e5-a545-c9ae6e066a3f/zq_removals_logo_1782334012663.jpg)

### Asset Metadata

* **Asset Type:** Logo / Brand Icon
* **Source Prompt:** *"A clean modern logo of ZQ Removals featuring a moving truck in a sleek gradient icon"*
* **Generator Settings:**
  * **Engine:** Native Image Generator (Fallback)
  * **Aspect Ratio:** `1:1` (Square)
  * **Output Format:** JPG (Source)

---

## 2. Post-Generation SEO Checklist

Before deploying this asset to production, the following optimization steps must be completed to ensure maximum page performance and search visibility:

### 1. Rename to SEO-Friendly File Format
* **Current Name:** `zq_removals_logo_1782334012663.jpg`
* **Target SEO Name:** `zq-removals-logo-1024x1024.webp`

### 2. Alt Text Suggestion
* **Recommended Alt Copy:** `ZQ Removals professional logo featuring a modern moving truck icon with a sleek gradient background.`

### 3. Convert to WebP Format
To optimize loading times and Core Web Vitals (LCP) pass, convert the source JPG file to a high-compression WebP file using ImageMagick:
```bash
magick zq_removals_logo_1782334012663.jpg -quality 85 zq-removals-logo-1024x1024.webp
```

### 4. File Size Target
* **Target Size:** `< 50 KB` (logo/icon category).

### 5. Schema Markup Integration
Embed the following structured data into page templates (e.g., in the home page JSON-LD block or brand organization schema):
```json
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "@id": "https://zqremovals.au/#logo",
  "url": "https://zqremovals.au/zq-removals-logo-1024x1024.webp",
  "width": 1024,
  "height": 1024,
  "caption": "ZQ Removals Logo"
}
```

#!/usr/bin/env python3
"""Apply a deterministic, one-time SEO update to the ScienceMD homepage."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOMEPAGE = ROOT / "home" / "index.html"
SITEMAP = ROOT / "sitemap.xml"

DESCRIPTION = (
    "ScienceMD is a free, portable Markdown and LaTeX editor for scientific and "
    "technical writing. Use it online, download the standalone HTML app, or "
    "install the Android APK."
)
CANONICAL = "https://coolkama.github.io/ScienceMD/home/"
SCREENSHOT = "https://coolkama.github.io/ScienceMD/home/assets/sciencemd-desktop.png"

old_head = """<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
<meta name=\"description\" content=\"ScienceMD is a portable Markdown and LaTeX editor for scientific and technical writing. Use it online, download the standalone HTML app, or install the Android APK.\">
<meta name=\"theme-color\" content=\"#071b32\">
<title>ScienceMD — Markdown and LaTeX for Scientific Writing</title>
<link rel=\"license\" href=\"https://www.apache.org/licenses/LICENSE-2.0\">"""

structured_data = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": f"{CANONICAL}#website",
            "url": CANONICAL,
            "name": "ScienceMD",
            "description": DESCRIPTION,
            "inLanguage": "en-GB",
        },
        {
            "@type": "WebPage",
            "@id": f"{CANONICAL}#webpage",
            "url": CANONICAL,
            "name": "ScienceMD — Free Markdown and LaTeX Editor for Scientific Writing",
            "description": DESCRIPTION,
            "isPartOf": {"@id": f"{CANONICAL}#website"},
            "about": {"@id": f"{CANONICAL}#software"},
            "primaryImageOfPage": {"@id": f"{CANONICAL}#primaryimage"},
            "inLanguage": "en-GB",
        },
        {
            "@type": "ImageObject",
            "@id": f"{CANONICAL}#primaryimage",
            "url": SCREENSHOT,
            "contentUrl": SCREENSHOT,
            "caption": "ScienceMD scientific Markdown and LaTeX editor",
        },
        {
            "@type": "SoftwareApplication",
            "@id": f"{CANONICAL}#software",
            "name": "ScienceMD",
            "url": CANONICAL,
            "description": DESCRIPTION,
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web browser, Android, Windows, macOS, Linux and iOS",
            "isAccessibleForFree": True,
            "offers": {
                "@type": "Offer",
                "price": 0,
                "priceCurrency": "GBP",
            },
            "license": "https://www.apache.org/licenses/LICENSE-2.0",
            "codeRepository": "https://github.com/Coolkama/ScienceMD",
            "author": {
                "@type": "Person",
                "name": "Trevor Neil Kelleher",
            },
        },
    ],
}

json_ld = json.dumps(structured_data, ensure_ascii=False, indent=2)
new_head = f"""<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">
<meta name=\"description\" content=\"{DESCRIPTION}\">
<meta name=\"author\" content=\"Trevor Neil Kelleher\">
<meta name=\"robots\" content=\"index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1\">
<meta name=\"theme-color\" content=\"#071b32\">
<title>ScienceMD — Free Markdown and LaTeX Editor for Scientific Writing</title>
<link rel=\"canonical\" href=\"{CANONICAL}\">
<link rel=\"license\" href=\"https://www.apache.org/licenses/LICENSE-2.0\">
<meta property=\"og:type\" content=\"website\">
<meta property=\"og:locale\" content=\"en_GB\">
<meta property=\"og:site_name\" content=\"ScienceMD\">
<meta property=\"og:title\" content=\"ScienceMD — Free Markdown and LaTeX Editor for Scientific Writing\">
<meta property=\"og:description\" content=\"{DESCRIPTION}\">
<meta property=\"og:url\" content=\"{CANONICAL}\">
<meta property=\"og:image\" content=\"{SCREENSHOT}\">
<meta property=\"og:image:alt\" content=\"ScienceMD scientific Markdown and LaTeX editor on desktop\">
<meta name=\"twitter:card\" content=\"summary_large_image\">
<meta name=\"twitter:title\" content=\"ScienceMD — Free Markdown and LaTeX Editor for Scientific Writing\">
<meta name=\"twitter:description\" content=\"{DESCRIPTION}\">
<meta name=\"twitter:image\" content=\"{SCREENSHOT}\">
<script type=\"application/ld+json\">
{json_ld}
</script>"""

html = HOMEPAGE.read_text(encoding="utf-8")
if '<link rel="canonical" href="https://coolkama.github.io/ScienceMD/home/">' not in html:
    count = html.count(old_head)
    if count != 1:
        raise SystemExit(f"Expected one homepage head marker, found {count}")
    html = html.replace(old_head, new_head, 1)
    HOMEPAGE.write_text(html, encoding="utf-8")

sitemap = """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"
        xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">
  <url>
    <loc>https://coolkama.github.io/ScienceMD/home/</loc>
    <lastmod>2026-07-07</lastmod>
    <image:image>
      <image:loc>https://coolkama.github.io/ScienceMD/home/assets/sciencemd-desktop.png</image:loc>
      <image:caption>ScienceMD scientific Markdown and LaTeX editor</image:caption>
    </image:image>
  </url>
  <url>
    <loc>https://coolkama.github.io/ScienceMD/</loc>
    <lastmod>2026-07-07</lastmod>
  </url>
</urlset>
"""
SITEMAP.write_text(sitemap, encoding="utf-8")

updated = HOMEPAGE.read_text(encoding="utf-8")
required = [
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    f'<link rel="canonical" href="{CANONICAL}">',
    '<script type="application/ld+json">',
    'property="og:image"',
]
missing = [item for item in required if item not in updated]
if missing:
    raise SystemExit(f"SEO update incomplete; missing: {missing}")

# Validate the JSON-LD generated above before committing it.
json.loads(json_ld)
print("Homepage SEO metadata and sitemap prepared successfully.")

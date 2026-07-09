#!/usr/bin/env python3
"""Add honest SoftwareApplication structured data for Sciwrix."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "home" / "index.html"
SOFTWARE_ID = "https://coolkama.github.io/Sciwrix/home/#software"
VERSION = "1.5.1"

software = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    "@id": SOFTWARE_ID,
    "name": "Sciwrix",
    "alternateName": "Sciwrix Markdown and LaTeX Editor",
    "description": "Sciwrix is a free, portable Markdown and LaTeX editor for scientific and technical writing. It works online, as a standalone HTML file, and as an Android APK.",
    "url": "https://coolkama.github.io/Sciwrix/home/",
    "mainEntityOfPage": {
        "@id": "https://coolkama.github.io/Sciwrix/home/#webpage"
    },
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Windows, macOS, Linux, Android, iOS, ChromeOS",
    "browserRequirements": "Requires a modern web browser with JavaScript enabled.",
    "softwareVersion": VERSION,
    "isAccessibleForFree": True,
    "license": "https://www.apache.org/licenses/LICENSE-2.0",
    "codeRepository": "https://github.com/Coolkama/Sciwrix",
    "sameAs": "https://github.com/Coolkama/Sciwrix",
    "downloadUrl": "https://github.com/Coolkama/Sciwrix/releases/latest",
    "installUrl": "https://github.com/Coolkama/Sciwrix/releases/latest",
    "image": "https://coolkama.github.io/Sciwrix/home/assets/sciencemd-desktop.png",
    "screenshot": [
        "https://coolkama.github.io/Sciwrix/home/assets/sciencemd-desktop.png",
        "https://coolkama.github.io/Sciwrix/home/assets/sciencemd-mobile.png"
    ],
    "featureList": [
        "Markdown editing",
        "WYSIWYG-style editing",
        "LaTeX mathematics",
        "Scientific tables",
        "Embedded images",
        "Print and PDF output",
        "Standalone HTML app",
        "Android APK with Markdown file handling"
    ],
    "creator": {
        "@type": "Person",
        "name": "Trevor Neil Kelleher"
    },
    "publisher": {
        "@type": "Person",
        "name": "Trevor Neil Kelleher"
    },
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "GBP",
        "availability": "https://schema.org/InStock",
        "url": "https://github.com/Coolkama/Sciwrix/releases/latest"
    }
}

script = '<script type="application/ld+json">\n' + json.dumps(software, ensure_ascii=False, indent=2) + '\n</script>\n'

text = PAGE.read_text(encoding="utf-8")
original = text

if SOFTWARE_ID not in text:
    marker = "</script>\n<style>"
    if marker not in text:
        raise SystemExit("Could not find JSON-LD insertion marker before <style>.")
    text = text.replace(marker, "</script>\n" + script + "<style>", 1)

# Keep homepage fallbacks aligned with the current public release.
text = text.replace("<span data-release-version>v1.3.3</span>", "<span data-release-version>v1.5.1</span>")
text = text.replace("const tag=rel.tag_name||'v1.3.3'", "const tag=rel.tag_name||'v1.5.1'")
text = text.replace("Latest: <span data-release-version>v1.5.0</span>", "Latest: <span data-release-version>v1.5.1</span>")
text = text.replace("const tag=rel.tag_name||'v1.5.0'", "const tag=rel.tag_name||'v1.5.1'")

if text != original:
    PAGE.write_text(text, encoding="utf-8")
    print("Updated home/index.html with SoftwareApplication structured data.")
else:
    print("SoftwareApplication structured data already present; no changes required.")

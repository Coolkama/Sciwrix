#!/usr/bin/env python3
"""Apply the one-time CKMark to Sciwrix product rebrand safely."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
SELF = Path(__file__).resolve()
WORKFLOWS = ROOT / ".github/workflows"
TEXT_SUFFIXES = {
    ".gradle",
    ".html",
    ".java",
    ".json",
    ".md",
    ".properties",
    ".py",
    ".txt",
    ".xml",
    ".yaml",
    ".yml",
}
SKIP_PARTS = {".git", "build", ".gradle"}

PUBLIC_REPLACEMENTS = [
    ("CKMark", "Sciwrix"),
    ("ckmark", "sciwrix"),
    ("Coolkama/CKMark", "Coolkama/Sciwrix"),
    ("coolkama.github.io/CKMark", "coolkama.github.io/Sciwrix"),
    ("CKMark.html", "Sciwrix.html"),
    ("CKMark.apk", "Sciwrix.apk"),
    ("CKMark-v", "Sciwrix-v"),
    ("CKMark-debug-apk", "Sciwrix-debug-apk"),
]

changed: list[Path] = []


def should_skip(path: Path) -> bool:
    if path.resolve() == SELF:
        return True
    if any(part in SKIP_PARTS for part in path.parts):
        return True
    try:
        path.relative_to(WORKFLOWS)
        return True
    except ValueError:
        return False


def replace_public_names(text: str) -> str:
    updated = text
    for old, new in PUBLIC_REPLACEMENTS:
        updated = updated.replace(old, new)
    return updated


def sciwrix_icon_data_uri() -> str:
    svg = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#2563eb'/><stop offset='100%' stop-color='#7c3aed'/></linearGradient></defs>
<rect x='8' y='8' width='112' height='112' rx='26' fill='url(#g)'/>
<path d='M31 74c12 18 52 18 64 0M31 54c12-18 52-18 64 0' fill='none' stroke='white' stroke-opacity='.25' stroke-width='5' stroke-linecap='round'/>
<path d='M38 37l12 54h7l9-34 9 34h7l12-54h-8l-8 38-9-38h-6l-9 38-8-38z' fill='white'/>
<text x='64' y='102' text-anchor='middle' font-size='18' font-family='Arial,Helvetica,sans-serif' font-weight='800' fill='white' opacity='.92'>SCI</text>
</svg>"""
    return "data:image/svg+xml," + quote(svg, safe="")


for path in ROOT.rglob("*"):
    if not path.is_file() or should_skip(path):
        continue
    if path.suffix.lower() not in TEXT_SUFFIXES:
        continue

    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue

    updated = replace_public_names(original)

    if path == ROOT / "android/app/build.gradle":
        updated = updated.replace("?: '12'", "?: '13'")
        updated = updated.replace("?: '1.4.1'", "?: '1.5.0'")
        updated = updated.replace("?: '11'", "?: '13'")
        updated = updated.replace("?: '1.4.0'", "?: '1.5.0'")

    if path == ROOT / "android/RELEASING.md":
        updated = updated.replace("1.4.1", "1.5.0")
        updated = updated.replace("1.4.0", "1.5.0")
        updated = updated.replace("versionCode 12", "versionCode 13")
        updated = updated.replace("versionCode 11", "versionCode 13")
        updated = updated.replace("version code `12`", "version code `13`")
        updated = updated.replace("version code `11`", "version code `13`")

    if path == ROOT / "tools/smoke_test.py":
        updated = updated.replace("<title>ckmark</title>", "<title>sciwrix</title>")
        updated = updated.replace("?: '12'", "?: '13'")
        updated = updated.replace("?: '1.4.1'", "?: '1.5.0'")
        updated = updated.replace("?: '11'", "?: '13'")
        updated = updated.replace("?: '1.4.0'", "?: '1.5.0'")
        updated = updated.replace("Android 1.4.1 version defaults are missing", "Android 1.5.0 version defaults are missing")
        updated = updated.replace("Android 1.4.0 version defaults are missing", "Android 1.5.0 version defaults are missing")

    if path == ROOT / "index.html":
        icon_uri = sciwrix_icon_data_uri()
        import re
        updated = re.sub(r'(<link rel="icon" type="image/svg\+xml" href=")[^"]+(">)', rf'\1{icon_uri}\2', updated, count=1)
        updated = re.sub(r'(<link rel="shortcut icon" href=")[^"]+(">)', rf'\1{icon_uri}\2', updated, count=1)
        updated = re.sub(r'(<link rel="apple-touch-icon" href=")[^"]+(">)', rf'\1{icon_uri}\2', updated, count=1)

    if updated != original:
        path.write_text(updated, encoding="utf-8")
        changed.append(path.relative_to(ROOT))

remaining: list[Path] = []
for path in ROOT.rglob("*"):
    if not path.is_file() or should_skip(path):
        continue
    if path.suffix.lower() not in TEXT_SUFFIXES:
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue
    if "CKMark" in text or "ckmark" in text:
        remaining.append(path.relative_to(ROOT))

if remaining:
    joined = "\n".join(f" - {path}" for path in remaining)
    raise SystemExit(f"Public CKMark references remain:\n{joined}")

print("Sciwrix rebrand updated:")
for path in sorted(set(changed)):
    print(f" - {path}")

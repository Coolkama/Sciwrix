#!/usr/bin/env python3
"""Fast targeted fix for the Science Paper live editor width."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
SELECTOR = ".preview.preview-style-physics"
MARKER = "/* CKMARK-PREVIEW-PHYSICS-WIDTH-FAST-FIX */"

html = INDEX.read_text(encoding="utf-8")

if MARKER in html:
    print("Fast preview physics width fix is already present.")
    raise SystemExit(0)

selector_index = html.find(SELECTOR)
if selector_index == -1:
    raise SystemExit(f"Could not find {SELECTOR}")

changed = False
search_from = 0
while True:
    selector_index = html.find(SELECTOR, search_from)
    if selector_index == -1:
        break

    brace_start = html.find("{", selector_index)
    if brace_start == -1:
        break

    selector_start = html.rfind("}", 0, selector_index) + 1
    selector_text = html[selector_start:brace_start]
    if SELECTOR not in selector_text:
        search_from = selector_index + len(SELECTOR)
        continue

    brace_end = html.find("}", brace_start)
    if brace_end == -1:
        break

    body = html[brace_start + 1:brace_end]
    new_body = body

    while True:
        lower = new_body.lower()
        prop_index = lower.find("max-width")
        if prop_index == -1:
            break

        start = new_body.rfind(";", 0, prop_index) + 1
        end = new_body.find(";", prop_index)
        if end == -1:
            end = len(new_body) - 1
        else:
            end = end + 1
        new_body = new_body[:start] + new_body[end:]

    if new_body != body:
        html = html[:brace_start + 1] + new_body + html[brace_end:]
        changed = True
        search_from = brace_start + 1 + len(new_body)
    else:
        search_from = brace_end + 1

style_end = "</style>"
last_style_end = html.rfind(style_end)
if last_style_end == -1:
    raise SystemExit("Could not find closing style tag")

override = f"""

  {MARKER}
  @media screen {{
    {SELECTOR} {{
      max-width: none !important;
      width: 100% !important;
    }}
  }}
"""
html = html[:last_style_end] + override + "\n" + html[last_style_end:]
changed = True

if not changed:
    raise SystemExit("No change was made")

INDEX.write_text(html, encoding="utf-8")
print(f"Applied fast width fix for {SELECTOR}.")

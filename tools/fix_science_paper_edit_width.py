#!/usr/bin/env python3
"""Keep the live editor wide when paper-like output styles are selected."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

html = INDEX.read_text(encoding="utf-8")

marker = "/* CKMARK-EDITOR-WIDTH-OVERRIDE */"
if marker in html:
    print("CKMark editor width override is already present.")
    raise SystemExit(0)

override = """

  /* CKMARK-EDITOR-WIDTH-OVERRIDE
     Output styles may use paper-like page widths for print/export, but the
     live editor should keep the same comfortable editing width on screen. */
  @media screen {
    main,
    .workspace,
    .editor-wrap,
    .editor-shell,
    .editor-column,
    .editor-panel,
    .editor-pane,
    .editor-card,
    .edit-pane,
    .write-pane,
    .md-pane,
    .source-pane,
    .visual-pane,
    .document-pane,
    #editor,
    #visualEditor,
    [contenteditable="true"] {
      max-width: none !important;
    }

    #editor,
    #visualEditor,
    [contenteditable="true"] {
      width: 100% !important;
    }
  }
"""

style_end = "</style>"
if style_end not in html:
    raise SystemExit("Could not find the main style block closing tag")

html = html.replace(style_end, override + "\n" + style_end, 1)
INDEX.write_text(html, encoding="utf-8")
print("Added CKMark screen-only editor width override.")

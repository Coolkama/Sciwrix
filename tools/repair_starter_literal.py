#!/usr/bin/env python3
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parents[1]
path = root / 'index.html'
text = path.read_text(encoding='utf-8')

starter = r'''# Welcome to Sciwrix

**Sciwrix** is an offline-first Markdown and LaTeX editor for scientific and technical writing. Your document remains a normal `.md` file, and all editing stays on your device.

> This starter document introduces the current Sciwrix interface. Delete it when you are ready to begin your own document.

---

## The ribbon

Sciwrix organises its controls into focused tabs:

- **File** — create, open, save, save as, and print documents.
- **Edit** — undo, redo, and find or replace text.
- **Markdown** — paragraphs, headings, bold, italic, quotations, and lists.
- **Insert** — images and horizontal rules.
- **Maths** — inline maths, display maths, and the maths palette.
- **Table** — insert and edit Markdown tables.
- **View** — switch between Visual and Markdown views, navigate sections, choose the document style, and enter fullscreen.
- **Help** — open the full guide and application information.

The toolbar changes when you select a different tab. Under **View**, you can also choose Icons, Labels, or Adaptive toolbar buttons.

---

## Visual and Markdown views

Use **Visual** for normal writing and formatting. Use **Markdown** when you want direct control of the source text.

Both views edit the same document. There is no separate preview mode: the Visual editor is the rendered editing view.

Editing is always continuous. On larger displays the document uses a comfortable page-like width with a subtle shadow. On mobile it expands to the screen width to maximise the writing area.

---

## Saving and printing

- **Save** downloads the current Markdown file.
- **Save As** lets you choose a filename and save as Markdown, rendered HTML, or LaTeX.
- **Print** prints the document as it currently appears, or lets your browser save it as PDF.

The selected **Document Style** is used both on screen and when printing. It changes appearance only; it does not alter your Markdown source.

Autosave is stored in this browser as a safety net. It is not a replacement for saving a real file.

---

## Headings and formatting

Use headings to organise longer documents:

```markdown
# Document title
## Main section
### Subsection
```

You can apply paragraph and heading styles from the **Markdown** tab, alongside bold, italic, block quotations, bulleted lists, and numbered lists.

> Quotations and code blocks use neutral shading so the document remains clear without adding decorative colour.

---

## Maths

Inline maths stays within a sentence:

\(E = mc^2\)

Display maths is shown on its own line:

\[
F = G\frac{m_1m_2}{r^2}
\]

Use the **Maths** tab to insert maths or open the maths palette. In Visual view, select a rendered formula to edit its LaTeX source, then choose **Done** to render it again.

---

## Tables

Use **Table → Insert table**, choose the number of columns and rows, then type directly into the cells.

| Quantity | Meaning | Relationship |
|---|---|---|
| \(v\) | wave speed | \(v = f\lambda\) |
| \(f\) | frequency | measured in hertz |
| \(\lambda\) | wavelength | measured in metres |

When the cursor is inside a table, the Table tab provides controls for adding or removing rows and columns, or deleting the table.

---

## Code

Triple backticks create a code block:

```csharp
public static double KineticEnergy(double mass, double velocity)
{
    return 0.5 * mass * velocity * velocity;
}
```

Sciwrix works as a standalone HTML file, through GitHub Pages, and as an Android app.
'''

literal = json.dumps(starter, ensure_ascii=False)
replacement = f'    const starterText = {literal};\n'

# First handle a normal one-line assignment.
normal = re.compile(r'^[ \t]*const starterText\s*=.*?;[ \t]*$', re.M)
text, count = normal.subn(lambda _match: replacement.rstrip('\n'), text, count=1)

# Recover the temporary malformed multiline assignment if needed. It runs until
# the next JavaScript variable declaration at the same indentation level.
if count == 0:
    malformed = re.compile(
        r'^[ \t]*const starterText\s*=.*?(?=^[ \t]*(?:const|let|var)\s+[A-Za-z_$])',
        re.M | re.S,
    )
    text, count = malformed.subn(lambda _match: replacement, text, count=1)

if count != 1:
    raise SystemExit(f'Expected one starterText assignment, repaired {count}')

valid = re.search(r'const\s+starterText\s*=\s*"(?:\\.|[^"\\\r\n])*"\s*;', text)
if valid is None:
    raise SystemExit('starterText is not a valid single-line JavaScript string')
if text.count('# Welcome to Sciwrix') != 1:
    raise SystemExit('Unexpected starter document count')
if not re.search(r'</body>\s*</html>\s*$', text, re.S | re.I):
    raise SystemExit('Document tail is invalid')

path.write_text(text, encoding='utf-8')

# ScienceMD

ScienceMD is a portable, self-contained Markdown editor designed for scientific and technical writing. It combines Markdown editing, rendered preview, WYSIWYG-style editing, LaTeX mathematics, image embedding, document styles, and print/PDF support in a single HTML file.

## Current application

The complete application is stored in [`index.html`](./index.html). Download that one file and open it in a modern browser; no installation or web server is required.

## Highlights

- Single-file, offline HTML application
- Markdown and visual editing
- Inline and display LaTeX mathematics
- Live rendered preview
- Embedded images
- Science-paper document styling
- Print and PDF output
- Desktop and mobile layouts
- Local file open/save support where the browser permits it
- Embedded ScienceMD icon

## Running ScienceMD

1. Download `index.html`.
2. Optionally rename it to `ScienceMD.html`.
3. Open it in Chrome, Edge, Firefox, Safari, or another modern browser.

All required application code and libraries are embedded in the HTML file.

## Repository structure

```text
index.html                 Complete standalone application
assets/ScienceMD-icon.png  Optimised 128 × 128 application icon
README.md                  Project information
```

## Development

ScienceMD deliberately keeps the distributed application self-contained. Changes should be tested on both desktop and mobile-sized browser windows, including Markdown editing, visual editing, mathematics rendering, file loading, saving, printing, and preview synchronisation.

## Status

ScienceMD is under active development. The repository currently contains the latest working single-file build.

## Author

Trevor Neil Kelleher

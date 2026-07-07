const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = [
  'latex_export_inline.js',
  'latex_export_tables.js',
  'latex_export_body_a.js',
  'latex_export_body_b.js',
  'latex_export_document.js'
].map(name => fs.readFileSync(path.join(__dirname, name), 'utf8')).join('\n');

const context = {
  console,
  document: {
    createElement() {
      return {
        _html: '',
        textContent: '',
        set innerHTML(value) {
          this._html = String(value);
          this.textContent = this._html
            .replace(/<br\s*\/?\s*>/gi, '\n')
            .replace(/<[^>]+>/g, '');
        },
        get innerHTML() { return this._html; }
      };
    }
  },
  editor: { value: `# Physics & Test

## Introduction

**Energy $E=mc^2$** links [here](https://example.com).

- First item
- Second item

| Name | Value |
| --- | ---: |
| Mass | $m$ |

> A quoted observation.

\`\`\`js
const energy = mass * c * c;
\`\`\`
` },
  getDocumentTitleFromMarkdown: () => 'Physics & Test',
  expandEmbeddedImages: value => value,
  downloadTextFile: () => {},
  showToast: () => {}
};

vm.createContext(context);
vm.runInContext(source, context);
const tex = context.buildLatexDocument();

const required = [
  String.raw`\documentclass[11pt,a4paper]{article}`,
  String.raw`\title{Physics \& Test}`,
  String.raw`\section{Introduction}`,
  String.raw`\textbf{Energy $E=mc^2$}`,
  String.raw`\begin{itemize}`,
  String.raw`\begin{tabularx}`,
  String.raw`\begin{quote}`,
  String.raw`\begin{lstlisting}`,
  String.raw`\href{\detokenize{https://example.com}}{here}`
];
for (const marker of required) {
  if (!tex.includes(marker)) throw new Error('Missing LaTeX marker: ' + marker);
}
if (/\uE000|\uE001/.test(tex)) throw new Error('Unresolved converter placeholder found');
console.log('Focused LaTeX export test passed.');

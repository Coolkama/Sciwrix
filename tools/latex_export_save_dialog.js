    function getSaveAsOptions() {
      const suggestedName = normaliseMarkdownFileName(currentFileName || 'science-draft.md');

      if (typeof HTMLDialogElement === 'undefined') {
        const requestedName = prompt('Save as filename:', suggestedName);
        if (requestedName === null) return Promise.resolve(null);
        const requestedFormat = prompt('Output format: Markdown, HTML, or LaTeX', 'Markdown');
        if (requestedFormat === null) return Promise.resolve(null);
        const format = /^(?:latex|tex)$/i.test(requestedFormat.trim())
          ? 'latex'
          : /^html?$/i.test(requestedFormat.trim())
            ? 'html'
            : 'markdown';
        return Promise.resolve({
          fileName: normaliseExportFileName(requestedName, format),
          format
        });
      }

      return new Promise(resolve => {
        const dialog = document.createElement('dialog');
        dialog.className = 'save-as-dialog';
        dialog.innerHTML = `
          <form method="dialog" class="save-as-form">
            <h3>Save As</h3>
            <label class="save-as-field">
              <span>Filename</span>
              <input name="fileName" type="text" value="${escapeHtml(suggestedName)}" autocomplete="off">
            </label>
            <label class="save-as-field">
              <span>Format</span>
              <select name="format">
                <option value="markdown">Markdown source (.md)</option>
                <option value="html">Rendered HTML (.html)</option>
                <option value="latex">LaTeX document (.tex)</option>
              </select>
            </label>
            <p class="save-as-note">LaTeX export preserves maths and converts common Markdown structures into a compile-ready document.</p>
            <div class="save-as-actions">
              <button value="cancel" formnovalidate>Cancel</button>
              <button class="primary" value="save">Save</button>
            </div>
          </form>
        `;

        const style = document.createElement('style');
        style.textContent = `
          .save-as-dialog { border: 1px solid var(--border); border-radius: 22px; padding: 0; background: var(--panel); color: var(--text); box-shadow: var(--shadow); width: min(92vw, 430px); }
          .save-as-dialog::backdrop { background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(3px); }
          .save-as-form { padding: 18px; display: grid; gap: 14px; }
          .save-as-form h3 { margin: 0; font-size: 1.1rem; }
          .save-as-field { display: grid; gap: 7px; font-weight: 700; }
          .save-as-field input, .save-as-field select { min-height: 44px; border-radius: 14px; border: 1px solid var(--border); background: var(--panel-2); color: var(--text); padding: 0 12px; font: inherit; }
          .save-as-note { margin: -4px 0 0; color: var(--muted); font-size: 0.9rem; }
          .save-as-actions { display: flex; justify-content: flex-end; gap: 10px; }
          .save-as-actions button { min-height: 42px; border-radius: 14px; border: 1px solid var(--border); background: var(--panel-2); color: var(--text); padding: 0 14px; font-weight: 800; }
          .save-as-actions .primary { background: var(--accent); color: white; border-color: var(--accent); }
        `;

        document.head.appendChild(style);
        document.body.appendChild(dialog);

        const input = dialog.querySelector('input[name="fileName"]');
        const formatSelect = dialog.querySelector('select[name="format"]');

        formatSelect.addEventListener('change', () => {
          input.value = normaliseExportFileName(input.value, formatSelect.value);
        });

        dialog.addEventListener('close', () => {
          const format = formatSelect.value;
          const result = dialog.returnValue === 'save'
            ? { fileName: normaliseExportFileName(input.value, format), format }
            : null;
          dialog.remove();
          style.remove();
          resolve(result);
        }, { once: true });

        dialog.showModal();
        input.focus();
        input.select();
      });
    }

    async function ensurePreviewRenderedForExport()
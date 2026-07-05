from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    if new in text:
        print(f"{label}: already applied")
        return
    if old not in text:
        raise RuntimeError(f"{label}: expected source block was not found")
    text = text.replace(old, new, 1)
    print(f"{label}: applied")


replace_once(
    """    let sourceMode = false;
    let wysiwygSyncLock = false;
    let lastScrollProgress = 0;
""",
    """    let sourceMode = false;
    let wysiwygSyncLock = false;
    let documentLoadInProgress = false;
    let lastScrollProgress = 0;
""",
    "document-load lock",
)

replace_once(
    """    function syncMarkdownFromWysiwyg() {
      if (!wysiwygEditor || wysiwygSyncLock) return;
      wysiwygSyncLock = true;
""",
    """    function syncMarkdownFromWysiwyg() {
      if (!wysiwygEditor || wysiwygSyncLock || documentLoadInProgress) return;
      wysiwygSyncLock = true;
""",
    "ignore stale visual input during document load",
)

replace_once(
    """    fileInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;

      const previousMarkdown = editor.value;
      const previousFileName = currentFileName;
      const previousImages = { ...embeddedImages };
      try {
        const text = await file.text();
        setEditorMarkdown(text, { collapseImages: true, resetScroll: true });
        setFileName(file.name);

        // After opening a file on mobile, show the rebuilt visual editor
        // immediately.  This avoids the confusing state where Preview has
        // the new file but Write is still showing stale content/scroll.
        if (sourceMode) setSourceMode(false);
        switchView('edit');
        forceWysiwygFromMarkdown({ resetScroll: true, focusStart: false });
        saveDraft(false);
        renderNow();
        showToast(`Opened ${file.name}`);
      } catch (error) {
        console.error(error);
        editor.value = previousMarkdown || starterText;
        embeddedImages = previousImages || {};
        setFileName(previousFileName || 'science-draft.md');
        forceWysiwygFromMarkdown({ resetScroll: false, focusStart: false });
        renderNow();
        showToast('Could not open that file. Your previous document was restored.');
      } finally {
        fileInput.value = '';
      }
    });
""",
    """    function prepareForDocumentOpen() {
      // Android WebView can leave an active composition attached to the
      // contenteditable editor while its file picker is open. Commit the
      // current visual document, then blur it before handing control to the
      // picker so a delayed IME event cannot restore stale WYSIWYG content.
      if (isVisualModeActive()) syncMarkdownFromWysiwyg();
      activeMathEditInput = null;
      savedWysiwygRange = null;
      hideTableTools();
      try { wysiwygEditor.blur(); } catch (_error) {}
      try { editor.blur(); } catch (_error) {}
    }

    const fileOpenControl = document.querySelector('label[for=\"fileInput\"]');
    if (fileOpenControl) fileOpenControl.addEventListener('pointerdown', prepareForDocumentOpen);
    fileInput.addEventListener('click', prepareForDocumentOpen);

    fileInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;

      prepareForDocumentOpen();
      const previousMarkdown = editor.value;
      const previousFileName = currentFileName;
      const previousImages = { ...embeddedImages };
      documentLoadInProgress = true;
      clearTimeout(renderTimer);

      try {
        const text = await file.text();
        setEditorMarkdown(text, { collapseImages: true, resetScroll: true });
        setFileName(file.name);

        // Do not call setSourceMode(false) here. It focuses the contenteditable
        // editor, which allows Android's old IME composition to write back over
        // the newly loaded Markdown. Switch the visible controls directly, then
        // perform a hard WYSIWYG rebuild while synchronisation is locked.
        sourceMode = false;
        editor.classList.add('hidden');
        wysiwygEditor.classList.remove('hidden');
        editModeLabel.textContent = 'Visual editor';
        switchView('edit');
        forceWysiwygFromMarkdown({ resetScroll: true, focusStart: false });
        saveDraft(false);
        renderNow();

        // Rebuild once more after the picker and virtual keyboard have fully
        // settled. This also protects devices that dispatch a late composition
        // event after the file input change event.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        forceWysiwygFromMarkdown({ resetScroll: true, focusStart: false });
        renderNow();
        showToast(`Opened ${file.name}`);
      } catch (error) {
        console.error(error);
        editor.value = previousMarkdown || starterText;
        embeddedImages = previousImages || {};
        setFileName(previousFileName || 'science-draft.md');
        forceWysiwygFromMarkdown({ resetScroll: false, focusStart: false });
        renderNow();
        showToast('Could not open that file. Your previous document was restored.');
      } finally {
        fileInput.value = '';
        documentLoadInProgress = false;
      }
    });
""",
    "transactional Markdown file loading",
)

path.write_text(text, encoding="utf-8")

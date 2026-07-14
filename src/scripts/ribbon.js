(() => {
  'use strict';

  const STORAGE_KEY = 'sciwrixToolbarMode';
  const VALID_MODES = new Set(['compact', 'labelled', 'adaptive']);
  const state = {
    activeTab: 'markdown',
    toolbarMode: 'adaptive',
    toastTimer: null,
    filenameObserver: null,
    sourceResizeTimer: null
  };

  const byId = id => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function notify(message) {
    const toast = byId('sciwrixRibbonToast');
    if (!toast) return;
    toast.textContent = String(message || '');
    toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('show'), 1700);
  }

  function legacyButtonById(id) {
    const element = byId(id);
    return element && !element.closest('#sciwrixRibbonShell') ? element : null;
  }

  function dispatchLegacyClick(element) {
    if (!element || element.disabled) return false;
    try {
      const EventType = window.PointerEvent || window.MouseEvent;
      element.dispatchEvent(new EventType('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerType: 'mouse'
      }));
    } catch (_error) {}
    element.click();
    return true;
  }

  function findLegacyControl(terms) {
    const wanted = terms.map(term => String(term).toLowerCase());
    const candidates = document.querySelectorAll('button, label, [role="button"]');
    for (const element of candidates) {
      if (element.closest('#sciwrixRibbonShell')) continue;
      const haystack = [
        element.id,
        element.getAttribute('title'),
        element.getAttribute('aria-label'),
        element.textContent
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').toLowerCase();
      if (wanted.every(term => haystack.includes(term))) return element;
    }
    return null;
  }

  function clickKnown(id, fallbackTerms = []) {
    const known = legacyButtonById(id);
    if (dispatchLegacyClick(known)) return true;
    const fallback = fallbackTerms.length ? findLegacyControl(fallbackTerms) : null;
    return dispatchLegacyClick(fallback);
  }

  function legacyFormatAction(action) {
    const button = document.querySelector(`.format-toolbar [data-action="${CSS.escape(action)}"]`);
    return dispatchLegacyClick(button);
  }

  function legacyTableAction(action) {
    const button = document.querySelector(`#tableTools [data-table-action="${CSS.escape(action)}"]`);
    if (!button || button.disabled) return false;
    return dispatchLegacyClick(button);
  }

  function isSourceMode() {
    const source = byId('editor');
    const visual = byId('wysiwygEditor');
    if (!source) return false;
    if (source.classList.contains('hidden')) return false;
    if (visual && !visual.classList.contains('hidden')) return false;
    return true;
  }

  function setEditorView(sourceWanted) {
    if (isSourceMode() !== sourceWanted) {
      if (!legacyFormatAction('sourceToggle')) {
        notify('The editor view could not be changed.');
        return;
      }
    }
    setTimeout(() => {
      resizeSourceEditor();
      if (state.activeTab === 'view') renderToolbar();
    }, 0);
  }

  function activeTextEditor() {
    return isSourceMode() ? byId('editor') : byId('wysiwygEditor');
  }

  function dispatchEditorInput(element) {
    if (!element) return;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function applySourceBlock(kind) {
    const source = byId('editor');
    if (!source) return false;
    const start = source.selectionStart ?? 0;
    const end = source.selectionEnd ?? start;
    const text = source.value || '';
    const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const nextBreak = text.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;
    const selected = text.slice(lineStart, lineEnd);
    let replacement = selected;

    if (kind === 'normal') {
      replacement = selected
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^>\s?/gm, '')
        .replace(/^```(?:[^\n]*)\n?/m, '')
        .replace(/\n?```\s*$/m, '');
    } else if (kind === 'code') {
      const clean = selected.replace(/^```(?:[^\n]*)\n?/m, '').replace(/\n?```\s*$/m, '');
      replacement = `\`\`\`\n${clean || 'code'}\n\`\`\``;
    }

    source.value = text.slice(0, lineStart) + replacement + text.slice(lineEnd);
    source.focus();
    source.setSelectionRange(lineStart, lineStart + replacement.length);
    dispatchEditorInput(source);
    resizeSourceEditor();
    return true;
  }

  function applyVisualBlock(kind) {
    const visual = byId('wysiwygEditor');
    if (!visual) return false;
    const tag = kind === 'code' ? '<pre>' : '<p>';

    if (typeof window.execWysiwyg === 'function') {
      window.execWysiwyg('formatBlock', tag);
      return true;
    }

    document.execCommand('formatBlock', false, tag);
    dispatchEditorInput(visual);
    return true;
  }

  function applyBlockStyle(value) {
    const map = {
      normal: null,
      h1: 'h1',
      h2: 'h2',
      h3: 'h3',
      quote: 'quote',
      code: null
    };

    if (map[value]) {
      legacyFormatAction(map[value]);
      return;
    }

    if (isSourceMode()) applySourceBlock(value);
    else applyVisualBlock(value);
  }

  function insertHorizontalRule() {
    if (!legacyFormatAction('hr')) notify('Horizontal rule is unavailable in this editor state.');
  }

  function openExport(format) {
    const ids = format === 'html'
      ? ['exportHtmlBtn', 'htmlExportBtn', 'saveHtmlBtn']
      : ['exportLatexBtn', 'latexExportBtn', 'saveLatexBtn'];
    for (const id of ids) {
      if (clickKnown(id)) return;
    }

    const direct = format === 'html'
      ? findLegacyControl(['html'])
      : (findLegacyControl(['latex']) || findLegacyControl(['tex']));
    if (dispatchLegacyClick(direct)) return;

    if (clickKnown('saveAsBtn', ['save', 'as'])) {
      notify(`Choose ${format === 'html' ? 'HTML' : 'LaTeX'} in Save As.`);
      return;
    }
    notify(`${format === 'html' ? 'HTML' : 'LaTeX'} export is unavailable.`);
  }

  function applyDocumentStyle(value) {
    const legacy = byId('previewStyle');
    if (!legacy) {
      notify('Document styles are unavailable.');
      return;
    }
    legacy.value = value;
    legacy.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function documentStyleOptions() {
    const legacy = byId('previewStyle');
    if (!legacy || !legacy.options.length) {
      return '<option value="default">Default</option>';
    }
    return Array.from(legacy.options).map(option =>
      `<option value="${escapeHtml(option.value)}">${escapeHtml(option.textContent)}</option>`
    ).join('');
  }

  function tool(action, label, icon, active = false, disabled = false) {
    return `<button type="button" class="sciwrix-tool${active ? ' active' : ''}" data-ribbon-action="${escapeHtml(action)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"${disabled ? ' disabled' : ''}>`
      + `<span class="sciwrix-tool-icon" aria-hidden="true">${icon}</span>`
      + `<span class="sciwrix-tool-label">${escapeHtml(label)}</span></button>`;
  }

  const separator = () => '<span class="sciwrix-separator" aria-hidden="true"></span>';
  const group = content => `<div class="sciwrix-tool-group">${content}</div>`;

  function tableToolsAvailable() {
    const tools = byId('tableTools');
    if (!tools) return false;
    return Array.from(tools.querySelectorAll('[data-table-action]')).some(button => !button.disabled);
  }

  function toolbarMarkup(tab) {
    switch (tab) {
      case 'file':
        return group(
          tool('new', 'New', '📄') +
          tool('open', 'Open', '📂') +
          tool('save', 'Save', '💾') +
          tool('saveAs', 'Save As', '🗎')
        ) + separator() + group(
          tool('print', 'Print', '🖨')
        );

      case 'edit':
        return group(
          tool('undo', 'Undo', '↶') +
          tool('redo', 'Redo', '↷')
        ) + separator() + group(tool('find', 'Find & Replace', '🔍'));

      case 'markdown':
        return group(
          '<select class="sciwrix-tool-select" id="sciwrixBlockStyle" aria-label="Block style">' +
            '<option value="" selected>Style</option><option value="normal">Normal</option>' +
            '<option value="h1">Heading 1</option>' +
            '<option value="h2">Heading 2</option>' +
            '<option value="h3">Heading 3</option>' +
            '<option value="quote">Blockquote</option>' +
            '<option value="code">Code block</option>' +
          '</select>'
        ) + separator() + group(
          tool('bold', 'Bold', '<strong>B</strong>') +
          tool('italic', 'Italic', '<em>I</em>')
        ) + separator() + group(
          tool('bullet', 'Bulleted list', '•≡') +
          tool('numbered', 'Numbered list', '1≡')
        );

      case 'insert':
        return group(
          tool('image', 'Image', '🖼') +
          tool('rule', 'Horizontal rule', '―')
        );

      case 'maths':
        return group(
          tool('inlineMath', 'Inline maths', '∑') +
          tool('blockMath', 'Display maths', 'Σ') +
          tool('mathPalette', 'Maths palette', 'αβ')
        );

      case 'table': {
        const unavailable = !tableToolsAvailable();
        return group(
          tool('insertTable', 'Insert table', '▦') +
          tool('addRow', 'Add row', '+R', false, unavailable) +
          tool('removeRow', 'Remove row', '−R', false, unavailable) +
          tool('addColumn', 'Add column', '+C', false, unavailable) +
          tool('removeColumn', 'Remove column', '−C', false, unavailable) +
          tool('deleteTable', 'Delete table', '⌫', false, unavailable)
        );
      }

      case 'view': {
        const source = isSourceMode();
        const legacyStyle = byId('previewStyle');
        const currentStyle = legacyStyle ? legacyStyle.value : 'default';
        return group(
          tool('visual', 'Visual', 'W', !source) +
          tool('source', 'Markdown', 'MD', source) +
          tool('sections', 'Sections', '☰')
        ) + separator() + group(
          '<span class="sciwrix-toolbar-caption">Document style</span>' +
          `<select class="sciwrix-tool-select" id="sciwrixDocumentStyle" aria-label="Document style">${documentStyleOptions()}</select>` +
          tool('fullscreen', 'Fullscreen', '⛶')
        ) + separator() + group(
          '<span class="sciwrix-toolbar-caption">Toolbar</span>' +
          '<span class="sciwrix-toolbar-modes" aria-label="Toolbar appearance">' +
            '<button type="button" data-toolbar-mode="compact">Icons</button>' +
            '<button type="button" data-toolbar-mode="labelled">Labels</button>' +
            '<button type="button" data-toolbar-mode="adaptive">Adaptive</button>' +
          '</span>'
        ) + `<span hidden data-current-document-style="${escapeHtml(currentStyle)}"></span>`;
      }

      case 'help':
        return group(tool('help', 'Help & About', 'ⓘ'));

      default:
        return '';
    }
  }

  function setToolbarMode(mode, persist = true) {
    state.toolbarMode = VALID_MODES.has(mode) ? mode : 'adaptive';
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, state.toolbarMode); } catch (_error) {}
    }
    const toolbar = byId('sciwrixDynamicToolbar');
    if (toolbar) toolbar.dataset.mode = state.toolbarMode;
    document.querySelectorAll('[data-toolbar-mode]').forEach(button => {
      button.classList.toggle('selected', button.dataset.toolbarMode === state.toolbarMode);
    });
  }

  function renderToolbar() {
    const toolbar = byId('sciwrixDynamicToolbar');
    if (!toolbar) return;
    toolbar.innerHTML = toolbarMarkup(state.activeTab);
    toolbar.dataset.mode = state.toolbarMode;

    document.querySelectorAll('.sciwrix-menu-tab').forEach(button => {
      button.classList.toggle('active', button.dataset.ribbonTab === state.activeTab);
    });

    if (state.activeTab === 'view') {
      const legacyStyle = byId('previewStyle');
      const select = byId('sciwrixDocumentStyle');
      if (select && legacyStyle) select.value = legacyStyle.value;
      setToolbarMode(state.toolbarMode, false);
    }
  }

  function activateTab(tab) {
    state.activeTab = tab;
    renderToolbar();
  }

  function handleTableAction(action) {
    const map = {
      addRow: 'addRow',
      removeRow: 'deleteRow',
      addColumn: 'addColumn',
      removeColumn: 'deleteColumn',
      deleteTable: 'deleteTable'
    };
    if (!legacyTableAction(map[action])) {
      notify('Place the cursor in a table first.');
    }
    setTimeout(() => {
      if (state.activeTab === 'table') renderToolbar();
    }, 0);
  }

  function handleRibbonAction(action) {
    switch (action) {
      case 'new': clickKnown('clearBtn', ['new']); break;
      case 'open': {
        const input = byId('fileInput');
        if (input) input.click(); else notify('Open is unavailable.');
        break;
      }
      case 'save': clickKnown('downloadBtn', ['save']); break;
      case 'saveAs': clickKnown('saveAsBtn', ['save', 'as']); break;
      case 'print': clickKnown('printBtn', ['print']); break;
      case 'undo':
        if (!clickKnown('undoBtn', ['undo'])) document.execCommand('undo');
        break;
      case 'redo':
        if (!clickKnown('redoBtn', ['redo'])) document.execCommand('redo');
        break;
      case 'find': clickKnown('findBtn', ['find']); break;
      case 'bold': legacyFormatAction('bold'); break;
      case 'italic': legacyFormatAction('italic'); break;
      case 'bullet': legacyFormatAction('bullet'); break;
      case 'numbered': legacyFormatAction('numbered'); break;
      case 'image':
        if (!legacyFormatAction('image')) {
          const imageInput = byId('imageInput');
          if (imageInput) imageInput.click();
        }
        break;
      case 'rule': insertHorizontalRule(); break;
      case 'inlineMath': legacyFormatAction('inlineMath'); break;
      case 'blockMath': legacyFormatAction('blockMath'); break;
      case 'mathPalette': clickKnown('mathBtn', ['math']); break;
      case 'insertTable': legacyFormatAction('table'); break;
      case 'addRow':
      case 'removeRow':
      case 'addColumn':
      case 'removeColumn':
      case 'deleteTable': handleTableAction(action); break;
      case 'visual': setEditorView(false); break;
      case 'source': setEditorView(true); break;
      case 'sections': clickKnown('navBtn', ['section']); break;
      case 'fullscreen': clickKnown('fullscreenBtn', ['fullscreen']); break;
      case 'help': clickKnown('helpBtn', ['help']); break;
    }
  }

  function updateFilename() {
    const legacy = byId('fileName');
    const current = byId('sciwrixFilename');
    if (!current) return;
    const value = legacy ? legacy.textContent.trim() : '';
    current.textContent = value || 'Untitled document';
  }

  function observeFilename() {
    const legacy = byId('fileName');
    if (!legacy || !window.MutationObserver) return;
    state.filenameObserver = new MutationObserver(updateFilename);
    state.filenameObserver.observe(legacy, { childList: true, characterData: true, subtree: true });
  }

  function resizeSourceEditor() {
    const source = byId('editor');
    if (!source) return;
    source.style.removeProperty('height');
  }

  function buildShell() {
    if (byId('sciwrixRibbonShell')) return;

    const oldHeader = document.querySelector('body > header') || document.querySelector('header');
    if (oldHeader) oldHeader.classList.add('sciwrix-legacy-header');

    const oldTabs = document.querySelector('body > nav.tabs') || document.querySelector('nav.tabs');
    if (oldTabs) oldTabs.classList.add('sciwrix-legacy-tabs');

    document.body.classList.add('sciwrix-ribbon-enabled');

    const shell = document.createElement('div');
    shell.id = 'sciwrixRibbonShell';
    shell.innerHTML = `
      <header class="sciwrix-appbar">
        <div class="sciwrix-brand"><span class="sciwrix-logo" aria-hidden="true">S</span><span class="sciwrix-brand-name">Sciwrix</span></div>
        <div class="sciwrix-quick" aria-label="Quick access">
          <button type="button" class="sciwrix-top-button" data-ribbon-action="save" title="Save" aria-label="Save">💾</button>
          <button type="button" class="sciwrix-top-button" data-ribbon-action="undo" title="Undo" aria-label="Undo">↶</button>
          <button type="button" class="sciwrix-top-button" data-ribbon-action="redo" title="Redo" aria-label="Redo">↷</button>
        </div>
        <div class="sciwrix-filename" id="sciwrixFilename">Untitled document</div>
        <button type="button" class="sciwrix-top-button" data-ribbon-action="fullscreen" title="Fullscreen" aria-label="Fullscreen">⛶</button>
      </header>
      <nav class="sciwrix-menu-tabs" aria-label="Toolbar categories">
        <button type="button" class="sciwrix-menu-tab" data-ribbon-tab="file">File</button>
        <button type="button" class="sciwrix-menu-tab" data-ribbon-tab="edit">Edit</button>
        <button type="button" class="sciwrix-menu-tab active" data-ribbon-tab="markdown">Markdown</button>
        <button type="button" class="sciwrix-menu-tab" data-ribbon-tab="insert">Insert</button>
        <button type="button" class="sciwrix-menu-tab" data-ribbon-tab="maths">Maths</button>
        <button type="button" class="sciwrix-menu-tab" data-ribbon-tab="table">Table</button>
        <button type="button" class="sciwrix-menu-tab" data-ribbon-tab="view">View</button>
        <button type="button" class="sciwrix-menu-tab" data-ribbon-tab="help">Help</button>
      </nav>
      <div class="sciwrix-dynamic-toolbar" id="sciwrixDynamicToolbar" data-mode="adaptive" aria-label="Dynamic toolbar"></div>`;

    document.body.insertBefore(shell, document.body.firstChild);

    const toast = document.createElement('div');
    toast.id = 'sciwrixRibbonToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);

    shell.addEventListener('pointerdown', event => {
      const button = event.target.closest('button');
      if (button && !button.disabled) event.preventDefault();
    });

    shell.addEventListener('click', event => {
      const tab = event.target.closest('[data-ribbon-tab]');
      if (tab) {
        activateTab(tab.dataset.ribbonTab);
        return;
      }

      const modeButton = event.target.closest('[data-toolbar-mode]');
      if (modeButton) {
        setToolbarMode(modeButton.dataset.toolbarMode);
        return;
      }

      const action = event.target.closest('[data-ribbon-action]');
      if (action && !action.disabled) handleRibbonAction(action.dataset.ribbonAction);
    });

    shell.addEventListener('change', event => {
      if (event.target.id === 'sciwrixBlockStyle') {
        const blockStyle = event.target.value;
        if (blockStyle) applyBlockStyle(blockStyle);
        event.target.value = '';
      } else if (event.target.id === 'sciwrixDocumentStyle') {
        applyDocumentStyle(event.target.value);
      }
    });
  }

  function initialise() {
    buildShell();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      state.toolbarMode = VALID_MODES.has(stored) ? stored : 'adaptive';
    } catch (_error) {
      state.toolbarMode = 'adaptive';
    }

    updateFilename();
    observeFilename();
    renderToolbar();
    setToolbarMode(state.toolbarMode, false);
    resizeSourceEditor();


    const visual = byId('wysiwygEditor');
    if (visual) {
      visual.addEventListener('mouseup', () => {
        if (state.activeTab === 'table') setTimeout(renderToolbar, 0);
      });
      visual.addEventListener('keyup', () => {
        if (state.activeTab === 'table') setTimeout(renderToolbar, 0);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialise, { once: true });
  } else {
    initialise();
  }
})();

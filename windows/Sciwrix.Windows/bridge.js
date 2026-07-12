(function () {
  if (!window.chrome?.webview || window.__sciwrixWindows) return;
  const post = message => window.chrome.webview.postMessage(message);
  const pendingUrls = new Set();
  let nextSaveAs = false;
  const labelFor = target => ((target.getAttribute?.('aria-label') || '') + ' ' + (target.getAttribute?.('title') || '') + ' ' + (target.textContent || '')).trim().toLowerCase().replace(/\s+/g, ' ');

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('button,[role="button"],a,label,input[type="file"]');
    if (!target) return;
    const label = labelFor(target);
    if (target.matches('input[type="file"]')) {
      const accept = (target.getAttribute('accept') || '').toLowerCase();
      if (!accept.includes('image/')) {
        event.preventDefault(); event.stopImmediatePropagation(); post({ type: 'open' });
      }
      return;
    }
    if (label.includes('save as')) nextSaveAs = true;
    else if (label === 'save' || label.includes('save current')) nextSaveAs = false;
    if (label === 'new' || label.includes('new document') || label.includes('start a fresh')) post({ type: 'new' });
  }, true);

  window.print = () => post({ type: 'print' });
  const originalRevoke = URL.revokeObjectURL.bind(URL);
  URL.revokeObjectURL = url => { if (!pendingUrls.has(url)) originalRevoke(url); };
  const originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const href = this.href || '';
    if (this.hasAttribute('download') && (href.startsWith('blob:') || href.startsWith('data:'))) {
      const name = this.getAttribute('download') || 'Sciwrix.md';
      const forceSaveAs = nextSaveAs; nextSaveAs = false; pendingUrls.add(href);
      fetch(href).then(r => r.blob()).then(async blob => {
        post({ type: 'save-begin', name, mimeType: blob.type || 'application/octet-stream', forceSaveAs });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        for (let offset = 0; offset < bytes.length; offset += 24576) {
          const slice = bytes.subarray(offset, Math.min(offset + 24576, bytes.length));
          let binary = ''; for (let i = 0; i < slice.length; i++) binary += String.fromCharCode(slice[i]);
          post({ type: 'save-chunk', data: btoa(binary) });
        }
        post({ type: 'save-complete' });
      }).catch(error => post({ type: 'save-failed', message: String(error) })).finally(() => { pendingUrls.delete(href); originalRevoke(href); });
      return;
    }
    return originalClick.apply(this, arguments);
  };

  window.__sciwrixWindows = {
    openDocument(payload) {
      try {
        const binary = atob(payload.data), bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const file = new File([bytes], payload.name, { type: payload.mimeType });
        const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
        const input = inputs.find(e => { const a = (e.getAttribute('accept') || '').toLowerCase(); return !a.includes('image/') && (a.includes('.md') || a.includes('markdown') || a.includes('text/plain')); }) || inputs.find(e => !(e.getAttribute('accept') || '').toLowerCase().includes('image/'));
        if (!input) return 'no-input';
        const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true })); return 'ok';
      } catch (error) { return 'error:' + error.message; }
    },
    showToast(message) {
      const toast = document.getElementById('toast'); if (!toast) return;
      toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200);
    }
  };
})();

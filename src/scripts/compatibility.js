  // Preserve explicit ribbon labels in older saved copies of the interface.
  (function () {
    function ready(fn) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
      else fn();
    }

    ready(function () {
      var labels = ['File', 'Document', 'Output', 'View'];
      Array.from(document.querySelectorAll('.top-toolbar .tool-group')).forEach(function (group, index) {
        if (!group.getAttribute('data-ribbon-label')) {
          group.setAttribute('data-ribbon-label', labels[index] || 'Tools');
        }
      });
    });
  })();

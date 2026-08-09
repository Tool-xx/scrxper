// ScrXper — MAIN-world hook (runs on x.com pages).
//
// Content scripts live in an "isolated world" and cannot see the page's own
// JavaScript state. To read the text that Grok copies when its "Copy text"
// button is clicked, this script (registered with "world": "MAIN" in the
// manifest) hooks the clipboard APIs and forwards the captured text to the
// isolated world via a CustomEvent on window (DOM events DO cross worlds).
//
// The overrides call the original implementations, so nothing breaks.

(() => {
  'use strict';
  if (window.__sxMain) return;
  window.__sxMain = true;

  const capture = (text) => {
    const s = String(text || '');
    if (!s) return;
    try {
      window.dispatchEvent(new CustomEvent('sxcopy', { detail: s }));
    } catch (e) { /* ignore */ }
  };

  // 1) navigator.clipboard.writeText — как копируют современные веб-приложения.
  try {
    const nc = navigator.clipboard;
    if (nc && typeof nc.writeText === 'function') {
      const orig = nc.writeText.bind(nc);
      nc.writeText = (text) => {
        capture(text);
        return orig(text);
      };
    }
  } catch (e) { /* ignore */ }

  // 1b) navigator.clipboard.write([ClipboardItem]) — низкоуровневый вариант,
  // который тоже используют веб-приложения. Текст достаём асинхронно из Blob.
  try {
    const nc = navigator.clipboard;
    if (nc && typeof nc.write === 'function') {
      const origWrite = nc.write.bind(nc);
      nc.write = (items) => {
        try {
          const item = items && items[0];
          if (item && typeof item.getType === 'function') {
            Promise.resolve(item.getType('text/plain'))
              .then((blob) => (blob && typeof blob.text === 'function' ? blob.text() : ''))
              .then((t) => { if (t) capture(t); })
              .catch(() => { /* ignore */ });
          }
        } catch (e) { /* ignore */ }
        return origWrite(items);
      };
    }
  } catch (e) { /* ignore */ }

  // 2) document.execCommand('copy') — старый способ (скрытая textarea + select).
  try {
    const origExec = document.execCommand.bind(document);
    document.execCommand = (cmd, ...args) => {
      if (cmd === 'copy') {
        try {
          const sel = window.getSelection();
          if (sel && sel.rangeCount) {
            const t = sel.toString();
            if (t) capture(t);
          }
        } catch (e) { /* ignore */ }
      }
      return origExec(cmd, ...args);
    };
  } catch (e) { /* ignore */ }

  // 3) Событие copy — пассивный запасной вариант.
  document.addEventListener('copy', (e) => {
    try {
      const t = e.clipboardData && e.clipboardData.getData('text/plain');
      if (t) capture(t);
    } catch (err) { /* ignore */ }
  }, true);
})();

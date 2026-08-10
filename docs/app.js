/* ============ ScrXper site — download logic ============ */
(function () {
  'use strict';

  const REPO = 'Tool-xx/scrxper';
  const BRANCH = 'main';
  const BASE = 'https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/';
  const VERSION = '1.9.4';
  const FETCH_TIMEOUT_MS = 8000;

  const FILES = [
    'manifest.json',
    'content.js',
    'background.js',
    'main-world.js',
    'report-builder.js',
    'popup.html',
    'popup.js',
    'README.md',
    'INSTRUCTIONS.md',
    'icons/icon16.png',
    'icons/icon32.png',
    'icons/icon48.png',
    'icons/icon128.png'
  ];

  let toastTimer = null;
  let downloading = false;

  const $ = (sel) => document.querySelector(sel);

  function toast(msg, type) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast'; }, 4200);
  }

  function setStatus(text) {
    const el = $('#dlStatus');
    if (el) el.textContent = text;
    const zip = $('#zipStatus');
    if (zip && text) zip.textContent = text;
  }

  function fmtSize(bytes) {
    if (typeof bytes !== 'number' || !isFinite(bytes)) return '';
    return bytes >= 1024 * 1024
      ? (bytes / 1024 / 1024).toFixed(2) + ' MB'
      : (bytes / 1024).toFixed(1) + ' KB';
  }

  function fetchFile(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    return fetch(BASE + path, { cache: 'no-store', signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + path);
        return r.blob();
      })
      .finally(() => clearTimeout(timer));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    if (window.SX_T) a.setAttribute('aria-label', window.SX_T('ariaDl', { f: filename }));
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 400);
  }

  // Предупреждение, если пользователь уходит со страницы во время скачивания.
  window.addEventListener('beforeunload', (e) => {
    if (!downloading) return;
    e.preventDefault();
    e.returnValue = '';
  });

  function downloadOne(path) {
    const btn = document.querySelector('.file-dl[data-file="' + path + '"]');
    if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
    downloading = true;
    fetchFile(path)
      .then((blob) => {
        const name = path.indexOf('/') >= 0 ? path.split('/').pop() : path;
        downloadBlob(blob, name);
        toast((window.SX_T ? window.SX_T('saved', { f: path, s: fmtSize(blob.size) }) : ('Сохранено: ' + path + ' (' + fmtSize(blob.size) + ')')), 'success');
      })
      .catch((e) => {
        toast((window.SX_T ? window.SX_T('error', { m: path + ' — ' + e.message }) : ('Ошибка: ' + path + ' — ' + e.message)), 'error');
      })
      .finally(() => {
        downloading = false;
        if (btn) { btn.disabled = false; btn.textContent = '[dl]'; }
      });
  }

  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => reject(new Error('JSZip CDN unavailable'));
      document.head.appendChild(s);
    });
  }

  function downloadZip() {
    const btn1 = $('#btnDownloadZip');
    const btn2 = $('#btnDownloadZip2');
    const btn = btn1 || btn2;
    if (!btn || btn.disabled) return;

    const origText1 = btn1 ? btn1.textContent : '';
    const origText2 = btn2 ? btn2.textContent : '';

    const busy = window.SX_T ? window.SX_T('collecting') : '⏳ собираю...';
    if (btn1) { btn1.disabled = true; btn1.textContent = busy; }
    if (btn2) { btn2.disabled = true; btn2.textContent = busy; }
    setStatus(window.SX_T ? window.SX_T('dlFiles', { n: FILES.length }) : ('Скачивание ' + FILES.length + ' файлов из репозитория...'));
    downloading = true;

    const fallbackSequential = () => {
      let done = 0;
      let chain = Promise.resolve();
      FILES.forEach((path) => {
        chain = chain.then(() =>
          fetchFile(path).then((blob) => {
            const name = path.indexOf('/') >= 0 ? path.split('/').pop() : path;
            downloadBlob(blob, name);
            done++;
            setStatus(window.SX_T ? window.SX_T('dlProgress', { i: done, n: FILES.length, f: path, s: fmtSize(blob.size) }) : ('Скачивание ' + done + '/' + FILES.length + ' — ' + path + ' (' + fmtSize(blob.size) + ')'));
          })
        );
      });
      return chain;
    };

    loadJSZip()
      .then((JSZip) => {
        const zip = new JSZip();
        let done = 0;
        let chain = Promise.resolve();
        FILES.forEach((path) => {
          chain = chain.then(() =>
            fetchFile(path).then((blob) => {
              zip.file(path, blob);
              done++;
              setStatus(window.SX_T ? window.SX_T('dlProgress', { i: done, n: FILES.length, f: path, s: fmtSize(blob.size) }) : ('Скачивание ' + done + '/' + FILES.length + ' — ' + path + ' (' + fmtSize(blob.size) + ')'));
            })
          );
        });
        return chain.then(() => zip.generateAsync({ type: 'blob' }));
      })
      .then((blob) => {
        downloadBlob(blob, 'scrxper-v' + VERSION + '.zip');
        toast((window.SX_T ? window.SX_T('saved', { f: 'scrxper-v' + VERSION + '.zip', s: fmtSize(blob.size) }) : ('Сохранено: scrxper-v' + VERSION + '.zip (' + fmtSize(blob.size) + ')')), 'success');
        setStatus(window.SX_T ? window.SX_T('zipReady', { s: fmtSize(blob.size) }) : ('Готово. Архив ' + fmtSize(blob.size) + ' — все файлы и иконки.'));
      })
      .catch((e) => {
        if (String(e && e.message).indexOf('JSZip') >= 0) {
          toast(window.SX_T ? window.SX_T('jszipFail') : 'JSZip недоступен — скачиваю файлы по одному...', '');
          setStatus(window.SX_T ? window.SX_T('jszipStatus') : 'JSZip недоступен, скачиваю каждый файл отдельно...');
          return fallbackSequential().then(() => {
            toast(window.SX_T ? window.SX_T('allDone') : 'Все файлы скачаны.', 'success');
            setStatus(window.SX_T ? window.SX_T('oneByOne') : 'Готово. Файлы скачаны по одному.');
          });
        }
        toast((window.SX_T ? window.SX_T('error', { m: e.message }) : ('Ошибка: ' + e.message)), 'error');
        setStatus(window.SX_T ? window.SX_T('errRetry', { m: e.message }) : ('Ошибка: ' + e.message + '. Попробуйте скачать файлы по отдельности.'));
        throw e;
      })
      .catch(() => { /* swallowed */ })
      .finally(() => {
        downloading = false;
        if (btn1) { btn1.disabled = false; btn1.textContent = origText1; }
        if (btn2) { btn2.disabled = false; btn2.textContent = origText2; }
      });
  }

  document.addEventListener('click', (e) => {
    const dl = e.target.closest('.file-dl');
    if (dl && dl.dataset.file) { downloadOne(dl.dataset.file); return; }
    if (e.target.id === 'btnDownloadZip' || e.target.closest('#btnDownloadZip') ||
        e.target.id === 'btnDownloadZip2' || e.target.closest('#btnDownloadZip2')) {
      downloadZip();
    }
  });

  // Развернуть / свернуть видео-превью на странице.
  const exp = $('#videoExpand');
  if (exp) {
    exp.addEventListener('click', () => {
      const box = exp.closest('.video-box');
      const big = box.classList.toggle('expanded');
      exp.textContent = window.SX_T ? window.SX_T(big ? 'videoCollapse' : 'videoExpand') : (big ? '[свернуть]' : '[развернуть]');
      exp.setAttribute('aria-expanded', big ? 'true' : 'false');
    });
  }
})();

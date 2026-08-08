/* ============ ScrXper site — download logic ============ */
(function () {
  'use strict';

  var REPO = 'Tool-xx/scrxper';
  var BRANCH = 'main';
  var BASE = 'https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/';
  var VERSION = '1.8.1';

  var FILES = [
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

  var toastTimer = null;

  function $(sel) { return document.querySelector(sel); }

  function toast(msg, type) {
    var el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 4200);
  }

  function setStatus(text) {
    var el = $('#dlStatus');
    if (el) el.textContent = text;
    var zip = $('#zipStatus');
    if (zip && text) zip.textContent = text;
  }

  function fetchFile(path) {
    return fetch(BASE + path, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + path);
      return r.blob();
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 400);
  }

  function downloadOne(path) {
    var btn = document.querySelector('.file-dl[data-file="' + path + '"]');
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    fetchFile(path)
      .then(function (blob) {
        var name = path.indexOf('/') >= 0 ? path.split('/').pop() : path;
        downloadBlob(blob, name);
        toast('Сохранено: ' + path, 'success');
      })
      .catch(function (e) {
        toast('Ошибка: ' + path + ' — ' + e.message, 'error');
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = '[dl]'; }
      });
  }

  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = function () { resolve(window.JSZip); };
      s.onerror = function () { reject(new Error('JSZip CDN unavailable')); };
      document.head.appendChild(s);
    });
  }

  function downloadZip() {
    var btn1 = $('#btnDownloadZip');
    var btn2 = $('#btnDownloadZip2');
    var btn = btn1 || btn2;
    if (!btn || btn.disabled) return;

    var origText1 = btn1 ? btn1.textContent : '';
    var origText2 = btn2 ? btn2.textContent : '';

    if (btn1) { btn1.disabled = true; btn1.textContent = '...собираю...'; }
    if (btn2) { btn2.disabled = true; btn2.textContent = '...собираю...'; }
    setStatus('Скачивание ' + FILES.length + ' файлов из репозитория...');

    var fallbackSequential = function () {
      var done = 0;
      var chain = Promise.resolve();
      FILES.forEach(function (path) {
        chain = chain.then(function () {
          return fetchFile(path).then(function (blob) {
            var name = path.indexOf('/') >= 0 ? path.split('/').pop() : path;
            downloadBlob(blob, name);
            done++;
            setStatus('Скачивание ' + done + '/' + FILES.length + ' — ' + path);
          });
        });
      });
      return chain;
    };

    loadJSZip()
      .then(function (JSZip) {
        var zip = new JSZip();
        var done = 0;
        var chain = Promise.resolve();
        FILES.forEach(function (path) {
          chain = chain.then(function () {
            return fetchFile(path).then(function (blob) {
              zip.file(path, blob);
              done++;
              setStatus('Скачивание ' + done + '/' + FILES.length + ' — ' + path);
            });
          });
        });
        return chain.then(function () {
          return zip.generateAsync({ type: 'blob' });
        });
      })
      .then(function (blob) {
        downloadBlob(blob, 'scrxper-v' + VERSION + '.zip');
        toast('Сохранено: scrxper-v' + VERSION + '.zip', 'success');
        setStatus('Готово. Архив содержит все файлы и иконки.');
      })
      .catch(function (e) {
        if (String(e && e.message).indexOf('JSZip') >= 0) {
          toast('JSZip недоступен — скачиваю файлы по одному...', '');
          setStatus('JSZip недоступен, скачиваю каждый файл отдельно...');
          return fallbackSequential().then(function () {
            toast('Все файлы скачаны.', 'success');
            setStatus('Готово.');
          });
        }
        toast('Ошибка: ' + e.message, 'error');
        setStatus('Ошибка: ' + e.message + '. Попробуйте скачать файлы по отдельности.');
        throw e;
      })
      .catch(function () { /* swallowed */ })
      .finally(function () {
        if (btn1) { btn1.disabled = false; btn1.textContent = origText1; }
        if (btn2) { btn2.disabled = false; btn2.textContent = origText2; }
      });
  }

  document.addEventListener('click', function (e) {
    var dl = e.target.closest('.file-dl');
    if (dl && dl.dataset.file) { downloadOne(dl.dataset.file); return; }
    if (e.target.id === 'btnDownloadZip' || e.target.closest('#btnDownloadZip') ||
        e.target.id === 'btnDownloadZip2' || e.target.closest('#btnDownloadZip2')) {
      downloadZip();
    }
  });

})();

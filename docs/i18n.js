/* ============ ScrXper site — i18n (ru/en) ============ */
/* Держит полный словарь сайта, применяет data-i18n-атрибуты, управляет
   переключателем языка, обновляет title/html lang и URL видео-ролика. */

(function () {
  'use strict';

  var I18N = {
    title: { ru: 'ScrXper — X / Twitter парсер', en: 'ScrXper — X / Twitter parser' },
    skip: { ru: 'Перейти к содержанию', en: 'Skip to content' },
    navVideo: { ru: 'видео', en: 'video' },
    navFeatures: { ru: 'возможности', en: 'features' },
    navHow: { ru: 'как работает', en: 'how it works' },
    navInstall: { ru: 'установка', en: 'install' },
    navFiles: { ru: 'скачать', en: 'download' },
    navFaq: { ru: 'faq', en: 'faq' },
    tagline: {
      ru: 'Расширение для <b>Chrome / Edge</b> (Manifest V3, 111+).<br>\n      Собирает верифицированные подписки и подписчиков из X (Twitter),<br>\n      читает количество подписчиков, строит HTML-отчёт и отправляет в Telegram.',
      en: 'A <b>Chrome / Edge</b> extension (Manifest V3, 111+).<br>\n      Collects verified following and followers from X (Twitter),<br>\n      reads follower counts, builds an HTML report and sends it to Telegram.'
    },
    btnZip: { ru: '[скачать .zip]', en: '[download .zip]' },
    btnFiles: { ru: '[скачать файлы]', en: '[download files]' },
    btnGithub: { ru: '[github]', en: '[github]' },
    btnVideo: { ru: '[▶ видео-инструкция]', en: '[▶ video guide]' },
    dlStatus: { ru: 'Файлы скачиваются напрямую из репозитория GitHub.', en: 'Files are downloaded directly from the GitHub repository.' },
    videoTitle: { ru: '== ВИДЕО-ИНСТРУКЦИЯ ==', en: '== VIDEO GUIDE ==' },
    videoDesc: {
      ru: '7 анимированных сцен: установка, Telegram, парсинг, фильтры, TAS (Grok), обновления. Проигрывается автоматически, по кругу.',
      en: '7 animated scenes: install, Telegram, parsing, filters, TAS (Grok), updates. Plays automatically, in a loop.'
    },
    videoExpand: { ru: '[развернуть]', en: '[expand]' },
    videoCollapse: { ru: '[свернуть]', en: '[collapse]' },
    videoMore: {
      ru: 'Хотите управлять воспроизведением (пауза, перемотка, сцены) — откройте <a href="demo.html">полный плеер</a>.',
      en: 'Want playback controls (pause, seek, scenes)? Open the <a href="demo.html">full player</a>.'
    },
    featuresTitle: { ru: '== ВОЗМОЖНОСТИ ==', en: '== FEATURES ==' },
    f1: { ru: '<b>Только с галочкой</b> — собираются исключительно верифицированные аккаунты', en: '<b>Verified only</b> — collects exclusively verified accounts' },
    f2: { ru: '<b>Год создания и число подписчиков</b> — приходят сразу с API (те же запросы, что делает сам x.com), без обхода профилей', en: '<b>Creation year and follower counts</b> — come straight from the API (the same requests x.com itself makes), no profile visiting' },
    f3: { ru: '<b>Фильтры</b> — год создания (2020+ / 2020- / 2020-2022 / 2020), число подписчиков (та же синтаксис) и исключение аффилированных (бизнес/организации) аккаунтов — в обоих режимах', en: '<b>Filters</b> — creation year (2020+ / 2020- / 2020-2022 / 2020), follower count (same syntax) and excluding affiliated (business/org) accounts — in both modes' },
    f4: { ru: '<b>Один HTML-отчёт</b> — тёмная тема, статистика, таблицы Подписки/Подписчики, фильтр, кнопка копирования', en: '<b>One HTML report</b> — dark theme, stats, Following/Followers tables, search filter, copy button' },
    f5: { ru: '<b>Тихий режим</b> — парсинг идёт в фоновой вкладке, которая закрывается сама', en: '<b>Silent mode</b> — parsing runs in a background tab that closes itself' },
    f6: { ru: '<b>Человеческое поведение</b> — те же GraphQL-запросы, что у веб-приложения, случайные паузы, без бот-маркеров и следов расширения', en: '<b>Human-like behavior</b> — the same GraphQL requests as the web app, random pauses, no bot markers or extension traces' },
    f7: { ru: '<b>Авто-обновление</b> — раз в час тихо сверяет версию с репозиторием; при выходе новой версии показывает плашку с кнопкой скачивания', en: '<b>Auto-update</b> — quietly checks the version against the repo every hour; shows a banner with a download button when a new version is out' },
    f8: { ru: '<b>TAS-режим (Grok)</b> — список верифицированных → OSINT-промт в Grok → посты в канал + случайный стикер', en: '<b>TAS mode (Grok)</b> — verified list → OSINT prompt to Grok → posts to the channel + a random sticker' },
    f9: { ru: '<b>Обработка ошибок</b> — логин-воллы, приватные профили, rate-limit, переименованные аккаунты, автоповторы', en: '<b>Error handling</b> — login walls, private profiles, rate limits, renamed accounts, auto-retries' },
    howTitle: { ru: '== КАК РАБОТАЕТ ==', en: '== HOW IT WORKS ==' },
    howP1Title: { ru: '[1] Обычный парсинг', en: '[1] Standard parsing' },
    howP1_1: { ru: 'Вводите ссылку на профиль, токен бота, свой Telegram ID и (по желанию) фильтры: год создания, число подписчиков, исключение аффилированных.', en: 'Enter a profile link, bot token, your Telegram ID and (optionally) filters: creation year, follower count, exclude affiliated.' },
    howP1_2: { ru: 'Расширение открывает фоновую вкладку и собирает x.com/&lt;профиль&gt;/following и /followers через те же GraphQL-операции, что и само приложение.', en: 'The extension opens a background tab and collects x.com/&lt;profile&gt;/following and /followers via the same GraphQL operations the app itself uses.' },
    howP1_3: { ru: 'Собираются только <b>верифицированные</b> аккаунты, прошедшие фильтры: имя, @username, галочка, био, год создания, число подписчиков.', en: 'Only <b>verified</b> accounts passing the filters are collected: name, @username, badge, bio, creation year, follower count.' },
    howP1_4: { ru: 'Если API-путь недоступен — автоматический фолбэк на скролл DOM.', en: 'If the API path is unavailable — automatic fallback to DOM scrolling.' },
    howP1_5: { ru: 'Собирается <b>один общий HTML-отчёт</b> и отправляется в Telegram.', en: 'One combined <b>HTML report</b> is built and sent to Telegram.' },
    howP1_6: { ru: 'Фоновая вкладка закрывается сама.', en: 'The background tab closes itself.' },
    howP2Title: { ru: '[2] TAS-режим (Grok → канал)', en: '[2] TAS mode (Grok → channel)' },
    howP2_1: { ru: 'Вводите профиль, ID канала и токен бота.', en: 'Enter the profile, channel ID and bot token.' },
    howP2_2: { ru: 'Расширение собирает <b>только ссылки</b> верифицированных аккаунтов (без био и подписчиков).', en: 'The extension collects <b>only links</b> of verified accounts (no bios or follower counts).' },
    howP2_3: { ru: 'Открывает x.com/i/grok и вставляет встроенный <b>OSINT-промт</b> со ссылками через запятую.', en: 'Opens x.com/i/grok and pastes the built-in <b>OSINT prompt</b> with the comma-separated links.' },
    howP2_4: { ru: 'Ждёт ответ Grok, нажимает «Copy text», захватывает текст через хук буфера обмена.', en: 'Waits for the Grok answer, presses “Copy text”, captures it via the clipboard hook.' },
    howP2_5: { ru: 'Ответ делится на блоки <code>{...}</code> — каждый человек отдельным постом в канал (~1 сек).', en: 'The answer is split into <code>{...}</code> blocks — each person a separate post to the channel (~1 s).' },
    howP2_6: { ru: 'Через секунду после последнего поста отправляется <b>случайный стикер</b> из пака CrazyEvilBro.', en: 'A second after the last post, a <b>random sticker</b> from the CrazyEvilBro pack is sent.' },
    howNote: {
      ru: 'Весь вывод Grok — на русском языке. Промт фильтрует по 11 критериям (популярность, финансы, крипто, карьера, личность, соц. активность, сеть, уникальность, информационная плотность, текущая активность, сигнал/шум) и строит подробные профили с анти-галлюцинационными метками.',
      en: 'All Grok output is in Russian. The prompt filters by 11 criteria (popularity, finance, crypto, career, personality, social activity, network, uniqueness, information density, current activity, signal/noise) and builds detailed profiles with anti-hallucination labels.'
    },
    installTitle: { ru: '== УСТАНОВКА ==', en: '== INSTALLATION ==' },
    install_1: {
      ru: '<b>Скачайте</b> расширение — нажмите [скачать .zip] и распакуйте в постоянную папку. В папке обязательно должен быть файл <code>manifest.json</code>.',
      en: '<b>Download</b> the extension — press [download .zip] and unpack it into a permanent folder. The folder must contain <code>manifest.json</code>.'
    },
    install_2: {
      ru: '<b>Загрузите в браузер</b> — откройте <code>chrome://extensions</code> (или <code>edge://extensions</code>), включите <b>Developer mode</b>, нажмите <b>Load unpacked</b> и выберите папку.',
      en: '<b>Load into the browser</b> — open <code>chrome://extensions</code> (or <code>edge://extensions</code>), enable <b>Developer mode</b>, press <b>Load unpacked</b> and pick the folder.'
    },
    install_3: {
      ru: '<b>Создайте Telegram-бота</b> — в <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a> выполните <code>/newbot</code> и получите токен вида <code>123456789:AAH...</code>. Узнайте свой Telegram ID через <a href="https://t.me/userinfobot" target="_blank" rel="noopener">@userinfobot</a> и <b>напишите боту /start</b> (бот не сможет писать первым).',
      en: '<b>Create a Telegram bot</b> — in <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a> run <code>/newbot</code> and get a token like <code>123456789:AAH...</code>. Find out your Telegram ID via <a href="https://t.me/userinfobot" target="_blank" rel="noopener">@userinfobot</a> and <b>message the bot /start</b> (a bot cannot message you first).'
    },
    install_4: {
      ru: '<b>Запустите</b> — откройте x.com, войдите в аккаунт, внизу справа появится панель ScrXper. Введите данные и нажмите <b>Start</b> (или <b>Test</b> для проверки бота/токена).',
      en: '<b>Run</b> — open x.com, log in; the ScrXper panel appears bottom-right. Enter your details and press <b>Start</b> (or <b>Test</b> to verify the bot/token).'
    },
    installMore: {
      ru: 'Полное руководство: <a href="https://raw.githubusercontent.com/Tool-xx/scrxper/main/INSTRUCTIONS.md" target="_blank" rel="noopener">INSTRUCTIONS.md</a>',
      en: 'Full guide: <a href="https://raw.githubusercontent.com/Tool-xx/scrxper/main/INSTRUCTIONS.md" target="_blank" rel="noopener">INSTRUCTIONS.md</a>'
    },
    filesTitle: { ru: '== СКАЧАТЬ ==', en: '== DOWNLOAD ==' },
    filesDesc: { ru: 'Файлы из <code>github.com/Tool-xx/scrxper</code> (ветка <code>main</code>), версия <b>{v}</b>.', en: 'Files from <code>github.com/Tool-xx/scrxper</code> (branch <code>main</code>), version <b>{v}</b>.' },
    filesZip: { ru: '[скачать всё — .zip]', en: '[download everything — .zip]' },
    filesZipStatus: { ru: 'Все файлы + иконки (13 штук). Вес показывается после сборки архива.', en: 'All files + icons (13 items). Size is shown after the archive is built.' },
    thFile: { ru: 'файл', en: 'file' },
    thPurpose: { ru: 'назначение', en: 'purpose' },
    fd1: { ru: 'Манифест расширения (MV3)', en: 'Extension manifest (MV3)' },
    fd2: { ru: 'Панель на x.com + сбор данных + TAS', en: 'x.com panel + data collection + TAS' },
    fd3: { ru: 'Service worker: Telegram API, управление вкладками', en: 'Service worker: Telegram API, tab management' },
    fd4: { ru: 'Хук буфера обмена (Grok → TAS)', en: 'Clipboard hook (Grok → TAS)' },
    fd5: { ru: 'Генератор HTML-отчёта', en: 'HTML report builder' },
    fd6: { ru: 'Всплывающее окно расширения (тулбар)', en: 'Extension popup (toolbar)' },
    fd7: { ru: 'Логика статуса в popup', en: 'Popup status logic' },
    fd8: { ru: 'Описание проекта', en: 'Project description' },
    fd9: { ru: 'Полная инструкция', en: 'Full instructions' },
    fd10: { ru: 'Иконки расширения (16/32/48/128)', en: 'Extension icons (16/32/48/128)' },
    ariaDl: { ru: 'Скачать {f}', en: 'Download {f}' },
    faqTitle: { ru: '== ЧАСТЫЕ ВОПРОСЫ ==', en: '== FAQ ==' },
    faq1: { ru: 'Неверный токен бота. Создайте нового бота через @BotFather и вставьте токен заново.', en: 'Wrong bot token. Create a new bot via @BotFather and paste the token again.' },
    faq2: { ru: 'Вы ни разу не писали боту. Откройте чат с ботом и нажмите <b>Start</b>.', en: 'You have never messaged the bot. Open the chat with the bot and press <b>Start</b>.' },
    faq3: { ru: 'Неверный Telegram ID. Проверьте через @userinfobot.', en: 'Wrong Telegram ID. Check it via @userinfobot.' },
    faq4: { ru: 'Не вошли в X, профиль приватный/заблокирован, или X недоступен. Войдите и выберите публичный профиль.', en: 'Not logged into X, the profile is private/blocked, or X is unavailable. Log in and pick a public profile.' },
    faq5: { ru: 'X ограничил запросы. Подождите 10–20 минут и запустите снова.', en: 'X rate-limited the requests. Wait 10–20 minutes and run again.' },
    faq6: { ru: 'Неверный ID канала или бот не является администратором. Добавьте бота админом.', en: 'Wrong channel ID, or the bot is not an admin. Add the bot as an admin.' },
    faq7: { ru: 'Не вошли в X или Grok недоступен. Откройте x.com/i/grok вручную.', en: 'Not logged into X or Grok is unavailable. Open x.com/i/grok manually.' },
    faq8: { ru: 'Grok проигнорировал формат. Проверьте ответ в Grok; промт — константа <code>TAS_PROMPT</code> в content.js.', en: 'Grok ignored the format. Check the answer in Grok; the prompt is the <code>TAS_PROMPT</code> constant in content.js.' },
    faq9: { ru: 'Разрешите всплывающие окна для x.com в настройках браузера и нажмите Start.', en: 'Allow popups for x.com in the browser settings and press Start.' },
    faq10: { ru: 'Обновите страницу x.com. Если не помогло — перезагрузите расширение (<code>chrome://extensions</code> → ↻).', en: 'Refresh the x.com page. If that does not help — reload the extension (<code>chrome://extensions</code> → ↻).' },
    faqMore: {
      ru: 'Полная таблица неполадок: <a href="https://raw.githubusercontent.com/Tool-xx/scrxper/main/INSTRUCTIONS.md" target="_blank" rel="noopener">INSTRUCTIONS.md</a>',
      en: 'Full troubleshooting table: <a href="https://raw.githubusercontent.com/Tool-xx/scrxper/main/INSTRUCTIONS.md" target="_blank" rel="noopener">INSTRUCTIONS.md</a>'
    },
    disclaimer: {
      ru: 'ИСПОЛЬЗУЙТЕ ТОЛЬКО НА СВОИХ АККАУНТАХ. АВТОМАТИЧЕСКИЙ СБОР МОЖЕТ НАРУШАТЬ УСЛОВИЯ X.',
      en: 'USE ONLY ON YOUR OWN ACCOUNTS. AUTOMATED COLLECTION MAY VIOLATE X\u2019S TERMS.'
    },
    /* статусы скачивания (app.js) */
    collecting: { ru: '⏳ собираю...', en: '⏳ collecting...' },
    dlFiles: { ru: 'Скачивание {n} файлов из репозитория...', en: 'Downloading {n} files from the repository...' },
    dlProgress: { ru: 'Скачивание {i}/{n} — {f} ({s})', en: 'Downloading {i}/{n} — {f} ({s})' },
    saved: { ru: 'Сохранено: {f} ({s})', en: 'Saved: {f} ({s})' },
    error: { ru: 'Ошибка: {m}', en: 'Error: {m}' },
    zipReady: { ru: 'Готово. Архив {s} — все файлы и иконки.', en: 'Done. Archive {s} — all files and icons.' },
    jszipFail: { ru: 'JSZip недоступен — скачиваю файлы по одному...', en: 'JSZip unavailable — downloading files one by one...' },
    jszipStatus: { ru: 'JSZip недоступен, скачиваю каждый файл отдельно...', en: 'JSZip unavailable, downloading each file separately...' },
    allDone: { ru: 'Все файлы скачаны.', en: 'All files downloaded.' },
    oneByOne: { ru: 'Готово. Файлы скачаны по одному.', en: 'Done. Files downloaded one by one.' },
    errRetry: { ru: 'Ошибка: {m}. Попробуйте скачать файлы по отдельности.', en: 'Error: {m}. Try downloading the files individually.' },
    langBtn: { ru: '[EN]', en: '[RU]' }
  };

  var STORE_KEY = 'sx_site_lang';
  var current = 'ru';

  try {
    var stored = localStorage.getItem(STORE_KEY);
    if (stored === 'en' || stored === 'ru') current = stored;
  } catch (e) { /* ignore */ }

  function T(key, vars) {
    var entry = I18N[key] || {};
    var s = entry[current] || entry.en || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  function applyLang() {
    document.documentElement.lang = current;
    document.title = T('title');
    var i;
    var el = document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-aria], [data-i18n-title]');
    for (i = 0; i < el.length; i++) {
      var n = el[i];
      var htmlKey = n.getAttribute('data-i18n-html');
      var txtKey = n.getAttribute('data-i18n');
      var ariaKey = n.getAttribute('data-i18n-aria');
      var titleKey = n.getAttribute('data-i18n-title');
      var args = null;
      var raw = n.getAttribute('data-i18n-args');
      if (raw) { try { args = JSON.parse(raw); } catch (e) { /* ignore */ } }
      if (htmlKey) n.innerHTML = T(htmlKey, args);
      else if (txtKey) n.textContent = T(txtKey, args);
      if (ariaKey) n.setAttribute('aria-label', T(ariaKey, args));
      if (titleKey) n.setAttribute('title', T(titleKey, args));
    }
    var toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.textContent = T('langBtn');
      toggle.setAttribute('aria-label', current === 'en' ? 'Русский' : 'English');
    }
    // Видео-ролик — в том же языке.
    var frame = document.getElementById('videoFrame');
    if (frame) {
      frame.src = 'demo.html?loop&lang=' + current;
    }
  }

  function setLang(l) {
    current = (l === 'en') ? 'en' : 'ru';
    try { localStorage.setItem(STORE_KEY, current); } catch (e) { /* ignore */ }
    window.SX_LANG = current; // не даём устареть снапшоту, который читает клик-хендлер
    applyLang();
  }

  window.SX_I18N = I18N;
  window.SX_LANG = current;
  window.SX_T = T;
  window.SX_applyLang = applyLang;
  window.SX_setLang = setLang;

  // Переключатель языка.
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('#langToggle') : null;
    if (t) {
      e.preventDefault();
      setLang(window.SX_LANG === 'en' ? 'ru' : 'en');
    }
  });
})();

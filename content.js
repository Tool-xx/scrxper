// ScrXper — content script (x.com).
// 1) Встраивает панель управления в страницу X (закреплённое меню).
// 2) В отдельной «скрейперской» вкладке автоматически:
//    - собирает ВЕРИФИЦИРОВАННЫХ пользователей из following и followers,
//    - шлёт единый красивый HTML-отчёт в Telegram,
//    - закрывает вкладку.

(() => {
  'use strict';
  if (window.__xenv) return;
  window.__xenv = true;

  const VERSION = '1.9.4';

  /* === I18N: язык интерфейса (ru/en), хранится в chrome.storage.local('lang') === */
  const I18N = {
    /* панель */
    'p.subtitle': { ru: 'X / Twitter парсер', en: 'X / Twitter parser' },
    'p.collapse': { ru: 'Свернуть панель', en: 'Collapse panel' },
    'p.lang': { ru: 'Сменить язык', en: 'Switch language' },
    'p.tabParser': { ru: '📊 Парсер', en: '📊 Parser' },
    'p.tabTas': { ru: '🤖 TAS', en: '🤖 TAS' },
    'p.profile': { ru: 'Ссылка на профиль', en: 'Profile link' },
    'p.phProfile': { ru: 'https://x.com/elonmusk', en: 'https://x.com/elonmusk' },
    'p.token': { ru: 'Токен Telegram-бота', en: 'Telegram bot token' },
    'p.phToken': { ru: '123456789:AAH…', en: '123456789:AAH…' },
    'p.yourId': { ru: 'Ваш Telegram ID', en: 'Your Telegram ID' },
    'p.phId': { ru: '123456789', en: '123456789' },
    'p.hintId': { ru: 'Не знаете свой ID? Напишите <b>@userinfobot</b> в Telegram.', en: "Don't know your ID? Message <b>@userinfobot</b> in Telegram." },
    'p.year': { ru: 'Год создания аккаунта', en: 'Account created (year)' },
    'p.phYear': { ru: 'любой · 2020+ · 2020- · 2020-2022', en: 'any · 2020+ · 2020- · 2020-2022' },
    'p.hintYear': { ru: 'например, <b>2020+</b> = создан в 2020 или позже, <b>2020-</b> = 2020 или раньше, <b>2020-2022</b> = диапазон. Пусто = любой год.', en: 'e.g. <b>2020+</b> = created 2020 or later, <b>2020-</b> = 2020 or earlier, <b>2020-2022</b> = range. Empty = any year.' },
    'p.followers': { ru: 'Фильтр подписчиков', en: 'Followers filter' },
    'p.phFollowers': { ru: 'любой · 1000+ · 1000- · 500-1000', en: 'any · 1000+ · 1000- · 500-1000' },
    'p.hintFollowers': { ru: 'Число подписчиков у самого аккаунта — тот же синтаксис, что и у года.', en: "The account's own follower count — same syntax as the year field." },
    'p.excludeAff': { ru: 'Исключить аффилированные (бизнес / организации)', en: 'Exclude affiliated (business / org) accounts' },
    'p.raw': { ru: 'Raw results — только ссылки на профили, одним сообщением', en: 'Raw results — only profile links, sent as one post' },
    'p.channel': { ru: 'ID Telegram-канала', en: 'Telegram channel ID' },
    'p.phChannel': { ru: '-1001234567890 или @канал', en: '-1001234567890 or @channel' },
    'p.hintChannel': { ru: 'Сюда уходят финальные посты. <b>Добавьте бота администратором</b> канала.', en: 'Where the final posts go. <b>Add your bot as an admin</b> of the channel.' },
    'p.yourId2': { ru: 'Ваш Telegram ID (логи, необязательно)', en: 'Your Telegram ID (logs, optional)' },
    'p.hintLogs': { ru: 'Сюда идут служебные логи. Если пусто — логи уходят в канал.', en: 'Operational logs go here. If empty — logs go to the channel.' },
    'p.tasNote': { ru: 'Собрать ссылки верифицированных → отправить в <b>Grok</b> → опубликовать отобранные профили в канал.', en: 'Collect verified links → send them to <b>Grok</b> → post the ranked profiles to your channel.' },
    'p.start': { ru: '🚀 Start', en: '🚀 Start' },
    'p.startTas': { ru: '🚀 Start TAS', en: '🚀 Start TAS' },
    'p.stop': { ru: '⏹ Стоп', en: '⏹ Stop' },
    'p.test': { ru: 'Отправить тестовое сообщение в Telegram', en: 'Send a test message to Telegram' },
    'p.working': { ru: 'Работаю…', en: 'Working…' },
    'p.starting': { ru: 'Запуск…', en: 'Starting…' },
    'p.ft': { ru: 'v{v} · Парсер + TAS', en: 'v{v} · Parser + TAS' },
    'p.updNew': { ru: '⬆ Доступна новая версия <b>{v}</b> (у вас {c})', en: '⬆ New version <b>{v}</b> available (you have {c})' },
    'p.updDl': { ru: 'Скачать', en: 'Download' },
    'p.updX': { ru: 'Скрыть', en: 'Dismiss' },

    /* слова (подписки/подписчики) */
    'w.following': { ru: 'подписки', en: 'following' },
    'w.followers': { ru: 'подписчики', en: 'followers' },

    /* статусы */
    'st.collecting': { ru: 'Сбор {stage}…', en: 'Collecting {stage}…' },
    'st.collectingApi': { ru: 'Сбор {stage} (API): совпадений {n}', en: 'Collecting {stage} (API): {n} matched' },
    'st.collectingDone': { ru: 'Сбор {stage}: верифицированных {n}', en: 'Collecting {stage}: {n} verified' },
    'st.followerCountsFast': { ru: 'Число подписчиков (быстро): {i}/{n}', en: 'Follower counts (fast): {i}/{n}' },
    'st.visiting': { ru: 'Обхожу {n} профиль(ей) для числа подписчиков…', en: 'Visiting {n} profile(s) for follower counts…' },
    'st.redirectSkipped': { ru: '@{h}: цикл перенаправлений — пропущен ({i}/{n})', en: '@{h}: redirect loop — skipped ({i}/{n})' },
    'st.checkingProfile': { ru: 'Проверяю @{h} ({i}/{n})…', en: 'Checking @{h} ({i}/{n})…' },
    'st.followersGot': { ru: '@{h}: {f} подписчиков ({i}/{n})', en: '@{h}: {f} followers ({i}/{n})' },
    'st.tasRestarting': { ru: 'TAS: перезапуск…', en: 'TAS: restarting…' },
    'st.tasCollecting': { ru: 'TAS: сбор верифицированных {stage}…', en: 'TAS: collecting verified {stage}…' },
    'st.tasMatched': { ru: 'TAS: верифицированных {stage}: совпадений {n}', en: 'TAS: verified {stage}: {n} matched' },
    'st.tasGot': { ru: 'TAS: верифицированных {stage}: {n}', en: 'TAS: verified {stage}: {n}' },
    'st.tasOpening': { ru: 'TAS: открываю Grok…', en: 'TAS: opening Grok…' },
    'st.tasPromptSent': { ru: 'TAS: промт отправлен в Grok — жду ответа…', en: 'TAS: prompt sent to Grok — waiting for the answer…' },
    'st.tasResumed': { ru: 'TAS: продолжено после перезагрузки — жду ответа Grok…', en: 'TAS: resumed after a reload — waiting for the Grok answer…' },
    'st.tasThinking': { ru: 'TAS: Grok думает… {s}с', en: 'TAS: Grok is thinking… {s}s' },
    'st.tasAnswered': { ru: 'TAS: Grok ответил — копирую результат…', en: 'TAS: Grok answered — copying the result…' },
    'st.tasSending': { ru: 'TAS: Grok ответил — отправляю {n} пост(ов) в канал…', en: 'TAS: Grok answered — sending {n} post(s) to the channel…' },
    'st.tasSent': { ru: 'TAS: отправлено {i}/{n} в канал', en: 'TAS: sent {i}/{n} to the channel' },
    'st.reportBuild': { ru: 'Собираю отчёт…', en: 'Building the report…' },
    'st.reportUpload': { ru: 'Загружаю отчёт в Telegram…', en: 'Uploading the report to Telegram…' },
    'st.starting': { ru: 'Запуск…', en: 'Starting…' },
    'st.tasStarting': { ru: 'TAS: запуск…', en: 'TAS: starting…' },

    /* фазы в панели */
    'ph.following': { ru: 'Шаг 1/3 · подписки', en: 'Step 1/3 · following' },
    'ph.followers': { ru: 'Шаг 2/3 · подписчики', en: 'Step 2/3 · followers' },
    'ph.enrich': { ru: 'Шаг 3/3 · число подписчиков', en: 'Step 3/3 · follower counts' },
    'ph.report': { ru: 'Отправка отчёта…', en: 'Sending report…' },
    'ph.tasFollowing': { ru: 'TAS · 1/2 · подписки', en: 'TAS · 1/2 · following' },
    'ph.tasFollowers': { ru: 'TAS · 2/2 · подписчики', en: 'TAS · 2/2 · followers' },
    'ph.tasGrok': { ru: 'TAS · Grok работает…', en: 'TAS · Grok is working…' },
    'ph.tasSend': { ru: 'TAS · отправка в канал', en: 'TAS · sending to channel' },
    'ph.working': { ru: 'Работаю…', en: 'Working…' },

    /* тосты */
    'toast.tasDone': { ru: '✅ TAS готово! @{h}: в канал отправлено {n} постов.', en: '✅ TAS done! @{h}: {n} posts sent to the channel.' },
    'toast.done': { ru: '✅ Готово! @{h}: подписки {a}, подписчики {b}{chk}. Отчёт в Telegram.', en: '✅ Done! @{h}: following {a}, followers {b}{chk}. Report is in Telegram.' },
    'toast.stopped': { ru: '⏹ Парсинг остановлен', en: '⏹ Parsing stopped' },
    'toast.stoppedShort': { ru: '⏹ Остановлено', en: '⏹ Stopped' },
    'toast.running': { ru: '⏳ Парсинг уже идёт — подождите или нажмите «Стоп»', en: '⏳ Parsing is already running — wait or press “Stop”' },
    'toast.runningTas': { ru: '⏳ Задача уже запущена — подождите или нажмите «Стоп»', en: '⏳ A task is already running — wait or press “Stop”' },
    'toast.year': { ru: '❌ Фильтр года: используйте «2020+», «2020-», «2020-2022» или «2020» (пусто = любой)', en: '❌ Year filter: use “2020+”, “2020-”, “2020-2022” or “2020” (empty = any)' },
    'toast.followers': { ru: '❌ Фильтр подписчиков: используйте «1000+», «1000-», «500-1000» или «1000» (пусто = любой)', en: '❌ Followers filter: use “1000+”, “1000-”, “500-1000” or “1000” (empty = any)' },
    'toast.noHandle': { ru: '❌ Введите ссылку на профиль или имя (например, elonmusk)', en: '❌ Enter a profile link or username (e.g. elonmusk)' },
    'toast.badHandle': { ru: '❌ Имя пользователя может содержать только латинские буквы, цифры и «_»', en: '❌ Username may only contain Latin letters, digits and “_”' },
    'toast.badToken': { ru: '❌ Токен бота должен выглядеть как «123456789:AAH…» — проверьте поле', en: '❌ Bot token should look like “123456789:AAH…” — check the field' },
    'toast.badChat': { ru: '❌ Telegram ID — это число (узнайте у @userinfobot)', en: '❌ Telegram ID is a number (check with @userinfobot)' },
    'toast.badChannel': { ru: '❌ ID канала — это число (например, -100123…) или @имя', en: '❌ Channel ID should be a number (e.g. -100123…) or @username' },
    'toast.badOwner': { ru: '❌ Ваш Telegram ID — это число (узнайте у @userinfobot)', en: '❌ Your Telegram ID is a number (check with @userinfobot)' },
    'toast.tgUnreachable': { ru: '❌ Telegram недоступен: {err}', en: '❌ Telegram is unreachable: {err}' },
    'toast.popupBlocked': { ru: '⚠️ Браузер заблокировал окно — разрешите всплывающие окна для x.com и попробуйте снова', en: '⚠️ Browser blocked the window — allow popups for x.com and try again' },
    'toast.fillFirst': { ru: '❌ Сначала заполните токен и Telegram ID', en: '❌ Fill in the token and Telegram ID first' },
    'toast.testOk': { ru: '✅ Тест отправлен в Telegram', en: '✅ Test sent to Telegram' },
    'toast.hung': { ru: '⚠️ Задача зависла — сброс. Запустите заново.', en: '⚠️ Task hung — reset. Start again.' },
    'toast.err': { ru: '❌ {err}', en: '❌ {err}' },

    /* Telegram-логи */
    'log.started': { ru: '🚀 ScrXper запустил парсинг @{h}: верифицированные подписки и подписчики. Логи придут сюда.', en: '🚀 ScrXper started parsing @{h}: verified following + followers. Logs will arrive here.' },
    'log.tasStarted': { ru: '🚀 ScrXper TAS запущен @{h}: собираю верифицированные ссылки, затем отправлю их через Grok в канал.', en: '🚀 ScrXper TAS started @{h}: collecting verified links, then sending them through Grok to the channel.' },
    'log.redirect': { ru: '❌ ScrXper: X постоянно перенаправляет @{h} — профиль мог быть переименован или удалён. Проверьте имя пользователя и запустите снова.', en: '❌ ScrXper: X keeps redirecting @{h} — the profile may be renamed or deleted. Check the username and start again.' },
    'log.rateLimit': { ru: '⚠️ ScrXper: X временно ограничивает запросы при сборе @{h}. Подождите 10–20 минут и попробуйте снова.', en: '⚠️ ScrXper: X is temporarily rate-limiting while collecting @{h}. Wait 10–20 minutes and try again.' },
    'log.cantLoadList': { ru: '❌ ScrXper: не удалось загрузить список {stage} для @{h}. Профиль может быть приватным, заблокированным, или X показывает ошибку.', en: '❌ ScrXper: could not load the {stage} list for @{h}. The profile may be private, blocked, or X is showing an error.' },
    'log.domFallback': { ru: 'ℹ️ ScrXper: быстрый API-сборщик не сработал, использован DOM-режим — фильтры года / подписчиков пропущены. Собираются только верифицированные аккаунты.', en: 'ℹ️ ScrXper: the fast API collector failed, so DOM mode was used — the year / followers filters were skipped. Only verified accounts are collected.' },
    'log.rateLimitCheck': { ru: '⚠️ ScrXper: X ограничивает запросы при проверке профилей — остановлено на {i}/{n}. Подождите 10–20 минут и запустите снова.', en: '⚠️ ScrXper: X is rate-limiting while checking profiles — stopped at {i}/{n}. Wait 10–20 minutes and run again.' },
    'log.tasRedirect': { ru: '❌ ScrXper TAS: X постоянно перенаправляет @{h} — профиль мог быть переименован или удалён. Проверьте имя пользователя и запустите снова.', en: '❌ ScrXper TAS: X keeps redirecting @{h} — the profile may be renamed or deleted. Check the username and start again.' },
    'log.tasRateLimit': { ru: '⚠️ ScrXper TAS: X временно ограничивает запросы при сборе @{h}. Подождите 10–20 минут и попробуйте снова.', en: '⚠️ ScrXper TAS: X is temporarily rate-limiting while collecting @{h}. Wait 10–20 minutes and try again.' },
    'log.tasCantLoad': { ru: '❌ ScrXper TAS: не удалось загрузить список {stage} для @{h}. Профиль может быть приватным, заблокированным, или X показывает ошибку.', en: '❌ ScrXper TAS: could not load the {stage} list for @{h}. The profile may be private, blocked, or X is showing an error.' },
    'log.tasDomFallback': { ru: 'ℹ️ ScrXper TAS: быстрый API-сборщик не сработал, использован DOM-режим — фильтры года / подписчиков пропущены. Собираются только верифицированные аккаунты.', en: 'ℹ️ ScrXper TAS: the fast API collector failed, so DOM mode was used — the year / followers filters were skipped. Only verified accounts are collected.' },
    'log.tasNoVerified': { ru: '❌ ScrXper TAS: для @{h} не найдено верифицированных аккаунтов — нечего отправлять в Grok.', en: '❌ ScrXper TAS: no verified accounts found for @{h} — nothing to send to Grok.' },
    'log.tasGrokRedirect': { ru: '❌ ScrXper TAS: X постоянно перенаправляет с Grok. Откройте x.com/i/grok вручную и запустите задачу снова.', en: '❌ ScrXper TAS: X keeps redirecting away from Grok. Open x.com/i/grok manually, then start the task again.' },
    'log.tasNoInput': { ru: '❌ ScrXper TAS: не удалось найти поле ввода Grok на x.com/i/grok. Убедитесь, что вы вошли в аккаунт и Grok доступен.', en: '❌ ScrXper TAS: could not find the Grok input on x.com/i/grok. Make sure you are logged in and Grok is available for your account.' },
    'log.tasEmptyLinks': { ru: '❌ ScrXper TAS: список верифицированных ссылок пуст для @{h}.', en: '❌ ScrXper TAS: the verified links list is empty for @{h}.' },
    'log.tasNoSend': { ru: '❌ ScrXper TAS: не удалось найти кнопку отправки Grok после ввода промта.', en: '❌ ScrXper TAS: could not find the Grok send button after typing the prompt.' },
    'log.tasError': { ru: '⚠️ ScrXper TAS: X / Grok показывает ошибку или страницу rate-limit. Подождите 10–20 минут и запустите снова.', en: '⚠️ ScrXper TAS: X / Grok shows an error or rate-limit page. Wait 10–20 minutes and run again.' },
    'log.tasTimeout': { ru: '❌ ScrXper TAS: Grok не завершил ответ за 15 минут. Откройте x.com/i/grok и проверьте статус.', en: '❌ ScrXper TAS: Grok did not finish the answer in 15 minutes. Open x.com/i/grok to check the status.' },
    'log.tasUnreadable': { ru: '❌ ScrXper TAS: не удалось прочитать ответ Grok (пусто или нечитаемо). Откройте x.com/i/grok и проверьте ответ.', en: '❌ ScrXper TAS: could not read the Grok answer (empty or unreadable). Open x.com/i/grok and check the response.' },
    'log.tasOnlyPrompt': { ru: '❌ ScrXper TAS: не удалось прочитать ответ Grok — найден только текст промта. Откройте x.com/i/grok и проверьте ответ.', en: '❌ ScrXper TAS: could not read the Grok answer — only the prompt message was found. Open x.com/i/grok and check the response.' },
    'log.tasNoBlocks': { ru: 'ℹ️ ScrXper TAS: ответ Grok не содержит блоков {...} — отправляю одним постом.', en: 'ℹ️ ScrXper TAS: the Grok answer does not contain {...} blocks — sending it as a single post.' },
    'log.tasRawEmpty': { ru: '❌ ScrXper TAS: включён Raw results, но в ответе Grok не найдено ссылок x.com. Откройте x.com/i/grok и проверьте ответ.', en: '❌ ScrXper TAS: Raw results is on, but no x.com links were found in the Grok answer. Open x.com/i/grok and check the response.' },
    'log.tasRaw': { ru: 'ℹ️ ScrXper TAS: Raw results — извлечено ссылок: {n}, отправляю одним сообщением.', en: 'ℹ️ ScrXper TAS: Raw results — {n} link(s) extracted, sending as a single post.' },
    'log.tasSendTimeout': { ru: '⏰ ScrXper TAS: отправка в канал превысила время — часть постов могла потеряться. Запустите задачу снова.', en: '⏰ ScrXper TAS: sending to the channel timed out — some posts may be missing. Run the task again.' },
    'log.tasPostFail': { ru: '❌ ScrXper TAS: не удалось отправить пост {i}/{n} в канал: {err}. Проверьте ID канала и что бот является его администратором.', en: '❌ ScrXper TAS: could not send post {i}/{n} to the channel: {err}. Check the channel ID and that the bot is an admin there.' },
    'log.stickerSent': { ru: '🎲 Случайный стикер отправлен в канал.', en: '🎲 A random sticker was sent to the channel.' },
    'log.stickerFail': { ru: 'ℹ️ Не удалось отправить стикер: {err}', en: 'ℹ️ The sticker could not be sent: {err}' },
    'log.reportFail': { ru: '❌ ScrXper: отчёт для @{h} не удалось отправить в Telegram ({err}). Запустите задачу снова.', en: '❌ ScrXper: the report for @{h} could not be sent to Telegram ({err}). Run the task again.' },
    'log.verifiedChunk': { ru: 'Верифицированные аккаунты', en: 'Verified accounts' },
    'log.captionReport': { ru: '📊 Отчёт ScrXper @{h} · {n} верифицированных · число подписчиков', en: '📊 ScrXper report @{h} · {n} verified · follower counts' },
    'log.listEmpty': { ru: '{label} @{h}: список пуст', en: '{label} @{h}: list is empty' },

    /* итоги */
    'sum.tasComplete': { ru: '✅ ScrXper TAS — завершено', en: '✅ ScrXper TAS — complete' },
    'sum.profile': { ru: '👤 Профиль: @{h}', en: '👤 Profile: @{h}' },
    'sum.links': { ru: '🔗 Собрано верифицированных ссылок: {n}', en: '🔗 Verified links collected: {n}' },
    'sum.posts': { ru: '📨 Постов отправлено в канал: {n}', en: '📨 Posts sent to the channel: {n}' },
    'sum.time': { ru: '⏱ Время: {d}', en: '⏱ Time: {d}' },
    'sum.complete': { ru: '✅ ScrXper — парсинг завершён', en: '✅ ScrXper — parsing complete' },
    'sum.following': { ru: '🔵 Подписки (верифицированные): {n}', en: '🔵 Following (verified): {n}' },
    'sum.followers': { ru: '🔵 Подписчики (верифицированные): {n}', en: '🔵 Followers (verified): {n}' },
    'sum.unique': { ru: '🔀 Уникальных верифицированных: {n}', en: '🔀 Unique verified: {n}' },
    'sum.checked': { ru: '👥 Проверено профилей: {n}', en: '👥 Profiles checked: {n}' },
    'sum.linksWord': { ru: 'ссылок', en: 'links' },

    /* слова */
    'w.parsing': { ru: 'парсинг', en: 'parsing' },
    'w.parse': { ru: 'парсинг', en: 'parse' },
    'w.part': { ru: 'часть', en: 'part' },

    /* прочие статусы/сообщения */
    'p.testMsg': { ru: '🧪 ScrXper: тестовое сообщение. Всё работает — запускайте парсинг!', en: '🧪 ScrXper: test message. Everything works — start parsing!' },
    'st.followingDone': { ru: 'Подписки: {n} верифицированных — перехожу к подписчикам…', en: 'Following: {n} verified — moving to followers…' },
    'log.timeout': { ru: '⏰ ScrXper: {kind} @{h} не уложился в отведённое время. Запустите задачу снова.', en: '⏰ ScrXper: {kind} @{h} timed out. Run the task again.' },
    'log.loginWall': { ru: '❌ ScrXper: войдите в X, чтобы запустить {act} @{h}. Откройте x.com, войдите и запустите задачу снова.', en: '❌ ScrXper: you need to be logged in to X to {act} @{h}. Open x.com, sign in, and start again.' },

    /* внутренние коды ошибок → человеческий текст */
    'err.redirects': { ru: 'Профиль перенаправляет (переименован/удалён)', en: 'Profile redirects' },
    'err.rateLimit': { ru: 'X временно ограничивает запросы', en: 'X rate limit' },
    'err.timeout': { ru: 'Превышено время', en: 'Timeout' },
    'err.login': { ru: 'Требуется вход в X', en: 'Login to X required' },
    'err.cantLoad': { ru: 'Не удалось загрузить список', en: 'Could not load the list' },
    'err.storage': { ru: 'Ошибка хранилища', en: 'Storage error' },
    'err.tabDead': { ru: 'Вкладка парсинга не отвечает — задача сброшена', en: 'Parsing tab is not responding — task reset' },
    'err.tabClosed': { ru: 'Вкладка закрыта вручную', en: 'Tab closed manually' },
    'err.noLinks': { ru: 'В ответе Grok нет ссылок', en: 'No links in Grok answer' },
    'err.sendTimeout': { ru: 'Превышено время отправки', en: 'Timeout while sending' },
    'err.channelSend': { ru: 'Не удалось отправить в канал:', en: 'Channel send failed:' },
    'err.reportDeliver': { ru: 'Не удалось доставить отчёт:', en: 'Could not deliver the report:' },
    'err.popup': { ru: 'Браузер заблокировал окно', en: 'Browser blocked the window' },
    'err.unknown': { ru: 'Ошибка', en: 'Error' }
  };
  let LANG = 'ru';
  let applyLang = null; // назначается в injectPanel
  function t(key, vars) {
    const entry = I18N[key] || {};
    let s = entry[LANG] || entry.en || key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    return s;
  }
  function setLang(l, apply) {
    LANG = (l === 'en') ? 'en' : 'ru';
    try { chrome.storage.local.set({ lang: LANG }); } catch (e) { /* ignore */ }
    if (apply && typeof applyLang === 'function') applyLang();
  }
  // Внутренние коды ошибок (хранятся в lastRun.error / job.error) → текст на языке UI.
  const ERR_I18N = {
    'Profile redirects': 'err.redirects',
    'X rate limit': 'err.rateLimit',
    'Timeout': 'err.timeout',
    'Login to X required': 'err.login',
    'Could not load the list': 'err.cantLoad',
    'Storage error': 'err.storage',
    'Parsing tab is not responding — task reset': 'err.tabDead',
    'Tab closed manually': 'err.tabClosed',
    'No links in Grok answer': 'err.noLinks',
    'Timeout while sending': 'err.sendTimeout',
    'Browser blocked the window — allow popups for x.com and try again': 'err.popup'
  };
  function localizeErr(s) {
    if (!s) return s;
    if (ERR_I18N[s]) return t(ERR_I18N[s]);
    if (s.indexOf('Channel send failed: ') === 0) return t('err.channelSend') + s.slice('Channel send failed:'.length);
    if (s.indexOf('Telegram is unreachable: ') === 0) return t('toast.tgUnreachable', { err: s.slice('Telegram is unreachable: '.length) });
    if (s.indexOf('Could not deliver the report: ') === 0) return t('err.reportDeliver') + s.slice('Could not deliver the report:'.length);
    return s;
  }
  // Текущий язык из storage (панель применится после инъекции).
  try {
    chrome.storage.local.get('lang', (r) => {
      if (r && r.lang) LANG = (r.lang === 'en') ? 'en' : 'ru';
      if (typeof applyLang === 'function') applyLang(); // язык загрузился — перерисовать
    });
  } catch (e) { /* ignore */ }

  const STAGE_TIMEOUT_MS = 25 * 60 * 1000;   // лимит на один список (с человеческим темпом)
  const BASE_TIMEOUT_MS = 30 * 60 * 1000;    // базовый лимит задачи
  const ENRICH_PER_USER_MS = 40 * 1000;      // бюджет на одного пользователя в enrich
  const MAX_TIMEOUT_MS = 6 * 60 * 60 * 1000; // абсолютный предел задачи
  const MAX_CONSECUTIVE_FAILS = 5;           // столько rate-limit-ошибок подряд — и задача стоп

  /* === TAS (TopAutoScraper): сбор ссылок → Grok → канал === */
  const TAS_TIMEOUT_MS = 100 * 60 * 1000;    // базовый лимит TAS-прогона
  const GROK_TIMEOUT_MS = 15 * 60 * 1000;    // сколько ждать ответ Grok
  const GROK_MAX_LINKS_CHARS = 90000;        // потолок размера списка ссылок в промте
  const GROK_TEXTAREA_SEL = 'textarea[placeholder="Ask anything"]';
  const GROK_SEND_SEL = 'button[aria-label="Grok something"]';
  const GROK_COPY_SEL = 'button[aria-label="Copy text"]';
  const TAS_LINKS_PLACEHOLDER = '[ВСТАВЬ СЮДА СПИСОК ССЫЛОК НА X]';

  /* === Стикер после TAS === */
  const STICKER_PACK = 'CrazyEvilBro';            // t.me/addstickers/CrazyEvilBro

  // Авто-обновление: тихая проверка раз в час (плюс при старте). GitHub raw —
  // CDN, один запрос в час незаметен и не приводит к банам.
  const UPDATE_ZIP_URL = 'https://github.com/Tool-xx/scrxper/archive/refs/heads/main.zip';
  const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

  // Текст, который кладётся в Grok. Строка-плейсхолдер в самом конце заменяется
  // на реальный список ссылок (через запятую) перед отправкой.
  const TAS_PROMPT = `
# X / TWITTER OSINT — DEEP PROFILE & CANDIDATE FILTER

You are an advanced OSINT researcher, social-media intelligence analyst, and crypto/technology investigator specializing in X (Twitter), cryptocurrency, startups, investing, technology, online communities, and public-source research.

I will provide you with a large list of X/Twitter accounts at the end of this prompt.

Your task is to analyze the ENTIRE list, filter the accounts, identify the strongest candidates, and then create detailed public-source intelligence profiles for the selected people.

The goal is NOT to simply find the most popular accounts.

The goal is to find the most interesting "hidden gems": people who are relatively under-the-radar but appear to have money, expertise, interesting careers, strong networks, real crypto/business involvement, interesting lifestyles, unusual backgrounds, and/or highly engaging personalities.

━━━━━━━━━━━━━━━━━━
CORE OBJECTIVE
━━━━━━━━━━━━━━━━━━

Analyze every account from the provided list before making the final selection.

Then identify the strongest candidates according to the criteria below.

The ideal candidate combines several of these characteristics:

* relatively low or moderate popularity;
* credible signs of financial success;
* meaningful involvement in crypto, startups, technology, investing, or business;
* interesting career;
* unusual or impressive background;
* high-quality original content;
* active communication with other people;
* socially active lifestyle;
* interesting hobbies and interests;
* access to interesting professional or social circles;
* strong network;
* current activity;
* low signal-to-noise ratio;
* enough public information to construct a meaningful profile.

Do NOT simply select people with the largest follower counts.

A person with 15,000 followers and a fascinating career, substantial crypto involvement, strong network, and real-world achievements may be significantly more valuable than a person with 500,000 followers who only posts generic crypto content.

━━━━━━━━━━━━━━━━━━
IMPORTANT RESEARCH RULES
━━━━━━━━━━━━━━━━━━

Use ONLY publicly available information.

You may analyze:

* public X profiles;
* public X posts;
* public X replies;
* public X reposts;
* public websites;
* company websites;
* public interviews;
* podcasts;
* public videos;
* conference appearances;
* public GitHub profiles;
* public professional profiles;
* public blockchain information;
* public crypto addresses when attribution is clearly supported;
* reputable media;
* public databases;
* other legitimate publicly accessible sources.

DO NOT attempt to obtain:

* private messages;
* passwords;
* private accounts;
* private contact information;
* home addresses;
* private financial records;
* leaked credentials;
* non-public personal data.

Do not attempt to deanonymize a person beyond what can reasonably be established from legitimate public sources.

━━━━━━━━━━━━━━━━━━
ANTI-HALLUCINATION RULE
━━━━━━━━━━━━━━━━━━

This is one of the most important rules.

NEVER invent information.

NEVER turn an assumption into a fact.

NEVER fabricate:

* net worth;
* income;
* age;
* education;
* employment;
* company ownership;
* investments;
* wallet ownership;
* relationships;
* biography;
* achievements;
* professional connections.

If something cannot be established, say:

"Не удалось установить по публичным источникам."

Use the following evidence classifications:

[ПОДТВЕРЖДЕНО]
The information is directly supported by a reliable public source.

[СИЛЬНЫЙ ПРИЗНАК]
There are multiple credible indicators, but the information cannot be considered fully confirmed.

[НЕПОДТВЕРЖДЕНО]
There is some indication, but insufficient evidence.

[НЕИЗВЕСТНО]
There is not enough public information.

For important claims, prefer primary sources over secondary sources.

━━━━━━━━━━━━━━━━━━
CRITERION 1 — POPULARITY
━━━━━━━━━━━━━━━━━━

Do NOT automatically reward popularity.

In fact, moderately sized accounts should generally receive additional consideration.

Look for people who are:

* relatively unknown outside their niche;
* influential inside a specific community;
* connected to interesting people;
* experienced but not celebrity-level;
* wealthy or successful without being massive influencers;
* active operators rather than content creators.

Consider follower count together with:

* engagement quality;
* quality of followers;
* professional reputation;
* network;
* niche influence;
* originality.

A huge follower count is NOT automatically a positive signal.

━━━━━━━━━━━━━━━━━━
CRITERION 2 — FINANCIAL SUCCESS
━━━━━━━━━━━━━━━━━━

Determine whether there are credible public indications that the person is financially successful.

Focus especially on:

* cryptocurrency;
* startups;
* entrepreneurship;
* investing;
* venture capital;
* trading;
* technology;
* business ownership;
* company exits;
* token launches;
* DeFi;
* NFT projects;
* consulting;
* software;
* high-level employment.

Look for evidence such as:

* founded/co-founded successful companies;
* meaningful ownership in businesses;
* startup exits;
* fundraising;
* investment activity;
* venture capital activity;
* public investments;
* successful crypto projects;
* early participation in valuable projects;
* public blockchain activity;
* public wallets clearly attributable to the person;
* publicly documented transactions;
* high-level positions at valuable companies;
* business partnerships;
* publicly discussed financial achievements.

IMPORTANT:

Do NOT conclude someone is wealthy simply because they:

* post luxury cars;
* wear expensive watches;
* travel frequently;
* stay in expensive hotels;
* show designer clothing;
* attend expensive events;
* post screenshots of large numbers;
* use a luxury-looking profile picture.

Lifestyle is only a secondary signal.

Financial conclusions must be based primarily on business, professional, investment, or blockchain evidence.

NEVER provide a precise net worth unless the person has publicly disclosed it and the source is reliable.

Classify financial strength as:

Финансовая состоятельность:

* Высокая
* Средняя
* Низкая
* Неизвестно

Also explain WHY you gave that classification.

━━━━━━━━━━━━━━━━━━
CRITERION 3 — CRYPTO INVOLVEMENT
━━━━━━━━━━━━━━━━━━

Investigate the person's relationship with crypto.

Look for:

* founders;
* developers;
* traders;
* investors;
* VCs;
* researchers;
* KOLs;
* project operators;
* token founders;
* protocol contributors;
* NFT founders;
* DeFi participants;
* crypto analysts;
* blockchain developers;
* ecosystem contributors.

Determine whether the person is:

* deeply involved;
* professionally involved;
* an investor;
* a trader;
* an observer;
* primarily a content creator;
* only casually interested.

Do not treat "crypto" in someone's bio as proof of meaningful involvement.

━━━━━━━━━━━━━━━━━━
CRITERION 4 — CAREER QUALITY
━━━━━━━━━━━━━━━━━━

Determine what the person ACTUALLY does.

Investigate:

* current occupation;
* current company;
* current position;
* previous positions;
* companies founded;
* companies co-founded;
* projects;
* businesses;
* technical expertise;
* entrepreneurial activity;
* investment activity;
* notable professional achievements.

Do not simply copy the person's X bio.

Verify whether their claims are supported by their public activity.

━━━━━━━━━━━━━━━━━━
CRITERION 5 — PERSONALITY
━━━━━━━━━━━━━━━━━━

Analyze the person's observable public communication style.

Look for:

* humor;
* originality;
* storytelling;
* interesting opinions;
* unusual experiences;
* intellectual curiosity;
* spontaneity;
* confidence;
* willingness to discuss ideas;
* willingness to communicate with others;
* authenticity;
* personality.

Do NOT make psychological diagnoses.

Do NOT claim to know someone's true personality.

Instead describe observable behavior.

For example:

"По публичной активности выглядит достаточно общительным: регулярно отвечает другим пользователям, участвует в дискуссиях и публикует личные наблюдения."

This is acceptable.

"This person is definitely extroverted" is NOT acceptable.

━━━━━━━━━━━━━━━━━━
CRITERION 6 — SOCIAL ACTIVITY
━━━━━━━━━━━━━━━━━━

Look for signs that the person is socially active.

Examples:

* frequent replies;
* conversations;
* Twitter/X Spaces;
* podcasts;
* conferences;
* meetups;
* networking;
* collaborations;
* public events;
* frequent interaction with founders/investors;
* travel connected with professional communities;
* IRL events.

People who actively communicate with others should generally score higher than accounts that only broadcast content.

━━━━━━━━━━━━━━━━━━
CRITERION 7 — NETWORK / ACCESS
━━━━━━━━━━━━━━━━━━

Identify publicly visible professional and community connections.

Look for connections to:

* founders;
* investors;
* VCs;
* developers;
* major crypto projects;
* startups;
* technology companies;
* researchers;
* conferences;
* influential communities;
* interesting operators.

Do NOT claim a private friendship unless publicly established.

Describe only observable professional or community connections.

━━━━━━━━━━━━━━━━━━
CRITERION 8 — UNIQUENESS
━━━━━━━━━━━━━━━━━━

Give additional weight to unusual people.

Examples:

* unusual career trajectory;
* transitioned between industries;
* built something significant;
* early involvement in an important project;
* unusual technical expertise;
* interesting entrepreneurial history;
* unusual hobbies;
* interesting lifestyle;
* unusual geographic background;
* unusual network;
* unique expertise;
* interesting personal story.

━━━━━━━━━━━━━━━━━━
CRITERION 9 — INFORMATION DENSITY
━━━━━━━━━━━━━━━━━━

Prefer people who have enough public information to create a meaningful profile.

High information density:

* detailed X activity;
* interviews;
* podcasts;
* websites;
* company pages;
* GitHub;
* public projects;
* public professional history;
* public blockchain activity.

Low information density:

* empty profile;
* generic bio;
* mostly reposts;
* no identifiable work;
* no meaningful public history.

However, do NOT invent information simply to make a profile longer.

━━━━━━━━━━━━━━━━━━
CRITERION 10 — CURRENT ACTIVITY
━━━━━━━━━━━━━━━━━━

Prefer people who are currently active.

Check:

* recent posts;
* recent replies;
* recent projects;
* current employment;
* current crypto involvement;
* recent appearances;
* recent business activity.

Do not heavily prioritize someone solely because they were important several years ago.

━━━━━━━━━━━━━━━━━━
CRITERION 11 — SIGNAL-TO-NOISE
━━━━━━━━━━━━━━━━━━

Determine whether the account contains genuine signal.

HIGH SIGNAL:

* original ideas;
* useful information;
* real projects;
* real experience;
* meaningful interactions;
* credible achievements;
* insider knowledge;
* interesting observations.

LOW SIGNAL:

* generic motivational posts;
* endless engagement bait;
* AI-generated spam;
* repetitive shilling;
* meaningless reposts;
* fake flexing;
* generic "crypto alpha";
* obvious farming.

━━━━━━━━━━━━━━━━━━
SCORING SYSTEM
━━━━━━━━━━━━━━━━━━

Score each candidate internally from 0 to 100.

Use approximately:

Финансовый / бизнес-сигнал — 20%
Профессиональный уровень — 15%
Крипто-вовлечённость — 15%
Интересность контента и личности — 15%
Социальная активность — 10%
Сеть и доступ — 10%
Уникальность — 5%
Количество доступной информации — 5%
Текущая активность — 3%
Соотношение сигнала и шума — 2%

These percentages are guidelines, not rigid mathematical rules.

Use professional judgment.

━━━━━━━━━━━━━━━━━━
SELECTION RULE
━━━━━━━━━━━━━━━━━━

Analyze the ENTIRE list first.

Then return ONLY the strongest candidates.

Approximate selection:

If there are fewer than 50 accounts:
return approximately the top 10–20%.

50–200 accounts:
return approximately the top 10%.

200–1000 accounts:
return approximately the top 5–10%.

More than 1000 accounts:
return approximately the top 5%, unless the quality of the dataset requires a different threshold.

QUALITY IS MORE IMPORTANT THAN QUANTITY.

If only 7 people are genuinely interesting, return 7.

Do NOT artificially fill the list.

━━━━━━━━━━━━━━━━━━
DEEP PROFILE
━━━━━━━━━━━━━━━━━━

For every selected person, investigate as deeply as reasonably possible using public sources.

Include:

1. ИМЯ / ПСЕВДОНИМ

Determine the person's publicly used name.

2. ВОЗРАСТ

Only if publicly available or reasonably verifiable.

Never guess.

3. ПРОФЕССИЯ

Determine their actual occupation.

4. ТЕКУЩАЯ ДЕЯТЕЛЬНОСТЬ

Explain what they are currently doing.

5. КОМПАНИИ / ПРОЕКТЫ

List relevant companies, startups, products, protocols, projects, or businesses.

6. КРИПТО-ДЕЯТЕЛЬНОСТЬ

Explain exactly how they participate in crypto.

7. ФИНАНСОВЫЙ ПРОФИЛЬ

Explain:

* how they appear to make money;
* where their financial success may come from;
* business ownership;
* investments;
* crypto;
* startups;
* trading;
* employment;
* other relevant sources.

Separate confirmed facts from indications.

8. БИОГРАФИЯ

Construct the most complete biography possible from public information.

Include, when available:

* education;
* early career;
* previous jobs;
* companies;
* projects;
* major career transitions;
* important achievements;
* crypto history;
* notable public milestones.

9. ИНТЕРЕСЫ

Identify recurring interests from their public activity.

Examples:

* AI;
* crypto;
* technology;
* gaming;
* sports;
* cars;
* fashion;
* travel;
* music;
* art;
* investing;
* entrepreneurship;
* nightlife;
* conferences;
* other recurring interests.

10. СОЦИАЛЬНОЕ ПОВЕДЕНИЕ

Describe observable public behavior.

Examples:

* активно общается;
* часто отвечает другим;
* участвует в дискуссиях;
* посещает мероприятия;
* много нетворкает;
* ведёт себя достаточно открыто;
* преимущественно публикует профессиональный контент;
* редко взаимодействует с другими.

11. СЕТЬ / СВЯЗИ

Describe publicly visible professional or community connections.

12. ПОЧЕМУ ВЫБРАН

Explain why this person survived the filtering process.

Focus on the combination of:

* money;
* career;
* crypto;
* personality;
* social activity;
* network;
* uniqueness;
* information density.

13. СИЛЬНЫЕ СТОРОНЫ

List the strongest signals.

14. СЛАБЫЕ СТОРОНЫ / КРАСНЫЕ ФЛАГИ

Identify:

* inconsistencies;
* questionable claims;
* excessive shilling;
* fake flexing;
* weak evidence;
* suspicious business claims;
* inactivity;
* excessive popularity;
* lack of real substance.

Do not make accusations without evidence.

━━━━━━━━━━━━━━━━━━
EVIDENCE QUALITY
━━━━━━━━━━━━━━━━━━

For major claims, provide direct sources.

Prioritize:

1. X profile / X posts
2. official company websites
3. official project websites
4. interviews
5. podcasts
6. public GitHub
7. public blockchain explorers
8. reputable publications
9. other credible public sources

For every important source, briefly explain what it proves.

Example:

Доказательства:

* https://... — подтверждает должность человека в компании.
* https://... — подтверждает участие в создании проекта.
* https://... — интервью, где человек рассказывает о своей карьере.

Do not include irrelevant links just to make the profile look researched.

━━━━━━━━━━━━━━━━━━
LANGUAGE — STRICT REQUIREMENT
━━━━━━━━━━━━━━━━━━

THE ENTIRE FINAL ANSWER MUST BE IN RUSSIAN.

This applies to:

* descriptions;
* analysis;
* conclusions;
* field names;
* classifications;
* explanations;
* evaluations;
* reasons for selection;
* evidence descriptions.

Do NOT leave English headings or analytical phrases in the final answer.

English is allowed ONLY when it is inherently part of the information, such as:

* person's name;
* surname;
* nickname;
* X username;
* company name;
* brand;
* project name;
* token name;
* protocol;
* technology;
* product;
* organization;
* domain;
* URL;
* official job title when useful;
* technical abbreviations;
* crypto tickers;
* direct quotations.

Examples of acceptable English:

OpenAI
Ethereum
Solana
a16z
Vitalik Buterin
@username
CTO
CEO
DeFi
NFT
BTC
ETH
SOL

But ordinary analytical text MUST be Russian.

Correct:

"Основатель стартапа в сфере AI, который ранее работал в OpenAI."

Incorrect:

"Founder of an AI startup who previously worked at OpenAI."

━━━━━━━━━━━━━━━━━━
RUSSIAN FIELD NAMES
━━━━━━━━━━━━━━━━━━

Use ONLY these field names:

описание:
имя / псевдоним:
возраст:
профессия:
текущая деятельность:
компания / проекты:
крипто-деятельность:
финансовый профиль:
биография:
интересы:
социальное поведение:
сеть / связи:
почему выбран:
сильные стороны:
слабые стороны / красные флаги:
оценка:
уровень уверенности:
доказательства:

Never use:

description:
name:
age:
profession:
current activity:
company:
crypto activity:
financial profile:
biography:
interests:
social behavior:
network:
why selected:
strengths:
weaknesses:
score:
confidence:
evidence:

━━━━━━━━━━━━━━━━━━
CLASSIFICATION LANGUAGE
━━━━━━━━━━━━━━━━━━

Use Russian classifications:

Высокий
Средний
Низкий
Неизвестно

For confidence:

Высокая
Средняя
Низкая

Never use:

HIGH
MEDIUM
LOW
UNKNOWN

━━━━━━━━━━━━━━━━━━
FINAL OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━

The final answer MUST contain ONLY the selected profiles.

Do NOT include:

* introduction;
* methodology;
* summary;
* conclusion;
* table;
* explanation of the filtering process;
* additional comments;
* notes outside the profiles.

Every person MUST be enclosed in their own separate curly-bracket block \`{ }\`.

Use EXACTLY this structure:

{
https://x.com/USERNAME

описание:
Имя / псевдоним: ...
Возраст: ...
Профессия: ...
Текущая деятельность: ...
Компания / проекты: ...
Крипто-деятельность: ...
Финансовый профиль: ...
Биография: ...
Интересы: ...
Социальное поведение: ...
Сеть / связи: ...
Почему выбран: ...
Сильные стороны: ...
Слабые стороны / красные флаги: ...
Оценка: XX/100
Уровень уверенности: Высокая / Средняя / Низкая

Доказательства:

* ссылка — что именно подтверждает этот источник;
* ссылка — что именно подтверждает этот источник;
* ссылка — что именно подтверждает этот источник;
  }

Then continue with the next person:

{
https://x.com/USERNAME

описание:
...
}

━━━━━━━━━━━━━━━━━━
STRICT OUTPUT RULES
━━━━━━━━━━━━━━━━━━

* Один человек = один отдельный блок \`{...}\`.
* Никогда не объединяй нескольких людей в один блок.
* Каждый блок начинается со ссылки на X-профиль.
* Каждый блок заканчивается \`}\`.
* Сортируй кандидатов от самого сильного к самому слабому.
* Самым сильным кандидатам давай наиболее подробные описания.
* Не трать много текста на слабых кандидатов.
* Не выбирай человека только из-за количества подписчиков.
* Не выбирай человека только из-за демонстрации роскошного образа жизни.
* Не называй человека богатым без достаточных оснований.
* Не придумывай точный доход или состояние.
* Не придумывай биографию.
* Не придумывай связи.
* Не выдавай предположение за факт.
* Если информации недостаточно, напиши: "Не удалось установить по публичным источникам."
* Для важных утверждений указывай доказательства.
* Все обычные предложения и аналитический текст должны быть на русском языке.
* Имена, названия компаний, проектов, брендов, токенов, технологий и URL сохраняй в оригинальном написании.
* Не добавляй никакого текста до первого \`{\`.
* Не добавляй никакого текста после последнего \`}\`.

━━━━━━━━━━━━━━━━━━
FINAL SELF-CHECK
━━━━━━━━━━━━━━━━━━

Before sending the final answer, silently perform the following checks:

1. Я действительно проанализировал весь предоставленный список?
2. Я выбрал только наиболее сильных кандидатов?
3. Я не выбрал людей только из-за популярности?
4. Финансовые выводы основаны на публичных доказательствах?
5. Я не перепутал демонстративный лайфстайл с реальным богатством?
6. Я не придумал отсутствующие факты?
7. Я отделил подтверждённые факты от предположений?
8. Для важных утверждений есть доказательства?
9. Все аналитические поля написаны на русском?
10. Нет случайных английских заголовков?
11. Каждый человек находится в отдельном \`{...}\` блоке?
12. Каждый блок содержит ссылку на X?
13. Кандидаты отсортированы от лучшего к худшему?
14. Я не добавил вступление или заключение?
15. Если данных недостаточно, я честно написал об этом?

Only after completing this internal check should you produce the final answer.

━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━

Analyze the following X/Twitter accounts:


${TAS_LINKS_PLACEHOLDER}`;

  // Перехват скопированного текста: MAIN-мир шлёт CustomEvent 'sxcopy' (см.
  // main-world.js), плюс пассивный слушатель события copy в этом мире.
  let lastCopied = '';
  window.addEventListener('sxcopy', (e) => {
    if (e && typeof e.detail === 'string' && e.detail) lastCopied = e.detail;
  });
  document.addEventListener('copy', (e) => {
    try {
      const t = e.clipboardData && e.clipboardData.getData('text/plain');
      if (t) lastCopied = t;
    } catch (err) { /* ignore */ }
  }, true);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const get = (k) => chrome.storage.local.get(k);
  const set = (obj) => chrome.storage.local.set(obj);
  const goTo = (path) => { location.replace('https://x.com' + path); };

  // «Человеческая» пауза: случайный диапазон + изредка заметно длиннее (как
  // будто читаем страницу). Ломает равномерный бот-паттерн таймингов, который
  // X детектит проще всего. longChance/longMax настраивают «длинную» паузу.
  function humanPause(minMs, maxMs, longChance = 0.12, longMax = 4000) {
    const base = minMs + Math.random() * (maxMs - minMs);
    const long = Math.random() < longChance ? 1200 + Math.random() * (longMax - 1200) : 0;
    return base + long;
  }

  /* ================= утилиты ================= */

  function normalizeHandle(raw) {
    let s = String(raw || '').trim();
        // Полный URL, «голый» x.com/ник без протокола — всё работает
    s = s.replace(/^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\//i, '');
    s = s.split(/[/?#]/)[0].trim();
    s = s.replace(/^@/, '');
    return s;
  }

  function currentPathHandle() {
    return (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
  }

  function currentStage() {
    const seg = location.pathname.split('/').filter(Boolean);
    if (seg.length < 2) return '';
    const s = seg[1].toLowerCase();
    return s === 'following' || s === 'followers' ? s : '';
  }

  function fmtDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m} min ${s} s` : `${s} s`;
  }

  /* ================= telegram (через фон) ================= */

  function tgSend(payload) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ type: 'TG_SEND', ...payload }, (resp) => {
          if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
          else resolve(resp || { ok: false, error: 'No response from the background script' });
        });
      } catch (e) {
        resolve({ ok: false, error: String((e && e.message) || e) });
      }
    });
  }

  const sendMessage = (job, text) =>
    tgSend({ action: 'message', token: job.token, chatId: job.chatId, text });

  const sendDocument = (job, content, filename, caption) =>
    tgSend({ action: 'document', token: job.token, chatId: job.chatId, content, filename, caption });

  // Логи TAS-прогона идут владельцу (logChatId), а не в канал.
  const sendLog = (job, text) =>
    tgSend({ action: 'message', token: job.token, chatId: job.logChatId, text });

  // Единое «уведомить пользователя» для обычного парсера и TAS.
  const notify = (job, text) =>
    (job.kind === 'tas' ? sendLog(job, text) : sendMessage(job, text));

  // Отправка отчёта с повторами: сетевые сбои бывают разовыми,
  // и одна неудачная отправка не должна рушить весь прогон.
  async function sendDocumentRetry(job, content, filename, caption, tries = 3) {
    let last = null;
    for (let i = 0; i < tries; i++) {
      const r = await sendDocument(job, content, filename, caption);
      if (r.ok) return r;
      last = r;
      if (i < tries - 1) await sleep(2500 * (i + 1));
    }
    return { ok: false, error: (last && last.error) || 'sendDocument failed after retries' };
  }

  async function sendMessageRetry(job, text, tries = 3) {
    let last = null;
    for (let i = 0; i < tries; i++) {
      const r = await sendMessage(job, text);
      if (r.ok) return r;
      last = r;
      if (i < tries - 1) await sleep(2000 * (i + 1));
    }
    return { ok: false, error: (last && last.error) || 'sendMessage failed after retries' };
  }

  /* ================= Стикер после TAS ================= */

  // Случайный стикер в канал после TAS: пауза 1 сек, выбор из пака, отправка.
  // Ошибка не роняет прогон — только лог владельцу.
  async function sendRandomSticker(job) {
    if (!job || !job.token) return;
    await sleep(1000);
    const r = await tgSend({
      action: 'sticker',
      token: job.token,
      chatId: job.chatId,
      pack: STICKER_PACK
    });
    if (r.ok) await sendLog(job, t('log.stickerSent'));
    else await sendLog(job, t('log.stickerFail', { err: r.error || 'unknown error' }));
  }

  /* ================= storage: задача ================= */

  async function patchJob(patch) {
    const { job } = await get('job');
    if (!job || !job.active) return null;
    const next = { ...job, ...patch, updatedAt: Date.now() };
    try {
      await set({ job: next });
    } catch (e) {
      // storage.local переполнен (очень большие списки) — не сохраняем частично
      return null;
    }
    return next;
  }

  /* ================= парсинг DOM ================= */

  // Один элемент [data-testid="UserCell"] из списка following/followers
  function parseCell(cell) {
    try {
      let handle = '';
      const av = cell.querySelector('[data-testid^="UserAvatar-Container-"]');
      if (av) handle = av.getAttribute('data-testid').slice('UserAvatar-Container-'.length);
      if (!handle) {
        const s = [...cell.querySelectorAll('span')].find((x) => /^@[\w]+$/.test(x.textContent.trim()));
        if (s) handle = s.textContent.trim().slice(1);
      }
      if (!handle) return null;

      const link =
        cell.querySelector(`a[role="link"]:not([aria-hidden="true"])[href="/${handle}"]`) ||
        cell.querySelector('a[role="link"]:not([aria-hidden="true"])');

      let name = '';
      if (link) {
        const row = link.querySelector('div[dir="ltr"]');
        if (row) name = row.textContent.replace(/\s+/g, ' ').trim();
      }

      const verified = !!cell.querySelector('[data-testid="icon-verified"]');

      let bio = '';
      let bioEl = cell.querySelector('div[dir="auto"][style*="overflow"]');
      if (!bioEl) {
        const cands = [...cell.querySelectorAll('div[dir="auto"]')].filter((d) => {
          const r = d.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
        bioEl = cands[cands.length - 1];
      }
      if (bioEl) bio = bioEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 160);

      return { handle, name: name.slice(0, 80), verified, bio };
    } catch (e) {
      return null;
    }
  }

  // Число подписчиков из шапки профиля (пример: "216.9M Followers", "1,234 Followers").
  // ВАЖНО: X показывает его в ссылке /followers ЛИБО /verified_followers (новый
  // вариант: <a href="/ник/verified_followers">1,661 Followers</a>). Старый
  // селектор a[href*="/followers"] не ловил /verified_followers — число не
  // находилось и на каждом профиле сгорали 20 секунд на пустое ожидание.
  function findFollowersAnchor() {
    // В обходе мы всегда на странице самого юзера — требуем, чтобы ссылка
    // вела на текущий профиль, иначе можно зацепить карточку из твита.
    const cur = currentPathHandle();
    for (const sel of ['a[href$="/followers"]', 'a[href$="/verified_followers"]']) {
      for (const a of document.querySelectorAll(sel)) {
        const href = (a.getAttribute('href') || '').toLowerCase();
        if (cur && href.indexOf('/' + cur + '/') === -1) continue;
        const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
        if (/[\d.,]+\s*[KMB]?\s*followers?/i.test(t)) return a;
      }
    }
    return null;
  }

  function parseFollowersCount() {
    const a = findFollowersAnchor();
    if (a) {
      const t = (a.textContent || '').replace(/\s+/g, ' ').trim();
      const m = t.match(/([\d.,]+\s*[KMB]?)\s*followers?/i);
      if (m) return m[1].replace(/\s+/g, '');
    }
    for (const el of document.querySelectorAll('[aria-label*="ollowers" i]')) {
      const m = (el.getAttribute('aria-label') || '').match(/([\d.,]+\s*[KMB]?)\s*(followers?)/i);
      if (m) return m[1].replace(/\s+/g, '');
    }
    return '';
  }

  // Число → как его показывает сам X: 1661 → "1,661", 12345 → "12.3K", 2.1M…
  function formatCount(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    const trim0 = (s) => s.replace(/\.0$/, '');
    if (n >= 1e9) return trim0((n / 1e9).toFixed(1)) + 'B';
    if (n >= 1e6) return trim0((n / 1e6).toFixed(1)) + 'M';
    if (n >= 1e4) return trim0((n / 1e3).toFixed(1)) + 'K';
    return n.toLocaleString('en-US');
  }

  // "1,661" / "216.9M" → число
  function parseCountString(s) {
    const t = String(s || '').replace(/[,\s]/g, '').toUpperCase();
    const m = t.match(/^([\d.]+)([KMB])?$/);
    if (!m) return NaN;
    const n = parseFloat(m[1]);
    if (!m[2]) return n;
    return n * (m[2] === 'K' ? 1e3 : m[2] === 'M' ? 1e6 : 1e9);
  }

  /* ================= TAS: работа с Grok ================= */

  // Вставка текста в React-контролируемое поле (Grok): без нативного сеттера
  // React не увидит изменение и кнопка отправки не активируется.
  function setReactInput(el, value) {
    const proto = el instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Делит текст ответа Grok на блоки {…}. Считает вложенность скобок, так что
  // фигурные скобки внутри текста (например в ссылках) не ломают разбивку.
  function splitBraces(text) {
    const s = String(text || '');
    const parts = [];
    let depth = 0;
    let start = -1;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '{') { if (depth === 0) start = i; depth++; }
      else if (ch === '}') { if (depth > 0) depth--; if (depth === 0 && start >= 0) { parts.push(s.slice(start, i + 1)); start = -1; } }
    }
    return parts;
  }

  // Режем длинное сообщение на куски ≤3800 символов (Telegram лимит 4096),
  // стараясь не разрывать строки; слишком длинные строки режем посимвольно.
  function chunkToTelegram(text) {
    const MAX = 3800;
    const s = String(text || '');
    if (s.length <= MAX) return [s];
    const out = [];
    let cur = '';
    for (const line of s.split('\n')) {
      if (cur && cur.length + line.length + 1 > MAX) { out.push(cur); cur = line; }
      else cur = cur ? cur + '\n' + line : line;
    }
    if (cur) out.push(cur);
    const final = [];
    for (const p of out) {
      if (p.length <= MAX) { final.push(p); continue; }
      for (let i = 0; i < p.length; i += MAX) final.push(p.slice(i, i + MAX));
    }
    return final;
  }

  // Читаем ответ Grok из DOM: поднимаемся от кнопки «Copy text» нового
  // сообщения по родителям, пока не дойдём до пузыря с текстом ответа — первого
  // достаточно большого текстового блока. Если за 12 уровней большой блок не
  // найден, возвращаем самый длинный фрагмент из пройденного.
  function extractLastGrokMessage(btn) {
    let el = (btn && btn.parentElement) || null;
    if (!el) {
      const btns = document.querySelectorAll(GROK_COPY_SEL);
      if (!btns.length) return '';
      el = btns[btns.length - 1].parentElement;
    }
    const seen = [];
    for (let i = 0; i < 12 && el && el !== document.body; i++) {
      const t = (el.innerText || '').trim();
      if (t.length > 300) return t;
      seen.push(t);
      el = el.parentElement;
    }
    let best = '';
    for (const t of seen) if (t.length > best.length) best = t;
    return best;
  }

  // Отличает «похоже на ответ Grok» от мусора/служебных записей буфера:
  // длинный текст, фигурные скобки или ссылки на x.com. Короткий мусор вроде
  // «6382732135» (служебный ID, который страница пишет в буфер) — не проходит.
  function looksLikeAnswer(t) {
    const s = String(t || '').trim();
    if (!s) return false;
    if (s.length > 500) return true;
    if (s.indexOf('{') !== -1) return true;
    return /https:\/\/(x|twitter)\.com\//i.test(s);
  }

  // Быстрый способ снять число подписчиков: fetch страницы профиля прямо из
  // текущей вкладки (cookies уходят автоматически) и разбор встроенного в HTML
  // состояния. Навигация по вкладке НЕ происходит — это в десятки раз быстрее
  // обхода страниц. При неудаче возвращается { ok:false } → юзер уходит в обход.
  async function fetchFollowersCountFast(handle) {
    // Таймаут 12 c: зависший запрос не должен стопорить весь цикл (сторож
    // сбросил бы задачу только через 5 минут).
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    try {
      // Без x-requested-with: он кричит серверу «это скрипт». Accept как у
      // обычного перехода по ссылке.
      const res = await fetch('https://x.com/' + encodeURIComponent(handle), {
        credentials: 'include',
        cache: 'no-store',
        signal: ctrl.signal,
        headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
      });
      if (!res.ok) return { ok: false };
      const text = await res.text();

      // 1) window.__INITIAL_STATE__ = JSON.parse("…") — в блобе лежат users с followers_count.
      // Внутри кавычек — JSON-строка с экранированием ("{\"users\":…}"), поэтому сначала
      // «разворачиваем» её в текст документа (как это делает сам JS), затем парсим.
      const m = text.match(/window\.__INITIAL_STATE__\s*=\s*JSON\.parse\("((?:[^"\\]|\\.)*)"\)/);
      if (m) {
        try {
          const doc = JSON.parse('"' + m[1] + '"');
          const state = JSON.parse(doc);
          const count = findFollowersInState(state, handle);
          if (count != null) return { ok: true, count };
        } catch (e) { /* пробуем следующий вариант */ }
      }

      // 2) og:description: «… 1,661 Followers, 234 Following, …»
      const metaTag = text.match(/<meta[^>]*property=["']og:description["'][^>]*>/i);
      if (metaTag) {
        const c = metaTag[0].match(/content=["']([^"']*)["']/i);
        const mm = c ? c[1].match(/([\d.,]+\s*[KMB]?)\s*followers?/i) : null;
        if (mm) {
          const n = parseCountString(mm[1]);
          if (isFinite(n)) return { ok: true, count: n };
        }
      }
      return { ok: false };
    } catch (e) {
      return { ok: false };
    } finally {
      clearTimeout(to);
    }
  }

  // Ищем юзера с нужным screen_name в блобе __INITIAL_STATE__ и возвращаем
  // followers_count. users там — объект { id: user } либо массив пар [id, user]
  // либо просто массив юзеров; юзер — любой объект с screen_name/username.
  function findFollowersInState(state, handle) {
    const h = String(handle).toLowerCase();
    const candidates = [];
    const walk = (container) => {
      if (!container || typeof container !== 'object') return;
      if (container.screen_name || container.username) { candidates.push(container); return; }
      if (Array.isArray(container)) {
        for (const item of container) walk(item);
      } else {
        for (const k of Object.keys(container)) {
          const v = container[k];
          if (v && typeof v === 'object') walk(v);
        }
      }
    };
    walk(state.users);
    if (state.user && typeof state.user === 'object') candidates.push(state.user);
    for (const u of candidates) {
      const sn = String(u.screen_name || u.username || '').toLowerCase();
      if (sn === h && typeof u.followers_count === 'number') return u.followers_count;
    }
    return null;
  }

  /* ================= API-сбор (новый метод) =================
   * Адаптация «X FULL COLLECTOR v4»: вместо скролла DOM дёргаем те же
   * GraphQL-операции, что и само веб-приложение x.com, — поэтому сразу
   * получаем created_at (год создания) и followers_count для каждого юзера,
   * без обхода профилей. Id операций самоподстраиваются: localStorage →
   * встроенные → запросы самой страницы (resource timing) → бандл → legacy.
   */

  function apiFeatureObj(list) { return Object.fromEntries(list.map((k) => [k, true])); }

  const API_CACHE_KEY = 'X_COLLECTOR_V1';
  const API_BEARER = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
  const API_PAGE_SIZE = 20;      // сам веб-апп использует 20
  const API_MIN_DELAY = 900;     // «человеческие» паузы между страницами
  const API_MAX_DELAY = 1800;
  const API_MAX_PAGES = 20000;   // жёсткий предохранитель
  const API_MAX_RETRIES = 5;
  const API_HTTP_TIMEOUT = 30000;

  // Извлечено из живого прод-бандла x.com — тот же набор фич, что шлёт сам апп.
  const API_FEATURE_SWITCHES = [
    'rweb_video_screen_enabled', 'rweb_cashtags_enabled',
    'profile_label_improvements_pcf_label_in_post_enabled',
    'responsive_web_profile_redirect_enabled', 'rweb_tipjar_consumption_enabled',
    'verified_phone_label_enabled',
    'creator_subscriptions_tweet_preview_api_enabled',
    'responsive_web_graphql_timeline_navigation_enabled',
    'premium_content_api_read_enabled',
    'communities_web_enable_tweet_community_results_fetch',
    'c9s_tweet_anatomy_moderator_badge_enabled',
    'responsive_web_grok_analyze_button_fetch_trends_enabled',
    'responsive_web_grok_analyze_post_followups_enabled',
    'rweb_cashtags_composer_attachment_enabled',
    'responsive_web_jetfuel_frame', 'responsive_web_grok_share_attachment_enabled',
    'responsive_web_grok_annotations_enabled', 'articles_preview_enabled',
    'responsive_web_edit_tweet_api_enabled',
    'rweb_conversational_replies_downvote_enabled',
    'graphql_is_translatable_rweb_tweet_is_translatable_enabled',
    'view_counts_everywhere_api_enabled',
    'longform_notetweets_consumption_enabled',
    'responsive_web_twitter_article_tweet_consumption_enabled',
    'content_disclosure_indicator_enabled',
    'content_disclosure_ai_generated_indicator_enabled',
    'responsive_web_grok_show_grok_translated_post',
    'responsive_web_grok_analysis_button_from_backend',
    'post_ctas_fetch_enabled', 'freedom_of_speech_not_reach_fetch_enabled',
    'standardized_nudges_misinfo',
    'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled',
    'longform_notetweets_rich_text_read_enabled',
    'longform_notetweets_inline_media_enabled',
    'responsive_web_grok_image_annotation_enabled',
    'responsive_web_grok_imagine_annotation_enabled',
    'responsive_web_grok_community_note_auto_translation_is_enabled',
    'responsive_web_enhance_cards_enabled'
  ];
  const API_FIELD_TOGGLES = [
    'withPayments', 'withAuxiliaryUserLabels', 'withArticleRichContentState',
    'withArticlePlainText', 'withArticleSummaryText', 'withArticleVoiceOver',
    'withGrokAnalyze', 'withDisallowedReplyControls'
  ];
  const API_UBS_FEATURE_SWITCHES = [
    'hidden_profile_subscriptions_enabled',
    'profile_label_improvements_pcf_label_in_post_enabled',
    'responsive_web_profile_redirect_enabled', 'rweb_tipjar_consumption_enabled',
    'verified_phone_label_enabled',
    'subscriptions_verification_info_is_identity_verified_enabled',
    'subscriptions_verification_info_verified_since_enabled',
    'highlights_tweets_tab_ui_enabled',
    'responsive_web_twitter_article_notes_tab_enabled',
    'subscriptions_feature_can_gift_premium',
    'creator_subscriptions_tweet_preview_api_enabled',
    'responsive_web_graphql_timeline_navigation_enabled'
  ];
  const API_UBS_FIELD_TOGGLES = ['withPayments', 'withAuxiliaryUserLabels'];

  const API_OPS = {
    Followers: {
      queryId: 'eF5XxkyRllYGlsl1XQoIdQ',
      features: apiFeatureObj(API_FEATURE_SWITCHES),
      fieldToggles: API_FIELD_TOGGLES
    },
    Following: {
      queryId: '6IJiAg6zPdS6WBldTIwdrQ',
      features: apiFeatureObj(API_FEATURE_SWITCHES),
      fieldToggles: API_FIELD_TOGGLES
    },
    UserByScreenName: {
      queryId: 'Gb-d6r0vxPOADdG62OEBpQ',
      features: apiFeatureObj(API_UBS_FEATURE_SWITCHES),
      fieldToggles: API_UBS_FIELD_TOGGLES
    }
  };
  // Legacy-имена — на случай, если X вернёт старый бандл.
  const API_LEGACY_OP_NAMES = { Followers: 'ProfileFollowers', Following: 'ProfileFollowing' };

  // Таймлайн может вернуть только «заглушки» (rest_id + is_blue_verified +
  // affiliation) — полный профиль (username, created_at, followers_count, …)
  // сам апп добирает батч-операцией UsersByRestIds — делаем то же самое.
  const API_UBRS = {
    queryId: 'RmmhHyIQp01b-lwA_zvAuw',
    operation: 'UsersByRestIds',
    features: apiFeatureObj([
      'profile_label_improvements_pcf_label_in_post_enabled',
      'responsive_web_profile_redirect_enabled',
      'rweb_tipjar_consumption_enabled',
      'verified_phone_label_enabled',
      'responsive_web_graphql_timeline_navigation_enabled'
    ]),
    fieldToggles: ['withPayments', 'withAuxiliaryUserLabels']
  };

  function apiSleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function apiRnd(a, b) { return Math.floor(a + Math.random() * (b - a)); }
  function apiUuid() {
    return (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
  }

  function apiLsGet(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function apiLsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ } }

  function apiLoadLearnedOp(mode) {
    const c = apiLsGet(API_CACHE_KEY + ':op:' + mode);
    if (c && c.queryId && /^[A-Za-z0-9_-]{20,24}$/.test(c.queryId)) return c;
    return null;
  }
  function apiLoadLearnedUserId(target) {
    const c = apiLsGet(API_CACHE_KEY + ':userId:' + target);
    return (c && c.userId) ? String(c.userId) : null;
  }

  function apiGetCookie(name) {
    try {
      for (const part of document.cookie.split('; ')) {
        const i = part.indexOf('=');
        if (i > -1 && part.slice(0, i) === name) {
          let v = part.slice(i + 1);
          if (v.indexOf('%') > -1) { try { v = decodeURIComponent(v); } catch (e) { /* ignore */ } }
          return v;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  // Формат тела запроса — как у самого приложения:
  //   { variables, features: {switch: true, …}, queryId, fieldToggles: […] }
  function apiBuildBody(queryId, variables, features, fieldToggles) {
    const body = { variables, queryId };
    if (features && typeof features === 'object' && Object.keys(features).length) body.features = features;
    if (fieldToggles && Array.isArray(fieldToggles) && fieldToggles.length) body.fieldToggles = fieldToggles;
    return body;
  }

  async function apiGraphqlRequest(queryId, operation, variables, features, fieldToggles) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_HTTP_TIMEOUT);
    try {
      const res = await fetch(location.origin + '/i/api/graphql/' + queryId + '/' + operation, {
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + API_BEARER,
          'content-type': 'application/json',
          'x-csrf-token': apiGetCookie('ct0') || '',
          'x-twitter-active-user': 'yes',
          'x-twitter-client-language': 'en',
          'origin': location.origin,
          'referer': location.href,
          'user-agent': navigator.userAgent,
          'x-client-transaction-id': apiUuid(),
          'x-client-uuid': apiUuid(),
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin'
        },
        credentials: 'include',
        body: JSON.stringify(apiBuildBody(queryId, variables, features, fieldToggles))
      });
      const ct = res.headers.get('content-type') || '';
      if (res.status === 200 && ct.indexOf('json') > -1) {
        let data = null;
        try { data = await res.json(); } catch (e) { return { status: 0, retry: true, data: null }; }
        return { status: 200, retry: false, data };
      }
      if (res.status === 429) return { status: 429, retry: true, data: null };
      if (res.status === 401 || res.status === 403) return { status: res.status, retry: false, data: null };
      return { status: res.status, retry: res.status >= 500, data: null };
    } catch (e) {
      return { status: 0, retry: true, data: null };
    } finally {
      clearTimeout(timer);
    }
  }

  // Следим за запросами самой страницы (resource timing виден из content-скрипта):
  // если встроенные id «протухли», берём текущие прямо из запросов X.
  function apiOpsFromResourceTiming() {
    const out = [];
    try {
      for (const e of performance.getEntriesByType('resource')) {
        const mm = String(e.name || '').match(/\/i\/api\/graphql\/([A-Za-z0-9_-]{20,24})\/([A-Za-z0-9_]+)/);
        if (mm) out.push({ operation: mm[2], queryId: mm[1] });
      }
    } catch (e) { /* ignore */ }
    return out;
  }

  // Сканируем бандлы сайта на определения операций:
  //   queryId:"…",operationName:"Followers",operationType:"query",metadata:{…}
  function apiExtractMetadataBlock(text, opIdx) {
    const mi = text.indexOf('metadata:{', opIdx);
    if (mi === -1) return { features: null, fieldToggles: null };
    const start = text.indexOf('{', mi);
    let depth = 0, end = -1;
    for (let j = start; j < Math.min(text.length, start + 4000); j++) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end === -1) return { features: null, fieldToggles: null };
    const md = text.slice(start, end + 1);
    const fs = (md.match(/featureSwitches:\[([^\]]*)\]/) || [])[1];
    const ft = (md.match(/fieldToggles:\[([^\]]*)\]/) || [])[1];
    const parseList = (s) => s ? s.split(',').map((x) => x.trim().replace(/"/g, '')).filter(Boolean) : [];
    return {
      features: fs ? apiFeatureObj(parseList(fs)) : null,
      fieldToggles: ft ? parseList(ft) : null
    };
  }

  function apiScanScriptsFor(op) {
    const names = new Set([op, API_LEGACY_OP_NAMES[op]].filter(Boolean));
    try {
      for (const s of document.scripts) {
        const src = s.src || '';
        if (!src || src.indexOf('abs.twimg.com') === -1) continue;
        const text = s.textContent;
        if (!text || text.length < 2000 || text.length > 25e6) continue;
        for (const name of names) {
          const marker = 'operationName:"' + name + '"';
          let i = text.indexOf(marker);
          while (i !== -1) {
            const win = text.slice(Math.max(0, i - 300), i + 300);
            const qm = win.match(/queryId:"([A-Za-z0-9_-]{20,24})"/);
            if (qm) {
              const meta = apiExtractMetadataBlock(text, i);
              return { operation: name, queryId: qm[1], features: meta.features, fieldToggles: meta.fieldToggles };
            }
            i = text.indexOf(marker, i + 1);
          }
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  // Адаптация под сообщения сервера: «features cannot be null: X, Y».
  function apiFeaturesFromError(errText) {
    const mm = String(errText || '').match(/features cannot be null: ([^"\\}\]]+)/i);
    if (!mm) return null;
    const feats = {};
    for (const part of mm[1].split(',')) {
      for (const piece of part.split(/\s+and\s+/i)) {
        const name = piece.trim();
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) feats[name] = true;
      }
    }
    return Object.keys(feats).length ? feats : null;
  }

  // ------------------------------------------------------------- userId target'а
  async function apiResolveTargetUserId(target) {
    const cached = apiLoadLearnedUserId(target);
    if (cached) return cached;

    const cands = [
      { queryId: API_OPS.UserByScreenName.queryId, features: API_OPS.UserByScreenName.features, fieldToggles: API_OPS.UserByScreenName.fieldToggles, source: 'embedded' }
    ];
    for (const c of apiOpsFromResourceTiming()) {
      if (c.operation === 'UserByScreenName') {
        cands.push({ queryId: c.queryId, features: null, fieldToggles: null, source: 'resource timing' });
      }
    }
    const scanned = apiScanScriptsFor('UserByScreenName');
    if (scanned) cands.push({ queryId: scanned.queryId, features: scanned.features, fieldToggles: scanned.fieldToggles, source: 'bundle scan' });

    const seen = new Set();
    for (const c of cands) {
      if (seen.has(c.queryId)) continue;
      seen.add(c.queryId);
      const vars = { screen_name: target, withGrokTranslatedBio: false };
      let resp = await apiGraphqlRequest(c.queryId, 'UserByScreenName', vars, c.features, c.fieldToggles);
      if (resp.status === 200 && resp.data) {
        const errText = JSON.stringify((resp.data && resp.data.errors) || []);
        const ff = apiFeaturesFromError(errText);
        if (ff && !c.features) resp = await apiGraphqlRequest(c.queryId, 'UserByScreenName', vars, ff, c.fieldToggles);
      }
      if (resp.status === 200 && resp.data && resp.data.data && resp.data.data.user && resp.data.data.user.result) {
        const r = resp.data.data.user.result;
        if (r.__typename !== 'UserUnavailable' && r.rest_id) {
          const id = String(r.rest_id);
          apiLsSet(API_CACHE_KEY + ':userId:' + target, { userId: id, learntAt: Date.now() });
          return id;
        }
        if (r.__typename === 'UserUnavailable') return 'UNAVAILABLE';
      }
      if (resp.status === 401 || resp.status === 403) return 'AUTH_FAIL';
    }
    return null;
  }

  // Кандидаты для запроса таймлайна (в порядке приоритета).
  function apiCandidateOpsFor(mode) {
    const opName = (mode === 'followers') ? 'Followers' : 'Following';
    const list = [];
    const push = (o) => {
      if (o && o.queryId && /^[A-Za-z0-9_-]{20,24}$/.test(o.queryId) && !list.some((x) => x.queryId === o.queryId && x.operation === o.operation)) {
        list.push(o);
      }
    };
    const learned = apiLoadLearnedOp(mode);
    if (learned) push({ operation: learned.operation, queryId: learned.queryId, features: learned.features, fieldToggles: learned.fieldToggles, source: 'learned' });
    push({ operation: opName, queryId: API_OPS[opName].queryId, features: API_OPS[opName].features, fieldToggles: API_OPS[opName].fieldToggles, source: 'embedded' });
    for (const c of apiOpsFromResourceTiming()) push({ operation: c.operation, queryId: c.queryId, features: null, fieldToggles: null, source: 'resource timing' });
    const scanned = apiScanScriptsFor(opName);
    if (scanned) push({ operation: scanned.operation, queryId: scanned.queryId, features: scanned.features, fieldToggles: scanned.fieldToggles, source: 'bundle scan' });
    push({ operation: API_LEGACY_OP_NAMES[opName], queryId: API_OPS[opName].queryId, features: API_OPS[opName].features, fieldToggles: API_OPS[opName].fieldToggles, source: 'legacy name' });
    return list;
  }

  async function apiResolveUbrs(targetUserId) {
    const cands = [
      { queryId: API_UBRS.queryId, features: API_UBRS.features, fieldToggles: API_UBRS.fieldToggles, source: 'embedded' }
    ];
    for (const c of apiOpsFromResourceTiming()) {
      if (c.operation === 'UsersByRestIds') cands.push({ queryId: c.queryId, features: null, fieldToggles: null, source: 'resource timing' });
    }
    const scanned = apiScanScriptsFor('UsersByRestIds');
    if (scanned) cands.push({ queryId: scanned.queryId, features: scanned.features, fieldToggles: scanned.fieldToggles, source: 'bundle scan' });
    for (const c of cands) {
      const probe = await apiGraphqlRequest(c.queryId, 'UsersByRestIds', { userIds: [targetUserId] }, c.features, c.fieldToggles);
      if (probe.status === 404) continue;
      return { queryId: c.queryId, features: c.features, fieldToggles: c.fieldToggles, source: c.source };
    }
    return null;
  }

  // ------------------------------------------------------------- разбор ответов
  function apiParseTwitterDate(s) {
    if (!s) return null;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    const mm = String(s).match(/^[A-Za-z]{3} ([A-Za-z]{3}) (\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-]\d{4}) (\d{4})$/);
    if (!mm) return null;
    const months = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
    if (!(mm[1] in months)) return null;
    const offH = parseInt(mm[6].slice(1, 3), 10), offM = parseInt(mm[6].slice(3), 10);
    const sign = mm[6][0] === '-' ? -1 : 1;
    const utc = Date.UTC(+mm[7], months[mm[1]], +mm[2], +mm[3], +mm[4], +mm[5]) - sign * (offH * 60 + offM) * 60000;
    return new Date(utc);
  }

  // Рекурсивно ищем объект с профильными данными (screen_name + created_at /
  // followers_count) — в какую бы вложенность X его ни спрятал.
  function apiDeepFindProfile(node, depth) {
    if (!node || typeof node !== 'object' || depth > 10) return null;
    if (typeof node.screen_name === 'string' &&
        (typeof node.created_at === 'string' || typeof node.followers_count === 'number')) {
      return node;
    }
    for (const key in node) {
      if (key === '__typename') continue;
      const v = node[key];
      if (v && typeof v === 'object') {
        const found = apiDeepFindProfile(v, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  function apiUnwrapUser(node, depth) {
    if (!node || depth > 5) return node;
    if (node.legacy && typeof node.legacy === 'object' &&
        (node.legacy.screen_name || node.legacy.created_at || typeof node.legacy.followers_count === 'number')) {
      return node;
    }
    const next = (node.core && node.core.user_results && node.core.user_results.result) ||
                 (node.user_results && node.user_results.result);
    return next ? apiUnwrapUser(next, depth + 1) : node;
  }

  function apiDeepFindNumber(node, key, depth) {
    if (!node || typeof node !== 'object' || depth > 8) return null;
    if (typeof node[key] === 'number') return node[key];
    for (const k in node) {
      if (k === '__typename') continue;
      const v = node[k];
      if (v && typeof v === 'object') {
        const f = apiDeepFindNumber(v, key, depth + 1);
        if (f !== null) return f;
      }
    }
    return null;
  }

  function apiExtractCounts(node) {
    const legacy = (node && node.legacy && typeof node.legacy === 'object') ? node.legacy : {};
    const rc = (node && node.relationship_counts && typeof node.relationship_counts === 'object')
      ? node.relationship_counts : {};
    const pick = (...vals) => { for (const v of vals) if (typeof v === 'number') return v; return null; };
    const followers = pick(
      legacy.followers_count,
      node && node.followers_count,
      rc.followers_count, rc.followers,
      apiDeepFindNumber(node, 'followers_count'),
      apiDeepFindNumber(node, 'followers')
    );
    const following = pick(
      legacy.friends_count,
      node && node.friends_count,
      rc.following_count, rc.following, rc.friends_count,
      apiDeepFindNumber(node, 'friends_count'),
      apiDeepFindNumber(node, 'following_count'),
      apiDeepFindNumber(node, 'following')
    );
    return { followers_count: followers, following_count: following };
  }

  function apiNormalizeUser(result, fallbackId) {
    if (!result || result.__typename === 'UserUnavailable') {
      return { ok: false, handle: null, userId: fallbackId || null };
    }
    const deep = apiDeepFindProfile(result);
    const profile = deep || apiUnwrapUser(result);
    const legacy = (profile && profile.legacy && typeof profile.legacy === 'object' &&
                    (profile.legacy.screen_name || profile.legacy.created_at ||
                     typeof profile.legacy.followers_count === 'number'))
      ? profile.legacy : (profile || {});
    const counts = apiExtractCounts(result);
    const userId = result.rest_id || profile.rest_id || legacy.id_str || fallbackId || null;
    const username = legacy.screen_name || profile.screen_name || result.screen_name || null;
    const created = apiParseTwitterDate(legacy.created_at);
    const isBlue = (result.is_blue_verified === true) || (profile.is_blue_verified === true) ||
                   (legacy.is_blue_verified === true);
    const legacyVerified = legacy.verified === true;
    const affLabel = (result.affiliates_highlighted_label && result.affiliates_highlighted_label.label) ||
                     (profile.affiliates_highlighted_label && profile.affiliates_highlighted_label.label) ||
                     (legacy.affiliates_highlighted_label && legacy.affiliates_highlighted_label.label) || null;
    const affiliation = !!(affLabel) ||
      !!(result.verified_org && result.verified_org.verified_org_type) ||
      !!(profile.verified_org && profile.verified_org.verified_org_type) ||
      !!(legacy.verified_org && legacy.verified_org.verified_org_type);
    return {
      ok: true,
      handle: username,
      name: legacy.name != null ? String(legacy.name) : '',
      bio: legacy.description != null ? String(legacy.description).slice(0, 160) : '',
      userId: userId ? String(userId) : null,
      created_year: created ? created.getUTCFullYear() : null,
      created_at: created ? created.toISOString() : null,
      followers_count: counts.followers_count,
      following_count: counts.following_count,
      verified: isBlue || legacyVerified,
      affiliation
    };
  }

  function apiParsePage(data) {
    const out = { users: [], bottomCursor: null };
    const userResult = data && data.data && data.data.user && data.data.user.result;
    if (!userResult || userResult.__typename === 'UserUnavailable') return out;
    const timeline = userResult.timeline && userResult.timeline.timeline;
    const instructions = (timeline && timeline.instructions) || [];
    for (const ins of instructions) {
      if (!ins || !Array.isArray(ins.entries)) continue;
      for (const entry of ins.entries) {
        if (!entry || !entry.content) continue;
        const c = entry.content;
        if (c.entryType === 'TimelineTimelineCursor' || c.__typename === 'TimelineTimelineCursor') {
          if (c.cursorType === 'Bottom' && c.value) out.bottomCursor = c.value;
          continue;
        }
        const entryId = entry.entryId || '';
        const idFromEntry = entryId.indexOf('user-') === 0 ? entryId.slice(5) : null;
        if (c.entryType === 'TimelineTimelineModule' && Array.isArray(c.items)) {
          for (const it of c.items) {
            const ur = it && it.item && it.item.itemContent && it.item.itemContent.user_results;
            const r = ur && ur.result;
            if (r) out.users.push(apiNormalizeUser(r, null));
          }
        } else {
          const ur = c.itemContent && c.itemContent.user_results;
          const r = ur && ur.result;
          if (c.itemContent && (c.itemContent.itemType === 'TimelineUser' || r)) {
            out.users.push(apiNormalizeUser(r, idFromEntry));
          }
        }
      }
    }
    return out;
  }

  // ------------------------------------------------------------- фильтры
  function apiYearMatches(y, cfg) {
    const c = String(cfg || '').trim();
    if (!c || c === 'any') return true;
    if (typeof y !== 'number') return false;
    let m = c.match(/^(\d{4})\+$/);
    if (m) return y >= +m[1];
    m = c.match(/^(\d{4})-$/);
    if (m) return y <= +m[1];
    m = c.match(/^(\d{4})-(\d{4})$/);
    if (m) return y >= +m[1] && y <= +m[2];
    m = c.match(/^(\d{4})$/);
    if (m) return y === +m[1];
    return true; // неизвестный формат — не фильтруем
  }
  function apiFollowersMatches(f, cfg) {
    const c = String(cfg || '').trim();
    if (!c || c === 'any') return true;
    if (typeof f !== 'number') return false;
    let m = c.match(/^(\d+)\+$/);
    if (m) return f >= +m[1];
    m = c.match(/^(\d+)-$/);
    if (m) return f <= +m[1];
    m = c.match(/^(\d+)-(\d+)$/);
    if (m) return f >= +m[1] && f <= +m[2];
    m = c.match(/^(\d+)$/);
    if (m) return f === +m[1];
    return true;
  }
  function apiPassesFilters(u, filters) {
    if (!u || !u.ok || !u.handle) return false;
    if (u.verified !== true) return false;                    // только с галочкой
    if (filters && filters.noAff && u.affiliation === true) return false; // без афилиатов
    if (!apiYearMatches(u.created_year, filters && filters.year)) return false;
    if (!apiFollowersMatches(u.followers_count, filters && filters.followers)) return false;
    return true;
  }

  // Проверка синтаксиса фильтра из панели (без регулярок — безопасно).
  // '2020+' | '2020-' | '2020-2022' | '2020' | '' | 'any'
  function filterPatternOk(t, isYear) {
    const s = String(t || '').trim();
    if (!s || s === 'any') return true;
    const digits = (x) => {
      const n = Number(x);
      return x !== '' && isFinite(n) && n >= 0 && String(Math.floor(n)) === String(x).trim();
    };
    const minLen = isYear ? 4 : 1;
    if (s.charAt(s.length - 1) === '+') return digits(s.slice(0, -1)) && s.slice(0, -1).length >= minLen;
    if (s.charAt(s.length - 1) === '-') {
      const a = s.slice(0, -1);
      if (digits(a) && a.length >= minLen) return true; // '2020-'
      const dash = s.indexOf('-');
      if (dash > 0) {
        const lo = s.slice(0, dash), hi = s.slice(dash + 1);
        return digits(lo) && digits(hi) && lo.length >= minLen && hi.length >= minLen;
      }
      return false;
    }
    if (s.indexOf('-') !== -1) {
      const dash = s.indexOf('-');
      if (dash <= 0) return false;
      const lo = s.slice(0, dash), hi = s.slice(dash + 1);
      return digits(lo) && digits(hi) && lo.length >= minLen && hi.length >= minLen;
    }
    return digits(s) && s.length >= minLen;
  }

  // ------------------------------------------------------------- сам сбор
  // stage: 'following' | 'followers'. Возвращает { users, apiOk, collected }.
  // users — уже прошедшие фильтры (verified + без affiliation + год + подписчики).
  async function collectViaApi(stage, filters, maxMs, onProgress) {
    const target = currentPathHandle();
    if (!target) return { users: [], apiOk: false, reason: 'no target' };

    // Небольшая пауза, чтобы страница успела сделать свои запросы — они нужны
    // для самозаучивания текущих query id (resource timing).
    await sleep(1200);

    const targetUserId = await apiResolveTargetUserId(target);
    if (targetUserId === 'AUTH_FAIL') return { users: [], apiOk: false, reason: 'auth' };
    if (targetUserId === 'UNAVAILABLE') return { users: [], apiOk: false, reason: 'unavailable' };
    if (!targetUserId) return { users: [], apiOk: false, reason: 'no user id' };

    const ubrs = await apiResolveUbrs(targetUserId);

    // Пробуем кандидатов: 404 = id протух, берём следующий.
    let chosen = null;
    for (const cand of apiCandidateOpsFor(stage)) {
      const vars = { userId: targetUserId, count: 1, includePromotedContent: false, withGrokTranslatedBio: false };
      const resp = await apiGraphqlRequest(cand.queryId, cand.operation, vars, cand.features, cand.fieldToggles);
      if (resp.status === 404) continue;
      chosen = cand;
      break;
    }
    if (!chosen) return { users: [], apiOk: false, reason: 'all query ids 404' };

    let features = chosen.features || {};
    let fieldToggles = chosen.fieldToggles || null;

    const all = new Map();       // key: userId || handle
    const seenCursors = new Set();
    let cursor = null;
    let page = 0;
    let stalePages = 0;
    let featureRetried = false;
    let learned = false;
    const deadline = Date.now() + (maxMs || STAGE_TIMEOUT_MS);

    const buildVariables = (c) => {
      const variables = {
        userId: targetUserId,
        count: API_PAGE_SIZE,
        includePromotedContent: false,
        withGrokTranslatedBio: false
      };
      if (c !== null) variables.cursor = c;
      return variables;
    };

    while (page < API_MAX_PAGES && Date.now() < deadline) {
      // остановлено пользователем
      try { const { job } = await get('job'); if (!job || !job.active) break; } catch (e) { /* ignore */ }

      const ck = cursor === null ? '__first__' : cursor;
      if (seenCursors.has(ck)) break; // повторный курсор = конец списка
      seenCursors.add(ck);
      const variables = buildVariables(cursor);

      let resp = null;
      let fatal = null;
      for (let attempt = 0; attempt < API_MAX_RETRIES; attempt++) {
        resp = await apiGraphqlRequest(chosen.queryId, chosen.operation, variables, features, fieldToggles);
        if (resp.status !== 200) {
          if (resp.retry) {
            await sleep(5000 * Math.pow(2, attempt) + apiRnd(0, 3000));
            continue;
          }
          break;
        }
        const errText = JSON.stringify((resp.data && resp.data.errors) || []);
        if (/rate limit/i.test(errText)) {
          await sleep(30000 + apiRnd(0, 20000)); // rate-limit — ждём и повторяем
          continue;
        }
        const vm = errText.match(/variables cannot be null: ([^"\\}\]]+)/i);
        if (vm) {
          const needed = vm[1].trim();
          if (/user_id|userId/i.test(needed)) {
            delete variables.screen_name;
            delete variables.user_id;
            variables.userId = targetUserId;
            continue;
          }
          if (/screen_name/i.test(needed)) {
            delete variables.userId;
            variables.screen_name = target;
            continue;
          }
          if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(needed) && !(needed in variables)) {
            variables[needed] = true;
            continue;
          }
          fatal = 'unsupported variable: ' + needed;
          break;
        }
        break; // успех
      }
      if (fatal || !resp || resp.status !== 200) break;

      const errText = JSON.stringify((resp.data && resp.data.errors) || []);
      if (/features cannot be null/i.test(errText)) {
        const ff = apiFeaturesFromError(errText);
        if (ff && (!featureRetried || JSON.stringify(features) !== JSON.stringify(ff))) {
          features = ff;
          featureRetried = true;
          seenCursors.delete(ck);
          continue;
        }
        break;
      }
      if (/rate limit/i.test(errText)) {
        await sleep(60000);
        seenCursors.delete(ck);
        continue;
      }

      const parsed = apiParsePage(resp.data);
      let added = 0;
      for (const u of parsed.users) {
        if (!u.ok) continue;
        const k = u.userId || u.handle;
        if (k && !all.has(k)) { all.set(k, u); added++; }
        else if (!k) { all.set('__noid__' + all.size, u); added++; }
      }
      // X умеет возвращать пустые страницы с новым курсором после конца списка —
      // две пустые подряд считаем концом.
      if (added === 0) { stalePages++; if (stalePages >= 2) break; } else stalePages = 0;

      page++;
      // Запоминаем рабочий формат запроса после первой успешной страницы.
      if (!learned) {
        learned = true;
        apiLsSet(API_CACHE_KEY + ':op:' + stage, {
          operation: chosen.operation, queryId: chosen.queryId,
          features, fieldToggles, learntAt: Date.now()
        });
      }
      if (!parsed.bottomCursor) break;
      cursor = parsed.bottomCursor;
      if (onProgress) {
        try {
          const matches = [...all.values()].filter((u) => apiPassesFilters(u, filters)).length;
          await onProgress(matches);
        } catch (e) { /* ignore */ }
      }
      await sleep(apiRnd(API_MIN_DELAY, API_MAX_DELAY)); // «человеческий» темп
    }

    // Первая страница не прошла (403/401/сеть/все ретраи) — данных нет вообще:
    // отдаём apiOk:false, чтобы вызывающий код переключился на DOM-фолбэк.
    if (page === 0) return { users: [], apiOk: false, reason: 'first page failed' };

    // Обогащение «заглушек» (userId без username) батч-операцией UsersByRestIds.
    if (ubrs) {
      const stubs = [...all.values()].filter((u) => u.ok && u.userId && !u.handle);
      if (stubs.length) {
        const BATCH = 100;
        for (let i = 0; i < stubs.length; i += BATCH) {
          const chunkIds = stubs.slice(i, i + BATCH).map((u) => u.userId);
          let resp = null;
          for (let attempt = 0; attempt < API_MAX_RETRIES; attempt++) {
            resp = await apiGraphqlRequest(ubrs.queryId, 'UsersByRestIds', { userIds: chunkIds }, ubrs.features, ubrs.fieldToggles);
            if (resp.status === 200) break;
            if (resp.status === 401 || resp.status === 403) break;
            await sleep(5000 * Math.pow(2, attempt) + apiRnd(0, 3000));
          }
          if (!resp || resp.status !== 200) continue;
          const usersArr = resp.data && resp.data.data && resp.data.data.users;
          if (!Array.isArray(usersArr)) continue;
          for (const entry of usersArr) {
            const r = entry && entry.result;
            if (!r || !r.rest_id) continue;
            const nu = apiNormalizeUser(r, String(r.rest_id));
            if (all.has(String(r.rest_id))) all.set(String(r.rest_id), nu);
          }
          await sleep(apiRnd(400, 900));
        }
      }
    }

    const matches = [...all.values()].filter((u) => apiPassesFilters(u, filters));
    return { users: matches, apiOk: true, collected: all.size, pages: page };
  }

  /* ================= цикл сбора ================= */

  // Скроллит список до конца, собирая ТОЛЬКО верифицированных пользователей.
  // Сталл считаем по ЛЮБЫМ новым ячейкам (не только verified) — иначе список,
  // где подряд идут неверифицированные аккаунты, был бы оборван раньше конца.
  async function collectUsers(stage, maxMs, onProgress) {
    const found = new Map();   // verified-пользователи
    const seen = new Set();    // все ники, что встречались (для детекции конца списка)
    const startAt = Date.now();
    let stall = 0;
    let scrolls = 0;
    const tlSel = stage === 'followers'
      ? '[aria-label^="Timeline: Follower"]'
      : '[aria-label^="Timeline: Following"]';

    while (Date.now() - startAt < maxMs) {
      const { job } = await get('job');
      if (!job || !job.active) return [...found.values()]; // остановлено

      const timeline = document.querySelector(tlSel);
      if (!timeline) {
        scrolls++;
        await humanScroll(tlSel);
        await sleep(humanPause(1100, 2200));
        continue;
      }

      const cells = timeline.querySelectorAll('[data-testid="UserCell"]');
      let added = 0;
      for (const cell of cells) {
        const u = parseCell(cell);
        if (!u || !u.handle) continue;
        if (!seen.has(u.handle)) {
          seen.add(u.handle);
          added++; // любая новая ячейка = прогресс скролла
          if (u.verified) found.set(u.handle, u);
        }
      }
      stall = added === 0 ? stall + 1 : 0;
      if (onProgress) await onProgress(found.size);
      if (stall >= 4) break;      // дошли до конца списка
      if (scrolls >= 900) break;  // предохранитель
      scrolls++;
      await humanScroll(tlSel);
      await sleep(humanPause(800, 1600, 0.1, 3000));
    }
    return [...found.values()];
  }

  // «Человеческий» скролл: спускаемся вниз порциями со случайными паузами,
  // изредка слегка отматываясь назад. Мгновенный «прыжок в конец каждые N мс»
  // — самый читаемый бот-паттерн, поэтому скроллим поэтапно. Окно + (если есть)
  // внутренний скролл-контейнер таймлайна.
  async function humanScroll(tlSel) {
    const sc = document.scrollingElement || document.documentElement;
    const target = sc.scrollHeight;
    let guard = 0;
    while (sc.scrollTop < target - 150 && guard++ < 60) {
      const step = 500 + Math.random() * 800;
      sc.scrollTop = Math.min(target, sc.scrollTop + step);
      window.scrollTo(0, sc.scrollTop);
      await sleep(90 + Math.random() * 220);
      if (Math.random() < 0.07) {
        // иногда чуть назад — как живой человек, проверяющий строки
        sc.scrollTop = Math.max(0, sc.scrollTop - (50 + Math.random() * 140));
        window.scrollTo(0, sc.scrollTop);
        await sleep(120 + Math.random() * 200);
      }
    }
    // Дожимаем до низа ТОЛЬКО если осталось чуть-чуть — иначе на огромных
    // списках (виртуализированный скролл) это был бы мгновенный телепорт.
    if (target - sc.scrollTop < 2000) { sc.scrollTop = target; window.scrollTo(0, target); }
    const tl = document.querySelector(tlSel);
    let el = tl ? tl.parentElement : null;
    while (el && el !== document.body) {
      if (el.scrollHeight > el.clientHeight + 2) {
        const ov = getComputedStyle(el).overflowY;
        if (ov === 'auto' || ov === 'scroll') {
          el.scrollTop = el.scrollHeight;
          break;
        }
      }
      el = el.parentElement;
    }
  }

  async function waitFor(fn, timeoutMs, intervalMs = 500) {
    const startAt = Date.now();
    while (Date.now() - startAt < timeoutMs) {
      const el = fn();
      if (el) return el;
      await sleep(intervalMs);
    }
    return null;
  }

  /* ================= поток задачи (вкладка-скрейпер) ================= */

  async function maybeRunJob() {
    const { job } = await get('job');
    if (!job || !job.active) return;

    try { chrome.runtime.sendMessage({ type: 'REGISTER_JOB_TAB' }); } catch (e) { /* ignore */ }

    const timeoutMs = job.timeoutMs || BASE_TIMEOUT_MS;
    if (Date.now() - job.startedAt > timeoutMs) {
      await notify(job, t('log.timeout', { kind: job.kind === 'tas' ? 'TAS' : t('w.parsing'), h: job.handle }));
      await abort(job, 'Timeout');
      return;
    }

    // Проверка, что нас не выкинуло на страницу входа
    const host = location.hostname.toLowerCase();
    const path = location.pathname.toLowerCase();
    const loginWall =
      host.includes('login') ||
      path.startsWith('/login') ||
      !!document.querySelector('a[href="/i/flow/login"], a[href="/login"]');
    if (loginWall) {
      await notify(job, t('log.loginWall', { act: job.kind === 'tas' ? 'TAS' : t('w.parse'), h: job.handle }));
      await abort(job, 'Login to X required');
      return;
    }

    // TAS — свой поток: сбор ссылок → Grok → канал
    if (job.kind === 'tas') { await runTasStep(job); return; }

    if (job.phase === 'enrich') {
      // enrichMode 'fetch' = быстрый путь без навигации; иначе — обход профилей
      if (job.enrichMode === 'fetch') { await runEnrichFetchStep(job); return; }
      await runEnrichStep(job);
      return;
    }
    const stage = job.phase === 'followers' ? 'followers' : 'following';
    await runCollectStage(job, stage);
  }

  // Собираем верифицированных из списка following / followers.
  async function runCollectStage(job, stage) {
    const stageLabel = t('w.' + stage);
    if (currentPathHandle() !== job.handle.toLowerCase() || currentStage() !== stage) {
      // X мог редиректнуть профиль (переименован/удалён) — защита от цикла
      const gk = 'sx_redir_target_' + job.handle.toLowerCase();
      let n = 0;
      try { n = Number(sessionStorage.getItem(gk)) || 0; } catch (e) { /* ignore */ }
      if (n >= 4) {
        await sendMessage(job, t('log.redirect', { h: job.handle }));
        await abort(job, 'Profile redirects');
        return;
      }
      try { sessionStorage.setItem(gk, String(n + 1)); } catch (e) { /* ignore */ }
      goTo('/' + job.handle + '/' + stage);
      return;
    }
    try { sessionStorage.removeItem('sx_redir_target_' + job.handle.toLowerCase()); } catch (e) { /* ignore */ }

    await patchJob({ status: t('st.collecting', { stage: stageLabel }) });

    // Сначала проверяем ошибки страницы — на rate-limit странице таймлайн
    // вообще не отрисуется, и без этой проверки была бы ложная ошибка
    const head = (document.body ? document.body.innerText.slice(0, 4000) : '').toLowerCase();
    if (/rate limit|try again later|something went wrong/.test(head)) {
      await sendMessage(job, t('log.rateLimit', { h: job.handle }));
      await abort(job, 'X rate limit');
      return;
    }

    // Фильтры из настроек панели (пусто = любой год / любое число подписчиков).
    const filters = {
      year: String(job.year || '').trim() || 'any',
      followers: String(job.followers || '').trim() || 'any',
      noAff: job.noAff !== false
    };

    // НОВЫЙ метод: те же GraphQL-операции, что и само приложение x.com — сразу
    // год создания и число подписчиков, без обхода профилей. При сбое — DOM-скролл.
    let users = [];
    let usedApi = false;
    try {
      const apiRes = await collectViaApi(stage, filters, STAGE_TIMEOUT_MS, async (count) => {
        await patchJob({
          progress: { stage, collected: count },
          status: t('st.collectingApi', { stage: stageLabel, n: count.toLocaleString('en-US') })
        });
      });
      if (apiRes && apiRes.apiOk) { users = apiRes.users; usedApi = true; }
    } catch (e) { /* переходим на DOM-фолбэк */ }

    if (!usedApi) {
      const tlSel = stage === 'followers'
        ? '[aria-label^="Timeline: Follower"]'
        : '[aria-label^="Timeline: Following"]';
      const timeline = await waitFor(() => document.querySelector(tlSel), 15000, 400);
      if (!timeline) {
        await sendMessage(job, t('log.cantLoadList', { stage: stageLabel, h: job.handle }));
        await abort(job, 'Could not load the list');
        return;
      }
      users = await collectUsers(stage, STAGE_TIMEOUT_MS, async (count) => {
        await patchJob({
          progress: { stage, collected: count },
          status: t('st.collectingDone', { stage: stageLabel, n: count.toLocaleString('en-US') })
        });
      });
    }

    // Задачу могли остановить («Стоп» / закрыли вкладку) — не продолжаем.
    const { job: fresh } = await get('job');
    if (!fresh || !fresh.active) return;
    job = fresh;

    const key = stage === 'following' ? 'users' : 'users2';
    // usedApi: оба списка собраны API-методом — тогда фильтры и числа подписчиков
    // уже известны, и обход профилей не нужен (отчёт строится сразу).
    const bothApi = stage === 'following' ? usedApi : (job.usedApi !== false && usedApi);
    const next = { ...job, [key]: users, usedApi: bothApi, progress: { stage, collected: users.length } };

    if (stage === 'following') {
      next.phase = 'followers';
      next.status = t('st.followingDone', { n: users.length.toLocaleString('en-US') });
      try { await set({ job: next }); } catch (e) { await abort(job, 'Storage error'); return; }
      await sleep(humanPause(800, 2000)); // пауза перед переходом — не «телепорт»
      goTo('/' + job.handle + '/followers');
      return;
    }

    // Оба списка собраны. API-режим: год и число подписчиков пришли сразу —
    // фильтры уже применены при сборе, строим отчёт без обхода профилей.
    if (bothApi) {
      const results = {};
      const all = [...(job.users || []), ...users];
      for (const u of all) {
        const k = (u.handle || '').toLowerCase();
        if (!k) continue;
        const fc = u.followers_count;
        results[k] = { followers: (typeof fc === 'number' && isFinite(fc)) ? formatCount(fc) : '' };
      }
      next.results = results;
      next.phase = 'report';
      next.status = all.length
        ? 'Building the report…'
        : 'No verified accounts match the filters — building report…';
      try { await set({ job: next }); } catch (e) { await abort(job, 'Storage error'); return; }
      await finishReport(next);
      return;
    }

    // DOM-режим (фолбэк): года/подписчиков нет — фильтры года/подписчиков
    // пропускаем и честно сообщаем об этом.
    if (filters.year !== 'any' || filters.followers !== 'any') {
      await sendMessage(job, t('log.domFallback'));
    }

    // Оба списка собраны — строим очередь обхода профилей (без дублей),
    // чтобы снять число подписчиков каждого верифицированного юзера.
    const queueMap = new Map();
    [...(job.users || []), ...users].forEach((u) => {
      const k = (u.handle || '').toLowerCase();
      if (k && !queueMap.has(k)) queueMap.set(k, u);
    });
    const queue = [...queueMap.values()];
    next.enrichQueue = queue;
    next.enrichIndex = 0;
    next.enrichFails = 0;
    next.results = {};

    if (!queue.length) {
      next.phase = 'report';
      next.status = 'No verified accounts — building report…';
      try { await set({ job: next }); } catch (e) { await abort(job, 'Storage error'); return; }
      await finishReport(next);
      return;
    }

    next.phase = 'enrich';
    next.enrichMode = 'fetch';   // быстрый путь: fetch без навигации по профилям
    next.enrichFails = 0;
    next.visitQueue = [];        // кому не сняли число через fetch — обойдём страницы
    next.timeoutMs = Math.min(MAX_TIMEOUT_MS, BASE_TIMEOUT_MS + queue.length * ENRICH_PER_USER_MS);
    next.progress = { stage: 'enrich', collected: 0, total: queue.length };
    next.status = `Follower counts (fast): 0/${queue.length}…`;
    try { await set({ job: next }); } catch (e) { await abort(job, 'Storage error'); return; }
    await runEnrichFetchStep(next);
    return;
  }

  // Этап 3 (быстрый путь): не открывая новых вкладок, fetch'им страницу профиля
  // и вытаскиваем followers_count из встроенного состояния. В десятки раз быстрее
  // обхода. Не снятые таким способом ники переходят в runEnrichStep (обход).
  async function runEnrichFetchStep(initialJob) {
    let job = initialJob;
    const queue = job.enrichQueue || [];
    let idx = job.enrichIndex || 0;
    const results = { ...(job.results || {}) };
    let visitQueue = [...(job.visitQueue || [])];
    let burst = job.enrichFails || 0;

    while (idx < queue.length) {
      const { job: cur } = await get('job');
      if (!cur || !cur.active) return; // остановлено
      job = cur;
      const user = queue[idx];
      const key = (user.handle || '').toLowerCase();

      const r = await fetchFollowersCountFast(key);
      if (r.ok) {
        results[key] = { followers: formatCount(r.count) };
        burst = 0;
      } else {
        visitQueue.push(key);
        burst++;
      }
      idx++;

      // 6 неудач подряд — похоже на rate-limit или X изменил разметку:
      // остаток добираем обходом страниц (у того свои защитные механизмы).
      if (burst >= 6) {
        for (let i = idx; i < queue.length; i++) visitQueue.push(String(queue[i].handle || '').toLowerCase());
        idx = queue.length;
      }

      const next = await patchJob({
        enrichIndex: idx,
        enrichFails: burst,
        results,
        visitQueue,
        progress: { stage: 'enrich', collected: idx, total: queue.length },
        status: t('st.followerCountsFast', { i: idx, n: queue.length })
      });
      if (!next) return; // задача остановлена или storage переполнен
      job = next;
      // Паузы «как человек листает»: неравномерные, каждые ~15 запросов — отдых.
      if (idx % 15 === 0) await sleep(2500 + Math.random() * 3000);
      await sleep(humanPause(900, 2000, 0.1, 3500));
    }

    const { job: finalJob } = await get('job');
    if (!finalJob || !finalJob.active) return;
    job = finalJob;

    if (visitQueue.length) {
      const next = await patchJob({
        phase: 'enrich',
        enrichMode: 'visit',
        enrichQueue: visitQueue.map((h) => ({ handle: h, name: '', verified: true, bio: '' })),
        enrichIndex: 0,
        enrichFails: 0,
        visitQueue: [],
        progress: { stage: 'enrich', collected: 0, total: visitQueue.length },
        status: t('st.visiting', { n: visitQueue.length })
      });
      if (!next) return;
      await sleep(humanPause(800, 1800));
      goTo('/' + visitQueue[0]);
      return;
    }

    await finishReport(job);
  }

  // Этап 3 (обход): по очереди заходим на профиль каждого юзера, чьё число не
  // снялось через fetch, и берём подписчиков из шапки. Сбои отдельных профилей
  // прогон не ломают — только серия rate-limit-ошибок останавливает задачу.
  async function runEnrichStep(job) {
    const queue = job.enrichQueue || [];
    const idx = job.enrichIndex || 0;
    if (idx >= queue.length) { await finishReport(job); return; }
    const user = queue[idx];
    const key = (user.handle || '').toLowerCase();

    if (currentPathHandle() !== key) {
      // X мог редиректнуть на новый ник — защита от бесконечного цикла
      const gk = 'sx_redir_' + key;
      let n = 0;
      try { n = Number(sessionStorage.getItem(gk)) || 0; } catch (e) { /* ignore */ }
      if (n >= 2) {
        const next = await patchJob({
          enrichIndex: idx + 1,
          results: { ...(job.results || {}), [key]: { followers: '' } },
          progress: { stage: 'enrich', collected: idx + 1, total: queue.length },
          status: t('st.redirectSkipped', { h: user.handle, i: idx + 1, n: queue.length })
        });
        if (!next) return; // задача остановлена
        if (idx + 1 >= queue.length) { await finishReport(next); }
        else { await sleep(humanPause(1000, 2200)); goTo('/' + queue[idx + 1].handle); }
        return;
      }
      try { sessionStorage.setItem(gk, String(n + 1)); } catch (e) { /* ignore */ }
      goTo('/' + user.handle);
      return;
    }
    try { sessionStorage.removeItem('sx_redir_' + key); } catch (e) { /* ignore */ }

    // Быстрая проверка rate-limit / сломанной страницы
    const head = (document.body ? document.body.innerText.slice(0, 3000) : '').toLowerCase();
    const rateLimited = /rate limit|try again later|something went wrong|temporarily blocked/.test(head);

    await patchJob({ status: t('st.checkingProfile', { h: user.handle, i: idx + 1, n: queue.length }) });

    let followers = '';
    if (!rateLimited) {
      // Число — в шапке профиля, в ссылке /followers или /verified_followers;
      // на обычной странице оно есть уже через пару секунд.
      followers = (await waitFor(() => parseFollowersCount(), 8000, 300)) || '';
    }

    const results = { ...(job.results || {}), [key]: { followers } };
    const fails = rateLimited ? (job.enrichFails || 0) + 1 : 0;
    if (rateLimited && fails >= MAX_CONSECUTIVE_FAILS) {
      await sendMessage(job, t('log.rateLimitCheck', { i: idx + 1, n: queue.length }));
      await abort(job, 'X rate limit during profile check');
      return;
    }

    const next = await patchJob({
      enrichIndex: idx + 1,
      enrichFails: fails,
      results,
      progress: { stage: 'enrich', collected: idx + 1, total: queue.length },
      status: t('st.followersGot', { h: user.handle, f: followers || '?', i: idx + 1, n: queue.length })
    });
    if (!next) return; // задача остановлена или storage переполнен
    if (idx + 1 >= queue.length) {
      await finishReport(next);
    } else {
      await sleep(humanPause(1200, 2400)); // не долбим X подряд
      goTo('/' + queue[idx + 1].handle);
    }
  }

  /* ================= TAS: поток задачи ================= */

  async function runTasStep(job) {
    switch (job.phase) {
      case 'tas-following': await runTasCollect(job, 'following'); return;
      case 'tas-followers': await runTasCollect(job, 'followers'); return;
      case 'tas-grok': await runTasGrok(job); return;
      case 'tas-send': await runTasSend(job); return;
      default: {
        // Незнакомая фаза (например устаревший job из старой версии) — заново.
        const next = await patchJob({ phase: 'tas-following', status: t('st.tasRestarting') });
        if (!next) return;
        goTo('/' + job.handle + '/following');
      }
    }
  }

  // TAS-этап сбора: верифицированные ссылки из following / followers (без био,
  // подписчиков и прочего — в очередь идёт только список ссылок).
  async function runTasCollect(job, stage) {
    if (currentPathHandle() !== job.handle.toLowerCase() || currentStage() !== stage) {
      const gk = 'sx_redir_target_' + job.handle.toLowerCase();
      let n = 0;
      try { n = Number(sessionStorage.getItem(gk)) || 0; } catch (e) { /* ignore */ }
      if (n >= 4) {
        await sendLog(job, t('log.tasRedirect', { h: job.handle }));
        await abort(job, 'Profile redirects');
        return;
      }
      try { sessionStorage.setItem(gk, String(n + 1)); } catch (e) { /* ignore */ }
      goTo('/' + job.handle + '/' + stage);
      return;
    }
    try { sessionStorage.removeItem('sx_redir_target_' + job.handle.toLowerCase()); } catch (e) { /* ignore */ }

    await patchJob({ status: t('st.tasCollecting', { stage: t('w.' + stage) }) });

    const head = (document.body ? document.body.innerText.slice(0, 4000) : '').toLowerCase();
    if (/rate limit|try again later|something went wrong/.test(head)) {
      await sendLog(job, t('log.tasRateLimit', { h: job.handle }));
      await abort(job, 'X rate limit');
      return;
    }

    // Фильтры из настроек панели (пусто = любой год / любое число подписчиков).
    const filters = {
      year: String(job.year || '').trim() || 'any',
      followers: String(job.followers || '').trim() || 'any',
      noAff: job.noAff !== false
    };

    // НОВЫЙ метод: те же GraphQL-операции, что и само приложение x.com — сразу
    // год создания и число подписчиков. При сбое — DOM-скролл.
    let users = [];
    let usedApi = false;
    try {
      const apiRes = await collectViaApi(stage, filters, STAGE_TIMEOUT_MS, async (count) => {
        await patchJob({
          progress: { stage, collected: count },
          status: t('st.tasMatched', { stage: t('w.' + stage), n: count.toLocaleString('en-US') })
        });
      });
      if (apiRes && apiRes.apiOk) { users = apiRes.users; usedApi = true; }
    } catch (e) { /* переходим на DOM-фолбэк */ }

    if (!usedApi) {
      const tlSel = stage === 'followers'
        ? '[aria-label^="Timeline: Follower"]'
        : '[aria-label^="Timeline: Following"]';
      const timeline = await waitFor(() => document.querySelector(tlSel), 15000, 400);
      if (!timeline) {
        await sendLog(job, t('log.tasCantLoad', { stage: t('w.' + stage), h: job.handle }));
        await abort(job, 'Could not load the list');
        return;
      }
      users = await collectUsers(stage, STAGE_TIMEOUT_MS, async (count) => {
        await patchJob({
          progress: { stage, collected: count },
          status: t('st.tasGot', { stage: t('w.' + stage), n: count.toLocaleString('en-US') })
        });
      });
    }

    const { job: fresh } = await get('job');
    if (!fresh || !fresh.active) return;
    job = fresh;

    const key = stage === 'following' ? 'tasUsers' : 'tasUsers2';
    const bothApi = stage === 'following' ? usedApi : (job.tasUsedApi !== false && usedApi);
    const next = { ...job, [key]: users, tasUsedApi: bothApi, progress: { stage, collected: users.length } };

    if (stage === 'following') {
      next.phase = 'tas-followers';
      next.status = `TAS: following — ${users.length.toLocaleString('en-US')} verified. Moving to followers…`;
      try { await set({ job: next }); } catch (e) { await abort(job, 'Storage error'); return; }
      await sleep(humanPause(800, 2000));
      goTo('/' + job.handle + '/followers');
      return;
    }

    // DOM-режим (фолбэк): года/подписчиков нет — фильтры пропускаем и сообщаем.
    if (!bothApi && (filters.year !== 'any' || filters.followers !== 'any')) {
      await sendLog(job, t('log.tasDomFallback'));
    }

    // Оба списка собраны — дедуплицируем и строим список ссылок.
    const seen = new Set();
    const links = [];
    [...(job.tasUsers || []), ...users].forEach((u) => {
      const h = (u.handle || '').toLowerCase();
      if (h && !seen.has(h)) { seen.add(h); links.push('https://x.com/' + h); }
    });

    if (!links.length) {
      await sendLog(job, t('log.tasNoVerified', { h: job.handle }));
      await abort(job, 'No verified links');
      return;
    }

    next.tasLinks = links;
    next.phase = 'tas-grok';
    next.status = `TAS: ${links.length.toLocaleString('en-US')} verified links — opening Grok…`;
    next.timeoutMs = Math.min(MAX_TIMEOUT_MS, (Date.now() - job.startedAt) + 60 * 60 * 1000);
    next.progress = { stage: 'grok' };
    try { await set({ job: next }); } catch (e) { await abort(job, 'Storage error'); return; }
    await sleep(humanPause(800, 2000));
    goTo('/i/grok');
  }

  // TAS-этап Grok: вставка промта со ссылками, отправка, ожидание ответа,
  // копирование, разбивка на части {…}.
  async function runTasGrok(job) {
    const path = location.pathname.toLowerCase();
    if (!path.startsWith('/i/grok')) {
      const gk = 'sx_redir_grok_' + job.handle.toLowerCase();
      let n = 0;
      try { n = Number(sessionStorage.getItem(gk)) || 0; } catch (e) { /* ignore */ }
      if (n >= 3) {
        await sendLog(job, t('log.tasGrokRedirect'));
        await abort(job, 'Grok redirect loop');
        return;
      }
      try { sessionStorage.setItem(gk, String(n + 1)); } catch (e) { /* ignore */ }
      goTo('/i/grok');
      return;
    }
    try { sessionStorage.removeItem('sx_redir_grok_' + job.handle.toLowerCase()); } catch (e) { /* ignore */ }

    await patchJob({ status: t('st.tasOpening') });
    // Основной селектор — точный, из разметки пользователя; запасной — любое
    // текстовое поле в главной области (на случай другого плейсхолдера).
    const ta = await waitFor(() =>
      document.querySelector(GROK_TEXTAREA_SEL) ||
      document.querySelector('main textarea[placeholder]'),
      60000, 500);
    if (!ta) {
      await sendLog(job, t('log.tasNoInput'));
      await abort(job, 'Grok input not found');
      return;
    }

    // Собираем ссылки (с предохранителем размера — очень длинные промты Grok
    // может просто отклонить).
    let links = job.tasLinks || [];
    let truncated = false;
    let joined = links.join(', ');
    while (joined.length > GROK_MAX_LINKS_CHARS && links.length > 1) {
      links = links.slice(0, Math.ceil(links.length / 2));
      joined = links.join(', ');
      truncated = true;
    }
    const linksText = joined +
      (truncated ? `\n\n[Note: the list was truncated to the first ${links.length} accounts because of input size limits.]` : '');
    if (!linksText.trim()) {
      await sendLog(job, t('log.tasEmptyLinks', { h: job.handle }));
      await abort(job, 'No verified links');
      return;
    }

    // «Уже отправили промт» — защита от повторной отправки, если вкладку
    // перезагрузили посреди ожидания ответа: промт не дублируем, просто ждём.
    // Флаг привязан к startedAt конкретной задачи: даже если вкладка каким-то
    // образом переживёт предыдущий прогон, новая задача его не подхватит.
    const sentFlag = 'sx_grok_sent_' + job.handle.toLowerCase();
    let sent = false;
    try { sent = sessionStorage.getItem(sentFlag) === String(job.startedAt); } catch (e) { /* ignore */ }

    // Промт вычисляем ВСЕГДА (не только при отправке): даже в resume-пути
    // (после перезагрузки вкладки) guard «не поймали ли мы сам промт» должен
    // работать — иначе в канал мог бы уйти текст промта вместо ответа.
    const fullPrompt = TAS_PROMPT.replace(TAS_LINKS_PLACEHOLDER, linksText);
    if (!sent) {
      ta.focus();
      setReactInput(ta, fullPrompt);
      await sleep(humanPause(600, 1400));

      const sendBtn = await waitFor(() => {
        const b = document.querySelector(GROK_SEND_SEL);
        return b && !b.disabled ? b : null;
      }, 10000, 300);
      if (!sendBtn) {
        await sendLog(job, t('log.tasNoSend'));
        await abort(job, 'Grok send button not found');
        return;
      }
      sendBtn.click();
      try { sessionStorage.setItem(sentFlag, String(job.startedAt)); } catch (e) { /* ignore */ }
      await patchJob({ status: t('st.tasPromptSent') });
    } else {
      await patchJob({ status: t('st.tasResumed') });
    }

    // «Базовая линия» кнопок Copy ДО ожидания: в старой переписке они уже есть,
    // а ответ считается готовым, когда кнопок становится БОЛЬШЕ (новое сообщение
    // добавило свою панель действий). Кнопки Like намеренно не учитываем: они
    // могут появляться в сайдбаре/рекомендациях и давать ложное срабатывание,
    // а Copy существует только у строк сообщений (и появляется вместе с Like).
    const copyBefore = document.querySelectorAll(GROK_COPY_SEL).length;

    const grokStart = Date.now();
    let answered = false;
    while (Date.now() - grokStart < GROK_TIMEOUT_MS) {
      const { job: cur } = await get('job');
      if (!cur || !cur.active) return;
      job = cur;
      if (document.querySelectorAll(GROK_COPY_SEL).length > copyBefore) {
        answered = true;
        break;
      }
      const head = (document.body ? document.body.innerText.slice(0, 1500) : '').toLowerCase();
      if (/rate limit|something went wrong/.test(head) && !document.querySelector(GROK_TEXTAREA_SEL)) {
        await sendLog(job, t('log.tasError'));
        await abort(job, 'Grok error page');
        return;
      }
      const elapsed = Math.round((Date.now() - grokStart) / 1000);
      await patchJob({ status: t('st.tasThinking', { s: elapsed }) });
      await sleep(3000);
    }
    if (!answered) {
      await sendLog(job, t('log.tasTimeout'));
      await abort(job, 'Grok timeout');
      return;
    }
    await patchJob({ status: t('st.tasAnswered') });

    // Копируем ответ и читаем его. Несколько попыток: Grok может сначала
    // показать кнопку Copy у САМОГО ВОПРОСА (наш промт) — тогда ждём, когда
    // появится следующее сообщение, и читаем уже настоящий ответ.
    let text = '';
    let foundPrompt = false;
    for (let attempt = 0; attempt < 3 && !text; attempt++) {
      const copyBtns = document.querySelectorAll(GROK_COPY_SEL);
      if (!copyBtns.length) break;
      const copyBtn = copyBtns[copyBtns.length - 1]; // кнопка последнего сообщения

      // СБРОС lastCopied: устаревший текст из прошлого копирования в этой
      // вкладке не должен попасть в посты, если новый захват не сработает.
      lastCopied = '';
      copyBtn.click();

      // Ждём ОСМЫСЛЕННЫЙ захват буфера: страница Grok может параллельно
      // писать в буфер свои служебные значения (ID сообщения и т.п.) — их
      // игнорируем, ждём только текст с ссылками на x.com.
      let clip = await waitFor(() => {
        const t = lastCopied;
        if (!t || t.length < 200) return null;
        return (t.match(/https:\/\/(x|twitter)\.com\//g) || []).length >= 2 ? t : null;
      }, 6000, 200) || '';
      if (!clip) {
        try { clip = (await navigator.clipboard.readText()) || ''; } catch (e) { clip = ''; }
      }

      // Надёжный источник — сам ответ в DOM: поднимаемся от кнопки Copy нового
      // сообщения до пузыря с текстом ответа. Буфер — запасной вариант.
      const domText = extractLastGrokMessage(copyBtn);
      let cand = '';
      if (domText && looksLikeAnswer(domText)) cand = domText;
      else if (clip && looksLikeAnswer(clip)) cand = clip;
      else if (domText) cand = domText;
      else if (clip) cand = clip;

      // Если поймали свой же промт (вопрос), а не ответ — ждём, когда кнопок
      // Copy станет больше (появится ответ), и пробуем ещё раз.
      if (cand && fullPrompt && (cand.includes(fullPrompt) || fullPrompt.includes(cand))) {
        foundPrompt = true;
        await waitFor(() => document.querySelectorAll(GROK_COPY_SEL).length > copyBtns.length, 30000, 1000);
        continue;
      }
      if (cand) text = cand;
    }

    // Мусор в канал не шлём: без ссылок/скобок и короче 30 символов — это
    // служебная запись буфера (ID сообщения и т.п.), а не ответ нейросети.
    // Порог небольшой, чтобы короткий легитимный ответ вроде «кандидатов
    // не найдено» не убивал прогон.
    if (!text || (!looksLikeAnswer(text) && text.trim().length < 30)) {
      await sendLog(job, t('log.tasUnreadable'));
      await abort(job, 'Empty Grok answer');
      return;
    }
    if (foundPrompt && !text) {
      await sendLog(job, t('log.tasOnlyPrompt'));
      await abort(job, 'Answer not found');
      return;
    }

    // Делим на части {…} (без внешних скобок) — каждая часть = один пост
    let parts = splitBraces(text)
      .map((p) => p.replace(/^\s*\{\s*/, '').replace(/\s*\}\s*$/, '').trim())
      .filter((p) => p.length > 8);
    if (!parts.length && text.trim()) {
      parts = [text.trim()];
      await sendLog(job, t('log.tasNoBlocks'));
    }

    // RAW-режим: из каждого {…}-блока берём только первую ссылку x.com,
    // все ссылки уходят в канал одним сообщением. Если блоков нет — берём
    // все ссылки из текста целиком.
    if (job.rawResults) {
      const links = [];
      const seen = new Set();
      const add = (l) => { if (!seen.has(l)) { seen.add(l); links.push(l); } };
      if (splitBraces(text).length > 0) {
        for (const b of parts) {
          const m = b.match(/https:\/\/(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+/);
          if (m) add(m[0]);
        }
      } else {
        for (const m of String(text).matchAll(/https:\/\/(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+/g)) add(m[0]);
      }
      if (!links.length) {
        await sendLog(job, t('log.tasRawEmpty'));
        await abort(job, 'No links in Grok answer');
        return;
      }
      parts = [links.join('\n')];
      await sendLog(job, t('log.tasRaw', { n: links.length }));
    }

    const next = await patchJob({
      phase: 'tas-send',
      tasParts: parts,
      tasSendIndex: 0,
      progress: { stage: 'send', collected: 0, total: parts.length },
      status: t('st.tasSending', { n: parts.length.toLocaleString('en-US') }),
      // Бюджет на отправку растёт с числом постов (~3 c на пост + запас 10 мин)
      timeoutMs: Math.min(MAX_TIMEOUT_MS, (Date.now() - job.startedAt) + parts.length * 3000 + 10 * 60 * 1000)
    });
    if (!next) return;
    await runTasSend(next);
  }

  // TAS-этап отправки: посты в канал по очереди, с задержкой ~1 сек.
  async function runTasSend(job) {
    const parts = job.tasParts || [];
    if (!parts.length) { await tasFinish(job); return; }
    let idx = job.tasSendIndex || 0;
    while (idx < parts.length) {
      const { job: cur } = await get('job');
      if (!cur || !cur.active) return;
      job = cur;
      if (Date.now() - job.startedAt > (job.timeoutMs || TAS_TIMEOUT_MS)) {
        await sendLog(job, t('log.tasSendTimeout'));
        await abort(job, 'Timeout while sending');
        return;
      }

      const msgs = chunkToTelegram(parts[idx]);
      for (let j = 0; j < msgs.length; j++) {
        const r = await sendMessageRetry(job, msgs[j]);
        if (!r.ok) {
          await sendLog(job, t('log.tasPostFail', { i: idx + 1, n: parts.length, err: r.error }));
          await abort(job, 'Channel send failed: ' + r.error);
          return;
        }
        if (j < msgs.length - 1) await sleep(humanPause(1000, 1900));
      }

      idx++;
      const next = await patchJob({
        tasSendIndex: idx,
        progress: { stage: 'send', collected: idx, total: parts.length },
        status: t('st.tasSent', { i: idx.toLocaleString('en-US'), n: parts.length.toLocaleString('en-US') })
      });
      if (!next) return;
      job = next;
      if (idx < parts.length) await sleep(humanPause(1000, 1900)); // ~1 сек между постами
    }
    await tasFinish(job);
  }

  // TAS-финал: итоговый лог → закрыть вкладку.
  async function tasFinish(job) {
    const linksCount = (job.tasLinks || []).length;
    const parts = job.tasParts || [];
    const rawLinks = (job.rawResults && parts.length)
      ? ' (' + parts[0].split('\n').filter((l) => l.trim()).length.toLocaleString('en-US') + ' ' + t('sum.linksWord') + ')'
      : '';
    const summary = [
      t('sum.tasComplete'),
      t('sum.profile', { h: job.handle }),
      t('sum.links', { n: linksCount.toLocaleString('en-US') }),
      t('sum.posts', { n: parts.length.toLocaleString('en-US') + rawLinks }),
      t('sum.time', { d: fmtDuration(Math.round((Date.now() - job.startedAt) / 1000)) })
    ].join('\n');
    await sendLog(job, summary);
    await sendRandomSticker(job); // 🎲 через 1 сек после последнего поста — случайный стикер в канал
    await set({
      job: null,
      lastRun: {
        status: 'done',
        kind: 'tas',
        handle: job.handle,
        linksCount,
        postsCount: parts.length,
        durationMs: Date.now() - job.startedAt,
        finishedAt: Date.now()
      }
    });
    closeJobTab();
  }

  // Финал: единый HTML-отчёт → Telegram → закрыть вкладку.
  async function finishReport(job) {
    const following = job.users || [];
    const followers = job.users2 || [];
    const results = job.results || {};
    const uniqueCount = new Set([...following, ...followers].map((u) => (u.handle || '').toLowerCase())).size;
    const checkedCount = Object.keys(results).length;

    await patchJob({ status: t('st.reportBuild'), phase: 'report' });
    const html = buildHtmlReport({
      handle: job.handle,
      following,
      followers,
      results,
      version: VERSION,
      lang: LANG
    });

    await patchJob({ status: t('st.reportUpload') });
    let res = await sendDocumentRetry(job, html, `scrxper_${job.handle}_report.html`,
      `📊 ScrXper report @${job.handle} · ${uniqueCount.toLocaleString('en-US')} verified · follower counts`);
    if (!res.ok) {
      // запасной вариант: список частями в сообщениях (без дублей)
      const seenH = new Set();
      const deduped = [...following, ...followers].filter((u) => {
        const k = (u.handle || '').toLowerCase();
        if (!k || seenH.has(k)) return false;
        seenH.add(k);
        return true;
      });
      res = await sendChunkedMessages(job, deduped, t('log.verifiedChunk'));
    }
    if (!res.ok) {
      // Ничего не доставилось — помечаем прогон ошибкой, а не успехом
      await sendMessage(job, t('log.reportFail', { h: job.handle, err: res.error }));
      await set({
        job: null,
        lastRun: { status: 'error', error: 'Could not deliver the report: ' + res.error, finishedAt: Date.now() }
      });
      closeJobTab();
      return;
    }

    const summary = [
      t('sum.complete'),
      t('sum.profile', { h: job.handle }),
      t('sum.following', { n: following.length.toLocaleString('en-US') }),
      t('sum.followers', { n: followers.length.toLocaleString('en-US') }),
      t('sum.unique', { n: uniqueCount.toLocaleString('en-US') }),
      t('sum.checked', { n: checkedCount.toLocaleString('en-US') }),
      t('sum.time', { d: fmtDuration(Math.round((Date.now() - job.startedAt) / 1000)) })
    ].join('\n');
    await sendMessage(job, summary);

    await set({
      job: null,
      lastRun: {
        status: 'done',
        handle: job.handle,
        followingCount: following.length,
        followersCount: followers.length,
        profilesChecked: checkedCount,
        durationMs: Date.now() - job.startedAt,
        finishedAt: Date.now()
      }
    });
    closeJobTab();
  }

  async function sendChunkedMessages(job, users, label) {
    const handles = users.map((u) => '@' + u.handle);
    if (handles.length === 0) return sendMessage(job, t('log.listEmpty', { label, h: job.handle }));
    // Лимит Telegram — 4096 символов: режем по символам, а не по количеству.
    const MAX_CHARS = 3500;
    const chunks = [];
    let cur = '';
    for (const h of handles) {
      if (cur && cur.length + h.length + 1 > MAX_CHARS) {
        chunks.push(cur);
        cur = h;
      } else {
        cur = cur ? cur + '\n' + h : h;
      }
    }
    if (cur) chunks.push(cur);
    const parts = chunks.length;
    for (let i = 0; i < chunks.length; i++) {
      const header = `${label} @${job.handle} — ${t('w.part')} ${i + 1}/${parts}\n\n`;
      const r = await sendMessage(job, header + chunks[i]);
      if (!r.ok) return r;
    }
    return { ok: true };
  }

  async function abort(job, errorText) {
    await set({
      job: null,
      lastRun: { status: 'error', error: errorText, finishedAt: Date.now() }
    });
    closeJobTab();
  }

  function closeJobTab() {
    try { chrome.runtime.sendMessage({ type: 'CLOSE_JOB_TAB' }); } catch (e) { /* ignore */ }
    try { window.close(); } catch (e) { /* ignore */ }
  }

  /* ================= панель ================= */

  function injectPanel(state) {
    const uid = 'sx' + Math.random().toString(36).slice(2, 9);

    const logo = `<svg class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="8.2"/>
      <circle cx="12" cy="12" r="4.6"/>
      <path d="M12 12 L19 5"/>
      <circle cx="12" cy="12" r="1.5" fill="#1d9bf0" stroke="none"/>
    </svg>`;

    const css = `
      :host { all: initial; }
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .wrap { width: 300px; background: #14171c; border: 1px solid #2f3336; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,.45); overflow: hidden; animation: pop .18s ease; position: relative; }
      @keyframes pop { from { transform: scale(.93); opacity: 0; } to { transform: none; opacity: 1; } }
      .hd { display: flex; align-items: center; gap: 10px; padding: 11px 12px; background: #171a20; border-bottom: 1px solid #2f3336; cursor: grab; user-select: none; }
      .hd:active { cursor: grabbing; }
      .logo { width: 32px; height: 32px; flex: 0 0 auto; }
      .logo-svg { width: 100%; height: 100%; display: block; }
      .titles { flex: 1; min-width: 0; }
      .t { font-size: 15px; font-weight: 800; letter-spacing: .3px; color: #e7e9ea; }
      .s { font-size: 10.5px; color: #8b98a5; margin-top: 1px; }
      .icobtn { border: none; background: #1d2228; color: #8b98a5; width: 24px; height: 24px; border-radius: 7px; font-size: 14px; line-height: 1; cursor: pointer; transition: .15s; }
      .icobtn:hover { background: #2a3038; color: #e7e9ea; }
      .body { padding: 12px 13px 10px; position: relative; }
      label { display: block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .7px; color: #8b98a5; margin: 11px 0 4px; }
      label:first-child { margin-top: 0; }
      .inp { width: 100%; background: #0c0f13; border: 1px solid #2f3336; border-radius: 8px; padding: 8px 10px; color: #e7e9ea; font-size: 13px; outline: none; transition: border .15s, box-shadow .15s; }
      .inp:focus { border-color: #1d9bf0; }
      .inp::placeholder { color: #566370; }
      .hint { font-size: 10.5px; color: #6b7683; margin-top: 5px; line-height: 1.45; }
      .hint b { color: #1d9bf0; }
      .chk { display: flex; align-items: center; gap: 7px; font-size: 11.5px; text-transform: none; letter-spacing: 0; color: #b7c0ca; margin: 11px 0 0; cursor: pointer; font-weight: 600; }
      .chk input { width: 15px; height: 15px; accent-color: #1d9bf0; cursor: pointer; flex: 0 0 auto; }
      .upd { display: flex; align-items: center; gap: 6px; padding: 7px 12px; background: #171a20; border-bottom: 1px solid #2f3336; font-size: 11px; color: #c9d1d9; }
      .upd b { color: #1d9bf0; }
      .upd .sp { flex: 1; min-width: 0; }
      .tabs { display: flex; border-bottom: 1px solid #2f3336; background: #13171d; }
      .tab { flex: 1; border: none; background: none; color: #8b98a5; font-size: 12.5px; font-weight: 700; padding: 9px 8px 8px; cursor: pointer; border-bottom: 2px solid transparent; transition: color .15s, border-color .15s, background .15s; }
      .tab:hover { color: #e7e9ea; background: #1a1e24; }
      .tab.active { color: #fff; border-bottom-color: #1d9bf0; background: #1a1e24; }
      .tas-note { font-size: 11px; line-height: 1.5; color: #b7c0ca; background: #171a20; border: 1px solid #2f3336; border-radius: 8px; padding: 8px 10px; margin-bottom: 2px; }
      .tas-note b { color: #1d9bf0; }
      .btnrow { display: flex; gap: 7px; margin-top: 13px; }
      .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 9px; padding: 9px 13px; font-size: 13px; font-weight: 600; cursor: pointer; color: #fff; transition: filter .15s, transform .05s, background .15s; }
      .btn:active { transform: scale(.97); }
      .btn-primary { flex: 1; background: #1d9bf0; }
      .btn-primary:hover { filter: brightness(1.1); }
      .btn-ghost { background: #1d2228; border: 1px solid #2f3336; color: #e7e9ea; }
      .btn-ghost:hover { background: #262c33; }
      .btn-danger { background: #d33; }
      .btn-danger:hover { filter: brightness(1.12); }
      .progress-area { margin-top: 12px; background: #101419; border: 1px solid #2f3336; border-radius: 10px; padding: 10px 11px; }
      .pline { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: #c9d1d9; }
      .pline.small { font-size: 11px; color: #8b98a5; margin-top: 6px; }
      .stage { font-weight: 700; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex: 0 0 auto; }
      .bar { height: 6px; background: #1d2228; border-radius: 99px; overflow: hidden; margin-top: 9px; }
      .barfill { height: 100%; width: 42%; border-radius: 99px; background: #1d9bf0; }
      .toast { position: absolute; left: 10px; right: 10px; bottom: 8px; background: #10151b; border: 1px solid #33393f; border-radius: 10px; padding: 9px 11px; font-size: 11.5px; line-height: 1.45; color: #e7e9ea; opacity: 0; transform: translateY(8px); pointer-events: none; transition: opacity .25s, transform .25s; box-shadow: 0 4px 14px rgba(0,0,0,.4); z-index: 5; }
      .toast.show { opacity: 1; transform: none; }
      .ft { padding: 7px 13px 8px; font-size: 10px; color: #566370; border-top: 1px solid #23282e; background: rgba(0,0,0,.2); }
      .fab { position: fixed; right: 16px; bottom: 16px; width: 46px; height: 46px; border-radius: 50%; border: 1px solid #2f3336; background: #14171c; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.4); transition: transform .12s; padding: 9px; }
      .fab:hover { transform: scale(1.07); }
    `;

    const html = `
      <div class="wrap" id="${uid}wrap">
        <div class="hd" id="${uid}hd">
          <div class="logo">${logo}</div>
          <div class="titles">
            <div class="t">ScrXper</div>
            <div class="s" data-i18n="p.subtitle"></div>
          </div>
          <button class="icobtn" id="${uid}lang" title="" type="button">EN</button>
          <button class="icobtn" id="${uid}collapse" title="" type="button">−</button>
        </div>
        <div class="upd" id="${uid}upd" style="display:none">
          <span class="sp" id="${uid}updtxt"></span>
          <button class="icobtn" id="${uid}upddl" title="" type="button">⬇</button>
          <button class="icobtn" id="${uid}updx" title="" type="button">×</button>
        </div>
        <div class="tabs">
          <button class="tab active" id="${uid}tabp" type="button" data-i18n="p.tabParser"></button>
          <button class="tab" id="${uid}tabt" type="button" data-i18n="p.tabTas"></button>
        </div>
        <div class="body" id="${uid}bp">
          <label for="${uid}p" data-i18n="p.profile"></label>
          <input id="${uid}p" class="inp" data-i18n-ph="p.phProfile" autocomplete="off" spellcheck="false"/>

          <label for="${uid}t" data-i18n="p.token"></label>
          <input id="${uid}t" class="inp" type="password" data-i18n-ph="p.phToken" autocomplete="off" spellcheck="false"/>

          <label for="${uid}c" data-i18n="p.yourId"></label>
          <input id="${uid}c" class="inp" type="text" data-i18n-ph="p.phId" autocomplete="off" spellcheck="false"/>
          <div class="hint" data-i18n-html="p.hintId"></div>

          <label for="${uid}y" data-i18n="p.year"></label>
          <input id="${uid}y" class="inp" data-i18n-ph="p.phYear" autocomplete="off" spellcheck="false"/>
          <div class="hint" data-i18n-html="p.hintYear"></div>

          <label for="${uid}f" data-i18n="p.followers"></label>
          <input id="${uid}f" class="inp" data-i18n-ph="p.phFollowers" autocomplete="off" spellcheck="false"/>
          <div class="hint" data-i18n-html="p.hintFollowers"></div>

          <label class="chk"><input type="checkbox" id="${uid}a" checked/> <span data-i18n="p.excludeAff"></span></label>

          <div class="btnrow">
            <button class="btn btn-primary" id="${uid}start" type="button" data-i18n="p.start"></button>
            <button class="btn btn-ghost" id="${uid}test" type="button" title="">🧪</button>
            <button class="btn btn-danger" id="${uid}stop" type="button" style="display:none" data-i18n="p.stop"></button>
          </div>
        </div>
        <div class="body" id="${uid}bt" style="display:none">
          <div class="tas-note" data-i18n-html="p.tasNote"></div>
          <label for="${uid}p2" data-i18n="p.profile"></label>
          <input id="${uid}p2" class="inp" data-i18n-ph="p.phProfile" autocomplete="off" spellcheck="false"/>

          <label for="${uid}ch" data-i18n="p.channel"></label>
          <input id="${uid}ch" class="inp" data-i18n-ph="p.phChannel" autocomplete="off" spellcheck="false"/>
          <div class="hint" data-i18n-html="p.hintChannel"></div>

          <label for="${uid}y2" data-i18n="p.year"></label>
          <input id="${uid}y2" class="inp" data-i18n-ph="p.phYear" autocomplete="off" spellcheck="false"/>
          <div class="hint" data-i18n-html="p.hintYear"></div>

          <label for="${uid}f2" data-i18n="p.followers"></label>
          <input id="${uid}f2" class="inp" data-i18n-ph="p.phFollowers" autocomplete="off" spellcheck="false"/>
          <div class="hint" data-i18n-html="p.hintFollowers"></div>

          <label class="chk"><input type="checkbox" id="${uid}a2" checked/> <span data-i18n="p.excludeAff"></span></label>
          <label class="chk"><input type="checkbox" id="${uid}r2"/> <span data-i18n="p.raw"></span></label>

          <label for="${uid}t2" data-i18n="p.token"></label>
          <input id="${uid}t2" class="inp" type="password" data-i18n-ph="p.phToken" autocomplete="off" spellcheck="false"/>

          <label for="${uid}o" data-i18n="p.yourId2"></label>
          <input id="${uid}o" class="inp" type="text" data-i18n-ph="p.phId" autocomplete="off" spellcheck="false"/>
          <div class="hint" data-i18n-html="p.hintLogs"></div>

          <div class="btnrow">
            <button class="btn btn-primary" id="${uid}tstart" type="button" data-i18n="p.startTas"></button>
            <button class="btn btn-danger" id="${uid}stop2" type="button" style="display:none" data-i18n="p.stop"></button>
          </div>
        </div>
        <div class="progress-area" id="${uid}prog" style="display:none">
          <div class="pline"><span class="stage" id="${uid}stage" data-i18n="ph.working">Working…</span><span class="dot"></span></div>
          <div class="bar"><div class="barfill"></div></div>
          <div class="pline small"><span id="${uid}status" data-i18n="st.starting">Starting…</span><span id="${uid}meta"></span></div>
        </div>
        <div class="toast" id="${uid}toast"></div>
        <div class="ft" data-i18n="p.ft" data-i18n-args='{"v":"${VERSION}"}'></div>
      </div>
      <button class="fab" id="${uid}fab" title="ScrXper" style="display:none">${logo}</button>
    `;

    const hostEl = document.createElement('div');
    hostEl.id = 'xq-host'; // нейтральный id: название расширения в DOM не светим
    hostEl.style.cssText = 'all:initial; position:fixed; right:16px; bottom:16px; z-index:2147483647;';
    const shadow = hostEl.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${css}</style>${html}`;
    // Сохранённую позицию применяем ДО вставки в DOM — панель не «прыгает»
    // при перезагрузке страницы, а сразу стоит там, где её оставили.
    if (state && typeof state.left === 'number' && typeof state.top === 'number') {
      hostEl.style.left = Math.max(4, Math.min(window.innerWidth - 330, state.left)) + 'px';
      hostEl.style.top = Math.max(4, Math.min(window.innerHeight - 80, state.top)) + 'px';
      hostEl.style.right = 'auto';
      hostEl.style.bottom = 'auto';
    }
    (document.body || document.documentElement).appendChild(hostEl);

    const $id = (i) => shadow.getElementById(i);
    const wrap = $id(uid + 'wrap');
    const fab = $id(uid + 'fab');
    const hd = $id(uid + 'hd');
    const tabP = $id(uid + 'tabp');
    const tabT = $id(uid + 'tabt');
    const bpEl = $id(uid + 'bp');
    const btEl = $id(uid + 'bt');
    const pInput = $id(uid + 'p');
    const tInput = $id(uid + 't');
    const cInput = $id(uid + 'c');
    const startBtn = $id(uid + 'start');
    const testBtn = $id(uid + 'test');
    const stopBtn = $id(uid + 'stop');
    const p2Input = $id(uid + 'p2');
    const chInput = $id(uid + 'ch');
    const t2Input = $id(uid + 't2');
    const oInput = $id(uid + 'o');
    const yInput = $id(uid + 'y');
    const fInput = $id(uid + 'f');
    const aCheck = $id(uid + 'a');
    const y2Input = $id(uid + 'y2');
    const f2Input = $id(uid + 'f2');
    const a2Check = $id(uid + 'a2');
    const r2Check = $id(uid + 'r2');
    const updEl = $id(uid + 'upd');
    const updTxt = $id(uid + 'updtxt');
    const tstartBtn = $id(uid + 'tstart');
    const stop2Btn = $id(uid + 'stop2');
    const prog = $id(uid + 'prog');
    const stageEl = $id(uid + 'stage');
    const statusEl = $id(uid + 'status');
    const metaEl = $id(uid + 'meta');
    const toastEl = $id(uid + 'toast');

    /* --- i18n: применяем словарь к DOM и переключаем язык --- */
    const i18nApply = () => {
      shadow.querySelectorAll('[data-i18n], [data-i18n-ph], [data-i18n-html]').forEach((el) => {
        const htmlKey = el.getAttribute('data-i18n-html');
        const txtKey = el.getAttribute('data-i18n');
        const phKey = el.getAttribute('data-i18n-ph');
        if (!htmlKey && !txtKey && !phKey) return;
        let args = null;
        try { args = JSON.parse(el.getAttribute('data-i18n-args') || 'null'); } catch (e) { /* ignore */ }
        if (htmlKey) el.innerHTML = t(htmlKey, args);
        else if (phKey) el.placeholder = t(phKey);
        else el.textContent = t(txtKey, args);
      });
      const langBtn = $id(uid + 'lang');
      if (langBtn) { langBtn.textContent = (LANG === 'en') ? 'RU' : 'EN'; langBtn.title = t('p.lang'); }
      $id(uid + 'collapse').title = t('p.collapse');
      $id(uid + 'test').title = t('p.test');
      $id(uid + 'upddl').title = t('p.updDl');
      $id(uid + 'updx').title = t('p.updX');
    };
    applyLang = i18nApply;
    $id(uid + 'lang').addEventListener('click', () => setLang(LANG === 'en' ? 'ru' : 'en', true));
    i18nApply(); // применить сразу (язык уже загружен из storage до инъекции)

    /* --- вкладки Parser / TAS --- */
    function switchTab(which) {
      const tas = which === 'tas';
      bpEl.style.display = tas ? 'none' : '';
      btEl.style.display = tas ? '' : 'none';
      tabP.classList.toggle('active', !tas);
      tabT.classList.toggle('active', tas);
    }
    tabP.addEventListener('click', () => switchTab('parser'));
    tabT.addEventListener('click', () => switchTab('tas'));

    /* --- сворачивание (состояние сохраняется) --- */
    let panelPos = null;
    if (state && typeof state.left === 'number' && typeof state.top === 'number') {
      panelPos = { left: state.left, top: state.top };
    }
    let collapsed = !!(state && state.collapsed);
    // Кнопка-кружок появляется в точке панели, а не в углу экрана.
    function placeFab(pos) {
      if (pos) {
        fab.style.left = Math.max(4, Math.min(window.innerWidth - 330, pos.left)) + 'px';
        fab.style.top = Math.max(4, Math.min(window.innerHeight - 80, pos.top)) + 'px';
        fab.style.right = 'auto';
        fab.style.bottom = 'auto';
      } else {
        fab.style.left = 'auto';
        fab.style.top = 'auto';
        fab.style.right = '16px';
        fab.style.bottom = '16px';
      }
    }
    function setCollapsed(c) {
      collapsed = c;
      wrap.style.display = c ? 'none' : '';
      fab.style.display = c ? 'flex' : 'none';
      if (c) placeFab(panelPos);
      set({ sxPanel: { left: panelPos ? panelPos.left : null, top: panelPos ? panelPos.top : null, collapsed: c } }).catch(() => {});
    }
    $id(uid + 'collapse').addEventListener('click', (e) => { e.stopPropagation(); setCollapsed(true); });
    fab.addEventListener('click', () => setCollapsed(false));
    if (collapsed) setCollapsed(true);

    /* --- перетаскивание за шапку (позиция сохраняется) --- */
    let drag = null;
    hd.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      drag = { dx: e.clientX, dy: e.clientY, left: hostEl.offsetLeft, top: hostEl.offsetTop };
      hd.setPointerCapture(e.pointerId);
    });
    hd.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const x = drag.left + (e.clientX - drag.dx);
      const y = drag.top + (e.clientY - drag.dy);
      hostEl.style.left = Math.max(4, Math.min(window.innerWidth - 330, x)) + 'px';
      hostEl.style.top = Math.max(4, Math.min(window.innerHeight - 80, y)) + 'px';
      hostEl.style.right = 'auto';
      hostEl.style.bottom = 'auto';
    });
    hd.addEventListener('pointerup', () => {
      if (!drag) return;
      drag = null;
      panelPos = { left: hostEl.offsetLeft, top: hostEl.offsetTop };
      set({ sxPanel: { left: panelPos.left, top: panelPos.top, collapsed } }).catch(() => {});
    });

    /* --- сохранение настроек --- */
    let saveTimer = null;
    const saveConfig = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        set({ config: { handle: pInput.value, token: tInput.value, chatId: cInput.value, year: yInput.value, followers: fInput.value, noAff: aCheck.checked } }).catch(() => {});
      }, 400);
    };
    [pInput, tInput, cInput, yInput, fInput, aCheck].forEach((el) => el.addEventListener('input', saveConfig));

    let tasSaveTimer = null;
    const saveTasConfig = () => {
      clearTimeout(tasSaveTimer);
      tasSaveTimer = setTimeout(() => {
        set({ tasConfig: { handle: p2Input.value, channel: chInput.value, token: t2Input.value, owner: oInput.value, year: y2Input.value, followers: f2Input.value, noAff: a2Check.checked, raw: r2Check.checked } }).catch(() => {});
      }, 400);
    };
    [p2Input, chInput, t2Input, oInput, y2Input, f2Input, a2Check, r2Check].forEach((el) => el.addEventListener('input', saveTasConfig));

    /* --- тосты --- */
    let toastTimer = null;
    function toast(text, ms = 5200) {
      toastEl.textContent = text;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
    }

    /* --- плашка обновления --- */
    function renderUpdate(u) {
      if (u && u.outdated && u.dismissedVersion !== u.remoteVersion) {
        updTxt.innerHTML = t('p.updNew', { v: escHtml(u.remoteVersion), c: escHtml(u.localVersion) });
        updEl.style.display = 'flex';
      } else {
        updEl.style.display = 'none';
      }
    }
    $id(uid + 'upddl').addEventListener('click', () => {
      try { window.open(UPDATE_ZIP_URL, '_blank'); } catch (e) { /* ignore */ }
    });
    $id(uid + 'updx').addEventListener('click', async () => {
      const { sxUpdate } = await get('sxUpdate');
      await set({ sxUpdate: { ...(sxUpdate || {}), dismissedVersion: (sxUpdate || {}).remoteVersion || '' } }).catch(() => {});
      updEl.style.display = 'none';
    });

    /* --- отрисовка состояния --- */
    let running = false;
    function phaseLabel(p) {
      switch (p) {
        case 'following': return t('ph.following');
        case 'followers': return t('ph.followers');
        case 'enrich':    return t('ph.enrich');
        case 'report':    return t('ph.report');
        case 'tas-following': return t('ph.tasFollowing');
        case 'tas-followers': return t('ph.tasFollowers');
        case 'tas-grok':      return t('ph.tasGrok');
        case 'tas-send':      return t('ph.tasSend');
        default:          return t('ph.working');
      }
    }
    function renderJob(job) {
      running = !!(job && job.active);
      if (running) {
        prog.style.display = 'block';
        stageEl.textContent = phaseLabel(job.phase);
        statusEl.textContent = job.status || t('p.working');
        const pr = job.progress || {};
        metaEl.textContent = pr.total
          ? `${((pr.collected || 0)).toLocaleString('en-US')}/${(pr.total || 0).toLocaleString('en-US')}`
          : (pr.collected ? pr.collected.toLocaleString('en-US') + ' acc.' : '');
        startBtn.style.display = 'none';
        tstartBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        stop2Btn.style.display = 'inline-flex';
      } else {
        prog.style.display = 'none';
        startBtn.style.display = 'inline-flex';
        tstartBtn.style.display = 'inline-flex';
        stopBtn.style.display = 'none';
        stop2Btn.style.display = 'none';
      }
    }

    function handleLastRun(lr, silent) {
      if (!lr) return;
      if (silent) return; // при первичной загрузке панели не спамим тостами
      if (lr.status === 'done' && lr.kind === 'tas') {
        toast(t('toast.tasDone', { h: lr.handle, n: lr.postsCount }));
      } else if (lr.status === 'done') {
        const chk = lr.profilesChecked ? t('sum.checked', { n: lr.profilesChecked }) : '';
        toast(t('toast.done', { h: lr.handle, a: lr.followingCount, b: lr.followersCount, chk: chk ? ', ' + chk : '' }));
      } else if (lr.status === 'stopped') {
        toast(t('toast.stopped'));
      } else if (lr.status === 'error') {
        toast(t('toast.err', { err: localizeErr(lr.error || t('err.unknown')) }));
      }
    }

    /* --- запуск --- */
    async function onStart() {
      const { job: cur } = await get('job');
      if (cur && cur.active) return toast(t('toast.running'));

      const handle = normalizeHandle(pInput.value);
      const token = tInput.value.trim();
      const chatId = cInput.value.trim();
      const yearFilter = yInput.value.trim();
      const followersFilter = fInput.value.trim();

      if (yearFilter && !filterPatternOk(yearFilter, true))
        return toast(t('toast.year'));
      if (followersFilter && !filterPatternOk(followersFilter, false))
        return toast(t('toast.followers'));

      if (!handle) return toast(t('toast.noHandle'));
      if (!/^[A-Za-z0-9_]+$/.test(handle)) return toast(t('toast.badHandle'));
      if (!/^\d+:/.test(token)) return toast(t('toast.badToken'));
      if (!/^-?\d+$/.test(chatId)) return toast(t('toast.badChat'));

      const tabName = 'xw' + Math.random().toString(36).slice(2, 9);
      const job = {
        active: true,
        handle,
        token,
        chatId,
        year: yearFilter,
        followers: followersFilter,
        noAff: aCheck.checked,
        tabName,          // случайное имя вкладки — window.name не палит расширение
        phase: 'following',
        status: t('st.starting'),
        startedAt: Date.now(),
        updatedAt: Date.now(),
        timeoutMs: BASE_TIMEOUT_MS,
        progress: { stage: 'following', collected: 0 }
      };
      await set({ config: { handle, token, chatId, year: yearFilter, followers: followersFilter, noAff: aCheck.checked }, job });

      const s = await sendMessage(job, t('log.started', { h: handle }));
      if (!s.ok) {
        // Telegram недоступен — парсить бессмысленно
        await set({ job: null, lastRun: { status: 'error', error: 'Telegram is unreachable: ' + s.error, finishedAt: Date.now() } });
        renderJob(null);
        return toast(t('toast.tgUnreachable', { err: s.error }));
      }

      renderJob(job);
      const w = window.open(`https://x.com/${handle}/following`, tabName);
      if (!w) {
        // Окно заблокировано — не оставляем «зомби»-задачу
        await set({ job: null, lastRun: { status: 'error', error: 'Browser blocked the window — allow popups for x.com and try again', finishedAt: Date.now() } });
        renderJob(null);
        return toast(t('toast.popupBlocked'));
      }
      try { window.focus(); } catch (e) { /* ignore */ }
    }

    /* --- запуск TAS --- */
    async function onTasStart() {
      const { job: cur } = await get('job');
      if (cur && cur.active) return toast(t('toast.runningTas'));

      const handle = normalizeHandle(p2Input.value);
      const channel = chInput.value.trim();
      const token = t2Input.value.trim();
      const owner = oInput.value.trim();
      const yearFilter = y2Input.value.trim();
      const followersFilter = f2Input.value.trim();

      if (yearFilter && !filterPatternOk(yearFilter, true))
        return toast(t('toast.year'));
      if (followersFilter && !filterPatternOk(followersFilter, false))
        return toast(t('toast.followers'));

      if (!handle) return toast(t('toast.noHandle'));
      if (!/^[A-Za-z0-9_]+$/.test(handle)) return toast(t('toast.badHandle'));
      if (!/^-?\d+$/.test(channel) && !/^@[\w]+$/.test(channel)) return toast(t('toast.badChannel'));
      if (!/^\d+:/.test(token)) return toast(t('toast.badToken'));
      if (owner && !/^-?\d+$/.test(owner)) return toast(t('toast.badOwner'));

      const logChatId = owner || channel;
      const tabName = 'xw' + Math.random().toString(36).slice(2, 9);
      const job = {
        active: true,
        kind: 'tas',
        handle,
        token,
        chatId: channel,   // куда идут посты
        logChatId,         // куда идут логи (владелец или канал)
        year: yearFilter,
        followers: followersFilter,
        noAff: a2Check.checked,
        rawResults: r2Check.checked,
        tabName,
        phase: 'tas-following',
        status: t('st.tasStarting'),
        startedAt: Date.now(),
        updatedAt: Date.now(),
        timeoutMs: TAS_TIMEOUT_MS,
        progress: { stage: 'following', collected: 0 }
      };
      await set({ tasConfig: { handle, channel, token, owner, year: yearFilter, followers: followersFilter, noAff: a2Check.checked, raw: r2Check.checked }, job });

      const s = await sendLog(job, t('log.tasStarted', { h: handle }));
      if (!s.ok) {
        await set({ job: null, lastRun: { status: 'error', error: 'Telegram is unreachable: ' + s.error, finishedAt: Date.now() } });
        renderJob(null);
        return toast(t('toast.tgUnreachable', { err: s.error }));
      }

      renderJob(job);
      const w = window.open(`https://x.com/${handle}/following`, tabName);
      if (!w) {
        await set({ job: null, lastRun: { status: 'error', error: 'Browser blocked the window — allow popups for x.com and try again', finishedAt: Date.now() } });
        renderJob(null);
        return toast(t('toast.popupBlocked'));
      }
      try { window.focus(); } catch (e) { /* ignore */ }
    }

    startBtn.addEventListener('click', onStart);
    [pInput, tInput, cInput, yInput, fInput].forEach((el) =>
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') onStart(); })
    );
    tstartBtn.addEventListener('click', onTasStart);
    [p2Input, chInput, t2Input, oInput, y2Input, f2Input].forEach((el) =>
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') onTasStart(); })
    );

    /* --- стоп --- */
    async function onStop() {
      await set({ job: null, lastRun: { status: 'stopped', finishedAt: Date.now() } });
      renderJob(null);
      toast(t('toast.stoppedShort'));
    }
    stopBtn.addEventListener('click', onStop);
    stop2Btn.addEventListener('click', onStop);

    /* --- тест --- */
    testBtn.addEventListener('click', async () => {
      const token = tInput.value.trim();
      const chatId = cInput.value.trim();
      if (!token || !chatId) return toast(t('toast.fillFirst'));
      const s = await tgSend({
        action: 'message',
        token,
        chatId,
        text: t('p.testMsg')
      });
      toast(s.ok ? t('toast.testOk') : t('toast.err', { err: s.error }));
    });

    /* --- live-обновление из storage --- */
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes.job) renderJob(changes.job.newValue);
      if (changes.lastRun) handleLastRun(changes.lastRun.newValue);
      if (changes.sxUpdate) renderUpdate(changes.sxUpdate.newValue);
    });

    /* --- начальное состояние --- */
    get(['config', 'tasConfig', 'job', 'lastRun', 'sxUpdate']).then(({ config, tasConfig, job, lastRun, sxUpdate }) => {
      if (config) {
        pInput.value = config.handle || '';
        tInput.value = config.token || '';
        cInput.value = config.chatId || '';
        yInput.value = config.year || '';
        fInput.value = config.followers || '';
        aCheck.checked = config.noAff !== false;
      }
      if (tasConfig) {
        p2Input.value = tasConfig.handle || '';
        chInput.value = tasConfig.channel || '';
        t2Input.value = tasConfig.token || '';
        oInput.value = tasConfig.owner || '';
        y2Input.value = tasConfig.year || '';
        f2Input.value = tasConfig.followers || '';
        a2Check.checked = tasConfig.noAff !== false;
        r2Check.checked = tasConfig.raw === true;
      }
      renderJob(job || null);
      if (lastRun) handleLastRun(lastRun, true);
      renderUpdate(sxUpdate || null);
      // Если данные об обновлении устарели — тихо попросить фон проверить.
      if (!sxUpdate || Date.now() - (sxUpdate.lastChecked || 0) > UPDATE_CHECK_INTERVAL_MS) {
        try {
          chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' }, (u) => { if (u) renderUpdate(u); });
        } catch (e) { /* ignore */ }
      }
    }).catch(() => {});

    /* --- сторож: если вкладка парсинга умерла, задача висит → сбрасываем --- */
    // Порог 5 минут: загрузка большого отчёта в Telegram может идти без обновлений
    // статуса дольше трёх минут, и сторож не должен сбрасывать живую задачу.
    setInterval(async () => {
      if (!running) return;
      try {
        const { job } = await get('job');
        if (job && job.active && Date.now() - (job.updatedAt || 0) > 300000) {
          await set({
            job: null,
            lastRun: { status: 'error', error: 'Parsing tab is not responding — task reset', finishedAt: Date.now() }
          });
          renderJob(null);
          toast(t('toast.hung'));
        }
      } catch (e) { /* ignore */ }
    }, 20000);
  }

  /* ================= инициализация ================= */

  (async () => {
    // Вкладка-скрейпер определяется по совпадению window.name со случайным
    // именем из активной задачи (окна открываются через window.open(url, name)).
    const { job, sxPanel } = await get(['job', 'sxPanel']);
    if (job && job.active && window.name && window.name === job.tabName) {
      await maybeRunJob(); // вкладка-скрейпер: панель не нужна
      return;
    }
    injectPanel(sxPanel || null); // сохранённая позиция/свёрнутость панели
  })();
})();

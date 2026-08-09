// ScrXper — background service worker.
// Talks to the Telegram Bot API (the content script cannot call
// api.telegram.org due to CORS) and closes the parsing tab.
//
// The parsing tab id is kept in chrome.storage.session so it survives
// service worker restarts (MV3 may suspend the SW after ~30s of idle).

'use strict';

let jobTabIdCache = null; // cache; source of truth is storage.session

// --- Авто-обновление -------------------------------------------------------
// Тихо (раз в час + при старте браузера/установке) сверяем версию из репозитория
// с установленной. Результат — в chrome.storage.local ('sxUpdate'); плашку и
// кнопку скачивания показывают панель на x.com и popup. Один запрос в час к
// GitHub raw — CDN, никаких банов; сбой сети просто тихо игнорируется.
const UPDATE_URL = 'https://raw.githubusercontent.com/Tool-xx/scrxper/refs/heads/main/manifest.json';
const UPDATE_ZIP_URL = 'https://github.com/Tool-xx/scrxper/archive/refs/heads/main.zip';
const UPDATE_CHECK_MS = 60 * 60 * 1000; // 1 час

async function checkForUpdate() {
  const local = chrome.runtime.getManifest().version;
  try {
    const res = await fetch(UPDATE_URL, { cache: 'no-store' });
    if (!res.ok) return; // тихо: сеть недоступна / файла ещё нет
    const json = await res.json();
    const remote = String((json && json.version) || '').trim();
    if (!remote) return;
    const prev = (await chrome.storage.local.get('sxUpdate')).sxUpdate || {};
    await chrome.storage.local.set({
      sxUpdate: {
        lastChecked: Date.now(),
        localVersion: local,
        remoteVersion: remote,
        outdated: remote !== local,
        // Пользователь мог скрыть плашку — не показываем её снова для той же версии.
        dismissedVersion: prev.dismissedVersion || ''
      }
    });
  } catch (e) { /* тихо */ }
}

function scheduleUpdateCheck() {
  try { chrome.alarms.create('sx-update', { periodInMinutes: 60 }); } catch (e) { /* ignore */ }
}

chrome.runtime.onInstalled.addListener(() => { checkForUpdate(); scheduleUpdateCheck(); });
chrome.runtime.onStartup.addListener(() => { checkForUpdate(); scheduleUpdateCheck(); });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'sx-update') checkForUpdate(); });

async function readJobTabId() {
  if (jobTabIdCache != null) return jobTabIdCache;
  try {
    const s = await chrome.storage.session.get('jobTabId');
    jobTabIdCache = s.jobTabId || null;
  } catch (e) {
    jobTabIdCache = null;
  }
  return jobTabIdCache;
}

async function writeJobTabId(id) {
  jobTabIdCache = id;
  try {
    await chrome.storage.session.set({ jobTabId: id == null ? null : id });
  } catch (e) {
    // storage.session unavailable — fall back to the in-memory cache only
  }
}

async function tgFetch(msg) {
  const base = `https://api.telegram.org/bot${msg.token}`;

  if (msg.action === 'message') {
    const res = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: msg.chatId,
        text: msg.text,
        disable_web_page_preview: true
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API error');
    return { ok: true };
  }

  if (msg.action === 'document') {
    const mime = msg.filename && msg.filename.toLowerCase().endsWith('.html') ? 'text/html' : 'text/csv';
    const fd = new FormData();
    fd.append('chat_id', msg.chatId);
    fd.append('document', new Blob([msg.content], { type: mime }), msg.filename);
    if (msg.caption) fd.append('caption', msg.caption);
    const res = await fetch(`${base}/sendDocument`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API error');
    return { ok: true };
  }

  if (msg.action === 'sticker') {
    // getStickerSet → случайный стикер из пака → sendSticker в канал
    let fileId = '';
    let packErr = '';
    try {
      const setRes = await fetch(`${base}/getStickerSet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: msg.pack })
      });
      const setData = await setRes.json();
      if (setData.ok && setData.result && Array.isArray(setData.result.stickers) && setData.result.stickers.length) {
        const st = setData.result.stickers[Math.floor(Math.random() * setData.result.stickers.length)];
        fileId = st.file_id;
      } else {
        packErr = setData.description || 'empty sticker pack';
      }
    } catch (e) { packErr = String((e && e.message) || e); }
    if (!fileId) throw new Error('Sticker pack unavailable (' + msg.pack + '): ' + (packErr || 'unknown error'));
    const res = await fetch(`${base}/sendSticker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: msg.chatId, sticker: fileId })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API error');
    return { ok: true };
  }

  return { ok: false, error: 'Unknown action' };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg && msg.type) {
    case 'TG_SEND':
      tgFetch(msg)
        .then((r) => sendResponse(r))
        .catch((e) => sendResponse({ ok: false, error: String((e && e.message) || e) }));
      return true; // async response

    case 'REGISTER_JOB_TAB':
      writeJobTabId(sender.tab ? sender.tab.id : null).then(() => sendResponse({ ok: true }));
      return true;

    case 'CLOSE_JOB_TAB':
      closeJobTab().then(() => sendResponse({ ok: true }));
      return true;

    case 'CHECK_UPDATE':
      (async () => {
        const { sxUpdate } = await chrome.storage.local.get('sxUpdate');
        // Данные устарели или их нет — проверить сейчас.
        if (!sxUpdate || Date.now() - (sxUpdate.lastChecked || 0) > UPDATE_CHECK_MS) {
          await checkForUpdate();
        }
        const fresh = await chrome.storage.local.get('sxUpdate');
        sendResponse(fresh.sxUpdate || null);
      })();
      return true;


    default:
      return false;
  }
});

async function closeJobTab() {
  const id = await readJobTabId();
  if (id == null) return;
  await writeJobTabId(null);
  try {
    await chrome.tabs.remove(id);
  } catch (e) {
    // tab already closed
  }
}

// The user closed the parsing tab manually → notify Telegram
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const current = await readJobTabId();
  if (tabId !== current) return;
  await writeJobTabId(null);

  const { job } = await chrome.storage.local.get('job');
  if (!job || !job.active) return;

  await chrome.storage.local.set({
    job: null,
    lastRun: { status: 'stopped', error: 'Tab closed manually', finishedAt: Date.now() }
  });
  tgFetch({
    action: 'message',
    token: job.token,
    chatId: job.chatId,
    text: `⚠️ ScrXper: parsing @${job.handle} was interrupted — the parsing tab was closed manually.`
  }).catch(() => {});
});

// The panel's Stop button cleared the job → close the parsing tab
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.job) return;
  const prev = changes.job.oldValue;
  const next = changes.job.newValue;
  if (prev && prev.active && (!next || !next.active)) closeJobTab();
});

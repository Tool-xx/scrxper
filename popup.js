// ScrXper — popup: job status + "Open X" / "Stop" buttons. Bilingual (ru/en).
// Язык хранится в chrome.storage.local('lang') — общий с панелью на x.com.

'use strict';

const I18N = {
  ru: {
    desc: 'X / Twitter скрейпер → Telegram · Парсер + TAS (Grok)',
    loading: 'Загрузка…',
    newVersion: '⬆ Доступна новая версия {v} (у вас {c}). Перезагрузите расширение или скачайте файлы:',
    dl: '⬇ Скачать',
    open: 'Открыть X',
    stop: '⏹ Остановить парсинг',
    running: '⏳ Парсинг @{h} — {ph}{pr}',
    tasDone: '✅ TAS @{h}: {n} постов отправлено в канал',
    done: '✅ Последний запуск @{h}: подписки {a}, подписчики {b}{chk}',
    checked: ', проверено {n}',
    ready: 'Готово. Откройте x.com и настройте парсер.',
    stopped: '⏹ Остановлено',
    phFollowing: 'сбор подписок',
    phFollowers: 'сбор подписчиков',
    phEnrich: 'сбор числа подписчиков',
    phReport: 'отправка отчёта',
    phTasFollowing: 'TAS: сбор подписок',
    phTasFollowers: 'TAS: сбор подписчиков',
    phTasGrok: 'TAS: Grok работает',
    phTasSend: 'TAS: отправка в канал',
    phWorking: 'работа',
    langBtn: 'EN',
    langTitle: 'Сменить язык'
  },
  en: {
    desc: 'X / Twitter scraper → Telegram · Parser + TAS (Grok)',
    loading: 'Loading…',
    newVersion: '⬆ New version {v} available (you have {c}). Reload the extension or download the files:',
    dl: '⬇ Download',
    open: 'Open X',
    stop: '⏹ Stop parsing',
    running: '⏳ Parsing @{h} — {ph}{pr}',
    tasDone: '✅ TAS @{h}: {n} posts sent to the channel',
    done: '✅ Last run @{h}: following {a}, followers {b}{chk}',
    checked: ', checked {n}',
    ready: 'Ready. Open x.com and set up the parser.',
    stopped: '⏹ Stopped',
    phFollowing: 'collecting following',
    phFollowers: 'collecting followers',
    phEnrich: 'collecting follower counts',
    phReport: 'sending report',
    phTasFollowing: 'TAS: collecting following',
    phTasFollowers: 'TAS: collecting followers',
    phTasGrok: 'TAS: Grok is working',
    phTasSend: 'TAS: sending to channel',
    phWorking: 'working',
    langBtn: 'RU',
    langTitle: 'Switch language'
  }
};

const statusEl = document.getElementById('status');
const openBtn = document.getElementById('open');
const stopBtn = document.getElementById('stop');
const updEl = document.getElementById('upd');
const updTxt = document.getElementById('updtxt');
const updBtn = document.getElementById('updbtn');
const descEl = document.getElementById('desc');
const langBtn = document.getElementById('lang');

let LANG = 'ru';

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) || (I18N.en && I18N.en[key]) || key;
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

function applyLang() {
  descEl.textContent = t('desc');
  openBtn.textContent = t('open');
  stopBtn.textContent = t('stop');
  langBtn.textContent = t('langBtn');
  langBtn.title = t('langTitle');
  renderUpdate(currentUpdate);
  refresh();
}

langBtn.addEventListener('click', () => {
  LANG = LANG === 'en' ? 'ru' : 'en';
  chrome.storage.local.set({ lang: LANG });
  applyLang();
});

let currentUpdate = null;
function renderUpdate(u) {
  currentUpdate = u;
  if (u && u.outdated) {
    updTxt.textContent = t('newVersion', { v: u.remoteVersion, c: u.localVersion });
    updBtn.textContent = t('dl');
    updEl.hidden = false;
  } else {
    updEl.hidden = true;
  }
}

function maybeCheckUpdate() {
  chrome.storage.local.get('sxUpdate', ({ sxUpdate }) => {
    if (!sxUpdate || Date.now() - (sxUpdate.lastChecked || 0) > 60 * 60 * 1000) {
      chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' });
    }
  });
}

function refresh() {
  chrome.storage.local.get(['job', 'lastRun', 'sxUpdate'], ({ job, lastRun, sxUpdate }) => {
    renderUpdate(sxUpdate || null);
    if (job && job.active) {
      const pr = job.progress || {};
      const phaseTxt = {
        following: t('phFollowing'),
        followers: t('phFollowers'),
        enrich: t('phEnrich'),
        report: t('phReport'),
        'tas-following': t('phTasFollowing'),
        'tas-followers': t('phTasFollowers'),
        'tas-grok': t('phTasGrok'),
        'tas-send': t('phTasSend')
      };
      const ptxt = phaseTxt[job.phase] || t('phWorking');
      const prog = pr.total
        ? ` ${((pr.collected || 0)).toLocaleString('en-US')}/${(pr.total || 0).toLocaleString('en-US')}`
        : ` ${((pr.collected || 0)).toLocaleString('en-US')}`;
      statusEl.textContent = t('running', { h: job.handle, ph: ptxt, pr: prog });
      stopBtn.hidden = false;
    } else if (lastRun && lastRun.status === 'done' && lastRun.kind === 'tas') {
      statusEl.textContent = t('tasDone', { h: lastRun.handle, n: lastRun.postsCount });
      stopBtn.hidden = true;
    } else if (lastRun && lastRun.status === 'done') {
      const checked = lastRun.profilesChecked ? t('checked', { n: lastRun.profilesChecked }) : '';
      statusEl.textContent = t('done', {
        h: lastRun.handle,
        a: lastRun.followingCount,
        b: lastRun.followersCount,
        chk: checked
      });
      stopBtn.hidden = true;
    } else if (lastRun && lastRun.error) {
      statusEl.textContent = `❌ ${lastRun.error}`;
      stopBtn.hidden = true;
    } else {
      statusEl.textContent = t('ready');
      stopBtn.hidden = true;
    }
  });
}

openBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://x.com' });
  window.close();
});

updBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://github.com/Tool-xx/scrxper/archive/refs/heads/main.zip' });
});

stopBtn.addEventListener('click', () => {
  chrome.storage.local.set({ job: null, lastRun: { status: 'stopped', finishedAt: Date.now() } }, () => {
    statusEl.textContent = t('stopped');
    stopBtn.hidden = true;
    setTimeout(() => window.close(), 600);
  });
});

// Язык из storage (общий с панелью на x.com), затем инициализация.
chrome.storage.local.get('lang', ({ lang }) => {
  LANG = lang === 'en' ? 'en' : 'ru';
  applyLang();
  chrome.storage.onChanged.addListener((c) => {
    if (c.sxUpdate) renderUpdate(c.sxUpdate.newValue);
    if (c.lang) { LANG = c.lang.newValue === 'en' ? 'en' : 'ru'; applyLang(); }
    refresh();
  });
  refresh();
  maybeCheckUpdate();
});

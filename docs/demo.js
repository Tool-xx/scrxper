'use strict';
/* ============================================================
   SCRXPER — видео-инструкция (движок + сцены).
   Режимы:  обычный — плеер с контролами;
            ?loop    — зацикленная анимация без контролов (для сайта);
            ?lang=ru|en — язык (сайт передаёт свой язык в iframe).
   Сцена: build(stage) → список шагов [мс, fn].
   ============================================================ */
const isLoop = /[?&]loop/.test(location.search);
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isLoop) document.body.classList.add('mode-loop');

/* ---------- язык (ru/en) ---------- */
const QLANG = /[?&]lang=(ru|en)/.exec(location.search);
let LANG = QLANG ? QLANG[1] : 'ru';
try {
  const st = localStorage.getItem('sx_site_lang');
  if (!QLANG && (st === 'ru' || st === 'en')) LANG = st;
} catch (e) { /* ignore */ }
const TR = {
  playPause: { ru: 'Пауза (пробел)', en: 'Pause (space)' },
  play: { ru: 'Воспроизвести (пробел)', en: 'Play (space)' },
  /* 1 · Знакомство */
  s1Sub: { ru: 'видео-инструкция · x / twitter парсер', en: 'video guide · x / twitter parser' },
  s1f1: { ru: '<b>✓</b> только верифицированные аккаунты', en: '<b>✓</b> verified accounts only' },
  s1f2: { ru: '<b>✓</b> HTML-отчёт прямо в Telegram', en: '<b>✓</b> HTML report straight to Telegram' },
  s1f3: { ru: '<b>✓</b> TAS: OSINT-профили через Grok', en: '<b>✓</b> TAS: OSINT profiles via Grok' },
  /* 2 · Установка */
  s2n1: { ru: '1. Откройте <span class="k">chrome://extensions</span> (или edge://extensions)', en: '1. Open <span class="k">chrome://extensions</span> (or edge://extensions)' },
  s2n2: { ru: '2. Включите <b>режим разработчика</b>', en: '2. Enable <b>Developer mode</b>' },
  s2n3: { ru: '3. <b>Загрузить распакованное</b> → выберите папку проекта (в ней <span class="k">manifest.json</span>)', en: '3. <b>Load unpacked</b> → pick the project folder (it contains <span class="k">manifest.json</span>)' },
  s2n4: { ru: '4. Готово — расширение в списке и ждёт вас на x.com', en: '4. Done — the extension is in the list and waiting on x.com' },
  /* 3 · Telegram */
  s3msg1: { ru: '<span class="em">👋</span> создаю бота!', en: '<span class="em">👋</span> creating a bot!' },
  s3msg2: { ru: 'Отлично! Ваш токен для доступа к API:<br><span class="tok">123456789:AAH…xYz</span>', en: 'Great! Your API access token:<br><span class="tok">123456789:AAH…xYz</span>' },
  s3msg3: { ru: 'Запишите токен — его вставим в панель ScrXper.', en: 'Save the token — we will paste it into the ScrXper panel.' },
  s3msg4: { ru: 'Привет! Ваш Telegram ID: <b style="color:#fff">5123456789</b>', en: 'Hi! Your Telegram ID: <b style="color:#fff">5123456789</b>' },
  s3n1: { ru: 'Эти два числа — <b>токен бота</b> и <b>ваш ID</b> — вставляются в панель ScrXper.', en: 'These two values — the <b>bot token</b> and <b>your ID</b> — go into the ScrXper panel.' },
  s3n2: { ru: 'Важно: <b>напишите своему боту /start</b> — иначе Telegram не разрешит ему писать вам первым.', en: 'Important: <b>message your bot /start</b> — otherwise Telegram will not let it write to you first.' },
  s3n3: { ru: 'Всё готово к запуску парсинга! →', en: 'Everything is ready to start parsing! →' },
  /* 4 · Парсинг */
  s4follow: { ru: 'Подписаться', en: 'Follow' },
  s4tabF: { ru: 'Подписки', en: 'Following' },
  s4tabR: { ru: 'Подписчики', en: 'Followers' },
  s4post1: { ru: 'думаю о новых примитивах в Ethereum…', en: 'thinking about new Ethereum primitives…' },
  s4post2: { ru: 'Bitcoin — это свобода. Пост дня.', en: 'Bitcoin is freedom. Post of the day.' },
  s4post3: { ru: 'разбор новой сети уровня 2…', en: 'a breakdown of the new layer-2 network…' },
  s4excl: { ru: 'Exclude affiliated (бизнес / орг.)', en: 'Exclude affiliated (business / org.)' },
  s4busy: { ru: '⏳ идёт сбор…', en: '⏳ collecting…' },
  s4st1: { ru: 'открываю фоновую вкладку…', en: 'opening a background tab…' },
  s4st2: { ru: 'сбор подписок через API x.com…', en: 'collecting following via the x.com API…' },
  s4cnt1: { ru: 'подписки: ', en: 'following: ' },
  s4st3: { ru: 'сбор подписчиков…', en: 'collecting followers…' },
  s4cnt2: { ru: 'подписчики: ', en: 'followers: ' },
  s4st4: { ru: 'собираю HTML-отчёт…', en: 'building the HTML report…' },
  s4st5: { ru: 'отправка в Telegram…', en: 'sending to Telegram…' },
  s4msg3: { ru: '✅ Готово: <b style="color:var(--green)">46</b> верифицированных · фильтры 2020+, 1000- · 2 мин 14 с', en: '✅ Done: <b style="color:var(--green)">46</b> verified · filters 2020+, 1000- · 2 min 14 s' },
  s4note: { ru: 'Один общий HTML-отчёт: тёмная тема, таблицы <b>Подписки / Подписчики</b>, живой фильтр и кнопка копирования.', en: 'One combined HTML report: dark theme, <b>Following / Followers</b> tables, live filter and a copy button.' },
  /* 5 · Фильтры */
  s5t1: { ru: '📅 Год создания аккаунта <span class="ex">// пример: 2020+</span>', en: '📅 Account created (year) <span class="ex">// example: 2020+</span>' },
  s5t2: { ru: '👥 Подписчики (у самого аккаунта) <span class="ex">// пример: 1000-</span>', en: '👥 Followers (of the account) <span class="ex">// example: 1000-</span>' },
  s5t3: { ru: '🏢 Exclude affiliated <span class="ex">// включено</span>', en: '🏢 Exclude affiliated <span class="ex">// enabled</span>' },
  s5exclSub: { ru: 'Бизнес / организации — отбрасываются сразу при сборе', en: 'Business / organizations — dropped right at collection' },
  s5c1: { ru: '2020+ = 2020 и позже', en: '2020+ = 2020 or later' },
  s5c2: { ru: '2020- = 2020 и раньше', en: '2020- = 2020 or earlier' },
  s5c3: { ru: '2019-2021 = диапазон', en: '2019-2021 = range' },
  s5c4: { ru: '2020 = ровно', en: '2020 = exact' },
  s5c5: { ru: '1000+ = ≥ 1000', en: '1000+ = ≥ 1000' },
  s5c6: { ru: '1000- = ≤ 1000', en: '1000- = ≤ 1000' },
  s5c7: { ru: '500-1000 = диапазон', en: '500-1000 = range' },
  s5c8: { ru: '500 = ровно', en: '500 = exact' },
  s5note: { ru: 'Пустое поле = любой год / любое число. Фильтры работают в обоих режимах — <b>Parser</b> и <b>TAS</b>.', en: 'Empty field = any year / any count. Filters work in both modes — <b>Parser</b> and <b>TAS</b>.' },
  /* 6 · TAS */
  s6sub: { ru: 'Профиль → сбор ссылок → OSINT-промт в Grok → посты в канал', en: 'Profile → collect links → OSINT prompt to Grok → posts to channel' },
  s6raw: { ru: 'Raw results — только ссылки, одним сообщением', en: 'Raw results — links only, as one post' },
  s6busy: { ru: '⏳ собираю ссылки…', en: '⏳ collecting links…' },
  s6st1: { ru: 'сбор верифицированных ссылок…', en: 'collecting verified links…' },
  s6st2: { ru: 'ссылок собрано: 65 · открываю Grok…', en: '65 links collected · opening Grok…' },
  s6prompt: { ru: 'Вы — OSINT-исследователь. Проанализируйте список аккаунтов, отберите сильнейших кандидатов и составьте профили…', en: 'You are an OSINT researcher. Analyze the account list, pick the strongest candidates and build profiles…' },
  s6think: { ru: 'Grok думает… обычно 3–5 минут на большой список', en: 'Grok is thinking… usually 3–5 min for a large list' },
  s6ch: { ru: 'Мой канал', en: 'My channel' },
  s6m1: { ru: '📄 <b style="color:#fff">1/3</b> — @tristan0x: профиль, оценка 92/100', en: '📄 <b style="color:#fff">1/3</b> — @tristan0x: profile, score 92/100' },
  s6m2: { ru: '📄 <b style="color:#fff">2/3</b> — @0xfoobar: профиль, оценка 88/100', en: '📄 <b style="color:#fff">2/3</b> — @0xfoobar: profile, score 88/100' },
  s6m3: { ru: '📄 <b style="color:#fff">3/3</b> — @edgarpavlovsky: профиль, оценка 85/100', en: '📄 <b style="color:#fff">3/3</b> — @edgarpavlovsky: profile, score 85/100' },
  s6m4: { ru: '😈 <span style="font-size:11px;color:var(--dim)">случайный стикер CrazyEvilBro</span>', en: '😈 <span style="font-size:11px;color:var(--dim)">random CrazyEvilBro sticker</span>' },
  s6note: { ru: 'Каждый блок <b>{…}</b> — отдельный пост · через 1 сек после последнего — <b>случайный стикер</b>. При <b>Raw results</b> уходят только ссылки, одним сообщением.', en: 'Each <b>{…}</b> block is a separate post · 1 s after the last one — a <b>random sticker</b>. With <b>Raw results</b>, only links go out in one message.' },
  /* 7 · Итоги */
  s7bt1: { ru: 'Новая версия доступна', en: 'New version available' },
  s7bt2: { ru: 'v1.9.5 в репозитории · у вас v1.9.4 · проверка раз в час, незаметно', en: 'v1.9.5 in the repo · you have v1.9.4 · checks hourly, silently' },
  s7dl: { ru: '⬇ Скачать', en: '⬇ Download' },
  s7thanks: { ru: 'Спасибо за просмотр! 🚀', en: 'Thanks for watching! 🚀' },
  s7fl: { ru: 'Панель закрепляется там, куда её перетащили. Парсинг тихий и человекоподобный —<br>только свои аккаунты, только в рамках правил.', en: 'The panel stays where you drag it. Parsing is silent and human-like —<br>only your own accounts, within the rules.' },
  s7site: { ru: '⌂ сайт и скачивание', en: '⌂ site & download' },
  s7instr: { ru: 'полная инструкция', en: 'full instructions' },
  s7n1: { ru: 'Расширение само тихо проверяет обновления раз в час и показывает плашку с кнопкой скачивания.', en: 'The extension quietly checks for updates every hour and shows a banner with a download button.' },
  s7n2: { ru: 'Используйте только на своих аккаунтах. Удачного скрапинга! 🎯', en: 'Use only on your own accounts. Happy scraping! 🎯' }
};
function L(k) {
  const e = TR[k] || {};
  return e[LANG] || e.en || k;
}

const stage = document.getElementById('stage');
const fill = document.getElementById('fill');
const marks = document.getElementById('marks');
const timeEl = document.getElementById('time');
const sceneNum = document.getElementById('sceneNum');
const sceneName = document.getElementById('sceneName');
const btnPlay = document.getElementById('btnPlay');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const barwrap = document.getElementById('barwrap');

let S = null;
let playing = true;
let timer = null;

const $ = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

/* ---------- движок ---------- */
function totalDur(){ return SCENES.reduce((a, s) => a + s.duration, 0); }
function sceneStart(i){ let t = 0; for (let k = 0; k < i; k++) t += SCENES[k].duration; return t; }

function resetScene(idx){
  stage.classList.remove('paused');
  stage.innerHTML = '';
  const sc = SCENES[idx];
  S = { idx, t: 0, next: 0, steps: sc.build(stage) };
  if (sceneNum){ sceneNum.textContent = (idx + 1) + '/' + SCENES.length; sceneName.textContent = sc.title[LANG] || sc.title; }
  drawMarks(); drawBar();
}

function drawBar(){
  if (!fill || !timeEl) return;
  const t = sceneStart(S.idx) + S.t;
  fill.style.width = (t / totalDur() * 100) + '%';
  const mm = Math.floor(t / 60000), ss = Math.floor((t % 60000) / 1000);
  const tot = Math.floor(totalDur() / 60000) + ':' + String(Math.floor((totalDur() % 60000) / 1000)).padStart(2, '0');
  timeEl.textContent = mm + ':' + String(ss).padStart(2, '0') + ' / ' + tot;
  marks.querySelectorAll('.mark').forEach((m, i) => {
    m.classList.toggle('cur', i === S.idx);
    m.classList.toggle('done', i < S.idx);
  });
}

function drawMarks(){
  if (!marks) return;
  marks.innerHTML = '';
  SCENES.forEach((s, i) => {
    const m = $('div', 'mark');
    m.style.left = ((sceneStart(i) + s.duration / 2) / totalDur() * 100) + '%';
    m.title = (i + 1) + '. ' + (s.title[LANG] || s.title);
    m.addEventListener('click', (e) => { e.stopPropagation(); jumpTo(sceneStart(i)); });
    marks.appendChild(m);
  });
}

function tick(){
  timer = null;
  if (!S) return;
  S.t += 100;
  while (S.next < S.steps.length && S.steps[S.next][0] <= S.t){
    const fn = S.steps[S.next][1];
    S.next++;
    try { fn(); } catch (e) { console.error('step error', e); }
  }
  drawBar();
  if (S.t >= SCENES[S.idx].duration){
    if (S.idx + 1 < SCENES.length){ jumpTo(sceneStart(S.idx + 1)); return; }
    jumpTo(0);
    if (!isLoop) setPlaying(false);   // в плеере: конец ролика → пауза в начале
    return;
  }
  if (playing) timer = setTimeout(tick, 100);
}

function setPlaying(p){
  playing = p;
  if (btnPlay){ btnPlay.innerHTML = p ? '⏸' : '▶'; btnPlay.title = p ? L('playPause') : L('play'); }
  stage.classList.toggle('paused', !p);
  if (p && !timer) timer = setTimeout(tick, 100);
}

function jumpTo(globalT){
  clearTimeout(timer); timer = null;
  let idx = 0;
  while (idx + 1 < SCENES.length && sceneStart(idx + 1) <= globalT) idx++;
  const local = Math.min(globalT - sceneStart(idx), SCENES[idx].duration);
  resetScene(idx);
  while (S.next < S.steps.length && S.steps[S.next][0] <= local){
    try { S.steps[S.next][1](); } catch (e) { console.error(e); }
    S.next++;
  }
  S.t = local;
  drawBar();
  if (playing) timer = setTimeout(tick, 100);
}

if (btnPlay) btnPlay.addEventListener('click', () => setPlaying(!playing));
if (btnPrev) btnPrev.addEventListener('click', () => jumpTo(Math.max(0, sceneStart(S.idx) - 1)));
if (btnNext) btnNext.addEventListener('click', () => jumpTo(Math.min(totalDur(), sceneStart(S.idx) + SCENES[S.idx].duration + 1)));
if (barwrap) barwrap.addEventListener('click', (e) => {
  const r = barwrap.getBoundingClientRect();
  jumpTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * totalDur());
});
document.addEventListener('keydown', (e) => {
  if (!btnPlay) return; // клавиатура только в режиме плеера
  if (e.code === 'Space'){ e.preventDefault(); setPlaying(!playing); }
  else if (e.key === 'ArrowRight') btnNext.click();
  else if (e.key === 'ArrowLeft') btnPrev.click();
});

/* Пауза в фоновой вкладке — не жжём CPU, когда видео не видно. */
let wasPlaying = true;
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ wasPlaying = playing; setPlaying(false); }
  else if (wasPlaying){ setPlaying(true); }
});

/* ---------- хелперы сцен ---------- */
const later = (ms, fn) => [ms, fn];
function noteEl(stage){
  const n = $('div', 'note');
  stage.appendChild(n);
  return (html) => { n.innerHTML = html; n.classList.add('show'); };
}
function typer(el, text, speed, start, done){
  const steps = [];
  for (let i = 1; i <= text.length; i++){
    steps.push(later(start + i * speed, () => { el.textContent = text.slice(0, i); }));
  }
  steps.push(later(start + text.length * speed + 140, () => { if (done) done(); }));
  return steps;
}
function counter(el, to, dur, start, prefix){
  const steps = [], n = 22;
  for (let i = 1; i <= n; i++){
    steps.push(later(start + (i / n) * dur, () => { el.textContent = prefix + Math.round(to * i / n); }));
  }
  return steps;
}
function pop(sel){ const e = document.querySelector(sel); if (e) e.classList.add('pop'); }
function show(sel){ const e = document.querySelector(sel); if (e) e.classList.add('show'); }
function anim(sel, cls){ const e = document.querySelector(sel); if (e) e.classList.add(cls); }
function msg(parent, cls, html){
  const b = $('div', 'msg ' + cls, html);
  parent.appendChild(b);
  requestAnimationFrame(() => b.classList.add('show'));
}

/* ============================================================
   СЦЕНЫ
   ============================================================ */
const SCENES = [

/* ---------- 1 · Знакомство ---------- */
{
  id: 'intro', title: { ru: 'Знакомство', en: 'Intro' }, duration: 6500,
  build(stage){
    stage.innerHTML = '<div class="biglogo"><div id="lg"></div><div class="sub" id="sub">' + L('s1Sub') + '</div><div class="feats" id="feats"></div></div>';
    const lg = stage.querySelector('#lg');
    'SCRXPER'.split('').forEach((ch, i) => {
      const s = $('span', 'll', ch);
      s.style.animationDelay = (i * 90) + 'ms';
      lg.appendChild(s);
    });
    const featsEl = stage.querySelector('#feats');
    const feats = [L('s1f1'), L('s1f2'), L('s1f3')];
    const steps = [];
    steps.push(later(2200, () => stage.querySelector('#sub').classList.add('show')));
    feats.forEach((f, i) => {
      steps.push(later(3600 + i * 700, () => {
        const el = $('div', 'featline', f);
        featsEl.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
      }));
    });
    return steps;
  }
},

/* ---------- 2 · Установка ---------- */
{
  id: 'install', title: { ru: 'Установка', en: 'Install' }, duration: 13000,
  build(stage){
    stage.innerHTML =
      '<div class="win" id="w">' +
        '<div class="winbar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>' +
          '<span class="addr" id="addr">chrome://extensions</span><span class="wt">Chrome</span></div>' +
        '<div class="ext-body">' +
          '<h3>Расширения</h3>' +
          '<div class="switchrow"><div class="switch" id="sw"></div> Режим разработчика</div>' +
          '<button class="loadbtn" id="lb">Загрузить распакованное расширение…</button>' +
          '<div class="ext-card" id="card">' +
            '<div class="ic">📡</div>' +
            '<div><div class="nm">ScrXper</div><div class="vs">v1.9.4 · X / Twitter parser</div></div>' +
            '<div class="ok">✓ Загружено</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    const n = noteEl(stage);
    const steps = [];
    steps.push(later(300, () => pop('#w')));
    steps.push(later(1400, () => anim('#addr', 'hl')));
    steps.push(later(2600, () => anim('#sw', 'on')));
    steps.push(later(3600, () => stage.querySelector('#lb').classList.add('pulse')));
    steps.push(later(4800, () => show('#card')));
    const notes = [L('s2n1'), L('s2n2'), L('s2n3'), L('s2n4')];
    notes.forEach((t, i) => steps.push(later(6000 + i * 1600, () => n(t))));
    return steps;
  }
},

/* ---------- 3 · Telegram ---------- */
{
  id: 'telegram', title: { ru: 'Telegram-бот', en: 'Telegram bot' }, duration: 11000,
  build(stage){
    stage.innerHTML =
      '<div class="tgrow">' +
        '<div class="chat" id="c1">' +
          '<div class="chathead"><div class="av" style="background:#2b3b8f">🤖</div><div><div class="cn">BotFather</div><div class="cs">официальный бот Telegram</div></div></div>' +
          '<div class="msgs" id="m1"></div>' +
          '<div class="composer"><div class="cfield" id="comp1"></div><div class="cbtn" id="send1">➤</div></div>' +
        '</div>' +
        '<div class="chat" id="c2">' +
          '<div class="chathead"><div class="av" style="background:#14532d">🆔</div><div><div class="cn">userinfobot</div><div class="cs">определяет ваш Telegram ID</div></div></div>' +
          '<div class="msgs" id="m2"></div>' +
        '</div>' +
      '</div>';
    const n = noteEl(stage);
    const steps = [];
    const m1 = stage.querySelector('#m1'), comp1 = stage.querySelector('#comp1');
    const send1 = stage.querySelector('#send1'), m2 = stage.querySelector('#m2');
    steps.push(later(400, () => { pop('#c1'); pop('#c2'); }));
    steps.push(...typer(comp1, '/newbot', 90, 1400));
    steps.push(later(2400, () => send1.classList.add('on')));
    steps.push(later(2700, () => msg(m1, 'me', L('s3msg1'))));
    steps.push(later(3300, () => msg(m1, 'them', L('s3msg2'))));
    steps.push(later(4200, () => msg(m1, 'them', L('s3msg3'))));
    steps.push(later(5300, () => msg(m2, 'me', '/start')));
    steps.push(later(6000, () => msg(m2, 'them', L('s3msg4'))));
    steps.push(later(6800, () => n(L('s3n1'))));
    steps.push(later(8300, () => n(L('s3n2'))));
    steps.push(later(10200, () => n(L('s3n3'))));
    return steps;
  }
},

/* ---------- 4 · Парсинг ---------- */
{
  id: 'parser', title: { ru: 'Парсинг', en: 'Parsing' }, duration: 17000,
  build(stage){
    stage.innerHTML =
      '<div class="parrow">' +
        '<div class="xwin" id="xw">' +
          '<div class="sidebar">' +
            '<div class="xb on">✕</div><div class="xb">🏠</div><div class="xb">🔍</div><div class="xb">🔔</div><div class="xb">✉️</div>' +
          '</div>' +
          '<div class="xmain">' +
            '<div class="prof">' +
              '<div class="avatar">🧑‍🚀</div>' +
              '<div><div class="pname">Elon Musk <span class="vb">✔</span></div><div class="phandle">@elonmusk</div></div>' +
              '<div class="follow">' + L('s4follow') + '</div>' +
            '</div>' +
            '<div class="ptabs"><span class="pt on">' + L('s4tabF') + '</span><span class="pt">' + L('s4tabR') + '</span></div>' +
            '<div class="feed">' +
              '<div class="post" id="p1"><b style="color:#e7e9ee">@vitalikbuterin</b> <span style="color:var(--teal-br)">✔</span><br>' + L('s4post1') + '</div>' +
              '<div class="post" id="p2"><b style="color:#e7e9ee">@saylor</b> <span style="color:var(--teal-br)">✔</span><br>' + L('s4post2') + '</div>' +
              '<div class="post" id="p3"><b style="color:#e7e9ee">@crypto_analyst</b> <span style="color:var(--teal-br)">✔</span><br>' + L('s4post3') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="panel" id="panel">' +
            '<div class="pt"><div class="plogo">S</div><div><div class="pt1">ScrXper</div><div class="pt2">X / Twitter parser</div></div></div>' +
            '<div class="tabs"><span class="ptab on">📊 Parser</span><span class="ptab">🤖 TAS</span></div>' +
            '<div class="pfield"><div class="pl">Profile link</div><span class="pinput" id="f1"></span></div>' +
            '<div class="pfield"><div class="pl">Telegram bot token</div><span class="pinput" id="f2"></span></div>' +
            '<div class="pfield"><div class="pl">Your Telegram ID</div><span class="pinput" id="f3"></span></div>' +
            '<div class="pfield"><div class="pl">Account created (year)</div><span class="pinput" id="f4"></span></div>' +
            '<div class="pfield"><div class="pl">Followers filter</div><span class="pinput" id="f5"></span></div>' +
            '<div class="chkrow" id="chkrow"><div class="box" id="boxA">✓</div> ' + L('s4excl') + '</div>' +
            '<button class="pbtn" id="startBtn">🚀 Start</button>' +
            '<div class="prog" id="prog">' +
              '<div class="pline"><span id="stageTxt">Working…</span></div>' +
              '<div class="bar"><div class="barfill" id="barfill"></div></div>' +
              '<div class="pline"><span id="cnt1"></span><span id="cnt2"></span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tgchat" id="tg">' +
          '<div class="chathead"><div class="av" style="background:#2b6e6f">✈</div><div><div class="cn">ScrXper</div><div class="cs">бот · Telegram</div></div></div>' +
          '<div class="msgs" id="tgmsgs"></div>' +
        '</div>' +
      '</div>';
    const n = noteEl(stage);
    const steps = [];
    const tgmsgs = stage.querySelector('#tgmsgs');
    const f1 = stage.querySelector('#f1'), f2 = stage.querySelector('#f2');
    const f3 = stage.querySelector('#f3'), f4 = stage.querySelector('#f4'), f5 = stage.querySelector('#f5');
    const startBtn = stage.querySelector('#startBtn');
    const stageTxt = stage.querySelector('#stageTxt');
    const barfill = stage.querySelector('#barfill');
    const cnt1 = stage.querySelector('#cnt1'), cnt2 = stage.querySelector('#cnt2');

    steps.push(later(500, () => { pop('#xw'); pop('#tg'); }));
    steps.push(later(1000, () => anim('#panel', 'in')));
    steps.push(later(1500, () => f1.classList.add('hl')));
    steps.push(...typer(f1, 'https://x.com/elonmusk', 32, 1700, () => f1.classList.remove('hl')));
    steps.push(later(3000, () => f2.classList.add('hl')));
    steps.push(...typer(f2, '••••••••••', 45, 3200, () => f2.classList.remove('hl')));
    steps.push(later(3900, () => f3.classList.add('hl')));
    steps.push(...typer(f3, '5123456789', 45, 4100, () => f3.classList.remove('hl')));
    steps.push(later(4700, () => f4.classList.add('hl')));
    steps.push(...typer(f4, '2020+', 60, 4900, () => f4.classList.remove('hl')));
    steps.push(later(5300, () => f5.classList.add('hl')));
    steps.push(...typer(f5, '1000-', 60, 5500, () => f5.classList.remove('hl')));
    steps.push(later(5900, () => { anim('#chkrow', 'hlring'); anim('#boxA', 'on'); }));
    steps.push(later(6400, () => startBtn.classList.add('pulse')));
    steps.push(later(7000, () => {
      startBtn.classList.remove('pulse');
      startBtn.classList.add('busy');
      startBtn.textContent = L('s4busy');
      anim('#prog', 'show');
      stageTxt.textContent = L('s4st1');
    }));
    steps.push(later(7600, () => { stageTxt.textContent = L('s4st2'); barfill.style.width = '30%'; }));
    steps.push(...counter(cnt1, 12, 1300, 8400, L('s4cnt1')));
    steps.push(later(10100, () => { stageTxt.textContent = L('s4st3'); barfill.style.width = '60%'; }));
    steps.push(...counter(cnt2, 34, 1300, 10800, L('s4cnt2')));
    steps.push(later(12400, () => { stageTxt.textContent = L('s4st4'); barfill.style.width = '85%'; }));
    steps.push(later(13300, () => { stageTxt.textContent = L('s4st5'); barfill.style.width = '100%'; }));
    steps.push(later(14100, () => msg(tgmsgs, 'me', '🚀 ScrXper started parsing @elonmusk: verified following + followers.')));
    steps.push(later(15000, () => msg(tgmsgs, 'them', '📊 <b style="color:#fff">scrxper_elonmusk_report.html</b><br><span style="font-size:10px;color:var(--faint)">HTML-документ · 46 КБ</span>')));
    steps.push(later(15900, () => msg(tgmsgs, 'them', L('s4msg3'))));
    steps.push(later(16600, () => n(L('s4note'))));
    return steps;
  }
},

/* ---------- 5 · Фильтры ---------- */
{
  id: 'filters', title: { ru: 'Фильтры', en: 'Filters' }, duration: 9500,
  build(stage){
    stage.innerHTML =
      '<div class="filters fadein">' +
        '<div class="frow" id="fr1">' +
          '<div class="ft">' + L('s5t1') + '</div>' +
          '<span class="pinput" id="fy" style="width:130px"></span>' +
          '<div class="fexamp" id="fx1"></div>' +
        '</div>' +
        '<div class="frow" id="fr2">' +
          '<div class="ft">' + L('s5t2') + '</div>' +
          '<span class="pinput" id="ff" style="width:130px"></span>' +
          '<div class="fexamp" id="fx2"></div>' +
        '</div>' +
        '<div class="frow" id="fr3">' +
          '<div class="ft">' + L('s5t3') + '</div>' +
          '<div class="chkrow" style="margin:4px 0 0"><div class="box" id="boxB">✓</div> ' + L('s5exclSub') + '</div>' +
        '</div>' +
      '</div>';
    const n = noteEl(stage);
    const steps = [];
    const fx1 = stage.querySelector('#fx1'), fx2 = stage.querySelector('#fx2');
    const chips1 = [L('s5c1'), L('s5c2'), L('s5c3'), L('s5c4')];
    const chips2 = [L('s5c5'), L('s5c6'), L('s5c7'), L('s5c8')];
    steps.push(later(700, () => anim('#fr1', 'on')));
    steps.push(...typer(stage.querySelector('#fy'), '2020+', 80, 1200));
    chips1.forEach((c, i) => {
      steps.push(later(2600 + i * 500, () => {
        const el = $('span', 'chip', c);
        fx1.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
      }));
    });
    steps.push(later(4700, () => { stage.querySelector('#fr1').classList.remove('on'); anim('#fr2', 'on'); }));
    steps.push(...typer(stage.querySelector('#ff'), '1000-', 80, 5200));
    chips2.forEach((c, i) => {
      steps.push(later(6600 + i * 420, () => {
        const el = $('span', 'chip', c);
        fx2.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
      }));
    });
    steps.push(later(8400, () => { stage.querySelector('#fr2').classList.remove('on'); anim('#fr3', 'on'); anim('#boxB', 'on'); }));
    steps.push(later(9100, () => n(L('s5note'))));
    return steps;
  }
},

/* ---------- 6 · TAS: Grok → канал ---------- */
{
  id: 'tas', title: { ru: 'TAS · Grok → канал', en: 'TAS · Grok → channel' }, duration: 18000,
  build(stage){
    stage.innerHTML =
      '<div class="tas-stage">' +
        '<div class="tas-panel" id="tp">' +
          '<div class="tp-title">🤖 TAS — TopAutoScraper</div>' +
          '<div class="tp-sub">' + L('s6sub') + '</div>' +
          '<div class="pfield"><div class="pl">Profile link</div><span class="pinput" id="t1"></span></div>' +
          '<div class="pfield"><div class="pl">Telegram channel ID</div><span class="pinput" id="t2"></span></div>' +
          '<div class="pfield"><div class="pl">Telegram bot token</div><span class="pinput" id="t3"></span></div>' +
          '<div class="chkrow" style="margin:8px 0 10px"><div class="box" id="rawbox">✓</div> ' + L('s6raw') + '</div>' +
          '<button class="pbtn" id="tstart">🚀 Start TAS</button>' +
          '<div class="prog" id="tprog">' +
            '<div class="pline"><span id="tstage">Working…</span></div>' +
            '<div class="bar"><div class="barfill" id="tbar"></div></div>' +
          '</div>' +
        '</div>' +
        '<div class="grok-win" id="gw">' +
          '<div class="grok-head"><div class="gdot"></div> Grok</div>' +
          '<div class="grok-inp" id="gprompt"><span class="caret"></span></div>' +
          '<div class="grok-send" id="gsend">➤</div>' +
          '<div class="thinking" id="think"><div class="spinner"></div> ' + L('s6think') + '</div>' +
          '<div class="answer" id="ans">{<br>&nbsp;&nbsp;<span class="blk">https://x.com/tristan0x</span><br>&nbsp;&nbsp;описание: …<br>&nbsp;&nbsp;оценка: 92/100<br>}</div>' +
          '<div class="copybtn" id="cpy">⧉ Copy text</div>' +
        '</div>' +
        '<div class="tgchat" id="tgc" style="position:absolute; left:3%; bottom:14px; width:min(320px,44vw); opacity:0">' +
          '<div class="chathead"><div class="av" style="background:#2b6e6f">✈</div><div><div class="cn">' + L('s6ch') + '</div><div class="cs">#scrxper-results</div></div></div>' +
          '<div class="msgs" id="tcmsgs"></div>' +
        '</div>' +
      '</div>';
    const n = noteEl(stage);
    const steps = [];
    const t1 = stage.querySelector('#t1'), t2 = stage.querySelector('#t2'), t3 = stage.querySelector('#t3');
    const tstart = stage.querySelector('#tstart'), tstage = stage.querySelector('#tstage'), tbar = stage.querySelector('#tbar');
    const tcmsgs = stage.querySelector('#tcmsgs');

    steps.push(later(400, () => pop('#tp')));
    steps.push(later(1100, () => t1.classList.add('hl')));
    steps.push(...typer(t1, 'https://x.com/alexziton', 30, 1300, () => t1.classList.remove('hl')));
    steps.push(later(2500, () => t2.classList.add('hl')));
    steps.push(...typer(t2, '-1003397363199', 45, 2700, () => t2.classList.remove('hl')));
    steps.push(later(3400, () => t3.classList.add('hl')));
    steps.push(...typer(t3, '••••••••••', 45, 3600, () => t3.classList.remove('hl')));
    steps.push(later(4300, () => tstart.classList.add('pulse')));
    steps.push(later(4900, () => {
      tstart.classList.remove('pulse');
      tstart.classList.add('busy');
      tstart.textContent = L('s6busy');
      anim('#tprog', 'show');
      tstage.textContent = L('s6st1');
      tbar.style.width = '50%';
    }));
    steps.push(later(6000, () => { tstage.textContent = L('s6st2'); tbar.style.width = '100%'; }));
    steps.push(later(6900, () => pop('#gw')));
    steps.push(later(7400, () => anim('#gprompt', 'hl')));
    // печатаем промт быстрее, чтобы он успел закончиться до отправки
    steps.push(...typer(stage.querySelector('#gprompt'), L('s6prompt'), 11, 7600));
    steps.push(later(9400, () => anim('#gsend', 'on')));
    steps.push(later(9800, () => stage.querySelector('#think').classList.add('show')));
    steps.push(later(12400, () => {
      stage.querySelector('#think').classList.remove('show');
      anim('#ans', 'show');
      anim('#cpy', 'show');
    }));
    steps.push(later(13400, () => {
      const t = stage.querySelector('#tgc');
      t.style.opacity = 1;
      t.classList.add('pop');
    }));
    steps.push(later(14000, () => msg(tcmsgs, 'them', L('s6m1'))));
    steps.push(later(15200, () => msg(tcmsgs, 'them', L('s6m2'))));
    steps.push(later(16400, () => msg(tcmsgs, 'them', L('s6m3'))));
    steps.push(later(17100, () => msg(tcmsgs, 'them', L('s6m4'))));
    steps.push(later(17800, () => n(L('s6note'))));
    return steps;
  }
},

/* ---------- 7 · Обновления + итоги ---------- */
{
  id: 'outro', title: { ru: 'Обновления и итоги', en: 'Updates & summary' }, duration: 9500,
  build(stage){
    stage.innerHTML =
      '<div class="upd-scene">' +
        '<div class="banner" id="bn">' +
          '<div class="bic">⬆️</div>' +
          '<div><div class="bt1">' + L('s7bt1') + '</div><div class="bt2">' + L('s7bt2') + '</div></div>' +
          '<div class="bdl">' + L('s7dl') + '</div>' +
        '</div>' +
        '<div class="finalcard" id="fc">' +
          '<div class="fh">' + L('s7thanks') + '</div>' +
          '<div class="fl">' + L('s7fl') + '</div>' +
          '<div class="fr">' +
            '<a href="index.html">' + L('s7site') + '</a>' +
            '<a href="https://github.com/Tool-xx/scrxper" target="_blank" rel="noopener">github</a>' +
            '<a href="https://raw.githubusercontent.com/Tool-xx/scrxper/main/INSTRUCTIONS.md" target="_blank" rel="noopener">' + L('s7instr') + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    const n = noteEl(stage);
    const steps = [];
    steps.push(later(500, () => show('#bn')));
    steps.push(later(2300, () => show('#fc')));
    steps.push(later(4700, () => n(L('s7n1'))));
    steps.push(later(6600, () => {
      if (reducedMotion) return; // вестибулярная безопасность
      const colors = ['#5f9ea0', '#8b5cf6', '#ec4899', '#4ade80', '#fbbf24', '#f87171'];
      for (let i = 0; i < 46; i++){
        const c = $('i', 'confetti');
        c.style.left = (3 + Math.random() * 94) + '%';
        c.style.background = colors[i % colors.length];
        c.style.animationDuration = (1.5 + Math.random() * 1.1) + 's';
        c.style.animationDelay = (Math.random() * 0.5) + 's';
        stage.appendChild(c);
      }
    }));
    steps.push(later(8800, () => n(L('s7n2'))));
    return steps;
  }
}

];

/* ---------- старт ---------- */
resetScene(0);
setPlaying(true);

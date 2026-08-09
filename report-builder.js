// ScrXper — combined HTML report builder.
// Used by the extension (loaded before content.js in content_scripts)
// and by Node to generate a demo file (tools/make-demo-report.js).

'use strict';

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Blue verified badge (like X)
const VERIFIED_SVG =
  '<svg class="ver" viewBox="0 0 22 22" aria-label="Verified account"><g><path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/></g></svg>';

function fmtInt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function rowHtml(u, results, index) {
  const name = escHtml(u.name) || '<span class="muted">—</span>';
  const handleLink = escHtml(u.handle);
  const key = (u.handle || '').toLowerCase();
  const res = (results && results[key]) || {};
  const followers = res.followers ? escHtml(res.followers) : '';
  const search = escHtml((u.handle + ' ' + (u.name || '')).toLowerCase());
  const bio = u.bio ? escHtml(u.bio) : '<span class="muted">—</span>';
  const bioTitle = u.bio ? ' title="' + escHtml(u.bio) + '"' : '';
  const ver = u.verified ? VERIFIED_SVG : '';
  const follCell = followers ? '<span class="foll">' + followers + '</span>' : '<span class="muted">—</span>';
  return (
    '<tr data-search="' + search + '" data-handle="' + handleLink + '">' +
    '<td class="num">' + fmtInt(index + 1) + '</td>' +
    '<td class="user"><span class="nm"><a class="name" href="https://x.com/' + handleLink + '" target="_blank" rel="noopener">' + name + '</a>' + ver + '</span><span class="handle">@' + handleLink + '</span></td>' +
    '<td class="foll">' + follCell + '</td>' +
    '<td class="bio"' + bioTitle + '>' + bio + '</td>' +
    '</tr>'
  );
}

function sectionHtml(secId, title, users, results) {
  if (!users.length) {
    return (
      '<div class="table-card"><div class="sec-h"><div class="sec-t">' + title + '</div>' +
      '<div class="sec-c">0 verified</div></div>' +
      '<div class="empty" id="empty_' + secId + '">No verified accounts in this list<div class="sub">Only profiles with the verification badge are collected.</div></div></div>'
    );
  }
  const rows = users.map((u, i) => rowHtml(u, results, i)).join('\n');
  return (
    '<div class="table-card">' +
    '<div class="sec-h"><div class="sec-t">' + title + '</div><div class="sec-c">' + fmtInt(users.length) + ' verified</div></div>' +
    '<div class="table-scroll"><table>' +
    '<thead><tr><th>#</th><th>User</th><th>Followers</th><th>Bio</th></tr></thead>' +
    '<tbody id="rows_' + secId + '">' + rows + '</tbody>' +
    '</table></div></div>'
  );
}

/**
 * opts: {
 *   handle: string,
 *   following: Array<{handle,name,verified,bio}>,
 *   followers: Array<{handle,name,verified,bio}>,
 *   results: { [lowerHandle]: { followers: string } },  // числа подписчиков с профилей
 *   version: string
 * }
 */
function buildHtmlReport(opts) {
  const handle = opts.handle || '';
  const following = opts.following || [];
  const followers = opts.followers || [];
  const results = opts.results || {};
  const version = opts.version || '1.9.2';
  const uniqueCount = new Set([...following, ...followers].map((u) => (u.handle || '').toLowerCase())).size;
  const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const statsHtml =
    '<div class="stat"><div class="v">' + fmtInt(uniqueCount) + '</div><div class="k">verified total</div></div>' +
    '<div class="stat"><div class="v">' + fmtInt(following.length) + '</div><div class="k">following</div></div>' +
    '<div class="stat"><div class="v">' + fmtInt(followers.length) + '</div><div class="k">followers</div></div>';

  const sections =
    sectionHtml('following', 'Following', following, results) + '\n' +
    sectionHtml('followers', 'Followers', followers, results);

  const inlineScript = [
    '(function () {',
    '  var q = document.getElementById("q");',
    '  var tb = [document.getElementById("rows_following"), document.getElementById("rows_followers")];',
    '  var emptyCard = document.getElementById("emptyCard");',
    '  function rows() {',
    '    var r = [];',
    '    for (var i = 0; i < tb.length; i++) {',
    '      if (!tb[i]) continue;',
    '      for (var j = 0; j < tb[i].rows.length; j++) r.push(tb[i].rows[j]);',
    '    }',
    '    return r;',
    '  }',
    '  function apply() {',
    '    var t = (q.value || "").toLowerCase().trim();',
    '    var all = rows();',
    '    var vis = 0;',
    '    for (var i = 0; i < all.length; i++) {',
    '      var hit = !t || all[i].getAttribute("data-search").indexOf(t) !== -1;',
    '      all[i].style.display = hit ? "" : "none";',
    '      if (hit) vis++;',
    '    }',
    '    if (emptyCard) emptyCard.hidden = !(all.length > 0 && vis === 0);',
    '  }',
    '  if (q) q.addEventListener("input", apply);',
    '  var copy = document.getElementById("copy");',
    '  if (copy) copy.addEventListener("click", function () {',
    '    var handles = [];',
    '    var all = rows();',
    '    for (var i = 0; i < all.length; i++) {',
    '      if (all[i].style.display === "none") continue;',
    '      var h = all[i].getAttribute("data-handle");',
    '      if (h) handles.push("@" + h);',
    '    }',
    '    var ta = document.createElement("textarea");',
    '    ta.value = handles.join("\\n");',
    '    document.body.appendChild(ta);',
    '    ta.select();',
    '    try { document.execCommand("copy"); } catch (e) {}',
    '    document.body.removeChild(ta);',
    '    copy.textContent = "✅ Copied";',
    '    setTimeout(function () { copy.textContent = "📋 Copy"; }, 1500);',
    '  });',
    '})();'
  ].join('\n');

  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>ScrXper — @' + handle + ' — report</title>\n' +
    '<style>\n' +
    ':root {\n' +
    '  --bg: #0b0e13; --panel: #12161d; --border: #232a33;\n' +
    '  --text: #e7e9ea; --muted: #8b98a5; --accent: #1d9bf0; --accent2: #7856ff;\n' +
    '}\n' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { min-height: 100vh; color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: radial-gradient(1100px 520px at 50% -120px, #152036 0%, var(--bg) 58%); padding: 34px 16px 56px; }\n' +
    '.wrap { max-width: 880px; margin: 0 auto; }\n' +
    '.card { background: linear-gradient(165deg, #171d27 0%, #10141b 100%); border: 1px solid var(--border); border-radius: 18px; padding: 26px 28px 22px; margin-bottom: 18px; position: relative; overflow: hidden; }\n' +
    '.card::after { content: ""; position: absolute; inset: 0; background: radial-gradient(420px 150px at 88% -30px, rgba(29,155,240,.16), transparent 70%); pointer-events: none; }\n' +
    '.brand { display: flex; align-items: center; gap: 8px; font-size: 12px; letter-spacing: 1.6px; text-transform: uppercase; color: var(--muted); font-weight: 700; }\n' +
    '.brand .logo { font-size: 15px; }\n' +
    '.brand b { background: linear-gradient(90deg, #22d3ee, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }\n' +
    '.badge { position: absolute; top: 22px; right: 24px; font-size: 11.5px; font-weight: 700; padding: 6px 12px; border-radius: 99px; background: linear-gradient(135deg, rgba(29,155,240,.16), rgba(120,86,255,.16)); border: 1px solid rgba(120,86,255,.45); color: #c9d1ff; }\n' +
    'h1 { margin-top: 12px; font-size: 30px; letter-spacing: -.5px; line-height: 1.15; }\n' +
    'h1 .at { color: var(--accent); }\n' +
    '.sub { margin-top: 6px; color: var(--muted); font-size: 13.5px; }\n' +
    '.stats { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }\n' +
    '.stat { background: #0d1117; border: 1px solid var(--border); border-radius: 12px; padding: 10px 16px; min-width: 128px; }\n' +
    '.stat .v { font-size: 21px; font-weight: 800; font-variant-numeric: tabular-nums; }\n' +
    '.stat .k { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .7px; margin-top: 2px; }\n' +
    '.toolbar { display: flex; gap: 10px; margin-top: 18px; position: relative; z-index: 1; }\n' +
    '.search { flex: 1; min-width: 0; background: #0d1117; border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; color: var(--text); font-size: 13.5px; outline: none; transition: border .15s, box-shadow .15s; }\n' +
    '.search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(29,155,240,.2); }\n' +
    '.search::placeholder { color: #566370; }\n' +
    '.copy { background: #1d2228; border: 1px solid var(--border); color: #e7e9ea; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background .15s; }\n' +
    '.copy:hover { background: #262c33; }\n' +
    '.table-card { background: var(--panel); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; margin-bottom: 18px; }\n' +
    '.sec-h { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 18px; border-bottom: 1px solid var(--border); background: #141a23; }\n' +
    '.sec-t { font-size: 14px; font-weight: 800; letter-spacing: .2px; }\n' +
    '.sec-c { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: .8px; background: #0d1117; border: 1px solid var(--border); border-radius: 99px; padding: 4px 10px; }\n' +
    '.table-scroll { overflow-x: auto; }\n' +
    'table { width: 100%; border-collapse: collapse; min-width: 520px; }\n' +
    'thead th { position: sticky; top: 0; z-index: 2; background: #171d26; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: left; padding: 12px 18px; border-bottom: 1px solid var(--border); }\n' +
    'tbody td { padding: 11px 18px; border-bottom: 1px solid #1a212b; font-size: 13.5px; vertical-align: middle; }\n' +
    'tbody tr:last-child td { border-bottom: none; }\n' +
    'tbody tr { transition: background .12s; }\n' +
    'tbody tr:hover { background: rgba(29,155,240,.05); }\n' +
    'td.num { width: 46px; color: var(--muted); font-variant-numeric: tabular-nums; }\n' +
    'td.foll { width: 118px; color: #b7c0ca; font-variant-numeric: tabular-nums; white-space: nowrap; font-weight: 600; }\n' +
    '.user .nm { display: flex; align-items: center; gap: 6px; }\n' +
    '.user .name { color: var(--text); font-weight: 700; text-decoration: none; white-space: nowrap; }\n' +
    '.user .name:hover { color: var(--accent); }\n' +
    '.user .handle { display: block; color: var(--muted); font-size: 12.5px; margin-top: 1px; }\n' +
    'svg.ver { width: 16px; height: 16px; flex: 0 0 auto; }\n' +
    'td.bio { max-width: 460px; color: #b7c0ca; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n' +
    '.muted { color: var(--muted); }\n' +
    '.empty { padding: 44px 20px; text-align: center; color: var(--muted); font-size: 14px; }\n' +
    '.empty .sub { margin-top: 6px; font-size: 12.5px; color: #566370; }\n' +
    'footer { margin-top: 6px; text-align: center; color: #566370; font-size: 12px; line-height: 1.6; }\n' +
    '::selection { background: rgba(29,155,240,.35); }\n' +
    '@media (max-width: 560px) {\n' +
    '  body { padding: 18px 10px 40px; }\n' +
    '  .card { padding: 20px 18px 18px; }\n' +
    '  .badge { position: static; display: inline-block; margin-top: 14px; }\n' +
    '  h1 { font-size: 24px; }\n' +
    '  .stats .stat { min-width: 106px; }\n' +
    '}\n' +
    '</style>\n</head>\n<body>\n' +
    '<div class="wrap">\n' +
    '  <header class="card">\n' +
    '    <div class="brand"><span class="logo">📡</span><b>ScrXper</b> · profile report</div>\n' +
    '    <div class="badge">Verified accounts only</div>\n' +
    '    <h1><span class="at">@</span>' + escHtml(handle) + '</h1>\n' +
    '    <div class="sub">' + fmtInt(following.length) + ' verified following · ' + fmtInt(followers.length) + ' verified followers · <a href="https://x.com/' + escHtml(handle) + '" target="_blank" rel="noopener" style="color:#1d9bf0;text-decoration:none">x.com/' + escHtml(handle) + '</a></div>\n' +
    '    <div class="stats">' + statsHtml + '</div>\n' +
    '    <div class="toolbar">\n' +
    '      <input id="q" class="search" placeholder="Filter by username or name…" autocomplete="off" spellcheck="false">\n' +
    '      <button id="copy" class="copy" title="Copy all usernames (@…)" type="button">📋 Copy</button>\n' +
    '    </div>\n' +
    '  </header>\n' +
    sections + '\n' +
    '  <div class="table-card" id="emptyCard" hidden><div class="empty">No matches<div class="sub">Nothing matches your filter — try another query.</div></div></div>\n' +
    '  <footer>Generated by ScrXper v' + version + ' · ' + generatedAt + '<br>Verified accounts only · follower counts and account age collected on x.com</footer>\n' +
    '</div>\n' +
    '<script>\n' + inlineScript + '\n' +
    '</script>\n' +
    '</body>\n</html>\n';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildHtmlReport, escHtml, VERIFIED_SVG, fmtInt };
}

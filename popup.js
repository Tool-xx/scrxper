// ScrXper — popup: job status + "Open X" / "Stop" buttons.

'use strict';

const statusEl = document.getElementById('status');
const openBtn = document.getElementById('open');
const stopBtn = document.getElementById('stop');

function refresh() {
  chrome.storage.local.get(['job', 'lastRun'], ({ job, lastRun }) => {
    if (job && job.active) {
      const pr = job.progress || {};
      const phaseTxt = {
        following: 'collecting following',
        followers: 'collecting followers',
        enrich: 'collecting follower counts',
        report: 'sending report',
        'tas-following': 'TAS: collecting following',
        'tas-followers': 'TAS: collecting followers',
        'tas-grok': 'TAS: Grok is working',
        'tas-send': 'TAS: sending to channel'
      };
      const ptxt = phaseTxt[job.phase] || 'working';
      const prog = pr.total
        ? ` ${((pr.collected || 0)).toLocaleString('en-US')}/${(pr.total || 0).toLocaleString('en-US')}`
        : ` ${((pr.collected || 0)).toLocaleString('en-US')}`;
      statusEl.textContent = `⏳ Parsing @${job.handle} — ${ptxt}${prog}`;
      stopBtn.hidden = false;
    } else if (lastRun && lastRun.status === 'done' && lastRun.kind === 'tas') {
      statusEl.textContent =
        `✅ TAS @${lastRun.handle}: ${lastRun.postsCount} posts sent to the channel`;
      stopBtn.hidden = true;
    } else if (lastRun && lastRun.status === 'done') {
      const checked = lastRun.profilesChecked ? `, checked ${lastRun.profilesChecked}` : '';
      statusEl.textContent =
        `✅ Last run @${lastRun.handle}: following ${lastRun.followingCount}, followers ${lastRun.followersCount}${checked}`;
      stopBtn.hidden = true;
    } else if (lastRun && lastRun.error) {
      statusEl.textContent = `❌ ${lastRun.error}`;
      stopBtn.hidden = true;
    } else {
      statusEl.textContent = 'Ready. Open x.com and set up the parser.';
      stopBtn.hidden = true;
    }
  });
}

openBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://x.com' });
  window.close();
});

stopBtn.addEventListener('click', () => {
  chrome.storage.local.set({ job: null, lastRun: { status: 'stopped', finishedAt: Date.now() } }, () => {
    statusEl.textContent = '⏹ Stopped';
    stopBtn.hidden = true;
    setTimeout(() => window.close(), 600);
  });
});

chrome.storage.onChanged.addListener(refresh);
refresh();

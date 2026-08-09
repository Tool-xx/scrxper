// Генерирует демо-отчёт (tools/sample-report.html) из реальных данных,
// похожих на те, что собирает расширение. Запуск: node tools/make-demo-report.js

'use strict';

const fs = require('fs');
const path = require('path');
const { buildHtmlReport } = require('../report-builder.js');

const following = [
  { handle: 'Dagnum_PI', name: 'Dagnum²', verified: true, bio: 'Advocate for real-world solutions | Marketing/BD for @stardustco11ect | @Outpost_HGTP' },
  { handle: 'Conste11ation', name: 'Constellation²', verified: true, bio: 'Powering verified data automation for the AI era $DAG' },
  { handle: 'AlkimiExchange', name: 'Alkimi', verified: true, bio: 'Alkimi is the agentic marketplace for advertising. The on-chain ad platform, supercharged by Sui.' },
  { handle: 'Oravetz_Ed', name: 'Ed Oravetz', verified: true, bio: 'Crypto investor & builder. Long-term on Solana ecosystem.' }
];

const followers = [
  { handle: 'Dagnum_PI', name: 'Dagnum²', verified: true, bio: 'Advocate for real-world solutions | Marketing/BD for @stardustco11ect | @Outpost_HGTP' },
  { handle: 'Miguel_Thorpe', name: 'Miguel | Kingdom Living', verified: true, bio: 'Christ Follower → Learning Addict → Church Innovator | On a Mission to bring Heaven down' },
  { handle: 'BrianOBeirne1', name: 'Brian OBeirne', verified: true, bio: '@RealityNetw0rk $NET. all views my own. tweets are not financial or investment advice.' },
  { handle: 'Conste11ation', name: 'Constellation²', verified: true, bio: 'Powering verified data automation for the AI era $DAG' },
  { handle: 'Oravetz_Ed', name: 'Ed Oravetz', verified: true, bio: 'Crypto investor & builder. Long-term on Solana ecosystem.' }
];

// results: ключ — ник в нижнем регистре, значения — число подписчиков с профиля
const results = {
  'dagnum_pi':      { followers: '2.1M' },
  'conste11ation':  { followers: '884K' },
  'alkimiexchange': { followers: '45.2K' },
  'oravetz_ed':     { followers: '12.3K' },
  'miguel_thorpe':  { followers: '3.4K' },
  'brianobeirne1':  { followers: '87.9K' }
};

const html = buildHtmlReport({
  handle: 'example_profile',
  following,
  followers,
  results,
  version: '1.9.2'
});

const out = path.join(__dirname, 'sample-report.html');
fs.writeFileSync(out, html, 'utf8');
console.log('Demo report written to ' + out);

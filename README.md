# 📡 ScrXper — X / Twitter scraper → Telegram

> 🌐 **Website (guide, how it works, download):** <https://tool-xx.github.io/scrxper/>

A browser extension (Chrome / Edge, Manifest V3) that pins a **control panel** right onto the x.com page and, on one click of **Start**, **quietly** collects **verified accounts** from:

- `https://x.com/<profile>/following` — who the profile follows
- `https://x.com/<profile>/followers` — who follows the profile

…then sends you **one beautiful combined HTML report** in Telegram: dark theme, stats, two tables (Following / Followers), name, `@username`, verified badge and bio for every account, live filtering and a “Copy usernames” button — plus a final summary message.

## Features

- 🔒 Pinned, draggable, collapsible panel on x.com
- 🔵 **Verified only** — only accounts with the verification badge are collected
- 🔢 **Follower count** for every account — collected together with the **account-creation year** directly from X's API (the same requests the web app itself makes), no tab-hopping
- 🎯 **Filters** in both Parser and TAS modes: **account-creation year** (`2020+`, `2020-`, `2020-2022`, `2020`), **follower count** (same syntax), and **exclude affiliated (business / org) accounts** — applied right during collection
- ⬆️ **Auto-update check** — the extension quietly compares its version with the repo's `manifest.json` once an hour and shows a “new version available” banner with a download button when an update exists
- 📊 One **combined HTML report** (Following + Followers) instead of two files
- 🤫 Quiet mode: scraping runs in a separate background tab that closes itself
- ✅ Live progress in the panel (stage, counter, animated bar)
- 🔁 Built-in retries: the report is re-sent automatically if Telegram hiccups
- 🕵️ **Human-like behavior** — no bot patterns: scrolling in steps with pauses (not instant jumps), randomized, uneven timing with occasional "reading" pauses, human-like request pacing, no bot-style request headers, no obvious extension markers in the page
- 🛡️ Handles login walls, private profiles, rate limits, renamed profiles, hung tabs, manual tab closes
- 🧪 Test button to verify your bot token / chat id before scraping

## Installation

1. Download / copy this folder (it must contain `manifest.json`).
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the project folder.
5. The **ScrXper** extension appears in your list.

> Requires Chrome / Edge version 111+.

## Telegram setup

1. Create a bot via [@BotFather](https://t.me/BotFather): run `/newbot` → you get a token like `123456789:AAH...`.
2. Find out your Telegram ID: message any bot, e.g. [@userinfobot](https://t.me/userinfobot) — it replies with your numeric ID.
3. **Important:** send your bot at least one message (e.g. `/start`), otherwise it cannot message you first.

## 🤖 TAS mode (TopAutoScraper)

The panel has a second tab, **TAS** — fully automated “profile list → Grok → channel” pipeline:

1. Enter a **profile link** — the extension quietly collects **links of verified accounts** from its following & followers (no bio, no follower counts — just the links).
2. It opens **Grok** (`x.com/i/grok`), pastes a built-in **OSINT prompt** with the collected links appended, and presses send.
3. It waits for the answer (detected by the Like/Copy action row of the new message), presses **Copy text**, and captures the copied text (via a clipboard hook — no extra permissions needed on your side).
4. The answer is split into **`{...}` blocks** (one person per block, braces stripped), and each block is posted to your **Telegram channel** as a separate message with a ~1 s delay. With the **Raw results** toggle on, only the profile link is taken from each block and all links are sent as a **single message**.
5. About **1 second after the last post**, a **random sticker** from `t.me/addstickers/CrazyEvilBro` is sent to the channel.

The built-in OSINT prompt (**X / Twitter OSINT — Deep Profile & Candidate Filter**) is fully embedded: it filters the collected accounts by 11 criteria, builds a detailed public-source profile for every selected person, and produces the final answer **entirely in Russian** with the same level of detail. Fields in the TAS tab: **Profile link**, **Telegram channel ID** (where the posts go — add your bot as an admin), **Telegram bot token**, optional **Your Telegram ID** for operational logs (if empty, logs go to the channel), plus the **year / followers / exclude-affiliated** filters and the **Raw results** toggle (only profile links, one message).

> Grok takes a few minutes on a large list — the panel shows live progress (“Grok is thinking… 45s”). Timeout is 15 minutes for Grok plus generous overall limits. If the list is enormous, it is capped at ~90 000 characters of links to keep the prompt inside Grok's input limits.

> The sticker pack is `CrazyEvilBro` — the constant `STICKER_PACK` lives in `content.js` if you ever want to change it.

## Quick start

See the full step-by-step guide in **[INSTRUCTIONS.md](INSTRUCTIONS.md)**.

1. Open `x.com` and **sign in** (X does not expose lists to logged-out users).
2. The ScrXper panel appears bottom-right. Fill in:
   - **Profile link** — e.g. `https://x.com/elonmusk` or just `elonmusk`;
   - **Telegram bot token**;
   - **Your Telegram ID**;
   - optional **Account created (year)** — e.g. `2020+` (created 2020 or later), `2020-` (2020 or earlier), `2020-2022` (range), `2020` (exact); empty = any;
   - optional **Followers filter** — e.g. `1000+` / `1000-` / `500-1000` / `1000`; empty = any;
   - **Exclude affiliated (business / org) accounts** — on by default.
3. Press **🚀 Start** (or 🧪 to send a test message).
4. Parsing runs in a background tab: following → followers (both via the same API the x.com app uses, with the year / follower filters applied), report. The tab closes itself. In Telegram you receive:
   - a start message;
   - `scrxper_<username>_report.html` — the combined report;
   - a summary with counts and elapsed time.

## How it works

- **`report-builder.js`** — generates the combined HTML report (dark theme, stats, Following/Followers tables, live filter, copy button).
- **`content.js`** — the x.com panel and the collection pipeline: it collects verified accounts (name, `@username`, verified badge, bio) with the **same GraphQL operations the x.com app itself runs**, so the account-creation year and follower count arrive with each user and the filters (year / followers / no-affiliation) are applied during collection. If X rotates the operation ids, the extension self-learns the current ones from the page's own network traffic; if the API path ever fails, it falls back to DOM scrolling.
- **`main-world.js`** — MAIN-world clipboard hook: captures what Grok copies when the extension clicks “Copy text” and forwards it to the content script (used by TAS).
- **`background.js`** — service worker: talks to the Telegram Bot API (`sendMessage` / `sendDocument` / random `sendSticker`), closes the parsing tab, notifies Telegram if the tab was closed manually.
- **`popup.html/js`** — job status in the browser toolbar.
- Storage: `chrome.storage.local` (`job`, `config`, `tasConfig`, `lastRun`, `sxUpdate`); the parsing tab id lives in `chrome.storage.session`.

## Limits & tips

- You must be **logged into X**, and the target profile must not be private.
- X can temporarily **rate-limit** requests — the extension stops with a warning; wait 10–20 minutes and retry.
- Only **verified** accounts are kept, but scrolling a huge list still takes time (25 min cap per list).
- The API collector fetches the account-creation year and follower count **for every user at collection time** — no per-profile visits, so runs are much faster than pure DOM scrolling. If X ever blocks the API path, the extension automatically falls back to DOM mode (the year / follower filters then can't be applied, and you get a notice).
- **Anti-detection trade-off**: to stay under X's radar the extension deliberately avoids perfectly regular timing (instant jumps, fixed 1.5 s gaps are easy to flag). Runs take a little longer than the theoretical minimum — that's the price of looking human.
- If `sendDocument` fails even after retries (e.g. the file is too big), the list is delivered as chunked text messages instead.
- Reports are static HTML — just open the file in a browser.
- The token and chat id are stored locally in the browser (`chrome.storage.local`) and are only sent to the Telegram API on your explicit action.

## Project structure

```
manifest.json      — MV3 manifest
background.js      — Telegram API + parsing-tab management
main-world.js      — clipboard capture hook (Grok → TAS)
report-builder.js  — combined HTML report generator
content.js         — x.com panel + collection pipeline + TAS flow
tools/             — demo report generator
popup.html / .js   — toolbar popup with status
icons/             — icons
```

> ⚠️ Use it only for your own accounts and within X's rules. Automated data collection may violate the service's terms — you are responsible for your usage.

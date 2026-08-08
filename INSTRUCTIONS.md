# ScrXper — Full Instruction Guide

This guide walks you through everything: from creating a Telegram bot to reading the final combined HTML report.

---

## 1. Prerequisites

- Chrome or Edge browser (version 111+).
- An active **X (Twitter) account** — you must be logged in on x.com.
- A Telegram account and a phone with the Telegram app.

---

## 2. Create your Telegram bot

1. In Telegram, open **[@BotFather](https://t.me/BotFather)** (the official bot that creates bots).
2. Send the command:
   ```
   /newbot
   ```
3. Follow the prompts: choose a display name, then a username ending in `bot` (e.g. `myscrxper_bot`).
4. BotFather replies with a **token** that looks like:
   ```
   123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   Copy it — this is the **bot token** you'll paste into the extension.
5. **Crucial step:** open a chat with your new bot and press **Start** (or send `/start`). A bot can only message you if you have messaged it first.

---

## 3. Find your Telegram ID

1. In Telegram, open **[@userinfobot](https://t.me/userinfobot)** (or any bot that reports your id).
2. Send it any message (or press Start).
3. It replies with your **numeric ID**, e.g. `5123456789`.
4. Copy this number — it's the **Your Telegram ID** field value.

---

## 4. Install the extension

1. Put the project folder somewhere permanent on disk (it must contain `manifest.json`).
2. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.
5. The **ScrXper** card appears in your extensions list.
6. Optional: pin it to the toolbar (puzzle icon → 📌).

> When you update the code, come back here and click the **↻ Reload** button on the ScrXper card.

---

## 5. First run

1. Open `https://x.com` and make sure you are **logged in**.
2. The **ScrXper panel** appears in the bottom-right corner:
   - drag it by the header to move it;
   - press **−** to collapse it into a small floating button;
   - press **+** on that button to expand it again.
3. Fill in the fields:
   | Field | Example | Notes |
   |---|---|---|
   | **Profile link** | `https://x.com/elonmusk` or `elonmusk` | Link or plain username; `@` and trailing slashes are fine. |
   | **Telegram bot token** | `123456789:AAH...` | From @BotFather. |
   | **Your Telegram ID** | `5123456789` | From @userinfobot. |
4. Optional sanity check: press **🧪**. Your bot should send you a test message.
5. Press **🚀 Start**.

---

## 6. What happens after you press Start

1. The extension sends a **start message** to your Telegram.
2. A **background tab** opens and runs the pipeline:
   - **Following** — the tab scrolls `x.com/<profile>/following` and collects **verified** accounts only (name, `@username`, verified badge, bio).
   - **Followers** — same for `x.com/<profile>/followers`.
   - **Follower counts** — fast stage: the tab reads **each unique verified account's** follower count by fetching its profile page in-place (~1–2 s per account, short pauses in between), so the scraping tab barely navigates. Only accounts that couldn't be read this way (e.g. private/deleted) are visited in tabs as a fallback. Unavailable profiles are skipped and shown as “—” — they never abort the run.
   - **Report** — one combined report is built and sent:
     - `scrxper_<username>_report.html`
3. A **summary message** with counts and elapsed time arrives, and the background tab closes itself.

You can keep browsing x.com in your own tab — the scraping is fully separate.

### Anti-detection (human-like behavior)

ScrXper deliberately mimics a real user so X's automation checks have nothing unusual to latch onto:

- **Scrolling** happens in steps with short pauses, occasionally nudging back up — never instant jumps to the bottom.
- **Timing** is uneven and randomized, with occasional longer "reading" pauses; nothing fires at a fixed interval.
- **Requests** carry no bot-style markers (no `x-requested-with` headers), and pacing between profile lookups includes periodic rests.
- **No obvious extension markers** in the page: random tab names, neutral DOM ids, no branded globals.

The price is a slightly longer run than a bare-bones scraper would take — that is exactly what keeps the activity under the radar. Do **not** run many ScrXper jobs at once and do **not** parse the same profile over and over in a short window; that is what gets accounts flagged.

---

## 7. Reading the report

The `.html` file is delivered as a document in Telegram. Tap / download it and open in any browser. The report contains:

- **Header card** — profile username, badge “Verified accounts only”, stats (verified total / following / followers).
- **Toolbar** — a live **filter** (type a username or name; it filters both tables) and **📋 Copy** (copies all visible `@usernames`).
- **Following table** — #, name (linked to the profile, with the verified badge), `@username`, **followers** (count read from the profile), bio (truncated, full text on hover).
- **Followers table** — the same columns for the followers list. Accounts present in both lists appear in both tables; their follower count is collected once.

> If Telegram does not offer to open the file, save it to disk and double-click it.

---

## 8. TAS mode (TopAutoScraper) — Grok → your channel

The second tab of the panel (**🤖 TAS**) runs a fully automated pipeline:

1. **Collect links** — the extension quietly collects **links of verified accounts** from the profile's following and followers. No bios, no follower counts — just `https://x.com/<username>` links.
2. **Send to Grok** — the tab opens `https://x.com/i/grok`, pastes a built-in **OSINT research prompt** with the collected links (comma-separated), and presses the send button.
3. **Wait for the answer** — the extension watches for the action row (Like / Copy) of the *new* Grok message. While waiting, the panel shows live progress ("Grok is thinking… 45s").
4. **Copy the answer** — it clicks **Copy text** and captures the copied text. To read the clipboard it uses a small hook inside the page (see `main-world.js`) — nothing extra to install.
5. **Split & post** — the answer is split into **`{...}` blocks** (one person per block, braces removed), and each block is sent to your **Telegram channel** as a separate message, one per ~1 second.
6. **Sticker** — about **1 second after the last post**, a **random sticker** from `t.me/addstickers/CrazyEvilBro` is sent to the channel.

The built-in OSINT prompt (**X / Twitter OSINT — Deep Profile & Candidate Filter**) is fully embedded: it filters the collected accounts by 11 criteria (popularity, financial success, crypto involvement, career quality, personality, social activity, network, uniqueness, information density, current activity, signal-to-noise), builds a detailed public-source profile for every selected person, and produces the final answer **entirely in Russian** with the same level of detail and the same `{...}` output format.

### TAS form fields

| Field | Example | Notes |
|---|---|---|
| **Profile link** | `https://x.com/elonmusk` or `elonmusk` | The profile whose verified following/followers are collected. |
| **Telegram channel ID** | `-1001234567890` or `@mychannel` | Where the final posts go. **Add your bot as an admin** of the channel, otherwise sending fails. |
| **Telegram bot token** | `123456789:AAH...` | From @BotFather. The bot must be a member/admin of the channel. |
| **Your Telegram ID (logs, optional)** | `5123456789` | Operational logs (start, progress, errors) go here. If empty — logs go to the channel. |

### TAS notes & limits

- The Grok answer is expected to follow the prompt's format: one person = one `{...}` block. If Grok ignores the format, the whole answer is sent as a single post.
- A very large list is capped at ~90 000 characters of links so the prompt fits Grok's input limits; a note is appended when truncation happens.
- Grok has up to **15 minutes** to answer; the whole task has a generous overall timeout.
- Posts longer than ~3800 characters are split into several messages (Telegram's 4096 limit).
- The prompt is fully embedded in the extension; **you can ask me to change it** — it's a single constant in `content.js` (`TAS_PROMPT`). The sticker pack is also a constant (`STICKER_PACK`).

---

## 9. Stopping / interrupting

- **Stop button (⏹)** in the panel — stops the task immediately, closes the background tab, marks the run as stopped.
- **Closing the parsing tab manually** — the extension notices, notifies you in Telegram, and resets the task.
- **Hung task** — if the parsing tab dies silently, the panel auto-resets it after ~5 minutes without progress.

---

## 10. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `Telegram is unreachable: Unauthorized` | Wrong bot token. Recreate via @BotFather and paste again. |
| `Telegram is unreachable: Forbidden: bot was blocked by the user` | You never messaged your bot. Open it and press **Start** (step 2.5). |
| `Telegram is unreachable: chat not found` | Wrong Telegram ID. Recheck with @userinfobot. |
| `Could not load the following/followers list` | Not logged into X, profile is private/blocked, or X is down. Sign in / pick a public profile / retry later. |
| `X rate limit` | X throttled you during list collection. Wait 10–20 minutes and start again. |
| `X rate limit during profile check` | X throttled you while reading follower counts. Wait 10–20 minutes and start again. |
| `Profile redirects` | The username is renamed or deleted. Double-check the profile link. |
| TAS: `could not send post … to the channel` | Wrong channel ID, or the bot is **not an admin** of the channel. Add the bot as an admin and re-run. |
| TAS: `could not find the Grok input` | Not logged in, or Grok is unavailable for your account. Open x.com/i/grok manually and check. |
| TAS: `Grok did not finish the answer in 15 minutes` | Grok is overloaded or the list is huge. Open x.com/i/grok to see the status, then run again. |
| TAS: `the Grok answer does not contain {...} blocks` | Grok ignored the output format. Check the answer in Grok; optionally tune the prompt in `content.js` (`TAS_PROMPT`). |
| TAS: `could not read the Grok answer (empty or unreadable)` | The answer text could not be captured from the clipboard/DOM (e.g. the page wrote a service value to the clipboard). Open x.com/i/grok, check that the answer is there, and run the task again — the reader now falls back to the answer text directly in the page, so this is rare. |
| TAS: `The sticker could not be sent` | The bot is not a member/admin of the channel, or the sticker pack is unavailable. Add the bot as an admin (the posts themselves go through, only the sticker fails). |
| `Timeout` | The list is huge; the task exceeded 30 minutes. Run again. |
| Browser blocked the window | Allow popups for x.com in the browser settings, then press Start again. |
| Report is very large | Huge lists produce huge files (Telegram file limit is 50 MB); if the file fails after retries, the list arrives as chunked messages. |
| Panel does not appear | Reload the x.com page. If still missing, reload the extension (`chrome://extensions` → ↻). |

---

## 11. Security notes

- The token and Telegram ID are stored **locally** in `chrome.storage.local` of your browser profile.
- They are sent **only** to the official Telegram Bot API (`api.telegram.org`) and only when you press Start / Test.
- No data is sent to any server other than Telegram; there is no tracking or analytics.

---

## 12. Legal disclaimer

This tool is intended for **personal use on your own accounts** and for public profiles you are allowed to process. Automated scraping may violate X's Terms of Service. You are solely responsible for how you use it.

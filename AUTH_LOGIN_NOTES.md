# Telegram login: browser sessions, multiple accounts and Xiaomi clones

The screenshot shows **oauth.telegram.org**, Telegram's own authorization page.
The website cannot replace that page's phone prompt with an app/account picker.
The official iframe Widget is retained:
`https://telegram.org/js/telegram-widget.js?22`, `data-onauth`, write permission.
The callback is posted unchanged to the backend for signature verification.

Telegram's [description of the Widget](https://telegram.org/blog/login) explains
that it authorizes a **browser**, initially using a number and confirmation in
Telegram. Once that browser is authorized, subsequent logins can be shorter.
[Widget integration documentation](https://core.telegram.org/widgets/login-legacy)
provides no parameter to select a specific installed app or Xiaomi clone.

## What can explain the phone prompt

- The normal browser, Telegram's browser, a custom tab, a private tab and a clone's
  context may not use the same Telegram browser session. On the user's phone this
  is a likely explanation, **not a verified diagnosis of Xiaomi's configuration**.
- Browser data may have expired, been cleared or be unavailable in a new context.
- `?env=dev` selects `DevTestHub_bot` and the dev API. Production uses
  `Android12TestersBot`. The bot's permission screen can differ, but this site
  parameter does not control Telegram's phone/account prompt.
- The website access token is separate: per the backend contract it exists only
  in memory for up to one hour. Reloading the page requires website sign-in again;
  it does not itself delete Telegram's browser session.

## Practical flow on the phone

Open `https://devtesthub.app/?env=dev` in the same regular, non-private browser.
If Telegram asks for a number, enter the number of the intended account **only on
oauth.telegram.org**, then confirm in that Telegram account. With two app copies,
check which copy/account received the confirmation. Reusing that authorized
browser should reduce repeated setup, but the site cannot guarantee an app-only
handoff or force the Xiaomi clone to be selected.

Opening/starting the bot lets it deliver receipts; it is **not** a replacement
for signed website authentication. The website never asks for or receives the
phone number or Telegram login code. No unofficial `tg://` login shortcut,
user-supplied ID authentication or OIDC migration was introduced.

## Website fixes made here

- Callback handling immediately opens the account drawer, exchanges the signed
  callback, fetches `/web/me`, then fills the profile chip, avatar, username,
  balance, projects and orders. A failed account load remains visible with retry.
- HTTP 404/503/401 and network/CORS-like failures show an environment-specific
  dark banner and a persistent toast with retry. Failed logins do not fake a
  profile or silently leave the user on the landing page.
- If Telegram login succeeds but the profile API fails, retry and sign-out stay
  available. Signing out of that incomplete session preserves the guest's form
  draft; the user is not trapped until the token expires.
- The DEV badge is a link to `?env=prod`. Switching environment reloads the page,
  clearing the in-memory token. Drafts remain separated by environment and actor.
- A successful callback is not cached for retries; retry asks Telegram again.
- Real multi-app routing on a Xiaomi phone was not reproduced in local browser
  tests. Local tests use mock callbacks/API responses and test the website's
  behavior, not Telegram's authentication screen or confirmation delivery.

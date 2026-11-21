# DevTestHub website

Static HTML/CSS/JavaScript for **https://devtesthub.app/** on GitHub Pages.
No build step, bundler, framework, runtime dependencies or service worker.

Full structure, IA, modules, auth/commerce and how to extend the site:
[SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md).

The actual Git root in this workspace is `devtest-web/devtest-web/`, containing
`.git`, `index.html` and `CNAME`. Publish that directory, branch `main`, folder `/`.
`CNAME` remains `devtesthub.app`. This redesign changes only this Git repository;
the backend and Mini App are read-only references.

## Product UI

- **Directory of chapters:** hash routes (`#top`, `#community`, `#community/rules`,
  `#trust`, `#private`, `#faq`, …). Only one `data-view` chapter is visible.
  CSS `:target` works before JS; then `data-ready` + `data-current`. Browser Back
  and direct links are supported. There is no long scrolling marketing page and
  no site footer.
- **Gateway `#top`:** two path cards — mutual (free, 14 days) and private (from
  $20, 15 days) — plus quiet links to community numbers and the FAQ.
- **Community branch:** index → mission, rules (checkbox ack before bot/Mini App),
  published-app path, trust (Daily Digest snapshot explained; live counters stay
  in Telegram/Mini App), and a quiet `#build` call for contributors.
- **Private `#private`:** $20/$23 site order, Telegram Stars deeplink, $75 review
  via chat. FAQ is its own chapter with the same 10 SEO answers in the HTML source.
- **Account drawer:** Telegram login, avatar/username, in-tab multi-profile
  switcher (not durable across reloads), receipt bot link, $BUST balance, own
  orders, verified timeline dates, receipt resume/cancel, project cards that
  prefill the order drawer.
- **Order drawer:** app/setup/payment wizard, License Testing and closed-testing
  screenshots, crypto UIDs, PayPal, bank requisites → manager → attach-proof.
- **Language drawer:** native EN/RU and 56 Mini App languages, local SVG flags.
- Drawers sit above the current chapter. Desktop: right slide-overs. Mobile:
  full-height account/order, language bottom sheet. One dialog at a time; inert
  background, focus trap, Escape/backdrop/close, reduced-motion, hash support.

## File map

- `index.html`: EN chapter directory (`data-view` sections), 10 FAQ answers,
  matching FAQPage JSON-LD, Service JSON-LD, metadata, and modal contents.
  Important content stays in the HTML source for crawlers.
- `css/styles.css`: shared checkout controls and layout primitives.
- `css/redesign.css`: product shell and drawer UI.
- `css/face.css`: gateway/chapters visibility, path cards, trails, trust, offers.
- `js/config.js`: explicit production/dev API and bot pairs.
- `js/api.js`: private in-memory Bearer token, one-hour expiry, credentials omitted,
  mixed-auth rejection, request timeouts and stale-session response rejection.
- `js/utils.js`: exact package/link identity, exchange UIDs, receipt limits,
  translation protection, real order-day calculation.
- `js/drawers.js`: modal lifecycle, focus, keyboard and hash/history handling.
- `js/landing.js`: chapter router (`data-view` / `data-current`) and community
  rules checkbox (`dth.community.ack.v2`). Bot and Mini App links stay closed
  until it is checked.
- `js/i18n.js`: native translations, custom picker and hidden Google translation
  engine (`googtrans` cookie + Google language-code mapping + RTL).
- `js/site-copy.js`, `js/faq-copy.js`: new native EN/RU product and FAQ copy.
- `js/languages.js`: complete Mini App language catalog snapshot with searchable
  English/Russian/native names and Google codes (`pt-br` → `pt`, Chinese variants).
- `js/app.js`: Widget callback, visible auth/API errors with retry, profile chip,
  account/projects/orders, and commerce capability discovery.
- `js/wizard.js`: preserved checkout state machine and actor-scoped local drafts.
- `assets/guides/`: copied original Mini App guide screenshots.
- `assets/flags/`: 52 local country SVGs used by the language catalog; source noted
  in that folder. No remote flag requests at runtime.
- `assets/favicon.svg`, `assets/social-card.svg` / `.png`: current brand assets.
- `CNAME`, `.nojekyll`, `robots.txt`, `sitemap.xml`: preserved Pages/SEO artifacts.
- `tests/`: dependency-free Node checks and isolated browser regression harness.
- `artifacts/directory/`: current face screenshots (home/trust).
- `artifacts/redesign/`: earlier redesign evidence.

## Local preview and checks

From the Git root:

```sh
python -m http.server 5173 --bind 127.0.0.1
node --test tests/core.test.cjs
```

Open `http://127.0.0.1:5173/` using HTTP, not `file://`.
`#account`, `#order` and `#language` open the corresponding modal.

For isolated end-to-end checks, open `/tests/qa.html` and press **Run checkout
regressions**. The harness loads the real page/scripts in an iframe but mocks the
API, Widget, cookie jar and local/session storage. No real Telegram login, payment,
receipt upload or order mutation occurs. The QA page is `noindex,nofollow`, and
production `index.html` never imports test files. Reset the QA page before reruns.
Real hash/browser-history behavior is checked on the top-level local app, because
the `srcdoc` fixture has no navigable document URL.

## Environment and authentication

- Default / `?env=prod`: `https://devtest-backend.onrender.com/api`, bot
  `Android12TestersBot`. The production URL matches the Mini App configuration.
- `?env=dev`: `https://dev-api.devtesthub.app/api`, bot `DevTestHub_bot`.
- Selection is stored per tab in `sessionStorage`. The visible **DEV** badge links
  to `?env=prod`. An environment switch reloads the page and clears the token.
- No arbitrary API URL override, staging fallback, compatibility DB write or
  Phase-2 schema workaround exists. The temporary environment policy still applies.

The official **iframe** `telegram-widget.js?22` uses `data-onauth` and write
permission. Its exact callback goes to `POST /web/auth/telegram`. On acceptance,
the site fetches `/web/me`, updates the header chip and opens the account drawer.
HTTP 404/503/401 and network/CORS-like failures always show a dark message with
environment and retry. Phone/code collection remains entirely on Telegram.

See [AUTH_LOGIN_NOTES.md](AUTH_LOGIN_NOTES.md) for the phone prompt, browser
authorization and Xiaomi/multiple-account limitations. The site cannot select
which installed Telegram app or clone handles Telegram's authorization screen.
The real Widget can show `Bot domain invalid` on localhost; authorize the actual
site domain in BotFather and test real login there. Starting the bot enables
receipt DMs; it does not replace signed browser authentication.

The access token stays only in a private JS closure, up to the backend TTL
(maximum one hour). Never put it in storage, cookies, URLs, notes or logs. An
in-tab multi-profile switcher keeps tokens in memory only for the open document;
`dth_accounts_v1` is removed on load and a reload requires Telegram sign-in again.
Private calls use only `Authorization: Bearer …`; mixing `init_data` is rejected
before sending. Logout clears the local token, not the server's stateless token
validity.

Draft keys are `dth.draft.v1.<prod|dev>.<guest|Telegram ID>`. They store form fields,
not receipt bytes, access tokens or uploaded proof URLs. A 401 preserves the
actor's draft, clears private UI and opens sign-in. Choose the receipt again after
a reload/session change. Closing a drawer never discards the draft or cancels an
order. A different user never inherits another user's authenticated draft.

## Backend contract and timeline

Read-only source of truth: `devtest-backend/WEBSITE_API.md`.

- On load: `GET /web/commerce`; unavailable/disabled checkout fails closed.
- After login: `GET /web/me` supplies own profile, balance, active orders/projects.
- For `in_progress` orders whose compact `/web/me` view omits `started_at`, the
  account optionally calls the already-supported authenticated
  `/guaranteed-test-orders/mine`. It intersects results with the original order
  IDs and verified `user_id`, and reads start dates only. It does not surface
  coordinator/foreign rows or internal admin metadata.
- `Day X / 15` is calculated only from a valid real start date, capped at 15.
  Missing/future/invalid dates produce no fabricated progress. A failed timeline
  enrichment keeps the account/status view and offers refresh.
- Receipt: multipart `file` + `upload_kind=payment_proof` to `/upload-icon`, PNG/
  JPEG/WebP up to 5 MB. Use the exact returned URL as `proof=<url>` in order notes
  or `proof_url` for attach-proof. Supplied user IDs are never auth authority.
- Crypto/PayPal: `/guaranteed-test-orders`, `create_mode=submit`; server pricing.
- Bank: `payment_method=bank`, `create_mode=requisites`; then the manager-chat
  anchor; after payment, `/{id}/attach-proof` updates the same order. An existing
  actor-owned unpaid order can be resumed, with app identity locked.
- No mutation is automatically retried after timeouts. Refresh orders first: a
  request may already have committed. A submission means manual payment review.
- PayPal uses the established fixed `$23` PayPal.me URL; if commerce changes that
  price, the direct link is hidden and manual payment uses the current amount.
- `$BUST` has no invented checkout or balance-credit endpoint. Its card is
  informational while the capability is disabled.

## Content and launch

The public face is a chapter directory: mutual testing is the wider gateway
card; private testing is the second path. Community rules must be acknowledged
before bot/Mini App links open. Trust explains how to read the Telegram Daily
Digest `PLATFORM SNAPSHOT` and the three profile signals; it does not invent
live counters on the page. The copy promises managed testing/support and a
continue-or-refund private-test path, not an automatic Google production
decision. The FAQ links to
[Google's current testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en):
the applicable new personal accounts need 12 continuously opted-in testers for
14 days before applying. The 15th day is the service's operational buffer.

EN is the static source language. RU is native. Other languages use Google
Translate with English as source. Returning from machine translation to a native
language clears translation cookies and reloads; drafts are saved first. RTL is
applied for Arabic, Persian, Hebrew and Urdu. Logo, identities, order numbers,
UIDs, emails, package links, amounts and form inputs are protected from translation.
API strings are assigned with `textContent`/native `Option`, never interpolated HTML.

Before production launch: deploy the website backend API in the correct
environment, configure its session secret/CORS and authorize the matching bot's
domain in BotFather. Preserve GitHub Pages DNS/HTTPS and CNAME. Submit the existing
sitemap in Google Search Console/Yandex Webmaster using the site owner's accounts.
This task does not deploy backend code, change DNS, or submit actual payments.

Windows social-card raster export: `./tests/render-social.ps1`.

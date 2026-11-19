# DevTestHub website

Static HTML/CSS/JavaScript for **https://devtesthub.app/** on GitHub Pages.
No build step, bundler, framework, runtime dependencies or service worker.

The actual Git root in this workspace is `devtest-web/devtest-web/`, containing
`.git`, `index.html` and `CNAME`. Publish that directory, branch `main`, folder `/`.
`CNAME` remains `devtesthub.app`. This redesign changes only this Git repository;
the backend and Mini App are read-only references.

## Product UI

- A compact public landing with the four-petal inline SVG brand mark, matching
  favicon/social card, navy/blue palette, interactive example dashboard, four
  Bento cards, free/private plan comparison and an informational Phase 2 card.
- **Account drawer:** Telegram login, avatar/username, receipt bot link, $BUST
  balance, own orders, verified timeline dates, receipt resumption/cancellation,
  and project cards that prefill the order drawer.
- **Order drawer:** the existing app/setup/payment wizard, License Testing and
  closed-testing screenshots, crypto exchange UIDs, PayPal, and two-stage bank
  requisites → manager chat → attach-proof. It is outside the landing's flow.
- **Language drawer:** native EN/RU and all 56 Mini App translation options,
  searchable by native/English/Russian language names and countries. Flags are
  local SVGs, including on Windows. There is no visible Google/system dropdown.
- Right slide-overs on desktop; full-height order/account drawers and a language
  bottom sheet on mobile. One dialog at a time; inert background, focus trap,
  return focus, Escape/backdrop/close-button dismissal, reduced-motion support,
  hash/deep-link navigation and browser Back support.

## File map

- `index.html`: static EN landing, 10 FAQ answers, matching FAQPage JSON-LD,
  Service JSON-LD, metadata, and modal contents. Important content is not injected
  only by JavaScript; crawlers can read the explanations and FAQ from the source.
- `css/styles.css`: original shared checkout controls and layout primitives.
- `css/redesign.css`: new product shell, responsive landing and drawer UI.
- `js/config.js`: explicit production/dev API and bot pairs.
- `js/api.js`: private in-memory Bearer token, one-hour expiry, credentials omitted,
  mixed-auth rejection, request timeouts and stale-session response rejection.
- `js/utils.js`: exact package/link identity, exchange UIDs, receipt limits,
  translation protection, real order-day calculation.
- `js/drawers.js`: modal lifecycle, focus, keyboard and hash/history handling.
- `js/landing.js`: interactive, clearly labelled example test timeline/scenarios.
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
- `artifacts/redesign/`: screenshots and verification evidence for this redesign.

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
(maximum one hour). Never put it in storage, cookies, URLs, notes or logs. Private
calls use only `Authorization: Bearer …`; mixing `init_data` is rejected before
sending. Logout clears the local token, not the server's stateless token validity.

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

The preview dashboard is labelled **example**, not real account telemetry.
The copy promises managed testing/support, not an automatic Google production
decision. The FAQ links to [Google's current testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en):
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

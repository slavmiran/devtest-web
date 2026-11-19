# DevTestHub website

Static HTML/CSS/JavaScript for **https://devtesthub.app/** on GitHub Pages.
No bundler, Node packages, build step, server rendering, or frontend framework.

The checkout in this workspace is nested at `devtest-web/devtest-web/`; this
directory (the one containing `.git`, `index.html`, and `CNAME`) is the repository
root to publish. `CNAME` must contain exactly `devtesthub.app`. A matching CNAME
was also placed in the outer `devtest-web/` directory to preserve the requested
workspace-level domain file. Do not publish the outer wrapper as the site root.

## Files

- `index.html`: English landing page, comparison, setup wizard, account,
  Phase 2 card, static FAQ, canonical/OpenGraph and Service/FAQPage JSON-LD.
- `css/styles.css`: shared dark UI, mobile layout and desktop landing page.
- `js/config.js`: explicit production/dev API and bot configuration.
- `js/utils.js`: strict Google Play package/link normalization, exchange UIDs,
  translation protection, receipt limits and order-note helpers.
- `js/api.js`: fetch boundary, in-memory one-hour Bearer session, mixed-auth
  rejection, timeouts, stale-session response rejection. No automatic retries.
- `js/i18n.js`: native EN/RU, persisted language preference, optional Google
  Translate loaded only when another language is selected.
- `js/wizard.js`: app/setup/payment steps, actor-scoped drafts, prefill,
  receipt upload, bank requisites and attach-proof flow.
- `js/app.js`: official Telegram iframe Widget, account/orders, commerce,
  session expiry and support links.
- `assets/guides/`: five original License/Closed Testing screenshots copied
  from the existing Mini App. Existing source repositories were not changed.
- `assets/social-card.svg` / `.png`: code-native social card and raster export.
- `robots.txt`, `sitemap.xml`, `.nojekyll`, `CNAME`: Pages/SEO artifacts.
- `tests/`: dependency-free unit checks and an isolated browser regression page.
- `artifacts/`: local verification screenshots and regression results.

## Preview and verify

From this repository root:

```sh
python -m http.server 5173 --bind 127.0.0.1
node --test tests/core.test.cjs
```

Open `http://127.0.0.1:5173/`. Do not use `file://` (origins, scripts and storage
need HTTP). A normal page requests commerce from the selected real API, but no
order/upload mutation occurs without sign-in and explicit submission.

Open `/tests/qa.html` and press **Run checkout regressions** for an isolated
browser test. It loads the actual HTML and scripts in an iframe, substitutes
mock API responses and the Widget button, and isolates local/session storage in
memory. It never submits real orders, uploads real receipts, or signs into a real
Telegram account. Reset the QA page before another run. This test page is marked
`noindex,nofollow`; production `index.html` never loads test scripts.

The browser checks cover official Widget attributes, exact callback payload,
response-provided receipt bot URL, project prefill, EN/RU switching, the paid-app
guide, all three payment methods, a durable receipt reference, repeat submission,
bank requisites → manager link → attach-proof without a second order, 401 draft
recovery, user isolation, translation protection, capability-driven prices, and
the disabled BUST payment UI. Unit tests also cover malicious Google Play links,
5 MB/file-type limits, per-tab environment selection, mixed auth, non-JSON 401s,
and delayed responses after a session changes.

The Google Translate service and Telegram Widget are external dependencies.
On localhost, the real Widget currently displays **Bot domain invalid**, because
that origin is not authorized in BotFather. Use the QA fixture for local login
tests; verify real sign-in on the authorized site domain after deployment.
Receipts may not reach the user's DMs unless they allow messages/start the bot.
No live payment, administrator Telegram delivery, or real account login was
performed by the local regressions.

Observed on 2026-11-19: public `GET /api/web/commerce` returns **200** on
`dev-api.devtesthub.app` and **404** on `devtest-backend.onrender.com`. Both returned
the matching localhost CORS origin. Production checkout therefore intentionally
stays blocked until the website API is deployed on the production backend. No
production-to-staging fallback is used.

## Environments

- Default / `?env=prod`:
  `https://devtest-backend.onrender.com/api`, bot `Android12TestersBot`.
  This Render URL matches `devtest-frontend/js/app-config.js`.
- `?env=dev`:
  `https://dev-api.devtesthub.app/api`, bot `DevTestHub_bot`, visible **DEV MODE**.
- The explicit selection stays in `sessionStorage` for the tab. `?env=prod`
  leaves dev mode. There is no arbitrary API URL override or discovery query.
- Drafts use separate `localStorage` keys per environment **and actor**:
  `dth.draft.v1.<prod|dev>.<guest|Telegram ID>`.

The temporary main/dev/Phase-2 backend policy remains in force. A staging data
incompatibility is reported as an account/request error; the website does not
patch database objects or attempt compatibility writes.

## API and payment behavior

Source of truth: `devtest-backend/WEBSITE_API.md` (read-only reference).

- On load: `GET /web/commerce`. If unavailable/disabled, payment is blocked;
  displayed static SEO prices are not treated as checkout authority.
- Widget: `https://telegram.org/js/telegram-widget.js?22`, `data-onauth`,
  `data-request-access="write"`. Callback → `POST /web/auth/telegram` unchanged.
  This is the **iframe/hash** Widget, not the newer OIDC library.
- The access token stays only in a private JS closure. It is never placed in
  storage, URLs, notes, log messages, or cookies. Private calls use
  `Authorization: Bearer …`; requests explicitly omit browser credentials and
  reject any `init_data` field mixed with Bearer auth.
- After login: `GET /web/me`, including profile, balance, own active orders and
  project suggestions. `bot_url` from login is used for the receipt reminder.
- A PNG/JPEG/WebP file up to 5 MB is uploaded as multipart `file` with
  `upload_kind=payment_proof` to `POST /upload-icon`. The exact returned `url`
  is used as `proof=<url>` in notes, or as `proof_url` for attach-proof.
- Crypto: exchange ID/UID internal USDT transfers from the existing Mini App
  configuration. These are **not** on-chain wallet addresses. Price from commerce.
- PayPal: direct `https://paypal.me/devtesthub/23USD`, with the established manual
  email option. If commerce ever changes the PayPal price, the fixed-$23 link is
  hidden and manual payment uses the current amount.
- Bank: `payment_method="bank"` (not Mini App's legacy `rub`),
  `create_mode="requisites"` first; then a real manager-chat anchor with order,
  currency, bank and personal-account preference. After paying, attach proof to
  that same order. Async requests do not try to open a blocked popup.
- The server owns the final price and payment status. A successful submission
  means **payment review**, never automatic payment confirmation.
- Existing awaiting-payment orders can resume from the account. A resumed order
  is verified against freshly loaded actor-owned orders and its identity is
  locked so another package cannot accidentally receive its proof.
- No mutation is automatically replayed after a timeout. Refresh orders before
  retrying, because the original request may already have committed.
- A 401 clears the account UI/token, preserves the actor's draft, and asks for
  sign-in again. File bytes, uploaded proof URLs, and payment confirmation are
  never saved in localStorage; choose the receipt again after a reload/session
  change. Signing out does not cancel an order or revoke a stateless server token.
- `$BUST` checkout is absent while `bust.enabled=false`. There is no invented
  balance-credit endpoint. A future enabled capability still requires a documented
  checkout API before website payment can be offered.

## Languages and privacy

Static source content defaults to English for crawlers. EN/RU uses native copy,
not a machine translation. Other languages use Google Translate with English as
the source, matching the Mini App's `googtrans` cookie approach. Returning to a
native language clears translation cookies and reloads to restore clean DOM;
drafts are saved first, and the user may need to sign in again.

Inputs, selects, links, crypto UIDs, Google Group email, order codes, Telegram
profile identity, app names in account cards and Widget container are protected
with `notranslate` / `translate="no"`. Untrusted API strings use `textContent` or
native `Option`, not HTML interpolation. Draft storage is local to the browser;
there are no analytics, advertising tags or service-worker caches.

## GitHub Pages launch

1. Commit/push this repository and configure GitHub Pages for the `main` branch,
   folder `/` (or use an equivalent static Pages deployment).
2. Keep the custom domain `devtesthub.app` / `CNAME`, configure DNS as required by
   GitHub Pages, and enable HTTPS. This task does not modify DNS or publish code.
3. Authorize the site domain for the correct bots in BotFather. Keep production
   and dev bot/API pairs aligned. The backend needs its `WEBSITE_SESSION_SECRET`
   and matching CORS origins; configure those outside this repository.
4. Verify sign-in, account and one controlled test order against the authorized
   staging domain before using production payment flows.
5. Submit `https://devtesthub.app/sitemap.xml` in Google Search Console and
   Yandex Webmaster. Account-specific ownership/verification tags can be added
   after the site owner supplies them. Structured data does not guarantee a
   particular search appearance or ranking.

To regenerate the social PNG on Windows: `./tests/render-social.ps1`.


# Website verification — 2026-11-19

All implementation changes are inside `devtest-web/`. Backend and Mini App were
read as references; their files were not edited during this website task.

## Passed

- 7 dependency-free Node tests: environment selection, exact package/link
  identity, receipt type/size limits, auth payload and Bearer routing, mixed-auth
  rejection, non-JSON 401 handling, previous-session response rejection, SEO
  schemas, local assets and CNAME.
- 28 isolated browser assertions, including all three payment paths, double
  submission, bank requisites + attach-proof without a duplicate, native RU,
  response-provided bot URL, user-scoped drafts and profile/order isolation.
  See `qa-360.txt`. The embedded test iframe is narrower than its outer 360 px
  viewport because both documents have vertical scrollbars (330 px content).
- Top-level browser viewports: 360, 390, 430, 768 and 1280 px. For each,
  `documentElement.scrollWidth === documentElement.clientWidth`; no horizontal
  scroll. See `layout-checks.json`. EN/RU and the paid-app guide were inspected.
- Real Google Translate Spanish smoke check: the hero heading translated and
  exchange UID `967321648` stayed unchanged. Returning to native EN worked.
- Public read-only API readiness: dev commerce **200**, production commerce
  **404**, with matching localhost CORS response headers.
- JavaScript syntax checks and `git diff --check` passed.

## Screenshots

- `desktop-1280.jpg`: English production-mode landing page.
- `desktop-wizard-1280.jpg`: desktop form and service summary.
- `mobile-360-ru.jpg`: Russian paid-app setup form and DEV badge.
- `mobile-390.jpg`: English mobile landing page.
- `google-translate-es.jpg`: external translation smoke check.

## Launch conditions / untested external effects

Production `/api/web/commerce` currently returns 404. Website checkout intentionally
fails closed there; no staging fallback was introduced. Deploy the existing website
API to the production backend separately, without changing this site's API pair.

The real Widget reports `Bot domain invalid` for localhost. Authorize the actual
site domain for the matching bot in BotFather, then smoke-test real sign-in on that
domain. Mocked login checks verify the frontend contract, not Telegram's real
signature validation (the backend owns that validation).

No actual payments, real order mutations, receipt uploads to Telegram, or changes
to DNS/GitHub Pages settings were performed. Local API regression traffic was
mocked; only public commerce GETs were made to the live API hosts. Publishing and
an authorized-domain staging smoke test remain deployment work.

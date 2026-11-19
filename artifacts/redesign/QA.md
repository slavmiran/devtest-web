# Drawer redesign verification — 2026-11-19

Implementation scope: only the verified Git root
`devtest-web/devtest-web/`. Backend and Mini App files were read as references,
not edited. `CNAME`, `robots.txt` and `sitemap.xml` remain in place.

## Automated checks

- **9 Node tests passed**: production/dev selection, exact Google Play package
  identity and malicious-link rejection, receipt size/type limits, exact auth
  callback, Bearer routing, no mixed `init_data`, non-JSON 401 handling, rejection
  of responses from an old session, real UTC day calculations, the complete
  language catalog/local flag assets, and static SEO artifacts.
- **52 isolated browser assertions** at each requested width: **360, 390, 1280**.
  See the corresponding `qa-*.txt` files for observed output.
- Assertions cover automatic account opening, profile chip, account/project
  views and prefill, actor-filtered timeline enrichment, all payment paths and
  duplicate-submit protection, guest/actor draft retention, account isolation,
  and visible auth 404/503/401/network failures with retry.
- An accepted login followed by a failed profile load offers both retry and
  sign-out, without losing the guest's form.
- Dialog checks: Escape, close button, outside click, inert background, Tab and
  Shift+Tab trapping, return focus and automatic dismissal after language choice.
- Picker checks: all 56 Mini App language options plus native EN/RU, search,
  Arabic/Hebrew RTL and protected form/payment values. Flags are local SVGs,
  avoiding the Windows flag-emoji fallback to country letters.
- Overflow checks cover both the document and the active drawer's scroll area,
  including Crypto, PayPal, Russian bank controls and RTL language selection.
- JavaScript syntax checks and `git diff --check` passed.

## Manual browser checks

- Top-level CTA changes the URL to `#order` and opens the drawer; browser Back
  removes it and returns to the landing.
- Real language drawer uses a dark two-column grid, with local flag images.
  Searching `немецкий` returns Deutsch/German. Native RU updates immediately.
- The Russian mobile wizard has a visible close control, internal scrolling and
  sticky Continue action. Closing does not delete the saved draft.
- The public dashboard is explicitly an interactive example, not user telemetry.
- The real Google Translate engine translated the landing into Spanish while
  preserving exchange UID values. Returning to native English also worked.
- The dashboard scenario switch and timeline keyboard controls were exercised:
  mutual Day 13/14 and private Day 15/15 showed their corresponding statuses.
- The actual localhost Widget reports `Bot domain invalid`, as expected for an
  origin that is not authorized in BotFather. No attempt was made to bypass it.

## Boundaries

No actual Telegram account was authorized and no real payment, receipt upload,
order mutation, database/schema change, backend deployment, DNS change or
publication occurred. Mocked account screenshots are labelled as QA evidence.

The Xiaomi clone/app-selection behavior cannot be reproduced from this desktop
session. The explanation in `AUTH_LOGIN_NOTES.md` distinguishes the official
browser-authorization mechanism from likely separate browser/clone contexts.
The site never asks for a phone number or login code and retains the official
iframe/hash Widget contract.

The new public FAQ and matching JSON-LD contain 10 entries. Requirements were
checked against Google's [personal-account testing documentation](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
Telegram session behavior was checked against its [Widget documentation](https://core.telegram.org/widgets/login-legacy)
and [browser-authorization explanation](https://telegram.org/blog/login).

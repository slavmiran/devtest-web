# DevTestHub website — устройство и развитие

Актуально для публичного сайта [https://devtesthub.app/](https://devtesthub.app/)
после обновления «directory of chapters» (ноябрь 2026, коммиты `Обновили сайт`).

Цель документа: после прочтения можно менять тексты, экраны, CTA и коммерцию,
не ломая кабинет, заказ и авторизацию.

- Краткая эксплуатация: [README.md](README.md)
- Telegram Login quirks: [AUTH_LOGIN_NOTES.md](AUTH_LOGIN_NOTES.md)

---

## 1. Место сайта в экосистеме

Сайт — **внешнее лицо** DevTestHub. Он не заменяет Mini App и бота.

| Канал | Роль |
| --- | --- |
| **Сайт** | Знакомство, выбор пути, правила, trust-объяснения, SEO, заказ приватного теста в браузере, кабинет |
| **Telegram-бот** | Уведомления, базовые действия, вход в Mini App, Stars / offer приватного теста |
| **Публичная группа** | Daily Digest остаётся запасным источником, если `GET /web/trust-stats` недоступен |
| **Mini App** | Взаимка, проекты, чекины, география, репутация, маркет, Live |
| **Backend API** | Auth сайта, commerce, guaranteed/private orders, профиль |

Сайт **статический**: HTML + CSS + JS, без сборки, bundler, framework и service
worker. Хостинг — GitHub Pages. Секреты в репозиторий не кладутся.

Git-корень в workspace: `devtest-web/devtest-web/` (свой `.git`, ветка `main`,
`CNAME` = `devtesthub.app`). Backend и Mini App — read-only references.

---

## 2. Репозиторий, деплой, окружения

### 2.1. Публикация

- Publish: branch `main`, folder `/`
- `CNAME` = `devtesthub.app`
- `.nojekyll`, `robots.txt` (Allow `/` + sitemap), `sitemap.xml` → `/` и `/sample-report.html`
- Cache-bust query на лицевых ассетах: `face.css?v=5`, `site-copy.js?v=5`,
  `landing.js?v=5`, `app.js?v=5` (при смене лица поднимать версию)

Локально только HTTP:

```sh
python -m http.server 5173 --bind 127.0.0.1
node --test tests/core.test.cjs
```

### 2.2. Окружения

`js/config.js` + `?env=prod|dev` + `sessionStorage` `dth.environment` (per-tab).

| ENV | API | Бот |
| --- | --- | --- |
| `prod` | `https://devtest-backend.onrender.com/api` | `Android12TestersBot` |
| `dev` | `https://dev-api.devtesthub.app/api` | `DevTestHub_bot` |

`data-env="dev"` → бейдж DEV → `?env=prod`. Смена ENV перезагружает страницу и
сбрасывает in-memory токен. Черновики заказов разделены по ENV и актору.
Произвольный override API URL запрещён.

Прочие константы в `SiteConfig`: `SUPPORT_URL` (`@garantXchange`),
`GROUP_EMAIL` (`google-play-dev-test@googlegroups.com`), PayPal URL/email.

---

## 3. Модель UI: directory of chapters

Сайт — **одностраничный каталог экранов** на hash-маршрутах. В `main` лежат
секции `data-view`; одновременно виден только один chapter. Drawers
(`#account`, `#order`, `#language`) открываются **поверх** текущего chapter и
не участвуют в chapter-роутинге.

Нет классического длинного лендинга и нет site-footer: навигация — header +
хлебные крошки `trail` + внутренние `route-link` / `chapter-row`.

### 3.1. Редакционные принципы

1. **Взаимность.** Объём работы известен заранее. Допуск своего приложения к
   production не закрывает чужие взаимные обязанности.
2. **Польза автору.** Отчёт = устройство + шаг + результат (+ скрин). После
   фикса — повод вернуться к тому же участнику.
3. **Свобода суждения.** Покупка, оценка, публичный отзыв — личный выбор.
4. **Доверие через наблюдаемые действия.** Число всегда объясняется: что
   считает, за какой период, где источник. Прошлое ≠ текущая доступность.
5. **Инициатива снизу.** В `#build` достаточно проблемы, маленького эксперимента
   и критерия «стало лучше».

Перед новым экраном: какое решение принимает посетитель? какой факт нужен
сейчас? куда идти за условиями подробнее?

### 3.2. Карта экранов (`data-view` id)

| Hash | Класс | Решение посетителя |
| --- | --- | --- |
| `#top` | `.gateway` | Две симметричные карточки: комьюнити или сервисы |
| `#community` | `.chapter` | Индекс: взаимка, рост Live, миссия, цифры, набор |
| `#community/mutual` | `.chapter` | Механика 14+ дней и переход к кодексу |
| `#community/growth` | `.chapter` | Опубликованные приложения: сами или через координатора. Алиас `#community/published` |
| `#community/mission` | `.chapter` | Пять принципов |
| `#community/rules` | `.chapter` | Кодекс + ack `dth.community.ack.v3` |
| `#services` | `.chapter` | Выбор формата. Алиас `#private` |
| `#services/testing` | `.chapter` | Одноэкранный заказ закрытого теста |
| `#services/growth` | `.chapter` | Координатор роста опубликованного приложения |
| `#trust` | `.chapter` | `GET /web/trust-stats` + три сигнала профиля |
| `#build` | `.chapter` | Роли и направления в разработке |
| `#faq` | `.chapter` | 10 Q&A |

Header desktop-nav: **Community** (`#community`), **Private test** (`#private`).
На `#community/*`, `#trust`, `#build` пункт Community получает `aria-current`.

### 3.3. Как устроен `#top` (gateway)

1. Kicker: «Android developer community»
2. H1: поиск 12 тестировщиков / Google Play
3. Короткий lead
4. **`.path-grid`** — две карточки:
   - `.path-card.mutual` (шире): FREE · 14 DAYS → `#community`
   - `.path-card.private`: FROM $20 · 15 DAYS → `#private`
5. Полоса `GET /web/trust-stats` ведёт на `#trust`. Под ней тихие ссылки `#faq` и `#build`.

Клик по карточке — абсолютный `.card-hit` поверх статьи (a11y через
`aria-labelledby` на заголовок).

### 3.4. Ветвь сообщества

**`#community`** — индекс строк `.chapter-row`:

- Start a mutual test → `#community/rules`
- What good feedback looks like → `#community/mission`
- How to read the community’s record → `#trust`
- My app is already on Google Play → `#community/published`
- тихая ссылка Help build DevTestHub → `#build`

**`#community/mission`** — три reading-block (describe / independent verdict /
close the loop) → CTA к rules.

**`#community/rules`** — обязательства до / во время / после 14 дней + **ack**.

**`#community/published`** — один user task + сравнение устройств → CTA к rules.

**`#trust`** — живой снимок `GET /web/trust-stats` (без авторизации):

Поля `metrics`: `production_releases`, `screenshot_reports`, `checkins_30d`,
`bug_reports`, `ideas`, `countries`, `active_testers`, `total_testers`,
`top_countries`. На ленте первого экрана подписи короткие; на главе — полные,
плюс «Как считаем». `production_releases` — завершённые и архивные проекты,
не факт выхода в Google Play. Если ответ невалиден или сеть недоступна,
нули не рисуются: fallback ведёт в Daily Digest
[`t.me/googleplay_console_12testers`](https://t.me/googleplay_console_12testers).
Надёжность, Карма и Вклад описаны словами и не приходят этим endpoint.

**`#build`** — `<details class="topic">` по ролям (community design, bug/language
QA, onboarding+outreach, app discovery in development) + pitch к `@garantXchange`.

### 3.5. `#private` и `#faq`

Private: intro, offers ($20 crypto / $23 bank|PayPal + Stars deeplink;
$75 detailed review → chat), copy group email, `<details>` про 15 дней и
continue-or-refund, ссылка на FAQ.

FAQ — отдельный chapter (не свёрнутый fold внизу длинной страницы). 10 вопросов
с `seoFaq*` + JSON-LD FAQPage в `<head>`.

### 3.6. Галочка согласия

`js/landing.js` (второй IIFE):

- `#community-ack` на `#community/rules`
- пока false: `#community-actions` hidden, виден `#community-wait`
- после true: Open the bot / Place project / Already on Play
- storage: `localStorage` **`dth.community.ack.v2`** = `"1"`
  (v1 устарел после смены текста обязательств)
- клиентское UX-согласие, не серверная auth

### 3.7. Deeplink CTA (`data-bot-link` в `app.js`)

| Значение | Prod URL | Смысл |
| --- | --- | --- |
| `bot` / `mutual` | `t.me/{BOT}?start=web_mutual` | Бот после правил |
| `app` | `t.me/{BOT}/app` | Mini App |
| `private` | `t.me/{BOT}/app?startapp=guaranteed_test` | Private offer / Stars path |
| support / review / build | `t.me/garantXchange` | Прямой чат |

Канон Mini App — `t.me/.../app?startapp=…`, не `WEBAPP_URL?dtview=…`.

### 3.8. Чего нет на лице

- Декоративный Play Console dashboard
- Длинный single-page scroll с bento/тарифами/Phase-2 promo
- Site footer
- Публичный live counter API на сайте (есть объяснение + ссылка на Digest)
- Checkout для $75 review
- Отдельный web-маркет (только `#build` topic «in development»)

---

## 4. Навигация chapters (технически)

### 4.1. Progressive enhancement (CSS)

В `css/face.css`:

1. Без JS: `#main > [data-view] { display:none }`, показаны `#top` и
   `#main > :target` (hash работает до скриптов).
2. С JS: `main[data-ready]` + единственный `[data-current]`.

Gateway на типичном viewport: `min-height: calc(100svh - header)` и
вертикальный centering.

### 4.2. Роутер (`js/landing.js`, первый IIFE)

- Собирает `Map` из `main > [data-view]` по `id` (включая `community/mission`).
- `hashchange` / первый `navigate()`:
  - hash `account|order|language|main` → не меняет chapter (drawers);
  - иначе показывает `pages.get(hash)` или `top`;
  - ставит `data-current`, `main[data-ready]`;
  - обновляет `aria-current` у desktop-nav;
  - title: home title на `#top`, иначе `{h1} · DevTestHub`;
  - при смене chapter фокус на `h1`, `scrollTo(0)`.
- Drawers продолжают жить в `js/drawers.js` (hash `#account` и т.д.).

Добавить экран: новая `section[data-view id="…"]` + вход из меню/крошек +
ключи EN/RU в `site-copy.js` + при смене правил — bump `ack.v*`.

---

## 5. Визуальная система

### 5.1. CSS-слои

1. `styles.css` — кнопки, формы, header, wizard primitives
2. `redesign.css` — shell, drawers, account/order
3. `face.css` — gateway, chapters, path-cards, trails, trust, ack, offers,
   chapter visibility

Палитра тёмная navy/blue (`--bg` `#040814`, surface `#0b1224`, accent `#3b82f6` /
`#4ea8ff`). Системный шрифт. Крупный H1 на chapter; prose ~67ch.

≤720px: path/offers/trust в одну колонку; path-card становится компактным
рядом icon+text. Низкие desktop-высоты сжимают gateway.

Drawers: desktop right slide-over; mobile full-height / language bottom sheet;
один диалог; `page-shell` inert; focus trap; Escape/backdrop; reduced-motion.

Brand: четырёхлепестковый SVG, `assets/favicon.svg`, `assets/social-card.*`.

---

## 6. Модули JavaScript

Порядок в `index.html`:

```
config.js → utils → languages → site-copy → faq-copy → i18n
→ drawers → api → wizard → app → landing
```

| Модуль | Роль |
| --- | --- |
| `config.js` | ENV, API, bot, support, group, PayPal |
| `utils.js` | Play package identity, exchanges, receipt, orderDay, protect() |
| `api.js` | Bearer closure, login, call, mixed-auth reject, 45s timeout, generation |
| `drawers.js` | modal lifecycle + hash for account/order/language |
| `wizard.js` | private-test checkout state machine + drafts |
| `app.js` | Widget, `/web/me`, orders/projects, in-tab multi-profile, bot links, commerce |
| `landing.js` | chapter router + community ack |
| `i18n.js` | EN/RU native + Google Translate catalog |
| `site-copy.js` / `faq-copy.js` | copy лица и FAQ |

Лицо: `index.html` + `face.css` + `site-copy.js` + `landing.js`.
Checkout/auth: `wizard.js` / `app.js` / `styles`+`redesign` — не смешивать.

---

## 7. Авторизация и кабинет

### 7.1. Login

Официальный Widget `telegram-widget.js?22` → callback unchanged →
`POST /web/auth/telegram` → `access_token` + `expires_in` (clamp ≤ 3600s).

- Токен **только в RAM** `SiteAPI` (не cookie / URL / durable storage).
- Private calls: `Authorization: Bearer`, `credentials: omit`.
- `init_data` в body → `ambiguous_authentication` до сети.
- Успех → `/web/me`, chip, open account drawer.
- 404/503/401/network → toast с ENV + retry. См. `AUTH_LOGIN_NOTES.md`.

### 7.2. Multi-profile (в рамках вкладки)

`app.js` держит `profiles` **в памяти документа**. При старте удаляется старый
`localStorage` ключ `dth_accounts_v1`. После reload нужен повторный Telegram
login. Switcher позволяет несколько сессий, пока вкладка жива и токены не
истекли.

### 7.3. Кабинет

`/web/me`: profile, active_orders, projects, balance ($BUST info / Phase 2).

Orders: статус, код, Day X/15 только из валидного `started_at` (опционально
догрузка `/guaranteed-test-orders/mine`), resume unpaid, cancel unpaid, support.

Projects → `SiteWizard.prefill` + open order. Ссылка на бота для чеков.

---

## 8. Коммерция: private testing

### 8.1. Discovery

`GET /web/commerce` (no auth). Нужен `private_testing` USD + prices
crypto/paypal/bank. Иначе fail-closed.

UI defaults до ответа: $20 / $23. `[data-price]` обновляется из commerce.
PayPal.me зафиксирован на $23; иначе прямая ссылка скрывается.

### 8.2. Wizard

1. App details (+ License Testing для paid)
2. Play Console link/package + checklist + guide screenshots
3. Payment: crypto UID / PayPal / bank requisites → manager → attach proof

Receipt ≤5MB PNG/JPEG/WebP → `POST /upload-icon` `upload_kind=payment_proof`.

- submit: `POST /guaranteed-test-orders` `create_mode=submit`
- bank: `create_mode=requisites` → `/{id}/attach-proof`
- cancel unpaid: `POST .../cancel`
- timeout не ретраится автоматически

Draft: `dth.draft.v1.<env>.<guest|telegramId>` — поля формы, не чек и не token.

### 8.3. Stars и $75

- Stars → Mini App `startapp=guaranteed_test`
- $75 Detailed app review → обсуждение в `@garantXchange`, без website order type

---

## 9. i18n

1. HTML source = EN (SEO)
2. Native RU: `i18n.js` + `SiteCopy` / `FaqCopy`
3. Остальное: Google Translate + `languages.js` (56) + локальные флаги
4. RTL: ar/fa/he/ur
5. `notranslate` / `protect()` на бренд, UID, email, package, суммы, inputs
6. Язык: `localStorage` `dth.language`

Меняя лицо — синхронно EN в HTML, EN+RU в `site-copy.js`, при необходимости
FAQ JSON-LD.

---

## 10. SEO

- title, description, canonical, OG, Twitter
- JSON-LD `Service` (offers 20 / 23 / 75)
- JSON-LD `FAQPage` (10); видимые `seoFaqNq` должны совпадать с schema
  (тест `core.test.cjs`)
- FAQ chapter в HTML-источнике (не JS-only)
- Social: `assets/social-card.png`; Windows raster: `tests/render-social.ps1`

Скраперы без JS видят `#top` и `:target` chapter благодаря CSS выше.

---

## 11. Хранилище браузера

| Ключ | Где | Что |
| --- | --- | --- |
| `dth.environment` | sessionStorage | prod/dev |
| `dth.language` | localStorage | UI language |
| `dth.community.ack.v2` | localStorage | rules accepted |
| `dth.draft.v1.<env>.<actor>` | localStorage | wizard draft |
| `dth_accounts_v1` | — | **удаляется** при загрузке; не использовать |
| Bearer | RAM only | ≤1h |

---

## 12. Тесты и артефакты

```sh
node --test tests/core.test.cjs
```

ENV, package identity, API auth rules, SEO/CNAME/assets, orderDay, languages/flags.

Browser harness: `tests/qa.html` + mocks; chapter hash лучше проверять на
top-level local app.

Скрины лица: `artifacts/directory/` (`home-1280`, `home-360`, `trust-1280`),
плюс `artifacts/redesign/` для более ранних проходов.

---

## 13. Как развивать

### 13.1. Новый chapter

1. `section.chapter[data-view id="path"]` в `index.html` с `trail` и `h1`
2. Ссылка из родительского индекса / gateway
3. Ключи EN+RU в `site-copy.js`
4. При новых обязательствах — `ack.v3` и миграция/игнор старого ключа
5. `node --test tests/core.test.cjs` + ручной проход Back/hash
6. Обновить этот документ

### 13.2. Новый коммерческий продукт

Есть API order type → wizard + commerce + account. Нет API → чат/заглушка,
без фейкового checkout.

### 13.3. Live numbers на сайте

Живые агрегаты уже читаются из `GET /web/trust-stats`. Невалидный ответ
не подменяется нулями. Не рисовать декоративные цифры и не называть
`production_releases` выходом в Google Play.

### 13.4. Не делать

- Secrets в репо
- Durable token storage «для удобства» без security review
- Смешивать Mini App `init_data` с Bearer сайта
- Обещать automatic Google production access
- Phase-2 staging костыли на сайте
- Засорять `#top` второстепенными блоками

---

## 14. Потоки пользователя

```mermaid
flowchart TD
  A[Поиск / визит] --> B["#top gateway: Mutual | Private"]
  B -->|Mutual card| C["#community index"]
  C --> M["#community/mission"]
  C --> R["#community/rules"]
  C --> P["#community/published"]
  C --> T["#trust"]
  C --> U["#build"]
  M --> R
  P --> R
  T --> R
  R --> D{ack v2}
  D -->|yes| E[Bot / Mini App]
  B -->|Private card| V["#private"]
  V -->|Start order| W["#order drawer"]
  V -->|Stars| X[Mini App guaranteed_test]
  V -->|Review $75| Y[@garantXchange]
  W --> Z{Telegram login}
  Z --> Q[Wizard 1-2-3]
  Q --> Acc["#account orders"]
  B --> FAQ["#faq"]
  T --> Digest[Telegram Daily Digest SNAPSHOT]
```

---

## 15. Карта файлов

```
index.html                 chapters + drawers + JSON-LD
css/styles.css             base / forms / wizard
css/redesign.css           shell / drawers / account
css/face.css               gateway + chapters + visibility
js/config.js               ENV + endpoints
js/utils.js                identity / receipts / protect / orderDay
js/api.js                  session + fetch
js/drawers.js              account/order/language modals
js/wizard.js               private-test checkout
js/app.js                  auth UI, me, profiles-in-tab, bot links
js/landing.js              chapter router + ack v2
js/i18n.js / site-copy.js / faq-copy.js / languages.js
assets/…                   brand, flags, Play guides
tests/…                    node + browser harness
artifacts/directory/       current face screenshots
SITE_ARCHITECTURE.md       этот документ
README.md                  ops cheat sheet
AUTH_LOGIN_NOTES.md        Widget quirks
```

---

## 16. Известные ограничения

- Нет публичного live trust API на сайте; snapshot читают в Telegram.
- `$BUST` — info в кабинете, без website top-up.
- Stars и часть private UX — в Mini App.
- `$75` review — только чат.
- После reload вкладки нужен повторный Telegram login (профили не персистятся).
- Localhost Widget: возможен `Bot domain invalid` — тест login на домене BotFather.
- `sitemap.xml` содержит `/` и `/sample-report.html`. Hash-главы остаются
  одним URL и отдельно в sitemap не выносятся.
- Живые цифры зависят от `GET /web/trust-stats`. Без валидного ответа сайт
  показывает спокойный fallback, не нули.

Источник правды — код в `index.html` + `js/*` + `css/face.css`. Меняя продукт,
обновляйте этот файл в том же изменении.

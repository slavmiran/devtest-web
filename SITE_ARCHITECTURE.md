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
- Cache-bust query на лицевых ассетах: `face.css?v=6`, `site-copy.js?v=9`,
  `service-copy.js?v=7`, `trust-copy.js?v=7`, `trust.js?v=7`, `landing.js?v=6`,
  `app.js?v=6` (при смене лица поднимать версию)

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
На вложенных главах последний сегмент `trail-current` некликабелен и называет текущую страницу.

### 3.1. Редакционные принципы

1. **Взаимность.** Объём работы известен заранее. Допуск своего приложения к
   production не закрывает чужие взаимные обязанности.
2. **Польза автору.** Отчёт = устройство + шаг + результат (+ скрин). После
   фикса — повод вернуться к тому же участнику.
3. **Свобода суждения.** Покупка, оценка, публичный отзыв — личный выбор.
4. **Доверие через наблюдаемые действия.** Число всегда объясняется: что
   считает, за какой период, где источник. Прошлое ≠ текущая доступность.
5. **Инициатива снизу.** `#build` разделяет то, что можно сделать уже сейчас, и направления, которые ещё предстоит построить.

Перед новым экраном: какое решение принимает посетитель? какой факт нужен
сейчас? куда идти за условиями подробнее?

### 3.2. Маршруты и решения

- `#top` — два входа, участие и делегирование. У каждого есть путь до и после релиза.
- `#community` → `#community/mutual` или `#community/growth`. `#community/mission` — философия платформы, без повтора Кодекса и закрытого теста. Кнопки бота и «Добавить приложение» на `#community/rules` видны сразу и становятся активными после согласия с кодексом (`dth.community.ack.v5`).
- `#services` → `#services/testing` для оформления теста. `#services/growth` описывает масштабирование через Управляющего Координатора и помечено «В разработке»: без заявки в личку, кнопки ведут в `#community/growth` и Mini App (`data-bot-link="app"`). Страница оформления теста и панель кабинета используют один DOM формы. Инструкции Play Console открываются в панели `#guide`.
- `sample-report.html` — иллюстративный отчёт расширенного пакета с EN/RU и стилем для печати.
- `#trust` — сетка «2 hero + 3 опоры»: фидбэк авторам с разбивкой и выпуски в Google Play сверху, ниже медиа, тесты за 30 дней и конфигурации устройств. География (`all_countries`), профиль и `last_completed_sprint` сохраняются. Старый снимок без новых полей не рисует нули: фидбэк складывается из багов и рекомендаций, медиа берёт `screenshots_count` или `screenshot_reports`, отсутствующие подпункты скрываются. Лента `#top` показывает те же пять метрик.
- `#build` — участие в развитии: три живых входа (продукт и промт-ТЗ, опыт и чаты, партнёрства) и четыре будущих направления без витрины. Контакт основателя `@garantXchange` остаётся внизу. `#faq` — справка. Старые ссылки `#private` и `#community/published` ведут в `#services` и `#community/growth`.

### 3.7. Deeplink CTA (`data-bot-link` в `app.js`)

| Значение | Prod URL | Смысл |
| --- | --- | --- |
| `bot` / `mutual` | `t.me/{BOT}?start=web_mutual` | Бот после правил |
| `app` | `t.me/{BOT}/app` | Mini App |
| `add_project` | `t.me/{BOT}/app?startapp=add_project` | Chooser формата добавления проекта |
| `private` | `t.me/{BOT}/app?startapp=guaranteed_test` | Private offer / Stars path |
| support / review / build | `t.me/garantXchange` | Прямой чат |

Канон Mini App — `t.me/.../app?startapp=…`, не `WEBAPP_URL?dtview=…`.

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
config.js → utils → languages → site-copy → faq-copy → service-copy → trust-copy → i18n
→ drawers → api → wizard → app → landing → trust
```

| Модуль | Роль |
| --- | --- |
| `config.js` | ENV, API, bot, support, group, PayPal |
| `utils.js` | Play package identity, exchanges, receipt, orderDay, protect() |
| `languages.js` | Каталог из 56 языков с кодами Google Translate и RTL |
| `site-copy.js` / `faq-copy.js` | Copy главной страницы, разделов сообщества и FAQ |
| `service-copy.js` | Copy раздела услуг (`#services`, `#services/testing`, `#services/growth`) |
| `trust-copy.js` | Определения и тексты доверительных метрик (`#trust`) |
| `i18n.js` | Двуязычная локализация (EN/RU) + Google Translate для остальных языков |
| `drawers.js` | Modal lifecycle + hash для `#account`, `#order`, `#language`, `#guide` |
| `api.js` | Bearer closure, login, call, mixed-auth reject, 45s timeout, generation |
| `wizard.js` | 3-шаговый визард оформления приватного теста + drafts |
| `app.js` | Widget, `/web/me`, orders/projects, multi-profile, bot links, commerce |
| `landing.js` | Chapter router (`data-view`) + community ack |
| `trust.js` | Загрузка и рендер публичных метрик с `GET /web/trust-stats` |

Лицо: `index.html` + `face.css` + `site-copy.js` + `service-copy.js` + `landing.js`.
Checkout/auth: `wizard.js` / `app.js` / `checkout.css` / `redesign.css`.

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

### 8.2. Wizard оформления приватного теста

Форма оформления доступна в двух представлениях с общим состоянием:
- Полноэкранный раздел сайта `#services/testing`.
- Модальная шторка `#order` (drawer поверх любой страницы или кабинета).

#### Шаги оформления:
1. **Приложение (`step1`):** Название приложения, автоподстановка из существующих проектов пользователя (`#project-chips-list`, загружаемых из `GET /web/me`), переключатель типа приложения «Бесплатное» / «Платное» (для платных — инструкция по добавлению тестеров в License Testing с `RESPOND_NORMALLY`).
2. **Google Play Console (`step2`):** Ввод ссылки Join on Android, автоматическая нормализация и извлечение Package ID с интерактивным блоком `LINK VERIFICATION`. Пошаговый гайд настройки закрытого тестирования (Google Group `google-play-dev-test@googlegroups.com`, включение всех регионов, отправка изменений на проверку) с вызовом модального окна скриншотов `#guide`.
3. **Оплата и чек (`step3`):**
   - Выбор способа оплаты: Криптовалюта ($20, копирование UID Binance/Bybit/OKX/HTX/Gate), PayPal ($23, фиксированная ссылка paypal.me/devtesthub/23USD), Банк/местная валюта ($23, генерация реквизитов через `@garantXchange`).
   - Drag-and-drop зона прикрепления квитанции (`#receipt-dropzone`) с превью загруженного файла (PNG/JPEG/WebP ≤5 МБ).
   - Кнопка «Оформить заказ».

- Загрузка чека: `POST /upload-icon` с `upload_kind=payment_proof` → URL в `notes`.
- Отправка: `POST /guaranteed-test-orders` (`create_mode=submit`).
- Банковский сценарий: `create_mode=requisites` → диалог с менеджером → `POST /{id}/attach-proof`.
- Отмена неоплаченного: `POST .../cancel`.
- Ошибки и таймауты: не ретраятся автоматически, показывают тост с кнопкой «Повторить».
- Черновики (Draft): `dth.draft.v1.<env>.<guest|telegramId>` — сохраняются в `localStorage` раздельно для гостя и авторизованных акторов. Включают текстовые поля формы (без бинарных данных чека).
- Каноническое описание кросс-платформенной механики: [docs/PRIVATE_TESTING_MECHANICS.md](../../docs/PRIVATE_TESTING_MECHANICS.md).

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
| `dth.community.ack.v5` | localStorage | rules accepted |
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
4. При новых обязательствах — bump `ack.v*` и игнор старого ключа
5. `node --test tests/core.test.cjs` + ручной проход Back/hash
6. Обновить этот документ

### 13.2. Новый коммерческий продукт

Есть API order type → wizard + commerce + account. Нет API → чат/заглушка,
без фейкового checkout.

### 13.3. Публичный снимок

`js/trust.js` проверяет числовые поля до отрисовки, поддерживает `screenshots_count` (fallback `screenshot_reports`), `all_countries` и `last_completed_sprint` (скрывает блок при `null`). Подписи — в `js/trust-copy.js`. Источник расчёта описан в WEBSITE_API.md бэкенда.

### 13.4. Не делать

- Secrets в репо
- Durable token storage «для удобства» без security review
- Смешивать Mini App `init_data` с Bearer сайта
- Обещать automatic Google production access
- Phase-2 staging костыли на сайте
- Засорять `#top` второстепенными блоками

---

## Дополнительные файлы

`css/checkout.css`, `css/chapters.css` и `css/trust.css` оформляют услуги, редакционные главы и статистику. Отчёт использует `js/report.js` и `css/report.css`. Браузерный прогон маршрутов находится в `tests/chapters.browser.cjs`, скриншоты — в `artifacts/platform/`.

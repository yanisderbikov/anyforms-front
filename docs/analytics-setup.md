# Настройка аналитики маркетплейса (GTM + GA4 + Яндекс.Метрика)

Фронтенд отправляет все события через модуль
[`src/services/analytics.js`](../src/services/analytics.js) в два места:

- `window.dataLayer` — для GTM → GA4 и e-commerce Яндекс.Метрики (разделы 1–8);
- JS-цели Яндекс.Метрики (`reachGoal`) с параметрами — воронка по шагам,
  магазинам и товарам (раздел 9). Цели нужно один раз создать в интерфейсе
  Метрики с идентификаторами из таблицы.

Каждое событие в обоих каналах несёт `shop` (витрина, на которой находится
покупатель: `anyforms`, `di_gips`, …) и `in_app_browser` (встроенный браузер
соцсети: `instagram`, `vk`, `facebook`, `threads`, `tiktok`, `telegram`,
`webview` или `none`). Они же уходят параметрами визита Метрики.

## 1. Подключение GTM и разделение тест/прод

Боевой контейнер **`GTM-MBTTRF2N` захардкожен** в
[`src/services/analytics.js`](../src/services/analytics.js) (константа `PROD_GTM_ID`) —
никакой настройки env в CI или на сервере не требуется.

**Отправка управляется в рантайме по хосту, а не по типу сборки** — один и тот же
Docker-образ на проде шлёт аналитику, а на dev-стенде нет:

| Условие (по убыванию приоритета) | Что происходит |
| --- | --- |
| `VITE_ANALYTICS_ENABLED=false` | вся аналитика выключена: GTM (включая `VITE_GTM_ID`), вызовы Метрики (`hit`/`params`/`reachGoal`) и Top.Mail.Ru из кода |
| `VITE_GTM_ID=GTM-…` задан | грузится этот (тестовый) контейнер — на любом хосте |
| `VITE_ANALYTICS_ENABLED=true` | боевой `GTM-MBTTRF2N` — на любом хосте |
| хост `anyforms.ru` / `www.anyforms.ru` | боевой `GTM-MBTTRF2N` автоматически |
| всё остальное (localhost, dev-стенды, поддомены, gh-pages) | **ничего не отправляется** |

Детали:

- Локально (`pnpm dev` / `pnpm start`) и на dev-стендах GTM не грузится — события
  копятся в `window.dataLayer`, но наружу не уходят. Для отладки создайте
  **тестовый** контейнер (+ тестовую GA4 property), впишите его ID в `VITE_GTM_ID` —
  см. [.env.example](../.env.example).
- Счётчики из `index.html` (gtag `G-9CVRCKCES2`, Яндекс.Метрика, Top.Mail.Ru)
  инициализируются **только на anyforms.ru / www.anyforms.ru** (проверка hostname,
  поддомены не считаются продом). Env-переменные на них не влияют.
- Каждое событие несёт параметр `environment` (`production` на прод-домене, иначе
  `development`; переопределяется через `VITE_ANALYTICS_ENV`) — страховка: если
  события всё же попадут в одну property, их можно разделить фильтром.
- В dev-режиме каждое событие печатается в консоль: `console.debug("[analytics]", event, payload)`.
- Смена боевого GTM ID = правка константы + деплой. После сборки нового образа
  на GitHub **сервер должен подтянуть его сам**: `docker compose pull && docker compose up -d`
  (или `docker pull ghcr.io/yanisderbikov/anyforms-front:latest` + перезапуск) —
  workflow только публикует образ в ghcr.io.

Проверка, что GTM доехал до прода:

```bash
BUNDLE=$(curl -s https://anyforms.ru/ | grep -o 'assets/index-[^"]*\.js' | head -1)
curl -s "https://anyforms.ru/$BUNDLE" | grep -c GTM-MBTTRF2N   # должно быть 1
```

## 2. Создание GA4 property

1. [analytics.google.com](https://analytics.google.com) → Admin → **Create Property**.
2. Название: `anyforms`, часовой пояс: Москва, валюта: **RUB** (важно — события отправляют `currency: "RUB"`).
3. Создать **Web Data Stream** для `https://anyforms.ru`.
4. Скопировать **Measurement ID** вида `G-XXXXXXXXXX`.

> Внимание: на сайте уже стоит прямой gtag-сниппет с `G-9CVRCKCES2` в `index.html`.
> Есть два корректных варианта:
> 1. **Рекомендуется:** использовать существующий `G-9CVRCKCES2` как Measurement ID в GTM и **удалить прямой gtag-сниппет из `index.html`** после проверки GTM — иначе page_view будет считаться дважды.
> 2. Либо оставить сниппет, а в GTM в теге Google (см. ниже) отключить отправку page_view.

## 3. Создание GTM-контейнера

1. [tagmanager.google.com](https://tagmanager.google.com) → **Create Account**: `anyforms`.
2. Container name: `anyforms.ru`, платформа: **Web**.
3. Скопировать **Container ID** (`GTM-XXXXXXX`) → прописать в `VITE_GTM_ID` и пересобрать фронтенд.
4. Вставлять сниппет GTM в HTML вручную **не нужно** — контейнер подключается кодом (`initAnalytics()` в `src/index.jsx`). Noscript-iframe не добавляем: приложение — SPA и без JS не работает.

## 4. Теги и триггеры в GTM

### 4.1. Google Tag (базовый)

- Tags → New → **Google Tag**.
- Tag ID: ваш Measurement ID (`G-XXXXXXXXXX`).
- Trigger: **Initialization — All Pages**.

### 4.2. Триггер для e-commerce событий

- Triggers → New → **Custom Event**.
- Event name (включить «Use regex matching»):

```
view_item_list|select_item|view_item|add_to_wishlist|remove_from_wishlist|add_to_cart|remove_from_cart|view_cart|change_cart_quantity|begin_checkout|checkout_open|checkout_field|pvz_search|pvz_selected|promo_code|checkout_submit|add_payment_info|payment_failed|payment_cancelled|checkout_abandon|payment_return|purchase
```

- Назвать: `CE — ecommerce events`.

### 4.3. Универсальный GA4 Event Tag

- Tags → New → **Google Analytics: GA4 Event**.
- Measurement ID: тот же `G-XXXXXXXXXX`.
- Event Name: `{{Event}}` (встроенная переменная; включить её в Variables → Built-in → Event).
- **Send Ecommerce data**: включить, Data source: **Data Layer**.
- Event Parameters — добавить кастомные параметры верхнего уровня через Data Layer Variables (п. 4.4):

| Parameter name      | Value                          |
| ------------------- | ------------------------------ |
| `placement`         | `{{DLV - placement}}`          |
| `removal_type`      | `{{DLV - removal_type}}`       |
| `payment_type`      | `{{DLV - payment_type}}`       |
| `error_code`        | `{{DLV - error_code}}`         |
| `item_id`           | `{{DLV - item_id}}`            |
| `previous_quantity` | `{{DLV - previous_quantity}}`  |
| `new_quantity`      | `{{DLV - new_quantity}}`       |
| `quantity_delta`    | `{{DLV - quantity_delta}}`     |
| `environment`       | `{{DLV - environment}}`        |
| `shop`              | `{{DLV - shop}}`               |
| `in_app_browser`    | `{{DLV - in_app_browser}}`     |
| `field`             | `{{DLV - field}}`              |
| `valid`             | `{{DLV - valid}}`              |
| `outcome`           | `{{DLV - outcome}}`            |
| `filled`            | `{{DLV - filled}}`             |
| `missing`           | `{{DLV - missing}}`            |
| `status`            | `{{DLV - status}}`             |
| `prefilled_contact` | `{{DLV - prefilled_contact}}`  |
| `prefilled_pvz`     | `{{DLV - prefilled_pvz}}`      |
| `query`             | `{{DLV - query}}`              |
| `results`           | `{{DLV - results}}`            |
| `code`              | `{{DLV - code}}`               |
| `reason`            | `{{DLV - reason}}`             |
| `promo_applied`     | `{{DLV - promo_applied}}`      |
| `items_count`       | `{{DLV - items_count}}`        |
| `value`             | `{{DLV - value}}`              |
| `product_ids`       | `{{DLV - product_ids}}`        |
| `products`          | `{{DLV - products}}`           |
| `seconds`           | `{{DLV - seconds}}`            |
| `filled_count`      | `{{DLV - filled_count}}`       |
| `pvz_searched`      | `{{DLV - pvz_searched}}`       |
| `order_id`          | `{{DLV - order_id}}`           |

- Trigger: `CE — ecommerce events`.

### 4.4. Data Layer Variables

Variables → New → **Data Layer Variable**, версия Data Layer: 2. Создать по одной на каждое имя:
`placement`, `removal_type`, `payment_type`, `error_code`, `item_id`, `previous_quantity`, `new_quantity`, `quantity_delta`, `environment`,
`shop`, `in_app_browser`, `field`, `valid`, `outcome`, `filled`, `missing`, `status`,
`prefilled_contact`, `prefilled_pvz`, `query`, `results`, `code`, `reason`, `promo_applied`,
`items_count`, `value`, `product_ids`, `products`, `seconds`, `filled_count`, `pvz_searched`, `order_id`.

### 4.5. Публикация

Preview (Tag Assistant) → проверить сценарии из чек-листа (п. 7) → **Submit / Publish**.

## 5. Кастомные определения в GA4

Admin → Data display → **Custom definitions** → Create custom dimension (scope: **Event**):

| Dimension name | Event parameter |
| -------------- | --------------- |
| placement      | `placement`     |
| removal_type   | `removal_type`  |
| payment_type   | `payment_type`  |
| error_code     | `error_code`    |
| shop           | `shop`          |
| in_app_browser | `in_app_browser`|
| field          | `field`         |
| valid          | `valid`         |
| outcome        | `outcome`       |
| filled         | `filled`        |
| missing        | `missing`       |
| status         | `status`        |
| prefilled_contact | `prefilled_contact` |
| prefilled_pvz  | `prefilled_pvz` |
| query          | `query`         |
| code           | `code`          |
| reason         | `reason`        |
| promo_applied  | `promo_applied` |
| product_ids    | `product_ids`   |
| products       | `products`      |
| pvz_searched   | `pvz_searched`  |
| order_id       | `order_id`      |

Для `previous_quantity`, `new_quantity`, `quantity_delta`, `results`, `items_count`, `value`, `seconds`, `filled_count` — при необходимости создать **custom metrics** либо анализировать сырые события через экспорт в BigQuery.

Стандартные поля внутри `ecommerce.items` (`item_id`, `price`, `quantity`, `index`, `item_list_name`) регистрировать не нужно — GA4 обрабатывает их автоматически.

## 6. Словарь событий

| Действие | Событие | Ключевые параметры |
| --- | --- | --- |
| Показ каталога (после загрузки данных) | `view_item_list` | `items[]` c `index`, `item_list_name: "catalog"` |
| Клик по карточке (переход на товар) | `select_item` | `item_id`, `index` |
| Открытие страницы товара | `view_item` | `item_id`, `price`, `value` |
| Лайк | `add_to_wishlist` | `placement: catalog \| product_page`, `index` (из каталога) |
| Снятие лайка | `remove_from_wishlist` | `placement` |
| Добавление в корзину (страница товара) | `add_to_cart` | `placement: "product_page"`, `quantity: 1` |
| Открытие корзины (в т.ч. пустой) | `view_cart` | все позиции, `value` |
| «+» в корзине | `add_to_cart` | `placement: "cart"`, `quantity` = дельта |
| «−» в корзине | `remove_from_cart` | `removal_type: "quantity_decrease"`, `quantity` = дельта |
| «×» (удаление позиции) | `remove_from_cart` | `removal_type: "full_remove"`, `quantity` = всё количество |
| Любое изменение количества | `change_cart_quantity` | `previous_quantity`, `new_quantity`, `quantity_delta` |
| Кнопка «Оформить заказ» | `begin_checkout` | все позиции, `value` |
| Открыта страница чекаута с непустой корзиной | `checkout_open` | `items_count`, `value`, `product_ids`, `prefilled_contact`, `prefilled_pvz` (`yes`/`no`) |
| Закончил ввод в поле (blur, непустое значение) | `checkout_field` | `field: name \| phone \| email`, `valid: valid \| invalid` — по одному на поле и результат |
| Поиск ПВЗ СДЭК | `pvz_search` | `outcome: ok \| empty \| error`, `query` (город/улица, до 40 символов), `results`; `ok` — один раз на чекаут, `empty` — на каждый уникальный запрос |
| Выбран ПВЗ | `pvz_selected` | `city` |
| Проверка промокода | `promo_code` | `outcome: applied \| rejected \| error`, `code`, `reason` (текст бэкенда) |
| Нажали «Оплатить» (клиентская валидация пройдена) | `checkout_submit` | состав корзины, `promo_applied` |
| Платёж создан, уходим на оплату | `add_payment_info` | `payment_type: "online"` |
| Ошибка создания платежа | `payment_failed` | `payment_type`, `error_code` (HTTP-статус или `no_payment_url`/`network_error`/`provider_redirect_fail`) |
| Ушёл с чекаута, не дойдя до оплаты | `checkout_abandon` | `filled`, `missing` (списки через запятую из `name, phone, email, pvz, terms`), `filled_count`, `seconds`, `pvz_searched`, состав корзины |
| Вернулся с платёжной страницы | `payment_return` | `status: success \| fail`, `order_id` |
| Возврат на `/shop/success` (успех) | `purchase` | `transaction_id` (номер заказа из `?order=`), `value`, `items` |

Как считается `checkout_abandon`: одно событие на открытие чекаута, по первому
из сигналов — вкладка свёрнута/переключили приложение (`visibilitychange`),
вкладка закрыта или ушли по внешней ссылке (`pagehide`), перешли на другую
страницу внутри SPA. В момент отправки фиксируется, какие обязательные поля
уже были валидно заполнены. Редирект на оплату уходом не считается. Покупатель
мог свернуть браузер, вернуться и оплатить — поэтому «настоящий» отвал считайте
как визиты с `checkout_abandon` **без** `payment_created` / `add_payment_info`.

Особенности реализации `purchase`:

- Состав заказа сохраняется в `localStorage` (`anyforms_checkout_snapshot`) перед редиректом на платёжную страницу Т-Банка, т.к. страница успеха получает от бэкенда только номер заказа.
- Повторная отправка блокируется флагом `ga4_purchase_sent_<transaction_id>` в `localStorage` — обновление страницы успеха покупку не дублирует.
- `value` = сумма товаров **без доставки** (доставка СДЭК оплачивается при получении и в сумму заказа не входит).

Персональные данные (ФИО, телефон, email, адрес ПВЗ, платёжные реквизиты) в события не передаются.

## 7. Чек-лист проверки (GTM Preview + GA4 DebugView)

DebugView активен автоматически в GTM Preview; в dev-сборке события видны в консоли и в `window.dataLayer`.

**Каталог** (`/shop`):
1. Открыть каталог → ровно одно `view_item_list`, у товаров правильные `item_id` и `index` (с нуля).
2. Клик по карточке → `select_item` с тем же `index`.
3. Клик по сердечку в каталоге → только `add_to_wishlist` (`placement: "catalog"`), без `select_item`.
4. Переключить фильтр «избранное» → новое `view_item_list`.

**Страница товара**:
5. Открытие → одно `view_item` (обновление состояния/галереи не дублирует).
6. Лайк/снятие → `add_to_wishlist` / `remove_from_wishlist` с `placement: "product_page"`.
7. «В корзину» → `add_to_cart` (`placement: "product_page"`, `quantity: 1`).

**Корзина** (`/shop/cart`):
8. Открытие → `view_cart` со всеми позициями и суммой (пустая корзина → `items: []`, `value: 0`).
9. «+» (1→2) → `add_to_cart` c `quantity: 1` + `change_cart_quantity` (1→2).
10. «−» (2→1) → `remove_from_cart` c `quantity: 1`, `removal_type: "quantity_decrease"`.
11. «×» при количестве 3 → `remove_from_cart` c `quantity: 3`, `removal_type: "full_remove"`.

**Checkout** (`/shop/cart?tbpayment=true`):
12. «Оформить заказ» → `begin_checkout` со всеми позициями, затем `checkout_open` с `prefilled_*`.
13. Заполнить телефон и уйти из поля → одно `checkout_field` (`field: "phone"`); повторный blur того же поля с тем же результатом события не даёт.
14. Ввести в поиск ПВЗ несуществующий город → `pvz_search` с `outcome: "empty"`; реальный → `outcome: "ok"` (один раз), выбор → `pvz_selected`.
15. Вернуться «В корзину» с наполовину заполненной формой → одно `checkout_abandon` с правильными `filled` / `missing`.
16. Отправка формы → `checkout_submit`, платёж создан → `add_payment_info` (`payment_type: "online"`) перед редиректом; `checkout_abandon` при редиректе **не** уходит.
17. Ошибка создания платежа → `payment_failed` с кодом.
18. Тестовая оплата, возврат на `/shop/success?order=…` → `payment_return` (`status: "success"`) и одно `purchase` с `transaction_id` = номеру заказа, числовыми `value` и `price`.
19. Обновить страницу успеха → `purchase` **не** отправляется повторно.
20. У каждого события есть `shop` (на `/shop/di_gips` и в корзине, набранной с этой витрины, — `di_gips`) и `in_app_browser`.

Общее: все имена событий в нижнем регистре, `items` — массив, `item_id` — непустая строка, `price`/`value`/`quantity` — числа, `currency: "RUB"`, перед каждым e-commerce событием в dataLayer уходит `{ ecommerce: null }`, StrictMode не дублирует события.

## 8. Доступные метрики по товарам

После накопления данных в GA4 (Reports → Monetization → Ecommerce purchases; Explore для произвольных срезов) по каждому `item_id` доступны: показы в каталоге (`view_item_list`), клики (`select_item`), CTR (= select_item / view_item_list), просмотры товара (`view_item`), лайки/снятия (`add_to_wishlist` / `remove_from_wishlist` + разбивка по `placement`), добавленные/удалённые единицы, начатые оформления, купленные единицы и выручка (`purchase`). Различайте количество событий, единиц товара (sum of `quantity`) и пользователей (uniques) — GA4 показывает все три разреза.

## 9. Яндекс.Метрика: просмотры страниц, цели и параметры

Счётчик `106593235` подключён в `index.html` (только на прод-домене) с
`ecommerce:"dataLayer"`, поэтому e-commerce события (`add_to_cart`, `purchase`, …)
Метрика читает из того же dataLayer. Дополнительно модуль аналитики делает три вещи.

### 9.1. Просмотры страниц в SPA

Приложение — SPA, и без ручных вызовов Метрика видела только первую страницу
визита (глубина просмотра ≈ 1, у `/shop/cart` и `/shop/checkout` почти нет
просмотров). Теперь `App` при каждой смене пути вызывает `ym('hit', url)`
(и `pageView` для Top.Mail.Ru) — см. `trackPageView`. Первая страница не
дублируется: её счётчик считает сам при инициализации. Благодаря этому работают
отчёты «Страницы входа/выхода», Вебвизор по страницам и воронки по URL.

### 9.2. Параметры визита

`ym('params', …)` отправляется при инициализации и при смене магазина:

| Параметр | Значения | Зачем |
| --- | --- | --- |
| `shop` | `anyforms`, `di_gips`, `af_pastry`, … | сегмент «покупатели витрины X», конверсия по магазинам |
| `in_app_browser` | `instagram`, `vk`, `facebook`, `threads`, `tiktok`, `telegram`, `webview`, `none` | сравнить конверсию во встроенном браузере соцсети и в обычном |

В отчётах: Отчёты → Содержание → Параметры визитов; в сегментах: Поведение → Параметры визитов.

### 9.3. JS-цели (создать в Метрике: Цели → Добавить цель → JavaScript-событие)

Идентификатор цели = первый столбец. Параметры уходят вторым аргументом
`reachGoal` и видны в отчёте «Параметры визитов» и в сегментах; к каждой цели
автоматически добавляются `shop` и `in_app_browser`.

| Идентификатор | Когда | Параметры |
| --- | --- | --- |
| `select_item` | клик по карточке в каталоге | `product_id`, `product_name`, `index`, `list` |
| `product_open` | открыта страница товара | `product_id`, `product_name`, `price` |
| `add_to_wishlist` / `remove_from_wishlist` | лайк / снятие лайка | `product_id`, `product_name`, `variant`, `price`, `placement` |
| `add_to_cart` / `remove_from_cart` | товар добавлен / удалён | `product_id`, `product_name`, `variant`, `price`, `quantity`, `placement`, `removal_type` |
| `view_cart` | открыта корзина | `items_count`, `value`, `product_ids`, `products` (дерево «название → штук») |
| `begin_checkout` | кнопка «Оформить заказ» | как у `view_cart` |
| `checkout_open` | открыт чекаут с непустой корзиной | как у `view_cart` + `prefilled_contact`, `prefilled_pvz` |
| `checkout_field` | закончил ввод в поле | `field`, `valid` |
| `pvz_search_ok` / `pvz_search_empty` / `pvz_search_error` | поиск ПВЗ | `query`, `results` |
| `pvz_selected` | выбран ПВЗ | `city` |
| `promo_applied` / `promo_rejected` / `promo_error` | проверка промокода | `code`, `reason` |
| `checkout_submit` | нажали «Оплатить» | как у `view_cart` + `promo_applied` |
| `payment_created` | платёж создан, редирект на оплату | как у `view_cart` + `payment_type`, `promo_applied` |
| `payment_failed` | платёж не создан / оплата не прошла | `payment_type`, `error_code` |
| `checkout_abandon` | ушёл с чекаута до оплаты | `filled`, `missing`, `filled_count`, `seconds`, `pvz_searched` + состав корзины |
| `payment_return_success` / `payment_return_fail` | вернулся с платёжной страницы | `order_id` |
| `purchase` | покупка подтверждена на `/shop/success` | `order_id`, `value`, `product_ids`, `products` |

Воронка магазина по визитам (Отчёты → Конверсии, либо составная цель):
`product_open` → `add_to_cart` → `view_cart` → `begin_checkout` → `checkout_open`
→ `checkout_field` → `pvz_selected` → `checkout_submit` → `payment_created`
→ `payment_return_success` → `purchase`. Разрез по магазину — сегмент по параметру
визита `shop`; где именно отваливаются — параметры `missing` у `checkout_abandon`.

Автоцели Метрики («начало оформления заказа», «заполнил контактные данные» и т.п.)
можно оставить, но для воронки опираться на JS-цели: автоцели срабатывают по
эвристике на клики и не знают ни магазина, ни состава корзины.

### 9.4. Аналитика форм

У всех полей чекаута есть `name`/`id` (`fullName`, `phone`, `email`, `promo`, `pvz`,
`marketingConsent`, `acceptTerms`), сама форма: `id="checkout-form"` и `name="checkout"`. Штатный отчёт Метрики
«Аналитика форм» (в настройках счётчика включить «Аналитика форм») покажет время
и отвал по каждому полю без дополнительного кода.

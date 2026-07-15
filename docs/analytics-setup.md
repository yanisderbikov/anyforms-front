# Настройка аналитики маркетплейса (GTM + GA4)

Фронтенд уже отправляет все события в `window.dataLayer` через модуль
[`src/services/analytics.js`](../src/services/analytics.js). Чтобы события попали в GA4,
нужно один раз настроить Google Tag Manager и GA4 по этой инструкции.

## 1. Подключение GTM и разделение тест/прод

Боевой контейнер **`GTM-MBTTRF2N` захардкожен** в
[`src/services/analytics.js`](../src/services/analytics.js) (константа `PROD_GTM_ID`) —
никакой настройки env в CI или на сервере не требуется:

| Окружение | Контейнер GTM |
| --- | --- |
| Прод-сборка (`pnpm build`, Docker/CI) | `GTM-MBTTRF2N` автоматически |
| Локальная разработка (`pnpm dev` / `pnpm start`) | выключен; включается тестовый через `VITE_GTM_ID` в `.env.dev` / `.env.development` |

Детали:

- В dev-сборке GTM по умолчанию не грузится, чтобы локальные клики не попадали
  в боевую статистику. Для отладки создайте **тестовый** контейнер (+ тестовую
  GA4 property), впишите его ID в `VITE_GTM_ID` — см. [.env.example](../.env.example).
  `VITE_GTM_ID` имеет приоритет и в prod-сборке (на случай стейджинга).
- Счётчики из `index.html` (gtag `G-9CVRCKCES2`, Яндекс.Метрика, Top.Mail.Ru)
  инициализируются **только на домене anyforms.ru** (проверка hostname).
- Каждое событие несёт параметр `environment` (`development` / `production`,
  переопределяется через `VITE_ANALYTICS_ENV`) — страховка: если события всё же
  попадут в одну property, их можно разделить фильтром.
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
view_item_list|select_item|view_item|add_to_wishlist|remove_from_wishlist|add_to_cart|remove_from_cart|view_cart|change_cart_quantity|begin_checkout|add_payment_info|payment_failed|payment_cancelled|purchase
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

- Trigger: `CE — ecommerce events`.

### 4.4. Data Layer Variables

Variables → New → **Data Layer Variable**, версия Data Layer: 2. Создать по одной на каждое имя:
`placement`, `removal_type`, `payment_type`, `error_code`, `item_id`, `previous_quantity`, `new_quantity`, `quantity_delta`, `environment`.

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

Для `previous_quantity`, `new_quantity`, `quantity_delta` — при необходимости создать **custom metrics** либо анализировать сырые события через экспорт в BigQuery.

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
| Платёж создан, уходим на оплату | `add_payment_info` | `payment_type: "online"` |
| Ошибка создания платежа | `payment_failed` | `payment_type`, `error_code` (HTTP-статус или `no_payment_url`/`network_error`) |
| Возврат на `/shop/success` | `purchase` | `transaction_id` (номер заказа из `?order=`), `value`, `items` |

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
12. «Оформить заказ» → `begin_checkout` со всеми позициями.
13. Отправка формы, платёж создан → `add_payment_info` (`payment_type: "online"`) перед редиректом.
14. Ошибка создания платежа → `payment_failed` с кодом.
15. Тестовая оплата, возврат на `/shop/success?order=…` → одно `purchase` с `transaction_id` = номеру заказа, числовыми `value` и `price`.
16. Обновить страницу успеха → `purchase` **не** отправляется повторно.

Общее: все имена событий в нижнем регистре, `items` — массив, `item_id` — непустая строка, `price`/`value`/`quantity` — числа, `currency: "RUB"`, перед каждым e-commerce событием в dataLayer уходит `{ ecommerce: null }`, StrictMode не дублирует события.

## 8. Доступные метрики по товарам

После накопления данных в GA4 (Reports → Monetization → Ecommerce purchases; Explore для произвольных срезов) по каждому `item_id` доступны: показы в каталоге (`view_item_list`), клики (`select_item`), CTR (= select_item / view_item_list), просмотры товара (`view_item`), лайки/снятия (`add_to_wishlist` / `remove_from_wishlist` + разбивка по `placement`), добавленные/удалённые единицы, начатые оформления, купленные единицы и выручка (`purchase`). Различайте количество событий, единиц товара (sum of `quantity`) и пользователей (uniques) — GA4 показывает все три разреза.

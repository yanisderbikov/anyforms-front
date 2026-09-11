---
name: code-review
description: Чеклист ревью критичных зон anyforms-front для PR в main — оплата через Т-Кассу (курс, гайд, магазин), admin-раздел и авторизация, apiClient и interceptor, аналитика, SSR/пререндер, env-переменные VITE_*. Использовать при любом PR, который трогает apiClient.jsx, components/*Checkout*, components/*Success*, AdminLayout, AdminSalesbot, services/analytics.js, entry-server.jsx, scripts/prerender.mjs, App.jsx, .env.example, deploy-server.yml.
---

# Чеклист ревью anyforms-front

Проходи по пунктам и ссылайся на номер пункта в комментарии. Неприменимые пункты пропускай молча.

## A. Env и деплой (выполняется всегда)

A1. Найди в диффе новые обращения `import.meta.env.VITE_*`. Каждая переменная должна быть в `.env.example`; если она нужна в проде — ещё и передана как `build-arg` в `.github/workflows/deploy-server.yml` и заведена в GitHub Variables. Нет — High.
A2. В summary выведи блок:

```
## Env
Добавили — проставь в GitHub Variables до мержа: (список или «нет»)
Убрали: (список или «нет»)
Полный список VITE_* после мержа: ...
```

A3. `Dockerfile` вызывает `pnpm run api`, то есть регенерирует клиент из живого OpenAPI бэка во время сборки. Если PR опирается на новый эндпоинт бэка, напомни: бэк должен быть задеплоен раньше фронта, иначе сборка образа или типы сломаются.

## B. apiClient и авторизация

B1. Interceptor в `src/apiClient.jsx` не должен резолвить ошибку в `undefined`: в каждой ветке либо `return Promise.reject(error)`, либо `throw`.
B2. Ручные вызовы через `apiClient.instance` добавляют `Authorization` сами; проверь, что новый вызов в admin-разделе не ушёл без токена.
B3. Новый admin-маршрут: добавлен в `src/App.jsx` под `AdminLayout`, секция описана в `src/permissions.js`, роль совпадает с бэком (`SALESBOT`, инвойсы, промокоды — только ADMIN).
B4. Клиентская проверка `hasLiveToken` — не защита; данные, которые нельзя показывать без роли, не должны запрашиваться до проверки.
B5. Никаких `console.log` с телом ответа, JWT, паролем, телефоном вне `import.meta.env.DEV`.

## C. Оплата (Т-Касса)

C1. `CourseCheckout.jsx`, `GuideCheckout.jsx`, `MarketplaceCheckout.jsx`: перед `window.location.href = paymentUrl` состояние `submitting` выставлено, повторный клик заблокирован, ошибка запроса снимает блокировку.
C2. `productCode`, план (`COURSE`/`COURSE_PERSONAL`/`GUIDE`), промокод, `shopSlug`, выбранный ПВЗ передаются ровно те, что видит пользователь на экране.
C3. `returnUrl` ведёт на соответствующую success-страницу приложения; `?status=fail` на ней обрабатывается и показывает пользователю, что делать.
C4. Снимок корзины (`saveCheckoutSnapshot`) пишется до редиректа; `MarketplaceSuccess.jsx` дедуплицирует `trackPurchase` по transaction id и очищает корзину один раз.
C5. Kill-switch `src/config/features.js` (`tbpayment`) по-прежнему отключает все три чекаута.
C6. Суммы на экране считаются из данных бэка, а не пересчитываются на фронте другой формулой; скидка не уходит в минус.

## D. React-баги

D1. Эффект с API-вызовом и `setState` в `.then` имеет `cancelled`-флаг или `AbortController` в cleanup; особенно всё, что зависит от `shopSlug`, `id`, `orderId`.
D2. `setTimeout`/`setInterval`/`addEventListener`/observers снимаются в cleanup.
D3. `finally` сбрасывает `loading`/`submitting` во всех ветках.
D4. Функциональный `setState` и чтение того же state из замыкания в одном обработчике — stale closure (`CartContext.add`).
D5. Ключи в списках стабильные (id, не index) там, где элементы удаляются/переставляются.

## E. Аналитика

E1. Имена событий и параметров совпадают с `docs/analytics-setup.md`; событие не отправляется дважды при ремаунте.
E2. Прод GTM-контейнер не подменяется; `VITE_GTM_ID` только для тестового.
E3. `setAnalyticsShop` вызывается при смене витрины.

## F. SSR и пререндер

F1. Страницы `/` и `/3d-print` не обращаются к `window`, `document`, `localStorage`, `navigator` на этапе рендера.
F2. Изменения `src/shared/pageSeo.mjs` и `scripts/prerender.mjs` согласованы: список маршрутов, title/description, `ROOT_GUARD`.
F3. Ленивые тяжёлые модули (`StlViewer`, three.js) остаются `lazy`.

## G. Копирайтинг и контент

G1. Бренд в тексте — строчными «anyforms».
G2. Новые числа на лендингах (цены, сроки, проценты, «с 2020 года») — спроси источник, если его нет в PR.
G3. Реквизиты продавца — ИП Дмитрий Суворов для всех продуктов; появление других реквизитов в юр. текстах — High.

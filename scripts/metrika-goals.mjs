#!/usr/bin/env node
const COUNTER_ID = process.env.METRIKA_COUNTER_ID || '106593235';
const TOKEN = process.env.YANDEX_METRIKA_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const API = 'https://api-metrika.yandex.net/management/v1';

const GOALS = [
  ['select_item', 'Магазин: клик по товару в каталоге'],
  ['product_open', 'Магазин: открыта страница товара'],
  ['add_to_wishlist', 'Магазин: лайк товара'],
  ['remove_from_wishlist', 'Магазин: снят лайк'],
  ['add_to_cart', 'Магазин: товар в корзину'],
  ['remove_from_cart', 'Магазин: товар убран из корзины'],
  ['view_cart', 'Магазин: открыта корзина'],
  ['begin_checkout', 'Магазин: кнопка «Оформить заказ»'],
  ['checkout_open', 'Магазин: открыт чекаут'],
  ['checkout_field', 'Магазин: заполнено поле чекаута'],
  ['pvz_search_ok', 'Магазин: поиск ПВЗ — найдено'],
  ['pvz_search_empty', 'Магазин: поиск ПВЗ — пусто'],
  ['pvz_search_error', 'Магазин: поиск ПВЗ — ошибка'],
  ['pvz_selected', 'Магазин: выбран ПВЗ'],
  ['checkout_submit', 'Магазин: нажали «Оплатить»'],
  ['payment_created', 'Магазин: платёж создан'],
  ['payment_failed', 'Магазин: платёж не прошёл'],
  ['payment_cancelled', 'Магазин: платёж отменён'],
  ['checkout_abandon', 'Магазин: ушёл с чекаута'],
  ['payment_return_success', 'Магазин: вернулся с оплаты — успех'],
  ['payment_return_fail', 'Магазин: вернулся с оплаты — неуспех'],
  ['purchase', 'Магазин: покупка'],
  ['purchase_with_promo', 'Промокод: покупка с промокодом'],
  ['promo_link_visit', 'Промокод: пришёл по ссылке с ?promo='],
  ['promo_popup_shown', 'Промокод: попап показан'],
  ['promo_popup_closed', 'Промокод: попап закрыт'],
  ['promo_popup_submit', 'Промокод: попап — отправил контакты'],
  ['promo_popup_claimed', 'Промокод: попап — код выдан за контакты'],
  ['promo_popup_issued', 'Промокод: попап — код выдан устройству'],
  ['promo_popup_code_taken', 'Промокод: попап — забрал общий код'],
  ['promo_popup_copied', 'Промокод: попап — скопировал код'],
  ['promo_popup_error', 'Промокод: попап — ошибка выдачи'],
  ['promo_after_purchase_shown', 'Промокод: код после покупки показан'],
  ['promo_after_purchase_copied', 'Промокод: код после покупки скопирован'],
  ['promo_applied', 'Промокод: применён в чекауте'],
  ['promo_rejected', 'Промокод: не подошёл в чекауте'],
  ['promo_error', 'Промокод: ошибка проверки в чекауте'],
];

if (!TOKEN) {
  console.error(
    [
      'Задайте YANDEX_METRIKA_TOKEN — OAuth-токен с правом «Яндекс.Метрика: управление счётчиками».',
      'Счётчик: METRIKA_COUNTER_ID (по умолчанию 106593235, anyforms.ru).',
      'Запуск: YANDEX_METRIKA_TOKEN=… node scripts/metrika-goals.mjs [--dry-run]',
      'Подробнее: docs/analytics-setup.md, раздел 9.5.',
    ].join('\n'),
  );
  process.exit(1);
}

const headers = { Authorization: `OAuth ${TOKEN}`, 'Content-Type': 'application/json' };

const request = async (method, path, body) => {
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
};

const existing = (await request('GET', `/counter/${COUNTER_ID}/goals`)).goals || [];
const existingIds = new Set(
  existing.flatMap((goal) =>
    goal.type === 'action' ? (goal.conditions || []).map((condition) => condition.url) : [],
  ),
);

const missing = GOALS.filter(([id]) => !existingIds.has(id));
console.log(`Счётчик ${COUNTER_ID}: целей ${existing.length}, JS-целей из списка не хватает ${missing.length}`);
for (const [id, name] of missing) {
  if (DRY_RUN) {
    console.log(`  [нет] ${id} — ${name}`);
    continue;
  }
  const created = await request('POST', `/counter/${COUNTER_ID}/goals`, {
    goal: { name, type: 'action', conditions: [{ type: 'exact', url: id }] },
  });
  console.log(`  [создана] ${id} → #${created.goal.id} «${name}»`);
}
if (!DRY_RUN && missing.length === 0) console.log('Все цели уже есть.');

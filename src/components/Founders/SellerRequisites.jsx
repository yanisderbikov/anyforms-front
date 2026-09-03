import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './SellerRequisites.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// РЕКВИЗИТЫ продавца гайда и курса — ИП Суворов Дмитрий Игоревич (с 3 сентября
// 2026 г.; до этого продавцом был самозанятый Суворов Ю. И.). Те же реквизиты,
// что в футерах главной, /chief, /3d-print и /shop. Строку можно скрыть, удалив её
// из массива. ОГРНИП — из ЕГРИП (регистрация 27.08.2024, Санкт-Петербург).
// ─────────────────────────────────────────────────────────────────────────────
const FULL_NAME = 'ИП Суворов Дмитрий Игоревич';

const REQUISITES = [
  { label: 'Продавец', value: 'Индивидуальный предприниматель Суворов Дмитрий Игоревич' },
  { label: 'ИНН', value: '590699241510' },
  { label: 'ОГРНИП', value: '324784700274710' },
  { label: 'Юридический адрес', value: 'г. Санкт-Петербург, ул. Заречная, д. 36, корп. 1, кв. 404' },
  { label: 'Email', value: 'suvorov@anyforms.ru' },
  { label: 'Телефон', value: '+7 981 040-39-53' },
  { label: 'Приём платежей', value: 'Т-Касса (АО «ТБанк»)' },
  { label: 'Чек', value: 'Кассовый чек по 54-ФЗ направляется на e-mail покупателя после оплаты' },
  { label: 'НДС', value: 'Не облагается (упрощённая система налогообложения)' },
];

const SellerRequisites = () => {
  // Страница реквизитов общая для гайда и курса — «назад» ведёт туда, откуда пришли (?from=course|guide).
  const [searchParams] = useSearchParams();
  const fromCourse = searchParams.get('from') === 'course';
  const backTo = fromCourse ? '/course' : '/guide';
  const backLabel = fromCourse ? '← К курсу' : '← К гайду';
  const productLabel = fromCourse ? 'Курс' : 'Гайд';

  return (
    <div className={styles.page} id="top">
      <LandingHeader
        logo={{
          href: '/',
          ariaLabel: 'anyforms — на главную',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
        }}
        navLinks={[]}
        navAriaLabel="Разделы"
        rightItems={[
          {
            key: 'back',
            kind: 'link',
            to: backTo,
            label: productLabel,
            variant: 'pill',
          },
        ]}
        mobileMenuId="founder-mobile-menu"
        mobileTopItems={[
          { key: 'back-m', kind: 'link', to: backTo, label: productLabel, variant: 'primary' },
        ]}
      />

      <main className={styles.main}>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>Реквизиты</span>
          <h1 className={styles.title}>{FULL_NAME}</h1>
          <p className={styles.lead}>
            Регистрационные данные продавца гайда и курса — для оформления документов
            и оплаты.
          </p>

          <dl className={styles.table}>
            {REQUISITES.map((row) => (
              <div className={styles.row} key={row.label}>
                <dt className={styles.rowLabel}>{row.label}</dt>
                <dd className={styles.rowValue}>{row.value}</dd>
              </div>
            ))}
          </dl>

          <p className={styles.backWrap}>
            <Link className={styles.back} to={backTo}>
              {backLabel}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SellerRequisites;

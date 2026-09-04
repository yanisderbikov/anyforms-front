import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import { SELLER, LEGAL_LINKS } from '../../shared/seller';
import styles from './SellerRequisites.module.css';

// Реквизиты продавца всего сайта (магазин, изготовление, гайд, курс) — ИП Суворов
// Дмитрий Игоревич. Значения берутся из src/shared/seller.js, чтобы совпадать
// с футерами. ОГРНИП — из ЕГРИП (регистрация 27.08.2024, Санкт-Петербург).
const REQUISITES = [
  { label: 'Продавец', value: SELLER.fullName },
  { label: 'ИНН', value: SELLER.inn },
  { label: 'ОГРНИП', value: SELLER.ogrnip },
  { label: 'Юридический адрес', value: SELLER.address },
  { label: 'Email', value: SELLER.email },
  { label: 'Телефон', value: SELLER.phone },
  { label: 'Приём платежей', value: 'Т-Касса (АО «ТБанк»)' },
  { label: 'Чек', value: 'Кассовый чек по 54-ФЗ направляется на e-mail покупателя после оплаты' },
  { label: 'НДС', value: 'Не облагается (упрощённая система налогообложения)' },
];

// Откуда пришли (?from=course|guide|shop) — туда и ведёт «назад»; по умолчанию на главную.
const BACK = {
  course: { to: '/course', label: '← К курсу', header: 'Курс' },
  guide: { to: '/guide', label: '← К гайду', header: 'Гайд' },
  shop: { to: '/shop', label: '← В магазин', header: 'Магазин' },
};
const DEFAULT_BACK = { to: '/', label: '← На главную', header: 'Главная' };

const SellerRequisites = () => {
  const [searchParams] = useSearchParams();
  const back = BACK[searchParams.get('from')] || DEFAULT_BACK;

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
        rightItems={[{ key: 'back', kind: 'link', to: back.to, label: back.header, variant: 'pill' }]}
        mobileMenuId="founder-mobile-menu"
        mobileTopItems={[{ key: 'back-m', kind: 'link', to: back.to, label: back.header, variant: 'primary' }]}
      />

      <main className={styles.main}>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>Реквизиты</span>
          <h1 className={styles.title}>{SELLER.shortName}</h1>
          <p className={styles.lead}>
            Регистрационные данные продавца товаров и услуг anyforms — для оформления
            документов и оплаты.
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
            <Link className={styles.back} to={LEGAL_LINKS.privacy}>
              Политика обработки персональных данных
            </Link>
          </p>
          <p className={styles.backWrap}>
            <Link className={styles.back} to={back.to}>
              {back.label}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SellerRequisites;

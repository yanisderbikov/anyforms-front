import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './FounderYuri.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// РЕКВИЗИТЫ. Заполните значения с прочерком «—» реальными данными ИП.
// Строку можно скрыть, удалив её из массива.
// ─────────────────────────────────────────────────────────────────────────────
const FULL_NAME = 'Индивидуальный предприниматель Суворов Юрий Игоревич';

const REQUISITES = [
  { label: 'Наименование', value: 'ИП Суворов Юрий Игоревич' },
  { label: 'ИНН', value: '—' },
  { label: 'ОГРНИП', value: '—' },
  { label: 'Адрес регистрации', value: '—' },
  { label: 'Расчётный счёт', value: '—' },
  { label: 'Банк', value: '—' },
  { label: 'БИК', value: '—' },
  { label: 'Корреспондентский счёт', value: '—' },
  { label: 'Email', value: 'suvorov@anyforms.ru' },
];

const FounderYuri = () => {
  return (
    <div className={styles.page} id="top">
      <LandingHeader
        logo={{
          href: '/',
          ariaLabel: 'AnyForms — на главную',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
        }}
        navLinks={[]}
        navAriaLabel="Разделы"
        rightItems={[
          {
            key: 'guide',
            kind: 'link',
            to: '/guide',
            label: 'Гайд',
            variant: 'pill',
          },
        ]}
        mobileMenuId="founder-mobile-menu"
        mobileTopItems={[
          { key: 'guide-m', kind: 'link', to: '/guide', label: 'Гайд', variant: 'primary' },
        ]}
      />

      <main className={styles.main}>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>Реквизиты</span>
          <h1 className={styles.title}>{FULL_NAME}</h1>
          <p className={styles.lead}>
            Платёжные и регистрационные данные для оформления документов и оплаты.
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
            <Link className={styles.back} to="/guide">
              ← К гайду
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default FounderYuri;

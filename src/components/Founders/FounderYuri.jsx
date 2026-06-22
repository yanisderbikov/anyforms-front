import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './FounderYuri.module.css';

// ─────────────────────────────────────────────────────────────────────────────
// РЕКВИЗИТЫ продавца. Продавец — самозанятый (плательщик НПД), не ИП:
// нет ОГРНИП, ОКВЭД и онлайн-кассы; чек формируется в приложении ФНС «Мой налог».
// Строку можно скрыть, удалив её из массива.
// ─────────────────────────────────────────────────────────────────────────────
const FULL_NAME = 'Суворов Юрий Игоревич';

const REQUISITES = [
  { label: 'Продавец', value: 'Суворов Юрий Игоревич' },
  { label: 'Статус', value: 'Самозанятый — плательщик налога на профессиональный доход (НПД)' },
  { label: 'ИНН', value: '590621081613' },
  { label: 'Юридический адрес', value: '614014, г. Пермь, ул. Салтыкова-Щедрина, д. 13' },
  { label: 'Фактический адрес', value: '614014, г. Пермь, ул. Салтыкова-Щедрина, д. 13' },
  { label: 'Email', value: 'yuri@anyforms.ru' },
  { label: 'Чек', value: 'Формируется в приложении ФНС «Мой налог» и направляется покупателю' },
  { label: 'НДС', value: 'Не облагается (применяется специальный налоговый режим «НПД»)' },
];

const FounderYuri = () => {
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
            Регистрационные данные продавца — самозанятого (плательщика НПД) — для
            оформления документов и оплаты.
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

export default FounderYuri;

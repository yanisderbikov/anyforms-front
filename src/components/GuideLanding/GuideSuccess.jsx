import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './GuideCheckout.module.css';

const SUPPORT_TG = 'https://t.me/AnyFormsBot';

const GuideSuccess = () => {
  // Т-Касса возвращает на FailURL с ?status=fail — показываем, что оплата не прошла,
  // и ведём обратно на чекаут; без параметра (или status=success) — обычный успех.
  const [searchParams] = useSearchParams();
  const isFail = searchParams.get('status') === 'fail';

  return (
    <div className={styles.page} id="top">
      <LandingHeader
        logo={{
          href: '/guide',
          ariaLabel: 'anyforms — к гайду',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
        }}
        navLinks={[]}
        navAriaLabel="Разделы"
        rightItems={[
          { key: 'guide', kind: 'link', to: '/guide', label: 'К гайду', variant: 'pill' },
        ]}
        mobileMenuId="success-mobile-menu"
        mobileTopItems={[
          { key: 'guide-m', kind: 'link', to: '/guide', label: 'К гайду', variant: 'primary' },
        ]}
      />

      <main className={styles.main}>
        <div className={`${styles.inner} ${styles.successInner}`}>
          {isFail ? (
            <>
              <div className={`${styles.successMark} ${styles.failMark}`} aria-hidden>
                ✕
              </div>
              <h1 className={styles.title}>Оплата не прошла</h1>
              <p className={styles.successLead}>
                Деньги не списаны. Попробуйте оплатить ещё раз — иногда банк отклоняет
                платёж с первого раза.
              </p>
            </>
          ) : (
            <>
              <div className={styles.successMark} aria-hidden>
                ✓
              </div>
              <h1 className={styles.title}>Оплата прошла успешно</h1>
              <p className={styles.successLead}>
                Спасибо за покупку! Мы отправили гайд на вашу электронную почту. Проверьте
                входящие — если письма нет в течение нескольких минут, загляните в папку
                «Спам» или «Промоакции».
              </p>
            </>
          )}

          <p className={styles.support}>
            {isFail ? 'Не получается оплатить или есть вопросы?' : 'Письмо не пришло или есть вопросы?'}
            {' '}Напишите нам в Telegram{' '}
            <a
              className={styles.inlineLink}
              href={SUPPORT_TG}
              target="_blank"
              rel="noopener noreferrer"
            >
              @AnyFormsBot
            </a>
            {' '}— поможем.
          </p>

          <p className={styles.backWrap}>
            <Link className={styles.back} to={isFail ? '/guide/checkout' : '/guide'}>
              {isFail ? '← Попробовать ещё раз' : '← Вернуться к гайду'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default GuideSuccess;

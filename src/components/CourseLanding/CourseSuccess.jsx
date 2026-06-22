import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from '../GuideLanding/GuideCheckout.module.css';

const LAUNCH = '10 июля 2026';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';

const CourseSuccess = () => {
  return (
    <div className={styles.page} id="top">
      <LandingHeader
        logo={{
          href: '/course',
          ariaLabel: 'anyforms — к курсу',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
        }}
        navLinks={[]}
        navAriaLabel="Разделы"
        rightItems={[
          { key: 'course', kind: 'link', to: '/course', label: 'К курсу', variant: 'pill' },
        ]}
        mobileMenuId="success-mobile-menu"
        mobileTopItems={[
          { key: 'course-m', kind: 'link', to: '/course', label: 'К курсу', variant: 'primary' },
        ]}
      />

      <main className={styles.main}>
        <div className={`${styles.inner} ${styles.successInner}`}>
          <div className={styles.successMark} aria-hidden>
            ✓
          </div>
          <h1 className={styles.title}>Предзаказ оформлен</h1>
          <p className={styles.successLead}>
            Спасибо за оплату! Доступ к курсу откроется {LAUNCH} — мы пришлём ссылку на
            указанную почту. На неё уже отправлено письмо-подтверждение: проверьте
            входящие, а если письма нет в течение нескольких минут — папку «Спам» или
            «Промоакции».
          </p>

          <p className={styles.support}>
            Письмо не пришло или есть вопросы? Напишите нам в Telegram{' '}
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
            <Link className={styles.back} to="/course">
              ← Вернуться к курсу
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default CourseSuccess;

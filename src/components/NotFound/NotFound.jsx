import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CTAButton from '../shared/CTAButton/CTAButton';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './NotFound.module.css';

const TELEGRAM_DEFAULT = 'https://t.me/AnyFormsBot';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';

const HEADER_NAV_LINKS = [
  { key: 'print', label: 'Печать', to: '/3d-print' },
  { key: 'chief', label: 'Кондитеры', to: '/chief' },
  { key: 'shop', label: 'Магазин молдов', to: '/shop' },
];

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <LandingHeader
        logo={{
          href: '/',
          ariaLabel: 'anyforms — на главную',
          src: '/anyforms_logo_new_white.svg',
          width: 200,
          height: 46,
          onClick: (event) => {
            event.preventDefault();
            navigate('/');
          },
        }}
        navLinks={HEADER_NAV_LINKS}
        navAriaLabel="Разделы сайта"
        rightItems={[
          {
            key: 'home',
            kind: 'link',
            label: 'На главную',
            variant: 'pill',
            to: '/',
          },
        ]}
        mobileMenuId="notfound-mobile-menu"
        mobileTopItems={[
          {
            key: 'home-mobile',
            kind: 'link',
            label: 'На главную',
            variant: 'primary',
            to: '/',
          },
        ]}
      />

      <section className={styles.hero} aria-label="Страница не найдена">
        <div className={styles.heroCard}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>Страница не найдена</h1>
          <p className={styles.text}>
            Возможно, ссылка устарела или была введена с ошибкой.
            <br />
            Вернитесь на главную или напишите нам — поможем.
          </p>
          <div className={styles.actions}>
            <CTAButton href="/">На главную</CTAButton>
            <CTAButton
              href={TELEGRAM_DEFAULT}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryCta}
            >
              Написать нам
            </CTAButton>
          </div>
        </div>
      </section>

      <footer className={styles.siteFooter}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBlock}>
            <h2 className={styles.footerHeading}>О компании</h2>
            <p className={styles.footerText}>
              ИП Суворов Дмитрий Игоревич
              <br />
              ИНН 590699241510
              <br />
              Юридический адрес: г. Санкт-Петербург, ул. Заречная, д. 36, корп. 1, кв. 404
            </p>
          </div>
          <div className={styles.footerBlock}>
            <h2 className={styles.footerHeading}>Контакты</h2>
            <p className={styles.footerText}>
              <a className={styles.footerLink} href={`tel:${PHONE_E164.replace(/\D/g, '')}`}>
                +7&nbsp;981&nbsp;040-39-53
              </a>
              <br />
              <a className={styles.footerLink} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              <br />
              <a
                className={styles.footerLink}
                href={TG_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram — канал
              </a>
              <br />
              <a
                className={styles.footerLink}
                href={TELEGRAM_DEFAULT}
                target="_blank"
                rel="noopener noreferrer"
              >
                Связаться с менеджером
              </a>
            </p>
          </div>
        </div>
        <p className={styles.footerLegal}>
          <Link to="/chief/privacy" className={styles.footerLegalLink}>
            Политика конфиденциальности
          </Link>
        </p>
        <p className={styles.footerCopyright}>© anyforms, 2026. Все права защищены</p>
      </footer>
    </div>
  );
};

export default NotFound;

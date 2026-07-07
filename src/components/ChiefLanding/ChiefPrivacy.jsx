import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ChiefLanding.module.css';

const ChiefPrivacy = () => (
  <div className={styles.privacyPage} id="top">
    <header className={`${styles.siteHeader} ${styles.siteHeaderPrivacy}`}>
      <div className={styles.siteHeaderInner}>
        <Link className={styles.logoLink} to="/chief" aria-label="anyforms — лендинг">
          <img
            className={styles.logo}
            src="/anyforms_logo_new_white.svg"
            alt=""
            width={200}
            height={46}
            decoding="async"
          />
        </Link>
      </div>
    </header>
    <main className={styles.privacyMain}>
      <h1 className={styles.privacyTitle}>Политика конфиденциальности</h1>
      <div className={styles.privacyBody}>
        <p>
          Мы собираем только имя и номер телефона, которые вы указываете в форме на сайте.
        </p>
        <p>
          Эти данные нужны, чтобы мы могли с вами связаться и обсудить вашу заявку.
        </p>
        <p>
          Данные передаются в amoCRM для обработки заявки и дальнейшей коммуникации.
        </p>
      </div>
      <p className={styles.privacyBackWrap}>
        <Link className={styles.privacyBack} to="/chief">
          ← На главную
        </Link>
      </p>
    </main>
  </div>
);

export default ChiefPrivacy;

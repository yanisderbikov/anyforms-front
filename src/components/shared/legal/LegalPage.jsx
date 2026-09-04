import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../LandingHeader/LandingHeader';
import { LEGAL_LINKS } from '../../../shared/seller';
import styles from './LegalPage.module.css';

/* Нейтральная страница юр-документа для всего сайта (политика, оферта магазина).
   Гайд и курс рендерят те же документы в своих тематических раскладках
   (GuideLegal / CourseLegal), здесь — общий вид под главную и магазин. */
const LegalPage = ({ doc, backTo = '/', backLabel = '← На главную', headerLabel = 'Главная' }) => (
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
      rightItems={[{ key: 'back', kind: 'link', to: backTo, label: headerLabel, variant: 'pill' }]}
      mobileMenuId="legal-mobile-menu"
      mobileTopItems={[{ key: 'back-m', kind: 'link', to: backTo, label: headerLabel, variant: 'primary' }]}
    />
    <main className={styles.main}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>Документы</span>
        <h1 className={styles.title}>{doc.title}</h1>
        {doc.updated && <p className={styles.updated}>Редакция от {doc.updated}</p>}
        <div className={styles.body}>
          <p>{doc.intro}</p>
          {doc.sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className={styles.h2}>
                {i + 1}. {section.heading}
              </h2>
              {section.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </section>
          ))}
          <p>
            Актуальные реквизиты продавца —{' '}
            <Link to={LEGAL_LINKS.requisites} className={styles.inlineLink}>
              на странице реквизитов
            </Link>
            .
          </p>
        </div>
        <p className={styles.backWrap}>
          <Link className={styles.back} to={backTo}>
            {backLabel}
          </Link>
        </p>
      </div>
    </main>
  </div>
);

export default LegalPage;

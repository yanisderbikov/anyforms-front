import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import { GUIDE_OFFER, SITE_PRIVACY } from '../shared/legal/legalDocs';
import styles from './GuideLegal.module.css';

// Юр-тексты под продавца — ИП Суворов Д. И. Источник — модуль legalDocs (см. OWNER_ACTIONS).
// Политика одна на весь сайт (SITE_PRIVACY), здесь она в раскладке гайда.

const LegalLayout = ({ doc }) => (
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
        { key: 'guide', kind: 'link', to: '/guide', label: 'Гайд', variant: 'pill' },
      ]}
      mobileMenuId="legal-mobile-menu"
      mobileTopItems={[
        { key: 'guide-m', kind: 'link', to: '/guide', label: 'Гайд', variant: 'primary' },
      ]}
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
            <Link to="/requisites?from=guide" className={styles.inlineLink}>
              на странице реквизитов
            </Link>
            .
          </p>
        </div>
        <p className={styles.backWrap}>
          <Link className={styles.back} to="/guide">
            ← К гайду
          </Link>
        </p>
      </div>
    </main>
  </div>
);

export const GuideOffer = () => <LegalLayout doc={GUIDE_OFFER} />;

export const GuidePrivacy = () => <LegalLayout doc={SITE_PRIVACY} />;

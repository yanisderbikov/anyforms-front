import React from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import { COURSE_OFFER, buildPrivacy } from '../shared/legal/legalDocs';
import styles from '../GuideLanding/GuideLegal.module.css';

// Юр-тексты под продавца-самозанятого (НПД). Источник — модуль legalDocs (см. OWNER_ACTIONS).
const COURSE_PRIVACY = buildPrivacy('курс');

const LegalLayout = ({ doc }) => (
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
        { key: 'course', kind: 'link', to: '/course', label: 'Курс', variant: 'pill' },
      ]}
      mobileMenuId="legal-mobile-menu"
      mobileTopItems={[
        { key: 'course-m', kind: 'link', to: '/course', label: 'Курс', variant: 'primary' },
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
            <Link to="/founders/yuri?from=course" className={styles.inlineLink}>
              на странице реквизитов
            </Link>
            .
          </p>
        </div>
        <p className={styles.backWrap}>
          <Link className={styles.back} to="/course">
            ← К курсу
          </Link>
        </p>
      </div>
    </main>
  </div>
);

export const CourseOffer = () => <LegalLayout doc={COURSE_OFFER} />;

export const CoursePrivacy = () => <LegalLayout doc={COURSE_PRIVACY} />;

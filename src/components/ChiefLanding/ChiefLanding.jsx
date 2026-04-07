import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './ChiefLanding.module.css';

const TG_BOT = 'https://t.me/AnyFormsChiefBot';

/**
 * Все логотипы из public/landing/logos.
 * Добавили файл — добавьте строку (имя файла как на диске).
 */
const LOGO_FILES = [
  { file: 'birch.svg', alt: 'Birch' },
  { file: 'cristal_logo.svg', alt: 'Cristal' },
  { file: 'selfie logo.svg', alt: 'Selfie' },
  { file: 'Lotte_logo.svg.png', alt: 'Lotte' },
  { file: 'JISCO_LOGO_RGB_orang.png', alt: 'JISCO' },
  { file: 'rene.webp', alt: 'René' },
];

const PARTNER_LOGOS = LOGO_FILES.map(({ file, alt }) => ({
  src: `/landing/logos/${encodeURIComponent(file)}`,
  alt,
}));

const NAV = [
  { id: 'about', label: 'о нас' },
  { id: 'cases', label: 'кейсы' },
  { id: 'contacts', label: 'контакты' },
];

const HERO_IMAGES = {
  main: '/landing/main/main.jpeg',
  top: '/landing/main/Cristal.jpeg',
  bottom: '/landing/main/Kona.jpeg',
  rene: '/landing/main/Rene.jpeg',
};

const ChiefLanding = () => {
  const [idea, setIdea] = useState('');

  const openTelegram = () => {
    window.open(TG_BOT, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    const text = idea.trim();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Текст скопирован — вставьте его в чат с ботом');
      } catch {
        toast.error('Не удалось скопировать — скопируйте текст вручную');
      }
    }
    openTelegram();
  };

  const scrollToSection = useCallback((e, sectionId) => {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className={styles.page} id="top">
      <header className={styles.siteHeader}>
        <a
          className={styles.logoLink}
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="AnyForms — наверх"
        >
          <img
            className={styles.logo}
            src="/anyforms_logo_new_white.svg"
            alt=""
            width={200}
            height={46}
            decoding="async"
          />
        </a>
        <div className={styles.headerRight}>
          <nav className={styles.nav} aria-label="Разделы страницы">
            {NAV.map(({ id, label }) => (
              <a
                key={id}
                className={`${styles.navLink} ${id === 'contacts' ? styles.navLinkPill : ''}`}
                href={`#${id}`}
                onClick={(e) => scrollToSection(e, id)}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className={styles.hero} aria-label="Главный экран">
        <div className={styles.heroGrid}>
          <div className={styles.heroInfoCard}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Силиконовые молды</span>
              <span
                  className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}
              >
                для масла
              </span>
              <span
                  className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}
              >
                и десертов
              </span>
            </h1>

            <p className={styles.heroTagline}>
              мы работаем с силиконом более 5 лет. реализовали более 1000
              заказов.
            </p>

            <a
                className={styles.cta}
                href={TG_BOT}
                target="_blank"
                rel="noopener noreferrer"
            >
              Обсудить проект
              <span className={styles.ctaArrow} aria-hidden>
                →
              </span>
            </a>

            <div className={styles.heroPartnersBlock}>
              <p className={styles.heroPartnersTitle}>Нам доверяют:</p>
              <div className={styles.heroPartners} aria-label="С нами работали">
                {PARTNER_LOGOS.map((logo) => (
                    <img key={logo.src} src={logo.src} alt={logo.alt} loading="lazy"/>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.heroMainMedia}>
              <img
                className={styles.heroImage}
                src={HERO_IMAGES.main}
                alt=""
                width={960}
                height={1280}
                decoding="async"
              />
            </div>
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img
                  className={styles.heroImage}
                  src={HERO_IMAGES.top}
                  alt=""
                  width={640}
                  height={640}
                  decoding="async"
                />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.bottom}
                    alt=""
                    width={640}
                    height={640}
                    decoding="async"
                  />
                </div>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.rene}
                    alt=""
                    width={640}
                    height={640}
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.about} id="about" aria-labelledby="about-title">
        <div className={styles.sectionInner}>
          <h2 className={styles.blockTitle} id="about-title">
            о нас
          </h2>
          <p className={styles.aboutLead}>
            Работаем с силиконом больше пяти лет: от форм для масла и десертов
            до сложных решений под кухню и витрину.
          </p>
          <p className={styles.aboutText}>
            Реализовали свыше тысячи заказов — знаем, как совместить эстетику,
            пищевую безопасность и удобство в работе.
          </p>
        </div>
      </div>

      <div
        className={styles.cases}
        id="cases"
        aria-labelledby="cases-title"
      >
        <div className={styles.sectionInner}>
          <h2 className={styles.blockTitle} id="cases-title">
            кейсы
          </h2>
          <p className={styles.casesLead}>с нами работали</p>
          <ul className={styles.casesList}>
            {PARTNER_LOGOS.map((logo) => (
              <li key={logo.src}>{logo.alt}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.offer} aria-label="Что предлагаем">
        <div className={styles.offerInner}>
          <h2 className={styles.sectionTitle}>Что предлагаем сделать</h2>
          <p className={styles.offerHighlight}>
            Визуализация для вашего заведения
          </p>
          <p className={styles.sectionLead}>
            Расскажите о задаче — мы покажем, как может выглядеть продукт в
            вашем формате. Вы получаете понятную картинку до производства и
            можете согласовать детали без лишних итераций.
          </p>

          <ol className={styles.steps}>
            <li>
              <span className={styles.stepTitle}>Напишите нам</span>
            </li>
            <li>
              <span className={styles.stepTitle}>Опишите вашу идею</span>
              <ul className={styles.stepSublist}>
                <li>Это может быть масло</li>
                <li>Или любой другой десерт</li>
              </ul>
            </li>
            <li>
              <span className={styles.stepTitle}>
                Получите 3D-визуализацию вашего проекта
              </span>
              <span className={styles.stepDesc}>
                Готовим визуал под ваш бренд и подачу в заведении.
              </span>
            </li>
          </ol>
        </div>
      </div>

      <div
        className={styles.contacts}
        id="contacts"
        aria-labelledby="contacts-title"
      >
        <div className={styles.sectionInner}>
          <h2 className={styles.blockTitle} id="contacts-title">
            контакты
          </h2>
          <p className={styles.contactsLead}>
            Напишите в Telegram — ответим и обсудим задачу без лишней бюрократии.
          </p>
          <a
            className={styles.contactsTg}
            href={TG_BOT}
            target="_blank"
            rel="noopener noreferrer"
          >
            @AnyFormsChiefBot
          </a>

          <div className={styles.capture}>
            <h3 className={styles.captureTitle}>Отправить свою идею</h3>
            <form className={styles.form} onSubmit={handleSubmitIdea}>
              <label className={styles.label} htmlFor="chief-idea">
                Ваш запрос
              </label>
              <textarea
                id="chief-idea"
                className={styles.textarea}
                rows={5}
                placeholder="Опишите идею: форма, объём, референсы…"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <button type="submit" className={styles.submit}>
                Отправить свою идею
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiefLanding;

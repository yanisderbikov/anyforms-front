import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './ChiefLanding.module.css';

const TG_BOT = 'https://t.me/AnyFormsChiefBot';

/**
 * Все логотипы из public/landing/logos.
 * Добавили файл — добавьте строку (имя файла как на диске).
 */
const LOGO_FILES = [
  { file: 'Birch.svg', alt: 'Birch' },
  { file: 'Cristal.svg', alt: 'Cristal' },
  { file: 'Selfie.svg', alt: 'Selfie' },
  { file: 'Lotte.svg', alt: 'Lotte' },
];

const PARTNER_LOGOS = LOGO_FILES.map(({ file, alt }) => ({
  src: `/landing/logos/${encodeURIComponent(file)}`,
  alt,
}));

const NAV = [{ id: 'marketing', label: '3d бесплатно' }];

/** Три фото: слева main, справа сверху hachapuri, справа снизу blue */
const HERO_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/landing/main.jpeg',
  hachapuri: 'https://storage.yandexcloud.net/anyforms/landing/hachapuri.jpeg',
  blue: 'https://storage.yandexcloud.net/anyforms/landing/blue.jpeg',
};

const ChiefLanding = () => {
  const [idea, setIdea] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const openTelegram = () => {
    window.open(TG_BOT, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    const values = {
      name: name.trim(),
      contact: contact.trim(),
      idea: idea.trim(),
      attachmentName: attachmentName.trim(),
    };
    const text = [
      'Заявка на 3D-визуализацию',
      `Имя: ${values.name || '—'}`,
      `Телефон / WhatsApp / Telegram: ${values.contact || '—'}`,
      `Описание идеи: ${values.idea || '—'}`,
      `Фото: ${values.attachmentName || 'файл не прикреплен'}`,
    ].join('\n');
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
              <span className={styles.heroTitleLine}>Силиконовые формы</span>
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
              мы работаем с силиконом более 5 лет.
              <br />
              реализовали более 1000 заказов.
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
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img
                  className={styles.heroImage}
                  src={HERO_IMAGES.main}
                  alt=""
                  width={960}
                  height={1280}
                  decoding="async"
                  loading="eager"
                />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.hachapuri}
                    alt=""
                    width={800}
                    height={600}
                    decoding="async"
                    loading="eager"
                  />
                </div>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.blue}
                    alt=""
                    width={800}
                    height={600}
                    decoding="async"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        className={styles.marketing}
        id="marketing"
        aria-labelledby="marketing-title"
      >
        <div className={styles.marketingGrid}>
          <div className={styles.marketingFormCard}>
            <h2 className={styles.marketingFormTitle}>Отправить идею</h2>
            <form className={styles.form} onSubmit={handleSubmitIdea}>
              <label className={styles.label} htmlFor="chief-name">
                Имя
              </label>
              <input
                id="chief-name"
                className={styles.input}
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className={styles.label} htmlFor="chief-contact">
                Телефон / WhatsApp / Telegram
              </label>
              <input
                id="chief-contact"
                className={styles.input}
                type="text"
                placeholder="+7 999 000-00-00 / @username"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />

              <label className={styles.label} htmlFor="chief-idea">
                Описание идеи или фото
              </label>
              <textarea
                id="chief-idea"
                className={styles.textarea}
                rows={5}
                placeholder="Опишите идею: форма, объем, референсы..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />

              <label className={styles.fileLabel} htmlFor="chief-photo">
                Прикрепить фото
              </label>
              <input
                id="chief-photo"
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={(e) => setAttachmentName(e.target.files?.[0]?.name || '')}
              />
              {attachmentName ? (
                <p className={styles.fileName}>Выбран файл: {attachmentName}</p>
              ) : null}

              <button type="submit" className={styles.submit}>
                Сделать 3D бесплатно
              </button>
            </form>
          </div>

          <div className={styles.marketingInfoCard}>
            <h2 className={styles.marketingTitle} id="marketing-title">
              Визуализируем вашу идею в 3D
            </h2>
            <ul className={styles.marketingList}>
              <li>Вы отправляете идею или референс.</li>
              <li>Мы продумываем реализацию и делаем 3D-визуализацию формы.</li>
              <li>
                Вы сразу понимаете, как это будет выглядеть и стоит ли запускать.
              </li>
            </ul>

            <a
              className={styles.cta}
              href={TG_BOT}
              target="_blank"
              rel="noopener noreferrer"
            >
              Сделать 3D бесплатно
              <span className={styles.ctaArrow} aria-hidden>
                →
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChiefLanding;

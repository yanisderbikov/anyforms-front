import React, { useCallback, useEffect, useRef, useState } from 'react';
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
const MARKETING_MODEL_SRC = encodeURI('/landing/stl/ytka.glb');
const MODEL_VIEWER_SCRIPT_ID = 'model-viewer-script';
const MODEL_MAX_ROTATION_DEG = 10;
const MODEL_BASE_YAW_DEG = 120;

const ChiefLanding = () => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const marketingSectionRef = useRef(null);
  const marketingModelRef = useRef(null);

  const openTelegram = () => {
    window.open(TG_BOT, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    const values = {
      name: name.trim(),
      contact: contact.trim(),
    };
    const text = [
      'Заявка на 3D-визуализацию',
      `Имя: ${values.name || '—'}`,
      `Телефон / WhatsApp / Telegram: ${values.contact || '—'}`,
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

  useEffect(() => {
    if (!customElements.get('model-viewer') && !document.getElementById(MODEL_VIEWER_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = MODEL_VIEWER_SCRIPT_ID;
      script.type = 'module';
      script.src =
        'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const section = marketingSectionRef.current;
    const modelViewer = marketingModelRef.current;
    if (!section || !modelViewer) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      const rect = section.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const centeredX = (x - 0.5) * 2;
      const centeredY = (y - 0.5) * 2;

      const yaw = MODEL_BASE_YAW_DEG + centeredX * MODEL_MAX_ROTATION_DEG;
      const pitch = 75 + centeredY * (MODEL_MAX_ROTATION_DEG * 0.45);
      modelViewer.cameraOrbit = `${yaw.toFixed(2)}deg ${pitch.toFixed(2)}deg auto`;
    };

    const handlePointerLeave = () => {
      modelViewer.cameraOrbit = `${MODEL_BASE_YAW_DEG}deg 75deg auto`;
    };

    section.addEventListener('pointermove', handlePointerMove);
    section.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      section.removeEventListener('pointermove', handlePointerMove);
      section.removeEventListener('pointerleave', handlePointerLeave);
    };
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
              <br/>
              реализовали более 1000 заказов.
            </p>

            <div className={styles.heroPartnersBlock}>
              <p className={styles.heroPartnersTitle}>Нам доверяют:</p>
              <div className={styles.heroPartners} aria-label="С нами работали">
                {PARTNER_LOGOS.map((logo) => (
                    <img key={logo.src} src={logo.src} alt={logo.alt} loading="lazy"/>
                ))}
              </div>
            </div>
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
        ref={marketingSectionRef}
      >
        <div className={styles.marketingModelLayer} aria-hidden>
          <model-viewer
            ref={marketingModelRef}
            className={styles.marketingModel}
            src={MARKETING_MODEL_SRC}
            camera-controls
            camera-orbit={`${MODEL_BASE_YAW_DEG}deg 75deg 120%`}
            min-camera-orbit="auto auto 80%"
            max-camera-orbit="auto auto 180%"
            disable-zoom
            field-of-view="24deg"
            interaction-prompt="none"
            shadow-intensity="0"
            exposure="1"
            alt=""
          />
        </div>
        <div className={styles.marketingGrid}>
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
          </div>

          <div className={styles.marketingFormCard}>
            <h2 className={styles.marketingFormTitle}>Заполните форму</h2>
            <p className={styles.marketingFormLead}>
              Мы свяжемся с вами, уточним идею и подготовим 3D-визуализацию
            </p>
            <form className={styles.form} onSubmit={handleSubmitIdea}>
              <div className={styles.field}>
                <input
                  id="chief-name"
                  className={styles.input}
                  type="text"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label className={styles.floatingLabel} htmlFor="chief-name">
                  Имя
                </label>
              </div>

              <div className={styles.field}>
                <input
                  id="chief-contact"
                  className={styles.input}
                  type="text"
                  placeholder=" "
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
                <label className={styles.floatingLabel} htmlFor="chief-contact">
                  Телефон / WhatsApp / Telegram
                </label>
              </div>

              <button type="submit" className={`${styles.cta} ${styles.ctaSubmit}`}>
                Сделать 3D бесплатно
                <span className={styles.ctaArrow} aria-hidden>
                  →
                </span>
              </button>
              <p className={styles.formDisclaimer}>
                Нажимая на кнопку вы соглашаетесь с условиями обработки данных и
                политикой конфиденциальности
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChiefLanding;

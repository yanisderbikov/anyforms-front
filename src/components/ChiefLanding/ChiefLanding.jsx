import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import CTAButton from '../shared/CTAButton/CTAButton';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './ChiefLanding.module.css';

const LANDING_LEAD_NAME = 'Заявка с леднига - версия 1';

const TG_BOT = 'https://t.me/AnyFormsChiefBot';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';

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

const NAV = [
  { id: 'marketing', label: '3d бесплатно' },
  { id: 'team', label: 'о команде' },
  { id: 'reviews', label: 'отзывы' },
];

/** Три фото: слева main, справа сверху hachapuri, справа снизу blue */
const HERO_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/landing/main.jpeg',
  hachapuri: 'https://storage.yandexcloud.net/anyforms/landing/labubu-jisco.jpeg',
  blue: 'https://storage.yandexcloud.net/anyforms/landing/blue.jpeg',
};
const TRUST_CASE_IMAGES = {
  mold: 'https://storage.yandexcloud.net/anyforms/landing/Cristal-mold.jpg',
  result: 'https://storage.yandexcloud.net/anyforms/landing/cristal-result.jpeg',
};
const BRAND_MEMORY_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/landing/Selfie-Brown-Cake.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/landing/Selfie-Cake.jpg',
  bottom: 'https://storage.yandexcloud.net/anyforms/landing/Selfie-Gold-Cake.jpg',
};
const TEAM_IMAGE = 'https://storage.yandexcloud.net/anyforms/landing/team.jpeg';
const PROCESS_IMAGES = [
  {
    src: 'https://storage.yandexcloud.net/anyforms/landing/single-3d.jpeg',
    alt: '3D-модель формы',
  },
  {
    src: 'https://storage.yandexcloud.net/anyforms/landing/single-mold.jpeg',
    alt: 'Силиконовая форма',
  },
  {
    src: 'https://storage.yandexcloud.net/anyforms/landing/single-shipping.jpg',
    alt: 'Упаковка и отгрузка',
  },
  {
    src: 'https://storage.yandexcloud.net/anyforms/landing/single-result.jpeg',
    alt: 'Готовый десерт',
  },
];
const REVIEW_IMAGES = Array.from({ length: 16 }, (_, i) => ({
  src: `https://storage.yandexcloud.net/anyforms/landing/review/review-${i}.jpeg`,
  alt: `Отзыв клиента ${i + 1}`,
}));
const CLOSING_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/landing/duck-1.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/landing/duck-2.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/landing/duck-3.jpeg',
};

const MARKETING_MODEL_SRC = encodeURI('/landing/stl/ytka4.glb');
const MODEL_VIEWER_SCRIPT_ID = 'model-viewer-script';
const MODEL_MAX_ROTATION_DEG = 10;
const MODEL_BASE_YAW_DEG = 120;
const MODEL_SCROLL_PITCH_SHIFT_DEG = 20;
const HERO_TITLE_PREFIX = 'ДЛЯ';
const HERO_VARIANTS = [
  'РЕСТОРАНОВ',
  'КОНДИТЕРОВ',
  'ФУД-БРЕНДОВ'];

const ChiefLanding = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [leadSent, setLeadSent] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [typedHeroText, setTypedHeroText] = useState(HERO_VARIANTS[0]);
  const [heroVariantIndex, setHeroVariantIndex] = useState(0);
  const [isDeletingHeroText, setIsDeletingHeroText] = useState(false);
  const marketingSectionRef = useRef(null);
  const marketingModelRef = useRef(null);
  const pointerYawOffsetRef = useRef(0);
  const pointerPitchOffsetRef = useRef(0);
  const scrollPitchOffsetRef = useRef(0);

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setPhoneInvalid(true);
      return;
    }
    setPhoneInvalid(false);
    setLeadSubmitting(true);
    try {
      const { data } = await apiClient.api.createLead({
        leadName: LANDING_LEAD_NAME,
        name: name.trim() || undefined,
        phone: trimmedPhone,
      });
      if (data?.success === false) {
        toast.error(data?.error || 'Не удалось отправить заявку');
        return;
      }
      setLeadSent(true);
    } catch (err) {
      const fromApi = err.response?.data?.error;
      toast.error(
        typeof fromApi === 'string' ? fromApi : 'Не удалось отправить заявку'
      );
    } finally {
      setLeadSubmitting(false);
    }
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

    const applyCameraOrbit = () => {
      const yaw = MODEL_BASE_YAW_DEG + pointerYawOffsetRef.current;
      const pitch = 75 + pointerPitchOffsetRef.current + scrollPitchOffsetRef.current;
      modelViewer.cameraOrbit = `${yaw.toFixed(2)}deg ${pitch.toFixed(2)}deg auto`;
    };

    const updateScrollPitch = () => {
      const rect = section.getBoundingClientRect();
      const viewportCenterY = window.innerHeight / 2;
      const sectionCenterY = rect.top + rect.height / 2;
      const maxDistance = Math.max(window.innerHeight / 2 + rect.height / 2, 1);
      const normalized = (viewportCenterY - sectionCenterY) / maxDistance;
      const clamped = Math.max(-1, Math.min(1, normalized));
      scrollPitchOffsetRef.current = clamped * MODEL_SCROLL_PITCH_SHIFT_DEG;
      applyCameraOrbit();
    };

    const handlePointerMove = (event) => {
      const rect = section.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const centeredX = (x - 0.5) * 2;
      const centeredY = (y - 0.5) * 2;

      pointerYawOffsetRef.current = centeredX * MODEL_MAX_ROTATION_DEG;
      pointerPitchOffsetRef.current = centeredY * (MODEL_MAX_ROTATION_DEG * 0.45);
      applyCameraOrbit();
    };

    const handlePointerLeave = () => {
      pointerYawOffsetRef.current = 0;
      pointerPitchOffsetRef.current = 0;
      applyCameraOrbit();
    };

    updateScrollPitch();
    window.addEventListener('scroll', updateScrollPitch, { passive: true });
    window.addEventListener('resize', updateScrollPitch);
    section.addEventListener('pointermove', handlePointerMove);
    section.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('scroll', updateScrollPitch);
      window.removeEventListener('resize', updateScrollPitch);
      section.removeEventListener('pointermove', handlePointerMove);
      section.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    const currentTarget = HERO_VARIANTS[heroVariantIndex];
    const isTypingFinished = typedHeroText === currentTarget;
    const isErased = typedHeroText.length === 0;

    const timeout = window.setTimeout(
      () => {
        if (!isDeletingHeroText && !isTypingFinished) {
          setTypedHeroText(currentTarget.slice(0, typedHeroText.length + 1));
          return;
        }

        if (!isDeletingHeroText && isTypingFinished) {
          setIsDeletingHeroText(true);
          return;
        }

        if (isDeletingHeroText && !isErased) {
          setTypedHeroText((prev) => prev.slice(0, -1));
          return;
        }

        if (isDeletingHeroText && isErased) {
          setIsDeletingHeroText(false);
          setHeroVariantIndex((prev) => (prev + 1) % HERO_VARIANTS.length);
        }
      },
      !isDeletingHeroText && isTypingFinished
        ? 3900
        : isDeletingHeroText
          ? 50
          : 85
    );

    return () => window.clearTimeout(timeout);
  }, [typedHeroText, heroVariantIndex, isDeletingHeroText]);

  return (
      <div className={styles.page} id="top">
        <LandingHeader
          logo={{
            href: '#top',
            ariaLabel: 'AnyForms — наверх',
            src: '/anyforms_logo_new_white.svg',
            width: 200,
            height: 46,
            onClick: (e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
          }}
          navLinks={NAV.map(({ id, label }) => ({
            key: id,
            kind: 'link',
            href: `#${id}`,
            label,
            onClick: (e) => scrollToSection(e, id),
          }))}
          navAriaLabel="Разделы страницы"
          rightItems={[
            {
              key: 'phone',
              kind: 'link',
              href: `tel:${PHONE_E164.replace(/\D/g, '')}`,
              label: '+7 981 040-39-53',
              variant: 'phone',
            },
            {
              key: 'contact',
              kind: 'link',
              href: TG_BOT,
              label: 'Связаться',
              target: '_blank',
              rel: 'noopener noreferrer',
              variant: 'pill',
            },
          ]}
          mobileMenuId="chief-mobile-menu"
          mobileLinks={[...NAV].reverse().map(({ id, label }) => ({
            key: id,
            kind: 'link',
            href: `#${id}`,
            label,
            onClick: (e) => scrollToSection(e, id),
          }))}
          mobileTopItems={[
            {
              key: 'mobile-contact',
              kind: 'link',
              href: TG_BOT,
              label: 'Связаться',
              target: '_blank',
              rel: 'noopener noreferrer',
              variant: 'primary',
            },
            {
              key: 'mobile-phone',
              kind: 'link',
              href: `tel:${PHONE_E164.replace(/\D/g, '')}`,
              label: '+7 981 040-39-53',
            },
          ]}
        />

        <div className={styles.hero} aria-label="Главный экран">
          <div className={styles.heroGrid}>
            <div className={styles.heroInfoCard}>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleLine}>Силиконовые формы</span>
                <span className={`${styles.heroTitleLine} ${styles.heroTypedLine}`}>
                  {HERO_TITLE_PREFIX}{' '}
                  {typedHeroText}
                  <span className={styles.heroCaret} aria-hidden />
                </span>
              </h1>

              <p className={styles.heroTagline}>
                мы работаем с силиконом более 5 лет.
                <br/>
                реализовали 1000+ заказов.
              </p>
              <CTAButton href={TG_BOT} target="_blank" rel="noopener noreferrer">
                Обсудить проект
              </CTAButton>
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
                <li>Отправьте идею</li>
                <li>Сделаем 3D</li>
                <li>Покажем результат</li>
              </ul>
            </div>

            <div
                className={`${styles.marketingFormCard} ${
                  leadSent ? styles.marketingFormCardSent : ''
                }`}
            >
              {leadSent ? (
                <p className={styles.marketingFormSuccessMessage} role="status">
                  Мы с вами свяжемся в течении дня!
                </p>
              ) : (
                <>
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
                          autoComplete="name"
                      />
                      <label className={styles.floatingLabel} htmlFor="chief-name">
                        Имя
                      </label>
                    </div>

                    <div className={styles.field}>
                      <input
                          id="chief-phone"
                          className={`${styles.input} ${
                            phoneInvalid ? styles.inputError : ''
                          }`}
                          type="tel"
                          placeholder=" "
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (phoneInvalid) setPhoneInvalid(false);
                          }}
                          aria-invalid={phoneInvalid}
                          autoComplete="tel"
                      />
                      <label className={styles.floatingLabel} htmlFor="chief-phone">
                        Телефон
                      </label>
                    </div>

                    <button
                        type="submit"
                        className={`${styles.cta} ${styles.ctaSubmit}`}
                        disabled={leadSubmitting}
                    >
                      {leadSubmitting ? 'Отправка…' : 'Сделать 3D бесплатно'}
                      <span className={styles.ctaArrow} aria-hidden>
                        →
                      </span>
                    </button>
                    <p className={styles.formDisclaimer}>
                      Нажимая на кнопку вы соглашаетесь с условиями обработки данных и{' '}
                      <Link to="/chief/privacy" className={styles.formDisclaimerLink}>
                        политикой конфиденциальности
                      </Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        <section className={styles.trustCase} aria-labelledby="trust-case-title">
          <div className={styles.trustCaseInner}>
            <div className={styles.trustCaseLayout}>
              <div className={styles.trustCaseInfoCard}>
                <h2 className={styles.trustCaseTitle} id="trust-case-title">
                  Нам доверяют
                </h2>
                <p className={styles.trustCaseLead}>
                  Производители десертов и масла выбирают нас за
                </p>
                <ul className={styles.trustCaseSubtitle}>
                  <li>Сроки производства: 2-3 недели (до 100 форм)</li>
                  <li>Удобные в работе молды для ежедневного использования</li>
                  <li>3 бесплатные правки 3D-модели</li>
                </ul>
                <div className={styles.trustCasePartners} aria-label="С нами работали">
                  {PARTNER_LOGOS.map((logo) => (
                      <img
                          key={logo.src}
                          className={styles.trustCasePartnerLogo}
                          src={logo.src}
                          alt={logo.alt}
                          loading="lazy"
                      />
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.trustCaseGrid} aria-label="Фото проекта Cristal">
              <article className={styles.trustCaseCard}>
                <p className={styles.trustCaseLabel}>Силиконовый молд для Cristal</p>
                <img
                    className={styles.trustCaseImage}
                    src={TRUST_CASE_IMAGES.mold}
                    alt="Силиконовый молд для десерта Cristal"
                    width={800}
                    height={1067}
                    loading="lazy"
                    decoding="async"
                />
                <p className={styles.trustCaseMeta}>
                  Простой и удобный проект: реализовали за 2 недели и изготовили 50 молдов.
                </p>
              </article>

              <article className={styles.trustCaseCard}>
                <p className={styles.trustCaseLabel}>Готовый десерт</p>
                <img
                    className={styles.trustCaseImage}
                    src={TRUST_CASE_IMAGES.result}
                    alt="Тирамису Cristal с сезонными ягодами и темным шоколадом"
                    width={800}
                    height={533}
                    loading="lazy"
                    decoding="async"
                />
                <p className={styles.trustCaseCaption}>
                  Тирамису Cristal с сезонными ягодами и тёмным шоколадом.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.brandScreen} aria-labelledby="brand-screen-title">
          <div className={styles.heroGrid}>
            <div className={styles.mediaContainer}>
              <div className={styles.heroSideMedia}>
                <div className={styles.heroSideSingle}>
                  <img
                      className={styles.heroImage}
                      src={BRAND_MEMORY_IMAGES.main}
                      alt="Десерт с логотипом Selfie"
                      width={768}
                      height={1024}
                      decoding="async"
                      loading="lazy"
                  />
                </div>
                <div className={styles.heroSideStack}>
                  <div className={styles.heroSideCard}>
                    <img
                        className={styles.heroImage}
                        src={BRAND_MEMORY_IMAGES.top}
                        alt="Десерт Selfie крупным планом"
                        width={827}
                        height={1000}
                        decoding="async"
                        loading="lazy"
                    />
                  </div>
                  <div className={styles.heroSideCard}>
                    <img
                        className={styles.heroImage}
                        src={BRAND_MEMORY_IMAGES.bottom}
                        alt="Золотой десерт Selfie"
                        width={437}
                        height={367}
                        decoding="async"
                        loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.heroInfoCard}>
              <h2 className={styles.heroTitle} id="brand-screen-title">
                <span className={styles.heroTitleLine}>Гости запоминают</span>
                <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                ваш бренд
              </span>
              </h2>
              <ul className={styles.brandScreenList}>
                <li>Логотип на десерте или масле остаётся в памяти</li>
                <li>Гости фотографируют и делятся в соцсетях</li>
                <li>Ваше заведение узнают без лишних слов</li>
              </ul>
              <CTAButton href={TG_BOT} target="_blank" rel="noopener noreferrer">
                Разработать свою идею
              </CTAButton>
            </div>
          </div>
        </section>

        <section
            className={styles.teamScreen}
            id="team"
            aria-labelledby="team-screen-title"
        >
          <div className={styles.heroGrid}>
            <div className={styles.heroInfoCard}>
              <h2 className={styles.heroTitle} id="team-screen-title">
                <span className={styles.heroTitleLine}>Команда, которая</span>
                <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                доводит до результата
              </span>
              </h2>
              <div className={styles.teamMembers}>
                <div className={styles.teamMember}>
                  <p className={styles.teamMemberName}>Юра — бренд и визуал</p>
                  <p className={styles.teamMemberDesc}>
                    Усиливает концепцию и доводит до «вау»
                  </p>
                </div>
                <div className={styles.teamMember}>
                  <p className={styles.teamMemberName}>Дима — производство и качество</p>
                  <p className={styles.teamMemberDesc}>
                    Контролирует результат и не пропускает косяки
                  </p>
                </div>
              </div>
              <ul className={styles.teamStats} aria-label="О команде">
                <li>2 брата</li>
                <li>5+ лет опыта</li>
                <li>Тысячи заказов</li>
              </ul>
              <CTAButton href={TG_BOT} target="_blank" rel="noopener noreferrer">
                Разработать свою идею
              </CTAButton>
            </div>

            <div className={styles.mediaContainer}>
              <div className={styles.teamSingleMedia}>
                <img
                    className={styles.heroImage}
                    src={TEAM_IMAGE}
                    alt=""
                    width={1200}
                    height={800}
                    decoding="async"
                    loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section
            className={styles.brandScreen}
            aria-labelledby="process-transparency-title"
        >
          <div className={styles.heroGrid}>
            <div className={styles.mediaContainer}>
              <div className={styles.processPhotoGrid}>
                {PROCESS_IMAGES.map(({src, alt}) => (
                    <div key={src} className={styles.processPhotoCell}>
                      <img
                          className={styles.processPhotoImg}
                          src={src}
                          alt={alt}
                          width={800}
                          height={800}
                          loading="lazy"
                          decoding="async"
                      />
                    </div>
                ))}
              </div>
            </div>

            <div className={styles.heroInfoCard}>
              <h2 className={styles.heroTitle} id="process-transparency-title">
                <span className={styles.heroTitleLine}>Информируем на каждом</span>
                <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                этапе
              </span>
              </h2>
              <p className={styles.processLead}>
                Наш процесс абсолютно прозрачный. И мы проактивно сообщаем о всех этапах.
              </p>
              <ul className={styles.brandScreenList}>
                <li>Сообщаем, на каком этапе находится заказ</li>
                <li>Показываем процесс: от 3D до готовой формы</li>
                <li>Отправляем фото с производства</li>
                <li>Держим связь до момента получения</li>
              </ul>
              <CTAButton href={TG_BOT} target="_blank" rel="noopener noreferrer">
                Обсудить задачу
              </CTAButton>
            </div>
          </div>
        </section>

        <section
            className={styles.reviewsSection}
            id="reviews"
            aria-labelledby="reviews-title"
        >
          <div className={styles.reviewsHeader}>
            <h2 className={styles.reviewsTitle} id="reviews-title">
              Отзывы
            </h2>
          </div>
          <div
              className={styles.reviewsStrip}
              role="region"
              aria-label="Галерея отзывов, прокрутка вправо"
          >
            {REVIEW_IMAGES.map(({src, alt}) => (
                <div key={src} className={styles.reviewsCard}>
                  <img
                      className={styles.reviewsCardImg}
                      src={src}
                      alt={alt}
                      width={720}
                      height={1280}
                      loading="lazy"
                      decoding="async"
                  />
                </div>
            ))}
          </div>
        </section>

        {/*<section className={styles.teamScreen} aria-labelledby="closing-title">*/}
        {/*  <div className={styles.heroGrid}>*/}
        {/*    <div className={styles.heroInfoCard}>*/}
        {/*      <h2 className={styles.heroTitle} id="closing-title">*/}
        {/*        <span className={styles.heroTitleLine}>Не откладывайте</span>*/}
        {/*        <span*/}
        {/*            className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}*/}
        {/*        >*/}
        {/*          начнём сейчас*/}
        {/*        </span>*/}
        {/*      </h2>*/}
        {/*      <p className={styles.heroTagline}>*/}
        {/*        Достаточно идеи — остальное сделаем мы.*/}
        {/*        <br />*/}
        {/*        Продумаем реализацию и покажем результат в 3D*/}
        {/*      </p>*/}
        {/*      <a*/}
        {/*          className={styles.cta}*/}
        {/*          href={TG_BOT}*/}
        {/*          target="_blank"*/}
        {/*          rel="noopener noreferrer"*/}
        {/*      >*/}
        {/*        Начать*/}
        {/*        <span className={styles.ctaArrow} aria-hidden>*/}
        {/*          →*/}
        {/*        </span>*/}
        {/*      </a>*/}
        {/*    </div>*/}

        {/*    <div className={styles.mediaContainer}>*/}
        {/*      <div className={styles.heroSideMedia}>*/}
        {/*        <div className={styles.heroSideSingle}>*/}
        {/*          <img*/}
        {/*              className={styles.heroImage}*/}
        {/*              src={CLOSING_IMAGES.main}*/}
        {/*              alt=""*/}
        {/*              width={960}*/}
        {/*              height={1280}*/}
        {/*              decoding="async"*/}
        {/*              loading="lazy"*/}
        {/*          />*/}
        {/*        </div>*/}
        {/*        <div className={styles.heroSideStack}>*/}
        {/*          <div className={styles.heroSideCard}>*/}
        {/*            <img*/}
        {/*                className={styles.heroImage}*/}
        {/*                src={CLOSING_IMAGES.top}*/}
        {/*                alt=""*/}
        {/*                width={960}*/}
        {/*                height={1280}*/}
        {/*                decoding="async"*/}
        {/*                loading="lazy"*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*          <div className={styles.heroSideCard}>*/}
        {/*            <img*/}
        {/*                className={styles.heroImage}*/}
        {/*                src={CLOSING_IMAGES.bottom}*/}
        {/*                alt=""*/}
        {/*                width={960}*/}
        {/*                height={1280}*/}
        {/*                decoding="async"*/}
        {/*                loading="lazy"*/}
        {/*            />*/}
        {/*          </div>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</section>*/}

        <section
            className={styles.closingPlain}
            aria-labelledby="closing-plain-title"
        >
          <div className={styles.closingPlainInner}>
            <h2 className={styles.heroTitle} id="closing-plain-title">
              <span className={styles.heroTitleLine}>Не откладывайте</span>
              <span
                  className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}
              >
                начнём сейчас
              </span>
            </h2>
            <p className={styles.heroTagline}>
              Достаточно идеи — остальное сделаем мы.
              <br />
              Продумаем реализацию и покажем результат в 3D
            </p>
            <CTAButton
              href={TG_BOT}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.closingPlainCta}
            >
              Начать
            </CTAButton>
          </div>
        </section>

        <footer className={styles.siteFooter} id="contacts">
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
                  href={TG_BOT}
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
          <p className={styles.footerCopyright}>
            © anyforms, 2026. Все права защищены
          </p>
        </footer>
      </div>
  );
};

export default ChiefLanding;

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CTAButton from '../shared/CTAButton/CTAButton';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './MainLanding.module.css';

const TELEGRAM_DEFAULT = 'https://t.me/AnyFormsBot';
const TELEGRAM_FOOD = 'https://t.me/AnyFormsChiefBot';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';

const HERO_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/shop/heart/7.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/shop/croissant-plain/photo_2026-04-15%2020.27.44.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/shop/samovar/4.jpeg',
};

const STEP_ONE_OPTIONS = [
  'Шеф / ресторан',
  'Кондитер',
  'Свечевар',
  'Гипс / бетон',
  'Другое',
];

const STEP_TWO_BY_AUDIENCE = {
  'Шеф / ресторан': ['Десерт', 'Масло', 'Шоколад', 'Другое'],
  Кондитер: ['Десерт', 'Масло', 'Шоколад', 'Другое'],
  Свечевар: ['Формы для свечей', 'Декор', 'Брендированные формы'],
  'Гипс / бетон': ['Декор', 'Интерьер', 'Массовое производство'],
  Другое: ['Свободный вариант'],
};

const STEP_THREE_OPTIONS = ['1-2', '3-10', '10+', '30+'];
const STEP_FOUR_OPTIONS = ['Есть фото / референс', 'Есть только идея', 'Нужно разработать с нуля'];

const TOTAL_STEPS = 4;
const HERO_VARIANTS = ['ПОД ЗАКАЗ', 'В РОЗНИЦУ', 'ДЛЯ БИЗНЕСА'];
const QUIZ_OFFERS = [
  { discountLabel: '10%', promoCode: 'any-10' },
  { discountLabel: '20%', promoCode: 'any-20' },
  { discountLabel: '5000₽', promoCode: 'any-5000' },
];

const HEADER_NAV_LINKS = [
  { key: 'print', label: '3D-печать корпусов', to: '/3d-print' },
  { key: 'chief', label: 'Кондитеры', to: '/chief' },
  { key: 'shop', label: 'Магазин молдов', to: '/shop' },
];

const StepCard = ({ title, options, value, onSelect }) => {
  return (
    <div className={styles.stepCard}>
      <h2 className={styles.stepTitle}>{title}</h2>
      <div className={styles.optionsGrid}>
        {options.map((option) => {
          const isActive = value === option;
          return (
            <button
              key={option}
              type="button"
              className={`${styles.optionButton} ${isActive ? styles.optionButtonActive : ''}`}
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Progress = ({ currentStep }) => {
  const isCompleted = currentStep > TOTAL_STEPS;
  const normalizedStep = Math.min(currentStep, TOTAL_STEPS);
  const percent = isCompleted
    ? 100
    : normalizedStep === 4
      ? 85
      : Math.round((normalizedStep / TOTAL_STEPS) * 100);
  const stepsLeft = isCompleted ? 0 : TOTAL_STEPS - normalizedStep;
  const stepsLeftText =
    isCompleted
      ? 'Опрос завершен'
      : stepsLeft <= 0
        ? 'Финальный шаг'
        : stepsLeft === 1
          ? 'Остался 1 шаг'
          : stepsLeft < 5
            ? `Осталось ${stepsLeft} шага`
            : `Осталось ${stepsLeft} шагов`;

  const progressToneClass = isCompleted
    ? styles.progressFillCompleted
    : currentStep === 1
      ? styles.progressFillStep1
      : currentStep === 2
        ? styles.progressFillStep2
        : currentStep === 3
          ? styles.progressFillStep3
          : styles.progressFillStep4;

  const stepLabel = isCompleted ? TOTAL_STEPS : normalizedStep;

  return (
    <div className={styles.progressWrap} aria-label="Прогресс квиза">
      <div className={styles.progressMeta}>
        <div className={styles.progressText}>Шаг {stepLabel} из {TOTAL_STEPS}</div>
        <div className={styles.progressHint}>{stepsLeftText}</div>
      </div>
      <div className={styles.progressTrack}>
        <div className={`${styles.progressFill} ${progressToneClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const MainLanding = () => {
  const [answers, setAnswers] = useState({
    audience: '',
    moldType: '',
    quantity: '',
    materials: '',
  });
  const [copied, setCopied] = useState(false);
  const [typedHeroText, setTypedHeroText] = useState(HERO_VARIANTS[0]);
  const [heroVariantIndex, setHeroVariantIndex] = useState(0);
  const [isDeletingHeroText, setIsDeletingHeroText] = useState(false);
  const [selectedOffer] = useState(() => {
    const randomIndex = Math.floor(Math.random() * QUIZ_OFFERS.length);
    return QUIZ_OFFERS[randomIndex];
  });

  const currentStep = useMemo(() => {
    if (!answers.audience) return 1;
    if (!answers.moldType) return 2;
    if (!answers.quantity) return 3;
    if (!answers.materials) return 4;
    return 5;
  }, [answers]);

  const isFoodFlow = answers.audience === 'Шеф / ресторан' || answers.audience === 'Кондитер';
  const managerUrl = isFoodFlow ? TELEGRAM_FOOD : TELEGRAM_DEFAULT;

  const resultText = useMemo(() => {
    return `Здравствуйте!

Хочу рассчитать молд:

ЦА: ${answers.audience || '-'}
Тип: ${answers.moldType || '-'}
Количество: ${answers.quantity || '-'}
Материалы: ${answers.materials || '-'}

Промокод: ${selectedOffer.promoCode}`;
  }, [answers, selectedOffer.promoCode]);

  const secondStepOptions = STEP_TWO_BY_AUDIENCE[answers.audience] || [];
  const reassuranceText =
    currentStep === 2
      ? 'Отлично, подходит под наши возможности'
      : currentStep >= 3 && currentStep <= 4
        ? 'Уже почти готово'
        : '';

  const scrollToQuiz = () => {
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectAudience = (audience) => {
    setAnswers({
      audience,
      moldType: '',
      quantity: '',
      materials: '',
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
    }
  };

  React.useEffect(() => {
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
    <div className={styles.page}>
      {copied && (
        <div className={styles.globalCopyToast} role="status">
          Текст скопирован
        </div>
      )}

      <LandingHeader
        logo={{
          href: '#top',
          ariaLabel: 'anyforms — наверх',
          src: '/anyforms_logo_new_white.svg',
          width: 200,
          height: 46,
          onClick: (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        }}
        navLinks={HEADER_NAV_LINKS}
        navAriaLabel="Разделы сайта"
        rightItems={[
          {
            key: 'quiz',
            kind: 'button',
            label: 'Подобрать молд',
            variant: 'pill',
            onClick: scrollToQuiz,
          },
        ]}
        mobileMenuId="main-landing-mobile-menu"
        mobileTopItems={[
          {
            key: 'quiz-mobile',
            kind: 'button',
            label: 'Подобрать молд',
            variant: 'primary',
            onClick: scrollToQuiz,
          },
        ]}
      />

      <div id="top" />
      <section className={styles.hero} aria-label="Главный экран">
        <div className={styles.heroGrid}>
          <div className={styles.heroInfoCard}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Силиконовые формы</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTypedLine}`}>
                {typedHeroText}
                <span className={styles.heroCaret} aria-hidden />
              </span>
            </h1>
            <p className={styles.heroTagline}>
              Более 5 лет в производстве форм
              <br />
              Сделали 100 000+ молдов под заказ
            </p>
            <CTAButton onClick={scrollToQuiz}>Подобрать молд</CTAButton>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img className={styles.heroImage} src={HERO_IMAGES.main} alt="" loading="eager" />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img className={styles.heroImage} src={HERO_IMAGES.top} alt="" loading="eager" />
                </div>
                <div className={styles.heroSideCard}>
                  <img className={styles.heroImage} src={HERO_IMAGES.bottom} alt="" loading="eager" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="quiz" className={styles.quizSection}>
        <div className={styles.quizIntro}>
          <h2 className={styles.quizIntroTitle}>
            <span className={styles.quizIntroLine}>Подберем форму</span>
            <span className={`${styles.quizIntroLine} ${styles.quizIntroLineMuted}`}>
              и закрепим за вами скидку{' '}
              <span className={styles.quizIntroAccent}>{selectedOffer.discountLabel}</span>
            </span>
          </h2>
          <p className={styles.quizIntroSubtitle}>
            Скидка распространяется на формы, изготовленные под заказ
          </p>
        </div>

        <div className={styles.quizContainer}>
          <Progress currentStep={currentStep} />
          {reassuranceText && <p className={styles.reassurance}>{reassuranceText}</p>}

          <div key={currentStep} className={styles.stepAnimated}>
            {currentStep === 1 && (
              <StepCard
                title="Кто вы?"
                options={STEP_ONE_OPTIONS}
                value={answers.audience}
                onSelect={selectAudience}
              />
            )}

            {currentStep === 2 && (
              <StepCard
                title="Что хотите сделать?"
                options={secondStepOptions}
                value={answers.moldType}
                onSelect={(moldType) => setAnswers((prev) => ({ ...prev, moldType }))}
              />
            )}

            {currentStep === 3 && (
              <StepCard
                title="Сколько нужно форм?"
                options={STEP_THREE_OPTIONS}
                value={answers.quantity}
                onSelect={(quantity) => setAnswers((prev) => ({ ...prev, quantity }))}
              />
            )}

            {currentStep === 4 && (
              <StepCard
                title="Есть ли у вас материалы?"
                options={STEP_FOUR_OPTIONS}
                value={answers.materials}
                onSelect={(materials) => setAnswers((prev) => ({ ...prev, materials }))}
              />
            )}

            {currentStep === 5 && (
              <div className={styles.resultCard}>
                <h2 className={styles.stepTitle}>Готово! Скопируйте и отправьте нам это сообщение</h2>
                <div className={styles.resultTextWrap}>
                  <button
                    type="button"
                    className={styles.copyIconButton}
                    onClick={handleCopy}
                    aria-label="Скопировать текст заявки"
                    title={copied ? 'Скопировано' : 'Скопировать'}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H10V7h9v14z" />
                    </svg>
                  </button>
                  <pre className={styles.resultText}>{resultText}</pre>
                </div>
                <div className={styles.resultActions}>
                  <CTAButton href={managerUrl} target="_blank" rel="noopener noreferrer">
                    Написать
                  </CTAButton>
                </div>
              </div>
            )}
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

export default MainLanding;

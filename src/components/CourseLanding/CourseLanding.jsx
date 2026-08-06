import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import apiClient from '../../apiClient';
import {
  getPromoFromSearch,
  buildPassThroughQuery,
  formatPromoDeadline,
} from '../../shared/promoTracking';
import { COURSE_PLANS } from './CourseCheckout';
import styles from './CourseLanding.module.css';

const LAUNCH = '1 сентября 2026';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';
// Промокод гайда — по нему в попапе показывается заголовок-благодарность.
const GUIDE_PROMO_CODE = 'ГАЙД';
// Флаг «попап уже показывали» — чтобы не всплывал заново при возврате с чекаута.
const PROMO_POPUP_SEEN_KEY = 'af_promo_popup_seen';

const formatKopecks = (kopecks) =>
  `${Math.round(kopecks / 100).toLocaleString('ru-RU')} ₽`;

// Стрелка внутри белого кружка на CTA-кнопках.
const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4.5 12h15M13.5 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


const VideoIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10.4 9.3v5.4l4.8-2.7-4.8-2.7Z" fill="currentColor" />
  </svg>
);

const PersonIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

// Экран 11 — два тарифа участия.
const TARIFFS = [
  {
    key: 'self',
    name: COURSE_PLANS.self.label,
    desc: 'Изучаете курс в записи в своём темпе.',
    icon: <VideoIcon size={26} />,
    features: [
      '4 видео-модуля: от идеи до рабочей формы',
      'Доступ к материалам — навсегда',
      '10 готовых моделей для практики',
      'Закрытый чат мастеров (2000+)',
      'Поставщики, материалы и скидки на закупки',
      'Пак с оснастками',

    ],
  },
  {
    key: 'personal',
    name: COURSE_PLANS.personal.label,
    desc: 'Месяц работы вместе с командой anyforms.',
    icon: <PersonIcon size={26} />,
    features: [
      '4 видео-модуля: от идеи до рабочей формы',
      'Доступ к материалам — навсегда',
      '10 готовых моделей для практики',
      'Закрытый чат мастеров (2000+)',
      'Поставщики, материалы и скидки на закупки',
      'Пак с оснастками',
      'Еженедельные видео-созвоны с ответами на ваши вопросы',
      'Разбор работ с конкретными правками',
      'Личная поддержка на каждом этапе',
    ],
  },
];

// Фичи «Личного ведения», совпадающие с базовым тарифом, показываем приглушённо.
const SELF_FEATURES = new Set(TARIFFS[0].features);
const HERO_VIDEO = 'https://storage.yandexcloud.net/anyforms/course/landing_course.webm';
const OFFER_IMAGE = 'https://storage.yandexcloud.net/anyforms/course/printer.jpeg';

// Плашка под заголовком — короткие факты о формате курса (с иконками).
const HERO_FEATURES = [
  {
    label: '4 модуля',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6.5 3.5h11a1 1 0 0 1 1 1v16L12 16.2 5.5 20.5v-16a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  { label: 'Видеоформат', icon: <VideoIcon /> },
  {
    label: 'Вечный доступ',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  { label: 'Два формата участия', icon: <PersonIcon /> },
];

// Цифры-доказательства — реальное производство anyforms.
const HERO_STATS = [
  { value: '5 лет', label: 'делаем формы на заказ' },
  { value: '100 тыс+', label: 'изготовленных форм' },
  { value: '2 млн ₽', label: 'выручка в месяц' },
];

// Экран 2 — что вы сделаете своими руками (галерея процесса).
const RESULT_SHOTS = [
  { src: 'https://storage.yandexcloud.net/anyforms/course/process-1.jpeg', alt: 'Опалубка' },
  { src: 'https://storage.yandexcloud.net/anyforms/course/process-2.jpeg', alt: 'Литьё' },
];

// Экран 4 — 4 модуля курса.
const MODULES = [
  {
    title: 'Проектирование',
    items: [
      '3D-модель будущего изделия — выдаём или сделаем под заказ',
      'Опалубка под заливку силиконом',
      'Конечная оснастка для работы с молдом',
    ],
  },
  {
    title: 'Печать',
    items: [
      'SLA для мастер-модели, FDM для оснастки',
      'Какое оборудование подойдёт',
      'Настройки печати и как ускорить процесс',
    ],
  },
  {
    title: 'Ручная обработка',
    items: [
      'Как обработать мастер-модель',
      'Какие расходники использовать',
      'Что считается приемлемым результатом в зависимости от задачи',
    ],
  },
  {
    title: 'Заливка силикона',
    items: [
      'Подбор силикона',
      'Как ускорить / замедлить процесс схватывания',
      'Подбор оборудования: весы и камера дегазации',
    ],
  },
];

// Экран 5 — что получите на выходе.
const GET_CARDS = [
  {
    title: 'Готовая силиконовая форма',
    text:
      'Форма для контейнерной свечи, которую можно сразу продавать или лить с неё отливки на продажу.',
  },
  {
    title: 'Навык делать формы',
    text:
      'Сможете самостоятельно проектировать и изготавливать собственные формы под любые изделия.',
  },
];

// Экран 6 — основатели anyforms.
const FOUNDERS = [
  {
    name: 'Юрий Суворов',
    role: 'продвижение и соцсети',
    photo: 'https://storage.yandexcloud.net/anyforms/course/Yuri.jpeg',
    bio:
      'Отвечает за продвижение и оформление anyforms в соцсетях. Умеет объяснять сложные вещи простыми словами — поэтому ведёт курс.',
  },
  {
    name: 'Дмитрий Суворов',
    role: 'руководитель цеха',
    photo: 'https://storage.yandexcloud.net/anyforms/course/Dmitri.jpeg',
    bio:
      'Руководит цехом и всеми заказами, отвечает за технологию и технические решения. Через его руки проходит каждая форма.',
  },
  {
    name: 'Егор Кудаков',
    role: 'инженер 3D-моделирования',
    photo: 'https://storage.yandexcloud.net/anyforms/course/Egor.jpeg',
    bio:
      'Проектирует органические оснастки повторяющие мастер-модель. Отвечает за инженерную часть форм.',
  },
];

// Экран 7 — кейсы реализованных молдов (свайп-галерея), фото из бакета results.
const RESULTS_BASE = 'https://storage.yandexcloud.net/anyforms/course/results/';
const RESULT_FILES = [
  '1.jpeg',
  '2.jpeg',
  '3.jpeg',
  '4.jpeg',
  '5.jpeg',
  '6.jpeg',
  '7.jpeg',
  '8.jpeg',
  '9.jpeg',
  'photo_2026-06-21 18.32.19.jpeg',
  'photo_2026-06-21 18.32.29.jpeg',
  'photo_2026-06-21 18.32.44.jpeg',
  'photo_2026-06-21 18.32.48.jpeg',
  'photo_2026-06-21 18.33.17.jpeg',
  'photo_2026-06-21 18.33.25.jpeg',
  'photo_2026-06-21 18.33.40.jpeg',
  'photo_2026-06-21 18.33.49.jpeg',
  'photo_2026-06-21 18.34.01.jpeg',
  'photo_2026-06-21 18.34.06.jpeg',
  'photo_2026-06-21 18.34.10.jpeg',
  'photo_2026-06-21 18.34.19.jpeg',
  'photo_2026-06-21 18.34.26.jpeg',
  'photo_2026-06-21 18.34.30.jpeg',
  'photo_2026-06-21 18.34.37.jpeg',
  'photo_2026-06-21 18.35.00.jpeg',
  'photo_2026-06-21 18.35.07.jpeg',
  'photo_2026-06-21 18.35.11.jpeg',
  'photo_2026-06-21 18.35.20.jpeg',
  'photo_2026-06-21 18.35.26.jpeg',
  'photo_2026-06-21 18.35.29.jpeg',
  'photo_2026-06-21 18.35.48.jpeg',
];
const CASES = RESULT_FILES.map((name) => `${RESULTS_BASE}${encodeURIComponent(name)}`);

// Результаты клиентов — отливки. Фото загрузить в бакет course/castings/
// и перечислить имена файлов здесь; блок на странице появится автоматически.
const CASTINGS_BASE = 'https://storage.yandexcloud.net/anyforms/course/castings/';
const CASTING_FILES = [];
const CASTINGS = CASTING_FILES.map((name) => `${CASTINGS_BASE}${encodeURIComponent(name)}`);

// Экран 8 — бонусы.
const BONUSES = [
  'Ссылки на проверенные материалы и поставщиков',
  'Скидки на стартовые закупки',
  'Доступ в закрытый чат мастеров (2000+ участников)',
  '10 готовых моделей для отработки навыков',
  'Пак с онснастками (простая геометрия 1000+ stl)',
];

// Экран 9 — что нужно, чтобы пройти.
const OFFER_ITEMS = [
  'Дадим список всего, что необходимо для работы',
  'Либо закажите печать у нас со скидкой 50% — минуя этап «Печать»',
  'Чат мастеров: найдёте исполнителя из своего города',
];

// Экран 10 — поддержка на каждом этапе.
const SUPPORT_ITEMS = [
  'Помогаем на каждом этапе — от проектирования до заливки',
  'Любой вопрос пишите в поддержку — отвечают наш главный специалист и специалисты высшей категории',
  'Поможем довести ваше изделие до готового результата',
];

// Экран 12 — FAQ.
const FAQ = [
  {
    q: 'Когда откроется доступ к курсу?',
    a: `Сейчас идёт предзаказ. Доступ ко всем материалам откроется ${LAUNCH}.`,
  },
  {
    q: 'Нужен ли свой 3D-принтер?',
    a: 'Нет. Можно заказать печать у нас со скидкой 50% и изучать курс, минуя этап «Печать». А в чате мастеров вы сможете найти исполнителя из своего города.',
  },
  {
    q: 'Подойдёт ли новичку без опыта моделирования?',
    a: 'Да. Курс построен пошагово — от проектирования до заливки. Всё показываем на примере реального продукта, повторить можно с нуля, а на каждом этапе помогает поддержка.',
  },
  // {
  //   q: 'Сколько денег нужно на материалы для старта?',
  //   a: 'Бюджет на первую форму — примерно 5 000 ₽. Дадим ссылки на проверенных поставщиков и скидки на стартовые закупки, чтобы не переплачивать.',
  // },
  {
    q: 'Реально ли на этом заработать?',
    a: 'На выходе у вас рабочая форма, которую можно продавать или использовать для отливок на продажу. В бонусах — отдельные материалы по монетизации и продвижению в соцсетях.',
  },
];

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const CHECKOUT_PATH = '/course/checkout';

// Все CTA ведут к единственному офферу (#buy); на чекаут уходит только кнопка внутри него.
const scrollToBuy = () => scrollToId('buy');

const NAV_LINKS = [
  { key: 'modules', label: 'Программа', id: 'modules' },
  { key: 'founders', label: 'О нас', id: 'founders' },
  { key: 'cases', label: 'Кейсы', id: 'cases' },
  { key: 'faq', label: 'Вопросы', id: 'faq' },
];

const Placeholder = ({ label, ratio, dark }) => (
  <div className={`${styles.ph} ${dark ? styles.phDark : ''}`} data-ratio={ratio}>
    <span className={styles.phLabel}>{label}</span>
  </div>
);

const CourseLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const promoFromUrl = getPromoFromSearch(location.search);

  // На чекаут уходим с plan и сквозными promo/utm из текущего URL.
  const goToCheckout = (planKey) =>
    navigate(`${CHECKOUT_PATH}${buildPassThroughQuery(location.search, { plan: planKey })}`);

  // Промокод из ссылки (?promo=...): проверяем на бэке по обоим тарифам и,
  // если валиден, зачёркиваем цены и показываем скидочные.
  const [promoByPlan, setPromoByPlan] = useState(null);
  const [promoPopupOpen, setPromoPopupOpen] = useState(false);
  useEffect(() => {
    if (!promoFromUrl) {
      setPromoByPlan(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          Object.entries(COURSE_PLANS).map(async ([key, p]) => {
            const { data } = await apiClient.instance.get('/api/payment/promo-check', {
              params: { code: promoFromUrl, productCode: p.code },
            });
            return [key, data];
          })
        );
        if (!cancelled && entries.every(([, d]) => d?.valid)) {
          setPromoByPlan(Object.fromEntries(entries));
          let seen = false;
          try {
            seen = sessionStorage.getItem(PROMO_POPUP_SEEN_KEY) === '1';
          } catch {
            /* приватный режим — показываем всегда */
          }
          if (!seen) setPromoPopupOpen(true);
        }
      } catch {
        // промокод на лендинге — только украшение цены, ошибку молча пропускаем
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [promoFromUrl]);

  const closePromoPopup = () => {
    setPromoPopupOpen(false);
    try {
      sessionStorage.setItem(PROMO_POPUP_SEEN_KEY, '1');
    } catch {
      /* ок, просто покажется снова */
    }
  };

  const heroSelfPromo = promoByPlan?.self;
  const isGuidePromo = heroSelfPromo?.code === GUIDE_PROMO_CODE;
  const promoDeadline = formatPromoDeadline(heroSelfPromo?.validUntil);

  return (
    <div className={styles.page}>
      <LandingHeader
        logo={{
          href: '#top',
          ariaLabel: 'anyforms — курс по силиконовым формам',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
          onClick: (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        }}
        navLinks={NAV_LINKS.map((link) => ({
          key: link.key,
          kind: 'link',
          href: `#${link.id}`,
          label: link.label,
          onClick: (e) => {
            e.preventDefault();
            scrollToId(link.id);
          },
        }))}
        navAriaLabel="Разделы страницы"
        rightItems={[
          {
            key: 'buy-desktop',
            kind: 'link',
            href: '#buy',
            label: 'Оформить предзаказ',
            variant: 'pill',
            onClick: (e) => {
              e.preventDefault();
              scrollToBuy();
            },
          },
        ]}
        mobileMenuId="course-mobile-menu"
        mobileTopItems={[
          {
            key: 'buy-mobile',
            kind: 'link',
            href: '#buy',
            label: 'Оформить предзаказ',
            variant: 'primary',
            onClick: (e) => {
              e.preventDefault();
              scrollToBuy();
            },
          },
        ]}
        mobileLinks={NAV_LINKS.map((link) => ({
          key: link.key,
          kind: 'link',
          href: `#${link.id}`,
          label: link.label,
          onClick: (e) => {
            e.preventDefault();
            scrollToId(link.id);
          },
        }))}
      />

      {promoPopupOpen && heroSelfPromo && (
        <div
          className={styles.promoModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-popup-title"
          onClick={closePromoPopup}
        >
          <div className={styles.promoModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.promoModalClose}
              onClick={closePromoPopup}
              aria-label="Закрыть"
            >
              ×
            </button>
            <h2 className={styles.promoModalTitle} id="promo-popup-title">
              {isGuidePromo ? 'Спасибо, что прошли гайд!' : 'Промокод применён'}
            </h2>
            <p className={styles.promoModalText}>
              По промокоду {heroSelfPromo.code} вам доступна скидка{' '}
              {heroSelfPromo.discountPercent}% — она уже применилась к ценам курса.
              {promoDeadline && <> Скидка действует до {promoDeadline}.</>}
            </p>
            <button
              type="button"
              className={`${styles.cta} ${styles.promoModalCta}`}
              onClick={closePromoPopup}
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ ЭКРАН 1 · HERO ═══════════════ */}
      <div id="top" />
      <section className={styles.hero} aria-label="О курсе">
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Освойте <em className={styles.hAccent}>профессию</em> производителя
              силиконовых форм
            </h1>

            <p className={styles.heroSub}>
              Покажем весь процесс на примере реального продукта — от выбора
              оборудования до первой рабочей формы.
            </p>

            <div className={styles.heroCards}>
              <ul className={styles.heroFeatures}>
                {HERO_FEATURES.map((feature) => (
                  <li className={styles.heroFeature} key={feature.label}>
                    <span className={styles.heroFeatureIcon} aria-hidden>
                      {feature.icon}
                    </span>
                    <span>{feature.label}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.heroPriceCard}>
                <div className={styles.heroPriceCol}>
                  <span className={styles.heroPrice}>
                    от{' '}
                    {heroSelfPromo
                      ? formatKopecks(heroSelfPromo.discountedPriceKopecks)
                      : COURSE_PLANS.self.price}
                  </span>
                  {heroSelfPromo && (
                    <span className={styles.heroPriceOld}>
                      от {formatKopecks(heroSelfPromo.priceKopecks)}
                    </span>
                  )}
                </div>
                <button type="button" className={styles.cta} onClick={scrollToBuy}>
                  Оформить предзаказ
                  <span className={styles.ctaArrow} aria-hidden>
                    <ArrowIcon />
                  </span>
                </button>
                <p className={`${styles.preorderNote} ${styles.preorderNoteMobile}`}>
                  Доступ к материалам откроется {LAUNCH}.
                </p>
              </div>
            </div>

            {heroSelfPromo && (
              <p className={styles.promoStrip}>
                Промокод {heroSelfPromo.code} применён — скидка {heroSelfPromo.discountPercent}%
                {formatPromoDeadline(heroSelfPromo.validUntil)
                  ? `. Ваша скидка действует до ${formatPromoDeadline(heroSelfPromo.validUntil)}.`
                  : '.'}
              </p>
            )}
            <p className={`${styles.preorderNote} ${styles.preorderNoteDesktop}`}>
              Это предзаказ. Доступ к материалам откроется {LAUNCH}.
            </p>

            <div className={styles.heroProof}>
              {HERO_STATS.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && <span className={styles.heroDivider} aria-hidden />}
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>{stat.value}</span>
                    <span className={styles.heroStatLabel}>{stat.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className={styles.heroMedia}>
            <span className={styles.heroBadge}>старт {LAUNCH}</span>
            <video
              className={styles.heroImg}
              src={HERO_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Изделие, отлитое в силиконовой форме"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 2 · РЕЗУЛЬТАТ ═══════════════ */}
      <section className={styles.resultSection} aria-labelledby="result-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Результат</span>
            <h2 className={styles.sectionTitle} id="result-title">
              В одном проекте вы освоите технологии, которых <span className={styles.textAccent}>достаточно</span> для создания большинства силиконовых форм
            </h2>
            <p className={styles.sectionLead}>
              Далее большинство других изделий уже не вызовут сложностей.
            </p>
          </div>
          <div className={styles.galleryGrid}>
            {RESULT_SHOTS.map((shot) => (
              <img
                key={shot.src}
                className={styles.galleryImg}
                src={shot.src}
                alt={shot.alt}
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 3 · БОЛЬ ═══════════════ */}
      <section className={styles.darkSection} aria-labelledby="pain-title">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrowAccent}>Зачем это вам</span>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="pain-title">
            Сможете делать формы&nbsp;<span className={styles.textAccent}> самостоятельно </span> и не зависеть от чужих мастерских
          </h2>
          <p className={styles.darkLead}>
            Используйте навык для собственных проектов, выполняйте заказы или продавайте готовые формы другим мастерам.
          </p>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 4 · МОДУЛИ ═══════════════ */}
      <section id="modules" className={styles.modulesSection} aria-labelledby="modules-title">
        <div className={styles.sectionInner}>
          <div className={styles.modulesLayout}>
            <div className={styles.modulesHead}>
              <span className={styles.eyebrow}>Программа</span>
              <h2 className={styles.sectionTitle} id="modules-title">
                Весь цикл —{' '}
                <em className={styles.hAccent}>за&nbsp;4&nbsp;модуля</em>
              </h2>
              <p className={styles.sectionLead}>
                Коротко и по делу, в видео-формате. Каждый модуль — отдельный этап
                производства.
              </p>
            </div>
            <div className={styles.modulesGrid}>
              {MODULES.map((mod, idx) => (
                <article className={styles.moduleCard} key={mod.title}>
                  <div className={styles.moduleHead}>
                    <span className={styles.moduleNum}>{idx + 1}</span>
                    <h3 className={styles.moduleTitle}>{mod.title}</h3>
                  </div>
                  <ul className={styles.moduleList}>
                    {mod.items.map((item) => (
                      <li className={styles.moduleItem} key={item}>
                        <span className={styles.moduleDot} aria-hidden>
                          →
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 5 · ЧТО ПОЛУЧИТЕ ═══════════════ */}
      <section className={styles.getSection} aria-labelledby="get-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>На выходе</span>
            <h2 className={styles.sectionTitle} id="get-title">
              Что у вас будет после курса
            </h2>
          </div>
          <div className={styles.getGrid}>
            {GET_CARDS.map((card) => (
              <article className={styles.getCard} key={card.title}>
                <span className={styles.getCardIcon} aria-hidden>
                  ✓
                </span>
                <h3 className={styles.getCardTitle}>{card.title}</h3>
                <p className={styles.getCardText}>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 6 · ОСНОВАТЕЛИ ═══════════════ */}
      <section id="founders" className={styles.authorSection} aria-labelledby="founders-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Кто ведёт курс</span>
            <h2 className={styles.sectionTitle} id="founders-title">
              Опыт компании — в&nbsp;одном курсе
            </h2>
            <p className={styles.sectionLead}>
              Курс ведут сооснователи anyforms — каждый отвечает за свой этап:
              Егор — проектирование, Дмитрий — печать, Юрий — обработка.
            </p>
          </div>
          <div className={styles.foundersGrid}>
            {FOUNDERS.map((person) => (
              <article className={styles.founderCard} key={person.name}>
                <div className={styles.founderMedia}>
                  {person.photo ? (
                    <img
                      className={styles.founderImg}
                      src={person.photo}
                      alt={person.name}
                      loading="lazy"
                    />
                  ) : (
                    <Placeholder label={`Фото · ${person.name}`} ratio="square" />
                  )}
                </div>
                <div>
                  <h3 className={styles.founderName}>{person.name}</h3>
                  <p className={styles.founderRole}>{person.role}</p>
                  <p className={styles.founderBio}>{person.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 7 · КЕЙСЫ ═══════════════ */}
      <section id="cases" className={styles.reviewsSection} aria-labelledby="cases-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Кейсы</span>
            <h2 className={styles.sectionTitle} id="cases-title">
              5 лет делаем молды на&nbsp;заказ
            </h2>
            <p className={styles.sectionLead}>
              За курсом — реальное производство. Уже 5 лет мы изготавливаем формы для
              клиентов. Вот часть реализованных работ.
            </p>
          </div>
          <p className={styles.swipeHint}>← Листайте, чтобы посмотреть кейсы →</p>
        </div>
        <div className={styles.casesScroller}>
          {CASES.map((src, i) => (
            <div className={styles.caseItem} key={src}>
              <img
                className={styles.caseImg}
                src={src}
                alt={`Реализованный молд №${i + 1}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
        {CASTINGS.length > 0 && (
          <>
            <div className={styles.sectionInner}>
              <h3 className={styles.castingsTitle}>Результаты клиентов — отливки</h3>
            </div>
            <div className={styles.casesScroller}>
              {CASTINGS.map((src, i) => (
                <div className={styles.caseItem} key={src}>
                  <img
                    className={styles.caseImg}
                    src={src}
                    alt={`Отливка клиента №${i + 1}`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ═══════════════ ЭКРАН 8 · БОНУСЫ ═══════════════ */}
      <section className={styles.bonusSection} aria-labelledby="bonus-title">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrowAccent}>Бонусы</span>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="bonus-title">
            Бонусы к&nbsp;курсу
          </h2>
          <div className={styles.bonusGrid}>
            {BONUSES.map((item) => (
              <div className={styles.bonusItem} key={item}>
                <span className={styles.bonusStar} aria-hidden>
                  ★
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 9 · ЧТО ПОНАДОБИТСЯ ═══════════════ */}
      <section id="need" className={styles.needSection} aria-labelledby="need-title">
        <div className={styles.sectionInner}>

          <div className={styles.offerPanel}>
            <div>
              <span className={styles.offerLabel}>Частый вопрос</span>
              <h3 className={styles.offerTitle}>
                Что делать, если на старте нет оборудования?
              </h3>
              <p className={styles.offerText}>
                Мы предоставим список того, что вам необходимо для работы, либо вы
                можете заказать у нас печать со скидкой 50% и изучать курс без покупки
                оборудования, минуя этап «Печать». Также вам будет доступен чат
                мастеров, где вы сможете найти исполнителя из своего города.
              </p>
              <ul className={styles.offerList}>
                {OFFER_ITEMS.map((item) => (
                  <li className={styles.offerItem} key={item}>
                    <span className={styles.offerCheck} aria-hidden>
                      →
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                className={`${styles.cta} ${styles.ctaInline} ${styles.offerCta}`}
                href={SUPPORT_TG}
                target="_blank"
                rel="noopener noreferrer"
              >
                Обсудить детали
                <span className={styles.ctaArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              </a>
            </div>
            <div>
              <img
                className={styles.offerImg}
                src={OFFER_IMAGE}
                alt="Заказ 3D-модели и печати"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 11 · ОФФЕР / ЦЕНА ═══════════════ */}
      <section id="buy" className={styles.buySection} aria-labelledby="buy-title">
        <div className={styles.sectionInner}>
          <div className={styles.buyInner}>
            <span className={styles.pillBadge}>Предзаказ</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="buy-title">
              <em className={styles.hAccent}>Два</em> формата участия
            </h2>
            <div className={styles.tariffGrid}>
              {TARIFFS.map((tariff) => {
                const promo = promoByPlan?.[tariff.key];
                const isPersonal = tariff.key === 'personal';
                return (
                  <article
                    key={tariff.key}
                    className={`${styles.tariffCard} ${
                      isPersonal ? styles.tariffCardFeatured : ''
                    }`}
                  >
                    {isPersonal && (
                      <span className={styles.tariffBadge}>Рекомендуем</span>
                    )}
                    <span className={styles.tariffIcon} aria-hidden>
                      {tariff.icon}
                    </span>
                    <h3 className={styles.tariffName}>{tariff.name}</h3>
                    <p className={styles.tariffDesc}>{tariff.desc}</p>
                    <ul className={styles.tariffList}>
                      {tariff.features.map((item) => {
                        const isShared = isPersonal && SELF_FEATURES.has(item);
                        return (
                          <li
                            className={`${styles.buyIncludedItem} ${
                              isShared ? styles.buyIncludedMuted : ''
                            }`}
                            key={item}
                          >
                            <span className={styles.buyCheck} aria-hidden>
                              ✓
                            </span>
                            <span>{item}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className={styles.tariffPriceWrap}>
                      {promo && (
                        <span className={styles.tariffPriceOld}>
                          {formatKopecks(promo.priceKopecks)}
                        </span>
                      )}
                      <span className={styles.tariffPrice}>
                        {promo
                          ? formatKopecks(promo.discountedPriceKopecks)
                          : COURSE_PLANS[tariff.key].price}
                      </span>
                    </div>
                    {promo && (
                      <p className={styles.tariffPromoNote}>
                        Промокод {promo.code}: скидка {promo.discountPercent}%
                        {formatPromoDeadline(promo.validUntil)
                          ? `, действует до ${formatPromoDeadline(promo.validUntil)}`
                          : ''}
                        . Применится на оплате.
                      </p>
                    )}
                    <button
                      type="button"
                      className={`${styles.cta} ${styles.tariffCta}`}
                      onClick={() => goToCheckout(tariff.key)}
                    >
                      Оформить предзаказ
                      <span className={styles.ctaArrow} aria-hidden>
                        <ArrowIcon />
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
            <span className={styles.buyMeta}>
              <span>Цена предзаказа</span>
              <span>Доступ откроется {LAUNCH}</span>
              <span>Материалы — навсегда</span>
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 12 · FAQ ═══════════════ */}
      <section id="faq" className={styles.faqSection} aria-labelledby="faq-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Вопросы</span>
            <h2 className={styles.sectionTitle} id="faq-title">
              Частые вопросы
            </h2>
          </div>
          <div className={styles.faqList}>
            {FAQ.map((item) => (
              <details className={styles.faqItem} key={item.q}>
                <summary className={styles.faqQ}>
                  <span>{item.q}</span>
                  <span className={styles.faqIcon} aria-hidden>
                    +
                  </span>
                </summary>
                <p className={styles.faqA}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 13 · ФИНАЛ ═══════════════ */}
      <section className={styles.darkSection} aria-labelledby="final-title">
        <div className={styles.sectionInner}>
          <div className={styles.finalInner}>
            <span className={styles.eyebrowAccent}>Старт {LAUNCH}</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="final-title">
              Начните делать формы с&nbsp;<span className={styles.textAccent}>предсказуемым</span> результатом
            </h2>
            <div className={styles.finalCtaRow}>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline}`}
                onClick={scrollToBuy}
              >
                Начать учиться
                <span className={styles.ctaArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className={styles.siteFooter}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div>
              <h2 className={styles.footerHeading}>О продавце</h2>
              <p className={styles.footerText}>
                Суворов Юрий Игоревич
                <br />
                Самозанятый (НПД) · г. Пермь
                <br />
                <a className={styles.footerLink} href="/founders/yuri?from=course">
                  Реквизиты
                </a>
              </p>
            </div>
            <div>
              <h2 className={styles.footerHeading}>Контакты</h2>
              <p className={styles.footerText}>
                <a
                  className={styles.footerLink}
                  href={SUPPORT_TG}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram @AnyFormsBot
                </a>
              </p>
            </div>
            <div>
              <h2 className={styles.footerHeading}>Документы</h2>
              <p className={styles.footerText}>
                <a className={styles.footerLink} href="/course/offer">
                  Оферта
                </a>{' '}
                ·{' '}
                <a className={styles.footerLink} href="/course/privacy">
                  Политика конфиденциальности
                </a>
              </p>
            </div>
          </div>

          <div className={styles.footerOffer}>
            <p className={styles.footerOfferText}>
              Курс — цифровой информационный продукт. Сейчас доступен предзаказ; доступ
              к материалам откроется {LAUNCH}. Материалы остаются бессрочно, ведение
              специалистов на тарифе «Личное ведение» — 1 месяц. Оформляя предзаказ, вы
              принимаете условия{' '}
              <a className={styles.footerLink} href="/course/offer">
                оферты
              </a>{' '}
              и{' '}
              <a className={styles.footerLink} href="/course/privacy">
                политики конфиденциальности
              </a>
              .
            </p>
          </div>

          <p className={styles.footerCopyright}>© anyforms, 2026. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default CourseLanding;

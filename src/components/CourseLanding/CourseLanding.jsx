import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SiteHeader from '../shared/SiteHeader/SiteHeader';
import apiClient from '../../apiClient';
import {
  getPromoFromSearch,
  buildPassThroughQuery,
  formatPromoDeadlineNote,
} from '../../shared/promoTracking';
import { COURSE_PRODUCT, coursePrice } from './CourseCheckout';
import { useSaleCountdown, daysLabel } from './courseSale';
import styles from './CourseLanding.module.css';

const LAUNCH = '10 ноября 2026';
const LAUNCH_SHORT = '10 ноября';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';
// Промокод гайда — по нему в попапе показывается заголовок-благодарность.
const GUIDE_PROMO_CODE = 'ГАЙД';
// Флаг «попап уже показывали» — чтобы не всплывал заново при возврате с чекаута.
const PROMO_POPUP_SEEN_KEY = 'af_promo_popup_seen';

const FIRST_STREAM_REVIEWS = [
  { name: 'Елена', role: 'дизайнер', image: '' },
  { name: 'Евгения', role: 'свечевар', image: '' },
  { name: 'Станислав', role: 'программист', image: '' },
  { name: 'Валерия', role: 'свечевар', image: '' },
  { name: 'Елена', role: 'кондитер', image: '' },
  { name: 'Ольга', role: 'технолог акрилового гипса', image: '' },
];

const CALCULATOR_MEDIA = [];
const CONSTRUCTOR_MEDIA = [];

const formatKopecks = (kopecks) =>
  `${Math.round(kopecks / 100).toLocaleString('ru-RU')} ₽`;

// «35%», «5 000 ₽» или «35% + 5 000 ₽» — размер скидки промокода.
const promoDiscountLabel = (promo) =>
  [
    promo?.discountPercent ? `${promo.discountPercent}%` : null,
    promo?.discountAmountKopecks ? formatKopecks(promo.discountAmountKopecks) : null,
  ]
    .filter(Boolean)
    .join(' + ');

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


const isVideoSrc = (src) => /\.(mp4|webm|mov)(\?|$)/i.test(src);

const AppMedia = ({ items, alt }) =>
  items.map((src) =>
    isVideoSrc(src) ? (
      <video
        key={src}
        className={styles.appMediaItem}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        aria-label={alt}
      />
    ) : (
      <img key={src} className={styles.appMediaItem} src={src} alt={alt} loading="lazy" />
    )
  );

const VideoIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10.4 9.3v5.4l4.8-2.7-4.8-2.7Z" fill="currentColor" />
  </svg>
);

// Экран 11 — что входит в курс.
const COURSE_FEATURES = [
  '5 видео-модулей: от 3D-модели до готовой свечи',
  '2 онлайн-семинара',
  '3 месяца поддержки',
  'Доступ к материалам — навсегда',
  '10 готовых моделей для практики',
  'Закрытый чат мастеров (2000+)',
  'Поставщики, материалы и скидки на закупки',
  'Ранний доступ к «Конструктору оснасток» и «Калькулятору проектов»',
  'Курс по гипсу Shape.studio от 24 Grams',
];

const HERO_VIDEO = 'https://storage.yandexcloud.net/anyforms/course/landing_course.webm';
const OFFER_IMAGE = 'https://storage.yandexcloud.net/anyforms/course/printer.jpeg';

// Плашка под заголовком — короткие факты о формате курса (с иконками).
const HERO_FEATURES = [
  {
    label: '5 модулей',
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
  {
    label: '2 онлайн-семинара',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M3.5 10h17M8 3v4M16 3v4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: '3 месяца поддержки',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20.5 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.6A8 8 0 1 1 20.5 11.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Доступ к приложениям',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
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

// Экран 4 — 5 модулей курса.
const MODULES = [
  {
    title: 'Проектирование',
    items: [
      'разберемся в программе Blender',
      'спроектируем профессиональную оснастку для заливки силиконом',
      'спроектируем конечную удобную оснастку для работы с формой',
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
  {
    title: 'Изготовление контейнерной свечи',
    items: [
      'Подбор оборудования и расходников',
      'Как и чем обработать изделие',
      'Разберёмся в технологии заливки свечи',
      'Бонус: курс по гипсу Shape.studio от наших партнёров 24 Grams',
    ],
  },
];

// Экран 5 — что получите на выходе.
const GET_CARDS = [
  {
    title: 'Навык делать формы',
    text: [
      'Сможете самостоятельно проектировать и изготавливать собственные формы под любые изделия.',
    ],
  },
  {
    title: 'Навык работы с гипсом и воском',
    text: ['Вы самостоятельно создадите контейнерную свечу с нуля — готовую к продаже.'],
  },
  {
    title: 'Ранний доступ к нашим флагманским продуктам',
    icon: '☆',
    wide: true,
    text: [
      <>
        <strong>Конструктор оснасток</strong> — поможет решить даже сложные инженерные
        задачи без навыков 3D-моделирования.
      </>,
      <>
        <strong>Калькулятор проектов</strong> — поможет рассчитать стоимость проекта,
        избежать убытков и автоматически подготовит коммерческое предложение для вашего
        заказчика.
      </>,
    ],
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

// Экран 8 — бонусы. featured — подсвеченный пункт (ранний доступ к приложениям).
const BONUSES = [
  { key: 'constructor', text: 'Ранний доступ к нашему приложению «Конструктор оснасток»', featured: true },
  { key: 'calculator', text: 'Ранний доступ к нашему приложению «Калькулятор проектов»', featured: true },
  { key: 'links', text: 'Ссылки на проверенные материалы и поставщиков' },
  { key: 'discounts', text: 'Скидки на стартовые закупки' },
  { key: 'chat', text: 'Доступ в закрытый чат мастеров (2000+ участников)' },
  { key: 'models', text: '10 готовых моделей для отработки навыков' },
  { key: 'gypsum', text: 'Курс по гипсу Shape.studio от наших партнёров 24 Grams' },
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
const PARTNERS = [
  {
    name: 'ХимСнаб Композит',
    role: 'силиконы и материалы',
    domain: 'igc-market.ru',
    href: 'https://igc-market.ru/?utm_source=anyforms-course',
    src: '/himsnab-logo.png',
    bio:
      'Поставщик силиконов и материалов для литья — у них мы закупаем силикон для производства.',
  },
  {
    name: '24 Grams',
    role: 'компоненты для рукоделия',
    domain: '24gr.ru',
    href: 'https://24gr.ru/?utm_source=anyforms-course',
    src: '/24grams-logo.png',
    square: true,
    bio:
      'Магазин компонентов для свечеварения, мыловарения и косметики: воски, аромамасла, фитили и красители.',
  },
  {
    name: '3D OUTLET',
    role: 'оборудование для 3D-печати',
    domain: '3d-outlet.ru',
    href: 'https://3d-outlet.ru/?utm_source=anyforms-course',
    src: '/3d-outlet-logo.svg',
    square: true,
    bio:
      'Официальный представитель Bambu Lab в СНГ.',
  },
];

const FAQ = [
  {
    q: 'С каким силиконом будем работать?',
    a: [
      'В курсе мы работаем с оловянным силиконом. Он прощает больше ошибок и отлично подходит для отработки технологии и серийного литья гипсовых изделий.',
      'Мы осознанно выбрали именно его, чтобы вы могли уверенно повторить результат без сложных условий. Платиновый силикон мы отдельно не разбираем в рамках этого курса, чтобы не перегружать старт.',
    ],
  },
  {
    q: 'Будем учиться моделированию мастер-моделей?',
    a: [
      'Нет, отдельного блока по моделированию мастер-моделей в курсе не будет. Это большая тема, которой можно посвятить отдельное обучение.',
      'При этом на практике производителю силиконовых форм совсем не обязательно самостоятельно моделировать изделия. Например, мы сами около 80% моделей изделий заказываем у 3D-художников по нашему ТЗ и занимаемся уже тем, в чём действительно заключается работа формодела — проектированием оснастки и изготовлением силиконовых форм.',
      'Кроме этого, существует большое количество готовых бесплатных 3D-моделей, которые можно использовать в работе, а также всегда можно заказать 3D-сканирование физического изделия и изготовить форму уже по его цифровой копии.',
      'Полученные на курсе навыки одинаково применимы к любой 3D-модели — независимо от того, смоделировали вы её самостоятельно, скачали готовую или заказали у специалиста.',
    ],
  },
  {
    q: 'На этом реально зарабатывать?',
    a: [
      'Да. Уже во время обучения вы изготовите готовую форму для контейнерной свечи на новогоднюю тематику. Её можно использовать для изготовления и продажи готовых изделий либо продавать саму форму другим мастерам. Мы специально выбрали сезонный продукт, чтобы после обучения у вас была возможность сразу начать его продавать.',
      'Кроме основного проекта, вы получите пакет уникальных моделей, созданных специально для курса. На них вы сможете самостоятельно закрепить полученные навыки, собрать первое портфолио и использовать их для изготовления изделий или продажи готовых форм.',
      'Дальше всё зависит только от вас — использовать этот навык для собственных проектов или выполнять заказы клиентов.',
    ],
  },
  {
    q: 'Когда откроется доступ к курсу?',
    a: `Курс стартует ${LAUNCH} — в этот день откроем доступ ко всем материалам. До старта действует цена предзаказа. Если запишетесь после запуска, ссылку на материалы пришлём на почту после оплаты.`,
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
];

// Пункт FAQ: высота анимируется grid-переходом 0fr → 1fr, без замера контента.
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}>
      <button
        type="button"
        className={styles.faqQ}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{q}</span>
        <span className={styles.faqIcon} aria-hidden>
          {/* SVG вместо текстового «+»: у глифа центр не совпадает с центром
              бокса, из-за чего поворот его смещал. */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1v14M1 8h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div className={styles.faqAWrap} aria-hidden={!open}>
        <div className={styles.faqA}>
          {(Array.isArray(a) ? a : [a]).map((par) => (
            <p key={par}>{par}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const CHECKOUT_PATH = '/course/checkout';

// Все CTA ведут к единственному офферу (#buy); на чекаут уходит только кнопка внутри него.
// Якорь ставим не на верх секции (там бейдж запуска и большой заголовок съедают
// экран, а кнопка «Записаться на курс» остаётся за кадром), а на первую карточку тарифа.
const scrollToBuy = () => {
  const card = document.getElementById('buy-tariffs')?.firstElementChild;
  if (!card) {
    scrollToId('buy');
    return;
  }
  const headerH = document.querySelector('header')?.offsetHeight ?? 0;
  const offset = headerH + 16;
  // Карточка выше экрана — прижимаем её низ, чтобы цена и кнопка точно были видны.
  const targetTop = () => {
    const rect = card.getBoundingClientRect();
    const cardTop = window.scrollY + rect.top;
    const top =
      rect.height <= window.innerHeight - offset
        ? cardTop - offset
        : cardTop + rect.height - window.innerHeight + 16;
    const maxTop = document.documentElement.scrollHeight - window.innerHeight;
    return Math.min(Math.max(top, 0), maxTop);
  };
  window.scrollTo({ top: targetTop(), behavior: 'smooth' });
  // Пока идёт плавный скролл, страница «едет» (lazy-картинки, сворачивание
  // адресной строки на мобильных) — после остановки один раз доводим до цели.
  const settle = () => {
    if (Math.abs(window.scrollY - targetTop()) > 8) {
      window.scrollTo({ top: targetTop(), behavior: 'smooth' });
    }
  };
  if ('onscrollend' in window) {
    window.addEventListener('scrollend', settle, { once: true });
  } else {
    setTimeout(settle, 750);
  }
};

const NAV_LINKS = [
  { key: 'modules', label: 'Программа', id: 'modules' },
  { key: 'founders', label: 'О нас', id: 'founders' },
  { key: 'cases', label: 'Кейсы', id: 'cases' },
  { key: 'faq', label: 'Вопросы', id: 'faq' },
];

// Обратный отсчёт до конца цены предзаказа: «время заканчивается — успевайте».
const Countdown = ({ left, className = '' }) => {
  if (left.closed) return null;
  const cells = [
    [String(left.days), daysLabel(left.days)],
    [left.hours, 'ч'],
    [left.minutes, 'мин'],
    [left.seconds, 'сек'],
  ];
  return (
    <div className={`${styles.countdown} ${className}`} role="timer">
      <span className={styles.countdownLabel}>
        <span className={styles.countdownPulse} aria-hidden />
        Цена предзаказа скоро закончится! Успей записаться
      </span>
      <div className={styles.countdownDigits}>
        {cells.map(([value, label], i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <span className={styles.countdownColon} aria-hidden>
                :
              </span>
            )}
            <span className={styles.countdownCell}>
              <span className={styles.countdownValue}>{value}</span>
              <span className={styles.countdownUnit}>{label}</span>
            </span>
          </React.Fragment>
        ))}
      </div>
      <p className={styles.countdownNote}>
        Цена предзаказа {COURSE_PRODUCT.preorderPrice} действует до {LAUNCH_SHORT} 00:00
        по Москве, после старта — {COURSE_PRODUCT.price}.
      </p>
    </div>
  );
};

// Компактный отсчёт внутри карточки цены в hero — «времени осталось мало».
const HeroTimer = ({ left }) => {
  if (left.closed) return null;
  return (
    <span className={styles.heroTimer} role="timer">
      <span className={styles.heroTimerDot} aria-hidden />
      Осталось{' '}
      <strong>
        {left.days > 0 && `${left.days} ${daysLabel(left.days)} `}
        {left.hours}:{left.minutes}:{left.seconds}
      </strong>
    </span>
  );
};

const AppScreen = ({ id, title, lead, points, media, mediaAlt, onCta }) => (
  <section id={id} className={styles.appSection} aria-labelledby={`${id}-title`}>
    <div className={styles.sectionInner}>
      <div className={`${styles.appInner} ${media.length > 0 ? styles.appInnerWithMedia : ''}`}>
        <div>
          <span className={styles.pillBadge}>Ранний доступ для участников курса</span>
          <h2 className={styles.sectionTitle} id={`${id}-title`}>
            {title}
          </h2>
          <p className={styles.darkLead}>{lead}</p>
          <ul className={styles.appList}>
            {points.map((point) => (
              <li className={styles.offerItem} key={point}>
                <span className={styles.offerCheck} aria-hidden>
                  →
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`${styles.cta} ${styles.ctaInline} ${styles.appCta}`}
            onClick={onCta}
          >
            Записаться на курс
            <span className={styles.ctaArrow} aria-hidden>
              <ArrowIcon />
            </span>
          </button>
        </div>
        {media.length > 0 && (
          <div className={styles.appMedia}>
            <AppMedia items={media} alt={mediaAlt} />
          </div>
        )}
      </div>
    </div>
  </section>
);

const Placeholder = ({ label, ratio, dark }) => (
  <div className={`${styles.ph} ${dark ? styles.phDark : ''}`} data-ratio={ratio}>
    <span className={styles.phLabel}>{label}</span>
  </div>
);

const CourseLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const promoFromUrl = getPromoFromSearch(location.search);

  // На чекаут уходим со сквозными promo/utm из текущего URL.
  const goToCheckout = () => navigate(`${CHECKOUT_PATH}${buildPassThroughQuery(location.search)}`);

  // Промокод из ссылки (?promo=...): проверяем на бэке и, если валиден,
  // зачёркиваем цену и показываем скидочную.
  const saleLeft = useSaleCountdown();
  const preorder = !saleLeft.closed;
  const [promo, setPromo] = useState(null);
  const [promoPopupOpen, setPromoPopupOpen] = useState(false);
  useEffect(() => {
    if (!promoFromUrl) {
      setPromo(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.instance.get('/api/payment/promo-check', {
          params: { code: promoFromUrl, productCode: COURSE_PRODUCT.code },
        });
        if (!cancelled && data?.valid) {
          setPromo(data);
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

  const reviews = FIRST_STREAM_REVIEWS.filter((review) => review.image);
  const isGuidePromo = promo?.code === GUIDE_PROMO_CODE;
  const promoDeadline = formatPromoDeadlineNote(promo?.validUntil);
  const shownPrice = promo ? formatKopecks(promo.discountedPriceKopecks) : coursePrice(preorder);
  const shownOldPrice = promo ? formatKopecks(promo.priceKopecks) : preorder && COURSE_PRODUCT.price;

  return (
    <div className={styles.page}>
      <SiteHeader
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
            label: 'Записаться на курс',
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
            label: 'Записаться на курс',
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

      {promoPopupOpen && promo && (
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
              По промокоду {promo.code} вам доступна скидка{' '}
              {promoDiscountLabel(promo)} — она уже применилась к ценам курса.
              {promoDeadline && <> Скидка действует {promoDeadline}.</>}
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
                  <span className={styles.heroPrice}>{shownPrice}</span>
                  {shownOldPrice && <span className={styles.heroPriceOld}>{shownOldPrice}</span>}
                </div>
                <button type="button" className={styles.cta} onClick={scrollToBuy}>
                  Записаться на курс
                  <span className={styles.ctaArrow} aria-hidden>
                    <ArrowIcon />
                  </span>
                </button>
                <HeroTimer left={saleLeft} />
                <p className={`${styles.preorderNote} ${styles.preorderNoteMobile}`}>
                  {preorder
                    ? `Запуск — ${LAUNCH}. Успейте записаться по цене предзаказа.`
                    : `Курс стартовал ${LAUNCH}.`}
                </p>
              </div>
            </div>

            {promo && (
              <p className={styles.promoStrip}>
                Промокод {promo.code} применён — скидка {promoDiscountLabel(promo)}
                {promoDeadline ? `. Ваша скидка действует ${promoDeadline}.` : '.'}
              </p>
            )}
            <p className={`${styles.preorderNote} ${styles.preorderNoteDesktop}`}>
              {preorder
                ? `Запуск — ${LAUNCH}. До старта действует цена предзаказа, после — ${COURSE_PRODUCT.price}.`
                : `Курс стартовал ${LAUNCH}. После оплаты пришлём ссылку на материалы на почту.`}
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
            <span className={styles.heroBadge}>второй поток · старт {LAUNCH}</span>
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

      {/* ═══════════════ ЭКРАН 1.2 · ПАРТНЁРЫ ═══════════════ */}
      <section className={styles.partnersSection} aria-labelledby="partners-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Партнёры</span>
            <h2 className={styles.sectionTitle} id="partners-title">
              Наши партнёры
            </h2>
          </div>
          <div className={styles.partnersScroller}>
            {PARTNERS.map((p) => (
              <a
                className={styles.partnerCard}
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer"
              >
                <span className={styles.partnerCardChip}>
                  <img
                    className={`${styles.partnerCardLogo} ${
                      p.square ? styles.partnerLogoSquare : ''
                    }`}
                    src={p.src}
                    alt={p.name}
                    loading="lazy"
                  />
                </span>
                <div>
                  <h3 className={styles.founderName}>{p.name}</h3>
                  <p className={styles.founderRole}>{p.role}</p>
                  <p className={styles.founderBio}>{p.bio}</p>
                  <span className={styles.partnerDomain}>{p.domain}</span>
                </div>
              </a>
            ))}
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

      {/* ═══════════════ ЭКРАН 3.5 · ОТЗЫВЫ ПЕРВОГО ПОТОКА ═══════════════ */}
      {reviews.length > 0 && (
        <section id="reviews" className={styles.reviewsSection} aria-labelledby="reviews-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Отзывы</span>
              <h2 className={styles.sectionTitle} id="reviews-title">
                Отзывы участников первого потока
              </h2>
              <p className={styles.sectionLead}>
                Курс проходят люди из самых разных ниш — нырнуть в обучение можно с любым
                опытом.
              </p>
            </div>
            <p className={styles.swipeHint}>← Листайте, чтобы посмотреть отзывы →</p>
          </div>
          <div className={styles.casesScroller}>
            {reviews.map((review) => (
              <figure className={styles.reviewItem} key={review.image}>
                <img
                  className={styles.reviewImg}
                  src={review.image}
                  alt={`Отзыв: ${review.name}, ${review.role}`}
                  loading="lazy"
                />
                <figcaption className={styles.reviewCaption}>
                  <strong>{review.name}</strong>, {review.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════ ЭКРАН 4 · МОДУЛИ ═══════════════ */}
      <section id="modules" className={styles.modulesSection} aria-labelledby="modules-title">
        <div className={styles.sectionInner}>
          <div className={styles.modulesLayout}>
            <div className={styles.modulesHead}>
              <span className={styles.eyebrow}>Программа</span>
              <h2 className={styles.sectionTitle} id="modules-title">
                Весь цикл —{' '}
                <em className={styles.hAccent}>за&nbsp;5&nbsp;модулей</em>
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
                    {mod.items.map((item, i) => (
                      <li className={styles.moduleItem} key={i}>
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
              <article
                className={`${styles.getCard} ${card.wide ? styles.getCardWide : ''}`}
                key={card.title}
              >
                <span className={styles.getCardIcon} aria-hidden>
                  {card.icon || '✓'}
                </span>
                <h3 className={styles.getCardTitle}>{card.title}</h3>
                {card.text.map((paragraph, i) => (
                  <p className={styles.getCardText} key={i}>
                    {paragraph}
                  </p>
                ))}
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
              <div
                className={`${styles.bonusItem} ${
                  item.featured ? styles.bonusItemFeatured : ''
                }`}
                key={item.key}
              >
                <span className={styles.bonusStar} aria-hidden>
                  ★
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 8.5 · КАЛЬКУЛЯТОР ПРОЕКТОВ ═══════════════ */}
      <AppScreen
        id="calculator"
        title={
          <>
            Калькулятор проектов —{' '}
            <span className={styles.textAccent}>стоимость заказа</span> без догадок
          </>
        }
        lead="Программа, в которую вы заводите всё, из чего складывается заказ, — а она считает его стоимость. Так вы не продешевите, не уйдёте в минус и сразу получите коммерческое предложение для заказчика."
        points={[
          'Все затраты по заказу — в одном расчёте',
          'Видно, окупится ли проект, ещё до того, как вы назовёте цену',
          'Коммерческое предложение для заказчика — автоматически',
        ]}
        media={CALCULATOR_MEDIA}
        mediaAlt="Калькулятор проектов anyforms"
        onCta={scrollToBuy}
      />

      {/* ═══════════════ ЭКРАН 8.6 · КОНСТРУКТОР ОСНАСТОК ═══════════════ */}
      <AppScreen
        id="constructor"
        title={
          <>
            Конструктор оснасток —{' '}
            <span className={styles.textAccent}>опалубка</span> без 3D-моделирования
          </>
        }
        lead="Опалубка — внешняя часть силиконовой формы. Силикон заливают между 3D-моделью изделия и опалубкой — так и получается форма. Конструктор помогает сделать опалубку под ваше изделие, даже если вы не работаете в 3D-редакторах."
        points={[
          'Опалубка под ваше изделие — без ручного моделирования',
          'Помогает решить даже сложные инженерные задачи',
        ]}
        media={CONSTRUCTOR_MEDIA}
        mediaAlt="Конструктор оснасток anyforms"
        onCta={scrollToBuy}
      />

      {/* ═══════════════ ЭКРАН 11 · ОФФЕР / ЦЕНА ═══════════════ */}
      <section id="buy" className={styles.buySection} aria-labelledby="buy-title">
        <div className={styles.sectionInner}>
          <div className={styles.buyInner}>
            <span className={styles.pillBadge}>Второй поток · запуск {LAUNCH_SHORT}</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="buy-title">
              Запишитесь на <em className={styles.hAccent}>второй поток</em>
            </h2>
            <Countdown left={saleLeft} className={styles.countdownBuy} />
            <div className={styles.tariffGrid} id="buy-tariffs">
              <article className={`${styles.tariffCard} ${styles.tariffCardFeatured}`}>
                <span className={styles.tariffBadge}>{preorder ? 'Предзаказ' : 'Второй поток'}</span>
                <span className={styles.tariffIcon} aria-hidden>
                  <VideoIcon size={26} />
                </span>
                <h3 className={styles.tariffName}>Курс по производству силиконовых форм</h3>
                <p className={styles.tariffDesc}>
                  Видеокурс в своём темпе, онлайн-семинары и 3 месяца поддержки.
                </p>
                <ul className={styles.tariffList}>
                  {COURSE_FEATURES.map((item) => (
                    <li className={styles.buyIncludedItem} key={item}>
                      <span className={styles.buyCheck} aria-hidden>
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.tariffPriceWrap}>
                  {shownOldPrice && <span className={styles.tariffPriceOld}>{shownOldPrice}</span>}
                  <span className={styles.tariffPrice}>{shownPrice}</span>
                </div>
                {promo && (
                  <p className={styles.tariffPromoNote}>
                    Промокод {promo.code}: скидка {promoDiscountLabel(promo)}
                    {promoDeadline ? `, действует ${promoDeadline}` : ''}. Применится на оплате.
                  </p>
                )}
                <button
                  type="button"
                  className={`${styles.cta} ${styles.tariffCta}`}
                  onClick={goToCheckout}
                >
                  Записаться на курс
                  <span className={styles.ctaArrow} aria-hidden>
                    <ArrowIcon />
                  </span>
                </button>
              </article>
            </div>
            <span className={styles.buyMeta}>
              {preorder ? (
                <>
                  <span>Цена предзаказа — до {LAUNCH_SHORT}</span>
                  <span>Доступ откроется {LAUNCH}</span>
                </>
              ) : (
                <span>Курс стартовал {LAUNCH}</span>
              )}
              <span>Материалы — навсегда</span>
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 11.5 · ЧТО ПОНАДОБИТСЯ ═══════════════ */}
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
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 13 · ФИНАЛ ═══════════════ */}
      <section className={styles.darkSection} aria-labelledby="final-title">
        <div className={styles.sectionInner}>
          <div className={styles.finalInner}>
            <span className={styles.eyebrowAccent}>Второй поток · старт {LAUNCH}</span>
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
                ИП Суворов Дмитрий Игоревич
                <br />
                ИНН 590699241510 · г. Санкт-Петербург
                <br />
                <a className={styles.footerLink} href="/requisites?from=course">
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
              Курс — цифровой информационный продукт. Старт второго потока — {LAUNCH}.
              Материалы остаются бессрочно. Оформляя покупку, вы принимаете условия{' '}
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

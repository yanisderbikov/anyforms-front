import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import apiClient from '../../apiClient';
import {
  getPromoFromSearch,
  buildPassThroughQuery,
  formatPromoDeadlineNote,
} from '../../shared/promoTracking';
import { COURSE_PLANS } from './CourseCheckout';
import { useSaleCountdown, daysLabel, PERSONAL_CLOSED } from './courseSale';
import styles from './CourseLanding.module.css';

const LAUNCH = '1 сентября 2026';
const LAUNCH_SHORT = '1 сентября';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';
// Канал, куда уводим опоздавших: расскажем о следующем наборе.
const TG_CHANNEL = 'https://t.me/anyforms';
// Промокод гайда — по нему в попапе показывается заголовок-благодарность.
const GUIDE_PROMO_CODE = 'ГАЙД';
// Флаг «попап уже показывали» — чтобы не всплывал заново при возврате с чекаута.
const PROMO_POPUP_SEEN_KEY = 'af_promo_popup_seen';

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

// Экран 8 — бонусы. featured — подсвеченный пункт (розыгрыш принтера).
const BONUSES = [
  {
    text: 'Розыгрыш 3D-принтера Bambu Lab P2S Combo среди всех участников курса',
    featured: true,
  },
  {
    text: 'Розыгрыш материалов от ХимСнаб — 10 кг силикона на основе олова',
    featured: true,
  },
  { text: 'Ссылки на проверенные материалы и поставщиков' },
  { text: 'Скидки на стартовые закупки' },
  { text: 'Доступ в закрытый чат мастеров (2000+ участников)' },
  { text: '10 готовых моделей для отработки навыков' },
  { text: 'Пак с оснастками (простая геометрия 1000+ stl)' },
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
      'Поставщик силиконов и материалов для литья — у них мы закупаем силикон для производства. Для розыгрыша предоставили два комплекта по 5 кг.',
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
      'Официальный представитель Bambu Lab в СНГ. Спонсор нашего розыгрыша — предоставил принтер Bambu Lab P2S Combo.',
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
    a: `Сейчас открыт набор. Доступ ко всем материалам откроется ${LAUNCH} — сразу после старта.`,
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

// Обратный отсчёт до закрытия набора: «время заканчивается — успевайте».
const Countdown = ({ left, className = '' }) => {
  if (left.closed) {
    return (
      <div className={`${styles.countdown} ${styles.countdownClosed} ${className}`}>
        <span className={styles.countdownLabel}>Набор закрыт</span>
        <p className={styles.countdownNote}>
          Курс стартовал {LAUNCH_SHORT} — набор закрыт. Напишите нам в
          Telegram — подскажем, когда откроется следующий набор.
        </p>
      </div>
    );
  }
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
        Набор скоро закроется! Успей записаться
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
        Набор закрывается {LAUNCH_SHORT} в 00:00 по Москве.
      </p>
    </div>
  );
};

// Компактный отсчёт внутри карточки цены в hero — «времени осталось мало».
const HeroTimer = ({ left }) => {
  if (left.closed) {
    return <span className={styles.heroTimer}>Курс стартовал {LAUNCH_SHORT}</span>;
  }
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
  const saleLeft = useSaleCountdown();
  const saleClosed = saleLeft.closed;
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

  // Попап «запись закрыта»: при открытии страницы, при долистывании до конца
  // и при клике на любую CTA. Задача — увести опоздавших в телеграм-канал.
  const [closedPopupOpen, setClosedPopupOpen] = useState(false);
  const bottomShownRef = useRef(false);
  useEffect(() => {
    if (!saleClosed) return undefined;
    const id = setTimeout(() => setClosedPopupOpen(true), 800);
    const onScroll = () => {
      if (bottomShownRef.current) return;
      const scrolledToEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200;
      if (scrolledToEnd) {
        bottomShownRef.current = true;
        setClosedPopupOpen(true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener('scroll', onScroll);
    };
  }, [saleClosed]);

  // Все CTA: пока набор открыт — скроллим к тарифам, после закрытия — попап.
  const onCtaClick = () => {
    if (saleClosed) {
      setClosedPopupOpen(true);
      return;
    }
    scrollToBuy();
  };

  const heroSelfPromo = promoByPlan?.self;
  const isGuidePromo = heroSelfPromo?.code === GUIDE_PROMO_CODE;
  const promoDeadline = formatPromoDeadlineNote(heroSelfPromo?.validUntil);

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
            label: 'Записаться на курс',
            variant: 'pill',
            onClick: (e) => {
              e.preventDefault();
              onCtaClick();
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
              onCtaClick();
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
              {promoDiscountLabel(heroSelfPromo)} — она уже применилась к ценам курса.
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

      {closedPopupOpen && (
        <div
          className={styles.promoModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="closed-popup-title"
          onClick={() => setClosedPopupOpen(false)}
        >
          <div className={styles.promoModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.promoModalClose}
              onClick={() => setClosedPopupOpen(false)}
              aria-label="Закрыть"
            >
              ×
            </button>
            <h2 className={styles.promoModalTitle} id="closed-popup-title">
              Запись закрыта
            </h2>
            <p className={styles.promoModalText}>
              Курс стартовал {LAUNCH_SHORT}, и набор этого потока завершён. Подпишитесь
              на наш телеграм-канал — там мы первыми сообщим о следующем наборе и
              делимся закулисьем производства.
            </p>
            <div className={styles.closedModalBtns}>
              <a
                className={`${styles.cta} ${styles.closedModalTg}`}
                href={TG_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Перейти в Telegram
                <span className={styles.ctaArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              </a>
              <button
                type="button"
                className={styles.closedModalDismiss}
                onClick={() => setClosedPopupOpen(false)}
              >
                Закрыть
              </button>
            </div>
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
                {saleClosed ? (
                  <button
                    type="button"
                    className={`${styles.cta} ${styles.ctaDisabled}`}
                    onClick={() => setClosedPopupOpen(true)}
                  >
                    Набор закрыт
                  </button>
                ) : (
                  <button type="button" className={styles.cta} onClick={onCtaClick}>
                    Записаться на курс
                    <span className={styles.ctaArrow} aria-hidden>
                      <ArrowIcon />
                    </span>
                  </button>
                )}
                <HeroTimer left={saleLeft} />
                <p className={`${styles.preorderNote} ${styles.preorderNoteMobile}`}>
                  Запуск — {LAUNCH}. Успейте записаться до старта.
                </p>
              </div>
            </div>

            {heroSelfPromo && (
              <p className={styles.promoStrip}>
                Промокод {heroSelfPromo.code} применён — скидка {promoDiscountLabel(heroSelfPromo)}
                {promoDeadline ? `. Ваша скидка действует ${promoDeadline}.` : '.'}
              </p>
            )}
            <p className={`${styles.preorderNote} ${styles.preorderNoteDesktop}`}>
              Запуск — {LAUNCH}. Успейте записаться до старта: после запуска набор закрывается.
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
              <div
                className={`${styles.bonusItem} ${
                  item.featured ? styles.bonusItemFeatured : ''
                }`}
                key={item.text}
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

      {/* ═══════════════ ЭКРАН 8.5 · РОЗЫГРЫШ ПРИНТЕРА ═══════════════ */}
      <section className={styles.raffleSection} aria-labelledby="raffle-title">
        <div className={styles.sectionInner}>
          <div className={styles.raffleInner}>
            <div className={styles.raffleContent}>
              <div className={styles.raffleHead}>
                <span className={styles.pillBadge}>Розыгрыш</span>
                <h2
                  className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`}
                  id="raffle-title"
                >
                  Разыгрываем 3D&#8209;принтер{' '}
                  <span className={styles.textAccent}>
                    Bambu&nbsp;Lab P2S&nbsp;Combo
                  </span>
                </h2>
              </div>
              <p className={styles.darkLead}>
                Среди всех участников курса разыграем Bambu Lab P2S Combo —
                принтер в комплекте с системой многоцветной печати AMS&nbsp;2.
                А также два комплекта силикона от ХимСнаб Композит — по
                5&nbsp;кг твёрдостью 10 и 20&nbsp;Shore&nbsp;A. Запишитесь
                на любой тариф — и вы автоматически участвуете.
              </p>
              <p className={styles.raffleSub}>
                Розыгрыш пройдёт {LAUNCH} в Telegram — победителя открыто
                определит рандомайзер.
              </p>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline} ${styles.raffleCta}`}
                onClick={onCtaClick}
              >
                Участвовать в розыгрыше
                <span className={styles.ctaArrow} aria-hidden>
                  <ArrowIcon />
                </span>
              </button>
            </div>
            <div className={styles.raffleMedia}>
              <img
                className={styles.raffleImg}
                src="/bambu-p2s-combo.jpeg"
                alt="3D-принтер Bambu Lab P2S Combo с системой AMS 2"
                loading="lazy"
              />
              <div className={styles.raffleSponsor}>
                <span className={styles.raffleSponsorChip}>
                  <img
                    className={styles.raffleSponsorLogo}
                    src="/3d-outlet-logo.svg"
                    alt="3D OUTLET"
                    loading="lazy"
                  />
                </span>
                <span className={styles.raffleSponsorNote}>
                  Спонсор розыгрыша — 3D OUTLET, официальный представитель
                  Bambu&nbsp;Lab в&nbsp;СНГ{' '}
                  <a
                    className={styles.raffleSponsorLink}
                    href="https://3d-outlet.ru/?utm_source=anyforms-course"
                    target="_blank"
                    rel="noreferrer"
                  >
                    3d-outlet.ru
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 11 · ОФФЕР / ЦЕНА ═══════════════ */}
      <section id="buy" className={styles.buySection} aria-labelledby="buy-title">
        <div className={styles.sectionInner}>
          <div className={styles.buyInner}>
            <span className={styles.pillBadge}>Запуск — {LAUNCH_SHORT}</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="buy-title">
              <em className={styles.hAccent}>Два</em> формата участия
            </h2>
            <Countdown left={saleLeft} className={styles.countdownBuy} />
            <div className={styles.tariffGrid} id="buy-tariffs">
              {TARIFFS.map((tariff) => {
                const promo = promoByPlan?.[tariff.key];
                const isPersonal = tariff.key === 'personal';
                // «Личное ведение» больше не продаём; после дедлайна закрыты оба тарифа.
                const personalClosed = isPersonal && PERSONAL_CLOSED;
                const closed = saleClosed || personalClosed;
                return (
                  <article
                    key={tariff.key}
                    className={`${styles.tariffCard} ${
                      isPersonal && !personalClosed ? styles.tariffCardFeatured : ''
                    } ${closed ? styles.tariffCardClosed : ''}`}
                  >
                    {isPersonal && (
                      <span
                        className={`${styles.tariffBadge} ${
                          personalClosed ? styles.tariffBadgeClosed : ''
                        }`}
                      >
                        {personalClosed ? 'Набор закрыт' : 'Рекомендуем'}
                      </span>
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
                        Промокод {promo.code}: скидка {promoDiscountLabel(promo)}
                        {formatPromoDeadlineNote(promo.validUntil)
                          ? `, действует ${formatPromoDeadlineNote(promo.validUntil)}`
                          : ''}
                        . Применится на оплате.
                      </p>
                    )}
                    {closed ? (
                      <>
                        <button
                          type="button"
                          className={`${styles.cta} ${styles.tariffCta} ${styles.ctaDisabled}`}
                          disabled={!saleClosed}
                          onClick={saleClosed ? () => setClosedPopupOpen(true) : undefined}
                        >
                          Набор закрыт
                        </button>
                        <p className={styles.tariffClosedNote}>
                          {personalClosed
                            ? 'Мест на личное ведение больше нет. Остался тариф «Самостоятельное изучение».'
                            : 'Курс стартовал — набор завершён.'}
                        </p>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={`${styles.cta} ${styles.tariffCta}`}
                        onClick={() => goToCheckout(tariff.key)}
                      >
                        Записаться на курс
                        <span className={styles.ctaArrow} aria-hidden>
                          <ArrowIcon />
                        </span>
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
            <span className={styles.buyMeta}>
              <span>Цена до старта</span>
              <span>Доступ откроется {LAUNCH}</span>
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
            <span className={styles.eyebrowAccent}>Старт {LAUNCH}</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="final-title">
              Начните делать формы с&nbsp;<span className={styles.textAccent}>предсказуемым</span> результатом
            </h2>
            <div className={styles.finalCtaRow}>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline}`}
                onClick={onCtaClick}
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
              Курс — цифровой информационный продукт. Доступ
              к материалам откроется {LAUNCH}. Материалы остаются бессрочно, ведение
              специалистов на тарифе «Личное ведение» — 1 месяц. Оформляя покупку, вы
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

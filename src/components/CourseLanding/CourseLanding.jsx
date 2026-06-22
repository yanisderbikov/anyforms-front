import React from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './CourseLanding.module.css';

const PRICE = '8 700 ₽';
const PRICE_OLD = '20 000 ₽';
const LAUNCH = '10 июля 2026';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';
const HERO_IMAGE = 'https://storage.yandexcloud.net/anyforms/shop/samovar/3.jpeg';
const OFFER_IMAGE = 'https://storage.yandexcloud.net/anyforms/course/model-order.jpg';

// Чипы под заголовком — короткие факты о формате курса.
const HERO_CHIPS = ['4 модуля', 'Видео-формат', 'Материалы навсегда', '3 месяца ведения'];

// Цифры-доказательства — реальное производство AnyForms.
const HERO_STATS = [
  { value: '5 лет', label: 'делаем формы на заказ' },
  { value: '100 тыс+', label: 'изготовленных форм' },
  { value: '2 млн ₽', label: 'выручка в месяц' },
];

// Экран 2 — что вы сделаете своими руками (галерея процесса).
const RESULT_SHOTS = [
  { src: 'https://storage.yandexcloud.net/anyforms/course/process-1.jpeg', alt: 'Опалубка' },
  { src: 'https://storage.yandexcloud.net/anyforms/course/process-2.jpeg', alt: 'Литьё силикона' },
  { src: 'https://storage.yandexcloud.net/anyforms/course/process-3.jpeg', alt: 'Процесс изготовления формы' },
  { src: 'https://storage.yandexcloud.net/anyforms/course/process-4.jpeg', alt: 'Готовая форма' },
];

// Экран 4 — 4 модуля курса.
const MODULES = [
  {
    title: 'Проектирование',
    items: [
      '3D-модель будущего изделия',
      'Опалубка (оснастка) под заливку',
      'Мастер-модель для формы',
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
    title: 'Подготовка к заливке',
    items: [
      'Какой силикон подобрать под задачу',
      'Как изготовить и обработать мастер-модель',
      'Сборка оснастки без перекосов',
      'Разделительные составы и подготовка поверхностей',
    ],
  },
  {
    title: 'Заливка силикона',
    items: [
      'Техника заливки формы без пузырей',
      'Как ускорить или замедлить схватывание силикона',
      'Извлечение и проверка готовой формы',
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

// Экран 6 — основатели AnyForms.
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
    bio:
      'Проектирует оснастки, мастер-модели и сложные технические решения — в том числе с вытеснениями. Отвечает за инженерную часть форм.',
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

// Экран 8 — бонусы.
const BONUSES = [
  'Ссылки на проверенные материалы и поставщиков',
  'Скидки на стартовые закупки',
  'Доступ в закрытый чат мастеров (2000+ участников)',
  '10 готовых моделей для отработки навыков',
  'Материалы по монетизации изделий',
  'Материалы по продвижению в соцсетях',
];

// Экран 9 — что нужно, чтобы пройти.
const NEED_CARDS = [
  { title: '3D-модель', text: 'Цифровая модель будущего изделия — основа для мастер-модели и оснастки.' },
  { title: '3D-моделирование', text: 'Навык превратить идею и размеры в готовую к печати модель. Разбираем на курсе.' },
  { title: '3D-принтер', text: 'Печать мастер-модели и оснастки: SLA для модели, FDM для оснастки.' },
];

const OFFER_ITEMS = [
  'От вас — только фото, размеры и идея',
  'Сделаем быстро и чётко по вашему заданию',
  'Цифровые услуги: 3D-модель, печать и другое',
];

// Экран 10 — поддержка на каждом этапе.
const SUPPORT_ITEMS = [
  'Помогаем на каждом этапе — от проектирования до заливки',
  'Любой вопрос пишите в поддержку — отвечают наш главный специалист и специалисты высшей категории',
  'Поможем довести ваше изделие до готового результата',
];

// Экран 11 — что входит в доступ.
const INCLUDED = [
  '4 видео-модуля: от идеи до рабочей формы',
  'Доступ к материалам — навсегда',
  '3 месяца ведения и поддержки специалистов',
  '10 готовых моделей для практики',
  'Закрытый чат мастеров (2000+)',
  'Поставщики, материалы и скидки на закупки',
];

// Экран 12 — FAQ.
const FAQ = [
  {
    q: 'Когда откроется доступ к курсу?',
    a: `Сейчас идёт предзаказ. Доступ ко всем материалам откроется ${LAUNCH} — по цене предзаказа, ниже будущей стоимости курса.`,
  },
  {
    q: 'Нужен ли свой 3D-принтер?',
    a: 'Нет. Можно заказать 3D-модель и печать у нас — нужны только фото, размеры и идея. Ученикам курса действует 50% скидка на все цифровые услуги.',
  },
  {
    q: 'Подойдёт ли новичку без опыта моделирования?',
    a: 'Да. Курс построен пошагово — от проектирования до заливки. Всё показываем на примере реального продукта, повторить можно с нуля, а на каждом этапе помогает поддержка.',
  },
  {
    q: 'Сколько денег нужно на материалы для старта?',
    a: 'Бюджет на первую форму — примерно 5 000 ₽. Дадим ссылки на проверенных поставщиков и скидки на стартовые закупки, чтобы не переплачивать.',
  },
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
  const goToCheckout = () => navigate(CHECKOUT_PATH);

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

      {/* ═══════════════ ЭКРАН 1 · HERO ═══════════════ */}
      <div id="top" />
      <section className={styles.hero} aria-label="О курсе">
        <div className={styles.heroInner}>
          <p className={`${styles.heroEyebrow} ${styles.areaEyebrow}`}>
            Предзаказ · старт {LAUNCH}
          </p>

          <h1 className={`${styles.heroTitle} ${styles.areaTitle}`}>
            Научись делать молды{' '}
            <mark className={styles.heroMark}>своими руками</mark>
          </h1>

          <p className={`${styles.heroSub} ${styles.areaSub}`}>
            Весь цикл производства — от идеи до рабочей формы. На примере реального
            продукта: дизайнерской контейнерной свечи.
          </p>

          <div className={`${styles.heroMedia} ${styles.areaMedia}`}>
            <img
              className={styles.heroImg}
              src={HERO_IMAGE}
              alt="Изделие, отлитое в силиконовой форме"
              loading="eager"
            />
          </div>

          <div className={`${styles.heroChips} ${styles.areaChips}`}>
            {HERO_CHIPS.map((chip) => (
              <span className={styles.heroChip} key={chip}>
                {chip}
              </span>
            ))}
          </div>

          <div className={`${styles.heroBuy} ${styles.areaBuy}`}>
            <div className={styles.heroPriceRow}>
              <div className={styles.heroPriceCol}>
                <span className={styles.heroPriceOld}>{PRICE_OLD}</span>
                <span className={styles.heroPrice}>{PRICE}</span>
              </div>
              <span className={styles.heroNote}>Цена предзаказа</span>
            </div>
            <button type="button" className={styles.cta} onClick={scrollToBuy}>
              Оформить предзаказ
            </button>
            <p className={styles.preorderNote}>
              Это предзаказ. Доступ к материалам откроется {LAUNCH}.
            </p>
          </div>

          <div className={`${styles.heroProof} ${styles.areaProof}`}>
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
      </section>

      {/* ═══════════════ ЭКРАН 2 · РЕЗУЛЬТАТ ═══════════════ */}
      <section className={styles.resultSection} aria-labelledby="result-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Результат</span>
            <h2 className={styles.sectionTitle} id="result-title">
              Вот что вы сделаете своими руками
            </h2>
            <p className={styles.sectionLead}>
              Готовая силиконовая форма для контейнерной свечи — без пузырей, без шва,
              со стабильной геометрией.
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
            Делайте уникальные молды — и&nbsp;стройте <span className={styles.textAccent}>своё дело</span>
          </h2>
          <blockquote className={styles.statementQuote}>
            «Вы сами решаете, что производить: любые уникальные формы под свои идеи и под
            маркетплейсы.»
          </blockquote>
          <p className={styles.darkLead}>
            После курса вы — руководитель своего дела: придумываете изделие, делаете под
            него молд и продаёте. Без чужих мастерских и ограничений.
          </p>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 4 · МОДУЛИ ═══════════════ */}
      <section id="modules" className={styles.modulesSection} aria-labelledby="modules-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Программа</span>
            <h2 className={styles.sectionTitle} id="modules-title">
              Весь цикл — за 4&nbsp;модуля
            </h2>
            <p className={styles.sectionLead}>
              Коротко и по делу, в видео-формате. Каждый модуль — отдельный этап
              производства.
            </p>
          </div>
          <div className={styles.modulesGrid}>
            {MODULES.map((mod, idx) => (
              <article className={styles.moduleCard} key={mod.title}>
                <span className={styles.moduleNum}>{idx + 1}</span>
                <h3 className={styles.moduleTitle}>{mod.title}</h3>
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
              Курс ведут сооснователи anyforms. Дмитрий годами отлаживал производство в
              цеху, а Юрий умеет объяснить это простыми словами.
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
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Что понадобится</span>
            <h2 className={styles.sectionTitle} id="need-title">
              Что нужно для старта
            </h2>
            <p className={styles.sectionLead}>
              Чтобы сделать форму, нужны три вещи. Если своего оборудования нет — это
              не проблема, мы поможем.
            </p>
          </div>

          <div className={styles.needGrid}>
            {NEED_CARDS.map((card, idx) => (
              <article className={styles.needCard} key={card.title}>
                <span className={styles.needNum}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className={styles.needCardTitle}>{card.title}</h3>
                <p className={styles.needCardText}>{card.text}</p>
              </article>
            ))}
          </div>

          <div className={styles.offerPanel}>
            <div>
              <span className={styles.offerLabel}>Нет оборудования?</span>
              <h3 className={styles.offerTitle}>Сделаем 3D-модель и печать за вас</h3>
              <p className={styles.offerText}>
                Не нужно покупать принтер и осваивать моделирование с нуля. Закажите
                3D-модель и печать у нас — нужны только фото, размеры и идея, остальное
                сделаем сами.
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
              <p className={styles.offerHighlight}>
                Ученикам курса — 50% скидка на все наши цифровые услуги.
              </p>
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

      {/* ═══════════════ ЭКРАН 10 · ПОДДЕРЖКА ═══════════════ */}
      <section className={styles.guaranteeSection} aria-labelledby="support-title">
        <div className={styles.sectionInner}>
          <div className={styles.guaranteeCard}>
            <span className={styles.guaranteeBadge} aria-hidden>
              💬
            </span>
            <h2 className={styles.guaranteeTitle} id="support-title">
              Всё под контролем — вы не&nbsp;одни
            </h2>
            <p className={styles.guaranteeText}>
              Вы не остаётесь один на один с задачей. На каждом этапе мы рядом и поможем
              довести изделие до результата.
            </p>
            <ul className={styles.supportList}>
              {SUPPORT_ITEMS.map((item) => (
                <li className={styles.supportItem} key={item}>
                  <span className={styles.supportCheck} aria-hidden>
                    →
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 11 · ОФФЕР / ЦЕНА ═══════════════ */}
      <section id="buy" className={styles.buySection} aria-labelledby="buy-title">
        <div className={styles.sectionInner}>
          <div className={styles.buyInner}>
            <span className={styles.eyebrowAccent}>Предзаказ</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="buy-title">
              Доступ ко&nbsp;всему курсу
            </h2>
            <ul className={styles.buyIncluded}>
              {INCLUDED.map((item) => (
                <li className={styles.buyIncludedItem} key={item}>
                  <span className={styles.buyCheck} aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className={styles.buyPriceRow}>
              <div className={styles.buyPriceWrap}>
                <span className={styles.buyPriceOld}>{PRICE_OLD}</span>
                <span className={styles.buyPrice}>{PRICE}</span>
              </div>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline}`}
                onClick={goToCheckout}
              >
                Оформить предзаказ
              </button>
              <span className={styles.buyMeta}>
                <span>Цена предзаказа</span>
                <span>Доступ откроется {LAUNCH}</span>
                <span>Материалы — навсегда, ведение — 3 месяца</span>
              </span>
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
              Начните делать формы с&nbsp;<span className={styles.textAccent}>предсказуемым результатом</span>
            </h2>
            <p className={styles.darkLead}>
              Цена предзаказа {PRICE} вместо {PRICE_OLD}. Доступ откроется {LAUNCH}.
              Материалы остаются навсегда, ведение специалистов — 3 месяца.
            </p>
            <div className={styles.finalCtaRow}>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline}`}
                onClick={scrollToBuy}
              >
                Оформить предзаказ
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
                [Реквизиты продавца]
                <br />
                [Город]
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
              специалистов — 3 месяца. Оформляя предзаказ, вы принимаете условия{' '}
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

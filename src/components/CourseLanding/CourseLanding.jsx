import React from 'react';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './CourseLanding.module.css';

const PRICE = '9 900 ₽';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';

// Чипы под заголовком — короткие факты о формате курса.
const HERO_CHIPS = ['4 модуля', 'Видео-формат', 'Доступ 12 месяцев', 'Закрытый чат'];

// Цифры-доказательства из наполнения курса.
const HERO_STATS = [
  { value: '4', label: 'модуля от идеи до формы' },
  { value: '10', label: 'моделей в подарок' },
  { value: '2000+', label: 'мастеров в чате' },
];

// Экран 2 — что вы сделаете своими руками (галерея).
const RESULT_SHOTS = [
  'Фото · оснастка в сборе и разборе',
  'Фото · заливка силикона',
  'Фото · готовая силиконовая форма',
  'Фото · финальная отливка свечи',
];

// Экран 4 — 4 модуля курса.
const MODULES = [
  {
    title: 'Проектирование',
    items: [
      'Оснастка под силикон, которая мало весит',
      'Легко собирается и разбирается',
      'Стабильна по геометрии и не даёт брак',
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
      'Какой силикон подобрать',
      'Как собрать без перекосов',
      'Когда нужна ручная обработка',
    ],
  },
  {
    title: 'Заливка силикона',
    items: [
      'Как залить форму без пузырей',
      'Как ускорить или замедлить схватывание',
      'Готовая рабочая форма на выходе',
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

// Экран 6 — факты об авторе. ЗАМЕНИТЬ на реальные данные.
const AUTHOR_FACTS = [
  '[Укажите: сколько лет в производстве форм]',
  '[Укажите: сколько форм сделали]',
  '[Укажите: своё производство / бренд]',
  '[Укажите: достижение или цифру выручки]',
];

// Экран 7 — отзывы. ЗАМЕНИТЬ на реальные.
const REVIEWS = [
  { name: '[Имя ученика]', meta: '[Город / профиль]', text: '[Текст отзыва ученика — что получилось после курса.]' },
  { name: '[Имя ученика]', meta: '[Город / профиль]', text: '[Текст отзыва ученика — про результат и продажи.]' },
  { name: '[Имя ученика]', meta: '[Город / профиль]', text: '[Текст отзыва ученика — про поддержку и чат.]' },
];

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
  'Стоимость — от 2 000 ₽',
];

// Экран 11 — что входит в доступ.
const INCLUDED = [
  '4 видео-модуля: от идеи до рабочей формы',
  'Доступ к материалам на 12 месяцев',
  '10 готовых моделей для практики',
  'Закрытый чат мастеров (2000+)',
  'Поставщики, материалы и скидки на закупки',
  'Материалы по монетизации и продвижению',
];

// Экран 12 — FAQ.
const FAQ = [
  {
    q: 'Нужен ли свой 3D-принтер?',
    a: 'Нет. Можно заказать 3D-модель и печать у нас — нужны только фото, размеры и идея. Ученикам курса на эту услугу действует большая скидка.',
  },
  {
    q: 'Подойдёт ли новичку без опыта моделирования?',
    a: 'Да. Курс построен пошагово — от проектирования до заливки. Всё показываем на примере реального продукта, повторить можно с нуля. [Уточните формулировку под свой курс.]',
  },
  {
    q: 'Сколько денег нужно на материалы для старта?',
    a: 'Дадим ссылки на проверенных поставщиков и скидки на стартовые закупки, чтобы не переплачивать. [Укажите примерный бюджет на первую форму.]',
  },
  {
    q: 'Сколько времени займёт прохождение?',
    a: 'Это 4 коротких модуля в видео-формате — пройти можно быстро, а доступ к материалам остаётся на 12 месяцев, чтобы возвращаться к нужным шагам.',
  },
  {
    q: 'Реально ли на этом заработать?',
    a: 'На выходе у вас рабочая форма, которую можно продавать или использовать для отливок на продажу. В бонусах — отдельные материалы по монетизации и продвижению в соцсетях.',
  },
];

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

// TODO: когда появится оплата курса — заменить на переход на /course/checkout.
const scrollToBuy = () => scrollToId('buy');

const NAV_LINKS = [
  { key: 'modules', label: 'Программа', id: 'modules' },
  { key: 'author', label: 'Автор', id: 'author' },
  { key: 'reviews', label: 'Отзывы', id: 'reviews' },
  { key: 'faq', label: 'Вопросы', id: 'faq' },
];

const Placeholder = ({ label, ratio, dark }) => (
  <div className={`${styles.ph} ${dark ? styles.phDark : ''}`} data-ratio={ratio}>
    <span className={styles.phLabel}>{label}</span>
  </div>
);

const CourseLanding = () => {
  return (
    <div className={styles.page}>
      <LandingHeader
        logo={{
          href: '#top',
          ariaLabel: 'AnyForms — курс по силиконовым формам',
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
            label: 'Получить доступ',
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
            label: 'Получить доступ',
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
            Видео-курс · 4 модуля
          </p>

          <h1 className={`${styles.heroTitle} ${styles.areaTitle}`}>
            Силиконовые формы, на&nbsp;которых можно{' '}
            <mark className={styles.heroMark}>зарабатывать</mark>
          </h1>

          <p className={`${styles.heroSub} ${styles.areaSub}`}>
            Весь цикл производства — от идеи до рабочей формы. На примере реального
            продукта: дизайнерской контейнерной свечи.
          </p>

          <div className={`${styles.heroMedia} ${styles.areaMedia}`}>
            <Placeholder
              label="Фото / видео · готовая силиконовая форма и свеча"
              ratio="portrait"
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
              <span className={styles.heroPrice}>{PRICE}</span>
              <span className={styles.heroNote}>Цена до конца недели</span>
            </div>
            <button type="button" className={styles.cta} onClick={scrollToBuy}>
              Получить доступ
            </button>
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
            {RESULT_SHOTS.map((label) => (
              <Placeholder key={label} label={label} ratio="landscape" />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 3 · БОЛЬ ═══════════════ */}
      <section className={styles.darkSection} aria-labelledby="pain-title">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrowAccent}>Зачем это вам</span>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="pain-title">
            Хватит терять деньги на&nbsp;<span className={styles.textAccent}>экспериментах</span>
          </h2>
          <blockquote className={styles.statementQuote}>
            «Силикон, пластик, испорченные заливки — без системы это просто касса
            расходов.»
          </blockquote>
          <p className={styles.darkLead}>
            Курс про то, как делать работающие формы с предсказуемым результатом — а не
            проверять каждую идею ценой материалов и времени.
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

      {/* ═══════════════ ЭКРАН 6 · АВТОР ═══════════════ */}
      <section id="author" className={styles.authorSection} aria-labelledby="author-title">
        <div className={styles.sectionInner}>
          <div className={styles.authorGrid}>
            <div className={styles.authorMedia}>
              <Placeholder label="Фото автора в мастерской" ratio="portrait" />
            </div>
            <div className={styles.authorInfo}>
              <span className={styles.eyebrow}>Автор курса</span>
              <h2 className={styles.sectionTitle} id="author-title">
                [Имя автора]
              </h2>
              <p className={styles.sectionLead}>
                Курс построен на личном опыте производства силиконовых форм и продаж
                изделий.
              </p>
              <ul className={styles.factList}>
                {AUTHOR_FACTS.map((fact) => (
                  <li key={fact} className={styles.factItem}>
                    <span className={styles.factDot} aria-hidden>
                      →
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline}`}
                onClick={scrollToBuy}
              >
                Получить доступ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 7 · ОТЗЫВЫ ═══════════════ */}
      <section id="reviews" className={styles.reviewsSection} aria-labelledby="reviews-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Отзывы</span>
            <h2 className={styles.sectionTitle} id="reviews-title">
              Это уже работает у&nbsp;других
            </h2>
            <p className={styles.sectionLead}>
              Результаты учеников: их формы, отливки и первые продажи.
            </p>
          </div>
          <div className={styles.reviewsGrid}>
            {REVIEWS.map((review, idx) => (
              <article className={styles.reviewCard} key={idx}>
                <p className={styles.reviewText}>{review.text}</p>
                <div className={styles.reviewAuthor}>
                  <span className={styles.reviewAvatar} aria-hidden />
                  <span>
                    <span className={styles.reviewName}>{review.name}</span>
                    <br />
                    <span className={styles.reviewMeta}>{review.meta}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.reviewShots}>
            <Placeholder label="Скрин · результат ученика" ratio="square" />
            <Placeholder label="Скрин · сообщения из чата" ratio="square" />
            <Placeholder label="Скрин · форма ученика" ratio="square" />
          </div>
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
                Ученикам курса — большая скидка на эту услугу по сравнению с обычным
                прайсом.
              </p>
            </div>
            <div>
              <Placeholder
                label="Фото · 3D-модель → печать → готовая форма"
                ratio="landscape"
                dark
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 10 · ГАРАНТИЯ ═══════════════ */}
      <section className={styles.guaranteeSection} aria-labelledby="guarantee-title">
        <div className={styles.sectionInner}>
          <div className={styles.guaranteeCard}>
            <span className={styles.guaranteeBadge} aria-hidden>
              ✓
            </span>
            <h2 className={styles.guaranteeTitle} id="guarantee-title">
              Не получится — вернём деньги
            </h2>
            <p className={styles.guaranteeText}>
              Пройдите курс и повторите по шагам. Если форма не получилась — вернём
              оплату. [Финальные условия гарантии согласуем перед публикацией.]
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 11 · ОФФЕР / ЦЕНА ═══════════════ */}
      <section id="buy" className={styles.buySection} aria-labelledby="buy-title">
        <div className={styles.sectionInner}>
          <div className={styles.buyInner}>
            <span className={styles.eyebrowAccent}>Оффер</span>
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
              <span className={styles.buyPrice}>{PRICE}</span>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline}`}
                onClick={scrollToBuy}
              >
                Получить доступ
              </button>
              <span className={styles.buyMeta}>
                <span>Цена до конца недели</span>
                <span>Доступ к материалам — 12 месяцев</span>
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
            <span className={styles.eyebrowAccent}>Старт</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="final-title">
              Начните делать формы с&nbsp;<span className={styles.textAccent}>предсказуемым результатом</span>
            </h2>
            <p className={styles.darkLead}>
              Доступ на 12 месяцев, закрытый чат и все бонусы. Цена {PRICE} — до конца
              недели.
            </p>
            <div className={styles.finalCtaRow}>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaInline}`}
                onClick={scrollToBuy}
              >
                Получить доступ
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
                [Оферта] · [Политика конфиденциальности]
              </p>
            </div>
          </div>

          <div className={styles.footerOffer}>
            <p className={styles.footerOfferText}>
              Курс — цифровой информационный продукт. Доступ к материалам
              предоставляется на 12 месяцев. [Условия оферты и политику
              конфиденциальности добавим перед публикацией.]
            </p>
          </div>

          <p className={styles.footerCopyright}>© AnyForms, 2026. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default CourseLanding;

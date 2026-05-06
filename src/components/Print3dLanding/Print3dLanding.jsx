import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CTAButton from '../shared/CTAButton/CTAButton';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './Print3dLanding.module.css';

const TELEGRAM_PRINT_BOT = 'https://t.me/AnyFormsPrintBot';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';

const HERO_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.09.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.23.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.36.jpeg',
};

const HERO_PREFIX = 'ДЛЯ ';
const HERO_VARIANTS = ['ЗАВОДОВ', 'ПРОИЗВОДСТВ', 'ПРЕДПРИЯТИЙ'];

const CAPABILITY_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/3d-print/printers-line.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/3d-print/printer-2.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/3d-print/printer-blue.jpeg',
};

const TEAM_IMAGE = 'https://storage.yandexcloud.net/anyforms/landing/team.jpeg';

const CLIENT_PROBLEMS = [
  {
    problem: 'Пресс-формы стоят сотни тысяч и изготавливаются месяцами',
    solution:
      'Получите готовую оснастку за 3–5 дней без затрат на литьевую оснастку — экономия до 70%.',
  },
  {
    problem: 'Поставщик задерживает запчасти — линия простаивает',
    solution: 'Напечатаем замену недоступных деталей по чертежу или образцу за 1–3 дня.',
  },
  {
    problem: 'Прототипирование нового продукта затягивается на месяцы',
    solution:
      'Функциональный прототип для тестирования — за 3–7 дней с правками между итерациями.',
  },
];

const PRINT_DIRECTIONS = [
  {
    title: 'Оснастка для производства',
    description:
      'Держатели, фиксаторы, направляющие, шаблоны, кондукторы, элементы для сборки.',
  },
  {
    title: 'Корпуса и технические элементы',
    description: 'Корпуса, крышки, кожухи, крепления, адаптеры, заглушки, переходники.',
  },
  {
    title: 'Запасные и нестандартные детали',
    description:
      'Замена недоступных деталей, детали по образцу, доработка под конкретное оборудование.',
  },
  {
    title: 'Малые и средние серии',
    description: 'Когда литьё дорого, долго или не нужно по объёму — от 1 до 500 штук.',
  },
];

const CASE_STUDIES = [
  {
    id: 1,
    title: 'Оснастка для сборочной линии',
    client: 'Производственное предприятие, Санкт-Петербург',
    task: 'Заменить металлическую оснастку для фиксации деталей при сборке — оригинал изготавливался 6 недель и стоил 180 000 ₽.',
    solution:
      'Спроектировали и напечатали комплект из 12 фиксаторов из PA12 за 4 рабочих дня.',
    result: 'Экономия 65% бюджета. Срок сократился с 6 недель до 4 дней.',
    // PLACEHOLDER: замените null на URL фотографии кейса
    image: null,
  },
  {
    id: 2,
    title: 'Замена снятых с производства деталей',
    client: 'Завод пищевого оборудования',
    task: 'Пластиковые направляющие для конвейера сняты с производства — ожидание аналога от поставщика 3 месяца.',
    solution:
      'Отсканировали образец, доработали геометрию и напечатали партию из 40 шт. из PETG.',
    result: 'Линия запущена через 5 дней. Стоимость — в 3 раза ниже заводского аналога.',
    // PLACEHOLDER: замените null на URL фотографии кейса
    image: null,
  },
  {
    id: 3,
    title: 'Прототипы корпусов для нового устройства',
    client: 'R&D-отдел электротехнической компании',
    task: 'Изготовить 5 вариантов корпуса для тестирования эргономики и компоновки до запуска серии.',
    solution:
      'Напечатали 5 итераций за 2 недели, внося правки между версиями за 1–2 дня.',
    result:
      'Цикл НИОКР сократился на 2 месяца. Финальный вариант утверждён с первого раза.',
    // PLACEHOLDER: замените null на URL фотографии кейса
    image: null,
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Отправьте задачу',
    description:
      '3D-модель, чертёж, фото, образец или описание — подойдёт любой формат.',
  },
  {
    num: '02',
    title: 'Получите расчёт',
    description:
      'Оценим геометрию, подберём материал и технологию. Назовём сроки и стоимость.',
  },
  {
    num: '03',
    title: 'Утвердите и запустите',
    description:
      'Можно начать с одного образца, проверить посадки — и только потом запустить серию.',
  },
  {
    num: '04',
    title: 'Получите готовые детали',
    description:
      'Доставим в любой город России. Курьерская доставка по Санкт-Петербургу.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Какие сроки изготовления?',
    answer:
      'Стандартный срок — 3–7 рабочих дней в зависимости от сложности и объёма. Срочные заказы выполняем за 1–2 дня.',
  },
  {
    question: 'Из каких материалов вы печатаете?',
    answer:
      'PLA, PETG, ABS, PA12 (нейлон), TPU (гибкий), фотополимеры. Подберём материал под вашу задачу: температурную стойкость, прочность, гибкость или точность.',
  },
  {
    question: 'Нужна ли готовая 3D-модель для заказа?',
    answer:
      'Нет. Вы можете прислать чертёж, эскиз, фотографию или образец детали. Мы подготовим 3D-модель и согласуем с вами перед печатью.',
  },
  {
    question: 'Есть ли гарантия на изделия?',
    answer:
      'Да. Гарантируем соответствие согласованному ТЗ и 3D-модели. Если деталь не соответствует спецификации — переделаем за наш счёт.',
  },
  {
    question: 'Как происходит оплата?',
    answer:
      'Работаем с юридическими и физическими лицами. Безналичная оплата по счёту, возможна постоплата для постоянных клиентов.',
  },
  {
    question: 'Вы доставляете по России?',
    answer:
      'Да, отправляем транспортными компаниями по всей России. В Санкт-Петербурге — курьерская доставка.',
  },
];

const PART_TYPES = [
  'Оснастка (фиксаторы, шаблоны, кондукторы)',
  'Корпуса и кожухи',
  'Запчасти и замена деталей',
  'Прототипы',
  'Малая серия (от 10 шт.)',
  'Другое',
];

const scrollToCalcForm = () => {
  document.getElementById('calc-form')?.scrollIntoView({ behavior: 'smooth' });
};

const Print3dLanding = () => {
  const [typedHeroText, setTypedHeroText] = useState(HERO_VARIANTS[0]);
  const [heroVariantIndex, setHeroVariantIndex] = useState(0);
  const [isDeletingHeroText, setIsDeletingHeroText] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const [formData, setFormData] = useState({
    partType: '',
    quantity: '',
    description: '',
    name: '',
    phone: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

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
      !isDeletingHeroText && isTypingFinished ? 2800 : isDeletingHeroText ? 55 : 85
    );

    return () => window.clearTimeout(timeout);
  }, [typedHeroText, heroVariantIndex, isDeletingHeroText]);

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFormError('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('Укажите имя и телефон — мы перезвоним в течение 15 минут.');
      return;
    }
    // TODO: подключить отправку данных на бэкенд
    setFormSubmitted(true);
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.page}>
      <LandingHeader
        logo={{
          href: '#top',
          ariaLabel: 'AnyForms — 3D-печать для промышленности',
          src: '/anyforms_logo_new_white.svg',
          width: 200,
          height: 46,
          onClick: (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        }}
        navLinks={[]}
        navAriaLabel="Разделы сайта"
        rightItems={[
          {
            key: 'calc-desktop',
            kind: 'link',
            href: '#calc-form',
            label: 'Получить расчёт',
            variant: 'pill',
            onClick: (e) => {
              e.preventDefault();
              scrollToCalcForm();
            },
          },
        ]}
        mobileMenuId="print3d-mobile-menu"
        mobileTopItems={[
          {
            key: 'calc-mobile',
            kind: 'link',
            href: '#calc-form',
            label: 'Получить расчёт',
            variant: 'primary',
            onClick: (e) => {
              e.preventDefault();
              scrollToCalcForm();
            },
          },
        ]}
      />

      {/* ═══════════════ HERO ═══════════════ */}
      <div id="top" />
      <section className={styles.hero} aria-label="3D-печать для промышленности">
        <div className={styles.heroGrid}>
          <div className={styles.heroInfoCard}>
            <span className={styles.heroDescriptor}>
              Оперативная 3D-печать для промышленности
            </span>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Оснастка и детали</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTypedLine}`}>
                {HERO_PREFIX}
                {typedHeroText}
                <span className={styles.heroCaret} aria-hidden />
              </span>
            </h1>
            <p className={styles.heroTagline}>
              Готовые изделия за 3–5 дней — дешевле пресс-форм до 70%.
              <br />
              Пришлите чертёж или образец — рассчитаем стоимость за 15 минут.
            </p>
            <ul className={styles.heroFacts} aria-label="Факты о компании">
              <li>Собственный парк из 20+ промышленных 3D-принтеров</li>
              <li>5+ лет работы с производственными заказами</li>
              <li>Пластики, фотополимеры и инженерные материалы</li>
            </ul>
            <CTAButton onClick={scrollToCalcForm}>Получить расчёт за 15 минут</CTAButton>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img
                  className={styles.heroImage}
                  src={HERO_IMAGES.main}
                  alt=""
                  loading="eager"
                />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.top}
                    alt=""
                    loading="eager"
                  />
                </div>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.bottom}
                    alt=""
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PROBLEMS → SOLUTIONS ═══════════════ */}
      <section className={styles.problemsSection} aria-labelledby="problems-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}
              id="problems-title"
            >
              Знакомые проблемы?
            </h2>
            <p className={`${styles.sectionLead} ${styles.sectionLeadLight}`}>
              Большинство заводов сталкиваются с этим ежедневно. Вот как 3D-печать решает
              каждую из них.
            </p>
          </div>
          <div className={styles.problemGrid}>
            {CLIENT_PROBLEMS.map((item, idx) => (
              <article key={idx} className={styles.problemCard}>
                <div className={styles.problemBlock}>
                  <span className={styles.problemLabel}>Проблема</span>
                  <p className={styles.problemText}>{item.problem}</p>
                </div>
                <div className={styles.solutionBlock}>
                  <span className={styles.solutionLabel}>Решение</span>
                  <p className={styles.solutionText}>{item.solution}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ DIRECTIONS ═══════════════ */}
      <section className={styles.darkSection} aria-labelledby="directions-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}
              id="directions-title"
            >
              Что вы можете заказать
            </h2>
            <p className={`${styles.sectionLead} ${styles.sectionLeadLight}`}>
              Не визуальные макеты, а функциональные изделия для оборудования, сборки и
              производственных задач.
            </p>
          </div>
          <div className={styles.directionGrid}>
            {PRINT_DIRECTIONS.map((item) => (
              <article key={item.title} className={styles.darkCard}>
                <h3 className={styles.darkCardTitle}>{item.title}</h3>
                <p className={styles.darkCardText}>{item.description}</p>
              </article>
            ))}
          </div>
          <p className={styles.directionAccent}>
            Если деталь нужна быстро, а пресс-форма не окупается — 3D-печать часто самый
            рациональный путь.
          </p>
        </div>
      </section>

      {/* ═══════════════ CASES ═══════════════ */}
      <section className={styles.casesSection} aria-labelledby="cases-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="cases-title">
              Результаты наших клиентов
            </h2>
            <p className={styles.sectionLead}>
              Реальные задачи, которые мы решили с помощью 3D-печати — с цифрами и сроками.
            </p>
          </div>
          <div className={styles.caseGrid}>
            {CASE_STUDIES.map((item) => (
              <article key={item.id} className={styles.caseCard}>
                {item.image ? (
                  <img
                    className={styles.caseImage}
                    src={item.image}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.casePlaceholder}>
                    <span>Фото кейса</span>
                  </div>
                )}
                <div className={styles.caseBody}>
                  <h3 className={styles.caseTitle}>{item.title}</h3>
                  <p className={styles.caseClient}>{item.client}</p>
                  <div className={styles.caseDetail}>
                    <span className={styles.caseLabel}>Задача:</span>
                    <p className={styles.caseText}>{item.task}</p>
                  </div>
                  <div className={styles.caseDetail}>
                    <span className={styles.caseLabel}>Решение:</span>
                    <p className={styles.caseText}>{item.solution}</p>
                  </div>
                  <div className={`${styles.caseDetail} ${styles.caseResultDetail}`}>
                    <span className={styles.caseLabel}>Результат:</span>
                    <p className={`${styles.caseText} ${styles.caseResultText}`}>
                      {item.result}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CAPABILITIES ═══════════════ */}
      <section className={styles.capabilitiesHero} aria-labelledby="capabilities-title">
        <div className={`${styles.heroGrid} ${styles.heroGridReverse}`}>
          <div className={styles.heroInfoCard}>
            <h2 className={styles.heroTitle} id="capabilities-title">
              <span className={styles.heroTitleLine}>Ваш заказ —</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                на нашей площадке
              </span>
            </h2>
            <p className={styles.heroTagline}>
              Вы получаете полный контроль над сроками и качеством: всё производство — на
              нашей территории, без посредников и субподрядчиков.
            </p>
            <ul className={styles.heroFacts} aria-label="Производственные возможности">
              <li>20+ принтеров — ваш заказ не ждёт очереди</li>
              <li>До 100 изделий за 1–2 недели</li>
              <li>Параллельный запуск срочных и серийных заказов</li>
              <li>Пластики, фотополимеры и инженерные материалы</li>
            </ul>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img
                  className={styles.heroImage}
                  src={CAPABILITY_IMAGES.main}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={CAPABILITY_IMAGES.top}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={CAPABILITY_IMAGES.bottom}
                    alt=""
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ WORKFLOW ═══════════════ */}
      <section className={styles.lightSection} aria-labelledby="workflow-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="workflow-title">
              От заявки до готовой детали — 4 шага
            </h2>
            <p className={styles.sectionLead}>
              Можно прийти даже без готовой 3D-модели. Поможем с геометрией, материалом и
              технологией.
            </p>
          </div>
          <ol className={styles.stepsList}>
            {WORKFLOW_STEPS.map((step) => (
              <li key={step.num} className={styles.stepCard}>
                <span className={styles.stepNum}>{step.num}</span>
                <h3 className={styles.cardTitle}>{step.title}</h3>
                <p className={styles.cardText}>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══════════════ TEAM ═══════════════ */}
      <section className={styles.teamScreen} aria-labelledby="team-screen-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroInfoCard}>
            <h2 className={styles.heroTitle} id="team-screen-title">
              <span className={styles.heroTitleLine}>За каждым заказом —</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                контроль на каждом этапе
              </span>
            </h2>
            <div className={styles.teamMembers}>
              <div className={styles.teamMember}>
                <p className={styles.teamMemberName}>
                  Юрий — точность чертежей и выбор материалов
                </p>
                <p className={styles.teamMemberDesc}>
                  Проверяет геометрию, подбирает оптимальный материал и технологию — чтобы
                  деталь работала с первого раза.
                </p>
              </div>
              <div className={styles.teamMember}>
                <p className={styles.teamMemberName}>
                  Дмитрий — сроки и качество каждого изделия
                </p>
                <p className={styles.teamMemberDesc}>
                  Контролирует производство от запуска до отгрузки. Не выпускает заказ, пока
                  не убедится в качестве.
                </p>
              </div>
            </div>
            <ul className={styles.teamStats} aria-label="Опыт команды">
              <li>5+ лет в 3D-печати</li>
              <li>Тысячи выполненных заказов</li>
              <li>Собственная производственная площадка</li>
            </ul>
            <CTAButton onClick={scrollToCalcForm}>Обсудить ваш проект</CTAButton>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.teamSingleMedia}>
              <img
                className={styles.heroImage}
                src={TEAM_IMAGE}
                alt=""
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CALC FORM ═══════════════ */}
      <section
        className={styles.calcSection}
        id="calc-form"
        aria-labelledby="calc-form-title"
      >
        <div className={styles.sectionInner}>
          <div className={styles.calcInner}>
            {!formSubmitted ? (
              <>
                <div className={styles.calcInfo}>
                  <h2 className={styles.sectionTitle} id="calc-form-title">
                    Получите расчёт стоимости за 15 минут
                  </h2>
                  <p className={styles.sectionLead}>
                    Заполните форму — мы перезвоним, уточним детали и назовём точную
                    стоимость и сроки. Бесплатно и без обязательств.
                  </p>
                  <div className={styles.calcBenefits}>
                    <span className={styles.calcBenefit}>Ответ за 15 минут</span>
                    <span className={styles.calcBenefit}>Расчёт бесплатно</span>
                    <span className={styles.calcBenefit}>Без обязательств</span>
                  </div>
                </div>
                <form
                  className={styles.calcForm}
                  onSubmit={handleFormSubmit}
                  noValidate
                >
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="partType">
                      Что нужно изготовить
                    </label>
                    <select
                      id="partType"
                      className={styles.formSelect}
                      value={formData.partType}
                      onChange={handleFormChange('partType')}
                    >
                      <option value="">Выберите тип изделия</option>
                      {PART_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="quantity">
                      Количество
                    </label>
                    <input
                      id="quantity"
                      className={styles.formInput}
                      type="text"
                      placeholder="Например, 10 шт."
                      value={formData.quantity}
                      onChange={handleFormChange('quantity')}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="description">
                      Описание задачи{' '}
                      <span className={styles.formOptional}>(необязательно)</span>
                    </label>
                    <textarea
                      id="description"
                      className={styles.formTextarea}
                      placeholder="Опишите задачу, укажите размеры или вставьте ссылку на файл"
                      rows={3}
                      value={formData.description}
                      onChange={handleFormChange('description')}
                    />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="name">
                        Ваше имя *
                      </label>
                      <input
                        id="name"
                        className={styles.formInput}
                        type="text"
                        placeholder="Имя"
                        value={formData.name}
                        onChange={handleFormChange('name')}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="phone">
                        Телефон *
                      </label>
                      <input
                        id="phone"
                        className={styles.formInput}
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={formData.phone}
                        onChange={handleFormChange('phone')}
                        required
                      />
                    </div>
                  </div>
                  {formError && <p className={styles.formError}>{formError}</p>}
                  <CTAButton type="submit">Получить расчёт бесплатно</CTAButton>
                  <p className={styles.formDisclaimer}>
                    Нажимая кнопку, вы соглашаетесь с{' '}
                    <Link to="/chief/privacy" className={styles.formDisclaimerLink}>
                      политикой конфиденциальности
                    </Link>
                  </p>
                </form>
              </>
            ) : (
              <div className={styles.calcSuccess}>
                <h2 className={styles.sectionTitle}>Заявка отправлена!</h2>
                <p className={styles.sectionLead}>
                  Мы свяжемся с вами в течение 15 минут в рабочее время. Подготовим расчёт
                  стоимости и предложим оптимальное решение.
                </p>
                <p className={styles.calcSuccessSecondary}>
                  Хотите быстрее? Напишите напрямую:
                </p>
                <div className={styles.calcSuccessActions}>
                  <a
                    className={styles.secondaryCta}
                    href={TELEGRAM_PRINT_BOT}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Написать в Telegram
                  </a>
                  <a className={styles.secondaryCta} href={`tel:${PHONE_E164}`}>
                    Позвонить: +7 981 040-39-53
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}
              id="faq-title"
            >
              Частые вопросы
            </h2>
          </div>
          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className={`${styles.faqItem} ${openFaqIndex === idx ? styles.faqItemOpen : ''}`}
              >
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaqIndex === idx}
                >
                  <span>{item.question}</span>
                  <span className={styles.faqIcon} aria-hidden>
                    {openFaqIndex === idx ? '\u2212' : '+'}
                  </span>
                </button>
                {openFaqIndex === idx && (
                  <div className={styles.faqAnswer}>
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className={styles.finalCtaSection} aria-labelledby="final-cta-title">
        <div className={styles.sectionInner}>
          <div className={styles.finalCtaInner}>
            <h2 className={styles.sectionTitle} id="final-cta-title">
              Готовы обсудить ваш проект?
            </h2>
            <p className={styles.sectionLead}>
              Первый расчёт — бесплатно. Пришлите задачу в любом формате, и мы предложим
              решение с точными сроками и стоимостью.
            </p>
            <div className={styles.finalCtaActions}>
              <CTAButton onClick={scrollToCalcForm}>
                Получить расчёт за 15 минут
              </CTAButton>
              <a
                className={styles.secondaryCta}
                href={TELEGRAM_PRINT_BOT}
                target="_blank"
                rel="noopener noreferrer"
              >
                Или напишите в Telegram
              </a>
            </div>
            <div className={styles.leadMagnet}>
              <p className={styles.leadMagnetText}>
                Не готовы заказывать сейчас? Скачайте каталог материалов для 3D-печати с
                рекомендациями по выбору — бесплатно.
              </p>
              {/* TODO: заменить на ссылку на реальный PDF-каталог */}
              <CTAButton onClick={scrollToCalcForm}>
                Скачать каталог материалов
              </CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className={styles.siteFooter}>
        <div className={styles.footerInner}>
          <div className={styles.trustSignals}>
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>5+</span>
              <span className={styles.trustLabel}>лет на рынке</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>20+</span>
              <span className={styles.trustLabel}>принтеров в парке</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>1000+</span>
              <span className={styles.trustLabel}>выполненных заказов</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustValue}>3–5</span>
              <span className={styles.trustLabel}>дней — средний срок</span>
            </div>
          </div>

          <div className={styles.footerGrid}>
            <div className={styles.footerBlock}>
              <h2 className={styles.footerHeading}>О компании</h2>
              <p className={styles.footerText}>
                ИП Суворов Дмитрий Игоревич
                <br />
                ИНН 590699241510
                <br />
                г. Санкт-Петербург
              </p>
            </div>
            <div className={styles.footerBlock}>
              <h2 className={styles.footerHeading}>Контакты</h2>
              <p className={styles.footerText}>
                <a
                  className={styles.footerLink}
                  href={`tel:${PHONE_E164.replace(/\D/g, '')}`}
                >
                  +7&nbsp;981&nbsp;040-39-53
                </a>
                <br />
                <a className={styles.footerLink} href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                <br />
                <a
                  className={styles.footerLink}
                  href={TELEGRAM_PRINT_BOT}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Написать в Telegram
                </a>
              </p>
            </div>
            <div className={styles.footerBlock}>
              <h2 className={styles.footerHeading}>Гарантии</h2>
              <p className={styles.footerText}>
                Соответствие ТЗ и 3D-модели
                <br />
                Переделка за наш счёт при несоответствии
                <br />
                Сертификаты на материалы по запросу
              </p>
            </div>
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

export default Print3dLanding;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CTAButton from '../shared/CTAButton/CTAButton';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './Print3dLanding.module.css';

const TELEGRAM_DEFAULT = 'https://t.me/AnyFormsBot';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';

const HERO_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.09.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.23.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.36.jpeg',
};

const HEADER_LINKS = [
  { key: 'home', label: 'главная', to: '/' },
  { key: 'chief', label: 'кондитеры', to: '/chief' },
  { key: 'shop', label: 'свечевары', to: '/shop' },
];
const HERO_PREFIX = 'ДЛЯ ';
const HERO_VARIANTS = ['ЗАВОДОВ', 'ПРОИЗВОДСТВ'];
const PRINT_DIRECTIONS = [
  {
    title: 'Оснастка для производства',
    description: 'Держатели, фиксаторы, направляющие, шаблоны, кондукторы, элементы для сборки.',
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
    description: 'Когда литьё дорого, долго или не нужно по объёму.',
  },
];
const WORKFLOW_STEPS = [
  {
    title: '1. Вы отправляете задачу',
    description: '3D-модель, чертёж, фото, образец или описание того, что нужно получить.',
  },
  {
    title: '2. Мы подбираем решение',
    description:
      'Оцениваем геометрию, материал, технологию печати, сроки и примерную стоимость.',
  },
  {
    title: '3. Печатаем тест или партию',
    description:
      'Можно начать с одного образца, проверить посадки и только потом запускать серию.',
  },
  {
    title: '4. Передаём готовые детали',
    description:
      'Вы получаете изделие, которое можно тестировать, устанавливать или использовать в работе.',
  },
];
const CAPABILITY_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/3d-print/printers-line.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/3d-print/printer-2.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/3d-print/printer-blue.jpeg',
};
const TEAM_IMAGE = 'https://storage.yandexcloud.net/anyforms/landing/team.jpeg';

const Print3dLanding = () => {
  const [typedHeroText, setTypedHeroText] = useState(HERO_VARIANTS[0]);
  const [heroVariantIndex, setHeroVariantIndex] = useState(0);
  const [isDeletingHeroText, setIsDeletingHeroText] = useState(false);

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

  return (
    <div className={styles.page}>
      <LandingHeader
        logo={{
          href: '#top',
          ariaLabel: 'AnyForms - наверх',
          src: '/anyforms_logo_new_white.svg',
          width: 200,
          height: 46,
          onClick: (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        }}
        navLinks={HEADER_LINKS}
        navAriaLabel="Разделы сайта"
        rightItems={[
          {
            key: 'calc-desktop',
            kind: 'link',
            href: TELEGRAM_DEFAULT,
            label: 'Рассчитать деталь',
            target: '_blank',
            rel: 'noopener noreferrer',
            variant: 'pill',
          },
        ]}
        mobileMenuId="print3d-mobile-menu"
        mobileTopItems={[
          {
            key: 'calc-mobile',
            kind: 'link',
            href: TELEGRAM_DEFAULT,
            label: 'Рассчитать деталь',
            target: '_blank',
            rel: 'noopener noreferrer',
            variant: 'primary',
          },
        ]}
      />

      <div id="top" />
      <section className={styles.hero} aria-label="Первый экран 3D-печати">
        <div className={styles.heroGrid}>
          <div className={styles.heroInfoCard}>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>3D-печать</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTypedLine}`}>
                {HERO_PREFIX}
                {typedHeroText}
                <span className={styles.heroCaret} aria-hidden />
              </span>
            </h1>
            <p className={styles.heroTagline}>
              Изготавливаем оснастку, корпуса, держатели, фиксаторы и нестандартные детали без
              пресс-форм, долгих сроков и ожидания поставок.
            </p>
            <ul className={styles.heroFacts} aria-label="Факты о компании">
              <li>Более 5 лет на рынке</li>
              <li>Более 20 3D-принтеров в собственном парке</li>
              <li>Печать из пластиков, фотополимеров и инженерных материалов</li>
            </ul>
            <CTAButton href={TELEGRAM_DEFAULT} target="_blank" rel="noopener noreferrer">
              Рассчитать деталь
            </CTAButton>
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

      <section className={styles.capabilitiesHero} aria-labelledby="capabilities-title">
        <div className={`${styles.heroGrid} ${styles.heroGridReverse}`}>
          <div className={styles.heroInfoCard}>
            <h2 className={styles.heroTitle} id="capabilities-title">
              <span className={styles.heroTitleLine}>Собственный парк</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                под срочные задачи
              </span>
            </h2>
            <p className={styles.heroTagline}>
              Мы не передаём производство на сторону. Печатаем на своей площадке, поэтому
              контролируем сроки, качество и повторяемость деталей.
            </p>
            <ul className={styles.heroFacts} aria-label="Производственные возможности">
              <li>20+ машин в работе</li>
              <li>До 100 изделий за срок до 2 недель</li>
              <li>Параллельный запуск срочных и серийных заказов</li>
              <li>Пластики, фотополимеры и инженерные материалы</li>
            </ul>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img className={styles.heroImage} src={CAPABILITY_IMAGES.main} alt="" loading="lazy" />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img className={styles.heroImage} src={CAPABILITY_IMAGES.top} alt="" loading="lazy" />
                </div>
                <div className={styles.heroSideCard}>
                  <img className={styles.heroImage} src={CAPABILITY_IMAGES.bottom} alt="" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.teamScreen} aria-labelledby="team-screen-title">
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
                <p className={styles.teamMemberDesc}>Усиливает концепцию и доводит до "вау"</p>
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
            <CTAButton href={TELEGRAM_DEFAULT} target="_blank" rel="noopener noreferrer">
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
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/*<section className={styles.darkSection} aria-labelledby="directions-title">*/}
      {/*  <div className={styles.sectionInner}>*/}
      {/*    <div className={styles.sectionHead}>*/}
      {/*      <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`} id="directions-title">*/}
      {/*        Печатаем детали, которые можно использовать в работе*/}
      {/*      </h2>*/}
      {/*      <p className={`${styles.sectionLead} ${styles.sectionLeadLight}`}>*/}
      {/*        Не только визуальные прототипы. Делаем функциональные изделия для оборудования,*/}
      {/*        сборки, сервиса и производственных задач.*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*    <div className={styles.directionGrid}>*/}
      {/*      {PRINT_DIRECTIONS.map((item) => (*/}
      {/*        <article key={item.title} className={styles.darkCard}>*/}
      {/*          <h3 className={styles.darkCardTitle}>{item.title}</h3>*/}
      {/*          <p className={styles.darkCardText}>{item.description}</p>*/}
      {/*        </article>*/}
      {/*      ))}*/}
      {/*    </div>*/}
      {/*    <p className={styles.directionAccent}>*/}
      {/*      Если деталь нужна быстро, а пресс-форма не окупается — 3D-печать часто самый*/}
      {/*      рациональный путь.*/}
      {/*    </p>*/}
      {/*  </div>*/}
      {/*</section>*/}

      {/*<section className={styles.lightSection} aria-labelledby="workflow-title">*/}
      {/*  <div className={styles.sectionInner}>*/}
      {/*    <div className={styles.sectionHead}>*/}
      {/*      <h2 className={styles.sectionTitle} id="workflow-title">*/}
      {/*        От задачи до готовой детали без лишней сложности*/}
      {/*      </h2>*/}
      {/*      <p className={styles.sectionLead}>*/}
      {/*        Можно прийти даже без готовой 3D-модели. Поможем разобраться с геометрией,*/}
      {/*        материалом и способом производства.*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*    <ol className={styles.stepsList}>*/}
      {/*      {WORKFLOW_STEPS.map((step) => (*/}
      {/*        <li key={step.title} className={styles.stepCard}>*/}
      {/*          <h3 className={styles.cardTitle}>{step.title}</h3>*/}
      {/*          <p className={styles.cardText}>{step.description}</p>*/}
      {/*        </li>*/}
      {/*      ))}*/}
      {/*    </ol>*/}
      {/*  </div>*/}
      {/*</section>*/}

      {/*<section className={styles.ctaSection} aria-labelledby="final-cta-title">*/}
      {/*  <div className={styles.ctaInner}>*/}
      {/*    <h2 className={styles.sectionTitle} id="final-cta-title">*/}
      {/*      Получить расчёт стоимости и срока*/}
      {/*    </h2>*/}
      {/*    <p className={styles.sectionLead}>*/}
      {/*      В ответе дадим маршрут: материал, технология, срок, стоимость и что нужно для запуска.*/}
      {/*    </p>*/}
      {/*    <CTAButton href={TELEGRAM_DEFAULT} target="_blank" rel="noopener noreferrer">*/}
      {/*      Получить расчёт стоимости и срока*/}
      {/*    </CTAButton>*/}
      {/*  </div>*/}
      {/*</section>*/}

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

export default Print3dLanding;

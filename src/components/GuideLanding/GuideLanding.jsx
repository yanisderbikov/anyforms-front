import React from 'react';
import { Link } from 'react-router-dom';
import CTAButton from '../shared/CTAButton/CTAButton';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import styles from './GuideLanding.module.css';

// Куда ведёт кнопка «Купить гайд». Замените на ссылку оплаты при необходимости.
const BUY_URL = 'https://t.me/AnyFormsPrintBot';
const PRICE = '990 ₽';

const AUTHOR_FACTS = [
  'Более 5 лет в контент-маркетинге',
  'Более 40 000 подписчиков в Instagram',
  'Более 260 опубликованных роликов и постов',
  'Контент — основной источник заявок для AnyForms',
  'Более 1 000 000 ₽ выручки в месяц приходит через контент',
];

const BEFORE_ITEMS = [
  'Снимаю что придётся',
  'Надеюсь, что ролик залетит',
  'Не знаю, что публиковать',
  'Получаю лайки вместо заявок',
];

const AFTER_ITEMS = [
  'Понимаю свою аудиторию',
  'Знаю, какие боли показывать',
  'Пишу сценарии быстрее',
  'Публикую контент с понятной целью',
  'Получаю обращения в директ',
];

const INSIDE_ITEMS = [
  'Как найти тему блога',
  'Как понять свою аудиторию',
  'Как создавать идеи для контента',
  'Как писать сценарии роликов',
  'Как снимать без дорогого оборудования',
  'Как быстро монтировать',
  'Как получать сообщения и комментарии',
  'Как переводить интерес в заказ',
  'Как анализировать и масштабировать результат',
];

const BONUS_ITEMS = [
  'Готовые сценарии роликов',
  'Шаблоны CTA',
  'Минимальная воронка продаж',
];

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const scrollToBuy = () => scrollToId('buy');

const NAV_LINKS = [
  { key: 'author', label: 'Автор', id: 'author' },
  { key: 'system', label: 'Система', id: 'system' },
  { key: 'inside', label: 'Что внутри', id: 'inside' },
];

const HERO_CHIPS = ['9 шагов', 'Готовые сценарии', 'Шаблоны CTA', 'Мини-воронка'];

const HERO_STATS = [
  { value: '40К+', label: 'подписчиков' },
  { value: '5 лет', label: 'в контенте' },
  { value: '260+', label: 'роликов и постов' },
];

const GuideLanding = () => {
  return (
    <div className={styles.page}>
      <LandingHeader
        logo={{
          href: '#top',
          ariaLabel: 'AnyForms — гайд по контенту',
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
            label: 'Купить гайд',
            variant: 'pill',
            onClick: (e) => {
              e.preventDefault();
              scrollToBuy();
            },
          },
        ]}
        mobileMenuId="guide-mobile-menu"
        mobileTopItems={[
          {
            key: 'buy-mobile',
            kind: 'link',
            href: '#buy',
            label: 'Купить гайд',
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
      <section className={styles.hero} aria-label="О гайде">
        <div className={styles.heroInner}>
          <p className={`${styles.heroEyebrow} ${styles.areaEyebrow}`}>
            Для мастеров, производителей и экспертов
          </p>

          <h1 className={`${styles.heroTitle} ${styles.areaTitle}`}>
            Как продавать <mark className={styles.heroMark}>сложный продукт</mark> через
            короткие видео
          </h1>

          <p className={`${styles.heroSub} ${styles.areaSub}`}>
            Получайте заявки из Reels, Shorts, TikTok и Клипов — а не просто собирайте
            просмотры.
          </p>

          <div className={`${styles.heroMedia} ${styles.areaMedia}`}>
            <div className={`${styles.heroPhoto} ${styles.heroPhotoEmpty}`}>
              Фото эксперта
            </div>
            <span className={styles.heroCaption}>Юрий Суворов · AnyForms</span>
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
              <span className={styles.heroNote}>Придёт на почту сразу после оплаты</span>
            </div>
            <button type="button" className={styles.heroCta} onClick={scrollToBuy}>
              Забрать гайд
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

      {/* ═══════════════ ЭКРАН 2 · АВТОР ═══════════════ */}
      <section id="author" className={styles.authorSection} aria-labelledby="author-title">
        <div className={styles.sectionInner}>
          <div className={styles.authorGrid}>
            <div className={styles.authorMedia}>
              <div className={styles.photoFrame} data-ratio="portrait">
                <span className={styles.photoLabel}>Фото автора</span>
              </div>
            </div>
            <div className={styles.authorInfo}>
              <span className={styles.eyebrow}>Автор гайда</span>
              <h2 className={styles.sectionTitle} id="author-title">
                Юрий Суворов
              </h2>
              <p className={styles.sectionLead}>
                Вся система основана на личном опыте создания контента и продаж через
                него.
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
              <CTAButton className={styles.guideCta} onClick={scrollToBuy}>
                Получить доступ
              </CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 3 · ПРОСМОТРЫ ≠ КЛИЕНТЫ ═══════════════ */}
      <section className={styles.darkSection} aria-labelledby="views-title">
        <div className={styles.sectionInner}>
          <span className={styles.eyebrowAccent}>Про охваты</span>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="views-title">
            Просмотры не&nbsp;равны <span className={styles.textAccent}>клиентам</span>
          </h2>
          <blockquote className={styles.bigQuote}>
            «Клиенты приходят тогда, когда человек узнаёт в ролике свою проблему.»
          </blockquote>
          <p className={styles.darkLead}>
            Именно этому посвящён весь гайд: как создавать контент, который приводит
            обращения, а не просто собирает охваты.
          </p>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 4 · ДО / ПОСЛЕ ═══════════════ */}
      <section id="system" className={styles.systemSection} aria-labelledby="system-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="system-title">
              После гайда у&nbsp;вас появится система
            </h2>
          </div>
          <div className={styles.compareGrid}>
            <div className={`${styles.compareCard} ${styles.compareBefore}`}>
              <span className={styles.compareLabel}>До</span>
              <ul className={styles.compareList}>
                {BEFORE_ITEMS.map((item) => (
                  <li key={item} className={styles.compareItem}>
                    <span className={styles.iconDice} aria-hidden>
                      🎲
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${styles.compareCard} ${styles.compareAfter}`}>
              <span className={styles.compareLabel}>После</span>
              <ul className={styles.compareList}>
                {AFTER_ITEMS.map((item) => (
                  <li key={item} className={styles.compareItem}>
                    <span className={styles.iconTarget} aria-hidden>
                      🎯
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 5 · ЧТО ВНУТРИ ═══════════════ */}
      <section id="inside" className={styles.insideSection} aria-labelledby="inside-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Содержание</span>
            <h2 className={styles.sectionTitle} id="inside-title">
              Что внутри
            </h2>
          </div>
          <div className={styles.insideGrid}>
            <ol className={styles.insideList}>
              {INSIDE_ITEMS.map((item, idx) => (
                <li key={item} className={styles.insideItem}>
                  <span className={styles.insideNum}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.insideText}>{item}</span>
                </li>
              ))}
            </ol>
            <aside className={styles.bonusCard}>
              <span className={styles.bonusLabel}>Бонусы</span>
              <ul className={styles.bonusList}>
                {BONUS_ITEMS.map((item) => (
                  <li key={item} className={styles.bonusItem}>
                    <span className={styles.bonusStar} aria-hidden>
                      ★
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════ ЭКРАН 6 · ФИНАЛЬНЫЙ CTA ═══════════════ */}
      <section className={styles.buySection} id="buy" aria-labelledby="buy-title">
        <div className={styles.sectionInner}>
          <div className={styles.buyInner}>
            <span className={styles.eyebrowAccent}>Финал</span>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleHuge}`} id="buy-title">
              Начните получать заявки из&nbsp;<span className={styles.textAccent}>контента</span>
            </h2>
            <p className={styles.darkLead}>
              Изучите систему, которую можно внедрить за один вечер и использовать для
              любого продукта или услуги.
            </p>
            <div className={styles.buyPriceRow}>
              <span className={styles.buyPrice}>{PRICE}</span>
              <CTAButton
                className={styles.guideCta}
                href={BUY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Купить гайд
              </CTAButton>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className={styles.siteFooter}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBlock}>
              <h2 className={styles.footerHeading}>О продавце</h2>
              <p className={styles.footerText}>
                ИП Суворов Юрий Игоревич
                <br />
                г. Санкт-Петербург
              </p>
            </div>
            <div className={styles.footerBlock}>
              <h2 className={styles.footerHeading}>Контакты</h2>
              <p className={styles.footerText}>
                <a className={styles.footerLink} href="mailto:suvorov@anyforms.ru">
                  suvorov@anyforms.ru
                </a>
                <br />
                <a
                  className={styles.footerLink}
                  href={BUY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Написать в Telegram
                </a>
              </p>
            </div>
            <div className={styles.footerBlock}>
              <h2 className={styles.footerHeading}>Документы</h2>
              <p className={styles.footerText}>
                <Link to="/chief/privacy" className={styles.footerLink}>
                  Политика конфиденциальности
                </Link>
                <br />
                <a className={styles.footerLink} href="#buy" onClick={(e) => {
                  e.preventDefault();
                  scrollToBuy();
                }}>
                  Публичная оферта
                </a>
              </p>
            </div>
          </div>

          <div className={styles.footerOffer}>
            <p className={styles.footerOfferText}>
              Настоящий сайт носит исключительно информационный характер и ни при каких
              условиях не является публичной офертой, определяемой положениями статьи 437
              ГК РФ. Оплачивая гайд, вы соглашаетесь с условиями оферты и подтверждаете,
              что приобретаете цифровой информационный продукт. Цифровой товар не подлежит
              возврату после получения доступа. Продавец — ИП Суворов Юрий Игоревич.
            </p>
          </div>

          <p className={styles.footerCopyright}>
            © AnyForms, 2026. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GuideLanding;

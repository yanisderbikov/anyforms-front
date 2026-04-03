import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import styles from './ChefLanding.module.css';

const TG_BOT = 'https://t.me/AnyFormsCheifBot';

const NAV = [
  { id: 'about', label: 'о нас' },
  { id: 'cases', label: 'кейсы' },
  { id: 'contacts', label: 'контакты' },
];

const ChefLanding = () => {
  const [idea, setIdea] = useState('');

  const openTelegram = () => {
    window.open(TG_BOT, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    const text = idea.trim();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Текст скопирован — вставьте его в чат с ботом');
      } catch {
        toast.error('Не удалось скопировать — скопируйте текст вручную');
      }
    }
    openTelegram();
  };

  const scrollToSection = useCallback((e, sectionId) => {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className={styles.page} id="top">
      <header className={styles.siteHeader}>
        <a
          className={styles.logoLink}
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="AnyForms — наверх"
        >
          <img
            className={styles.logo}
            src="/anyforms_logo_new.svg"
            alt=""
            width={200}
            height={46}
            decoding="async"
          />
        </a>
        <div className={styles.headerRight}>
          <p className={styles.headerMeta}>молды · визуализация · hoReCa</p>
          <nav className={styles.nav} aria-label="Разделы страницы">
            {NAV.map(({ id, label }) => (
              <a
                key={id}
                className={styles.navLink}
                href={`#${id}`}
                onClick={(e) => scrollToSection(e, id)}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className={styles.hero} aria-label="Главный экран">
        <div className={styles.heroBody}>
          <div className={styles.heroLeft}>
            <div className={styles.heroCopy}>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleLine}>Силиконовые молды</span>
                <span
                  className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}
                >
                  для масла и
                </span>
                <span
                  className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}
                >
                  десертов
                </span>
              </h1>

              <p className={styles.heroTagline}>
                мы работаем с силиконом более 5 лет. реализовали более 1000
                заказов.
              </p>
              <p className={styles.heroBrands}>
                с нами работали: selfie / cristal / rené
              </p>

              <a
                className={styles.cta}
                href={TG_BOT}
                target="_blank"
                rel="noopener noreferrer"
              >
                Обсудить проект
              </a>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImageFrame}>
              <img
                className={styles.heroImage}
                src="/landing/main.jpeg"
                alt=""
                width={960}
                height={1280}
                decoding="async"
              />
              <span className={styles.heroImageIcon} aria-hidden>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 17L17 7M17 7H9M17 7V15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.about} id="about" aria-labelledby="about-title">
        <div className={styles.sectionInner}>
          <h2 className={styles.blockTitle} id="about-title">
            о нас
          </h2>
          <p className={styles.aboutLead}>
            Работаем с силиконом больше пяти лет: от форм для масла и десертов
            до сложных решений под кухню и витрину.
          </p>
          <p className={styles.aboutText}>
            Реализовали свыше тысячи заказов — знаем, как совместить эстетику,
            пищевую безопасность и удобство в работе.
          </p>
        </div>
      </section>

      <section
        className={styles.cases}
        id="cases"
        aria-labelledby="cases-title"
      >
        <div className={styles.sectionInner}>
          <h2 className={styles.blockTitle} id="cases-title">
            кейсы
          </h2>
          <p className={styles.casesLead}>с нами работали</p>
          <ul className={styles.casesList}>
            <li>Selfie</li>
            <li>cristal</li>
            <li>René</li>
          </ul>
        </div>
      </section>

      <section className={styles.offer} aria-label="Что предлагаем">
        <div className={styles.offerInner}>
          <h2 className={styles.sectionTitle}>Что предлагаем сделать</h2>
          <p className={styles.offerHighlight}>
            Визуализация для вашего заведения
          </p>
          <p className={styles.sectionLead}>
            Расскажите о задаче — мы покажем, как может выглядеть продукт в
            вашем формате. Вы получаете понятную картинку до производства и
            можете согласовать детали без лишних итераций.
          </p>

          <ol className={styles.steps}>
            <li>
              <span className={styles.stepTitle}>Напишите нам</span>
            </li>
            <li>
              <span className={styles.stepTitle}>Опишите вашу идею</span>
              <ul className={styles.stepSublist}>
                <li>Это может быть масло</li>
                <li>Или любой другой десерт</li>
              </ul>
            </li>
            <li>
              <span className={styles.stepTitle}>
                Получите 3D-визуализацию вашего проекта
              </span>
              <span className={styles.stepDesc}>
                Готовим визуал под ваш бренд и подачу в заведении.
              </span>
            </li>
          </ol>
        </div>
      </section>

      <section
        className={styles.contacts}
        id="contacts"
        aria-labelledby="contacts-title"
      >
        <div className={styles.sectionInner}>
          <h2 className={styles.blockTitle} id="contacts-title">
            контакты
          </h2>
          <p className={styles.contactsLead}>
            Напишите в Telegram — ответим и обсудим задачу без лишней бюрократии.
          </p>
          <a
            className={styles.contactsTg}
            href={TG_BOT}
            target="_blank"
            rel="noopener noreferrer"
          >
            @AnyFormsCheifBot
          </a>

          <div className={styles.capture}>
            <h3 className={styles.captureTitle}>Отправить свою идею</h3>
            <form className={styles.form} onSubmit={handleSubmitIdea}>
              <label className={styles.label} htmlFor="chef-idea">
                Ваш запрос
              </label>
              <textarea
                id="chef-idea"
                className={styles.textarea}
                rows={5}
                placeholder="Опишите идею: форма, объём, референсы…"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <button type="submit" className={styles.submit}>
                Отправить свою идею
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChefLanding;

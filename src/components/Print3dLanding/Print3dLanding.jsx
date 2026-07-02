import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import CTAButton from '../shared/CTAButton/CTAButton';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import apiClient from '../../apiClient';
import styles from './Print3dLanding.module.css';

const LANDING_LEAD_NAME = 'Заявка с лендинга 3D-печати';
const TELEGRAM_PRINT_BOT = 'https://t.me/AnyFormsPrintBot';
const PHONE_E164 = '+79810403953';
const PHONE_DISPLAY = '+7 981 040-39-53';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';
const SITE_URL = 'https://anyforms.ru';

const HERO_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.09.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.23.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/3d-print/photo_2026-04-24%2018.18.36.jpeg',
};

const HERO_PREFIX = 'ПОД ';
const HERO_VARIANTS = ['ВАШУ ПЛАТУ', 'ВАШ ПРИБОР', 'ВАШ ДАТЧИК', 'ВАШ ТЕРМИНАЛ'];

const CAPABILITY_IMAGES = {
  main: 'https://storage.yandexcloud.net/anyforms/3d-print/printers-line.jpeg',
  top: 'https://storage.yandexcloud.net/anyforms/3d-print/printer-2.jpeg',
  bottom: 'https://storage.yandexcloud.net/anyforms/3d-print/printer-blue.jpeg',
};

const TEAM_IMAGE = 'https://storage.yandexcloud.net/anyforms/landing/team.jpeg';

const TRUST_CLIENTS = [
  {
    name: '«Лента»',
    text: 'Корпуса касс самообслуживания, установленные в магазинах сети. На фото в кейсах — корпус, работающий в «Ленте» в Санкт-Петербурге.',
  },
  {
    name: '«Магнит»',
    text: 'Промышленные корпуса КСО из стеклонаполненного ABS GF и панели с деактиватором меток.',
  },
  {
    name: 'Сеть магазинов одежды',
    text: 'Комплектные корпуса касс самообслуживания — серийное производство партиями по графику.',
  },
];

const SEGMENTS = [
  {
    title: 'Корпус для печатной платы',
    description:
      'Нестандартный корпус точно под вашу плату, когда готовые корпуса из каталогов не подходят по габаритам или компоновке: стойки под крепёжные отверстия, вырезы под разъёмы, кнопки и индикаторы. Корпусирование печатных плат от 1 штуки.',
  },
  {
    title: 'Корпуса приборов и РЭА',
    description:
      'Настольные и настенные приборные корпуса: лицевые панели, окна под дисплей, кабельные вводы, съёмные крышки. Изготовление корпусов для приборов без минимальной партии и минимальной суммы заказа.',
  },
  {
    title: 'Корпуса датчиков и IoT-устройств',
    description:
      'Компактные корпуса для датчиков, контроллеров умного дома, трекеров и промышленной автоматики: крепление на DIN-рейку, стену или трубу, отсек под аккумулятор, вывод антенны.',
  },
  {
    title: 'Корпуса терминалов и касс самообслуживания',
    description:
      'Лицевые панели, кожухи и комплектные корпуса КСО и терминалов. Наш самый крупный профиль: тысячи единиц для «Ленты», «Магнита» и сети магазинов одежды.',
  },
  {
    title: 'Hardware-стартапы: от прототипа до серии',
    description:
      'Итерация корпуса за дни, а не месяцы: правки геометрии между версиями — без пресс-формы, которую пришлось бы переделывать. Пилотная партия и серия печатаются на одном парке.',
  },
  {
    title: 'Замена и доработка существующих корпусов',
    description:
      'Корпус снят с производства или плата изменилась? Обмерим образец, восстановим геометрию и доработаем конструкцию под новую начинку.',
  },
];

const FEATURES = [
  'Посадка платы: стойки под винтовой крепёж, защёлки или направляющие пазы — по крепёжным отверстиям вашей платы',
  'Вырезы под интерфейсы: USB, RJ-45, HDMI, клеммники, тумблеры, кнопки, светодиоды, антенные выводы',
  'Латунные резьбовые втулки — для корпусов под многократную разборку',
  'Защёлкивающиеся крышки и заглушки — как в серийном комплекте панели КСО из PETG',
  'Окна под дисплеи и световоды под индикацию',
  'Вентиляционные решётки и каналы охлаждения для греющейся электроники',
  'Кабельные вводы, посадка под гермовводы',
  'Крепление: DIN-рейка, VESA, настенные кронштейны, стойки',
  'Гибкие элементы и уплотнения из TPU — защита от пыли и брызг',
  'Логотип и маркировка рельефом прямо в детали — без наклеек',
];

const CASE_STUDIES = [
  {
    id: 1,
    title: 'Панель кассы самообслуживания с деактиватором меток',
    client: 'Производитель касс самообслуживания',
    task: 'Перераспределить электромагнитную катушку внутри конструкции, чтобы металлический корпус кассы не экранировал магнитное поле и метки деактивировались стабильно.',
    solution:
      'Вынесли катушку дальше от металла и спроектировали комплект из корпуса и защёлкивающейся заглушки из PETG. Сборка электроники — на стороне заказчика, наша мощность — до 30 комплектов в день.',
    result:
      '2000 ₽ за комплект при тираже 400 шт. — без учёта разработки, пилота и тестов.',
    image: 'https://storage.yandexcloud.net/anyforms/3d-print/case1.jpeg',
    alt: 'Серийная напечатанная панель корпуса кассы самообслуживания с вырезом — партия одинаковых деталей на фоне',
  },
  {
    id: 2,
    title: 'Промышленные корпуса из стеклонаполненного ABS GF',
    client: 'КСО для «Магнита» и магазинов одежды',
    task: 'Изготовить корпуса с высокой жёсткостью и стабильностью размеров для ежедневной эксплуатации в торговом зале.',
    solution:
      'Печать из ABS GF — стеклонаполненного инженерного пластика, который держит геометрию и нагрузку заметно лучше стандартных марок.',
    result:
      'Корпуса из ABS GF ежедневно работают в магазинах «Магнита» и сети одежды — держат геометрию и нагрузку в торговом зале.',
    image: 'https://storage.yandexcloud.net/anyforms/3d-print/case2.jpeg',
    alt: 'Напечатанная на 3D-принтере рамка корпуса кассы самообслуживания на фоне производственного участка',
  },
  {
    id: 3,
    title: 'Корпуса КСО крупным тиражом для трёх розничных сетей',
    client: '«Лента», «Магнит» и сеть магазинов одежды',
    task: 'Спроектировать и изготовить корпуса касс самообслуживания с нуля — под размеры и бюджет заказчика.',
    solution:
      'Спроектировали конструкцию и ведём серийное производство для трёх сетей. На фото — корпус, установленный в магазине «Лента» в Санкт-Петербурге.',
    result:
      'Наш крупнейший проект: счёт перевалил за несколько тысяч единиц и продолжает расти.',
    image: 'https://storage.yandexcloud.net/anyforms/3d-print/case3.jpeg',
    alt: 'Касса самообслуживания с напечатанным корпусом, установленная в магазине «Лента»',
  },
];

const PRICING_TIERS = [
  {
    tier: 'Тестовый образец',
    volume: '1–5 шт',
    term: '3–7 рабочих дней, срочно — 1–2 дня',
    note: 'Стоимость считаем по вашей модели или чертежу за 15 минут — бесплатно.',
  },
  {
    tier: 'Малая серия',
    volume: '10–100 шт',
    term: '1–2 недели',
    note: 'Цена за штуку ниже образца: партия печатается параллельно на нескольких принтерах.',
  },
  {
    tier: 'Серия',
    volume: '100–1000+ шт',
    term: 'партиями по графику, до 30 комплектов в день',
    note: 'Реальный кейс: 2000 ₽ за комплект (корпус + заглушка из PETG) при тираже 400 шт.',
  },
];

const PRICING_BULLETS = [
  'Без минимального заказа и минимальной суммы',
  'Ноль рублей на оснастку — пресс-форма не нужна',
  'Правки геометрии между партиями — без затрат на новую форму',
  'Постоплата для постоянных клиентов',
];

const COMPARISON_ROWS = [
  {
    label: 'Затраты на запуск',
    print: '0 ₽ — пресс-форма не нужна',
    molding: 'Пресс-форма стоит сотни тысяч рублей',
  },
  {
    label: 'Срок до первой детали',
    print: '3–7 рабочих дней',
    molding: 'Месяцы на проектирование и изготовление формы',
  },
  {
    label: 'Изменение конструкции',
    print: 'Правка 3D-модели — со следующей партии',
    molding: 'Доработка или изготовление новой формы',
  },
  {
    label: 'Выгодный тираж',
    print: 'От 1 штуки до нескольких тысяч',
    molding: 'От десятков тысяч штук',
  },
  {
    label: 'Партии',
    print: 'Печатаем по мере спроса, без замороженного склада',
    molding: 'Крупная партия сразу, хранение на вас',
  },
];

const MATERIALS = [
  {
    name: 'PETG',
    text: 'Рабочая лошадка корпусов электроники: ударная вязкость, химическая стойкость, стабильная геометрия. Из него печатаем серийные панели КСО — тираж 400 комплектов.',
  },
  {
    name: 'ABS',
    text: 'Жёсткие корпуса приборов: температурная стойкость, хорошо обрабатывается после печати.',
  },
  {
    name: 'ABS GF (стеклонаполненный)',
    text: 'Промышленные корпуса: повышенная жёсткость и стабильность размеров под нагрузкой. Из него сделаны корпуса КСО для «Магнита».',
  },
  {
    name: 'PA12 (полиамид)',
    text: 'Нагруженные элементы: защёлки, петли, кронштейны, детали с высоким ресурсом на износ.',
  },
  {
    name: 'TPU (гибкий)',
    text: 'Уплотнители, амортизирующие вставки, заглушки, ножки корпуса — защита от пыли и вибрации.',
  },
  {
    name: 'Фотополимеры',
    text: 'Лицевые панели и мелкие элементы с высокой детализацией поверхности.',
  },
  {
    name: 'PLA',
    text: 'Макеты и проверка эргономики до запуска в инженерном пластике.',
  },
];

const ENGINEERING_INPUTS = [
  {
    title: 'Готовая 3D-модель (STL, STEP)',
    text: 'Проверим технологичность и запустим в печать.',
  },
  {
    title: 'Чертёж или эскиз',
    text: 'Построим 3D-модель и согласуем с вами до печати.',
  },
  {
    title: 'Образец корпуса',
    text: 'Обмерим, восстановим геометрию, доработаем под новую плату.',
  },
  {
    title: 'Только плата',
    text: 'Пришлите её размеры или саму плату — спроектируем корпус вокруг неё, с посадкой, разъёмами и крепежом.',
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Пришлите задачу',
    description:
      '3D-модель, чертёж, фото, образец или просто описание прибора и размеры платы. Рассчитаем стоимость и срок за 15 минут в рабочее время.',
  },
  {
    num: '02',
    title: 'Согласуем конструкцию',
    description:
      'Модель корпуса, материал, крепёж и вырезы — до печати вы видите и утверждаете 3D-модель. По запросу подпишем NDA.',
  },
  {
    num: '03',
    title: 'Проверьте тестовый образец',
    description:
      'За 3–7 рабочих дней напечатаем образец. Установите плату, проверьте разъёмы и посадки — правки внесём в модель до запуска серии.',
  },
  {
    num: '04',
    title: 'Запускаем серию',
    description:
      'Печатаем партиями по графику на 20+ принтерах. Геометрию между партиями можно менять — оснастки нет, переделывать нечего.',
  },
  {
    num: '05',
    title: 'Доставка и документы',
    description:
      'СДЭК по всей России, курьер по Санкт-Петербургу. Договор, счёт, закрывающие документы.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Сколько стоит напечатать корпус для платы на 3D-принтере?',
    answer:
      'Цена зависит от габаритов, веса детали, материала и тиража. Реальный ориентир нашего серийного производства: 2000 ₽ за комплект из корпуса и заглушки (PETG) при тираже 400 шт. Единичный корпус стоит дороже за штуку, серия — дешевле. Пришлите модель, чертёж или размеры платы — назовём точную стоимость за 15 минут, бесплатно.',
  },
  {
    question: 'Какие материалы подходят для корпусов электроники?',
    answer:
      'Базовый выбор — PETG: ударопрочный, химически стойкий, стабильный по геометрии. Для промышленных корпусов используем ABS и стеклонаполненный ABS GF, для нагруженных элементов — полиамид PA12, для уплотнителей и гибких вставок — TPU, для детализированных лицевых панелей — фотополимеры. Материал подбираем под температуру, нагрузку и среду эксплуатации прибора, сертификаты — по запросу.',
  },
  {
    question: 'Нужна ли готовая 3D-модель, чтобы заказать корпус?',
    answer:
      'Нет. Принимаем любой вход: готовую модель (STL, STEP), чертёж, эскиз, фотографию, физический образец корпуса или просто саму плату с размерами. Наши инженеры построят 3D-модель, согласуют её с вами и только потом запустят печать.',
  },
  {
    question: 'Какой тираж корпусов можно изготовить без пресс-формы?',
    answer:
      'От 1 штуки до нескольких тысяч. Наш крупнейший проект — корпуса касс самообслуживания для «Ленты», «Магнита» и сети магазинов одежды: счёт перевалил за несколько тысяч единиц. Партию до 100 корпусов изготавливаем за 1–2 недели, на серийном потоке выпускаем до 30 комплектов в день. Затрат на оснастку нет ни при каком тираже.',
  },
  {
    question: 'Какие сроки изготовления корпуса?',
    answer:
      'Тестовый образец — 3–7 рабочих дней, срочные заказы — за 1–2 дня. Серия — партиями по графику: до 100 изделий за 1–2 недели. Благодаря парку из 20+ принтеров срочные образцы и серийные заказы идут параллельно и не блокируют друг друга.',
  },
  {
    question: 'Можно ли напечатать корпус для Arduino, Raspberry Pi или ESP32?',
    answer:
      'Да. Печатаем корпуса под любые платы — от Arduino, Raspberry Pi и ESP32 до промышленных контроллеров и нестандартной РЭА. Спроектируем посадочные стойки под крепёжные отверстия вашей платы, вырезы под USB, Ethernet, HDMI, антенны, кнопки и индикаторы. Это выгодно уже от 1 штуки — когда готовые корпуса из каталогов не подходят по размерам или компоновке.',
  },
  {
    question: 'Как вы защищаете конструкторскую документацию? Подписываете NDA?',
    answer:
      'Файлы и чертежи не передаём третьим лицам: всё производство — на собственной площадке, без субподряда. По запросу подпишем соглашение о неразглашении (NDA) до передачи документации — это стандартная практика при работе с приборостроителями и hardware-стартапами.',
  },
  {
    question: 'Как работаете с юрлицами: договор, счёт, документы?',
    answer:
      'Работаем с юридическими и физическими лицами по договору. Оплата безналичная по счёту, предоставляем закрывающие документы, для постоянных клиентов возможна постоплата. Готовые изделия отправляем СДЭК по всей России, по Санкт-Петербургу — курьером.',
  },
  {
    question: 'Что будет, если корпус не подойдёт или окажется бракованным?',
    answer:
      'Гарантируем соответствие согласованному ТЗ и 3D-модели: если изделие не соответствует спецификации — переделаем за свой счёт. Чтобы исключить риски на серии, рекомендуем стандартную схему: сначала тестовый образец, вы проверяете посадку платы и сборку, затем запускаем тираж.',
  },
];

const PART_TYPES = [
  'Корпус под печатную плату',
  'Корпус прибора или датчика',
  'Корпус терминала, КСО',
  'Прототип корпуса',
  'Другое изделие',
];

const QUANTITY_OPTIONS = ['1–10 шт', '10–100 шт', '100–1000 шт', '1000+ шт', 'Пока не знаю'];

const CONTACT_CHANNELS = ['Позвонить', 'Telegram', 'WhatsApp'];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/3d-print#business`,
      name: 'anyforms — 3D-печать корпусов для электроники',
      url: `${SITE_URL}/3d-print`,
      image: `${SITE_URL}/og-3d-print.png`,
      telephone: PHONE_E164,
      email: CONTACT_EMAIL,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Санкт-Петербург',
        addressCountry: 'RU',
      },
      priceRange: '₽₽',
    },
    {
      '@type': 'Service',
      '@id': `${SITE_URL}/3d-print#service`,
      name: '3D-печать корпусов для электроники на заказ',
      serviceType: 'Изготовление корпусов для электроники и приборов на 3D-принтере',
      description:
        'Проектирование и серийная 3D-печать корпусов для печатных плат, приборов, датчиков и касс самообслуживания: от 1 штуки до нескольких тысяч, без пресс-формы. Материалы PETG, ABS, ABS GF, PA12, TPU.',
      provider: { '@id': `${SITE_URL}/3d-print#business` },
      areaServed: [
        { '@type': 'City', name: 'Санкт-Петербург' },
        { '@type': 'Country', name: 'Россия' },
      ],
      offers: {
        '@type': 'Offer',
        priceCurrency: 'RUB',
        price: '2000',
        description:
          'Комплект корпуса КСО (корпус + заглушка из PETG) при тираже 400 шт. Точная цена — по 3D-модели или чертежу.',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/3d-print#faq`,
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/3d-print#breadcrumbs`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE_URL}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: '3D-печать корпусов для электроники',
          item: `${SITE_URL}/3d-print`,
        },
      ],
    },
  ],
};

const scrollToCalcForm = () => {
  document.getElementById('calc-form')?.scrollIntoView({ behavior: 'smooth' });
};

const scrollToSection = (id) => (event) => {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Print3dLanding = () => {
  const [typedHeroText, setTypedHeroText] = useState(HERO_VARIANTS[0]);
  const [heroVariantIndex, setHeroVariantIndex] = useState(0);
  const [isDeletingHeroText, setIsDeletingHeroText] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isStickyCtaHidden, setIsStickyCtaHidden] = useState(false);
  const calcSectionRef = useRef(null);

  const [formData, setFormData] = useState({
    partType: '',
    quantity: '',
    description: '',
    name: '',
    phone: '',
    channel: CONTACT_CHANNELS[0],
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  useEffect(() => {
    const target = calcSectionRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsStickyCtaHidden(entry.isIntersecting),
      { rootMargin: '0px 0px -20% 0px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleFormChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    if (!trimmedName || !trimmedPhone) {
      setFormError('Укажите имя и телефон — перезвоним в течение 15 минут в рабочее время.');
      return;
    }
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setFormError('Проверьте номер телефона — похоже, в нём опечатка.');
      return;
    }
    setFormError('');
    setFormSubmitting(true);
    // API принимает только leadName/name/phone, поэтому детали заявки
    // упаковываются в название сделки
    const details = [
      formData.partType && `изделие: ${formData.partType}`,
      formData.quantity && `тираж: ${formData.quantity}`,
      formData.channel && `связь: ${formData.channel}`,
      formData.description.trim() && `задача: ${formData.description.trim().slice(0, 300)}`,
    ]
      .filter(Boolean)
      .join('; ');
    try {
      const { data } = await apiClient.api.createLead({
        leadName: details ? `${LANDING_LEAD_NAME} — ${details}` : LANDING_LEAD_NAME,
        name: trimmedName,
        phone: trimmedPhone,
      });
      if (data?.success === false) {
        const message = data?.error || 'Не удалось отправить заявку. Попробуйте ещё раз.';
        setFormError(message);
        toast.error(message);
        return;
      }
      setFormSubmitted(true);
      if (typeof window.ym === 'function') {
        window.ym(106593235, 'reachGoal', 'print3d_lead');
      }
    } catch (err) {
      const fromApi = err.response?.data?.error;
      const message =
        typeof fromApi === 'string'
          ? fromApi
          : 'Не удалось отправить заявку. Попробуйте ещё раз.';
      setFormError(message);
      toast.error(message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <LandingHeader
        logo={{
          href: '#top',
          ariaLabel: 'anyforms — 3D-печать корпусов для электроники',
          alt: 'anyforms',
          src: '/anyforms_logo_new_white.svg',
          width: 200,
          height: 46,
          onClick: (event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
        }}
        navLinks={[
          { key: 'cases', href: '#cases', label: 'Кейсы', onClick: scrollToSection('cases') },
          { key: 'price', href: '#price', label: 'Цены и сроки', onClick: scrollToSection('price') },
          {
            key: 'materials',
            href: '#materials',
            label: 'Материалы',
            onClick: scrollToSection('materials'),
          },
        ]}
        navAriaLabel="Разделы страницы"
        rightItems={[
          {
            key: 'calc-desktop',
            kind: 'link',
            href: '#calc-form',
            label: 'Рассчитать стоимость',
            variant: 'pill',
            onClick: (e) => {
              e.preventDefault();
              scrollToCalcForm();
            },
          },
        ]}
        mobileMenuId="print3d-mobile-menu"
        mobileLinks={[
          { key: 'cases-m', href: '#cases', label: 'Кейсы', onClick: scrollToSection('cases') },
          { key: 'price-m', href: '#price', label: 'Цены и сроки', onClick: scrollToSection('price') },
          {
            key: 'materials-m',
            href: '#materials',
            label: 'Материалы',
            onClick: scrollToSection('materials'),
          },
        ]}
        mobileTopItems={[
          {
            key: 'calc-mobile',
            kind: 'link',
            href: '#calc-form',
            label: 'Рассчитать стоимость',
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
      <section className={styles.hero} aria-label="3D-печать корпусов для электроники на заказ">
        <div className={styles.heroGrid}>
          <div className={styles.heroInfoCard}>
            <span className={styles.heroDescriptor}>
              3D-печать корпусов • собственное производство в Санкт-Петербурге
            </span>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}>Корпуса для электроники</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                на заказ — от 1 шт до серии
              </span>
            </h1>
            <p className={`${styles.heroTitle} ${styles.heroTypedAside}`} aria-hidden>
              <span className={`${styles.heroTitleLine} ${styles.heroTypedLine}`}>
                {HERO_PREFIX}
                {typedHeroText}
                <span className={styles.heroCaret} aria-hidden />
              </span>
            </p>
            <p className={styles.heroTagline}>
              Спроектируем и изготовим корпус точно под вашу плату — без пресс-формы и затрат
              на оснастку. Образец за 3–7 рабочих дней, серийный ориентир — 2000 ₽/комплект
              при тираже 400 шт.
              <br />
              Пришлите 3D-модель, чертёж или просто плату — рассчитаем стоимость за 15 минут.
            </p>
            <div className={styles.heroTrustSignals} aria-label="Факты о компании">
              <div className={styles.heroTrustItem}>
                <span className={styles.heroTrustValue}>5+</span>
                <span className={styles.heroTrustLabel}>лет на рынке</span>
              </div>
              <div className={styles.heroTrustItem}>
                <span className={styles.heroTrustValue}>20+</span>
                <span className={styles.heroTrustLabel}>принтеров в парке</span>
              </div>
              <div className={styles.heroTrustItem}>
                <span className={styles.heroTrustValue}>1000+</span>
                <span className={styles.heroTrustLabel}>выполненных заказов</span>
              </div>
              <div className={styles.heroTrustItem}>
                <span className={styles.heroTrustValue}>тысячи</span>
                <span className={styles.heroTrustLabel}>корпусов в «Ленте» и «Магните»</span>
              </div>
            </div>
            <div className={styles.heroCtaRow}>
              <CTAButton onClick={scrollToCalcForm}>Рассчитать стоимость корпуса</CTAButton>
              <a
                className={styles.secondaryCta}
                href={TELEGRAM_PRINT_BOT}
                target="_blank"
                rel="noopener noreferrer"
              >
                Или пришлите файл в Telegram
              </a>
            </div>
            <p className={styles.heroCtaNote}>
              Бесплатно и без обязательств. Ответим за 15 минут в рабочее время.
            </p>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img
                  className={styles.heroImage}
                  src={HERO_IMAGES.main}
                  alt="3D-принтер Bambu Lab печатает корпус на производстве anyforms"
                  width={1920}
                  height={2560}
                  loading="eager"
                  fetchpriority="high"
                />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.top}
                    alt="Напечатанная на 3D-принтере деталь корпуса из синего пластика"
                    width={1920}
                    height={2560}
                    loading="eager"
                  />
                </div>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={HERO_IMAGES.bottom}
                    alt="Напечатанная рамка лицевой панели корпуса для электроники"
                    width={1920}
                    height={2560}
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST STRIP ═══════════════ */}
      <section className={styles.trustSection} aria-labelledby="trust-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="trust-title">
              Наши корпуса уже работают в федеральной рознице
            </h2>
          </div>
          <div className={styles.trustGrid}>
            {TRUST_CLIENTS.map((client) => (
              <article key={client.name} className={styles.trustCard}>
                <h3 className={styles.trustCardTitle}>{client.name}</h3>
                <p className={styles.trustCardText}>{client.text}</p>
              </article>
            ))}
          </div>
          <p className={styles.trustFacts}>
            Несколько тысяч корпусов в эксплуатации • до 30 комплектов в день на серийном
            потоке • всё производство на собственной площадке, без субподряда
          </p>
        </div>
      </section>

      {/* ═══════════════ SEGMENTS ═══════════════ */}
      <section className={styles.darkSection} aria-labelledby="segments-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}
              id="segments-title"
            >
              Какие корпуса мы изготавливаем
            </h2>
            <p className={`${styles.sectionLead} ${styles.sectionLeadLight}`}>
              Не универсальная 3D-печать «всего подряд», а корпусные изделия под электронику —
              с посадкой платы, вырезами под разъёмы и крепежом.
            </p>
          </div>
          <div className={styles.directionGrid}>
            {SEGMENTS.map((item) => (
              <article key={item.title} className={styles.darkCard}>
                <h3 className={styles.darkCardTitle}>{item.title}</h3>
                <p className={styles.darkCardText}>{item.description}</p>
              </article>
            ))}
          </div>
          <p className={styles.directionAccent}>
            Экспресс-корпусирование: от платы до готового корпуса — за одну-две недели, без
            литьевой формы.
          </p>
        </div>
      </section>

      {/* ═══════════════ CASES ═══════════════ */}
      <section className={styles.casesSection} id="cases" aria-labelledby="cases-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="cases-title">
              Кейсы: серийные корпуса, которые уже работают
            </h2>
            <p className={styles.sectionLead}>
              Реальные задачи по изготовлению корпусов — с тиражами, ценами и фото изделий в
              эксплуатации.
            </p>
          </div>
          <div className={styles.caseGrid}>
            {CASE_STUDIES.map((item) => (
              <article key={item.id} className={styles.caseCard}>
                <img
                  className={styles.caseImage}
                  src={item.image}
                  alt={item.alt}
                  width={1920}
                  height={2560}
                  loading="lazy"
                />
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
          <div className={styles.sectionCtaRow}>
            <CTAButton onClick={scrollToCalcForm}>Рассчитать мой корпус</CTAButton>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className={styles.featureSection} aria-labelledby="features-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}
              id="features-title"
            >
              Что предусмотрим в конструкции вашего корпуса
            </h2>
            <p className={`${styles.sectionLead} ${styles.sectionLeadLight}`}>
              Корпус — это не коробка, а часть прибора. Проектируем под сборку, обслуживание и
              эксплуатацию.
            </p>
          </div>
          <ul className={styles.featureList}>
            {FEATURES.map((feature) => (
              <li key={feature} className={styles.featureItem}>
                {feature}
              </li>
            ))}
          </ul>
          <p className={styles.featureClosing}>
            Точность посадок подтверждаем тестовым образцом: сначала вы проверяете плату в
            корпусе, потом мы запускаем серию.
          </p>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section className={styles.pricingSection} id="price" aria-labelledby="pricing-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="pricing-title">
              Цены и сроки: ориентиры до звонка
            </h2>
            <p className={styles.sectionLead}>
              Мелкосерийное производство пластиковых корпусов без пресс-формы: цена зависит
              от габаритов, веса детали, материала и тиража. Чтобы вы понимали порядок цифр
              заранее — реальные ориентиры нашего производства.
            </p>
          </div>
          <div className={styles.pricingTable}>
            {PRICING_TIERS.map((tier) => (
              <article key={tier.tier} className={styles.pricingRow}>
                <div className={styles.pricingTier}>
                  <h3 className={styles.pricingTierName}>{tier.tier}</h3>
                  <span className={styles.pricingVolume}>{tier.volume}</span>
                </div>
                <p className={styles.pricingTerm}>{tier.term}</p>
                <p className={styles.pricingNote}>{tier.note}</p>
              </article>
            ))}
          </div>
          <ul className={styles.pricingBullets}>
            {PRICING_BULLETS.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <div className={styles.sectionCtaRow}>
            <CTAButton onClick={scrollToCalcForm}>Получить расчёт за 15 минут</CTAButton>
          </div>
        </div>
      </section>

      {/* ═══════════════ VS MOLDING ═══════════════ */}
      <section className={styles.compareSection} aria-labelledby="compare-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}
              id="compare-title"
            >
              3D-печать или литьё под давлением: что выгоднее для вашего тиража
            </h2>
            <p className={`${styles.sectionLead} ${styles.sectionLeadLight}`}>
              Литьё незаменимо на десятках тысяч штук. Но большинству приборов нужны сотни и
              тысячи корпусов — и здесь экономика на стороне печати.
            </p>
          </div>
          <div className={styles.compareTable} role="table" aria-label="Сравнение 3D-печати и литья под давлением">
            <div className={`${styles.compareRow} ${styles.compareHeadRow}`} role="row">
              <span className={styles.compareLabel} role="columnheader" aria-label="Критерий" />
              <span className={styles.compareUsHead} role="columnheader">
                3D-печать anyforms
              </span>
              <span className={styles.compareThemHead} role="columnheader">
                Литьё под давлением
              </span>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className={styles.compareRow} role="row">
                <span className={styles.compareLabel} role="cell">
                  {row.label}
                </span>
                <span className={styles.compareUs} role="cell">
                  {row.print}
                </span>
                <span className={styles.compareThem} role="cell">
                  {row.molding}
                </span>
              </div>
            ))}
          </div>
          <p className={styles.compareConclusion}>
            На малых и средних тиражах изготовление корпусов без пресс-формы обходится до 70%
            дешевле запуска через литьевую оснастку — и стартует за дни, а не месяцы.
          </p>
          <p className={styles.compareHonesty}>
            Честно: если ваш тираж — десятки тысяч штук в год, литьё будет дешевле, и мы прямо
            скажем об этом на расчёте. А пока пресс-форма проектируется и изготавливается,
            первые партии можно печатать у нас — с уже обкатанной геометрией.
          </p>
        </div>
      </section>

      {/* ═══════════════ MATERIALS ═══════════════ */}
      <section className={styles.materialsSection} id="materials" aria-labelledby="materials-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="materials-title">
              Материалы для корпусов: инженерные марки, а не хобби-пластик
            </h2>
            <p className={styles.sectionLead}>
              Пластиковый корпус должен переживать реальную эксплуатацию: подбираем материал
              под температуру, нагрузки и среду прибора. На все материалы — сертификаты по
              запросу.
            </p>
          </div>
          <div className={styles.materialGrid}>
            {MATERIALS.map((material) => (
              <article key={material.name} className={styles.materialCard}>
                <h3 className={styles.materialName}>{material.name}</h3>
                <p className={styles.materialText}>{material.text}</p>
              </article>
            ))}
          </div>
          <p className={styles.materialClosing}>
            Не уверены в выборе? Опишите, где будет работать прибор, — инженер предложит
            материал под задачу.
          </p>
        </div>
      </section>

      {/* ═══════════════ PRODUCTION ═══════════════ */}
      <section className={styles.capabilitiesHero} aria-labelledby="capabilities-title">
        <div className={`${styles.heroGrid} ${styles.heroGridReverse}`}>
          <div className={styles.heroInfoCard}>
            <h2 className={styles.heroTitle} id="capabilities-title">
              <span className={styles.heroTitleLine}>Собственное производство</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                в Санкт-Петербурге
              </span>
            </h2>
            <p className={styles.heroTagline}>
              Ваш заказ выполняется на нашей площадке — без посредников и субподряда. Вы
              напрямую контролируете сроки и качество.
            </p>
            <ul className={styles.heroFacts} aria-label="Производственные возможности">
              <li>
                20+ принтеров — серийная 3D-печать и срочные образцы идут параллельно, ваш
                заказ не ждёт очереди
              </li>
              <li>До 100 корпусов за 1–2 недели, на серийном потоке — до 30 комплектов в день</li>
              <li>
                Повторяемость от партии к партии: серия печатается на отработанных профилях,
                каждое изделие проверяем перед отгрузкой
              </li>
              <li>Пластики, инженерные материалы и фотополимеры на одной площадке</li>
              <li>Курьерская доставка по Санкт-Петербургу, отправка СДЭК по всей России</li>
            </ul>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.heroSideMedia}>
              <div className={styles.heroSideSingle}>
                <img
                  className={styles.heroImage}
                  src={CAPABILITY_IMAGES.main}
                  alt="Линейка 3D-принтеров на производстве anyforms в Санкт-Петербурге"
                  width={958}
                  height={1280}
                  loading="lazy"
                />
              </div>
              <div className={styles.heroSideStack}>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={CAPABILITY_IMAGES.top}
                    alt="3D-принтер в работе на производственной площадке anyforms"
                    width={960}
                    height={1280}
                    loading="lazy"
                  />
                </div>
                <div className={styles.heroSideCard}>
                  <img
                    className={styles.heroImage}
                    src={CAPABILITY_IMAGES.bottom}
                    alt="Печать корпусной детали из синего пластика на 3D-принтере"
                    width={1920}
                    height={2560}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ PROCESS ═══════════════ */}
      <section className={styles.lightSection} aria-labelledby="workflow-title">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="workflow-title">
              От платы до серийного корпуса — 5 шагов
            </h2>
            <p className={styles.sectionLead}>
              Можно прийти без готовой 3D-модели: поможем с геометрией, материалом и
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

      {/* ═══════════════ ENGINEERING / TEAM ═══════════════ */}
      <section className={styles.teamScreen} aria-labelledby="team-screen-title">
        <div className={styles.heroGrid}>
          <div className={styles.heroInfoCard}>
            <h2 className={styles.heroTitle} id="team-screen-title">
              <span className={styles.heroTitleLine}>Нет 3D-модели?</span>
              <span className={`${styles.heroTitleLine} ${styles.heroTitleMuted}`}>
                Спроектируем по плате
              </span>
            </h2>
            <p className={styles.heroTagline}>
              Для заказа достаточно того, что у вас уже есть. Работаем с любым входом:
            </p>
            <ul className={styles.heroFacts} aria-label="С чем можно прийти">
              {ENGINEERING_INPUTS.map((input) => (
                <li key={input.title}>
                  <strong>{input.title}</strong> — {input.text}
                </li>
              ))}
            </ul>
            <div className={styles.teamMembers}>
              <div className={styles.teamMember}>
                <p className={styles.teamMemberName}>Юрий — конструкция и материалы</p>
                <p className={styles.teamMemberDesc}>
                  Проверяет геометрию, подбирает материал и технологию печати, чтобы корпус
                  собрался и заработал с первого раза.
                </p>
              </div>
              <div className={styles.teamMember}>
                <p className={styles.teamMemberName}>Дмитрий — производство и сроки</p>
                <p className={styles.teamMemberDesc}>
                  Контролирует заказ от запуска до отгрузки и не выпускает партию, пока не
                  убедится в качестве.
                </p>
              </div>
            </div>
            <ul className={styles.teamStats} aria-label="Опыт команды">
              <li>5+ лет в 3D-печати</li>
              <li>1000+ выполненных заказов</li>
              <li>Собственная производственная площадка</li>
            </ul>
            <CTAButton onClick={scrollToCalcForm}>Обсудить проект с инженером</CTAButton>
          </div>

          <div className={styles.mediaContainer}>
            <div className={styles.teamSingleMedia}>
              <img
                className={styles.heroImage}
                src={TEAM_IMAGE}
                alt="Команда anyforms на производственной площадке 3D-печати"
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
        ref={calcSectionRef}
        aria-labelledby="calc-form-title"
      >
        <div className={styles.sectionInner}>
          <div className={styles.calcInner}>
            {!formSubmitted ? (
              <>
                <div className={styles.calcInfo}>
                  <h2 className={styles.sectionTitle} id="calc-form-title">
                    Рассчитайте стоимость вашего корпуса
                  </h2>
                  <p className={styles.sectionLead}>
                    Заполните форму — перезвоним, уточним детали и назовём точную стоимость и
                    срок. Бесплатно и без обязательств.
                  </p>
                  <div className={styles.calcBenefits}>
                    <span className={styles.calcBenefit}>Ответ за 15 минут</span>
                    <span className={styles.calcBenefit}>Расчёт бесплатно</span>
                    <span className={styles.calcBenefit}>NDA по запросу</span>
                  </div>
                  <p className={styles.calcAlternative}>
                    Удобнее в мессенджере? Пришлите модель или фото платы в{' '}
                    <a
                      className={styles.calcAlternativeLink}
                      href={TELEGRAM_PRINT_BOT}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Telegram
                    </a>{' '}
                    — ответим там же.
                  </p>
                </div>
                <form className={styles.calcForm} onSubmit={handleFormSubmit} noValidate>
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
                      Тираж
                    </label>
                    <select
                      id="quantity"
                      className={styles.formSelect}
                      value={formData.quantity}
                      onChange={handleFormChange('quantity')}
                    >
                      <option value="">Выберите тираж</option>
                      {QUANTITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="description">
                      Описание задачи{' '}
                      <span className={styles.formOptional}>(необязательно)</span>
                    </label>
                    <textarea
                      id="description"
                      className={styles.formTextarea}
                      placeholder="Опишите прибор, укажите размеры платы или вставьте ссылку на модель/чертёж"
                      rows={3}
                      value={formData.description}
                      onChange={handleFormChange('description')}
                    />
                    <p className={styles.formHint}>
                      Нет 3D-модели? Достаточно чертежа или фото — инженеры построят модель.
                    </p>
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
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={formData.phone}
                        onChange={handleFormChange('phone')}
                        required
                      />
                    </div>
                  </div>
                  <fieldset className={styles.channelFieldset}>
                    <legend className={styles.formLabel}>Как с вами связаться</legend>
                    <div className={styles.channelRow}>
                      {CONTACT_CHANNELS.map((channel) => (
                        <label
                          key={channel}
                          className={`${styles.channelChip} ${
                            formData.channel === channel ? styles.channelChipActive : ''
                          }`}
                        >
                          <input
                            className={styles.channelInput}
                            type="radio"
                            name="channel"
                            value={channel}
                            checked={formData.channel === channel}
                            onChange={handleFormChange('channel')}
                          />
                          {channel}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {formError && <p className={styles.formError}>{formError}</p>}
                  <CTAButton type="submit" disabled={formSubmitting}>
                    {formSubmitting ? 'Отправляем…' : 'Получить расчёт за 15 минут'}
                  </CTAButton>
                  <p className={styles.formDisclaimer}>
                    Файлы и данные не передаём третьим лицам, по запросу подпишем NDA.
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
                  Свяжемся с вами в течение 15 минут в рабочее время: уточним детали и
                  подготовим расчёт стоимости корпуса.
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
                    Позвонить: {PHONE_DISPLAY}
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
              Частые вопросы о 3D-печати корпусов
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
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span>{item.question}</span>
                  <span className={styles.faqIcon} aria-hidden>
                    {openFaqIndex === idx ? '−' : '+'}
                  </span>
                </button>
                {/* Ответ всегда в DOM (и в пререндеренном HTML для поисковиков),
                    сворачивание — только через CSS */}
                <div
                  id={`faq-answer-${idx}`}
                  className={`${styles.faqAnswer} ${
                    openFaqIndex === idx ? '' : styles.faqAnswerCollapsed
                  }`}
                >
                  <p>{item.answer}</p>
                </div>
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
              Пришлите плату — вернём её в корпусе
            </h2>
            <p className={styles.sectionLead}>
              Модель, чертёж, фото или образец — подойдёт любой формат. Предложим
              конструкцию, материал и точную цену.
            </p>
            <div className={styles.finalCtaActions}>
              <CTAButton onClick={scrollToCalcForm}>Рассчитать стоимость корпуса</CTAButton>
              <a
                className={styles.secondaryCta}
                href={TELEGRAM_PRINT_BOT}
                target="_blank"
                rel="noopener noreferrer"
              >
                Написать в Telegram
              </a>
              <a className={styles.secondaryCta} href={`tel:${PHONE_E164}`}>
                Позвонить: {PHONE_DISPLAY}
              </a>
            </div>
            <p className={styles.heroCtaNote}>
              Расчёт за 15 минут в рабочее время. Бесплатно и без обязательств.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className={styles.siteFooter}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBlock}>
              <h3 className={styles.footerHeading}>О компании</h3>
              <p className={styles.footerText}>
                ИП Суворов Дмитрий Игоревич
                <br />
                ИНН 590699241510
                <br />
                Производство: г. Санкт-Петербург
              </p>
            </div>
            <div className={styles.footerBlock}>
              <h3 className={styles.footerHeading}>Контакты</h3>
              <p className={styles.footerText}>
                <a
                  className={styles.footerLink}
                  href={`tel:${PHONE_E164}`}
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
              <h3 className={styles.footerHeading}>Гарантии</h3>
              <p className={styles.footerText}>
                Соответствие ТЗ и согласованной 3D-модели
                <br />
                Переделка за наш счёт при несоответствии
                <br />
                Сертификаты на материалы по запросу
              </p>
            </div>
          </div>
        </div>

        <p className={styles.footerSeoLine}>
          3D-печать корпусов для электроники на заказ в Санкт-Петербурге: корпуса для
          печатных плат, приборов, датчиков и касс самообслуживания. Мелкосерийное
          производство пластиковых корпусов — от 1 штуки до серии, доставка по всей России.
        </p>
        <p className={styles.footerLegal}>
          <Link to="/" className={styles.footerLegalLink}>
            Главная
          </Link>
          {' · '}
          <Link to="/chief/privacy" className={styles.footerLegalLink}>
            Политика конфиденциальности
          </Link>
        </p>
        <p className={styles.footerCopyright}>© anyforms, 2026. Все права защищены</p>
      </footer>

      {/* ═══════════════ STICKY MOBILE CTA ═══════════════ */}
      <div
        className={`${styles.stickyCtaBar} ${isStickyCtaHidden ? styles.stickyCtaBarHidden : ''}`}
      >
        <button type="button" className={styles.stickyCtaButton} onClick={scrollToCalcForm}>
          Рассчитать стоимость корпуса
        </button>
      </div>
    </div>
  );
};

export default Print3dLanding;

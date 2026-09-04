// Единственный источник реквизитов продавца/оператора ПДн для всего сайта.
// Меняется здесь — подтягивается в футеры, страницу реквизитов и подвал юр-страниц.
// Юр-тексты в legalDocs.js держат реквизиты литералами (это снимок редакции), при
// смене реквизитов их нужно перевыпустить новой редакцией.
export const SELLER = {
  shortName: 'ИП Суворов Дмитрий Игоревич',
  fullName: 'Индивидуальный предприниматель Суворов Дмитрий Игоревич',
  inn: '590699241510',
  ogrnip: '324784700274710',
  address: 'г. Санкт-Петербург, ул. Заречная, д. 36, корп. 1, кв. 404',
  email: 'suvorov@anyforms.ru',
  phone: '+7 981 040-39-53',
  phoneE164: '+79810403953',
  site: 'anyforms.ru',
  supportTelegram: '@AnyFormsBot',
  supportTelegramUrl: 'https://t.me/AnyFormsBot',
};

// Ссылки на юр-страницы — чтобы футеры и формы не расходились в адресах.
export const LEGAL_LINKS = {
  privacy: '/privacy',
  requisites: '/requisites',
  shopOffer: '/shop/offer',
  guideOffer: '/guide/offer',
  courseOffer: '/course/offer',
};

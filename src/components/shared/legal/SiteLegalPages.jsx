import React from 'react';
import LegalPage from './LegalPage';
import { SITE_PRIVACY, SHOP_OFFER } from './legalDocs';

// Юр-страницы сайта живут в отдельном чанке: legalDocs.js — ~110 KB текста,
// который нужен только здесь и на /course|/guide/offer|privacy. App.jsx
// импортирует этот модуль лениво, чтобы тексты не попадали в основной бандл.

export function SitePrivacyPage() {
  return <LegalPage doc={SITE_PRIVACY} />;
}

export function ShopOfferPage() {
  return <LegalPage doc={SHOP_OFFER} backTo="/shop" backLabel="← В магазин" headerLabel="Магазин" />;
}

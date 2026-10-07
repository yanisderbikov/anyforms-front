import { formatNumber, labelOf, parseNumber } from './calculatorModel';

export const KP_WORKS = [
  ['model', '3D-моделирование изделия'],
  ['sla', 'печать мастер-модели'],
  ['fdmProject', 'проектирование литьевой оснастки'],
  ['kit', 'печать литьевой оснастки'],
  ['processing', 'обработка мастер-модели'],
  ['cnc', 'фрезеровка на ЧПУ'],
  ['prep', 'подготовка к производству'],
  ['intermediate', 'промежуточная форма и эталонная копия'],
  ['extraKits', 'дополнительные производственные комплекты для параллельного литья'],
];

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export const kpDate = (date = new Date()) =>
  date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export const dimsText = (position) => {
  const dims = [position.widthMm, position.depthMm, position.heightMm].map(parseNumber);
  return dims.every((d) => d != null && d > 0) ? `${dims.map((d) => formatNumber(d, 1)).join(' × ')} мм` : null;
};

export const optionTitle = (option, catalog, variantsCount) => [
  variantsCount > 1 ? labelOf(catalog?.formTypes, option.formType).toLowerCase() : null,
  `силикон — ${labelOf(catalog?.silicones, option.silicone)}`,
  `${option.tirage} шт`,
].filter(Boolean).join(', ');

export const offeredOptions = (positionResult) => {
  const offered = positionResult.options.filter((o) => !o.hints.some((h) => h.level === 'ERROR'));
  return offered.length ? offered : [positionResult.options[positionResult.selectedOption]];
};

export const developmentWorks = (options) =>
  KP_WORKS.filter(([key]) => options.some((o) => (o.developmentWorks || []).includes(key))).map(([, label]) => label);

export const differences = (options, catalog) => {
  const lines = [];
  const silicones = [...new Set(options.map((o) => o.silicone))];
  if (silicones.length > 1) {
    silicones.forEach((code) => {
      const item = catalog?.silicones?.find((s) => s.code === code);
      if (item) lines.push(`${item.label[0].toUpperCase()}${item.label.slice(1)}: ${item.hint[0].toLowerCase()}${item.hint.slice(1)}`);
    });
  }
  const formTypes = [...new Set(options.map((o) => o.formType))];
  if (formTypes.length > 1) {
    lines.push(`Конструкция формы: ${formTypes.map((code) => labelOf(catalog?.formTypes, code).toLowerCase()).join(' или ')} — отличаются расходом силикона, оснасткой и удобством литья.`);
  }
  const tirages = [...new Set(options.map((o) => o.tirage))];
  if (tirages.length > 1) {
    lines.push('Чем больше тираж, тем ниже цена в пересчёте на одну форму: разработка оплачивается один раз.');
  }
  return lines;
};

export const discountLine = (summary) => {
  if (!summary) return null;
  const parts = [];
  if (summary.formsDiscountApplied > 0) {
    parts.push(summary.formsDiscountCapped
      ? `максимальная скидка ${formatNumber(summary.formsDiscountApplied, 1)}% на формы`
      : `скидка ${formatNumber(summary.formsDiscountApplied, 1)}% на формы`);
  }
  if (summary.developmentDiscount > 0) parts.push(`скидка ${formatNumber(summary.developmentDiscount, 1)}% на разработку`);
  if (summary.promoDiscount > 0) parts.push(`промокод ${formatNumber(summary.promoDiscount, 1)}%`);
  return parts.length ? `Цены указаны с учётом: ${parts.join(', ')}.` : null;
};

export const isImageReference = (reference) => {
  const name = String(reference?.filename || reference?.key || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  return dot >= 0 && IMAGE_EXTENSIONS.includes(name.slice(dot + 1));
};

export const imageReferenceKeys = (order) =>
  order.positions.flatMap((p) => (p.references || []).filter(isImageReference).map((r) => r.key));

export const firstImageUrl = (position, referenceUrls) => {
  const reference = (position.references || []).find((r) => isImageReference(r) && referenceUrls?.[r.key]);
  return reference ? referenceUrls[reference.key] : null;
};

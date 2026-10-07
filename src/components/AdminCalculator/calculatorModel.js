export const DRAFT_STORAGE_KEY = 'anyforms_order_calculator_draft';

export const TECH_GROUPS = [
  {
    title: 'модель и мастер-модель',
    fields: [
      { key: 'modelContractorPrice', label: 'Цена художника за модель', unit: '₽', hint: 'Наша себестоимость модели' },
      { key: 'slaAreaCm2', label: 'Площадь мастер-модели', unit: 'см²', hint: 'Всех частей' },
      { key: 'slaVolumeCm3', label: 'Объём мастер-модели', unit: 'см³' },
      { key: 'slaMlManual', label: 'Смола вручную', unit: 'мл', hint: 'Если площадь и объём не заданы' },
      { key: 'slaHours', label: 'Печать SLA', unit: 'ч', hint: '≈ 0,1 ч на 1 мм высоты самой высокой детали' },
      { key: 'textureFactor', label: 'Крупная фактура', unit: '×', hint: 'Рис, вязка, мех: площадь × 1,5–2' },
      { key: 'processingHours', label: 'Обработка мастер-модели', unit: 'ч', hint: 'И сборка подложек, матриц' },
    ],
  },
  {
    title: 'оснастка',
    fields: [
      { key: 'fdmProjectHours', label: 'Проектирование оснастки', unit: 'ч' },
      { key: 'kitGrams', label: 'Литьевой комплект', unit: 'г' },
      { key: 'kitHours', label: 'Печать комплекта', unit: 'ч' },
      { key: 'cncHours', label: 'Фрезеровка ЧПУ', unit: 'ч' },
      { key: 'prepRub', label: 'Подготовка и доп. работы', unit: '₽', hint: 'Сборка матрицы, вторая копия, лишний комплект' },
    ],
  },
  {
    title: 'форма',
    fields: [
      { key: 'siliconeGrams', label: 'Силикон одной формы', unit: 'г', hint: 'Сумма всех частей формы' },
      { key: 'shellGrams', label: 'Рабочая оснастка к форме', unit: 'г', hint: 'Кожух, опоры, вытеснители' },
      { key: 'extraPerFormRub', label: 'Доплаты к форме', unit: '₽', hint: 'Фанера, ЧПУ, +40 ₽ за каждую доп. заливку' },
      { key: 'weightReserve', label: 'Запас к весу', unit: '%', percent: true, hint: '5% — если вес по готовой 3D-модели' },
    ],
  },
  {
    title: 'промежуточная форма и копия',
    fields: [
      { key: 'tinGrams', label: 'Оловянная форма', unit: 'г', hint: 'Всех, если их несколько' },
      { key: 'tinFormsCount', label: 'Промежуточных форм', unit: 'шт', integer: true },
      { key: 'copyGrams', label: 'Пластиковая копия', unit: 'г' },
    ],
  },
];

export const TECH_FIELDS = TECH_GROUPS.flatMap((group) => group.fields);

export const EXCEPTION_FIELDS = [
  { key: 'modelPriceOverride', label: 'Цена модели вручную', unit: '₽', hint: 'Каратист: 8 000 вместо 11 000' },
  { key: 'kitsOverride', label: 'Производственных комплектов', unit: 'шт', integer: true, hint: 'Одна матрица при любом тираже' },
  { key: 'formPriceOverride', label: 'Цена формы вручную', unit: '₽', hint: 'Кластер: 950 + 350 ₽ за доп. ячейку' },
];

export const TRI_STATE_FIELDS = [
  { key: 'needsIntermediate', label: 'Промежуточная оловянная форма', hint: 'Авто: да для платины с SLA-мастера' },
  { key: 'hasCut', label: 'Продольный разрез' },
  { key: 'shellRequired', label: 'Кожух (рабочая оснастка)', hint: 'Авто — по правилу типа формы' },
];

export const SOURCE_LABELS = {
  ESTIMATE: 'оценка',
  DEFAULT: 'по умолч.',
  AI: 'AI',
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyVariant = (formType = 'STOCKING') => ({
  formType,
  masterType: 'SLA',
  setFormsCount: '',
  cellsCount: '',
  modifiers: [],
  shellRequired: null,
  shellUnstable: false,
  needsIntermediate: null,
  hasCut: null,
  aiFields: [],
  ...Object.fromEntries(TECH_FIELDS.map((f) => [f.key, ''])),
  ...Object.fromEntries(EXCEPTION_FIELDS.map((f) => [f.key, ''])),
});

export const emptyPosition = () => ({
  key: uid(),
  productName: '',
  widthMm: '',
  depthMm: '',
  heightMm: '',
  pourMaterial: 'WAX',
  hasClientModel: false,
  digitalOnly: false,
  sharedModel: false,
  sharedSlaPrint: false,
  bonus: false,
  tirages: '',
  silicones: ['PLATINUM'],
  variants: [emptyVariant()],
  activeVariant: 0,
  selectedVariant: 0,
  selectedSilicone: null,
  selectedTirage: null,
  references: [],
  exceptionComment: '',
});

export const emptyDiscount = () => ({
  formsPercent: '',
  developmentPercent: '',
  promoPercent: '',
  allowBelowMinMargin: false,
  comment: '',
});

export const emptyOrder = () => ({
  client: '',
  comment: '',
  positions: [emptyPosition()],
  discount: emptyDiscount(),
});

export const parseNumber = (value) => {
  if (value === '' || value == null) return null;
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const parseInteger = (value) => {
  const n = parseNumber(value);
  return n == null ? null : Math.round(n);
};

export const parseTirages = (text) => {
  const values = String(text || '')
    .split(/[\s,;]+/)
    .map((part) => parseInt(part, 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 100000);
  return [...new Set(values)].slice(0, 6);
};

const fieldToApi = (field, raw) => {
  const n = parseNumber(raw);
  if (n == null) return null;
  if (field.percent) return n / 100;
  if (field.integer) return Math.round(n);
  return n;
};

const fieldFromApi = (field, value) => {
  if (value == null) return '';
  if (field.percent) return String(Math.round(value * 10000) / 100);
  return String(value);
};

const trimOrNull = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || null;
};

const buildVariant = (variant) => ({
  formType: variant.formType,
  masterType: variant.masterType || 'SLA',
  setFormsCount: variant.formType === 'SET' ? parseInteger(variant.setFormsCount) : null,
  cellsCount: variant.formType.startsWith('FLAT_MATRIX') ? parseInteger(variant.cellsCount) : null,
  modifiers: variant.modifiers,
  shellRequired: variant.shellRequired,
  shellUnstable: variant.shellUnstable,
  needsIntermediate: variant.needsIntermediate,
  hasCut: variant.hasCut,
  aiFields: variant.aiFields.filter((key) => parseNumber(variant[key]) != null || variant[key] === true || variant[key] === false),
  ...Object.fromEntries(TECH_FIELDS.map((f) => [f.key, fieldToApi(f, variant[f.key])])),
  ...Object.fromEntries(EXCEPTION_FIELDS.map((f) => [f.key, fieldToApi(f, variant[f.key])])),
});

const buildPosition = (position) => ({
  productName: trimOrNull(position.productName),
  widthMm: parseNumber(position.widthMm),
  depthMm: parseNumber(position.depthMm),
  heightMm: parseNumber(position.heightMm),
  pourMaterial: position.pourMaterial || null,
  hasClientModel: position.hasClientModel,
  digitalOnly: position.digitalOnly,
  sharedModel: position.sharedModel,
  sharedSlaPrint: position.sharedSlaPrint,
  bonus: position.bonus,
  tirages: parseTirages(position.tirages),
  silicones: position.silicones.length ? position.silicones : ['PLATINUM'],
  variants: position.variants.map(buildVariant),
  selectedVariant: Math.min(position.selectedVariant || 0, position.variants.length - 1),
  selectedSilicone: position.selectedSilicone,
  selectedTirage: position.selectedTirage,
  references: position.references,
  exceptionComment: trimOrNull(position.exceptionComment),
});

export const buildRequest = (order) => ({
  client: trimOrNull(order.client),
  comment: trimOrNull(order.comment),
  positions: order.positions.map(buildPosition),
  discount: {
    formsPercent: parseNumber(order.discount.formsPercent),
    developmentPercent: parseNumber(order.discount.developmentPercent),
    promoPercent: parseNumber(order.discount.promoPercent),
    allowBelowMinMargin: order.discount.allowBelowMinMargin,
    comment: trimOrNull(order.discount.comment),
  },
});

const str = (value) => (value == null ? '' : String(value));

const variantFromRequest = (variant) => ({
  ...emptyVariant(variant.formType || 'STOCKING'),
  masterType: variant.masterType || 'SLA',
  setFormsCount: str(variant.setFormsCount),
  cellsCount: str(variant.cellsCount),
  modifiers: variant.modifiers || [],
  shellRequired: variant.shellRequired ?? null,
  shellUnstable: Boolean(variant.shellUnstable),
  needsIntermediate: variant.needsIntermediate ?? null,
  hasCut: variant.hasCut ?? null,
  aiFields: variant.aiFields || [],
  ...Object.fromEntries(TECH_FIELDS.map((f) => [f.key, fieldFromApi(f, variant[f.key])])),
  ...Object.fromEntries(EXCEPTION_FIELDS.map((f) => [f.key, fieldFromApi(f, variant[f.key])])),
});

const positionFromRequest = (position) => {
  const variants = (position.variants || []).map(variantFromRequest);
  return {
    ...emptyPosition(),
    productName: position.productName || '',
    widthMm: str(position.widthMm),
    depthMm: str(position.depthMm),
    heightMm: str(position.heightMm),
    pourMaterial: position.pourMaterial || '',
    hasClientModel: Boolean(position.hasClientModel),
    digitalOnly: Boolean(position.digitalOnly),
    sharedModel: Boolean(position.sharedModel),
    sharedSlaPrint: Boolean(position.sharedSlaPrint),
    bonus: Boolean(position.bonus),
    tirages: (position.tirages || []).join(', '),
    silicones: position.silicones?.length ? position.silicones : ['PLATINUM'],
    variants: variants.length ? variants : [emptyVariant()],
    selectedVariant: position.selectedVariant || 0,
    selectedSilicone: position.selectedSilicone || null,
    selectedTirage: position.selectedTirage || null,
    references: position.references || [],
    exceptionComment: position.exceptionComment || '',
  };
};

export const orderFromRequest = (request) => ({
  client: request?.client || '',
  comment: request?.comment || '',
  positions: (request?.positions || []).map(positionFromRequest).concat(request?.positions?.length ? [] : [emptyPosition()]),
  discount: {
    formsPercent: str(request?.discount?.formsPercent),
    developmentPercent: str(request?.discount?.developmentPercent),
    promoPercent: str(request?.discount?.promoPercent),
    allowBelowMinMargin: Boolean(request?.discount?.allowBelowMinMargin),
    comment: request?.discount?.comment || '',
  },
});

export const hasFounderFields = (order) =>
  order.positions.some((p) => p.bonus || p.variants.some((v) => EXCEPTION_FIELDS.some((f) => v[f.key] !== '')))
  || order.discount.developmentPercent !== ''
  || order.discount.allowBelowMinMargin;

export const stripFounderFields = (order) => ({
  ...order,
  positions: order.positions.map((p) => ({
    ...p,
    bonus: false,
    exceptionComment: '',
    variants: p.variants.map((v) => ({ ...v, ...Object.fromEntries(EXCEPTION_FIELDS.map((f) => [f.key, ''])) })),
  })),
  discount: { ...order.discount, developmentPercent: '', allowBelowMinMargin: false, comment: '' },
});

export const duplicatePosition = (position) => ({
  ...JSON.parse(JSON.stringify(position)),
  key: uid(),
  productName: position.productName ? `${position.productName} (копия)` : '',
});

export const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft?.positions?.length) return null;
    return {
      ...emptyOrder(),
      ...draft,
      discount: { ...emptyDiscount(), ...draft.discount },
      positions: draft.positions.map((p) => ({
        ...emptyPosition(),
        ...p,
        variants: (p.variants || []).map((v) => ({ ...emptyVariant(v.formType), ...v })),
      })),
    };
  } catch {
    return null;
  }
};

export const writeDraft = (order) => {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(order));
    return true;
  } catch {
    return false;
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const modelPriceRequired = (position) => !position.hasClientModel && !position.sharedModel;

export const isModelPriceMissing = (position, variant) =>
  modelPriceRequired(position) && parseNumber(variant.modelContractorPrice) == null;

export const missingModelPrices = (order) => order.positions.flatMap((position, positionIndex) => position.variants
  .map((variant, variantIndex) => ({ variant, variantIndex }))
  .filter(({ variant }) => isModelPriceMissing(position, variant))
  .map(({ variantIndex }) => {
    const name = position.productName.trim() ? ` «${position.productName.trim()}»` : '';
    const suffix = position.variants.length > 1 ? `, вариант ${variantIndex + 1}` : '';
    return `позиция ${positionIndex + 1}${name}${suffix}`;
  }));

export const optionForVariant = (positionResult, variantIndex) => {
  if (!positionResult?.options?.length) return null;
  const selected = positionResult.options[positionResult.selectedOption];
  if (selected?.variantIndex === variantIndex) return selected;
  return positionResult.options.find((o) => o.variantIndex === variantIndex) || null;
};

export const displayResolved = (field, value) => {
  if (value == null) return '';
  if (field.percent) return formatNumber(value * 100, 1);
  return formatNumber(value, 2);
};

export const acceptValue = (field, value) => {
  if (value == null) return '';
  if (field.percent) return String(Math.round(value * 1000) / 10);
  return String(Math.round(value * 100) / 100);
};

export const formatNumber = (value, digits = 2) =>
  value == null || Number.isNaN(Number(value))
    ? '—'
    : Number(value).toLocaleString('ru-RU', { maximumFractionDigits: digits });

export const formatRub = (value, digits = 0) =>
  value == null
    ? '—'
    : `${Number(value).toLocaleString('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })} ₽`;

export const formatShare = (value) =>
  value == null ? '—' : `${(value * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;

export const formatDateTime = (value) => {
  if (!value) return '';
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
};

export const labelOf = (list, code) => list?.find((item) => item.code === code)?.label || code || '';

export const marginTone = (margin, summary) => {
  if (margin == null) return 'neutral';
  if (margin < (summary?.minProfitShare ?? 0.25)) return 'bad';
  if (margin < (summary?.targetProfitShare ?? 0.4)) return 'warn';
  return 'good';
};

export const RATE_GROUPS = [
  {
    title: 'моделирование',
    fields: [
      ['modelMarkup', 'Наценка на модель', '×'],
      ['modelMinContractorPrice', 'Минимальная цена художника', '₽'],
      ['modelReserveShare', 'Резерв к себестоимости модели', 'доля'],
      ['modelFixedIncome', 'Фиксированный доход с модели', '₽'],
      ['taxRate', 'Налог', 'доля'],
    ],
  },
  {
    title: 'SLA-печать мастер-модели',
    fields: [
      ['slaRubPerMl', 'Смола', '₽/мл'],
      ['slaRubPerHour', 'Час печати', '₽/ч'],
      ['slaFixedPerPrint', 'Подготовка, нарезка, мойка — за печать', '₽'],
      ['slaShellMm', 'Оболочка', 'мм'],
      ['slaInfillShare', 'Внутреннее заполнение', 'доля'],
      ['slaSupportsShare', 'Поддержки', 'доля'],
    ],
  },
  {
    title: 'FDM и оснастка',
    fields: [
      ['fdmProjectRubPerHour', 'Проектирование оснастки', '₽/ч'],
      ['fdmRubPerGram', 'Пластик', '₽/г'],
      ['fdmRubPerHour', 'Час печати', '₽/ч'],
      ['fdmFirstSlicingRub', 'Первая нарезка файла', '₽'],
    ],
  },
  {
    title: 'работы',
    fields: [
      ['processingRubPerHour', 'Обработка', '₽/ч'],
      ['cncRubPerHour', 'ЧПУ', '₽/ч'],
      ['prepDefaultRub', 'Подготовка по умолчанию', '₽'],
    ],
  },
  {
    title: 'форма',
    fields: [
      ['formRubPerGramPlatinum', 'Форма из платины', '₽/г'],
      ['formRubPerGramTin', 'Форма из олова', '₽/г'],
      ['shellRubPerGram', 'Рабочая оснастка', '₽/г'],
      ['shellPrintTimeShare', 'Время печати оснастки от комплекта', 'доля'],
      ['pourRubPerCast', 'Отливка', '₽'],
      ['cutMinutes', 'Разрез', 'мин'],
      ['cutRubPerHour', 'Час разреза', '₽/ч'],
      ['weightReserveDefault', 'Запас к весу', 'доля'],
      ['weightReserveThresholdG', 'Без запаса от', 'г'],
    ],
  },
  {
    title: 'промежуточная форма и комплекты',
    fields: [
      ['tinRubPerGram', 'Олово', '₽/г'],
      ['tinWorkRubPerForm', 'Работа литейщика за форму', '₽'],
      ['copyRubPerGram', 'Копия', '₽/г'],
      ['copyMinRub', 'Минимум за копию', '₽'],
      ['extraCopyPrepRub', 'Подготовка доп. копии', '₽'],
      ['maxKitsPaidByClient', 'Клиент оплачивает комплектов не больше', 'шт'],
    ],
  },
  {
    title: 'КП',
    fields: [
      ['kpRoundingStep', 'Округление статей', '₽'],
      ['offerValidityDays', 'Цены действительны', 'дней'],
    ],
  },
  {
    title: 'рентабельность',
    fields: [
      ['fullCostLaborRubPerHour', 'Час сотрудника по ФОТ', '₽/ч'],
      ['fullCostOverheadRubPerHour', 'Постоянные расходы на час', '₽/ч'],
      ['managerCommission', 'Комиссия менеджера', 'доля'],
      ['minProfitShare', 'Минимальная маржа', 'доля'],
      ['targetProfitShareTypical', 'Ориентир маржи', 'доля'],
      ['costResinRubPerMl', 'Смола', '₽/мл'],
      ['costPrintWashRub', 'Мойка за печать', '₽'],
      ['costPetgRubPerGram', 'PETG', '₽/г'],
      ['costPlatinumRubPerGram', 'Силикон платина', '₽/г'],
      ['costTinRubPerGram', 'Силикон олово', '₽/г'],
      ['costSiliconeWasteFactor', 'Расход силикона', '×'],
      ['costCopyRubPerGram', 'Пластик копии', '₽/г'],
      ['costHoursPrint', 'Часы на печать', 'ч'],
      ['costHoursPrep', 'Часы на подготовку', 'ч'],
      ['costHoursPerTinForm', 'Часы на промежуточную форму', 'ч'],
      ['costHoursPerKit', 'Часы на комплект', 'ч'],
      ['costHoursPerForm', 'Часы на форму', 'ч'],
    ],
  },
  {
    title: 'оценка по габаритам',
    collapsed: true,
    fields: [
      ['estimateAreaShare', 'Площадь изделия от площади габаритов', 'доля'],
      ['estimateVolumeShare', 'Объём изделия от объёма габаритов', 'доля'],
      ['estimateLargeSizeMm', 'Крупное изделие — от', 'мм'],
      ['estimateSiliconeDensity', 'Плотность силикона', 'г/см³'],
      ['estimatePetgDensity', 'Плотность PETG', 'г/см³'],
      ['estimateCopyDensity', 'Плотность пластика копии', 'г/см³'],
      ['estimateStockingWallMm', 'Стенка чулка', 'мм'],
      ['estimateStockingWallLargeMm', 'Стенка чулка у крупных', 'мм'],
      ['estimateConvexity', 'Поправка на выпуклость', '×'],
      ['estimateFlangeCm3', 'Фланец', 'см³'],
      ['estimateCutWallMm', 'Стенка чулка с разрезом', 'мм'],
      ['estimateCutRibMm', 'Ребро у разреза', 'мм'],
      ['estimateBrickOffsetMm', 'Отступ кирпича', 'мм'],
      ['estimateBrickOffsetLargeMm', 'Отступ кирпича у крупных', 'мм'],
      ['estimateCupWallMm', 'Стенка стакана', 'мм'],
      ['estimateReliefWallMm', 'Стенка рельефа', 'мм'],
      ['estimateReliefBaseFactor', 'Расширение рельефа к основанию', '×'],
      ['estimateMatrixWallMm', 'Дно и стенки матрицы-бруска', 'мм'],
      ['estimateClusterWallMm', 'Стенка кластера', 'мм'],
      ['estimateCompositeOffsetMm', 'Отступ составной формы', 'мм'],
      ['estimateCompositeLocksShare', 'Замки составной формы', 'доля'],
      ['estimateShellHeightMm', 'Кожух у чулка — выше', 'мм'],
      ['estimateShellWallMm', 'Стенка кожуха', 'мм'],
      ['estimateShellFactorStable', 'Кожух: устойчивое сечение', '×'],
      ['estimateShellFactorUnstable', 'Кожух: узкое или круглое сечение', '×'],
      ['estimateTinWallMm', 'Стенка оловянной формы', 'мм'],
      ['estimateTinConvexity', 'Поправка оловянной формы', '×'],
      ['estimateFdmGramsPerHour', 'Скорость FDM-печати', 'г/ч'],
      ['estimateSlaHoursPerMm', 'Печать SLA на 1 мм высоты', 'ч'],
      ['estimateFdmProjectHours', 'Проектирование по умолчанию', 'ч'],
      ['estimateProcessingHours', 'Обработка по умолчанию', 'ч'],
    ],
  },
];

export const RATE_STEPS = [
  { key: 'kitsByTirage', title: 'Производственные комплекты по тиражу', valueLabel: 'комплектов', hint: 'Только при промежуточной форме' },
  { key: 'minFormPriceByTirage', title: 'Минимальная цена формы по тиражу', valueLabel: '₽', hint: '0 — нет минимума' },
];

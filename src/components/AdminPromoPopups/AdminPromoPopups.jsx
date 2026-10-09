import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { authHeaders, formatDate, RefreshButton } from '../AdminInvoices/invoiceShared';
import { DEFAULT_SHOP_SLUG } from '../../context/CartContext';
import PromoPopup from '../PromoPopup/PromoPopup';
import PostPurchasePromo from '../PromoPopup/PostPurchasePromo';
import { discountLabel, daysLabel, frequencyLabel, minOrderLabel } from '../PromoPopup/promoPopupText';
import shared from '../AdminPromoCodes/AdminPromoCodes.module.css';
import styles from './AdminPromoPopups.module.css';

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const AMO_LEAD_URL = 'https://anyforms.amocrm.ru/leads/detail/';
const LEADS_LIMIT = 100;
const CONTACT = 'CONTACT';
const UNIQUE_CODE = 'UNIQUE_CODE';
const PUBLIC_CODE = 'PUBLIC_CODE';
const AFTER_PURCHASE = 'AFTER_PURCHASE';

const isoToMskInput = (iso) => {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t + MSK_OFFSET_MS).toISOString().slice(0, 16);
};

const mskInputToIso = (value) => (value ? new Date(`${value}:00+03:00`).toISOString() : null);

const rubToKopecks = (value) => {
  const trimmed = String(value).trim().replace(',', '.');
  if (!trimmed) return null;
  return Math.round(Number(trimmed) * 100);
};

const TEXT_DEFAULTS = {
  [CONTACT]: {
    name: 'Скидка 15% за телефон и почту',
    title: 'скидка {discount} по промокоду',
    description: 'Оставьте телефон и почту — пришлём персональный промокод. Он действует {days}.',
    buttonText: 'Получить скидку',
    successTitle: 'ваш промокод готов',
    successText: 'Скидка закреплена за вашим телефоном и почтой.',
    hideForKnownContacts: true,
    maxShows: '3',
  },
  [UNIQUE_CODE]: {
    name: 'Одноразовый код',
    title: 'ваш промокод на скидку {discount}',
    description: 'Мы сгенерировали его специально для вас — он действует {days}.',
    buttonText: 'Продолжить покупки',
    hideForKnownContacts: true,
    maxShows: '3',
  },
  [PUBLIC_CODE]: {
    name: 'Промокод для всех',
    title: 'скидка {discount} по промокоду',
    description: 'Нажмите на код — он скопируется. Введите его в поле «Промокод» при оформлении заказа.',
    buttonText: 'Скопировать промокод',
    hideForKnownContacts: false,
    maxShows: '3',
  },
  [AFTER_PURCHASE]: {
    name: 'Промокод на следующий заказ',
    title: 'спасибо за заказ! вот {discount} на следующий',
    description: 'Промокод действует {days} — вернитесь за новой фигуркой, пока он не сгорел.',
    buttonText: 'Скопировать промокод',
    hideForKnownContacts: false,
    maxShows: '',
  },
};

const emptyForm = {
  popupType: UNIQUE_CODE,
  successTitle: '',
  successText: '',
  ...TEXT_DEFAULTS[UNIQUE_CODE],
  active: false,
  priority: '0',
  shopSlug: DEFAULT_SHOP_SLUG,
  delaySeconds: '15',
  repeatAfterHours: '24',
  maxShows: '3',
  validFrom: '',
  validUntil: '',
  promoCodeId: '',
  discountPercent: '15',
  discountAmountRub: '',
  minOrderRub: '',
  codePrefix: 'SHOP',
  codeTtlDays: '14',
  firstOrderOnly: false,
  amoResponsibleUserId: '',
  amoTaskTypeId: '',
  amoTaskDeadlineMinutes: '60',
};

const formFromPopup = (p) => ({
  popupType: p.popupType || UNIQUE_CODE,
  name: p.name || '',
  active: Boolean(p.active),
  priority: String(p.priority ?? 0),
  shopSlug: p.shopSlug || DEFAULT_SHOP_SLUG,
  title: p.title || '',
  description: p.description || '',
  buttonText: p.buttonText || '',
  successTitle: p.successTitle ?? '',
  successText: p.successText ?? '',
  delaySeconds: String(p.delaySeconds ?? 15),
  repeatAfterHours: String(p.repeatAfterHours ?? 24),
  maxShows: p.maxShows != null ? String(p.maxShows) : '',
  validFrom: isoToMskInput(p.validFrom),
  validUntil: isoToMskInput(p.validUntil),
  hideForKnownContacts: p.hideForKnownContacts ?? p.popupType !== PUBLIC_CODE,
  promoCodeId: p.promoCodeId || '',
  discountPercent: p.discountPercent != null ? String(p.discountPercent) : emptyForm.discountPercent,
  discountAmountRub: p.discountAmountKopecks != null ? String(p.discountAmountKopecks / 100) : '',
  minOrderRub: p.minOrderKopecks != null ? String(p.minOrderKopecks / 100) : '',
  codePrefix: p.codePrefix || emptyForm.codePrefix,
  codeTtlDays: p.codeTtlDays != null ? String(p.codeTtlDays) : emptyForm.codeTtlDays,
  firstOrderOnly: Boolean(p.firstOrderOnly),
  amoResponsibleUserId: p.amoResponsibleUserId != null ? String(p.amoResponsibleUserId) : '',
  amoTaskTypeId: p.amoTaskTypeId != null ? String(p.amoTaskTypeId) : '',
  amoTaskDeadlineMinutes: String(p.amoTaskDeadlineMinutes ?? 60),
});

const promoState = (promo) => {
  const now = Date.now();
  if (!promo) return { label: 'не выбран', className: shared.statusOff, valid: false };
  if (!promo.active) return { label: 'выключен', className: shared.statusOff, valid: false };
  if (promo.validUntil && Date.parse(promo.validUntil) <= now) {
    return { label: 'истёк', className: shared.statusOff, valid: false };
  }
  if (promo.validFrom && Date.parse(promo.validFrom) > now) {
    return { label: 'ждёт старта', className: shared.statusWait, valid: false };
  }
  return { label: 'действует', className: shared.statusOn, valid: true };
};

const popupStatus = (p) => {
  const now = Date.now();
  if (!p.active) return { label: 'выключен', className: shared.statusOff };
  if (p.validUntil && Date.parse(p.validUntil) <= now) return { label: 'завершён', className: shared.statusOff };
  if (p.validFrom && Date.parse(p.validFrom) > now) return { label: 'запланирован', className: shared.statusWait };
  if (p.popupType === PUBLIC_CODE) {
    const code = promoState(p.promo);
    if (code.label === 'ждёт старта') return { label: 'ждёт старта кода', className: shared.statusWait };
    if (!code.valid) return { label: 'код не действует', className: shared.statusOff };
  }
  return { label: 'работает', className: shared.statusOn };
};

const periodLabel = (from, until) => {
  const parts = [from ? `с ${formatDate(from)}` : '', until ? `до ${formatDate(until)}` : ''].filter(Boolean);
  return parts.length ? `${parts.join(' ')} МСК` : '';
};

const promoTerms = (promo) =>
  [
    `скидка ${discountLabel(promo) || '—'}`,
    promo?.firstOrderOnly ? 'на первый заказ' : null,
    promo?.minOrderKopecks ? `от ${minOrderLabel(promo.minOrderKopecks)}` : null,
  ]
    .filter(Boolean)
    .join(' ');

const PREVIEW_DEVICES = [
  { key: 'phone', label: 'Телефон' },
  { key: 'desktop', label: 'Компьютер' },
];

const PREVIEW_STATES = [
  { key: 'form', label: 'Форма' },
  { key: 'success', label: 'Код получен' },
  { key: 'error', label: 'Ошибка' },
];

const POPUP_TYPES = [
  { key: UNIQUE_CODE, label: 'Одноразовый код' },
  { key: AFTER_PURCHASE, label: 'После покупки' },
  { key: CONTACT, label: 'Код за контакт' },
  { key: PUBLIC_CODE, label: 'Общий промокод' },
];

const TYPE_HINTS = {
  [CONTACT]: 'Посетитель оставляет телефон и почту и получает персональный одноразовый код; в amoCRM создаётся сделка.',
  [UNIQUE_CODE]: 'Попап сразу показывает посетителю готовый персональный код — без кнопок и форм. Код генерируется один раз на устройство, использовать его можно один раз.',
  [PUBLIC_CODE]: 'Всем показываем общий промокод из вкладки «Промокоды» — пока он действует.',
  [AFTER_PURCHASE]: 'Не попап, а блок на странице успешной оплаты: покупатель сразу получает одноразовый код на следующий заказ. Код привязан к телефону и почте из заказа, один код на каждый оплаченный заказ.',
};

const PREVIEW_AFTER_PURCHASE_CODE = 'NEXT-7KX2M';

const DESKTOP_WIDTH = 1024;
const DESKTOP_HEIGHT = 640;

const useElementWidth = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
};

const Segmented = ({ options, value, onChange, label, disabled = false }) => (
  <div className={styles.segmented} role="group" aria-label={label}>
    {options.map((o) => (
      <button
        key={o.key}
        type="button"
        className={`${styles.segment} ${value === o.key ? styles.segmentActive : ''}`}
        onClick={() => onChange(o.key)}
        aria-pressed={value === o.key}
        disabled={disabled && value !== o.key}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const SuccessPreviewScreen = ({ popup, previewKey }) => (
  <div className={styles.fakeSuccess}>
    <div className={styles.fakeHeader} aria-hidden="true" />
    <div className={styles.fakeCheck} aria-hidden="true">✓</div>
    <div className={styles.fakeTitle} aria-hidden="true">заказ #A1B2C3 оформлен</div>
    <div className={styles.fakeLine} aria-hidden="true" />
    <div className={`${styles.fakeLine} ${styles.fakeLineShort}`} aria-hidden="true" />
    <PostPurchasePromo key={previewKey} promo={popup} />
    <div className={styles.fakeButton} aria-hidden="true">вернуться в магазин →</div>
  </div>
);

const PreviewScreen = ({ popup, previewState, previewKey, onClose }) =>
  popup.popupType === AFTER_PURCHASE ? (
    <SuccessPreviewScreen popup={popup} previewKey={previewKey} />
  ) : (
  <>
    <div className={styles.fakeSite} aria-hidden="true">
      <div className={styles.fakeHeader} />
      <div className={styles.fakeGrid}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={styles.fakeCard} />
        ))}
      </div>
    </div>
    <PromoPopup key={previewKey} popup={popup} mode="preview" previewState={previewState} onClose={onClose} />
  </>
  );

const AdminPromoPopups = () => {
  const [popups, setPopups] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [options, setOptions] = useState({ responsibleUsers: [], taskTypes: [], consentVersion: '' });
  const [leads, setLeads] = useState([]);
  const [leadsFilter, setLeadsFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [device, setDevice] = useState('phone');
  const [previewState, setPreviewState] = useState('form');
  const [previewKey, setPreviewKey] = useState(0);
  const [previewBoxRef, previewBoxWidth] = useElementWidth();
  const desktopScale = previewBoxWidth ? Math.min(1, previewBoxWidth / DESKTOP_WIDTH) : 0.4;
  const isContact = form.popupType === CONTACT;
  const isPublic = form.popupType === PUBLIC_CODE;
  const isAfterPurchase = form.popupType === AFTER_PURCHASE;
  const issuesCodes = !isPublic;
  const editingPopup = popups.find((p) => p.id === editingId) || null;
  const editingLocked = Boolean(editingPopup?.leadsCount);

  const loadPromoCodes = useCallback(async () => {
    try {
      const res = await apiClient.instance.get('/api/promo-code', { headers: authHeaders() });
      setPromoCodes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Не удалось загрузить промокоды');
    }
  }, []);

  const loadPopups = useCallback(async () => {
    try {
      const [listRes, optionsRes] = await Promise.all([
        apiClient.instance.get('/api/promo-popup', { headers: authHeaders() }),
        apiClient.instance.get('/api/promo-popup/options', { headers: authHeaders() }),
      ]);
      setPopups(Array.isArray(listRes.data) ? listRes.data : []);
      setOptions(optionsRes.data || { responsibleUsers: [], taskTypes: [], consentVersion: '' });
      setPageError('');
    } catch (err) {
      setPageError(err?.response?.data?.message || err?.message || 'Не удалось загрузить попапы');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const res = await apiClient.instance.get('/api/promo-popup/leads', {
        headers: authHeaders(),
        params: { popupId: leadsFilter || undefined, limit: LEADS_LIMIT },
      });
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Не удалось загрузить заявки');
    }
  }, [leadsFilter]);

  useEffect(() => {
    loadPopups();
    loadPromoCodes();
  }, [loadPopups, loadPromoCodes]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const defaultAmo = useCallback(
    () => ({
      amoResponsibleUserId: String(options.responsibleUsers[0]?.id ?? ''),
      amoTaskTypeId: String(
        options.taskTypes.find((t) => t.name === 'Связаться')?.id ?? options.taskTypes[0]?.id ?? '',
      ),
    }),
    [options],
  );

  useEffect(() => {
    const amo = defaultAmo();
    setForm((prev) => ({
      ...prev,
      amoResponsibleUserId: prev.amoResponsibleUserId || amo.amoResponsibleUserId,
      amoTaskTypeId: prev.amoTaskTypeId || amo.amoTaskTypeId,
    }));
  }, [defaultAmo]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadPopups(), loadLeads(), loadPromoCodes()]);
    } finally {
      setRefreshing(false);
    }
  };

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const setTextField = (step) => (e) => {
    setField(e);
    setPreviewState(step);
  };

  const switchType = (nextType) => {
    setForm((prev) => {
      if (prev.popupType === nextType) return prev;
      const from = TEXT_DEFAULTS[prev.popupType];
      const to = TEXT_DEFAULTS[nextType];
      const next = { ...prev, popupType: nextType };
      Object.keys(to).forEach((key) => {
        if (!prev[key] || prev[key] === from[key]) next[key] = to[key];
      });
      return next;
    });
    setPreviewState('form');
    setError('');
  };

  const resetForm = () => {
    setForm({ ...emptyForm, ...defaultAmo() });
    setEditingId(null);
    setError('');
    setPreviewState('form');
  };

  const startEdit = (p) => {
    const next = formFromPopup(p);
    const amo = defaultAmo();
    setEditingId(p.id);
    setForm({
      ...next,
      amoResponsibleUserId: next.amoResponsibleUserId || amo.amoResponsibleUserId,
      amoTaskTypeId: next.amoTaskTypeId || amo.amoTaskTypeId,
    });
    setError('');
    setPreviewState('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const promoOptions = useMemo(() => {
    const list = [...promoCodes];
    if (editingPopup?.promoCodeId && editingPopup.promo && !list.some((c) => c.id === editingPopup.promoCodeId)) {
      list.push({ id: editingPopup.promoCodeId, ...editingPopup.promo });
    }
    return list;
  }, [promoCodes, editingPopup]);

  const selectedPromo = promoOptions.find((c) => c.id === form.promoCodeId) || null;
  const selectedPromoState = promoState(selectedPromo);

  const previewPopup = useMemo(() => {
    const base = {
      id: editingId || 'preview',
      popupType: form.popupType,
      title: form.title,
      description: form.description,
      buttonText: form.buttonText || TEXT_DEFAULTS[form.popupType].buttonText,
      consentVersion: options.consentVersion,
    };
    if (isPublic) {
      return {
        ...base,
        code: selectedPromo?.code || 'PROMO',
        discountPercent: selectedPromo?.discountPercent ?? 0,
        discountAmountKopecks: selectedPromo?.discountAmountKopecks ?? null,
        minOrderKopecks: selectedPromo?.minOrderKopecks ?? null,
        firstOrderOnly: Boolean(selectedPromo?.firstOrderOnly),
        codeValidUntil: selectedPromo?.validUntil ?? null,
      };
    }
    const ttlDays = Number(form.codeTtlDays) || null;
    return {
      ...base,
      successTitle: form.successTitle,
      successText: form.successText,
      discountPercent: Number(form.discountPercent) || 0,
      discountAmountKopecks: rubToKopecks(form.discountAmountRub) || null,
      minOrderKopecks: rubToKopecks(form.minOrderRub) || null,
      codeTtlDays: ttlDays,
      firstOrderOnly: isAfterPurchase ? false : form.firstOrderOnly,
      code: isAfterPurchase ? PREVIEW_AFTER_PURCHASE_CODE : undefined,
      validUntil: isAfterPurchase ? new Date(Date.now() + (ttlDays || 14) * 86400000).toISOString() : undefined,
    };
  }, [form, editingId, isPublic, isAfterPurchase, selectedPromo, options.consentVersion]);

  const validateGeneratedCode = () => {
    const percent = form.discountPercent === '' ? 0 : Number(form.discountPercent);
    const amountKopecks = rubToKopecks(form.discountAmountRub);
    const minOrderKopecks = rubToKopecks(form.minOrderRub);
    const codeTtlDays = Number(form.codeTtlDays);
    const deadline = Number(form.amoTaskDeadlineMinutes);
    if (isContact && !form.successTitle.trim()) return { error: 'Заполните заголовок экрана с кодом.' };
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      return { error: 'Процент — целое число от 0 до 100.' };
    }
    if (amountKopecks != null && (!Number.isFinite(amountKopecks) || amountKopecks <= 0)) {
      return { error: 'Фиксированная скидка — сумма в рублях больше нуля.' };
    }
    if (minOrderKopecks != null && (!Number.isFinite(minOrderKopecks) || minOrderKopecks <= 0)) {
      return { error: 'Минимальная сумма заказа — сумма в рублях больше нуля.' };
    }
    if (percent === 0 && amountKopecks == null) return { error: 'Скидка пустая: укажите процент или сумму.' };
    if (!Number.isInteger(codeTtlDays) || codeTtlDays < 1 || codeTtlDays > 365) {
      return { error: 'Срок действия кода — целое число дней от 1 до 365.' };
    }
    if (!/^[A-Za-z0-9]{2,10}$/.test(form.codePrefix.trim())) {
      return { error: 'Префикс кода — 2–10 латинских букв или цифр.' };
    }
    if (isContact && (!form.amoResponsibleUserId || !form.amoTaskTypeId)) {
      return { error: 'Выберите ответственного и тип задачи в amoCRM.' };
    }
    if (isContact && (!Number.isInteger(deadline) || deadline < 1)) return { error: 'Срок задачи — целое число минут.' };
    const contactOnly = isContact
      ? {
          successTitle: form.successTitle.trim(),
          successText: form.successText.trim() || null,
          amoResponsibleUserId: Number(form.amoResponsibleUserId),
          amoTaskTypeId: Number(form.amoTaskTypeId),
          amoTaskDeadlineMinutes: deadline,
        }
      : {};
    return {
      fields: {
        discountPercent: percent,
        discountAmountKopecks: amountKopecks,
        minOrderKopecks,
        codePrefix: form.codePrefix.trim().toUpperCase(),
        codeTtlDays,
        firstOrderOnly: isAfterPurchase ? false : form.firstOrderOnly,
        ...contactOnly,
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const delaySeconds = isAfterPurchase ? 0 : Number(form.delaySeconds);
    const repeatAfterHours = isAfterPurchase ? 0 : Number(form.repeatAfterHours);
    const maxShows = form.maxShows.trim() === '' ? null : Number(form.maxShows);

    if (!form.name.trim()) return setError('Укажите название попапа.');
    if (!form.title.trim() || !form.buttonText.trim()) return setError('Заполните заголовок и текст кнопки.');
    if (!Number.isInteger(delaySeconds) || delaySeconds < 0 || delaySeconds > 3600) {
      return setError('Задержка — целое число секунд от 0 до 3600.');
    }
    if (!Number.isInteger(repeatAfterHours) || repeatAfterHours < 0 || repeatAfterHours > 8760) {
      return setError('Повтор показа — целое число часов от 0 до 8760.');
    }
    if (maxShows != null && (!Number.isInteger(maxShows) || maxShows < 1 || maxShows > 1000)) {
      return setError('Число показов — целое от 1 до 1000 или пусто, если без ограничений.');
    }
    if (form.validFrom && form.validUntil && form.validFrom >= form.validUntil) {
      return setError('Начало показа должно быть раньше окончания.');
    }

    let typeFields;
    if (issuesCodes) {
      const generated = validateGeneratedCode();
      if (generated.error) return setError(generated.error);
      typeFields = generated.fields;
    } else {
      if (!form.promoCodeId) return setError('Выберите промокод, который покажет попап.');
      typeFields = { promoCodeId: form.promoCodeId };
    }

    const payload = {
      popupType: form.popupType,
      name: form.name.trim(),
      active: form.active,
      priority: Number(form.priority) || 0,
      shopSlug: form.shopSlug,
      title: form.title.trim(),
      description: form.description.trim() || null,
      buttonText: form.buttonText.trim(),
      delaySeconds,
      repeatAfterHours,
      maxShows,
      validFrom: mskInputToIso(form.validFrom),
      validUntil: mskInputToIso(form.validUntil),
      hideForKnownContacts: isAfterPurchase ? false : form.hideForKnownContacts,
      ...typeFields,
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiClient.instance.put(`/api/promo-popup/${editingId}`, payload, { headers: authHeaders() });
        toast.success(`Попап «${payload.name}» обновлён`);
      } else {
        await apiClient.instance.post('/api/promo-popup', payload, { headers: authHeaders() });
        toast.success(`Попап «${payload.name}» создан`);
      }
      resetForm();
      await loadPopups();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Не удалось сохранить попап');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Удалить попап «${p.name}»?`)) return;
    try {
      await apiClient.instance.delete(`/api/promo-popup/${p.id}`, { headers: authHeaders() });
      toast.success(`Попап «${p.name}» удалён`);
      if (editingId === p.id) resetForm();
      await loadPopups();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Не удалось удалить попап');
    }
  };

  const popupNames = useMemo(() => Object.fromEntries(popups.map((p) => [p.id, p.name])), [popups]);
  const codePopups = popups.filter((p) => p.popupType !== PUBLIC_CODE);
  const liveCount = popups.filter((p) => popupStatus(p).label === 'работает').length;

  const popupMeta = (p) => {
    if (p.popupType === AFTER_PURCHASE) {
      return [
        'после покупки',
        promoTerms(p),
        `код на ${daysLabel(p.codeTtlDays)}`,
        p.maxShows != null ? `не больше ${p.maxShows} кодов одному клиенту` : null,
        periodLabel(p.validFrom, p.validUntil),
      ]
        .filter(Boolean)
        .join(' · ');
    }
    const showing = [`через ${p.delaySeconds} с`, frequencyLabel(p), periodLabel(p.validFrom, p.validUntil)]
      .filter(Boolean)
      .join(' · ');
    if (p.popupType === PUBLIC_CODE) {
      const promoPeriod = p.promo ? periodLabel(p.promo.validFrom, p.promo.validUntil) : '';
      return [
        `промокод ${p.promo?.code ?? '—'}`,
        p.promo ? promoTerms(p.promo) : null,
        promoPeriod ? `код ${promoPeriod}` : null,
        showing,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    return [
      p.popupType === UNIQUE_CODE ? 'одноразовый код' : 'код за контакт',
      promoTerms(p),
      `код на ${daysLabel(p.codeTtlDays)}`,
      showing,
    ].join(' · ');
  };

  const popupStats = (p) =>
    [
      p.popupType === AFTER_PURCHASE ? null : `показов: ${p.viewsCount ?? 0} (устройств: ${p.viewDevicesCount ?? 0})`,
      p.popupType !== PUBLIC_CODE ? `выдано кодов: ${p.leadsCount ?? 0}` : null,
      `оплат с кодом: ${p.usedCount ?? 0}`,
      p.hideForKnownContacts ? 'не показываем тем, кто вводил телефон' : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <div className={`${shared.wrap} ${styles.wrap}`}>
      <h1 className={shared.title}>Попапы</h1>

      <div className={styles.editor}>
        <form className={`${shared.form} ${styles.formCol}`} onSubmit={handleSubmit}>
          <h2 className={shared.formTitle}>
            {editingId ? `Редактирование: ${form.name || '…'}` : 'Новый попап'}
          </h2>

          <div className={styles.typeRow}>
            <Segmented
              options={POPUP_TYPES}
              value={form.popupType}
              onChange={switchType}
              label="Тип попапа"
              disabled={editingLocked}
            />
            <p className={shared.hint}>
              {TYPE_HINTS[form.popupType]}
              {editingLocked ? ' Тип не меняется: по попапу уже выданы коды.' : ''}
            </p>
          </div>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Основное</legend>
            <div className={styles.grid}>
              <label className={`${shared.label} ${styles.wide}`}>
                Название (видно только в админке) *
                <input name="name" value={form.name} onChange={setField} className={shared.input} required />
              </label>
              <label className={shared.label}>
                Магазин
                <select name="shopSlug" value={form.shopSlug} onChange={setField} className={shared.input}>
                  <option value={DEFAULT_SHOP_SLUG}>anyforms (/shop)</option>
                </select>
              </label>
              <label className={shared.label}>
                Приоритет
                <input type="number" name="priority" value={form.priority} onChange={setField} className={shared.input} step="1" />
                <span className={shared.hint}>Если работают несколько — показываем с большим.</span>
              </label>
            </div>
            <label className={shared.checkRow}>
              <input type="checkbox" name="active" checked={form.active} onChange={setField} />
              Включён
            </label>
          </fieldset>

          {isPublic && (
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Промокод</legend>
              <div className={styles.grid}>
                <label className={`${shared.label} ${styles.wide}`}>
                  Какой код показать *
                  <select name="promoCodeId" value={form.promoCodeId} onChange={setField} className={shared.input}>
                    <option value="">— выберите промокод —</option>
                    {promoOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {promoTerms(c)}
                        {c.validUntil ? `, до ${formatDate(c.validUntil)}` : ', бессрочно'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {selectedPromo && (
                <p className={styles.promoInfo}>
                  <span className={`${shared.status} ${selectedPromoState.className}`}>{selectedPromoState.label}</span>
                  {periodLabel(selectedPromo.validFrom, selectedPromo.validUntil) || 'бессрочно'}
                </p>
              )}
              <p className={shared.hint}>
                Срок, скидку и «только первый заказ» меняйте во вкладке «Промокоды». Попап показывается, только пока
                код действует, — после окончания срока он пропадёт сам.
              </p>
              <div className={styles.inlineActions}>
                <a href="/admin/promo-codes" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                  Создать промокод ↗
                </a>
                <button type="button" className={styles.inlineButton} onClick={loadPromoCodes}>
                  Обновить список
                </button>
              </div>
            </fieldset>
          )}

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Тексты</legend>
            <p className={shared.hint}>
              {issuesCodes
                ? 'Подстановки: {discount} — размер скидки, {days} — срок кода, {minOrder} — минимальная сумма.'
                : 'Подстановки: {discount} — размер скидки, {code} — промокод, {until} — последний день действия, {minOrder} — минимальная сумма.'}
            </p>
            <div className={styles.grid}>
              <label className={`${shared.label} ${styles.wide}`}>
                Заголовок *
                <input name="title" value={form.title} onChange={setTextField('form')} className={shared.input} />
              </label>
              <label className={`${shared.label} ${styles.wide}`}>
                Описание
                <textarea name="description" value={form.description} onChange={setTextField('form')} className={`${shared.input} ${styles.textarea}`} rows={3} />
              </label>
              <label className={shared.label}>
                Текст кнопки *
                <input name="buttonText" value={form.buttonText} onChange={setTextField('form')} className={shared.input} />
              </label>
              {isContact && (
                <>
                  <label className={shared.label}>
                    Заголовок экрана с кодом *
                    <input name="successTitle" value={form.successTitle} onChange={setTextField('success')} className={shared.input} />
                  </label>
                  <label className={`${shared.label} ${styles.wide}`}>
                    Текст экрана с кодом
                    <textarea name="successText" value={form.successText} onChange={setTextField('success')} className={`${shared.input} ${styles.textarea}`} rows={2} />
                  </label>
                </>
              )}
            </div>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Когда и сколько раз показывать</legend>
            {isAfterPurchase && (
              <p className={shared.hint}>
                Блок появляется на странице успешной оплаты сразу после подтверждения платежа — задержки и частота
                показов здесь не нужны. Можно ограничить, сколько кодов получит один покупатель.
              </p>
            )}
            <div className={styles.grid}>
              {!isAfterPurchase && (
              <>
              <label className={shared.label}>
                Через сколько секунд
                <input type="number" name="delaySeconds" value={form.delaySeconds} onChange={setField} className={shared.input} min="0" max="3600" step="1" />
                <span className={shared.hint}>Время на витрине за визит, переходы между страницами не сбрасывают.</span>
              </label>
              <label className={shared.label}>
                Показывать снова через, часов
                <input type="number" name="repeatAfterHours" value={form.repeatAfterHours} onChange={setField} className={shared.input} min="0" max="8760" step="1" />
                <span className={shared.hint}>0 — в каждый визит, 24 — раз в сутки. За один визит — не больше одного раза.</span>
              </label>
              </>
              )}
              <label className={shared.label}>
                {isAfterPurchase ? 'Максимум кодов одному покупателю' : 'Максимум показов одному посетителю'}
                <input type="number" name="maxShows" value={form.maxShows} onChange={setField} className={shared.input} min="1" max="1000" step="1" placeholder="Без ограничений" />
                <span className={shared.hint}>
                  {{
                    [CONTACT]: 'Тем, кто уже получил код, больше не показываем.',
                    [UNIQUE_CODE]: 'Каждый раз показываем тот же код, пока им не воспользовались.',
                    [PUBLIC_CODE]: 'Тем, кто уже скопировал код, больше не показываем.',
                    [AFTER_PURCHASE]: 'Покупателя узнаём по почте, телефону или устройству из заказа. Когда лимит исчерпан, после оплаты код больше не показываем.',
                  }[form.popupType]}
                </span>
              </label>
              <label className={shared.label}>
                Показывать с (МСК)
                <input type="datetime-local" name="validFrom" value={form.validFrom} onChange={setField} className={shared.input} />
              </label>
              <label className={shared.label}>
                Показывать до (МСК)
                <input type="datetime-local" name="validUntil" value={form.validUntil} onChange={setField} className={shared.input} />
                <span className={shared.hint}>
                  {issuesCodes ? 'Пусто в обоих полях — работает всегда.' : 'Пусто — пока действует промокод.'}
                </span>
              </label>
            </div>
            {!isAfterPurchase && (
              <>
                <label className={shared.checkRow}>
                  <input type="checkbox" name="hideForKnownContacts" checked={form.hideForKnownContacts} onChange={setField} />
                  Не показывать тем, кто уже вводил телефон или почту на сайте
                </label>
                <p className={shared.hint}>
                  Телефон и почту, сохранённые в браузере после оформления заказа или попапа, проверяем на сервере: клиентам
                  с заказами скидка «на первый заказ» не показывается в любом случае.
                </p>
              </>
            )}
          </fieldset>

          {issuesCodes && (
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Персональный код</legend>
              <div className={styles.grid}>
                <label className={shared.label}>
                  Скидка, %
                  <input type="number" name="discountPercent" value={form.discountPercent} onChange={setField} className={shared.input} min="0" max="100" step="1" />
                </label>
                <label className={shared.label}>
                  Скидка, ₽ (сверх процента)
                  <input type="number" name="discountAmountRub" value={form.discountAmountRub} onChange={setField} className={shared.input} placeholder="Не задана" min="0.01" step="any" />
                </label>
                <label className={shared.label}>
                  Мин. сумма заказа, ₽
                  <input type="number" name="minOrderRub" value={form.minOrderRub} onChange={setField} className={shared.input} placeholder="Без порога" min="0.01" step="any" />
                </label>
                <label className={shared.label}>
                  Код действует, дней *
                  <input type="number" name="codeTtlDays" value={form.codeTtlDays} onChange={setField} className={shared.input} min="1" max="365" step="1" />
                </label>
                <label className={shared.label}>
                  Префикс кода *
                  <input name="codePrefix" value={form.codePrefix} onChange={setField} className={shared.input} placeholder="SHOP" autoComplete="off" />
                  <span className={shared.hint}>Код будет вида {(form.codePrefix || 'SHOP').toUpperCase()}-7KX2M.</span>
                </label>
              </div>
              {!isAfterPurchase && (
                <label className={shared.checkRow}>
                  <input type="checkbox" name="firstOrderOnly" checked={form.firstOrderOnly} onChange={setField} />
                  Только на первый заказ
                </label>
              )}
              <p className={shared.hint}>
                {isAfterPurchase
                  ? 'Код одноразовый, выдаётся по каждому оплаченному заказу и работает только с телефоном или почтой из этого заказа — скидка «на первый заказ» здесь не применяется. Уже выданные коды при изменении попапа не меняются.'
                  : `${isContact
                    ? 'Код одноразовый, работает только в выбранном магазине и только с теми телефоном или почтой, на которые выдан.'
                    : 'Код генерируется один раз на устройство и применяется только к одному заказу в выбранном магазине.'} Скидка по акции — одна на клиента (проверяем телефон, почту и устройство). Уже выданные коды при изменении попапа не меняются.`}
              </p>
            </fieldset>
          )}

          {isContact && (
            <fieldset className={styles.group}>
              <legend className={styles.legend}>amoCRM</legend>
              <p className={shared.hint}>Сделка создаётся в воронке «Розница», этап «Активизировался», с телефоном и почтой клиента.</p>
              <div className={styles.grid}>
                <label className={shared.label}>
                  Ответственный *
                  <select name="amoResponsibleUserId" value={form.amoResponsibleUserId} onChange={setField} className={shared.input}>
                    {options.responsibleUsers.map((u) => (
                      <option key={u.id} value={String(u.id)}>{u.name}</option>
                    ))}
                  </select>
                </label>
                <label className={shared.label}>
                  Тип задачи *
                  <select name="amoTaskTypeId" value={form.amoTaskTypeId} onChange={setField} className={shared.input}>
                    {options.taskTypes.map((t) => (
                      <option key={t.id} value={String(t.id)}>{t.name}</option>
                    ))}
                  </select>
                </label>
                <label className={shared.label}>
                  Срок задачи, минут *
                  <input type="number" name="amoTaskDeadlineMinutes" value={form.amoTaskDeadlineMinutes} onChange={setField} className={shared.input} min="1" step="1" />
                </label>
              </div>
            </fieldset>
          )}

          {error && <p className={shared.error}>{error}</p>}
          <div className={shared.formActions}>
            <button type="submit" className={shared.submit} disabled={saving}>
              {saving ? 'Сохранение…' : editingId ? 'Сохранить' : 'Создать попап'}
            </button>
            {editingId && (
              <button type="button" className={shared.cancelBtn} onClick={resetForm}>
                Отмена
              </button>
            )}
          </div>
        </form>

        <aside className={styles.previewCol}>
          <div className={styles.previewSticky}>
            <div className={styles.previewToolbar}>
              <Segmented options={PREVIEW_DEVICES} value={device} onChange={setDevice} label="Устройство" />
              {isContact && (
                <Segmented options={PREVIEW_STATES} value={previewState} onChange={setPreviewState} label="Экран попапа" />
              )}
            </div>
            <div ref={previewBoxRef} className={styles.previewBox}>
              {device === 'phone' ? (
                <div className={`${styles.device} ${styles.devicePhone}`}>
                  <PreviewScreen popup={previewPopup} previewState={previewState} previewKey={previewKey} onClose={() => setPreviewKey((k) => k + 1)} />
                </div>
              ) : (
                <div className={styles.desktopSlot} style={{ height: DESKTOP_HEIGHT * desktopScale }}>
                  <div
                    className={`${styles.device} ${styles.deviceDesktop}`}
                    style={{ width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, transform: `scale(${desktopScale})` }}
                  >
                    <PreviewScreen popup={previewPopup} previewState={previewState} previewKey={previewKey} onClose={() => setPreviewKey((k) => k + 1)} />
                  </div>
                </div>
              )}
            </div>
            <p className={shared.hint}>
              {isAfterPurchase ? 'Так блок выглядит на странице после оплаты.' : 'Это тот же компонент, что на сайте.'}{' '}
              {issuesCodes
                ? `Скидка ${discountLabel(previewPopup) || '—'}${previewPopup.codeTtlDays ? `, код на ${daysLabel(previewPopup.codeTtlDays)}` : ''}.`
                : selectedPromo
                  ? `Код ${selectedPromo.code}: ${promoTerms(selectedPromo)}.`
                  : 'Выберите промокод — превью покажет его.'}
            </p>
          </div>
        </aside>
      </div>

      <section className={shared.section}>
        <div className={shared.sectionHead}>
          <h2 className={shared.sectionTitle}>
            Попапы {liveCount > 0 ? `· работает ${liveCount}` : ''}
          </h2>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить попапы" />
        </div>
        {pageError && <p className={shared.banner}>{pageError}</p>}
        {loading ? (
          <p className={shared.message}>Загрузка попапов…</p>
        ) : popups.length === 0 ? (
          <p className={shared.message}>Попапов пока нет — создайте первый в форме выше.</p>
        ) : (
          <ul className={shared.list}>
            {popups.map((p) => {
              const status = popupStatus(p);
              return (
                <li key={p.id} className={shared.item}>
                  <div className={shared.itemMain}>
                    <div className={shared.itemHead}>
                      <span className={shared.code}>{p.name}</span>
                      <span className={`${shared.status} ${status.className}`}>{status.label}</span>
                    </div>
                    <p className={shared.meta}>{popupMeta(p)}</p>
                    <p className={shared.meta}>{popupStats(p)}</p>
                  </div>
                  <div className={shared.actions}>
                    <button type="button" className={shared.editBtn} onClick={() => startEdit(p)}>
                      Изменить
                    </button>
                    {!p.leadsCount && (
                      <button type="button" className={shared.deleteBtn} onClick={() => handleDelete(p)}>
                        Удалить
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={`${shared.section} ${styles.leadsSection}`}>
        <div className={shared.sectionHead}>
          <h2 className={shared.sectionTitle}>Выданные коды</h2>
          <select
            className={`${shared.input} ${styles.filter}`}
            value={leadsFilter}
            onChange={(e) => setLeadsFilter(e.target.value)}
            aria-label="Фильтр по попапу"
          >
            <option value="">Все попапы</option>
            {codePopups.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        {leads.length === 0 ? (
          <p className={shared.message}>Кодов пока не выдавали.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Когда</th>
                  <th>Код</th>
                  <th>Телефон</th>
                  <th>Почта</th>
                  <th>Устройство</th>
                  <th>Попап</th>
                  <th>UTM</th>
                  <th>amoCRM</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDate(l.createdAt)}</td>
                    <td className={styles.mono}>{l.code}</td>
                    <td>{l.phone || '—'}</td>
                    <td>{l.email || '—'}</td>
                    <td className={styles.mono} title={l.deviceId || ''}>{l.deviceId ? l.deviceId.slice(0, 8) : '—'}</td>
                    <td>{popupNames[l.popupId] || '—'}</td>
                    <td>{[l.utmSource, l.utmCampaign].filter(Boolean).join(' / ') || '—'}</td>
                    <td>
                      {l.amoLeadId ? (
                        <a href={`${AMO_LEAD_URL}${l.amoLeadId}`} target="_blank" rel="noopener noreferrer">
                          #{l.amoLeadId}
                        </a>
                      ) : (
                        'создаётся…'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPromoPopups;

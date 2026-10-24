import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { authHeaders } from '../AdminInvoices/invoiceShared';
import { uploadToS3 } from '../../services/uploads';
import { DEFAULT_SHOP_COLORS } from '../Marketplace/shopThemes';
import {
  PREVIEW_DRAFT,
  PREVIEW_EDIT,
  PREVIEW_FOCUS,
  PREVIEW_NEW_SLUG,
  PREVIEW_READY,
} from '../Marketplace/shopPreview';
import { apiError, emptyShopForm, formFromShop, shopPayload } from './shopForm';
import base from '../AdminPromoCodes/AdminPromoCodes.module.css';
import assets from './AdminShops.module.css';
import styles from './AdminShopEdit.module.css';

const ASSETS = [
  {
    field: 'logoUrl',
    title: 'Логотип в шапке',
    accept: 'image/*',
    hint: 'PNG или SVG на прозрачном фоне. Без логотипа — название текстом.',
  },
  {
    field: 'logoMarkUrl',
    title: 'Знак для телефона',
    accept: 'image/*',
    hint: 'Компактный знак, заменяет логотип на узких экранах.',
  },
  {
    field: 'heroImageUrl',
    title: 'Фото витрины',
    accept: 'image/*',
    hint: 'Квадратное фото над каталогом рядом с описанием.',
  },
  {
    field: 'heroVideoUrl',
    title: 'Видео витрины',
    accept: 'video/webm,video/mp4',
    hint: 'Квадратный ролик вместо фото (webm или mp4).',
  },
  {
    field: 'faviconUrl',
    title: 'Фавикон',
    accept: 'image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon',
    hint: 'Иконка вкладки браузера. Квадратная, PNG от 180×180 или SVG.',
  },
];

const COLORS = [
  { field: 'headerColor', title: 'Шапка' },
  { field: 'accentColor', title: 'Акцент', hint: 'цены, кнопки, ссылки' },
  { field: 'backgroundColor', title: 'Фон' },
];

const PALETTES = [
  { name: 'Бордо и крем', headerColor: '#572631', accentColor: '#6e2f3e', backgroundColor: '#f4eee3' },
  { name: 'Пыльная роза', headerColor: '#d78da1', accentColor: '#b44e70', backgroundColor: '#faf3e6' },
  { name: 'Небо и шоколад', headerColor: '#7f95a7', accentColor: '#4a3423', backgroundColor: '#f4f1ea' },
  { name: 'Шалфей', headerColor: '#5f6f52', accentColor: '#4d5b40', backgroundColor: '#f3f2ea' },
  { name: 'Графит', headerColor: '#1f1f1f', accentColor: '#1f1f1f', backgroundColor: '#f5f3ef' },
  { name: 'Ночь', headerColor: '#14161c', accentColor: '#d9b26f', backgroundColor: '#1d2027' },
  { name: 'Лаванда', headerColor: '#9b8fc4', accentColor: '#5b4b8a', backgroundColor: '#f6f4fa' },
  { name: 'Терракота', headerColor: '#c26a4a', accentColor: '#9c4a2f', backgroundColor: '#faf1ea' },
  { name: 'Море', headerColor: '#2f5d6e', accentColor: '#1f6f78', backgroundColor: '#eef4f4' },
  { name: 'Персик', headerColor: '#f2b48c', accentColor: '#c0603a', backgroundColor: '#fff6ef' },
  { name: 'Лес', headerColor: '#24382c', accentColor: '#3f6b4a', backgroundColor: '#f1f3ec' },
  { name: 'Мята', headerColor: '#9fd3c1', accentColor: '#2e7d68', backgroundColor: '#f2faf7' },
];

const DEVICES = {
  desktop: { label: 'Компьютер', width: 1280 },
  mobile: { label: 'Телефон', width: 390, height: 844 },
};

const HEX = /^#[0-9a-f]{6}$/i;

const rand = (min, max) => min + Math.random() * (max - min);

const hsl = (h, sat, light) => {
  const hue = ((h % 360) + 360) % 360;
  const s = sat / 100;
  const l = light / 100;
  const k = (n) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${[0, 8, 4].map((n) => Math.round(channel(n) * 255).toString(16).padStart(2, '0')).join('')}`;
};

const randomWarmPalette = () => {
  const hue = Math.random() < 0.25 ? rand(335, 360) : rand(0, 48);
  const accentHue = hue + rand(-12, 12);
  const darkHeader = Math.random() < 0.35;
  return {
    headerColor: darkHeader ? hsl(hue, rand(30, 50), rand(18, 28)) : hsl(hue, rand(40, 65), rand(58, 74)),
    accentColor: hsl(accentHue, rand(45, 65), rand(24, 32)),
    backgroundColor: hsl(hue + rand(-6, 10), rand(45, 70), rand(94, 97)),
  };
};

const isEqualForm = (a, b) => Object.keys(emptyShopForm).every((k) => (a[k] || '') === (b[k] || ''));

const AssetPreview = ({ field, url }) => {
  if (!url) return <span className={assets.previewEmpty}>не загружено</span>;
  if (field === 'heroVideoUrl') return <video src={url} muted loop autoPlay playsInline />;
  return <img src={url} alt="" />;
};

const AdminShopEdit = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const isNew = shopId === 'new';

  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(emptyShopForm);
  const [savedForm, setSavedForm] = useState(emptyShopForm);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [device, setDevice] = useState('desktop');
  const [flashField, setFlashField] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);

  const iframeRef = useRef(null);
  const stageRef = useRef(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  const dirty = !isEqualForm(form, savedForm);

  useEffect(() => {
    if (isNew) {
      setShop(null);
      setForm(emptyShopForm);
      setSavedForm(emptyShopForm);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient.instance
      .get('/api/shop/admin', { headers: authHeaders() })
      .then((res) => {
        if (cancelled) return;
        const found = (Array.isArray(res.data) ? res.data : []).find((s) => s.id === shopId);
        if (!found) {
          setLoadError('Магазин не найден');
          return;
        }
        setShop(found);
        setForm(formFromShop(found));
        setSavedForm(formFromShop(found));
        setLoadError('');
      })
      .catch((err) => !cancelled && setLoadError(apiError(err, 'Не удалось загрузить магазин')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [shopId, isNew]);

  const draft = useMemo(
    () => ({
      ...form,
      slug: shop?.slug ?? PREVIEW_NEW_SLUG,
      name: form.name.trim() || 'Новый магазин',
      supportTelegram: form.supportTelegram.trim() || null,
    }),
    [form, shop],
  );

  const postDraft = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: PREVIEW_DRAFT, shop: draft }, window.location.origin);
  }, [draft]);

  useEffect(() => {
    postDraft();
  }, [postDraft]);

  const flash = useCallback((field, focusInput) => {
    const el = document.getElementById(`shop-field-${field}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (focusInput) el.querySelector('input, textarea')?.focus({ preventScroll: true });
    setFlashField(field);
  }, []);

  useEffect(() => {
    if (!flashField) return undefined;
    const timer = setTimeout(() => setFlashField(null), 1400);
    return () => clearTimeout(timer);
  }, [flashField]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const { type, field, value } = event.data || {};
      if (type === PREVIEW_READY) postDraft();
      if (type === PREVIEW_EDIT && (field === 'tagline' || field === 'description')) {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError('');
      }
      if (type === PREVIEW_FOCUS) flash(field, false);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postDraft, flash]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStage({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, loadError]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const onInput = (e) => setField(e.target.name, e.target.value);

  const uploadAsset = async (field, file) => {
    if (!file) return;
    const slug = form.slug.trim().toLowerCase();
    if (isNew && !slug) {
      flash('slug', true);
      toast.error('Сначала укажите адрес магазина — файлы лягут в его папку');
      return;
    }
    setUploadingField(field);
    try {
      const body = { filename: file.name, contentType: file.type || null };
      const { data } = isNew
        ? await apiClient.instance.post('/api/shop/admin/assets/presign', body, {
            headers: authHeaders(),
            params: { slug },
          })
        : await apiClient.instance.post(`/api/shop/admin/${shopId}/assets/presign`, body, {
            headers: authHeaders(),
          });
      await uploadToS3(data.uploadUrl, file);
      setField(field, data.publicUrl);
    } catch (err) {
      toast.error(apiError(err, 'Не удалось загрузить файл'));
    } finally {
      setUploadingField(null);
    }
  };

  const save = useCallback(async () => {
    const name = form.name.trim();
    if (!name) {
      flash('name', true);
      setError('Укажите название магазина.');
      return;
    }
    const badColor = ['headerColor', 'accentColor', 'backgroundColor'].find(
      (f) => form[f] && !HEX.test(form[f]),
    );
    if (badColor) {
      flash(badColor, true);
      setError('Цвет — в формате #rrggbb.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const slug = form.slug.trim().toLowerCase();
        if (!slug) {
          flash('slug', true);
          setError('Укажите адрес витрины /shop/{slug}.');
          return;
        }
        const res = await apiClient.instance.post(
          '/api/shop/admin',
          { ...shopPayload(form), slug },
          { headers: authHeaders() },
        );
        setShop(res.data);
        setForm(formFromShop(res.data));
        setSavedForm(formFromShop(res.data));
        toast.success(`Магазин создан: витрина /shop/${slug} уже работает`);
        navigate(`/admin/shops/${res.data.id}`, { replace: true });
      } else {
        const res = await apiClient.instance.put(
          `/api/shop/admin/${shopId}`,
          { ...shopPayload(form), active: shop?.active ?? true },
          { headers: authHeaders() },
        );
        setShop(res.data);
        setForm(formFromShop(res.data));
        setSavedForm(formFromShop(res.data));
        toast.success('Сохранено');
      }
    } catch (err) {
      setError(apiError(err, 'Не удалось сохранить магазин'));
    } finally {
      setSaving(false);
    }
  }, [form, isNew, shop, shopId, navigate, flash]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving && !uploadingField) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, saving, uploadingField]);

  const goBack = (e) => {
    if (dirty && !window.confirm('Есть несохранённые изменения. Уйти без сохранения?')) e.preventDefault();
  };

  const resetChanges = () => {
    setForm(savedForm);
    setError('');
    setPreviewKey((k) => k + 1);
  };

  const applyPalette = (palette) => {
    setForm((prev) => ({
      ...prev,
      headerColor: palette.headerColor,
      accentColor: palette.accentColor,
      backgroundColor: palette.backgroundColor,
    }));
  };

  const clearColors = () => {
    setForm((prev) => ({ ...prev, headerColor: '', accentColor: '', backgroundColor: '' }));
  };

  const previewSlug = shop?.slug ?? PREVIEW_NEW_SLUG;
  const previewSrc = `/shop/${previewSlug}?preview=1`;
  const frame = DEVICES[device];
  const frameHeight = frame.height ?? 0;
  const scale = device === 'desktop'
    ? Math.min(1, stage.width / frame.width || 1)
    : Math.min(1, (stage.width - 48) / frame.width || 1, (stage.height - 48) / frameHeight || 1);
  const iframeHeight = device === 'desktop' ? stage.height / scale : frameHeight;
  const fieldClass = (field) => `${styles.field} ${flashField === field ? styles.flash : ''}`;

  if (loading || (!isNew && !shop && !loadError)) {
    return <div className={styles.page}><p className={base.message}>Загрузка…</p></div>;
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <Link to="/admin/shops" className={styles.back}>← все магазины</Link>
        <p className={base.banner}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topTitles}>
          <Link to="/admin/shops" className={styles.back} onClick={goBack}>← все магазины</Link>
          <h1 className={styles.title}>{isNew ? 'Новый магазин' : form.name || shop?.slug}</h1>
          {!isNew && (
            <a className={styles.slugLink} href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
              /shop/{shop.slug} ↗
            </a>
          )}
        </div>
        <div className={styles.topActions}>
          {dirty && <span className={styles.dirty}>есть несохранённые изменения</span>}
          {dirty && !isNew && (
            <button type="button" className={base.cancelBtn} onClick={resetChanges} disabled={saving}>
              Отменить
            </button>
          )}
          <button
            type="button"
            className={base.submit}
            onClick={save}
            disabled={saving || Boolean(uploadingField) || (!dirty && !isNew)}
          >
            {saving ? 'Сохранение…' : isNew ? 'Создать магазин' : 'Сохранить'}
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.panel}>
          {error && <p className={base.error}>{error}</p>}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Магазин</h2>
            {isNew && (
              <label id="shop-field-slug" className={`${base.label} ${fieldClass('slug')}`}>
                Адрес витрины *
                <div className={styles.slugInput}>
                  <span>/shop/</span>
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={onInput}
                    className={base.input}
                    placeholder="di_gips"
                    autoComplete="off"
                  />
                </div>
                <span className={base.hint}>Латинские буквы, цифры, _ и -. Поменять потом нельзя.</span>
              </label>
            )}
            <label id="shop-field-name" className={`${base.label} ${fieldClass('name')}`}>
              Название *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onInput}
                className={base.input}
                placeholder="di_gips"
                autoComplete="off"
              />
            </label>
            <label id="shop-field-supportTelegram" className={`${base.label} ${fieldClass('supportTelegram')}`}>
              Телеграм-бот поддержки
              <input
                type="text"
                name="supportTelegram"
                value={form.supportTelegram}
                onChange={onInput}
                className={base.input}
                placeholder="di_gips_supportbot"
                autoComplete="off"
              />
              <span className={base.hint}>Username без @; пусто — общий AnyFormsBot.</span>
            </label>
            <label id="shop-field-amoContactValue" className={`${base.label} ${fieldClass('amoContactValue')}`}>
              Значение поля «Магазин» в amoCRM
              <input
                type="text"
                name="amoContactValue"
                value={form.amoContactValue}
                onChange={onInput}
                className={base.input}
                placeholder="di_gips"
                autoComplete="off"
              />
              <span className={base.hint}>Сначала добавьте значение в список поля в amoCRM.</span>
            </label>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Тексты</h2>
            <p className={styles.tip}>Заголовок и описание можно печатать прямо на витрине справа.</p>
            <label id="shop-field-tagline" className={`${base.label} ${fieldClass('tagline')}`}>
              Заголовок витрины
              <input
                type="text"
                name="tagline"
                value={form.tagline}
                onChange={onInput}
                className={base.input}
                placeholder={form.name || 'Магазин молдов Дианы di_gips'}
                autoComplete="off"
              />
            </label>
            <label id="shop-field-description" className={`${base.label} ${fieldClass('description')}`}>
              Описание
              <textarea
                name="description"
                value={form.description}
                onChange={onInput}
                className={`${base.input} ${assets.textarea}`}
                rows={4}
                placeholder="Пара предложений об авторе и магазине"
              />
            </label>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Цвета</h2>
              {COLORS.some((c) => form[c.field]) && (
                <button type="button" className={styles.linkBtn} onClick={clearColors}>
                  стиль anyforms
                </button>
              )}
            </div>
            <div className={styles.palettes}>
              <button
                type="button"
                className={styles.randomBtn}
                onClick={() => applyPalette(randomWarmPalette())}
                title="Сгенерировать случайную палитру"
              >
                🎲 случайная
              </button>
              {PALETTES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={styles.palette}
                  onClick={() => applyPalette(p)}
                  title={p.name}
                  aria-label={`Палитра «${p.name}»`}
                >
                  <span style={{ background: p.headerColor }} />
                  <span style={{ background: p.accentColor }} />
                  <span style={{ background: p.backgroundColor }} />
                </button>
              ))}
            </div>
            <div className={styles.colors}>
              {COLORS.map(({ field, title, hint }) => {
                const value = form[field];
                const valid = HEX.test(value);
                return (
                  <div key={field} id={`shop-field-${field}`} className={`${styles.color} ${fieldClass(field)}`}>
                    <label className={styles.swatch} style={{ background: valid ? value : DEFAULT_SHOP_COLORS[field] }}>
                      <input
                        type="color"
                        value={valid ? value.toLowerCase() : DEFAULT_SHOP_COLORS[field]}
                        onChange={(e) => setField(field, e.target.value)}
                        aria-label={title}
                      />
                      {!value && <span className={styles.swatchEmpty}>авто</span>}
                    </label>
                    <div className={styles.colorMeta}>
                      <span className={styles.colorTitle}>{title}</span>
                      {hint && <span className={styles.colorHint}>{hint}</span>}
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setField(field, e.target.value.trim())}
                        className={`${base.input} ${styles.hexInput} ${value && !valid ? styles.hexInvalid : ''}`}
                        placeholder="авто"
                        maxLength={7}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={base.hint}>
              Без цветов витрина выглядит как anyforms. Оттенки текста, плашек и подвала подбираются сами.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Картинки</h2>
            {isNew && !form.slug.trim() && (
              <p className={styles.tip}>Укажите адрес витрины — после этого можно загружать файлы.</p>
            )}
            <div className={styles.assetList}>
              {ASSETS.map((asset) => {
                const busy = uploadingField === asset.field;
                return (
                  <div
                    key={asset.field}
                    id={`shop-field-${asset.field}`}
                    className={`${assets.asset} ${fieldClass(asset.field)}`}
                  >
                    <span className={assets.assetTitle}>{asset.title}</span>
                    <div className={assets.preview}>
                      <AssetPreview field={asset.field} url={form[asset.field]} />
                    </div>
                    <div className={assets.assetActions}>
                      <label className={`${assets.fileBtn} ${uploadingField ? assets.fileBtnDisabled : ''}`}>
                        {busy ? 'Загрузка…' : form[asset.field] ? 'Заменить' : 'Загрузить'}
                        <input
                          type="file"
                          accept={asset.accept}
                          disabled={Boolean(uploadingField)}
                          onChange={(e) => {
                            uploadAsset(asset.field, e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {form[asset.field] && (
                        <button type="button" className={assets.clearBtn} onClick={() => setField(asset.field, '')}>
                          Убрать
                        </button>
                      )}
                    </div>
                    <span className={base.hint}>{asset.hint}</span>
                  </div>
                );
              })}
            </div>
            <label id="shop-field-heroImageAlt" className={`${base.label} ${fieldClass('heroImageAlt')}`}>
              Подпись к фото
              <input
                type="text"
                name="heroImageAlt"
                value={form.heroImageAlt}
                onChange={onInput}
                className={base.input}
                placeholder="Диана, автор di_gips, со своими изделиями"
                autoComplete="off"
              />
              <span className={base.hint}>Для поисковиков и экранных дикторов, на витрине не видна.</span>
            </label>
          </section>
        </aside>

        <section className={styles.previewPane}>
          <div className={styles.previewBar}>
            <span className={styles.previewLabel}>Превью{isNew ? ' · товары общей витрины' : ''}</span>
            <div className={styles.devices} role="group" aria-label="Размер экрана">
              {Object.entries(DEVICES).map(([key, d]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.deviceBtn} ${device === key ? styles.deviceBtnActive : ''}`}
                  onClick={() => setDevice(key)}
                  aria-pressed={device === key}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div ref={stageRef} className={`${styles.stage} ${device === 'mobile' ? styles.stageMobile : ''}`}>
            {stage.width > 0 && (
              <div
                className={device === 'mobile' ? styles.phone : styles.screen}
                style={{
                  width: frame.width * scale,
                  height: iframeHeight * scale,
                }}
              >
                <iframe
                  key={`${previewKey}-${device}`}
                  ref={iframeRef}
                  title="Превью витрины"
                  src={previewSrc}
                  onLoad={postDraft}
                  style={{
                    width: frame.width,
                    height: iframeHeight,
                    transform: `scale(${scale})`,
                  }}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminShopEdit;

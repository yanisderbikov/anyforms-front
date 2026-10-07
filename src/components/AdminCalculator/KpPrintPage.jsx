import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';
import KpDocument from './KpDocument';
import { buildRequest, orderFromRequest, readDraft } from './calculatorModel';
import { firstImageUrl, imageReferenceKeys } from './kpContent';
import {
  calculateOrder,
  errorMessage,
  getCalculation,
  getCalculatorOptions,
  getReferenceUrls,
} from '../../services/orderCalculator';
import p from './KpPrintPage.module.css';

const PAGE_STYLE = '@page { size: A4; margin: 0; }';

const waitForImages = (root) => Promise.all(Array.from(root?.querySelectorAll('img') || []).map((img) => (
  img.complete
    ? null
    : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    })
)));

const fileName = (order, mode, date) => {
  const subject = order.client?.trim()
    || order.positions.map((position) => position.productName?.trim()).filter(Boolean).join(', ')
    || 'проект';
  const kind = mode === 'preliminary' ? 'Предварительная оценка' : 'КП';
  const day = date.toLocaleDateString('ru-RU');
  return `${kind} anyforms — ${subject} — ${day}`.replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 150);
};

const KpPrintPage = () => {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const id = params.get('id');
  const modeParam = params.get('mode');
  const [catalog, setCatalog] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showPhotos, setShowPhotos] = useState(true);
  const [printing, setPrinting] = useState(false);
  const documentRef = useRef(null);
  const live = apiClient.hasLiveToken();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = PAGE_STYLE;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    if (!live) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const options = await getCalculatorOptions();
        let next;
        if (id) {
          const saved = await getCalculation(id);
          next = {
            order: orderFromRequest(saved.request),
            result: saved.result,
            referenceUrls: saved.referenceUrls || {},
            date: saved.entry?.createdAt ? new Date(saved.entry.createdAt) : new Date(),
          };
        } else {
          const order = readDraft();
          if (!order) {
            throw new Error('Нет открытого расчёта: соберите его в калькуляторе и откройте КП оттуда');
          }
          const result = await calculateOrder(buildRequest(order));
          const keys = imageReferenceKeys(order);
          next = {
            order,
            result,
            referenceUrls: keys.length ? await getReferenceUrls(keys) : {},
            date: new Date(),
          };
        }
        if (!cancelled) {
          setCatalog(options);
          setData(next);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Не удалось подготовить предложение'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, live]);

  const mode = modeParam === 'client' || modeParam === 'preliminary'
    ? modeParam
    : data?.result?.preliminary ? 'preliminary' : 'client';

  const hasPhotos = useMemo(
    () => Boolean(data && data.order.positions.some((position) => firstImageUrl(position, data.referenceUrls))),
    [data],
  );

  if (!live) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?from=${from}`} replace />;
  }

  const setMode = (next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('mode', next);
    setParams(nextParams, { replace: true });
  };

  const download = async () => {
    setPrinting(true);
    try {
      await waitForImages(documentRef.current);
      const previousTitle = document.title;
      document.title = fileName(data.order, mode, data.date);
      window.print();
      document.title = previousTitle;
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className={p.page}>
      <div className={p.toolbar}>
        <img className={p.logo} src="/anyforms_logo_new_white.svg" alt="anyforms" />
        <div className={p.controls}>
          <div className={p.modes}>
            {[['client', 'клиентское'], ['preliminary', 'предварительная оценка']].map(([code, label]) => (
              <button
                key={code}
                type="button"
                className={`${p.mode} ${mode === code ? p.modeActive : ''}`}
                onClick={() => setMode(code)}
              >
                {label}
              </button>
            ))}
          </div>
          {hasPhotos && (
            <label className={p.toggle}>
              <input type="checkbox" checked={showPhotos} onChange={(e) => setShowPhotos(e.target.checked)} />
              фото изделия
            </label>
          )}
          <button type="button" className={p.download} disabled={!data || printing} onClick={download}>
            Скачать PDF
            <span className={p.arrow}>→</span>
          </button>
        </div>
      </div>
      <p className={p.hint}>
        В окне печати выберите «Сохранить как PDF» — поля и колонтитулы браузера уже отключены.
        Лучше всего выглядит в Chrome или Яндекс Браузере.
      </p>

      {error && <p className={p.error}>{error}</p>}
      {!data && !error && <p className={p.loading}>Готовим предложение…</p>}

      {data && (
        <div className={p.sheet}>
          <table className={p.paper}>
            <thead>
              <tr>
                <td>
                  <div className={p.pageSpace} />
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div ref={documentRef}>
                    <KpDocument
                      order={data.order}
                      result={data.result}
                      catalog={catalog}
                      mode={mode}
                      referenceUrls={data.referenceUrls}
                      showPhotos={showPhotos}
                      date={data.date}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <div className={p.pageSpace} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default KpPrintPage;

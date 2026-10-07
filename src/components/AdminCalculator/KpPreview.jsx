import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { formatRub, formatShare } from './calculatorModel';
import { discountLine, kpDate } from './kpContent';
import Breakdown from './Breakdown';
import KpDocument from './KpDocument';
import styles from './AdminCalculator.module.css';
import kp from './KpPreview.module.css';

const MODES = [
  { code: 'client', label: 'клиентское' },
  { code: 'preliminary', label: 'предварительная оценка' },
  { code: 'internal', label: 'внутреннее' },
];

const PRINT_CLASS = 'kpModalPrint';

const KpPreview = ({ order, result, catalog, founder, referenceUrls, onClose }) => {
  const [mode, setMode] = useState(result?.preliminary ? 'preliminary' : 'client');
  const printable = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  if (!result) return null;
  const summary = result.summary;
  const internal = mode === 'internal' && founder;
  const discount = discountLine(summary);

  const copyText = () => {
    const text = printable.current?.innerText || '';
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Текст скопирован'))
      .catch(() => toast.error('Не удалось скопировать'));
  };

  const openPdf = () => {
    window.open(`/admin/calculator/kp?mode=${mode}`, '_blank', 'noopener');
  };

  const printInternal = () => {
    document.body.classList.add(PRINT_CLASS);
    window.print();
    document.body.classList.remove(PRINT_CLASS);
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>
        <div className={styles.dialogHead}>
          <div className={styles.pills}>
            {MODES.filter((m) => founder || m.code !== 'internal').map((m) => (
              <button
                key={m.code}
                type="button"
                className={`${styles.pill} ${mode === m.code ? styles.pillActive : ''}`}
                onClick={() => setMode(m.code)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className={styles.cardActions}>
            <button type="button" className={styles.btnGhost} onClick={copyText}>скопировать текст</button>
            {internal ? (
              <button type="button" className={styles.btn} onClick={printInternal}>печать</button>
            ) : (
              <button type="button" className={styles.btn} onClick={openPdf}>скачать PDF</button>
            )}
          </div>
        </div>

        {internal ? (
          <div ref={printable} className={`${kp.doc} ${kp.printable}`}>
            <p className={kp.docTitle}>Расчёт для основателя</p>
            <p className={kp.docMeta}>
              anyforms · {kpDate()}
              {order.client ? ` · для: ${order.client}` : ''}
            </p>
            <div className={kp.internalGrid}>
              {result.positions.map((p) => (
                <div key={p.index} className={kp.position}>
                  <p className={kp.positionTitle}>
                    {order.positions[p.index]?.productName || `Позиция ${p.index + 1}`}
                    {p.bonus ? ' — бонус' : ''}
                  </p>
                  <Breakdown option={p.options[p.selectedOption]} catalog={catalog} />
                </div>
              ))}
              <div className={kp.position}>
                <p className={kp.positionTitle}>Рентабельность заказа</p>
                <p>
                  Выручка {formatRub(summary.totalOffer)} · себестоимость {formatRub(summary.cost)} · прибыль{' '}
                  {formatRub(summary.profit)} · маржа <b>{formatShare(summary.margin)}</b> (минимум{' '}
                  {formatShare(summary.minProfitShare)}, ориентир {formatShare(summary.targetProfitShare)})
                </p>
                <p>
                  Максимальная скидка {formatShare(summary.maxDiscountShare)} ({formatRub(summary.maxDiscountRub)}),
                  только на формы — {formatShare(summary.maxFormsDiscountShare)}.
                </p>
                {discount && <p>{discount}</p>}
              </div>
            </div>
          </div>
        ) : (
          <div ref={printable} className={kp.preview}>
            <KpDocument
              order={order}
              result={result}
              catalog={catalog}
              mode={mode === 'preliminary' ? 'preliminary' : 'client'}
              referenceUrls={referenceUrls}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default KpPreview;

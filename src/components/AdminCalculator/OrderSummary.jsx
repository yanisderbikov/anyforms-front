import React from 'react';
import { formatRub, formatShare, marginTone } from './calculatorModel';
import { HintList, NumberField } from './CalculatorParts';
import styles from './AdminCalculator.module.css';

const toneClass = {
  good: styles.toneGood,
  warn: styles.toneWarn,
  bad: styles.toneBad,
  neutral: styles.toneNeutral,
};

const OrderSummary = ({ discount, result, founder, onDiscountChange, onSave, saving, onOpenKp, onReset }) => {
  const s = result?.summary;
  const tone = marginTone(s?.margin, s);
  const founderDiscount = founder || discount.developmentPercent !== '' || discount.allowBelowMinMargin;

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>итог заказа</h2>
        {result?.preliminary && <span className={`${styles.badge} ${styles.badgeWarn}`}>предварительная оценка</span>}
      </div>

      <div className={styles.summaryGrid}>
        <div>
          <p className={styles.subTitle} style={{ marginTop: 0 }}>цена</p>
          <ul className={styles.totals}>
            <li className={styles.totalRow}>
              <span>разработка</span>
              <span>{formatRub(s?.developmentKp)}</span>
            </li>
            <li className={styles.totalRow}>
              <span>формы</span>
              <span>{formatRub(s?.formsKp)}</span>
            </li>
            <li className={styles.totalRow}>
              <span>по расчёту</span>
              <span className={s?.discountRub > 0 ? undefined : styles.totalBig}>{formatRub(s?.totalKp)}</span>
            </li>
            {s?.discountRub > 0 && (
              <>
                <li className={styles.totalRow}>
                  <span>скидка</span>
                  <span>− {formatRub(s.discountRub)}</span>
                </li>
                <li className={styles.totalRow}>
                  <span>к оплате</span>
                  <span className={styles.totalBig}>{formatRub(s.totalOffer)}</span>
                </li>
              </>
            )}
          </ul>
        </div>

        <div>
          <p className={styles.subTitle} style={{ marginTop: 0 }}>рентабельность</p>
          <ul className={styles.totals}>
            <li className={styles.totalRow}>
              <span>маржа</span>
              <span className={`${styles.marginValue} ${toneClass[tone]}`}>{formatShare(s?.margin)}</span>
            </li>
            <li className={styles.totalRow}>
              <span>себестоимость без налога</span>
              <span>{formatRub(s?.cost)}</span>
            </li>
            <li className={styles.totalRow}>
              <span>прибыль</span>
              <span>{formatRub(s?.profit)}</span>
            </li>
            <li className={styles.totalRow}>
              <span>минимальная цена ({formatShare(s?.minProfitShare)})</span>
              <span>{formatRub(s?.minPrice)}</span>
            </li>
            <li className={styles.totalRow}>
              <span>максимальная скидка</span>
              <span>
                {formatShare(s?.maxDiscountShare)} · {formatRub(s?.maxDiscountRub)}
              </span>
            </li>
            <li className={styles.totalRow}>
              <span>если только на формы</span>
              <span>{formatShare(s?.maxFormsDiscountShare)}</span>
            </li>
          </ul>
          <p className={styles.hint} style={{ margin: '6px 0 0' }}>
            Ориентир — {formatShare(s?.targetProfitShare)}, минимум для любого предложения — {formatShare(s?.minProfitShare)}.
          </p>
        </div>

        <div>
          <p className={styles.subTitle} style={{ marginTop: 0 }}>скидки</p>
          <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            <NumberField
              label="на формы"
              unit="%"
              value={discount.formsPercent}
              placeholder="0"
              onChange={(value) => onDiscountChange({ formsPercent: value })}
            />
            <NumberField
              label="промокод"
              unit="%"
              value={discount.promoPercent}
              placeholder="0"
              onChange={(value) => onDiscountChange({ promoPercent: value })}
            />
            {founderDiscount && (
              <NumberField
                label="на разработку"
                unit="%"
                value={discount.developmentPercent}
                placeholder="0"
                disabled={!founder}
                onChange={(value) => onDiscountChange({ developmentPercent: value })}
              />
            )}
          </div>
          {s?.formsDiscountCapped && (
            <p className={styles.hint} style={{ margin: '8px 0 0' }}>
              Применена максимальная скидка {s.formsDiscountApplied}% вместо {s.formsDiscountRequested}%.
            </p>
          )}
          {founderDiscount && (
            <>
              <label className={styles.check} style={{ marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={discount.allowBelowMinMargin}
                  disabled={!founder}
                  onChange={(e) => onDiscountChange({ allowBelowMinMargin: e.target.checked })}
                />
                согласовано ниже минимальной маржи
              </label>
              {(discount.allowBelowMinMargin || discount.developmentPercent !== '') && (
                <label className={styles.label} style={{ marginTop: 10 }}>
                  Комментарий основателя *
                  <textarea
                    className={styles.textarea}
                    value={discount.comment}
                    disabled={!founder}
                    placeholder="Повторный клиент, загрузка цеха в простой…"
                    onChange={(e) => onDiscountChange({ comment: e.target.value })}
                  />
                </label>
              )}
            </>
          )}
          {!founder && (
            <p className={styles.hint} style={{ margin: '8px 0 0' }}>
              Скидку согласует основатель. Скидка больше максимальной автоматически урезается.
            </p>
          )}
        </div>
      </div>

      <HintList hints={result?.hints} />

      <div className={styles.actionsRow}>
        <button type="button" className={styles.btn} onClick={onSave} disabled={saving || !result}>
          {saving ? 'сохранение…' : 'сохранить в журнал'}
        </button>
        <button type="button" className={styles.btnGhost} onClick={onOpenKp} disabled={!result}>
          КП
        </button>
        <button type="button" className={styles.btnGhost} onClick={onReset}>
          новый расчёт
        </button>
      </div>
    </section>
  );
};

export default OrderSummary;

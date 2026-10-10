import React from 'react';
import { formatRub, formatShare, labelOf, marginTone } from './calculatorModel';
import styles from './AdminCalculator.module.css';

const toneClass = {
  good: styles.toneGood,
  warn: styles.toneWarn,
  bad: styles.toneBad,
  neutral: styles.toneNeutral,
};

const OptionsTable = ({ positionResult, catalog, summary, variantsCount, onSelect }) => {
  const options = positionResult?.options || [];
  if (!options.length) return null;
  const digital = positionResult.digitalOnly;
  const bonus = positionResult.bonus;
  const discounted = options.some((o) => o.offer.total !== o.kp.total);

  const cell = (option, index, content) => (
    <td
      key={index}
      className={index === positionResult.selectedOption ? styles.colSelected : undefined}
      onClick={() => onSelect(option)}
    >
      {content}
    </td>
  );

  const row = (label, render, className) => (
    <tr className={className}>
      <td>{label}</td>
      {options.map((option, index) => cell(option, index, render(option)))}
    </tr>
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>вариант</th>
            {options.map((option, index) => {
              const level = option.hints.some((h) => h.level === 'ERROR')
                ? 'error'
                : option.hints.some((h) => h.level === 'WARNING') ? 'warn' : null;
              return (
                <th
                  key={index}
                  className={index === positionResult.selectedOption ? styles.colSelected : undefined}
                  onClick={() => onSelect(option)}
                  title="Нажмите, чтобы этот вариант пошёл в итог заказа"
                >
                  <span className={styles.colHead}>
                    <span className={styles.colHeadMain}>
                      {variantsCount > 1 ? `${option.variantIndex + 1} · ` : ''}
                      {labelOf(catalog?.formTypes, option.formType)}
                    </span>
                    {!digital && (
                      <span className={styles.colHeadSub}>
                        {labelOf(catalog?.silicones, option.silicone)} · {option.tirage} шт
                      </span>
                    )}
                    <span className={styles.selectMark}>
                      {level === 'error' && <span className={styles.dotError} />}
                      {level === 'warn' && <span className={styles.dotWarn} />}
                      {index === positionResult.selectedOption ? '● в заказе' : '○ выбрать'}
                    </span>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {row('разработка', (o) => formatRub(o.kp.development))}
          {!digital && row('цена формы', (o) => formatRub(o.kp.formPrice))}
          {!digital && row('формы × тираж', (o) => formatRub(o.kp.forms))}
          {row('итого по расчёту', (o) => formatRub(o.kp.total), styles.rowTotal)}
          {(discounted || bonus) && row(bonus ? 'клиенту (бонус)' : 'со скидкой', (o) => formatRub(o.offer.total), styles.rowTotal)}
          {!digital && row('за форму с разработкой', (o) => formatRub(bonus ? o.kp.perForm : o.offer.perForm))}
          {row('маржа', (o) => (
            <span className={toneClass[marginTone(o.margin, summary)]}>{formatShare(o.margin)}</span>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OptionsTable;

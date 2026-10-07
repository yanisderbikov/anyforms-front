import React from 'react';
import { formatNumber, formatRub, formatShare, labelOf } from './calculatorModel';
import styles from './AdminCalculator.module.css';

const Row = ({ label, value, note, strong }) => (
  <li className={`${styles.breakdownRow} ${strong ? styles.breakdownStrong : ''}`}>
    <span>
      {label}
      {note && <span className={styles.breakdownNote}> · {note}</span>}
    </span>
    <span>{value}</span>
  </li>
);

const rub2 = (value) => formatRub(value, 2);

const Breakdown = ({ option, catalog }) => {
  if (!option) return null;
  const { price: p, input: i, cost: c, kp, offer } = option;
  const digital = i.digitalOnly;

  return (
    <div className={styles.breakdown}>
      <div>
        <p className={styles.breakdownTitle}>разработка · {labelOf(catalog?.formTypes, option.formType)}</p>
        <ul className={styles.breakdownList}>
          <Row label="5.1 моделирование" value={rub2(p.model)}
            note={i.hasClientModel ? 'модель клиента' : i.sharedModel ? 'в другой позиции' : i.modelPriceOverride != null ? 'вручную' : `художник ${formatRub(i.modelContractorPrice)}`} />
          {!digital && (
            <>
              <Row label="5.2 смола" value={`${formatNumber(p.slaMl)} мл`} />
              <Row label="5.3 печать SLA" value={rub2(p.sla)} note={i.sharedSlaPrint ? 'в другой позиции' : `${formatNumber(i.slaHours)} ч`} />
            </>
          )}
          <Row label="5.4 проектирование оснастки" value={rub2(p.fdmProject)} note={`${formatNumber(i.fdmProjectHours)} ч`} />
          {!digital && (
            <>
              <Row label="5.5 литьевой комплект" value={rub2(p.kit)} note={`${formatNumber(i.kitGrams)} г, ${formatNumber(i.kitHours)} ч`} />
              <Row label="5.6 обработка" value={rub2(p.processing)} note={`${formatNumber(i.processingHours)} ч`} />
              {p.cnc > 0 && <Row label="5.6 ЧПУ" value={rub2(p.cnc)} note={`${formatNumber(i.cncHours)} ч`} />}
              <Row label="5.7 подготовка" value={rub2(p.prep)} />
              <Row label="5.8 промежуточная форма" value={rub2(p.tin)}
                note={i.needsIntermediate ? `${formatNumber(i.tinGrams)} г × ${i.tinFormsCount}` : 'не нужна'} />
              <Row label="5.9 копия" value={rub2(p.copy)} note={i.needsIntermediate ? `${formatNumber(i.copyGrams)} г` : null} />
              <Row label="5.10 доп. комплекты" value={rub2(p.extraKits)}
                note={`нужно ${p.kits}, оплачивает ${p.kitsPaid}`} />
            </>
          )}
          <Row label="5.11 разработка" value={rub2(p.development)} strong />
        </ul>
      </div>

      {!digital && (
        <div>
          <p className={styles.breakdownTitle}>форма · {labelOf(catalog?.silicones, option.silicone)}, тираж {option.tirage}</p>
          <ul className={styles.breakdownList}>
            <Row label="вес силикона с запасом" value={`${formatNumber(p.siliconeWeight)} г`}
              note={`из ${formatNumber(i.siliconeGrams)} г`} />
            <Row label="силикон" value={rub2(p.siliconeCost)} />
            <Row label="рабочая оснастка" value={rub2(p.shellCost)} note={`${formatNumber(i.shellGrams)} г`} />
            <Row label="печать оснастки" value={rub2(p.shellPrint)} />
            <Row label="отливка" value={rub2(p.pour)} />
            {p.cut > 0 && <Row label="разрез" value={rub2(p.cut)} />}
            {p.extra > 0 && <Row label="доплаты к форме" value={rub2(p.extra)} />}
            <Row label="5.12 расчётная цена формы" value={rub2(p.formCalc)} strong />
            <Row label="5.13 минимум по тиражу" value={rub2(p.minFormPrice)} />
            <Row label="5.13 цена формы" value={rub2(p.formPrice)}
              note={p.formPriceOverridden ? 'вручную' : p.minPriceApplied ? 'по минимуму' : 'по расчёту'} />
            <Row label="5.14 формы итого" value={rub2(p.formsTotal)} note={p.cliffApplied ? 'защита от обрыва' : null} />
            <Row label="5.15 итого позиции" value={rub2(p.total)} strong />
          </ul>
        </div>
      )}

      <div>
        <p className={styles.breakdownTitle}>КП (5.16) и себестоимость</p>
        <ul className={styles.breakdownList}>
          <Row label="разработка в КП" value={formatRub(kp.development)}
            note={offer.development !== kp.development ? `со скидкой ${formatRub(offer.development)}` : null} />
          {!digital && (
            <Row label="цена формы в КП" value={`${formatRub(kp.formPrice)} × ${kp.tirage}`}
              note={offer.formPrice !== kp.formPrice ? `со скидкой ${formatRub(offer.formPrice)}` : null} />
          )}
          <Row label="итого в КП" value={formatRub(offer.total)} strong />
          <Row label="модель у художника" value={rub2(c.contractor)} />
          {!digital && (
            <>
              <Row label="смола и мойка" value={rub2(c.resin)} />
              <Row label="PETG комплектов" value={rub2(c.kitPlastic)} />
              <Row label="промежуточная форма и копии" value={rub2(c.intermediate)} />
              <Row label="материалы форм" value={rub2(c.forms)} />
            </>
          )}
          <Row label="часы работы" value={rub2(c.labor)} note={`${formatNumber(c.hours)} ч`} />
          <Row label="себестоимость без налога" value={rub2(c.total)} strong />
          <Row label="маржа варианта" value={formatShare(option.margin)} />
        </ul>
      </div>
    </div>
  );
};

export default Breakdown;

import React from 'react';
import { SELLER } from '../../shared/seller';
import { formatRub, labelOf } from './calculatorModel';
import {
  developmentWorks,
  differences,
  dimsText,
  discountLine,
  firstImageUrl,
  kpDate,
  offeredOptions,
  optionTitle,
} from './kpContent';
import s from './KpDocument.module.css';

const TG_CHANNEL = 'https://t.me/anyforms';

const positionParams = (position, positionResult, options, catalog) => [
  dimsText(position),
  position.pourMaterial ? `заливка — ${labelOf(catalog?.pourMaterials, position.pourMaterial).toLowerCase()}` : null,
  positionResult.digitalOnly ? 'цифровой продукт: 3D-модель и проект оснастки' : null,
  !positionResult.digitalOnly && [...new Set(options.map((o) => o.silicone))].length === 1
    ? `силикон — ${labelOf(catalog?.silicones, options[0].silicone)}`
    : null,
].filter(Boolean);

const Position = ({ position, positionResult, catalog, approx, showIndex, photo }) => {
  const name = position.productName?.trim() || `Позиция ${positionResult.index + 1}`;
  const options = offeredOptions(positionResult);
  const params = positionParams(position, positionResult, options, catalog);

  if (positionResult.bonus) {
    return (
      <section className={s.position}>
        <div className={s.bonus}>
          <div>
            {showIndex && <span className={s.overline}>позиция {positionResult.index + 1}</span>}
            <h2 className={s.bonusTitle}>{name}</h2>
            {params.length > 0 && <p className={s.bonusParams}>{params.join(' · ')}</p>}
          </div>
          <span className={s.giftPill}>в подарок</span>
        </div>
      </section>
    );
  }

  const works = developmentWorks(options);
  const variantsCount = position.variants?.length || 1;
  const single = options.length === 1;

  return (
    <section className={s.position}>
      <div className={s.positionHead}>
        <div className={s.positionHeadText}>
          {showIndex && <span className={s.overline}>позиция {positionResult.index + 1}</span>}
          <h2 className={s.positionTitle}>{name}</h2>
          {params.length > 0 && (
            <div className={s.chips}>
              {params.map((param) => <span key={param} className={s.chip}>{param}</span>)}
            </div>
          )}
        </div>
        {photo && <img className={s.positionPhoto} src={photo} alt="" />}
      </div>

      {works.length > 0 && (
        <div className={s.card}>
          <div className={s.cardHead}>
            <h3 className={s.cardTitle}>Что входит в проект</h3>
            <span className={s.cardNote}>оплачивается один раз</span>
          </div>
          <ul className={`${s.dots} ${s.works}`}>
            {works.map((work) => <li key={work}>{work}</li>)}
          </ul>
        </div>
      )}

      <div className={single ? s.offersSingle : s.offers}>
        {options.map((o, i) => (
          <div key={i} className={s.offer}>
            {!single && (
              <div className={s.offerHead}>
                Вариант {i + 1}
                <span>{optionTitle(o, catalog, variantsCount)}</span>
              </div>
            )}
            <div className={s.offerRow}>
              <span>Проект</span>
              <b>{approx ? '≈ ' : ''}{formatRub(o.offer.development)}</b>
            </div>
            {!positionResult.digitalOnly && (
              <div className={s.offerRow}>
                <span>Форма</span>
                <b>{formatRub(o.offer.formPrice)}/шт × {o.offer.tirage}</b>
              </div>
            )}
            <div className={s.offerTotal}>
              <span>Итого{approx ? ', ориентировочно' : ''}</span>
              <b>{formatRub(o.offer.total)}</b>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const KpDocument = ({ order, result, catalog, mode = 'client', referenceUrls = {}, showPhotos = true, date }) => {
  if (!result) return null;
  const photoOf = (positionResult) => (showPhotos
    ? firstImageUrl(order.positions[positionResult.index] || {}, referenceUrls)
    : null);
  const uploadedPhoto = result.positions.map(photoOf).find(Boolean) || null;
  const summary = result.summary;
  const preliminary = mode === 'preliminary';
  const approx = preliminary;
  const multiple = result.positions.length > 1;
  const singleOptions = result.positions.every((p) => p.bonus || offeredOptions(p).length === 1);
  const showGrandTotal = multiple && singleOptions;
  const discount = discountLine(summary);
  const dateText = kpDate(date);
  const year = (date || new Date()).getFullYear();
  const client = order.client?.trim();
  const diff = [...new Set(result.positions
    .filter((p) => !p.bonus)
    .map(offeredOptions)
    .flatMap((options) => (options.length > 1 ? differences(options, catalog) : [])))];
  const modeling = result.positions
    .some((p) => offeredOptions(p).some((o) => (o.developmentWorks || []).includes('model')));

  return (
    <article className={s.doc}>
      <header className={s.topbar}>
        <img className={s.logo} src="/anyforms_logo_new_white.svg" alt="anyforms" />
        <div className={s.topbarMeta}>
          <span>{preliminary ? 'предварительная оценка' : 'коммерческое предложение'}</span>
          <span>{dateText}</span>
        </div>
      </header>

      <section className={s.hero}>
        <div className={s.heroCard}>
          <span className={s.kicker}>силиконовые формы под заказ · санкт-петербург</span>
          <h1 className={s.heroTitle}>
            <span>{preliminary ? 'Предварительная' : 'Коммерческое'}</span>{' '}
            <span className={s.muted}>{preliminary ? 'оценка' : 'предложение'}</span>
          </h1>
          <p className={s.heroFor}>
            {client ? <>для <b>{client}</b></> : 'для вашего проекта'}
          </p>
          <p className={s.heroMeta}>
            от {dateText} · цены действительны {summary.offerValidityDays} дней
          </p>
          <div className={s.stats}>
            <div className={s.stat}>
              <b>5+</b>
              <span>лет в производстве форм</span>
            </div>
            <div className={s.stat}>
              <b>100 000+</b>
              <span>молдов сделали под заказ</span>
            </div>
          </div>
        </div>
        <div className={s.heroPhoto}>
          <img src={uploadedPhoto || '/landing/main/main.jpeg'} alt="" />
        </div>
      </section>

      {preliminary && (
        <section className={s.notice}>
          <span className={s.noticeLabel}>предварительная оценка</span>
          <p>
            Данных пока недостаточно для точного расчёта. Документ не является офертой и знакомит с примерной
            стоимостью — точная цена появится после согласования модели, размеров и тиража.
          </p>
        </section>
      )}

      {result.positions.map((p) => {
        const position = order.positions[p.index] || {};
        return (
          <Position
            key={p.index}
            position={position}
            positionResult={p}
            catalog={catalog}
            approx={approx}
            showIndex={multiple}
            photo={photoOf(p) && photoOf(p) !== uploadedPhoto ? photoOf(p) : null}
          />
        );
      })}

      {showGrandTotal && (
        <section className={s.grand}>
          <span>итого по заказу{preliminary ? ', ориентировочно' : ''}</span>
          <b>{formatRub(summary.totalOffer)}</b>
        </section>
      )}
      {discount && <p className={s.discount}>{discount}</p>}

      <div className={s.ending}>
        <section className={s.closing}>
          <div className={s.closingCard}>
            <h3 className={s.cardTitle}>Условия</h3>
            <ul className={s.dots}>
              <li>Цены действительны {summary.offerValidityDays} дней с даты предложения.</li>
              <li>Перед производством согласуем с вами <span className={s.nowrap}>3D-модель</span>.</li>
              {modeling && (
                <li>
                  В стоимость входят 3 бесплатных исправления модели, обычно хватает{' '}
                  <span className={s.nowrap}>1–2</span>.
                </li>
              )}
              <li>Работа начинается после предоплаты.</li>
            </ul>
          </div>
          {diff.length > 0 && (
            <div className={s.closingCard}>
              <h3 className={s.cardTitle}>В чём разница</h3>
              <ul className={s.dots}>
                {diff.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          )}
        </section>

        <footer className={s.footer}>
          <img className={s.footerLogo} src="/anyforms_logo_new_white.svg" alt="anyforms" />
          <div className={s.footerGrid}>
            <div>
              <h4 className={s.footerHeading}>О компании</h4>
              <p className={s.footerText}>
                {SELLER.shortName}
                <br />
                ИНН {SELLER.inn}
                <br />
                ОГРНИП {SELLER.ogrnip}
                <br />
                {SELLER.address}
              </p>
            </div>
            <div>
              <h4 className={s.footerHeading}>Контакты</h4>
              <p className={s.footerText}>
                <a href={`tel:${SELLER.phoneE164}`}>{SELLER.phone}</a>
                <br />
                <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
                <br />
                <a href={TG_CHANNEL}>Telegram — канал</a>
                <br />
                <a href={`https://${SELLER.site}`}>{SELLER.site}</a>
              </p>
            </div>
          </div>
          <p className={s.copyright}>© anyforms, {year}</p>
        </footer>
      </div>
    </article>
  );
};

export default KpDocument;

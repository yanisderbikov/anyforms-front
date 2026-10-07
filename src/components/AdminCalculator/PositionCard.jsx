import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  EXCEPTION_FIELDS,
  emptyVariant,
  isModelPriceMissing,
  labelOf,
  modelPriceRequired,
  optionForVariant,
  parseTirages,
} from './calculatorModel';
import { HintList, NumberField, Section } from './CalculatorParts';
import VariantEditor from './VariantEditor';
import OptionsTable from './OptionsTable';
import Breakdown from './Breakdown';
import { errorMessage, uploadReference } from '../../services/orderCalculator';
import styles from './AdminCalculator.module.css';

const REFERENCE_ACCEPT = 'image/*,.pdf,.stl,.obj,.3mf,.step,.stp,.zip';

const PositionCard = ({
  position,
  index,
  positionsCount,
  positionResult,
  catalog,
  founder,
  summary,
  referenceUrls,
  onReferenceUrls,
  onChange,
  onRemove,
  onDuplicate,
}) => {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);

  const active = Math.min(position.activeVariant, position.variants.length - 1);
  const variant = position.variants[active];
  const activeOption = optionForVariant(positionResult, active);
  const selectedOption = positionResult?.options?.[positionResult.selectedOption];
  const exceptionsSet = position.bonus
    || position.variants.some((v) => EXCEPTION_FIELDS.some((f) => v[f.key] !== ''));

  const updateVariant = (variantIndex, patch) => {
    onChange((prev) => ({
      variants: prev.variants.map((v, i) => (i === variantIndex ? { ...v, ...patch } : v)),
    }));
  };

  const addVariant = () => {
    onChange((prev) => {
      const source = prev.variants[Math.min(prev.activeVariant, prev.variants.length - 1)];
      const copy = source ? { ...JSON.parse(JSON.stringify(source)) } : emptyVariant();
      return { variants: [...prev.variants, copy], activeVariant: prev.variants.length };
    });
  };

  const removeVariant = (variantIndex) => {
    onChange((prev) => {
      const variants = prev.variants.filter((_, i) => i !== variantIndex);
      const shift = (value) => (value > variantIndex ? value - 1 : value === variantIndex ? 0 : value);
      return {
        variants,
        activeVariant: Math.min(shift(prev.activeVariant), variants.length - 1),
        selectedVariant: Math.min(shift(prev.selectedVariant), variants.length - 1),
      };
    });
  };

  const toggleSilicone = (code) => {
    onChange((prev) => {
      const has = prev.silicones.includes(code);
      const silicones = has ? prev.silicones.filter((s) => s !== code) : [...prev.silicones, code];
      if (!silicones.length) return {};
      const order = (catalog?.silicones || []).map((s) => s.code);
      return { silicones: silicones.sort((a, b) => order.indexOf(a) - order.indexOf(b)) };
    });
  };

  const selectOption = (option) => {
    onChange({
      selectedVariant: option.variantIndex,
      selectedSilicone: option.silicone,
      selectedTirage: option.tirage,
      activeVariant: option.variantIndex,
    });
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        uploaded.push(await uploadReference(file));
      }
      onChange((prev) => ({ references: [...prev.references, ...uploaded] }));
      const urls = {};
      files.forEach((file, i) => {
        urls[uploaded[i].key] = URL.createObjectURL(file);
      });
      onReferenceUrls(urls);
      toast.success(uploaded.length > 1 ? `Загружено файлов: ${uploaded.length}` : 'Референс загружен');
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось загрузить файл'));
    } finally {
      setUploading(false);
    }
  };

  const removeReference = (key) => {
    onChange((prev) => ({ references: prev.references.filter((ref) => ref.key !== key) }));
  };

  const tirages = parseTirages(position.tirages);
  const hints = [
    ...(positionResult?.hints || []),
    ...(selectedOption?.hints || []),
  ];

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.positionIndex}>позиция {index + 1}</span>
        <div className={styles.cardActions}>
          <button type="button" className={styles.btnGhost} onClick={onDuplicate}>дублировать</button>
          {positionsCount > 1 && (
            <button type="button" className={styles.btnDanger} onClick={onRemove}>удалить</button>
          )}
        </div>
      </div>
      <input
        className={styles.productName}
        value={position.productName}
        placeholder="Изделие, например «Свеча Онигири»"
        onChange={(e) => onChange({ productName: e.target.value })}
      />

      <div className={styles.grid} style={{ marginTop: 14 }}>
        <label className={styles.label}>
          Ш × Г × В, мм
          <span className={styles.dims}>
            {['widthMm', 'depthMm', 'heightMm'].map((key, i) => (
              <input
                key={key}
                className={styles.input}
                inputMode="decimal"
                placeholder={['80', '45', '80'][i]}
                value={position[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
              />
            ))}
          </span>
        </label>
        <label className={styles.label}>
          Материал заливки
          <select
            className={styles.select}
            value={position.pourMaterial}
            onChange={(e) => onChange({ pourMaterial: e.target.value })}
          >
            {(catalog?.pourMaterials || []).map((m) => (
              <option key={m.code} value={m.code}>
                {m.label}
                {m.hint ? ` — ${m.hint}` : ''}
              </option>
            ))}
          </select>
        </label>
        {!position.digitalOnly && (
          <NumberField
            label="Тираж, через запятую"
            value={position.tirages}
            placeholder="5, 10"
            hint={tirages.length ? `считаем: ${tirages.join(' / ')} шт` : 'Не указан — посчитаем для 1 формы'}
            onChange={(value) => onChange({ tirages: value })}
          />
        )}
        {!position.digitalOnly && (
          <div className={styles.label}>
            Силикон
            <span className={styles.pills}>
              {(catalog?.silicones || []).map((s) => (
                <button
                  key={s.code}
                  type="button"
                  title={s.hint}
                  className={`${styles.pill} ${position.silicones.includes(s.code) ? styles.pillActive : ''}`}
                  onClick={() => toggleSilicone(s.code)}
                >
                  {s.label}
                </button>
              ))}
            </span>
            <span className={styles.hint}>Оба — посчитаем рядом для сравнения</span>
          </div>
        )}
      </div>

      <div className={styles.checkGroup}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={position.hasClientModel}
            onChange={(e) => onChange({ hasClientModel: e.target.checked })}
          />
          готовая 3D-модель клиента
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={position.digitalOnly}
            onChange={(e) => onChange({ digitalOnly: e.target.checked })}
          />
          цифровой продукт (только модель и проект)
        </label>
        {positionsCount > 1 && (
          <>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={position.sharedModel}
                onChange={(e) => onChange({ sharedModel: e.target.checked })}
              />
              модель учтена в другой позиции
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={position.sharedSlaPrint}
                onChange={(e) => onChange({ sharedSlaPrint: e.target.checked })}
              />
              печать на одном столе с другой позицией
            </label>
          </>
        )}
        {(founder || position.bonus) && (
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={position.bonus}
              disabled={!founder}
              onChange={(e) => onChange({ bonus: e.target.checked })}
            />
            бонус (в подарок)
          </label>
        )}
      </div>

      <p className={styles.subTitle}>референсы — фото, эскиз, STL</p>
      <div className={styles.refs}>
        {position.references.map((ref) => (
          <span key={ref.key} className={styles.ref}>
            {referenceUrls[ref.key] ? (
              <a href={referenceUrls[ref.key]} target="_blank" rel="noreferrer" title={ref.filename}>
                {ref.filename || 'файл'}
              </a>
            ) : (
              <span title={ref.filename}>{ref.filename || 'файл'}</span>
            )}
            <button type="button" className={styles.refRemove} onClick={() => removeReference(ref.key)} aria-label="Убрать">
              ×
            </button>
          </span>
        ))}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={REFERENCE_ACCEPT}
          className={styles.fileInput}
          onChange={handleFiles}
        />
        <button type="button" className={styles.btnGhost} disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? 'загрузка…' : '+ файл'}
        </button>
      </div>

      <div className={styles.variantTabs}>
        {position.variants.map((v, i) => (
          <span
            key={i}
            role="button"
            tabIndex={0}
            className={`${styles.variantTab} ${i === active ? styles.variantTabActive : ''} ${isModelPriceMissing(position, v) ? styles.variantTabInvalid : ''}`}
            title={isModelPriceMissing(position, v) ? 'Не указана цена художника за модель' : undefined}
            onClick={() => onChange({ activeVariant: i })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onChange({ activeVariant: i });
            }}
          >
            вариант {i + 1} · {labelOf(catalog?.formTypes, v.formType)}
            {position.variants.length > 1 && (
              <span
                className={styles.variantRemove}
                role="button"
                tabIndex={0}
                aria-label="Удалить вариант"
                onClick={(e) => {
                  e.stopPropagation();
                  removeVariant(i);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    removeVariant(i);
                  }
                }}
              >
                ×
              </span>
            )}
          </span>
        ))}
        {position.variants.length < 4 && (
          <button type="button" className={styles.btnSmall} onClick={addVariant} title="Копия текущего варианта — поменяйте тип формы">
            + вариант формы
          </button>
        )}
      </div>

      <VariantEditor
        key={`${position.key}-${active}`}
        variant={variant}
        option={activeOption}
        catalog={catalog}
        founder={founder}
        digital={position.digitalOnly}
        modelRequired={modelPriceRequired(position)}
        onChange={(patch) => updateVariant(active, patch)}
      />

      {exceptionsSet && (
        <label className={styles.label} style={{ marginTop: 14 }}>
          Комментарий «исключение проекта» *
          <textarea
            className={styles.textarea}
            value={position.exceptionComment}
            disabled={!founder}
            placeholder="Почему отступаем от регламента"
            onChange={(e) => onChange({ exceptionComment: e.target.value })}
          />
        </label>
      )}

      <OptionsTable
        positionResult={positionResult}
        catalog={catalog}
        summary={summary}
        variantsCount={position.variants.length}
        onSelect={selectOption}
      />

      <HintList hints={hints} />

      {founder && selectedOption?.price && (
        <Section title="разбивка выбранного варианта (внутреннее)">
          <Breakdown option={selectedOption} catalog={catalog} />
        </Section>
      )}
    </section>
  );
};

export default PositionCard;

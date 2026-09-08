import React, { useState } from 'react';
import styles from './AdminSalesbot.module.css';

// Выбор бота по имени из списка amoCRM; в таблицу уходит id. Если список не загрузился
// или бота в нём нет — ввод id вручную.
export const BotPicker = ({ bots, botsError, value, onChange, autoFocus }) => {
  const [manual, setManual] = useState(false);
  const hasList = bots.length > 0;
  const useSelect = hasList && !manual;
  const known = bots.some((b) => String(b.id) === String(value));

  return (
    <div className={styles.picker}>
      {useSelect ? (
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          aria-label="Бот amoCRM"
        >
          <option value="">— выберите бота —</option>
          {value && !known && <option value={value}>id {value} (нет в списке amoCRM)</option>}
          {bots.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {(b.name || 'без названия') + ' · ' + b.id}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={styles.input}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="id бота"
          autoFocus={autoFocus}
          aria-label="ID бота amoCRM"
        />
      )}
      {hasList && (
        <button type="button" className={styles.linkBtn} onClick={() => setManual((m) => !m)}>
          {useSelect ? 'ввести id вручную' : 'выбрать из списка'}
        </button>
      )}
      {!hasList && botsError && (
        <span className={styles.pickerHint}>Список ботов amoCRM не загрузился — введите id вручную.</span>
      )}
    </div>
  );
};

// Выбор воронки и статуса по имени; в настройки уходят id. Без списка — ввод id вручную.
export const PipelinePicker = ({ pipelines, pipelinesError, pipelineId, statusId, onChange, autoFocus }) => {
  const [manual, setManual] = useState(false);
  const hasList = pipelines.length > 0;
  const useSelect = hasList && !manual;
  const pipeline = pipelines.find((p) => String(p.id) === String(pipelineId));
  const statuses = pipeline ? pipeline.statuses || [] : [];
  const pipelineKnown = !pipelineId || Boolean(pipeline);
  const statusKnown = !statusId || statuses.some((s) => String(s.id) === String(statusId));

  return (
    <div className={styles.picker}>
      {useSelect ? (
        <>
          <select
            className={styles.select}
            value={pipelineId}
            onChange={(e) => onChange({ pipelineId: e.target.value, statusId: '' })}
            autoFocus={autoFocus}
            aria-label="Воронка amoCRM"
          >
            <option value="">— воронка —</option>
            {pipelineId && !pipelineKnown && <option value={pipelineId}>id {pipelineId} (нет в списке amoCRM)</option>}
            {pipelines.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {(p.name || 'без названия') + ' · ' + p.id}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={statusId}
            onChange={(e) => onChange({ pipelineId, statusId: e.target.value })}
            disabled={!pipelineId}
            aria-label="Статус воронки"
          >
            <option value="">— статус —</option>
            {statusId && !statusKnown && <option value={statusId}>id {statusId} (нет в списке amoCRM)</option>}
            {statuses.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {(s.name || 'без названия') + ' · ' + s.id}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <input
            className={styles.input}
            inputMode="numeric"
            value={pipelineId}
            onChange={(e) => onChange({ pipelineId: e.target.value, statusId })}
            placeholder="id воронки"
            autoFocus={autoFocus}
            aria-label="ID воронки"
          />
          <input
            className={styles.input}
            inputMode="numeric"
            value={statusId}
            onChange={(e) => onChange({ pipelineId, statusId: e.target.value })}
            placeholder="id статуса"
            aria-label="ID статуса"
          />
        </>
      )}
      {hasList && (
        <button type="button" className={styles.linkBtn} onClick={() => setManual((m) => !m)}>
          {useSelect ? 'ввести id вручную' : 'выбрать из списка'}
        </button>
      )}
      {!hasList && pipelinesError && (
        <span className={styles.pickerHint}>Список воронок amoCRM не загрузился — введите id вручную.</span>
      )}
    </div>
  );
};

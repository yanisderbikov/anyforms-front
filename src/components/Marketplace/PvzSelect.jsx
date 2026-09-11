import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../../apiClient';
import styles from './checkout.module.css';

// Поиск ПВЗ СДЭК: город (обязательно) + адрес/улица (необязательно, фильтрует пункты внутри города).
// Выбор отдаёт наверх { pvzCode, pvzCity, pvzStreet }.
// onSearchResult(outcome, { query, results }) — для аналитики: outcome = ok | empty | error.
const PvzSelect = ({ selected, onSelect, onClear, invalid, onSearchResult }) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const boxRef = useRef(null);
  const requestIdRef = useRef(0);
  // Колбэк аналитики читаем через ref, чтобы не перезапускать поиск при его смене.
  const onSearchResultRef = useRef(onSearchResult);
  onSearchResultRef.current = onSearchResult;

  // Дебаунс запроса. Свободный текст: улица и/или город («Грибоедова», «грибоедова пермь»).
  useEffect(() => {
    const q = query.trim();
    const requestId = ++requestIdRef.current;
    if (q.length < 3) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data } = await apiClient.instance.get('/api/cdek/pvz', { params: { query: q } });
        if (cancelled || requestId !== requestIdRef.current) return;
        const found = Array.isArray(data) ? data : [];
        setOptions(found);
        setOpen(true);
        onSearchResultRef.current?.(found.length ? 'ok' : 'empty', { query: q, results: found.length });
      } catch {
        if (cancelled || requestId !== requestIdRef.current) return;
        setOptions([]);
        onSearchResultRef.current?.('error', { query: q, results: 0 });
      } finally {
        if (cancelled || requestId !== requestIdRef.current) return;
        setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Закрытие дропдауна по клику вне компонента.
  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handlePick = (point) => {
    onSelect({
      pvzCode: point.code,
      pvzCity: point.city ?? '',
      pvzStreet: point.address ?? point.fullAddress ?? '',
    });
    setQuery('');
    setOptions([]);
    setOpen(false);
  };

  if (selected) {
    return (
      <div className={styles.pvzSelected}>
        <div>
          <div className={styles.pvzSelectedAddr}>
            {selected.pvzStreet}
            {selected.pvzCity ? `, г. ${selected.pvzCity}` : ''}
          </div>
          <div className={styles.pvzSelectedMeta}>Пункт выдачи СДЭК · {selected.pvzCode}</div>
        </div>
        <button type="button" className={styles.pvzChange} onClick={onClear}>
          Изменить
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pvzWrap} ref={boxRef}>
      <input
        id="pvz"
        name="pvz"
        className={`${styles.input} ${invalid && touched ? styles.inputError : ''}`}
        type="text"
        placeholder="Улица или город — напр. Грибоедова"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => options.length && setOpen(true)}
        onBlur={() => setTouched(true)}
        aria-label="Поиск пункта выдачи СДЭК"
        autoComplete="off"
      />
      {open && (
        <div className={styles.pvzDropdown}>
          {loading && <div className={styles.pvzStatus}>Ищем пункты выдачи…</div>}
          {!loading && options.length === 0 && (
            <div className={styles.pvzStatus}>Ничего не нашли. Проверьте город и адрес.</div>
          )}
          {!loading &&
            options.map((point) => (
              <div
                key={point.code}
                className={styles.pvzOption}
                role="button"
                tabIndex={0}
                onClick={() => handlePick(point)}
                onKeyDown={(e) => e.key === 'Enter' && handlePick(point)}
              >
                <div className={styles.pvzOptionAddr}>
                  {point.address ?? point.fullAddress}
                  {point.city ? `, г. ${point.city}` : ''}
                </div>
                {point.workTime && <div className={styles.pvzOptionMeta}>{point.workTime}</div>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default PvzSelect;

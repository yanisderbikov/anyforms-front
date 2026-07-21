import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './OrderGallery.module.css';

/**
 * Галерея фото позиции: главное фото + лента превью-квадратиков снизу.
 * Логика как на странице товара маркетплейса, но в одну колонку.
 * Все фото сразу отрисованы в превью, поэтому браузер грузит их заранее
 * и листание не ждёт сети. Свободное место вокруг фото заполняет
 * размытая копия, а не серые поля.
 */
const OrderGallery = ({ images, onDownload }) => {
  const count = images.length;
  const [idx, setIdx] = useState(0);
  const thumbsRef = useRef(null);

  // Зацикленное листание: всегда в пределах [0, count-1], не упирается в края.
  const go = useCallback(
    (delta) => {
      if (count === 0) return;
      setIdx((i) => ((i + delta) % count + count) % count);
    },
    [count],
  );

  // Сброс при смене набора фото и страховка от выхода индекса за пределы.
  useEffect(() => {
    setIdx(0);
  }, [images]);
  useEffect(() => {
    if (idx > count - 1) setIdx(0);
  }, [count, idx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go]);

  // Активное превью подъезжает в середину ленты.
  useEffect(() => {
    const container = thumbsRef.current;
    const active = container?.querySelector(`.${styles.thumbActive}`);
    if (!container || !active) return;
    container.scrollTo({
      left: active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2,
      behavior: 'smooth',
    });
  }, [idx]);

  // Свайп на тач-устройствах.
  const touchX = useRef(null);
  const onTouchStart = (e) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const current = images[Math.min(idx, count - 1)];
  if (!current) return null;

  return (
    <div className={styles.gallery}>
      <div className={styles.viewer} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img className={styles.blur} src={current.url} alt="" aria-hidden="true" />
        <img className={styles.viewerImg} src={current.url} alt={current.filename || ''} />
        {count > 1 && (
          <button className={`${styles.nav} ${styles.prev}`} onClick={() => go(-1)} aria-label="Назад">‹</button>
        )}
        {onDownload && (
          <button className={styles.download} onClick={() => onDownload(current)} title="Скачать">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            скачать
          </button>
        )}
        {count > 1 && (
          <button className={`${styles.nav} ${styles.next}`} onClick={() => go(1)} aria-label="Вперёд">›</button>
        )}
        {count > 1 && (
          <span className={styles.counter}>{Math.min(idx, count - 1) + 1} / {count}</span>
        )}
      </div>

      {count > 1 && (
        <div className={styles.thumbs} ref={thumbsRef}>
          {images.map((f, index) => (
            <button
              key={f.id ?? index}
              type="button"
              className={`${styles.thumb} ${index === idx ? styles.thumbActive : ''}`}
              onClick={() => setIdx(index)}
              onMouseEnter={() => setIdx(index)}
              aria-label={`Фото ${index + 1}`}
            >
              <img src={f.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderGallery;

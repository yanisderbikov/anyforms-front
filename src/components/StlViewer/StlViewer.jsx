import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import StlScene from './StlScene';
import ViewportControls from './ViewportControls';
import { nameFromUrl, parseStl, triangleCount, volume } from './stlGeometry';
import styles from './StlViewer.module.css';

const fmtMm = (v) => `${v.toFixed(v < 10 ? 2 : 1)} мм`;

const buildModel = (buffer, name) => {
  const { geometry, size } = parseStl(buffer);
  return {
    geometry,
    name,
    size,
    triangles: triangleCount(geometry),
    volumeCm3: volume(geometry) / 1000, // STL в 3D-печати всегда в мм → мм³ в см³
  };
};

const StlViewer = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState(null); // 'loading' | null
  const [error, setError] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fileInput = useRef(null);
  const controlsRef = useRef(null);
  const stageRef = useRef(null);
  // Отменяет применение результата, если пока грузили — открыли другую модель.
  const loadId = useRef(0);

  const loadFromUrl = useCallback(async (url) => {
    const id = ++loadId.current;
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`сервер ответил ${res.status}`);
      const buffer = await res.arrayBuffer();
      const next = buildModel(buffer, nameFromUrl(url));
      if (id !== loadId.current) return;
      setModel(next);
      setStatus(null);
    } catch {
      if (id !== loadId.current) return;
      setStatus(null);
      // Причины разные (CORS, битая ссылка, недоступный хост), но действие
      // у пользователя одно, поэтому не грузим его подробностями.
      setError('Не получилось открыть файл по ссылке. Скачайте его и нажмите «выбрать с устройства».');
    }
  }, []);

  const loadFromFile = useCallback(async (file) => {
    const id = ++loadId.current;
    setStatus('loading');
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const next = buildModel(buffer, file.name);
      if (id !== loadId.current) return;
      setModel(next);
      setStatus(null);
      setParams({}, { replace: true });
    } catch {
      if (id !== loadId.current) return;
      setStatus(null);
      setError('Не получилось прочитать файл. Нужен .stl — обычный или бинарный.');
    }
  }, [setParams]);

  // Ссылка живёт в ?url=, чтобы вьювер можно было переслать как есть.
  const urlParam = params.get('url');
  useEffect(() => {
    if (urlParam) loadFromUrl(urlParam);
  }, [urlParam, loadFromUrl]);

  // Полный экран держится на CSS: в iOS Safari на iPhone нативного fullscreen
  // для обычных элементов нет вовсе. Нативный вызываем сверху, где он есть, —
  // на Android он дополнительно прячет адресную строку.
  const toggleFullscreen = useCallback(() => {
    const stage = stageRef.current;
    const next = !fullscreen;
    setFullscreen(next);
    if (next) {
      const request = stage?.requestFullscreen || stage?.webkitRequestFullscreen;
      try {
        request?.call(stage)?.catch?.(() => {});
      } catch {
        /* нативный режим необязателен */
      }
    } else if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      try {
        exit?.call(document)?.catch?.(() => {});
      } catch {
        /* уже вышли */
      }
    }
  }, [fullscreen]);

  // Выход по Escape и по системной кнопке выхода из нативного полноэкранного.
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    const onNativeChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onNativeChange);
    document.addEventListener('webkitfullscreenchange', onNativeChange);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onNativeChange);
      document.removeEventListener('webkitfullscreenchange', onNativeChange);
    };
  }, [fullscreen]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFromFile(file);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span
            className={styles.logoLink}
            onClick={() => navigate('/')}
            role="button"
            aria-label="anyforms"
          >
            <img
              className={styles.logo}
              src="/anyforms_logo_new_white.svg"
              alt=""
              width={180}
              height={41}
              decoding="async"
            />
          </span>
        </div>
      </header>

      <div className={styles.page}>
        <div className={styles.head}>
          <h1 className={styles.title}>просмотр 3d-модели</h1>
          <button className={styles.pick} type="button" onClick={() => fileInput.current?.click()}>
            выбрать с устройства
          </button>
          {/* Без accept: у .stl нет своего MIME-типа, мобильные пикеры отдают
              его как application/octet-stream и с фильтром файл не выбрать.
              Проверяем при разборе. */}
          <input
            ref={fileInput}
            className={styles.hidden}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFromFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div
          ref={stageRef}
          className={`${styles.stage} ${dragging ? styles.stageDrag : ''} ${
            fullscreen ? styles.stageFull : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {model && (
            <StlScene
              geometry={model.geometry}
              maxDim={Math.max(model.size.x, model.size.y, model.size.z)}
              resetKey={resetKey}
              controlsRef={controlsRef}
            />
          )}

          {status === 'loading' && <div className={styles.overlay}>загружаем модель…</div>}

          {!model && status !== 'loading' && (
            <div className={styles.overlay}>
              выберите .stl с устройства или перетащите его сюда
            </div>
          )}

          {model && (
            <ViewportControls
              controlsRef={controlsRef}
              onReset={() => setResetKey((k) => k + 1)}
              fullscreen={fullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          )}
        </div>

        {model && (
          <div className={styles.info}>
            <span className={styles.name}>{model.name}</span>
            <span>
              {fmtMm(model.size.x)} × {fmtMm(model.size.y)} × {fmtMm(model.size.z)}
            </span>
            <span>объём ≈ {model.volumeCm3.toFixed(2)} см³</span>
            <span>{model.triangles.toLocaleString('ru-RU')} треугольников</span>
          </div>
        )}

        <p className={styles.hint}>
          Крутить — левая кнопка мыши или кнопки на окне просмотра, приблизить — колесо,
          двигать — правая кнопка или два пальца. Размеры считаются в миллиметрах: в STL нет
          единиц измерения, а слайсеры трактуют их как мм.
        </p>

        <footer className={styles.footer}>
          <Link className={styles.footerLink} to="/shop">
            магазин молдов
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default StlViewer;

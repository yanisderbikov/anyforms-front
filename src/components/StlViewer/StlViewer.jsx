import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [input, setInput] = useState(params.get('url') || '');
  const [model, setModel] = useState(null);
  const [status, setStatus] = useState(null); // 'loading' | null
  const [error, setError] = useState(null);
  const [wireframe, setWireframe] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef(null);
  const controlsRef = useRef(null);
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
      setInput('');
      setParams({}, { replace: true });
    } catch (e) {
      if (id !== loadId.current) return;
      setStatus(null);
      setError(`не удалось разобрать файл: ${e.message}`);
    }
  }, [setParams]);

  // Ссылка живёт в ?url=, чтобы вьювер можно было переслать как есть.
  const urlParam = params.get('url');
  useEffect(() => {
    if (urlParam) loadFromUrl(urlParam);
  }, [urlParam, loadFromUrl]);

  const onSubmit = (e) => {
    e.preventDefault();
    const url = input.trim();
    if (!url) return;
    if (url === urlParam) loadFromUrl(url);
    else setParams({ url }, { replace: true });
  };

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
        <h1 className={styles.title}>просмотр 3d-модели</h1>

        <form className={styles.form} onSubmit={onSubmit}>
          <input
            className={styles.url}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ссылка на .stl — enter, чтобы открыть"
            spellCheck={false}
          />
          <button className={styles.pick} type="button" onClick={() => fileInput.current?.click()}>
            выбрать с устройства
          </button>
          <input
            ref={fileInput}
            className={styles.hidden}
            type="file"
            accept=".stl,model/stl"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) loadFromFile(file);
              e.target.value = '';
            }}
          />
        </form>

        {error && <div className={styles.error}>{error}</div>}

        <div
          className={`${styles.stage} ${dragging ? styles.stageDrag : ''}`}
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
              wireframe={wireframe}
              resetKey={resetKey}
              controlsRef={controlsRef}
            />
          )}

          {status === 'loading' && <div className={styles.overlay}>загружаем модель…</div>}

          {!model && status !== 'loading' && (
            <div className={styles.overlay}>
              вставьте ссылку на .stl, выберите файл с устройства или перетащите его сюда
            </div>
          )}

          {model && (
            <ViewportControls
              controlsRef={controlsRef}
              onReset={() => setResetKey((k) => k + 1)}
              wireframe={wireframe}
              onToggleWireframe={() => setWireframe((v) => !v)}
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
      </div>
    </div>
  );
};

export default StlViewer;

import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './StlViewer.module.css';

const ORBIT_STEP = 0.11; // рад за одно нажатие, ~6°
const ZOOM_STEP = 1.14;
const MIN_PHI = 0.05; // не даём камере пройти сквозь полюс

/**
 * Кнопка с автоповтором: клик — один шаг, зажатие — плавное движение.
 * Первый шаг полный, повторы мельче, иначе удержание рвёт картинку.
 */
const HoldButton = ({ onAct, label, className, children }) => {
  const timer = useRef(null);

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const start = (e) => {
    e.preventDefault();
    onAct(1);
    stop();
    timer.current = setInterval(() => onAct(0.35), 40);
  };

  return (
    <button
      type="button"
      className={className}
      title={label}
      aria-label={label}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onBlur={stop}
    >
      {children}
    </button>
  );
};

const Icon = ({ d, rotate = 0 }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: `rotate(${rotate}deg)` }}>
    <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CHEVRON = 'M15 5l-7 7 7 7';
const PLUS = 'M12 6v12M6 12h12';
const MINUS = 'M6 12h12';
const RESET = 'M4 4v6h6M20 20v-6h-6M20 10a8 8 0 00-14-3M4 14a8 8 0 0014 3';
const MESH = 'M4 9h16M4 15h16M9 4v16M15 4v16';

/**
 * Панель управления камерой поверх канваса: вращение, зум, сброс, каркас.
 * Двигает ту же OrbitControls, что и мышь, — состояние не расходится.
 */
const ViewportControls = ({ controlsRef, onReset, wireframe, onToggleWireframe }) => {
  const orbit = useCallback(
    (dTheta, dPhi) => (k) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const camera = controls.object;
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += dTheta * ORBIT_STEP * k;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi + dPhi * ORBIT_STEP * k,
        MIN_PHI,
        Math.PI - MIN_PHI,
      );
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      controls.update();
    },
    [controlsRef],
  );

  const zoom = useCallback(
    (direction) => (k) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const camera = controls.object;
      const offset = camera.position.clone().sub(controls.target);
      const factor = ZOOM_STEP ** (direction * k);
      const distance = THREE.MathUtils.clamp(
        offset.length() * factor,
        Math.max(controls.minDistance, 1e-3),
        Number.isFinite(controls.maxDistance) ? controls.maxDistance : Infinity,
      );
      camera.position.copy(controls.target).add(offset.setLength(distance));
      controls.update();
    },
    [controlsRef],
  );

  return (
    <>
      <div className={styles.pad}>
        <HoldButton className={styles.padUp} onAct={orbit(0, -1)} label="Повернуть вверх">
          <Icon d={CHEVRON} rotate={90} />
        </HoldButton>
        <HoldButton className={styles.padLeft} onAct={orbit(-1, 0)} label="Повернуть влево">
          <Icon d={CHEVRON} />
        </HoldButton>
        <button
          type="button"
          className={styles.padCenter}
          onClick={onReset}
          title="Сбросить вид"
          aria-label="Сбросить вид"
        >
          <Icon d={RESET} />
        </button>
        <HoldButton className={styles.padRight} onAct={orbit(1, 0)} label="Повернуть вправо">
          <Icon d={CHEVRON} rotate={180} />
        </HoldButton>
        <HoldButton className={styles.padDown} onAct={orbit(0, 1)} label="Повернуть вниз">
          <Icon d={CHEVRON} rotate={-90} />
        </HoldButton>
      </div>

      <div className={styles.zoom}>
        <HoldButton className={styles.zoomBtn} onAct={zoom(-1)} label="Приблизить">
          <Icon d={PLUS} />
        </HoldButton>
        <HoldButton className={styles.zoomBtn} onAct={zoom(1)} label="Отдалить">
          <Icon d={MINUS} />
        </HoldButton>
        <button
          type="button"
          className={`${styles.zoomBtn} ${wireframe ? styles.zoomBtnOn : ''}`}
          onClick={onToggleWireframe}
          title="Каркас"
          aria-label="Каркас"
        >
          <Icon d={MESH} />
        </button>
      </div>
    </>
  );
};

export default ViewportControls;

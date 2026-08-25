import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Grid, OrbitControls } from '@react-three/drei';

// Стартовый ракурс: одинаковый угол по всем трём осям — классическая изометрия,
// модель видно сверху-сбоку. Задаём направление явно, а не «куда смотрела камера»:
// иначе для высокой детали центр модели оказывается выше камеры и вид уходит под пол.
const VIEW_DIR = new THREE.Vector3(1, 1, 1).normalize();

/**
 * Ставит камеру так, чтобы модель целиком попадала в кадр, и наводит на неё
 * орбитальный центр. Повторяется при смене модели и по кнопке «сбросить вид».
 */
// По горизонтали кадр может быть уже вертикального — берём тот угол,
// который ограничивает сильнее, иначе широкая деталь вылезет за края.
const fitDistance = (camera, size, radius) => {
  const aspect = size.width / size.height;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  return (radius / Math.sin(Math.min(vFov, hFov) / 2)) * 1.15;
};

const FitCamera = ({ target, resetKey, geometry }) => {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls);

  const fit = useCallback(() => {
    const object = target.current;
    if (!object) return;
    const sphere = new THREE.Box3()
      .setFromObject(object)
      .getBoundingSphere(new THREE.Sphere());
    if (!Number.isFinite(sphere.radius) || sphere.radius === 0) return;

    const distance = fitDistance(camera, size, sphere.radius);

    camera.position.copy(sphere.center).addScaledVector(VIEW_DIR, distance);
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(sphere.center);
      controls.update();
    } else {
      camera.lookAt(sphere.center);
    }
  }, [camera, controls, size.width, size.height, target]);

  // Ресайз окна намеренно не фитит заново — иначе он сбрасывал бы ракурс,
  // который пользователь только что выставил мышью.
  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, resetKey, controls]);

  return null;
};

// Базовый поворот Z-up (STL) → Y-up (сцена); дополнительная ориентация
// от кнопок осей накладывается поверх него внешней группой.
const R_INNER = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
const _m = new THREE.Matrix4();
const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _dir = new THREE.Vector3();

/**
 * Позиция группы, при которой повёрнутая модель стоит на полу по центру сцены.
 * Bounding box считается по 8 углам исходного бокса — для поворотов на 90°
 * это точный габарит, для промежуточных кадров анимации — достаточный.
 */
const groundModel = (geometry, quaternion, out) => {
  _m.makeRotationFromQuaternion(quaternion).multiply(R_INNER);
  _box.copy(geometry.boundingBox).applyMatrix4(_m);
  out.set(-(_box.min.x + _box.max.x) / 2, -_box.min.y, -(_box.min.z + _box.max.z) / 2);
};

/**
 * Группа модели, докручивающаяся к заданной ориентации в кадровом цикле,
 * а не скачком через состояние: так виден сам поворот и понятно, куда ушла
 * модель. После каждого шага модель заново ставится на пол, а камера
 * подгоняет центр орбиты и дистанцию — направление взгляда при этом
 * сохраняется, поэтому вставшая «в рост» деталь не вылезает за кадр.
 */
const OrientedModel = ({ geometry, orientation, groupRef, controlsRef, children }) => {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  // Новая модель встаёт в текущую ориентацию сразу, без анимации.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.quaternion.copy(orientation);
    groundModel(geometry, group.quaternion, group.position);
    // Смену самой ориентации анимирует useFrame ниже.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, groupRef]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const angle = group.quaternion.angleTo(orientation);
    if (angle < 1e-4) return;
    if (angle < 0.02) group.quaternion.copy(orientation);
    else group.quaternion.slerp(orientation, Math.min(1, 1 - Math.exp(-14 * delta)));
    groundModel(geometry, group.quaternion, group.position);

    const controls = controlsRef.current;
    if (!controls) return;
    // Модель после groundModel стоит на полу по центру: сфера — над началом
    // координат, радиус — полдиагонали текущего бокса (_box заполнен там же).
    const w = _box.max.x - _box.min.x;
    const h = _box.max.y - _box.min.y;
    const d = _box.max.z - _box.min.z;
    _center.set(0, h / 2, 0);
    _dir.copy(camera.position).sub(controls.target).normalize();
    camera.position
      .copy(_center)
      .addScaledVector(_dir, fitDistance(camera, size, Math.hypot(w, h, d) / 2));
    controls.target.copy(_center);
    controls.update();
  });

  return <group ref={groupRef}>{children}</group>;
};

/**
 * Сцена вьювера: модель на сетке, орбитальная камера, свет без внешних ассетов
 * (drei Environment тянет HDR с CDN — здесь это не нужно).
 * STL приходит Z-вверх, сцена Y-вверх, поэтому группа повёрнута на -90° по X.
 * controlsRef отдаётся наружу: кнопки панели управления двигают камеру сами.
 */
const StlScene = ({ geometry, maxDim, resetKey, controlsRef, orientation }) => {
  const modelRef = useRef(null);

  // Шаг сетки подстраивается под габарит модели: круглый порядок величины,
  // иначе для детали в 200 мм и в 5 мм нужна разная клетка.
  const section = Math.max(10 ** Math.round(Math.log10(Math.max(maxDim, 1e-3) / 2)), 1e-3);

  return (
    <Canvas camera={{ fov: 45, near: 0.01, far: 100000 }} dpr={[1, 2]}>
      <color attach="background" args={['#f4f4f6']} />
      <ambientLight intensity={0.75} />
      <hemisphereLight args={['#ffffff', '#d7d9de', 0.8]} />
      <directionalLight position={[4, 8, 5]} intensity={2.1} />
      <directionalLight position={[-6, 3, -4]} intensity={0.7} />

      <OrientedModel
        geometry={geometry}
        orientation={orientation}
        groupRef={modelRef}
        controlsRef={controlsRef}
      >
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={geometry}>
            <meshStandardMaterial color="#9aa2ae" metalness={0.1} roughness={0.55} flatShading />
          </mesh>
        </group>
      </OrientedModel>

      <ContactShadows
        position={[0, 0, 0]}
        scale={maxDim * 3}
        far={maxDim}
        blur={2.4}
        opacity={0.35}
        color="#5b6270"
      />

      <Grid
        infiniteGrid
        cellSize={section / 5}
        cellColor="#dcdde1"
        sectionSize={section}
        sectionColor="#c3c5cc"
        fadeDistance={maxDim * 12}
        fadeStrength={2}
        position={[0, -maxDim * 0.001, 0]}
      />

      <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.1} />
      <FitCamera target={modelRef} geometry={geometry} resetKey={resetKey} />
    </Canvas>
  );
};

export default StlScene;

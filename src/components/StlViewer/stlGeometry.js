import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const loader = new STLLoader();

/**
 * Разбирает ArrayBuffer c ASCII- или binary-STL в геометрию, готовую к показу:
 * нормали пересчитаны, модель отцентрована по XY и поставлена на пол (min Z = 0).
 * Поворот Z-up → Y-up делает сцена, чтобы метрики считались в исходных осях STL.
 */
export const parseStl = (buffer) => {
  const geometry = loader.parse(buffer);
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -box.min.z);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return { geometry, size };
};

/** Число треугольников: STLLoader отдаёт неиндексированную геометрию. */
export const triangleCount = (geometry) => Math.floor(geometry.attributes.position.count / 3);

/**
 * Объём замкнутой сетки через сумму знаковых объёмов тетраэдров.
 * Для незамкнутой (битой) модели число будет приблизительным.
 */
export const volume = (geometry) => {
  const pos = geometry.attributes.position;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let total = 0;
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    total += a.dot(c.cross(b)) / 6;
  }
  return Math.abs(total);
};

/** Имя файла из URL — для подписи над вьювером. */
export const nameFromUrl = (url) => {
  try {
    const path = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(path.split('/').filter(Boolean).pop() || url);
  } catch {
    return url;
  }
};

import apiClient from '../apiClient';
import { uploadToS3 } from './uploads';

// Под-заказы (custom products). Бьём напрямую через axios-инстанс; токен добавляем сами
// (securityWorker работает только для сгенерированных вызовов apiClient.api.*).
const http = apiClient.instance;

const cfg = (extra = {}) => {
  const token = apiClient.getToken ? apiClient.getToken() : null;
  return {
    ...extra,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(extra.headers || {}) },
  };
};

// ---- Заказы под-заказа (Order, isRetail=false) ----
export const getCustomOrders = () => http.get('/api/orders/custom', cfg()).then((r) => r.data);
export const createCustomOrder = (body) =>
  http.post('/api/orders/custom', body || {}, cfg()).then((r) => r.data);
export const searchContacts = (q) =>
  http.get('/api/orders/contacts/search', cfg({ params: { q } })).then((r) => r.data);
export const getOrder = (id) => http.get(`/api/orders/${id}`, cfg()).then((r) => r.data);
export const updateOrderDeliveryMethod = (id, deliveryMethod) =>
  http.patch(`/api/orders/${id}/delivery-method`, { deliveryMethod }, cfg()).then((r) => r.data);

export const isPickup = (order) => order?.deliveryMethod === 'PICKUP';

// Жёлтая пилюля «самовывоз» — в тон IN_PRODUCTION.
export const PICKUP_BADGE_STYLE = {
  background: '#fff3cd',
  color: '#8a6d00',
  border: '1px solid rgba(138, 109, 0, 0.35)',
};

// ---- Позиции ----
export const getAllCustomItems = (status) =>
  http.get('/api/custom-product-items', cfg(status ? { params: { status } } : {})).then((r) => r.data);
export const getCustomItem = (id) =>
  http.get(`/api/public/custom-product-items/${id}`, cfg()).then((r) => r.data);
export const getItemsByOrder = (orderId) =>
  http.get('/api/custom-product-items', cfg({ params: { orderId } })).then((r) => r.data);
export const createItem = (orderId, body) =>
  http.post('/api/custom-product-items', body, cfg({ params: { orderId } })).then((r) => r.data);
export const updateItem = (id, body) =>
  http.put(`/api/custom-product-items/${id}`, body, cfg()).then((r) => r.data);
export const updateItemStatus = (id, status) =>
  http.patch(`/api/custom-product-items/${id}/status`, { status }, cfg()).then((r) => r.data);
export const deleteItem = (id) =>
  http.delete(`/api/custom-product-items/${id}`, cfg()).then((r) => r.data);

// Уникальные значения «кто моделирует» — для select с автодобавлением (как в Notion).
export const getModelers = () =>
  http.get('/api/custom-product-items/modelers', cfg()).then((r) => r.data);

// ---- Файлы ----
// Файлы уходят из браузера сразу в S3 (presign → PUT → confirm), бэкенд их не проксирует.
export const addItemFiles = async (itemId, files) => {
  const refs = [];
  for (const f of Array.from(files)) {
    const { uploadUrl, key } = await http
      .post(
        `/api/custom-product-items/${itemId}/files/presign`,
        { filename: f.name, contentType: f.type || null },
        cfg()
      )
      .then((r) => r.data);
    await uploadToS3(uploadUrl, f);
    refs.push({ key, filename: f.name });
  }
  return http
    .post(`/api/custom-product-items/${itemId}/files/confirm`, { files: refs }, cfg())
    .then((r) => r.data);
};
export const deleteFile = (fileId) =>
  http.delete(`/api/custom-product-files/${fileId}`, cfg()).then((r) => r.data);

export const CUSTOM_STATUS_LABELS = {
  MODELING: 'Моделирование',
  IN_PRODUCTION: 'В производстве',
  READY_TO_SHIP: 'Готов к отправке',
  DELIVERING: 'Доставляется',
  COMPLETED: 'Завершен',
};

// Цвет пилюли по статусу: моделирование — зелёный, производство — жёлтый, к отправке — красный,
// доставляется — синий, завершен — серый. Рамка в тон, чтобы пилюля не сливалась с фоном.
export const CUSTOM_STATUS_STYLE = {
  MODELING: { background: '#d6f5dd', color: '#1b7a33', border: '1px solid rgba(27, 122, 51, 0.35)' },
  IN_PRODUCTION: { background: '#fff3cd', color: '#8a6d00', border: '1px solid rgba(138, 109, 0, 0.35)' },
  READY_TO_SHIP: { background: '#ffd9d9', color: '#b71c1c', border: '1px solid rgba(183, 28, 28, 0.35)' },
  DELIVERING: { background: '#d9e8ff', color: '#1a56b0', border: '1px solid rgba(26, 86, 176, 0.35)' },
  COMPLETED: { background: '#e5e5ea', color: '#555', border: '1px solid rgba(85, 85, 85, 0.4)' },
};

// Группы «к отправке» и «доставляются» (по заказу) и отгрузка.
export const getReadyToShipGroups = () =>
  http.get('/api/custom-product-items/ready-to-ship', cfg()).then((r) => r.data);
export const getInDeliveryGroups = () =>
  http.get('/api/custom-product-items/in-delivery', cfg()).then((r) => r.data);
export const shipOrder = (orderId, tracker) =>
  http.post('/api/custom-product-items/ship', { orderId, tracker: tracker || null }, cfg()).then((r) => r.data);
export const completeOrder = (orderId) =>
  http.post(`/api/custom-product-items/complete/${orderId}`, null, cfg()).then((r) => r.data);

export const CUSTOM_STATUSES = [
  { value: 'MODELING', label: 'Моделирование' },
  { value: 'IN_PRODUCTION', label: 'В производстве' },
  { value: 'READY_TO_SHIP', label: 'Готов к отправке' },
];

// Статусы для фильтра «в работе»: рабочие + доставка. Завершённые подгружаются с бэка отдельно.
export const CUSTOM_FILTER_STATUSES = [
  ...CUSTOM_STATUSES,
  { value: 'DELIVERING', label: 'Доставляется' },
  { value: 'COMPLETED', label: 'Завершен' },
];

// Статусы, доступные при редактировании позиции: рабочие + завершение.
// В «Доставляется» руками не переводим — только через трекер.
export const CUSTOM_EDIT_STATUSES = [
  ...CUSTOM_STATUSES,
  { value: 'COMPLETED', label: 'Завершен' },
];

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif|avif)(\?|$)/i;

export const isImageFile = (file) => {
  if (!file) return false;
  return IMAGE_RE.test(file.filename || '') || IMAGE_RE.test(file.url || '');
};

export const fileExt = (file) => {
  const name = file?.filename || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : 'FILE';
};

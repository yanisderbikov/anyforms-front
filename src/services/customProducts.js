import apiClient from '../apiClient';

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
export const getOrder = (id) => http.get(`/api/orders/${id}`, cfg()).then((r) => r.data);

// ---- Позиции ----
export const getAllCustomItems = () =>
  http.get('/api/custom-product-items', cfg()).then((r) => r.data);
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

// ---- Файлы ----
export const addItemFiles = (itemId, files) => {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('files', f));
  return http
    .post(`/api/custom-product-items/${itemId}/files`, fd, cfg({ headers: { 'Content-Type': 'multipart/form-data' } }))
    .then((r) => r.data);
};
export const deleteFile = (fileId) =>
  http.delete(`/api/custom-product-files/${fileId}`, cfg()).then((r) => r.data);

export const CUSTOM_STATUS_LABELS = {
  MODELING: 'Моделирование',
  IN_PRODUCTION: 'В производстве',
  READY_TO_SHIP: 'Готов к отправке',
};

// Цвет пилюли по статусу: моделирование — зелёный, производство — жёлтый, к отправке — красный.
export const CUSTOM_STATUS_STYLE = {
  MODELING: { background: '#d6f5dd', color: '#1b7a33' },
  IN_PRODUCTION: { background: '#fff3cd', color: '#8a6d00' },
  READY_TO_SHIP: { background: '#ffd9d9', color: '#b71c1c' },
};

export const CUSTOM_STATUSES = [
  { value: 'MODELING', label: 'Моделирование' },
  { value: 'IN_PRODUCTION', label: 'В производстве' },
  { value: 'READY_TO_SHIP', label: 'Готов к отправке' },
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

import apiClient from '../../apiClient';
import { authHeaders } from '../AdminInvoices/invoiceShared';

// Админка дрип-кампании SalesBot (только ADMIN): /api/salesbot/admin/**.
const BASE = '/api/salesbot/admin';

const withAuth = (extra = {}) => ({ headers: authHeaders(), ...extra });

export const fetchOrderTypes = () =>
  apiClient.instance.get(`${BASE}/order-types`, withAuth()).then((r) => r.data);

export const fetchSalesbotConfig = () =>
  apiClient.instance.get(`${BASE}/config`, withAuth()).then((r) => r.data);

// SalesBot'ы аккаунта amoCRM (id + name); refresh=true перечитывает из amoCRM, минуя кэш бэка.
export const fetchSalesbots = (refresh = false) =>
  apiClient.instance
    .get(`${BASE}/bots`, withAuth({ params: refresh ? { refresh: true } : undefined }))
    .then((r) => (Array.isArray(r.data) ? r.data : []));

export const createFunnel = (payload) =>
  apiClient.instance.post(`${BASE}/funnels`, payload, withAuth()).then((r) => r.data);

export const updateFunnel = (id, payload) =>
  apiClient.instance.put(`${BASE}/funnels/${id}`, payload, withAuth()).then((r) => r.data);

export const deleteFunnel = (id) => apiClient.instance.delete(`${BASE}/funnels/${id}`, withAuth());

// Воронки аккаунта amoCRM со статусами (id + name); refresh=true перечитывает, минуя кэш бэка.
export const fetchPipelines = (refresh = false) =>
  apiClient.instance
    .get(`${BASE}/pipelines`, withAuth({ params: refresh ? { refresh: true } : undefined }))
    .then((r) => (Array.isArray(r.data) ? r.data : []));

// Бот добавляется в конец цепочки: payload = { type, botId }, позицию назначает бэк.
export const createStep = (payload) =>
  apiClient.instance.post(`${BASE}/steps`, payload, withAuth()).then((r) => r.data);

// Замена бота на шаге: payload = { botId }; позиция не меняется.
export const updateStep = (id, payload) =>
  apiClient.instance.put(`${BASE}/steps/${id}`, payload, withAuth()).then((r) => r.data);

// Сдвиг шага на одну позицию: direction = 'UP' | 'DOWN'. Возвращает цепочку типа после сдвига.
export const moveStep = (id, direction) =>
  apiClient.instance.post(`${BASE}/steps/${id}/move`, null, withAuth({ params: { direction } })).then((r) => r.data);

export const deleteStep = (id) => apiClient.instance.delete(`${BASE}/steps/${id}`, withAuth());

// Ручной массовый запуск бота по воронке/статусу.
export const fetchManualRuns = () =>
  apiClient.instance.get(`${BASE}/manual-runs`, withAuth()).then((r) => (Array.isArray(r.data) ? r.data : []));

export const previewManualRun = (params) =>
  apiClient.instance.get(`${BASE}/manual-runs/preview`, withAuth({ params })).then((r) => r.data);

export const startManualRun = (payload) =>
  apiClient.instance.post(`${BASE}/manual-runs`, payload, withAuth()).then((r) => r.data);

export const RUN_STATUS_LABELS = {
  RUNNING: 'идёт',
  DONE: 'завершён',
  FAILED: 'ошибка',
};

// from/to — календарные дни YYYY-MM-DD по Москве; undefined — без границы.
export const fetchSalesbotAnalytics = (params) =>
  apiClient.instance.get(`${BASE}/analytics`, withAuth({ params })).then((r) => r.data);

export const fetchSalesbotLogs = (params) =>
  apiClient.instance.get(`${BASE}/logs`, withAuth({ params })).then((r) => r.data);

export const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

export const STATUS_LABELS = {
  SUCCESS: 'запущен',
  FAILED: 'не запущен',
  MESSAGE_SEND_FAILED: 'не доставлено',
};

export const amoLeadUrl = (leadId) => `https://anyforms.amocrm.ru/leads/detail/${leadId}`;

export const amoPipelineUrl = (pipelineId) => `https://anyforms.amocrm.ru/leads/pipeline/${pipelineId}/`;

// Карты id → название по списку воронок: { pipelines: {...}, statuses: {...} }.
export const pipelineNameMaps = (pipelines) => {
  const maps = { pipelines: {}, statuses: {} };
  pipelines.forEach((p) => {
    if (p.name) maps.pipelines[p.id] = p.name;
    (p.statuses || []).forEach((s) => {
      if (s.name) maps.statuses[s.id] = s.name;
    });
  });
  return maps;
};

// Подпись бота: имя из amoCRM, если известно, иначе только id.
export const botLabel = (botId, botName) => (botName ? `${botName} · ${botId}` : String(botId));

// Список ботов по алфавиту названий (без названия — в конец).
export const sortBots = (bots) =>
  [...bots].sort((a, b) => {
    if (!a.name && !b.name) return a.id - b.id;
    if (!a.name) return 1;
    if (!b.name) return -1;
    return a.name.localeCompare(b.name, 'ru');
  });

// Положительное целое из инпута (ID воронки/статуса/бота, позиция); иначе null.
export const parsePositiveInt = (value) => {
  const trimmed = String(value ?? '').trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

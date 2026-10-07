import apiClient from '../apiClient';
import { uploadToS3 } from './uploads';

const http = apiClient.instance;
const BASE = '/api/order-calculator';

const cfg = (extra = {}) => {
  const token = apiClient.getToken ? apiClient.getToken() : null;
  return {
    ...extra,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(extra.headers || {}) },
  };
};

export const errorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.message || fallback;

export const getCalculatorOptions = () => http.get(`${BASE}/options`, cfg()).then((r) => r.data);

export const calculateOrder = (request, signal) =>
  http.post(`${BASE}/calculate`, request, cfg({ signal })).then((r) => r.data);

export const getCalculatorRates = () => http.get(`${BASE}/rates`, cfg()).then((r) => r.data);

export const updateCalculatorRates = (rates) => http.put(`${BASE}/rates`, rates, cfg()).then((r) => r.data);

export const getCalculatorRatesHistory = (limit = 20) =>
  http.get(`${BASE}/rates/history`, cfg({ params: { limit } })).then((r) => r.data);

export const getCalculations = (q, limit = 100) =>
  http.get(`${BASE}/calculations`, cfg({ params: { q: q || undefined, limit } })).then((r) => r.data);

export const getCalculation = (id) => http.get(`${BASE}/calculations/${id}`, cfg()).then((r) => r.data);

export const saveCalculation = (request) => http.post(`${BASE}/calculations`, request, cfg()).then((r) => r.data);

export const deleteCalculation = (id) => http.delete(`${BASE}/calculations/${id}`, cfg());

export const requestAiSuggestion = (body) => http.post(`${BASE}/ai-suggestion`, body, cfg()).then((r) => r.data);

export const getReferenceUrls = (keys) =>
  keys.length ? http.post(`${BASE}/references/urls`, keys, cfg()).then((r) => r.data) : Promise.resolve({});

export const uploadReference = async (file) => {
  const { data } = await http.post(
    `${BASE}/references/presign`,
    { filename: file.name, contentType: file.type || null },
    cfg()
  );
  await uploadToS3(data.uploadUrl, file);
  return { key: data.key, filename: file.name };
};

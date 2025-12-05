import { apiClient } from '../shared/api';

/**
 * Get orders without tracker
 * @returns {Promise<Array>} Array of orders
 */
export const getOrdersWithoutTracker = async () => {
  try {
    const response = await apiClient.api.getOrdersWithoutTracker();
    // Axios возвращает данные в response.data
    // Если API возвращает массив напрямую, используем его
    // Если обернут в объект, извлекаем нужное поле
    const data = response.data;
    // Проверяем, является ли data массивом
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Set tracker for an order
 * @param {number} leadId - Lead ID
 * @param {string} tracker - Tracker number
 * @returns {Promise<Object>} API response
 */
export const setTracker = async (leadId, tracker, comment) => {
  try {
    const response = await apiClient.api.setTrackerAndComment({ leadId, tracker, comment });
    return response.data;
  } catch (error) {
    console.error('Error setting tracker:', error);
    // Axios оборачивает ошибки, извлекаем данные из ответа если есть
    if (error.response) {
      throw new Error(error.response.data?.error || 'Ошибка при установке трекера');
    }
    throw error;
  }
};

/**
 * Sync order from AmoCRM
 * @param {number} leadId - Lead ID
 * @returns {Promise<Object>} API response
 */
export const syncOrder = async (leadId) => {
  try {
    const response = await apiClient.api.syncOrder({ leadId });
    return response.data;
  } catch (error) {
    console.error('Error syncing order:', error);
    // Axios оборачивает ошибки, извлекаем данные из ответа если есть
    if (error.response) {
      throw new Error(error.response.data?.error || 'Ошибка при синхронизации заказа');
    }
    throw error;
  }
};

/**
 * Get delivering orders (без трекера)
 * @returns {Promise<Array>} Array of orders
 */
export const getDeliveringOrders = async () => {
  try {
    const response = await apiClient.api.getDeliveringOrders();
    const data = response.data;
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching delivering orders:', error);
    throw error;
  }
};

/**
 * Get created orders (к отправке / накладные)
 * @returns {Promise<Array>} Array of orders
 */
export const getCreatedOrders = async () => {
  try {
    const response = await apiClient.api.getCreatedOrders();
    const data = response.data;
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching created orders:', error);
    throw error;
  }
};

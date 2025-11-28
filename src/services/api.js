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
export const setTracker = async (leadId, tracker) => {
  try {
    const response = await apiClient.api.setTracker({ leadId, tracker });
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



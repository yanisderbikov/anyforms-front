import apiClient from '../apiClient';
// Вызовы api.gen: apiClient.api.* (getProducts, getProductById, getOrder и т.д.).
// Эндпоинты заказов (getOrdersWithoutTracker и др.) должны быть в OpenAPI бэка, затем: pnpm run dev-api

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
 * Retail pickup: mark order as ready for pickup (runs pickup bot in AmoCRM)
 * @param {number} leadId - Lead ID
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>} API response
 */
export const readyForPickup = async (leadId, comment = '') => {
  try {
    const token = apiClient.getToken ? apiClient.getToken() : null;
    const response = await apiClient.instance.post(
      '/api/orders/pickup-ready',
      { leadId, comment },
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking order ready for pickup:', error);
    if (error.response) {
      throw new Error(error.response.data?.error || 'Ошибка при отметке самовывоза');
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

/**
 * Super admin only: permanently delete a retail order (with its items and related records)
 * @param {number} orderId - Our order id (order.id, not leadId)
 * @returns {Promise<void>}
 */
export const deleteRetailOrder = async (orderId) => {
  try {
    const token = apiClient.getToken ? apiClient.getToken() : null;
    await apiClient.instance.delete(
      `/api/orders/${orderId}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    if (error.response) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message || error.response.data?.error;
      if (status === 403) throw new Error('Удалять заказы может только супер-админ');
      if (status === 404) throw new Error('Заказ не найден — возможно, уже удалён');
      throw new Error(serverMessage || 'Не удалось удалить заказ');
    }
    throw error;
  }
};

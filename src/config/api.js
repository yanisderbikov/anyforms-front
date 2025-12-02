// API configuration
// Determines which API endpoint to use based on environment

const getApiBaseUrl = () => {
  // Если задана переменная окружения, используем её (приоритет)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Проверяем hostname для определения окружения
  // Если мы не на localhost, значит это production
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://anyforms-production.up.railway.app';
  }
  
  // Development mode
  return 'http://localhost:8090';
};

export const API_BASE_URL = getApiBaseUrl();




// API configuration
// Determines which API endpoint to use based on environment

const getApiBaseUrl = () => {
  // Check if we're in production (GitHub Pages)
  if (process.env.NODE_ENV === 'production') {
    return 'https://anyforms-production.up.railway.app';
  }
  // Development mode
  return 'http://localhost:8090';
};

export const API_BASE_URL = getApiBaseUrl();




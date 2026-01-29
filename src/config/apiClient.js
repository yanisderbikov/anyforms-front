import { Api } from '../shared/api/api.gen.ts';
import { API_BASE_URL } from './api';

const apiClient = new Api({
  baseURL: API_BASE_URL,
  securityWorker: (securityData) => {
    if (securityData?.token) {
      return {
        headers: {
          Authorization: `Bearer ${securityData.token}`,
        },
      };
    }
    return {};
  },
});

export default apiClient;

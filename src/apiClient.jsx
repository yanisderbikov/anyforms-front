import { Api } from './shared/api/api.gen.ts';
import config from './config';
import { jwtDecode } from 'jwt-decode';

// Храним JWT в localStorage (без куки)
export const jwt_key = 'jwt_authentication';

const getStoredToken = () => {
    try {
        return localStorage.getItem(jwt_key);
    } catch {
        return null;
    }
};

const setStoredToken = (token) => {
    try {
        if (token) {
            localStorage.setItem(jwt_key, token);
        } else {
            localStorage.removeItem(jwt_key);
        }
    } catch (e) {
        console.warn('localStorage unavailable', e);
    }
};

// Функция, которая будет добавлять токен в каждый запрос
const securityWorker = (securityData) => {
    const token = getStoredToken();
    if (token) {
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }
    return {};
};

// Инициализируем API-клиент с базовым URL и securityWorker (без withCredentials)
const apiClient = new Api({
    baseURL: config.apiUrl,
    securityWorker,
});

apiClient.instance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

// Добавляем метод для установки JWT токена
apiClient.setToken = (token) => {
    setStoredToken(token);
    apiClient.setSecurityData(token);
};

// Добавляем метод для получения JWT токена
apiClient.getToken = () => getStoredToken();

// Очистка токена (логаут)
apiClient.clearToken = () => {
    setStoredToken(null);
    apiClient.setSecurityData(null);
};

apiClient.getJwtMetadata = () => {
    const token = getStoredToken();
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);

        return {
            role: decoded.role || null,
            tempUser: decoded.temp_user || false,
            raw: decoded, // если хочешь посмотреть полный токен
        };
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};

apiClient.instance.interceptors.response.use(
    (response) => {
        // Логируем успешный ответ
        console.log('Successful Response:', {
            status: response.status,
            data: response.data,
            headers: response.headers,
            config: response.config,
        });

        // Успешный ответ просто возвращается
        return response;
    },
    (error) => {
        if (error.response) {
            // Логируем ошибочный ответ
            console.error(`response  ${JSON.stringify(error.response, null, 2)}`)

            console.error('Error Response:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers,
                config: error.response.config,
            });
            const { data } = error.response;

            // Проверяем, есть ли в ошибочном ответе action с redirect_to_url
            if (data && data.type === 'REDIRECT' && data.url) {
                console.log('Redirecting to:', data.url);
                window.location.href = data.url;
            }

            // 403 в админке — редирект на логин с запоминанием, куда шли
            const path = window.location.pathname;
            if (error.response.status === 403 && (path.startsWith('/orders') || path.startsWith('/admin'))) {
                const from = encodeURIComponent(path + window.location.search);
                window.location.href = `/login?from=${from}`;
                return;
            }

            if (error.response.status === 402) {
                console.error('402 Payment required');
                console.log('Redirecting to payment...');
                // window.location.href = '/payment'; // Локальная обработка
            }
        }

        // Прокидываем ошибку дальше для локальной обработки
        return Promise.reject(error);
    }
);

export default apiClient;

import { Api } from './shared/api/api.gen';
import config from './config.jsx';

// Инициализируем cookies
const cookies = new Cookies();
export const jwt_key = 'jwt_authentication';

// Функция, которая будет добавлять токен в каждый запрос
const securityWorker = (securityData) => {
    const token = cookies.get(jwt_key);
    if (token) {
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    }
    return {};
};

// Инициализируем API-клиент с базовым URL и securityWorker
const apiClient = new Api({
    baseURL: config.apiUrl,
    securityWorker,
    axiosConfigDefaults: {
        withCredentials: true, // Это важно для передачи cookie
    },
});

apiClient.instance.interceptors.request.use(
    (config) => {
        config.withCredentials = true; // Передаём cookie
        return config;
    },
    (error) => Promise.reject(error)
);

// Добавляем метод для установки JWT токена
apiClient.setToken = (token) => {
    cookies.remove(jwt_key);
    cookies.set(jwt_key, token);
    apiClient.setSecurityData(token);
};

// Добавляем метод для получения JWT токена
apiClient.getToken = () => {
    return cookies.get(jwt_key);
};

apiClient.getJwtMetadata = () => {
    const token = cookies.get(jwt_key);
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

import axios from 'axios';

// Dynamically resolve API URL: force Render in production, allow localhost in local development
const getApiUrl = (): string => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:4000/api';
    }
    return process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api';
};

// Initial base URL
const API_URL = getApiUrl();

// Axios instance with base URL and default headers
export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ── Request Interceptor: Attach JWT Token & Dynamically Resolve Base URL ─
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Dynamically resolve and set base URL on the client-side
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            config.baseURL = 'http://localhost:4000/api';
        } else {
            config.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api';
        }
    }
    return config;
});

// ── Response Interceptor: Handle 401 Auto-Refresh ────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const currentApiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
                        ? 'http://localhost:4000/api'
                        : (process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api');
                    const { data } = await axios.post(`${currentApiUrl}/auth/refresh`, { refreshToken });
                    localStorage.setItem('accessToken', data.data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                    originalRequest.baseURL = currentApiUrl;
                    return api(originalRequest);
                }
            } catch {
                // Refresh failed — redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;

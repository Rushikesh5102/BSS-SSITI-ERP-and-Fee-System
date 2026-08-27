import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Dynamically resolve API URL: force Render in production, allow localhost in local development
const getApiUrl = (): string => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:4000/api';
    }
    return process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api';
};

// Initial base URL
const API_URL = getApiUrl();

// ── In-Memory Fast Micro-Cache & In-Flight Request Deduplicator ────────────────
const cacheMap = new Map<string, { timestamp: number; data: any }>();
const pendingRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 6000; // 6 seconds memory cache for lightning-fast tab navigation

export const invalidateApiCache = (pattern?: string) => {
    if (!pattern) {
        cacheMap.clear();
    } else {
        cacheMap.forEach((_, key) => {
            if (key.includes(pattern)) {
                cacheMap.delete(key);
            }
        });
    }
};

// Axios instance with base URL and default headers
export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const rawToken = localStorage.getItem('accessToken');
        const token = rawToken ? rawToken.replace(/^"(.*)"$/, '$1') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Dynamically resolve and set base URL on the client-side
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            config.baseURL = 'http://localhost:4000/api';
        } else {
            config.baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api';
        }

        // Invalidate cache on mutations
        if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
            const urlPath = config.url?.split('?')[0] || '';
            const rootPath = urlPath.split('/')[1] || '';
            if (rootPath) invalidateApiCache(rootPath);
        }
    }
    return config;
});

// ── Response Interceptor: Handle 401 Auto-Refresh & JWT Rejections ────────
api.interceptors.response.use(
    (response) => {
        // Cache successful GET responses in memory
        if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
            const cacheKey = `${response.config.baseURL}${response.config.url}`;
            cacheMap.set(cacheKey, { timestamp: Date.now(), data: response.data });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh attempts on auth endpoints to prevent infinite retry loops
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

        // If 401 and not already retrying, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;
            try {
                const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
                if (refreshToken && refreshToken !== 'mock_dev_refresh_token') {
                    const currentApiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
                        ? 'http://localhost:4000/api'
                        : (process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api');
                    
                    const { data } = await axios.post(`${currentApiUrl}/auth/refresh`, { refreshToken }, { timeout: 6000 });
                    if (data?.data?.accessToken) {
                        localStorage.setItem('accessToken', data.data.accessToken);
                        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                        originalRequest.baseURL = currentApiUrl;
                        return api(originalRequest);
                    }
                }
            } catch (refreshErr) {
                console.warn('Session expired or JWT rejected by upstream gateway, clearing invalid session tokens...');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user_cache');
                    invalidateApiCache();
                    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/foundation')) {
                        window.location.href = '/login?session_expired=true';
                    }
                }
            }
        }

        return Promise.reject(error);
    }
);

// ── Ultra-Fast Cached GET Helper ─────────────────────────────────────────────
const originalGet = api.get.bind(api);
api.get = function <T = any, R = AxiosResponse<T>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R> {
    const baseURL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:4000/api'
        : (process.env.NEXT_PUBLIC_API_URL || 'https://bss-ssiti-erp-and-fee-system.onrender.com/api');
    
    const cacheKey = `${baseURL}${url}`;
    const cached = cacheMap.get(cacheKey);

    // If cache is fresh, return immediately (0ms latency)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK (Memory Cache)',
            headers: {},
            config: config || {} as any
        } as unknown as R);
    }

    // In-flight request deduplication
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
    }

    const requestPromise = originalGet(url, config).finally(() => {
        pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise as unknown as Promise<R>;
};

export default api;

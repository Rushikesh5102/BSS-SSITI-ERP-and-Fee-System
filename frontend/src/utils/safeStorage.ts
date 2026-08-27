/**
 * Safe Storage & Auto-Healing Utility
 * Protects localStorage and sessionStorage against corruption, private-browsing restrictions,
 * JSON parse crashes, and quota-exceeded errors.
 */

export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined || item === 'undefined' || item === 'null') {
        return fallback;
      }
      try {
        const parsed = JSON.parse(item);
        return parsed as T;
      } catch {
        // If it's a plain string (like a raw token or theme name) that isn't JSON-quoted, return it directly!
        return item as unknown as T;
      }
    } catch (err) {
      console.warn(`[SafeStorage] Error reading key "${key}":`, err);
      return fallback;
    }
  },

  set(key: string, value: any): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (err) {
      console.warn(`[SafeStorage] Failed to save key "${key}". Storage might be full. Cleaning temporary keys...`, err);
      // Auto-healing: Purge non-critical temporary keys if quota exceeded
      try {
        const nonCritical = ['offline_sync_queue', 'dashboard_temp_metrics', 'theme_cache'];
        nonCritical.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user_cache');
    } catch {}
  }
};

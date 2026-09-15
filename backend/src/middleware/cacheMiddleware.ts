import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
    data: any;
    expiresAt: number;
    contentType?: string;
}

const memoryCache = new Map<string, CacheEntry>();

export const cacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSavedMs: 0,
    entriesCount: 0
};

/**
 * In-Memory Response Cache Middleware for Express
 * @param ttlSeconds Time-to-live in seconds for cached responses
 * @param keyPrefix Optional prefix to categorize cache entries
 */
export const cacheResponse = (ttlSeconds: number = 30, keyPrefix: string = '') => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Only cache safe GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Allow bypassing cache via query param or header (for debugging / developer dashboard)
        if (req.headers['x-bypass-cache'] === 'true' || req.query.noCache === 'true') {
            return next();
        }

        const role = (req as any).user?.role || 'ANON';
        const branch = (req as any).user?.branchId || 'GLOBAL';
        const cacheKey = `${keyPrefix || req.baseUrl}:${role}:${branch}:${req.originalUrl}`;

        const now = Date.now();
        const cached = memoryCache.get(cacheKey);

        if (cached && cached.expiresAt > now) {
            cacheMetrics.hits++;
            cacheMetrics.totalSavedMs += 25; // Estimated roundtrip saved per cache hit
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Cache-TTL', Math.round((cached.expiresAt - now) / 1000));
            if (cached.contentType) {
                res.setHeader('Content-Type', cached.contentType);
            }
            return res.json(cached.data);
        }

        cacheMetrics.misses++;
        res.setHeader('X-Cache', 'MISS');

        // Intercept res.json to store response in cache
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            // Only cache successful 200 responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                memoryCache.set(cacheKey, {
                    data: body,
                    expiresAt: Date.now() + (ttlSeconds * 1000),
                    contentType: res.getHeader('Content-Type') as string
                });
                cacheMetrics.entriesCount = memoryCache.size;
            }
            return originalJson(body);
        };

        next();
    };
};

/**
 * Clear entries from the in-memory cache
 * @param pattern Optional string pattern to invalidate matching keys (e.g. 'reports', 'students')
 */
export const clearServerCache = (pattern?: string): number => {
    if (!pattern) {
        const count = memoryCache.size;
        memoryCache.clear();
        cacheMetrics.evictions += count;
        cacheMetrics.entriesCount = 0;
        return count;
    }

    let evicted = 0;
    for (const key of memoryCache.keys()) {
        if (key.toLowerCase().includes(pattern.toLowerCase())) {
            memoryCache.delete(key);
            evicted++;
        }
    }
    cacheMetrics.evictions += evicted;
    cacheMetrics.entriesCount = memoryCache.size;
    return evicted;
};

/**
 * Auto-invalidation middleware for mutation requests (POST, PUT, DELETE)
 * Invalidates related cache keys whenever an entity is modified
 */
export const autoInvalidateCache = (entityPrefix: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const originalSend = res.send.bind(res);
        res.send = (body: any) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Invalidate cache for this entity and dashboard reports
                clearServerCache(entityPrefix);
                clearServerCache('reports');
            }
            return originalSend(body);
        };
        next();
    };
};

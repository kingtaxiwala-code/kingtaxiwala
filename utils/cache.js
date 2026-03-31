const cache = require('memory-cache');

/**
 * Simple middleware-style cache for Express routes
 * @param {number} duration - Time in seconds to cache
 */
const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        // Skip cache for non-GET requests (safety check)
        if (req.method !== 'GET') return next();
        
        const key = '__express__' + (req.originalUrl || req.url);
        const cachedBody = cache.get(key);
        
        if (cachedBody) {
            res.setHeader('X-Cache', 'HIT');
            // Ensure content-type is set if we know it (usually JSON here)
            if (typeof cachedBody === 'string' && cachedBody.startsWith('{')) {
                res.setHeader('Content-Type', 'application/json');
            }
            return res.send(cachedBody);
        } else {
            res.setHeader('X-Cache', 'MISS');
            // Capture response
            const originalSend = res.send.bind(res);
            res.send = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache.put(key, body, duration * 1000);
                }
                return originalSend(body);
            };
            next();
        }
    };
};

/**
 * Clear specific cache keys or all route caches
 * @param {string} prefix - Key prefix to clear (e.g., '/api/reviews')
 */
const clearCache = (prefix) => {
    const keys = cache.keys();
    const searchKey = '__express__' + prefix;
    keys.forEach(key => {
        if (key.startsWith(searchKey)) {
            cache.del(key);
            console.log(`Cache cleared for: ${key}`);
        }
    });
};

module.exports = { cacheMiddleware, clearCache };

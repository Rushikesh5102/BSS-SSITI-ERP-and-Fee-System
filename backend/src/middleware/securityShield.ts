import { Request, Response, NextFunction } from 'express';

/**
 * Deep Security Shield Middleware
 * Provides comprehensive injection sanitization, XSS payload neutralization,
 * Null-byte defense, and HTTP Parameter Pollution (HPP) protection.
 */

// Recursive sanitization of strings
function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
        // Strip null-byte injections
        let clean = value.replace(/\0/g, '');

        // Neutralize dangerous script injection strings
        clean = clean
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript\s*:/gi, '')
            .replace(/vbscript\s*:/gi, '')
            .replace(/data\s*:\s*text\/html/gi, '')
            .replace(/onload\s*=/gi, '')
            .replace(/onerror\s*=/gi, '');

        return clean.trim();
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value !== null && typeof value === 'object') {
        const sanitizedObj: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            // Prevent Prototype Pollution
            if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
                continue;
            }
            sanitizedObj[k] = sanitizeValue(v);
        }
        return sanitizedObj;
    }

    return value;
}

export const securityShield = (req: Request, _res: Response, next: NextFunction): void => {
    try {
        // 1. Sanitize Body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeValue(req.body);
        }

        // 2. Sanitize Query Parameters
        if (req.query && typeof req.query === 'object') {
            for (const key of Object.keys(req.query)) {
                const val = req.query[key];
                // HPP Defense: If an attacker sends an array where a single string is expected
                if (Array.isArray(val)) {
                    req.query[key] = sanitizeValue(val[val.length - 1]);
                } else {
                    req.query[key] = sanitizeValue(val);
                }
            }
        }

        // 3. Sanitize URL Parameters
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeValue(req.params);
        }

        next();
    } catch (err) {
        next();
    }
};

/**
 * ipdataService.js — Secure Geolocation & Country Detection Service via IPData API
 * 
 * Features:
 * - Secure API Key management (Environment variables only)
 * - Trusted client IP extraction & validation (Cloudflare, Nginx, Cloud Run)
 * - In-memory TTL caching to prevent rate-limit exhaustion
 * - 3000ms request timeout with non-blocking graceful fallback
 * - VPN / Proxy / Threat flag extraction
 * - Safe fallback to Cloudflare cf-ipcountry or default country (IN)
 */

const axios = require('axios');
const net = require('net');

// Cache configuration: IP -> { data, expiresAt }
const geoCache = new Map();
const DEFAULT_CACHE_TTL_MS = parseInt(process.env.IPDATA_CACHE_TTL_MS || '86400000', 10); // 24 hours
const MAX_CACHE_ENTRIES = 10000;
const REQUEST_TIMEOUT_MS = parseInt(process.env.IPDATA_TIMEOUT_MS || '3000', 10); // 3 seconds

// Currency & metadata mapping for fallbacks
const COUNTRY_FALLBACKS = {
    IN: { name: 'India', currency: { code: 'INR', symbol: '₹', name: 'Indian Rupee' }, dial: '91', tz: 'Asia/Kolkata' },
    US: { name: 'United States', currency: { code: 'USD', symbol: '$', name: 'US Dollar' }, dial: '1', tz: 'America/New_York' },
    GB: { name: 'United Kingdom', currency: { code: 'GBP', symbol: '£', name: 'British Pound' }, dial: '44', tz: 'Europe/London' },
    CA: { name: 'Canada', currency: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' }, dial: '1', tz: 'America/Toronto' },
    AU: { name: 'Australia', currency: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' }, dial: '61', tz: 'Australia/Sydney' },
    DE: { name: 'Germany', currency: { code: 'EUR', symbol: '€', name: 'Euro' }, dial: '49', tz: 'Europe/Berlin' },
    FR: { name: 'France', currency: { code: 'EUR', symbol: '€', name: 'Euro' }, dial: '33', tz: 'Europe/Paris' },
    AE: { name: 'United Arab Emirates', currency: { code: 'AED', symbol: 'AED', name: 'UAE Dirham' }, dial: '971', tz: 'Asia/Dubai' },
    SG: { name: 'Singapore', currency: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }, dial: '65', tz: 'Asia/Singapore' }
};

/**
 * Checks if an IP is private, bogon, or loopback
 */
function isPrivateOrBogonIp(ip) {
    if (!ip) return true;
    const clean = String(ip).trim().replace(/^::ffff:/, '');

    // IPv4 check
    if (net.isIPv4(clean)) {
        const parts = clean.split('.').map(p => parseInt(p, 10));
        if (parts.length !== 4 || parts.some(isNaN)) return true;

        // 127.0.0.0/8 (Loopback)
        if (parts[0] === 127) return true;
        // 10.0.0.0/8 (Private)
        if (parts[0] === 10) return true;
        // 172.16.0.0/12 (Private)
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        // 192.168.0.0/16 (Private)
        if (parts[0] === 192 && parts[1] === 168) return true;
        // 169.254.0.0/16 (Link-local)
        if (parts[0] === 169 && parts[1] === 254) return true;
        // 0.0.0.0/8
        if (parts[0] === 0) return true;

        return false;
    }

    // IPv6 check
    if (net.isIPv6(clean)) {
        const lower = clean.toLowerCase();
        if (lower === '::1' || lower === '::' || lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) {
            return true;
        }
        return false;
    }

    return true;
}

/**
 * Safely extracts and validates client public IP address from trusted headers
 */
function extractClientIp(req) {
    if (!req) return '127.0.0.1';

    // Allow simulated test IP in development or when explicitly enabled
    const allowTestIp = process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_IP === 'true';
    if (allowTestIp) {
        const queryIp = req.query && (req.query.ip || req.query.test_ip);
        if (queryIp && typeof queryIp === 'string') {
            const cleanQueryIp = queryIp.trim().replace(/^::ffff:/, '');
            if (net.isIP(cleanQueryIp)) {
                return cleanQueryIp;
            }
        }
    }

    // 1. Cloudflare True Client IP (cannot be forged when behind CF proxy)
    const cfIp = req.headers && req.headers['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string') {
        const clean = cfIp.trim().replace(/^::ffff:/, '');
        if (net.isIP(clean) && !isPrivateOrBogonIp(clean)) {
            return clean;
        }
    }

    // 2. Standard reverse proxy X-Real-IP
    const realIp = req.headers && req.headers['x-real-ip'];
    if (realIp && typeof realIp === 'string') {
        const clean = realIp.trim().replace(/^::ffff:/, '');
        if (net.isIP(clean) && !isPrivateOrBogonIp(clean)) {
            return clean;
        }
    }

    // 3. X-Forwarded-For chain: client, proxy1, proxy2...
    const forwarded = req.headers && req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        const list = forwarded.split(',').map(s => s.trim().replace(/^::ffff:/, ''));
        // Find first public IP in forwarded chain
        for (const item of list) {
            const ipOnly = item.split(':')[0]; // strip port if any
            if (net.isIP(ipOnly) && !isPrivateOrBogonIp(ipOnly)) {
                return ipOnly;
            }
        }
    }

    // 4. Fallback to Express req.ip or socket
    const rawIp = req.ip || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
    const cleanRaw = String(rawIp).trim().replace(/^::ffff:/, '').split(':')[0];
    return net.isIP(cleanRaw) ? cleanRaw : '127.0.0.1';
}

/**
 * Builds standard fallback response when IPData is unreachable or key is missing
 */
function getFallbackResponse(req, clientIp, reason = 'default') {
    // 1. Check if Cloudflare edge country header is present
    const cfCountry = req && req.headers && req.headers['cf-ipcountry'];
    const countryCode = (cfCountry && typeof cfCountry === 'string' && cfCountry.length === 2 && cfCountry !== 'XX')
        ? cfCountry.toUpperCase()
        : (process.env.DEFAULT_COUNTRY_CODE || 'IN').toUpperCase();

    const info = COUNTRY_FALLBACKS[countryCode] || {
        name: countryCode === 'IN' ? 'India' : countryCode,
        currency: countryCode === 'IN' ? { code: 'INR', symbol: '₹', name: 'Indian Rupee' } : { code: 'USD', symbol: '$', name: 'US Dollar' },
        dial: countryCode === 'IN' ? '91' : '1',
        tz: 'UTC'
    };

    return {
        success: true,
        cached: false,
        ip: clientIp || '127.0.0.1',
        country_code: countryCode,
        country_name: info.name,
        region: '',
        region_code: '',
        city: '',
        postal: '',
        timezone: info.tz,
        currency: info.currency,
        calling_code: info.dial,
        is_vpn: false,
        source: 'fallback',
        fallback_reason: reason
    };
}

/**
 * Cleans expired entries if cache gets too large
 */
function pruneCacheIfNeeded() {
    if (geoCache.size > MAX_CACHE_ENTRIES) {
        const now = Date.now();
        for (const [key, val] of geoCache.entries()) {
            if (now > val.expiresAt) {
                geoCache.delete(key);
            }
        }
    }
}

/**
 * Main Detection Function: Detects visitor country using IPData API
 * 
 * @param {import('express').Request} req - Express request object
 * @returns {Promise<Object>} Standardized country & geolocation metadata
 */
async function detectCountry(req) {
    const clientIp = extractClientIp(req);
    const isPrivate = isPrivateOrBogonIp(clientIp);

    // 1. Check in-memory cache first (by IP)
    // For real public IPs, cache for 24 hours.
    // For private/loopback IPs (localhost / local dev), cache for only 3 seconds so VPN or Wi-Fi changes are reflected immediately!
    const cacheKey = clientIp;
    const cachedEntry = geoCache.get(cacheKey);
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
        return {
            ...cachedEntry.data,
            cached: true,
            source: 'cache'
        };
    }

    const apiKey = (process.env.IPDATA_API_KEY || '').trim();

    // 2. Validate API Key presence
    if (!apiKey || apiKey === 'your_ipdata_api_key_here' || apiKey === 'test') {
        const fallback = getFallbackResponse(req, clientIp, 'missing_or_placeholder_api_key');
        // Cache fallback briefly (60s) to avoid repeated warnings
        geoCache.set(cacheKey, { data: fallback, expiresAt: Date.now() + 60000 });
        return fallback;
    }

    // 3. Construct IPData API endpoint
    // If public IP, query specifically for that IP. If loopback/private (local testing),
    // calling https://api.ipdata.co/?api-key=... detects caller's own public egress IP.
    const url = isPrivate
        ? `https://api.ipdata.co/?api-key=${encodeURIComponent(apiKey)}&fields=ip,is_eu,city,region,region_code,country_name,country_code,continent_name,continent_code,calling_code,time_zone,currency,threat`
        : `https://api.ipdata.co/${encodeURIComponent(clientIp)}?api-key=${encodeURIComponent(apiKey)}&fields=ip,is_eu,city,region,region_code,country_name,country_code,continent_name,continent_code,calling_code,time_zone,currency,threat`;

    try {
        const response = await axios.get(url, {
            timeout: REQUEST_TIMEOUT_MS,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'EFV-Platform/1.6 (Country-Detection)'
            }
        });

        const data = response.data;
        if (!data || !data.country_code) {
            console.warn(`⚠️ [IPData] Empty country_code in response for IP: ${clientIp}`);
            return getFallbackResponse(req, clientIp, 'empty_response');
        }

        const normalizedCountryCode = String(data.country_code).trim().toUpperCase();
        const normalized = {
            success: true,
            cached: false,
            ip: data.ip || clientIp,
            country_code: normalizedCountryCode,
            country_name: data.country_name || (COUNTRY_FALLBACKS[normalizedCountryCode]?.name || normalizedCountryCode),
            region: data.region || '',
            region_code: data.region_code || '',
            city: data.city || '',
            postal: data.postal || '',
            timezone: (data.time_zone && data.time_zone.name) || (COUNTRY_FALLBACKS[normalizedCountryCode]?.tz || 'UTC'),
            currency: {
                code: (data.currency && data.currency.code) || (COUNTRY_FALLBACKS[normalizedCountryCode]?.currency.code || 'USD'),
                symbol: (data.currency && data.currency.symbol) || (COUNTRY_FALLBACKS[normalizedCountryCode]?.currency.symbol || '$'),
                name: (data.currency && data.currency.name) || (COUNTRY_FALLBACKS[normalizedCountryCode]?.currency.name || 'US Dollar')
            },
            calling_code: data.calling_code ? String(data.calling_code).replace('+', '') : (COUNTRY_FALLBACKS[normalizedCountryCode]?.dial || '1'),
            is_vpn: Boolean(data.threat && (data.threat.is_vpn || data.threat.is_tor || data.threat.is_proxy)),
            source: 'ipdata'
        };

        // Save in cache (loopback IPs get only 3 seconds TTL; public IPs get full 24h TTL)
        pruneCacheIfNeeded();
        const ttl = isPrivate ? 3000 : DEFAULT_CACHE_TTL_MS;
        geoCache.set(cacheKey, {
            data: normalized,
            expiresAt: Date.now() + ttl
        });

        return normalized;

    } catch (err) {
        const status = err.response ? err.response.status : null;
        let failReason = 'api_error';

        if (status === 401 || status === 403) {
            console.error(`🚨 [IPData] Authentication failed (${status}): Invalid IPDATA_API_KEY.`);
            failReason = 'invalid_api_key';
        } else if (status === 429) {
            console.warn(`⚠️ [IPData] Rate limit exceeded (429). Falling back to default.`);
            failReason = 'rate_limited';
        } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
            console.warn(`⏱️ [IPData] Request timed out after ${REQUEST_TIMEOUT_MS}ms for IP: ${clientIp}. Using fallback.`);
            failReason = 'timeout';
        } else {
            console.warn(`⚠️ [IPData] Request failed (${err.message}). Using fallback.`);
            failReason = err.message;
        }

        const fallback = getFallbackResponse(req, clientIp, failReason);
        // Cache fallback for 2 minutes to prevent hammering a failing API
        geoCache.set(cacheKey, {
            data: fallback,
            expiresAt: Date.now() + 120000
        });
        return fallback;
    }
}

/**
 * Returns cache statistics for administrative monitoring
 */
function getCacheStats() {
    return {
        size: geoCache.size,
        maxSize: MAX_CACHE_ENTRIES,
        ttlMs: DEFAULT_CACHE_TTL_MS,
        configured: Boolean(process.env.IPDATA_API_KEY && process.env.IPDATA_API_KEY !== 'your_ipdata_api_key_here')
    };
}

/**
 * Clears the geolocation cache (useful for testing or administration)
 */
function clearCache() {
    const size = geoCache.size;
    geoCache.clear();
    return { cleared: true, previousCount: size };
}

module.exports = {
    detectCountry,
    extractClientIp,
    isPrivateOrBogonIp,
    getFallbackResponse,
    getCacheStats,
    clearCache
};


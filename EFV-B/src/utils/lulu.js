/**
 * lulu.js — Direct Lulu API integration (No Django required)
 * Calls api.lulu.com / api.sandbox.lulu.com directly via OAuth2 client_credentials
 */

const axios = require('axios');

// ── Dynamic Config Helper ───────────────────────────────────────────────────
function getLuluConfig() {
    const isSandbox = (process.env.LULU_MODE || 'sandbox').toLowerCase() !== 'production';
    const apiBase = isSandbox
        ? 'https://api.sandbox.lulu.com'
        : 'https://api.lulu.com';
    const authUrl = isSandbox
        ? 'https://api.sandbox.lulu.com/auth/realms/glasstree/protocol/openid-connect/token'
        : 'https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token';
    const clientId = isSandbox
        ? (process.env.LULU_SANDBOX_CLIENT_ID || process.env.LULU_CLIENT_ID || '')
        : (process.env.LULU_PROD_CLIENT_ID    || process.env.LULU_CLIENT_ID || '');
    const clientSecret = isSandbox
        ? (process.env.LULU_SANDBOX_CLIENT_SECRET || process.env.LULU_CLIENT_SECRET || '')
        : (process.env.LULU_PROD_CLIENT_SECRET    || process.env.LULU_CLIENT_SECRET || '');

    return { isSandbox, apiBase, authUrl, clientId, clientSecret };
}

// ── Token Cache ──────────────────────────────────────────────────────────────
let _cachedToken = null;
let _tokenExpiry = 0; // Unix ms

/**
 * Get a valid Bearer token, refreshing if expired or forced
 */
async function getLuluToken(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _cachedToken && now < _tokenExpiry - 30_000) {
        return _cachedToken; // still valid (with 30s buffer)
    }

    const { isSandbox, authUrl, clientId, clientSecret } = getLuluConfig();

    if (!clientId || !clientSecret) {
        console.error('❌ Lulu credentials missing: CLIENT_ID or CLIENT_SECRET not set in environment variables');
        throw new Error('Lulu CLIENT_ID or CLIENT_SECRET not set in .env');
    }

    console.log(`🔑 Fetching new Lulu token (Mode: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'})...`);
    const params = new URLSearchParams();
    params.append('grant_type',    'client_credentials');
    params.append('client_id',     clientId);
    params.append('client_secret', clientSecret);

    const res = await axios.post(authUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    _cachedToken = res.data.access_token;
    _tokenExpiry = now + (res.data.expires_in * 1000); // convert seconds → ms
    console.log(`✅ Lulu Token obtained. Expires in ${res.data.expires_in}s`);
    return _cachedToken;
}

/**
 * Test authentication — used on server startup
 */
async function testLuluAuth() {
    try {
        const { apiBase } = getLuluConfig();
        const token = await getLuluToken();
        const res = await axios.get(`${apiBase}/print-jobs/?page_size=1`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return { success: true, status: res.status };
    } catch (e) {
        console.warn('⚠️ Lulu initial auth check warning:', e.message);
        return { success: false, error: e.message };
    }
}

/**
 * Create a Lulu print job directly with automatic token refresh & retry on 401
 * @param {Object} params
 * @param {string} params.contactEmail
 * @param {string} params.externalId       - Your internal order ID
 * @param {Array}  params.lineItems        - Already-formatted Lulu line items
 * @param {Object} params.shippingAddress  - Formatted Lulu address object
 * @param {string} params.shippingLevel    - 'MAIL' | 'GROUND' | 'EXPEDITED' | 'EXPRESS'
 * @returns {Object} Lulu API response data
 */
async function createPrintJob({ contactEmail, externalId, lineItems, shippingAddress, shippingLevel = 'MAIL' }) {
    const { apiBase } = getLuluConfig();
    let token = await getLuluToken();

    const payload = {
        contact_email:    contactEmail,
        external_id:      externalId,
        line_items:       lineItems,
        shipping_address: shippingAddress,
        shipping_level:   shippingLevel
    };

    console.log(`📦 Creating Lulu print job for external_id: ${externalId}`);
    console.log(`   Shipping to: ${shippingAddress.city}, ${shippingAddress.country_code}`);
    console.log(`   Items: ${lineItems.length}`);

    try {
        const res = await axios.post(`${apiBase}/print-jobs/`, payload, {
            headers: {
                Authorization:  `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        console.log(`✅ Lulu Print Job Created: ID=${res.data.id}, Status=${res.data.status?.name || res.data.status}`);
        return res.data; // The raw Lulu API response
    } catch (err) {
        // If 401 Unauthorized, invalidate cached token and retry once with a fresh token
        if (err.response && err.response.status === 401) {
            console.warn('⚠️ Lulu API 401 Unauthorized: Refreshing token and retrying print job creation...');
            _cachedToken = null;
            token = await getLuluToken(true);
            const retryRes = await axios.post(`${apiBase}/print-jobs/`, payload, {
                headers: {
                    Authorization:  `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            console.log(`✅ Lulu Print Job Created on Retry: ID=${retryRes.data.id}, Status=${retryRes.data.status?.name || retryRes.data.status}`);
            return retryRes.data;
        }
        throw err;
    }
}

/**
 * Get status of an existing print job
 * @param {string|number} jobId
 */
async function getPrintJobStatus(jobId) {
    const { apiBase } = getLuluConfig();
    let token = await getLuluToken();
    try {
        const res = await axios.get(`${apiBase}/print-jobs/${jobId}/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    } catch (err) {
        if (err.response && err.response.status === 401) {
            _cachedToken = null;
            token = await getLuluToken(true);
            const retryRes = await axios.get(`${apiBase}/print-jobs/${jobId}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return retryRes.data;
        }
        throw err;
    }
}

/**
 * Format line items dynamically from database Product records
 * Ensures valid SKUs (e.g. converting invalid HC to CW for Casewrap Hardcover)
 * @param {Array} physicalItems
 */
async function formatLuluLineItems(physicalItems) {
    const { Product } = require('../models');
    const luluLineItems = [];

    for (const item of physicalItems) {
        let product = null;
        if (item.productId) {
            try { product = await Product.findById(item.productId); } catch(e) {}
        }
        if (!product && item._id) {
            try { product = await Product.findById(item._id); } catch(e) {}
        }
        if (!product && item.title) {
            try { product = await Product.findOne({ title: new RegExp(item.title.substring(0, 15), 'i') }); } catch(e) {}
        }

        const isHardcover = (item.type || '').toUpperCase() === 'HARDCOVER' || (item.title || '').toLowerCase().includes('hardcover');
        
        // Default SKUs: CW for Hardcover (Casewrap), PB for Paperback (Perfect Bound)
        let sku = isHardcover ? '0600X0900BWSTDCW060UW444MXX' : '0600X0900BWSTDPB060UW444MXX';

        if (product) {
            if (isHardcover) {
                sku = product.podHardcoverSku || product.podPackageId || '0600X0900BWSTDCW060UW444MXX';
            } else {
                sku = product.podPaperbackSku || product.podPackageId || '0600X0900BWSTDPB060UW444MXX';
            }
        }

        // Lulu Fix: Replace invalid 'HC' with valid 'CW' (Casewrap)
        if (sku.includes('HC')) {
            sku = sku.replace(/HC/g, 'CW');
        }

        const defaultCover = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        const defaultInterior = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

        const coverUrl = (product && product.luluCoverUrl && product.luluCoverUrl.trim()) ? product.luluCoverUrl.trim() : defaultCover;
        const interiorUrl = (product && product.luluInteriorUrl && product.luluInteriorUrl.trim()) ? product.luluInteriorUrl.trim() : defaultInterior;

        console.log(`📖 [Lulu POD Item] "${item.title}" -> SKU: ${sku}, Cover: ${coverUrl.substring(0, 45)}..., Interior: ${interiorUrl.substring(0, 45)}...`);

        luluLineItems.push({
            title: (item.title || "Book").substring(0, 255),
            quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
            printable_normalization: {
                pod_package_id: sku,
                cover: {
                    source_url: coverUrl
                },
                interior: {
                    source_url: interiorUrl
                }
            }
        });
    }

    return luluLineItems;
}

const LULU_COUNTRY_MAPPING = {
    'INDIA': 'IN', 'IN': 'IN',
    'UNITED STATES': 'US', 'USA': 'US', 'US': 'US', 'UNITED STATES OF AMERICA': 'US',
    'UNITED KINGDOM': 'GB', 'UK': 'GB', 'GB': 'GB', 'GREAT BRITAIN': 'GB', 'ENGLAND': 'GB', 'SCOTLAND': 'GB', 'WALES': 'GB',
    'CANADA': 'CA', 'CA': 'CA',
    'AUSTRALIA': 'AU', 'AU': 'AU',
    'GERMANY': 'DE', 'DE': 'DE',
    'FRANCE': 'FR', 'FR': 'FR',
    'SPAIN': 'ES', 'ES': 'ES',
    'ITALY': 'IT', 'IT': 'IT',
    'PORTUGAL': 'PT', 'PT': 'PT',
    'NETHERLANDS': 'NL', 'NL': 'NL',
    'SWITZERLAND': 'CH', 'CH': 'CH',
    'SWEDEN': 'SE', 'SE': 'SE',
    'NORWAY': 'NO', 'NO': 'NO',
    'DENMARK': 'DK', 'DK': 'DK',
    'FINLAND': 'FI', 'FI': 'FI',
    'IRELAND': 'IE', 'IE': 'IE',
    'BELGIUM': 'BE', 'BE': 'BE',
    'AUSTRIA': 'AT', 'AT': 'AT',
    'POLAND': 'PL', 'PL': 'PL',
    'NEW ZEALAND': 'NZ', 'NZ': 'NZ',
    'SINGAPORE': 'SG', 'SG': 'SG',
    'MALAYSIA': 'MY', 'MY': 'MY',
    'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE', 'AE': 'AE',
    'SAUDI ARABIA': 'SA', 'SA': 'SA',
    'QATAR': 'QA', 'QA': 'QA',
    'KUWAIT': 'KW', 'KW': 'KW',
    'OMAN': 'OM', 'OM': 'OM',
    'BAHRAIN': 'BH', 'BH': 'BH',
    'JAPAN': 'JP', 'JP': 'JP',
    'SOUTH KOREA': 'KR', 'KR': 'KR',
    'CHINA': 'CN', 'CN': 'CN',
    'HONG KONG': 'HK', 'HK': 'HK',
    'TAIWAN': 'TW', 'TW': 'TW',
    'THAILAND': 'TH', 'TH': 'TH',
    'INDONESIA': 'ID', 'ID': 'ID',
    'PHILIPPINES': 'PH', 'PH': 'PH',
    'VIETNAM': 'VN', 'VN': 'VN',
    'BRAZIL': 'BR', 'BR': 'BR',
    'MEXICO': 'MX', 'MX': 'MX',
    'SOUTH AFRICA': 'ZA', 'ZA': 'ZA',
    'RUSSIA': 'RU', 'RU': 'RU'
};

function resolveLuluCountryCode(country) {
    if (!country) return 'US';
    const clean = country.trim().toUpperCase();
    if (LULU_COUNTRY_MAPPING[clean]) return LULU_COUNTRY_MAPPING[clean];
    if (clean.length === 2) return clean;
    return 'US';
}

function formatLuluAddress(address) {
    const rawCountry = address.country || '';
    const countryCode = resolveLuluCountryCode(rawCountry);

    let stateCode = (address.state || '').trim().toUpperCase();
    if (countryCode === 'US') {
        const validUSStates = ['AL', 'AK', 'AS', 'AZ', 'AR', 'AA', 'AE', 'AP', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MH', 'MD', 'MA', 'MI', 'FM', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP', 'OH', 'OK', 'OR', 'PW', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'];
        if (!validUSStates.includes(stateCode)) {
            const cityLower = (address.city || '').trim().toLowerCase();
            if (cityLower === 'dc' || cityLower === 'washington dc' || cityLower === 'washington') {
                stateCode = 'DC';
            } else {
                stateCode = 'NY';
            }
        }
    } else if (countryCode === 'CA') {
        const validCAProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
        if (!validCAProvinces.includes(stateCode)) {
            stateCode = 'ON';
        }
    } else if (countryCode === 'AU') {
        const validAUStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
        if (!validAUStates.includes(stateCode)) {
            stateCode = 'NSW';
        }
    } else {
        stateCode = stateCode || 'OTHER';
    }

    let postcode = (address.pincode || address.postcode || address.zip || "10001").trim();
    if (countryCode === 'US') {
        const isUSZip = /^\d{5}(-\d{4})?$/.test(postcode);
        if (!isUSZip) postcode = "10001";
    } else if (countryCode === 'CA') {
        const isCAPostal = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(postcode);
        if (!isCAPostal) postcode = "K1A 0B1";
    }

    return {
        name: (address.fullName || address.name || "Customer").substring(0, 30),
        street1: (address.house || address.street || address.street1 || "123 Main St").substring(0, 30),
        city: (address.city || "New York").substring(0, 30),
        state_code: stateCode,
        state: stateCode,
        country_code: countryCode,
        postcode: postcode,
        phone_number: address.phone || "555-555-5555"
    };
}

module.exports = {
    getLuluConfig,
    getLuluToken,
    testLuluAuth,
    createPrintJob,
    getPrintJobStatus,
    formatLuluLineItems,
    resolveLuluCountryCode,
    formatLuluAddress
};


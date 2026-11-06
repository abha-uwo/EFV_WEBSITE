// Integrated with global security.js
console.log("📂 admin.js: Loading Version 1.3 (Active)...");

// ✅ Resolve API base URL from api-config.js (CONFIG must be loaded first)
const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
    ? CONFIG.API_BASE_URL
    : 'http://localhost:8080';
console.log("🌐 admin.js API_BASE resolved to:", API_BASE);

const SUPPORTED_COUNTRIES = [
    { key: 'India', name: 'India', flag: '🇮🇳', code: 'IN', currency: 'INR' },
    { key: 'UnitedStates', name: 'United States', flag: '🇺🇸', code: 'US', currency: 'USD' },
    { key: 'UnitedKingdom', name: 'United Kingdom', flag: '🇬🇧', code: 'GB', currency: 'GBP' },
    { key: 'Germany', name: 'Germany', flag: '🇩🇪', code: 'DE', currency: 'EUR' },
    { key: 'France', name: 'France', flag: '🇫🇷', code: 'FR', currency: 'EUR' },
    { key: 'Spain', name: 'Spain', flag: '🇪🇸', code: 'ES', currency: 'EUR' },
    { key: 'Italy', name: 'Italy', flag: '🇮🇹', code: 'IT', currency: 'EUR' },
    { key: 'Portugal', name: 'Portugal', flag: '🇵🇹', code: 'PT', currency: 'EUR' },
    { key: 'UnitedArabEmirates', name: 'United Arab Emirates', flag: '🇦🇪', code: 'AE', currency: 'AED' },
    { key: 'SaudiArabia', name: 'Saudi Arabia', flag: '🇸🇦', code: 'SA', currency: 'SAR' },
    { key: 'China', name: 'China', flag: '🇨🇳', code: 'CN', currency: 'CNY' },
    { key: 'Japan', name: 'Japan', flag: '🇯🇵', code: 'JP', currency: 'JPY' },
    { key: 'Russia', name: 'Russia', flag: '🇷🇺', code: 'RU', currency: 'RUB' },
    { key: 'SouthKorea', name: 'South Korea', flag: '🇰🇷', code: 'KR', currency: 'KRW' }
];
window.SUPPORTED_COUNTRIES = SUPPORTED_COUNTRIES;

const WORLD_CUSTOM_COUNTRIES = [
    { name: 'Australia', code: 'AU', currency: 'AUD', flag: '🇦🇺' },
    { name: 'Canada', code: 'CA', currency: 'CAD', flag: '🇨🇦' },
    { name: 'Netherlands', code: 'NL', currency: 'EUR', flag: '🇳🇱' },
    { name: 'Singapore', code: 'SG', currency: 'SGD', flag: '🇸🇬' },
    { name: 'New Zealand', code: 'NZ', currency: 'NZD', flag: '🇳🇿' },
    { name: 'Switzerland', code: 'CH', currency: 'CHF', flag: '🇨🇭' },
    { name: 'Brazil', code: 'BR', currency: 'BRL', flag: '🇧🇷' },
    { name: 'South Africa', code: 'ZA', currency: 'ZAR', flag: '🇿🇦' },
    { name: 'Mexico', code: 'MX', currency: 'MXN', flag: '🇲🇽' },
    { name: 'Sweden', code: 'SE', currency: 'SEK', flag: '🇸🇪' },
    { name: 'Norway', code: 'NO', currency: 'NOK', flag: '🇳🇴' },
    { name: 'Denmark', code: 'DK', currency: 'DKK', flag: '🇩🇰' },
    { name: 'Poland', code: 'PL', currency: 'PLN', flag: '🇵🇱' },
    { name: 'Turkey', code: 'TR', currency: 'TRY', flag: '🇹🇷' },
    { name: 'Indonesia', code: 'ID', currency: 'IDR', flag: '🇮🇩' },
    { name: 'Malaysia', code: 'MY', currency: 'MYR', flag: '🇲🇾' },
    { name: 'Thailand', code: 'TH', currency: 'THB', flag: '🇹🇭' },
    { name: 'Vietnam', code: 'VN', currency: 'VND', flag: '🇻🇳' },
    { name: 'Philippines', code: 'PH', currency: 'PHP', flag: '🇵🇭' },
    { name: 'Ireland', code: 'IE', currency: 'EUR', flag: '🇮🇪' },
    { name: 'Belgium', code: 'BE', currency: 'EUR', flag: '🇧🇪' },
    { name: 'Austria', code: 'AT', currency: 'EUR', flag: '🇦🇹' },
    { name: 'Qatar', code: 'QA', currency: 'QAR', flag: '🇶🇦' },
    { name: 'Kuwait', code: 'KW', currency: 'KWD', flag: '🇰🇼' },
    { name: 'Bahrain', code: 'BH', currency: 'BHD', flag: '🇧🇭' },
    { name: 'Oman', code: 'OM', currency: 'OMR', flag: '🇴🇲' },
    { name: 'Israel', code: 'IL', currency: 'ILS', flag: '🇮🇱' },
    { name: 'Egypt', code: 'EG', currency: 'EGP', flag: '🇪🇬' },
    { name: 'Nigeria', code: 'NG', currency: 'NGN', flag: '🇳🇬' },
    { name: 'Kenya', code: 'KE', currency: 'KES', flag: '🇰🇪' },
    { name: 'Argentina', code: 'AR', currency: 'ARS', flag: '🇦🇷' },
    { name: 'Chile', code: 'CL', currency: 'CLP', flag: '🇨🇱' },
    { name: 'Colombia', code: 'CO', currency: 'COP', flag: '🇨🇴' },
    { name: 'Hong Kong', code: 'HK', currency: 'HKD', flag: '🇭🇰' },
    { name: 'Taiwan', code: 'TW', currency: 'TWD', flag: '🇹🇼' }
];
window.WORLD_CUSTOM_COUNTRIES = WORLD_CUSTOM_COUNTRIES;

// --- DYNAMIC CURRENCY SYMBOL HELPER FOR ORDERS ---
const ADMIN_CURRENCY_SYMBOLS = {
    'INR': '₹', 'USD': '$', 'GBP': '£', 'EUR': '€',
    'AED': 'AED ', 'SAR': 'SAR ', 'JPY': '¥', 'CNY': '¥',
    'KRW': '₩', 'CAD': 'CA$', 'AUD': 'A$', 'SGD': 'S$', 'RUB': '₽'
};
function getOrderCurrSym(order) {
    const c = order?.paymentCurrency || order?.currency || 'INR';
    return ADMIN_CURRENCY_SYMBOLS[c] || c + ' ';
}

window.calculateCountryDiscount = function (countryKey) {
    const priceInput = document.getElementById(`cp-price-${countryKey}`);
    const mrpInput = document.getElementById(`cp-mrp-${countryKey}`);
    const discountInput = document.getElementById(`cp-discount-${countryKey}`);
    if (!priceInput || !mrpInput || !discountInput) return;
    const price = parseFloat(priceInput.value);
    const mrp = parseFloat(mrpInput.value);
    if (price && mrp && mrp > price) {
        const pct = Math.round(((mrp - price) / mrp) * 100);
        discountInput.value = `${pct}%`;
    } else {
        discountInput.value = '0%';
    }
};

// User Data Isolation Helpers
function getUserKey(baseKey) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user || !user.email) return baseKey;
    const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${baseKey}_${cleanEmail}`;
}
window.getUserKey = getUserKey;

// --- NOTIFICATION SYSTEM ---
window.simulateAdminEvent = (toggleId, title, message) => {
    const prefs = JSON.parse(localStorage.getItem('efv_admin_alerts')) || {};
    // If setting doesn't exist yet, default to active
    const isActive = prefs[toggleId] !== undefined ? prefs[toggleId] : true;

    if (!isActive) {
        showToast(`Notification for ${title} is suppressed in settings.`, "info");
        return;
    }

    const notifs = JSON.parse(localStorage.getItem('efv_notifications')) || [];
    const newNotif = {
        id: Date.now(),
        title,
        message,
        type: toggleId.replace('alert-', ''),
        timestamp: new Date().toISOString(),
        read: false
    };

    notifs.unshift(newNotif);
    localStorage.setItem('efv_notifications', JSON.stringify(notifs));

    // Update Badge
    const unreadCount = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('unread-notifications-count');
    if (badge) {
        badge.textContent = unreadCount;
        unreadCount > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
    }

    showToast(`New Notification: ${title}`, "info");
    if (document.getElementById('notifications').style.display !== 'none') {
        renderNotificationsTab(document.querySelector('[data-notif-filter].active')?.dataset.notifFilter || 'all');
    }
};

window.renderNotificationsTab = (filter = 'all') => {
    const notifContainer = document.getElementById('notifications-list');
    const emptyState = document.getElementById('notifications-empty-state');
    if (!notifContainer) return;

    let notifs = JSON.parse(localStorage.getItem('efv_notifications')) || [];

    // Initial Seed if empty
    if (notifs.length === 0) {
        notifs = [{
            id: 1, title: 'System Initialized', message: 'Welcome to EFV Admin Panel. Use Simulation to test alerts.',
            type: 'system', timestamp: new Date().toISOString(), read: true
        }];
        localStorage.setItem('efv_notifications', JSON.stringify(notifs));
    }

    const filtered = filter === 'all' ? notifs : notifs.filter(n => {
        if (filter === 'orders') return n.type === 'new-order' || n.type === 'refund';
        if (filter === 'payments') return n.type === 'payment-fail';
        return n.type === filter;
    });

    if (filtered.length === 0) {
        notifContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    notifContainer.innerHTML = filtered.map(n => `
        <div class="notif-item ${n.read ? 'read' : 'unread'}" style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 15px; border-left: 4px solid ${getNotifColor(n.type)}; display: flex; align-items: flex-start; gap: 15px; transition: 0.3s;" onclick="markNotifRead(${n.id})">
            <div class="notif-icon" style="color: ${getNotifColor(n.type)}; font-size: 1.2rem; margin-top: 3px;">
                <i class="${getNotifIcon(n.type)}"></i>
            </div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <h4 style="margin: 0; font-size: 0.95rem;">${n.title}</h4>
                    <span style="font-size: 0.75rem; opacity: 0.5;">${formatRelativeTime(n.timestamp)}</span>
                </div>
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.7; line-height: 1.4;">${n.message}</p>
            </div>
            ${!n.read ? '<div style="width: 8px; height: 8px; background: #ff4d4d; border-radius: 50%; margin-top: 8px;"></div>' : ''}
        </div>
    `).join('');

    // Sync Global Badge
    const unreadCount = notifs.filter(n => !n.read).length;
    const badge = document.getElementById('unread-notifications-count');
    if (badge) {
        badge.textContent = unreadCount;
        unreadCount > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
    }
};

window.markNotifRead = (id) => {
    const notifs = JSON.parse(localStorage.getItem('efv_notifications')) || [];
    const n = notifs.find(x => x.id === id);
    if (n) {
        n.read = true;
        localStorage.setItem('efv_notifications', JSON.stringify(notifs));
        renderNotificationsTab(document.querySelector('[data-notif-filter].active')?.dataset.notifFilter || 'all');
    }
};

function getNotifColor(type) {
    switch (type) {
        case 'new-order': return '#D4AF37';
        case 'payment-fail': return '#ff4d4d';
        case 'new-user': return '#3498db';
        case 'refund': return '#e67e22';
        default: return '#95a5a6';
    }
}

function getNotifIcon(type) {
    switch (type) {
        case 'new-order': return 'fas fa-shopping-cart';
        case 'payment-fail': return 'fas fa-exclamation-triangle';
        case 'new-user': return 'fas fa-user-plus';
        case 'refund': return 'fas fa-undo-alt';
        default: return 'fas fa-bell';
    }
}

function formatRelativeTime(iso) {
    const s = Math.floor((new Date() - new Date(iso)) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return new Date(iso).toLocaleDateString();
}

// API_BASE is resolved at the top of the file

// --- GLOBAL CONTENT CONFIGURATION ---
window.getImageForProduct = function (name) {
    const basePath = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH : '../';
    if (!name) return basePath + 'assets/images/vol1-cover.png';
    const upper = String(name).toUpperCase().replace(/\s+/g, ' ');
    if (upper.includes('VOL 2') || upper.includes('VOL2') || upper.includes('VOLUME 2') || upper.includes('MINDOS')) {
        return basePath + 'assets/images/vol2-cover.png';
    }
    if (upper.includes('VOL 1') || upper.includes('VOL1') || upper.includes('VOLUME 1') || upper.includes('ORIGIN')) {
        if (upper.includes('ENGLISH') || upper.includes('EN')) {
            return basePath + 'assets/images/english_v1.jpeg';
        }
        return basePath + 'assets/images/vol1-cover.png';
    }
    return basePath + 'assets/images/vol1-cover.png';
};

window.resolveThumbnailUrl = function (thumb, name) {
    const basePath = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH : '../';
    const defaultCover = window.getImageForProduct(name);
    if (!thumb) return defaultCover;
    if (thumb.startsWith('http://') || thumb.startsWith('https://')) return thumb;
    if (thumb.startsWith(basePath)) return thumb;
    if (thumb.startsWith('img/')) return basePath + 'assets/images/' + thumb.replace(/^img\//, '');
    if (thumb.startsWith('assets/images/')) return basePath + thumb;
    if (thumb.startsWith('/api/') || thumb.startsWith('api/')) return `${API_BASE}/${thumb.replace(/^\//, '')}`;
    if (thumb.startsWith('/')) return `${API_BASE}${thumb}`;
    return defaultCover;
};

const CONTENT_CONFIG = {
    pdfWorkerSrc: (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'js/pdfjs/pdf.worker.min.js',
    contentApi: `${API_BASE}/api/content`,
    progressApi: `${API_BASE}/api/progress`
};

const efvProgressCache = new Map();

async function fetchProgress(productId) {
    if (!productId) return null;
    if (efvProgressCache.has(productId)) return efvProgressCache.get(productId);
    try {
        const rawAuthUser = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
        const token = rawAuthUser ? (JSON.parse(rawAuthUser).token || localStorage.getItem('authToken')) : localStorage.getItem('authToken');
        if (!token) return null;
        const res = await fetch(`${CONTENT_CONFIG.progressApi}/${productId}?t=${Date.now()}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        const data = json.found ? json.data : null;
        if (data) efvProgressCache.set(productId, data);
        return data;
    } catch (e) { return null; }
}

async function syncProgress(productId, type, data) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        await fetch(`${CONTENT_CONFIG.progressApi}/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ type, ...data })
        });
    } catch (e) { }
}

let allAdminProducts = [];

// User Data Isolation Helpers
function getUserKey(baseKey) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user || !user.email) return baseKey;
    // Clean email to use as key part (remove special chars)
    const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${baseKey}_${cleanEmail}`;
}


// --- ADMIN MODAL SYSTEM (Consolidated) ---
window.openProductModal = function (productId = null) {
    const modal = document.getElementById('admin-product-modal');
    const form = document.getElementById('admin-product-form');
    const title = document.getElementById('admin-modal-title');
    const saveBtn = document.getElementById('admin-save-btn');

    if (!modal || !form) return;

    form.reset();
    const prodIdInput = document.getElementById('admin-prod-id');
    if (prodIdInput) prodIdInput.value = '';

    document.getElementById('admin-current-cover').innerHTML = '';
    document.getElementById('admin-current-ebook').innerHTML = '';

    const chaptersContainer = document.getElementById('admin-chapters-container');
    if (chaptersContainer) chaptersContainer.innerHTML = '';
    const totalChaptersInput = document.getElementById('admin-prod-total-chapters');
    if (totalChaptersInput) totalChaptersInput.value = '';

    // Reset Lulu POD fields
    if (document.getElementById('admin-prod-pod-package-id')) document.getElementById('admin-prod-pod-package-id').value = '0600X0900BWSTDPB060UW444MXX';
    if (document.getElementById('admin-prod-pod-hardcover-sku')) document.getElementById('admin-prod-pod-hardcover-sku').value = '';
    if (document.getElementById('admin-prod-pod-paperback-sku')) document.getElementById('admin-prod-pod-paperback-sku').value = '';
    if (document.getElementById('admin-prod-lulu-cover-url')) document.getElementById('admin-prod-lulu-cover-url').value = '';
    if (document.getElementById('admin-prod-lulu-interior-url')) document.getElementById('admin-prod-lulu-interior-url').value = '';

    window.renderAdminCountryPricingRows(null);

    window._currentEditingProduct = null;

    // Reset file inputs
    const files = ['admin-file-cover', 'admin-file-ebook', 'admin-file-audio'];
    files.forEach(f => {
        const el = document.getElementById(f);
        if (el) el.value = '';
    });

    toggleAdminFileFields('HARDCOVER');

    if (productId) {
        if (title) title.textContent = 'EDIT PRODUCT';
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> UPDATE PRODUCT';
        window.editProduct(productId);
    } else {
        if (title) title.textContent = 'ADD NEW PRODUCT';
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-plus-circle"></i> ADD PRODUCT';
        window.renderMarketingCategoryCheckboxes([]);
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
    initModalParticles('modal-particles-canvas', 'admin-product-modal');
};

window.getCountryPricingData = function(countryPricingObj, c) {
    if (!countryPricingObj || typeof countryPricingObj !== 'object') return null;
    if (countryPricingObj[c.key] !== undefined) return countryPricingObj[c.key];
    if (c.name && countryPricingObj[c.name] !== undefined) return countryPricingObj[c.name];
    if (c.code && countryPricingObj[c.code] !== undefined) return countryPricingObj[c.code];
    
    const targetCleanKeys = [
        c.key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        (c.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        (c.code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    ];
    
    for (const rawKey of Object.keys(countryPricingObj)) {
        const cleanKey = rawKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (targetCleanKeys.includes(cleanKey)) {
            return countryPricingObj[rawKey];
        }
    }
    return null;
};

window.renderAdminCountryPricingRows = function(product) {
    const tbody = document.getElementById('admin-country-pricing-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const countryMap = new Map();

    // 1. Add supported default countries
    SUPPORTED_COUNTRIES.forEach(c => {
        countryMap.set(c.key, {
            key: c.key,
            name: c.name,
            flag: c.flag || '🌐',
            code: c.code || '',
            currency: c.currency || 'USD',
            isCustom: false
        });
    });

    // 2. Add all countries from product.countryPricing (including custom added + Excel imported)
    if (product && product.countryPricing && typeof product.countryPricing === 'object') {
        Object.keys(product.countryPricing).forEach(rawKey => {
            const cpData = product.countryPricing[rawKey];
            if (!cpData) return;
            const cleanKey = rawKey.replace(/[^a-zA-Z0-9]/g, '');
            if (!cleanKey) return;

            let existingMatched = SUPPORTED_COUNTRIES.find(c => 
                c.key.toLowerCase() === cleanKey.toLowerCase() || 
                c.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanKey.toLowerCase() ||
                (c.code && c.code.toLowerCase() === cleanKey.toLowerCase())
            );

            let customMatched = null;
            if (!existingMatched && typeof WORLD_CUSTOM_COUNTRIES !== 'undefined') {
                customMatched = WORLD_CUSTOM_COUNTRIES.find(c => 
                    c.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanKey.toLowerCase() ||
                    (c.code && c.code.toLowerCase() === cleanKey.toLowerCase())
                );
            }

            if (existingMatched) {
                countryMap.set(existingMatched.key, {
                    key: existingMatched.key,
                    name: cpData.name || existingMatched.name,
                    flag: cpData.flag || existingMatched.flag || '🌐',
                    code: cpData.code || existingMatched.code || '',
                    currency: cpData.currency || existingMatched.currency || 'USD',
                    isCustom: false
                });
            } else if (customMatched) {
                countryMap.set(cleanKey, {
                    key: cleanKey,
                    name: cpData.name || customMatched.name,
                    flag: cpData.flag || customMatched.flag || '🌐',
                    code: cpData.code || customMatched.code || '',
                    currency: cpData.currency || customMatched.currency || 'USD',
                    isCustom: true
                });
            } else if (!countryMap.has(cleanKey)) {
                countryMap.set(cleanKey, {
                    key: cleanKey,
                    name: cpData.name || rawKey,
                    flag: cpData.flag || '🌐',
                    code: cpData.code || '',
                    currency: cpData.currency || 'USD',
                    isCustom: true
                });
            }
        });
    }

    const countriesList = Array.from(countryMap.values());
    const supportedKeys = new Set(SUPPORTED_COUNTRIES.map(c => c.key));

    // Sort: Countries with configured prices (>0) first, then supported defaults, then others alphabetically
    countriesList.sort((a, b) => {
        const cpA = product && product.countryPricing ? window.getCountryPricingData(product.countryPricing, a) : null;
        const cpB = product && product.countryPricing ? window.getCountryPricingData(product.countryPricing, b) : null;
        const hasPriceA = cpA && (cpA.price !== undefined && cpA.price !== '' && cpA.price !== null && Number(cpA.price) > 0);
        const hasPriceB = cpB && (cpB.price !== undefined && cpB.price !== '' && cpB.price !== null && Number(cpB.price) > 0);
        
        if (hasPriceA && !hasPriceB) return -1;
        if (!hasPriceA && hasPriceB) return 1;
        
        const isSupA = supportedKeys.has(a.key);
        const isSupB = supportedKeys.has(b.key);
        if (isSupA && !isSupB) return -1;
        if (!isSupA && isSupB) return 1;
        
        return a.name.localeCompare(b.name);
    });

    countriesList.forEach(c => {
        const cp = product && product.countryPricing ? window.getCountryPricingData(product.countryPricing, c) : null;
        const priceVal = (cp && cp.price !== undefined && cp.price !== null) ? cp.price : '';
        const mrpVal = (cp && cp.mrp !== undefined && cp.mrp !== null) ? cp.mrp : '';
        const gstVal = (cp && cp.gstPercent !== undefined) ? cp.gstPercent : ((cp && cp.taxRate !== undefined) ? cp.taxRate : 0);
        const enabledVal = (cp && cp.enabled !== undefined) ? cp.enabled : true;
        const currencyVal = (cp && cp.currency) ? cp.currency : c.currency;

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.className = 'admin-country-pricing-row';
        tr.setAttribute('data-country-key', c.key);
        tr.setAttribute('data-country-name', c.name);
        tr.setAttribute('data-country-currency', currencyVal);
        tr.setAttribute('data-country-flag', c.flag);
        tr.setAttribute('data-country-code', c.code || '');
        tr.setAttribute('data-is-custom', c.isCustom ? 'true' : 'false');

        const badgeHtml = c.isCustom 
            ? `<span style="font-size: 0.62rem; background: rgba(212, 175, 55, 0.2); color: #ffd700; padding: 2px 5px; border-radius: 4px; font-weight: 700; margin-left: auto;">CUSTOM</span>` 
            : '';

        tr.innerHTML = `
            <td style="padding: 10px 8px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.1rem;">${c.flag}</span>
                <span style="font-weight: 500; font-size: 0.85rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;" title="${c.name}">${c.name}</span>
                ${badgeHtml}
            </td>
            <td style="padding: 10px 6px; text-align: center;">
                <input type="text" class="p-input country-currency" id="cp-curr-${c.key}" value="${currencyVal}" maxlength="6" style="width: 52px; height: 32px; font-size: 0.75rem; text-align: center; background: rgba(255,255,255,0.08); border: 1px solid rgba(212,175,55,0.3); color: #ffd700; border-radius: 6px; padding: 0; font-weight: 600; text-transform: uppercase;">
            </td>
            <td style="padding: 10px 6px;">
                <input type="number" step="0.01" class="p-input country-price" id="cp-price-${c.key}" value="${priceVal}" placeholder="0.00" style="width: 100%; max-width: 100px; height: 32px; font-size: 0.85rem; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.5); color: #2ecc71; font-weight: 600;" oninput="window.calculateCountryDiscount('${c.key}')">
            </td>
            <td style="padding: 10px 6px;">
                <input type="number" step="0.01" class="p-input country-mrp" id="cp-mrp-${c.key}" value="${mrpVal}" placeholder="0.00" style="width: 100%; max-width: 100px; height: 32px; font-size: 0.85rem; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.5); color: white;" oninput="window.calculateCountryDiscount('${c.key}')">
            </td>
            <td style="padding: 10px 6px; text-align: center;">
                <div style="display: inline-flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; padding: 0 4px; height: 32px; min-width: 65px;">
                    <input type="number" step="0.1" min="0" max="100" class="p-input country-gst" id="cp-gst-${c.key}" value="${gstVal}" placeholder="0" style="width: 38px; height: 26px; font-size: 0.85rem; text-align: right; background: transparent; border: none; color: #ffd700; font-weight: 700; padding: 0; outline: none;">
                    <span style="color: #ffd700; font-size: 0.75rem; font-weight: 700; margin-left: 2px;">%</span>
                </div>
            </td>
            <td style="padding: 10px 6px; text-align: center;">
                <input type="text" class="p-input country-discount" id="cp-discount-${c.key}" readonly style="width: 50px; height: 32px; font-size: 0.75rem; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); border-radius: 6px; padding: 0;">
            </td>
            <td style="padding: 10px 6px; text-align: center;">
                <input type="checkbox" id="cp-enabled-${c.key}" ${enabledVal ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: #2ecc71;">
            </td>
            <td style="padding: 10px 6px; text-align: center;">
                <button type="button" class="btn-icon" onclick="window.removeAdminCountryRow('${c.key}')" title="Remove ${c.name}" style="color: #ff4d4d; background: rgba(255, 77, 77, 0.12); border: 1px solid rgba(255, 77, 77, 0.3); border-radius: 6px; cursor: pointer; padding: 4px 8px; font-size: 0.8rem; transition: all 0.2s;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
        window.calculateCountryDiscount(c.key);
    });
};

window.filterAdminCountryPricingRows = function() {
    const input = document.getElementById('admin-country-search-input');
    if (!input) return;
    const filter = input.value.toLowerCase().trim();
    document.querySelectorAll('.admin-country-pricing-row').forEach(row => {
        const name = row.getAttribute('data-country-name') || '';
        const key = row.getAttribute('data-country-key') || '';
        if (name.includes(filter) || key.toLowerCase().includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

window.openAddCustomCountryModal = function() {
    const modal = document.getElementById('modal-add-custom-country-pricing');
    const select = document.getElementById('add-country-select');
    if (!modal) return;

    if (select) {
        select.innerHTML = '<option value="">-- Choose from 35+ Countries --</option>';
        if (typeof WORLD_CUSTOM_COUNTRIES !== 'undefined') {
            [...WORLD_CUSTOM_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
                select.innerHTML += `<option value="${c.name}">${c.flag} ${c.name} (${c.currency})</option>`;
            });
        }
        select.innerHTML += '<option value="__custom__">➕ Other / Custom Country...</option>';
    }

    const nameInput = document.getElementById('add-country-name-input');
    const currInput = document.getElementById('add-country-curr-input');
    const flagInput = document.getElementById('add-country-flag-input');
    if (nameInput) nameInput.value = '';
    if (currInput) currInput.value = '';
    if (flagInput) flagInput.value = '';

    modal.style.display = 'flex';
    modal.classList.add('active');
    modal.style.opacity = '1';
};

window.closeAddCustomCountryModal = function() {
    const modal = document.getElementById('modal-add-custom-country-pricing');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.opacity = '0';
    }
};

window.onCustomCountrySelectChanged = function(val) {
    const nameInput = document.getElementById('add-country-name-input');
    const currInput = document.getElementById('add-country-curr-input');
    const flagInput = document.getElementById('add-country-flag-input');
    if (!nameInput || !currInput) return;

    if (val === '__custom__') {
        nameInput.value = '';
        currInput.value = 'USD';
        if (flagInput) flagInput.value = '🌐';
        nameInput.focus();
        return;
    }

    const matched = (typeof WORLD_CUSTOM_COUNTRIES !== 'undefined') ? WORLD_CUSTOM_COUNTRIES.find(c => c.name === val) : null;
    if (matched) {
        nameInput.value = matched.name;
        currInput.value = matched.currency;
        if (flagInput) flagInput.value = matched.flag;
    }
};

window.confirmAddCustomCountry = function() {
    const nameInput = document.getElementById('add-country-name-input');
    const currInput = document.getElementById('add-country-curr-input');
    const flagInput = document.getElementById('add-country-flag-input');
    const tbody = document.getElementById('admin-country-pricing-tbody');

    const name = nameInput ? nameInput.value.trim() : '';
    const currency = currInput ? currInput.value.trim().toUpperCase() : 'USD';
    const flag = (flagInput && flagInput.value.trim()) ? flagInput.value.trim() : '🌐';

    if (!name) {
        alert('Please enter or select a Country Name.');
        return;
    }

    const key = name.replace(/[^a-zA-Z0-9]/g, '');
    if (!key) {
        alert('Invalid country name.');
        return;
    }

    const matchedCustom = (typeof WORLD_CUSTOM_COUNTRIES !== 'undefined') 
        ? WORLD_CUSTOM_COUNTRIES.find(c => c.name.toLowerCase() === name.toLowerCase()) 
        : null;
    const code = matchedCustom ? matchedCustom.code : '';

    // Check if already in table
    const existing = document.querySelector(`.admin-country-pricing-row[data-country-key="${key}"]`);
    if (existing) {
        existing.style.display = '';
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        existing.style.transition = 'all 0.5s ease';
        existing.style.backgroundColor = 'rgba(212, 175, 55, 0.3)';
        setTimeout(() => { existing.style.backgroundColor = ''; }, 2000);
        window.closeAddCustomCountryModal();
        alert(`${name} is already in the table! Highlighted for you.`);
        return;
    }

    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    tr.className = 'admin-country-pricing-row';
    tr.setAttribute('data-country-key', key);
    tr.setAttribute('data-country-name', name);
    tr.setAttribute('data-country-currency', currency);
    tr.setAttribute('data-country-flag', flag);
    tr.setAttribute('data-country-code', code);
    tr.setAttribute('data-is-custom', 'true');
    tr.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
    tr.style.transition = 'background-color 1.5s ease';

    tr.innerHTML = `
        <td style="padding: 10px 8px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.1rem;">${flag}</span>
            <span style="font-weight: 600; font-size: 0.85rem; color: #ffd700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;" title="${name}">${name}</span>
            <span style="font-size: 0.62rem; background: rgba(46, 204, 113, 0.25); color: #2ecc71; padding: 2px 5px; border-radius: 4px; font-weight: 700; margin-left: auto;">NEW</span>
        </td>
        <td style="padding: 10px 6px; text-align: center;">
            <input type="text" class="p-input country-currency" id="cp-curr-${key}" value="${currency}" maxlength="6" style="width: 52px; height: 32px; font-size: 0.75rem; text-align: center; background: rgba(255,255,255,0.08); border: 1px solid rgba(212,175,55,0.4); color: #ffd700; border-radius: 6px; padding: 0; font-weight: 600; text-transform: uppercase;">
        </td>
        <td style="padding: 10px 6px;">
            <input type="number" step="0.01" class="p-input country-price" id="cp-price-${key}" value="" placeholder="0.00" style="width: 100%; max-width: 100px; height: 32px; font-size: 0.85rem; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.5); color: #2ecc71; font-weight: 600;" oninput="window.calculateCountryDiscount('${key}')">
        </td>
        <td style="padding: 10px 6px;">
            <input type="number" step="0.01" class="p-input country-mrp" id="cp-mrp-${key}" value="" placeholder="0.00" style="width: 100%; max-width: 100px; height: 32px; font-size: 0.85rem; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.5); color: white;" oninput="window.calculateCountryDiscount('${key}')">
        </td>
        <td style="padding: 10px 6px; text-align: center;">
            <div style="display: inline-flex; align-items: center; justify-content: center; background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 6px; padding: 0 4px; height: 32px; min-width: 65px;">
                <input type="number" step="0.1" min="0" max="100" class="p-input country-gst" id="cp-gst-${key}" value="0" placeholder="0" style="width: 38px; height: 26px; font-size: 0.85rem; text-align: right; background: transparent; border: none; color: #ffd700; font-weight: 700; padding: 0; outline: none;">
                <span style="color: #ffd700; font-size: 0.75rem; font-weight: 700; margin-left: 2px;">%</span>
            </div>
        </td>
        <td style="padding: 10px 6px; text-align: center;">
            <input type="text" class="p-input country-discount" id="cp-discount-${key}" readonly style="width: 50px; height: 32px; font-size: 0.75rem; text-align: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); border-radius: 6px; padding: 0;">
        </td>
        <td style="padding: 10px 6px; text-align: center;">
            <input type="checkbox" id="cp-enabled-${key}" checked style="width: 16px; height: 16px; cursor: pointer; accent-color: #2ecc71;">
        </td>
        <td style="padding: 10px 6px; text-align: center;">
            <button type="button" class="btn-icon" onclick="window.removeAdminCountryRow('${key}')" title="Remove ${name}" style="color: #ff4d4d; background: rgba(255, 77, 77, 0.12); border: 1px solid rgba(255, 77, 77, 0.3); border-radius: 6px; cursor: pointer; padding: 4px 8px; font-size: 0.8rem; transition: all 0.2s;">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    if (tbody.firstChild) {
        tbody.insertBefore(tr, tbody.firstChild);
    } else {
        tbody.appendChild(tr);
    }

    setTimeout(() => {
        tr.style.backgroundColor = '';
    }, 2500);

    window.closeAddCustomCountryModal();

    const priceInput = document.getElementById(`cp-price-${key}`);
    if (priceInput) priceInput.focus();
};

window.removeAdminCountryRow = function(key) {
    const row = document.querySelector(`.admin-country-pricing-row[data-country-key="${key}"]`);
    if (!row) return;
    const countryName = row.getAttribute('data-country-name') || key;
    if (!confirm(`Are you sure you want to remove ${countryName} from country pricing?`)) return;
    
    row.remove();
    
    if (window._currentEditingProduct?.countryPricing) {
        delete window._currentEditingProduct.countryPricing[key];
        delete window._currentEditingProduct.countryPricing[countryName];
    }
    
    if (typeof showToast === 'function') {
        showToast(`${countryName} removed from pricing table`, 'info');
    }
};

window.editProduct = async function (productId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const product = await res.json();
        if (!res.ok) throw new Error(product.message || 'Failed to fetch');

        document.getElementById('admin-prod-id').value = product._id;
        document.getElementById('admin-prod-title').value = product.title;
        document.getElementById('admin-prod-author').value = product.author || '';
        document.getElementById('admin-prod-type').value = product.type;
        document.getElementById('admin-prod-lang').value = product.language || 'Hindi';
        document.getElementById('admin-prod-volume').value = product.volume || '';
        document.getElementById('admin-prod-price').value = product.price;
        document.getElementById('admin-prod-original-price').value = product.originalPrice || '';
        document.getElementById('admin-prod-discount').value = product.discount || '';
        document.getElementById('admin-prod-stock').value = product.stock || 0;
        document.getElementById('admin-prod-weight').value = product.weight || 0;
        document.getElementById('admin-prod-length').value = product.length || 0;
        document.getElementById('admin-prod-width').value = product.breadth || 0;
        document.getElementById('admin-prod-height').value = product.height || 0;
        document.getElementById('admin-prod-duration').value = product.duration || '';
        document.getElementById('admin-prod-desc').value = product.description || '';

        document.getElementById('admin-prod-subtitle').value = product.subtitle || '';
        document.getElementById('admin-prod-edition').value = product.edition || '';
        document.getElementById('admin-prod-isbn').value = product.isbn || '';
        document.getElementById('admin-prod-dimensions').value = product.dimensions || '';
        document.getElementById('admin-prod-availability').value = product.availability || 'Available';
        document.getElementById('admin-prod-tags').value = Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '');
        document.getElementById('admin-prod-rating').value = product.rating !== undefined ? product.rating : 5;
        document.getElementById('admin-prod-review-count').value = product.reviewCount !== undefined ? product.reviewCount : 2450;
        
        let additionalSpecsStr = '';
        if (product.additionalSpecs) {
            const specsObj = product.additionalSpecs instanceof Map ? Object.fromEntries(product.additionalSpecs) : product.additionalSpecs;
            additionalSpecsStr = Object.entries(specsObj).map(([k, v]) => `${k}: ${v}`).join('\n');
        }
        document.getElementById('admin-prod-additional-specs').value = additionalSpecsStr;

        // Load Lulu POD Configuration
        if (document.getElementById('admin-prod-pod-package-id')) document.getElementById('admin-prod-pod-package-id').value = product.podPackageId || '0600X0900BWSTDPB060UW444MXX';
        if (document.getElementById('admin-prod-pod-hardcover-sku')) document.getElementById('admin-prod-pod-hardcover-sku').value = product.podHardcoverSku || '';
        if (document.getElementById('admin-prod-pod-paperback-sku')) document.getElementById('admin-prod-pod-paperback-sku').value = product.podPaperbackSku || '';
        if (document.getElementById('admin-prod-lulu-cover-url')) document.getElementById('admin-prod-lulu-cover-url').value = product.luluCoverUrl || '';
        if (document.getElementById('admin-prod-lulu-interior-url')) document.getElementById('admin-prod-lulu-interior-url').value = product.luluInteriorUrl || '';

        if (product.thumbnail) document.getElementById('admin-current-cover').innerHTML = `<i class="fas fa-file-image"></i> Current: ${product.thumbnail.split('/').pop()}`;
        if (product.filePath && product.type === 'EBOOK') document.getElementById('admin-current-ebook').innerHTML = `<i class="fas fa-file-pdf"></i> Current: ${product.filePath.split('/').pop()}`;
        if (product.filePath && product.type === 'AUDIOBOOK') {
            const audioPreview = document.getElementById('admin-current-audio');
            if (audioPreview) audioPreview.innerHTML = `<i class="fas fa-file-audio"></i> Current: ${product.filePath.split('/').pop()}`;
        }

        // Load Gallery
        if (product.gallery && product.gallery.length > 0) {
            document.getElementById('admin-current-gallery').innerHTML = `<i class="fas fa-images"></i> ${product.gallery.length} images saved`;
        } else {
            document.getElementById('admin-current-gallery').innerHTML = '';
        }

        // Load Chapters if Audiobook
        if (product.type === 'AUDIOBOOK') {
            document.getElementById('admin-prod-total-chapters').value = product.totalChapters || (product.chapters ? product.chapters.length : 0);
            const container = document.getElementById('admin-chapters-container');
            if (container) {
                container.innerHTML = '';
                if (product.chapters && product.chapters.length > 0) {
                    product.chapters.forEach((ch, idx) => {
                        container.appendChild(window.createChapterCard(idx, ch));
                    });
                }
            }
        }

        // Dynamically render and prefill all imported countries + supported countries
        window.renderAdminCountryPricingRows(product);

        window._currentEditingProduct = product;
        window.toggleAdminFileFields(product.type);
        window.renderMarketingCategoryCheckboxes(product.categories || []);
    } catch (e) {
        console.error(e);
        alert("Error loading product");
    }
};

window.closeProductModal = function () {
    const modal = document.getElementById('admin-product-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

window.toggleAdminFileFields = function (type) {
    if (!type) {
        const sel = document.getElementById('admin-prod-type');
        type = sel ? sel.value : 'HARDCOVER';
    }
    const physical = document.querySelectorAll('.admin-physical-field');
    const digital = document.querySelectorAll('.admin-digital-field');
    const ebook = document.getElementById('admin-field-ebook');
    const audio = document.getElementById('admin-field-audio');
    const duration = document.getElementById('admin-prod-duration-group');

    const cat = window.adminCategories?.find(c => c.slug === type);
    const isDigital = cat ? cat.isDigital : (['EBOOK', 'AUDIOBOOK'].includes(type));

    physical.forEach(el => el.style.display = (!isDigital) ? 'block' : 'none');
    digital.forEach(el => el.style.display = (isDigital) ? 'block' : 'none');
    if (ebook) ebook.style.display = (isDigital && type !== 'AUDIOBOOK') ? 'block' : 'none';
    if (audio) audio.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
    if (duration) duration.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
};

// --- AUDIOBOOK CHAPTER HELPERS ---
window.generateChapterCards = function () {
    const totalInput = document.getElementById('admin-prod-total-chapters');
    const total = parseInt(totalInput?.value || '0');
    if (!total || total < 1) {
        showToast("Please enter a valid number of chapters", "error");
        return;
    }

    if (total > 100) {
        showToast("Maximum 100 chapters allowed", "error");
        return;
    }

    const container = document.getElementById('admin-chapters-container');
    if (!container) return;

    // Preserve existing data if possible
    const existingData = [];
    container.querySelectorAll('.chapter-card').forEach(card => {
        const idx = card.dataset.index;
        const titleEl = document.getElementById(`chapter-title-${idx}`);
        const currEl = document.getElementById(`chapter-current-${idx}`);
        existingData[idx] = {
            title: titleEl ? titleEl.value : '',
            currentFile: currEl ? currEl.innerHTML : ''
        };
    });

    container.innerHTML = '';
    for (let i = 0; i < total; i++) {
        container.appendChild(window.createChapterCard(i, existingData[i]));
    }
    showToast(`Generated ${total} chapter slots`, "success");
};

window.createChapterCard = function (index, data = null) {
    const div = document.createElement('div');
    div.className = 'chapter-card admin-chapter-card fade-in';
    div.dataset.index = index;

    const title = data ? (data.title || (data.chapterNumber ? data.title : '')) : '';
    let fileName = '';
    let hasFile = false;

    if (data) {
        if (data.currentFile) {
            fileName = data.currentFile;
            hasFile = true;
        } else if (data.filePath) {
            fileName = data.filePath.split('/').pop();
            hasFile = true;
        }
    }

    div.innerHTML = `
        <div class="admin-chapter-header">
            <span class="admin-chapter-badge">
                <i class="fas fa-headphones"></i>
                CHAPTER ${index + 1}
            </span>
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="admin-chapter-status-pill ${hasFile ? 'ready' : 'pending'}" id="chapter-status-${index}">
                    ${hasFile ? '<i class="fas fa-check-circle"></i> Audio Ready' : '<i class="fas fa-clock"></i> Audio Pending'}
                </span>
                <button type="button" onclick="window.removeChapter(${index})" class="admin-chapter-del-btn" title="Delete Chapter ${index + 1}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>

        <div class="admin-chapter-input-wrap">
            <label class="admin-chapter-input-label">
                <i class="fas fa-heading" style="color: #D4AF37;"></i>
                Chapter Title / Name
            </label>
            <input type="text" 
                   id="chapter-title-${index}" 
                   class="admin-chapter-title-input" 
                   value="${title}" 
                   placeholder="Enter chapter name (e.g. Chapter ${index + 1}: The Awakening)..." 
                   autocomplete="off">
        </div>

        <div class="admin-chapter-audio-box">
            <div class="admin-chapter-audio-controls">
                <button type="button" class="admin-chapter-file-btn" onclick="document.getElementById('chapter-audio-${index}').click()">
                    <i class="fas fa-file-audio"></i> Choose Audio File
                </button>
                <input type="file" 
                       id="chapter-audio-${index}" 
                       accept="audio/*" 
                       style="display:none;" 
                       onchange="window.updateChapterFileStatus(${index})">
                <span class="admin-chapter-file-name ${hasFile ? 'has-file' : ''}" id="chapter-current-${index}">
                    ${hasFile ? `<i class="fas fa-music"></i> ${fileName}` : 'No audio file selected (.mp3, .m4a)'}
                </span>
            </div>
        </div>
    `;

    return div;
};

window.removeChapter = function (index) {
    if (!confirm(`Are you sure you want to remove Chapter ${index + 1}?`)) return;

    const container = document.getElementById('admin-chapters-container');
    const cards = Array.from(container.querySelectorAll('.chapter-card'));

    const cardToRemove = cards.find(c => parseInt(c.dataset.index) === index);
    if (cardToRemove) {
        cardToRemove.remove();

        const remainingCards = Array.from(container.querySelectorAll('.chapter-card'));
        remainingCards.forEach((card, i) => {
            card.dataset.index = i;

            const badge = card.querySelector('.admin-chapter-badge');
            if (badge) badge.innerHTML = `<i class="fas fa-headphones"></i> CHAPTER ${i + 1}`;

            const status = card.querySelector('[id^="chapter-status-"]');
            if (status) status.id = `chapter-status-${i}`;

            const titleInput = card.querySelector('input[id^="chapter-title-"]');
            if (titleInput) {
                titleInput.id = `chapter-title-${i}`;
                titleInput.placeholder = `Enter chapter name (e.g. Chapter ${i + 1}: The Awakening)...`;
            }

            const fileBtn = card.querySelector('.admin-chapter-file-btn');
            if (fileBtn) fileBtn.setAttribute('onclick', `document.getElementById('chapter-audio-${i}').click()`);

            const fileInput = card.querySelector('input[id^="chapter-audio-"]');
            if (fileInput) {
                fileInput.id = `chapter-audio-${i}`;
                fileInput.setAttribute('onchange', `window.updateChapterFileStatus(${i})`);
            }

            const currentFile = card.querySelector('[id^="chapter-current-"]');
            if (currentFile) currentFile.id = `chapter-current-${i}`;

            const deleteBtn = card.querySelector('.admin-chapter-del-btn');
            if (deleteBtn) {
                deleteBtn.setAttribute('onclick', `window.removeChapter(${i})`);
                deleteBtn.title = `Delete Chapter ${i + 1}`;
            }
        });

        const totalInput = document.getElementById('admin-prod-total-chapters');
        if (totalInput) totalInput.value = remainingCards.length;

        showToast("Chapter removed", "info");
    }
};

window.removeAllChapters = function () {
    const container = document.getElementById('admin-chapters-container');
    const cards = container.querySelectorAll('.chapter-card');
    if (cards.length === 0) return;

    if (confirm(`Are you sure you want to remove all ${cards.length} chapters? This will clear all chapter names and file links.`)) {
        container.innerHTML = '';
        const totalInput = document.getElementById('admin-prod-total-chapters');
        if (totalInput) totalInput.value = 0;
        showToast("All chapters removed", "info");
    }
};

window.deleteCurrentProduct = function () {
    const productId = document.getElementById('admin-prod-id').value;
    if (!productId) {
        showToast("No product to delete", "info");
        return;
    }

    if (confirm('Are you sure you want to PERMANENTLY delete this product? This cannot be undone.')) {
        window.deleteProduct(productId).then(() => {
            closeProductModal();
        });
    }
};

window.updateChapterFileStatus = function (index) {
    const input = document.getElementById(`chapter-audio-${index}`);
    const status = document.getElementById(`chapter-status-${index}`);
    const nameEl = document.getElementById(`chapter-current-${index}`);

    if (input && input.files.length > 0) {
        const file = input.files[0];
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

        if (status) {
            status.className = 'admin-chapter-status-pill ready';
            status.innerHTML = '<i class="fas fa-check-circle"></i> Audio Ready';
        }
        if (nameEl) {
            nameEl.className = 'admin-chapter-file-name has-file';
            nameEl.innerHTML = `<i class="fas fa-music"></i> ${file.name} (${sizeMb} MB)`;
        }

        // Auto-fill title if empty or default
        const titleInput = document.getElementById(`chapter-title-${index}`);
        if (titleInput && (!titleInput.value || titleInput.value.trim() === '' || /^Chapter\s+\d+$/i.test(titleInput.value.trim()))) {
            const cleanTitle = file.name
                .replace(/\.[^/.]+$/, '')
                .replace(/^[0-9\s-_.]+/, '')
                .replace(/[_-]+/g, ' ')
                .trim();
            titleInput.value = cleanTitle || `Chapter ${index + 1}`;
        }
    }
};

window.handleBulkChapterUpload = function (input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const container = document.getElementById('admin-chapters-container');
    let cards = container ? container.querySelectorAll('.chapter-card') : [];

    const totalInput = document.getElementById('admin-prod-total-chapters');
    if (!cards || cards.length < files.length) {
        if (totalInput) totalInput.value = files.length;
        window.generateChapterCards();
        cards = container.querySelectorAll('.chapter-card');
    }

    files.forEach((file, i) => {
        if (cards[i]) {
            const fileInput = document.getElementById(`chapter-audio-${i}`);
            if (fileInput) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                window.updateChapterFileStatus(i);
            }

            const titleInput = document.getElementById(`chapter-title-${i}`);
            if (titleInput && (!titleInput.value || titleInput.value.trim() === '' || /^Chapter\s+\d+$/i.test(titleInput.value.trim()))) {
                const cleanTitle = file.name
                    .replace(/\.[^/.]+$/, '')
                    .replace(/^[0-9\s-_.]+/, '')
                    .replace(/[_-]+/g, ' ')
                    .trim();
                titleInput.value = cleanTitle || `Chapter ${i + 1}`;
            }
        }
    });

    showToast(`Assigned ${files.length} audio files and generated chapter titles!`, "success");
};


window.deleteProduct = async function (id) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            window.loadAdminProductsFull();
            window.updateAdminStats();
        } else alert('Delete failed');
    } catch (e) {
        console.error(e);
    }
};

window.deleteAllProducts = async function () {
    if (!confirm('Are you absolutely sure you want to PERMANENTLY delete ALL books from the database and storage? This action is irreversible.')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/products/delete/all-products`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            showToast('All products deleted successfully', 'success');
            window.loadAdminProductsFull();
            window.updateAdminStats();
            if (typeof window.syncLibraryWithBackend === 'function') window.syncLibraryWithBackend();
        } else {
            alert(data.message || 'Delete failed');
        }
    } catch (e) {
        console.error(e);
        alert('Server error while deleting products');
    }
};

window.updateAdminStats = async function () {
    try {
        const token = localStorage.getItem('authToken');
        console.log(`📊 Updating Admin Stats (URL: ${API_BASE}, Token Present: ${!!token})`);

        const fetchWithAuth = (url) => fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

        const [productsRes, ordersRes, usersRes] = await Promise.all([
            fetch(`${API_BASE}/api/products`).catch(e => ({ ok: false, error: e })),
            fetchWithAuth(`${API_BASE}/api/orders`).catch(e => ({ ok: false, error: e })),
            fetchWithAuth(`${API_BASE}/api/users`).catch(e => ({ ok: false, error: e }))
        ]);

        console.log(`📡 Responses - Products: ${productsRes.ok}, Orders: ${ordersRes.ok}, Users: ${usersRes.ok}`);

        let products = [];
        if (productsRes.ok) {
            const productsJson = await productsRes.json().catch(() => []);
            products = Array.isArray(productsJson) ? productsJson : [];
        }

        let orders = [];
        if (ordersRes.ok) {
            const ordersJson = await ordersRes.json().catch(() => []);
            orders = Array.isArray(ordersJson) ? ordersJson : [];
        }

        let users = [];
        if (usersRes && usersRes.ok) {
            const usersJson = await usersRes.json().catch(() => []);
            users = Array.isArray(usersJson) ? usersJson : [];
        }

        console.log(`📈 Data Loaded - Products: ${products.length}, Orders: ${orders.length}, Users: ${users.length}`);

        const revenue = orders.reduce((sum, o) => {
            if (!o || ['Failed', 'Cancelled', 'Returned'].includes(o.status)) return sum;
            return sum + (Number(o.totalAmount) || 0);
        }, 0);

        // Count cancelled and returned orders
        const cancelledCount = orders.filter(o => o && o.status === 'Cancelled').length;
        const returnedCount = orders.filter(o => o && (o.status === 'Returned' || o.status === 'Return Approved')).length;

        // Update Admin Portal section (primary — visible by default)
        const totalProdEl = document.getElementById('admin-stat-total-products');
        const totalOrderEl = document.getElementById('admin-stat-total-orders');
        const revenueEl = document.getElementById('admin-stat-revenue');
        const cancelledEl = document.getElementById('admin-stat-cancelled');
        const returnsEl = document.getElementById('admin-stat-returns');

        if (totalProdEl) totalProdEl.textContent = products.length;
        if (totalOrderEl) totalOrderEl.textContent = orders.length;
        if (revenueEl) revenueEl.textContent = '₹' + Math.round(revenue).toLocaleString();
        if (cancelledEl) cancelledEl.textContent = cancelledCount;
        if (returnsEl) returnsEl.textContent = returnedCount;

        // Also update Dashboard Overview section (secondary display)
        const dashProd = document.getElementById('dash-stat-total-products');
        const dashOrder = document.getElementById('dash-stat-total-orders');
        const dashRev = document.getElementById('dash-stat-revenue');
        const dashUsers = document.getElementById('dash-stat-users');

        if (dashProd) dashProd.textContent = products.length;
        if (dashOrder) dashOrder.textContent = orders.length;
        if (dashRev) dashRev.textContent = '₹' + Math.round(revenue).toLocaleString();
        if (dashUsers) dashUsers.textContent = users.length || '0';

        console.log("✅ Admin Dashboard Stats Updated Successfully");

    } catch (e) {
        console.error("❌ Admin Stats Update CRITICAL Error:", e);
    }
};

window.loadAdminProductsFull = async function () {
    try {
        console.log("🔄 Loading full product list...");
        const res = await fetch(`${API_BASE}/api/products`);
        allAdminProducts = await res.json();
        window.filterAdminProducts();
    } catch (e) { console.error("Load products error:", e); }
};

window.addEventListener('efv-security-violation', () => {
    // Destroy "decrypted buffers" (clear canvases)
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check - Redirect if not logged in
    const user = JSON.parse(localStorage.getItem('efv_user'));

    if (!user) {
        window.location.href = 'marketplace.html';
        return;
    }

    const userEmail = (user?.email || '').toLowerCase().trim();
    const isAdmin = user && (user.role === 'admin' || userEmail === 'admin@uwo24.com' || userEmail === 'efv@uwo24.com');

    const isAdminPage = window.location.pathname.includes('admin-dashboard.html');
    const isProfilePage = window.location.pathname.includes('profile.html');

    if (isAdminPage && !isAdmin) {
        console.warn("Security: Unauthorized admin access attempt.");
        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html';
        return;
    }

    // 2. If Admin tries to access Customer Profile -> Bounce to Admin Dashboard
    if (isProfilePage && isAdmin) {
        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/admin-dashboard.html';
        return;
    }

    // --- ADMIN HELPERS ---
    window.openAddProductModal = () => window.openProductModal(null);

    window.deleteOrder = async function (id) {
        if (!confirm('Permanently delete this order record?')) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_BASE}/api/orders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Order deleted', 'info');
                loadAdminOrdersFull();
                updateAdminStats();
            } else {
                alert('Failed to delete order');
            }
        } catch (e) { console.error(e); }
    };

    // Mobile Hamburger Toggle
    const dashHamb = document.getElementById('dashboard-hamburger');
    const sideNav = document.querySelector('.sidebar-nav');
    if (dashHamb && sideNav) {
        // Clear existing to avoid double binding
        const newDashHamb = dashHamb.cloneNode(true);
        dashHamb.parentNode.replaceChild(newDashHamb, dashHamb);

        newDashHamb.addEventListener('click', (e) => {
            e.stopPropagation();
            newDashHamb.classList.toggle('active');
            sideNav.classList.toggle('active');
        });

        // Close menu when clicking a nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                newDashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sideNav.contains(e.target) && !newDashHamb.contains(e.target)) {
                newDashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            }
        });
    }

    // Global switchTab Helper
    window.switchTab = function (tabId, subTab = null) {
        const user = JSON.parse(localStorage.getItem('efv_user'));
        const uEmail = (user?.email || '').toLowerCase().trim();
        const isAdmin = user && (user.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com');
        let effectiveTabId = tabId;

        // Map 'dashboard' to 'admin' for admins on this page
        if (tabId === 'dashboard' && isAdmin) effectiveTabId = 'admin';

        // Redirect Admin to Admin Settings
        if (tabId === 'settings' && isAdmin) effectiveTabId = 'admin-settings';

        // Security: Bounce Non-Admins from Admin Sections
        if ((effectiveTabId === 'admin-settings' || effectiveTabId.startsWith('admin-')) && !isAdmin) {
            console.warn("Unauthorized access attempt blocked.");
            window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html';
            return;
        }

        // Try to click the ACTUAL nav button if it exists (using original tabId for lookup)
        const tabBtn = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
        if (tabBtn) {
            tabBtn.click();
        } else {
            // Deactivate all tabs and sections first
            document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(effectiveTabId);
            if (section) section.classList.add('active');
            if (effectiveTabId === 'admin-settings') initializeAdminSettings();
            if (effectiveTabId === 'admin-rag') window.loadRagFiles();
        }

        if (subTab) {
            setTimeout(() => {
                const subTabBtn = document.querySelector(`.settings-tab-btn[data-admin-tab="${subTab}"], .settings-tab-btn[data-settings-tab="${subTab}"]`);
                if (subTabBtn) subTabBtn.click();
            }, 150);
        }
    };

    // 2. Initialize Dashboard
    initializeDashboard(user);

    // Load Admin Stats on page load (not just on tab switch)
    if (isAdmin) {
        setTimeout(() => updateAdminStats(), 500);
    }

    // Initial Notifications Sync
    const initNotifs = JSON.parse(localStorage.getItem('efv_notifications')) || [];
    const unreadCount = initNotifs.filter(n => !n.read).length;
    const badgeEl = document.getElementById('unread-notifications-count');
    if (badgeEl) {
        badgeEl.textContent = unreadCount;
        unreadCount > 0 ? badgeEl.classList.remove('hidden') : badgeEl.classList.add('hidden');
    }

    // 3. Tab Logic
    const tabs = document.querySelectorAll('.nav-item[data-tab]');
    const sections = document.querySelectorAll('.content-section');

    // NEW: URL Param Tab Logic (e.g. ?tab=admin-products)
    const currentUrlParams = new URLSearchParams(window.location.search);
    const requestedTab = currentUrlParams.get('tab') || (currentUrlParams.get('tab-dashboard') === null ? null : 'dashboard');
    if (requestedTab) {
        setTimeout(() => window.switchTab(requestedTab), 100);
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Activate Clicked
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            const section = document.getElementById(targetId);
            if (section) section.classList.add('active');

            // Refresh specific data on tab switch
            if (targetId === 'dashboard') updateDashboardOverview();
            if (targetId === 'admin') updateAdminStats();
            if (targetId === 'library') syncLibraryWithBackend();
            if (targetId === 'notifications') renderNotificationsTab();
            if (targetId === 'admin-orders') loadAdminOrdersFull();
            if (targetId === 'admin-products') loadAdminProductsFull();
            if (targetId === 'admin-homepage-books') window.loadAdminHomepageBooks();
            if (targetId === 'admin-categories') window.loadAdminCategories();
            if (targetId === 'admin-offers') window.loadAdminOffers();
            if (targetId === 'admin-payments') loadAdminPayments();
            if (targetId === 'admin-shipments') loadAdminShipments();
            if (targetId === 'admin-coupons') loadAdminCoupons();
            if (targetId === 'admin-customers') loadAdminCustomers();
            if (targetId === 'admin-support') loadAdminSupport();
            if (targetId === 'admin-contacts') loadAdminContacts();
            if (targetId === 'admin-notify') loadNotifyRequests();
            if (targetId === 'admin-returns') loadAdminReturns();
            if (targetId === 'admin-partners') {
                if (typeof window.fetchPartners === 'function') window.fetchPartners();
            }
            if (targetId === 'admin-partner-messages') {
                if (typeof window.fetchPartnerMessages === 'function') window.fetchPartnerMessages();
            }
            if (targetId === 'admin-insights') {
                if (typeof window.loadAdminInsights === 'function') window.loadAdminInsights();
            }
            if (targetId === 'admin-leads') {
                if (typeof window.initLeadsWebhookUrl === 'function') window.initLeadsWebhookUrl();
                if (typeof window.loadLeads === 'function') window.loadLeads(1);
            }
            if (targetId === 'admin-rag') window.loadRagFiles();
            if (targetId === 'admin-country-pricing') {
                if (typeof window.cpLoadModule === 'function') window.cpLoadModule();
                else if (typeof window.cpRefreshVolumes === 'function') window.cpRefreshVolumes();
            }

            // ROLE BASED SETTINGS REDIRECTION
            if (targetId === 'settings') {
                const uEmail = (user?.email || '').toLowerCase().trim();
                const isAdmin = user && (user.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com');
                if (isAdmin) {
                    // Force admin to the control center
                    sections.forEach(s => s.classList.remove('active'));
                    const adminSettingsSection = document.getElementById('admin-settings');
                    if (adminSettingsSection) adminSettingsSection.classList.add('active');
                    initializeAdminSettings();
                } else {
                    initializeSettingsTabs();
                }
            }

            // Security Rule: Prevent customers from accessing admin-settings directly
            if (targetId === 'admin-settings') {
                const uEmail = (user?.email || '').toLowerCase().trim();
                const isAdmin = user && (user.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com');
                if (!isAdmin) {
                    window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html'; // Bounce back
                } else {
                    initializeAdminSettings();
                }
            }
        });
    });

    // 3.1 Settings Internals
    const initializeSettingsTabs = () => {
        const sTabs = document.querySelectorAll('.settings-tab-btn[data-settings-tab]');
        const sPanes = document.querySelectorAll('#settings .settings-pane');
        sTabs.forEach(t => {
            t.addEventListener('click', () => {
                sTabs.forEach(btn => btn.classList.remove('active'));
                sPanes.forEach(pane => pane.style.display = 'none');
                t.classList.add('active');
                const target = t.getAttribute('data-settings-tab');
                const targetPane = document.getElementById(target);
                if (targetPane) targetPane.style.display = 'block';
                if (target === 'addresses-tab') renderSavedAddresses();
                if (target === 'payments-tab') loadBillingHistory();
            });
        });
    };
    window.initializeSettingsTabs = initializeSettingsTabs; // Make it global

    const initializeAdminSettings = () => {
        const user = JSON.parse(localStorage.getItem('efv_user'));
        if (!user) return;

        // 1. Fill Data
        if (document.getElementById('adm-name')) document.getElementById('adm-name').value = user.name || '';
        if (document.getElementById('adm-email')) document.getElementById('adm-email').value = user.email || '';
        if (document.getElementById('admin-full-name')) document.getElementById('admin-full-name').textContent = user.name || 'Admin';
        if (document.getElementById('adm-last-login')) {
            document.getElementById('adm-last-login').value = new Date().toLocaleString();
        }
        const initials = (user.name || 'SA').split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'SA';
        const avatarBox = document.getElementById('admin-avatar-initials');
        if (avatarBox) avatarBox.textContent = initials;

        // Load Store Config from Database
        const applyStoreConfigToUi = (config) => {
            if (!config) return;
            if (document.getElementById('store-global-name')) document.getElementById('store-global-name').value = config.globalName || '';
            if (document.getElementById('store-support-hotline')) document.getElementById('store-support-hotline').value = config.hotline || '';
            if (document.getElementById('store-support-email')) document.getElementById('store-support-email').value = config.email || '';
            if (document.getElementById('store-base-currency')) document.getElementById('store-base-currency').value = config.currency || 'INR';
            if (document.getElementById('store-tax-rate')) document.getElementById('store-tax-rate').value = config.taxRate ?? '18';
            if (document.getElementById('store-invoice-prefix')) document.getElementById('store-invoice-prefix').value = config.invoicePrefix || '';
        };

        const cachedStoreConfig = JSON.parse(localStorage.getItem('efv_store_config'));
        if (cachedStoreConfig) applyStoreConfigToUi(cachedStoreConfig);

        fetch(`${API_BASE}/api/settings/store`)
            .then(res => res.json())
            .then(data => {
                if (data && data.config) {
                    applyStoreConfigToUi(data.config);
                    localStorage.setItem('efv_store_config', JSON.stringify(data.config));
                }
            })
            .catch(e => console.warn('Could not fetch store settings from API:', e));

        // 2. Sub-tab Switching
        const aTabs = document.querySelectorAll('.settings-tab-btn[data-admin-tab]');
        const aPanes = document.querySelectorAll('#admin-settings .settings-pane');

        aTabs.forEach(t => {
            t.addEventListener('click', () => {
                aTabs.forEach(btn => btn.classList.remove('active'));
                aPanes.forEach(pane => pane.style.display = 'none');
                t.classList.add('active');
                const targetId = t.getAttribute('data-admin-tab');
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.style.display = 'block';
                if (targetId === 'admin-alerts-pane') renderNotificationsTab();
                if (targetId === 'admin-security-pane') ensurePasswordToggles();
            });
        });

        // 3. Load Notification Prefs
        const alertPrefs = JSON.parse(localStorage.getItem('efv_admin_alerts')) || {
            'alert-new-order': true,
            'alert-payment-fail': true,
            'alert-new-user': false,
            'alert-refund': true
        };
        Object.keys(alertPrefs).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (alertPrefs[id]) el.classList.add('active');
                else el.classList.remove('active');
            }
        });

        // 4. Notification Filter Listeners
        document.querySelectorAll('[data-notif-filter]').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('[data-notif-filter]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderNotifications(btn.dataset.notifFilter);
            };
        });

        if (document.getElementById('mark-notifs-read-btn')) {
            document.getElementById('mark-notifs-read-btn').onclick = () => {
                const notifs = JSON.parse(localStorage.getItem('efv_notifications')) || [];
                notifs.forEach(n => n.read = true);
                localStorage.setItem('efv_notifications', JSON.stringify(notifs));
                renderNotificationsTab(document.querySelector('[data-notif-filter].active')?.dataset.notifFilter || 'all');
                showToast("All notifications marked as read", "success");
            };
        }

        if (document.getElementById('clear-notifs-btn')) {
            document.getElementById('clear-notifs-btn').onclick = () => {
                if (confirm("Delete all notifications?")) {
                    localStorage.setItem('efv_notifications', JSON.stringify([]));
                    renderNotificationsTab();
                    showToast("Notifications cleared", "success");
                }
            };
        }

        // 5. Save Alert Prefs Listener
        const saveAlertBtn = document.getElementById('save-alert-prefs-btn');
        if (saveAlertBtn) {
            saveAlertBtn.onclick = () => {
                const prefs = {
                    'alert-new-order': document.getElementById('alert-new-order').classList.contains('active'),
                    'alert-payment-fail': document.getElementById('alert-payment-fail').classList.contains('active'),
                    'alert-new-user': document.getElementById('alert-new-user').classList.contains('active'),
                    'alert-refund': document.getElementById('alert-refund').classList.contains('active')
                };
                localStorage.setItem('efv_admin_alerts', JSON.stringify(prefs));
                showToast("Notification preferences updated", "success");
            };
        }

        // 5. Active Browser Sessions (Strict Concurrency Limit: Max 3 Browsers)
        const loadAdminSessions = async () => {
            const logContainer = document.getElementById('admin-login-logs');
            const token = localStorage.getItem('authToken');
            if (!logContainer) return;

            try {
                const res = await fetch(`${API_BASE}/api/auth/sessions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const sessions = data.sessions || [];
                    
                    const badge = document.getElementById('session-limit-badge');
                    if (badge) {
                        badge.textContent = `Active Sessions: ${sessions.length} / 3 (Max 3 Browsers Allowed)`;
                    }

                    if (sessions.length === 0) {
                        logContainer.innerHTML = '<p class="fade-text" style="font-size: 0.85rem; padding: 10px 0;">No active sessions found.</p>';
                        return;
                    }

                    logContainer.innerHTML = sessions.map(s => `
                        <div style="display:grid; grid-template-columns: 1.2fr 1fr 1.5fr; gap:10px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.75rem; align-items: center;">
                            <span>${s.time}</span>
                            <span style="opacity:0.8; font-family: monospace;">${s.ip}</span>
                            <span style="opacity:0.85; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                ${s.device} ${s.isCurrent ? '<strong style="color: #2ed573; margin-left: 6px; font-size: 0.7rem; background: rgba(46,213,115,0.12); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(46,213,115,0.3);">(Current)</strong>' : ''}
                            </span>
                        </div>
                    `).join('');
                }
            } catch (err) {
                console.warn('Could not load active sessions:', err);
            }
        };

        loadAdminSessions();

        const killSessionsBtn = document.getElementById('kill-sessions-btn');
        if (killSessionsBtn) {
            killSessionsBtn.onclick = async () => {
                if (!confirm("Are you sure you want to terminate all other active browser sessions? Only this current browser will remain logged in.")) {
                    return;
                }
                const token = localStorage.getItem('authToken');
                killSessionsBtn.disabled = true;
                killSessionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Terminating...';
                try {
                    const res = await fetch(`${API_BASE}/api/auth/kill-sessions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await res.json();
                    if (res.ok) {
                        showToast(data.message || "All other browser sessions terminated!", "success");
                        await loadAdminSessions();
                    } else {
                        showToast(data.message || "Failed to terminate sessions", "error");
                    }
                } catch (e) {
                    showToast("Error terminating sessions", "error");
                } finally {
                    killSessionsBtn.disabled = false;
                    killSessionsBtn.innerHTML = 'Kill Other Sessions';
                }
            };
        }

        // 6. Toggle switches logic
        document.querySelectorAll('.toggle-switch').forEach(sw => {
            sw.onclick = () => sw.classList.toggle('active');
        });

        // 7. Security Extra Actions (2-Factor Authentication)
        const update2FAUi = (isEnabled) => {
            const btn = document.getElementById('2fa-toggle-btn');
            if (!btn) return;
            if (isEnabled) {
                btn.textContent = 'ENABLED';
                btn.style.cssText = 'min-width: 90px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; transition: all 0.3s ease; background: rgba(46, 213, 115, 0.15); border: 1.5px solid #2ed573; color: #2ed573; box-shadow: 0 0 12px rgba(46, 213, 115, 0.25); cursor: pointer; border-radius: 6px; padding: 6px 14px;';
            } else {
                btn.textContent = 'DISABLED';
                btn.style.cssText = 'min-width: 90px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; transition: all 0.3s ease; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.6); cursor: pointer; border-radius: 6px; padding: 6px 14px;';
            }
        };

        const tfaBtn = document.getElementById('2fa-toggle-btn');
        if (tfaBtn) {
            const currentUser = JSON.parse(localStorage.getItem('efv_user')) || {};
            update2FAUi(currentUser.twoFactorEnabled !== false);

            tfaBtn.onclick = async () => {
                const token = localStorage.getItem('authToken');
                tfaBtn.disabled = true;
                try {
                    const res = await fetch(`${API_BASE}/api/auth/toggle-2fa`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        let u = JSON.parse(localStorage.getItem('efv_user')) || {};
                        u.twoFactorEnabled = data.twoFactorEnabled;
                        localStorage.setItem('efv_user', JSON.stringify(u));
                        update2FAUi(data.twoFactorEnabled);
                        showToast(data.message, "success");
                    } else {
                        showToast(data.message || "Failed to toggle 2FA", "error");
                    }
                } catch (e) {
                    showToast("Server connection error", "error");
                } finally {
                    tfaBtn.disabled = false;
                }
            };
        }

        const killBtn = document.getElementById('kill-sessions-btn');
        if (killBtn) {
            killBtn.onclick = () => {
                if (confirm("Are you sure you want to terminate all other active sessions for this account?")) {
                    showToast("Other sessions terminated successfully", "success");
                }
            };
        }

        // 8. Update Admin Identity Listener
        const saveAdminProfile = async () => {
            const nameInput = document.getElementById('adm-name');
            const emailInput = document.getElementById('adm-email');
            const statusEl = document.getElementById('admin-profile-status');
            const updateBtn = document.getElementById('update-admin-btn');
            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const token = localStorage.getItem('authToken');

            if (!name) {
                showToast("Name cannot be empty", "error");
                if (statusEl) {
                    statusEl.style.display = 'inline-block';
                    statusEl.style.color = '#ff6b6b';
                    statusEl.textContent = '❌ Name cannot be empty';
                }
                return;
            }
            if (!email) {
                showToast("Email cannot be empty", "error");
                if (statusEl) {
                    statusEl.style.display = 'inline-block';
                    statusEl.style.color = '#ff6b6b';
                    statusEl.textContent = '❌ Email cannot be empty';
                }
                return;
            }

            if (updateBtn) {
                updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                updateBtn.disabled = true;
            }
            if (statusEl) {
                statusEl.style.display = 'inline-block';
                statusEl.style.color = '#FFD369';
                statusEl.textContent = 'Saving changes...';
            }

            try {
                const res = await fetch(`${API_BASE}/api/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name, email })
                });

                const data = await res.json();

                if (res.ok) {
                    // Update local storage user object
                    let user = JSON.parse(localStorage.getItem('efv_user')) || {};
                    user.name = name;
                    user.email = email;
                    localStorage.setItem('efv_user', JSON.stringify(user));

                    if (localStorage.getItem('efv_auth_user')) {
                        let authUser = JSON.parse(localStorage.getItem('efv_auth_user')) || {};
                        authUser.name = name;
                        authUser.email = email;
                        if (data.token) {
                            authUser.token = data.token;
                            localStorage.setItem('authToken', data.token);
                        }
                        localStorage.setItem('efv_auth_user', JSON.stringify(authUser));
                    } else if (data.token) {
                        localStorage.setItem('authToken', data.token);
                    }

                    // Update UI
                    if (document.getElementById('admin-full-name')) {
                        document.getElementById('admin-full-name').textContent = name;
                    }
                    if (document.getElementById('sidebar-user-name')) {
                        document.getElementById('sidebar-user-name').textContent = name;
                    }
                    const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'SA';
                    const avatarBox = document.getElementById('admin-avatar-initials');
                    if (avatarBox) avatarBox.textContent = initials;

                    showToast("Admin profile saved successfully", "success");
                    if (statusEl) {
                        statusEl.style.display = 'inline-block';
                        statusEl.style.color = '#2ed573';
                        statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Saved successfully!';
                        setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
                    }
                } else {
                    showToast(data.message || "Failed to update", "error");
                    if (statusEl) {
                        statusEl.style.display = 'inline-block';
                        statusEl.style.color = '#ff6b6b';
                        statusEl.textContent = '❌ ' + (data.message || "Failed to update");
                    }
                }
            } catch (e) {
                console.error(e);
                showToast("Server error", "error");
                if (statusEl) {
                    statusEl.style.display = 'inline-block';
                    statusEl.style.color = '#ff6b6b';
                    statusEl.textContent = '❌ Server connection error';
                }
            } finally {
                if (updateBtn) {
                    updateBtn.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i> Save Changes';
                    updateBtn.disabled = false;
                }
            }
        };

        const updateBtn = document.getElementById('update-admin-btn');
        if (updateBtn) {
            updateBtn.onclick = (e) => {
                e.preventDefault();
                saveAdminProfile();
            };
        }

        const profileForm = document.getElementById('admin-profile-form');
        if (profileForm) {
            profileForm.onsubmit = (e) => {
                e.preventDefault();
                saveAdminProfile();
            };
        }

        ['adm-name', 'adm-email'].forEach(id => {
            const input = document.getElementById(id);
            if (input && !input.dataset.hasEnterListener) {
                input.dataset.hasEnterListener = 'true';
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveAdminProfile();
                    }
                });
            }
        });

        // 4. Update Password with 2-Factor Authentication (Email OTP)
        let otpCountdownInterval = null;
        const startOtpCountdown = () => {
            clearInterval(otpCountdownInterval);
            let timeLeft = 600; // 10 minutes in seconds
            const timerEl = document.getElementById('otp-timer-seconds');
            if (!timerEl) return;
            timerEl.textContent = '10:00';
            otpCountdownInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(otpCountdownInterval);
                    timerEl.textContent = 'Expired';
                    showToast('Verification code expired. Please request a new one.', 'error');
                    return;
                }
                const m = Math.floor(timeLeft / 60);
                const s = timeLeft % 60;
                timerEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
            }, 1000);
        };

        const passBtn = document.getElementById('update-admin-pass-btn');
        const passForm = document.getElementById('admin-password-form');
        const otpBox = document.getElementById('admin-pwd-otp-box');
        const otpInput = document.getElementById('admin-pwd-otp-input');
        const verifyOtpBtn = document.getElementById('admin-pwd-verify-otp-btn');
        const cancelOtpBtn = document.getElementById('admin-pwd-otp-cancel');
        const resendOtpBtn = document.getElementById('admin-pwd-resend-otp-btn');
        const otpError = document.getElementById('admin-pwd-otp-error');
        const otpHint = document.getElementById('admin-pwd-otp-hint');

        const requestPasswordChangeOtp = async () => {
            const oldPassword = document.getElementById('adm-current-pass')?.value;
            const newPassword = document.getElementById('adm-new-pass')?.value;
            const token = localStorage.getItem('authToken');

            if (!oldPassword || !newPassword) {
                showToast("Both current and new passwords are required", "error");
                return;
            }

            if (newPassword.length < 6) {
                showToast("New password must be at least 6 characters", "error");
                return;
            }

            if (passBtn) {
                passBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending Security OTP...';
                passBtn.disabled = true;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/send-password-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ oldPassword, newPassword })
                });

                if (res.status === 404) {
                    // Backend process is running an older instance before route was mounted; fallback gracefully to change-password
                    console.warn("send-password-otp route returned 404. Falling back to change-password while server awaits restart.");
                    const fallbackRes = await fetch(`${API_BASE}/api/auth/change-password`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ oldPassword, newPassword })
                    });
                    const fallbackData = await fallbackRes.json();
                    if (fallbackRes.ok) {
                        showToast("Password updated! (Restart backend to enable Email OTP)", "success");
                        const cPass = document.getElementById('adm-current-pass');
                        const nPass = document.getElementById('adm-new-pass');
                        if (cPass) cPass.value = '';
                        if (nPass) nPass.value = '';
                    } else {
                        showToast(fallbackData.message || "Failed to update password", "error");
                    }
                    return;
                }

                const data = await res.json();

                if (res.ok && data.requiresOtp) {
                    if (otpBox) otpBox.style.display = 'block';
                    if (passForm) passForm.style.display = 'none';
                    
                    if (otpHint) {
                        if (!data.emailSent && data.devOtp) {
                            otpHint.innerHTML = `
                                <span style="color: #ff9f43; font-size: 0.8rem; display: block; margin-bottom: 6px;">
                                    ⚠️ <b>Notice:</b> Gmail SMTP App Password has expired in .env (BadCredentials).
                                </span>
                                <div style="background: rgba(255, 211, 105, 0.12); border: 1.5px dashed #FFD369; padding: 10px; border-radius: 8px; text-align: center; margin: 10px 0;">
                                    <span style="font-size: 0.78rem; color: rgba(255,255,255,0.7); display: block;">Your Security Verification Code:</span>
                                    <span style="font-size: 1.5rem; font-weight: 800; letter-spacing: 6px; color: #FFD369; font-family: monospace;">${data.devOtp}</span>
                                </div>
                                <span style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">Code has been auto-filled below. Click <b>Verify & Save</b> to confirm:</span>
                            `;
                        } else {
                            otpHint.innerHTML = `A 6-digit verification code has been dispatched to <b>${data.maskedEmail || 'your registered email'}</b>. Enter it below to confirm:`;
                        }
                    }

                    if (data.devOtp) {
                        console.log("%c🔐 EFV Admin OTP Code: " + data.devOtp, "color: #FFD369; font-size: 16px; font-weight: bold; background: #222; padding: 4px 8px; border-radius: 4px;");
                    }
                    if (otpError) otpError.style.display = 'none';
                    if (otpInput) {
                        otpInput.value = (!data.emailSent && data.devOtp) ? data.devOtp : '';
                        setTimeout(() => otpInput.focus(), 100);
                    }
                    startOtpCountdown();
                    showToast(data.emailSent ? "Security OTP sent to your registered email" : "SMTP Expired: OTP displayed on screen", data.emailSent ? "info" : "warning");
                } else {
                    showToast(data.message || "Failed to process request", "error");
                }
            } catch (e) {
                console.error(e);
                showToast("Server connection error", "error");
            } finally {
                if (passBtn) {
                    passBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
                    passBtn.disabled = false;
                }
            }
        };

        const verifyPasswordOtpAndSave = async () => {
            const otp = otpInput ? otpInput.value.trim() : '';
            const token = localStorage.getItem('authToken');

            if (!otp || otp.length < 6) {
                showToast("Please enter the complete 6-digit verification code", "error");
                if (otpError) {
                    otpError.style.display = 'block';
                    otpError.textContent = "Please enter the complete 6-digit code";
                }
                return;
            }

            if (verifyOtpBtn) {
                verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
                verifyOtpBtn.disabled = true;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/verify-password-otp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ otp })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    showToast("Password updated successfully with 2-Factor verification!", "success");
                    clearInterval(otpCountdownInterval);
                    if (otpBox) otpBox.style.display = 'none';
                    if (passForm) passForm.style.display = 'flex';
                    const cPass = document.getElementById('adm-current-pass');
                    const nPass = document.getElementById('adm-new-pass');
                    if (cPass) cPass.value = '';
                    if (nPass) nPass.value = '';

                    // Update 2FA status to enabled
                    let u = JSON.parse(localStorage.getItem('efv_user')) || {};
                    u.twoFactorEnabled = true;
                    localStorage.setItem('efv_user', JSON.stringify(u));
                    update2FAUi(true);
                } else {
                    showToast(data.message || "Verification failed", "error");
                    if (otpError) {
                        otpError.style.display = 'block';
                        otpError.textContent = data.message || "Incorrect verification code";
                    }
                }
            } catch (e) {
                console.error(e);
                showToast("Error verifying code", "error");
            } finally {
                if (verifyOtpBtn) {
                    verifyOtpBtn.innerHTML = 'Verify & Save';
                    verifyOtpBtn.disabled = false;
                }
            }
        };

        if (passBtn) {
            passBtn.onclick = (e) => {
                e.preventDefault();
                requestPasswordChangeOtp();
            };
        }

        if (passForm) {
            passForm.onsubmit = (e) => {
                e.preventDefault();
                requestPasswordChangeOtp();
            };
        }

        if (verifyOtpBtn) {
            verifyOtpBtn.onclick = (e) => {
                e.preventDefault();
                verifyPasswordOtpAndSave();
            };
        }

        if (otpInput) {
            otpInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    verifyPasswordOtpAndSave();
                }
            });
        }

        if (cancelOtpBtn) {
            cancelOtpBtn.onclick = () => {
                clearInterval(otpCountdownInterval);
                if (otpBox) otpBox.style.display = 'none';
                if (passForm) passForm.style.display = 'flex';
            };
        }

        if (resendOtpBtn) {
            resendOtpBtn.onclick = (e) => {
                e.preventDefault();
                requestPasswordChangeOtp();
            };
        }

        ['adm-current-pass', 'adm-new-pass'].forEach(id => {
            const input = document.getElementById(id);
            if (input && !input.dataset.hasEnterListener) {
                input.dataset.hasEnterListener = 'true';
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        requestPasswordChangeOtp();
                    }
                });
            }
        });

        // 4b. Password Visibility Toggles (Resilient Auto-Injection & Binding)
        const ensurePasswordToggles = () => {
            ['adm-current-pass', 'adm-new-pass', 'user-current-pass', 'user-new-pass', 'user-confirm-pass'].forEach(id => {
                const input = document.getElementById(id);
                if (!input) return;

                let parent = input.parentElement;
                if (!parent) return;

                // Make sure parent is relative
                const parentPos = window.getComputedStyle(parent).position;
                if (parentPos === 'static') {
                    parent.style.position = 'relative';
                }
                input.style.paddingRight = '48px';

                let existingBtn = parent.querySelector(`.password-toggle-btn[data-target="${id}"]`) || parent.querySelector('.password-toggle-btn');
                if (!existingBtn) {
                    existingBtn = document.createElement('button');
                    existingBtn.type = 'button';
                    existingBtn.className = 'password-toggle-btn';
                    existingBtn.setAttribute('data-target', id);
                    existingBtn.title = 'Show / Hide Password';
                    existingBtn.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #FFD369; font-size: 1.15rem; padding: 6px 10px; z-index: 10; display: flex; align-items: center; justify-content: center; outline: none;';
                    existingBtn.innerHTML = '<i class="fas fa-eye"></i>';
                    parent.appendChild(existingBtn);
                }
            });

            document.querySelectorAll('.password-toggle-btn').forEach(btn => {
                if (!btn.dataset.hasToggleBound) {
                    btn.dataset.hasToggleBound = 'true';
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const targetId = btn.getAttribute('data-target');
                        const targetInput = targetId ? document.getElementById(targetId) : btn.parentElement.querySelector('input');
                        if (!targetInput) return;

                        const isPassword = targetInput.type === 'password';
                        targetInput.type = isPassword ? 'text' : 'password';
                        const icon = btn.querySelector('i') || btn;
                        if (isPassword) {
                            icon.className = 'fas fa-eye-slash';
                            btn.style.color = '#FFD369';
                        } else {
                            icon.className = 'fas fa-eye';
                            btn.style.color = '#FFD369';
                        }
                    });
                }
            });
        };
        ensurePasswordToggles();

        // 5. Sync Store Settings Listener
        const syncBtn = document.getElementById('sync-store-settings-btn');
        if (syncBtn) {
            syncBtn.onclick = async () => {
                const config = {
                    globalName: document.getElementById('store-global-name')?.value || "EFV™ Official Store",
                    hotline: document.getElementById('store-support-hotline')?.value || "+91 98765 43210",
                    email: document.getElementById('store-support-email')?.value || "support@efv.com",
                    currency: document.getElementById('store-base-currency')?.value || "INR",
                    taxRate: document.getElementById('store-tax-rate')?.value || "18",
                    invoicePrefix: document.getElementById('store-invoice-prefix')?.value || "EFV-2026-"
                };

                const token = localStorage.getItem('authToken');
                syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to Database...';
                syncBtn.disabled = true;

                try {
                    const res = await fetch(`${API_BASE}/api/settings/store`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(config)
                    });
                    const data = await res.json();
                    if (res.ok && data.success) {
                        localStorage.setItem('efv_store_config', JSON.stringify(data.config || config));
                        if (typeof window.syncFooterConfig === 'function') {
                            window.syncFooterConfig();
                        }
                        showToast("Store settings saved to Database & synced across website!", "success");
                    } else {
                        showToast(data.message || "Failed to save settings", "error");
                    }
                } catch (err) {
                    console.error('Sync store error:', err);
                    showToast("Error connecting to server", "error");
                } finally {
                    syncBtn.innerHTML = 'Sync Store Settings';
                    syncBtn.disabled = false;
                }
            };

            ['store-global-name', 'store-support-hotline', 'store-support-email', 'store-tax-rate', 'store-invoice-prefix'].forEach(id => {
                const input = document.getElementById(id);
                if (input && !input.dataset.hasEnterListener) {
                    input.dataset.hasEnterListener = 'true';
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            syncBtn.click();
                        }
                    });
                }
            });
        }
    };
    window.initializeAdminSettings = initializeAdminSettings; // Make it global

    // ─── AUDIOBOOK PLAYER IMPLEMENTATION (Resume Support) ───
    window.filterLibraryView = function (mode) {
        document.querySelectorAll('.library-sub-tab').forEach(b => b.classList.remove('active'));
        document.querySelector(`.library-sub-tab[data-library-tab="${mode}"]`)?.classList.add('active');

        const allGrid = document.getElementById('dashboard-library-list');
        const audioGrid = document.getElementById('dashboard-audiobooks-list');

        if (mode === 'all') {
            allGrid.style.display = ''; if (audioGrid) audioGrid.style.display = 'none';
            renderLibraryTab();
        } else if (mode === 'ebooks') {
            allGrid.style.display = ''; if (audioGrid) audioGrid.style.display = 'none';
            renderLibraryTab(null, 'ebook');
        } else if (mode === 'audiobooks') {
            if (audioGrid) {
                allGrid.style.display = 'none'; audioGrid.style.display = '';
                renderAudiobooksGrid();
            } else {
                allGrid.style.display = '';
                renderLibraryTab(null, 'audio');
            }
        } else if (mode === 'vol1') {
            allGrid.style.display = ''; if (audioGrid) audioGrid.style.display = 'none';
            renderLibraryTab(null, 'vol1');
        } else if (mode === 'vol2') {
            allGrid.style.display = ''; if (audioGrid) audioGrid.style.display = 'none';
            renderLibraryTab(null, 'vol2');
        }
    };

    async function renderAudiobooksGrid() {
        const libKey = getUserKey('efv_digital_library');
        const library = JSON.parse(localStorage.getItem(libKey)) || [];
        const audiobooks = library.filter(i => (i.type || '').toLowerCase().includes('audio'));
        const container = document.getElementById('dashboard-audiobooks-list');
        const emptyState = document.getElementById('library-empty-state');

        if (audiobooks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        const token = localStorage.getItem('authToken');

        const cards = await Promise.all(audiobooks.map(async (item) => {
            const prodId = item.productId || item.id || item._id;
            let totalChapters = 0, completedChapters = 0, remainingChapters = 0;
            let lastChapterIdx = 0, lastChapterTime = 0;

            // Fetch product for chapter info
            let productData = null;
            let itemPrice = 'Purchased';
            try {
                const pRes = await fetch(`${API_BASE}/api/products/${prodId}`);
                if (pRes.ok) productData = await pRes.json();
            } catch (e) { }

            if (productData) {
                totalChapters = (productData.chapters || []).filter(c => c.filePath).length || productData.totalChapters || 0;
                itemPrice = productData.discountPrice ? `₹${productData.discountPrice}` : (productData.price ? `₹${productData.price}` : 'Purchased');
            }

            // Fetch chapter-level progress
            let abProgress = null;
            try {
                const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${prodId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (apRes.ok) abProgress = await apRes.json();
            } catch (e) { }

            if (abProgress && abProgress.chapters) {
                completedChapters = abProgress.totalCompletedChapters || abProgress.chapters.filter(c => c.completed).length;
                lastChapterIdx = abProgress.currentChapterIndex || 0;
                lastChapterTime = abProgress.currentChapterTime || 0;
            }
            remainingChapters = Math.max(0, totalChapters - completedChapters);
            const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

            // Thumbnail resolution - same logic as marketplace.html
            let thumbUrl = CONFIG.BASE_PATH + 'assets/images/vol1-cover.png';
            if (item.thumbnail) {
                if (item.thumbnail.startsWith('http') || item.thumbnail.startsWith(CONFIG.BASE_PATH + 'assets/images/')) {
                    thumbUrl = item.thumbnail;
                } else if (item.thumbnail.startsWith('img/')) {
                    thumbUrl = CONFIG.BASE_PATH + 'assets/images/' + item.thumbnail.replace('img/', '');
                } else {
                    thumbUrl = `${API_BASE}/${item.thumbnail}`;
                }
            }

            const hasProgress = lastChapterTime > 0 || completedChapters > 0;
            const continueLabel = hasProgress ? `<i class="fas fa-play"></i> Continue Listening` : `<i class="fas fa-headphones"></i> Start Listening`;

            return `
            <div class="audiobook-card fade-in">
                <div class="audiobook-card-inner">
                    <button onclick="event.stopPropagation(); removeFromLibrary('${prodId}')" 
                        style="position: absolute; top: 15px; left: 15px; width: 34px; height: 34px; border-radius: 10px; background: rgba(255, 77, 77, 0.25); border: 1px solid rgba(255, 77, 77, 0.4); color: #ff6b6b; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 100; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.3); backdrop-filter: blur(4px);"
                        onmouseover="this.style.background='#ff4d4d'; this.style.color='white'"
                        onmouseout="this.style.background='rgba(255, 77, 77, 0.25)'; this.style.color='#ff6b6b'">
                        <i class="fas fa-trash-alt" style="font-size: 0.9rem;"></i>
                    </button>
                    <img src="${thumbUrl}" alt="${item.name || item.title}" class="audiobook-card-cover" onerror="this.src='${CONFIG.BASE_PATH}assets/images/vol1-cover.png'">
                    <div class="audiobook-card-info">
                        <h3 class="audiobook-card-title">${item.name || item.title}</h3>
                        ${item.language ? `<span style="display:inline-block; background:rgba(212,175,55,0.12); border:1px solid rgba(255,211,105,0.2); color:var(--gold-text); padding:2px 8px; border-radius:4px; font-size:0.65rem; font-weight:700; text-transform:uppercase; margin-bottom:6px; width:fit-content;">${item.language} Edition</span>` : ''}
                        <div class="audiobook-card-price" style="font-size: 0.9rem; color: var(--gold-text); font-weight: 700; margin-bottom: 8px;">${itemPrice}</div>
                        <div class="audiobook-card-stats">
                            <span class="audiobook-stat-pill"><i class="fas fa-list-ol"></i> ${totalChapters} Chapters</span>
                            <span class="audiobook-stat-pill"><i class="fas fa-check-circle"></i> ${completedChapters} Done</span>
                            <span class="audiobook-stat-pill"><i class="fas fa-hourglass-half"></i> ${remainingChapters} Left</span>
                        </div>
                        <div class="audiobook-card-progress">
                            <div class="audiobook-progress-bar-wrap">
                                <div class="audiobook-progress-bar-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="audiobook-progress-text">
                                <span>${progressPercent}% Complete</span>
                                <span>${completedChapters}/${totalChapters}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="audiobook-card-actions">
                    <button class="btn-continue-listening" onclick="launchEFVPlayer('${prodId}', 0)">
                        ${continueLabel}
                    </button>
                    <button class="btn-chapters-view" onclick="openAudiobookDetail('${prodId}', true)">
                        <i class="fas fa-list"></i> Chapters
                    </button>
                </div>
            </div>
        `;
        }));

        container.innerHTML = cards.join('');
    }

    window.openAudiobookDetail = async function (productId, scrollToChapters = false) {
        const existing = document.getElementById('audiobook-detail-overlay');
        if (existing) existing.remove();

        const token = localStorage.getItem('authToken');
        let product = null;

        try {
            const res = await fetch(`${API_BASE}/api/products/${productId}`);
            if (res.ok) product = await res.json();
        } catch (e) { }

        if (!product) { alert('Failed to load audiobook details.'); return; }

        let chapters = (product.chapters || []).filter(c => c.filePath).sort((a, b) => a.chapterNumber - b.chapterNumber);

        // Fallback: If no chapters but we have a single filePath, treat it as a virtual Chapter 1
        if (chapters.length === 0 && product.filePath) {
            chapters = [{
                chapterNumber: 1,
                title: product.title || 'Full Product',
                filePath: product.filePath
            }];
        }

const totalChapters = chapters.length;

        let abProgress = null;
        try {
            const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (apRes.ok) abProgress = await apRes.json();
        } catch (e) { }

        const completedChapters = abProgress?.totalCompletedChapters || (abProgress?.chapters || []).filter(c => c.completed).length || 0;
        const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

        // Thumbnail resolution
        let thumbUrl = window.resolveThumbnailUrl(product.thumbnail, product.title || product.name);

        const chapterCards = chapters.map((ch, idx) => {
            const chProgress = abProgress?.chapters?.find(c => c.chapterIndex === idx);
            const isCompleted = chProgress?.completed || false;
            const chDuration = ch.duration || '--:--';

            return `
            <div class="chapter-card ${isCompleted ? 'completed' : ''}" onclick="launchEFVPlayer('${productId}', ${idx})" id="chapter-card-${idx}">
                <div class="chapter-num">${idx + 1}</div>
                <div class="chapter-info">
                    <h4 class="chapter-title">${ch.title || ('Chapter ' + (idx + 1))}</h4>
                    <div class="chapter-duration"><i class="fas fa-clock"></i> ${chDuration}</div>
                </div>
                <button class="chapter-play-btn" onclick="event.stopPropagation(); launchEFVPlayer('${productId}', ${idx})">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
        }).join('');

        const overlayHTML = `
        <div id="audiobook-detail-overlay" class="audiobook-detail-overlay">
            <div class="ab-detail-header">
                <div class="ab-detail-header-title">
                    <i class="fas fa-headphones"></i> AUDIOBOOK
                </div>
                <button class="ab-detail-close" onclick="document.getElementById('audiobook-detail-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="ab-detail-body">
                <div class="ab-detail-hero">
                    <img src="${thumbUrl}" alt="${product.title}" class="ab-detail-cover" onerror="this.src=window.getImageForProduct('${(product.title || product.name || '').replace(/'/g, "\\'")}')">
                    <h2 class="ab-detail-title">${product.title}</h2>
                    <div class="ab-detail-meta">
                        <div class="ab-detail-meta-item"><i class="fas fa-list-ol"></i> <strong>${totalChapters}</strong> Chapters</div>
                        <div class="ab-detail-meta-item"><i class="fas fa-check-double"></i> <strong>${completedChapters}</strong> Completed</div>
                        ${product.duration ? `<div class="ab-detail-meta-item"><i class="fas fa-clock"></i> <strong>${product.duration}</strong></div>` : ''}
                    </div>
                    <div class="ab-detail-progress-wrap">
                        <div class="ab-detail-progress-label"><span>Reading Progress</span><span>${progressPercent}%</span></div>
                        <div class="ab-detail-progress-track"><div class="ab-detail-progress-fill" style="width: ${progressPercent}%"></div></div>
                    </div>
                    <div class="ab-detail-actions">
                        <button class="btn-view-chapters" onclick="document.getElementById('chapters-section-anchor').scrollIntoView({behavior:'smooth'})">
                            <i class="fas fa-list"></i> View All Chapters
                        </button>
                    </div>
                </div>
                <div class="ab-chapters-section" id="chapters-section-anchor">
                    <h3 class="ab-chapters-heading"><i class="fas fa-list-ul"></i> Chapters (${totalChapters})</h3>
                    <div class="chapters-grid">
                        ${chapterCards}
                    </div>
                </div>
            </div>
        </div>
    `;

        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        if (scrollToChapters) {
            setTimeout(() => {
                const el = document.getElementById('chapters-section-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    window.launchEFVPlayer = async function (productId, chapterIndex = 0) {
        const existingPlayer = document.getElementById('efv-premium-player');
        if (existingPlayer) existingPlayer.remove();

        const token = localStorage.getItem('authToken');
        let product = null;
        try {
            const res = await fetch(`${API_BASE}/api/products/${productId}`);
            if (res.ok) product = await res.json();
        } catch (e) { }

        if (!product) { alert('Failed to load audiobook.'); return; }

        let chapters = (product.chapters || []).filter(c => c.filePath).sort((a, b) => a.chapterNumber - b.chapterNumber);

        // Fallback: If no chapters but we have a single filePath, treat it as a virtual Chapter 1
        if (chapters.length === 0 && product.filePath) {
            chapters = [{
                chapterNumber: 1,
                title: product.title || 'Full Product',
                filePath: product.filePath
            }];
        }

        if (chapters.length === 0) { alert('No chapters available.'); return; }

        let abProgress = null;
        try {
            const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (apRes.ok) abProgress = await apRes.json();
        } catch (e) { }

        let initialChapter = chapterIndex;
        let initialTime = 0;

        if (abProgress && abProgress.chapters) {
            const chProg = abProgress.chapters.find(c => c.chapterIndex === chapterIndex);
            if (chProg && chProg.currentTime > 1) initialTime = chProg.currentTime;
        }

        if (chapterIndex === 0 && abProgress && abProgress.currentChapterIndex !== undefined) {
            if (abProgress.currentChapterIndex > 0 || (abProgress.currentChapterTime && abProgress.currentChapterTime > 1)) {
                initialChapter = abProgress.currentChapterIndex || 0;
                initialTime = abProgress.currentChapterTime || 0;
            }
        }

        // --- SAFETY CHECK: Ensure initialChapter is within bounds ---
        if (initialChapter >= chapters.length) {
            initialChapter = 0;
            initialTime = 0;
        }

        let thumbUrl = window.resolveThumbnailUrl(product.thumbnail, product.title || product.name);

        const currentChapter = chapters[initialChapter] || chapters[0];
        const chTitle = currentChapter.title || `Chapter ${initialChapter + 1}`;

        const playerHTML = `
        <div id="efv-premium-player" class="efv-audio-player-overlay" oncontextmenu="return false;">
            <div class="efv-player-toolbar">
                <div class="efv-player-toolbar-left"><i class="fas fa-headphones"></i> <span>EFV™ AUDIO PLAYER</span></div>
                <button class="ab-detail-close" id="efv-player-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="efv-player-body">
                <img src="${thumbUrl}" alt="${product.title}" class="efv-player-cover" id="efv-player-cover" onerror="this.src=window.getImageForProduct('${(product.title || product.name || '').replace(/'/g, "\\'")}')">
                <h2 class="efv-player-chapter-title" id="efv-player-ch-title">${chTitle}</h2>
                <p class="efv-player-book-title">${product.title}</p>
                <div class="efv-player-seek-container">
                    <div class="efv-player-time-row"><span id="efv-time-current">0:00</span><span id="efv-time-total">0:00</span></div>
                    <input type="range" class="efv-seek-bar" id="efv-seek-bar" min="0" max="100" value="0" step="0.1">
                </div>
                <div class="efv-player-controls">
                    <button class="efv-ctrl-btn" id="efv-btn-prev"><i class="fas fa-step-backward"></i></button>
                    <button class="efv-ctrl-btn" id="efv-btn-rwd"><i class="fas fa-undo"></i></button>
                    <button class="efv-play-btn" id="efv-btn-play"><i class="fas fa-play" id="efv-play-icon"></i></button>
                    <button class="efv-ctrl-btn" id="efv-btn-fwd"><i class="fas fa-redo"></i></button>
                    <button class="efv-ctrl-btn" id="efv-btn-next"><i class="fas fa-step-forward"></i></button>
                </div>
                <div class="efv-speed-control">
                    <span class="efv-speed-label">Speed</span>
                    <div class="efv-speed-options">
                        <button class="efv-speed-btn active" data-speed="1">1x</button>
                        <button class="efv-speed-btn" data-speed="1.5">1.5x</button>
                        <button class="efv-speed-btn" data-speed="2">2x</button>
                    </div>
                </div>

                <div class="efv-player-chapter-indicator" id="efv-ch-indicator">
                    Chapter ${initialChapter + 1} of ${chapters.length}
                </div>
            </div>

            <!-- Resume Modal -->
            <div id="efv-resume-overlay" class="resume-modal-overlay" style="z-index:10003;">
                <div class="resume-modal">
                    <i class="fas fa-headphones"></i>
                    <h3>Continue Listening?</h3>
                    <p>You previously listened up to <span id="efv-resume-time" style="color:white; font-weight:bold;">0:00</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="efv-btn-resume" class="btn-resume-primary">
                            <i class="fas fa-play"></i> Continue from <span id="efv-resume-btn-time">0:00</span>
                        </button>
                        <button id="efv-btn-restart" class="btn-resume-secondary">
                            <i class="fas fa-redo"></i> Start from Beginning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

        document.body.insertAdjacentHTML('beforeend', playerHTML);
        document.body.classList.add('modal-open');

        // SECURITY: Actively start protection
        if (window.efvSecurity) {
            window.efvSecurity.enable();
        }

        // --- Player State ---
        let currentChIdx = initialChapter;
        let audioEl = new Audio();
        audioEl.crossOrigin = 'anonymous';

        audioEl.onerror = () => {
            alert("Wait: Unable to stream this chapter. The audio file might be missing on the server or storage is restricted.");
            console.error("Audio Player Chapter Error:", audioEl.error);
        };
        let isSeeking = false;
        let saveTimer = null;

        // Prevent context menu on audio
        audioEl.addEventListener('contextmenu', e => e.preventDefault());

        // DOM refs
        const playIcon = document.getElementById('efv-play-icon');
        const playBtn = document.getElementById('efv-btn-play');
        const seekBar = document.getElementById('efv-seek-bar');
        const timeCurrent = document.getElementById('efv-time-current');
        const timeTotal = document.getElementById('efv-time-total');
        const playerCover = document.getElementById('efv-player-cover');
        const chTitleEl = document.getElementById('efv-player-ch-title');
        const chIndicator = document.getElementById('efv-ch-indicator');
        const resumeOverlay = document.getElementById('efv-resume-overlay');

        // --- Load Chapter ---
        function loadChapter(idx, startTime = 0, autoPlay = true) {
            if (idx < 0 || idx >= chapters.length) return;
            currentChIdx = idx;

            const chapterSrc = `${CONTENT_CONFIG.contentApi}/chapter/${productId}/${idx}?token=${token}&t=${Date.now()}`;
            console.log(`🎵 Player: Requesting Chapter Stream from: ${chapterSrc}`);
            audioEl.src = chapterSrc;
            audioEl.load();

            const ch = chapters[idx];
            chTitleEl.textContent = ch.title || `Chapter ${idx + 1}`;
            chIndicator.textContent = `Chapter ${idx + 1} of ${chapters.length}`;

            // Update nav buttons
            document.getElementById('efv-btn-prev').disabled = idx === 0;
            document.getElementById('efv-btn-next').disabled = idx === chapters.length - 1;

            // Highlight in detail overlay if open
            document.querySelectorAll('.chapter-card').forEach(c => c.classList.remove('playing'));
            const activeCard = document.getElementById(`chapter-card-${idx}`);
            if (activeCard) activeCard.classList.add('playing');

            seekBar.value = 0;
            seekBar.style.background = 'rgba(255, 255, 255, 0.1)';
            timeCurrent.textContent = '0:00';
            timeTotal.textContent = '0:00';

            audioEl.addEventListener('loadedmetadata', function onMeta() {
                audioEl.removeEventListener('loadedmetadata', onMeta);
                timeTotal.textContent = formatTime(audioEl.duration);
                if (startTime > 0) audioEl.currentTime = startTime;
                if (autoPlay) audioEl.play().catch(() => { });
            });
        }

        function saveChapterProgress(forceComplete = false) {
            if (!audioEl.src || audioEl.currentTime < 0.5) return;
            const completed = forceComplete || (audioEl.duration > 0 && (audioEl.currentTime / audioEl.duration) > 0.95);
            const data = { chapterIndex: currentChIdx, currentTime: audioEl.currentTime, duration: audioEl.duration || 0, completed };

            fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            }).catch(e => console.error('Save chapter progress error:', e));

            const totalChapters = chapters.length;
            const overallProgress = totalChapters > 0 ? ((currentChIdx + (audioEl.currentTime / (audioEl.duration || 1))) / totalChapters) * 100 : 0;
            syncProgress(productId, 'AUDIOBOOK', { currentTime: audioEl.currentTime, totalDuration: audioEl.duration || 0, progress: Math.min(overallProgress, 100) });
        }

        audioEl.addEventListener('timeupdate', () => {
            timeCurrent.textContent = formatTime(audioEl.currentTime);
            if (audioEl.duration) {
                const percentage = (audioEl.currentTime / audioEl.duration) * 100;
                seekBar.value = percentage;
                seekBar.style.background = `linear-gradient(to right, #FFD700 0%, #FFD700 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
            }
        });

        audioEl.addEventListener('play', () => { playIcon.className = 'fas fa-pause'; playerCover.classList.add('is-playing'); });
        audioEl.addEventListener('pause', () => { playIcon.className = 'fas fa-play'; playerCover.classList.remove('is-playing'); saveChapterProgress(); });
        audioEl.addEventListener('ended', () => {
            saveChapterProgress(true);
            if (currentChIdx < chapters.length - 1) loadChapter(currentChIdx + 1, 0, true);
        });

        seekBar.addEventListener('change', () => { audioEl.currentTime = (seekBar.value / 100) * (audioEl.duration || 0); });
        playBtn.addEventListener('click', () => { audioEl.paused ? audioEl.play().catch(() => { }) : audioEl.pause(); });
        document.getElementById('efv-btn-rwd').addEventListener('click', () => { audioEl.currentTime = Math.max(0, audioEl.currentTime - 10); });
        document.getElementById('efv-btn-fwd').addEventListener('click', () => { audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 10); });
        document.getElementById('efv-btn-prev').addEventListener('click', () => { if (currentChIdx > 0) { saveChapterProgress(); loadChapter(currentChIdx - 1, 0, true); } });
        document.getElementById('efv-btn-next').addEventListener('click', () => { if (currentChIdx < chapters.length - 1) { saveChapterProgress(); loadChapter(currentChIdx + 1, 0, true); } });

        document.querySelectorAll('.efv-speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.efv-speed-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                audioEl.playbackRate = parseFloat(btn.dataset.speed);
            });
        });

        document.getElementById('efv-player-close-btn').addEventListener('click', () => {
            saveChapterProgress();
            audioEl.pause(); audioEl.src = '';
            document.getElementById('efv-premium-player').remove();
            document.body.classList.remove('modal-open');
            if (window.efvSecurity) window.efvSecurity.disable();
            renderLibraryTab();
            if (document.querySelector('.library-sub-tab[data-library-tab="audiobooks"].active')) renderAudiobooksGrid();
        });

        if (initialTime > 1) {
            document.getElementById('efv-resume-time').textContent = formatTime(initialTime);
            document.getElementById('efv-resume-btn-time').textContent = formatTime(initialTime);
            resumeOverlay.classList.add('active');
            document.getElementById('efv-btn-resume').addEventListener('click', () => { resumeOverlay.classList.remove('active'); loadChapter(initialChapter, initialTime, true); });
            document.getElementById('efv-btn-restart').addEventListener('click', () => { resumeOverlay.classList.remove('active'); loadChapter(initialChapter, 0, true); });
        } else {
            loadChapter(initialChapter, 0, true);
        }
    };



    function formatTime(seconds) {
        if (!seconds) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    // ─── LEGACY FALLBACK: playAudiobook ───
    window.playAudiobook = async function (product) {
        const bookId = product._id || product.id;
        const token = localStorage.getItem('authToken');

        try {
            const res = await fetch(`${API_BASE}/api/products/${bookId}`);
            if (res.ok) {
                const fullProduct = await res.json();
                const hasChapters = (fullProduct.chapters || []).filter(c => c.filePath).length > 0;
                if (hasChapters) {
                    openAudiobookDetail(bookId);
                    return;
                }
            }
        } catch (e) { }

        // Fallback for legacy single-file audiobooks
        const playerModalId = 'audio-player-modal';
        if (document.getElementById(playerModalId)) document.getElementById(playerModalId).remove();

        let savedState = await fetchProgress(bookId);

        let thumbUrl = product.thumbnail || (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png');
        if (thumbUrl && !thumbUrl.startsWith('http') && !thumbUrl.startsWith(CONFIG.BASE_PATH + 'assets/images/')) {
            thumbUrl = `${API_BASE}/${thumbUrl}`;
        }

        const audioHtml = `
        <div id="${playerModalId}" class="efv-audio-player-overlay" oncontextmenu="return false;">
            <div class="efv-player-toolbar">
                <div class="efv-player-toolbar-left"><i class="fas fa-headphones"></i> <span>${product.name}</span></div>
                <button class="ab-detail-close" onclick="document.getElementById('${playerModalId}').remove(); document.body.classList.remove('modal-open');"><i class="fas fa-times"></i></button>
            </div>
            <div class="efv-player-body">
                <img src="${thumbUrl}" class="efv-player-cover" onerror="this.src='${CONFIG.BASE_PATH}assets/images/vol1-cover.png'">
                <h2 class="efv-player-chapter-title">${product.name}</h2>
                <div class="efv-player-seek-container">
                    <div class="efv-player-time-row"><span id="legacy-time-cur">0:00</span><span id="legacy-time-total">0:00</span></div>
                    <input type="range" class="efv-seek-bar" id="legacy-seek" min="0" max="100" value="0" step="0.1">
                </div>
                <div class="efv-player-controls">
                    <button class="efv-ctrl-btn" id="legacy-rwd"><i class="fas fa-undo"></i></button>
                    <button class="efv-play-btn" id="legacy-play"><i class="fas fa-play" id="legacy-play-icon"></i></button>
                    <button class="efv-ctrl-btn" id="legacy-fwd"><i class="fas fa-redo"></i></button>
                </div>
            </div>
        </div>
    `;
        document.body.insertAdjacentHTML('beforeend', audioHtml);
        document.body.classList.add('modal-open');

        const audio = new Audio(`${CONTENT_CONFIG.contentApi}/audio/${bookId}?token=${token || ''}&t=${Date.now()}`);
        const playIcon = document.getElementById('legacy-play-icon');
        const seek = document.getElementById('legacy-seek');
        let legacySeeking = false;

        audio.addEventListener('loadedmetadata', () => {
            document.getElementById('legacy-time-total').textContent = formatTime(audio.duration);
            audio.play().catch(() => { });
        });
        audio.addEventListener('timeupdate', () => {
            if (!legacySeeking) {
                document.getElementById('legacy-time-cur').textContent = formatTime(audio.currentTime);
                seek.value = (audio.currentTime / (audio.duration || 1)) * 100;
            }
        });
        audio.addEventListener('play', () => { playIcon.className = 'fas fa-pause'; });
        audio.addEventListener('pause', () => { playIcon.className = 'fas fa-play'; });

        document.getElementById('legacy-play').addEventListener('click', () => { audio.paused ? audio.play().catch(() => { }) : audio.pause(); });
        document.getElementById('legacy-rwd').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
        document.getElementById('legacy-fwd').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
        seek.addEventListener('input', () => { legacySeeking = true; });
        seek.addEventListener('change', () => { audio.currentTime = (seek.value / 100) * (audio.duration || 0); legacySeeking = false; });
    };

    window.accessContent = function (type, name, id) {
        const isAudio = (type || '').toLowerCase().includes('audio');
        const product = { _id: id, name: name, id: id, type: isAudio ? 'AUDIOBOOK' : 'EBOOK' };
        if (isAudio) {
            window.playAudiobook(product);
        } else {
            window.openEbookReader(product);
        }
    };

    // 3.2 Order Filters
    document.querySelectorAll('[data-order-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-order-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOrdersTab(btn.getAttribute('data-order-filter'));
        });
    });

    // 4. Logout
    window.logoutAction = () => {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('efv_user');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('adminLoggedIn');
            // Clear base keys to prevent data leakage to next anonymous user
            localStorage.removeItem('efv_digital_library');
            localStorage.removeItem('efv_purchase_history');
            localStorage.removeItem('efv_cart');

            // Clear country selection so it pops up again for guest
            localStorage.removeItem('efv_country_selected');
            localStorage.removeItem('efv_selected_country');
            sessionStorage.removeItem('efv_country_selected');
            sessionStorage.removeItem('efv_selected_country');

            window.location.href = CONFIG.BASE_PATH + 'index.html';
        }
    };

    // 5. Profile Form Listener (v2)
    const profileFormV2 = document.getElementById('profile-form-v2');
    if (profileFormV2) {
        profileFormV2.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('authToken');
            const data = {
                name: document.getElementById('settings-name-v2').value,
                phone: document.getElementById('settings-phone-v2').value
            };
            try {
                const res = await fetch(`${API_BASE}/api/users/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(data)
                });
                if (res.ok) {
                    showToast("Profile updated successfully", "success");
                    fetchProfileData();
                } else {
                    showToast("Failed to update profile", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Server error", "error");
            }
        });
    }

    // 5. Initial Render
    if (typeof renderCartTab === 'function') renderCartTab();
    if (typeof renderOrdersTab === 'function') renderOrdersTab();
    if (typeof renderLibraryTab === 'function') renderLibraryTab();
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateAuthNavbar === 'function') updateAuthNavbar();

    // Check for query param to open specific tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const subTabParam = urlParams.get('subtab'); // Added subtab param
    if (tabParam) {
        window.switchTab(tabParam, subTabParam);
    }

    // User Support Form Submission
    const supportForm = document.getElementById('user-support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('efv_user'));
            const data = {
                userId: user ? user._id : null,
                name: user ? user.name : 'Anonymous',
                email: user ? user.email : 'No Email',
                subject: document.getElementById('support-subject').value,
                message: document.getElementById('support-message').value
            };

            const btn = document.getElementById('send-support-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/api/support/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    if (typeof showToast === 'function') showToast("Message sent successfully! Our team will contact you.", "success");
                    else alert("Message sent successfully!");
                    supportForm.reset();
                } else {
                    const err = await res.json();
                    if (typeof showToast === 'function') showToast(err.message || "Failed to send message", "error");
                    else alert(err.message || "Failed to send message");
                }
            } catch (err) {
                console.error(err);
                if (typeof showToast === 'function') showToast("Connection error", "error");
                else alert("Connection error");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});

window.loadAdminSupport = async function () {
    const tableBody = document.getElementById('admin-support-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading support inquiries...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();

        if (!res.ok) throw new Error(messages.message || 'Failed to fetch');

        if (!Array.isArray(messages)) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity: 0.5;">No support message data available.</td></tr>';
            return;
        }

        if (messages.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity: 0.5;">No support messages found.</td></tr>';
            return;
        }

        // Sort by newest first
        messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Store messages globally for easy access
        window.adminSupportMessages = messages;

        tableBody.innerHTML = messages.map(msg => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-size: 0.85rem; opacity: 0.7;">${new Date(msg.createdAt).toLocaleDateString()}</td>
                <td style="padding: 12px;">
                    <div style="font-weight: 600;">${msg.name}</div>
                    <div style="font-size: 0.8rem; opacity: 0.6;">${msg.email}</div>
                </td>
                <td style="padding: 12px;">${msg.subject}</td>
                <td style="padding: 12px; max-width: 300px;">
                    <button class="btn btn-outline small" onclick="openSupportView('${msg._id}')" style="padding: 5px 12px; font-size: 0.75rem; border-radius: 20px;">
                        <i class="fas fa-eye"></i> VIEW MESSAGE
                    </button>
                </td>
                <td style="padding: 12px;">
                    <span class="status-badge ${msg.status.toLowerCase().replace(' ', '-')}">${msg.status}</span>
                </td>
                <td style="padding: 12px; display: flex; gap: 8px; align-items: center;">
                    <button class="btn btn-gold small" onclick="openSupportReply('${msg._id}')" style="padding: 6px 15px; font-size: 0.75rem; border-radius: 20px; font-weight: 700;">
                        REPLY
                    </button>
                    <select class="status-select-gold" onchange="updateSupportStatus('${msg._id}', this.value)">
                        <option value="Open" ${msg.status === 'Open' ? 'selected' : ''}>Open</option>
                        <option value="In Progress" ${msg.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${msg.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="Closed" ${msg.status === 'Closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--error);">Error loading messages.</td></tr>';
    }
};

window.loadAdminContacts = async function () {
    const tableBody = document.getElementById('admin-contacts-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading contact messages...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();

        if (!res.ok) throw new Error(messages.message || 'Failed to fetch');

        // Filter for contact form submissions only
        const contactMessages = messages.filter(msg =>
            msg.subject === 'Contact Form Submission'
        );

        if (contactMessages.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity: 0.5;">No contact form messages found.</td></tr>';
            return;
        }

        // Sort by newest first
        contactMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Store globally for opening details/reply
        window.adminSupportMessages = messages;

        tableBody.innerHTML = contactMessages.map(msg => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-size: 0.85rem; opacity: 0.7;">
                    ${new Date(msg.createdAt).toLocaleDateString()}<br>
                    <span style="font-size: 0.75rem; opacity: 0.5;">${new Date(msg.createdAt).toLocaleTimeString()}</span>
                </td>
                <td style="padding: 12px;">
                    <div style="font-weight: 600;">${msg.name}</div>
                </td>
                <td style="padding: 12px; color: var(--gold-text);">${msg.email}</td>
                <td style="padding: 12px; max-width: 300px;">
                    <div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${msg.message}
                    </div>
                    <button class="btn btn-outline small" onclick="openSupportView('${msg._id}')" style="margin-top: 5px; padding: 2px 8px; font-size: 0.7rem; height: auto;">
                        <i class="fas fa-expand-alt"></i> READ FULL
                    </button>
                </td>
                <td style="padding: 12px;">
                    <span class="status-badge ${msg.status.toLowerCase().replace(' ', '-')}">${msg.status}</span>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--error);">Error loading contact messages.</td></tr>';
    }
};

window.openSupportView = function (id) {
    if (!window.adminSupportMessages) return;
    const msg = window.adminSupportMessages.find(m => m._id === id);
    if (!msg) return;

    document.getElementById('view-msg-id').value = msg._id;
    document.getElementById('view-user-name').textContent = msg.name;
    document.getElementById('view-user-email').textContent = msg.email;
    document.getElementById('view-subject').textContent = msg.subject;
    document.getElementById('view-date').textContent = new Date(msg.createdAt).toLocaleString();
    document.getElementById('view-message-content').textContent = msg.message;

    const replySection = document.getElementById('view-reply-section');
    const replyContent = document.getElementById('view-reply-content');
    const replyBtn = document.getElementById('view-reply-btn');

    if (msg.reply) {
        replySection.style.display = 'block';
        replyContent.textContent = msg.reply;
        replyBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Reply';
    } else {
        replySection.style.display = 'none';
        replyBtn.innerHTML = '<i class="fas fa-reply"></i> Reply Now';
    }

    const modal = document.getElementById('support-view-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeSupportViewModal = function () {
    const modal = document.getElementById('support-view-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 400);
};

window.openSupportReply = function (id) {
    if (!window.adminSupportMessages) return;
    const msg = window.adminSupportMessages.find(m => m._id === id);
    if (!msg) return;

    document.getElementById('reply-message-id').value = msg._id;
    document.getElementById('reply-user-name').textContent = msg.name;
    document.getElementById('reply-user-email').textContent = msg.email;
    document.getElementById('reply-subject').textContent = msg.subject;
    document.getElementById('reply-original-message').textContent = msg.message;
    document.getElementById('reply-content').value = msg.reply || '';

    const modal = document.getElementById('support-reply-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeSupportReplyModal = function () {
    const modal = document.getElementById('support-reply-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 400);
};

// Initialize Admin Support listeners
function initializeSupportListeners() {
    const replyForm = document.getElementById('support-reply-form');
    if (replyForm) {
        console.log("✅ Support Reply Form found, adding listener...");
        // Remove existing listener to avoid double submission
        const newForm = replyForm.cloneNode(true);
        replyForm.parentNode.replaceChild(newForm, replyForm);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('reply-message-id').value;
            const reply = document.getElementById('reply-content').value;
            const token = localStorage.getItem('authToken');

            console.log(`🚀 Sending reply for message: ${id}`);
            const btn = newForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/api/support/messages/${id}/reply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reply })
                });

                if (res.ok) {
                    console.log("✅ Reply sent successfully!");
                    if (typeof showToast === 'function') showToast("Reply sent and ticket resolved!", "success");
                    else alert("Reply sent and ticket resolved!");
                    closeSupportReplyModal();
                    loadAdminSupport();
                } else {
                    const err = await res.json();
                    console.error("❌ Reply failed:", err);
                    alert(err.message || "Failed to send reply");
                }
            } catch (err) {
                console.error("❌ Connection error:", err);
                alert("Connection error: " + err.message);
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    } else {
        console.warn("⚠️ Support Reply Form NOT found!");
    }
}

// Call initialization when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupportListeners);
} else {
    initializeSupportListeners();
}

window.updateSupportStatus = async function (id, newStatus) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/messages/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            if (typeof showToast === 'function') showToast("Status updated successfully", "success");
            window.loadAdminSupport();
        } else {
            alert("Failed to update status");
        }
    } catch (e) {
        console.error(e);
        alert("Server error");
    }
};

async function initializeDashboard(user) {
    const nameDisplay = document.getElementById('user-name-display');
    if (nameDisplay) nameDisplay.textContent = user.name;

    // Sidebar User Summary
    const sidebarName = document.getElementById('sidebar-user-name');
    const sidebarMember = document.getElementById('sidebar-membership');
    const sidebarAvatar = document.getElementById('sidebar-avatar');

    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarMember) {
        sidebarMember.textContent = user.membership || 'Standard Member';
        sidebarMember.className = `membership-badge ${user.membership === 'Premium' ? 'premium' : ''}`;
    }
    if (sidebarAvatar && user.profileImage) sidebarAvatar.src = user.profileImage;

    // Settings Profile Fields
    const setV2Name = document.getElementById('settings-name-v2');
    const setV2Email = document.getElementById('settings-email-v2');
    if (setV2Name) setV2Name.value = user.name;
    if (setV2Email) setV2Email.value = user.email;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateDisp = document.getElementById('current-date');
    if (dateDisp) dateDisp.textContent = new Date().toLocaleDateString('en-US', options);

    // Admin Check & Sidebar Customization
    const userEmail = (user && user.email) ? user.email.toLowerCase().trim() : '';
    const userRole = (user && user.role) ? user.role.toLowerCase().trim() : '';
    const isAdmin = userRole === 'admin' || userEmail === 'admin@uwo24.com' || userEmail === 'efv@uwo24.com';

    console.log("🛠️ Initializing Dashboard. User:", userEmail, "Role:", userRole, "isAdmin:", isAdmin);

    if (isAdmin) {
        // 1. Hide customer-only sidebar items
        const customerTabs = ['cart', 'orders', 'wishlist', 'notifications', 'support'];
        customerTabs.forEach(tab => {
            const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
            if (btn) btn.classList.add('hidden');
        });

        // 2. Hide customer-only home widgets/shortcuts
        const homeShortcuts = [
            'button[onclick*="orders"]',
            'button[onclick*="notifications"]',
            // Sidebar explicit hides for non-data-tab buttons
            'button[onclick*="addresses-tab"]',
            'button[onclick*="payments-tab"]',
            '.main-stats-col h3:has(.fa-history)', // Recent Orders Header
            '#recent-orders-mini-list',
            '.main-stats-col > .glass-panel' // Recent Orders Container
        ];

        homeShortcuts.forEach(selector => {
            try {
                const els = document.querySelectorAll(selector);
                els.forEach(el => el.classList.add('hidden'));
            } catch (e) { }
        });

        // 3. Rename "Account Settings" to "System Control" for Admins
        const settingsBtn = document.querySelector('button[data-tab="settings"]');
        if (settingsBtn) {
            const span = settingsBtn.querySelector('span');
            if (span) span.textContent = 'System Control';
        }

        // Show admin-only sidebar items
        document.querySelectorAll('.admin-nav').forEach(btn => btn.classList.remove('hidden'));
        const partnersBtn = document.getElementById('sidebar-partners-btn');
        if (partnersBtn) partnersBtn.classList.remove('hidden');
        window.populateCategoryDropdown();

        // Instantly switch to admin portal to prevent flicker
        const requestedTabSync = new URLSearchParams(window.location.search).get('tab');
        if (!requestedTabSync || requestedTabSync === 'dashboard') {
            window.switchTab('admin');
        }

    } else {
        // Show customer-only items for regular users
        const customerTabs = ['cart', 'orders', 'notifications'];
        customerTabs.forEach(tab => {
            const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
            if (btn) btn.classList.remove('hidden');
        });

        // Show home widgets
        const homeShortcuts = ['button[onclick*="orders"]', 'button[onclick*="notifications"]', '#recent-orders-mini-list'];
        homeShortcuts.forEach(selector => {
            const els = document.querySelectorAll(selector);
            els.forEach(el => el.classList.remove('hidden'));
        });

        // Hide admin-only items
        document.querySelectorAll('.admin-nav').forEach(btn => btn.classList.add('hidden'));
        const adminBtn = document.getElementById('sidebar-admin-btn');
        if (adminBtn) adminBtn.classList.add('hidden');
    }

    // Load initial data
    try {
        await fetchProfileData();

        // Re-check Admin status after profile load to ensure sidebar is correct
        const profile = window.currentUserProfile;
        if (profile) {
            const pEmail = (profile.email || '').toLowerCase().trim();
            const pRole = (profile.role || '').toLowerCase().trim();
            const pIsAdmin = pRole === 'admin' || pEmail === 'admin@uwo24.com' || pEmail === 'efv@uwo24.com';
            console.log("🔄 Re-checking Admin status after profile fetch:", pIsAdmin, "Role:", pRole);

            if (pIsAdmin) {
                // Show admin items
                document.querySelectorAll('.admin-nav').forEach(btn => btn.classList.remove('hidden'));
                window.populateCategoryDropdown();

                // Hide customer-only items
                const customerTabs = ['cart', 'orders', 'wishlist', 'notifications', 'support'];
                customerTabs.forEach(tab => {
                    const btn = document.querySelector(`.nav-item[data-tab="${tab}"]`);
                    if (btn) btn.classList.add('hidden');
                });

                const settingsBtn = document.querySelector('button[data-tab="settings"]');
                if (settingsBtn) {
                    const span = settingsBtn.querySelector('span');
                    if (span) span.textContent = 'System Control';
                }

                // If on Admin Dashboard, ensure we show the Admin version of the dashboard
                const requestedTab = new URLSearchParams(window.location.search).get('tab');
                if (!requestedTab || requestedTab === 'dashboard') {
                    window.switchTab('admin');
                }
            } else {
                console.warn("User is NOT an admin based on profile data.");
            }
        }
    } catch (err) {
        console.error("Dashboard init error:", err);
    }

    updateDashboardOverview();
    if (typeof updateAdminStats === 'function') updateAdminStats();

    loadRecommendations();
    loadRecentlyViewed();

    // Trigger initial library sync
    syncLibraryWithBackend();
}

window.fetchProfileData = async function () {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await res.json();

        if (res.ok) {
            window.currentUserProfile = profile;
            renderWishlistTab();
            renderNotificationsTab();
            renderSavedAddresses();
            updateDashboardOverview();
            updateStats();
        }
    } catch (e) {
        console.error("Profile fetch error:", e);
    }
}

function updateDashboardOverview() {
    // Branch based on page context to avoid erroring on missing elements
    if (document.getElementById('admin-stat-total-orders')) {
        updateAdminStats(); // Use the existing admin stat puller
        // Add any other admin-specific init here if needed
        return;
    }

    const profile = window.currentUserProfile;
    if (!profile) return;

    // ... (rest of existing user dashboard logic) ...

    // 1. Last Order Overview
    const lastOrderContent = document.getElementById('recent-orders-mini-list');
    if (lastOrderContent) renderLastOrderOverview(lastOrderContent);

    // 2. Continue Reading/Listening
    updateReadingProgressShortcuts();

    // 3. Active Shipments
    renderActiveShipments();

    // 4. Newest Addition
    renderNewestAddition();

    // 5. Update Profile Stats in Dashboard (NEW)
    const profileDisplayEmail = document.getElementById('profile-display-email');
    if (profileDisplayEmail) profileDisplayEmail.textContent = profile.email || 'user@example.com';
    const profileDisplayName = document.getElementById('profile-display-name');
    if (profileDisplayName) profileDisplayName.textContent = profile.name || 'Guest User';

    // Fill form fields
    const nameInput = document.getElementById('settings-name-v2');
    if (nameInput) nameInput.value = profile.name || '';
    const phoneInput = document.getElementById('settings-phone-v2');
    if (phoneInput) phoneInput.value = profile.phone || '';
    const emailInput = document.getElementById('settings-email-v2');
    if (emailInput) emailInput.value = profile.email || '';
}

async function renderLastOrderOverview(container) {
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${API_BASE}/api/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();
        if (orders && orders.length > 0) {
            const last = orders[0];
            const date = new Date(last.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h3 style="margin:0; font-size:1.1rem;">${last.orderId}</h3>
                        <p style="margin:2px 0; font-size:0.8rem; opacity:0.6;">${date} • ${getOrderCurrSym(last)}${last.totalAmount}</p>
                    </div>
                    <span class="status-badge ${getStatusClass(last.status)}">${last.status}</span>
                </div>
                <button class="btn btn-outline small" style="margin-top:10px; width:100%; border-color:rgba(255,255,255,0.1);" onclick="viewOrderDetail('${last._id}')">View Details</button>
            `;
        }
    } catch (e) { }
}

async function updateReadingProgressShortcuts() {
    const libKey = getUserKey('efv_digital_library');
    const library = JSON.parse(localStorage.getItem(libKey)) || [];
    const container = document.getElementById('continue-reading-content-v2');
    if (!container) return;

    if (library.length === 0) {
        container.innerHTML = '<p class="fade-text">Start your reading journey by browsing the store.</p>';
        return;
    }

    // Try to find an item with progress
    let target = library[0];
    for (const item of library) {
        const prog = await fetchProgress(item.productId || item.id);
        if (prog && prog.progress > 0) {
            target = { ...item, progress: prog.progress };
            break;
        }
    }

    container.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center;">
            <img src="${target.thumbnail}" style="width:60px; height:85px; object-fit:cover; border-radius:8px;">
            <div style="flex:1;">
                <h4 style="margin:0; font-size:1rem;">${target.name || target.title}</h4>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${target.progress || 0}%"></div>
                </div>
                <p style="margin:0; font-size:0.75rem; opacity:0.6;">${Math.round(target.progress || 0)}% Completed</p>
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    if (['Delivered', 'Completed', 'Processing'].includes(status)) return 'green-badge';
    if (['Shipped', 'Paid'].includes(status)) return 'gold-badge';
    if (['Cancelled', 'Failed', 'Payment Failed'].includes(status)) return 'red-badge';
    if (['Awaiting Payment'].includes(status)) return 'gold-badge';
    return '';
}

window.syncLibraryWithBackend = async function () {
    console.log('🔄 Syncing Library with Backend...');
    const user = JSON.parse(localStorage.getItem('efv_user'));
    const token = localStorage.getItem('authToken');
    if (!user || !token) {
        console.warn('Sync aborted: User or Token missing', { hasUser: !!user, hasToken: !!token });
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/library/my-library`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('📥 Backend Library Data Received:', data, 'User Role:', user.role);

        if (response.ok) {
            const libKey = getUserKey('efv_digital_library');

            // IMPORTANT: Clear localStorage and replace with clean backend data.
            localStorage.removeItem(libKey);

            const localLibrary = data.map(prod => ({
                id: prod.productId || prod._id || prod.id,
                productId: prod.productId || prod._id || prod.id,
                name: prod.title || prod.name,
                title: prod.title || prod.name,
                type: prod.type,
                thumbnail: prod.thumbnail,
                filePath: prod.filePath,
                language: prod.language || '',
                subtitle: prod.subtitle || '',
                date: prod.purchasedAt ? new Date(prod.purchasedAt).toLocaleDateString() : new Date().toLocaleDateString()
            }));

            console.log('💾 Stored in LocalStorage:', localLibrary.length, 'items');
            localStorage.setItem(libKey, JSON.stringify(localLibrary));

            renderLibraryTab(localLibrary);
            if (typeof updateStats === 'function') updateStats();
        } else {
            console.error('Library Sync Failed:', data.message);
        }
    } catch (error) {
        console.error('Library sync error:', error);
    }
}


// --- TAB RENDERING: NOTIFICATIONS ---
function renderNotificationsTab() {
    const profile = window.currentUserProfile;
    const container = document.getElementById('notifications-list');
    const emptyState = document.getElementById('notifications-empty-state');
    const badge = document.getElementById('unread-notifications-count');

    if (!profile || !profile.notifications || profile.notifications.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        badge.classList.add('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    const unreadCount = profile.notifications.filter(n => !n.isRead).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    container.innerHTML = profile.notifications.map(note => {
        const icon = getNotificationIcon(note.type);
        return `
            <div class="notification-item ${note.isRead ? '' : 'unread'}" onclick="markNotificationRead('${note._id}')">
                <div class="notification-icon ${note.type.toLowerCase()}">${icon}</div>
                <div class="notification-body">
                    <h5>${note.title}</h5>
                    <p>${note.message}</p>
                    <span class="notification-time">${new Date(note.createdAt).toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
}

function getNotificationIcon(type) {
    switch (type) {
        case 'Order': return '<i class="fas fa-shopping-bag"></i>';
        case 'Shipment': return '<i class="fas fa-truck"></i>';
        case 'Digital': return '<i class="fas fa-play-circle"></i>';
        default: return '<i class="fas fa-bell"></i>';
    }
}

window.markNotificationRead = async function (id) {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_BASE}/api/users/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProfileData();
}

window.markAllNotificationsRead = async function () {
    const token = localStorage.getItem('authToken');
    await fetch(`${API_BASE}/api/users/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProfileData();
}

// --- TAB RENDERING: ADDRESSES ---
window.renderSavedAddresses = function () {
    const profile = window.currentUserProfile;
    const container = document.getElementById('saved-addresses-grid-v2');
    if (!container) return;

    // Clear skeletons
    container.innerHTML = '';

    if (!profile || !profile.savedAddresses || profile.savedAddresses.length === 0) {
        container.innerHTML = `
            <div class="address-card glass-panel" style="grid-column: 1 / -1; padding: 40px; text-align: center; border: 1px dashed rgba(255,255,255,0.1); width: 100%;">
                <i class="fas fa-map-marked-alt" style="font-size: 2rem; opacity: 0.1; margin-bottom: 15px;"></i>
                <p class="fade-text">No saved addresses found. Add one to speed up checkout.</p>
            </div>`;
        return;
    }

    container.innerHTML = profile.savedAddresses.map(addr => `
        <div class="address-card glass-panel ${addr.isDefault ? 'default' : ''}">
            <h5 style="color:var(--gold-text); margin-bottom:10px;">${addr.label || 'Address'} ${addr.isDefault ? '<span class="default-badge">Default</span>' : ''}</h5>
            <p class="address-text">
                <strong>${addr.fullName}</strong><br>
                ${addr.fullAddress}<br>
                ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                Phone: ${addr.phone}
            </p>
            <div class="address-actions" style="margin-top:15px; display:flex; gap:10px;">
                <button class="btn btn-outline small" onclick="openAddressModal('${addr._id || addr.id}')">Edit</button>
                <button class="btn btn-danger small" style="background:rgba(255,0,0,0.1); border-color:rgba(255,0,0,0.2); color:#ff6b6b;" onclick="deleteAddress('${addr._id || addr.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// --- TAB RENDERING: ORDERS ---
async function renderOrdersTab(filter = 'all') {
    const token = localStorage.getItem('authToken');
    const container = document.getElementById('dashboard-orders-list');
    const emptyState = document.getElementById('orders-empty-state');
    if (!container) return;

    container.innerHTML = `<div class="skeleton" style="height: 150px; border-radius: 12px; margin-bottom: 20px;"></div>`;

    try {
        const res = await fetch(`${API_BASE}/api/orders/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let orders = res.ok ? await res.json() : [];

        // Apply filters
        if (filter !== 'all') {
            orders = orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());
        }

        if (orders.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        container.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const itemsList = order.items.map(p => p.title || p.name).join(', ');
            const statusClass = `status-${order.status.toLowerCase()}`;

            return `
                <div class="glass-panel" style="padding: 25px; border-radius: 15px; margin-bottom: 20px;">
                    <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <span style="font-size: 0.8rem; opacity: 0.5;">Order ID</span>
                            <h3 style="margin: 0; font-family: 'Cinzel'; color: var(--gold-text);">#${order.orderId}</h3>
                            <p style="margin: 5px 0 0; font-size: 0.85rem; opacity: 0.6;">Placed on ${date}</p>
                        </div>
                        <div style="text-align: right;">
                            <span class="status-badge ${statusClass}">${order.status}</span>
                            <h3 style="margin: 10px 0 0; color: var(--gold-text);">${getOrderCurrSym(order)}${order.totalAmount}</h3>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 20px; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                        <div style="flex: 1;">
                            <p style="margin: 0; font-size: 0.9rem; font-weight: 600;">${itemsList}</p>
                            <p style="margin: 5px 0 0; font-size: 0.8rem; opacity: 0.6;">${order.items.length} Items</p>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-outline small" onclick="viewOrderDetail('${order._id}')">Details</button>
                            ${order.status === 'Delivered' ? `<button class="btn btn-gold small">Invoice</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error rendering orders:', e);
        container.innerHTML = '<p>Failed to load orders.</p>';
    }
}

// --- TAB RENDERING: LIBRARY ---
// --- TAB RENDERING: LIBRARY ---
function renderLibraryTab(directData = null, typeFilter = null) {
    const user = JSON.parse(localStorage.getItem('efv_user') || '{}');
    const userEmail = (user.email || '').toLowerCase().trim();
    const isAdmin = user.role === 'admin' || userEmail === 'admin@uwo24.com' || userEmail === 'efv@uwo24.com';
    const libKey = getUserKey('efv_digital_library');
    let library = directData || JSON.parse(localStorage.getItem(libKey)) || [];

    // Deduplicate Library Items - normalize all items first so different key formats
    // ('id' from cart.js vs 'productId' from backend) all map to the same canonical key.
    const uniqueMap = new Map();
    library = library
        .map(item => {
            const prodId = (item.productId || item.id || item._id || '').toString();
            const title = (item.name || item.title || '').trim();
            const type = (item.type || '').split(' ')[0].split('-')[0].toLowerCase(); // Normalized type prefix (e-book -> e, audiobook -> a)

            return {
                ...item,
                productId: prodId,
                id: prodId,
                title: title,
                name: title,
                // Create a truly unique key: Name + Simplified Type
                // This prevents "Dummy ID" and "Real ID" versions of the same book from co-existing
                uniqueContentKey: `${title}_${type}_${item.language || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '_')
            };
        })
        .filter(item => {
            if (!item.productId && !item.uniqueContentKey) return false;

            // Deduplicate by Content Key (Name + Type) - most reliable
            const key = item.uniqueContentKey;
            if (uniqueMap.has(key)) return false;
            uniqueMap.set(key, true);
            return true;
        });

    const container = document.getElementById('dashboard-library-list');
    const emptyState = document.getElementById('library-empty-state');

    if (!container) return;

    // Apply type / volume filter if specified
    if (typeFilter === 'ebook') {
        library = library.filter(item => !(item.type || '').toLowerCase().includes('audio'));
    } else if (typeFilter === 'audio') {
        library = library.filter(item => (item.type || '').toLowerCase().includes('audio'));
    } else if (typeFilter === 'vol1') {
        library = library.filter(item => {
            const title = (item.name || item.title || '').toLowerCase();
            const vol = (item.volume || '').toString().toLowerCase();
            return vol === '1' || title.includes('volume 1') || title.includes('vol 1') || title.includes('vol. 1') || title.includes('volume-1') || title.includes('origin code') || title.includes('vol1');
        });
    } else if (typeFilter === 'vol2') {
        library = library.filter(item => {
            const title = (item.name || item.title || '').toLowerCase();
            const vol = (item.volume || '').toString().toLowerCase();
            return vol === '2' || title.includes('volume 2') || title.includes('vol 2') || title.includes('vol. 2') || title.includes('volume-2') || title.includes('mindos') || title.includes('vol2');
        });
    }

    if (library.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    emptyState.classList.add('hidden');

    function getProgressHtml(prodId, progress) {
        if (!progress) return `<div class="card-progress-container" id="prog-wrap-${prodId}" style="margin-top:10px; display:none;"></div>`;
        const percent = progress.progress || 0;
        return `
            <div class="card-progress-container" id="prog-wrap-${prodId}" style="margin-top:10px;">
                <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>${Math.round(percent)}% Complete</span>
                </div>
                <div style="height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: var(--gold-text); border-radius: 2px;"></div>
                </div>
            </div>
        `;
    }

    const cardsHtml = library.map((item) => {
        const prodId = item.productId || item.id || item._id;
        const progress = efvProgressCache.get(prodId) || null;

        const rawType = (item.type || '').toLowerCase();
        const isAudio = rawType.includes('audio');
        const actionLabel = isAudio ? 'Listen Now' : 'Read Now';
        const icon = isAudio ? 'fa-headphones' : 'fa-book-open';

        // Thumbnail resolution - use volume-aware helper as fallback
        let imageUrl = (typeof getImageForProduct === 'function') ? getImageForProduct(item.name || item.title) : (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png');
        if (item.thumbnail && !item.thumbnail.includes('vol1-cover')) {
            const thumb = item.thumbnail.replace(/^\/+/, '');
            if (thumb.startsWith('http')) {
                imageUrl = thumb;
            } else if (thumb.startsWith('assets/images/')) {
                imageUrl = CONFIG.BASE_PATH + thumb;
            } else {
                imageUrl = `${API_BASE}/${thumb}`;
            }
        }

        // Fetch progress in background if not cached
        if (!progress) {
            fetchProgress(prodId).then(p => {
                if (p) {
                    const wrap = document.getElementById(`prog-wrap-${prodId}`);
                    if (wrap) {
                        const pct = Math.round(p.progress || 0);
                        wrap.style.display = '';
                        wrap.innerHTML = `
                            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px; display: flex; justify-content: space-between;">
                                <span>${pct}% Complete</span>
                            </div>
                            <div style="height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                <div style="width: ${pct}%; height: 100%; background: var(--gold-text); border-radius: 2px;"></div>
                            </div>
                        `;
                    }
                }
            });
        }

        return `
            <div class="dashboard-card fade-in">
                <div class="card-image-container">
                    <span class="card-type-badge">${item.type}</span>
                    <button onclick="event.stopPropagation(); removeFromLibrary('${prodId}')" 
                        style="position: absolute; top: 10px; left: 10px; width: 32px; height: 32px; border-radius: 8px; background: rgba(255, 77, 77, 0.2); border: 1px solid rgba(255, 77, 77, 0.4); color: #ff4d4d; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: all 0.3s; backdrop-filter: blur(4px);"
                        onmouseover="this.style.background='#ff4d4d'; this.style.color='white'"
                        onmouseout="this.style.background='rgba(255, 77, 77, 0.2)'; this.style.color='#ff4d4d'">
                        <i class="fas fa-trash-alt" style="font-size: 0.85rem;"></i>
                    </button>
                    <img src="${imageUrl}" alt="${item.name || item.title}" class="card-image" onerror="this.src='${CONFIG.BASE_PATH}assets/images/vol1-cover.png'">
                </div>
                <div class="card-details">
                    ${item.language ? `<span style="display:inline-block; background: rgba(212,175,55,0.15); border: 1px solid var(--gold-energy); color: var(--gold-energy); padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-bottom: 5px; text-transform: uppercase;">${item.language} Edition</span>` : ''}
                    <h3 class="card-title">${item.name || item.title}</h3>
                    <p class="card-subtitle">Purchased: ${item.date || 'Recently'}</p>
                    ${getProgressHtml(prodId, progress)}
                    <div class="card-actions" style="margin-top:auto; padding-top:10px; display:flex; gap:10px;">
                        <button class="btn-dashboard btn-primary" onclick="accessContent('${item.type}', '${(item.name || item.title).replace(/'/g, "\\'")}', '${prodId}')" style="flex:1;">
                            <i class="fas ${icon}"></i> ${actionLabel}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml.join('');
}

window.removeFromLibrary = async function (prodId) {
    if (!confirm('Are you sure you want to remove this item from your library? This will permanently delete it.')) return;

    const token = localStorage.getItem('authToken');
    try {
        if (token) {
            const res = await fetch(`${API_BASE}/api/library/my-library/${prodId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                console.log('✅ Item permanently removed from library backend');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.warn('Backend delete failed:', errData.message);
            }
        }
    } catch (e) {
        console.warn('Backend delete error:', e);
    }

    const libKey = getUserKey('efv_digital_library');
    let library = JSON.parse(localStorage.getItem(libKey)) || [];
    library = library.filter(item => {
        const id = (item.productId || item.id || item._id || '').toString();
        return id !== prodId.toString();
    });
    localStorage.setItem(libKey, JSON.stringify(library));
    renderLibraryTab();
    if (typeof updateStats === 'function') updateStats();
};

window.deleteAllLibraryItems = async function () {
    if (!confirm('Are you sure you want to delete ALL items from your library? This action cannot be undone.')) return;

    const token = localStorage.getItem('authToken');
    try {
        if (token) {
            const res = await fetch(`${API_BASE}/api/library/my-library/all`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                console.log('✅ All items removed from library backend');
                if (typeof showToast === 'function') showToast('Library cleared successfully', 'success');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.warn('Backend delete all failed:', errData.message);
                if (typeof showToast === 'function') showToast(errData.message || 'Failed to clear library', 'error');
            }
        }
    } catch (e) {
        console.warn('Backend delete all error:', e);
        if (typeof showToast === 'function') showToast('Error connecting to server', 'error');
    }

    const libKey = getUserKey('efv_digital_library');
    localStorage.removeItem(libKey);
    localStorage.setItem(libKey, JSON.stringify([]));
    renderLibraryTab([]);
    if (typeof updateStats === 'function') updateStats();
};

function updateStats() {
    const profile = window.currentUserProfile;
    if (!profile) return;

    const libKey = getUserKey('efv_digital_library');
    const library = JSON.parse(localStorage.getItem(libKey)) || [];

    const statDigital = document.getElementById('stat-total-digital');
    if (statDigital) statDigital.textContent = library.length;

    const token = localStorage.getItem('authToken');
    fetch(`${API_BASE}/api/orders/my-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(orders => {
            const statOrders = document.getElementById('stat-total-orders');
            if (statOrders) statOrders.textContent = orders.length;

            const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
            const statSpent = document.getElementById('stat-total-spent');
            if (statSpent) statSpent.textContent = '₹' + totalSpent.toLocaleString();
        }).catch(err => console.warn("Stats fetch failed", err));
}

// --- TAB RENDERING: CART ---
// --- ACTIONS --- (Moved to end for consistency)

// --- ACTIONS ---

window.buyNowFromDashboard = function (id) {
    const cartKey = getUserKey('efv_cart');
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const item = cart.find(i => i.id === id);
    if (!item) return;

    initiateDashboardCheckout([item], true, id);
};

async function initiateDashboardCheckout(items, isSingleItemMode, cartIndexToRemove) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Basic Razorpay options since we don't have the full backend integration setup in this file
    // Ideally we call the same backend endpoints

    try {
        // Fetch Razorpay Key ID from server config
        const configRes = await fetch(`${API_BASE}/api/orders/config`);
        const configData = await configRes.json();
        const rzpKey = configData.razorpayKeyId;

        // Create Order
        const rzpRes = await fetch(`${API_BASE}/api/orders/razorpay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: totalAmount })
        });
        const rzpOrderData = await rzpRes.json();

        if (!rzpRes.ok) throw new Error(rzpOrderData.message || 'Payment init failed');

        const options = {
            key: rzpKey,
            amount: rzpOrderData.amount,
            currency: rzpOrderData.currency,
            name: 'EFV Dashboard Checkout',
            description: 'Order from Dashboard',
            order_id: rzpOrderData.id,
            prefill: { name: user.name, email: user.email },
            theme: { color: '#FFD369' },
            handler: async function (response) {
                // Verification (Simulated for UI flow speed, or call backend)
                // Assuming success for UX demo flow

                // 1. Move to Orders
                const historyKey = getUserKey('efv_purchase_history');
                let history = JSON.parse(localStorage.getItem(historyKey)) || [];

                items.forEach(item => {
                    // Check if exists? Orders are usually unique transactions, but we stack qty
                    history.push({
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        date: new Date().toLocaleDateString()
                    });
                });
                localStorage.setItem(historyKey, JSON.stringify(history));

                // 2. Add to Library if Digital
                const libKey = getUserKey('efv_digital_library');
                let library = JSON.parse(localStorage.getItem(libKey)) || [];

                items.forEach(item => {
                    const isAudio = item.name.toLowerCase().includes('audiobook');
                    const isEbook = item.name.toLowerCase().includes('e-book') || item.name.toLowerCase().includes('ebook');

                    if (isAudio || isEbook) {
                        // Check duplicates
                        const key = `${item.name}_${item.language || ''}`.toLowerCase();
                        if (!library.some(l => `${l.name}_${l.language || ''}`.toLowerCase() === key)) {
                            library.push({
                                id: item.id || Date.now(), // Fallback ID
                                name: item.name,
                                language: item.language || '',
                                subtitle: item.subtitle || '',
                                type: isAudio ? 'Audiobook' : 'E-Book',
                                date: new Date().toLocaleDateString()
                            });
                        }
                    }
                });
                localStorage.setItem(libKey, JSON.stringify(library));

                // 3. Remove from Cart
                if (isSingleItemMode && cartIndexToRemove !== undefined) {
                    removeFromCart(cartIndexToRemove);
                }

                // 4. Update UI
                alert('Payment Successful! Item moved to Orders/Library.');
                renderCartTab();
                renderOrdersTab();
                renderLibraryTab();
                updateStats();

                // Switch to Orders Tab
                document.querySelector('.nav-item[data-tab="orders"]').click();
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (e) {
        alert('Payment Initialization Failed: ' + e.message);
    }
}

window.accessContent = function (type, name, id) {
    console.log(`📂 Accessing Content | Requested Type: ${type} | Name: ${name} | ID: ${id}`);
    if (typeof accessDigitalContent === 'function') {
        accessDigitalContent(name, id, type); // Pass type
    } else {
        console.error("Secure Content System not loaded");
        alert("System update in progress. Please refresh.");
    }
};

// --- SECURE DIGITAL CONTENT SYSTEM ---

// Configuration


// --- PDF READER IMPLEMENTATION (Vertical Scroll) ---
window.openEbookReader = async function (product) {
    const readerId = 'efv-reader-modal';
    if (document.getElementById(readerId)) return;

    // 1. Fetch saved progress
    let savedState = await fetchProgress(product._id);
    let lastLoadedPage = savedState?.lastPage || 1;
    let totalPages = 0;
    let pdfDoc = null;
    let scale = 1.5;

    // 2. Create Reader UI
    const readerHtml = `
        <div id="${readerId}" class="reader-overlay" oncontextmenu="return false;">
            <div class="reader-toolbar glass-panel">
                <div class="reader-title">${product.name}</div>
                <div class="reader-controls">
                    <span id="page-indicator">Scroll to Read</span>
                    <button class="btn-icon" id="close-reader" title="Close" style="pointer-events: auto !important; position: relative; z-index: 100;" onclick="window.forceCloseEbookReader()"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="reader-canvas-container" id="reader-container">
                <!-- Pages will be injected here -->
            </div>
            <div class="reader-loading">
                <div class="reader-spinner"></div>
                <p>Loading Secure Content...</p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', readerHtml);
    const modal = document.getElementById(readerId);
    if (!modal) {
        console.error("❌ Reader Modal failed to inject");
        return;
    }

    if (window.efvSecurity) {
        window.efvSecurity.isTampered = false;
        window.efvSecurity.enable();
        window.efvSecurity.applyWatermark(modal);
    }
    modal.classList.add('no-select');

    const container = modal.querySelector('#reader-container');
    const indicator = modal.querySelector('#page-indicator');
    const loading = modal.querySelector('.reader-loading');

    if (!container) {
        console.error("❌ Reader container not found in modal. Check HTML template.");
        alert("Ebook Reader Error: UI components missing. Please refresh.");
        modal.remove();
        return;
    }

    // 3. Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = CONTENT_CONFIG.pdfWorkerSrc;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error("Please re-login");

        const effectiveId = product._id || product.id;
        let url = `${CONTENT_CONFIG.contentApi}/ebook/${effectiveId}?token=${encodeURIComponent(token)}&t=${Date.now()}`;
        console.log(`📂 Reader: Requesting PDF stream from: ${url}`);

        // ✅ PRE-FLIGHT CHECK: Verify the backend can actually serve this file
        // This gives us a real error message before PDF.js swallows it as MissingPDFException
        try {
            const checkRes = await fetch(`${CONTENT_CONFIG.contentApi}/ebook/${effectiveId}`, {
                method: 'HEAD',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!checkRes.ok) {
                // Try to get the actual error message
                const errRes = await fetch(`${CONTENT_CONFIG.contentApi}/ebook/${effectiveId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Range': 'bytes=0-0' }
                });
                let errMsg = '';
                try { const j = await errRes.json(); errMsg = j.message; } catch(e) {}
                if (checkRes.status === 404) {
                    throw new Error(`404: ${errMsg || 'E-Book file not found on server'}`);
                } else if (checkRes.status === 403) {
                    throw new Error('403: Access Denied');
                } else if (checkRes.status === 401) {
                    throw new Error('401: Session expired');
                } else {
                    throw new Error(`${checkRes.status}: ${errMsg || 'Server error'}`);
                }
            }
        } catch (preFlightErr) {
            if (preFlightErr.message.startsWith('4') || preFlightErr.message.startsWith('5')) throw preFlightErr;
            // Network error during pre-flight - try loading anyway
            console.warn('Pre-flight check failed (network?):', preFlightErr.message);
        }

        const loadingTask = pdfjsLib.getDocument({
            url: url,
            httpHeaders: { 'Authorization': `Bearer ${token}` },
            disableAutoFetch: true,
            disableStream: false,
            rangeChunkSize: 1024 * 128
        });

        // Safety Timeout: Auto-hide loader after 10s even if something is stuck
        const loaderTimeout = setTimeout(() => {
            if (loading && loading.style.display !== 'none') {
                console.warn("⚠️ Ebook loader took too long. Hiding...");
                loading.style.display = 'none';
            }
        }, 10000);

        pdfDoc = await loadingTask.promise;
        clearTimeout(loaderTimeout);
        totalPages = pdfDoc.numPages;

        console.log(`📖 Ebook Meta Loaded: ${totalPages} pages. Creating wrappers...`);

        // 4. Create Page Wrappers (CRITICAL: Must exist before any rendering)
        for (let i = 1; i <= totalPages; i++) {
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'pdf-page-wrapper';
            pageWrapper.dataset.pageNumber = i;
            pageWrapper.id = `page-${i}`;

            const canvas = document.createElement('canvas');
            pageWrapper.appendChild(canvas);
            container.appendChild(pageWrapper);
        }

        // SPEED OPTIMIZATION: Render page 1 FIRST
        if (loading) loading.style.display = 'none';
        await renderPageToCanvas(1);
        console.log("✅ Page 1 Rendered.");

        // 5. Intersection Observer for Lazy Rendering & Progress tracking
        const observerOptions = {
            root: container,
            threshold: [0.1, 0.5] // Track multiple points
        };

        const pageObserver = new IntersectionObserver((entries) => {
            // Find the page that is most visible
            const visiblePages = entries
                .filter(e => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (visiblePages.length > 0) {
                const entry = visiblePages[0];
                const pageNum = parseInt(entry.target.dataset.pageNumber);

                renderPageToCanvas(pageNum);

                // Update indicator if high confidence
                if (entry.intersectionRatio > 0.4 || visiblePages.length === 1) {
                    indicator.textContent = `Page ${pageNum} of ${totalPages}`;

                    // Debounced sync to avoid spamming server
                    if (window._syncTimeout) clearTimeout(window._syncTimeout);
                    window._syncTimeout = setTimeout(() => {
                        const calculatedProgress = (pageNum / totalPages) * 100;
                        syncProgress(product._id, 'EBOOK', {
                            lastPage: pageNum,
                            totalPages: totalPages,
                            progress: calculatedProgress
                        });
                    }, 1000);
                }
            }
        }, observerOptions);

        // Observe all page wrappers
        document.querySelectorAll('.pdf-page-wrapper').forEach(wrapper => {
            pageObserver.observe(wrapper);
        });

        // 6. Resume to last page if requested (Custom Professional Modal)
        if (lastLoadedPage > 1) {
            const resumeModalHtml = `
            <div id="ebook-resume-overlay" class="resume-modal-overlay active">
                <div class="resume-modal">
                    <i class="fas fa-book-open"></i>
                    <h3>Continue Reading?</h3>
                    <p>You previously read up to <span style="color:white; font-weight:bold;">Page ${lastLoadedPage}</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="btn-ebook-resume" class="btn-resume-primary">
                            <i class="fas fa-bookmark"></i> Continue from Page ${lastLoadedPage}
                        </button>
                        <button id="btn-ebook-restart" class="btn-resume-secondary">
                            <i class="fas fa-redo"></i> Start from Beginning
                        </button>
                    </div>
                </div>
            </div>
        `;
            document.getElementById(readerId).insertAdjacentHTML('beforeend', resumeModalHtml);

            document.getElementById('btn-ebook-resume').addEventListener('click', () => {
                document.getElementById('ebook-resume-overlay').remove();
                setTimeout(() => {
                    const targetPage = document.getElementById(`page-${lastLoadedPage}`);
                    if (targetPage) targetPage.scrollIntoView();
                }, 500);
            });

            document.getElementById('btn-ebook-restart').addEventListener('click', () => {
                document.getElementById('ebook-resume-overlay').remove();
                container.scrollTop = 0;
                syncProgress(product._id, 'EBOOK', { lastPage: 1, totalPages: totalPages });
            });
        }

    } catch (error) {
        console.error("Reader Error:", error);
        let errorMsg = `Failed to load PDF (${error.message || 'Unknown Error'}). Please ensure you are logged in.`;
        const errStr = (error.message || '');
        if (errStr.includes('404') || error.name === 'MissingPDFException') {
            // Extract the actual server message if available
            const serverMsg = errStr.replace(/^404:\s*/, '');
            errorMsg = serverMsg && serverMsg !== errStr 
                ? `File Error: ${serverMsg}` 
                : "E-Book file not found on server.\n\nFix: Go to Admin Panel → Edit this product → Re-upload the PDF file.";
        } else if (errStr.includes('401')) {
            errorMsg = "Your session has expired. Please log in again.";
        } else if (errStr.includes('403')) {
            errorMsg = "Access Denied: You do not have permission to view this content.";
        }
        alert(errorMsg);
        const modal = document.getElementById(readerId);
        if (modal) modal.remove();
        return;
    }

    async function renderPageToCanvas(num) {
        const wrapper = document.getElementById(`page-${num}`);
        if (!wrapper) return; // Safety check
        const canvas = wrapper.querySelector('canvas');
        if (!canvas || wrapper.dataset.rendered === 'true') return;

        try {
            const page = await pdfDoc.getPage(num);
            const viewport = page.getViewport({ scale: scale });
            const ctx = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            wrapper.dataset.rendered = 'true';
        } catch (err) {
            console.error(`Page ${num} rendering failed`, err);
        }
    }

    // 7. Event Listeners
    window.forceCloseEbookReader = (e) => {
        if (e && typeof e.stopPropagation === 'function') {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log("🛑 Global Force Close Triggered");
        const modal = document.getElementById(readerId);
        if (modal) modal.remove();
        if (window.efvSecurity) window.efvSecurity.disable();
        if (typeof renderLibraryTab === 'function') renderLibraryTab();
        delete window.forceCloseEbookReader;
    };

    const closeAction = (e) => {
        window.forceCloseEbookReader(e);
    };

    const closeBtn = modal.querySelector('#close-reader');
    if (closeBtn) {
        ['click', 'mousedown', 'touchstart'].forEach(evtType => {
            closeBtn.addEventListener(evtType, closeAction, { capture: true });
        });
    }

    // Secondary Close: Toolbar Click (in case icon is missed)
    const toolbar = document.querySelector('.reader-toolbar');
    if (toolbar) {
        toolbar.addEventListener('dblclick', closeAction);
    }

    // Global Key Failsafe: Shift + X or Alt + C
    const globalKeyHandler = (e) => {
        if ((e.key === 'Escape') || (e.shiftKey && (e.key === 'X' || e.key === 'x')) || (e.altKey && e.key === 'c')) {
            closeAction();
            document.removeEventListener('keydown', globalKeyHandler);
        }
    };
    document.addEventListener('keydown', globalKeyHandler);
};

// --- AUDIOBOOK PLAYER IMPLEMENTATION (Resume Support) ---
window.playAudiobook = async function (product) {
    const bookId = product._id || product.id;
    const token = localStorage.getItem('authToken');

    // 1. Check if product has chapters, and if so open the multi-chapter detail
    try {
        const res = await fetch(`${API_BASE}/api/products/${bookId}`);
        if (res.ok) {
            const fullProduct = await res.json();
            const hasChapters = (fullProduct.chapters || []).filter(c => c.filePath).length > 0;
            if (hasChapters) {
                if (typeof openAudiobookDetail === 'function') {
                    openAudiobookDetail(bookId);
                    return;
                }
            }
        }
    } catch (e) { }

    const playerModalId = 'audio-player-modal';
    const resumeModalId = 'audio-resume-modal';

    // Remove existing players
    if (document.getElementById(playerModalId)) document.getElementById(playerModalId).remove();

    // 2. Fetch saved progress (API or LocalStorage)
    let savedState = await fetchProgress(bookId);
    if (!savedState) {
        const local = localStorage.getItem(`audiobook_${bookId}_progress`);
        if (local) savedState = JSON.parse(local);
    }

    const thumbUrl = window.resolveThumbnailUrl(product.thumbnail, product.name || product.title);

    // 3. Main Player UI
    const audioHtml = `
        <div id="${playerModalId}" class="reader-overlay">
            <div class="reader-toolbar glass-panel">
                <div class="reader-title"><i class="fas fa-headphones"></i> ${product.name || product.title}</div>
                <button class="btn-icon" onclick="closeAudioPlayer()" title="Close"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="reader-canvas-container" style="justify-content: center; align-items: center;">
                <div class="dashboard-card" style="max-width: 400px; padding: 40px; text-align: center; background: rgba(255,255,255,0.02);">
                    <img src="${thumbUrl}" style="width: 200px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 30px;" onerror="this.src=window.getImageForProduct('${(product.name || product.title || '').replace(/'/g, "\\'")}')">
                    <h2 style="color: var(--gold-text); margin-bottom: 20px;">${product.name || product.title}</h2>
                    
                    <div id="audio-progress-info" style="margin-bottom: 20px; font-size: 0.9rem; opacity: 0.8;">
                        <div class="reader-spinner" id="audio-loader" style="width: 30px; height: 30px;"></div>
                        <p id="audio-status-text">Synchronizing Stream...</p>
                    </div>

                    <audio id="efv-audio-player" 
                        src="${CONTENT_CONFIG.contentApi}/audio/${bookId}?token=${token || ''}&t=${Date.now()}"
                        style="width: 100%; filter: invert(1) hue-rotate(180deg);" 
                        controls controlsList="nodownload">
                    </audio>

                    <p style="margin-top: 30px; font-size: 0.8rem; opacity: 0.4;">
                        <i class="fas fa-lock"></i> Encrypted Content Stream
                    </p>
                </div>
            </div>

            <!-- Professional Resume Modal overlay -->
            <div id="${resumeModalId}" class="resume-modal-overlay">
                <div class="resume-modal">
                    <i class="fas fa-headphones"></i>
                    <h3>Continue Listening?</h3>
                    <p>You previously listened up to <span id="resume-time-display" style="color:white; font-weight:bold;">0:00</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="btn-audio-resume" class="btn-resume-primary">
                            <i class="fas fa-play"></i> Continue from <span id="resume-btn-time">0:00</span>
                        </button>
                        <button id="btn-audio-restart" class="btn-resume-secondary">
                            <i class="fas fa-redo"></i> Start from Beginning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', audioHtml);
    if (window.efvSecurity) {
        window.efvSecurity.isTampered = false;
        window.efvSecurity.enable(); // Actively start protection
        window.efvSecurity.applyWatermark(document.getElementById(playerModalId));
    }
    document.getElementById(playerModalId).classList.add('no-select');
    document.body.classList.add('modal-open');

    const audio = document.getElementById('efv-audio-player');
    const statusText = document.getElementById('audio-status-text');
    const loader = document.getElementById('audio-loader');
    const resumeOverlay = document.getElementById(resumeModalId);

    let saveInterval = null;

    // 4. Save Logic helper
    const saveProgress = () => {
        if (audio.currentTime < 1) return;

        const progressData = {
            currentTime: audio.currentTime,
            totalDuration: audio.duration || 0,
            progress: (audio.currentTime / (audio.duration || 1)) * 100
        };

        console.log(`💾 Progress Saving | ${formatTime(audio.currentTime)} | ${progressData.progress.toFixed(1)}%`);

        // Clear if finished (> 95%)
        if (progressData.progress > 95) {
            console.log("🏁 Audiobook finished, resetting progress.");
            if (token) syncProgress(bookId, 'AUDIOBOOK', { currentTime: 0, progress: 0 });
            localStorage.removeItem(`audiobook_${bookId}_progress`);
            return;
        }

        // Save to Local
        localStorage.setItem(`audiobook_${bookId}_progress`, JSON.stringify(progressData));

        // Save to Backend if logged in
        if (token) {
            syncProgress(bookId, 'AUDIOBOOK', progressData);
        }
    };

    // 5. Initialization & Meta
    audio.addEventListener('loadedmetadata', () => {
        loader.style.display = 'none';
        statusText.textContent = "Ready: " + formatTime(audio.duration);

        console.log("🔍 Syncing saved progress:", savedState);

        // Check if worth resuming (>1s and <95%)
        if (savedState && savedState.currentTime > 1) {
            const hasFinished = (savedState.currentTime / audio.duration) > 0.95;
            if (!hasFinished) {
                console.log(`🎯 Found resume point at ${formatTime(savedState.currentTime)}`);
                document.getElementById('resume-time-display').textContent = formatTime(savedState.currentTime);
                document.getElementById('resume-btn-time').textContent = formatTime(savedState.currentTime);
                resumeOverlay.classList.add('active');
            } else {
                audio.play().catch(() => { });
            }
        } else {
            audio.play().catch(() => { });
        }
    });

    // 6. Playback Listeners
    audio.addEventListener('play', () => {
        saveInterval = setInterval(saveProgress, 5000);
    });

    audio.addEventListener('pause', () => {
        if (saveInterval) clearInterval(saveInterval);
        saveProgress();
    });

    // 7. Resume Modal Actions
    document.getElementById('btn-audio-resume').addEventListener('click', () => {
        audio.currentTime = savedState.currentTime;
        resumeOverlay.classList.remove('active');
        audio.play();
    });

    document.getElementById('btn-audio-restart').addEventListener('click', () => {
        audio.currentTime = 0;
        resumeOverlay.classList.remove('active');
        localStorage.removeItem(`audiobook_${bookId}_progress`);
        audio.play();
    });

    window.closeAudioPlayer = function () {
        saveProgress();
        if (saveInterval) clearInterval(saveInterval);
        document.getElementById(playerModalId).remove();
        document.body.classList.remove('modal-open');
        if (window.efvSecurity) window.efvSecurity.disable(); // Stop protection when closing
        // Refresh library tab to show new progress
        renderLibraryTab();
    };

    // Global save on close
    window.addEventListener('beforeunload', saveProgress);
    window.addEventListener('pagehide', saveProgress);
};

// --- API HELPERS ---

// FORMAT HELPER
function formatTime(seconds) {
    if (!seconds) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// MAIN ENTRY POINT
window.accessDigitalContent = function (name, id, type) {
    console.log(`🚀 Dispatching Content Request | Name: ${name} | ID: ${id} | Type: ${type}`);

    // Determine type from parameter or fallback
    const resolvedType = (type || (name.toLowerCase().includes('audio') ? 'Audiobook' : 'E-Book')).toLowerCase();

    // Normalize type string to match player expectations
    const isAudio = resolvedType.includes('audio');

    if (!id) {
        console.error("❌ Cannot access content: Missing Product ID");
        alert("Content data is outdated. Please click 'Sync Library' button above.");
        return;
    }

    const libKey = (typeof getUserKey === 'function') ? getUserKey('efv_digital_library') : 'efv_digital_library';
    let library = [];
    try { library = JSON.parse(localStorage.getItem(libKey)) || []; } catch (e) { }
    const item = library.find(i => (i.productId || i.id || i._id) === id) || {};

    const product = {
        _id: id,
        name: name || item.name || item.title,
        title: name || item.name || item.title,
        id: id,
        type: isAudio ? 'AUDIOBOOK' : 'EBOOK',
        thumbnail: item.thumbnail
    };

    console.log(`✅ Final Product Resolved:`, product);

    if (isAudio) {
        playAudiobook(product);
    } else {
        openEbookReader(product);
    }
};

// Helper for images — maps product name to volume-specific cover images
function getImageForProduct(name) {
    return window.getImageForProduct ? window.getImageForProduct(name) : ((typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH ? CONFIG.BASE_PATH : '../') + 'assets/images/vol1-cover.png');
}


// --- ADMIN PORTAL LOGIC ---

// --- NEW ADMIN MANAGEMENT FUNCTIONS ---


async function fetchNotificationEmail() {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/settings/notification-email`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const input = document.getElementById('admin-notification-email');
            if (input) {
                input.value = data.email || '';
            }
        }
    } catch (e) {
        console.error('Failed to fetch notification email:', e);
    }
}

window.saveNotificationEmails = async function () {
    const input = document.getElementById('admin-notification-email');
    if (!input) return;
    const email = input.value.trim();
    
    if (email) {
        const emails = email.split(',').map(e => e.trim());
        const invalid = emails.filter(e => e && !e.includes('@'));
        if (invalid.length > 0) {
            showToast('Please enter valid email addresses separated by commas', 'error');
            return;
        }
    }

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/settings/notification-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        if (res.ok) {
            showToast('Notification email settings saved successfully!', 'success');
        } else {
            const err = await res.json();
            showToast(err.message || 'Failed to save email settings', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error saving email settings', 'error');
    }
};


let allAdminOrders = [];

window.loadAdminOrdersFull = async function () {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('efv_admin_token') || localStorage.getItem('efv_token');
        if (!token) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px; color: #ff4d4d;"><i class="fas fa-lock"></i> Authentication required. Please log in as admin.</td></tr>';
            return;
        }
        
        const res = await fetch(CONFIG.API_BASE_URL + '/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error("Orders fetch failed:", errData);
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; color: #ff4d4d;"><i class="fas fa-exclamation-triangle"></i> Failed to fetch orders: ${errData.message || res.statusText}</td></tr>`;
            return;
        }

        const data = await res.json();
        allAdminOrders = data;
        filterAdminOrders();
    } catch (err) {
        console.error('Error fetching admin orders:', err);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 40px; color: #ff4d4d;"><i class="fas fa-exclamation-triangle"></i> Connection error: ${err.message}</td></tr>`;
    }
};

window.downloadAdminInvoice = async function (orderId) {
    const btn = event?.target?.closest('button') || { innerHTML: '', disabled: false };
    const originalHTML = btn.innerHTML;
    try {
        if (btn.tagName === 'BUTTON') {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
        }
        const token = localStorage.getItem('authToken') || localStorage.getItem('efv_admin_token') || localStorage.getItem('efv_token');
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/orders/${orderId}/invoice`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Invoice generation failed');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EFV_Invoice_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        if(typeof showToast === 'function') showToast("Invoice downloaded", "success");
    } catch (e) {
        console.error(e);
        if(typeof showToast === 'function') showToast("Failed to download invoice", "error");
    } finally {
        if (btn.tagName === 'BUTTON') {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
};

function renderFulfillmentCell(o) {
    const provider = o.fulfillmentProvider || 'ADMIN';
    let badgeColor = 'rgba(255,255,255,0.1)';
    let textColor = 'white';
    if (provider === 'NIMBUS') {
        badgeColor = 'rgba(52, 152, 219, 0.15)';
        textColor = '#3498db';
    } else if (provider === 'LULU') {
        badgeColor = 'rgba(212, 175, 55, 0.15)';
        textColor = 'var(--gold-text)';
    }

    let detailHtml = '';
    if (provider === 'LULU') {
        const jobId = o.luluJobId || 'N/A';
        const status = o.luluStatus || 'CREATED';
        const tracking = o.luluTracking || 'N/A';
        const method = o.luluShippingMethod || 'N/A';
        const syncStatus = o.luluLastSync ? new Date(o.luluLastSync).toLocaleDateString() : 'N/A';
        
        detailHtml = `
            <div class="lulu-detail-hover" style="font-size: 0.72rem; margin-top: 5px; line-height: 1.3; border-left: 2px solid var(--gold-text); padding-left: 6px; opacity: 0.85;">
                <div><strong>Job ID:</strong> ${jobId}</div>
                <div><strong>Status:</strong> <span style="text-transform: uppercase;">${status}</span></div>
                <div><strong>Tracking:</strong> ${tracking}</div>
                <div><strong>Method:</strong> ${method}</div>
                <div><strong>Deliv:</strong> 3-5 Business Days</div>
                <div><strong>Synced:</strong> ${syncStatus}</div>
            </div>
        `;
    } else if (provider === 'NIMBUS' && o.awbNumber) {
        detailHtml = `
            <div style="font-size: 0.72rem; margin-top: 5px; line-height: 1.3; border-left: 2px solid #3498db; padding-left: 6px; opacity: 0.85;">
                <div><strong>AWB:</strong> ${o.awbNumber}</div>
                <div><strong>Courier:</strong> ${o.courierName || 'N/A'}</div>
            </div>
        `;
    }

    return `
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span class="status-badge-auto" style="
                display:inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 700;
                background: ${badgeColor};
                color: ${textColor};
                border: 1px solid ${textColor}33;
                text-transform: uppercase;
            ">${provider}</span>
            ${detailHtml}
        </div>
    `;
}

window.filterAdminOrders = function () {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;

    if (!allAdminOrders || allAdminOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px; opacity:0.5;">No orders data available.</td></tr>';
        return;
    }

    const searchEl = document.getElementById('admin-order-search');
    const typeEl = document.getElementById('admin-order-type-filter');
    const deliveryEl = document.getElementById('admin-delivery-filter');

    const searchTerm = searchEl ? searchEl.value.trim().toLowerCase() : '';
    const typeFilter = typeEl ? typeEl.value : 'all';
    const deliveryFilter = deliveryEl ? deliveryEl.value : 'all';

    const filtered = allAdminOrders.filter(o => {
        if (!o) return false;
        const id = String(o.orderId || o._id || '').toLowerCase();
        const name = (o.customer && o.customer.name || '').toLowerCase();
        const phone = (o.customer && o.customer.phone || '').toLowerCase();

        const matchesSearch = id.includes(searchTerm) || name.includes(searchTerm) || phone.includes(searchTerm);

        let matchesType = true;
        if (typeFilter !== 'all' && o.items) {
            matchesType = o.items.some(item => {
                if (typeFilter === 'physical') {
                    return ['HARDCOVER', 'PAPERBACK'].includes(item.type);
                }
                return item.type === typeFilter;
            });
        }

        let matchesDelivery = true;
        if (deliveryFilter === 'local') {
            matchesDelivery = (o.status === 'Local Delivery');
        } else if (deliveryFilter === 'nimbus') {
            matchesDelivery = !!o.shipmentId || (!o.shipmentId && o.items && o.items.some(i => ['HARDCOVER', 'PAPERBACK'].includes(i.type)) && o.status !== 'Local Delivery');
        }

        return matchesSearch && matchesType && matchesDelivery;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px; opacity:0.5;">No orders found matching your search.</td></tr>';
        return;
    }

    filtered.forEach(o => {
        const date = new Date(o.createdAt).toLocaleDateString();
        const items = (o.items || []).map(i => `${i.quantity}x ${i.title}`).join(', ');
        const origPrice = o.offerOriginalAmount || o.subtotal || o.totalAmount;
        const savings = o.offerSavings || 0;
        
        const pricingHtml = `
            <div style="font-weight:bold;">${getOrderCurrSym(o)}${o.totalAmount}</div>
            ${savings > 0 ? `
                <div style="font-size:0.72rem; opacity:0.6; text-decoration:line-through; margin-top:2px;">${getOrderCurrSym(o)}${origPrice}</div>
                <div style="font-size:0.7rem; color:#2ecc71; font-weight:600; margin-top:1px;">Saved: ${getOrderCurrSym(o)}${savings}</div>
            ` : ''}
        `;

        const offerUsedHtml = o.purchasedThroughOffer === 'Yes' ? `
            <div style="font-size:0.8rem; font-weight:600; color:var(--gold-text);">${o.offerName || 'Special Offer'}</div>
            <div style="font-size:0.68rem; opacity:0.5; text-transform:uppercase; margin-top:1px;">${o.offerType || ''}</div>
        ` : `<span style="opacity:0.4;">None</span>`;

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        tr.innerHTML = `
            <td style="padding: 12px; font-family: monospace;">#${(o.orderId || o._id.slice(-8))}</td>
            <td style="padding: 12px;">${date}</td>
            <td style="padding: 12px;">
                <div style="font-weight:600; color:var(--gold-text);">${o.customer.name || 'N/A'}</div>
                <div style="font-size:0.75rem; opacity:0.7;">${o.customer.email || 'N/A'}</div>
                <div style="font-size:0.7rem; opacity:0.5;">ID: ${o.userId || 'N/A'}</div>
            </td>
            <td style="padding: 12px;">
                <div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem;" title="${items}">
                    ${items}
                </div>
            </td>
            <td style="padding: 12px;">${pricingHtml}</td>
            <td style="padding: 12px;">${offerUsedHtml}</td>
            <td style="padding: 12px;"><span class="badge ${o.paymentStatus === 'Paid' ? 'green' : 'gold'}">${o.paymentStatus}</span></td>
            <td style="padding: 12px;">${renderFulfillmentCell(o)}</td>
            <td style="padding: 12px;">
                <div style="font-size:0.75rem; font-weight:bold; color:var(--gold-text); margin-bottom:5px;">
                    ${[...new Set((o.items || []).map(i => i.type))].join(', ')}
                </div>
                <span class="status-badge-auto" style="
                    display:inline-block;
                    padding: 3px 10px;
                    border-radius: 50px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    ${o.status === 'Local Delivery' ? 'background:rgba(243,156,18,0.15); color:#f39c12; border:1px solid rgba(243,156,18,0.3);' :
                      o.status === 'Delivered' ? 'background:rgba(46,204,113,0.15); color:#2ecc71; border:1px solid rgba(46,204,113,0.3);' :
                      o.status === 'Shipped' || o.status === 'Out for Delivery' ? 'background:rgba(52,152,219,0.15); color:#3498db; border:1px solid rgba(52,152,219,0.3);' :
                      o.status === 'Processing' || o.status === 'Packed' ? 'background:rgba(241,196,15,0.15); color:#f1c40f; border:1px solid rgba(241,196,15,0.3);' :
                      o.status === 'Cancelled' || o.status === 'Failed' ? 'background:rgba(255,77,77,0.15); color:#ff4d4d; border:1px solid rgba(255,77,77,0.3);' :
                      o.status === 'Returned' ? 'background:rgba(255,165,0,0.15); color:#ffa500; border:1px solid rgba(255,165,0,0.3);' :
                      'background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.15);'}
                ">${o.status}</span>
            </td>
            <td style="padding: 12px;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <button class="btn btn-outline small" onclick="viewAdminOrderDetail('${o._id}')">View</button>
                    ${o.status === 'Local Delivery' ? 
                `<span style="color:#f39c12; font-size:0.75rem; font-weight:bold;"><i class="fas fa-map-marker-alt"></i> Local</span>` : 
                ((!o.shipmentId && (o.items || []).some(i => ['HARDCOVER', 'PAPERBACK', 'PHYSICAL'].includes((i.type || '').toUpperCase()))) ?
                `<button class="btn btn-gold tiny" onclick="window.createNimbusShipment('${o._id}')" id="ship-btn-${o._id}" style="font-size: 0.65rem; padding: 4px 8px;"><i class="fas fa-truck"></i> Ship</button>` :
                (o.shipmentId ? `<span style="color:#2ecc71; font-size:0.75rem;"><i class="fas fa-check"></i> Shipped</span>` : ''))
            }
                    <button class="btn-icon" style="color: #ff4d4d;" onclick="window.deleteOrder('${o._id}')" title="Delete Order"><i class="fas fa-trash"></i></button>
                    ${(!['Cancelled', 'Delivered', 'Returned'].includes(o.status)) ?
                `<button class="btn-icon" style="color:#ff6b6b; font-size:1rem;" onclick="adminCancelOrder('${o.orderId}')" title="Cancel Order"><i class="fas fa-ban"></i></button>`
                : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.filterAdminProducts = function () {
    const searchEl = document.getElementById('admin-product-search');
    const typeEl = document.getElementById('admin-product-filter-type');
    const stockEl = document.getElementById('admin-product-filter-stock');
    const langEl = document.getElementById('admin-product-filter-lang');

    if (!searchEl || !typeEl || !stockEl) return;

    const searchTerm = searchEl.value.toLowerCase();
    const typeFilter = typeEl.value;
    const stockFilter = stockEl.value;
    const langFilter = langEl ? langEl.value : 'all';

    const tbody = document.getElementById('admin-product-table-body-full');

    if (!Array.isArray(allAdminProducts)) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; opacity:0.5;">No products data available.</td></tr>';
        return;
    }

    let filtered = allAdminProducts.filter(p => {
        if (!p) return false;
        const matchesSearch = (p.title || '').toLowerCase().includes(searchTerm) || (p.author && p.author.toLowerCase().includes(searchTerm));

        let matchesType = true;
        if (typeFilter === 'physical') {
            matchesType = ['HARDCOVER', 'PAPERBACK'].includes(p.type);
        } else if (typeFilter !== 'all') {
            matchesType = p.type === typeFilter;
        }

        let matchesStock = true;
        if (stockFilter === 'instock') {
            matchesStock = (p.stock || 0) > 0;
        } else if (stockFilter === 'outofstock') {
            matchesStock = (p.stock || 0) <= 0;
        }

        let matchesLang = true;
        if (langFilter !== 'all') {
            matchesLang = (p.language || 'Hindi') === langFilter;
        }

        return matchesSearch && matchesType && matchesStock && matchesLang;
    });

    // --- SERIES SORTING LOGIC ---
    const typeOrder = { 'HARDCOVER': 1, 'PAPERBACK': 2, 'AUDIOBOOK': 3, 'EBOOK': 4 };
    const langOrder = { 'Hindi': 1, 'English': 2 };

    filtered.sort((a, b) => {
        // Helper to get volume
        const getVol = (p) => {
            if (p.volume) return parseInt(p.volume);
            const match = (p.title || '').match(/VOL\s*(\d+)/i);
            return match ? parseInt(match[1]) : 99;
        };

        // 1. Volume Sort (Numerical)
        const volA = getVol(a);
        const volB = getVol(b);
        if (volA !== volB) return volA - volB;

        // 2. Language Sort (Hindi first)
        const langA = langOrder[a.language] || 3;
        const langB = langOrder[b.language] || 3;
        if (langA !== langB) return langA - langB;

        // 3. Format Type Sort (HC -> PB -> Audio -> Ebook)
        const orderA = typeOrder[a.type] || 99;
        const orderB = typeOrder[b.type] || 99;
        return orderA - orderB;
    });

    window.renderAdminProducts(filtered);
};

window.renderAdminProducts = function (products) {
    const tbody = document.getElementById('admin-product-table-body-full');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 40px; opacity:0.5;">No products found matching filters.</td></tr>';
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        // Dynamic Thumbnail Resolver
        let thumbUrl = CONFIG.BASE_PATH + 'assets/images/placeholder.png';
        if (p.thumbnail) {
            if (p.thumbnail.startsWith('http')) {
                thumbUrl = p.thumbnail;
            } else if (p.thumbnail.startsWith('img/')) {
                // Shared frontend images - transform to new assets path
                thumbUrl = CONFIG.BASE_PATH + 'assets/images/' + p.thumbnail.replace('img/', '');
            } else if (p.thumbnail.startsWith('assets/images/')) {
                // Static assets in frontend
                thumbUrl = CONFIG.BASE_PATH + p.thumbnail;
            } else {
                // Backend uploads (usually uploads/...)
                thumbUrl = `${API_BASE}/${p.thumbnail}`;
            }
        }

        tr.innerHTML = `
            <td style="padding: 12px;"><img src="${thumbUrl}" style="width: 45px; height: 65px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);"></td>
            <td style="padding: 12px;">
                <div style="font-weight: 600; color: white;">${p.title}</div>
                <div style="font-size: 0.8rem; opacity: 0.6; margin-top: 2px;">${p.author || 'EFV Author'}</div>
            </td>
            <td style="padding: 12px;"><span class="badge" style="background: rgba(255,255,255,0.1); color: var(--gold-text); font-size: 0.75rem;">${p.type}</span></td>
            <td style="padding: 12px;"><span style="color:rgba(255,255,255,0.8); font-size: 0.85rem;">${p.language || 'Hindi'}</span></td>
            <td style="padding: 12px;"><strong>₹${p.price}</strong>${p.discountPrice ? `<br><small style="text-decoration: line-through; opacity: 0.5;">₹${p.discountPrice}</small>` : ''}</td>
            <td style="padding: 12px;">
                ${(p.type === 'EBOOK' || p.type === 'AUDIOBOOK') ?
                (p.filePath ?
                    `<div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="color: #2ecc71; font-size: 0.75rem;"><i class="fas fa-check-circle"></i> OK</span>
                            <button onclick="window.openProductModal('${p._id}')" style="background:none; border:none; color:var(--gold-text); font-size:0.7rem; cursor:pointer; padding:0; text-align:left; text-decoration:underline;">Update File</button>
                        </div>` :
                    `<div style="display:flex; flex-direction:column; gap:4px;">
                            <span style="color: #ff4d4d; font-size: 0.75rem;"><i class="fas fa-exclamation-triangle"></i> Missing</span>
                            <button onclick="window.openProductModal('${p._id}')" class="btn btn-gold small" style="padding: 2px 8px; font-size: 0.65rem; width:auto;">Upload Now</button>
                        </div>`)
                : '<span style="opacity: 0.3; font-size: 0.75rem;">N/A (Physical)</span>'}
            </td>
            <td style="padding: 12px;">
                <span style="color: ${(p.stock || 0) <= 0 ? '#ff4d4d' : 'inherit'}">
                    ${p.stock || 0}
                </span>
                <br><small style="opacity:0.5;">qty</small>
            </td>
            <td style="padding: 12px;">
                <div style="display: flex; gap: 5px;">
                    <button onclick="window.openProductModal('${p._id}')" class="btn-icon" style="color: var(--gold-text);" title="Edit Product"><i class="fas fa-edit"></i></button>
                    <button onclick="window.deleteProduct('${p._id}')" class="btn-icon" style="color: #ff4d4d;" title="Delete Product"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.loadAdminCustomers = async function () {
    const tbody = document.getElementById('admin-customers-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Fetching customers...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const [usersRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE}/api/orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const users = await usersRes.json();
        const orders = await ordersRes.json();

        // Cache for detail view
        window.allAdminUsers = users;
        window.allAdminOrders = orders;

        tbody.innerHTML = '';
        if (!Array.isArray(users)) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; opacity:0.5;">No users found.</td></tr>';
            return;
        }

        users.forEach(u => {
            if (!u || !u.email) return;
            const userOrders = Array.isArray(orders) ? orders.filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === u.email.toLowerCase()) : [];
            const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 12px;">${u.name}</td>
                <td style="padding: 12px;">${u.email}</td>
                <td style="padding: 12px;">${u.phone || 'N/A'}</td>
                <td style="padding: 12px; text-align:center;">${userOrders.length}</td>
                <td style="padding: 12px; font-weight:bold; color:var(--gold-text);">₹${totalSpent.toLocaleString()}</td>
                <td style="padding: 12px;">
                    <button class="btn btn-outline small" onclick="window.viewCustomerDetail('${u._id || u.id}')">View</button>
                    <button class="btn btn-gold small" style="margin-left: 5px;" onclick="window.openAssignBookModal('${u._id || u.id}', '${u.email}')" title="Assign E-Book / Audiobook"><i class="fas fa-gift"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Load Customers Error:", e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color:#ff4d4d;">Failed to load customers.</td></tr>';
    }
};

window.loadAdminPayments = async function () {
    const tbody = document.getElementById('admin-payments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Loading payments...</td></tr>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const payments = await res.json();

        if (!Array.isArray(payments)) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No payment data available.</td></tr>';
            return;
        }

        tbody.innerHTML = payments.length ? '' : '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No payment records found.</td></tr>';
        payments.forEach(p => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                        <td style="padding: 12px; font-family: monospace; font-size: 0.8rem;">${p.paymentId || 'N/A'}</td>
                        <td style="padding: 12px; font-family: monospace;">#${p.orderId ? p.orderId.slice(-6) : 'N/A'}</td>
                        <td style="padding: 12px; font-weight: bold;">${ADMIN_CURRENCY_SYMBOLS[p.currency] || '₹'}${p.amount}</td>
                        <td style="padding: 12px;">${p.method || 'Razorpay'}</td>
                        <td style="padding: 12px;"><span class="badge ${p.status === 'Paid' ? 'green' : 'gold'}">${p.status}</span></td>
                        <td style="padding: 12px;">${new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                    `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#ff6b6b;">Error loading payments.</td></tr>';
    }
};

window.loadAdminShipments = async function () {
    const tbody = document.getElementById('admin-shipments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;"><i class="fas fa-spinner fa-spin"></i> Loading shipments...</td></tr>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const shipments = await res.json();

        if (!Array.isArray(shipments)) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No shipment data available.</td></tr>';
            return;
        }

        tbody.innerHTML = shipments.length ? '' : '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No active shipments.</td></tr>';
        shipments.forEach(s => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                        <td style="padding: 12px; font-family: monospace;">#${s.orderId ? s.orderId.slice(-6) : 'N/A'}</td>
                        <td style="padding: 12px;">${s.courierName || 'Pending'}</td>
                        <td style="padding: 12px;">
                            <div style="font-weight:600;">${s.awbNumber || 'Generating...'}</div>
                            ${s.awbNumber ? `<button onclick="window.trackNimbusShipment('${s.awbNumber}')" class="btn btn-outline tiny" style="margin-top:5px; font-size:0.65rem; padding:2px 8px;">LIVE TRK</button>` : ''}
                        </td>
                        <td style="padding: 12px;"><span class="badge ${s.shippingStatus === 'Delivered' ? 'green' : 'gold'}">${s.shippingStatus}</span></td>
                        <td style="padding: 12px;">${s.labelUrl ? `<a href="${s.labelUrl}" target="_blank" class="btn btn-outline small">View Label</a>` : '<span style="opacity:0.3;">N/A</span>'}</td>
                        <td style="padding: 12px;">${s.trackingLink ? `<a href="${s.trackingLink}" target="_blank" class="btn btn-outline small">Track Page</a>` : '<span style="opacity:0.3;">N/A</span>'}</td>
                    `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#ff6b6b;">Error loading shipments.</td></tr>';
    }
};

window.trackNimbusShipment = async function (awb) {
    if (!awb) return;
    showToast("Fetching live tracking...", "info");
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/track/${awb}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.status && result.data) {
            const latest = result.data.history ? result.data.history[0] : null;
            const status = result.data.status_name || result.data.status || "Unknown";
            const location = result.data.location || "";
            alert(`Live Status: ${status}\nLocation: ${location}\nLast Updated: ${latest ? latest.event_time : 'N/A'}`);
        } else {
            alert(result.message || "Tracking info not available yet.");
        }
    } catch (e) {
        console.error(e);
        showToast("Tracking failed", "error");
    }
};

// function removed and merged below

window.loadAdminCoupons = async function () {
    const tbody = document.getElementById('admin-coupons-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Loading coupons...</td></tr>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/coupons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coupons = await res.json();
        tbody.innerHTML = coupons.length ? '' : '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No coupons created yet.</td></tr>';
        coupons.forEach(c => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            const expiry = c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never';
            tr.innerHTML = `
                        <td style="padding: 12px; font-weight: bold; color: var(--gold-text);">${c.code}</td>
                        <td style="padding: 12px;">${c.type}</td>
                        <td style="padding: 12px;">${c.type === 'Percentage' ? c.value + '%' : '₹' + c.value}</td>
                        <td style="padding: 12px;">${c.usedCount} / ${c.usageLimit}</td>
                        <td style="padding: 12px;">${expiry}</td>
                        <td style="padding: 12px;"><span class="badge ${c.isActive ? 'green' : 'red'}">${c.isActive ? 'Active' : 'Disabled'}</span></td>
                        <td style="padding: 12px;">
                            <button class="btn-icon" style="color: #ff4d4d;" onclick="window.deleteCoupon('${c._id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#ff6b6b;">Error loading coupons.</td></tr>';
    }
};

window.loadAdminReports = function () {
    console.log("Analytics view loaded with dummy charts.");
};

window.updateOrderStatus = async function (id, status) {
    const note = prompt(`Updating order ${id} to ${status}. Add a note?`, `Status updated to ${status}`);
    if (note === null) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, note })
        });

        if (res.ok) {
            if (document.getElementById('admin-orders').classList.contains('active')) loadAdminOrdersFull();
            updateAdminStats();
        } else alert('Failed to update status');
    } catch (e) {
        console.error(e);
        alert('Server error');
    }
};


// --- MISSING DASHBOARD FUNCTIONS ---
// Handle Product Form Submission
window.handleProductFormSubmit = async function (e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
        e.stopPropagation();
    }
    const btn = document.getElementById('admin-save-btn');
    const originalText = btn ? btn.innerHTML : '<i class="fas fa-save"></i> UPDATE PRODUCT';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        btn.disabled = true;
    }

    try {
        const rawAuthUser = localStorage.getItem('efv_auth_user');
        const parsedToken = rawAuthUser ? (JSON.parse(rawAuthUser).token || '') : '';
        const token = localStorage.getItem('authToken') || parsedToken || localStorage.getItem('efv_admin_token') || localStorage.getItem('efv_token') || '';

        const cover = document.getElementById('admin-file-cover')?.files?.[0];
        const ebook = document.getElementById('admin-file-ebook')?.files?.[0];
        const galleryFiles = document.getElementById('admin-file-gallery')?.files;
        const productType = document.getElementById('admin-prod-type')?.value || 'HARDCOVER';

        const allFiles = [];
        if (cover) allFiles.push({ file: cover, fieldname: 'cover' });
        if (ebook) allFiles.push({ file: ebook, fieldname: 'ebook' });
        if (galleryFiles && galleryFiles.length > 0) {
            Array.from(galleryFiles).forEach(f => allFiles.push({ file: f, fieldname: 'gallery' }));
        }
        if (productType === 'AUDIOBOOK') {
            const audio = document.getElementById('admin-file-audio') ? document.getElementById('admin-file-audio').files[0] : null;
            if (audio) allFiles.push({ file: audio, fieldname: 'audio' });

            const chapterCards = document.querySelectorAll('.chapter-card');
            chapterCards.forEach(card => {
                const index = card.dataset.index;
                const fileInput = document.getElementById(`chapter-audio-${index}`);
                if (fileInput && fileInput.files[0]) {
                    allFiles.push({ file: fileInput.files[0], fieldname: `chapter_${index}` });
                }
            });
        }

        let uploadData = {};
        let chapterPaths = {};
        let galleryPaths = [];

        if (allFiles.length > 0) {
            for (let i = 0; i < allFiles.length; i++) {
                const fileObj = allFiles[i];
                const file = fileObj.file;
                const fieldname = fileObj.fieldname;

                const CHUNK_SIZE = 5 * 1024 * 1024; 
                const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                const fileId = Date.now() + '_' + i;
                
                let finalPath = '';
                for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                    const start = chunkIndex * CHUNK_SIZE;
                    const end = Math.min(start + CHUNK_SIZE, file.size);
                    const chunk = file.slice(start, end);

                    const chunkFormData = new FormData();
                    chunkFormData.append('chunk', chunk, file.name);
                    chunkFormData.append('fileId', fileId);
                    chunkFormData.append('chunkIndex', chunkIndex);
                    chunkFormData.append('totalChunks', totalChunks);
                    chunkFormData.append('fieldname', fieldname);
                    chunkFormData.append('originalname', file.name);

                    // --- ATOMIC RETRY LOOP (RESILIENCE) ---
                    let chunkRes;
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        try {
                            chunkRes = await fetch(API_BASE + '/api/upload/chunked', {
                                method: 'POST',
                                headers: { 'Authorization': 'Bearer ' + token },
                                body: chunkFormData
                            });
                            if (chunkRes.ok) break; // Success!
                            if (attempt === 3) throw new Error('Permanent error after 3 retries');
                            console.warn(`⚠️ Chunk upload failed (Attempt ${attempt}/3). Retrying in 2s...`);
                            await new Promise(r => setTimeout(r, 2000));
                        } catch (e) {
                            if (attempt === 3) throw e;
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                    
                    const pct = Math.round(((chunkIndex + 1) / totalChunks) * 100);
                    if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading ${i+1}/${allFiles.length} (${pct}%)`;

                    const chunkData = await chunkRes.json();
                    if (chunkData.completed) {
                        finalPath = chunkData.storagePath;
                    }
                }
                if (fieldname === 'cover') uploadData.coverPath = finalPath;
                else if (fieldname === 'ebook') uploadData.ebookPath = finalPath;
                else if (fieldname === 'audio') uploadData.audioPath = finalPath;
                else if (fieldname === 'gallery') galleryPaths.push(finalPath);
                else if (fieldname.startsWith('chapter_')) {
                    const idx = fieldname.split('_')[1];
                    chapterPaths[idx] = finalPath;
                }

                // Small cooldown between files
                await new Promise(r => setTimeout(r, 500));
            }
            
            if (galleryPaths.length > 0) uploadData.galleryPaths = galleryPaths;
            if (Object.keys(chapterPaths).length > 0) uploadData.chapterPaths = chapterPaths;
        }

        const productId = document.getElementById('admin-prod-id')?.value?.trim();
        const isEdit = !!productId;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
        const getNum = (id) => {
            const v = document.getElementById(id)?.value;
            return (v !== '' && v !== null && !isNaN(Number(v))) ? Number(v) : 0;
        };

        const titleVal = getVal('admin-prod-title');
        const priceVal = getNum('admin-prod-price');
        const typeVal = getVal('admin-prod-type') || 'HARDCOVER';

        if (!titleVal) {
            alert('Please enter Book Title');
            document.getElementById('admin-prod-title')?.focus();
            if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
            return;
        }

        // Parse additional specs
        const additionalSpecs = {};
        const specsLines = getVal('admin-prod-additional-specs').split('\n');
        specsLines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join(':').trim();
                if (key && value) {
                    additionalSpecs[key] = value;
                }
            }
        });

        // Parse tags
        const tags = getVal('admin-prod-tags').split(',').map(t => t.trim()).filter(Boolean);

        const productData = {
            title: titleVal,
            author: getVal('admin-prod-author') || 'EFV Authorized Member',
            type: typeVal,
            language: getVal('admin-prod-lang') || 'Hindi',
            volume: getVal('admin-prod-volume'),
            price: priceVal,
            originalPrice: getNum('admin-prod-original-price') || priceVal,
            discount: getNum('admin-prod-discount') || 0,
            discountPrice: priceVal,
            stock: getNum('admin-prod-stock'),
            weight: getNum('admin-prod-weight'),
            length: getNum('admin-prod-length'),
            breadth: getNum('admin-prod-width'),
            height: getNum('admin-prod-height'),
            duration: getVal('admin-prod-duration'),
            description: getVal('admin-prod-desc'),
            category: (() => {
                const selType = typeVal;
                const cat = window.adminCategories?.find(c => c.slug === selType);
                return (cat ? cat.isDigital : (selType === 'EBOOK' || selType === 'AUDIOBOOK')) ? 'Digital' : 'Physical';
            })(),
            subtitle: getVal('admin-prod-subtitle'),
            edition: getVal('admin-prod-edition'),
            isbn: getVal('admin-prod-isbn'),
            dimensions: getVal('admin-prod-dimensions') || '6.0 x 9.0 inches',
            availability: getVal('admin-prod-availability') || 'Available',
            tags: tags,
            rating: getNum('admin-prod-rating') || 5,
            reviewCount: getNum('admin-prod-review-count') || 2450,
            additionalSpecs: additionalSpecs,
            podPackageId: getVal('admin-prod-pod-package-id') || '0600X0900BWSTDPB060UW444MXX',
            podHardcoverSku: getVal('admin-prod-pod-hardcover-sku'),
            podPaperbackSku: getVal('admin-prod-pod-paperback-sku'),
            luluCoverUrl: getVal('admin-prod-lulu-cover-url'),
            luluInteriorUrl: getVal('admin-prod-lulu-interior-url'),
            regionalPrices: {},
            categories: (() => {
                const selected = [];
                document.querySelectorAll('.admin-marketing-cat-checkbox:checked').forEach(cb => {
                    selected.push(cb.value);
                });
                return selected;
            })()
        };

        // Collect country-wise prices
        const finalCountryPricing = {};
        document.querySelectorAll('.admin-country-pricing-row').forEach(row => {
            const cKey = row.getAttribute('data-country-key');
            if (!cKey) return;
            const cName = row.getAttribute('data-country-name') || cKey;
            const cFlag = row.getAttribute('data-country-flag') || '🌐';
            const cCode = row.getAttribute('data-country-code') || '';
            const currEl = document.getElementById(`cp-curr-${cKey}`) || row.querySelector('.country-currency');
            const cCurr = currEl ? currEl.value.trim().toUpperCase() : (row.getAttribute('data-country-currency') || 'USD');
            
            const priceEl = document.getElementById(`cp-price-${cKey}`);
            const mrpEl = document.getElementById(`cp-mrp-${cKey}`);
            const gstEl = document.getElementById(`cp-gst-${cKey}`);
            const enabledEl = document.getElementById(`cp-enabled-${cKey}`);
            
            const priceRaw = priceEl ? priceEl.value.trim() : '';
            const mrpRaw = mrpEl ? mrpEl.value.trim() : '';
            const priceVal = priceRaw !== '' ? parseFloat(priceRaw) : NaN;
            const mrpVal = mrpRaw !== '' ? parseFloat(mrpRaw) : NaN;
            const gstVal = gstEl && gstEl.value !== '' ? parseFloat(gstEl.value) : 0;
            const enabledVal = enabledEl ? enabledEl.checked : true;
            const isCustom = row.getAttribute('data-is-custom') === 'true';

            if (!isNaN(priceVal) || isCustom) {
                const finalPrice = !isNaN(priceVal) ? priceVal : 0;
                const finalMrp = !isNaN(mrpVal) ? mrpVal : finalPrice;
                finalCountryPricing[cKey] = {
                    name: cName,
                    currency: cCurr,
                    flag: cFlag,
                    code: cCode,
                    price: finalPrice,
                    mrp: finalMrp,
                    gstPercent: !isNaN(gstVal) ? gstVal : 0,
                    taxRate: !isNaN(gstVal) ? gstVal : 0,
                    enabled: enabledVal
                };
            }
        });
        productData.countryPricing = finalCountryPricing;

        // Persistence Logic: If no new file uploaded, keep the old one
        if (uploadData.coverPath) {
            productData.thumbnail = uploadData.coverPath;
        } else if (window._currentEditingProduct?.thumbnail) {
            productData.thumbnail = window._currentEditingProduct.thumbnail;
        } else {
            delete productData.thumbnail;
        }

        if (uploadData.galleryPaths && uploadData.galleryPaths.length > 0) {
            productData.gallery = uploadData.galleryPaths;
        } else if (window._currentEditingProduct?.gallery) {
            productData.gallery = window._currentEditingProduct.gallery;
        } else {
            delete productData.gallery;
        }

        if (productData.type === 'EBOOK') {
            if (uploadData.ebookPath) {
                productData.filePath = uploadData.ebookPath;
            } else if (window._currentEditingProduct?.filePath) {
                productData.filePath = window._currentEditingProduct.filePath;
            } else {
                delete productData.filePath;
            }
        } else if (productData.type === 'AUDIOBOOK') {
            productData.totalChapters = Number(document.getElementById('admin-prod-total-chapters')?.value) || 0;

            if (uploadData.audioPath) {
                productData.filePath = uploadData.audioPath;
            } else if (window._currentEditingProduct?.filePath) {
                productData.filePath = window._currentEditingProduct.filePath;
            }

            const chapterCards = document.querySelectorAll('.chapter-card');
            const chapters = [];
            chapterCards.forEach(card => {
                const index = card.dataset.index;
                const titleInput = document.getElementById(`chapter-title-${index}`);
                const title = titleInput?.value?.trim() || `Chapter ${Number(index) + 1}`;

                let filePath = '';
                if (uploadData.chapterPaths && uploadData.chapterPaths[index]) {
                    filePath = uploadData.chapterPaths[index];
                } else if (window._currentEditingProduct?.chapters?.[index]) {
                    filePath = window._currentEditingProduct.chapters[index].filePath;
                }

                chapters.push({
                    chapterNumber: Number(index) + 1,
                    title: title,
                    filePath: filePath
                });
            });

            productData.chapters = chapters;
            if (chapters.length > 0 && chapters[0].filePath) {
                productData.filePath = chapters[0].filePath;
            }
        }

        const url = isEdit ? `${API_BASE}/api/products/${productId}` : `${API_BASE}/api/products`;
        const method = isEdit ? 'PUT' : 'POST';

        console.log(`📤 Sending ${method} product request to ${url}:`, productData);

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });

        if (res.ok) {
            const savedProd = await res.json();
            console.log('✅ Product saved successfully:', savedProd);
            window.closeProductModal();
            if (typeof window.loadAdminProductsFull === 'function') window.loadAdminProductsFull();
            if (typeof window.syncLibraryWithBackend === 'function') window.syncLibraryWithBackend();
            else if (typeof renderLibraryTab === 'function') renderLibraryTab();
            if (typeof window.updateAdminStats === 'function') window.updateAdminStats();
            showToast(isEdit ? 'Product updated successfully' : 'Product added successfully', 'success');
        } else {
            const err = await res.json().catch(() => ({}));
            console.error('❌ Failed saving product:', err);
            alert(err.message || 'Error saving product');
        }
    } catch (e) {
        console.error('❌ Exception in handleProductFormSubmit:', e);
        alert('Error: ' + e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

const productForm = document.getElementById('admin-product-form');
if (productForm) {
    productForm.addEventListener('submit', window.handleProductFormSubmit);
}
const adminSaveBtn = document.getElementById('admin-save-btn');
if (adminSaveBtn) {
    adminSaveBtn.addEventListener('click', window.handleProductFormSubmit);
}

window.viewAdminOrderDetail = async function (id) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const order = await res.json();
        if (!res.ok) return alert("Order not found");

        // Use the existing order details modal structure if it exists
        const detailContent = `
                    <div style="padding: 20px;">
                        <h3 style="color:var(--gold-text); margin-bottom:15px;">Order #${order._id.slice(-6)}</h3>
                        <p><strong>Customer:</strong> ${order.customer.name}</p>
                        <p><strong>Email:</strong> ${order.customer.email}</p>
                        <p><strong>Phone:</strong> ${order.customer.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${typeof order.customer.address === 'object' ? ([order.customer.address.house, order.customer.address.area, order.customer.address.street].filter(Boolean).join(', ')) : order.customer.address}, ${order.customer.city || order.customer.address?.city || ''} - ${order.customer.zip || order.customer.address?.pincode || ''}</p>
                        <hr style="opacity:0.1; margin:15px 0;">
                        <h4 style="margin-bottom:10px;">Items</h4>
                        <div style="font-family:monospace; font-size:0.9rem;">
                            ${order.items.map(i => `<div>${i.quantity}x ${i.title} (${getOrderCurrSym(order)}${i.price})</div>`).join('')}
                        </div>
                        <hr style="opacity:0.1; margin:15px 0;">
                        <div style="display:flex; justify-content:space-between; font-weight:bold;">
                            <span>Total Amount:</span>
                            <span>${getOrderCurrSym(order)}${order.totalAmount}</span>
                        </div>
                    </div>
                `;

        // For now, we'll use a simple alert or a dedicated modal if available
        // Checking if 'order-detail-modal' exists
        const modal = document.getElementById('order-detail-modal');
        if (!modal) return;

        document.getElementById('modal-order-id').textContent = `#${order._id.slice(-6)}`;
        
        const invoiceBtn = document.getElementById('modal-download-invoice-btn');
        if (invoiceBtn) invoiceBtn.dataset.id = order._id;

        document.getElementById('modal-order-date').textContent = `Placed on: ${new Date(order.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
        document.getElementById('modal-subtotal').textContent = `${getOrderCurrSym(order)}${order.totalAmount}`;
        document.getElementById('modal-total').textContent = `${getOrderCurrSym(order)}${order.totalAmount}`;
        document.getElementById('modal-payment-method').textContent = order.paymentMethod || 'Razorpay';
        document.getElementById('modal-payment-status').textContent = order.paymentStatus;

        // Items
        const itemsContainer = document.getElementById('modal-order-items');
        if (itemsContainer) {
            itemsContainer.innerHTML = order.items.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                    <div>
                        <h4 style="margin:0; font-size:0.95rem;">${item.title}</h4>
                        <p style="margin:0; font-size:0.8rem; opacity:0.6;">${item.type} (x${item.quantity})</p>
                    </div>
                    <span class="gold-text" style="font-weight:bold;">${getOrderCurrSym(order)}${item.price}</span>
                </div>
            `).join('');
        }

        // Address
        const addr = order.customer || {};
        const addrContainer = document.getElementById('modal-shipping-address');
        if (addrContainer) {
            let addressHtml = addr.name || 'Anonymous';

            if (typeof addr.address === 'object' && addr.address !== null) {
                const a = addr.address;
                const lines = [];
                if (a.house || a.street) lines.push(a.house || a.street);
                if (a.area) lines.push(a.area);
                if (a.landmark) lines.push(`Landmark: ${a.landmark}`);
                
                addressHtml += `<br>${lines.join(', ')}`;
                addressHtml += `<br>${a.city || addr.city || ''}, ${a.state || addr.state || ''} ${a.pincode || a.zip || addr.zip || addr.pincode || ''}`;
            } else {
                addressHtml += `<br>${addr.address || 'N/A'}`;
                if (addr.city || addr.zip) addressHtml += `<br>${addr.city || ''} ${addr.zip || ''}`;
            }

            addressHtml += `<br>Phone: ${addr.phone || order.phone || order.customer?.phone || 'N/A'}`;
            addrContainer.innerHTML = addressHtml;
        }

        const isPhysical = order.items.some(i => ['HARDCOVER', 'PAPERBACK'].includes(i.type));

        // Timeline
        const trackingContainer = document.getElementById('modal-order-tracking-container');
        if (trackingContainer) {
            trackingContainer.style.display = isPhysical ? 'block' : 'none';
        }

        const timeline = document.getElementById('modal-order-timeline');
        if (timeline && isPhysical) {
            const stepsList = ['Pending', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
            const currentIdx = stepsList.indexOf(order.status);
            timeline.innerHTML = stepsList.map((s, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                const hist = order.timeline ? order.timeline.find(t => t.status === s) : null;
                
                // Format the timestamp carefully to avoid Invalid Date
                let formattedTime = isCompleted ? 'Completed' : 'Upcoming';
                if (hist && hist.timestamp) {
                    const d = new Date(hist.timestamp);
                    if (!isNaN(d.getTime())) {
                        formattedTime = d.toLocaleString();
                    }
                }

                return `
                    <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        <div class="step-dot"></div>
                        <h5>${s}</h5>
                        <p style="font-size:0.7rem; opacity:0.6;">${formattedTime}</p>
                    </div>
                `;
            }).join('');
        }

        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        }, 10);

        // Add Create/Sync Shipment buttons if physical
        const canShip = isPhysical && !['Shipped', 'Delivered', 'Cancelled'].includes(order.status) && !order.awbNumber && order.fulfillmentProvider !== 'LULU';

        const actionsContainer = document.querySelector('.detail-right');
        if (actionsContainer) {
            // Remove existing shipment btns if any
            const existingBtn = document.getElementById('btn-create-shipment');
            if (existingBtn) existingBtn.remove();
            const existingSyncBtn = document.getElementById('btn-sync-shipment');
            if (existingSyncBtn) existingSyncBtn.remove();
            const existingFulfillmentPanel = document.getElementById('modal-fulfillment-panel');
            if (existingFulfillmentPanel) existingFulfillmentPanel.remove();

            // Render Fulfillment Panel dynamically
            if (isPhysical) {
                const fulfillmentPanel = document.createElement('div');
                fulfillmentPanel.id = 'modal-fulfillment-panel';
                fulfillmentPanel.className = 'glass-panel';
                fulfillmentPanel.style.padding = '15px';
                fulfillmentPanel.style.background = 'rgba(0,0,0,0.2)';
                fulfillmentPanel.style.marginBottom = '15px';
                
                let trackingUrlHtml = 'N/A';
                if (order.trackingLink || (order.luluWebhookData && order.luluWebhookData.tracking && order.luluWebhookData.tracking.tracking_urls && order.luluWebhookData.tracking.tracking_urls[0])) {
                    const url = order.trackingLink || order.luluWebhookData.tracking.tracking_urls[0];
                    trackingUrlHtml = `<a href="${url}" target="_blank" style="color: var(--gold-text); text-decoration: underline; word-break: break-all;">Track Link</a>`;
                }

                if (order.fulfillmentProvider === 'LULU') {
                    fulfillmentPanel.innerHTML = `
                        <h4 style="margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; color: var(--gold-text);">Lulu Fulfillment</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; line-height: 1.4;">
                            <div><strong>Print Job ID:</strong> ${order.luluJobId || 'N/A'}</div>
                            <div><strong>Shipping Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: var(--gold-text);">${order.luluStatus || 'CREATED'}</span></div>
                            <div><strong>Carrier:</strong> ${order.courierName || 'Lulu Carrier'}</div>
                            <div><strong>Tracking Number:</strong> ${order.luluTracking || 'N/A'}</div>
                            <div><strong>Tracking URL:</strong> ${trackingUrlHtml}</div>
                            <div><strong>Last Synced:</strong> ${order.luluLastSync ? new Date(order.luluLastSync).toLocaleString() : 'N/A'}</div>
                        </div>
                    `;
                } else if (order.fulfillmentProvider === 'NIMBUS') {
                    fulfillmentPanel.innerHTML = `
                        <h4 style="margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; color: #3498db;">Nimbus Shipment</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; line-height: 1.4;">
                            <div><strong>Shipment ID:</strong> ${order.shipmentId || 'N/A'}</div>
                            <div><strong>AWB Number:</strong> ${order.awbNumber || 'N/A'}</div>
                            <div><strong>Courier:</strong> ${order.courierName || 'N/A'}</div>
                            <div><strong>Status:</strong> ${order.status || 'N/A'}</div>
                            <div><strong>Tracking URL:</strong> ${order.trackingLink ? `<a href="${order.trackingLink}" target="_blank" style="color: #3498db; text-decoration: underline; word-break: break-all;">Track Link</a>` : 'N/A'}</div>
                        </div>
                    `;
                } else {
                    fulfillmentPanel.innerHTML = `
                        <h4 style="margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; color: #fff;">Fulfillment</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; line-height: 1.4;">
                            <div><strong>Provider:</strong> Local Delivery (ADMIN)</div>
                            <div><strong>Status:</strong> ${order.status || 'N/A'}</div>
                        </div>
                    `;
                }
                
                actionsContainer.insertBefore(fulfillmentPanel, actionsContainer.firstChild);
            }

            if (canShip) {
                const shipBtn = document.createElement('button');
                shipBtn.id = 'btn-create-shipment';
                shipBtn.className = 'btn btn-gold full-width';
                shipBtn.style.marginTop = '15px';
                shipBtn.innerHTML = '<i class="fas fa-shipping-fast"></i> CREATE NIMBUS SHIPMENT';
                shipBtn.onclick = () => window.createNimbusShipment(order._id);
                actionsContainer.appendChild(shipBtn);
            } else if ((order.awbNumber || order.luluJobId) && !['Delivered', 'Cancelled', 'Returned', 'Failed'].includes(order.status)) {
                const syncBtn = document.createElement('button');
                syncBtn.id = 'btn-sync-shipment';
                syncBtn.className = 'btn btn-outline full-width';
                syncBtn.style.marginTop = '15px';
                syncBtn.style.color = 'var(--gold-text)';
                syncBtn.style.borderColor = 'var(--gold-text)';
                if (order.fulfillmentProvider === 'LULU') {
                    syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> SYNC LULU TRACKING';
                } else {
                    syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> SYNC NIMBUS STATUS';
                }
                syncBtn.onclick = () => window.syncAdminOrderNimbusStatus(order._id);
                actionsContainer.appendChild(syncBtn);
            }
        }

    } catch (e) {
        console.error("Error loading order:", e);
        showToast("Error loading order details", "error");
    }
};

window.createNimbusShipment = async function (orderId) {
    if (!confirm("Are you sure you want to create a NimbusPost shipment for this order?")) return;

    const btn = document.getElementById(`ship-btn-${orderId}`) || document.getElementById('btn-create-shipment');
    const originalText = btn ? btn.innerHTML : 'Ship';

    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        btn.disabled = true;
    }

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId })
        });

        const result = await res.json();
        if (res.ok) {
            showToast("✅ Shipment created successfully!", "success");
            if (typeof window.viewAdminOrderDetail === 'function') window.viewAdminOrderDetail(orderId);
            if (document.getElementById('admin-orders').classList.contains('active')) window.loadAdminOrdersFull();
            if (document.getElementById('admin-shipments').classList.contains('active')) window.loadAdminShipments();
        } else {
            alert(result.message || "Failed to create shipment");
        }
    } catch (e) {
        console.error(e);
        alert("Error creating shipment: " + e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};

window.syncAdminOrderNimbusStatus = async function (orderId) {
    const btn = document.getElementById('btn-sync-shipment');
    const originalText = btn ? btn.innerHTML : 'Sync Status';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Syncing...';
        btn.disabled = true;
    }
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/track-by-order/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            showToast(`✅ Status synced: ${result.data?.status || 'Updated'}`, 'success');
            if (typeof window.viewAdminOrderDetail === 'function') window.viewAdminOrderDetail(orderId);
            if (document.getElementById('admin-orders').classList.contains('active')) window.loadAdminOrdersFull();
            if (document.getElementById('admin-shipments').classList.contains('active')) window.loadAdminShipments();
        } else {
            showToast(result.message || 'Sync failed', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Sync failed. Please try later.', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};


window.syncShipment = async function (id, btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
    btn.disabled = true;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/sync/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            showToast('✅ Status Synced!', 'success');
            if (typeof window.loadAdminOrdersFull === 'function') window.loadAdminOrdersFull();
            if (typeof window.loadAdminShipments === 'function') window.loadAdminShipments();
        } else {
            showToast(result.message || 'Sync failed', 'error');
        }
    } catch (e) {
        console.error(e);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.viewOrderDetail = window.viewAdminOrderDetail;

window.closeOrderDetailModal = () => {
    const modal = document.getElementById('order-detail-modal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 400);
};

window.viewCustomerDetail = (userId) => {
    if (!window.allAdminUsers) return;
    const u = window.allAdminUsers.find(user => (user._id || user.id) === userId);
    if (!u) return;

    const userOrders = (window.allAdminOrders || []).filter(o => o.customer && o.customer.email && o.customer.email.toLowerCase() === u.email.toLowerCase());
    const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    document.getElementById('cust-modal-name').textContent = u.name;
    document.getElementById('cust-modal-email').textContent = u.email;
    document.getElementById('cust-modal-avatar').src = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=D4AF37&color=fff`;
    document.getElementById('cust-modal-total-orders').textContent = userOrders.length;
    document.getElementById('cust-modal-total-spent').textContent = `₹${totalSpent.toLocaleString()}`;

    // Addresses
    const addrList = document.getElementById('cust-modal-addresses');
    addrList.innerHTML = u.savedAddresses && u.savedAddresses.length > 0
        ? u.savedAddresses.map(a => `
            <div class="glass-panel" style="padding: 10px; font-size: 0.85rem; border-color: ${a.isDefault ? 'var(--gold-text)' : 'rgba(255,255,255,0.1)'}; margin-bottom: 8px;">
                <strong>${a.fullName} ${a.isDefault ? '<span class="gold-text">(Default)</span>' : ''}</strong><br>
                <i class="fas fa-phone" style="font-size: 0.7rem; opacity: 0.5;"></i> ${a.phone}<br>
                <i class="fas fa-map-marker-alt" style="font-size: 0.7rem; opacity: 0.5;"></i> ${a.fullAddress || `${a.house}, ${a.area}, ${a.city}, ${a.state} - ${a.pincode}`}
            </div>
        `).join('')
        : '<p style="opacity: 0.5; font-size: 0.85rem;">No saved addresses.</p>';

    // Order History
    const orderHistory = document.getElementById('cust-modal-order-history');
    orderHistory.innerHTML = userOrders.length > 0
        ? userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(o => `
            <div class="glass-panel" style="padding: 10px; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <div style="font-weight: 700;">#${(o._id || o.id).slice(-6).toUpperCase()}</div>
                    <div style="opacity: 0.6; font-size: 0.75rem;">${new Date(o.createdAt).toLocaleDateString()}</div>
                </div>
                <div style="text-align: right;">
                    <div class="gold-text" style="font-weight: 800;">${getOrderCurrSym(o)}${o.totalAmount}</div>
                    <div class="status-badge ${o.paymentStatus === 'Paid' ? 'resolved' : 'cancelled'}" style="font-size: 0.6rem; padding: 2px 6px;">${o.paymentStatus}</div>
                </div>
            </div>
        `).join('')
        : '<p style="opacity: 0.5; font-size: 0.85rem;">No orders yet.</p>';

    const modal = document.getElementById('customer-detail-modal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }, 10);
};

window.closeCustomerDetailModal = () => {
    const modal = document.getElementById('customer-detail-modal');
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    setTimeout(() => modal.style.display = 'none', 400);
};

// Address Management
window.openAddressModal = function (id = null) {
    const modal = document.getElementById('address-modal');
    const form = document.getElementById('address-form');
    const title = document.getElementById('address-modal-title');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('address-id').value = id || '';

    if (id) {
        title.textContent = 'Edit Address';
        const addr = window.currentUserProfile.savedAddresses.find(a => a._id === id);
        if (addr) {
            document.getElementById('addr-name').value = addr.fullName || '';
            document.getElementById('addr-phone').value = addr.phone || '';
            document.getElementById('addr-pincode').value = addr.pincode || '';
            document.getElementById('addr-state').value = addr.state || '';
            document.getElementById('addr-city').value = addr.city || '';
            document.getElementById('addr-full').value = addr.fullAddress || '';
            document.getElementById('addr-landmark').value = addr.landmark || '';
            document.getElementById('addr-default').checked = !!addr.isDefault;
        }
    } else {
        title.textContent = 'Add New Address';
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
};

window.closeAddressModal = () => {
    const modal = document.getElementById('address-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

if (document.getElementById('address-form')) {
    document.getElementById('address-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const id = document.getElementById('address-id').value;
        const data = {
            fullName: document.getElementById('addr-name').value,
            phone: document.getElementById('addr-phone').value,
            pincode: document.getElementById('addr-pincode').value,
            state: document.getElementById('addr-state').value,
            city: document.getElementById('addr-city').value,
            fullAddress: document.getElementById('addr-full').value,
            landmark: document.getElementById('addr-landmark').value,
            isDefault: document.getElementById('addr-default').checked,
            label: 'Saved' // Or add another field
        };

        const url = id ? `${API_BASE}/api/users/address/${id}` : `${API_BASE}/api/users/address`;
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        closeAddressModal();
        fetchProfileData();
    });
}

window.deleteAddress = async function (id) {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem('authToken');
    await fetch(`${API_BASE}/api/users/address/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchProfileData();
}

function renderActiveShipments() {
    const token = localStorage.getItem('authToken');
    const container = document.getElementById('active-shipment-widget');
    if (!container) return;

    fetch(`${API_BASE}/api/orders/my-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(orders => {
            const active = orders.filter(o => ['Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.status));
            if (active.length === 0) {
                container.innerHTML = '<p class="fade-text">No active shipments to track.</p>';
            } else {
                container.innerHTML = active.slice(0, 1).map(o => `
                    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <span style="font-weight:700; color:var(--gold-text);">${o.orderId}</span>
                            <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
                        </div>
                        <div class="shipment-mini-track" style="display:flex; gap:5px; margin-bottom:10px;">
                            <div style="flex:1; height:4px; border-radius:10px; background:var(--gold-text);"></div>
                            <div style="flex:1; height:4px; border-radius:10px; background:rgba(255,255,255,0.1);"></div>
                            <div style="flex:1; height:4px; border-radius:10px; background:rgba(255,255,255,0.1);"></div>
                        </div>
                        <p style="margin:0; font-size:0.8rem; opacity:0.6;">Current: ${o.status}</p>
                    </div>
                `).join('');
            }
        }).catch(e => console.error(e));
}

function renderNewestAddition() {
    const libKey = getUserKey('efv_digital_library');
    const library = JSON.parse(localStorage.getItem(libKey)) || [];
    const container = document.getElementById('newest-addition-content');
    if (!container) return;

    if (library.length === 0) {
        container.innerHTML = '<p class="fade-text">Empty library.</p>';
        return;
    }

    const newest = library[library.length - 1];
    container.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center;">
            <img src="${newest.thumbnail}" style="width:50px; height:70px; object-fit:cover; border-radius:4px; box-shadow:0 4px 10px rgba(0,0,0,0.3);">
            <div style="flex:1;">
                <h4 style="margin:0; font-size:1rem;">${newest.name || newest.title}</h4>
                <p style="margin:2px 0; font-size:0.8rem; opacity:0.5;">${newest.type}</p>
                <button class="btn btn-gold small" style="margin-top:5px; height:30px;" onclick="accessContent('${newest.type}', '${(newest.name || newest.title).replace(/'/g, "\\'")}', '${newest.productId || newest.id}')">Access</button>
            </div>
        </div>
    `;
}

// Security Settings logic
if (document.getElementById('security-settings-form')) {
    // This is optional if user added it in HTML. Let's add it to Account Settings tab.
}

// Profile Save
if (document.getElementById('profile-form-v2')) {
    document.getElementById('profile-form-v2').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const data = {
            name: document.getElementById('settings-name-v2').value,
            phone: document.getElementById('settings-phone-v2').value
        };
        const res = await fetch(`${API_BASE}/api/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            showToast("Profile updated successfully", "success");
            fetchProfileData();
        } else {
            showToast("Update failed", "error");
        }
    });
}

// --- ACTIVITY CENTER HELPERS (NEW) ---
window.loadRecommendations = async function () {
    const container = document.getElementById('recommended-grid');
    if (!container) return;
    try {
        const res = await fetch(`${API_BASE}/api/products`);
        const products = await res.json();
        const recommended = products.slice(0, 6); // Mock logic
        container.innerHTML = recommended.map(p => renderMiniProductCard(p)).join('');
    } catch (e) { }
};

window.loadRecentlyViewed = function () {
    const container = document.getElementById('recently-viewed-grid');
    if (!container) return;
    const viewed = JSON.parse(localStorage.getItem('recently_viewed')) || [];
    if (viewed.length === 0) {
        container.innerHTML = '<p class="fade-text" style="padding: 20px;">No recently viewed items.</p>';
        return;
    }
    container.innerHTML = viewed.map(p => renderMiniProductCard(p)).join('');
};

function renderMiniProductCard(p) {
    return `
        <div class="mini-product-card glass-panel" onclick="location.href='marketplace.html?id=${p._id || p.id}'">
            <img src="${p.thumbnail}" alt="${p.title}">
            <div class="mini-card-info">
                <h4>${p.title}</h4>
                <p class="gold-text">₹${p.price}</p>
            </div>
        </div>
    `;
}

// --- TOAST SYSTEM (NEW) ---
window.showToast = function (message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'toast-container';
        document.body.appendChild(div);
    }

    const toast = document.createElement('div');
    toast.className = `efv-toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    const containerEl = document.getElementById('toast-container');
    if (containerEl) containerEl.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- CART REDESIGN RENDERING (NEW) ---
window.renderCartTab = function () {
    const cartKey = getUserKey('efv_cart');
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const list = document.getElementById('dashboard-cart-list');
    const emptyState = document.getElementById('cart-empty-state');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-grand-total');
    const countText = document.getElementById('cart-item-count-text');

    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = '';
        emptyState.classList.remove('hidden');
        if (countText) countText.textContent = '0 items in your cart';
        return;
    }

    emptyState.classList.add('hidden');
    if (countText) countText.textContent = `${cart.length} items in your cart`;

    let subtotal = 0;
    list.innerHTML = cart.map(item => {
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity) || 1;
        subtotal += (price * qty);

        return `
            <div class="glass-panel" style="padding: 15px; display: flex; gap: 20px; align-items: center;">
                <img src="${item.thumbnail}" style="width: 70px; height: 100px; object-fit: cover; border-radius: 8px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0;">${item.name || item.title}</h4>
                    <p style="margin: 5px 0; opacity: 0.6; font-size: 0.85rem;">Format: ${item.type}</p>
                    <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px;">
                        <div class="qty-selector">
                            <button onclick="updateCartQty('${item.id}', -1)">-</button>
                            <span>${qty}</span>
                            <button onclick="updateCartQty('${item.id}', 1)">+</button>
                        </div>
                        <h4 style="margin: 0; color: var(--gold-text);">₹${(price * qty).toFixed(2)}</h4>
                    </div>
                </div>
                <button class="btn-icon" style="color: #ff4d4d;" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
    }).join('');

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${subtotal.toFixed(2)}`; // Simplified for now
};

window.updateCartQty = function (id, delta) {
    const cartKey = getUserKey('efv_cart');
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const idx = cart.findIndex(i => i.id === id);
    if (idx !== -1) {
        cart[idx].quantity = Math.max(1, (cart[idx].quantity || 1) + delta);
        localStorage.setItem(cartKey, JSON.stringify(cart));
        renderCartTab();
    }
};

window.removeFromCart = function (id) {
    const cartKey = getUserKey('efv_cart');
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    renderCartTab();
    showToast('Item removed from cart', 'info');
};

window.loadBillingHistory = function () {
    const container = document.getElementById('billing-history-list');
    if (!container) return;
    // Mock for now
    container.innerHTML = '<p class="fade-text">No invoices found. They appear after successful payments.</p>';
};

// --- WISHLIST LOGIC ---
window.renderWishlistTab = function () {
    const container = document.getElementById('wishlist-items-grid');
    if (!container) return;
    const wishlistKey = getUserKey('efv_wishlist');
    const wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    if (wishlist.length === 0) {
        container.innerHTML = '<p class="fade-text" style="grid-column: 1/-1; padding: 40px; text-align: center;">Your wishlist is empty.</p>';
        return;
    }
    container.innerHTML = wishlist.map(p => `
        <div class="glass-panel" style="padding: 15px; display: flex; gap: 15px; align-items: center;">
            <img src="${p.thumbnail}" style="width: 50px; height: 70px; border-radius: 4px; object-fit: cover;">
            <div style="flex:1;">
                <h4 style="margin:0;">${p.title}</h4>
                <p style="margin:2px 0; color:var(--gold-text); font-weight:700;">₹${p.price}</p>
            </div>
            <button class="btn btn-outline small" onclick="removeFromWishlist('${p.id}')">Remove</button>
        </div>
    `).join('');
};

window.removeFromWishlist = function (id) {
    const wishlistKey = getUserKey('efv_wishlist');
    let wishlist = JSON.parse(localStorage.getItem(wishlistKey)) || [];
    wishlist = wishlist.filter(i => i.id !== id);
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    renderWishlistTab();
    showToast('Removed from wishlist', 'info');
};

function getStatusClass(status) {
    if (!status) return 'status-pending';
    switch (status.toLowerCase()) {
        case 'delivered': return 'status-delivered';
        case 'shipped': return 'status-shipped';
        case 'processing': return 'status-processing';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

// --- PREMIUM MODAL EXTRAS ---

// File Input Listeners for Previews
window.updateFilePreview = function (input) {
    const id = input.id;
    const previewId = {
        'admin-file-cover': 'admin-current-cover',
        'admin-file-gallery': 'admin-current-gallery',
        'admin-file-ebook': 'admin-current-ebook',
        'admin-file-audio': 'admin-current-audio'
    }[id];
    const preview = document.getElementById(previewId);
    if (!preview) return;

    if (input.files && input.files.length > 0) {
        const count = input.files.length;
        const names = Array.from(input.files).map(f => f.name).join(', ');
        preview.innerHTML = `<i class="fas fa-check-circle success-icon" style="color:#D4AF37;"></i> ${count} selected: ${names}`;
    } else {
        preview.innerHTML = '';
    }
};

// Attach listeners
['admin-file-cover', 'admin-file-gallery', 'admin-file-ebook', 'admin-file-audio'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => window.updateFilePreview(el));
});

// Drag & Drop Feedback
document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    ['dragleave', 'drop'].forEach(evt => {
        zone.addEventListener(evt, () => zone.classList.remove('drag-over'));
    });
});

// --- COUPON MANAGEMENT ---
window.openCouponModal = function () {
    const modal = document.getElementById('admin-coupon-modal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        initModalParticles('coupon-particles-canvas', 'admin-coupon-modal');
    }
};

window.closeCouponModal = function () {
    const modal = document.getElementById('admin-coupon-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
};

window.deleteCoupon = async function (id) {
    if (!confirm('Permanently delete this coupon?')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/coupons/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showToast('Coupon deleted', 'info');
            if (typeof window.loadAdminCoupons === 'function') window.loadAdminCoupons();
        } else {
            const err = await res.json();
            alert('Failed to delete coupon: ' + (err.message || 'Unknown error'));
        }
    } catch (e) { console.error(e); }
};

const couponForm = document.getElementById('admin-coupon-form');
if (couponForm) {
    couponForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const data = {
            code: document.getElementById('coupon-code').value.toUpperCase(),
            type: document.getElementById('coupon-type').value,
            value: parseFloat(document.getElementById('coupon-value').value),
            minOrder: parseFloat(document.getElementById('coupon-min-order').value) || 0,
            usageLimit: parseInt(document.getElementById('coupon-limit').value) || 100,
            expiryDate: document.getElementById('coupon-expiry').value || null
        };

        try {
            const res = await fetch(`${API_BASE}/api/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                showToast('Coupon created!', 'success');
                closeCouponModal();
                loadAdminCoupons();
                couponForm.reset();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to create coupon');
            }
        } catch (e) { console.error(e); }
    });
}

// Particle Background Animation (Refactored to be generic)
window.initModalParticles = function (canvasId = 'modal-particles-canvas', modalId = 'admin-product-modal') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    const resize = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.4;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) particles.push(new Particle());

    function animate() {
        const modal = document.getElementById(modalId);
        if (!modal || !modal.classList.contains('active')) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();
};

// --- ADMIN RETURN MANAGEMENT ---
window.adminReturnsToggleState = 'returns';

window.setReturnsToggle = function(type) {
    window.adminReturnsToggleState = type;
    
    const btnReturns = document.getElementById('toggle-btn-returns');
    const btnCancelled = document.getElementById('toggle-btn-cancelled');
    const filterSelect = document.getElementById('admin-return-status-filter');

    if (type === 'returns') {
        if(btnReturns) {
            btnReturns.style.background = 'var(--gold-energy)';
            btnReturns.style.color = 'var(--cosmic-black)';
            btnReturns.style.fontWeight = '700';
        }
        if(btnCancelled) {
            btnCancelled.style.background = 'transparent';
            btnCancelled.style.color = 'rgba(240, 244, 248, 0.7)';
            btnCancelled.style.fontWeight = '600';
        }
        if(filterSelect) {
            filterSelect.style.display = 'block';
            filterSelect.innerHTML = `
                <option value="all" style="background: #0b132b; color: #fff;">All Returns</option>
                <option value="Pending" style="background: #0b132b; color: #fff;">Pending</option>
                <option value="Approved" style="background: #0b132b; color: #fff;">Approved</option>
                <option value="Rejected" style="background: #0b132b; color: #fff;">Rejected</option>
                <option value="Picked Up" style="background: #0b132b; color: #fff;">Picked Up</option>
                <option value="Returned" style="background: #0b132b; color: #fff;">Returned</option>
            `;
        }
    } else {
        if(btnCancelled) {
            btnCancelled.style.background = 'var(--gold-energy)';
            btnCancelled.style.color = 'var(--cosmic-black)';
            btnCancelled.style.fontWeight = '700';
        }
        if(btnReturns) {
            btnReturns.style.background = 'transparent';
            btnReturns.style.color = 'rgba(240, 244, 248, 0.7)';
            btnReturns.style.fontWeight = '600';
        }
        if(filterSelect) {
            filterSelect.style.display = 'block';
            filterSelect.innerHTML = `
                <option value="all" style="background: #0b132b; color: #fff;">All Cancelled</option>
            `;
        }
    }
    
    loadAdminReturns();
};

window.loadAdminReturns = async function () {
    const list = document.getElementById('admin-returns-list');
    const filterSelect = document.getElementById('admin-return-status-filter');
    const filter = filterSelect ? filterSelect.value : 'all';
    const token = localStorage.getItem('authToken');

    if (!list) return;

    try {
        let displayRequests = [];
        const viewMode = window.adminReturnsToggleState || 'returns';

        if (viewMode === 'returns') {
            const res = await fetch(`${API_BASE}/api/returns/admin/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let requests = await res.json();

            if (filter !== 'all') {
                requests = requests.filter(r => r.status === filter);
            }
            displayRequests = requests.map(req => ({
                id: req._id,
                orderId: req.orderId,
                userId: req.userId,
                createdAt: req.createdAt,
                reason: req.reason,
                imageProof: req.imageProof,
                status: req.status,
                isOrder: false
            }));
        } else {
            const resOrders = await fetch(`${API_BASE}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resOrders.ok) {
                let orders = await resOrders.json();
                let cancelledOrders = orders.filter(o => o.status === 'Cancelled').map(o => ({
                    id: o._id,
                    orderId: o.orderId || o._id,
                    userId: o.user ? (o.user.name || o.user._id) : o.userId || 'N/A',
                    createdAt: o.createdAt,
                    reason: 'Order Cancelled Before Fulfillment',
                    imageProof: null,
                    status: 'Cancelled',
                    isOrder: true
                }));
                displayRequests = cancelledOrders;
            }
        }

        if (displayRequests.length === 0) {
            list.innerHTML = `<tr><td colspan="6" style="padding: 50px; text-align: center; opacity: 0.5;">No ${viewMode === 'returns' ? 'return' : 'cancelled'} requests found.</td></tr>`;
            return;
        }

        list.innerHTML = displayRequests.map(req => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                <td style="padding: 15px; font-weight: 600; color: var(--gold-text);">#${req.orderId}</td>
                <td style="padding: 15px;">
                    <div style="font-size: 0.85rem;">UserId: ${req.userId}</div>
                    <div style="font-size: 0.72rem; opacity: 0.5;">${new Date(req.createdAt).toLocaleDateString()}</div>
                </td>
                <td style="padding: 15px; font-size: 0.85rem;">${req.reason}</td>
                <td style="padding: 15px;">
                    ${req.imageProof ? `
                        <a href="${API_BASE}/${req.imageProof}" target="_blank" style="color: var(--gold-text); font-size: 0.8rem;">
                            <i class="fas fa-image"></i> View Proof
                        </a>
                    ` : '<span style="opacity: 0.3;">None</span>'}
                </td>
                <td style="padding: 15px;">
                    <span class="status-badge status-${req.status.toLowerCase().replace(/\s/g, '-')}" style="padding: 3px 12px; border-radius: 4px; font-size: 0.75rem;">
                        ${req.status}
                    </span>
                </td>
                <td style="padding: 15px;">
                    <div style="display: flex; gap: 8px;">
                        ${req.status === 'Pending' && !req.isOrder ? `
                            <button class="btn btn-gold small" onclick="updateReturnStatus('${req.id}', 'Approved')" style="padding: 5px 10px;">Approve</button>
                            <button class="btn btn-outline small" onclick="updateReturnStatus('${req.id}', 'Rejected')" style="padding: 5px 10px; border-color: #ff5252; color: #ff5252;">Reject</button>
                        ` : `
                            ${req.status === 'Approved' && !req.isOrder ? `
                                <button class="btn btn-gold small" onclick="triggerReversePickup('${req.id}')" style="padding: 5px 10px;">
                                    <i class="fas fa-truck-pickup"></i> Pickup
                                </button>
                            ` : (req.isOrder ? '<span style="opacity: 0.4; font-size:0.8rem;">Cancelled Order</span>' : '<span style="opacity: 0.4;">-</span>')}
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load Returns Error:', error);
        list.innerHTML = '<tr><td colspan="6" style="padding: 20px; color: #ff5252;">Error loading data</td></tr>';
    }
};

window.updateReturnStatus = async function (requestId, status) {
    const notes = prompt(`Enter optional notes for ${status}:`);
    if (notes === null) return;

    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${API_BASE}/api/returns/admin/update/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, adminNotes: notes })
        });

        if (res.ok) {
            showToast(`Return request ${status.toLowerCase()}!`, "success");
            loadAdminReturns();
        } else {
            const data = await res.json();
            showToast(data.message || "Update failed", "error");
        }
    } catch (error) {
        console.error('Update Return Error:', error);
        showToast("Connection error", "error");
    }
};

window.triggerReversePickup = async function (requestId) {
    if (!confirm("Trigger reverse pickup via NimbusPost?")) return;

    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${API_BASE}/api/returns/admin/trigger-pickup/${requestId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        if (res.ok) {
            showToast("Pickup scheduled successfully!", "success");
            loadAdminReturns();
        } else {
            showToast(data.message || "Pickup trigger failed", "error");
        }
    } catch (error) {
        console.error('Pickup Trigger Error:', error);
        showToast("Connection error", "error");
    }
};

// --- ADMIN CANCEL ORDER ---
window.adminCancelOrder = async function (orderId) {
    if (!confirm(`Cancel order #${orderId}?\n\nThis will cancel the order in the system and attempt to cancel the NimbusPost shipment (if any).`)) return;

    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${API_BASE}/api/orders/cancel/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason: 'Admin cancelled' })
        });

        const data = await res.json();
        if (res.ok) {
            showToast(`Order #${orderId} cancelled successfully`, "success");
            loadAdminOrdersFull();
        } else {
            showToast(data.message || "Cancel failed", "error");
        }
    } catch (error) {
        console.error('Admin Cancel Error:', error);
        showToast("Connection error", "error");
    }
};

window.loadRagFiles = async function () {
    const tbody = document.getElementById('admin-rag-table-body');
    if (!tbody) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/rag/files`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch RAG files');
        const files = await res.json();

        if (files.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 50px; opacity: 0.5;">No documents in Knowledge Base. Upload a PDF to start training.</td></tr>';
            return;
        }

        tbody.innerHTML = files.map(file => {
            let statusHtml = '';
            if (file.source === 'synced') statusHtml = '<span style="background: rgba(39, 174, 96, 0.1); color: #2ecc71; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;"><i class="fas fa-check-circle"></i> Synced</span>';
            else if (file.source === 'cloud') statusHtml = '<span style="background: rgba(52, 152, 219, 0.1); color: #3498db; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;"><i class="fas fa-cloud"></i> Live Only</span>';
            else statusHtml = '<span style="background: rgba(230, 126, 34, 0.1); color: #e67e22; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem;"><i class="fas fa-laptop"></i> Local Only</span>';

            return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; color: white; font-weight: 500;">
                    <i class="fas fa-file-pdf" style="color: #ff4d4d; margin-right: 8px;"></i> ${file.name}
                </td>
                <td style="padding: 12px; opacity: 0.7;">${statusHtml}</td>
                <td style="padding: 12px; opacity: 0.7;">${file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : (file.size / 1024).toFixed(2) + ' KB'}</td>
                <td style="padding: 12px; opacity: 0.7;">${new Date(file.updated).toLocaleDateString()}</td>
                <td style="padding: 12px; text-align: right;">
                    <button class="btn btn-danger small outline" onclick="window.deleteRagFile('${file.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 50px; color: #ff4d4d;">Error loading files. Check backend connection.</td></tr>';
    }
};

window.handleRagUpload = async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Uploading document...', 'info');
    const formData = new FormData();
    formData.append('document', file);

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/rag/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            showToast('Knowledge added!', 'success');
            window.loadRagFiles();
        } else {
            const err = await res.json();
            alert('Upload failed: ' + (err.error || 'Unknown error'));
        }
    } catch (e) {
        console.error(e);
        alert('Upload Error');
    } finally {
        event.target.value = ''; // Reset input
    }
};

window.deleteRagFile = async function (name) {
    if (!confirm(`Remove "${name}" from Knowledge Base? AI will no longer use this for answers.`)) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/rag/files/${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            showToast('Document removed', 'info');
            window.loadRagFiles();
        } else {
            alert('Delete failed');
        }
    } catch (e) {
        console.error(e);
        alert('Delete Error');
    }
};


// --- LIBRARY SYNCHRONIZATION (Professional implementation with feedback) ---
window.syncLibraryWithBackend = async function () {
    const user = JSON.parse(localStorage.getItem('efv_user') || '{}');
    const userEmail = user.email || 'Admin';
    const token = localStorage.getItem('authToken');
    
    // Safety check for user session
    if (!token) return;

    // UI Feedback: Start Sync
    if (typeof showToast === 'function') {
        showToast('🔄 Synchronizing your library...', 'info');
    }

    try {
        const response = await fetch(`${API_BASE}/api/library/my-library`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
            console.log(`📊 [syncLibraryWithBackend] Received ${data.length} items from server truth.`);
            const libKey = getUserKey('efv_digital_library');

            // --- PROTECTIVE LOCAL STORAGE SYNC ---
            const localLibrary = data.map(prod => ({
                id: (prod.productId || prod.id || '').toString(),        
                productId: (prod.productId || prod.id || '').toString(), 
                name: prod.title || prod.name,
                title: prod.title || prod.name,
                type: prod.type,
                thumbnail: prod.thumbnail,
                filePath: prod.filePath,
                language: prod.language || '',
                subtitle: prod.subtitle || '',
                date: prod.purchasedAt ? new Date(prod.purchasedAt).toLocaleDateString() : new Date().toLocaleDateString()
            }));
            
            // Atomically update localStorage (no remove needed, setItem overwrites current value)
            localStorage.setItem(libKey, JSON.stringify(localLibrary));
            console.log(`📂 [syncLibraryWithBackend] LocalStorage (${libKey}) updated. Count: ${localLibrary.length}`);
            console.log("📄 [syncLibraryWithBackend] Raw Data for inspection:", localLibrary);

            // UI Feedback: Success
            if (typeof showToast === 'function') {
                showToast('✅ Library Synced! Latest versions are now available.', 'success');
            }

            // --- INTELLIGENT UI REFRESH ---
            // Detect which library sub-tab is currently active
            const activeTab = document.querySelector('.library-sub-tab.active');
            const activeMode = activeTab ? activeTab.getAttribute('data-library-tab') : 'all';
            
            console.log(`🔄 [syncLibraryWithBackend] Refreshing active view mode: ${activeMode}`);

            if (activeMode === 'audiobooks') {
                 if (typeof renderAudiobooksGrid === 'function') await renderAudiobooksGrid();
            } else if (activeMode === 'ebooks') {
                 if (typeof renderLibraryTab === 'function') renderLibraryTab(localLibrary, 'ebook');
            } else {
                 if (typeof renderLibraryTab === 'function') renderLibraryTab(localLibrary);
            }

            if (typeof updateStats === 'function') updateStats();
        } else {
            console.warn('❌ [syncLibraryWithBackend] Failed:', (data && data.message) || 'Status: ' + response.status);
            if (typeof showToast === 'function') {
                showToast('Failed to sync library: ' + ((data && data.message) || 'Server error'), 'error');
            }
        }
    } catch (error) { 
        console.error('❌ [syncLibraryWithBackend] Error:', error); 
        if (typeof showToast === 'function') {
            showToast('Unable to connect to server for library sync.', 'error');
        }
    }
}

// --- NOTIFY USERS MANAGEMENT ---
window.loadNotifyRequests = async function() {
    console.log("🔔 Loading Notify Requests...");
    const tbody = document.getElementById('admin-notify-table-body');
    if (!tbody) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/notifications/requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await res.json();

        if (!res.ok) throw new Error(requests.message || 'Failed to fetch');

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; opacity: 0.5;">No notification requests found.</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(req => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 15px;">${req.email}</td>
                <td style="padding: 15px; font-weight: 600;">${req.bookTitle}</td>
                <td style="padding: 15px; opacity: 0.7;">${new Date(req.createdAt).toLocaleString()}</td>
                <td style="padding: 15px;">
                    <span class="status-badge ${req.status.toLowerCase()}" style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; background: ${req.status === 'Pending' ? 'rgba(255, 211, 105, 0.1)' : 'rgba(46, 204, 113, 0.1)'}; color: ${req.status === 'Pending' ? 'var(--gold-energy)' : '#2ecc71'};">
                        ${req.status}
                    </span>
                </td>
                <td style="padding: 15px;">
                    ${req.status === 'Pending' ? `
                        <button class="btn btn-gold small" onclick="triggerManualRelease('${req.bookTitle}')" style="padding: 5px 12px; font-size: 0.7rem;">
                            NOTIFY MANUAL
                        </button>
                    ` : '<span style="opacity: 0.5;">Notified ✓</span>'}
                </td>
            </tr>
        `).join('');

    } catch (e) {
        console.error("Load Notify Requests Error:", e);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #ff4d4d;">Error: ${e.message}</td></tr>`;
    }
};

window.triggerManualRelease = async function(bookTitle) {
    if (!confirm(`Are you sure you want to notify ALL users who requested "${bookTitle}"? This will send emails & in-app notifications.`)) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/notifications/trigger-release`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ bookTitle })
        });
        const data = await res.json();

        if (res.ok) {
            showToast(data.message, 'success');
            loadNotifyRequests();
        } else {
            alert(data.message || 'Failed to trigger.');
        }
    } catch (e) {
        console.error("Trigger Release error:", e);
        alert("Server error.");
    }
};

// --- DYNAMIC CATEGORY MANAGEMENT MODULE ---
const categoryForm = document.getElementById('admin-category-form');
if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('admin-cat-save-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const token = localStorage.getItem('authToken');
            const catId = document.getElementById('admin-cat-id').value;
            const isEdit = !!catId;

            const name = document.getElementById('admin-cat-name').value;
            const slug = document.getElementById('admin-cat-slug').value;
            const isDigital = document.getElementById('admin-cat-is-digital').checked;
            const isActive = document.getElementById('admin-cat-is-active').checked;
            
            const discountType = document.getElementById('admin-cat-discount-type').value;
            const discountValue = document.getElementById('admin-cat-discount-value').value;
            const minQuantity = document.getElementById('admin-cat-min-quantity').value;
            const bogoBuySlug = document.getElementById('admin-cat-bogo-buy').value;
            const bogoGetSlug = document.getElementById('admin-cat-bogo-get').value;

            const assignedProducts = [];
            document.querySelectorAll('.admin-assigned-book-checkbox:checked').forEach(cb => {
                assignedProducts.push(cb.value);
            });

            const url = isEdit ? `${API_BASE}/api/categories/${catId}` : `${API_BASE}/api/categories/create`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name, 
                    slug, 
                    isDigital, 
                    isActive,
                    discountType,
                    discountValue,
                    minQuantity,
                    bogoBuySlug,
                    bogoGetSlug,
                    assignedProducts
                })
            });

            const result = await res.json();
            if (res.ok) {
                window.closeCategoryModal();
                await window.loadAdminCategories();
                showToast(isEdit ? 'Discount rule updated' : 'Discount rule created', 'success');
            } else {
                showToast(result.message || 'Failed to save discount rule', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error saving discount rule', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

window.toggleDiscountFields = function() {
    const discountType = document.getElementById('admin-cat-discount-type')?.value || 'simple';
    const valGroup = document.getElementById('group-discount-value');
    const qtyGroup = document.getElementById('group-min-quantity');
    const buyGroup = document.getElementById('group-bogo-buy');
    const getGroup = document.getElementById('group-bogo-get');
    
    if (valGroup) valGroup.style.display = (discountType === 'simple' || discountType === 'bundle') ? 'block' : 'none';
    if (qtyGroup) qtyGroup.style.display = (discountType === 'bundle') ? 'block' : 'none';
    if (buyGroup) buyGroup.style.display = (discountType === 'bogo') ? 'block' : 'none';
    if (getGroup) getGroup.style.display = (discountType === 'bogo') ? 'block' : 'none';
};

// --- HOMEPAGE SLIDER BOOKS MANAGEMENT LOGIC ---
let allHomepageBooks = [];

function resolveBookCover(path) {
    if (!path) return (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'assets/images/placeholder.png';
    if (path.startsWith('http')) return path;
    if (path.startsWith('uploads/')) return `${API_BASE}/${path}`;
    if (path.startsWith('/uploads/')) return `${API_BASE}${path}`;
    return (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + path;
}

window.loadAdminHomepageBooks = async function () {
    const tbody = document.getElementById('admin-homepage-books-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center;">Loading homepage books...</td></tr>';
    try {
        const res = await fetch(`${API_BASE}/api/homepage-books`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        const rawItems = Array.isArray(data) ? data : (data && Array.isArray(data.books) ? data.books : []);

        // Populate header settings form if present
        const headerConfig = rawItems.find(b => b.isHeader || b._id === 'homepage-books-header-config');
        if (headerConfig) {
            const titleInput = document.getElementById('admin-homepage-header-title');
            const subInput = document.getElementById('admin-homepage-header-subtitle');
            const topicsInput = document.getElementById('admin-homepage-header-topics');
            if (titleInput && !titleInput.dataset.userEdited) titleInput.value = headerConfig.title || '';
            if (subInput && !subInput.dataset.userEdited) subInput.value = headerConfig.subtitle || headerConfig.description || '';
            if (topicsInput && !topicsInput.dataset.userEdited) {
                const topicVal = headerConfig.topics ? headerConfig.topics.join(', ') : (headerConfig.status || '');
                topicsInput.value = topicVal;
            }
        }

        // Filter out header config item for books table
        const books = rawItems.filter(b => !b.isHeader && b._id !== 'homepage-books-header-config');
        allHomepageBooks = books;
        tbody.innerHTML = books.length ? '' : '<tr><td colspan="5" style="padding:20px; text-align:center; opacity:0.5;">No homepage slider books found.</td></tr>';
        
        books.forEach(b => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            let coverUrl = resolveBookCover(b.thumbnail);

            const isPurchase = (b.status || '').toLowerCase().trim() === 'purchase_now' || (b.status || '').toLowerCase().trim() === 'purchase';
            const statusText = isPurchase ? 'Purchase Now' : 'Notify Me';
            const statusBadgeColor = isPurchase ? '#D4AF37' : '#3498db';

            tr.innerHTML = `
                <td style="padding: 12px;">
                    <img src="${coverUrl}" alt="${b.title}" style="width: 45px; height: 60px; object-fit: contain; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">
                </td>
                <td style="padding: 12px; font-weight: bold; color: white;">${b.title}</td>
                <td style="padding: 12px; opacity: 0.8; font-size: 0.85rem;">${b.description || ''}</td>
                <td style="padding: 12px;">
                    <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; background: ${statusBadgeColor}22; color: ${statusBadgeColor}; border: 1px solid ${statusBadgeColor}44;">
                        ${statusText}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline" onclick="window.openEditHomepageBookModal('${b._id || b.id}')" style="padding: 5px 10px; font-size: 0.75rem; border-color: rgba(255,255,255,0.2);">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="window.deleteHomepageBook('${b._id || b.id}')" style="padding: 5px 10px; font-size: 0.75rem; background: rgba(255,77,77,0.1); border-color: rgba(255,77,77,0.3); color: #ff6b6b;">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Load homepage books error:", e);
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center; color: #ff4d4d;">Failed to load homepage books.</td></tr>';
    }
};

window.saveHomepageBooksHeader = async function (event) {
    if (event) event.preventDefault();
    const title = document.getElementById('admin-homepage-header-title').value.trim();
    const subtitle = document.getElementById('admin-homepage-header-subtitle').value.trim();
    const topicsRaw = document.getElementById('admin-homepage-header-topics').value.trim();
    const topics = topicsRaw.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
        id: 'homepage-books-header-config',
        isHeader: true,
        title: title,
        description: subtitle,
        status: topics.join(', '),
        thumbnail: '',
        subtitle: subtitle,
        topics: topics
    };

    const saveBtn = document.getElementById('admin-homepage-header-save-btn');
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const rawAuthUser = localStorage.getItem('efv_auth_user');
        const parsedToken = rawAuthUser ? (JSON.parse(rawAuthUser).token || '') : '';
        const token = localStorage.getItem('authToken') || parsedToken || localStorage.getItem('efv_admin_token') || localStorage.getItem('efv_token') || '';
        const res = await fetch(`${API_BASE}/api/homepage-books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('Series section header & topics updated successfully', 'success');
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to update section header');
        }
    } catch (e) {
        console.error(e);
        alert('Error saving section header: ' + e.message);
    } finally {
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Section Header &amp; Topics';
    }
};

window.openAddHomepageBookModal = function () {
    const modal = document.getElementById('admin-homepage-book-modal');
    const form = document.getElementById('admin-homepage-book-form');
    const title = document.getElementById('admin-homepage-book-modal-title');
    const saveBtn = document.getElementById('admin-homepage-book-save-btn');

    if (!modal || !form) return;
    form.reset();

    document.getElementById('admin-homepage-book-id').value = '';
    document.getElementById('admin-homepage-book-cover-url').value = '';
    document.getElementById('admin-homepage-book-current-cover').innerHTML = '<span style="font-size: 0.75rem; opacity: 0.5;">No Cover</span>';

    if (title) title.textContent = 'ADD SLIDER BOOK';
    if (saveBtn) saveBtn.textContent = 'SAVE BOOK';

    modal.style.display = 'flex';
    modal.classList.add('active');
    initModalParticles('homepage-modal-particles-canvas', 'admin-homepage-book-modal');
};

window.openEditHomepageBookModal = function (id) {
    const modal = document.getElementById('admin-homepage-book-modal');
    const form = document.getElementById('admin-homepage-book-form');
    const title = document.getElementById('admin-homepage-book-modal-title');
    const saveBtn = document.getElementById('admin-homepage-book-save-btn');

    if (!modal || !form) return;
    form.reset();

    const book = allHomepageBooks.find(b => (b._id || b.id) === id);
    if (!book) return;

    document.getElementById('admin-homepage-book-id').value = id;
    document.getElementById('admin-homepage-book-title').value = book.title || '';
    document.getElementById('admin-homepage-book-desc').value = book.description || '';
    const currentStatus = (book.status || '').toLowerCase().trim();
    document.getElementById('admin-homepage-book-status').value = (currentStatus === 'purchase_now' || currentStatus === 'purchase now' || currentStatus === 'purchase') ? 'purchase_now' : 'notify_me';
    document.getElementById('admin-homepage-book-cover-url').value = book.thumbnail || '';

    const preview = document.getElementById('admin-homepage-book-current-cover');
    if (preview) {
        if (book.thumbnail) {
            const coverUrl = resolveBookCover(book.thumbnail);
            preview.innerHTML = `<img src="${coverUrl}" style="width: 100%; height: 100%; object-fit: contain;">`;
        } else {
            preview.innerHTML = '<span style="font-size: 0.75rem; opacity: 0.5;">No Cover</span>';
        }
    }

    if (title) title.textContent = 'EDIT SLIDER BOOK';
    if (saveBtn) saveBtn.textContent = 'UPDATE BOOK';

    modal.style.display = 'flex';
    modal.classList.add('active');
    initModalParticles('homepage-modal-particles-canvas', 'admin-homepage-book-modal');
};

window.closeHomepageBookModal = function () {
    const modal = document.getElementById('admin-homepage-book-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

window.uploadHomepageBookCover = async function (input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('cover', file);

    const preview = document.getElementById('admin-homepage-book-current-cover');
    if (preview) preview.innerHTML = '<i class="fas fa-spinner fa-spin" style="opacity:0.5;"></i>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.paths && data.paths.coverPath) {
            let coverUrl = data.paths.coverPath;
            if (coverUrl.startsWith('/src/uploads/')) {
                coverUrl = coverUrl.replace('/src/uploads/', '/uploads/');
            } else if (coverUrl.startsWith('src/uploads/')) {
                coverUrl = '/' + coverUrl.replace('src/uploads/', 'uploads/');
            }
            
            document.getElementById('admin-homepage-book-cover-url').value = coverUrl;
            if (preview) {
                preview.innerHTML = `<img src="${resolveBookCover(coverUrl)}" style="width:100%; height:100%; object-fit:contain;">`;
            }
            showToast('Cover uploaded successfully', 'success');
        } else {
            showToast(data.message || 'Upload failed', 'error');
            if (preview) preview.innerHTML = '<span style="font-size:0.75rem; opacity:0.5;">Upload Failed</span>';
        }
    } catch (e) {
        console.error(e);
        showToast('Image upload error', 'error');
        if (preview) preview.innerHTML = '<span style="font-size:0.75rem; opacity:0.5;">Upload Error</span>';
    }
};

window.saveHomepageBook = async function (event) {
    event.preventDefault();
    const id = document.getElementById('admin-homepage-book-id').value;
    const title = document.getElementById('admin-homepage-book-title').value;
    const description = document.getElementById('admin-homepage-book-desc').value;
    const status = document.getElementById('admin-homepage-book-status').value;
    const thumbnail = document.getElementById('admin-homepage-book-cover-url').value;

    const payload = { title, description, status, thumbnail };
    if (id) payload.id = id;

    try {
        const rawAuthUser = localStorage.getItem('efv_auth_user');
        const parsedToken = rawAuthUser ? (JSON.parse(rawAuthUser).token || '') : '';
        const token = localStorage.getItem('authToken') || parsedToken || localStorage.getItem('efv_admin_token') || localStorage.getItem('efv_token') || '';
        const res = await fetch(`${API_BASE}/api/homepage-books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast(id ? 'Slider book updated' : 'Slider book added', 'success');
            window.closeHomepageBookModal();
            window.loadAdminHomepageBooks();
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to save book');
        }
    } catch (e) {
        console.error(e);
        alert('Error saving homepage book');
    }
};

window.deleteHomepageBook = async function (id) {
    if (!confirm('Are you sure you want to delete this slider book?')) return;
    try {
        const rawAuthUser = localStorage.getItem('efv_auth_user');
        const parsedToken = rawAuthUser ? (JSON.parse(rawAuthUser).token || '') : '';
        const token = localStorage.getItem('authToken') || parsedToken || localStorage.getItem('efv_admin_token') || localStorage.getItem('efv_token') || '';
        const res = await fetch(`${API_BASE}/api/homepage-books/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showToast('Slider book deleted', 'info');
            window.loadAdminHomepageBooks();
        } else {
            alert('Failed to delete book');
        }
    } catch (e) {
        console.error(e);
    }
};

window.deleteAllHomepageBooks = async function () {
    if (!confirm('DANGER: Are you sure you want to delete ALL homepage slider books?')) return;
    try {
        const rawAuthUser = localStorage.getItem('efv_auth_user');
        const parsedToken = rawAuthUser ? (JSON.parse(rawAuthUser).token || '') : '';
        const token = localStorage.getItem('authToken') || parsedToken || localStorage.getItem('efv_admin_token') || localStorage.getItem('efv_token') || '';
        const res = await fetch(`${API_BASE}/api/homepage-books/delete/all-books`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showToast('All homepage books deleted', 'info');
            window.loadAdminHomepageBooks();
        } else {
            alert('Failed to delete all books');
        }
    } catch (e) {
        console.error(e);
    }
};

// --- CATEGORY MANAGEMENT LOGIC ---
window.loadAdminCategories = async function () {
    const tbody = document.getElementById('admin-categories-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Loading discounts & offers...</td></tr>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await res.json();
        window.adminCategories = categories; // Keep updated cache
        tbody.innerHTML = categories.length ? '' : '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No discount rules created yet.</td></tr>';
        
        categories.forEach(c => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            // Format Offer Type
            let typeLabel = 'Simple Category';
            if (c.discountType === 'bundle') typeLabel = 'Volume Bundle';
            if (c.discountType === 'bogo') typeLabel = 'Cross-Language BOGO';
            const offerTypeStr = `<span class="status-badge" style="background: rgba(255, 211, 105, 0.1); color: var(--gold-energy); border: 1px solid rgba(255, 211, 105, 0.2);">${typeLabel}</span>`;

            // Format Rules/Value
            let rulesStr = 'Category Filter';
            if (c.discountType === 'simple' && c.discountValue) {
                rulesStr = `${c.discountValue}% OFF`;
            } else if (c.discountType === 'bundle') {
                rulesStr = `Buy ${c.minQuantity || 2}+ books get ${c.discountValue || 10}% OFF`;
            } else if (c.discountType === 'bogo') {
                rulesStr = `Buy ${c.bogoBuySlug || 'Hindi'} get ${c.bogoGetSlug || 'English'} Free`;
            }
            
            const statusStr = c.isActive !== false ? '<span class="status-badge" style="background: rgba(76, 209, 55, 0.2); color: #4cd137; border: 1px solid rgba(76, 209, 55, 0.3);">ACTIVE</span>' : '<span class="status-badge" style="background: rgba(255, 77, 77, 0.2); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.3);">INACTIVE</span>';
            
            tr.innerHTML = `
                <td style="padding: 15px; font-weight: bold; color: #fff;">${c.name}</td>
                <td style="padding: 15px; color: var(--gold-text); font-family: monospace;">${c.slug}</td>
                <td style="padding: 15px;">${offerTypeStr}</td>
                <td style="padding: 15px; color: #fff;">${rulesStr}</td>
                <td style="padding: 15px;">${statusStr}</td>
                <td style="padding: 15px; display: flex; gap: 10px;">
                    <button class="btn-icon" style="color: var(--gold-text);" onclick="window.openEditCategoryModal('${c._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" style="color: #ff4d4d;" onclick="window.deleteCategory('${c._id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Also refresh product dropdowns
        await window.populateCategoryDropdown();
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color:#ff6b6b;">Error loading discount list.</td></tr>';
    }
};

window.renderMarketingCategoryCheckboxes = function (selectedCategories = []) {
    const container = document.getElementById('additional-categories-checkboxes');
    if (!container) return;
    const categories = window.adminCategories || [];
    container.innerHTML = '';
    categories.forEach(c => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '8px';
        div.style.padding = '5px 8px';
        div.style.borderRadius = '4px';
        div.style.background = 'rgba(255, 255, 255, 0.02)';
        
        const isChecked = selectedCategories.includes(c.slug);
        
        div.innerHTML = `
            <input type="checkbox" class="admin-marketing-cat-checkbox" value="${c.slug}" id="mcat-${c.slug}" ${isChecked ? 'checked' : ''} style="cursor:pointer; accent-color: var(--gold-energy); width:16px; height:16px;">
            <label for="mcat-${c.slug}" style="color:#fff; font-size:0.85rem; cursor:pointer; user-select:none;">${c.name}</label>
        `;
        container.appendChild(div);
    });
};

window.populateCategoryDropdown = async function () {
    try {
        const res = await fetch(`${API_BASE}/api/categories`);
        window.adminCategories = await res.json();
        const categories = window.adminCategories;

        const prodTypeSelect = document.getElementById('admin-prod-type');
        if (prodTypeSelect) {
            const currentVal = prodTypeSelect.value;
            prodTypeSelect.innerHTML = categories.map(c => 
                `<option value="${c.slug}">${c.name}</option>`
            ).join('');
            if (currentVal && categories.some(c => c.slug === currentVal)) {
                prodTypeSelect.value = currentVal;
            } else if (categories.length > 0) {
                prodTypeSelect.value = categories[0].slug;
            }
        }

        const filterTypeSelect = document.getElementById('admin-product-filter-type');
        if (filterTypeSelect) {
            const currentFilter = filterTypeSelect.value;
            let optionsHtml = '<option value="all">All Types</option><option value="physical">Physical Books</option>';
            categories.forEach(c => {
                optionsHtml += `<option value="${c.slug}">${c.name}</option>`;
            });
            filterTypeSelect.innerHTML = optionsHtml;
            if (currentFilter) {
                filterTypeSelect.value = currentFilter;
            }
        }
    } catch (e) {
        console.error('Error populating category dropdowns:', e);
    }
};

window.populateAssignedBooksCheckboxes = async function (selectedSlug = '') {
    const container = document.getElementById('assigned-books-checkboxes');
    if (!container) return;
    container.innerHTML = '<div style="opacity: 0.5; font-size: 0.85rem;">Loading products...</div>';
    try {
        let products = allAdminProducts;
        if (!products || products.length === 0) {
            const res = await fetch(`${API_BASE}/api/products`);
            products = await res.json();
            allAdminProducts = products;
        }

        if (products.length === 0) {
            container.innerHTML = '<div style="opacity: 0.5; font-size: 0.85rem;">No products found in marketplace.</div>';
            return;
        }

        container.innerHTML = '';
        products.forEach(p => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '8px';
            div.style.padding = '4px 6px';
            div.style.borderRadius = '4px';
            div.style.background = 'rgba(255, 255, 255, 0.02)';
            
            const isChecked = selectedSlug && Array.isArray(p.categories) && p.categories.includes(selectedSlug);
            
            div.innerHTML = `
                <input type="checkbox" class="admin-assigned-book-checkbox" value="${p._id}" id="abk-${p._id}" ${isChecked ? 'checked' : ''} style="cursor:pointer; accent-color: var(--gold-energy); width:16px; height:16px;">
                <label for="abk-${p._id}" style="color:#fff; font-size:0.85rem; cursor:pointer; user-select:none;">${p.title} (${p.language})</label>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        console.error("Error populating assigned books:", e);
        container.innerHTML = '<div style="color: #ff6b6b; font-size: 0.85rem;">Failed to load books.</div>';
    }
};

window.openAddCategoryModal = function () {
    const modal = document.getElementById('admin-category-modal');
    const form = document.getElementById('admin-category-form');
    const title = document.getElementById('category-modal-title');
    if (!modal) {
        console.error("Category modal element '#admin-category-modal' not found in DOM.");
        return;
    }
    if (!form) {
        console.error("Category form element '#admin-category-form' not found in DOM.");
        return;
    }

    form.reset();
    const idInput = document.getElementById('admin-cat-id');
    if (idInput) idInput.value = '';
    const typeSelect = document.getElementById('admin-cat-discount-type');
    if (typeSelect) typeSelect.value = 'simple';
    const isActiveInput = document.getElementById('admin-cat-is-active');
    if (isActiveInput) isActiveInput.checked = true;
    if (title) title.textContent = 'ADD DISCOUNT / OFFER';
    window.toggleDiscountFields();
    window.populateAssignedBooksCheckboxes('');

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.openEditCategoryModal = async function (id) {
    const modal = document.getElementById('admin-category-modal');
    const title = document.getElementById('category-modal-title');
    if (!modal) {
        console.error("Category modal not found.");
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const categories = await res.json();
        const category = categories.find(c => c._id === id);
        if (!category) throw new Error('Category not found');

        const idInput = document.getElementById('admin-cat-id');
        const nameInput = document.getElementById('admin-cat-name');
        const slugInput = document.getElementById('admin-cat-slug');
        const isDigitalInput = document.getElementById('admin-cat-is-digital');
        const isActiveInput = document.getElementById('admin-cat-is-active');
        const typeSelect = document.getElementById('admin-cat-discount-type');
        const valInput = document.getElementById('admin-cat-discount-value');
        const qtyInput = document.getElementById('admin-cat-min-quantity');
        const buySelect = document.getElementById('admin-cat-bogo-buy');
        const getSelect = document.getElementById('admin-cat-bogo-get');

        if (idInput) idInput.value = category._id;
        if (nameInput) nameInput.value = category.name;
        if (slugInput) slugInput.value = category.slug;
        if (isDigitalInput) isDigitalInput.checked = !!category.isDigital;
        if (isActiveInput) isActiveInput.checked = category.isActive !== false;
        
        if (typeSelect) typeSelect.value = category.discountType || 'simple';
        if (valInput) valInput.value = category.discountValue !== undefined ? category.discountValue : 0;
        if (qtyInput) qtyInput.value = category.minQuantity !== undefined ? category.minQuantity : 2;
        if (buySelect) buySelect.value = category.bogoBuySlug || 'Hindi';
        if (getSelect) getSelect.value = category.bogoGetSlug || 'English';

        if (title) title.textContent = 'EDIT DISCOUNT / OFFER';
        window.toggleDiscountFields();
        window.populateAssignedBooksCheckboxes(category.slug);

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    } catch (e) {
        console.error(e);
        showToast('Error loading category details', 'error');
    }
};

window.closeCategoryModal = function () {
    const modal = document.getElementById('admin-category-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
};

window.deleteCategory = async function (id) {
    if (!confirm('Are you sure you want to delete this category? This will fail if products are still assigned to it.')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            showToast(result.message || 'Category deleted successfully', 'success');
            await window.loadAdminCategories();
        } else {
            showToast(result.message || 'Failed to delete category', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error during deletion', 'error');
    }
};

function initPricingAutoCalculation() {
    const origPriceInput = document.getElementById('admin-prod-original-price');
    const discountInput = document.getElementById('admin-prod-discount');
    const sellingPriceInput = document.getElementById('admin-prod-price');
    if (!origPriceInput || !discountInput || !sellingPriceInput) return;

    function updateSellingPrice() {
        const origPrice = parseFloat(origPriceInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;
        if (origPrice > 0) {
            const discountAmount = (origPrice * discount) / 100;
            sellingPriceInput.value = Math.round(origPrice - discountAmount);
        }
    }

    function updateDiscount() {
        const origPrice = parseFloat(origPriceInput.value) || 0;
        const sellingPrice = parseFloat(sellingPriceInput.value) || 0;
        if (origPrice > 0 && sellingPrice > 0 && sellingPrice < origPrice) {
            const pct = ((origPrice - sellingPrice) / origPrice) * 100;
            discountInput.value = Math.round(pct);
        } else if (sellingPrice >= origPrice) {
            discountInput.value = 0;
        }
    }

    origPriceInput.addEventListener('input', updateSellingPrice);
    discountInput.addEventListener('input', updateSellingPrice);
    sellingPriceInput.addEventListener('input', updateDiscount);
}

// Call on startup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPricingAutoCalculation);
} else {
    initPricingAutoCalculation();
}

// --- PREMIUM OFFERS MANAGEMENT MODULE ---
window.loadAdminOffers = async function () {
    try {
        console.log("🔄 Loading admin offers list...");
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/offers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load offers");
        const offers = await res.json();
        
        // Update KPIs
        const total = offers.length;
        const active = offers.filter(o => o.isActive).length;
        const views = offers.reduce((sum, o) => sum + (o.analytics?.views || 0), 0);
        const orders = offers.reduce((sum, o) => sum + (o.analytics?.orders || 0), 0);
        const revenue = offers.reduce((sum, o) => sum + (o.analytics?.revenue || 0), 0);

        document.getElementById('offers-kpi-total').textContent = total;
        document.getElementById('offers-kpi-active').textContent = active;
        document.getElementById('offers-kpi-views').textContent = views;
        document.getElementById('offers-kpi-orders').textContent = orders;
        document.getElementById('offers-kpi-revenue').textContent = '₹' + Math.round(revenue).toLocaleString();

        // Render Table
        const tbody = document.getElementById('admin-offers-table-body');
        if (!tbody) return;

        if (offers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 30px; opacity: 0.5;">
                        No premium offers created yet.
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = offers.map(o => {
                const offerId = o._id || o.id;
                const statusClass = o.isActive ? 'badge-active' : 'badge-inactive';
                const statusLabel = o.isActive ? 'Active' : 'Inactive';
                const valLabel = o.type === 'Percentage' ? `${o.discountValue}%` :
                                 o.type === 'Flat' ? `₹${o.discountValue}` :
                                 o.type === 'BOGO' ? 'BOGO' :
                                 o.type === 'Category' ? `${o.discountValue}% (Cat)` : 'Bundle';

                let validity = 'Ongoing';
                if (o.startDate || o.endDate) {
                    const start = o.startDate ? new Date(o.startDate).toLocaleDateString() : '';
                    const end = o.endDate ? new Date(o.endDate).toLocaleDateString() : '';
                    validity = `${start} - ${end}`;
                }

                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 15px; font-weight: 600; color: var(--gold-energy);">${o.name}</td>
                        <td style="padding: 15px;">${o.type}</td>
                        <td style="padding: 15px;">${valLabel}</td>
                        <td style="padding: 15px;">Level ${o.priority || 0}</td>
                        <td style="padding: 15px; font-size: 0.8rem; opacity: 0.8;">${validity}</td>
                        <td style="padding: 15px;">
                            <span class="status-badge ${statusClass}" style="padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; background: ${o.isActive ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 77, 77, 0.15)'}; color: ${o.isActive ? '#2ed573' : '#ff6b6b'}; border: 1px solid ${o.isActive ? 'rgba(46,213,115,0.3)' : 'rgba(255,77,77,0.3)'};">
                                ${statusLabel}
                            </span>
                        </td>
                        <td style="padding: 15px; text-align: right;">
                            <button class="btn btn-outline small" onclick="window.openEditOfferModal('${offerId}')" style="margin-right: 5px; padding: 5px 10px; font-size: 0.75rem;">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-outline small" onclick="window.deleteOfferDirect('${offerId}')" style="padding: 5px 10px; font-size: 0.75rem; color: #ff6b6b; border-color: rgba(255, 107, 107, 0.3); background: rgba(255, 107, 107, 0.05);">
                                <i class="fas fa-trash-alt"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Render Performance Table
        const perfTbody = document.getElementById('admin-offers-performance-table-body');
        if (perfTbody) {
            if (offers.length === 0) {
                perfTbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 30px; opacity: 0.5;">
                            No performance data available.
                        </td>
                    </tr>
                `;
            } else {
                perfTbody.innerHTML = offers.map(o => {
                    const views = o.analytics?.views || 0;
                    const claims = o.analytics?.claims || 0;
                    const orders = o.analytics?.orders || 0;
                    const revenue = o.analytics?.revenue || 0;
                    const conversionRate = claims > 0 ? ((orders / claims) * 100).toFixed(1) + '%' : '0.0%';

                    return `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 15px; font-weight: 600; color: #fff;">${o.name}</td>
                            <td style="padding: 15px; color: var(--gold-text); font-weight: 600;">${o.offerType || o.type}</td>
                            <td style="padding: 15px;">${views.toLocaleString()}</td>
                            <td style="padding: 15px;">${claims.toLocaleString()}</td>
                            <td style="padding: 15px;">${orders.toLocaleString()}</td>
                            <td style="padding: 15px; font-weight: bold; color: ${orders > 0 ? '#2ecc71' : '#fff'};">${conversionRate}</td>
                            <td style="padding: 15px; text-align: right; font-weight: bold; color: var(--gold-text);">₹${Math.round(revenue).toLocaleString()}</td>
                        </tr>
                    `;
                }).join('');
            }
        }

    } catch (e) {
        console.error(e);
        showToast('Error loading offers', 'error');
    }
};

window.toggleOfferTypeFields = async function (offerData = null) {
    const type = document.getElementById('admin-offer-type').value;
    const container = document.getElementById('admin-offer-dynamic-fields');
    if (!container) return;

    // Fetch products if not loaded yet
    if (!allAdminProducts || allAdminProducts.length === 0) {
        try {
            const res = await fetch(`${API_BASE}/api/products`);
            allAdminProducts = await res.json();
        } catch (e) {
            console.error("Error loading products for offers:", e);
        }
    }

    const productOptionsHTML = (allAdminProducts || []).map(p => `
        <option value="${p._id || p.id}">${p.title} (${p.type} - ${p.language})</option>
    `).join('');

    let html = '';

    if (type === 'Percentage') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-discount-percentage" class="p-input" min="1" max="100" placeholder=" " required>
                    <label class="p-label">Discount Percentage (%)</label>
                </div>
            </div>
        `;
    } else if (type === 'Flat') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-flat-amount" class="p-input" min="1" placeholder=" " required>
                    <label class="p-label">Flat Discount Amount (₹)</label>
                </div>
            </div>
        `;
    } else if (type === 'Coupon') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="text" id="admin-offer-coupon-code" class="p-input" placeholder=" " required>
                    <label class="p-label">Coupon Code (e.g. SAVE50)</label>
                </div>
                <div class="p-form-group">
                    <select id="admin-offer-coupon-discount-type" class="p-input" required>
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Flat">Flat (₹)</option>
                    </select>
                    <label class="p-label">Discount Type</label>
                </div>
            </div>
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-coupon-discount-value" class="p-input" min="1" placeholder=" " required>
                    <label class="p-label">Discount Value</label>
                </div>
                <div class="p-form-group">
                    <input type="number" id="admin-offer-coupon-min-order" class="p-input" min="0" placeholder=" ">
                    <label class="p-label">Min Order Amount (₹)</label>
                </div>
            </div>
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-coupon-max-discount" class="p-input" min="0" placeholder=" ">
                    <label class="p-label">Max Discount Amount (₹)</label>
                </div>
                <div class="p-form-group">
                    <input type="number" id="admin-offer-coupon-usage-limit" class="p-input" min="1" placeholder=" ">
                    <label class="p-label">Usage Limit per User</label>
                </div>
            </div>
        `;
    } else if (type === 'FreeShipping') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-shipping-min-amount" class="p-input" min="0" placeholder=" " required>
                    <label class="p-label">Min Purchase Amount (₹)</label>
                </div>
                <div class="p-form-group">
                    <input type="text" id="admin-offer-shipping-category" class="p-input" placeholder=" ">
                    <label class="p-label">Applicable Category Slug (Optional)</label>
                </div>
            </div>
            <div class="p-form-group">
                <input type="text" id="admin-offer-shipping-coupon" class="p-input" placeholder=" ">
                <label class="p-label">Requires Coupon Code (Optional)</label>
            </div>
        `;
    } else if (type === 'Combo') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-combo-price" class="p-input" min="1" placeholder=" " required>
                    <label class="p-label">Combo Package Price (₹)</label>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: var(--gold-text); margin-bottom: 5px;">Select Combo Products (Check them in the checklist below)</div>
        `;
    } else if (type === 'BOGO') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <select id="admin-offer-bogo-buy-product" class="p-input" required style="background: #111; color: #fff;">
                        <option value="">-- Select Product to Buy --</option>
                        ${productOptionsHTML}
                    </select>
                    <label class="p-label">Buy Product</label>
                </div>
                <div class="p-form-group">
                    <select id="admin-offer-bogo-get-product" class="p-input" required style="background: #111; color: #fff;">
                        <option value="">-- Select Free Product --</option>
                        ${productOptionsHTML}
                    </select>
                    <label class="p-label">Get Product (Free)</label>
                </div>
            </div>
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-bogo-buy-qty" class="p-input" min="1" value="1" placeholder=" " required>
                    <label class="p-label">Required Buy Qty (X)</label>
                </div>
                <div class="p-form-group">
                    <input type="number" id="admin-offer-bogo-get-qty" class="p-input" min="1" value="1" placeholder=" " required>
                    <label class="p-label">Free Qty (Y)</label>
                </div>
            </div>
        `;
    } else if (type === 'FirstOrder') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <select id="admin-offer-firstorder-discount-type" class="p-input" required>
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Flat">Flat (₹)</option>
                    </select>
                    <label class="p-label">Discount Type</label>
                </div>
                <div class="p-form-group">
                    <input type="number" id="admin-offer-firstorder-discount-value" class="p-input" min="1" placeholder=" " required>
                    <label class="p-label">Discount Value</label>
                </div>
            </div>
        `;
    } else if (type === 'FlashSale') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-flash-percentage" class="p-input" min="1" max="100" placeholder=" " required>
                    <label class="p-label">Flash Sale Discount (%)</label>
                </div>
            </div>
        `;
    } else if (type === 'Festival') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="number" id="admin-offer-festival-percentage" class="p-input" min="1" max="100" placeholder=" " required>
                    <label class="p-label">Festival Discount (%)</label>
                </div>
            </div>
        `;
    } else if (type === 'CategoryPublisherAuthor') {
        html = `
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="text" id="admin-offer-cpa-categories" class="p-input" placeholder=" ">
                    <label class="p-label">Categories (comma separated slugs)</label>
                </div>
                <div class="p-form-group">
                    <input type="text" id="admin-offer-cpa-publishers" class="p-input" placeholder=" ">
                    <label class="p-label">Publishers (comma separated)</label>
                </div>
            </div>
            <div class="premium-grid">
                <div class="p-form-group">
                    <input type="text" id="admin-offer-cpa-authors" class="p-input" placeholder=" ">
                    <label class="p-label">Authors (comma separated)</label>
                </div>
                <div class="p-form-group">
                    <input type="number" id="admin-offer-cpa-discount" class="p-input" min="1" max="100" placeholder=" " required>
                    <label class="p-label">Discount Percentage (%)</label>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Populate values if offerData is provided
    if (offerData) {
        if (type === 'Percentage') {
            document.getElementById('admin-offer-discount-percentage').value = offerData.discountValue || offerData.discountRules?.percentage || '';
        } else if (type === 'Flat') {
            document.getElementById('admin-offer-flat-amount').value = offerData.discountValue || offerData.discountRules?.flatAmount || '';
        } else if (type === 'Coupon' && offerData.couponRules) {
            document.getElementById('admin-offer-coupon-code').value = offerData.couponRules.code || '';
            document.getElementById('admin-offer-coupon-discount-type').value = offerData.couponRules.discountType || 'Percentage';
            document.getElementById('admin-offer-coupon-discount-value').value = offerData.couponRules.discountValue || '';
            document.getElementById('admin-offer-coupon-min-order').value = offerData.couponRules.minOrder || '';
            document.getElementById('admin-offer-coupon-max-discount').value = offerData.couponRules.maxDiscount || '';
            document.getElementById('admin-offer-coupon-usage-limit').value = offerData.couponRules.usageLimit || '';
        } else if (type === 'FreeShipping' && offerData.shippingRules) {
            document.getElementById('admin-offer-shipping-min-amount').value = offerData.shippingRules.minAmount || '';
            document.getElementById('admin-offer-shipping-category').value = offerData.shippingRules.categorySlug || '';
            document.getElementById('admin-offer-shipping-coupon').value = offerData.shippingRules.couponCode || '';
        } else if (type === 'Combo') {
            document.getElementById('admin-offer-combo-price').value = offerData.comboRules?.comboPrice || '';
        } else if (type === 'BOGO' && offerData.buyXGetYRules) {
            document.getElementById('admin-offer-bogo-buy-product').value = offerData.buyXGetYRules.buyProductId || '';
            document.getElementById('admin-offer-bogo-get-product').value = offerData.buyXGetYRules.freeProductId || '';
            document.getElementById('admin-offer-bogo-buy-qty').value = offerData.buyXGetYRules.requiredQty || 1;
            document.getElementById('admin-offer-bogo-get-qty').value = offerData.buyXGetYRules.freeQty || 1;
        } else if (type === 'FirstOrder' && offerData.firstOrderRules) {
            document.getElementById('admin-offer-firstorder-discount-type').value = offerData.firstOrderRules.discountType || 'Percentage';
            document.getElementById('admin-offer-firstorder-discount-value').value = offerData.firstOrderRules.discountValue || '';
        } else if (type === 'FlashSale') {
            document.getElementById('admin-offer-flash-percentage').value = offerData.discountValue || offerData.discountRules?.percentage || '';
        } else if (type === 'Festival') {
            document.getElementById('admin-offer-festival-percentage').value = offerData.discountValue || offerData.discountRules?.percentage || '';
        } else if (type === 'CategoryPublisherAuthor') {
            document.getElementById('admin-offer-cpa-categories').value = (offerData.categories || []).join(', ');
            document.getElementById('admin-offer-cpa-publishers').value = (offerData.publishers || []).join(', ');
            document.getElementById('admin-offer-cpa-authors').value = (offerData.authors || []).join(', ');
            document.getElementById('admin-offer-cpa-discount').value = offerData.discountValue || offerData.discountRules?.percentage || '';
        }
    }
};

window.openAddOfferModal = async function () {
    const modal = document.getElementById('admin-offer-modal');
    const form = document.getElementById('admin-offer-form');
    const title = document.getElementById('admin-offer-modal-title');
    const saveBtn = document.getElementById('admin-offer-save-btn');
    const deleteBtn = document.getElementById('admin-offer-delete-btn');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('admin-offer-id').value = '';
    document.getElementById('admin-offer-current-banner').innerHTML = '';
    
    if (title) title.textContent = 'CREATE PREMIUM OFFER';
    if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-plus-circle"></i> CREATE OFFER';
    if (deleteBtn) deleteBtn.style.display = 'none';

    document.getElementById('admin-offer-type').value = 'Percentage';
    await window.toggleOfferTypeFields();
    await populateOfferProductsCheckboxes([]);

    modal.style.display = 'flex';
    modal.classList.add('active');
};

window.openEditOfferModal = async function (id) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/offers/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load offer detail");
        const offer = await res.json();

        const modal = document.getElementById('admin-offer-modal');
        const form = document.getElementById('admin-offer-form');
        const title = document.getElementById('admin-offer-modal-title');
        const saveBtn = document.getElementById('admin-offer-save-btn');
        const deleteBtn = document.getElementById('admin-offer-delete-btn');

        if (!modal || !form) return;

        form.reset();

        document.getElementById('admin-offer-id').value = offer._id || offer.id;
        document.getElementById('admin-offer-name').value = offer.name || '';
        document.getElementById('admin-offer-slug').value = offer.slug || '';
        document.getElementById('admin-offer-description').value = offer.description || '';
        document.getElementById('admin-offer-type').value = offer.offerType || offer.type || 'Percentage';
        document.getElementById('admin-offer-priority').value = offer.priority !== undefined ? offer.priority : '1';
        
        // Format ISO dates for datetime-local input (YYYY-MM-DDTHH:MM)
        if (offer.startDate) {
            document.getElementById('admin-offer-start-date').value = new Date(offer.startDate).toISOString().slice(0, 16);
        }
        if (offer.endDate) {
            document.getElementById('admin-offer-end-date').value = new Date(offer.endDate).toISOString().slice(0, 16);
        }

        document.getElementById('admin-offer-badge').value = offer.badgeText || '';
        document.getElementById('admin-offer-cta').value = offer.ctaText || '';
        document.getElementById('admin-offer-category-slug').value = offer.categories?.[0] || '';
        document.getElementById('admin-offer-active').checked = offer.isActive !== false;

        // Render current banner preview
        const bannerPreview = document.getElementById('admin-offer-current-banner');
        if (bannerPreview && offer.bannerUrl) {
            bannerPreview.innerHTML = `<img src="${offer.bannerUrl.startsWith('http') || offer.bannerUrl.startsWith('/') ? offer.bannerUrl : API_BASE + '/' + offer.bannerUrl}" style="max-height: 80px; border-radius: 4px; margin-top: 10px;">`;
        } else if (bannerPreview) {
            bannerPreview.innerHTML = '';
        }

        // Wait to populate type specific fields
        await window.toggleOfferTypeFields(offer);

        const selectedProductIds = (offer.products || []).map(p => typeof p === 'object' ? String(p.productId || p._id || p.id) : String(p)).filter(Boolean);
        await populateOfferProductsCheckboxes(selectedProductIds);

        if (title) title.textContent = 'EDIT PREMIUM OFFER';
        if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> UPDATE OFFER';
        if (deleteBtn) deleteBtn.style.display = 'block';

        modal.style.display = 'flex';
        modal.classList.add('active');

    } catch (e) {
        console.error(e);
        showToast('Failed to load offer details', 'error');
    }
};

window.closeOfferModal = function () {
    const modal = document.getElementById('admin-offer-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
};

// Handle Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admin-offer-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('admin-offer-save-btn');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
            saveBtn.disabled = true;

            try {
                const id = document.getElementById('admin-offer-id').value;
                const fileInput = document.getElementById('admin-offer-file-banner');
                let bannerUrl = '';

                // Handle file upload if present
                if (fileInput && fileInput.files[0]) {
                    bannerUrl = await uploadOfferBanner(fileInput.files[0]);
                } else {
                    // Retain old banner preview image if editing
                    const currentImg = document.querySelector('#admin-offer-current-banner img');
                    if (currentImg) {
                        const src = currentImg.getAttribute('src');
                        bannerUrl = src.replace(API_BASE + '/', '');
                    }
                }

                // Gather checked products
                const checkedProducts = [];
                document.querySelectorAll('.offer-product-checkbox:checked').forEach(cb => {
                    checkedProducts.push(cb.value);
                });

                const catSlug = document.getElementById('admin-offer-category-slug').value.trim();
                const offerType = document.getElementById('admin-offer-type').value;

                // V2 fields initialisation
                let discountValue = 0;
                let discountRules = {};
                let couponRules = {};
                let shippingRules = {};
                let buyXGetYRules = {};
                let firstOrderRules = {};
                let comboRules = {};
                let categories = catSlug ? [catSlug] : [];
                let publishers = [];
                let authors = [];

                if (offerType === 'Percentage') {
                    discountValue = Number(document.getElementById('admin-offer-discount-percentage').value) || 0;
                    discountRules = { percentage: discountValue };
                } else if (offerType === 'Flat') {
                    discountValue = Number(document.getElementById('admin-offer-flat-amount').value) || 0;
                    discountRules = { flatAmount: discountValue };
                } else if (offerType === 'Coupon') {
                    couponRules = {
                        code: document.getElementById('admin-offer-coupon-code').value.trim(),
                        discountType: document.getElementById('admin-offer-coupon-discount-type').value,
                        discountValue: Number(document.getElementById('admin-offer-coupon-discount-value').value) || 0,
                        minOrder: Number(document.getElementById('admin-offer-coupon-min-order').value) || 0,
                        maxDiscount: Number(document.getElementById('admin-offer-coupon-max-discount').value) || 0,
                        usageLimit: Number(document.getElementById('admin-offer-coupon-usage-limit').value) || 1
                    };
                    discountValue = couponRules.discountValue;
                } else if (offerType === 'FreeShipping') {
                    shippingRules = {
                        minAmount: Number(document.getElementById('admin-offer-shipping-min-amount').value) || 0,
                        categorySlug: document.getElementById('admin-offer-shipping-category').value.trim(),
                        couponCode: document.getElementById('admin-offer-shipping-coupon').value.trim()
                    };
                } else if (offerType === 'Combo') {
                    comboRules = {
                        products: checkedProducts,
                        comboPrice: Number(document.getElementById('admin-offer-combo-price').value) || 0
                    };
                    discountValue = comboRules.comboPrice;
                } else if (offerType === 'BOGO') {
                    buyXGetYRules = {
                        buyProductId: document.getElementById('admin-offer-bogo-buy-product').value,
                        freeProductId: document.getElementById('admin-offer-bogo-get-product').value,
                        requiredQty: Number(document.getElementById('admin-offer-bogo-buy-qty').value) || 1,
                        freeQty: Number(document.getElementById('admin-offer-bogo-get-qty').value) || 1
                    };
                } else if (offerType === 'FirstOrder') {
                    firstOrderRules = {
                        discountType: document.getElementById('admin-offer-firstorder-discount-type').value,
                        discountValue: Number(document.getElementById('admin-offer-firstorder-discount-value').value) || 0
                    };
                    discountValue = firstOrderRules.discountValue;
                } else if (offerType === 'FlashSale') {
                    discountValue = Number(document.getElementById('admin-offer-flash-percentage').value) || 0;
                    discountRules = { percentage: discountValue };
                } else if (offerType === 'Festival') {
                    discountValue = Number(document.getElementById('admin-offer-festival-percentage').value) || 0;
                    discountRules = { percentage: discountValue };
                } else if (offerType === 'CategoryPublisherAuthor') {
                    const cats = document.getElementById('admin-offer-cpa-categories').value;
                    const pubs = document.getElementById('admin-offer-cpa-publishers').value;
                    const auths = document.getElementById('admin-offer-cpa-authors').value;

                    categories = cats ? cats.split(',').map(s => s.trim()).filter(Boolean) : [];
                    publishers = pubs ? pubs.split(',').map(s => s.trim()).filter(Boolean) : [];
                    authors = auths ? auths.split(',').map(s => s.trim()).filter(Boolean) : [];

                    discountValue = Number(document.getElementById('admin-offer-cpa-discount').value) || 0;
                    discountRules = { percentage: discountValue };
                }

                const bodyData = {
                    name: document.getElementById('admin-offer-name').value,
                    slug: document.getElementById('admin-offer-slug').value,
                    description: document.getElementById('admin-offer-description').value,
                    type: offerType,
                    offerType,
                    discountValue,
                    priority: Number(document.getElementById('admin-offer-priority').value),
                    startDate: document.getElementById('admin-offer-start-date').value || null,
                    endDate: document.getElementById('admin-offer-end-date').value || null,
                    badgeText: document.getElementById('admin-offer-badge').value,
                    ctaText: document.getElementById('admin-offer-cta').value,
                    bannerUrl,
                    products: checkedProducts,
                    categories,
                    publishers,
                    authors,
                    discountRules,
                    couponRules,
                    shippingRules,
                    buyXGetYRules,
                    firstOrderRules,
                    comboRules,
                    isActive: document.getElementById('admin-offer-active').checked
                };

                const token = localStorage.getItem('authToken');
                const url = id ? `${API_BASE}/api/offers/${id}` : `${API_BASE}/api/offers`;
                const method = id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(bodyData)
                });

                if (response.ok) {
                    showToast(id ? 'Offer updated successfully' : 'Offer created successfully', 'success');
                    window.closeOfferModal();
                    await window.loadAdminOffers();
                } else {
                    const error = await response.json();
                    showToast(error.message || 'Failed to save offer', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Error saving offer', 'error');
            } finally {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        });
    }

    // Drag and Drop files for Offer Banner
    const dropZone = document.getElementById('drop-zone-offer-banner');
    const fileInput = document.getElementById('admin-offer-file-banner');
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('admin-offer-current-banner');
                    if (preview) {
                        preview.innerHTML = `<img src="${event.target.result}" style="max-height: 80px; border-radius: 4px; margin-top: 10px;">`;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

window.deleteCurrentOffer = async function () {
    const id = document.getElementById('admin-offer-id').value;
    if (!id) return;
    if (!confirm('Are you sure you want to delete this premium offer?')) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/offers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            showToast('Offer deleted successfully', 'success');
            window.closeOfferModal();
            await window.loadAdminOffers();
        } else {
            showToast(result.message || 'Failed to delete offer', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error during deletion', 'error');
    }
};

window.deleteOfferDirect = async function (id) {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this premium offer?')) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/offers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (res.ok) {
            showToast('Offer deleted successfully', 'success');
            await window.loadAdminOffers();
        } else {
            showToast(result.message || 'Failed to delete offer', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Server error during deletion', 'error');
    }
};

async function uploadOfferBanner(file) {
    const formData = new FormData();
    formData.append('cover', file);
    const token = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    if (!res.ok) throw new Error('Banner upload failed');
    const data = await res.json();
    return data.paths.coverPath;
}

async function populateOfferProductsCheckboxes(selectedProductIds = []) {
    if (!allAdminProducts || allAdminProducts.length === 0) {
        try {
            const res = await fetch(`${API_BASE}/api/products`);
            allAdminProducts = await res.json();
        } catch (e) {
            console.error(e);
        }
    }
    const container = document.getElementById('admin-offer-products-checkboxes');
    if (!container) return;
    if (!allAdminProducts || allAdminProducts.length === 0) {
        container.innerHTML = '<p style="font-size:0.8rem; opacity:0.5;">No products available to assign.</p>';
        return;
    }
    container.innerHTML = allAdminProducts.map(p => {
        const id = p._id || p.id;
        const checked = selectedProductIds.includes(String(id)) ? 'checked' : '';
        return `
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" class="offer-product-checkbox" value="${id}" id="offer-p-${id}" ${checked}>
                <label for="offer-p-${id}" style="font-size: 0.8rem; cursor: pointer; color: #fff; opacity: 0.8;">
                    ${p.title} (${p.type} - ${p.language})
                </label>
            </div>
        `;
    }).join('');
}


// --- ADMIN ASSIGN BOOK MODAL ---
window.openAssignBookModal = async function(userId, userEmail) {
    document.getElementById('assign-user-id').value = userId;
    document.getElementById('assign-user-email').value = userEmail;
    
    const select = document.getElementById('assign-product-id');
    select.innerHTML = '<option value="">Loading digital products...</option>';
    
    document.getElementById('adminAssignBookModal').classList.add('active');
    
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(API_BASE + '/api/products', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (res.ok) {
            const products = await res.json();
            const isDigital = (p) => {
                if (!p) return false;
                const rawType = (p.type || '').toString().toUpperCase();
                const cleanType = rawType.replace(/[^A-Z]/g, '');
                if (['EBOOK', 'AUDIOBOOK', 'DIGITAL', 'AUDIO'].includes(cleanType)) return true;
                if (rawType.includes('E-BOOK') || rawType.includes('AUDIOBOOK') || rawType.includes('AUDIO')) return true;
                const cat = (p.category || '').toString().toUpperCase();
                if (['DIGITAL', 'EBOOK', 'AUDIOBOOK', 'AUDIO', 'E-BOOK'].includes(cat)) return true;
                if (p.chapters && Array.isArray(p.chapters) && p.chapters.length > 0) return true;
                if (p.filePath) return true;
                return false;
            };
            const digitalProducts = (Array.isArray(products) ? products : []).filter(isDigital);
            
            if (digitalProducts.length > 0) {
                select.innerHTML = '<option value="">-- Select E-Book / Audiobook --</option>' + 
                    digitalProducts.map(p => `<option value="${p._id || p.id}">${p.title} - ${p.language || 'Unknown'} (${(p.type || p.category || 'Digital').toUpperCase()})</option>`).join('');
            } else {
                select.innerHTML = '<option value="">No digital products found</option>';
            }
        } else {
            select.innerHTML = '<option value="">Failed to load products</option>';
        }
    } catch (e) {
        console.error('Failed to load products for assign modal:', e);
        select.innerHTML = '<option value="">Error loading products</option>';
    }
};

window.closeAssignBookModal = function() {
    document.getElementById('adminAssignBookModal').classList.remove('active');
};

window.submitBookAssignment = async function() {
    const userId = document.getElementById('assign-user-id').value;
    const productId = document.getElementById('assign-product-id').value;
    
    if (!userId || !productId) {
        window.showToast('Please select a product to assign', 'error');
        return;
    }
    
    const btn = document.querySelector('#adminAssignBookModal .p-btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';
    btn.disabled = true;
    
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(API_BASE + '/api/library/admin/assign', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, productId })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            window.showToast(data.message || 'Book assigned successfully!', 'success');
            window.closeAssignBookModal();
        } else {
            window.showToast(data.message || 'Failed to assign book', 'error');
        }
    } catch (e) {
        console.error('Assign book error:', e);
        window.showToast('Network error while assigning book', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// ==========================================
// EXCEL PRICING IMPORT LOGIC
// ==========================================
let currentPricingImportFile = null;
let currentPricingPreviewData = null;
let currentPricingVolume = null;
let allPricingProducts = [];

window.openPricingSelectionModal = async function() {
    const modal = document.getElementById('admin-pricing-selection-modal');
    if(modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        if (typeof window.initModalParticles === 'function') {
            window.initModalParticles('pricing-selection-particles-canvas', 'admin-pricing-selection-modal');
        }
    }
    
    const accordion = document.getElementById('pricing-selection-accordion');
    accordion.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:var(--gold-energy)"></i></div>';

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        allPricingProducts = await res.json();
        
        window.renderPricingSelection();
    } catch (e) {
        console.error(e);
        accordion.innerHTML = '<p style="color:red; text-align:center;">Failed to load products</p>';
    }
};

window.closePricingSelectionModal = function() {
    const modal = document.getElementById('admin-pricing-selection-modal');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 500);
    }
};

window.setPricingFilter = function(filter) {
    document.querySelectorAll('.pricing-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) btn.classList.add('active');
    });
    window.renderPricingSelection();
};

window.filterPricingSelection = function() {
    window.renderPricingSelection();
};

window.renderPricingSelection = function() {
    const search = document.getElementById('pricing-selection-search').value.toLowerCase();
    const activeFilter = document.querySelector('.pricing-filter-btn.active')?.dataset.filter || 'all';
    
    const grouped = {};
    allPricingProducts.forEach(p => {
        if (activeFilter !== 'all' && (p.type || '').toLowerCase() !== activeFilter) return;
        
        const titleMatch = (p.title || '').toLowerCase().includes(search);
        const skuMatch = (p.sku || '').toLowerCase().includes(search);
        const isbnMatch = (p.isbn || '').toLowerCase().includes(search);
        if (search && !titleMatch && !skuMatch && !isbnMatch) return;
        
        let vol = 'Other Products';
        const volMatch = p.title ? p.title.match(/vol(?:ume)?\s*(\d+)/i) : null;
        if (volMatch) {
            vol = `Volume ${volMatch[1]}`;
        }
        
        if (!grouped[vol]) grouped[vol] = [];
        grouped[vol].push(p);
    });
    
    const container = document.getElementById('pricing-selection-accordion');
    container.innerHTML = '';
    
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'Other Products') return 1;
        if (b === 'Other Products') return -1;
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    });
    
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    grid.style.gap = '15px';
    grid.style.padding = '10px 0';
    
    sortedKeys.forEach(vol => {
        const productsInVol = grouped[vol];
        let hasAnyPricing = false;
        let lastUpdated = null;
        
        productsInVol.forEach(p => {
            if (p.countryPricing && Object.keys(p.countryPricing).length > 0) hasAnyPricing = true;
            if (p.updatedAt) {
                const date = new Date(p.updatedAt);
                if (!lastUpdated || date > lastUpdated) lastUpdated = date;
            }
        });
        
        const statusHtml = hasAnyPricing 
            ? '<span style="color: #2ecc71; font-size: 0.75rem;"><i class="fas fa-check-circle"></i> Pricing Exists</span>'
            : '<span style="color: #f39c12; font-size: 0.75rem;"><i class="fas fa-exclamation-triangle"></i> Pending</span>';
            
        const dateStr = lastUpdated ? lastUpdated.toLocaleDateString() : 'N/A';

        const card = document.createElement('div');
        card.style.background = 'rgba(0,0,0,0.4)';
        card.style.border = '1px solid rgba(255,255,255,0.05)';
        card.style.borderRadius = '12px';
        card.style.padding = '20px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '10px';
        card.style.transition = 'all 0.2s';
        card.onmouseenter = () => card.style.borderColor = 'rgba(212,175,55,0.5)';
        card.onmouseleave = () => card.style.borderColor = 'rgba(255,255,255,0.05)';
        
        card.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--gold-text); display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-book-open"></i> ${vol}
            </div>
            <div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">
                ${productsInVol.length} Book Formats
            </div>
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">
                Last Updated: ${dateStr}
            </div>
            <div style="margin-top: 5px;">${statusHtml}</div>
            <button class="btn btn-gold" style="margin-top: 15px; width: 100%; padding: 10px; font-size: 0.85rem; border-radius: 8px;" onclick="window.openPricingUploadForVolume('${vol}')">
                <i class="fas fa-upload"></i> Import Pricing
            </button>
        `;
        grid.appendChild(card);
    });
    
    if (sortedKeys.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.5); padding: 20px;">No volumes found.</p>';
    } else {
        container.appendChild(grid);
    }
};

window.openPricingUploadForVolume = function(volumeName) {
    currentPricingVolume = volumeName;
    
    const selModal = document.getElementById('admin-pricing-selection-modal');
    selModal.classList.remove('active');
    setTimeout(() => { selModal.style.display = 'none'; }, 300);
    
    const modal = document.getElementById('admin-pricing-import-modal');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => { modal.classList.add('active'); }, 10);
        if (typeof window.initModalParticles === 'function') {
            window.initModalParticles('pricing-import-particles-canvas', 'admin-pricing-import-modal');
        }
    }
    
    document.getElementById('pricing-import-dynamic-title').textContent = `${volumeName} Pricing`;
    
    currentPricingImportFile = null;
    currentPricingPreviewData = null;
    document.getElementById('admin-pricing-import-file').value = '';
    
    document.getElementById('pricing-import-upload-section').style.display = 'block';
    document.getElementById('pricing-import-progress-container').style.display = 'none';
    document.getElementById('pricing-import-preview-section').style.display = 'none';
    document.getElementById('pricing-import-error-msg').style.display = 'none';
    document.getElementById('btn-pricing-import-preview').style.display = 'none';
    document.getElementById('btn-pricing-import-confirm').style.display = 'none';
    if(document.getElementById('btn-pricing-import-okay')) document.getElementById('btn-pricing-import-okay').style.display = 'none';
    
    const dropZone = document.getElementById('drop-zone-pricing-import');
    dropZone.innerHTML = `
        <i class="fas fa-file-excel" style="font-size: 2rem; color: #2ecc71; margin-bottom: 10px;"></i>
        <span style="color: white; font-weight: 500;">Click or drag ${volumeName} Excel file here</span>
        <span style="color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-top: 5px;">Supports .xlsx, .xls, .csv</span>
        <input type="file" id="admin-pricing-import-file" accept=".xlsx, .xls, .csv" style="display: none;">
    `;
    setupPricingImportDropZone();
};

window.goBackToPricingSelection = function() {
    const impModal = document.getElementById('admin-pricing-import-modal');
    impModal.classList.remove('active');
    setTimeout(() => { impModal.style.display = 'none'; }, 300);
    
    const selModal = document.getElementById('admin-pricing-selection-modal');
    selModal.style.display = 'flex';
    setTimeout(() => { selModal.classList.add('active'); }, 10);
};

window.closePricingImportModal = function() {
    const modal = document.getElementById('admin-pricing-import-modal');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 500);
    }
};

window.downloadPricingTemplate = function() {
    if (!currentPricingVolume) return;
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    window.location.href = `${API_BASE}/api/products/pricing/template/${encodeURIComponent(currentPricingVolume)}?token=${token}`;
};

function setupPricingImportDropZone() {
    const dropZone = document.getElementById('drop-zone-pricing-import');
    const fileInput = document.getElementById('admin-pricing-import-file');
    
    if (!dropZone || !fileInput) return;
    
    dropZone.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) handlePricingImportFile(e.target.files[0]);
    };
    
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#2ecc71';
        dropZone.style.background = 'rgba(46, 204, 113, 0.1)';
    };
    
    dropZone.ondragleave = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(212,175,55,0.4)';
        dropZone.style.background = 'rgba(0,0,0,0.2)';
    };
    
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(212,175,55,0.4)';
        dropZone.style.background = 'rgba(0,0,0,0.2)';
        
        if (e.dataTransfer.files.length > 0) {
            handlePricingImportFile(e.dataTransfer.files[0]);
        }
    };
}

function handlePricingImportFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        window.showToast('Please upload a valid Excel or CSV file', 'error');
        return;
    }
    
    currentPricingImportFile = file;
    const dropZone = document.getElementById('drop-zone-pricing-import');
    dropZone.innerHTML = `
        <i class="fas fa-file-excel" style="font-size: 2rem; color: #2ecc71; margin-bottom: 10px;"></i>
        <span style="color: white; font-weight: 600;">${file.name}</span>
        <span style="color: rgba(255,255,255,0.7); font-size: 0.8rem; margin-top: 5px;">${(file.size / 1024).toFixed(1)} KB</span>
        <input type="file" id="admin-pricing-import-file" accept=".xlsx, .xls, .csv" style="display: none;">
    `;
    setupPricingImportDropZone();
    
    document.getElementById('btn-pricing-import-preview').style.display = 'block';
    document.getElementById('btn-pricing-import-confirm').style.display = 'none';
    if(document.getElementById('btn-pricing-import-okay')) document.getElementById('btn-pricing-import-okay').style.display = 'none';
    document.getElementById('pricing-import-preview-section').style.display = 'none';
    document.getElementById('pricing-import-progress-container').style.display = 'none';
    document.getElementById('pricing-import-error-msg').style.display = 'none';
}

function updateImportProgress(percent, statusText) {
    const container = document.getElementById('pricing-import-progress-container');
    const bar = document.getElementById('pricing-import-progress-bar');
    const status = document.getElementById('pricing-import-progress-status');
    const percentTxt = document.getElementById('pricing-import-progress-percent');
    
    container.style.display = 'block';
    bar.style.width = `${percent}%`;
    status.textContent = statusText;
    percentTxt.textContent = `${Math.round(percent)}%`;
}

window.previewPricingImport = async function() {
    if (!currentPricingImportFile || !currentPricingVolume) return;
    
    const btn = document.getElementById('btn-pricing-import-preview');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    
    const formData = new FormData();
    formData.append('file', currentPricingImportFile);
    formData.append('volumeName', currentPricingVolume);
    
    updateImportProgress(10, 'Uploading File...');

    const timer1 = setTimeout(() => updateImportProgress(40, 'Parsing Excel...'), 400);
    const timer2 = setTimeout(() => updateImportProgress(70, 'Validating Data...'), 800);

    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        const res = await fetch(`${API_BASE}/api/products/pricing/upload-preview`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        clearTimeout(timer1);
        clearTimeout(timer2);
        
        updateImportProgress(90, 'Generating Preview...');
        
        const data = await res.json();
        
        updateImportProgress(100, 'Ready to Import');
        
        if (res.ok) {
            currentPricingPreviewData = data.preview;
            renderPricingPreview(data);
            document.getElementById('pricing-import-progress-container').style.display = 'none';
            document.getElementById('btn-pricing-import-preview').style.display = 'none';
            if (data.summary.validRows > 0) {
                document.getElementById('btn-pricing-import-confirm').style.display = 'block';
                if(document.getElementById('btn-pricing-import-okay')) document.getElementById('btn-pricing-import-okay').style.display = 'none';
            } else {
                if(document.getElementById('btn-pricing-import-okay')) document.getElementById('btn-pricing-import-okay').style.display = 'block';
            }
        } else {
            document.getElementById('pricing-import-error-msg').textContent = data.error || 'Failed to preview file';
            document.getElementById('pricing-import-error-msg').style.display = 'block';
            document.getElementById('pricing-import-progress-container').style.display = 'none';
        }
    } catch (e) {
        console.error('Import preview error:', e);
        document.getElementById('pricing-import-error-msg').textContent = 'Network error while processing file';
        document.getElementById('pricing-import-error-msg').style.display = 'block';
        document.getElementById('pricing-import-progress-container').style.display = 'none';
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

function renderPricingPreview(data) {
    document.getElementById('pricing-import-preview-section').style.display = 'block';
    document.getElementById('pricing-import-upload-section').style.display = 'none';
    
    const summary = document.getElementById('pricing-import-summary');
    summary.innerHTML = `
        <div style="background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.3); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 1.2rem; font-weight: bold; color: #2ecc71;">${data.summary.validRows}</div>
            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">Valid Rows</div>
        </div>
        <div style="background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 1.2rem; font-weight: bold; color: #ff6b6b;">${data.summary.errorsFound}</div>
            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">Errors</div>
        </div>
        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 1.2rem; font-weight: bold; color: white;">${data.summary.processingTime}</div>
            <div style="font-size: 0.7rem; color: rgba(255,255,255,0.7); text-transform: uppercase;">Processing Time</div>
        </div>
    `;
    

    
    // Group preview data by Title or Format/Language
    window.currentPricingGrouped = {};
    data.preview.forEach(row => {
        // If title exists and is not unknown, use it, else fallback to format+lang
        const groupKey = (row.title && row.title !== 'Unknown') 
            ? row.title 
            : `${currentPricingVolume} - ${row.format || 'Unknown'} ${row.language || 'Unknown'}`;
            
        if (!window.currentPricingGrouped[groupKey]) window.currentPricingGrouped[groupKey] = [];
        window.currentPricingGrouped[groupKey].push(row);
    });

    const groupKeys = Object.keys(window.currentPricingGrouped).sort();

    document.getElementById('pricing-import-preview-volume-title').textContent = `${currentPricingVolume} Pricing`;
    document.getElementById('pricing-import-preview-count').textContent = `${groupKeys.length} Products Found`;

    window.currentPricingPreviewGroupKeys = groupKeys; // Store for filtering
    
    renderPricingPreviewSidebar(groupKeys);

    if (groupKeys.length > 0) {
        // Expand the first accordion by default
        const container = document.getElementById('pricing-import-grouped-books-container');
        if (container) {
            const firstId = container.querySelector('.pricing-preview-accordion-header');
            if (firstId) firstId.click();
        }
    }
}

function renderPricingPreviewSidebar(keys) {
    const container = document.getElementById('pricing-import-grouped-books-container');
    container.innerHTML = '';
    
    keys.forEach(groupKey => {
        const rows = window.currentPricingGrouped[groupKey] || [];
        
        let tableRowsHtml = '';
        if (rows.length === 0) {
            tableRowsHtml = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: rgba(255,255,255,0.5);">No pricing data found</td></tr>';
        } else {
            rows.forEach(row => {
                let statusHtml = '';
                if (row.isValid) {
                    statusHtml = row.status === 'Updated' 
                        ? '<span style="color: #3498db; font-size: 0.75rem; background: rgba(52, 152, 219, 0.1); padding: 2px 8px; border-radius: 12px;">Updated</span>'
                        : (row.status === 'New' 
                            ? '<span style="color: #2ecc71; font-size: 0.75rem; background: rgba(46, 204, 113, 0.1); padding: 2px 8px; border-radius: 12px;">New</span>'
                            : '<span style="color: rgba(255,255,255,0.5); font-size: 0.75rem;">No Change</span>');
                } else {
                    statusHtml = `<span style="color: #ff6b6b; font-size: 0.75rem; background: rgba(255, 107, 107, 0.1); padding: 2px 8px; border-radius: 12px;" title="${row.errors.join(', ')}"><i class="fas fa-exclamation-circle"></i> ${row.errors.join(', ')}</span>`;
                }

                let diffHtml = '';
                if (row.difference) {
                    const isIncrease = row.difference > 0;
                    const color = isIncrease ? '#2ecc71' : '#ff6b6b';
                    const icon = isIncrease ? 'fa-arrow-up' : 'fa-arrow-down';
                    diffHtml = `<span style="color: ${color}; margin-left: 10px; font-size: 0.75rem;"><i class="fas ${icon}"></i> ${Math.abs(row.difference).toFixed(2)}</span>`;
                }

                const gstVal = row.gstPercent !== undefined && row.gstPercent !== null ? row.gstPercent : 0;
                const gstBadgeHtml = `<span style="font-size: 0.75rem; font-weight: 700; color: #ffd700; background: rgba(212,175,55,0.15); border: 1px solid rgba(212,175,55,0.3); padding: 2px 8px; border-radius: 12px;">${gstVal}%</span>`;

                tableRowsHtml += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
                        <td style="padding: 10px 12px; font-size: 0.85rem;">${row.countryName || '-'}</td>
                        <td style="padding: 10px 12px; font-size: 0.85rem;">${row.currency || '-'}</td>
                        <td style="padding: 10px 12px; font-size: 0.85rem; opacity: 0.7;">${row.currentPrice !== undefined && row.currentPrice !== null ? row.currentPrice : '-'}</td>
                        <td style="padding: 10px 12px; font-size: 0.85rem; color: var(--gold-text); font-weight: 600;">${row.importedPrice !== undefined && row.importedPrice !== null ? row.importedPrice : '-'}${diffHtml}</td>
                        <td style="padding: 10px 12px; text-align: center;">${gstBadgeHtml}</td>
                        <td style="padding: 10px 12px;">${statusHtml}</td>
                    </tr>
                `;
            });
        }

        const accordionId = `pricing-acc-${Math.random().toString(36).substr(2, 9)}`;
        
        const accDiv = document.createElement('div');
        accDiv.className = 'pricing-preview-accordion-item';
        accDiv.style.background = 'rgba(0,0,0,0.3)';
        accDiv.style.border = '1px solid rgba(255,255,255,0.1)';
        accDiv.style.borderRadius = '8px';
        accDiv.style.overflow = 'hidden';
        
        accDiv.innerHTML = `
            <div class="pricing-preview-accordion-header" style="padding: 15px; background: rgba(255,255,255,0.05); cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="window.togglePricingAccordion('${accordionId}')">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-chevron-down accordion-icon" id="icon-${accordionId}" style="color: var(--gold-text); transition: transform 0.3s ease;"></i>
                    <h4 style="margin: 0; color: white; font-size: 1rem;">${groupKey}</h4>
                </div>
                <span style="font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 3px 8px; border-radius: 12px; color: rgba(255,255,255,0.7);">${rows.length} Rows</span>
            </div>
            <div id="${accordionId}" style="display: none; padding: 0; max-height: 450px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead style="background: #111; position: sticky; top: 0; z-index: 2;">
                        <tr style="color: rgba(255,255,255,0.6); font-size: 0.75rem; text-transform: uppercase;">
                            <th style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: #111;">Country</th>
                            <th style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: #111;">Currency</th>
                            <th style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: #111;">Current Price</th>
                            <th style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: #111;">Imported Price</th>
                            <th style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: #111; text-align: center;">GST %</th>
                            <th style="padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: #111;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>
        `;
        
        container.appendChild(accDiv);
    });
}

window.togglePricingAccordion = function(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById(`icon-${id}`);
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(-180deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

window.filterPricingPreviewBooks = function() {
    const searchVal = document.getElementById('pricing-preview-search').value.toLowerCase();
    const filterVal = document.getElementById('pricing-preview-filter').value.toLowerCase();
    
    if (!window.currentPricingPreviewGroupKeys) return;
    
    const filteredKeys = window.currentPricingPreviewGroupKeys.filter(key => {
        const matchesSearch = key.toLowerCase().includes(searchVal);
        let matchesFilter = true;
        if (filterVal !== 'all') {
            matchesFilter = key.toLowerCase().includes(filterVal);
        }
        return matchesSearch && matchesFilter;
    });
    
    renderPricingPreviewSidebar(filteredKeys);
    document.getElementById('pricing-import-preview-count').textContent = `${filteredKeys.length} Products Found`;
}

window.goBackToPricingUpload = function() {
    document.getElementById('pricing-import-preview-section').style.display = 'none';
    document.getElementById('pricing-import-upload-section').style.display = 'block';
    
    // Reset buttons
    document.getElementById('btn-pricing-import-preview').style.display = 'block';
    document.getElementById('btn-pricing-import-confirm').style.display = 'none';
    if(document.getElementById('btn-pricing-import-okay')) document.getElementById('btn-pricing-import-okay').style.display = 'none';
}



window.confirmPricingImport = async function() {
    if (!currentPricingPreviewData || !currentPricingVolume) return;
    
    const validRowsCount = currentPricingPreviewData.filter(r => r.isValid).length;
    if (validRowsCount === 0) {
        window.showToast('No valid rows to import', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to import ${validRowsCount} valid price updates for ${currentPricingVolume}?`)) return;
    
    const btn = document.getElementById('btn-pricing-import-confirm');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
    btn.disabled = true;
    
    try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/products/pricing/confirm-import`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                volumeName: currentPricingVolume,
                previewData: currentPricingPreviewData
            })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            window.showToast(`Success: Updated ${data.updatedCount} prices across ${data.productsUpdated} products!`, 'success');
            window.closePricingImportModal();
            
            // Refresh full products table
            if (typeof loadAdminProductsFull === 'function') loadAdminProductsFull();
        } else {
            window.showToast(data.error || 'Import failed', 'error');
        }
    } catch (e) {
        console.error('Import confirm error:', e);
        window.showToast('Network error during import', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};


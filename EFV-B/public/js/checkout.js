const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';

let appliedCoupon = null;
let checkoutSubtotal = 0;
let isDigitalOrder = false;
let selectedPaymentMode = 'Online'; // Global state
let currentCountryData = { iso2: 'IN', dialCode: '+91' }; // Initial fallback

const REGIONAL_CONFIG = {
    'IN': { symbol: '₹', code: 'INR', pricing: null },
    'US': { symbol: '$', code: 'USD', pricing: { 'audiobook': 6.99, 'ebook': 8.99, 'hindi_paperback': 14.99, 'hindi_hardcover': 22.99, 'english_paperback': 17.99, 'english_hardcover': 26.99 } },
    'GB': { symbol: '£', code: 'GBP', pricing: { 'audiobook': 5.99, 'ebook': 6.99, 'hindi_paperback': 11.99, 'hindi_hardcover': 18.99, 'english_paperback': 13.99, 'english_hardcover': 21.99 } },
    'CA': { symbol: 'CA$', code: 'CAD', pricing: { 'audiobook': 8.99, 'ebook': 11.99, 'hindi_paperback': 19.99, 'hindi_hardcover': 29.99, 'english_paperback': 22.99, 'english_hardcover': 34.99 } },
    'AU': { symbol: 'AU$', code: 'AUD', pricing: { 'audiobook': 9.99, 'ebook': 12.99, 'hindi_paperback': 21.99, 'hindi_hardcover': 32.99, 'english_paperback': 25.99, 'english_hardcover': 37.99 } },
    'NZ': { symbol: 'NZ$', code: 'NZD', pricing: { 'audiobook': 10.99, 'ebook': 13.99, 'hindi_paperback': 23.99, 'hindi_hardcover': 35.99, 'english_paperback': 27.99, 'english_hardcover': 39.99 } },
    'FR': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'DE': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'ES': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'IT': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'PT': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'NL': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'BE': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'AT': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'IE': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'FI': { symbol: '€', code: 'EUR', pricing: { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 } },
    'CH': { symbol: 'CHF ', code: 'CHF', pricing: { 'audiobook': 7.00, 'ebook': 9.00, 'hindi_paperback': 15.00, 'hindi_hardcover': 23.00, 'english_paperback': 18.00, 'english_hardcover': 27.00 } },
    'SE': { symbol: 'kr ', code: 'SEK', pricing: { 'audiobook': 70, 'ebook': 90, 'hindi_paperback': 150, 'hindi_hardcover': 230, 'english_paperback': 180, 'english_hardcover': 270 } },
    'NO': { symbol: 'kr ', code: 'NOK', pricing: { 'audiobook': 70, 'ebook': 90, 'hindi_paperback': 150, 'hindi_hardcover': 230, 'english_paperback': 180, 'english_hardcover': 270 } },
    'DK': { symbol: 'kr ', code: 'DKK', pricing: { 'audiobook': 50, 'ebook': 65, 'hindi_paperback': 105, 'hindi_hardcover': 160, 'english_paperback': 125, 'english_hardcover': 190 } },
    'PL': { symbol: 'zł ', code: 'PLN', pricing: { 'audiobook': 28, 'ebook': 36, 'hindi_paperback': 60, 'hindi_hardcover': 92, 'english_paperback': 72, 'english_hardcover': 108 } },
    'AE': { symbol: 'AED ', code: 'AED', pricing: { 'audiobook': 25.0, 'ebook': 30.0, 'hindi_paperback': 55.0, 'hindi_hardcover': 85.0, 'english_paperback': 65.0, 'english_hardcover': 95.0 } },
    'SA': { symbol: 'SAR ', code: 'SAR', pricing: { 'audiobook': 28.0, 'ebook': 33.0, 'hindi_paperback': 60.0, 'hindi_hardcover': 90.0, 'english_paperback': 70.0, 'english_hardcover': 100.0 } },
    'OM': { symbol: 'OMR ', code: 'OMR', pricing: { 'audiobook': 3.0, 'ebook': 4.0, 'hindi_paperback': 6.0, 'hindi_hardcover': 9.0, 'english_paperback': 7.0, 'english_hardcover': 10.5 } },
    'KW': { symbol: 'KWD ', code: 'KWD', pricing: { 'audiobook': 2.5, 'ebook': 3.0, 'hindi_paperback': 4.5, 'hindi_hardcover': 7.0, 'english_paperback': 5.5, 'english_hardcover': 8.0 } },
    'BH': { symbol: 'BHD ', code: 'BHD', pricing: { 'audiobook': 3.0, 'ebook': 3.5, 'hindi_paperback': 5.5, 'hindi_hardcover': 8.5, 'english_paperback': 6.5, 'english_hardcover': 10.0 } },
    'QA': { symbol: 'QAR ', code: 'QAR', pricing: { 'audiobook': 25.0, 'ebook': 30.0, 'hindi_paperback': 55.0, 'hindi_hardcover': 85.0, 'english_paperback': 65.0, 'english_hardcover': 95.0 } },
    'SG': { symbol: 'S$', code: 'SGD', pricing: { 'audiobook': 9.0, 'ebook': 12.0, 'hindi_paperback': 20.0, 'hindi_hardcover': 30.0, 'english_paperback': 24.0, 'english_hardcover': 36.0 } },
    'MY': { symbol: 'RM ', code: 'MYR', pricing: { 'audiobook': 30.0, 'ebook': 40.0, 'hindi_paperback': 65.0, 'hindi_hardcover': 100.0, 'english_paperback': 80.0, 'english_hardcover': 120.0 } },
    'CN': { symbol: '¥', code: 'CNY', pricing: { 'audiobook': 50.0, 'ebook': 65.0, 'hindi_paperback': 110.0, 'hindi_hardcover': 165.0, 'english_paperback': 130.0, 'english_hardcover': 195.0 } },
    'JP': { symbol: '¥', code: 'JPY', pricing: { 'audiobook': 1000, 'ebook': 1300, 'hindi_paperback': 2200, 'hindi_hardcover': 3500, 'english_paperback': 2800, 'english_hardcover': 4200 } },
    'RU': { symbol: '₽', code: 'RUB', pricing: { 'audiobook': 500, 'ebook': 600, 'hindi_paperback': 1100, 'hindi_hardcover': 1600, 'english_paperback': 1300, 'english_hardcover': 1900 } },
    'KR': { symbol: '₩', code: 'KRW', pricing: { 'audiobook': 8000, 'ebook': 9500, 'hindi_paperback': 17000, 'hindi_hardcover': 25000, 'english_paperback': 20000, 'english_hardcover': 30000 } },
    'BR': { symbol: 'R$ ', code: 'BRL', pricing: { 'audiobook': 35, 'ebook': 45, 'hindi_paperback': 75, 'hindi_hardcover': 115, 'english_paperback': 90, 'english_hardcover': 135 } },
    'MX': { symbol: 'MX$ ', code: 'MXN', pricing: { 'audiobook': 120, 'ebook': 150, 'hindi_paperback': 250, 'hindi_hardcover': 380, 'english_paperback': 300, 'english_hardcover': 450 } },
    'ZA': { symbol: 'R ', code: 'ZAR', pricing: { 'audiobook': 120, 'ebook': 150, 'hindi_paperback': 250, 'hindi_hardcover': 380, 'english_paperback': 300, 'english_hardcover': 450 } },
    'HK': { symbol: 'HK$', code: 'HKD', pricing: { 'audiobook': 55, 'ebook': 70, 'hindi_paperback': 115, 'hindi_hardcover': 180, 'english_paperback': 140, 'english_hardcover': 210 } },
    'TH': { symbol: '฿ ', code: 'THB', pricing: { 'audiobook': 230, 'ebook': 300, 'hindi_paperback': 500, 'hindi_hardcover': 770, 'english_paperback': 600, 'english_hardcover': 900 } },
    'ID': { symbol: 'Rp ', code: 'IDR', pricing: { 'audiobook': 105000, 'ebook': 135000, 'hindi_paperback': 230000, 'hindi_hardcover': 350000, 'english_paperback': 275000, 'english_hardcover': 410000 } },
    'PH': { symbol: '₱ ', code: 'PHP', pricing: { 'audiobook': 380, 'ebook': 500, 'hindi_paperback': 840, 'hindi_hardcover': 1300, 'english_paperback': 1000, 'english_hardcover': 1500 } },
    'VN': { symbol: '₫ ', code: 'VND', pricing: { 'audiobook': 170000, 'ebook': 220000, 'hindi_paperback': 370000, 'hindi_hardcover': 570000, 'english_paperback': 440000, 'english_hardcover': 660000 } }
};
const countryNameMap = {
    'IN': 'India', 'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia', 'NZ': 'New Zealand',
    'FR': 'France', 'DE': 'Germany', 'ES': 'Spain', 'IT': 'Italy', 'PT': 'Portugal', 'NL': 'Netherlands', 'BE': 'Belgium',
    'AT': 'Austria', 'IE': 'Ireland', 'FI': 'Finland', 'CH': 'Switzerland', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark',
    'PL': 'Poland', 'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia', 'OM': 'Oman', 'KW': 'Kuwait', 'BH': 'Bahrain',
    'QA': 'Qatar', 'SG': 'Singapore', 'MY': 'Malaysia', 'CN': 'China', 'JP': 'Japan', 'RU': 'Russia', 'KR': 'South Korea',
    'BR': 'Brazil', 'MX': 'Mexico', 'ZA': 'South Africa', 'HK': 'Hong Kong', 'TH': 'Thailand', 'ID': 'Indonesia',
    'PH': 'Philippines', 'VN': 'Vietnam'
};

let currentRegion = 'IN';

function getCountryCode(nameOrCode) {
    if (!nameOrCode) return 'US';
    const clean = String(nameOrCode).trim().toUpperCase();
    if (REGIONAL_CONFIG[clean]) return clean;

    const map = {
        'INDIA': 'IN', 'BHARAT': 'IN', 'IND': 'IN',
        'UNITED STATES': 'US', 'USA': 'US', 'UNITED STATES OF AMERICA': 'US',
        'UNITED KINGDOM': 'GB', 'UK': 'GB', 'GREAT BRITAIN': 'GB', 'ENGLAND': 'GB',
        'CANADA': 'CA', 'AUSTRALIA': 'AU', 'NEW ZEALAND': 'NZ',
        'FRANCE': 'FR', 'GERMANY': 'DE', 'SPAIN': 'ES', 'ITALY': 'IT', 'PORTUGAL': 'PT',
        'NETHERLANDS': 'NL', 'BELGIUM': 'BE', 'AUSTRIA': 'AT', 'IRELAND': 'IE', 'FINLAND': 'FI',
        'SWITZERLAND': 'CH', 'SWEDEN': 'SE', 'NORWAY': 'NO', 'DENMARK': 'DK', 'POLAND': 'PL',
        'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE', 'DUBAI': 'AE', 'SAUDI ARABIA': 'SA', 'KSA': 'SA',
        'OMAN': 'OM', 'KUWAIT': 'KW', 'BAHRAIN': 'BH', 'QATAR': 'QA',
        'SINGAPORE': 'SG', 'MALAYSIA': 'MY', 'CHINA': 'CN', 'JAPAN': 'JP', 'RUSSIA': 'RU',
        'SOUTH KOREA': 'KR', 'KOREA': 'KR', 'BRAZIL': 'BR', 'MEXICO': 'MX', 'SOUTH AFRICA': 'ZA',
        'HONG KONG': 'HK', 'THAILAND': 'TH', 'INDONESIA': 'ID', 'PHILIPPINES': 'PH', 'VIETNAM': 'VN'
    };
    return map[clean] || 'US';
}

function getPriceForCurrency(item) {
    const selectedCountry = currentRegion;
    const COUNTRY_KEYS = {
        'IN': 'India', 'US': 'UnitedStates', 'GB': 'UnitedKingdom', 'DE': 'Germany', 'FR': 'France', 'ES': 'Spain',
        'IT': 'Italy', 'PT': 'Portugal', 'AE': 'UnitedArabEmirates', 'SA': 'SaudiArabia', 'CN': 'China', 'JP': 'Japan', 'RU': 'Russia', 'KR': 'SouthKorea'
    };
    const countryKey = COUNTRY_KEYS[selectedCountry];

    const dbProd = allDbProducts.find(p => String(p._id || p.id) === String(item.id || item.productId || item._id));
    if (dbProd && countryKey && dbProd.countryPricing && dbProd.countryPricing[countryKey]) {
        const cp = dbProd.countryPricing[countryKey];
        if (cp.enabled !== false && cp.price !== undefined && cp.price !== null && cp.price !== '') {
            return Number(cp.price);
        }
    }

    const region = REGIONAL_CONFIG[currentRegion] || REGIONAL_CONFIG['US'];

    // 1. Check if backend provided specific regional price
    if (item.regionalPrices && item.regionalPrices[region.code]) {
        return parseFloat(item.regionalPrices[region.code]);
    }

    // 2. Use our Standard Regional Pricing Table (Match Marketplace)
    if (region.pricing) {
        const type = (item.type || '').toLowerCase();
        const lang = (item.language || 'Hindi').toLowerCase();
        const lookupKey = (type === 'audiobook' || type === 'ebook') ? type : `${lang}_${type}`;

        if (region.pricing[lookupKey]) return region.pricing[lookupKey];

        // Global Fallback (US pricing for other products)
        const usPricing = REGIONAL_CONFIG['US'].pricing;
        if (usPricing[lookupKey]) return usPricing[lookupKey];

        // Final Dynamic Fallback (Exchange Rate)
        return Math.round((item.price / 83.5) * 100) / 100;
    }

    return item.price; // Default (INR)
}

function getCurrencySymbol() {
    const region = REGIONAL_CONFIG[currentRegion] || REGIONAL_CONFIG['US'];
    return region.symbol;
}

function convertToCurrency(inrAmount) {
    if (currentRegion === 'IN') return inrAmount;

    // For shipping/COD, we use a simple exchange rate for non-INR regions
    // since these aren't part of the fixed pricing table
    return Math.round((inrAmount / 83.5) * 100) / 100;
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Recover the country selection from the beginning
    const storedCountryCode = localStorage.getItem('efv_selected_country') || 'IN';
    const storedCountryData = JSON.parse(localStorage.getItem('efv_selected_country_data'));
    
    if (storedCountryData) {
        currentCountryData = storedCountryData;
    } else {
        // Fallback if not set specifically in new format
        currentCountryData = { 
            iso2: storedCountryCode, 
            dialCode: (storedCountryCode === 'IN' ? '+91' : '+1') // Basic fallback
        };
    }

    // 2. Set current region based on marketplace choice
    currentRegion = currentCountryData.iso2;

    // 3. Update Phone Prefix & Postal Code UI
    updatePhonePrefixUI();
    updatePostalCodeUI();

    // 4. Initial state and event listeners
    setTimeout(() => {
        const phoneInput = document.getElementById('ship-phone');
        const optionCod = document.getElementById('option-cod');
        const onlineRadio = document.getElementById('radio-online');

        if (phoneInput) {
            // numeric only input
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
                // Real-time validation
                validatePhone();
            });

            phoneInput.addEventListener('blur', validatePhone);
        }

        // COD Logic: Only for India
        if (currentRegion !== 'IN') {
            if (optionCod) optionCod.style.display = 'none';
            if (onlineRadio) onlineRadio.checked = true;
            selectedPaymentMode = 'Online';
        }

        const handleCountryUpdate = (data) => {
            if (data) {
                currentCountryData = data;
                currentRegion = data.iso2;
                updatePhonePrefixUI();
                updatePostalCodeUI();
                if (phoneInput) {
                    phoneInput.value = '';
                    document.getElementById('phone-error-msg').style.display = 'none';
                    phoneInput.closest('.phone-input-container').style.borderColor = '';
                }
                renderSummary(null, true);
            }
        };

        // Listen for same-tab changes
        window.addEventListener('efv-country-changed', (e) => {
            handleCountryUpdate(e.detail);
        });

        // Listen for storage changes (multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'efv_selected_country_data') {
                handleCountryUpdate(JSON.parse(e.newValue));
            }
        });

        // Initial re-render & dynamic rules fetching
        fetchDiscountRulesAndProducts();
    }, 500);
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Prefill user data if available
    document.getElementById('ship-email').value = user.email || '';
    document.getElementById('ship-name').value = user.name || '';

    // User-specific cart key (matches cart.js getUserKey logic)
    function getUserCartKey() {
        if (!user || !user.email) return 'efv_cart';
        const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `efv_cart_${cleanEmail}`;
    }

    let checkoutItems = [];
    const directCheckout = JSON.parse(localStorage.getItem('directCheckout'));
    // Read from user-specific cart key, fall back to generic cart
    const cart = JSON.parse(localStorage.getItem(getUserCartKey()))
        || JSON.parse(localStorage.getItem('efv_cart'))
        || [];

    if (directCheckout) {
        checkoutItems = Array.isArray(directCheckout) ? directCheckout : [directCheckout];
    } else {
        checkoutItems = cart;
    }

    // Detect Digital Order
    isDigitalOrder = checkoutItems.some(item => {
        const type = (item.type || '').toUpperCase();
        const id = (item.productId || item.id || '').toLowerCase();
        return type === 'EBOOK' || type === 'AUDIOBOOK' || type.includes('DIGITAL') || id.includes('ebook') || id.includes('audio');
    });

    if (checkoutItems.length === 0) {
        alert('No items to checkout.');
        window.location.href = 'marketplace.html';
        return;
    }

    // Calculate initial subtotal for coupon validation
    checkoutSubtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    renderSummary(checkoutItems);
    setupPlaceOrder(checkoutItems, user);
    setupPincodeCheck(checkoutItems);
    setupCouponHandlers();

    // AUTO-APPLY COUPON ONLY IF IN URL (Marketing Links)
    const urlParams = new URLSearchParams(window.location.search);
    const urlCoupon = urlParams.get('coupon') || urlParams.get('code');
    const addressId = urlParams.get('addressId');
    const isManual = urlParams.get('manual') === 'true';

    if (urlCoupon) {
        document.getElementById('coupon-input').value = urlCoupon;
        applyCoupon(urlCoupon, checkoutSubtotal);
    } else {
        // If not in URL, check if a coupon was ALREADY applied in this session
        const savedCoupon = localStorage.getItem('efv_applied_coupon');
        if (savedCoupon) {
            document.getElementById('coupon-input').value = savedCoupon;
            applyCoupon(savedCoupon, checkoutSubtotal);
        }
    }

    setupPaymentModeHandlers(checkoutItems);
    toggleAddressFields(checkoutItems);

    // PRE-FILL ADDRESS FROM PROFILE SELECTION OR DEFAULT
    try {
        if (!isManual) {
            const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const addrKey = `efv_user_addresses_${cleanEmail}`;
            const addresses = JSON.parse(localStorage.getItem(addrKey)) || [];

            let addr = null;
            if (addressId) {
                addr = addresses.find(a => (a.id === addressId || a._id === addressId));
            }

            // If no specific address selected, or ID not found, try to find default
            if (!addr) {
                addr = addresses.find(a => a.isDefault === true) || addresses[0];
            }

            if (addr) {
                console.log("📍 Pre-filling address:", addr.isDefault ? "Default" : "First Available", addr);
                if (document.getElementById('ship-name')) document.getElementById('ship-name').value = addr.fullName || '';
                if (document.getElementById('ship-phone')) document.getElementById('ship-phone').value = addr.phone || '';
                if (document.getElementById('ship-address')) document.getElementById('ship-address').value = addr.house || '';
                if (document.getElementById('ship-area')) document.getElementById('ship-area').value = addr.area || '';
                if (document.getElementById('ship-city')) document.getElementById('ship-city').value = addr.city || '';
                if (document.getElementById('ship-state')) document.getElementById('ship-state').value = addr.state || '';

                const pinEl = document.getElementById('ship-pincode');
                if (pinEl) {
                    pinEl.value = addr.pincode || '';
                    // Trigger serviceability check and shipping calc
                    pinEl.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // We no longer have a country dropdown in the form
                // if (countryEl) countryEl.value = addr.country || 'India';

                // Final re-render to be safe
                renderSummary(checkoutItems);
            }
        }
    } catch (e) {
        console.error("📍 Error pre-filling address:", e);
    }
});

function isItemPhysical(item) {
    const type = (item.type || '').toUpperCase();
    const cat = (item.category || '').toLowerCase();
    const id = (item.productId || item.id || '').toLowerCase();

    // 1. Explicit Digital Check (Short-circuit)
    if (['EBOOK', 'AUDIOBOOK', 'DIGITAL'].includes(type) || cat === 'digital') {
        return false;
    }

    // 2. Explicit Physical Check
    if (['HARDCOVER', 'PAPERBACK', 'PHYSICAL'].includes(type) || cat === 'physical') {
        return true;
    }

    // 3. Fallback logic based on ID
    const digs = ['ebook', 'audio', 'digital'];
    if (!digs.some(d => id.includes(d)) && (id.includes('hard') || id.includes('paper') || id.includes('vol') || id.includes('book'))) {
        return true;
    }

    return false;
}

function toggleAddressFields(items) {
    const hasPhysical = items.some(isItemPhysical);

    const isDigitalOnly = !hasPhysical;
    const addressFields = ['ship-address', 'ship-area', 'ship-city', 'ship-state', 'ship-pincode'];

    addressFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const parent = el.closest('.form-group') || el.parentElement;
            if (parent) parent.style.display = isDigitalOnly ? 'none' : 'block';
            if (isDigitalOnly) el.removeAttribute('required');
            else el.setAttribute('required', '');
        }
    });

    const pinStatus = document.getElementById('serviceability-status');
    if (pinStatus) pinStatus.style.display = isDigitalOnly ? 'none' : '';

    // Header toggle
    const h3s = Array.from(document.querySelectorAll('h3, h2'));
    const addrHeader = h3s.find(h => h.textContent.includes("SHIPPING DETAILS") || h.textContent.includes("CUSTOMER DETAILS"));
    if (addrHeader) addrHeader.textContent = isDigitalOnly ? "CUSTOMER DETAILS" : "SHIPPING DETAILS";
}

// --- NEW SHIPPING & COD LOGIC ---
const EKART_RATES = {
    'A': 34.22,
    'B': 42.48, // Within State (Madhya Pradesh)
    'C': 49.56, // Metro
    'D': 59.00, // Rest of India (Default)
    'E': 67.26  // NE & J&K
};

const COD_CHARGES = {
    BASE: 36.58,
    PERCENTAGE: 0.0224 // 2.24%
};

function getZoneFromPincode(pincode) {
    if (!pincode || pincode.length !== 6) return null;

    const prefix3 = pincode.substring(0, 3);
    const prefix2 = pincode.substring(0, 2);

    // 1. Same City Check (Jabalpur - Origin)
    if (prefix3 === '482') return 'A';

    // 2. Metro check (Mumbai, Delhi, Chennai, Kolkata, Bangalore, Hyderabad)
    const metros = ['11', '40', '60', '70', '56', '50'];
    if (metros.includes(prefix2)) return 'C';

    // 3. Local state check (Madhya Pradesh prefixes: 45-48)
    const localPrefixes = ['45', '46', '47', '48'];
    if (localPrefixes.includes(prefix2)) return 'B';

    // 4. NE & J&K check
    const remotePrefixes = ['79', '18', '19'];
    if (remotePrefixes.includes(prefix2)) return 'E';

    // 5. Rest of India
    return 'D';
}

function calculateShipping(items = []) {
    // Only charge shipping if there's at least one physical item
    const hasPhysical = items.some(isItemPhysical);

    if (!hasPhysical) return 0;

    // Check Free Shipping offers
    const subtotalINR = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const freeShippingOffer = activeOffers.find(o => o.offerType === 'FreeShipping' && o.isActive !== false);
    if (freeShippingOffer && freeShippingOffer.shippingRules) {
        const rules = freeShippingOffer.shippingRules;
        let isEligible = true;
        
        // 1. Min amount check
        if (subtotalINR < (rules.minAmount || 0)) {
            isEligible = false;
        }
        
        // 2. Category check
        if (isEligible && rules.categorySlug) {
            const hasCategory = items.some(item => {
                const dbProd = allDbProducts.find(p => p._id === item.id || p._id === item.productId);
                const prodCategories = dbProd ? (dbProd.categories || []) : [];
                return prodCategories.some(c => c.toLowerCase() === rules.categorySlug.toLowerCase()) || 
                       (item.type && item.type.toLowerCase() === rules.categorySlug.toLowerCase());
            });
            if (!hasCategory) isEligible = false;
        }
        
        // 3. Coupon code check
        if (isEligible && rules.couponCode) {
            const appliedCode = appliedCoupon ? appliedCoupon.code : '';
            if (appliedCode.toUpperCase() !== rules.couponCode.toUpperCase()) {
                isEligible = false;
            }
        }
        
        if (isEligible) {
            console.log("Free shipping applied via offer:", freeShippingOffer.name);
            return 0;
        }
    }

    const selectedCountry = currentRegion || localStorage.getItem('efv_selected_country') || 'IN';
    const isIndia = (selectedCountry === 'IN' || selectedCountry === 'India' || selectedCountry === 'IND');
    if (!isIndia) {
        return 0; // International POD delivery included in regional pricing
    }

    const pinInput = document.getElementById('ship-pincode');
    const pin = pinInput ? pinInput.value.trim() : '';
    if (!pin) {
        return EKART_RATES['D'] || 80; // Standard baseline shipping until pincode is verified
    }

    const zone = getZoneFromPincode(pin);
    const rate = EKART_RATES[zone] || EKART_RATES['D'] || 80;
    return rate;
}

function calculateCOD(subtotal) {
    const charge = COD_CHARGES.BASE + (subtotal * COD_CHARGES.PERCENTAGE);
    return Math.round(charge * 100) / 100;
}

function setupPaymentModeHandlers(items = []) {
    const optionCod = document.getElementById('option-cod');

    const hasDigital = isDigitalOrder || items.some(item => {
        const type = (item.type || '').toUpperCase();
        return type === 'EBOOK' || type === 'AUDIOBOOK';
    });

    if (hasDigital) {
        if (optionCod) optionCod.style.display = 'none';
        selectedPaymentMode = 'Online';
        const onlineRadio = document.getElementById('radio-online');
        if (onlineRadio) onlineRadio.checked = true;
    } else {
        if (optionCod) optionCod.style.display = 'flex';
    }

    const updateUIState = (mode) => {
        selectedPaymentMode = mode;
        document.querySelectorAll('.payment-option').forEach(opt => {
            const radio = opt.querySelector('input');
            if (radio) {
                if (radio.value === mode) {
                    opt.classList.add('active');
                    radio.checked = true;
                } else {
                    opt.classList.remove('active');
                }
            }
        });
        renderSummary(null, true);
    };

    // Attach click to parent cards
    document.querySelectorAll('.payment-option').forEach(card => {
        card.addEventListener('click', function (e) {
            const radio = this.querySelector('input');
            if (radio) {
                updateUIState(radio.value);
            }
        });
    });

    // Handle direct radio changes
    document.querySelectorAll('input[name="payment-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) updateUIState(e.target.value);
        });
    });

    // Initialize
    const checked = document.querySelector('input[name="payment-mode"]:checked');
    if (checked) updateUIState(checked.value);
}

function setupCouponHandlers() {
    const applyBtn = document.getElementById('apply-coupon-btn');
    const input = document.getElementById('coupon-input');

    applyBtn.addEventListener('click', () => {
        const code = input.value.trim();
        if (!code) return;
        applyCoupon(code, checkoutSubtotal);
    });
}

async function applyCoupon(code, amount) {
    const status = document.getElementById('coupon-status');
    const applyBtn = document.getElementById('apply-coupon-btn');

    status.style.display = 'block';
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    status.style.color = 'white';
    applyBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/coupons/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, amount })
        });

        const data = await res.json();

        if (res.ok) {
            appliedCoupon = data;
            localStorage.setItem('efv_applied_coupon', data.code);
            status.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fas fa-check-circle"></i> Coupon <strong>${data.code}</strong> applied!</span>
                    <button onclick="removeCoupon()" style="background: transparent; border: none; color: #ff4757; cursor: pointer; font-size: 0.75rem; text-decoration: underline; font-weight: 700;">REMOVE</button>
                </div>
            `;
            status.style.color = '#2ed573';
            renderSummary(null, true);
        } else {
            appliedCoupon = null;
            localStorage.removeItem('efv_applied_coupon');
            status.innerHTML = `<i class="fas fa-times-circle"></i> ${data.message || 'Invalid coupon'}`;
            status.style.color = '#ff4757';
            renderSummary(null, true);
        }
    } catch (error) {
        status.innerHTML = 'Verification failed. Try again.';
        status.style.color = '#ff4757';
    } finally {
        applyBtn.disabled = false;
    }
}

window.removeCoupon = function () {
    appliedCoupon = null;
    localStorage.removeItem('efv_applied_coupon');
    const input = document.getElementById('coupon-input');
    const status = document.getElementById('coupon-status');
    if (input) input.value = '';
    if (status) {
        status.innerHTML = 'Coupon removed';
        status.style.color = 'rgba(255,255,255,0.5)';
        setTimeout(() => { if (!appliedCoupon) status.style.display = 'none'; }, 2000);
    }
    renderSummary(null, true);
};

let isServiceable = true; // Default to true for now, will be updated by check

function setupPincodeCheck(items) {
    const pinInput = document.getElementById('ship-pincode');
    const statusDiv = document.getElementById('serviceability-status');
    const statusText = statusDiv ? statusDiv.querySelector('.status-text') : null;
    const placeOrderBtn = document.getElementById('place-order-btn');

    if (!pinInput) return;

    // Filter characters in real-time according to selected country's postal rule
    pinInput.addEventListener('input', async (e) => {
        const activeRule = (typeof getPostalRule === 'function') ? getPostalRule(currentRegion) : null;
        if (activeRule && activeRule.allowedRegex) {
            const sanitized = e.target.value.replace(activeRule.allowedRegex, '');
            if (sanitized !== e.target.value) {
                e.target.value = sanitized;
            }
        }

        const pincode = e.target.value.trim();

        // 🟢 DIGITAL SKIPPING:
        const hasPhysical = items.some(isItemPhysical);

        if (!hasPhysical) {
            isServiceable = true;
            return;
        }

        // Check if selected country is International
        const selectedCountry = currentRegion || localStorage.getItem('efv_selected_country') || 'IN';
        const isIndia = (selectedCountry === 'IN' || selectedCountry === 'India' || selectedCountry === 'IND');

        // Dynamic validation on input
        if (pincode.length > 0) {
            const valRes = (typeof validatePostalCode === 'function') ? validatePostalCode(pincode, selectedCountry) : { isValid: true };
            if (valRes.isValid) {
                const errEl = document.getElementById('ship-pincode-error');
                if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
                const helpEl = document.getElementById('ship-pincode-helper');
                if (helpEl && activeRule && activeRule.helperText) helpEl.style.display = 'block';
                pinInput.style.borderColor = '';
            }
        }

        if (!isIndia) {
            const countryUpper = (selectedCountry || '').toUpperCase();
            const phoneVal = (document.getElementById('ship-phone')?.value || '').trim();
            const stateVal = (document.getElementById('ship-state')?.value || '').toLowerCase();
            const isRussia = countryUpper === 'RU' || countryUpper === 'RUSSIA' || phoneVal.startsWith('+7') || stateVal.includes('саратов') || stateVal.includes('россия');

            if (isRussia) {
                if (statusDiv) statusDiv.className = 'serviceability-info error';
                if (statusText) statusText.textContent = 'Sorry, delivery to Russia is currently not supported by our international print network.';
                isServiceable = false;
                if (placeOrderBtn) placeOrderBtn.disabled = true;
            } else {
                const valRes = (typeof validatePostalCode === 'function') ? validatePostalCode(pincode, selectedCountry) : { isValid: true };
                if (!activeRule || !activeRule.required || valRes.isValid || pincode.length >= (activeRule.minLength || 3)) {
                    if (statusDiv) statusDiv.className = 'serviceability-info success';
                    if (statusText) statusText.textContent = 'Great! International Delivery available for your area.';
                    isServiceable = true;
                    if (placeOrderBtn) placeOrderBtn.disabled = false;
                    renderSummary(null, true);
                } else {
                    if (statusDiv) statusDiv.className = 'serviceability-info';
                }
            }
            return;
        }

        // Only trigger Nimbus check for domestic India orders if pincode is exactly 6 digits
        if (pincode.length === 6 && /^\d+$/.test(pincode)) {
            // Calculate total weight (default 0.5kg/500g if missing)
            const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0.5) * item.quantity, 0);
            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            if (statusDiv) statusDiv.className = 'serviceability-info checking';
            if (statusText) statusText.textContent = 'Checking delivery with Nimbus...';
            isServiceable = false;

            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE}/api/nimbus/check-delivery`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        pickup_pincode: "482008", // Main Warehouse
                        delivery_pincode: pincode,
                        weight: totalWeight,
                        order_amount: totalAmount
                    })
                });

                const result = await response.json();

                if (result.status === true) {
                    if (statusDiv) statusDiv.className = 'serviceability-info success';
                    if (statusText) statusText.textContent = 'Great! Delivery available for your area.';
                    isServiceable = true;
                    if (placeOrderBtn) placeOrderBtn.disabled = false;
                } else {
                    console.warn("Shipping Serviceability Result:", result);
                    if (statusDiv) statusDiv.className = 'serviceability-info error';
                    if (statusText) {
                        if (result.message && (result.message.includes('Token') || result.message.includes('token'))) {
                            statusText.textContent = 'Shipping server is re-authenticating. Please try again in 5 seconds.';
                        } else {
                            statusText.textContent = result.message || 'Sorry, shipping not available for this pincode.';
                        }
                    }
                    isServiceable = false;
                    if (placeOrderBtn) placeOrderBtn.disabled = true;
                }
            } catch (error) {
                console.error('Serviceability check failed:', error);
                if (statusDiv) statusDiv.className = 'serviceability-info success';
                if (statusText) statusText.textContent = 'Network error. We will verify delivery manually.';
                isServiceable = true;
                if (placeOrderBtn) placeOrderBtn.disabled = false;
            }

            // RE-CALCULATE SHIPPING WHEN PINCODE IS VALIDATED
            renderSummary(null, true);
        } else {
            if (statusDiv) statusDiv.className = 'serviceability-info';
        }
    });

    // Validate on blur when customer leaves the postal code field
    pinInput.addEventListener('blur', () => {
        const hasPhysical = items.some(isItemPhysical);
        if (hasPhysical) {
            validatePostalCodeField(true);
        }
    });

    // Also check if pre-filled pincode (e.g. from saved address) exists
    if (pinInput && pinInput.value.trim()) {
        setTimeout(() => pinInput.dispatchEvent(new Event('input', { bubbles: true })), 200);
    }
}

let activeDiscountRules = [];
let activeOffers = [];
let allDbProducts = [];
let ordersCount = 0;

async function fetchDiscountRulesAndProducts() {
    try {
        const rulesRes = await fetch(`${API_BASE}/api/categories`);
        const rules = await rulesRes.json();
        activeDiscountRules = rules.filter(c => c.isActive !== false);

        const offersRes = await fetch(`${API_BASE}/api/offers`);
        const offers = await offersRes.json();
        activeOffers = offers.filter(o => o.isActive !== false);

        const prodRes = await fetch(`${API_BASE}/api/products`);
        allDbProducts = await prodRes.json();

        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const ordRes = await fetch(`${API_BASE}/api/orders/my-orders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (ordRes.ok) {
                    const orders = await ordRes.json();
                    ordersCount = orders.length;
                }
            } catch (e) {
                console.error("Failed to load user orders count", e);
            }
        }

        // After fetching, re-render the summary to apply discounts!
        renderSummary(null, true);
    } catch (e) {
        console.error("Failed to load discount rules or products:", e);
    }
}

function calculateDynamicDiscounts(checkoutItems) {
    let totalDiscountAmount = 0;
    const discountSummary = [];

    // Clone items so we can safely adjust quantities (especially for BOGO)
    const items = checkoutItems.map(item => ({ 
        ...item,
        quantity: Number(item.quantity || 0),
        price: Number(getPriceForCurrency(item) || 0)
    }));

    // Check if there is an explicitly claimed offer
    const claimedOfferId = localStorage.getItem('efv_checkout_offer_id');
    let claimedOffer = null;
    if (claimedOfferId && Array.isArray(activeOffers)) {
        claimedOffer = activeOffers.find(o => String(o._id || o.id) === String(claimedOfferId));
    }

    if (claimedOffer) {
        const offer = claimedOffer;
        const oType = offer.offerType || offer.type || 'Percentage';

        if (oType === 'Percentage' || oType === 'FlashSale' || oType === 'Festival') {
            const pct = Number(offer.discountValue || offer.discountRules?.percentage || 0);
            items.forEach(item => {
                const isApplicable = !offer.products || offer.products.length === 0 || offer.products.some(op => {
                    const opId = op.productId || op;
                    return String(opId) === String(item.id) || String(opId) === String(item.productId);
                });
                if (isApplicable) {
                    const itemDiscount = (item.price * item.quantity) * (pct / 100);
                    totalDiscountAmount += itemDiscount;
                }
            });
            if (totalDiscountAmount > 0) {
                discountSummary.push({
                    name: offer.name,
                    amount: totalDiscountAmount,
                    description: `${offer.name} (${pct}% OFF)`
                });
            }
        } else if (oType === 'Flat') {
            const amt = Number(offer.discountValue || offer.discountRules?.flatAmount || 0);
            items.forEach(item => {
                const isApplicable = !offer.products || offer.products.length === 0 || offer.products.some(op => {
                    const opId = op.productId || op;
                    return String(opId) === String(item.id) || String(opId) === String(item.productId);
                });
                if (isApplicable) {
                    const itemDiscount = Math.min(item.price * item.quantity, amt * item.quantity);
                    totalDiscountAmount += itemDiscount;
                }
            });
            if (totalDiscountAmount > 0) {
                discountSummary.push({
                    name: offer.name,
                    amount: totalDiscountAmount,
                    description: `${offer.name} (₹${amt} OFF)`
                });
            }
        } else if (oType === 'BOGO' && offer.buyXGetYRules) {
            const rules = offer.buyXGetYRules;
            if (rules.buyProductId && rules.freeProductId) {
                const buyItem = items.find(it => String(it.id) === String(rules.buyProductId) || String(it.productId) === String(rules.buyProductId));
                const freeItem = items.find(it => String(it.id) === String(rules.freeProductId) || String(it.productId) === String(rules.freeProductId));
                if (buyItem && buyItem.quantity >= rules.requiredQty && freeItem) {
                    const timesApplied = Math.floor(buyItem.quantity / rules.requiredQty);
                    const freeQtyEligible = timesApplied * rules.freeQty;
                    const actualFreeQty = Math.min(freeItem.quantity, freeQtyEligible);
                    const discountAmt = actualFreeQty * freeItem.price;
                    if (discountAmt > 0) {
                        totalDiscountAmount += discountAmt;
                        discountSummary.push({
                            name: offer.name,
                            amount: discountAmt,
                            description: `BOGO: Buy ${rules.requiredQty} Get ${rules.freeQty} Free`
                        });
                    }
                }
            }
        } else if (oType === 'Combo' && offer.comboRules) {
            const rules = offer.comboRules;
            if (Array.isArray(rules.products) && rules.products.length > 0) {
                const matchingItems = rules.products.map(pId => items.find(it => (String(it.id) === String(pId) || String(it.productId) === String(pId)) && it.quantity > 0)).filter(Boolean);
                if (matchingItems.length === rules.products.length) {
                    const maxSets = Math.min(...matchingItems.map(it => it.quantity));
                    if (maxSets > 0) {
                        const regularSum = matchingItems.reduce((sum, it) => sum + it.price, 0);
                        const comboPrice = Number(rules.comboPrice || 0);
                        if (regularSum > comboPrice) {
                            const comboDiscount = (regularSum - comboPrice) * maxSets;
                            totalDiscountAmount += comboDiscount;
                            discountSummary.push({
                                name: offer.name,
                                amount: comboDiscount,
                                description: `Combo Package Discount (${offer.name})`
                            });
                        }
                    }
                }
            }
        } else if (oType === 'FirstOrder' && offer.firstOrderRules) {
            const rules = offer.firstOrderRules;
            const val = Number(rules.discountValue || offer.discountValue || 0);
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            let firstOrderDiscount = 0;
            if (rules.discountType === 'Percentage') {
                firstOrderDiscount = subtotal * (val / 100);
            } else {
                firstOrderDiscount = val;
            }
            if (firstOrderDiscount > 0) {
                totalDiscountAmount += firstOrderDiscount;
                discountSummary.push({
                    name: offer.name,
                    amount: firstOrderDiscount,
                    description: `First Order Discount (${offer.name})`
                });
            }
        }
    } else {
        // Apply V2 Premium Offers first
        if (Array.isArray(activeOffers) && activeOffers.length > 0) {
            activeOffers.forEach(offer => {
                if (offer.isActive === false) return;
                
                // 1. First Order Offer
                if (offer.offerType === 'FirstOrder' && offer.firstOrderRules) {
                    const user = localStorage.getItem('efv_user');
                    if (user && ordersCount === 0) {
                        const rules = offer.firstOrderRules;
                        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        let firstOrderDiscount = 0;
                        if (rules.discountType === 'Percentage') {
                            firstOrderDiscount = subtotal * (Number(rules.discountValue) / 100);
                        } else {
                            firstOrderDiscount = Number(rules.discountValue);
                        }
                        if (firstOrderDiscount > 0) {
                            totalDiscountAmount += firstOrderDiscount;
                            discountSummary.push({
                                name: offer.name,
                                amount: firstOrderDiscount,
                                description: `First Order Discount (${offer.name})`
                            });
                        }
                    }
                }

                // 2. Buy X Get Y (BOGO)
                if (offer.offerType === 'BOGO' && offer.buyXGetYRules) {
                    const rules = offer.buyXGetYRules;
                    if (rules.buyProductId && rules.freeProductId) {
                        const buyItem = items.find(it => it.id === rules.buyProductId || it.productId === rules.buyProductId);
                        const freeItem = items.find(it => it.id === rules.freeProductId || it.productId === rules.freeProductId);
                        if (buyItem && buyItem.quantity >= rules.requiredQty && freeItem) {
                            const timesApplied = Math.floor(buyItem.quantity / rules.requiredQty);
                            const freeQtyEligible = timesApplied * rules.freeQty;
                            const actualFreeQty = Math.min(freeItem.quantity, freeQtyEligible);
                            const discountAmt = actualFreeQty * freeItem.price;
                            if (discountAmt > 0) {
                                totalDiscountAmount += discountAmt;
                                discountSummary.push({
                                    name: offer.name,
                                    amount: discountAmt,
                                    description: `BOGO: Buy ${rules.requiredQty} Get ${rules.freeQty} Free`
                                });
                                freeItem.quantity -= actualFreeQty;
                            }
                        }
                    }
                }

                // 3. Combo Offer
                if (offer.offerType === 'Combo' && offer.comboRules) {
                    const rules = offer.comboRules;
                    if (Array.isArray(rules.products) && rules.products.length > 0) {
                        const matchingItems = rules.products.map(pId => items.find(it => (it.id === pId || it.productId === pId) && it.quantity > 0)).filter(Boolean);
                        if (matchingItems.length === rules.products.length) {
                            const maxSets = Math.min(...matchingItems.map(it => it.quantity));
                            if (maxSets > 0) {
                                const regularSum = matchingItems.reduce((sum, it) => sum + it.price, 0);
                                const comboPrice = Number(rules.comboPrice || 0);
                                if (regularSum > comboPrice) {
                                    const comboDiscount = (regularSum - comboPrice) * maxSets;
                                    totalDiscountAmount += comboDiscount;
                                    discountSummary.push({
                                        name: offer.name,
                                        amount: comboDiscount,
                                        description: `Combo Package Discount (${offer.name})`
                                    });
                                    matchingItems.forEach(it => {
                                        it.quantity -= maxSets;
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Apply legacy active discount rules (e.g. from /api/categories)
    if (activeDiscountRules && activeDiscountRules.length > 0) {
        activeDiscountRules.forEach(rule => {
            if (rule.discountType === 'simple') {
                const discountPct = Number(rule.discountValue || 0);
                if (discountPct > 0) {
                    let ruleDiscount = 0;
                    items.forEach(item => {
                        if (item.quantity <= 0) return;
                        const dbProd = allDbProducts.find(p => p._id === item.id || p._id === item.productId);
                        const prodCategories = dbProd ? (dbProd.categories || []) : [];
                        const prodType = dbProd ? (dbProd.type || '') : (item.type || '');

                        const isMatch = prodType.toUpperCase() === rule.slug.toUpperCase() || 
                                        prodCategories.some(c => c.toUpperCase() === rule.slug.toUpperCase());

                        if (isMatch) {
                            const itemDiscount = (item.price * item.quantity) * (discountPct / 100);
                            ruleDiscount += itemDiscount;
                            item.quantity = 0;
                        }
                    });

                    if (ruleDiscount > 0) {
                        totalDiscountAmount += ruleDiscount;
                        discountSummary.push({
                            name: rule.name,
                            amount: ruleDiscount,
                            description: `${discountPct}% OFF on ${rule.name} products`
                        });
                    }
                }
            }

            if (rule.discountType === 'bundle') {
                const minQty = Number(rule.minQuantity || 2);
                const discountPct = Number(rule.discountValue || 0);
                
                let eligibleItems = [];
                let totalEligibleQty = 0;

                items.forEach(item => {
                    if (item.quantity <= 0) return;
                    const dbProd = allDbProducts.find(p => p._id === item.id || p._id === item.productId);
                    const prodCategories = dbProd ? (dbProd.categories || []) : [];
                    const prodType = dbProd ? (dbProd.type || '') : (item.type || '');

                    const isMatch = rule.slug.toUpperCase() === 'ALL' ||
                                    rule.slug.toUpperCase() === 'BUNDLE' ||
                                    rule.slug.toUpperCase() === 'VOLUME_DISCOUNT' ||
                                    prodType.toUpperCase() === rule.slug.toUpperCase() ||
                                    prodCategories.some(c => c.toUpperCase() === rule.slug.toUpperCase());
                    
                    if (isMatch) {
                        eligibleItems.push(item);
                        totalEligibleQty += item.quantity;
                    }
                });

                if (totalEligibleQty >= minQty && discountPct > 0) {
                    let ruleDiscount = 0;
                    eligibleItems.forEach(item => {
                        const itemDiscount = (item.price * item.quantity) * (discountPct / 100);
                        ruleDiscount += itemDiscount;
                        item.quantity = 0;
                    });

                    if (ruleDiscount > 0) {
                        totalDiscountAmount += ruleDiscount;
                        discountSummary.push({
                            name: rule.name,
                            amount: ruleDiscount,
                            description: `${discountPct}% OFF for buying ${minQty}+ books together`
                        });
                    }
                }
            }

            if (rule.discountType === 'bogo') {
                const buyTarget = (rule.bogoBuySlug || 'Hindi').toLowerCase();
                const getTarget = (rule.bogoGetSlug || 'English').toLowerCase();

                const buyItems = items.filter(it => {
                    if (it.quantity <= 0) return false;
                    const dbProd = allDbProducts.find(p => p._id === it.id || p._id === it.productId);
                    const lang = (dbProd ? dbProd.language : it.language) || '';
                    return lang.toLowerCase().includes(buyTarget) || it.name.toLowerCase().includes(buyTarget);
                });

                const getItems = items.filter(it => {
                    if (it.quantity <= 0) return false;
                    const dbProd = allDbProducts.find(p => p._id === it.id || p._id === it.productId);
                    const lang = (dbProd ? dbProd.language : it.language) || '';
                    return lang.toLowerCase().includes(getTarget) || it.name.toLowerCase().includes(getTarget);
                });

                buyItems.forEach(buyIt => {
                    const buyDbProd = allDbProducts.find(p => p._id === buyIt.id || p._id === buyIt.productId);
                    const buyVolume = buyDbProd ? buyDbProd.volume : (buyIt.volume || '');

                    const match = getItems.find(getIt => {
                        if (getIt.quantity <= 0 || buyIt.quantity <= 0) return false;
                        const getDbProd = allDbProducts.find(p => p._id === getIt.id || p._id === getIt.productId);
                        const getVolume = getDbProd ? getDbProd.volume : (getIt.volume || '');

                        const cleanBuyName = buyIt.name.replace(/english/i, '').replace(/hindi/i, '').replace(/\(.*\)/, '').replace(/[™®]/g, '').trim().toLowerCase();
                        const cleanGetName = getIt.name.replace(/english/i, '').replace(/hindi/i, '').replace(/\(.*\)/, '').replace(/[™®]/g, '').trim().toLowerCase();

                        return (getVolume && buyVolume && getVolume === buyVolume) || (cleanBuyName && cleanBuyName === cleanGetName);
                    });

                    if (match) {
                        const bogoQty = Math.min(buyIt.quantity, match.quantity);
                        const matchPrice = getPriceForCurrency(match);
                        const bogoDiscount = matchPrice * bogoQty;
                        totalDiscountAmount += bogoDiscount;
                        discountSummary.push({
                            name: rule.name,
                            amount: bogoDiscount,
                            description: `Free ${rule.bogoGetSlug || 'English'} Edition for buying ${rule.bogoBuySlug || 'Hindi'} Edition`
                        });
                        match.quantity -= bogoQty;
                        buyIt.quantity -= bogoQty;
                    }
                });
            }
        });
    }

    return { totalDiscountAmount, discountSummary };
}

let currentCheckoutItems = [];

function renderSummary(items, isRefresh = false) {
    if (items) currentCheckoutItems = items;

    const list = document.getElementById('checkout-items-list');
    let subtotal = 0;
    let subtotalINR = 0;
    const sym = getCurrencySymbol();

    list.innerHTML = currentCheckoutItems.map((item, index) => {
        const itemPrice = getPriceForCurrency(item);
        subtotal += itemPrice * item.quantity;
        subtotalINR += item.price * item.quantity;
        const imgPath = item.thumbnail || (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png');
        return `
            <div class="checkout-item" style="align-items: flex-start;">
                <img src="${imgPath}" alt="${item.name}" class="checkout-item-img" onerror="this.src='${CONFIG.BASE_PATH}assets/images/vol1-cover.png'">
                <div class="checkout-item-info" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                    <div>
                        <div class="checkout-item-title">${item.name}</div>
                        <div class="checkout-item-meta" style="margin-bottom: 15px;">
                            ${item.subtitle || ''} <span style="opacity: 0.7; font-size: 0.85em; margin-left: 5px;">( ${sym}${itemPrice.toFixed(2)} / item )</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-top: auto;">
                        <div class="qty-control" style="display:flex; align-items:center; gap: 10px;">
                            <button onclick="updateCheckoutQty(${index}, -1)" style="background:rgba(255, 211, 105, 0.1); border:1px solid var(--gold-energy); color:var(--gold-energy); width:28px; height:28px; border-radius:6px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; transition: 0.2s;">-</button>
                            <span style="font-weight:800; color:#fff; width: 20px; text-align: center;">${item.quantity}</span>
                            <button onclick="updateCheckoutQty(${index}, 1)" style="background:rgba(255, 211, 105, 0.1); border:1px solid var(--gold-energy); color:var(--gold-energy); width:28px; height:28px; border-radius:6px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; transition: 0.2s;">+</button>
                        </div>
                        <div style="font-weight: 800; font-size: 1.1rem; color: var(--gold-energy);">${sym}${(itemPrice * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const currentMode = selectedPaymentMode;
    const shippingCharge = convertToCurrency(calculateShipping(currentCheckoutItems));
    const codCharge = convertToCurrency(calculateCOD(subtotalINR, currentMode));

    const codRow = document.getElementById('cod-charge-row');
    const codDisplay = document.getElementById('summary-cod');
    const placeBtn = document.getElementById('place-order-btn');

    document.getElementById('summary-subtotal').textContent = `${sym}${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `${sym}${shippingCharge.toFixed(2)}`;

    if (codRow) {
        codRow.style.display = 'flex';
        if (codDisplay) {
            if (currentMode === 'COD') {
                codDisplay.textContent = `${sym}${codCharge.toFixed(2)}`;
                codDisplay.style.color = '#FFD369';
                codDisplay.style.opacity = '1';
            } else {
                codDisplay.textContent = `${sym}0.00`;
                codDisplay.style.color = 'rgba(255,255,255,0.3)';
                codDisplay.style.opacity = '0.5';
            }
        }

        if (currentMode === 'COD') {
            if (placeBtn) placeBtn.innerHTML = 'PLACE ORDER <i class="fas fa-arrow-right"></i>';
        } else {
            if (placeBtn) placeBtn.innerHTML = 'PAY NOW <i class="fas fa-arrow-right"></i>';
        }
    }

    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'Percentage') {
            discount = (subtotal * appliedCoupon.value) / 100;
        } else {
            discount = currentRegion !== 'IN' ? convertToCurrency(appliedCoupon.value) : appliedCoupon.value;
        }
    }

    // Handle Dynamic Discounts (Bundle, BOGO)
    const dynamicResults = calculateDynamicDiscounts(currentCheckoutItems);
    const dynamicDiscountAmt = dynamicResults.totalDiscountAmount;

    const finalCodCharge = (currentMode === 'COD') ? codCharge : 0;
    const total = Math.max(0, subtotal - discount - dynamicDiscountAmt + shippingCharge + finalCodCharge);
    checkoutSubtotal = subtotalINR;

    let summaryBox = document.querySelector('.checkout-summary');
    
    // Clear old dynamic discount rows
    document.querySelectorAll('.dynamic-discount-row').forEach(el => el.remove());

    // Render dynamic discount rows
    dynamicResults.discountSummary.forEach((ds, idx) => {
        const row = document.createElement('div');
        row.className = 'checkout-total-row dynamic-discount-row';
        row.style.color = '#2ed573';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.marginBottom = '10px';
        row.innerHTML = `<span>Offer: ${ds.name}</span> <span>-${sym}${ds.amount.toFixed(2)}</span>`;
        summaryBox.insertBefore(row, document.querySelector('.grand-total'));
    });

    let existingDiscountRow = document.getElementById('summary-discount-row');

    if (discount > 0) {
        if (!existingDiscountRow) {
            const row = document.createElement('div');
            row.className = 'checkout-total-row';
            row.id = 'summary-discount-row';
            row.style.color = '#2ed573';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.marginBottom = '10px';
            row.innerHTML = `<span>Discount (${appliedCoupon.code})</span> <span id="summary-discount">-${sym}${discount.toFixed(2)}</span>`;
            summaryBox.insertBefore(row, document.querySelector('.grand-total'));
        } else {
            existingDiscountRow.innerHTML = `<span>Discount (${appliedCoupon.code})</span> <span id="summary-discount">-${sym}${discount.toFixed(2)}</span>`;
        }
    } else if (existingDiscountRow) {
        existingDiscountRow.remove();
    }

    document.getElementById('summary-total').textContent = `${sym}${total.toFixed(2)}`;
}

function showToast(msg) {
    const toast = document.getElementById('checkout-toast');
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3000);
}

function setupPlaceOrder(items, user) {
    const btn = document.getElementById('place-order-btn');
    const form = document.getElementById('shipping-form');

    btn.addEventListener('click', async () => {
        // 1. Validation
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (!validatePhone()) {
            return;
        }
        
        const phoneInput = document.getElementById('ship-phone');
        let phone = currentCountryData.dialCode + phoneInput.value.trim();
        
        // Use libphonenumber to get clean E.164 format
        try {
            if (typeof libphonenumber !== 'undefined') {
                const phoneNumber = libphonenumber.parsePhoneNumber(phoneInput.value.trim(), currentCountryData.iso2);
                if (phoneNumber) phone = phoneNumber.number; // Returns +337694045090
            }
        } catch (e) {
            console.warn("Could not format number with libphonenumber, using fallback.");
        }
        const pincode = document.getElementById('ship-pincode').value;

        // Check if shipping is needed
        const hasPhysical = items.some(isItemPhysical);

        let finalPincode = '000000';
        if (hasPhysical) {
            const postalValidation = (typeof validatePostalCode === 'function')
                ? validatePostalCode(pincode, currentRegion)
                : { isValid: (pincode.length >= 3 && pincode.length <= 10), normalized: pincode };

            if (!postalValidation.isValid) {
                validatePostalCodeField(true);
                const pinInput = document.getElementById('ship-pincode');
                if (pinInput) {
                    pinInput.focus();
                    pinInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                alert(postalValidation.error || 'Please enter a valid postal code.');
                return;
            }

            finalPincode = postalValidation.normalized || pincode.trim();

            if (!isServiceable) {
                alert('Your location is currently not serviceable. Please choose another address.');
                return;
            }
        }

        let countryName = 'India';
        if (hasPhysical) {
            if (countryNameMap[currentRegion]) {
                countryName = countryNameMap[currentRegion];
            } else if (window.countryToMetadata) {
                const foundKey = Object.keys(window.countryToMetadata).find(k => window.countryToMetadata[k].code === currentRegion);
                if (foundKey) {
                    countryName = foundKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                } else {
                    countryName = currentRegion;
                }
            } else {
                countryName = currentRegion;
            }
        }

        const address = {
            name: document.getElementById('ship-name').value,
            phone: phone,
            email: document.getElementById('ship-email').value,
            street: hasPhysical ? document.getElementById('ship-address').value : 'Digital Delivery',
            area: hasPhysical ? document.getElementById('ship-area').value : 'N/A',
            city: hasPhysical ? document.getElementById('ship-city').value : 'Digital',
            state: hasPhysical ? document.getElementById('ship-state').value : 'Digital',
            pincode: finalPincode,
            country: countryName
        };

        localStorage.setItem('shippingAddress', JSON.stringify(address));

        // Calculate Totals using dynamic logic
        let subtotal = 0;
        let subtotalINR = 0;
        items.forEach(item => {
            subtotal += getPriceForCurrency(item) * item.quantity;
            subtotalINR += item.price * item.quantity;
        });

        const shipping = convertToCurrency(calculateShipping(items));
        const checkedRadio = document.querySelector('input[name="payment-mode"]:checked');
        const mode = checkedRadio ? checkedRadio.value : 'Online';
        const isCOD = mode === 'COD';
        const cod = isCOD ? convertToCurrency(calculateCOD(subtotalINR)) : 0;

        let discount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === 'Percentage') {
                discount = (subtotal * appliedCoupon.value) / 100;
            } else {
                discount = currentRegion !== 'IN' ? convertToCurrency(appliedCoupon.value) : appliedCoupon.value;
            }
        }

        // Calculate dynamic discounts (bundle, BOGO)
        const dynamicResults = calculateDynamicDiscounts(items);
        const dynamicDiscountAmt = dynamicResults.totalDiscountAmount;

        if (isCOD && isDigitalOrder) {
            alert('Digital items (E-book/Audiobook) cannot be purchased via COD. Please select Online Payment.');
            // Force reset UI
            const optionCod = document.getElementById('option-cod');
            if (optionCod) optionCod.style.display = 'none';
            document.querySelector('input[name="payment-mode"][value="Online"]').checked = true;
            return;
        }

        const finalAmount = Math.max(0, subtotal - discount - dynamicDiscountAmt + shipping + cod);
        const orderId = 'EFV-' + Date.now() + Math.floor(Math.random() * 1000);

        const orderData = {
            orderId: orderId,
            userEmail: user.email,
            products: items.map(item => ({
                ...item,
                price: getPriceForCurrency(item)
            })),
            totalAmount: Math.round(finalAmount),
            discountAmount: Math.round(discount + dynamicDiscountAmt),
            shippingCharge: shipping,
            codCharge: cod,
            paymentMethod: isCOD ? 'COD' : 'Online',
            shippingAddress: address,
            paymentStatus: isCOD ? 'Pending' : 'Pending',
            orderStatus: isCOD ? 'Processing' : 'Awaiting Payment',
            orderDate: new Date().toISOString(),
            currency: (typeof REGIONAL_CONFIG !== 'undefined' && REGIONAL_CONFIG[currentRegion]) ? REGIONAL_CONFIG[currentRegion].code : (localStorage.getItem('efv_paid_currency') || 'INR')
        };

        // Save to localStorage "orders"
        let allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        allOrders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(allOrders));

        if (isCOD) {
            showToast('COD Order Received! Redirecting...');
            // CALL DIRECT COD ORDER API
            await placeCODOrder(orderData, appliedCoupon ? appliedCoupon.code : null);
        } else {
            showToast('Initializing Cashfree Payment...');
            try {
                await initCashfree(orderData, appliedCoupon ? appliedCoupon.code : null);
            } catch (err) {
                console.error('Cashfree initialization error:', err);
                alert('Payment Error: ' + err.message);
                const btn = document.getElementById('place-order-btn');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'PLACE ORDER <i class="fas fa-arrow-right"></i>';
                }
            }
        }
    });
}



// Dynamically load Cashfree checkout JS
function loadCashfreeScript() {
    return new Promise((resolve, reject) => {
        if (window.Cashfree) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
        document.head.appendChild(script);
    });
}

async function initCashfree(order, couponCode = null) {
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING CASHFREE...';

    try {
        const configRes = await fetch(`${API_BASE}/api/orders/config`);
        const config = await configRes.json();

        // Resolve exact country currency (e.g. EUR for Italy, USD for US, GBP for UK, INR for India)
        const region = REGIONAL_CONFIG[currentRegion] || REGIONAL_CONFIG['US'];
        const activeCurrency = order.currency || (region ? region.code : 'USD');

        localStorage.setItem('efv_paid_currency', activeCurrency);
        if (couponCode) {
            localStorage.setItem('efv_applied_coupon', couponCode);
        }

        const response = await fetch(`${API_BASE}/api/orders/cashfree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                amount: order.totalAmount,
                currency: activeCurrency,
                customerName: order.shippingAddress.name,
                customerEmail: order.shippingAddress.email,
                customerPhone: order.shippingAddress.phone
            })
        });

        const cfData = await response.json();
        if (!response.ok) throw new Error(cfData.message || 'Cashfree order creation failed');

        await loadCashfreeScript();

        const cashfree = window.Cashfree({
            mode: config.cashfreeMode === 'production' ? 'production' : 'sandbox'
        });

        cashfree.checkout({
            paymentSessionId: cfData.payment_session_id
        });

    } catch (e) {
        alert('Payment Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function placeCODOrder(orderData, couponCode) {
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PLACING COD ORDER...';

    try {
        const response = await fetch(`${API_BASE}/api/orders/cod`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                orderId: orderData.orderId,
                customer: orderData.shippingAddress,
                items: orderData.products.map(i => ({ productId: i.id || i.productId, quantity: i.quantity })),
                totalAmount: orderData.totalAmount,
                shippingCharge: orderData.shippingCharge,
                codCharge: orderData.codCharge,
                couponCode: couponCode,
                offerId: localStorage.getItem('efv_checkout_offer_id') || '',
                language: localStorage.getItem('efv_lang') || 'en',
                paymentCurrency: orderData.currency || localStorage.getItem('efv_paid_currency') || localStorage.getItem('efv_checkout_currency') || 'INR',
                locale: navigator.language || 'en-US'
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'COD Placement Failed');

        if (!localStorage.getItem('directCheckout')) {
            localStorage.removeItem('efv_cart');
        }
        localStorage.removeItem('directCheckout');
        localStorage.removeItem('efv_checkout_offer_id');

        showToast('✅ Order Placed Successfully!');
        setTimeout(() => {
            window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html?tab=orders';
        }, 1500);

    } catch (e) {
        alert('COD Order Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function initRazorpay(order, couponCode = null) {
    const btn = document.getElementById('place-order-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING RAZORPAY...';

    try {
        // 1. Fetch Razorpay Key ID from backend config
        const configRes = await fetch(`${API_BASE}/api/orders/config`);
        const config = await configRes.json();
        const keyId = config.razorpayKeyId;
        if (!keyId) throw new Error('Razorpay key not found in server config.');

        // 2. Create Razorpay Order on backend
        // Resolve country & currency from localStorage (set when user selects address country)
        const selectedCountry = localStorage.getItem('efv_selected_country') || localStorage.getItem('efv_country_selected') || order.shippingAddress?.country || 'India';
        const resolvedCurrency = order.currency || 'INR';
        console.log(`💱 Checkout Currency: ${resolvedCurrency} (Country: ${selectedCountry})`);

        const response = await fetch(`${API_BASE}/api/orders/razorpay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                amount: order.totalAmount,
                currency: resolvedCurrency,
                country: selectedCountry,
                customerName: order.shippingAddress.name,
                customerEmail: order.shippingAddress.email,
                customerPhone: order.shippingAddress.phone
            })
        });

        const rzpData = await response.json();
        if (!response.ok) throw new Error(rzpData.message || 'Razorpay order creation failed');

        // 3. Dynamically load Razorpay SDK (if not already loaded)
        await loadRazorpayScript();

        // 4. Open Razorpay Checkout Modal
        const options = {
            key: keyId,
            amount: rzpData.amount,        // paise from backend
            currency: rzpData.currency || 'INR',
            name: 'Extraordinary Founder Vault',
            description: 'Order Payment',
            image: CONFIG.BASE_PATH + 'assets/images/logo.png',
            order_id: rzpData.rzpOrderId,
            prefill: {
                name: order.shippingAddress.name,
                email: order.shippingAddress.email,
                contact: order.shippingAddress.phone
            },
            notes: {
                couponCode: couponCode || ''
            },
            theme: { color: '#c9a84c' },

            handler: async function (rzpResponse) {
                // 5. Verify on backend & fulfill order
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> VERIFYING PAYMENT...';

                try {
                    const verifyRes = await fetch(`${API_BASE}/api/orders/verify-razorpay`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: rzpResponse.razorpay_order_id,
                            razorpay_payment_id: rzpResponse.razorpay_payment_id,
                            razorpay_signature: rzpResponse.razorpay_signature,
                            customer: order.shippingAddress,
                            items: order.products,
                            couponCode: couponCode,
                            shippingCharge: order.shippingCharge,
                            codCharge: order.codCharge,
                            offerId: localStorage.getItem('efv_checkout_offer_id') || '',
                            language: localStorage.getItem('efv_lang') || 'en',
                            paymentCurrency: rzpData.currency || 'INR',
                            locale: navigator.language || 'en-US'
                        })
                    });

                    const result = await verifyRes.json();
                    if (!verifyRes.ok) throw new Error(result.message || 'Verification failed');

                    // Clear cart
                    if (!localStorage.getItem('directCheckout')) {
                        const user = JSON.parse(localStorage.getItem('efv_user'));
                        if (user && user.email) {
                            const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            localStorage.removeItem(`efv_cart_${cleanEmail}`);
                        }
                        localStorage.removeItem('efv_cart');
                    }
                    localStorage.removeItem('directCheckout');
                    localStorage.removeItem('efv_applied_coupon');
                    localStorage.removeItem('efv_checkout_offer_id');

                    showToast('✅ Payment Successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html?tab=orders';
                    }, 1500);

                } catch (verifyErr) {
                    alert('Payment was deducted but verification failed: ' + verifyErr.message +
                        '\nPlease contact support with Payment ID: ' + rzpResponse.razorpay_payment_id);
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            },

            modal: {
                ondismiss: function () {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            alert('Payment failed: ' + (response.error.description || 'Unknown error') +
                '\nReason: ' + (response.error.reason || ''));
            btn.disabled = false;
            btn.innerHTML = originalText;
        });
        rzp.open();

    } catch (e) {
        alert('Payment Error: ' + e.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Dynamically load Razorpay checkout JS
function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.head.appendChild(script);
    });
}

async function verifyCashfreePayment(cfOrderId, localOrder) {
    try {
        const res = await fetch(`${API_BASE}/api/orders/verify-cashfree`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                order_id: cfOrderId,
                currency: localStorage.getItem('efv_paid_currency') || (REGIONAL_CONFIG[currentRegion] ? REGIONAL_CONFIG[currentRegion].code : 'USD'),
                customer: {
                    name: localOrder.shippingAddress.name,
                    email: localOrder.shippingAddress.email,
                    phone: localOrder.shippingAddress.phone,
                    address: [localOrder.shippingAddress.street, localOrder.shippingAddress.area].filter(part => part && part !== 'undefined').join(', '),
                    city: localOrder.shippingAddress.city,
                    state: localOrder.shippingAddress.state,
                    pincode: localOrder.shippingAddress.pincode,
                    country: localOrder.shippingAddress.country
                },
                items: localOrder.products.map(i => ({
                    productId: i.id || i.productId,
                    quantity: i.quantity
                })),
                shippingCharge: localOrder.shippingCharge,
                codCharge: localOrder.codCharge,
                language: localStorage.getItem('efv_lang') || 'en',
                paymentCurrency: localStorage.getItem('efv_paid_currency') || (REGIONAL_CONFIG[currentRegion] ? REGIONAL_CONFIG[currentRegion].code : 'USD'),
                locale: navigator.language || 'en-US'
            })
        });

        const verification = await res.json();

        if (res.ok) {
            updateLocalOrderStatus(localOrder.orderId, 'Paid', 'Processing');
            if (!localStorage.getItem('directCheckout')) {
                localStorage.removeItem('efv_cart');
            }
            localStorage.removeItem('directCheckout');
            alert('✅ Payment Successful! Your order is being processed.');
            window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html?tab=orders';
        } else {
            throw new Error(verification.message || 'Verification Failed');
        }
    } catch (e) {
        alert('Verification Error: ' + e.message);
        location.reload();
    }
}

function updateLocalOrderStatus(orderId, paymentStatus, orderStatus) {
    let allOrders = JSON.parse(localStorage.getItem('orders')) || [];
    const idx = allOrders.findIndex(o => o.orderId === orderId);
    if (idx !== -1) {
        allOrders[idx].paymentStatus = paymentStatus;
        allOrders[idx].orderStatus = orderStatus;
        localStorage.setItem('orders', JSON.stringify(allOrders));
    }
}

function updatePhonePrefixUI() {
    const flagImg = document.getElementById('prefix-flag');
    const dialCodeSpan = document.getElementById('prefix-dial-code');
    
    if (flagImg) flagImg.src = `https://flagcdn.com/w40/${currentCountryData.iso2.toLowerCase()}.png`;
    if (dialCodeSpan) dialCodeSpan.textContent = currentCountryData.dialCode;
}

function updatePostalCodeUI() {
    const pinInput = document.getElementById('ship-pincode');
    const pinLabel = document.getElementById('ship-pincode-label');
    const helperEl = document.getElementById('ship-pincode-helper');
    const errorEl = document.getElementById('ship-pincode-error');
    if (!pinInput) return;

    const country = currentRegion || (currentCountryData ? currentCountryData.iso2 : 'IN');
    const rule = (typeof getPostalRule === 'function') ? getPostalRule(country) : {
        countryCode: 'IN',
        countryName: 'India',
        label: 'PIN Code',
        required: true,
        minLength: 6,
        maxLength: 6,
        placeholder: '482001',
        helperText: 'Enter 6-digit PIN code'
    };

    // 1. Update placeholder & title
    pinInput.placeholder = rule.placeholder || 'Postal Code';
    pinInput.setAttribute('placeholder', rule.placeholder || 'Postal Code');
    pinInput.title = `Format: ${rule.placeholder || rule.helperText}`;

    // 2. Update label & required status
    if (pinLabel) {
        if (!rule.required) {
            pinLabel.textContent = `${rule.label || 'Postal Code'} (Optional)`;
            pinInput.removeAttribute('required');
        } else {
            pinLabel.textContent = rule.label || 'PIN Code / Postal Code';
            pinInput.setAttribute('required', 'required');
        }
    }

    // 3. Update maxLength
    if (rule.maxLength) {
        pinInput.maxLength = rule.maxLength;
    } else {
        pinInput.removeAttribute('maxLength');
    }

    // 4. Update helper text
    if (helperEl) {
        helperEl.textContent = rule.helperText || '';
        helperEl.style.display = rule.helperText ? 'block' : 'none';
    }

    // 5. Clear previous errors & border styling on country switch
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
    pinInput.style.borderColor = '';
}

function validatePostalCodeField(showVisualError = false) {
    const pinInput = document.getElementById('ship-pincode');
    const errorEl = document.getElementById('ship-pincode-error');
    const helperEl = document.getElementById('ship-pincode-helper');
    if (!pinInput) return true;

    const val = pinInput.value.trim();
    const country = currentRegion || (currentCountryData ? currentCountryData.iso2 : 'IN');

    const result = (typeof validatePostalCode === 'function')
        ? validatePostalCode(val, country)
        : { isValid: (val.length >= 3 && val.length <= 10), normalized: val };

    if (!result.isValid) {
        if (showVisualError) {
            if (errorEl) {
                errorEl.textContent = result.error || 'Invalid postal code';
                errorEl.style.display = 'block';
            }
            if (helperEl) helperEl.style.display = 'none';
            pinInput.style.borderColor = '#ff4757';
        }
        return false;
    } else {
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
        const activeRule = (typeof getPostalRule === 'function') ? getPostalRule(country) : null;
        if (helperEl && activeRule && activeRule.helperText) {
            helperEl.style.display = 'block';
        }
        pinInput.style.borderColor = '';
        return true;
    }
}

function validatePhone() {
    const phoneInput = document.getElementById('ship-phone');
    const errorMsg = document.getElementById('phone-error-msg');
    const container = phoneInput.closest('.phone-input-container');

    if (!phoneInput || !errorMsg) return false;

    const number = phoneInput.value.trim();

    // 1. Check if empty
    if (!number) {
        errorMsg.textContent = "Please enter your phone number";
        errorMsg.style.display = 'block';
        if (container) container.style.borderColor = '#ff4757';
        return false;
    }

    try {
        if (typeof libphonenumber !== 'undefined') {
            const countryCode = currentCountryData.iso2;
            
            // 2. Validate length specifically for detailed error messages
            const lengthError = libphonenumber.validatePhoneNumberLength(number, countryCode);

            if (lengthError === 'TOO_SHORT') {
                errorMsg.textContent = "Phone number is too short for selected country";
            } else if (lengthError === 'TOO_LONG') {
                errorMsg.textContent = "Phone number is too long for selected country";
            } else if (lengthError === 'INVALID_LENGTH') {
                errorMsg.textContent = "Invalid phone number format";
            } else if (lengthError === 'INVALID_COUNTRY') {
                errorMsg.textContent = "Invalid country selected";
            } else {
                // If length is possible, check strict validity (regex/metatada)
                const phoneNumber = libphonenumber.parsePhoneNumber(number, countryCode);
                
                if (phoneNumber && phoneNumber.isValid()) {
                    // Success! Remove error
                    errorMsg.style.display = 'none';
                    if (container) container.style.borderColor = '';
                    return true;
                } else {
                    errorMsg.textContent = "Invalid phone number format";
                }
            }
        } else {
            // Fallback if libphonenumber is failed to load
            if (number.length >= 7 && number.length <= 15) {
                errorMsg.style.display = 'none';
                if (container) container.style.borderColor = '';
                return true;
            }
            errorMsg.textContent = "Invalid phone number format";
        }
    } catch (e) {
        console.warn("Validation error:", e.message);
        errorMsg.textContent = "Invalid phone number format";
    }

    // If we reached here, it's invalid
    errorMsg.style.display = 'block';
    if (container) container.style.borderColor = '#ff4757';
    return false;
}

window.updateCheckoutQty = function(index, change) {
    const item = currentCheckoutItems[index];
    if (!item) return;

    // Change quantity
    let newQty = item.quantity + change;
    if (newQty < 1) return; // Prevent going below 1

    item.quantity = newQty;

    // Update localStorage
    const directCheckout = JSON.parse(localStorage.getItem('directCheckout'));
    if (directCheckout) {
        if (Array.isArray(directCheckout)) {
            localStorage.setItem('directCheckout', JSON.stringify(currentCheckoutItems));
        } else {
            localStorage.setItem('directCheckout', JSON.stringify(currentCheckoutItems[0]));
        }
    } else {
        const user = JSON.parse(localStorage.getItem('efv_user'));
        const cartKey = (user && user.email) ? 'efv_cart_' + user.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'efv_cart';
        localStorage.setItem(cartKey, JSON.stringify(currentCheckoutItems));
    }

    // Re-evaluate subtotal (for coupon)
    checkoutSubtotal = currentCheckoutItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    // Re-render
    renderSummary(currentCheckoutItems, true);
    
    // Dispatch change event to update grand total
    const codRadio = document.getElementById('radio-cod') || document.getElementById('pay-cod');
    const onlineRadio = document.getElementById('radio-online') || document.getElementById('pay-online');
    if (codRadio && codRadio.checked) codRadio.dispatchEvent(new Event('change'));
    else if (onlineRadio) onlineRadio.dispatchEvent(new Event('change'));
};

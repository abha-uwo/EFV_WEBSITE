/**
 * EFV Marketplace - Dynamic Loading System v4.0
 * Renders all products from static data immediately.
 * Merges digital product filePaths from backend (admin-configured).
 */

// ─── Static Product Catalog ─────────────────────────────────────────────────
const STATIC_PRODUCTS = [

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 1 — ORIGIN CODE™  (Hindi Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v1_hardcover',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 599,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Physical',
        description: 'Learn the secrets of Energy and Alignment. Premium hardcover book.',
        language: 'Hindi',
        volume: '1'
    },
    {
        _id: 'efv_v1_paperback',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 299,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Physical',
        description: 'Learn the secrets of Energy and Alignment. Easy-to-carry paperback book.',
        language: 'Hindi',
        volume: '1'
    },
    {
        _id: 'efv_v1_ebook',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 149,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Digital',
        description: 'The complete digital version of Volume 1. Accessible on all devices.',
        language: 'Hindi',
        volume: '1'
    },
    {
        _id: 'efv_v1_audiobook',
        title: 'EFV™ VOL 1: ORIGIN CODE™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 199,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol1-cover.png',
        category: 'Digital',
        description: 'The immersive audio experience of Volume 1. Listen and align on the go.',
        language: 'Hindi',
        volume: '1'
    },

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 1 — ORIGIN CODE™  (English Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v1_hardcover_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 499,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Physical',
        description: 'The English hardcover edition of the foundational Volume 1.',
        language: 'English',
        volume: '1'
    },
    {
        _id: 'efv_v1_paperback_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 298,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Physical',
        description: 'Explore the secrets of Energy and Alignment in English. Easy-to-carry paperback.',
        language: 'English',
        volume: '1'
    },
    {
        _id: 'efv_v1_ebook_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 149,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Digital',
        description: 'The complete English digital version of Volume 1.',
        language: 'English',
        volume: '1'
    },
    {
        _id: 'efv_v1_audiobook_en',
        title: 'EFV™ VOL 1: THE ORIGIN CODE™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 199,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/english_v1.jpeg',
        category: 'Digital',
        description: 'The immersive English audio experience of Volume 1.',
        language: 'English',
        volume: '1'
    },

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 2 — MINDOS™  (Hindi Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v2_hardcover',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 649,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/Vol%202%20Cover%20EFV.png',
        category: 'Physical',
        description: 'An exploration of how thoughts and emotions shape our inner world.',
        language: 'Hindi',
        volume: '2'
    },
    {
        _id: 'efv_v2_paperback',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 449,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/Vol%202%20Cover%20EFV.png',
        category: 'Physical',
        description: 'Decoding Thought, Emotion & The Architecture Of The Human Mind.',
        language: 'Hindi',
        volume: '2'
    },
    {
        _id: 'efv_v2_ebook',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 199,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/Vol%202%20Cover%20EFV.png',
        category: 'Digital',
        description: 'The complete digital version of Volume 2. Accessible on all devices.',
        language: 'Hindi',
        volume: '2'
    },
    {
        _id: 'efv_v2_audiobook',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 249,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol2-cover.png',
        category: 'Digital',
        description: 'The immersive audio experience of Volume 2. Listen and align on the go.',
        language: 'Hindi',
        volume: '2',
        availability: 'Coming Soon'
    },

    // ══════════════════════════════════════════════════════════════
    //  VOLUME 2 — MINDOS™  (English Edition)
    // ══════════════════════════════════════════════════════════════
    {
        _id: 'efv_v2_hardcover_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Hardcover Edition',
        type: 'HARDCOVER',
        price: 699,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/Vol%202%20Cover%20EFV.png',
        category: 'Physical',
        description: 'The English hardcover edition of Volume 2. Explore the architecture of the human mind.',
        language: 'English',
        volume: '2'
    },
    {
        _id: 'efv_v2_paperback_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Paperback Edition',
        type: 'PAPERBACK',
        price: 499,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/Vol%202%20Cover%20EFV.png',
        category: 'Physical',
        description: 'The English paperback edition. Decoding Thought, Emotion & The Architecture Of The Human Mind.',
        language: 'English',
        volume: '2'
    },
    {
        _id: 'efv_v2_ebook_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'E-Book Edition',
        type: 'EBOOK',
        price: 249,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/Vol%202%20Cover%20EFV.png',
        category: 'Digital',
        description: 'The complete English digital version of Volume 2.',
        language: 'English',
        volume: '2'
    },
    {
        _id: 'efv_v2_audiobook_en',
        title: 'EFV™ VOL 2: MINDOS™',
        subtitle: 'Audiobook Edition',
        type: 'AUDIOBOOK',
        price: 299,
        thumbnail: CONFIG.BASE_PATH + 'assets/images/vol2-cover.png',
        category: 'Digital',
        description: 'The English audio experience of Volume 2.',
        language: 'English',
        volume: '2',
        availability: 'Coming Soon'
    }
];

// ─── Main Marketplace Logic ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    let allProducts = [...STATIC_PRODUCTS]; // Initial state
    let activeFilter = 'HARDCOVER';

    const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL
        : 'http://localhost:8080';

    // Publish product registry so openProductModal (cart.js) can access live data
    function publishLiveProducts() {
        window.EFV_LIVE_PRODUCTS = {};
        allProducts.forEach(p => {
            const id = p._id || p.id;
            if (id) window.EFV_LIVE_PRODUCTS[id] = p;
        });
    }

    // Step 1: Render static products IMMEDIATELY (filtered by default active filter)
    publishLiveProducts();
    applyFilter(true);

    // Step 2: Merge backend data and re-render
    mergeBackendData();

    // Step 3: Initialize Filters
    initFilters();

    async function mergeBackendData() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${API_BASE}/api/products`, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) return;
            const backendProducts = await response.json();
            if (!Array.isArray(backendProducts)) return;

            // Use backend products as the source of truth for the catalog
            allProducts = backendProducts.map(b => {
                const staticMatch = STATIC_PRODUCTS.find(sp => 
                    sp._id === b._id || 
                    sp._id === b.legacyId ||
                    ((sp.type || '').toUpperCase() === (b.type || '').toUpperCase() && 
                     (sp.language || '').toLowerCase() === (b.language || '').toLowerCase() && 
                     String(sp.volume) === String(b.volume))
                );
                if (staticMatch) {
                    const preserved = {
                        language: b.language || staticMatch.language,
                        thumbnail: b.thumbnail || staticMatch.thumbnail
                    };
                    return { ...staticMatch, ...b, ...preserved, _id: staticMatch._id };
                }
                return b;
            });

            console.log('🔄 Marketplace: Syncing with Admin inventory (Updates & Deletions)...');

            // Fetch and merge active offers
            try {
                const offRes = await fetch(`${API_BASE}/api/offers`);
                if (offRes.ok) {
                    const offersList = await offRes.json();
                    const activeOffers = (Array.isArray(offersList) ? offersList : []).filter(o => o.isActive !== false);
                    
                    allProducts.forEach(prod => {
                        const matchingOffer = activeOffers.find(o => {
                            if (o.products && Array.isArray(o.products)) {
                                return o.products.some(p => String(p.productId || p._id || p) === String(prod._id || prod.id));
                            }
                            if (o.applicableTo === 'all') return true;
                            if (o.applicableTo && (o.applicableTo.toUpperCase() === (prod.type || '').toUpperCase() || o.applicableTo.toUpperCase() === (prod.category || '').toUpperCase())) return true;
                            return false;
                        });

                        if (matchingOffer) {
                            prod.offerId = matchingOffer._id;
                            prod.offerBadge = matchingOffer.title || (matchingOffer.discountType === 'percentage' ? `${matchingOffer.discountValue}% OFF` : `SAVE`);
                            if (matchingOffer.discountType === 'percentage' && matchingOffer.discountValue) {
                                prod.discount = matchingOffer.discountValue;
                                if (!prod.originalPrice || prod.originalPrice <= prod.price) {
                                    prod.originalPrice = prod.price;
                                    prod.price = Math.round(prod.price * (1 - matchingOffer.discountValue / 100));
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                console.warn("Marketplace: offers fetch error:", e);
            }

            publishLiveProducts(); // Update live registry for modal
            applyFilter(); // Re-render with existing filter
        } catch (err) {
            console.log('ℹ️ Marketplace: Offline mode or timeout — using static catalog');
        }
    }

    async function initFilters() {
        const filtersContainer = document.getElementById('marketplace-filters');
        if (!filtersContainer) return;

        try {
            const res = await fetch(`${API_BASE}/api/categories`);
            const categories = await res.json();
            
            if (categories.length > 0) {
                // Only show product-type categories in marketplace (not offers or custom ones)
                const PRODUCT_TYPE_SLUGS = ['HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK'];
                const activeCategories = categories.filter(c => c.isActive !== false && PRODUCT_TYPE_SLUGS.includes(c.slug));
                const hasActive = activeCategories.some(c => c.slug === activeFilter);
                if (!hasActive && activeCategories.length > 0) {
                    activeFilter = activeCategories[0].slug;
                    applyFilter();
                }
                let buttonsHtml = '';
                activeCategories.forEach((c, idx) => {
                    const isActive = c.slug === activeFilter;
                    const translatedName = typeof window.t === 'function' 
                        ? window.t('marketplace_page.filter_' + c.slug.toLowerCase(), c.name) 
                        : c.name;
                    buttonsHtml += `<button class="filter-btn ${isActive ? 'active' : ''}" data-filter="${c.slug}">${translatedName}</button>`;
                });
                filtersContainer.innerHTML = buttonsHtml;
            } else {
                filtersContainer.innerHTML = `
                    <button class="filter-btn active" data-filter="HARDCOVER">Hardcover</button>
                    <button class="filter-btn" data-filter="PAPERBACK">Softcover</button>
                    <button class="filter-btn" data-filter="EBOOK">E-Book</button>
                    <button class="filter-btn" data-filter="AUDIOBOOK">Audiobook</button>
                `;
            }
        } catch (err) {
            console.error('Error loading filters dynamically:', err);
            filtersContainer.innerHTML = `
                <button class="filter-btn active" data-filter="HARDCOVER">Hardcover</button>
                <button class="filter-btn" data-filter="PAPERBACK">Softcover</button>
                <button class="filter-btn" data-filter="EBOOK">E-Book</button>
                <button class="filter-btn" data-filter="AUDIOBOOK">Audiobook</button>
            `;
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.filter;
                applyFilter();
            });
        });
    }

    function applyFilter(immediate = false) {
        if (!productGrid) return;

        let filtered = allProducts;
        if (activeFilter !== 'all') {
            filtered = allProducts.filter(p => p.type === activeFilter || (p.categories && p.categories.includes(activeFilter)));
        }

        if (immediate) {
            renderProducts(filtered, true);
            productGrid.style.opacity = '1';
            return;
        }

        // Add a small fade-out effect for smooth transition
        productGrid.style.opacity = '0.3';

        setTimeout(() => {
            renderProducts(filtered, true);
            productGrid.style.opacity = '1';
        }, 300);
    }

    function checkIsComingSoon(product) {
        // High priority: check explicit availability status from admin dashboard
        if (product.availability) {
            const status = product.availability.toLowerCase().replace(/\s+/g, '');
            if (status === 'comingsoon' || status === 'soon') {
                return true;
            }
            if (status === 'available' || status === 'instock' || status === 'outofstock' || status === 'unavailable') {
                return false;
            }
        }

        const rawType = (product.type || 'book').toLowerCase();
        const isVol2 = product.volume === '2' || product.volume === 2 || 
            (product._id || product.id || '').toLowerCase().includes('v2') ||
            (product.title || '').toLowerCase().includes('vol 2') ||
            (product.title || '').toLowerCase().includes('volume 2') ||
            (product.title || '').toLowerCase().includes('mindos');
        const isEnglish = (product.language || '').toLowerCase().includes('english') || (product._id || '').toLowerCase().includes('_en');

        // Audiobook Volume 2 is Coming Soon
        if (isVol2 && rawType === 'audiobook') {
            return true;
        }

        // If the product is in stock and has a price set, it is NOT coming soon
        const hasPrice = product.price && Number(product.price) > 0;
        const isDigital = product.category === 'Digital' || /^(ebook|audiobook)$/i.test(product.type);
        const hasStock = isDigital || (product.stock && Number(product.stock) > 0);
        if (hasPrice && hasStock) {
            return false;
        }

        let isSoon = isVol2;
        if (rawType === 'audiobook') {
            isSoon = isEnglish || isVol2;
        } else if (rawType === 'ebook' && !isVol2) {
            isSoon = false;
        }
        return isSoon;
    }

    /**
     * Checks if a product is out of stock based on backend stock field.
     * Stock = 0 (or missing/null from backend) → out of stock.
     * Note: Products that are "Coming Soon" are handled separately.
     * @param {object} product - The product object (merged static + backend).
     * @returns {boolean}
     */
    function checkIsOutOfStock(product) {
        // High priority: check explicit availability status from admin dashboard
        if (product.availability) {
            const status = product.availability.toLowerCase().replace(/\s+/g, '');
            if (status === 'outofstock' || status === 'unavailable') {
                return true;
            }
            if (status === 'comingsoon' || status === 'available' || status === 'instock') {
                return false;
            }
        }

        if (product.stock !== undefined && product.stock !== null && product.stock !== "") {
            return Number(product.stock) <= 0;
        }
        return false;
    }

    /**
     * Checks if this is the special Hindi Paperback product that should
     * redirect to NotionPress when out of stock.
     */
    function isHindiPaperback(product) {
        const lang = (product.language || '').toLowerCase();
        const type = (product.type || '').toLowerCase();
        return lang.includes('hindi') && type === 'paperback';
    }

    function renderProducts(products, clearExisting = false) {
        if (!productGrid) return;

        // Sort: Available (isComingSoon=false) first, then Coming Soon (isComingSoon=true)
        const sortedProducts = [...products].sort((a, b) => {
            const soonA = checkIsComingSoon(a);
            const soonB = checkIsComingSoon(b);
            if (soonA === soonB) return 0;
            return soonA ? 1 : -1;
        });

        if (clearExisting) {
            productGrid.innerHTML = ''; // Full refresh for backend updates
        }

        // Remove loading skeletons if present
        if (productGrid.querySelector('.loading-state')) {
            productGrid.innerHTML = '';
        }

        const existingIds = new Set(Array.from(productGrid.children).map(c => c.getAttribute('data-id')));

        sortedProducts.forEach(product => {
            const id = product._id || product.id;
            // If not clearing, only add new ones. If clearing, we add everything back.
            if (!existingIds.has(id) || clearExisting) {
                productGrid.appendChild(createProductCard(product));
            }
        });

        // Initialize scroll animations
        if (typeof revealObserver !== 'undefined') {
            document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
        }
        if (typeof updateMarketplaceButtons === 'function') {
            updateMarketplaceButtons();
        }
    }

    function createProductCard(product) {
        const rawType = (product.type || 'PHYSICAL').toLowerCase();

        // ─── Regional Pricing Logic (Updated for all supported nations) ───
        const selectedCountry = (localStorage.getItem('efv_selected_country') || 'IN').toUpperCase();
        const CURRENCY_MAP = {
            'IN': '₹', 'US': '$', 'GB': '£', 'CA': 'CA$', 'AU': 'AU$', 'NZ': 'NZ$',
            'FR': '€', 'DE': '€', 'ES': '€', 'IT': '€', 'PT': '€', 'NL': '€', 'BE': '€',
            'AT': '€', 'IE': '€', 'FI': '€', 'CH': 'CHF ', 'SE': 'kr ', 'NO': 'kr ', 'DK': 'kr ',
            'PL': 'zł ', 'AE': 'AED ', 'SA': 'SAR ', 'OM': 'OMR ', 'KW': 'KWD ', 'BH': 'BHD ',
            'QA': 'QAR ', 'SG': 'S$', 'MY': 'RM ', 'CN': '¥', 'JP': '¥', 'RU': '₽', 'KR': '₩',
            'BR': 'R$ ', 'MX': 'MX$ ', 'ZA': 'R ', 'HK': 'HK$', 'TH': '฿ ', 'ID': 'Rp ',
            'PHP': '₱ ', 'VN': '₫ '
        };
        const activeCurrency = CURRENCY_MAP[selectedCountry] || '$';

        const COUNTRY_KEYS = {
            'IN': 'India', 'US': 'UnitedStates', 'GB': 'UnitedKingdom', 'DE': 'Germany', 'FR': 'France', 'ES': 'Spain',
            'IT': 'Italy', 'PT': 'Portugal', 'AE': 'UnitedArabEmirates', 'SA': 'SaudiArabia', 'CN': 'China', 'JP': 'Japan', 'RU': 'Russia', 'KR': 'SouthKorea',
            'CA': 'Canada', 'AU': 'Australia', 'NZ': 'NewZealand', 'SG': 'Singapore'
        };
        const countryKey = COUNTRY_KEYS[selectedCountry];

        let displayPrice = product.price;
        let originalPriceVal = product.originalPrice;
        let hasLocalizedPrice = false;

        if (countryKey && product.countryPricing && product.countryPricing[countryKey]) {
            const cp = product.countryPricing[countryKey];
            if (cp.enabled !== false && cp.price !== undefined && cp.price !== null && cp.price !== '') {
                displayPrice = Number(cp.price);
                originalPriceVal = cp.mrp !== undefined && cp.mrp !== null && cp.mrp !== '' ? Number(cp.mrp) : null;
                hasLocalizedPrice = true;
            }
        }

        if (!hasLocalizedPrice) {
            // Use backend's regional price if available, else derive from provided table
            const regionalData = product.regionalPrices ? (product.regionalPrices instanceof Map ? Object.fromEntries(product.regionalPrices) : product.regionalPrices) : {};

            if (regionalData && regionalData[selectedCountry]) {
                displayPrice = regionalData[selectedCountry];
            } else if (selectedCountry !== 'IN') {
                // Intelligent Fallback Based on User Requests
                const pricingTable = {
                    'US': { 'audiobook': 6.99, 'ebook': 8.99, 'hindi_paperback': 14.99, 'hindi_hardcover': 22.99, 'english_paperback': 17.99, 'english_hardcover': 26.99 },
                    'GB': { 'audiobook': 5.99, 'ebook': 6.99, 'hindi_paperback': 11.99, 'hindi_hardcover': 18.99, 'english_paperback': 13.99, 'english_hardcover': 21.99 },
                    'FR': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
                    'DE': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
                    'ES': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
                    'IT': { 'audiobook': 6.99, 'ebook': 7.99, 'hindi_paperback': 12.99, 'hindi_hardcover': 19.99, 'english_paperback': 14.99, 'english_hardcover': 23.99 },
                    'AE': { 'audiobook': 25.00, 'ebook': 30.00, 'hindi_paperback': 55.00, 'hindi_hardcover': 85.00, 'english_paperback': 65.00, 'english_hardcover': 95.00 },
                    'CN': { 'audiobook': 50.00, 'ebook': 65.00, 'hindi_paperback': 110.00, 'hindi_hardcover': 165.00, 'english_paperback': 130.00, 'english_hardcover': 195.00 },
                    'JP': { 'audiobook': 1000, 'ebook': 1300, 'hindi_paperback': 2200, 'hindi_hardcover': 3500, 'english_paperback': 2800, 'english_hardcover': 4200 }
                };

                const rates = pricingTable[selectedCountry] || pricingTable['US']; // Fallback to US pricing for other global countries
                const lang = (product.language || 'Hindi').toLowerCase();
                const lookupKey = (rawType === 'audiobook' || rawType === 'ebook')
                    ? rawType
                    : `${lang}_${rawType}`;

                if (rates[lookupKey]) {
                    displayPrice = rates[lookupKey];
                } else {
                    // Global fallback for "Other Global Countries"
                    const defaultGlobal = pricingTable['US'];
                    displayPrice = defaultGlobal[lookupKey] || product.price;
                }
            }
        }

        const isOfferFilter = activeFilter.toUpperCase().includes('OFFER');
        let finalPrice = displayPrice;
        let showDiscount = false;

        if (product.offerId) {
            showDiscount = true;
            finalPrice = displayPrice;
        } else if (originalPriceVal && originalPriceVal > displayPrice) {
            showDiscount = true;
            finalPrice = displayPrice;
        } else if (product.discount && product.discount > 0) {
            showDiscount = true;
        }

        const selectedOfferId = localStorage.getItem('selectedOfferId');
        const isOfferHighlighted = selectedOfferId && String(product.offerId) === String(selectedOfferId);

        const card = document.createElement('div');
        card.className = 'product-card glass-panel reveal magnetic shine-box' + (isOfferHighlighted ? ' offer-highlighted' : '');
        card.setAttribute('data-id', product._id || product.id);
        card.setAttribute('data-name', product.title);
        card.setAttribute('data-price', finalPrice);
        card.setAttribute('data-type', product.type || '');
        card.setAttribute('data-language', product.language || '');
        card.setAttribute('data-subtitle', product.subtitle || '');

        const typeBadgeData = {
            'hardcover': { color: '#FFD700', icon: 'fa-book', label: 'HARDCOVER' },
            'paperback': { color: '#4CAF50', icon: 'fa-book-open', label: 'PAPERBACK' },
            'audiobook': { color: '#FF6B35', icon: 'fa-headphones', label: 'AUDIOBOOK' },
            'ebook': { color: '#7B68EE', icon: 'fa-tablet-alt', label: 'E-BOOK' }
        }[rawType] || { color: 'var(--gold-energy)', icon: 'fa-book', label: rawType.toUpperCase() };

        const isVol2 = product.volume === '2' || product.volume === 2 || 
            (product._id || product.id || '').toLowerCase().includes('v2') ||
            (product.title || '').toLowerCase().includes('vol 2') ||
            (product.title || '').toLowerCase().includes('volume 2') ||
            (product.title || '').toLowerCase().includes('mindos');
        const defaultCover = isVol2 
            ? (CONFIG.BASE_PATH + 'assets/images/vol2-cover.png') 
            : (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png');

        let imageUrl = defaultCover;
        if (product.thumbnail) {
            if (product.thumbnail.startsWith('http') || product.thumbnail.startsWith(CONFIG.BASE_PATH + 'assets/images/')) {
                imageUrl = product.thumbnail;
            } else if (product.thumbnail.startsWith('img/')) {
                imageUrl = CONFIG.BASE_PATH + 'assets/images/' + product.thumbnail.replace('img/', '');
            } else if (product.thumbnail.startsWith('assets/images/')) {
                imageUrl = CONFIG.BASE_PATH + product.thumbnail;
            } else {
                imageUrl = `${API_BASE}/${product.thumbnail}`;
            }
        }

        const isComingSoon = checkIsComingSoon(product);
        const isOutOfStock = !isComingSoon && checkIsOutOfStock(product);
        const isHindiPB = isOutOfStock && isHindiPaperback(product);

        // Fetch translations dynamically
        const prodId = product._id || product.id;
        const translatedTitle = window.t('products.' + prodId + '.title', product.title);
        const translatedDesc = window.t('products.' + prodId + '.description', product.description || 'Discover the secrets of Energy and Alignment.');

        // ─── In Stock Badge (Dynamic) ───
        const stockStatusBadge = (!isComingSoon && !isOutOfStock)
            ? `<div class="stock-status-container" style="margin: 12px 0 8px; display: flex; justify-content: center; align-items: center; width: 100%;">
                <span class="stock-badge-pulse" style="background: rgba(46, 213, 115, 0.15); color: #2ed573; padding: 5px 15px; border-radius: 50px; font-size: 0.65rem; font-weight: 900; border: 1px solid rgba(46, 213, 115, 0.4); letter-spacing: 1.2px; text-transform: uppercase; box-shadow: 0 0 20px rgba(46, 213, 115, 0.15); display: inline-flex; align-items: center; gap: 6px; animation: stockPulse 2s infinite ease-in-out;">
                    <i class="fas fa-check-circle" style="font-size: 0.75rem;"></i>
                    ${window.t('marketplace_page.in_stock', 'IN STOCK')}
                </span>
               </div>`
            : '';

        const langBadge = product.language
            ? `<span style="display: block; width: fit-content; margin: 0 auto 8px; background: rgba(212,175,55,0.15); border: 1px solid var(--gold-energy); color: var(--gold-energy); padding: 1px 10px; border-radius: 20px; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; border-width: 0.5px;">${product.language} ${window.t('marketplace_page.edition_suffix', 'Edition')}</span>`
            : '';

        // ─── Out of Stock overlay on book cover
        const oosOverlay = isOutOfStock
            ? `<div class="efv-oos-overlay">
                <span class="efv-oos-badge"><i class="fas fa-ban" style="margin-right:5px;"></i>${window.t('marketplace_page.out_of_stock', 'OUT OF STOCK')}</span>
               </div>`
            : '';

        // ─── Bottom action area: price + buttons
        let priceBlock = '';
        let actionsBlock = '';
        let discountOverlay = '';

        if (isOutOfStock) {
            // ── OOS: show red "OUT OF STOCK" status label (no price, no buy button)
            priceBlock = `<div class="efv-oos-status-label"><i class="fas fa-times-circle"></i> ${window.t('marketplace_page.out_of_stock', 'OUT OF STOCK')}</div>`;

            if (isHindiPB) {
                // Special: Hindi Paperback — show NotionPress message + button
                actionsBlock = `
                    <div class="efv-notion-block">
                        <p class="efv-notion-msg">${window.t('marketplace_page.notion_msg', 'Currently unavailable on our platform. You can still purchase this book from our official publishing partner.')}</p>
                        <a href="https://notionpress.com/in/read/efv-canon-volume-1-the-origin-code-hindi-edition"
                           target="_blank" rel="noopener noreferrer"
                           class="efv-notion-btn">
                            <i class="fas fa-external-link-alt" style="margin-right:6px;"></i>${window.t('marketplace_page.buy_notion', 'Buy on NotionPress')}
                        </a>
                    </div>
                    <div class="product-actions" style="display: flex; gap: 8px; justify-content: center; margin-top: 6px;">
                        <button class="btn btn-outline view-info" style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px; border-width: 1px;">
                            <i class="fas fa-info-circle" style="margin-right: 5px;"></i> ${window.t('buttons.view_info', 'INFO')}
                        </button>
                    </div>`;
            } else {
                // Generic OOS: just info button, no buy
                actionsBlock = `
                    <div class="product-actions" style="display: flex; gap: 8px; justify-content: center; margin-top: auto;">
                        <button class="btn btn-outline view-info" style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px; border-width: 1px;">
                            <i class="fas fa-info-circle" style="margin-right: 5px;"></i> ${window.t('buttons.view_info', 'INFO')}
                        </button>
                    </div>`;
            }
        } else if (isComingSoon) {
            // ── Coming Soon: show "COMING SOON" status (no price, no info/notify buttons)
            priceBlock = '';
            actionsBlock = `
                <div class="coming-soon-block" style="text-align: center; margin-top: auto; padding: 15px 0;">
                    <span class="coming-soon-label" style="background: rgba(255, 211, 105, 0.1); color: var(--gold-energy); padding: 10px 30px; border-radius: 50px; font-size: 0.8rem; font-weight: 900; border: 1.5px solid var(--gold-energy); letter-spacing: 2.5px; text-transform: uppercase; display: inline-block; animation: comingSoonPulse 3s infinite ease-in-out; box-shadow: 0 0 15px rgba(255, 211, 105, 0.2);">
                        <i class="fas fa-clock" style="margin-right: 8px;"></i> ${window.t('marketplace_page.coming_soon', 'COMING SOON')}
                    </span>
                </div>`;
        } else {
            // ── In Stock: normal price + buttons
            if (showDiscount) {
                let orig = originalPriceVal || displayPrice;
                if (!hasLocalizedPrice && selectedCountry !== 'IN' && originalPriceVal && product.price > 0 && !product.offerId) {
                    orig = (originalPriceVal * displayPrice) / product.price;
                    orig = Math.round(orig * 100) / 100;
                }
                const discountPercent = product.discount || Math.round(((orig - displayPrice) / orig) * 100);
                const badgeText = product.offerBadge || `${discountPercent}% OFF`;
                const savingsVal = product.savingsAmount || Math.max(0, orig - displayPrice);
                const savingsBlock = savingsVal > 0 ? `<div style="font-size: 0.7rem; color: var(--luxury-gold, #d4af37); font-weight: 700; margin-top: 2px;">You Save ${activeCurrency}${Math.round(savingsVal)}</div>` : '';

                if (product.offerId || discountPercent > 0) {
                    const formattedBadge = badgeText.replace(' OFF', '<br><span style="font-size: 0.65rem; font-weight: 800; letter-spacing: 1px;">OFF</span>');
                    const badgeFontSize = badgeText.length > 8 ? '0.8rem' : '1.05rem';
                    discountOverlay = `
                        <div style="position: absolute; top: -12px; left: -10px; z-index: 20; display: flex; flex-direction: column; align-items: center; transform: rotate(-12deg); transform-origin: top center; filter: drop-shadow(-2px 5px 8px rgba(0,0,0,0.6));">
                            <!-- Thread Loop -->
                            <div style="width: 14px; height: 30px; border: 1.5px solid rgba(255,255,255,0.5); border-radius: 50%; margin-bottom: -15px; z-index: 1;"></div>
                            <!-- Tag Body -->
                            <div style="background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%); color: #111; padding: 22px 10px 10px; border-radius: 6px; clip-path: polygon(50% 0%, 100% 20%, 100% 100%, 0 100%, 0% 20%); min-width: 55px; max-width: 90px; text-align: center; position: relative; word-wrap: break-word;">
                                <!-- Hole -->
                                <div style="width: 10px; height: 10px; background: #0b132b; border-radius: 50%; position: absolute; top: 8px; left: 50%; transform: translateX(-50%); box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8);"></div>
                                <div style="font-weight: 900; font-size: ${badgeFontSize}; line-height: 1.1;">${formattedBadge}</div>
                            </div>
                        </div>
                    `;
                }

                priceBlock = `
                    <div class="product-price-container" style="text-align: center; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
                            <span class="original-price" style="text-decoration: line-through; color: rgba(255,255,255,0.4); font-size: 0.85rem;">${activeCurrency}${Math.round(orig)}</span>
                            <span class="selling-price" style="font-size: 1.2rem; font-weight: 800; color: #fff;">${activeCurrency}${Math.round(displayPrice)}</span>
                        </div>
                        ${savingsBlock}
                    </div>
                `;
            } else {
                priceBlock = `<span class="price" style="font-size: 1.15rem; display: block; text-align: center; margin-bottom: 10px; font-weight: 800; color: #fff;">${activeCurrency}${finalPrice}</span>`;
            }
            actionsBlock = `
                <div class="product-actions" style="display: flex; gap: 8px; justify-content: center; margin-top: auto;">
                    <button class="btn btn-outline view-info" style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px; border-width: 1px;">
                        <i class="fas fa-info-circle" style="margin-right: 5px;"></i> ${window.t('buttons.view_info', 'INFO')}
                    </button>
                    <button class="btn btn-gold buy-now"
                        style="padding: 6px 12px; font-size: 0.65rem; min-width: 95px;">
                        <i class="fas fa-bolt" style="margin-right: 5px;"></i> ${window.t('buttons.buy_now', 'BUY NOW')}
                    </button>
                </div>`;
        }

        card.innerHTML = `
            ${discountOverlay}
            <div class="book-cover"
                style="width: 100%; max-width: 140px; aspect-ratio: 2/3; margin: 40px auto 12px; background: #0b132b; border-radius: 8px; overflow: hidden; border: 1.5px solid ${isOutOfStock ? 'rgba(255,77,77,0.5)' : 'var(--gold-energy)'}; position: relative; box-shadow: 0 15px 35px rgba(0,0,0,0.6); ${isOutOfStock ? 'filter: grayscale(0.4);' : ''}">
                
                <div class="format-tag" style="position: absolute; top: -52px; left: 50%; transform: translateX(-50%); background: ${typeBadgeData.color}; color: black; padding: 4px 12px; border-radius: 50px; font-size: 0.65rem; font-weight: 900; z-index: 10; display: flex; flex-direction: row !important; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); white-space: nowrap; border: 1px solid rgba(0,0,0,0.1); transition: all 0.3s ease;">
                    <i class="fas ${typeBadgeData.icon}" style="font-size: 0.72rem; margin-top: -1px;"></i>
                    <span style="display: inline-block;">${typeBadgeData.label}</span>
                </div>

                ${oosOverlay}

                <img src="${imageUrl}" alt="${translatedTitle}" loading="lazy"
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;"
                    onerror="this.src='${defaultCover}'">
            </div>
            <div class="product-info" style="text-align: center;">
                ${langBadge}
                <h3 style="font-size: 0.9rem; letter-spacing: 0.5px; margin-bottom: 2px; line-height: 1.2; min-height: unset; color: var(--gold-energy);">
                    ${translatedTitle}
                </h3>
                <span style="color: rgba(255,255,255,0.6); font-size: 0.75rem; display: block; margin-bottom: 4px;">${typeBadgeData.label} ${window.t('marketplace_page.edition_suffix', 'Edition')}</span>
            </div>
            ${stockStatusBadge}
            <div class="rating" style="color: var(--gold-energy); margin: 2px 0; text-align: center; font-size: 0.7rem; opacity: 0.8;">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
            </div>
            <p style="margin-bottom: 8px; font-size: 0.78rem; opacity: 0.7; min-height: 34px; text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">
                ${translatedDesc}
            </p>
            ${priceBlock}
            ${actionsBlock}
        `;

        // Modal should ONLY open when clicking specific buttons, not the whole card
        const infoBtn = card.querySelector('.view-info');
        const buyBtn = card.querySelector('.buy-now');

        const triggerModal = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.openProductModal === 'function') {
                window.openProductModal(product._id || product.id, card);
            }
        };

        if (infoBtn) infoBtn.addEventListener('click', triggerModal);
        if (buyBtn && !isComingSoon && !isOutOfStock) {
            buyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (typeof window.showTermsAndConditions === 'function' && typeof window.checkoutOrder === 'function') {
                    window.showTermsAndConditions(() => {
                        const item = {
                            id: product._id || product.id,
                            name: translatedTitle,
                            price: displayPrice,
                            currency: activeCurrency,
                            quantity: 1,
                            language: product.language || '',
                            subtitle: product.subtitle || '',
                            type: (product.type || 'PHYSICAL').toUpperCase()
                        };
                        window.checkoutOrder([item]);
                    });
                } else {
                    // Fallback to modal if functions are missing
                    triggerModal(e);
                }
            });
        }

        return card;
    }

    // Listen for language changes to instantly re-render products catalog
    window.addEventListener('efv-lang-changed', () => {
        applyFilter();
    });

    // Listen for country/currency changes to instantly re-render products catalog with local currency & prices
    window.addEventListener('efv-country-changed', () => {
        applyFilter();
    });
    window.addEventListener('storage', (e) => {
        if (e.key === 'efv_selected_country' || e.key === 'efv_selected_country_data') {
            applyFilter();
        }
    });
});

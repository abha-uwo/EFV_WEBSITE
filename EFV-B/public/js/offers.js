/**
 * EFV Premium Offers System Client-Side Controller
 */

let allOffers = [];
let allDbProducts = [];
let activeSlideIndex = 0;
let carouselInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadProducts();
    await loadOffers();
});

// Helper to generate the offer badge text dynamically
function getOfferBadgeText(offer) {
    if (offer.badgeText) return offer.badgeText;
    const type = offer.offerType || offer.type || 'Percentage';
    if (type.includes('Percentage')) {
        return `${offer.discountRules?.percentage || offer.discountValue || 0}% OFF`;
    } else if (type.includes('Flat')) {
        return `₹${offer.discountRules?.flatAmount || offer.discountValue || 0} OFF`;
    } else if (type.includes('Coupon')) {
        return offer.couponRules?.code || 'COUPON';
    } else if (type.includes('Shipping')) {
        return 'FREE SHIPPING';
    } else if (type.includes('BOGO')) {
        return 'BUY X GET Y';
    }
    return 'PROMO';
}

// Helper to get correct banner image URL
function getOfferImageUrl(url) {
    if (!url) return '../assets/images/collection-stack.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/api/')) return `${CONFIG.API_BASE_URL}${url}`;
    if (url.startsWith('uploads/') || url.startsWith('/uploads/')) {
        const cleanPath = url.startsWith('/') ? url.substring(1) : url;
        return `${CONFIG.API_BASE_URL}/${cleanPath}`;
    }
    return url;
}

// Render Filter Tabs dynamically based on active offer types
function renderFilterTabs() {
    const filterGroup = document.getElementById('offer-filter-group');
    if (!filterGroup) return;

    // Get all unique active offer types in allOffers
    const activeTypes = new Set();
    allOffers.forEach(o => {
        if (o.isActive) {
            const type = o.offerType || o.type;
            if (type) activeTypes.add(type);
        }
    });

    // We map the raw backend types to user-friendly filter tab labels
    const typeLabelMap = {
        'Percentage': 'Percentage Discount',
        'Flat': 'Flat Discount',
        'Coupon': 'Coupon Codes',
        'FreeShipping': 'Free Shipping',
        'Combo': 'Combo Offers',
        'BOGO': 'Buy X Get Y',
        'FirstOrder': 'First Order',
        'FlashSale': 'Flash Sale',
        'Festival': 'Festival Offers',
        'CategoryPublisherAuthor': 'Category/Publisher/Author'
    };

    let tabsHtml = `
        <button class="filter-btn active" data-filter="All" style="padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); background: transparent; color: white; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: all 0.3s ease;">All Offers</button>
    `;

    activeTypes.forEach(type => {
        const label = typeLabelMap[type] || `${type} Offers`;
        tabsHtml += `
            <button class="filter-btn" data-filter="${type}" style="padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3); background: transparent; color: white; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: all 0.3s ease;">${label}</button>
        `;
    });

    filterGroup.innerHTML = tabsHtml;
    
    // Bind search and filter events
    setupSearchAndFilters();
}

function bindFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        // Clone node to drop old listeners
        const newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);
    });

    const freshFilterButtons = document.querySelectorAll('.filter-btn');
    freshFilterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            filterAndRender();
        });
    });
}

// Fetch products from API
async function loadProducts() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/products`);
        if (response.ok) {
            allDbProducts = await response.json();
        }
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// Fetch offers from API
async function loadOffers() {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/offers`, {
            method: 'GET',
            headers: headers
        });

        if (response.ok) {
            allOffers = await response.json();
            renderCarousel();
            renderFilterTabs();
            renderOffersGrid(allOffers);
            trackOfferViews(allOffers);
        } else {
            console.error('Failed to load offers:', response.statusText);
            renderPlaceholderCarousel();
        }
    } catch (err) {
        console.error('Error fetching offers:', err);
        renderPlaceholderCarousel();
    }
}

// Track views for all rendered offers
async function trackOfferViews(offers) {
    for (const offer of offers) {
        try {
            const offerId = offer._id || offer.id;
            await fetch(`${CONFIG.API_BASE_URL}/api/offers/${offerId}/view`, {
                method: 'POST'
            });
        } catch (e) {
            // Silently ignore view tracking failures
        }
    }
}

// Render Carousel
function renderCarousel() {
    const carousel = document.getElementById('offers-carousel');
    const bannerOffers = allOffers.filter(o => o.bannerUrl && o.isActive);

    if (bannerOffers.length === 0) {
        renderPlaceholderCarousel();
        return;
    }

    let slidesHtml = '';
    let indicatorsHtml = '';

    // Sort by priority first
    bannerOffers.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    bannerOffers.forEach((offer, idx) => {
        const activeClass = idx === 0 ? 'active' : '';
        const badgeText = getOfferBadgeText(offer);
        const ctaText = offer.ctaText || 'Claim Offer';
        
        slidesHtml += `
            <div class="carousel-slide ${activeClass}" data-index="${idx}">
                <div class="carousel-content">
                    <span class="carousel-banner-badge">${badgeText}</span>
                    <h1 class="carousel-title">${offer.name}</h1>
                    <p class="carousel-subtitle">${offer.description}</p>
                    <button class="carousel-btn" onclick="claimOffer('${offer._id || offer.id}')">${ctaText}</button>
                </div>
                <img src="${getOfferImageUrl(offer.bannerUrl)}" class="carousel-image" alt="${offer.name}" onerror="this.src='../assets/images/collection-stack.jpg'">
            </div>
        `;
        
        indicatorsHtml += `
            <span class="indicator ${activeClass}" data-slide="${idx}" onclick="setSlide(${idx})"></span>
        `;
    });

    // Add navigation controls if multiple slides exist
    let controlsHtml = '';
    if (bannerOffers.length > 1) {
        controlsHtml = `
            <div class="carousel-control carousel-prev" onclick="prevSlide()"><i class="fas fa-chevron-left"></i></div>
            <div class="carousel-control carousel-next" onclick="nextSlide()"><i class="fas fa-chevron-right"></i></div>
            <div class="carousel-indicators">${indicatorsHtml}</div>
        `;
    }

    carousel.innerHTML = slidesHtml + controlsHtml;
    
    if (bannerOffers.length > 1) {
        startCarouselAutoPlay(bannerOffers.length);
    }
}

function renderPlaceholderCarousel() {
    const carousel = document.getElementById('offers-carousel');
    if (!carousel) return;
    carousel.innerHTML = `
        <div class="carousel-slide active">
            <div class="carousel-content">
                <span class="carousel-banner-badge">Official Store</span>
                <h1 class="carousel-title">EFV™ Alignment Collection</h1>
                <p class="carousel-subtitle">Unlock premium discounts, bundle codes, and special packages to calibrate your personal Energetics today.</p>
                <a href="marketplace.html" class="carousel-btn">View Catalog</a>
            </div>
            <img src="../assets/images/collection-stack.jpg" class="carousel-image" alt="Cosmic Space">
        </div>
    `;
}

// Carousel Autoplay controls
function startCarouselAutoPlay(totalSlides) {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        nextSlide(totalSlides);
    }, 5000);
}

function setSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    if (slides.length === 0) return;
    
    slides[activeSlideIndex].classList.remove('active');
    if (indicators[activeSlideIndex]) indicators[activeSlideIndex].classList.remove('active');
    
    activeSlideIndex = index;
    
    slides[activeSlideIndex].classList.add('active');
    if (indicators[activeSlideIndex]) indicators[activeSlideIndex].classList.add('active');
}

function nextSlide(total = null) {
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = total || slides.length;
    if (totalSlides <= 1) return;
    
    let nextIndex = (activeSlideIndex + 1) % totalSlides;
    setSlide(nextIndex);
}

function prevSlide() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length <= 1) return;
    
    let prevIndex = (activeSlideIndex - 1 + slides.length) % slides.length;
    setSlide(prevIndex);
}

// Render offers inside grids
function renderOffersGrid(offersList) {
    const allGrid = document.getElementById('all-offers-grid');
    const featuredGrid = document.getElementById('featured-offers-grid');
    const endingGrid = document.getElementById('ending-soon-offers-grid');
    
    const featuredWrapper = document.getElementById('featured-offers-wrapper');
    const endingWrapper = document.getElementById('ending-soon-wrapper');

    if (!allGrid) return;

    // Filter categories
    const featuredOffers = offersList.filter(o => o.priority >= 3 && o.isActive);
    const endingOffers = offersList.filter(o => {
        if (!o.endDate || !o.isActive) return false;
        const hoursLeft = (new Date(o.endDate) - new Date()) / (1000 * 60 * 60);
        return hoursLeft > 0 && hoursLeft <= 48; // Ending soon if less than 48 hours remaining
    });

    // Render Featured Offers
    if (featuredGrid) {
        if (featuredOffers.length > 0) {
            featuredWrapper.style.display = 'block';
            featuredGrid.innerHTML = featuredOffers.map(o => createOfferCardHtml(o)).join('');
        } else {
            featuredWrapper.style.display = 'none';
        }
    }

    // Render Ending Soon Offers
    if (endingGrid) {
        if (endingOffers.length > 0) {
            endingWrapper.style.display = 'block';
            endingGrid.innerHTML = endingOffers.map(o => createOfferCardHtml(o, true)).join('');
        } else {
            endingWrapper.style.display = 'none';
        }
    }

    // Render All Offers
    const activeOffers = offersList.filter(o => o.isActive);
    if (activeOffers.length > 0) {
        allGrid.innerHTML = activeOffers.map(o => createOfferCardHtml(o)).join('');
    } else {
        allGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888; border: 1px dashed rgba(212, 175, 55, 0.2); border-radius: 12px; width: 100%;">
                <i class="fas fa-percent" style="font-size: 2rem; margin-bottom: 15px; color: var(--luxury-gold);"></i>
                <p>No active promotions available at the moment. Check back soon!</p>
            </div>
        `;
    }
}

// Create HTML template for Offer Card
function createOfferCardHtml(offer, isEndingSoon = false) {
    const offerId = offer._id || offer.id;
    const type = offer.offerType || offer.type || 'Percentage';
    
    const badgeText = getOfferBadgeText(offer);
    
    const isEndingBadge = isEndingSoon ? 'ending-soon-badge' : '';
    
    let validityText = 'Ongoing Promotion';
    if (offer.endDate) {
        const dateStr = new Date(offer.endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        validityText = `Valid Till: ${dateStr}`;
    }

    let actionBtnHtml = `<button class="offer-card-btn" onclick="claimOffer('${offerId}')">Claim Offer</button>`;
    let customRulesHtml = '';

    if (type.includes('Coupon') && offer.couponRules?.code) {
        actionBtnHtml = `<button class="offer-card-btn copy-coupon-btn" onclick="copyCouponCode(event, '${offer.couponRules.code}')"><i class="fas fa-copy" style="margin-right: 5px;"></i> Copy Code</button>`;
        customRulesHtml = `
            <div class="coupon-details" style="margin-top: 10px; padding: 10px; background: rgba(212,175,55,0.05); border: 1px dashed rgba(212,175,55,0.3); border-radius: 6px; font-size: 0.8rem;">
                <strong>Code:</strong> <span style="color: var(--luxury-gold); font-weight: bold;">${offer.couponRules.code}</span><br>
                ${offer.couponRules.minOrder ? `Min Order: ₹${offer.couponRules.minOrder}` : ''}
            </div>
        `;
    } else if (type.includes('BOGO') && offer.buyXGetYRules?.buyProductId) {
        customRulesHtml = `
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 8px; font-style: italic;">
                Buy ${offer.buyXGetYRules.requiredQty || 1} Get ${offer.buyXGetYRules.freeQty || 1} Free!
            </div>
        `;
    } else if (type.includes('Shipping') && offer.shippingRules?.minAmount) {
        customRulesHtml = `
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 8px; font-style: italic;">
                Free shipping on orders above ₹${offer.shippingRules.minAmount}
            </div>
        `;
    } else if (type.includes('Combo') && offer.comboRules?.comboPrice) {
        customRulesHtml = `
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 8px;">
                Special Bundle Price: <span style="color: var(--luxury-gold); font-weight: bold;">₹${offer.comboRules.comboPrice}</span>
            </div>
        `;
    }

    return `
        <div class="offer-card" data-id="${offerId}" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
            <div>
                <span class="offer-badge ${isEndingBadge}">${badgeText}</span>
                <div style="font-size: 0.75rem; color: var(--luxury-gold); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">
                    ${offer.offerType || offer.type} Offer
                </div>
                <h3 class="offer-card-title">${offer.name}</h3>
                <p class="offer-card-desc">${offer.description || 'No description provided.'}</p>
                ${customRulesHtml}
            </div>
            
            <div class="offer-meta" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                <span class="offer-validity" style="font-size: 0.75rem; opacity: 0.7;">
                    <i class="far fa-clock"></i> ${validityText}
                </span>
                ${actionBtnHtml}
            </div>
        </div>
    `;
}

// Global copy helper
window.copyCouponCode = function(e, code) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    if (typeof showToast === 'function') {
        showToast(`Coupon code "${code}" copied!`, 'success');
    } else {
        alert(`Coupon code "${code}" copied to clipboard!`);
    }
};

let countdownInterval = null;

// Helper to calculate product price under specific offer rules
function calculateProductOfferPrice(product, offer) {
    const originalPrice = Number(product.originalPrice) || Number(product.price);
    const oType = offer.offerType || offer.type || 'Percentage';
    let discountPrice = originalPrice;
    let savings = 0;
    let badgeText = '';

    if (oType === 'Percentage' || oType === 'FlashSale' || oType === 'Festival' || oType === 'CategoryPublisherAuthor') {
        const pct = Number(offer.discountValue || offer.discountRules?.percentage || 0);
        savings = Math.round(originalPrice * (pct / 100));
        discountPrice = originalPrice - savings;
        badgeText = `${pct}% OFF`;
    } else if (oType === 'Flat') {
        const amt = Number(offer.discountValue || offer.discountRules?.flatAmount || 0);
        savings = Math.min(originalPrice, amt);
        discountPrice = originalPrice - savings;
        badgeText = `₹${amt} OFF`;
    } else if (oType === 'BOGO' && offer.buyXGetYRules) {
        const bRules = offer.buyXGetYRules;
        if (String(product._id || product.id) === String(bRules.freeProductId)) {
            savings = originalPrice;
            discountPrice = 0;
            badgeText = 'FREE';
        } else {
            savings = 0;
            discountPrice = originalPrice;
            badgeText = 'BUY';
        }
    } else if (oType === 'Combo' && offer.comboRules) {
        const cRules = offer.comboRules;
        const productsInCombo = allDbProducts.filter(p => cRules.products.includes(String(p._id || p.id)));
        const regularSum = productsInCombo.reduce((sum, p) => sum + (Number(p.originalPrice) || Number(p.price)), 0);
        const comboPrice = Number(cRules.comboPrice || 0);
        if (regularSum > comboPrice) {
            const discountFactor = comboPrice / regularSum;
            discountPrice = Math.round(originalPrice * discountFactor);
            savings = originalPrice - discountPrice;
            badgeText = `${Math.round((1 - discountFactor) * 100)}% OFF`;
        }
    } else if (oType === 'FirstOrder' && offer.firstOrderRules) {
        const fRules = offer.firstOrderRules;
        const val = Number(fRules.discountValue || offer.discountValue || 0);
        if (fRules.discountType === 'Percentage') {
            savings = Math.round(originalPrice * (val / 100));
            discountPrice = originalPrice - savings;
            badgeText = `${val}% OFF`;
        } else {
            savings = Math.min(originalPrice, val);
            discountPrice = originalPrice - savings;
            badgeText = `₹${val} OFF`;
        }
    }

    return {
        originalPrice,
        discountPrice,
        savings,
        badgeText
    };
}

// Close modal handler
window.closeOfferModal = function() {
    if (typeof countdownInterval !== 'undefined' && countdownInterval) clearInterval(countdownInterval);
    const modal = document.getElementById('offer-details-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }
};

// Claim Offer - open popup modal with detailed breakdown
window.claimOffer = async function (offerId) {
    try {
        // 1. Fetch single offer for accuracy
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${CONFIG.API_BASE_URL}/api/offers/${offerId}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch offer details');
        const offer = await res.json();

        // 2. Track claim view
        await fetch(`${CONFIG.API_BASE_URL}/api/offers/${offerId}/claim`, { method: 'POST' }).catch(() => {});

        // 3. Render Modal Data
        document.getElementById('modal-offer-banner').src = getOfferImageUrl(offer.bannerUrl);
        document.getElementById('modal-offer-badge').textContent = getOfferBadgeText(offer);
        document.getElementById('modal-offer-title').textContent = offer.name;
        document.getElementById('modal-offer-desc').textContent = offer.description || 'Unlock this premium vibrational energy calibrator offer.';

        // Validity label
        let validityText = 'Ongoing Promotion';
        if (offer.endDate) {
            const dateStr = new Date(offer.endDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
            validityText = `Valid Till: ${dateStr}`;
        }
        document.getElementById('modal-offer-validity').textContent = validityText;

        // Start Countdown Timer
        if (offer.endDate) {
            const end = new Date(offer.endDate).getTime();
            const timerUpdate = () => {
                const now = new Date().getTime();
                const diff = end - now;
                const countdownEl = document.getElementById('modal-offer-countdown');
                if (diff <= 0) {
                    countdownEl.textContent = 'EXPIRED';
                    clearInterval(countdownInterval);
                    return;
                }
                const hrs = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                countdownEl.textContent = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            };
            timerUpdate();
            clearInterval(countdownInterval);
            countdownInterval = setInterval(timerUpdate, 1000);
        } else {
            document.getElementById('modal-offer-countdown').textContent = 'LIFETIME';
        }

        // 4. Map and render applicable products
        const offerType = offer.offerType || offer.type;
        let applicableProducts = [];

        if (offerType === 'Combo' && offer.comboRules?.products) {
            applicableProducts = allDbProducts.filter(p => offer.comboRules.products.includes(String(p._id || p.id)));
        } else if (offerType === 'BOGO' && offer.buyXGetYRules) {
            const buyId = offer.buyXGetYRules.buyProductId;
            const freeId = offer.buyXGetYRules.freeProductId;
            applicableProducts = allDbProducts.filter(p => String(p._id || p.id) === String(buyId) || String(p._id || p.id) === String(freeId));
        } else if (offer.products && offer.products.length > 0) {
            applicableProducts = allDbProducts.filter(p => {
                return offer.products.some(op => {
                    const opId = op.productId || op;
                    const opCat = op.categorySlug;
                    if (opId && String(opId) === String(p._id || p.id)) return true;
                    if (opCat && (p.categories || []).map(c => c.toLowerCase()).includes(opCat.toLowerCase())) return true;
                    if (opCat && p.type && p.type.toLowerCase() === opCat.toLowerCase()) return true;
                    return false;
                });
            });
        } else {
            applicableProducts = allDbProducts;
        }

        const booksContainer = document.getElementById('modal-offer-books-list');
        booksContainer.innerHTML = applicableProducts.map(p => {
            const pricing = calculateProductOfferPrice(p, offer);
            const cover = getOfferImageUrl(p.thumbnail || '../assets/images/vol1-cover.png');
            
            return `
                <div style="display: flex; gap: 15px; align-items: center; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <img src="${cover}" onerror="this.src='../assets/images/vol1-cover.png'" style="width: 50px; height: 70px; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-family: 'Cinzel', serif; font-size: 0.9rem; color: #fff;">${p.title}</h4>
                        <p style="margin: 3px 0 0; font-size: 0.75rem; opacity: 0.5;">${p.type || 'Book'}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.65rem; background: rgba(46, 213, 115, 0.15); color: #2ed573; border: 1px solid rgba(46, 213, 115, 0.3); padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-bottom: 4px; display: inline-block;">${pricing.badgeText}</span>
                        <div style="font-weight: 800; color: var(--luxury-gold); font-size: 1.1rem;">₹${pricing.discountPrice}</div>
                        <div style="font-size: 0.75rem; text-decoration: line-through; opacity: 0.5;">₹${pricing.originalPrice}</div>
                    </div>
                </div>
            `;
        }).join('');

        // 5. Update Buy Now Handler
        const buyNowBtn = document.getElementById('modal-offer-buy-now-btn');
        buyNowBtn.onclick = () => {
            // Save the pre-applied checkout offer id to localStorage
            localStorage.setItem('efv_checkout_offer_id', offerId);

            const itemsToAdd = applicableProducts.map(p => {
                const type = (p.type || 'PHYSICAL').toUpperCase();
                return {
                    id: p._id || p.id,
                    productId: p._id || p.id,
                    name: p.title,
                    price: Number(p.price),
                    quantity: 1,
                    type: type,
                    thumbnail: p.thumbnail,
                    subtitle: p.subtitle || ''
                };
            });

            closeOfferModal();

            if (typeof window.checkoutOrder === 'function') {
                window.checkoutOrder(itemsToAdd);
            } else {
                localStorage.setItem('directCheckout', JSON.stringify(itemsToAdd));
                window.location.href = 'checkout.html';
            }
        };

        // Open modal
        const modal = document.getElementById('offer-details-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

    } catch (err) {
        console.error('Error opening claim modal:', err);
        window.location.href = 'marketplace.html';
    }
}

// Set up Search & Filters
function setupSearchAndFilters() {
    const searchInput = document.getElementById('offer-search-input');
    if (searchInput && !searchInput.dataset.hasListener) {
        searchInput.addEventListener('input', () => {
            filterAndRender();
        });
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterAndRender();
            }
        });
        searchInput.dataset.hasListener = 'true';
    }

    const searchBtn = document.getElementById('offer-search-btn');
    if (searchBtn && !searchBtn.dataset.hasListener) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            filterAndRender();
        });
        searchBtn.dataset.hasListener = 'true';
    }

    bindFilterButtons();
}

// Filter and render logic
function filterAndRender() {
    const searchInput = document.getElementById('offer-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeBtn ? activeBtn.dataset.filter : 'All';

    let filtered = allOffers;

    // Apply active filter tab
    if (activeFilter !== 'All') {
        filtered = filtered.filter(o => {
            const type = (o.offerType || o.type || '').toUpperCase().replace(/\s+/g, '');
            const filterUpper = activeFilter.toUpperCase().replace(/\s+/g, '');
            
            if (filterUpper === 'PERCENTAGE') {
                return type.includes('PERCENTAGE');
            }
            if (filterUpper === 'FLAT') {
                return type.includes('FLAT');
            }
            if (filterUpper === 'COUPON') {
                return type.includes('COUPON');
            }
            if (filterUpper === 'FREESHIPPING') {
                return type.includes('SHIPPING') || type.includes('FREE');
            }
            if (filterUpper === 'COMBO') {
                return type.includes('COMBO') || type.includes('BUNDLE');
            }
            if (filterUpper === 'BOGO') {
                return type.includes('BOGO') || type.includes('BUY') || type.includes('XGETY');
            }
            if (filterUpper === 'FIRSTORDER') {
                return type.includes('FIRST');
            }
            if (filterUpper === 'FLASHSALE') {
                return type.includes('FLASH') || type.includes('SALE');
            }
            if (filterUpper === 'FESTIVAL') {
                return type.includes('FEST');
            }
            if (filterUpper === 'CATEGORYPUBLISHERAUTHOR') {
                return type.includes('CATEGORY') || type.includes('PUBLISHER') || type.includes('AUTHOR');
            }
            
            return type === filterUpper;
        });
    }

    // Apply search query
    if (query) {
        filtered = filtered.filter(o => {
            return (o.name && o.name.toLowerCase().includes(query)) ||
                   (o.description && o.description.toLowerCase().includes(query)) ||
                   (o.offerType && o.offerType.toLowerCase().includes(query)) ||
                   (o.type && o.type.toLowerCase().includes(query));
        });
    }

    renderOffersGrid(filtered);
}

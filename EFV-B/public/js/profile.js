// Integrated with global security.js
console.log("📂 profile.js: Loading Version 1.2 (Harden)...");

const API_BASE = (typeof window.API_BASE !== 'undefined' && window.API_BASE) ? window.API_BASE : ((typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080');

// User Data Isolation Helpers
// User Data Isolation Helpers
function getUserKey(baseKey) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user || !user.email) return baseKey;
    // Clean email to use as key part (remove special chars)
    const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${baseKey}_${cleanEmail}`;
}

// Helper to get user-specific address key
function getAddressKey() {
    return getUserKey('efv_user_addresses');
}

// --- GLOBAL COUNTRY CONFIG AND AUTO-DETECTION MAP ---
const COUNTRY_MAP_CONFIG = {
    'IN': { code: '+91',  pinPattern: '[0-9]{6}',        pinPlaceholder: 'Pincode (e.g. 400001)',      name: 'India' },
    'US': { code: '+1',   pinPattern: '[0-9]{5}',        pinPlaceholder: 'ZIP Code (e.g. 10001)',       name: 'United States' },
    'GB': { code: '+44',  pinPattern: '[A-Za-z0-9 ]{5,7}', pinPlaceholder: 'Postcode (e.g. SW1A 1AA)',    name: 'United Kingdom' },
    'AU': { code: '+61',  pinPattern: '[0-9]{4}',        pinPlaceholder: 'Postcode (e.g. 2000)',        name: 'Australia' },
    'CA': { code: '+1',   pinPattern: '[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]', pinPlaceholder: 'Postal Code (e.g. K1A 0B1)', name: 'Canada' },
    'AE': { code: '+971', pinPattern: '[0-9]{5}',        pinPlaceholder: 'Postal Code (e.g. 12345)',       name: 'United Arab Emirates' },
    'SG': { code: '+65',  pinPattern: '[0-9]{6}',        pinPlaceholder: 'Postal Code (e.g. 018956)',      name: 'Singapore' },
    'DE': { code: '+49',  pinPattern: '[0-9]{5}',        pinPlaceholder: 'Postal Code (e.g. 10115)',       name: 'Germany' },
    'FR': { code: '+33',  pinPattern: '[0-9]{5}',        pinPlaceholder: 'Postal Code (e.g. 75001)',       name: 'France' },
    'ES': { code: '+34',  pinPattern: '[0-9]{5}',        pinPlaceholder: 'Postal Code (e.g. 28001)',       name: 'Spain' },
    'IT': { code: '+39',  pinPattern: '[0-9]{5}',        pinPlaceholder: 'Postal Code (e.g. 00100)',       name: 'Italy' },
    'SA': { code: '+966', pinPattern: '[0-9]{5}',        pinPlaceholder: 'Postal Code (e.g. 11564)',       name: 'Saudi Arabia' },
    'JP': { code: '+81',  pinPattern: '[0-9]{3}-?[0-9]{4}', pinPlaceholder: '100-0001',    name: 'Japan' },
    'CN': { code: '+86',  pinPattern: '[0-9]{6}',        pinPlaceholder: '100000',      name: 'China' },
    'NZ': { code: '+64',  pinPattern: '[0-9]{4}',        pinPlaceholder: '6011',        name: 'New Zealand' },
    'ZA': { code: '+27',  pinPattern: '[0-9]{4}',        pinPlaceholder: '0001',        name: 'South Africa' },
    'MY': { code: '+60',  pinPattern: '[0-9]{5}',        pinPlaceholder: '50000',       name: 'Malaysia' },
    'NL': { code: '+31',  pinPattern: '[0-9]{4} ?[A-Za-z]{2}', pinPlaceholder: '1234 AB',  name: 'Netherlands' },
    'OTHER': { code: '+', pinPattern: '.*',              pinPlaceholder: 'Postal / ZIP Code', name: 'Other' }
};

window.getActiveSelectedCountry = function() {
    let code = localStorage.getItem('efv_selected_country');
    if (!code) {
        try {
            const data = JSON.parse(localStorage.getItem('efv_selected_country_data'));
            if (data && data.iso2) code = data.iso2;
        } catch(e) {}
    }
    if (code && typeof code === 'string') {
        code = code.trim();
        if (code.length > 2 && window.countryToMetadata) {
            const lower = code.toLowerCase();
            if (window.countryToMetadata[lower]) code = window.countryToMetadata[lower].code;
        }
        code = code.toUpperCase();
    }
    return code || 'IN';
};

window.applyCountryConfig = function(countryCode) {
    if (!countryCode) countryCode = window.getActiveSelectedCountry();
    countryCode = (typeof countryCode === 'string') ? countryCode.toUpperCase().trim() : 'IN';
    
    let config = COUNTRY_MAP_CONFIG[countryCode];
    if (!config && window.countryToMetadata) {
        const meta = Object.entries(window.countryToMetadata).find(([name, m]) => m.code === countryCode || name.toUpperCase() === countryCode);
        if (meta) {
            const [cName, cData] = meta;
            config = {
                code: cData.dial || '+1',
                pinPattern: '.*',
                pinPlaceholder: 'Postal / ZIP Code',
                name: cName.charAt(0).toUpperCase() + cName.slice(1)
            };
        }
    }
    if (!config) {
        config = { code: '+91', pinPattern: '.*', pinPlaceholder: 'Postal/Zip Code', name: countryCode };
    }
    
    const countryEl = document.getElementById('addr-country');
    if (countryEl) countryEl.value = countryCode;

    const countrySelect = document.getElementById('addr-country-select');
    if (countrySelect) {
        let optionExists = Array.from(countrySelect.options).some(opt => opt.value === countryCode);
        if (!optionExists && config.name) {
            const newOpt = document.createElement('option');
            newOpt.value = countryCode;
            newOpt.textContent = `🌐 ${config.name} (${config.code})`;
            countrySelect.appendChild(newOpt);
        }
        countrySelect.value = countryCode;
    }

    const phoneCode = document.getElementById('addr-phone-code');
    if (phoneCode) phoneCode.value = config.code;

    const pincodeEl = document.getElementById('addr-pincode');
    if (pincodeEl) {
        const postalRule = (typeof getPostalRule === 'function') ? getPostalRule(countryCode) : null;
        const placeholder = postalRule ? postalRule.placeholder : config.pinPlaceholder;
        pincodeEl.setAttribute('placeholder', placeholder);
        pincodeEl.title = `Format: ${placeholder}`;
        if (postalRule) {
            if (!postalRule.required) {
                pincodeEl.removeAttribute('required');
            } else {
                pincodeEl.setAttribute('required', 'required');
            }
            if (postalRule.maxLength) {
                pincodeEl.maxLength = postalRule.maxLength;
            }
        }
    }
    return config;
};

window.handleAddressCountryChange = function(countryCode) {
    console.log("📍 Address Country selected:", countryCode);
    window.applyCountryConfig(countryCode);
};

// Listen to global country changes from top header or initial modal
window.addEventListener('efv-country-changed', (e) => {
    const newCountry = e.detail?.iso2 || window.getActiveSelectedCountry();
    console.log("🌍 [Profile] Synced with global country change:", newCountry);
    window.applyCountryConfig(newCountry);
});

// --- GLOBAL MODAL CONTROLLERS (MOVED FOR RELIABILITY) ---
window.openAddressModal = function (id = null) {
    console.log("📍 Calling openAddressModal with ID:", id);
    const modal = document.getElementById('address-modal');
    const form = document.getElementById('address-form');
    const title = document.getElementById('address-modal-title');

    if (!modal) {
        console.error("❌ Critical: #address-modal NOT found in DOM");
        return;
    }
    if (!form) {
        console.error("❌ Critical: #address-form NOT found in DOM");
        return;
    }

    form.reset();
    const addrIdEl = document.getElementById('address-id');
    if (addrIdEl) addrIdEl.value = id || '';

    // Detect the country the user has selected from initial selection / local storage
    const currentGlobalCountry = window.getActiveSelectedCountry();
    let activeCountry = currentGlobalCountry;

    // Load existing address if editing
    if (id && id !== null) {
        title.textContent = 'EDIT ADDRESS';
        const addresses = JSON.parse(localStorage.getItem(getAddressKey())) || [];
        const addr = addresses.find(a => (a.id === id || a._id === id));

        if (addr) {
            activeCountry = addr.countryCode || addr.country || currentGlobalCountry;
            const config = window.applyCountryConfig(activeCountry);

            if (document.getElementById('addr-name')) document.getElementById('addr-name').value = addr.fullName || '';
            
            // If phone starts with the country code, strip it so the user only edits local number digits
            let localPhone = addr.phone || '';
            if (config.code && localPhone.startsWith(config.code)) {
                localPhone = localPhone.replace(config.code, '').trim();
            }
            if (document.getElementById('addr-phone')) document.getElementById('addr-phone').value = localPhone;
            if (document.getElementById('addr-pincode')) document.getElementById('addr-pincode').value = addr.pincode || '';
            if (document.getElementById('addr-state')) document.getElementById('addr-state').value = addr.state || '';
            if (document.getElementById('addr-city')) document.getElementById('addr-city').value = addr.city || '';
            if (document.getElementById('addr-house')) document.getElementById('addr-house').value = addr.house || '';
            if (document.getElementById('addr-area')) document.getElementById('addr-area').value = addr.area || '';
            if (document.getElementById('addr-landmark')) document.getElementById('addr-landmark').value = addr.landmark || '';
            if (document.getElementById('addr-default')) document.getElementById('addr-default').checked = !!addr.isDefault;

            const typeRadio = document.querySelector(`input[name="addr-type"][value="${addr.type || 'Home'}"]`);
            if (typeRadio) typeRadio.checked = true;
        }
    } else {
        title.textContent = 'ADD NEW ADDRESS';
        window.applyCountryConfig(activeCountry);
        // Check if this is the first address, make it default
        const addresses = JSON.parse(localStorage.getItem(getAddressKey())) || [];
        if (addresses.length === 0) {
            if (document.getElementById('addr-default')) document.getElementById('addr-default').checked = true;
        }
    }

    // Force the modal as a fixed centered overlay overriding all CSS conflicts
    modal.setAttribute('style', [
        'display: flex !important',
        'position: fixed !important',
        'top: 0 !important',
        'left: 0 !important',
        'width: 100vw !important',
        'height: 100vh !important',
        'z-index: 2147483647 !important',
        'justify-content: center !important',
        'align-items: center !important',
        'background: rgba(0,0,0,0.92) !important',
        'backdrop-filter: blur(14px) !important',
        '-webkit-backdrop-filter: blur(14px) !important',
        'padding: 20px !important',
        'box-sizing: border-box !important',
        'opacity: 1 !important',
        'pointer-events: auto !important',
        'visibility: visible !important'
    ].join('; '));
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    console.log("✅ Address modal should now be visible");
};

window.closeAddressModal = () => {
    console.log("📍 Closing address modal...");
    const modal = document.getElementById('address-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        modal.removeAttribute('style');
        modal.style.display = 'none';
    }
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
};

window.skipAddressStep = () => {
    window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/checkout.html?manual=true';
};


// --- MODAL & GLOBAL FUNCTIONS (TOP LEVEL FOR RELIABILITY) ---
// --- ADMIN MODAL SYSTEM (Consolidated) ---
// This section handles the premium product management modal
window.openAddProductModal = function () {
    console.log("📦 Standard Call: openAddProductModal");
    if (typeof window.openProductModal === 'function') {
        window.openProductModal();
    } else {
        console.error("openProductModal not found");
    }
};


window.updateAdminStats = async function () {
    try {
        const token = localStorage.getItem('authToken');
        const [productsRes, ordersRes, usersRes] = await Promise.all([
            fetch(`${API_BASE}/api/products`),
            fetch(`${API_BASE}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const products = await productsRes.json();
        const orders = ordersRes.ok ? await ordersRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];
        const revenue = orders.reduce((sum, o) => sum + (['Failed', 'Returned', 'Cancelled'].includes(o.status) ? 0 : o.totalAmount), 0);

        const totalProdEl = document.getElementById('admin-stat-total-products');
        const totalOrderEl = document.getElementById('admin-stat-total-orders');
        const revenueEl = document.getElementById('admin-stat-revenue');
        const usersEl = document.getElementById('admin-stat-users');

        if (totalProdEl) totalProdEl.textContent = products.length;
        if (totalOrderEl) totalOrderEl.textContent = orders.length;
        if (revenueEl) revenueEl.textContent = '₹' + revenue.toLocaleString();
        if (usersEl) usersEl.textContent = users.length;
    } catch (e) { console.error(e); }
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
    // 1. Destroy "decrypted buffers" (clear canvases)
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // 2. Kill all audio/video immediately
    document.querySelectorAll('audio, video').forEach(media => {
        media.pause();
        media.src = '';
        media.load();
        media.remove();
    });

    // 3. Clear sensitive overlays
    document.querySelectorAll('.reader-overlay, .efv-audio-player-overlay').forEach(el => {
        el.style.display = 'none';
        el.remove();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check - Redirect if not logged in
    const user = JSON.parse(localStorage.getItem('efv_user'));

    if (!user) {
        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'index.html';
        return;
    }

    // Role-Based Page Protection
    const isProfilePage = window.location.pathname.includes('profile.html');
    const uEmail = (user.email || '').toLowerCase().trim();
    const isAdmin = user.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com';

    if (isProfilePage && isAdmin) {
        // Admins strictly forbidden from customer profile
        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/admin-dashboard.html';
        return;
    }

    // 2. Initialize Mobile Menu FIRST (Critical)
    const dashHamb = document.getElementById('dashboard-hamburger');
    const sideNav = document.querySelector('.sidebar-nav');

    if (dashHamb && sideNav) {
        // Direct listener — no cloneNode to avoid losing onclick attrs or double binds
        dashHamb.addEventListener('click', function (e) {
            e.stopPropagation();
            this.classList.toggle('active');
            sideNav.classList.toggle('active');
            console.log('🍔 Hamburger clicked! Nav active:', sideNav.classList.contains('active'));
        });

        // Close menu when clicking a nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                dashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sideNav.contains(e.target) && !dashHamb.contains(e.target)) {
                dashHamb.classList.remove('active');
                sideNav.classList.remove('active');
            }
        });
    }

    // 3. Initialize Dashboard & Filters
    initializeDashboard(user).then(() => {
        // Auto-Open Checkout from Cart
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('checkout') === 'true') {
            console.log("🛒 Auto-triggering checkout flow...");
            const directCheckout = JSON.parse(localStorage.getItem('directCheckout'));
            let items = [];
            if (directCheckout) {
                items = Array.isArray(directCheckout) ? directCheckout : [directCheckout];
            } else {
                const cartKey = getUserKey('efv_cart');
                items = JSON.parse(localStorage.getItem(cartKey)) || [];
            }

            if (items.length > 0) {
                setTimeout(() => {
                    initiateDashboardCheckout(items);
                }, 800);
            }
        }
    });
    initializeNotificationFilters();

    // 4. Tab Logic
    const tabs = document.querySelectorAll('.nav-item[data-tab]');
    const sections = document.querySelectorAll('.content-section');

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

            if (targetId === 'admin-payments') loadAdminPayments();
            if (targetId === 'admin-shipments') loadAdminShipments();
            if (targetId === 'admin-coupons') loadAdminCoupons();

            // Refresh specific data on tab switch
            if (targetId === 'dashboard') updateDashboardOverview();
            if (targetId === 'admin') updateAdminStats();
            if (targetId === 'library') syncLibraryWithBackend();
            if (targetId === 'orders') {
                renderOrdersTab();
                // Trigger background sync for status updates
                syncOrdersStatus();
            }
            if (targetId === 'notifications') renderNotificationsTab();
            if (targetId === 'admin-orders') loadAdminOrdersFull();
            if (targetId === 'admin-products') loadAdminProductsFull();

            // ROLE BASED SETTINGS REDIRECTION
            if (targetId === 'settings') {
                const uEmail = (user.email || '').toLowerCase().trim();
                const isAdmin = user.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com';
                if (isAdmin) {
                    tab.classList.remove('active');
                    sections.forEach(s => s.classList.remove('active'));
                    const adminSettingsSection = document.getElementById('admin-settings');
                    if (adminSettingsSection) adminSettingsSection.classList.add('active');
                    initializeAdminSettings();
                } else {
                    initializeSettingsTabs();
                    if (typeof populateSettingsProfileFields === 'function') populateSettingsProfileFields();
                }
            }

            if (targetId === 'support') loadUserSupportHistory();
        });
    });


    // 3.2 Order Filters (NEW)
    document.querySelectorAll('[data-order-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-order-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOrdersTab(btn.getAttribute('data-order-filter'));
        });
    });

    // 3.3 Checkout (NEW)
    const checkoutBtn = document.getElementById('proceed-to-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cartKey = getUserKey('efv_cart');
            const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
            if (cart.length === 0) {
                showToast("Your cart is empty", "error");
                return;
            }
            initiateDashboardCheckout(cart, false);
        });
    }

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

            window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'index.html';
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
                    const resData = await res.json();
                    showToast("Profile updated successfully", "success");
                    
                    // Immediately sync with localStorage for global UI consistency
                    const legacyUser = JSON.parse(localStorage.getItem('efv_user')) || {};
                    const updatedUser = {
                        ...legacyUser,
                        name: (resData.user && resData.user.name) || data.name,
                        phone: (resData.user && resData.user.phone !== undefined) ? resData.user.phone : data.phone
                    };
                    localStorage.setItem('efv_user', JSON.stringify(updatedUser));
                    try {
                        const authUser = JSON.parse(localStorage.getItem('efv_auth_user'));
                        if (authUser) {
                            localStorage.setItem('efv_auth_user', JSON.stringify({
                                ...authUser,
                                name: updatedUser.name,
                                phone: updatedUser.phone
                            }));
                        }
                    } catch (e) {}

                    if (window.currentUserProfile) {
                        window.currentUserProfile.name = updatedUser.name;
                        window.currentUserProfile.phone = updatedUser.phone;
                    }
                    
                    // Explicitly update navbar name immediately
                    if (typeof updateAuthNavbar === 'function') updateAuthNavbar();

                    // Still fetch full data in background to stay in sync
                    fetchProfileData().catch(e => console.warn("Background fetch failed:", e));
                } else {
                    showToast("Failed to update profile", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Server error", "error");
            }
        });
    }

    // 6. Change Password Listener
    const changePassForm = document.getElementById('change-password-form');
    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('authToken');
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToast("Passwords do not match", "error");
                return;
            }

            if (newPassword.length < 6) {
                showToast("Password must be at least 6 characters", "error");
                return;
            }

            const btn = document.getElementById('change-pass-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/api/users/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast("Password updated successfully", "success");
                    changePassForm.reset();
                } else {
                    showToast(data.message || "Failed to update password", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("Server error", "error");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // 5. Initial Render
    renderCartTab();
    renderOrdersTab();
    renderLibraryTab();
    updateStats();
    if (typeof updateAuthNavbar === 'function') updateAuthNavbar();

    // Check for query param to open specific tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        if (typeof window.switchTab === 'function') {
            window.switchTab(tabParam);
        } else {
            setTimeout(() => {
                if (typeof window.switchTab === 'function') window.switchTab(tabParam);
            }, 100);
        }
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
                loadUserSupportHistory();
            }
        });
    }
});

const escapeQueryHtml = (str) => String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

function renderInquiriesList(messages, searchTerm = '') {
    const container = document.getElementById('user-support-history');
    if (!container) return;

    if (!messages || messages.length === 0) {
        if (searchTerm) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; opacity: 0.75;">
                    <div style="width: 50px; height: 50px; margin: 0 auto 15px; border-radius: 50%; background: rgba(255, 211, 105, 0.08); border: 1px solid rgba(255, 211, 105, 0.2); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-search gold-text" style="font-size: 1.3rem;"></i>
                    </div>
                    <p style="margin: 0 0 6px; font-size: 1rem; color: #fff; font-weight: 600;">No matching queries found</p>
                    <p style="margin: 0; font-size: 0.85rem; color: rgba(255, 255, 255, 0.5);">No results found for "${escapeQueryHtml(searchTerm)}". Try another search term.</p>
                </div>`;
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; opacity: 0.6;">
                    <div style="width: 50px; height: 50px; margin: 0 auto 15px; border-radius: 50%; background: rgba(255, 211, 105, 0.08); border: 1px solid rgba(255, 211, 105, 0.2); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-comment-slash gold-text" style="font-size: 1.4rem;"></i>
                    </div>
                    <p style="margin: 0; font-size: 0.95rem; color: rgba(255, 255, 255, 0.7);">No previous queries found.</p>
                </div>`;
        }
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="glass-panel inquiry-item" style="padding: 20px; margin-bottom: 20px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); border-radius: 15px; transition: transform 0.3s ease;">
            <!-- Glowing background accent -->
            <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: var(--gold-text); opacity: 0.05; filter: blur(40px); border-radius: 50%;"></div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; gap: 12px; flex-wrap: wrap;">
                <div>
                    <h4 style="margin: 0; color: var(--gold-text); font-family: 'Cinzel', serif; font-size: 1.1rem; letter-spacing: 1px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-comment-dots gold-text" style="font-size: 0.95rem; flex-shrink: 0; margin-right: 4px;"></i>
                        <span>${escapeQueryHtml(msg.subject || 'Support Query')}</span>
                    </h4>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
                        <i class="far fa-calendar-alt" style="font-size: 0.75rem; opacity: 0.6; flex-shrink: 0;"></i>
                        <span style="font-size: 0.75rem; opacity: 0.6;">${new Date(msg.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                </div>
                <span class="status-badge ${(msg.status || 'Pending').toLowerCase().replace(' ', '-')}">${msg.status || 'Pending'}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <p style="font-size: 0.95rem; line-height: 1.6; opacity: 0.9; margin: 0; color: #fff; word-break: break-word;">${escapeQueryHtml(msg.message || '')}</p>
            </div>
            
            ${msg.reply ? `
                <div class="admin-reply-box" style="margin-top: 20px; padding: 18px; background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; position: relative;">
                    <div style="position: absolute; top: 10px; left: -8px; width: 4px; height: calc(100% - 20px); background: var(--gold-text); border-radius: 10px;"></div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <div style="width: 30px; height: 30px; background: var(--gold-text); display: flex; align-items: center; justify-content: center; border-radius: 50%; flex-shrink: 0;">
                            <i class="fas fa-user-shield" style="color: #000; font-size: 0.8rem;"></i>
                        </div>
                        <span style="font-weight: 700; font-size: 0.85rem; color: var(--gold-text); text-transform: uppercase; letter-spacing: 1px;">Official Response</span>
                        <span style="font-size: 0.7rem; opacity: 0.5; margin-left: auto;">${msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString() : ''}</span>
                    </div>
                    <p style="font-size: 0.9rem; line-height: 1.6; color: #f0f0f0; margin: 0; font-style: normal; word-break: break-word;">${escapeQueryHtml(msg.reply)}</p>
                </div>
            ` : `
                <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; opacity: 0.6; font-size: 0.85rem;">
                    <i class="fas fa-clock gold-text" style="flex-shrink: 0;"></i>
                    <span>Waiting for response from our executive team...</span>
                </div>
            `}
        </div>
    `).join('');
}

function initializeUserSupportSearch() {
    const searchInput = document.getElementById('support-query-search');
    const clearBtn = document.getElementById('support-query-search-clear');
    if (!searchInput) return;

    if (searchInput.dataset.initialized === 'true') return;
    searchInput.dataset.initialized = 'true';

    const handleSearch = () => {
        const term = searchInput.value.trim().toLowerCase();
        if (clearBtn) {
            clearBtn.style.display = term ? 'block' : 'none';
        }
        const allMessages = window.currentUserSupportMessages || [];
        if (!term) {
            renderInquiriesList(allMessages);
            return;
        }
        const filtered = allMessages.filter(msg => {
            const subj = (msg.subject || '').toLowerCase();
            const body = (msg.message || '').toLowerCase();
            const reply = (msg.reply || '').toLowerCase();
            const status = (msg.status || '').toLowerCase();
            return subj.includes(term) || body.includes(term) || reply.includes(term) || status.includes(term);
        });
        renderInquiriesList(filtered, searchInput.value.trim());
    };

    searchInput.addEventListener('input', handleSearch);

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            renderInquiriesList(window.currentUserSupportMessages || []);
        });
    }
}

async function loadUserSupportHistory() {
    const container = document.getElementById('user-support-history');
    if (!container) return;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/support/my-messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const messages = await res.json();

        if (!res.ok) throw new Error(messages.message || 'Failed to fetch');

        if (Array.isArray(messages)) {
            messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            window.currentUserSupportMessages = messages;
        } else {
            window.currentUserSupportMessages = [];
        }

        initializeUserSupportSearch();

        const searchInput = document.getElementById('support-query-search');
        const currentTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (currentTerm) {
            const filtered = (window.currentUserSupportMessages || []).filter(msg => {
                const subj = (msg.subject || '').toLowerCase();
                const body = (msg.message || '').toLowerCase();
                const reply = (msg.reply || '').toLowerCase();
                const status = (msg.status || '').toLowerCase();
                return subj.includes(currentTerm) || body.includes(currentTerm) || reply.includes(currentTerm) || status.includes(currentTerm);
            });
            renderInquiriesList(filtered, searchInput.value.trim());
        } else {
            renderInquiriesList(window.currentUserSupportMessages || []);
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color: var(--error);">Failed to load history.</p>';
    }
}

// GLOBAL UI HELPERS
window.switchTab = function (tabId, subTab = null) {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    const uEmail = (user?.email || '').toLowerCase().trim();
    const isAdmin = user && (user.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com');

    // Handle settings redirection inside switchTab
    let effectiveTabId = tabId;

    // 1. Redirect Admin to Admin Settings
    if (tabId === 'settings' && isAdmin) {
        effectiveTabId = 'admin-settings';
    }

    // 2. Security: Bounce Non-Admins from Admin Sections
    if ((effectiveTabId === 'admin-settings' || effectiveTabId.startsWith('admin-')) && !isAdmin) {
        console.warn("Unauthorized access attempt blocked.");
        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html';
        return;
    }

    const tabBtn = document.querySelector(`.nav-item[data-tab="${effectiveTabId}"]`);
    if (tabBtn) {
        tabBtn.click();
    } else {
        document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

        const section = document.getElementById(effectiveTabId);
        if (section) section.classList.add('active');

        // Manual triggers if click() wasn't enough
        if (effectiveTabId === 'admin-settings') initializeAdminSettings();
        if (effectiveTabId === 'support') loadUserSupportHistory();
        if (effectiveTabId === 'settings' && typeof populateSettingsProfileFields === 'function') populateSettingsProfileFields();
    }

    if (tabId === 'settings' && typeof populateSettingsProfileFields === 'function') {
        populateSettingsProfileFields();
    }

    if (effectiveTabId === 'admin-settings' && subTab) {
        setTimeout(() => {
            const subTabBtn = document.querySelector(`.settings-tab-btn[data-admin-tab="${subTab}"]`);
            if (subTabBtn) subTabBtn.click();
        }, 100);
    } else if (tabId === 'settings' && subTab) {
        setTimeout(() => {
            const subTabBtn = document.querySelector(`.settings-tab-btn[data-settings-tab="${subTab}"]`);
            if (subTabBtn) subTabBtn.click();
        }, 100);
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
    const setV2Phone = document.getElementById('settings-phone-v2');
    if (setV2Name) setV2Name.value = user.name || '';
    if (setV2Email) setV2Email.value = user.email || '';
    if (setV2Phone) setV2Phone.value = user.phone || '';

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateDisp = document.getElementById('current-date');
    if (dateDisp) dateDisp.textContent = new Date().toLocaleDateString('en-US', options);

    // Admin Check & Sidebar Customization
    const uEmail = (user.email || '').toLowerCase().trim();
    const isAdmin = user.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com';

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
        const adminBtn = document.getElementById('sidebar-admin-btn');
        if (adminBtn) adminBtn.classList.remove('hidden');

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
    await fetchProfileData();
    if (typeof syncLibraryWithBackend === 'function') await syncLibraryWithBackend();
    updateDashboardOverview();
    loadRecommendations();
    loadRecentlyViewed();
}

window.fetchProfileData = async function () {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/users/profile?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await res.json();

        if (res.ok) {
            window.currentUserProfile = profile;

            // Sync with efv_user in localStorage for global UI consistency (Navbar name etc)
            const legacyUser = JSON.parse(localStorage.getItem('efv_user')) || {};
            const updatedUser = {
                ...legacyUser,
                name: profile.name,
                email: profile.email,
                phone: profile.phone || legacyUser.phone || '',
                role: profile.role || legacyUser.role,
                _id: profile._id || legacyUser._id
            };
            localStorage.setItem('efv_user', JSON.stringify(updatedUser));

            renderWishlistTab();
            renderNotificationsTab();
            renderSavedAddresses();
            updateDashboardOverview();
            updateStats();
            if (typeof populateSettingsProfileFields === 'function') {
                populateSettingsProfileFields();
            }
        }
    } catch (e) {
        console.error("Profile fetch error:", e);
    }
}

function updateDashboardOverview() {
    const profile = window.currentUserProfile;
    if (!profile) return;

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
    
    // Update other name displays for consistency
    const welcomeName = document.getElementById('user-name-display');
    if (welcomeName) welcomeName.textContent = profile.name;
    
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName) sidebarName.textContent = profile.name;

    // Fill form fields
    const legacyUser = JSON.parse(localStorage.getItem('efv_user')) || {};
    const nameInput = document.getElementById('settings-name-v2');
    if (nameInput) nameInput.value = profile.name || legacyUser.name || '';
    const phoneInput = document.getElementById('settings-phone-v2');
    if (phoneInput) phoneInput.value = profile.phone || legacyUser.phone || '';
    const emailInput = document.getElementById('settings-email-v2');
    if (emailInput) emailInput.value = profile.email || legacyUser.email || '';
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
                        <p style="margin:2px 0; font-size:0.8rem; opacity:0.6;">${date} • ₹${last.totalAmount}</p>
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

    // Resolve thumbnail URL the same way marketplace does
    const basePath = (typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH) ? CONFIG.BASE_PATH : '/';
    const rawThumb = target.thumbnail || '';
    let thumbUrl = basePath + 'assets/images/vol1-cover.png'; // default fallback
    if (rawThumb) {
        if (rawThumb.startsWith('http') || rawThumb.startsWith(basePath + 'assets/images/')) {
            thumbUrl = rawThumb;
        } else if (rawThumb.startsWith('img/')) {
            thumbUrl = basePath + 'assets/images/' + rawThumb.replace('img/', '');
        } else if (rawThumb.startsWith('assets/images/')) {
            thumbUrl = basePath + rawThumb;
        } else {
            thumbUrl = rawThumb; // already absolute or full URL
        }
    }

    container.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center;">
            <img src="${thumbUrl}" style="width:60px; height:85px; object-fit:cover; border-radius:8px;"
                onerror="this.src='${basePath}assets/images/vol1-cover.png'">
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

// Status helpers removed (consolidated at end)

window.syncLibraryWithBackend = async function () {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    const token = localStorage.getItem('authToken');
    if (!token) return;

    if (typeof showToast === 'function') {
        showToast('🔄 Synchronizing your library...', 'info');
    }

    try {
        const response = await fetch(`${API_BASE}/api/library/my-library`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            const libKey = getUserKey('efv_digital_library');

            const localLibrary = data.map(prod => ({
                id: prod.productId || prod._id || prod.id,
                productId: prod.productId || prod._id || prod.id,
                name: prod.title || prod.name,
                title: prod.title || prod.name,
                type: (prod.type || 'EBOOK').toUpperCase(),   // 🔧 Always store as UPPERCASE (EBOOK or AUDIOBOOK)
                thumbnail: prod.thumbnail,
                filePath: prod.filePath,
                language: prod.language || '',
                subtitle: prod.subtitle || '',
                date: prod.purchasedAt ? new Date(prod.purchasedAt).toLocaleDateString() : new Date().toLocaleDateString()
            }));

            // 🔧 FIX: Clear localStorage ONLY after getting valid data — prevents blank flash
            localStorage.removeItem(libKey);
            localStorage.setItem(libKey, JSON.stringify(localLibrary));

            if (typeof showToast === 'function') {
                showToast('✅ Library Synced! Latest versions are now available.', 'success');
            }

            const activeSub = document.querySelector('.library-sub-tab.active');
            if (activeSub) {
                if (typeof filterLibraryView === 'function') filterLibraryView(activeSub.dataset.libraryTab);
            } else {
                if (typeof renderLibraryTab === 'function') renderLibraryTab(localLibrary);
            }
            if (typeof updateStats === 'function') updateStats();
            if (typeof updateReadingProgressShortcuts === 'function') updateReadingProgressShortcuts();
        } else {
            console.warn('Library sync failed:', data.message);
            if (typeof showToast === 'function') {
                showToast('Failed to sync library: ' + (data.message || 'Server error'), 'error');
            }
        }
    } catch (error) { 
        console.error('Library sync error:', error); 
        if (typeof showToast === 'function') {
            showToast('Unable to connect to server for library sync.', 'error');
        }
    }
}


// --- TAB RENDERING: NOTIFICATIONS ---
function renderNotificationsTab(filter = 'all') {
    const profile = window.currentUserProfile;
    const container = document.getElementById('notifications-list');
    const emptyState = document.getElementById('notifications-empty-state');
    const badge = document.getElementById('unread-notifications-count');

    if (!container) return;

    let rawNotifications = (profile && profile.notifications) ? [...profile.notifications] : [];

    // 1. Ensure a professional Welcome message exists
    const hasWelcome = rawNotifications.some(n => 
        (n.title || '').toLowerCase().includes('welcome') || 
        (n.message || '').toLowerCase().includes('welcome')
    );

    if (!hasWelcome) {
        // Professional Welcome Message
        rawNotifications.push({
            id: 'welcome-system-msg',
            title: 'Welcome to EFV™ Universe',
            message: `Greetings, ${profile ? (profile.name || 'Explorer') : 'Explorer'}. We are honored to have you on this journey of Energy, Frequency, and Vibration. Explore your dashboard to unlock the secrets of human transformation and digital wisdom.`,
            type: 'System',
            createdAt: new Date().toISOString(),
            isRead: true,
            isSystem: true
        });
    }

    // 2. Separate Welcome from others
    const welcomeNotes = rawNotifications.filter(n =>
        (n.title || '').toLowerCase().includes('welcome') || (n.message || '').toLowerCase().includes('welcome')
    );
    const otherNotes = rawNotifications.filter(n =>
        !(n.title || '').toLowerCase().includes('welcome') && !(n.message || '').toLowerCase().includes('welcome')
    );

    // Sort others by newest first
    otherNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Combine: Welcome always on top
    let notifications = [...welcomeNotes, ...otherNotes];

    // 3. Apply filter
    if (filter !== 'all') {
        notifications = notifications.filter(n => {
            if (filter === 'orders') return n.type === 'Order' || n.type === 'Shipment';
            if (filter === 'payments') return n.type === 'Payment' || n.type === 'Subscription';
            if (filter === 'offers') return n.type === 'Promo' || n.type === 'Digital';
            return true;
        });
    }

    if (notifications.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
    }

    const unreadCount = rawNotifications.filter(n => !n.isRead).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    container.innerHTML = notifications.map(note => {
        const icon = getNotificationIcon(note.type);
        const noteId = note._id || note.id;

        const isWelcome = (note.title || '').toLowerCase().includes('welcome') ||
                          (note.message || '').toLowerCase().includes('welcome');

        return `
            <div class="notification-item ${note.isRead ? '' : 'unread'} ${isWelcome ? 'welcome-note' : ''}" 
                 ${!isWelcome ? `onclick="markNotificationRead('${noteId}')"` : ''}>
                <div class="notification-icon ${note.type ? note.type.toLowerCase() : 'system'}">${icon}</div>
                <div class="notification-body">
                    <h5>${note.title}</h5>
                    <p>${note.message}</p>
                    <span class="notification-time">${isWelcome ? 'PINNED • OFFICIAL ACCESS' : new Date(note.createdAt).toLocaleString()}</span>
                </div>
                ${!isWelcome ? `
                    <button class="notification-delete-btn" onclick="deleteNotification(event, '${noteId}')" title="Delete Notification">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                ` : `
                    <div class="welcome-badge">
                        <i class="fas fa-crown"></i>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

function getNotificationIcon(type) {
    if (!type) return '<i class="fas fa-bell"></i>';
    switch (type) {
        case 'Order': return '<i class="fas fa-shopping-bag"></i>';
        case 'Shipment': return '<i class="fas fa-truck"></i>';
        case 'Digital': return '<i class="fas fa-play-circle"></i>';
        case 'System': return '<i class="fas fa-shield-alt"></i>';
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

window.deleteNotification = async function (event, id) {
    if (event) event.stopPropagation(); // Prevent marking as read

    console.log(`🗑️ Delete button clicked for ID: ${id}`);

    // Optimistic UI: Remove from screen immediately
    const noteElement = event.target.closest('.notification-item');
    if (noteElement) {
        noteElement.style.transition = 'all 0.4s ease';
        noteElement.style.opacity = '0';
        noteElement.style.transform = 'translateX(50px)';
        setTimeout(() => noteElement.remove(), 400);
    }

    try {
        console.log(`📤 Sending DELETE request for notification: ${id}`);
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/users/notifications/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        console.log("📥 Server response:", data);

        if (res.ok) {
            console.log("Successfully deleted from server");
            // Also purge from in-memory profile so re-renders don't resurrect it
            if (window.currentUserProfile && window.currentUserProfile.notifications) {
                window.currentUserProfile.notifications = window.currentUserProfile.notifications.filter(n => {
                    const nId = (n._id || n.id || '').toString();
                    return nId !== id.toString() &&
                        nId.replace(/-/g, '_') !== id.toString() &&
                        nId.replace(/_/g, '-') !== id.toString();
                });
            }
        } else {
            console.error(`Delete fail (${res.status}):`, data);
            showToast(data.message || `Failed to delete from server`, 'error');
            // Re-fetch to bring back the item if it failed
            fetchProfileData();
        }
    } catch (e) {
        console.error("Delete notification error:", e);
        // Re-fetch to bring back the item if it failed
        fetchProfileData();
    }
}

// --- SET DEFAULT ADDRESS ---
window.setAsDefaultAddress = async function (id) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/users/address/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isDefault: true })
        });

        if (res.ok) {
            showToast('Default address updated!', 'success');
            fetchProfileData();
        } else {
            showToast('Failed to update default address', 'error');
        }
    } catch (e) {
        console.error("Set default address error:", e);
        showToast('Error connecting to server', 'error');
    }
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

    container.style.display = 'grid';
    container.style.gap = '20px';
    container.style.gridTemplateColumns = '1fr';

    container.innerHTML = profile.savedAddresses.map(addr => {
        const addrId = addr._id || addr.id;
        return `
        <div class="address-card ${addr.isDefault ? 'default' : ''}" style="margin-bottom: 25px; padding: 20px; border-radius: 12px; background: rgba(10, 10, 10, 0.4); border: 1px solid ${addr.isDefault ? '#FFD700' : 'rgba(255, 211, 105, 0.15)'}; box-shadow: none; cursor: ${addr.isDefault ? 'default' : 'pointer'};" ${!addr.isDefault ? `onclick="setAsDefaultAddress('${addrId}')"` : ''}>
            <h5 style="color:var(--gold-text); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span>${addr.type || 'Home'} ${addr.isDefault ? '<span class="default-badge" style="font-size: 0.65rem; background: #FFD700; color: black; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">Default</span>' : ''}</span>
                <i class="fas ${addr.type === 'Work' ? 'fa-briefcase' : 'fa-home'}" style="opacity:0.3;"></i>
            </h5>
            <p class="address-text">
                <strong>${addr.fullName}</strong><br>
                ${addr.house}, ${addr.area}<br>
                ${addr.landmark ? `<span style="font-size:0.8rem; opacity:0.6;">Landmark: ${addr.landmark}</span><br>` : ''}
                ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                Phone: ${addr.phone}
            </p>
            <div class="address-actions" style="margin-top:15px; display:flex; gap:10px;">
                ${!addr.isDefault ? `<button class="btn btn-outline small" onclick="event.stopPropagation(); setAsDefaultAddress('${addrId}')">Set Default</button>` : ''}
                <button class="btn btn-outline small" onclick="event.stopPropagation(); openAddressModal('${addrId}')">Edit</button>
                <button class="btn btn-danger small" style="background:rgba(255,0,0,0.1); border-color:rgba(255,0,0,0.2); color:#ff6b6b;" onclick="event.stopPropagation(); deleteAddress('${addrId}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `;
    }).join('');
}

// --- TAB RENDERING: ORDERS ---
async function renderOrdersTab(filter = 'all') {
    const token = localStorage.getItem('authToken');
    const container = document.getElementById('dashboard-orders-list');
    const emptyState = document.getElementById('orders-empty-state');
    if (!container) return;

    container.innerHTML = `<div class="skeleton" style="height: 150px; border-radius: 12px; margin-bottom: 20px;"></div>`;

    try {
        const [ordersRes, returnsRes] = await Promise.all([
            fetch(`${API_BASE}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE}/api/returns/my-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        let orders = ordersRes.ok ? await ordersRes.json() : [];
        const returns = returnsRes.ok ? await returnsRes.json() : [];

        // Apply filters
        if (filter === 'active') {
            const inactiveStatuses = ['delivered', 'cancelled', 'returned', 'failed'];
            orders = orders.filter(o => o.status && !inactiveStatuses.includes(o.status.toLowerCase()));
        } else if (filter !== 'all') {
            orders = orders.filter(o => o.status && o.status.toLowerCase() === filter.toLowerCase());
        }

        if (orders.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        // Helper: format amount with correct currency symbol based on order's country
        const COUNTRY_CURRENCY_MAP = {
            'India': 'INR', 'IN': 'INR', 'IND': 'INR',
            'United States': 'USD', 'US': 'USD', 'USA': 'USD',
            'United Kingdom': 'GBP', 'UK': 'GBP', 'GB': 'GBP',
            'Germany': 'EUR', 'France': 'EUR', 'Spain': 'EUR', 'Italy': 'EUR', 'Portugal': 'EUR',
            'DE': 'EUR', 'FR': 'EUR', 'ES': 'EUR', 'IT': 'EUR', 'PT': 'EUR',
            'United Arab Emirates': 'AED', 'UAE': 'AED', 'AE': 'AED',
            'Saudi Arabia': 'SAR', 'SA': 'SAR',
            'Japan': 'JPY', 'JP': 'JPY',
            'China': 'CNY', 'CN': 'CNY',
            'South Korea': 'KRW', 'KR': 'KRW',
            'Canada': 'CAD', 'CA': 'CAD',
            'Australia': 'AUD', 'AU': 'AUD',
            'Singapore': 'SGD', 'SG': 'SGD',
        };
        const CURRENCY_SYMBOLS = {
            'INR': '₹', 'USD': '$', 'GBP': '£', 'EUR': '€',
            'AED': 'AED ', 'SAR': 'SAR ', 'JPY': '¥', 'CNY': '¥',
            'KRW': '₩', 'CAD': 'CA$', 'AUD': 'A$', 'SGD': 'S$'
        };
        const getOrderCurrencySymbol = (order) => {
            // PRIORITY 1: Use the payment currency stored directly on the order
            const pCurr = (order?.paymentCurrency || order?.currency || '').toUpperCase().trim();
            if (pCurr && CURRENCY_SYMBOLS[pCurr]) {
                return CURRENCY_SYMBOLS[pCurr];
            }
            // PRIORITY 2: Fallback to country-based lookup
            const country = order?.customer?.address?.country   // ← nested address object
                         || order?.customer?.country             // ← flat field fallback
                         || order?.address?.country
                         || 'India';
            const countryClean = (country || '').trim();
            const currency = COUNTRY_CURRENCY_MAP[countryClean] || 'INR';
            return CURRENCY_SYMBOLS[currency] || '₹';
        };

        container.innerHTML = orders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            const statusClass = order.status ? `status-${order.status.toLowerCase().replace(/\s/g, '-')}` : 'status-unknown';

            // Check for Return Request status
            const returnReq = returns.find(r => r.orderId === order.orderId);
            let returnStatusHtml = '';
            if (returnReq) {
                const badgeClass = `status-${returnReq.status.toLowerCase()}`;
                returnStatusHtml = `
                    <div style="margin-top: 10px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
                        <span style="opacity: 0.6;">Return Status:</span>
                        <span class="status-badge ${badgeClass}" style="padding: 2px 10px; border-radius: 4px; font-weight: 700;">${returnReq.status}</span>
                    </div>
                `;
            }

            // Calculate Return Window (7 Days)
            let returnButtonHtml = '';
            if (order.status === 'Delivered') {
                const deliveryEntry = order.timeline.find(t => t.status === 'Delivered');
                const deliveryDate = deliveryEntry ? new Date(deliveryEntry.timestamp) : new Date(order.updatedAt);
                const diffTime = Math.abs(new Date() - deliveryDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 7) {
                    returnButtonHtml = `
                        <button class="btn btn-outline small return-btn" style="border-radius: 8px; border-color: #ff9800; color: #ff9800;" 
                            onclick="openReturnModal('${order.orderId}', '${encodeURIComponent(JSON.stringify(order.items))}')">
                            <i class="fas fa-undo"></i> Return / Replace
                        </button>
                    `;
                } else {
                    returnButtonHtml = `
                        <span style="font-size: 0.7rem; opacity: 0.5; color: #ff5252; font-weight: 600;">
                            <i class="fas fa-times-circle"></i> Return window closed
                        </span>
                    `;
                }
            }

            // Format items as a professional list with robust amount formatting & visibility
            const curSym = getOrderCurrencySymbol(order);
            const itemsHtml = (order.items || []).map(item => {
                const qty = Number(item.quantity) || 1;
                let unitPrice = Number(item.price);
                if (isNaN(unitPrice) || unitPrice <= 0) {
                    unitPrice = (Number(item.totalPrice) / qty) || Number(item.unitPrice) || 0;
                }
                if (unitPrice <= 0 && order.totalAmount > 0 && (order.items || []).length === 1) {
                    unitPrice = Number(order.totalAmount) / qty;
                }
                const lineTotal = unitPrice * qty;
                const formattedTotal = isNaN(lineTotal) ? '0' : lineTotal.toLocaleString('en-IN');
                const formattedUnit = isNaN(unitPrice) ? '0' : unitPrice.toLocaleString('en-IN');

                return `
                <div style="display:flex; justify-content:space-between; align-items:center; gap: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex; flex-direction:column; min-width: 0; flex: 1;">
                        <span style="font-size: 0.92rem; font-weight: 600; color: #ffffff; word-break: break-word; line-height: 1.4;">${item.title || 'Product'}</span>
                        <span style="font-size: 0.74rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px;">
                            ${item.type || 'Standard'} &bull; Qty: <strong style="color: #ffffff;">${qty}</strong>
                        </span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; white-space: nowrap;">
                        <span class="gold-text" style="font-size: 0.98rem; font-weight: 800; color: #FFD369 !important; letter-spacing: 0.3px; display: inline-block;">
                            ${curSym}${formattedTotal}
                        </span>
                        ${qty > 1 ? `<span style="font-size: 0.7rem; color: rgba(255,255,255,0.5); margin-top: 2px;">(${curSym}${formattedUnit} each)</span>` : ''}
                    </div>
                </div>
                `;
            }).join('');

            // --- Detect Digital Order ---
            const digitalTypes = ['ebook', 'e-book', 'audiobook', 'audio book', 'digital'];
            const isDigitalOrder = order.items.every(item =>
                digitalTypes.some(t => (item.type || '').toLowerCase().includes(t))
            );

            // --- Cancel Button Logic ---
            // Cancellable statuses (before pickup) - hidden for digital
            const cancellableStatuses = ['Pending', 'Processing', 'Packed', 'Created', 'AWB Generated', 'Label Generated', 'Manifest Generated'];
            const blockedFromCancel = ['Picked Up', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'];

            let cancelHtml = '';
            if (!isDigitalOrder) {
                if (!blockedFromCancel.includes(order.status)) {
                    cancelHtml = `
                        <button class="btn btn-outline small" 
                            style="border-radius: 8px; border-color: rgba(255,80,80,0.4); color: #ff6b6b;"
                            onclick="confirmCancelOrder('${order.orderId}')">
                            <i class="fas fa-times-circle"></i> Cancel Order
                        </button>
                    `;
                } else if (order.status === 'Cancelled') {
                    cancelHtml = `
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                            <span style="font-size: 0.75rem; color: #ff6b6b; opacity: 0.7; font-weight: 600;">
                                <i class="fas fa-ban"></i> Cancelled
                            </span>
                            ${order.awbNumber ? `
                                <button class="btn btn-outline" style="font-size: 0.65rem; padding: 4px 8px; border-color: rgba(255,211,105,0.3); color: var(--gold-text); border-radius: 6px;" 
                                    onclick="syncSingleOrderStatus('${order.orderId}')" title="Sync live status from NimbusPost">
                                    <i class="fas fa-sync"></i> Sync Live Status
                                </button>
                            ` : ''}
                        </div>
                    `;
                } else if (['Picked Up', 'Shipped', 'In Transit', 'Out for Delivery'].includes(order.status)) {
                    cancelHtml = `
                        <span style="font-size: 0.7rem; color: rgba(255,150,80,0.7); font-weight: 600;" title="Order already picked up">
                            <i class="fas fa-lock"></i> Cannot Cancel
                        </span>
                    `;
                }
            }

            // --- DELETE OPTION (for all users on Cancelled/Failed orders) ---
            const userInfo = JSON.parse(localStorage.getItem('efv_user') || '{}');
            const uEmail = (userInfo.email || '').toLowerCase().trim();
            const isAdmin = userInfo.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com';
            let deleteHtml = '';
            if (['Cancelled', 'Failed', 'Payment Failed'].includes(order.status)) {
                deleteHtml = `
                    <button class="btn btn-outline small" 
                        style="border-radius: 8px; border-color: rgba(255,80,80,0.4); color: #ff5252; font-size: 0.78rem;" 
                        onclick="window.deleteOrder('${order._id}')"
                        title="Remove this record from your history">
                        <i class="fas fa-trash-alt"></i> Delete Record
                    </button>
                `;
            }

            return `
                <div class="glass-panel fade-in" style="padding: 24px; border-radius: 18px; margin-bottom: 25px; border: 1px solid rgba(255,211,105,0.08); position: relative; overflow: hidden; background: linear-gradient(145deg, rgba(30,30,30,0.4) 0%, rgba(20,20,20,0.6) 100%);">
                    <!-- Top Ribbon for Status -->
                    <div style="position:absolute; top: 0; right: 0; padding: 6px 20px; border-bottom-left-radius: 12px; font-size: 0.65rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;" class="${statusClass}">
                        ${order.status}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <span style="font-size: 0.7rem; opacity: 0.4; letter-spacing: 1px; text-transform: uppercase; display:block; margin-bottom: 4px;">Order Tracking ID</span>
                            <h3 style="margin: 0; font-family: 'Cinzel'; color: var(--gold-text); font-size: 1.2rem; filter: drop-shadow(0 0 10px rgba(212,175,55,0.1));">#${order.orderId}</h3>
                            <p style="margin: 8px 0 0; font-size: 0.8rem; opacity: 0.5;"><i class="far fa-calendar-alt"></i> ${date}</p>
                            ${order.purchasedThroughOffer === 'Yes' ? `
                                <div style="display: inline-block; margin-top: 8px; padding: 4px 10px; background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 20px; font-size: 0.68rem; color: #FFD369; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <i class="fas fa-gift" style="margin-right: 4px;"></i> Offer Applied: ${order.offerName || 'Special Offer'}
                                </div>
                            ` : ''}
                            ${returnStatusHtml}
                        </div>
                        <div style="text-align: right; padding-top: 15px; flex-shrink: 0; white-space: nowrap;">
                            <span style="font-size: 0.7rem; opacity: 0.6; display:block; margin-bottom: 4px; letter-spacing: 1px; font-weight: 600;">TOTAL AMOUNT</span>
                            <h2 style="margin: 0; color: #fff; font-weight: 800; font-size: 1.4rem;">${curSym}${Number(order.totalAmount || 0).toLocaleString('en-IN')}</h2>
                        </div>
                    </div>
                    
                    <div style="padding: 15px 20px; background: rgba(0,0,0,0.2); border-radius: 14px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.03);">
                        <div style="margin-bottom: 10px; opacity: 0.4; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px;">ORDERED ITEMS (${order.items.length})</div>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${itemsHtml}
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                        ${(order.status !== 'Cancelled' && order.status !== 'Failed') ? `
                            ${isDigitalOrder ? '' : returnButtonHtml}
                            ${isDigitalOrder ? '' : `
                                <a href="tracking.html?id=${order.orderId}" target="_blank" class="btn btn-outline small" style="border-radius: 8px; border-color: rgba(255,211,105,0.3); color: var(--gold-text); text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-satellite-dish"></i> Track Order
                                </a>
                            `}
                            <button class="btn btn-outline small" style="border-radius: 8px;" onclick="viewOrderDetail('${order._id}', 'details')">
                                <i class="fas fa-list-ul" style="margin-right:6px;"></i> Details
                            </button>
                            <button class="btn btn-gold small" style="border-radius: 8px; box-shadow: 0 4px 15px rgba(212,175,55,0.2);" onclick="downloadInvoice('${order._id}')">
                                <i class="fas fa-file-invoice" style="margin-right:6px;"></i> Invoice
                            </button>
                        ` : `
                            <button class="btn btn-outline small" style="border-radius: 8px;" onclick="viewOrderDetail('${order._id}', 'details')">
                                <i class="fas fa-list-ul" style="margin-right:6px;"></i> Details
                            </button>
                            <button class="btn btn-gold small" style="border-radius: 8px;" onclick="downloadInvoice('${order._id}')">
                                <i class="fas fa-file-invoice" style="margin-right:6px;"></i> Invoice
                            </button>
                        `}
                        ${cancelHtml}
                        ${deleteHtml}
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error('Error rendering orders:', e);
        if (container) container.innerHTML = '<p>Failed to load orders.</p>';
    }
}

async function syncOrdersStatus() {
    const token = localStorage.getItem('authToken');
    const syncBtn = document.querySelector('button[onclick*="syncOrdersStatus"]');
    const originalText = syncBtn ? syncBtn.innerHTML : '<i class="fas fa-sync-alt"></i> Sync';
    if (syncBtn) {
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
        syncBtn.disabled = true;
    }
    try {
        const res = await fetch(`${API_BASE}/api/orders/sync-all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.updatedCount > 0) {
            showToast(`🔄 Synced ${data.updatedCount} status changes`, 'success');
        } else if (data.success) {
            showToast('✅ All statuses match NimbusPost', 'success');
        }
        await renderOrdersTab();
    } catch (e) {
        console.error(e);
        showToast('Sync failed. Please try later.', 'error');
    } finally {
        if (syncBtn) {
            syncBtn.innerHTML = originalText;
            syncBtn.disabled = false;
        }
    }
}

async function syncSingleOrderStatus(orderId) {
    const token = localStorage.getItem('authToken');
    if (typeof showToast === 'function') showToast(`🔄 Syncing status for #${orderId}...`, 'info');
    try {
        const res = await fetch(`${API_BASE}/api/orders/track-by-order/${orderId}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (res.ok) {
            const currentStatus = data.data?.status || (typeof data.status === 'string' ? data.status : null) || 'Updated';
            if (typeof showToast === 'function') showToast(`✅ Status updated to: ${currentStatus}`, 'success');
            if (typeof renderOrdersTab === 'function') renderOrdersTab();
        } else {
            if (typeof showToast === 'function') showToast(data.message || 'Sync failed', 'error');
        }
    } catch (e) {
        console.error(e);
        if (typeof showToast === 'function') showToast('Sync failed. Please try later.', 'error');
    }
}

// --- CANCEL ORDER SYSTEM ---

window.confirmCancelOrder = function (orderId) {
    // Create a sleek custom confirmation modal
    const existing = document.getElementById('cancel-confirm-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'cancel-confirm-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999;
    `;
    modal.innerHTML = `
        <div style="
            background: linear-gradient(145deg, rgba(25,25,30,0.98), rgba(15,15,20,0.99));
            border: 1px solid rgba(255,80,80,0.2);
            border-radius: 20px; padding: 35px; max-width: 420px; width: 92%;
            text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.6);
        ">
            <div style="width: 60px; height: 60px; background: rgba(255,80,80,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <i class="fas fa-exclamation-triangle" style="color: #ff6b6b; font-size: 1.5rem;"></i>
            </div>
            <h2 style="margin: 0 0 12px; font-family: 'Cinzel', serif; letter-spacing: 1px; color: #fff; font-size: 1.2rem;">Cancel this order?</h2>
            <p style="opacity: 0.6; font-size: 0.85rem; margin-bottom: 25px; line-height: 1.6;">Are you sure you want to cancel order <strong style="color: var(--gold-text);">#${orderId}</strong>? This action cannot be undone.</p>
            
            <div style="background: rgba(255,80,80,0.05); border: 1px solid rgba(255,80,80,0.1); border-radius: 10px; padding: 12px; margin-bottom: 20px;">
                <p style="font-size: 0.75rem; opacity: 0.7; margin: 0;">
                    <i class="fas fa-info-circle" style="color: #ff9800;"></i>
                    If you paid online, your refund will be processed within <strong>5–7 business days</strong>.
                </p>
            </div>

            <div style="display: flex; gap: 12px; justify-content: center;">
                <button id="btn-confirm-cancel" onclick="executeCancelOrder('${orderId}')" 
                    style="flex: 1.5; padding: 13px; background: linear-gradient(135deg, #ff4d4d, #cc0000); border: none; border-radius: 10px; color: #fff; font-weight: 700; cursor: pointer; font-size: 0.9rem; letter-spacing: 0.5px;">
                    <i class="fas fa-times-circle"></i> Yes, Cancel Order
                </button>
                <button onclick="document.getElementById('cancel-confirm-modal').remove()" 
                    style="flex: 1; padding: 13px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                    No
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    // Close on backdrop click
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

window.executeCancelOrder = async function (orderId) {
    const confirmBtn = document.getElementById('btn-confirm-cancel');
    if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
        confirmBtn.disabled = true;
    }

    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${API_BASE}/api/orders/cancel/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason: 'User requested cancellation' })
        });

        const data = await res.json();

        // Close modal
        const modal = document.getElementById('cancel-confirm-modal');
        if (modal) modal.remove();

        if (res.ok) {
            showToast('✅ Order cancelled successfully. Refund (if applicable) will be processed in 5–7 business days.', 'success');
            setTimeout(() => renderOrdersTab(), 1500);
        } else {
            showToast(data.message || 'Failed to cancel order', 'error');
        }
    } catch (error) {
        console.error('Cancel Order Error:', error);
        showToast('Connection error. Please try again.', 'error');
        if (confirmBtn) {
            confirmBtn.innerHTML = '<i class="fas fa-times-circle"></i> Yes, Cancel Order';
            confirmBtn.disabled = false;
        }
    }
};

// --- FILTER SYSTEM ---
window.updateOrderFilter = function (filter, element) {
    // UI update
    document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
    element.classList.add('active');

    // Logic
    renderOrdersTab(filter);
};

window.deleteOrder = async function (id) {
    // Styled confirmation modal
    const existingModal = document.getElementById('delete-confirm-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'delete-confirm-modal';
    modal.innerHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
            <div class="glass-panel" style="width: 360px; padding: 35px; border-radius: 20px; text-align: center; border:1px solid rgba(255,80,80,0.2);">
                <div style="width:60px; height:60px; background:rgba(255,80,80,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; border:1px solid rgba(255,80,80,0.3);">
                    <i class="fas fa-trash-alt" style="font-size:1.5rem; color:#ff5252;"></i>
                </div>
                <h3 style="font-family:'Cinzel',serif; color:#ff5252; margin-bottom:10px;">Delete Record?</h3>
                <p style="opacity:0.6; font-size:0.9rem; margin-bottom:25px;">This will permanently remove this order from your history. This action cannot be undone.</p>
                <div style="display:flex; gap:12px; justify-content:center;">
                    <button id="btn-cancel-delete" class="btn btn-outline" style="border-radius:10px; flex:1;">
                        <i class="fas fa-times"></i> Keep It
                    </button>
                    <button id="btn-confirm-delete" class="btn" style="background:rgba(255,80,80,0.15); border:1px solid rgba(255,80,80,0.4); color:#ff5252; border-radius:10px; flex:1;">
                        <i class="fas fa-trash-alt"></i> Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-cancel-delete').addEventListener('click', () => modal.remove());
    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
        document.getElementById('btn-confirm-delete').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        document.getElementById('btn-confirm-delete').disabled = true;

        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${API_BASE}/api/orders/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            modal.remove();
            if (res.ok) {
                showToast('🗑️ Order record deleted', 'success');
                // Auto re-render keeping current active filter
                const activeFilter = document.querySelector('.filter-pill.active')?.textContent?.trim()?.toLowerCase();
                const filterMap = { 'all orders': 'all', 'active': 'active', 'shipped': 'shipped', 'delivered': 'delivered', 'cancelled': 'cancelled' };
                renderOrdersTab(filterMap[activeFilter] || 'all');
            } else {
                const data = await res.json();
                showToast(data.message || 'Error deleting order', 'error');
            }
        } catch (e) {
            modal.remove();
            showToast('Connection error. Please try again.', 'error');
        }
    });
};



// --- RETURN SYSTEM HANDLERS ---

window.openReturnModal = function (orderId, itemsEncoded) {
    const items = JSON.parse(decodeURIComponent(itemsEncoded));
    const modal = document.getElementById('return-modal');
    const orderIdInput = document.getElementById('return-order-id');
    const displayIdInput = document.getElementById('display-order-id');
    const itemsList = document.getElementById('return-items-list');

    if (!modal) return;

    orderIdInput.value = orderId;
    displayIdInput.value = `#${orderId}`;

    itemsList.innerHTML = items.map(item => `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <i class="fas fa-box" style="color: var(--gold-text); font-size: 0.8rem;"></i>
            <span>${item.title}</span>
            <span style="margin-left: auto; opacity: 0.5;">Qty: ${item.quantity}</span>
        </div>
    `).join('');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeReturnModal = function () {
    const modal = document.getElementById('return-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('return-request-form').reset();
};

// Handle Return Form Submission
document.addEventListener('DOMContentLoaded', () => {
    const returnForm = document.getElementById('return-request-form');
    if (returnForm) {
        returnForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const token = localStorage.getItem('authToken');
            const submitBtn = returnForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            const orderId = document.getElementById('return-order-id').value;
            const reason = document.getElementById('return-reason').value;
            const proofFile = document.getElementById('return-proof').files[0];

            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('reason', reason);
            if (proofFile) formData.append('imageProof', proofFile);

            const itemsRes = await fetch(`${API_BASE}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allOrders = await itemsRes.json();
            const specificOrder = allOrders.find(o => o.orderId === orderId);
            formData.append('items', JSON.stringify(specificOrder.items));

            try {
                const res = await fetch(`${API_BASE}/api/returns/request`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    showToast(data.message, "success");
                    closeReturnModal();
                    renderOrdersTab();
                } else {
                    showToast(data.message || "Failed to submit request", "error");
                }
            } catch (error) {
                console.error('Return Submit Error:', error);
                showToast("Connection error", "error");
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// --- TAB RENDERING: LIBRARY ---
// --- TAB RENDERING: LIBRARY ---
function renderLibraryTab(directData = null, typeFilter = null) {
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
        if (!progress) return `<div class="card-progress-container" id="profile-prog-${prodId}" style="margin-top:10px; display:none;"></div>`;
        const percent = progress.progress || 0;
        return `
            <div class="card-progress-container" id="profile-prog-${prodId}" style="margin-top:10px;">
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

        const rawType = (item.type || '').toUpperCase();  // 🔧 Always uppercase for consistent check
        const isAudio = rawType === 'AUDIOBOOK' || rawType.includes('AUDIO');
        const actionLabel = isAudio ? 'Listen Now' : 'Read Now';
        const icon = isAudio ? 'fa-headphones' : 'fa-book-open';
        const typeDisplay = isAudio ? 'Audiobook' : 'E-Book'; // 🔧 Clean display label

        // Thumbnail resolution - same logic as marketplace.html
        let imageUrl = CONFIG.BASE_PATH + 'assets/images/vol1-cover.png';
        if (item.thumbnail) {
            if (item.thumbnail.startsWith('http') || item.thumbnail.startsWith(CONFIG.BASE_PATH + 'assets/images/')) {
                imageUrl = item.thumbnail;
            } else if (item.thumbnail.startsWith('img/')) {
                imageUrl = CONFIG.BASE_PATH + 'assets/images/' + item.thumbnail.replace('img/', '');
            } else if (item.thumbnail.startsWith('assets/images/')) {
                imageUrl = CONFIG.BASE_PATH + item.thumbnail;
            } else {
                imageUrl = `${API_BASE}/${item.thumbnail}`;
            }
        }

        // Fetch progress in background if not cached
        if (!progress) {
            fetchProgress(prodId).then(p => {
                if (p) {
                    const wrap = document.getElementById(`profile-prog-${prodId}`);
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
                    <span class="card-type-badge">${typeDisplay}</span>
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
                        <button class="btn-dashboard" onclick="removeFromLibrary('${prodId}')" style="background: rgba(255, 77, 77, 0.1); border: 1px solid rgba(255, 77, 77, 0.2); color: #ff4d4d; border-radius: 8px; width: 44px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer;" onmouseenter="this.style.background='rgba(255,77,77,0.2)'" onmouseleave="this.style.background='rgba(255,77,77,0.1)'" title="Remove from Library">
                            <i class="fas fa-trash-alt"></i>
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
    let backendSuccess = false;

    try {
        if (token) {
            const res = await fetch(`${API_BASE}/api/library/my-library/${prodId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                backendSuccess = true;
                console.log('✅ Item permanently removed from library backend');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.warn('Backend delete failed:', errData.message);
                // Still remove from localStorage even if not found on backend
            }
        }
    } catch (e) {
        console.warn('Backend delete error:', e);
    }

    // Always remove from localStorage for instant UI update
    const libKey = getUserKey('efv_digital_library');
    let library = JSON.parse(localStorage.getItem(libKey)) || [];
    library = library.filter(item => {
        const id = (item.productId || item.id || item._id || '').toString();
        return id !== prodId.toString();
    });
    localStorage.setItem(libKey, JSON.stringify(library));
    renderLibraryTab();
    if (typeof updateStats === 'function') updateStats();
    if (backendSuccess) showToast('Item permanently removed from library', 'success');
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

// --- SECURE MULTI-STEP CHECKOUT SYSTEM ---
window.checkoutState = {
    items: [],
    selectedAddressId: null,
    isSingleItemMode: false,
    cartIdToRemove: null
};

window.initiateDashboardCheckout = async function (items, isSingleItemMode = false, cartIdToRemove = null) {
    if (!items || items.length === 0) {
        showToast("No items to checkout", "error");
        return;
    }

    window.checkoutState = {
        items: items,
        selectedAddressId: null,
        isSingleItemMode: isSingleItemMode,
        cartIdToRemove: cartIdToRemove,
        appliedOffer: null
    };

    // Fetch explicitly claimed offer details
    const claimedOfferId = localStorage.getItem('efv_checkout_offer_id');
    if (claimedOfferId) {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_BASE}/api/offers/${claimedOfferId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                window.checkoutState.appliedOffer = await res.json();
            }
        } catch (e) {
            console.error("Error fetching checkout offer details:", e);
        }
    }

    const overlay = document.getElementById('checkout-overlay');
    const container = document.getElementById('checkout-container-v2');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.classList.add('modal-open');
        if (container) {
            container.classList.add('step-1');
            container.classList.remove('step-2');
        }
        renderCheckoutPricing();
        renderCheckoutAddresses();
        backToAddress(); // Reset to step 1
    }
};

window.closeCheckout = () => {
    const overlay = document.getElementById('checkout-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
};

function renderCheckoutPricing() {
    const items = window.checkoutState.items;
    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.price) * (parseInt(i.quantity) || 1)), 0);
    
    const selectedCountry = localStorage.getItem('efv_selected_country') || 'IN';
    const CURRENCY_MAP = {
        'IN': '₹', 'US': '$', 'GB': '£', 'DE': '€', 'FR': '€', 'ES': '€', 'IT': '€', 'PT': '€',
        'AE': 'AED ', 'SA': 'SAR ', 'CN': '¥', 'JP': '¥', 'RU': '₽', 'KR': '₩'
    };
    const activeCurrency = CURRENCY_MAP[selectedCountry] || '$';

    let offerDiscount = 0;
    const offer = window.checkoutState.appliedOffer;
    if (offer) {
        const oType = offer.offerType || offer.type || 'Percentage';
        if (oType === 'Percentage' || oType === 'FlashSale' || oType === 'Festival') {
            const pct = Number(offer.discountValue || offer.discountRules?.percentage || 0);
            items.forEach(item => {
                const isApplicable = !offer.products || offer.products.length === 0 || offer.products.some(op => {
                    const opId = op.productId || op;
                    const itemId = item.id || item.productId || item._id;
                    return String(opId) === String(itemId);
                });
                if (isApplicable) {
                    offerDiscount += (parseFloat(item.price) * (parseInt(item.quantity) || 1)) * (pct / 100);
                }
            });
        } else if (oType === 'Flat') {
            const amt = Number(offer.discountValue || offer.discountRules?.flatAmount || 0);
            items.forEach(item => {
                const isApplicable = !offer.products || offer.products.length === 0 || offer.products.some(op => {
                    const opId = op.productId || op;
                    const itemId = item.id || item.productId || item._id;
                    return String(opId) === String(itemId);
                });
                if (isApplicable) {
                    offerDiscount += Math.min(parseFloat(item.price) * (parseInt(item.quantity) || 1), amt * (parseInt(item.quantity) || 1));
                }
            });
        } else if (oType === 'BOGO' && offer.buyXGetYRules) {
            const rules = offer.buyXGetYRules;
            if (rules.buyProductId && rules.freeProductId) {
                const buyItem = items.find(it => String(it.id || it.productId) === String(rules.buyProductId));
                const freeItem = items.find(it => String(it.id || it.productId) === String(rules.freeProductId));
                if (buyItem && buyItem.quantity >= rules.requiredQty && freeItem) {
                    const timesApplied = Math.floor(buyItem.quantity / rules.requiredQty);
                    const freeQtyEligible = timesApplied * rules.freeQty;
                    const actualFreeQty = Math.min(freeItem.quantity, freeQtyEligible);
                    offerDiscount += actualFreeQty * parseFloat(freeItem.price);
                }
            }
        } else if (oType === 'Combo' && offer.comboRules) {
            const rules = offer.comboRules;
            if (Array.isArray(rules.products) && rules.products.length > 0) {
                const matchingItems = rules.products.map(pId => items.find(it => String(it.id || it.productId) === String(pId) && it.quantity > 0)).filter(Boolean);
                if (matchingItems.length === rules.products.length) {
                    const maxSets = Math.min(...matchingItems.map(it => it.quantity));
                    const regularSum = matchingItems.reduce((sum, it) => sum + parseFloat(it.price), 0);
                    const comboPrice = Number(rules.comboPrice || 0);
                    if (regularSum > comboPrice && maxSets > 0) {
                        offerDiscount += (regularSum - comboPrice) * maxSets;
                    }
                }
            }
        } else if (oType === 'FirstOrder' && offer.firstOrderRules) {
            const rules = offer.firstOrderRules;
            const val = Number(rules.discountValue || offer.discountValue || 0);
            if (rules.discountType === 'Percentage') {
                offerDiscount += subtotal * (val / 100);
            } else {
                offerDiscount += Math.min(subtotal, val);
            }
        }
    }

    const discountRow = document.getElementById('chk-discount-row');
    const discountVal = document.getElementById('chk-discount');
    const discountLabel = document.getElementById('chk-discount-label');

    if (offerDiscount > 0) {
        if (discountRow) discountRow.style.display = 'flex';
        if (discountVal) discountVal.textContent = `-${activeCurrency}${offerDiscount.toFixed(2)}`;
        if (discountLabel && offer) discountLabel.textContent = offer.name;
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }

    const tax = Math.max(0, subtotal - offerDiscount) * 0.18;
    const total = Math.max(0, subtotal - offerDiscount) + tax;

    if (document.getElementById('chk-subtotal')) document.getElementById('chk-subtotal').textContent = `${activeCurrency}${subtotal.toFixed(2)}`;
    if (document.getElementById('chk-tax')) document.getElementById('chk-tax').textContent = `${activeCurrency}${tax.toFixed(2)}`;
    if (document.getElementById('chk-total')) document.getElementById('chk-total').textContent = `${activeCurrency}${total.toFixed(2)}`;
}

window.renderCheckoutAddresses = function () {
    const key = getAddressKey();
    const addresses = JSON.parse(localStorage.getItem(key)) || [];
    const list = document.getElementById('checkout-address-list');
    if (!list) return;

    if (addresses.length === 0) {
        list.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; border: 2px dashed rgba(212, 175, 55, 0.2); border-radius: 20px; background: rgba(212, 175, 55, 0.02);">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: var(--gold-text); margin-bottom: 20px; opacity: 0.5;"></i>
                <h3 style="margin-bottom: 10px; color: white;">No saved addresses</h3>
                <p style="opacity:0.6; margin-bottom: 25px; color: #eee;">Please add a delivery address to proceed with your order.</p>
                <button class="btn btn-gold" onclick="window.openAddressModal()">Add New Address</button>
            </div>`;

        // Auto-popup for a smoother flow if no addresses exist
        setTimeout(() => {
            const overlay = document.getElementById('checkout-overlay');
            if (overlay && overlay.style.display === 'flex') {
                openAddressModal();
            }
        }, 500);
        return;
    }

    list.innerHTML = addresses.map(addr => {
        const id = addr._id || addr.id;
        const isSelected = window.checkoutState.selectedAddressId === id || (addr.isDefault && !window.checkoutState.selectedAddressId);
        if (isSelected && !window.checkoutState.selectedAddressId) window.checkoutState.selectedAddressId = id;

        return `
            <div class="checkout-address-card ${isSelected ? 'selected' : ''}" 
                 onclick="selectCheckoutAddress('${id}')" 
                 style="padding: 20px; margin-bottom: 20px; cursor: pointer; background: rgba(255, 255, 255, 0.03); border: 1px solid ${isSelected ? 'var(--gold-text)' : 'rgba(255,255,255,0.08)'}; transition: all 0.2s; position: relative; border-radius: 12px; box-shadow: ${isSelected ? '0 5px 15px rgba(212, 175, 55, 0.1)' : 'none'};">
                <div style="position: absolute; top: 15px; right: 15px;">
                    <i class="fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}" style="color: ${isSelected ? 'var(--gold-text)' : 'rgba(255,255,255,0.2)'}; font-size: 1.2rem;"></i>
                </div>
                <h5 style="margin: 0 0 10px; color: ${isSelected ? 'var(--gold-text)' : '#fff'}; font-size: 1rem; font-weight: 700;">
                    <i class="fas ${addr.type === 'Work' ? 'fa-briefcase' : 'fa-home'}" style="margin-right: 8px; font-size: 0.8rem; opacity: 0.7;"></i> ${addr.type || 'Home'}
                </h5>
                <p style="font-size: 0.9rem; opacity: 0.9; margin: 0; line-height: 1.5; color: #eee;">
                    <strong>${addr.fullName}</strong><br>
                    ${addr.house}, ${addr.area}<br>
                    ${addr.city}, ${addr.state} - ${addr.pincode}<br>
                    <span style="color: var(--gold-text); font-weight: 600; font-size: 0.85rem;"><i class="fas fa-phone-alt"></i> ${addr.phone}</span>
                </p>
            </div>
        `;
    }).join('');

    const confirmBtn = document.getElementById('btn-confirm-address');
    if (confirmBtn) confirmBtn.disabled = !window.checkoutState.selectedAddressId;
};

window.selectCheckoutAddress = (id) => {
    window.checkoutState.selectedAddressId = id;
    renderCheckoutAddresses();
};

window.continueToSummary = () => {
    const addressId = window.checkoutState ? window.checkoutState.selectedAddressId : null;
    if (!addressId) {
        showToast("Please select a delivery address", "error");
        return;
    }
    
    // Redirect to full checkout page with the selected address pre-filled
    const basePath = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '');
    const isInsidePages = window.location.pathname.includes('/pages/');
    const redirectUrl = (isInsidePages ? '' : 'pages/') + `checkout.html?addressId=${addressId}`;
    
    window.location.href = redirectUrl;
};

window.backToAddress = () => {
    const step1 = document.getElementById('checkout-step-address');
    const step2 = document.getElementById('checkout-step-summary');
    const container = document.getElementById('checkout-container-v2');
    const pricingCol = document.querySelector('.checkout-pricing-col');

    if (step1 && step2) {
        step1.style.opacity = '1';
        step1.style.pointerEvents = 'all';
        step1.style.display = 'block';
        step1.classList.add('active');

        step2.style.display = 'none';
        step2.classList.remove('active');

        if (container) {
            container.classList.add('step-1');
            container.classList.remove('step-2');
        }
        if (pricingCol) pricingCol.style.display = 'none';
    }
};

function renderCheckoutSummaryItems() {
    const list = document.getElementById('checkout-items-summary');
    const items = window.checkoutState.items;

    const selectedCountry = localStorage.getItem('efv_selected_country') || 'IN';
    const CURRENCY_MAP = {
        'IN': '₹', 'US': '$', 'GB': '£', 'DE': '€', 'FR': '€', 'ES': '€', 'IT': '€', 'PT': '€',
        'AE': 'AED ', 'SA': 'SAR ', 'CN': '¥', 'JP': '¥', 'RU': '₽', 'KR': '₩'
    };
    const activeCurrency = CURRENCY_MAP[selectedCountry] || '$';

    if (list) {
        list.innerHTML = items.map(item => {
            // Mapping specifications for premium view
            const edition = item.type === 'PHYSICAL' ? 'Hardcover Edition' : (item.type === 'EBOOK' ? 'Digital eBook' : 'Audiobook');
            const subtotal = (parseFloat(item.price) * (parseInt(item.quantity) || 1)).toFixed(2);
            const originalPrice = (parseFloat(item.price) * 2).toFixed(2); // Mocking original price

            return `
                <div class="premium-summary-card" style="margin-bottom: 15px;">
                    <div class="premium-summary-image-col">
                        <img src="${item.thumbnail || (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png')}" onerror="this.src='${CONFIG.BASE_PATH}assets/images/vol1-cover.png'">
                    </div>
                    <div class="premium-summary-details">
                        <div class="edition-text" style="margin-bottom: 4px;">${edition}</div>
                        <h2 style="margin-bottom: 4px;">${item.name || item.title}</h2>
                        <div style="display:flex; align-items:center; gap:8px; margin: 4px 0;">
                            <span style="background:var(--gold-text); color:black; padding:1px 5px; border-radius:4px; font-weight:800; font-size:0.7rem;">4.8 ★</span>
                            <span style="opacity:0.6; font-size:0.75rem;">2,450 Reviews</span>
                        </div>
                        <div class="price-row" style="margin: 5px 0;">
                            ${activeCurrency}${item.price} <span style="font-size:0.8rem;">${activeCurrency}${originalPrice}</span>
                        </div>

                        <div style="background: rgba(255,255,255,0.02); border-radius:10px; padding:8px 12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:10px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:var(--gold-text); font-weight:700; font-size:0.8rem;">Qty:</span>
                                <span style="font-weight:800; font-size:0.8rem;">${item.quantity}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:0.8rem;">
                                <span style="opacity:0.6;">Subtotal:</span>
                                <span style="font-weight:700;">${activeCurrency}${subtotal}</span>
                            </div>
                        </div>

                        <div class="premium-summary-spec-grid" style="padding-top:10px;">
                            <div class="premium-summary-spec-item" style="font-size:0.75rem;">Form <strong>${item.type || 'Physical'}</strong></div>
                            <div class="premium-summary-spec-item" style="font-size:0.75rem;">Lang <strong>${item.language || 'Hindi'}</strong></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    const addr = window.currentUserProfile.savedAddresses.find(a => (a._id || a.id) === window.checkoutState.selectedAddressId);
    if (addr && document.getElementById('selected-address-preview')) {
        document.getElementById('selected-address-preview').innerHTML = `
                <strong>${addr.fullName}</strong> | ${addr.phone}<br>
                ${addr.house}, ${addr.area}, ${addr.city}, ${addr.state} - ${addr.pincode}
            `;
    }
}

window.proceedToPayment = async function () {
    const items = window.checkoutState.items;
    const addressId = window.checkoutState.selectedAddressId;
    const user = window.currentUserProfile;

    if (!addressId) {
        showToast("Please select a delivery address", "error");
        return;
    }

    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.price) * (parseInt(i.quantity) || 1)), 0);
    
    let offerDiscount = 0;
    const offer = window.checkoutState.appliedOffer;
    if (offer) {
        const oType = offer.offerType || offer.type || 'Percentage';
        if (oType === 'Percentage' || oType === 'FlashSale' || oType === 'Festival') {
            const pct = Number(offer.discountValue || offer.discountRules?.percentage || 0);
            items.forEach(item => {
                const isApplicable = !offer.products || offer.products.length === 0 || offer.products.some(op => {
                    const opId = op.productId || op;
                    const itemId = item.id || item.productId || item._id;
                    return String(opId) === String(itemId);
                });
                if (isApplicable) {
                    offerDiscount += (parseFloat(item.price) * (parseInt(item.quantity) || 1)) * (pct / 100);
                }
            });
        } else if (oType === 'Flat') {
            const amt = Number(offer.discountValue || offer.discountRules?.flatAmount || 0);
            items.forEach(item => {
                const isApplicable = !offer.products || offer.products.length === 0 || offer.products.some(op => {
                    const opId = op.productId || op;
                    const itemId = item.id || item.productId || item._id;
                    return String(opId) === String(itemId);
                });
                if (isApplicable) {
                    offerDiscount += Math.min(parseFloat(item.price) * (parseInt(item.quantity) || 1), amt * (parseInt(item.quantity) || 1));
                }
            });
        } else if (oType === 'BOGO' && offer.buyXGetYRules) {
            const rules = offer.buyXGetYRules;
            if (rules.buyProductId && rules.freeProductId) {
                const buyItem = items.find(it => String(it.id || it.productId) === String(rules.buyProductId));
                const freeItem = items.find(it => String(it.id || it.productId) === String(rules.freeProductId));
                if (buyItem && buyItem.quantity >= rules.requiredQty && freeItem) {
                    const timesApplied = Math.floor(buyItem.quantity / rules.requiredQty);
                    const freeQtyEligible = timesApplied * rules.freeQty;
                    const actualFreeQty = Math.min(freeItem.quantity, freeQtyEligible);
                    offerDiscount += actualFreeQty * parseFloat(freeItem.price);
                }
            }
        } else if (oType === 'Combo' && offer.comboRules) {
            const rules = offer.comboRules;
            if (Array.isArray(rules.products) && rules.products.length > 0) {
                const matchingItems = rules.products.map(pId => items.find(it => String(it.id || it.productId) === String(pId) && it.quantity > 0)).filter(Boolean);
                if (matchingItems.length === rules.products.length) {
                    const maxSets = Math.min(...matchingItems.map(it => it.quantity));
                    const regularSum = matchingItems.reduce((sum, it) => sum + parseFloat(it.price), 0);
                    const comboPrice = Number(rules.comboPrice || 0);
                    if (regularSum > comboPrice && maxSets > 0) {
                        offerDiscount += (regularSum - comboPrice) * maxSets;
                    }
                }
            }
        } else if (oType === 'FirstOrder' && offer.firstOrderRules) {
            const rules = offer.firstOrderRules;
            const val = Number(rules.discountValue || offer.discountValue || 0);
            if (rules.discountType === 'Percentage') {
                offerDiscount += subtotal * (val / 100);
            } else {
                offerDiscount += Math.min(subtotal, val);
            }
        }
    }

    const tax = Math.max(0, subtotal - offerDiscount) * 0.18;
    const totalAmount = Math.max(0, Math.round((subtotal - offerDiscount + tax) * 100) / 100);

    try {
        const token = localStorage.getItem('authToken');
        
        // 1. Get Config
        const configRes = await fetch(`${API_BASE}/api/orders/config`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const config = await configRes.json();
        const rzpKey = config.razorpayKeyId;

        const selectedAddr = user.savedAddresses.find(a => (a._id || a.id) === addressId);
        const address = {
            name: selectedAddr.fullName,
            phone: selectedAddr.phone,
            email: user.email,
            street: selectedAddr.house || '',
            area: selectedAddr.area || '',
            city: selectedAddr.city || '',
            state: selectedAddr.state || '',
            pincode: selectedAddr.pincode || '',
            country: selectedAddr.country || 'India'
        };

        if (rzpKey) {
            // --- Razorpay checkout fallback (if key is enabled) ---
            const rzpRes = await fetch(`${API_BASE}/api/orders/razorpay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: totalAmount,
                    customerName: user.name,
                    customerEmail: user.email,
                    customerPhone: user.phone || '0000000000'
                })
            });
            
            const rzpOrderData = await rzpRes.json();
            if (!rzpRes.ok) throw new Error(rzpOrderData.message || 'Razorpay initialization failed');

            const options = {
                key: rzpKey,
                amount: rzpOrderData.amount, // paise
                currency: rzpOrderData.currency,
                name: "EFV™",
                description: "Premium Order Fulfillment",
                image: "../assets/images/AISA.svg",
                order_id: rzpOrderData.rzpOrderId,
                handler: async function (response) {
                    try {
                        showToast("Verifying payment...", "info");
                        
                        const verifyRes = await fetch(`${API_BASE}/api/orders/verify-razorpay`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                items: items,
                                customer: address,
                                offerId: offer ? String(offer._id || offer.id) : ''
                            })
                        });

                        const verifyResult = await verifyRes.json();
                        if (verifyRes.ok) {
                            showToast("Payment Successful! Order placed.", "success");
                            localStorage.removeItem('efv_checkout_offer_id');
                            if (typeof closeCheckout === 'function') closeCheckout();
                            
                            setTimeout(() => {
                                window.location.href = 'profile.html?tab=orders';
                            }, 1500);
                        } else {
                            throw new Error(verifyResult.message || "Payment verification failed");
                        }
                    } catch (err) {
                        showToast(err.message, "error");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ''
                },
                theme: { color: "#D4AF37" },
                modal: {
                    ondismiss: function() {
                        showToast("Payment dismissed", "warning");
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            // --- Cashfree checkout ---
            showToast("Initializing payment...", "info");

            // Determine the correct currency from the user's selected country
            const directBuyCountryCode = localStorage.getItem('efv_selected_country') || 'IN';
            const directBuyCurrency = COUNTRY_CURRENCY_MAP[directBuyCountryCode] || 'INR';

            // Save details to localStorage so payment-status page can process on redirect return
            localStorage.setItem('shippingAddress', JSON.stringify(address));
            localStorage.setItem('directCheckout', JSON.stringify(items));
            localStorage.setItem('efv_paid_currency', directBuyCurrency);

            const response = await fetch(`${API_BASE}/api/orders/cashfree`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: totalAmount,
                    currency: directBuyCurrency,
                    customerName: user.name,
                    customerEmail: user.email,
                    customerPhone: selectedAddr.phone || user.phone || '0000000000'
                })
            });

            const cfData = await response.json();
            if (!response.ok) throw new Error(cfData.message || 'Cashfree order creation failed');

            if (!window.Cashfree) {
                throw new Error("Cashfree SDK not loaded. Please refresh the page.");
            }

            const cashfree = window.Cashfree({
                mode: config.cashfreeMode === 'production' ? 'production' : 'sandbox'
            });

            cashfree.checkout({
                paymentSessionId: cfData.payment_session_id
            });
        }

    } catch (e) {
        showToast('Checkout Failed: ' + e.message, 'error');
    }
};

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

// Configuration
const CONTENT_CONFIG = {
    // Correctly resolve worker path relative to page location
    pdfWorkerSrc: (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'js/pdfjs/pdf.worker.min.js',
    contentApi: `${API_BASE}/api/content`,
    progressApi: `${API_BASE}/api/progress`
};

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

        // ✅ PRE-FLIGHT CHECK: Get actual server error before PDF.js swallows it
        try {
            const checkRes = await fetch(`${CONTENT_CONFIG.contentApi}/ebook/${effectiveId}`, {
                method: 'HEAD',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!checkRes.ok) {
                const errRes = await fetch(`${CONTENT_CONFIG.contentApi}/ebook/${effectiveId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Range': 'bytes=0-0' }
                });
                let errMsg = '';
                try { const j = await errRes.json(); errMsg = j.message; } catch(e) {}
                if (checkRes.status === 404) throw new Error(`404: ${errMsg || 'E-Book file not found on server'}`);
                else if (checkRes.status === 403) throw new Error('403: Access Denied');
                else if (checkRes.status === 401) throw new Error('401: Session expired');
                else throw new Error(`${checkRes.status}: ${errMsg || 'Server error'}`);
            }
        } catch (preFlightErr) {
            if (preFlightErr.message.startsWith('4') || preFlightErr.message.startsWith('5')) throw preFlightErr;
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
            const serverMsg = errStr.replace(/^404:\s*/, '');
            errorMsg = serverMsg && serverMsg !== errStr
                ? `File Error: ${serverMsg}`
                : "E-Book file not found on server. Please contact support.";
        } else if (errStr.includes('401')) {
            errorMsg = "Your session has expired. Please log in again.";
        } else if (errStr.includes('403')) {
            errorMsg = "Access Denied: You have not purchased this content. Please purchase it from the store to read.";
            // Immediately purge unauthorized item from local storage cache
            try {
                const libKey = getUserKey('efv_digital_library');
                let lib = JSON.parse(localStorage.getItem(libKey)) || [];
                lib = lib.filter(i => (i.productId || i.id || i._id) !== effectiveId);
                localStorage.setItem(libKey, JSON.stringify(lib));
                if (typeof renderLibraryTab === 'function') renderLibraryTab(lib);
                if (typeof updateStats === 'function') updateStats();
                if (typeof updateReadingProgressShortcuts === 'function') updateReadingProgressShortcuts();
            } catch (e) {}
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
        const modal = document.getElementById(readerId);
        if (modal) modal.remove();
        if (window.efvSecurity) window.efvSecurity.disable(); 
        if (typeof renderLibraryTab === 'function') renderLibraryTab();
        delete window.forceCloseEbookReader;
    };

    const closeAction = (e) => {
        window.forceCloseEbookReader(e);
    };

    if (closeBtn) {
        ['click', 'mousedown', 'touchstart'].forEach(evtType => {
            closeBtn.addEventListener(evtType, closeAction, { capture: true });
        });
    }

    // Secondary Close: Toolbar Click
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

// Particle Background Animation
window.initModalParticles = function () {
    const canvas = document.getElementById('modal-particles-canvas');
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
        const modal = document.getElementById('admin-product-modal');
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

// Admin Product Modal Open/Close
window.openProductModal = function (productId = null) {
    const modal = document.getElementById('admin-product-modal');
    const form = document.getElementById('admin-product-form');
    const title = document.getElementById('admin-modal-title');
    const saveBtn = document.getElementById('admin-save-btn');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('admin-prod-id').value = '';
    document.getElementById('admin-current-cover').innerHTML = '';
    document.getElementById('admin-current-ebook').innerHTML = '';
    document.getElementById('admin-current-audio').innerHTML = '';
    document.getElementById('admin-file-cover').value = '';
    document.getElementById('admin-file-ebook').value = '';
    document.getElementById('admin-file-audio').value = '';

    // Reset file fields visibility
    toggleAdminFileFields('HARDCOVER'); // Default to physical fields

    if (productId) {
        title.textContent = 'Edit Product';
        saveBtn.textContent = 'Update Product';
        window.editProduct(productId); // Load product data
    } else {
        title.textContent = 'Add New Product';
        saveBtn.textContent = 'Add Product';
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
    window.initModalParticles(); // Start particle animation
};

// Edit Product Logic
window.editProduct = async function (productId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const product = await res.json();

        if (!res.ok) throw new Error(product.message || 'Failed to fetch product');

        document.getElementById('admin-prod-id').value = product._id;
        document.getElementById('admin-prod-title').value = product.title;
        document.getElementById('admin-prod-author').value = product.author || '';
        document.getElementById('admin-prod-type').value = product.type;
        document.getElementById('admin-prod-lang').value = product.language || 'Hindi';
        document.getElementById('admin-prod-volume').value = product.volume || '';
        document.getElementById('admin-prod-price').value = product.price;
        document.getElementById('admin-prod-discount-price').value = product.discountPrice || '';
        document.getElementById('admin-prod-stock').value = product.stock || 0;
        document.getElementById('admin-prod-weight').value = product.weight || 0;
        document.getElementById('admin-prod-length').value = product.length || 0;
        document.getElementById('admin-prod-width').value = product.breadth || 0;
        document.getElementById('admin-prod-height').value = product.height || 0;
        document.getElementById('admin-prod-duration').value = product.duration || '';
        document.getElementById('admin-prod-desc').value = product.description || '';

        // Update current file indicators
        if (product.thumbnail) document.getElementById('admin-current-cover').innerHTML = `<i class="fas fa-file-image"></i> Current: ${product.thumbnail.split('/').pop()}`;
        if (product.filePath && product.type === 'EBOOK') document.getElementById('admin-current-ebook').innerHTML = `<i class="fas fa-file-pdf"></i> Current: ${product.filePath.split('/').pop()}`;
        if (product.filePath && product.type === 'AUDIOBOOK') document.getElementById('admin-current-audio').innerHTML = `<i class="fas fa-file-audio"></i> Current: ${product.filePath.split('/').pop()}`;

        // Toggle fields based on fetched type
        window.toggleAdminFileFields(product.type);

    } catch (error) {
        console.error("Error loading product for edit:", error);
        alert("Failed to load product details for editing.");
    }
};

window.closeProductModal = function () {
    const modal = document.getElementById('admin-product-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
};

// Toggle file fields based on product type
window.toggleAdminFileFields = function (type) {
    if (!type) {
        const typeEl = document.getElementById('admin-prod-type');
        type = typeEl ? typeEl.value : 'HARDCOVER';
    }
    const physicalFields = document.querySelectorAll('.admin-physical-field');
    const digitalFields = document.querySelectorAll('.admin-digital-field');
    const ebookField = document.getElementById('admin-field-ebook');
    const audioField = document.getElementById('admin-field-audio');
    const durationField = document.getElementById('admin-prod-duration-group'); // This one might still be missing, will check HTML

    physicalFields.forEach(el => el.style.display = (type === 'HARDCOVER' || type === 'PAPERBACK') ? 'block' : 'none');
    digitalFields.forEach(el => el.style.display = (type === 'EBOOK' || type === 'AUDIOBOOK') ? 'block' : 'none');

    if (ebookField) ebookField.style.display = (type === 'EBOOK') ? 'block' : 'none';
    if (audioField) audioField.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
    if (durationField) durationField.style.display = (type === 'AUDIOBOOK') ? 'block' : 'none';
};

// Event listener for product type change
document.addEventListener('DOMContentLoaded', () => {
    const productTypeSelect = document.getElementById('admin-prod-type');
    if (productTypeSelect) {
        productTypeSelect.addEventListener('change', (e) => {
            window.toggleAdminFileFields(e.target.value);
        });
    }
});



// --- AUDIOBOOK PLAYER IMPLEMENTATION (Resume Support) ---
// ═══════════════════════════════════════════════════════════════
// EFV™ PREMIUM AUDIOBOOK EXPERIENCE — COMPLETE SYSTEM
// ═══════════════════════════════════════════════════════════════

// Library sub-tab filter
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

// ─── AUDIOBOOK LIBRARY CARDS GRID ────────────────────────────
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
            const selectedCountry = localStorage.getItem('efv_selected_country') || 'IN';
            const CURRENCY_MAP = {
                'IN': '₹', 'US': '$', 'GB': '£', 'DE': '€', 'FR': '€', 'ES': '€', 'IT': '€', 'PT': '€',
                'AE': 'AED ', 'SA': 'SAR ', 'CN': '¥', 'JP': '¥', 'RU': '₽', 'KR': '₩'
            };
            const activeCurrency = CURRENCY_MAP[selectedCountry] || '$';

            const COUNTRY_KEYS = {
                'IN': 'India', 'US': 'UnitedStates', 'GB': 'UnitedKingdom', 'DE': 'Germany', 'FR': 'France', 'ES': 'Spain',
                'IT': 'Italy', 'PT': 'Portugal', 'AE': 'UnitedArabEmirates', 'SA': 'SaudiArabia', 'CN': 'China', 'JP': 'Japan', 'RU': 'Russia', 'KR': 'SouthKorea'
            };
            const countryKey = COUNTRY_KEYS[selectedCountry];

            let displayPrice = productData.price;
            if (countryKey && productData.countryPricing && productData.countryPricing[countryKey]) {
                const cp = productData.countryPricing[countryKey];
                if (cp.enabled !== false && cp.price !== undefined && cp.price !== null && cp.price !== '') {
                    displayPrice = Number(cp.price);
                }
            }
            itemPrice = `${activeCurrency}${displayPrice}`;
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

        // Thumbnail resolution - same logic as marketplace.html (FIXED)
        let thumbUrl = CONFIG.BASE_PATH + 'assets/images/vol1-cover.png';
        if (item.thumbnail) {
            if (item.thumbnail.startsWith('http') || item.thumbnail.startsWith(CONFIG.BASE_PATH + 'assets/images/')) {
                thumbUrl = item.thumbnail;
            } else if (item.thumbnail.startsWith('img/')) {
                thumbUrl = CONFIG.BASE_PATH + 'assets/images/' + item.thumbnail.replace('img/', '');
            } else if (item.thumbnail.startsWith('assets/images/')) {
                thumbUrl = CONFIG.BASE_PATH + item.thumbnail;
            } else {
                thumbUrl = `${API_BASE}/${item.thumbnail}`;
            }
        }

        const hasProgress = lastChapterTime > 0 || completedChapters > 0;
        const continueLabel = hasProgress ? `<i class="fas fa-play"></i> Continue Listening` : `<i class="fas fa-headphones"></i> Start Listening`;

        return `
            <div class="audiobook-card fade-in">
                <div class="audiobook-card-inner">
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

// ─── BOOK DETAIL SCREEN ──────────────────────────────────────
window.openAudiobookDetail = async function (productId, scrollToChapters = false) {
    const existing = document.getElementById('audiobook-detail-overlay');
    if (existing) existing.remove();

    const token = localStorage.getItem('authToken');
    let product = null;

    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`);
        if (res.ok) product = await res.json();
        if (!product) throw new Error('Not found');
    } catch (e) {
        alert('Failed to load audiobook details.');
        return;
    }

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

    // Fetch progress
    let abProgress = null;
    try {
        const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apRes.ok) abProgress = await apRes.json();
    } catch (e) { }

    const completedChapters = abProgress?.totalCompletedChapters || (abProgress?.chapters || []).filter(c => c.completed).length || 0;
    const progressPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // Thumbnail
    let thumbUrl = window.resolveThumbnailUrl(product.thumbnail, product.title || product.name);

    // Chapter cards HTML
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
                        <div class="ab-detail-progress-label">
                            <span>Reading Progress</span>
                            <span>${progressPercent}%</span>
                        </div>
                        <div class="ab-detail-progress-track">
                            <div class="ab-detail-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>

                    <div class="ab-detail-actions">
                        <button class="btn-view-chapters" onclick="document.getElementById('chapters-section-anchor').scrollIntoView({behavior:'smooth'})">
                            <i class="fas fa-list"></i> View All Chapters
                        </button>
                    </div>
                </div>

                <div class="ab-chapters-section" id="chapters-section-anchor">
                    <div class="ab-chapters-heading">
                        <span>All Chapters (${totalChapters})</span>
                    </div>
                    <div class="ab-chapters-list">
                        ${chapterCards.length > 0 ? chapterCards : '<p style="color:rgba(255,255,255,0.4); text-align:center; padding:30px;">No chapters uploaded yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHTML);

    if (scrollToChapters) {
        setTimeout(() => {
            document.getElementById('chapters-section-anchor')?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    }
};

// ─── EFV PREMIUM AUDIO PLAYER ────────────────────────────────
window.launchEFVPlayer = async function (productId, chapterIndex = 0) {
    const existingPlayer = document.getElementById('efv-premium-player');
    if (existingPlayer) existingPlayer.remove();

    const token = localStorage.getItem('authToken');

    // Fetch product
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

    // Fetch chapter progress
    let abProgress = null;
    try {
        const apRes = await fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (apRes.ok) abProgress = await apRes.json();
    } catch (e) { }

    // Check resume for click on "Continue Listening" (chapterIndex 0 pass-through) or specific chapter
    let initialChapter = chapterIndex;
    let initialTime = 0;

    // Explicitly fetching the requested chapter's time if they clicked a chapter
    if (abProgress && abProgress.chapters) {
        const chProg = abProgress.chapters.find(c => c.chapterIndex === chapterIndex);
        if (chProg && chProg.currentTime > 1) {
            initialTime = chProg.currentTime;
        }
    }

    // Default "Continue Listening" passthrough override if chapterIndex 0 is passed but progress says they are on a later chapter
    if (chapterIndex === 0 && abProgress && abProgress.currentChapterIndex !== undefined) {
        if (abProgress.currentChapterIndex > 0 || (abProgress.currentChapterTime && abProgress.currentChapterTime > 1)) {
            const savedChIdx = abProgress.currentChapterIndex || 0;
            const savedTime = abProgress.currentChapterTime || 0;
            // Only override if we are truly hitting the Continue Listening default route 
            // AND we actually have significant progress saved.
            if (savedTime > 1 || savedChIdx > 0) {
                initialChapter = savedChIdx;
                initialTime = savedTime;
            }
        }
    }

    // --- SAFETY CHECK: Ensure initialChapter is within bounds ---
    if (initialChapter >= chapters.length) {
        initialChapter = 0;
        initialTime = 0;
    }

    // Thumbnail
    let thumbUrl = window.resolveThumbnailUrl(product.thumbnail, product.title || product.name);

    const currentChapter = chapters[initialChapter] || chapters[0];
    const chTitle = currentChapter.title || `Chapter ${initialChapter + 1}`;

    const playerHTML = `
        <div id="efv-premium-player" class="efv-audio-player-overlay" oncontextmenu="return false;">
            <div class="efv-player-toolbar">
                <div class="efv-player-toolbar-left">
                    <i class="fas fa-headphones"></i>
                    <span>EFV™ AUDIO PLAYER</span>
                </div>
                <button class="ab-detail-close" id="efv-player-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="efv-player-body">
                <img src="${thumbUrl}" alt="${product.title}" class="efv-player-cover" id="efv-player-cover" onerror="this.src=window.getImageForProduct('${(product.title || product.name || '').replace(/'/g, "\\'")}')">

                <h2 class="efv-player-chapter-title" id="efv-player-ch-title">${chTitle}</h2>
                <p class="efv-player-book-title">${product.title}</p>

                <div class="efv-player-seek-container">
                    <div class="efv-player-time-row">
                        <span id="efv-time-current">0:00</span>
                        <span id="efv-time-total">0:00</span>
                    </div>
                    <input type="range" class="efv-seek-bar" id="efv-seek-bar" min="0" max="100" value="0" step="0.1">
                </div>

                <div class="efv-player-controls">
                    <button class="efv-ctrl-btn" id="efv-btn-prev" title="Previous Chapter"><i class="fas fa-step-backward"></i></button>
                    <button class="efv-ctrl-btn" title="Rewind 10s" id="efv-btn-rwd"><i class="fas fa-undo"></i></button>
                    <button class="efv-play-btn" id="efv-btn-play"><i class="fas fa-play" id="efv-play-icon"></i></button>
                    <button class="efv-ctrl-btn" title="Forward 10s" id="efv-btn-fwd"><i class="fas fa-redo"></i></button>
                    <button class="efv-ctrl-btn" id="efv-btn-next" title="Next Chapter"><i class="fas fa-step-forward"></i></button>
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

    // --- Save chapter progress ---
    function saveChapterProgress(forceComplete = false) {
        if (!audioEl.src || audioEl.currentTime < 0.5) return;

        const completed = forceComplete || (audioEl.duration > 0 && (audioEl.currentTime / audioEl.duration) > 0.95);

        const data = {
            chapterIndex: currentChIdx,
            currentTime: audioEl.currentTime,
            duration: audioEl.duration || 0,
            completed
        };

        fetch(`${API_BASE}/api/audiobook-progress/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        }).catch(e => console.error('Save chapter progress error:', e));

        // Also update generic progress for dashboard cards
        const totalChapters = chapters.length;
        const overallProgress = totalChapters > 0 ? ((currentChIdx + (audioEl.currentTime / (audioEl.duration || 1))) / totalChapters) * 100 : 0;
        syncProgress(productId, 'AUDIOBOOK', {
            currentTime: audioEl.currentTime,
            totalDuration: audioEl.duration || 0,
            progress: Math.min(overallProgress, 100)
        });
    }

    // --- Event Listeners ---
    audioEl.addEventListener('timeupdate', () => {
        if (isSeeking) return;
        timeCurrent.textContent = formatTime(audioEl.currentTime);
        if (audioEl.duration) {
            const percentage = (audioEl.currentTime / audioEl.duration) * 100;
            seekBar.value = percentage;
            seekBar.style.background = `linear-gradient(to right, #FFD700 0%, #FFD700 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
        }
    });

    audioEl.addEventListener('play', () => {
        playIcon.className = 'fas fa-pause';
        playerCover.classList.add('is-playing');
        saveTimer = setInterval(() => saveChapterProgress(), 5000);
    });

    audioEl.addEventListener('pause', () => {
        playIcon.className = 'fas fa-play';
        playerCover.classList.remove('is-playing');
        if (saveTimer) clearInterval(saveTimer);
        saveChapterProgress();
    });

    // Save on tab switch / minimize
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === 'hidden' && audioEl) {
            saveChapterProgress();
        }
    });

    audioEl.addEventListener('ended', () => {
        saveChapterProgress(true);
        // Auto-advance to next chapter
        if (currentChIdx < chapters.length - 1) {
            loadChapter(currentChIdx + 1, 0, true);
        } else {
            playIcon.className = 'fas fa-play';
            playerCover.classList.remove('is-playing');
        }
    });

    // Seek bar interaction
    seekBar.addEventListener('input', () => {
        isSeeking = true;
        const seekTime = (seekBar.value / 100) * (audioEl.duration || 0);
        timeCurrent.textContent = formatTime(seekTime);
        const percentage = seekBar.value;
        seekBar.style.background = `linear-gradient(to right, #FFD700 0%, #FFD700 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    });

    seekBar.addEventListener('change', () => {
        const seekTime = (seekBar.value / 100) * (audioEl.duration || 0);
        audioEl.currentTime = seekTime;
        isSeeking = false;
    });

    // Play/Pause
    playBtn.addEventListener('click', () => {
        if (audioEl.paused) audioEl.play().catch(() => { });
        else audioEl.pause();
    });

    // Rewind/Forward 10s
    document.getElementById('efv-btn-rwd').addEventListener('click', () => {
        audioEl.currentTime = Math.max(0, audioEl.currentTime - 10);
    });
    document.getElementById('efv-btn-fwd').addEventListener('click', () => {
        audioEl.currentTime = Math.min(audioEl.duration || 0, audioEl.currentTime + 10);
    });

    // Prev/Next chapter
    document.getElementById('efv-btn-prev').addEventListener('click', () => {
        if (currentChIdx > 0) {
            saveChapterProgress();
            loadChapter(currentChIdx - 1, 0, true);
        }
    });
    document.getElementById('efv-btn-next').addEventListener('click', () => {
        if (currentChIdx < chapters.length - 1) {
            saveChapterProgress();
            loadChapter(currentChIdx + 1, 0, true);
        }
    });

    // Speed controls
    document.querySelectorAll('.efv-speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.efv-speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            audioEl.playbackRate = parseFloat(btn.dataset.speed);
        });
    });

    // Close player
    document.getElementById('efv-player-close-btn').addEventListener('click', () => {
        saveChapterProgress();
        if (saveTimer) clearInterval(saveTimer);
        audioEl.pause();
        audioEl.src = '';
        document.getElementById('efv-premium-player').remove();
        document.body.classList.remove('modal-open');

        // SECURITY: Stop active protection
        if (window.efvSecurity) window.efvSecurity.disable();
        // Refresh library and detail views
        renderLibraryTab();
        if (document.querySelector('.library-sub-tab[data-library-tab="audiobooks"].active')) {
            renderAudiobooksGrid();
        }
    });

    // Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape' && document.getElementById('efv-premium-player')) {
            document.getElementById('efv-player-close-btn').click();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Save on page unload via old robust method too
    window.addEventListener('beforeunload', () => saveChapterProgress());

    // --- Resume Modal Logic ---
    if (initialTime > 1) {
        document.getElementById('efv-resume-time').textContent = formatTime(initialTime);
        document.getElementById('efv-resume-btn-time').textContent = formatTime(initialTime);
        resumeOverlay.classList.add('active');

        document.getElementById('efv-btn-resume').addEventListener('click', () => {
            resumeOverlay.classList.remove('active');
            loadChapter(initialChapter, initialTime, true);
        });
        document.getElementById('efv-btn-restart').addEventListener('click', () => {
            resumeOverlay.classList.remove('active');
            loadChapter(initialChapter, 0, true);
        });
    } else {
        resumeOverlay.classList.remove('active');
        loadChapter(initialChapter, 0, true);
    }
};

// ─── LEGACY FALLBACK: playAudiobook (for non-chapter audiobooks) ──
window.playAudiobook = async function (product) {
    const bookId = product._id || product.id;
    const token = localStorage.getItem('authToken');

    // Try to detect chapter-based audiobook
    try {
        const res = await fetch(`${API_BASE}/api/products/${bookId}`);
        if (res.ok) {
            const fullProduct = await res.json();
            const hasChapters = (fullProduct.chapters || []).filter(c => c.filePath).length > 0;
            if (hasChapters) {
                // Use the premium chapter-based player
                openAudiobookDetail(bookId);
                return;
            }
        }
    } catch (e) { }

    // Fallback for legacy single-file audiobooks — minimal player
    const playerModalId = 'audio-player-modal';
    const resumeModalId = 'audio-resume-modal';
    if (document.getElementById(playerModalId)) document.getElementById(playerModalId).remove();

    let savedState = await fetchProgress(bookId);
    if (!savedState) {
        const local = localStorage.getItem(`audiobook_${bookId}_progress`);
        if (local) savedState = JSON.parse(local);
    }

    // Thumbnail
    let thumbUrl = window.resolveThumbnailUrl(product.thumbnail, product.name || product.title);

    const audioHtml = `
        <div id="${playerModalId}" class="efv-audio-player-overlay" oncontextmenu="return false;">
            <div class="efv-player-toolbar">
                <div class="efv-player-toolbar-left"><i class="fas fa-headphones"></i> <span>${product.name || product.title}</span></div>
                <button class="ab-detail-close" onclick="closeLegacyPlayer()"><i class="fas fa-times"></i></button>
            </div>
            <div class="efv-player-body">
                <img src="${thumbUrl}" class="efv-player-cover" onerror="this.src=window.getImageForProduct('${(product.name || product.title || '').replace(/'/g, "\\'")}')">
                <h2 class="efv-player-chapter-title">${product.name || product.title}</h2>
                <div class="efv-player-seek-container">
                    <div class="efv-player-time-row">
                        <span id="legacy-time-cur">0:00</span>
                        <span id="legacy-time-total">0:00</span>
                    </div>
                    <input type="range" class="efv-seek-bar" id="legacy-seek" min="0" max="100" value="0" step="0.1">
                </div>
                <div class="efv-player-controls">
                    <button class="efv-ctrl-btn" id="legacy-rwd"><i class="fas fa-undo"></i></button>
                    <button class="efv-play-btn" id="legacy-play"><i class="fas fa-play" id="legacy-play-icon"></i></button>
                    <button class="efv-ctrl-btn" id="legacy-fwd"><i class="fas fa-redo"></i></button>
                </div>
                <div class="efv-speed-control">
                    <span class="efv-speed-label">Speed</span>
                    <div class="efv-speed-options">
                        <button class="efv-speed-btn legacy-speed active" data-speed="1">1x</button>
                        <button class="efv-speed-btn legacy-speed" data-speed="1.5">1.5x</button>
                        <button class="efv-speed-btn legacy-speed" data-speed="2">2x</button>
                    </div>
                </div>
            </div>
            <div id="${resumeModalId}" class="resume-modal-overlay" style="z-index:10003;">
                <div class="resume-modal">
                    <i class="fas fa-headphones"></i>
                    <h3>Continue Listening?</h3>
                    <p>You previously listened up to <span id="legacy-resume-time" style="color:white; font-weight:bold;">0:00</span>.<br>Continue from where you left off?</p>
                    <div class="resume-actions">
                        <button id="legacy-btn-resume" class="btn-resume-primary"><i class="fas fa-play"></i> Continue from <span id="legacy-resume-btn-time">0:00</span></button>
                        <button id="legacy-btn-restart" class="btn-resume-secondary"><i class="fas fa-redo"></i> Start from Beginning</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', audioHtml);
    document.body.classList.add('modal-open');

    const audio = new Audio(`${CONTENT_CONFIG.contentApi}/audio/${bookId}?token=${token || ''}&t=${Date.now()}`);
    audio.onerror = () => {
        console.error("Audio Load Error:", audio.error);
        alert("Unable to play audio. The file might be missing on the server or your permission has expired.");
        if (document.getElementById(playerModalId)) document.getElementById(playerModalId).remove();
    };
    const playIcon = document.getElementById('legacy-play-icon');
    const seek = document.getElementById('legacy-seek');
    let legacySaveInt = null;
    let legacySeeking = false;

    const saveLegacyProgress = () => {
        if (audio.currentTime < 1) return;
        const pd = { currentTime: audio.currentTime, totalDuration: audio.duration || 0, progress: (audio.currentTime / (audio.duration || 1)) * 100 };
        if (pd.progress > 95) { syncProgress(bookId, 'AUDIOBOOK', { currentTime: 0, progress: 0 }); localStorage.removeItem(`audiobook_${bookId}_progress`); return; }
        localStorage.setItem(`audiobook_${bookId}_progress`, JSON.stringify(pd));
        if (token) syncProgress(bookId, 'AUDIOBOOK', pd);
    };

    audio.addEventListener('loadedmetadata', () => {
        document.getElementById('legacy-time-total').textContent = formatTime(audio.duration);
        if (savedState && savedState.currentTime > 1 && (savedState.currentTime / audio.duration) < 0.95) {
            document.getElementById('legacy-resume-time').textContent = formatTime(savedState.currentTime);
            document.getElementById('legacy-resume-btn-time').textContent = formatTime(savedState.currentTime);
            document.getElementById(resumeModalId).classList.add('active');
        } else { audio.play().catch(() => { }); }
    });
    audio.addEventListener('timeupdate', () => { if (!legacySeeking) { document.getElementById('legacy-time-cur').textContent = formatTime(audio.currentTime); seek.value = (audio.currentTime / (audio.duration || 1)) * 100; } });
    audio.addEventListener('play', () => { playIcon.className = 'fas fa-pause'; legacySaveInt = setInterval(saveLegacyProgress, 5000); });
    audio.addEventListener('pause', () => { playIcon.className = 'fas fa-play'; if (legacySaveInt) clearInterval(legacySaveInt); saveLegacyProgress(); });

    document.getElementById('legacy-play').addEventListener('click', () => { audio.paused ? audio.play().catch(() => { }) : audio.pause(); });
    document.getElementById('legacy-rwd').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
    document.getElementById('legacy-fwd').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
    seek.addEventListener('input', () => { legacySeeking = true; document.getElementById('legacy-time-cur').textContent = formatTime((seek.value / 100) * (audio.duration || 0)); });
    seek.addEventListener('change', () => { audio.currentTime = (seek.value / 100) * (audio.duration || 0); legacySeeking = false; });
    document.querySelectorAll('.legacy-speed').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.legacy-speed').forEach(x => x.classList.remove('active')); b.classList.add('active'); audio.playbackRate = parseFloat(b.dataset.speed); }));

    document.getElementById('legacy-btn-resume')?.addEventListener('click', () => { audio.currentTime = savedState.currentTime; document.getElementById(resumeModalId).classList.remove('active'); audio.play(); });
    document.getElementById('legacy-btn-restart')?.addEventListener('click', () => { audio.currentTime = 0; document.getElementById(resumeModalId).classList.remove('active'); localStorage.removeItem(`audiobook_${bookId}_progress`); audio.play(); });

    window.closeLegacyPlayer = function () {
        saveLegacyProgress();
        if (legacySaveInt) clearInterval(legacySaveInt);
        audio.pause(); audio.src = '';
        document.getElementById(playerModalId)?.remove();
        document.body.classList.remove('modal-open');
        renderLibraryTab();
    };

    window.addEventListener('beforeunload', saveLegacyProgress);
};

// --- API HELPERS ---
const efvProgressCache = new Map();

async function fetchProgress(productId) {
    if (!productId) return null;
    if (efvProgressCache.has(productId)) return efvProgressCache.get(productId);
    try {
        const rawAuthUser = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
        const token = rawAuthUser ? (JSON.parse(rawAuthUser).token || localStorage.getItem('authToken')) : localStorage.getItem('authToken');
        if (!token) return null;

        // Add timestamp to prevent caching
        const res = await fetch(`${CONTENT_CONFIG.progressApi}/${productId}?t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        const data = json.found ? json.data : null;
        if (data) efvProgressCache.set(productId, data);
        return data;
    } catch (e) {
        console.error("Progress fetch error", e);
        return null;
    }
}

async function syncProgress(productId, type, data) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        await fetch(`${CONTENT_CONFIG.progressApi}/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type, ...data })
        });
    } catch (e) {
        console.error("Progress sync error", e);
    }
}

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

    // 🔧 FIX: Normalize type to uppercase for consistent comparison
    const upperType = (type || '').toUpperCase();
    const isAudio = upperType === 'AUDIOBOOK' || upperType.includes('AUDIO') ||
                    (name && name.toLowerCase().includes('audio'));

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

// Helper for images
function getImageForProduct(name) {
    return window.getImageForProduct ? window.getImageForProduct(name) : ((typeof CONFIG !== 'undefined' && CONFIG.BASE_PATH ? CONFIG.BASE_PATH : '../') + 'assets/images/vol1-cover.png');
}


// --- ADMIN PORTAL LOGIC ---

// --- NEW ADMIN MANAGEMENT FUNCTIONS ---
let allAdminProducts = [];



window.loadAdminOrdersFull = async function () {
    const tbody = document.getElementById('admin-orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Loading orders...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await res.json();

        tbody.innerHTML = '';
        orders.reverse().forEach(o => {
            const date = new Date(o.createdAt).toLocaleDateString();
            const items = o.items.map(i => `${i.quantity}x ${i.title}`).join(', ');
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 12px; font-family: monospace;">#${o._id.slice(-6)}</td>
                <td style="padding: 12px;">${date}</td>
                <td style="padding: 12px;">${o.customer.name}<br><small style="opacity:0.6;">${o.customer.phone || 'N/A'}</small></td>
                <td style="padding: 12px;"><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${items}</div></td>
                <td style="padding: 12px; font-weight:bold;">₹${o.totalAmount}</td>
                <td style="padding: 12px;"><span class="badge ${o.paymentStatus === 'Paid' ? 'green' : 'gold'}">${o.paymentStatus}</span></td>
                <td style="padding: 12px;">
                    <select onchange="updateOrderStatus('${o._id}', this.value)" style="background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,211,105,0.3); padding: 4px; border-radius: 4px; font-size: 0.8rem;">
                        ${['Pending', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Failed'].map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                </td>
                <td style="padding: 12px;">
                    <button class="btn btn-outline small" onclick="alert('Order Details:\\n\\nAddress: ${o.customer.address}\\nCourier: Pending\\nApayID: ${o.razorpayPaymentId || 'N/A'}')">View</button>
                    <button class="btn-icon" style="color: #ff4d4d; margin-left:10px;"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
};

window.filterAdminProducts = function () {
    const searchEl = document.getElementById('admin-product-search');
    const typeEl = document.getElementById('admin-product-filter-type');
    const stockEl = document.getElementById('admin-product-filter-stock');
    const langEl = document.getElementById('admin-product-filter-lang');
    const categoryEl = document.getElementById('admin-product-filter-category'); // 🔧 new category filter

    if (!searchEl || !typeEl || !stockEl) return;

    const searchTerm = searchEl.value.toLowerCase();
    const typeFilter = typeEl.value;
    const stockFilter = stockEl.value;
    const langFilter = langEl ? langEl.value : 'all';
    const categoryFilter = categoryEl ? categoryEl.value : 'all'; // 🔧 category filter value

    let filtered = allAdminProducts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm) || (p.author && p.author.toLowerCase().includes(searchTerm));

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

        // 🔧 Language filter
        let matchesLang = true;
        if (langFilter && langFilter !== 'all') {
            matchesLang = (p.language || '').toLowerCase() === langFilter.toLowerCase();
        }

        // 🔧 Category filter
        let matchesCategory = true;
        if (categoryFilter && categoryFilter !== 'all') {
            const pCat = (p.category || ((['EBOOK', 'AUDIOBOOK'].includes(p.type)) ? 'Digital' : 'Physical')).toLowerCase();
            matchesCategory = pCat === categoryFilter.toLowerCase();
        }

        return matchesSearch && matchesType && matchesStock && matchesLang && matchesCategory;
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px; opacity:0.5;">No products found matching filters.</td></tr>';
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        // Dynamic Thumbnail Resolver
        let thumbUrl = CONFIG.BASE_PATH + 'assets/images/placeholder.png';
        if (p.thumbnail) {
            if (p.thumbnail && p.thumbnail.startsWith('http')) {
                thumbUrl = p.thumbnail;
            } else if (p.thumbnail && p.thumbnail.startsWith('img/')) {
                // Shared frontend images - transform to new assets path
                thumbUrl = CONFIG.BASE_PATH + 'assets/images/' + p.thumbnail.replace('img/', '');
            } else {
                // Backend uploads
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
                    <button onclick="window.deleteProduct('${p._id}', '${(p.title || '').replace(/'/g, '')}')" class="btn-icon" style="color: #ff4d4d;" title="Delete Product"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// 🔧 DELETE PRODUCT — was missing entirely; button called this but function didn't exist
window.deleteProduct = async function (productId, productTitle) {
    const displayName = productTitle || 'this product';
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${displayName}"?\n\nThis will:\n• Remove the product from the database\n• Delete all associated files (images, PDFs, audio)\n• Remove it from all users' libraries\n\nThis action CANNOT be undone.`)) return;

    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`${API_BASE}/api/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            if (typeof showToast === 'function') showToast(`"${displayName}" deleted successfully.`, 'success');
            loadAdminProductsFull(); // Refresh list
            if (typeof updateAdminStats === 'function') updateAdminStats();
        } else {
            alert(data.message || 'Failed to delete product');
        }
    } catch (e) {
        console.error('Delete product error:', e);
        alert('Error deleting product: ' + e.message);
    }
};

window.loadAdminCustomers = async function () {
    const tbody = document.getElementById('admin-customers-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Fetching customers...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();

        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding: 12px;">${u.name}</td>
                <td style="padding: 12px;">${u.email}</td>
                <td style="padding: 12px;">${u.phone || 'N/A'}</td>
                <td style="padding: 12px;">-</td>
                <td style="padding: 12px;">-</td>
                <td style="padding: 12px;"><button class="btn btn-outline small">Profile</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) { console.error(e); }
};

window.loadAdminPayments = async function () {
    const tbody = document.getElementById('admin-payments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Fetching payments...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/payments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const payments = await res.json();

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No payment records found yet.</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(p => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-family: monospace;">${p.paymentId || 'N/A'}</td>
                <td style="padding: 12px; font-family: monospace;">#${p.orderId || 'N/A'}</td>
                <td style="padding: 12px;">₹${p.amount}</td>
                <td style="padding: 12px;">${p.method || 'Razorpay'}</td>
                <td style="padding: 12px;"><span class="badge ${p.status === 'Paid' ? 'green' : 'gold'}">${p.status}</span></td>
                <td style="padding: 12px;">${new Date(p.date || p.createdAt).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color: #ff4d4d;">Error loading payments.</td></tr>';
    }
};

window.loadAdminShipments = async function () {
    const tbody = document.getElementById('admin-shipments-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Fetching shipments...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const shipments = await res.json();

        if (shipments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No active shipments. Ready for Shiprocket integration.</td></tr>';
            return;
        }

        tbody.innerHTML = shipments.map(s => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-family: monospace;">#${s.orderId}</td>
                <td style="padding: 12px;">${s.courierName || 'Auto-Select'}</td>
                <td style="padding: 12px; font-family: monospace;">${s.awbNumber || 'Pending'}</td>
                <td style="padding: 12px;"><span class="badge ${s.shippingStatus === 'Delivered' ? 'green' : 'gold'}">${s.shippingStatus}</span></td>
                <td style="padding: 12px;"><button class="btn btn-outline small" onclick="alert('Print functionality coming soon')">Print</button></td>
                <td style="padding: 12px;">${s.trackingLink ? `<a href="${s.trackingLink}" target="_blank" style="color:var(--gold-text);">Track</a>` : 'N/A'}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color: #ff4d4d;">Error loading shipments.</td></tr>';
    }
};

window.loadAdminCoupons = async function () {
    const tbody = document.getElementById('admin-coupons-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center;">Fetching coupons...</td></tr>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/coupons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coupons = await res.json();

        if (coupons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; opacity:0.5;">No coupons created yet.</td></tr>';
            return;
        }

        tbody.innerHTML = coupons.map(c => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-weight: bold; color: var(--gold-text);">${c.code}</td>
                <td style="padding: 12px;">${c.type}</td>
                <td style="padding: 12px;">${c.type === 'Percentage' ? c.value + '%' : '₹' + c.value}</td>
                <td style="padding: 12px;">${c.usedCount} / ${c.usageLimit}</td>
                <td style="padding: 12px;">${c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'Never'}</td>
                <td style="padding: 12px;"><span class="badge ${c.isActive ? 'green' : 'red'}">${c.isActive ? 'Active' : 'Expired'}</span></td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:20px; text-align:center; color: #ff4d4d;">Error loading coupons.</td></tr>';
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

// Handle Product Form Submission
if (document.getElementById('admin-product-form')) {
    document.getElementById('admin-product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Fix: Select button by ID because it is outside the form in the new design
        const btn = document.getElementById('admin-save-btn');
        if (!btn) return console.error("Save button not found");
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Processing...';
        btn.disabled = true;

        try {
            const token = localStorage.getItem('authToken');
            const formData = new FormData();

            const cover = document.getElementById('admin-file-cover').files[0];
            const ebook = document.getElementById('admin-file-ebook').files[0];
            const audio = document.getElementById('admin-file-audio').files[0];

            if (cover) formData.append('cover', cover);
            if (ebook) formData.append('ebook', ebook);
            if (audio) formData.append('audio', audio);

            let uploadData = {};
            if (cover || ebook || audio) {
                const uploadRes = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await uploadRes.json();
                if (!uploadRes.ok) {
                    throw new Error(result.message || 'File upload failed');
                }
                if (result.paths) uploadData = result.paths;
            }

            const productId = document.getElementById('admin-prod-id').value;
            const isEdit = !!productId;

            const productData = {
                title: document.getElementById('admin-prod-title').value,
                author: document.getElementById('admin-prod-author').value,
                type: document.getElementById('admin-prod-type').value,
                language: document.getElementById('admin-prod-lang').value || 'Hindi',
                volume: document.getElementById('admin-prod-volume').value || '',
                price: Number(document.getElementById('admin-prod-price').value),
                discountPrice: Number(document.getElementById('admin-prod-discount-price').value) || null,
                stock: Number(document.getElementById('admin-prod-stock').value) || 0,
                weight: Number(document.getElementById('admin-prod-weight').value) || 0,
                length: Number(document.getElementById('admin-prod-length').value) || 0,
                breadth: Number(document.getElementById('admin-prod-width').value) || 0,
                height: Number(document.getElementById('admin-prod-height').value) || 0,
                duration: document.getElementById('admin-prod-duration').value || '',
                description: document.getElementById('admin-prod-desc').value
            };

            // 🔧 Auto-set category based on type (do NOT hardcode 'Digital')
            const pType = productData.type;
            if (pType === 'EBOOK' || pType === 'AUDIOBOOK') {
                productData.category = 'Digital';
            } else if (pType === 'HARDCOVER' || pType === 'PAPERBACK') {
                productData.category = 'Physical';
            }

            if (uploadData.coverPath) productData.thumbnail = uploadData.coverPath;

            // Fixed: Only assign filePath based on the actual selected product type
            if (productData.type === 'EBOOK' && uploadData.ebookPath) {
                productData.filePath = uploadData.ebookPath;
            } else if (productData.type === 'AUDIOBOOK' && uploadData.audioPath) {
                productData.filePath = uploadData.audioPath;
            }

            const url = isEdit ? `${API_BASE}/api/products/${productId}` : `${API_BASE}/api/products`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (res.ok) {
                closeProductModal();
                loadAdminProductsFull(); // Refresh full list
                updateAdminStats(); // Refresh dashboard stats
                if (typeof syncLibraryWithBackend === 'function') syncLibraryWithBackend();
            } else {
                const err = await res.json();
                alert(err.message || 'Error saving product');
            }
        } catch (err) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }
    });
}

// --- MISSING DASHBOARD FUNCTIONS ---

window.viewOrderDetail = async function (id, mode = 'details') {
    const modal = document.getElementById('order-detail-modal');
    if (!modal) return;

    // Mode-based UI Reset (matches new compact HTML)
    const topBarTitle = modal.querySelector('.reader-title');
    const trackingPanel = document.getElementById('modal-tracking-panel');
    const itemsPanel = document.getElementById('modal-order-items')?.closest('.glass-panel');
    const paymentAddressRow = itemsPanel?.nextElementSibling; // The 2-col grid: payment + address

    if (mode === 'track') {
        // Track mode: Show tracking, hide items & payment/address sidebar
        if (topBarTitle) topBarTitle.innerHTML = `<i class="fas fa-truck-moving gold-text"></i> LIVE TRACKING <span id="modal-order-id" style="color: rgba(255,211,105,0.8); margin-left: 10px; font-size: 0.75rem;"></span>`;
        if (trackingPanel) trackingPanel.style.display = 'block';
        if (itemsPanel) itemsPanel.style.display = 'none';
        if (paymentAddressRow) paymentAddressRow.style.display = 'none';
    } else {
        // Details mode: Hide tracking, show items & payment/address
        if (topBarTitle) topBarTitle.innerHTML = `<i class="fas fa-box-open gold-text"></i> ORDER DETAILS <span id="modal-order-id" style="color: rgba(255,211,105,0.8); margin-left: 10px; font-size: 0.75rem;"></span>`;
        if (trackingPanel) trackingPanel.style.display = 'none';
        if (itemsPanel) itemsPanel.style.display = 'block';
        if (paymentAddressRow) paymentAddressRow.style.display = 'grid';
    }

    try {
        const res = await fetch(`${API_BASE}/api/orders/track/${id}`);
        const order = await res.json();
        if (!res.ok) throw new Error(order.message);

        const orderIdEl = document.getElementById('modal-order-id');
        if (orderIdEl) orderIdEl.textContent = `#${order.orderId}`;
        const dateEl = document.getElementById('modal-order-date');
        if (dateEl) dateEl.textContent = `Placed on: ${new Date(order.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

        const subtotalEl = document.getElementById('modal-subtotal');
        const totalEl = document.getElementById('modal-total');
        const discountRowEl = document.getElementById('modal-discount-row');
        const discountEl = document.getElementById('modal-discount');
        const discountLabelEl = document.getElementById('modal-discount-label');

        const curCode = order.paymentCurrency || order.currency || 'INR';
        const symbolMap = {
            'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'CA$', 'AUD': 'AU$', 'NZD': 'NZ$',
            'AED': 'AED ', 'SAR': 'SAR ', 'OMR': 'OMR ', 'KWD': 'KWD ', 'BHD': 'BHD ', 'QAR': 'QAR ',
            'SGD': 'S$', 'MYR': 'RM ', 'JPY': '¥', 'CNY': '¥', 'KRW': '₩', 'RUB': '₽', 'BRL': 'R$ ',
            'MXN': 'MX$ ', 'ZAR': 'R ', 'CHF': 'CHF ', 'SEK': 'kr ', 'NOK': 'kr ', 'DKK': 'kr ',
            'PLN': 'zł ', 'HKD': 'HK$', 'THB': '฿ ', 'IDR': 'Rp ', 'PHP': '₱ ', 'VND': '₫ '
        };
        const curSymbol = symbolMap[curCode] || (curCode + ' ');

        const originalSubtotal = order.offerOriginalAmount || order.subtotal || order.totalAmount;
        if (subtotalEl) subtotalEl.textContent = `${curSymbol}${originalSubtotal}`;

        if (order.purchasedThroughOffer === 'Yes' && order.offerSavings > 0) {
            if (discountRowEl) discountRowEl.style.display = 'flex';
            if (discountEl) discountEl.textContent = `-${curSymbol}${order.offerSavings}`;
            if (discountLabelEl) discountLabelEl.textContent = order.offerName || 'Offer Discount';
        } else {
            if (discountRowEl) discountRowEl.style.display = 'none';
        }

        if (totalEl) totalEl.textContent = `${curSymbol}${order.totalAmount}`;

        const methodEl = document.getElementById('modal-payment-method');
        const statusPayEl = document.getElementById('modal-payment-status');
        if (methodEl) methodEl.textContent = order.paymentMethod || 'Razorpay';
        if (statusPayEl) {
            statusPayEl.textContent = order.paymentStatus || 'Paid';
            statusPayEl.style.color = (order.paymentStatus === 'Paid') ? '#4CAF50' : '#ff4d4d';
        }

        // Items
        const itemsContainer = document.getElementById('modal-order-items');
        itemsContainer.innerHTML = (order.items || []).map(item => {
            const qty = Number(item.quantity) || 1;
            let unitPrice = Number(item.price);
            if (isNaN(unitPrice) || unitPrice <= 0) {
                unitPrice = (Number(item.totalPrice) / qty) || Number(item.unitPrice) || 0;
            }
            if (unitPrice <= 0 && order.totalAmount > 0 && (order.items || []).length === 1) {
                unitPrice = Number(order.totalAmount) / qty;
            }
            const lineTotal = unitPrice * qty;
            const formattedTotal = isNaN(lineTotal) ? '0' : lineTotal.toLocaleString('en-IN');
            const formattedUnit = isNaN(unitPrice) ? '0' : unitPrice.toLocaleString('en-IN');

            return `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; background:rgba(255,255,255,0.03); padding:14px 18px; border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
                <div style="flex:1; min-width:0;">
                    <h4 style="margin:0; font-size:0.95rem; color:#ffffff; word-break:break-word; line-height:1.4;">${item.title || 'Product'}</h4>
                    <p style="margin:4px 0 0; font-size:0.75rem; color:rgba(255,255,255,0.6); text-transform:uppercase;">${item.type || 'Standard'} &bull; Qty: <strong style="color:#fff;">${qty}</strong></p>
                </div>
                <div style="text-align:right; flex-shrink:0; white-space:nowrap;">
                    <span class="gold-text" style="font-size:1rem; font-weight:800; color:#FFD369 !important;">${curSymbol}${formattedTotal}</span>
                    ${qty > 1 ? `<span style="font-size:0.7rem; color:rgba(255,255,255,0.5); display:block; margin-top:2px;">(${curSymbol}${formattedUnit} each)</span>` : ''}
                </div>
            </div>
            `;
        }).join('');

        // Address Helper
        const getDisplayAddress = (a) => {
            if (!a) return 'No address provided';
            // Option 1: Address is already a direct string
            if (typeof a.address === 'string' && a.address.length > 5) return a.address;
            
            // Option 2: Address is a structured object
            if (typeof a.address === 'object' && a.address !== null) {
                const addrObj = a.address;
                const lines = [];
                if (addrObj.house || addrObj.street) lines.push(addrObj.house || addrObj.street);
                if (addrObj.area) lines.push(addrObj.area);
                if (addrObj.landmark) lines.push(`Landmark: ${addrObj.landmark}`);
                return lines.join(', ');
            }
            return 'No address provided';
        };

        // Address
        const addr = order.customer;
        const addrContainer = document.getElementById('modal-shipping-address');
        if (addrContainer) {
            const displayAddr = getDisplayAddress(addr);
            const city = addr.city || addr.address?.city || 'Unknown City';
            const state = addr.state || addr.address?.state || '';
            const pincode = addr.zip || addr.address?.pincode || addr.address?.zip || '000000';
            
            addrContainer.innerHTML = `
                <strong style="color:white;">${addr.name || 'Customer'}</strong><br>
                ${displayAddr}<br>
                ${city}${state ? (', ' + state) : ''} - ${pincode}<br>
                <span style="opacity:0.6;"><i class="fas fa-phone-alt" style="font-size:0.7rem;"></i> ${addr.phone || 'N/A'}</span>
            `;
        }

        // Timeline V2
        const timeline = document.getElementById('modal-order-timeline');
        if (timeline) {
            const steps = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
            const icons = ['cog', 'box-open', 'shipping-fast', 'motorcycle', 'check-double'];

            // Map status to these steps
            let currentIdx = steps.indexOf(order.status);
            if (currentIdx === -1 && order.status === 'Paid') currentIdx = 0; // Paid maps to Processing start

            timeline.innerHTML = steps.map((s, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                const hist = order.timeline ? order.timeline.find(t => t.status === s) : null;
                const timeStr = hist ? new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return `
                    <div class="timeline-step-v2 ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        <div class="step-icon-v2">
                            <i class="fas fa-${icons[idx]}"></i>
                        </div>
                        <span class="step-label-v2">${s}</span>
                        ${hist ? `<span class="step-time-v2">${timeStr}</span>` : ''}
                    </div>
                `;
            }).join('');

            // Add AWB display + Refresh + full-page track link if AWB is present
            const awb = order.awbNumber || order.awb || order.shipmentId;
            const awbPanel = document.createElement('div');
            awbPanel.id = 'awb-info-panel';
            if (awb && awb.length > 5) {
                awbPanel.innerHTML = `
                    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <span style="font-size: 0.7rem; opacity: 0.5; display: block; margin-bottom: 4px; letter-spacing: 1.5px; text-transform: uppercase;">AWB Number</span>
                            <span style="font-weight: 700; color: white; font-family: monospace; letter-spacing: 1px;">${awb}</span>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button class="btn btn-outline small" onclick="refreshTrackingData('${awb}')" id="refresh-track-btn" style="border-radius: 8px;">
                                <i class="fas fa-sync-alt" style="margin-right: 6px;"></i> Refresh Live
                            </button>
                            <a href="tracking.html?id=${order.orderId}" target="_blank" class="btn btn-gold small" style="border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                                <i class="fas fa-satellite-dish"></i> Full Tracking Page
                            </a>
                        </div>
                    </div>
                    <div id="live-tracking-updates" style="margin-top: 15px;"></div>
                `;
            } else {
                awbPanel.innerHTML = `
                    <div style="margin-top: 20px; padding: 20px; background: rgba(212,175,55,0.04); border: 1px dashed rgba(212,175,55,0.15); border-radius: 12px; text-align: center;">
                        <i class="fas fa-box-open" style="color: rgba(212,175,55,0.3); font-size: 1.5rem; margin-bottom: 10px; display: block;"></i>
                        <p style="font-size: 0.85rem; opacity: 0.6; margin: 0;">Shipment not yet dispatched. Tracking will appear here once the package is picked up.</p>
                    </div>
                `;
            }
            timeline.insertAdjacentElement('afterend', awbPanel);
        }

        modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // If in track mode, scroll to timeline and auto-refresh
        if (mode === 'track') {
            setTimeout(() => {
                const refreshBtn = document.getElementById('refresh-track-btn');
                if (refreshBtn) refreshBtn.click();
            }, 300);
        }
    } catch (e) {
        console.error("Error loading order:", e);
        showToast("Error loading order details", "error");
    }
}

window.closeOrderDetailModal = () => {
    document.getElementById('order-detail-modal').style.display = 'none';
    document.body.classList.remove('modal-open');
};

// --- TRACKING & INVOICE HELPERS ---
window.downloadInvoice = async function (orderId) {
    const btn = event?.target?.closest('button') || { innerHTML: '', disabled: false };
    const originalHTML = btn.innerHTML;

    try {
        if (btn.tagName === 'BUTTON') {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            btn.disabled = true;
        }

        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/orders/${orderId}/invoice`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Invoice generation failed');
        }

        // Handle Blob for PDF download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EFV_Invoice_${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        showToast("Invoice downloaded successfully", "success");
    } catch (e) {
        console.error(e);
        showToast(e.message || "Failed to download invoice", "error");
    } finally {
        if (btn.tagName === 'BUTTON') {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
};

window.refreshTrackingData = async function (awb) {
    const btn = document.getElementById('refresh-track-btn');
    const logs = document.getElementById('live-tracking-updates');
    if (!btn || !logs) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
    btn.disabled = true;

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/api/shipments/track/${awb}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        const data = json.data;

        if (res.ok && json.status && data) {
            const tracking = data;
            // Get history — NimbusPost may use various field names
            const history = tracking.history || tracking.tracking_events || tracking.events || [];

            if (history.length > 0) {
                // Use robust date-based sort descending (newest first)
                const sorted = [...history].sort((a, b) => {
                    const timeA = new Date(a.event_time || a.timestamp || a.date || a.datetime || 0);
                    const timeB = new Date(b.event_time || b.timestamp || b.date || b.datetime || 0);
                    return timeB - timeA;
                });
                
                logs.innerHTML = `
                    <div style="background: rgba(255,211,105,0.04); border-radius: 12px; padding: 18px; border: 1px solid rgba(255,211,105,0.12); margin-top: 4px;">
                        <p style="margin: 0 0 14px; font-size: 0.72rem; font-weight: 800; color: var(--gold-text); text-transform: uppercase; letter-spacing: 2px;">NimbusPost Live Updates</p>
                        ${sorted.map((ev, i) => {
                            const evStatus = ev.status_name || ev.activity || ev.status || ev.statusName || ev.status_desc || ev.statusDescription || ev.event_description || ev.remark || ev.remarks || ev.scan_status || ev.scanStatus || ev.scan_status_desc || ev.scanStatusDesc || ev.activity_description || ev.activityDescription || ev.event || ev.description || ev.Activity || ev.Status || ev.StatusName || 'Update';
                            const evLoc = ev.location || ev.city || ev.hub || '';
                            const evTime = ev.event_time || ev.timestamp || ev.date || ev.datetime;
                            const timeStr = evTime ? new Date(evTime).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                            }) : '';

                            return `
                                <div style="display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                                    <div style="flex-shrink: 0; margin-top: 4px;">
                                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${i === 0 ? 'var(--gold-text)' : 'rgba(255,255,255,0.15)'}; box-shadow: ${i === 0 ? '0 0 8px rgba(212,175,55,0.5)' : 'none'};"></div>
                                    </div>
                                    <div style="flex: 1;">
                                        <span style="display: block; font-size: 0.88rem; font-weight: 600; color: ${i === 0 ? 'var(--gold-text)' : 'rgba(255,255,255,0.85)'}; margin-bottom: 2px;">${evStatus}</span>
                                        ${evLoc ? `<span style="font-size: 0.78rem; opacity: 0.55;"><i class="fas fa-map-marker-alt" style="font-size: 0.65rem; margin-right: 4px;"></i>${evLoc}</span>` : ''}
                                        ${timeStr ? `<span style="display: block; font-size: 0.72rem; opacity: 0.35; margin-top: 2px;">${timeStr}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
                showToast('Live tracking updated', 'success');
            } else {
                logs.innerHTML = `<div style="padding: 20px; text-align: center; opacity: 0.5; font-size: 0.85rem;"><i class="fas fa-clock" style="margin-right: 8px;"></i>Carrier updates will appear once the package is picked up.</div>`;
                showToast('Shipment registered. Awaiting pickup.', 'info');
            }
        } else {
            logs.innerHTML = `<div style="padding: 20px; text-align: center; opacity: 0.5; font-size: 0.85rem;"><i class="fas fa-satellite-dish" style="margin-right: 8px;"></i>${data.message || 'Tracking info not available yet. Check back soon.'}</div>`;
            showToast(data.message || 'Tracking info not available yet', 'info');
        }
    } catch (e) {
        console.error('refreshTrackingData error:', e);
        logs.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff4d4d; font-size: 0.85rem;"><i class="fas fa-wifi" style="margin-right: 8px;"></i>Connection error. Please try again.</div>`;
        showToast('Error connecting to shipping server', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

// Address Management
// --- ADDRESS MANAGEMENT V2 (PROPER LOCAL STORAGE) ---

// Address key helper moved to top

// End of Address Modal Controllers (New centralized versions at top)

window.deleteAddress = function (id) {
    if (!confirm("Are you sure you want to delete this address?")) return;

    const key = getAddressKey();
    let addresses = JSON.parse(localStorage.getItem(key)) || [];
    addresses = addresses.filter(a => a.id !== id);

    localStorage.setItem(key, JSON.stringify(addresses));

    // Sync with server in background if possible
    const token = localStorage.getItem('authToken');
    if (token) {
        fetch(`${API_BASE}/api/users/address/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(e => console.log("Sync deletion error:", e));
    }

    renderSavedAddresses();
    showToast("Address deleted", "info");
};



// Listen for address form submission
document.addEventListener('DOMContentLoaded', () => {
    const addrForm = document.getElementById('address-form');
    if (addrForm) {
        addrForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('address-id').value;
            const key = getAddressKey();
            let addresses = JSON.parse(localStorage.getItem(key)) || [];

            const typeInput = document.querySelector('input[name="addr-type"]:checked');
            const countrySelectEl = document.getElementById('addr-country-select');
            const countryEl  = document.getElementById('addr-country');
            const phoneCodeEl = document.getElementById('addr-phone-code');
            
            const countryCodeVal = (countrySelectEl && countrySelectEl.value) ? countrySelectEl.value : (countryEl ? countryEl.value : (localStorage.getItem('efv_selected_country') || 'IN'));
            const config = COUNTRY_MAP_CONFIG[countryCodeVal] || { code: '+91', name: 'India' };
            
            const countryCode = (phoneCodeEl && phoneCodeEl.value) ? phoneCodeEl.value : config.code;
            const rawPhone   = document.getElementById('addr-phone').value.trim();
            const fullPhone  = (countryCode && !rawPhone.startsWith(countryCode))
                               ? countryCode + ' ' + rawPhone
                               : rawPhone;

            const rawPincode = (document.getElementById('addr-pincode')?.value || '').trim();
            const postalVal = (typeof validatePostalCode === 'function')
                ? validatePostalCode(rawPincode, countryCodeVal || config.name || 'IN')
                : { isValid: true, normalized: rawPincode };

            if (!postalVal.isValid) {
                alert(postalVal.error || 'Please enter a valid postal code');
                const pinEl = document.getElementById('addr-pincode');
                if (pinEl) pinEl.focus();
                return;
            }

            const data = {
                id: id || 'addr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                fullName: document.getElementById('addr-name').value,
                phone: fullPhone,
                phoneCode: countryCode,
                country: config.name || countryCodeVal,
                countryCode: countryCodeVal,
                countryName: config.name || countryCodeVal,
                pincode: postalVal.normalized || rawPincode,
                state: document.getElementById('addr-state').value,
                city: document.getElementById('addr-city').value,
                house: document.getElementById('addr-house').value,
                area: document.getElementById('addr-area').value,
                landmark: document.getElementById('addr-landmark').value,
                type: typeInput ? typeInput.value : 'Home',
                isDefault: document.getElementById('addr-default').checked,
                createdAt: new Date().toISOString()
            };

            // Handle default logic: only one default address
            if (data.isDefault) {
                addresses.forEach(a => a.isDefault = false);
            } else if (addresses.length === 0) {
                data.isDefault = true;
            }

            if (id) {
                // Update existing
                const index = addresses.findIndex(a => (a.id === id || a._id === id));
                if (index !== -1) addresses[index] = { ...addresses[index], ...data };
                else addresses.push(data);
            } else {
                // Add new
                addresses.push(data);
            }

            // Save to localStorage
            localStorage.setItem(key, JSON.stringify(addresses));

            // Sync with Server (Non-blocking fallback)
            const token = localStorage.getItem('authToken');
            if (token) {
                const url = id ? `${API_BASE}/api/users/address/${id}` : `${API_BASE}/api/users/address`;
                const method = id ? 'PUT' : 'POST';
                fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(data)
                }).catch(e => console.log("Sync error:", e));
            }

            if (typeof window.closeAddressModal === 'function') {
                window.closeAddressModal();
            } else {
                closeAddressModal();
            }

            renderSavedAddresses();
            showToast(id ? "Address updated" : "Address saved", "success");

            // Handle Checkout Integration if open
            const checkoutOverlay = document.getElementById('checkout-overlay');
            const isCheckoutOpen = checkoutOverlay && (checkoutOverlay.style.display === 'flex' || checkoutOverlay.classList.contains('active'));
            
            if (isCheckoutOpen) {
                console.log("🛒 Checkout overlay detected, refreshing addresses...");
                if (typeof window.renderCheckoutAddresses === 'function') {
                    // If adding new, try to select it
                    if (!id && data.id) {
                        window.checkoutState.selectedAddressId = data.id;
                    }
                    window.renderCheckoutAddresses();
                }
            }
        });
    }
});

window.renderSavedAddresses = function () {
    const key = getAddressKey();
    const addresses = JSON.parse(localStorage.getItem(key)) || [];
    const container = document.getElementById('saved-addresses-grid-v2');

    if (!container) return;

    if (addresses.length === 0) {
        container.innerHTML = `
            <div class="address-card empty glass-panel" style="grid-column: 1/-1; padding: 50px 20px; text-align: center; border: 1px dashed rgba(255,255,255,0.1);">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; opacity: 0.1; margin-bottom: 20px;"></i>
                <p style="opacity: 0.5; font-size: 1.1rem;">No saved addresses found.</p>
                <p style="opacity: 0.3; font-size: 0.9rem; margin-top: 10px;">Add an address to speed up your checkout process.</p>
            </div>`;
        return;
    }

    // Sort to show default first
    addresses.sort((a, b) => (b.isDefault - a.isDefault));

    container.innerHTML = addresses.map(addr => `
        <div class="address-card glass-panel ${addr.isDefault ? 'default' : ''}" 
             style="border: 1px solid ${addr.isDefault ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255,255,255,0.08)'}; 
                    background: ${addr.isDefault ? 'rgba(212, 175, 55, 0.03)' : 'rgba(0,0,0,0.2)'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span class="status-badge" style="background: rgba(255,255,255,0.05); color: #fff; font-size: 0.7rem;">
                    <i class="fas ${addr.type === 'Work' ? 'fa-briefcase' : 'fa-home'}" style="margin-right: 5px;"></i> ${addr.type || 'Home'}
                </span>
                ${addr.isDefault ? '<span class="default-badge" style="background: var(--gold-text); color: #000; font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; font-weight: 800; text-transform: uppercase;">Default</span>' : ''}
            </div>
            <div class="address-content">
                <h4 style="margin: 0 0 10px; color: #fff; font-size: 1.1rem;">${addr.fullName}</h4>
                <p style="margin: 5px 0; font-size: 0.95rem; opacity: 0.8; line-height: 1.5; color: #eee;">
                    ${addr.house}, ${addr.area}<br>
                    ${addr.landmark ? `<span style="font-size: 0.85rem; opacity: 0.6;">Landmark: ${addr.landmark}</span><br>` : ''}
                    ${addr.city}, ${addr.state} - ${addr.pincode}
                </p>
                <p style="margin: 10px 0 0; font-size: 0.9rem; font-weight: 600; color: var(--gold-text);">
                    <i class="fas fa-phone-alt"></i> ${addr.phone}
                </p>
            </div>
            <div class="address-actions" style="margin-top: 20px; display: flex; gap: 12px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px;">
                <button class="btn-outline small" style="flex: 1; padding: 8px !important; font-size: 0.8rem;" onclick="openAddressModal('${addr._id || addr.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger small" style="flex: 0 0 40px; border-radius: 8px; background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.2); color: #ff5252;" onclick="deleteAddress('${addr._id || addr.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
};

window.setAsDefaultAddress = function (id) {
    const key = getAddressKey();
    let addresses = JSON.parse(localStorage.getItem(key)) || [];
    addresses.forEach(a => a.isDefault = (a.id === id));
    localStorage.setItem(key, JSON.stringify(addresses));
    renderSavedAddresses();
    showToast("Default address updated", "success");
};

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
                container.innerHTML = active.slice(0, 1).map(o => {
                    const statusClass = `status-${o.status.toLowerCase().replace(/\s/g, '-')}`;
                    let returnStatusHtml = '';
                    if (o.returnStatus && o.returnStatus !== 'None') {
                        const returnClass = `status-${o.returnStatus.toLowerCase().replace(/\s/g, '-')}`;
                        returnStatusHtml = `<span class="status-badge ${returnClass}" style="margin-left: 8px;">Return: ${o.returnStatus}</span>`;
                    }
                    return `
                    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <span style="font-weight:700; color:var(--gold-text);">${o.orderId}</span>
                            <span class="status-badge ${statusClass}">${o.status}</span>
                            ${returnStatusHtml}
                        </div>
                        <div class="shipment-mini-track" style="display:flex; gap:5px; margin-bottom:10px;">
                            <div style="flex:1; height:4px; border-radius:10px; background:var(--gold-text);"></div>
                            <div style="flex:1; height:4px; border-radius:10px; background:rgba(255,255,255,0.1);"></div>
                            <div style="flex:1; height:4px; border-radius:10px; background:rgba(255,255,255,0.1);"></div>
                        </div>
                        <p style="margin:0; font-size:0.8rem; opacity:0.6;">Current: ${o.status}</p>
                    </div>
                    `;
                }).join('');
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
            <img src="${p.thumbnail || (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png')}" alt="${p.title}">
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
            <div class="cart-item-card" style="
                background: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(15,12,8,0.98) 100%);
                border: 1px solid rgba(255, 211, 105, 0.15);
                border-radius: 16px;
                padding: 18px 20px;
                display: flex;
                gap: 20px;
                align-items: center;
                position: relative;
                overflow: hidden;
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            " onmouseenter="this.style.borderColor='rgba(255,211,105,0.4)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 30px rgba(0,0,0,0.5)'" onmouseleave="this.style.borderColor='rgba(255,211,105,0.15)'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.4)'">
                
                <!-- Subtle glow accent -->
                <div style="position:absolute; top:0; left:0; right:0; height:1px; background: linear-gradient(90deg, transparent, rgba(255,211,105,0.3), transparent);"></div>

                <div style="position: relative; flex-shrink: 0;">
                    <img src="${item.thumbnail || (CONFIG.BASE_PATH + 'assets/images/vol1-cover.png')}" class="cart-cover-img"
                        style="width: 75px; height: 105px; object-fit: cover; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.5); border: 1px solid rgba(255,211,105,0.2);"
                        onerror="this.src='${CONFIG.BASE_PATH}assets/images/vol1-cover.png'">
                </div>

                <!-- Info -->
                <div class="cart-item-info-col" style="flex: 1; min-width: 0;">
                    <div class="cart-item-title-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <h4 class="cart-item-title" style="margin: 0; font-size: 1rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${item.name || item.title}
                        </h4>
                    </div>
                    <p style="margin: 0 0 12px; font-size: 0.78rem; color: rgba(255,255,255,0.4); letter-spacing: 0.3px;">
                        <i class="fas fa-tag" style="color: rgba(255,211,105,0.5); margin-right: 4px;"></i>${item.type || 'Standard Edition'}
                        ${item.language ? `&nbsp;•&nbsp;<i class="fas fa-globe" style="color: rgba(255,211,105,0.5); margin-right: 4px;"></i>${item.language}` : ''}
                    </p>

                    <!-- Qty + Price Row -->
                    <div class="cart-price-col" style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <!-- Qty Selector -->
                        <div class="cart-qty-ctrl" style="
                            display: flex !important; align-items: center !important; gap: 0 !important;
                            flex-direction: row !important; flex-wrap: nowrap !important;
                            background: rgba(255,255,255,0.05);
                            border: 1px solid rgba(255,255,255,0.1);
                            border-radius: 8px;
                            overflow: hidden;
                            min-width: 100px;
                        ">
                            <button onclick="updateCartQty('${item.id}', -1)" style="
                                background: transparent; border: none; color: rgba(255,255,255,0.7);
                                width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
                                display: flex; align-items: center; justify-content: center;
                                transition: all 0.2s;
                            " onmouseenter="this.style.background='rgba(255,211,105,0.1)'; this.style.color='#FFD369'" onmouseleave="this.style.background='transparent'; this.style.color='rgba(255,255,255,0.7)'">
                                <i class="fas fa-minus" style="font-size: 0.65rem;"></i>
                            </button>
                            <span style="
                                min-width: 32px; text-align: center; font-weight: 700;
                                font-size: 0.95rem; color: white; background: rgba(255,211,105,0.08);
                                height: 32px; line-height: 32px; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08);
                            ">${qty}</span>
                            <button onclick="updateCartQty('${item.id}', 1)" style="
                                background: transparent; border: none; color: rgba(255,255,255,0.7);
                                width: 32px; height: 32px; cursor: pointer; font-size: 1rem;
                                display: flex; align-items: center; justify-content: center;
                                transition: all 0.2s;
                            " onmouseenter="this.style.background='rgba(255,211,105,0.1)'; this.style.color='#FFD369'" onmouseleave="this.style.background='transparent'; this.style.color='rgba(255,255,255,0.7)'">
                                <i class="fas fa-plus" style="font-size: 0.65rem;"></i>
                            </button>
                        </div>

                        <!-- Price -->
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 1.15rem; font-weight: 800; background: linear-gradient(135deg, #FFD369, #FDB931); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                                ₹${(price * qty).toFixed(2)}
                            </span>
                            ${qty > 1 ? `<span style="font-size: 0.72rem; color: rgba(255,255,255,0.35);">₹${price.toFixed(2)} each</span>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Remove Button -->
                <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')" style="
                    flex-shrink: 0;
                    background: rgba(255, 77, 77, 0.1);
                    border: 1px solid rgba(255, 77, 77, 0.2);
                    color: #ff4d4d;
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                    font-size: 0.85rem;
                " onmouseenter="this.style.background='rgba(255,77,77,0.25)'; this.style.transform='scale(1.1)'" onmouseleave="this.style.background='rgba(255,77,77,0.1)'; this.style.transform='scale(1)'">
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
    const s = status.toLowerCase().replace(/\s/g, '-');
    switch (s) {
        case 'delivered':
        case 'completed': return 'status-delivered';
        case 'shipped': return 'status-shipped';
        case 'processing':
        case 'packed': return 'status-processing';
        case 'cancelled':
        case 'failed':
        case 'payment-failed': return 'status-cancelled';
        case 'paid': return 'status-shipped';
        default: return 'status-pending';
    }
}

// 3.1 Settings Internals (NEW)
function populateSettingsProfileFields() {
    const profile = window.currentUserProfile || {};
    let user = {};
    try {
        user = JSON.parse(localStorage.getItem('efv_user')) || JSON.parse(localStorage.getItem('efv_auth_user')) || {};
    } catch (e) {
        user = {};
    }
    const nameVal = profile.name || user.name || '';
    const emailVal = profile.email || user.email || '';
    let phoneVal = profile.phone || user.phone || '';

    // Smart fallback if phone is still empty: check saved addresses
    if (!phoneVal) {
        if (profile.savedAddresses && Array.isArray(profile.savedAddresses) && profile.savedAddresses.length > 0) {
            const defA = profile.savedAddresses.find(a => a.isDefault && a.phone && a.phone.trim());
            const anyA = profile.savedAddresses.find(a => a.phone && a.phone.trim());
            phoneVal = (defA && defA.phone) || (anyA && anyA.phone) || '';
        }
    }
    if (!phoneVal) {
        try {
            const getSaved = (k) => JSON.parse(localStorage.getItem(k));
            const addrs = (typeof getUserKey === 'function' && getSaved(getUserKey('efv_saved_addresses'))) || getSaved('efv_saved_addresses') || [];
            if (Array.isArray(addrs) && addrs.length > 0) {
                const defA = addrs.find(a => a.isDefault && a.phone && a.phone.trim());
                const anyA = addrs.find(a => a.phone && a.phone.trim());
                phoneVal = (defA && defA.phone) || (anyA && anyA.phone) || '';
            }
        } catch (e) {}
    }

    // Auto-update user in localStorage if we recovered a phone number
    if (phoneVal && !user.phone) {
        try {
            const legacyUser = JSON.parse(localStorage.getItem('efv_user')) || {};
            legacyUser.phone = phoneVal;
            localStorage.setItem('efv_user', JSON.stringify(legacyUser));
        } catch (e) {}
    }

    const nameInput = document.getElementById('settings-name-v2');
    if (nameInput && nameVal) nameInput.value = nameVal;

    const emailInput = document.getElementById('settings-email-v2');
    if (emailInput && emailVal) emailInput.value = emailVal;

    const phoneInput = document.getElementById('settings-phone-v2');
    if (phoneInput && phoneVal) phoneInput.value = phoneVal;
}
window.populateSettingsProfileFields = populateSettingsProfileFields;

function initializeSettingsTabs() {
    populateSettingsProfileFields();
    const sTabs = document.querySelectorAll('.settings-tab-btn[data-settings-tab]'); // Targeted to customer tabs
    const sPanes = document.querySelectorAll('#settings .settings-pane');
    sTabs.forEach(t => {
        t.addEventListener('click', () => {
            sTabs.forEach(btn => btn.classList.remove('active'));
            sPanes.forEach(pane => pane.style.display = 'none');

            t.classList.add('active');
            const target = t.getAttribute('data-settings-tab');
            const targetPane = document.getElementById(target);
            if (targetPane) targetPane.style.display = 'block';

            if (target === 'profile-tab') populateSettingsProfileFields();
            if (target === 'addresses-tab') renderSavedAddresses();
            if (target === 'payments-tab') loadBillingHistory();
        });
    });
}

function initializeNotificationFilters() {
    const nTabs = document.querySelectorAll('.settings-tab-btn[data-notif-filter]');
    nTabs.forEach(t => {
        t.addEventListener('click', () => {
            nTabs.forEach(btn => btn.classList.remove('active'));
            t.classList.add('active');
            const filter = t.getAttribute('data-notif-filter');
            renderNotificationsTab(filter);
        });
    });
}

function initializeAdminSettings() {
    const user = JSON.parse(localStorage.getItem('efv_user'));
    if (!user) return;

    // 1. Fill Data
    if (document.getElementById('adm-name')) document.getElementById('adm-name').value = user.name;
    if (document.getElementById('adm-email')) document.getElementById('adm-email').value = user.email;
    if (document.getElementById('admin-full-name')) document.getElementById('admin-full-name').textContent = user.name;
    if (document.getElementById('adm-last-login')) {
        document.getElementById('adm-last-login').value = new Date().toLocaleString();
    }

    // 2. Sub-tab Switching
    const aTabs = document.querySelectorAll('.settings-tab-btn[data-admin-tab]');
    const aPanes = document.querySelectorAll('#admin-settings .settings-pane');

    aTabs.forEach(t => {
        // Remove existing listeners by cloning if necessary, but here we just ensure we don't double bind
        const newT = t.cloneNode(true);
        t.parentNode.replaceChild(newT, t);

        newT.addEventListener('click', () => {
            aTabs.forEach(btn => btn.classList.remove('active')); // Note: we need to re-query for active class removal
            document.querySelectorAll('.settings-tab-btn[data-admin-tab]').forEach(btn => btn.classList.remove('active'));
            aPanes.forEach(pane => pane.style.display = 'none');

            newT.classList.add('active');
            const targetId = newT.getAttribute('data-admin-tab');
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.style.display = 'block';
        });
    });

    // Toggle switches logic
    document.querySelectorAll('.toggle-switch').forEach(sw => {
        sw.onclick = () => sw.classList.toggle('active');
    });
}
window.initializeAdminSettings = initializeAdminSettings; // Make it global

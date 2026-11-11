/**
 * EFV Cart JS - Shopping Logic
 */
console.log("EFV Cart JS Loaded - Version: 24.0 - UI & Email Fix");

document.addEventListener('DOMContentLoaded', () => {
    // Inject Premium Auth CSS
    if (!document.getElementById('auth-premium-style')) {
        const link = document.createElement('link');
        link.id = 'auth-premium-style';
        link.rel = 'stylesheet';
        link.href = CONFIG.BASE_PATH + 'css/auth-premium.css?v=24.0';
        document.head.appendChild(link);
    }

    // --- Currency Helper ---
    function getCurrencySymbol() {
        const country = (localStorage.getItem('efv_selected_country') || 'IN').toUpperCase();
        const symbols = {
            'IN': '₹', 'US': '$', 'GB': '£', 'CA': 'CA$', 'AU': 'AU$', 'NZ': 'NZ$',
            'FR': '€', 'DE': '€', 'ES': '€', 'IT': '€', 'PT': '€', 'NL': '€', 'BE': '€',
            'AT': '€', 'IE': '€', 'FI': '€', 'CH': 'CHF ', 'SE': 'kr ', 'NO': 'kr ', 'DK': 'kr ',
            'PL': 'zł ', 'AE': 'AED ', 'SA': 'SAR ', 'OM': 'OMR ', 'KW': 'KWD ', 'BH': 'BHD ',
            'QA': 'QAR ', 'SG': 'S$', 'MY': 'RM ', 'CN': '¥', 'JP': '¥', 'RU': '₽', 'KR': '₩',
            'BR': 'R$ ', 'MX': 'MX$ ', 'ZA': 'R ', 'HK': 'HK$', 'TH': '฿ ', 'ID': 'Rp ',
            'PHP': '₱ ', 'VN': '₫ '
        };
        return symbols[country] || '$';
    }
    window.getEFVCurrency = getCurrencySymbol; // Expose if needed elsewhere

    // Inject Auth Toast
    // Inject Cart HTML if not present
    if (!document.getElementById('cart-panel')) {
        const cartHTML = `
    <!-- Cart Modal -->
    <div class="cart-backdrop"></div>
    <div id="cart-panel">
        <div class="cart-header">
            <h3 data-i18n="cart.title">Your <span class="gold-text">Cart</span></h3>
            <div class="close-cart" style="cursor: pointer; font-size: 1.5rem;">&times;</div>
        </div>
        <div class="cart-items" id="cart-items-container" style="flex: 1; overflow-y: auto;">
            <!-- Items injected by JS -->
            <p style="text-align: center; margin-top: 50px; opacity: 0.5;" data-i18n="cart.empty">Your cart is empty.</p>
        </div>
        <div class="cart-total">
            <div id="cart-discounts-container" style="display: none; flex-direction: column; gap: 5px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed rgba(255,211,105,0.1); font-size: 0.85rem; color: #2ed573;"></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <span data-i18n="cart.total">Total:</span>
                <span class="gold-text" id="cart-total-price">${getCurrencySymbol()}0.00</span>
            </div>
            <button class="btn btn-gold" id="checkout-btn" style="width: 100%; margin-bottom: 15px;" data-i18n="cart.checkout">Checkout Now</button>
            <div class="auth-options" style="display: flex; gap: 10px;">
                <button class="btn btn-outline" id="cart-login-btn" style="flex: 1; font-size: 0.9rem; padding: 10px;" data-i18n="cart.login">Login</button>
                <button class="btn btn-outline" id="cart-signup-btn" style="flex: 1; font-size: 0.9rem; padding: 10px;" data-i18n="cart.signup">Sign Up</button>
            </div>
        </div>

        <!-- User Profile View (Hidden by default) -->
        <div id="user-profile-view" style="display: none; padding: 20px; color: var(--gold-light);">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 80px; height: 80px; background: rgba(255, 211, 105, 0.1); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--gold-energy);">
                    <i class="fas fa-user" style="font-size: 2rem; color: var(--gold-energy);"></i>
                </div>
                <h3 style="color: var(--gold-energy);">John Doe</h3>
                <p style="font-size: 0.9rem; opacity: 0.7;">john.doe@example.com</p>
            </div>
            <h4 style="border-bottom: 1px solid rgba(255, 211, 105, 0.2); padding-bottom: 10px; margin-bottom: 15px;" data-i18n="cart.purchase_history">Purchase History</h4>
            <div id="purchase-history-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 200px; overflow-y: auto;">
                <p style="text-align: center; opacity: 0.5; font-size: 0.85rem; margin-top: 20px;" data-i18n="cart.no_history">No purchase history found.</p>
            </div>
            <button class="btn btn-outline" id="logout-btn" style="width: 100%; margin-top: 20px;" data-i18n="cart.logout">Logout</button>
        </div>
    </div>

    <!-- Premium Auth Modal -->
    <div class="auth-premium-overlay" id="auth-modal">
        <div class="auth-premium-card">
            <div class="auth-premium-close" id="close-auth-modal" title="Press ESC to close"><i class="fas fa-times"></i></div>
            
            <h2 class="auth-premium-title">Welcome to EFV™</h2>

            <div class="auth-premium-tabs">
                <div class="auth-tab-item active" data-auth-tab="login">Login</div>
                <div class="auth-tab-item" data-auth-tab="signup">Create Account</div>
            </div>

            <!-- Login Form -->
            <form id="login-form" class="auth-premium-form active">
                <div class="input-group">
                    <label class="auth-label">Email Address</label>
                    <div class="input-wrapper">
                        <input type="email" id="login-email" class="auth-input" placeholder="Enter your email" required>
                        <i class="fas fa-envelope input-icon"></i>
                    </div>
                </div>
                
                <div class="input-group">
                    <label class="auth-label">Password</label>
                    <div class="input-wrapper">
                        <input type="password" id="login-password" class="auth-input" placeholder="••••••••" required>
                        <i class="fas fa-lock input-icon"></i>
                        <i class="fas fa-eye password-toggle"></i>
                    </div>
                </div>
                
                <div class="auth-extras">
                    <label>
                        <input type="checkbox" id="remember-me">
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="forgot-link">Forgot Password?</a>
                </div>

                <div id="login-general-error" class="error-message" style="margin-bottom:16px; text-align:center; font-weight:600;"></div>
                
                <button type="submit" class="auth-btn">
                    <span>Login Securely</span>
                    <div class="loader"></div>
                </button>

            </form>

            <!-- Sign Up Form -->
            <form id="signup-form" class="auth-premium-form">
                <div class="input-group">
                    <label class="auth-label">Full Name</label>
                    <div class="input-wrapper">
                        <input type="text" id="signup-name" class="auth-input" placeholder="John Doe" required>
                        <i class="fas fa-user input-icon"></i>
                    </div>
                </div>
                
                <div class="input-group">
                    <label class="auth-label">Email Address</label>
                    <div class="input-wrapper">
                        <input type="email" id="signup-email" class="auth-input" placeholder="email@example.com" required>
                        <i class="fas fa-envelope input-icon"></i>
                    </div>
                    <div class="error-message" id="signup-email-error">Please enter a valid email</div>
                </div>
                
                <div class="input-group">
                    <label class="auth-label">Phone Number</label>
                    <div class="input-wrapper">
                        <input type="tel" id="signup-phone" class="auth-input" placeholder="10-digit number" required maxlength="10">
                        <i class="fas fa-phone input-icon"></i>
                    </div>
                </div>
                
                <div class="input-group">
                    <label class="auth-label">Create Password</label>
                    <div class="input-wrapper">
                        <input type="password" id="signup-password" class="auth-input" placeholder="••••••••" required>
                        <i class="fas fa-lock input-icon"></i>
                        <i class="fas fa-eye password-toggle"></i>
                    </div>
                    <div class="helper-text">Minimum 6 characters</div>
                </div>
                
                <div class="strength-indicator"><div class="strength-bar"></div></div>
                
                <div class="input-group" style="margin-top: 5px;">
                    <label class="auth-label">Verify Password</label>
                    <div class="input-wrapper">
                        <input type="password" id="signup-confirm-password" class="auth-input" placeholder="••••••••" required>
                        <i class="fas fa-lock input-icon"></i>
                        <i class="fas fa-eye password-toggle"></i>
                    </div>
                    <div class="error-message" id="signup-match-error">Passwords do not match</div>
                </div>
                
                <div id="signup-general-error" class="error-message" style="margin:12px 0; text-align:center; font-weight:600;"></div>

                <button type="submit" class="auth-btn" id="signup-submit-btn">
                    <span>Create Account</span>
                    <div class="loader"></div>
                </button>
            </form>

            <div id="auth-sso-section">
                <div class="auth-separator">
                    <span>OR</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 340px; margin: 12px auto 0;">
                    <button type="button" id="uwo-sso-login-btn" style="
                        width: 100%;
                        background: linear-gradient(135deg, rgba(255, 211, 105, 0.1) 0%, rgba(18, 24, 34, 0.95) 100%);
                        color: #ffffff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        border: 1.5px solid rgba(255, 211, 105, 0.38);
                        border-radius: 14px;
                        font-size: 0.88rem;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                        height: 46px;
                        cursor: pointer;
                        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 211, 105, 0.2);
                        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    ">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFD369" style="filter: drop-shadow(0 0 5px rgba(255, 211, 105, 0.5));">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                        <span>Sign in with UWO Account</span>
                    </button>
                    <div id="google-login-container" style="display: flex; justify-content: center;"></div>
                </div>
            </div>

            <!-- Standalone UWO SSO Modal Inside Auth -->
            <div id="uwo-sso-submodal" style="display: none; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(18, 24, 34, 0.98) 0%, rgba(10, 13, 20, 0.98) 100%); border: 1px solid rgba(255, 211, 105, 0.25); border-radius: 28px; padding: 28px 24px 22px; z-index: 10; flex-direction: column; justify-content: space-between; box-shadow: 0 32px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 211, 105, 0.2);">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                        <button type="button" id="close-uwo-submodal" style="background: none; border: none; color: var(--gold-energy, #FFD369); cursor: pointer; display: flex; align-items: center; gap: 7px; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.5px; transition: opacity 0.2s;">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 0.7rem; font-weight: 800; background: rgba(255, 211, 105, 0.12); color: #FFD369; border: 1px solid rgba(255, 211, 105, 0.35); padding: 3px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 0 10px rgba(255, 211, 105, 0.15);">UWO SSO</span>
                        </div>
                    </div>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <h3 style="font-size: 1.2rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; font-family: 'Cinzel', serif; background: linear-gradient(180deg, #ffffff 0%, #FFD369 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Unified Web Options</h3>
                        <p style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); letter-spacing: 0.3px;">Sign in once to access all connected applications</p>
                    </div>

                    <div style="display: flex; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 14px; padding: 5px; margin-bottom: 20px;">
                        <button type="button" id="uwo-tab-login" style="flex: 1; padding: 9px 0; font-size: 12px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; border-radius: 10px; border: 1px solid rgba(255, 211, 105, 0.25); background: linear-gradient(135deg, rgba(255, 211, 105, 0.18) 0%, rgba(255, 211, 105, 0.08) 100%); color: var(--gold-energy, #FFD369); text-shadow: 0 0 12px rgba(255, 211, 105, 0.4); cursor: pointer; transition: all 0.3s ease;">Sign In</button>
                        <button type="button" id="uwo-tab-register" style="flex: 1; padding: 9px 0; font-size: 12px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; border-radius: 10px; border: 1px solid transparent; background: transparent; color: rgba(255, 255, 255, 0.4); cursor: pointer; transition: all 0.3s ease;">Register</button>
                    </div>

                    <form id="uwo-sso-form" style="display: flex; flex-direction: column; gap: 14px;">
                        <div id="uwo-name-group" style="display: none;">
                            <label style="font-size: 11px; color: rgba(255, 255, 255, 0.45); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: block; padding-left: 2px;">Full Name</label>
                            <input type="text" id="uwo-name-input" placeholder="Your Name" style="width: 100%; height: 40px; padding: 0 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 10px; color: #fff; font-size: 13px; outline: none; transition: all 0.3s ease;">
                        </div>

                        <div>
                            <label style="font-size: 11px; color: rgba(255, 255, 255, 0.45); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: block; padding-left: 2px;">Email Address</label>
                            <input type="email" id="uwo-email-input" placeholder="name@example.com" required style="width: 100%; height: 40px; padding: 0 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 10px; color: #fff; font-size: 13px; outline: none; transition: all 0.3s ease;">
                        </div>

                        <div>
                            <label style="font-size: 11px; color: rgba(255, 255, 255, 0.45); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: block; padding-left: 2px;">Password</label>
                            <input type="password" id="uwo-password-input" placeholder="••••••••" required style="width: 100%; height: 40px; padding: 0 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 10px; color: #fff; font-size: 13px; outline: none; transition: all 0.3s ease;">
                        </div>

                        <div id="uwo-error-msg" style="display: none; padding: 10px 14px; border-radius: 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 12px;"></div>
                        <div id="uwo-success-msg" style="display: none; padding: 10px 14px; border-radius: 10px; background: rgba(255, 211, 105, 0.12); border: 1px solid rgba(255, 211, 105, 0.3); color: #FFD369; font-size: 12px;"></div>

                        <button type="submit" id="uwo-submit-btn" style="
                            width: 100%;
                            height: 44px;
                            margin-top: 6px;
                            border: none;
                            border-radius: 12px;
                            cursor: pointer;
                            font-weight: 700;
                            font-size: 12px;
                            letter-spacing: 2px;
                            text-transform: uppercase;
                            color: #0a0d14;
                            background: linear-gradient(135deg, #FFD369 0%, #e8b84b 50%, #FFD369 100%);
                            background-size: 200% auto;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                            box-shadow: 0 6px 24px rgba(255, 211, 105, 0.25);
                            transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                        ">
                            <span id="uwo-btn-text">Sign In with UWO</span>
                            <div class="loader" id="uwo-loader" style="display: none; width: 16px; height: 16px; border: 2.5px solid rgba(0, 0, 0, 0.2); border-top-color: #000; border-radius: 50%; animation: spinnerRotate 0.75s linear infinite;"></div>
                        </button>
                    </form>
                </div>

                <div style="text-align: center; margin-top: 14px; font-size: 0.72rem; color: rgba(255, 255, 255, 0.35); letter-spacing: 0.5px;">
                    Protected by Unified Security Architecture
                </div>
            </div>

            <!-- Forgot Password Flow -->
            <div id="forgot-password-flow" style="display: none;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                    <button type="button" class="auth-premium-back" id="back-to-login">
                        <i class="fas fa-arrow-left"></i> Back to Login
                    </button>
                    <span style="font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--gold-energy); background: rgba(255, 211, 105, 0.1); border: 1px solid rgba(255, 211, 105, 0.25); padding: 3px 9px; border-radius: 999px;">Recovery</span>
                </div>

                <div style="text-align: center; margin-bottom: 18px;">
                    <h3 id="forgot-flow-title" style="font-size: 1.35rem; font-weight: 700; letter-spacing: 1.5px; font-family: 'Cinzel', serif; margin: 8px 0 6px; background: linear-gradient(180deg, #ffffff 0%, #FFD369 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Forgot Password</h3>
                    <p id="forgot-flow-desc" style="color: rgba(255, 255, 255, 0.65); font-size: 0.88rem; line-height: 1.5; margin: 0; padding: 0 6px;">Enter your email to receive a 6-digit verification code.</p>
                </div>

                <!-- Step Indicator -->
                <div class="fp-step-indicator">
                    <div class="fp-step-dot active" id="fp-dot-1"></div>
                    <div class="fp-step-dot" id="fp-dot-2"></div>
                    <div class="fp-step-dot" id="fp-dot-3"></div>
                </div>

                <!-- Step 1: Send OTP -->
                <form id="forgot-email-form" class="auth-premium-form active">
                    <div class="input-group">
                        <label class="auth-label">Email Address</label>
                        <div class="input-wrapper">
                            <input type="email" id="forgot-email" class="auth-input" placeholder="Enter your email" required>
                            <i class="fas fa-envelope input-icon"></i>
                        </div>
                    </div>
                    <div id="forgot-email-error" class="error-message" style="margin-bottom: 14px; text-align: center;"></div>
                    <button type="submit" class="auth-btn">
                        <span>Send Code</span>
                        <div class="loader"></div>
                    </button>
                </form>

                <!-- Step 2: Verify OTP -->
                <form id="forgot-otp-form" class="auth-premium-form">
                    <div class="input-group">
                        <label class="auth-label">Verification Code</label>
                        <div class="input-wrapper">
                            <input type="text" id="forgot-otp" class="auth-input" placeholder="••••••" maxlength="6" required>
                            <i class="fas fa-shield-alt input-icon"></i>
                        </div>
                    </div>
                    <div id="forgot-otp-error" class="error-message" style="margin-bottom: 14px; text-align: center;"></div>
                    <button type="submit" class="auth-btn">
                        <span>Verify Code</span>
                        <div class="loader"></div>
                    </button>
                    <p style="text-align: center; margin-top: 18px; font-size: 0.88rem; color: rgba(255, 255, 255, 0.5);">
                        Didn't receive code? <a href="#" id="resend-otp-btn" style="color: var(--gold-energy); text-decoration: none; font-weight: 600;">Resend</a>
                    </p>
                </form>

                <!-- Step 3: New Password -->
                <form id="forgot-reset-form" class="auth-premium-form">
                    <div class="input-group">
                        <label class="auth-label">New Password</label>
                        <div class="input-wrapper">
                            <input type="password" id="forgot-new-password" class="auth-input" placeholder="••••••••" required>
                            <i class="fas fa-lock input-icon"></i>
                            <i class="fas fa-eye password-toggle"></i>
                        </div>
                    </div>
                    <div class="input-group">
                        <label class="auth-label">Confirm New Password</label>
                        <div class="input-wrapper">
                            <input type="password" id="forgot-confirm-password" class="auth-input" placeholder="••••••••" required>
                            <i class="fas fa-lock input-icon"></i>
                            <i class="fas fa-eye password-toggle"></i>
                        </div>
                    </div>
                    <div id="forgot-reset-error" class="error-message" style="margin-bottom: 14px; text-align: center;"></div>
                    <button type="submit" class="auth-btn">
                        <span>Reset Password</span>
                        <div class="loader"></div>
                    </button>
                </form>
                
                <!-- Success Message -->
                <div id="forgot-success-view" style="display: none; text-align: center; padding: 24px 0;">
                    <div style="font-size: 3.5rem; color: #10b981; margin-bottom: 16px; filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.35));">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3 style="color: #fff; font-size: 1.35rem; margin-bottom: 10px; font-family: 'Cinzel', serif;">Password Reset!</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.92rem; margin-bottom: 24px;">Your password has been updated successfully.</p>
                    <button class="auth-btn" id="finish-reset-btn">Login Now</button>
                </div>
            </div>
        </div>
    </div>`;
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }

    // Inject Product Detail Modal HTML if not present (Skip for About, Feedback, Contact pages)
    const currentPage = document.body.getAttribute('data-page');
    const skipPages = ['about', 'preview', 'contact', 'gallery'];

    if (!document.getElementById('product-detail-modal') && !skipPages.includes(currentPage)) {
        const productModalHTML = `
        <div class="product-modal-overlay" id="product-detail-modal">
            <div class="product-modal-card">
                <div class="pm-close">&times;</div>
                <div class="pm-left">
                    <div class="pm-image-container">
                        <img src="" alt="Product Cover" id="pm-img">
                    </div>
                    <div class="pm-main-actions">
                        <button class="pm-btn pm-btn-cart" id="pm-add-to-cart"><i class="fas fa-shopping-cart"></i> ADD TO CART</button>
                        <button class="pm-btn pm-btn-buy" id="pm-buy-now"><i class="fas fa-bolt"></i> BUY NOW</button>
                    </div>
                </div>
                <div class="pm-right">
                    <div class="pm-title-section">
                        <h2 class="pm-title" id="pm-title">EFV™ VOL 1: THE ORIGIN CODE™</h2>
                        <span class="pm-edition" id="pm-edition">Hardcover Edition</span>
                        <div class="pm-rating">
                            <span>4.8 ★</span>
                            <span style="opacity: 0.5;">2,450 Reviews</span>
                        </div>
                        <div class="pm-price-row">
                            <span class="pm-price" id="pm-price">${getCurrencySymbol()}499</span>
                            <span class="pm-mrp" id="pm-mrp">${getCurrencySymbol()}999</span>
                            <span class="pm-discount">50% off</span>
                        </div>
                        <div class="pm-savings" id="pm-savings" style="font-size: 0.85rem; color: var(--luxury-gold, #d4af37); font-weight: 700; margin-top: 5px; display: none;"></div>
                    </div>

                    <div class="pm-quantity-section" style="margin: 20px 0; padding: 15px; background: rgba(255, 211, 105, 0.05); border-radius: 10px; border: 1px solid rgba(255, 211, 105, 0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <span style="font-weight: 600; color: var(--gold-energy);" data-i18n="product_modal.select_qty">Select Quantity:</span>
                            <div class="pm-quantity-controls" style="display: flex; align-items: center; gap: 15px; background: rgba(0,0,0,0.3); padding: 5px 15px; border-radius: 20px; border: 1px solid rgba(255,211,105,0.3);">
                                <button id="pm-qty-minus" style="background:none; border:none; color:var(--gold-energy); cursor:pointer; font-size:1.2rem; padding:0 5px;"><i class="fas fa-minus"></i></button>
                                <span id="pm-qty-value" style="font-size:1.1rem; font-weight:700; min-width:20px; text-align:center;">1</span>
                                <button id="pm-qty-plus" style="background:none; border:none; color:var(--gold-energy); cursor:pointer; font-size:1.2rem; padding:0 5px;"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="opacity: 0.7; font-size: 0.9rem;" data-i18n="product_modal.subtotal">Subtotal:</span>
                            <span id="pm-subtotal" style="font-size: 1.3rem; font-weight: 800; color: var(--gold-energy);">${getCurrencySymbol()}499</span>
                        </div>
                    </div>

                    <div class="pm-collection-intro">
                        <h3 data-i18n="product_modal.collection_title">The EFV™ Collection</h3>
                        <p data-i18n="product_modal.collection_desc">Discover the transformative power of Energy, Frequency, and Vibration. Each volume in this sacred series is designed to align your consciousness with the universal code of existence.</p>
                    </div>

                    <div class="pm-accordion">
                        <div class="pm-accordion-item">
                            <button class="pm-accordion-header active" data-tab="specs">
                                <span data-i18n="product_modal.tab_specs">SPECIFICATIONS</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="pm-accordion-content active" id="tab-specs">
                                <table class="pm-specs-table" id="pm-specs-body">
                                    <!-- Dynamic rows -->
                                </table>
                            </div>
                        </div>
                        <div class="pm-accordion-item">
                            <button class="pm-accordion-header" data-tab="desc">
                                <span data-i18n="product_modal.tab_desc">DESCRIPTION</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="pm-accordion-content" id="tab-desc">
                                <p id="pm-desc-text"></p>
                            </div>
                        </div>
                        <div class="pm-accordion-item">
                            <button class="pm-accordion-header" data-tab="mfr">
                                <span data-i18n="product_modal.tab_mfr">MANUFACTURER INFO</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="pm-accordion-content" id="tab-mfr">
                                <div class="pm-mfr-list">
                                    <div class="pm-mfr-item">
                                        <span class="pm-mfr-label" data-i18n="product_modal.generic_name_label">Generic Name</span>
                                        <span class="pm-mfr-value" id="pm-generic-name">Books</span>
                                    </div>
                                    <div class="pm-mfr-item">
                                        <span class="pm-mfr-label" data-i18n="product_modal.country_origin_label">Country of Origin</span>
                                        <span class="pm-mfr-value" id="pm-origin-text">India</span>
                                    </div>
                                    <div class="pm-mfr-item">
                                        <span class="pm-mfr-label" data-i18n="product_modal.mfr_address_label">Name and address of the Manufacturer</span>
                                        <span class="pm-mfr-value" id="pm-mfr-full"></span>
                                    </div>
                                    <div class="pm-mfr-item">
                                        <span class="pm-mfr-label" data-i18n="product_modal.packer_address_label">Name and address of the Packer</span>
                                        <span class="pm-mfr-value" id="pm-packer-full"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', productModalHTML);
    }

    // User Data Isolation Helpers
    function getUserKey(baseKey) {
        const user = JSON.parse(localStorage.getItem('efv_user'));
        if (!user || !user.email) return baseKey;
        const cleanEmail = user.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `${baseKey}_${cleanEmail}`;
    }
    window.getUserKey = getUserKey;

    let cart = JSON.parse(localStorage.getItem(getUserKey('efv_cart'))) || [];


    const API_BASE = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';

    async function syncLibraryWithBackend() {
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

            if (response.ok) {
                const data = await response.json();
                const libKey = getUserKey('efv_digital_library');

                // IMPORTANT: Clear localStorage first to avoid stale data
                localStorage.removeItem(libKey);

                const localLibrary = data.map(prod => ({
                    id: (prod.productId || prod._id || '').toString(),
                    productId: (prod.productId || prod._id || '').toString(),
                    name: prod.title || prod.name,
                    title: prod.title || prod.name,
                    language: prod.language || '',
                    subtitle: prod.subtitle || '',
                    type: prod.type,
                    thumbnail: prod.thumbnail,
                    filePath: prod.filePath,
                    date: prod.purchasedAt ? new Date(prod.purchasedAt).toLocaleDateString() : new Date().toLocaleDateString()
                }));

                if (Array.isArray(localLibrary)) {
                    localStorage.setItem(libKey, JSON.stringify(localLibrary));
                }

                if (typeof showToast === 'function') {
                    showToast('✅ Library Synced! Latest versions are now available.', 'success');
                }

                if (typeof updateLibraryDisplay === 'function') updateLibraryDisplay();
                if (typeof updateMarketplaceButtons === 'function') updateMarketplaceButtons();
            } else {
                if (typeof showToast === 'function') {
                    showToast('Failed to sync library.', 'error');
                }
            }
        } catch (error) {
            console.error('Library sync error:', error);
            if (typeof showToast === 'function') {
                showToast('Network error during library sync.', 'error');
            }
        }
    }
    window.syncLibraryWithBackend = syncLibraryWithBackend;

    // Update Marketplace buttons to reflect library state
    function updateMarketplaceButtons() {
        const libKey = getUserKey('efv_digital_library');
        const library = JSON.parse(localStorage.getItem(libKey)) || [];

        document.querySelectorAll('.product-card').forEach(card => {
            const id = (card.getAttribute('data-id') || '').toLowerCase();
            const btn = card.querySelector('.add-to-cart');
            const isEnglish = id.includes('english') || id.includes('_en');
            const isAudio = id.includes('audio');

            // Volume 1 is LIVE. Only Vol 2 is "Coming Soon".
            // Rule: English Audio remains "Coming Soon". Hindi Audio for Vol 1 is LIVE.
            let comingSoon = id.includes('v2') && !id.includes('v1');
            if (isAudio && (isEnglish || id.includes('v2'))) {
                comingSoon = true;
            }
            if (btn && comingSoon) {
                btn.textContent = typeof window.t === 'function' ? window.t('marketplace_page.coming_soon', 'Coming Soon') : 'Coming Soon';
                btn.style.background = 'rgba(255, 211, 105, 0.1)';
                btn.style.color = 'rgba(255, 211, 105, 0.5)';
                btn.style.border = '1px solid rgba(255, 211, 105, 0.2)';
                btn.style.opacity = '0.7';
                btn.style.cursor = 'not-allowed';
                btn.disabled = true;
            } else if (btn) {
                // Restore standard button if not in coming soon
                btn.textContent = typeof window.t === 'function' ? window.t('product_modal.add_to_cart', 'Add to Cart') : 'Add to Cart';
                btn.style.background = ''; // Use CSS default
                btn.style.color = '';
                btn.style.border = '';
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
            }
        });
    }
    window.updateMarketplaceButtons = updateMarketplaceButtons;
    // Select via ID (if updated) or Class for standard items
    const cartToggle = document.getElementById('cart-toggle') || document.querySelector('.cart-icon');
    const cartPanel = document.getElementById('cart-panel');
    const cartBackdrop = document.querySelector('.cart-backdrop');
    const closeCart = document.querySelector('.close-cart');
    const cartCount = document.getElementById('cart-count');
    const cartContainer = document.getElementById('cart-items-container');
    const cartTotalDisplay = document.getElementById('cart-total-price');

    let activeDiscountRules = [];
    let activeOffers = [];
    let allDbProducts = [];
    let ordersCount = 0;

    async function fetchDiscountRulesAndProducts() {
        try {
            const rulesRes = await fetch(`${API_BASE}/api/categories`);
            const rules = await rulesRes.json();
            activeDiscountRules = Array.isArray(rules) ? rules.filter(c => c.isActive !== false) : [];

            const offersRes = await fetch(`${API_BASE}/api/offers`);
            const offers = await offersRes.json();
            activeOffers = Array.isArray(offers) ? offers.filter(o => o.isActive !== false) : [];

            const prodRes = await fetch(`${API_BASE}/api/products`);
            const prodData = await prodRes.json();
            allDbProducts = Array.isArray(prodData) ? prodData : [];

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

            // After fetching, update UI to reflect discounts!
            updateCartUI();
        } catch (e) {
            console.error("Failed to load discount rules or products in cart:", e);
        }
    }

    function getPriceForCurrency(item) {
        const dbProd = allDbProducts.find(p => String(p._id || p.id) === String(item.id || item.productId));
        if (dbProd) {
            const selectedCountry = localStorage.getItem('efv_selected_country') || 'IN';
            const COUNTRY_KEYS = {
                'IN': 'India', 'US': 'UnitedStates', 'GB': 'UnitedKingdom', 'DE': 'Germany', 'FR': 'France', 'ES': 'Spain',
                'IT': 'Italy', 'PT': 'Portugal', 'AE': 'UnitedArabEmirates', 'SA': 'SaudiArabia', 'CN': 'China', 'JP': 'Japan', 'RU': 'Russia', 'KR': 'SouthKorea'
            };
            const countryKey = COUNTRY_KEYS[selectedCountry];

            if (countryKey && dbProd.countryPricing && dbProd.countryPricing[countryKey]) {
                const cp = dbProd.countryPricing[countryKey];
                if (cp.enabled !== false && cp.price !== undefined && cp.price !== null && cp.price !== '') {
                    return Number(cp.price);
                }
            }

            // If countryPricing not found, fallback to regionalPrices or global price
            if (dbProd.regionalPrices && dbProd.regionalPrices[selectedCountry]) {
                return Number(dbProd.regionalPrices[selectedCountry]);
            }
            return Number(dbProd.price || 0);
        }
        return Number(item.price || 0);
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

    function updateCartUI() {
        // Update Count
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        if (cartCount) cartCount.textContent = totalItems;

        // Update List
        if (cart.length === 0) {
            cartContainer.innerHTML = `<p style="text-align: center; margin-top: 50px; opacity: 0.5;" data-i18n="cart.empty">${typeof window.t === 'function' ? window.t('cart.empty', 'Your cart is empty.') : 'Your cart is empty.'}</p>`;
            cartTotalDisplay.textContent = `${getCurrencySymbol()}0.00`;
        } else {
            cartContainer.innerHTML = cart.map(item => {
                const localizedPrice = getPriceForCurrency(item);
                return `
                <div class="cart-item">
                    <div class="cart-item-info" style="flex: 1;">
                        <h4 style="margin-bottom: 5px;">${item.name}</h4>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="gold-text">${getCurrencySymbol()}${localizedPrice} x ${item.quantity}</span>
                            <button class="remove-item" data-id="${item.id}" 
                                style="background: none; border: none; color: #ff6b6b; cursor: pointer; padding: 0; font-size: 0.9rem; display: flex; align-items: center;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `}).join('');

            // Calculate dynamic discounts (bundle, BOGO)
            const dynamicResults = typeof calculateDynamicDiscounts === 'function'
                ? calculateDynamicDiscounts(cart)
                : { totalDiscountAmount: 0, discountSummary: [] };
            const dynamicDiscountAmt = dynamicResults.totalDiscountAmount;

            const total = cart.reduce((acc, item) => acc + (getPriceForCurrency(item) * item.quantity), 0);
            const finalTotal = Math.max(0, total - dynamicDiscountAmt);
            cartTotalDisplay.textContent = `${getCurrencySymbol()}${finalTotal.toFixed(2)}`;

            const discContainer = document.getElementById('cart-discounts-container');
            if (discContainer) {
                if (dynamicResults.discountSummary && dynamicResults.discountSummary.length > 0) {
                    discContainer.innerHTML = dynamicResults.discountSummary.map(ds =>
                        `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Offer: ${ds.name}</span>
                            <span>-${getCurrencySymbol()}${ds.amount.toFixed(2)}</span>
                         </div>`
                    ).join('');
                    discContainer.style.display = 'flex';
                } else {
                    discContainer.style.display = 'none';
                    discContainer.innerHTML = '';
                }
            }
        }

        // --- AUTH STATE UI UPDATES ---
        const user = JSON.parse(localStorage.getItem('efv_user'));
        const authOptions = document.querySelector('.auth-options');
        const checkoutBtn = document.getElementById('checkout-btn');
        const userProfileView = document.getElementById('user-profile-view');

        if (user) {
            if (authOptions) authOptions.style.display = 'none';
            if (checkoutBtn) checkoutBtn.style.display = 'block';

            // Show Profile View in side-cart
            if (userProfileView) {
                userProfileView.style.display = 'block';
                const nameDisplay = userProfileView.querySelector('h3');
                const emailDisplay = userProfileView.querySelector('p');
                if (nameDisplay) nameDisplay.textContent = user.name;
                if (emailDisplay) emailDisplay.textContent = user.email;
            }
        } else {
            if (authOptions) authOptions.style.display = 'flex';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            if (userProfileView) userProfileView.style.display = 'none';
        }
        localStorage.setItem(getUserKey('efv_cart'), JSON.stringify(cart));

        // Add Remove listeners
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                cart = cart.filter(item => item.id !== id);
                updateCartUI();
            });
        });
    }

    // Open Product Modal
    window.openProductModal = function openProductModal(productId, card) {
        const modal = document.getElementById('product-detail-modal');

        // Priority 1: Live product from API (populated by marketplace-dynamic.js)
        // Priority 2: Static product metadata from productsData.js
        // Priority 3: Card DOM attributes as final fallback
        const liveProduct = (window.EFV_LIVE_PRODUCTS || {})[productId];
        const staticData = (window.EFV_Products || {})[productId];

        // Merge: live product wins over static, static fills in any gaps
        const merged = { ...(staticData || {}), ...(liveProduct || {}) };

        const data = Object.keys(merged).length > 0 ? merged : {
            title: card ? card.getAttribute('data-name') : 'Book Title',
            subtitle: card ? (card.getAttribute('data-subtitle') || 'Special Edition') : 'Special Edition',
            description: card ? (card.querySelector('p')?.textContent || 'Premium EFV volume content.') : 'Premium EFV volume content.',
            specs: { 'Product Form': 'Book' },
            countryOfOrigin: 'India'
        };

        // Determine Coming Soon and Out of Stock Statuses early
        let comingSoon = false;
        let outOfStock = false;

        if (data.availability) {
            const status = data.availability.toLowerCase().replace(/\s+/g, '');
            if (status === 'comingsoon') {
                comingSoon = true;
            } else if (status === 'outofstock' || status === 'unavailable') {
                outOfStock = true;
            }
        } else {
            const type = (data.type || (card && card.getAttribute('data-type')) || 'hardcover').toLowerCase();
            const lang = (data.language || (card && card.getAttribute('data-language')) || '').toLowerCase();
            const volumeStr = (data.volume || (card && card.getAttribute('data-volume')) || '').toString();
            const productRefId = (productId || '').toLowerCase();

            const isVol2 = volumeStr === '2' || productRefId.includes('v2');
            const isEnglish = lang.includes('english') || productRefId.includes('_en');

            comingSoon = isVol2;
            if (type === 'audiobook') {
                comingSoon = isEnglish || isVol2;
            } else if (type === 'ebook' && !isVol2) {
                comingSoon = false;
            }

            if (data.stock !== undefined && data.stock !== null && data.stock !== "") {
                outOfStock = Number(data.stock) <= 0;
            }
        }

        // Populate Image
        const img = card ? card.querySelector('img').src : ((CONFIG.BASE_PATH || '../') + 'assets/images/vol1-cover.png');
        document.getElementById('pm-img').src = img;

        // Spec Label Localizer Helper
        function translateSpecLabel(label) {
            if (typeof window.t !== 'function') return label;
            const labelLower = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const possibleKey = `product_modal.spec_${labelLower}`;
            const translated = window.t(possibleKey);
            if (translated && translated !== possibleKey) {
                return translated;
            }
            if (label === 'Product Form') return window.t('product_modal.spec_product_form');
            if (label === 'ISBN') return window.t('product_modal.spec_isbn');
            if (label === 'ISBN-13') return window.t('product_modal.spec_isbn_13');
            if (label === 'Dimensions') return window.t('product_modal.spec_dimensions');
            if (label === 'Weight') return window.t('product_modal.spec_weight');
            if (label === 'Pages') return window.t('product_modal.spec_pages');
            if (label === 'Language') return window.t('product_modal.spec_language');
            if (label === 'Type') return window.t('product_modal.spec_type');
            if (label === 'Volume') return window.t('product_modal.spec_volume');
            if (label === 'Stock Status') return window.t('product_modal.spec_stock_status');
            if (label === 'Generic Name') return window.t('product_modal.spec_generic_name');
            return label;
        }

        // Spec Value Localizer Helper
        function translateSpecValue(val) {
            if (typeof val !== 'string') return val;
            if (typeof window.t !== 'function') return val;
            const valueLower = val.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const possibleKey = `product_modal.value_${valueLower}`;
            const translated = window.t(possibleKey);
            if (translated && translated !== possibleKey) {
                return translated;
            }
            if (val === 'Hardcover') return window.t('product_modal.value_hardcover');
            if (val === 'Paperback') return window.t('product_modal.value_paperback');
            if (val === 'Audiobook') return window.t('product_modal.value_audiobook');
            if (val === 'E-Book' || val === 'Ebook') return window.t('product_modal.value_ebook');
            if (val === 'Hindi') return window.t('product_modal.value_hindi');
            if (val === 'English') return window.t('product_modal.value_english');
            if (val === 'In Stock') return window.t('product_modal.value_instock');
            if (val === 'Out of Stock') return window.t('product_modal.value_outofstock');
            if (val === 'Coming Soon') return window.t('product_modal.value_comingsoon');
            if (val === 'India') return window.t('product_modal.value_india', 'India');
            return val;
        }

        // Populate Text
        document.getElementById('pm-title').textContent = typeof window.t === 'function' ? window.t('products.' + productId + '.title', data.title) : data.title;

        let editionText = data.subtitle || data.edition || 'Special Edition';
        if (typeof window.t === 'function') {
            if (editionText === 'Hardcover Edition') {
                editionText = `${window.t('marketplace_page.filter_hardcover')} ${window.t('marketplace_page.edition_suffix')}`;
            } else if (editionText === 'Paperback Edition') {
                editionText = `${window.t('marketplace_page.filter_paperback')} ${window.t('marketplace_page.edition_suffix')}`;
            } else if (editionText === 'Audiobook Edition') {
                editionText = `${window.t('marketplace_page.filter_audiobook')} ${window.t('marketplace_page.edition_suffix')}`;
            } else if (editionText === 'E-Book Edition' || editionText === 'Ebook Edition') {
                editionText = `${window.t('marketplace_page.filter_ebook')} ${window.t('marketplace_page.edition_suffix')}`;
            }
        }
        document.getElementById('pm-edition').textContent = editionText;

        const activeCurrency = getCurrencySymbol();
        const displayPrice = card ? parseFloat(card.getAttribute('data-price')) : (data.price || 0);
        document.getElementById('pm-price').textContent = `${activeCurrency}${displayPrice}`;

        const selectedCountry = localStorage.getItem('efv_selected_country') || 'IN';
        let originalPriceVal = data.originalPrice;
        if (selectedCountry !== 'IN' && data.price > 0 && data.originalPrice) {
            originalPriceVal = (data.originalPrice * displayPrice) / data.price;
            originalPriceVal = Math.round(originalPriceVal * 100) / 100;
        }

        const mrpElement = document.getElementById('pm-mrp');
        if (mrpElement) {
            if (originalPriceVal && originalPriceVal > displayPrice) {
                mrpElement.textContent = `${activeCurrency}${originalPriceVal}`;
                mrpElement.style.display = 'inline-block';
            } else {
                mrpElement.style.display = 'none';
            }
        }

        const discountBadge = modal.querySelector('.pm-discount');
        if (discountBadge) {
            if (originalPriceVal && originalPriceVal > displayPrice) {
                const disc = data.discount || Math.round(((originalPriceVal - displayPrice) / originalPriceVal) * 100);
                if (disc > 0) {
                    discountBadge.textContent = data.offerBadge || `${disc}% off`;
                    discountBadge.style.display = 'inline-block';
                } else {
                    discountBadge.style.display = 'none';
                }
            } else {
                discountBadge.style.display = 'none';
            }
        }

        const savingsElement = document.getElementById('pm-savings');
        if (savingsElement) {
            const savingsVal = data.savingsAmount || (originalPriceVal && originalPriceVal > displayPrice ? Math.max(0, originalPriceVal - displayPrice) : 0);
            if (savingsVal > 0) {
                savingsElement.textContent = `You Save ${activeCurrency}${Math.round(savingsVal)}`;
                savingsElement.style.display = 'block';
            } else {
                savingsElement.style.display = 'none';
            }
        }

        const ratingContainer = modal.querySelector('.pm-rating');
        if (ratingContainer) {
            const ratingVal = data.rating || 5.0;
            const reviewCountVal = data.reviewCount !== undefined ? data.reviewCount : 2450;
            ratingContainer.innerHTML = `<span>${ratingVal} ★</span> <span style="opacity: 0.5;">(${reviewCountVal} Reviews)</span>`;
        }

        document.getElementById('pm-desc-text').textContent = typeof window.t === 'function' ? window.t('products.' + productId + '.description', window.t('products.' + productId + '.desc', data.description)) : data.description;

        // Reset Quantity and Subtotal
        const qtyValue = document.getElementById('pm-qty-value');
        const subtotal = document.getElementById('pm-subtotal');
        if (qtyValue) qtyValue.textContent = '1';
        if (subtotal) subtotal.textContent = `${activeCurrency}${displayPrice}`;

        // Populate Mfr Info detailed
        document.getElementById('pm-generic-name').textContent = translateSpecValue(data.genericName || "Books");
        document.getElementById('pm-origin-text').textContent = translateSpecValue(data.countryOfOrigin || "India");
        document.getElementById('pm-mfr-full').textContent = `${data.mfrName || ''}, ${data.mfrAddress || ''}`;
        document.getElementById('pm-packer-full').textContent = `${data.packerName || ''}, ${data.packerAddress || ''}`;

        // Populate Specs
        const specsBody = document.getElementById('pm-specs-body');
        const specs = {};
        if (data.specs) {
            Object.assign(specs, data.specs);
        }
        if (data.isbn) specs["ISBN"] = data.isbn;
        if (data.dimensions) specs["Dimensions"] = data.dimensions;
        if (data.language) specs["Language"] = data.language;
        if (data.type) specs["Type"] = data.type;
        if (data.volume) specs["Volume"] = data.volume;

        // Stock status mapping using early calculated flags
        if (comingSoon) {
            specs["Stock Status"] = "Coming Soon";
        } else if (outOfStock) {
            specs["Stock Status"] = "Out of Stock";
        } else {
            specs["Stock Status"] = "In Stock";
        }

        if (data.additionalSpecs) {
            if (typeof data.additionalSpecs === 'object') {
                Object.assign(specs, data.additionalSpecs);
            } else if (typeof data.additionalSpecs === 'string') {
                try {
                    const parsed = JSON.parse(data.additionalSpecs);
                    if (typeof parsed === 'object') Object.assign(specs, parsed);
                } catch (e) {
                    data.additionalSpecs.split('\n').forEach(line => {
                        const pts = line.split(':');
                        if (pts.length >= 2) {
                            specs[pts[0].trim()] = pts.slice(1).join(':').trim();
                        }
                    });
                }
            }
        }

        specsBody.innerHTML = Object.entries(specs).map(([label, value]) => `
            <tr>
                <td class="pm-spec-label">${translateSpecLabel(label)}</td>
                <td class="pm-spec-value">${translateSpecValue(value)}</td>
            </tr>
        `).join('') + `
            <tr>
                <td class="pm-spec-label">${translateSpecLabel('Generic Name')}</td>
                <td class="pm-spec-value">${translateSpecValue(data.genericName || 'Books')}</td>
            </tr>
        `;

        // Store current product ID on buttons
        const addBtn = document.getElementById('pm-add-to-cart');
        const buyBtn = document.getElementById('pm-buy-now');

        if (addBtn && buyBtn) {
            addBtn.setAttribute('data-target-id', productId);
            buyBtn.setAttribute('data-target-id', productId);

            if (comingSoon) {
                addBtn.innerHTML = `<i class="fas fa-clock"></i> ${typeof window.t === 'function' ? window.t('marketplace_page.coming_soon', 'COMING SOON') : 'COMING SOON'}`;
                addBtn.disabled = true;
                addBtn.style.opacity = '0.5';
                addBtn.style.cursor = 'not-allowed';
                addBtn.style.pointerEvents = 'none';

                buyBtn.innerHTML = `<i class="fas fa-lock"></i> ${typeof window.t === 'function' ? window.t('marketplace_page.coming_soon', 'COMING SOON') : 'COMING SOON'}`;
                buyBtn.disabled = true;
                buyBtn.style.opacity = '0.5';
                buyBtn.style.cursor = 'not-allowed';
                buyBtn.style.pointerEvents = 'none';
            } else if (outOfStock) {
                addBtn.innerHTML = `<i class="fas fa-ban"></i> ${typeof window.t === 'function' ? window.t('marketplace_page.out_of_stock', 'OUT OF STOCK') : 'OUT OF STOCK'}`;
                addBtn.disabled = true;
                addBtn.style.opacity = '0.5';
                addBtn.style.cursor = 'not-allowed';
                addBtn.style.pointerEvents = 'none';

                buyBtn.innerHTML = `<i class="fas fa-ban"></i> ${typeof window.t === 'function' ? window.t('marketplace_page.out_of_stock', 'OUT OF STOCK') : 'OUT OF STOCK'}`;
                buyBtn.disabled = true;
                buyBtn.style.opacity = '0.5';
                buyBtn.style.cursor = 'not-allowed';
                buyBtn.style.pointerEvents = 'none';
            } else {
                addBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> ${typeof window.t === 'function' ? window.t('product_modal.add_to_cart', 'ADD TO CART') : 'ADD TO CART'}`;
                addBtn.disabled = false;
                addBtn.style.opacity = '1';
                addBtn.style.cursor = 'pointer';
                addBtn.style.pointerEvents = 'auto';

                buyBtn.innerHTML = `<i class="fas fa-bolt"></i> ${typeof window.t === 'function' ? window.t('product_modal.buy_now', 'BUY NOW') : 'BUY NOW'}`;
                buyBtn.disabled = false;
                buyBtn.style.opacity = '1';
                buyBtn.style.cursor = 'pointer';
                buyBtn.style.pointerEvents = 'auto';
            }
        }

        // Reset Accordion
        document.querySelectorAll('.pm-accordion-header').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.pm-accordion-content').forEach(c => c.classList.remove('active'));
        const defaultHeader = document.querySelector('.pm-accordion-header[data-tab="specs"]');
        const defaultContent = document.getElementById('tab-specs');
        if (defaultHeader) defaultHeader.classList.add('active');
        if (defaultContent) defaultContent.classList.add('active');

        // Show Modal
        modal.classList.add('active');
        document.body.classList.add('modal-open');

        // NUCLEAR RESET: Clear all filters globally
        document.documentElement.style.filter = 'none';
        document.body.style.filter = 'none';

        const forceClear = () => {
            const card = document.querySelector('.product-modal-card');
            const overlay = document.querySelector('.product-modal-overlay');
            if (card) {
                card.style.setProperty('filter', 'none', 'important');
                card.style.setProperty('backdrop-filter', 'none', 'important');
            }
            if (overlay) {
                overlay.style.setProperty('backdrop-filter', 'none', 'important');
            }
        };

        // Run immediately and after short delays to catch transition end
        forceClear();
        setTimeout(forceClear, 50);
        setTimeout(forceClear, 300);
        setTimeout(forceClear, 600);

        // Multi-Action Delegation (Tabs + Buttons)
        if (modal && !modal.hasAttribute('data-listeners-init')) {
            modal.addEventListener('click', (e) => {
                // 1. Accordion Toggling
                const accordionHeader = e.target.closest('.pm-accordion-header');
                if (accordionHeader) {
                    const tabId = accordionHeader.getAttribute('data-tab');
                    const isActive = accordionHeader.classList.contains('active');

                    // Autoclose others
                    modal.querySelectorAll('.pm-accordion-header').forEach(b => b.classList.remove('active'));
                    modal.querySelectorAll('.pm-accordion-content').forEach(c => c.classList.remove('active'));

                    // Toggle current (if it wasn't active, open it)
                    if (!isActive) {
                        accordionHeader.classList.add('active');
                        const content = modal.querySelector(`#tab-${tabId}`);
                        if (content) content.classList.add('active');
                    }
                    return;
                }

                // 2. Add to Cart (Internal)
                const actionBtn = e.target.closest('#pm-add-to-cart');
                if (actionBtn) {
                    const id = actionBtn.getAttribute('data-target-id');
                    const card = document.querySelector(`.product-card[data-id="${id}"]`);
                    const qty = parseInt(document.getElementById('pm-qty-value')?.textContent) || 1;
                    if (card) {
                        processAddToCart(id, card, false, qty);
                        modal.classList.remove('active');
                        document.body.classList.remove('modal-open');
                    }
                    return;
                }

                // 3. Buy Now (Internal)
                const buyBtnAction = e.target.closest('#pm-buy-now');
                if (buyBtnAction) {
                    const id = buyBtnAction.getAttribute('data-target-id');
                    const card = document.querySelector(`.product-card[data-id="${id}"]`);
                    const qty = parseInt(document.getElementById('pm-qty-value')?.textContent) || 1;
                    if (card) {
                        showTermsAndConditions(() => {
                            const name = card.getAttribute('data-name');
                            const price = parseFloat(card.getAttribute('data-price'));
                            const item = {
                                id,
                                name,
                                price,
                                quantity: qty,
                                language: card.getAttribute('data-language') || '',
                                subtitle: card.getAttribute('data-subtitle') || '',
                                type: (card.getAttribute('data-type') || 'PHYSICAL').toUpperCase()
                            };

                            modal.classList.remove('active');
                            document.body.classList.remove('modal-open');
                            // Directly checkout with ONLY this item
                            checkoutOrder([item]);
                        });
                    }
                    return;
                }

                // New logic: Quantity Controls
                const minusBtn = e.target.closest('#pm-qty-minus');
                const plusBtn = e.target.closest('#pm-qty-plus');

                if (minusBtn || plusBtn) {
                    const qtyElem = document.getElementById('pm-qty-value');
                    const subtotalElem = document.getElementById('pm-subtotal');
                    const symbol = getCurrencySymbol();
                    const price = parseFloat(document.getElementById('pm-price').textContent.replace(symbol, '')) || 0;
                    let currentQty = parseInt(qtyElem.textContent) || 1;

                    if (minusBtn && currentQty > 1) currentQty--;
                    if (plusBtn) currentQty++;

                    qtyElem.textContent = currentQty;
                    subtotalElem.textContent = `${symbol}${(price * currentQty).toFixed(2)}`;
                    return;
                }

                // 4. Close Modal
                const closeBtn = e.target.closest('.pm-close') || e.target === modal;
                if (closeBtn) {
                    modal.classList.remove('active');
                    document.body.classList.remove('modal-open');
                    return;
                }
            });
            modal.setAttribute('data-listeners-init', 'true');
        }
    }

    // --- Terms & Conditions Logic ---
    window.showTermsAndConditions = function showTermsAndConditions(onAccept) {
        let tcOverlay = document.getElementById('tc-modal');
        if (tcOverlay) {
            const tcBody = tcOverlay.querySelector('.tc-content');
            if (tcBody && (tcBody.innerHTML.includes('support@efv.com') || tcBody.innerHTML.includes('admin@uwo24.com'))) {
                tcBody.innerHTML = tcBody.innerHTML.replace(/support@efv\.com/g, 'efv@uwo24.com').replace(/admin@uwo24\.com/g, 'efv@uwo24.com');
            }
        }
        if (!tcOverlay) {
            const tcHTML = `
            <div class="tc-modal-overlay" id="tc-modal">
                <div class="tc-card">
                    <div class="tc-close">&times;</div>
                    <h2 class="tc-title"><i class="fas fa-file-contract" style="margin-right:15px;"></i><span data-i18n="footer.terms">Terms & Conditions</span></h2>
                    <div class="tc-content">
                        <p style="text-align:center; font-style:italic; border-bottom:1px solid var(--glass-border); padding-bottom:15px; margin-bottom:20px;">Last Updated: 13/02/2026</p>
                        
                        <p>Welcome to EFV. By purchasing “EFV” (Energy–Frequency–Vibration) book from our website, you agree to the following terms:</p>

                        <strong>1. Product Information</strong>
                        <p>We sell physical copies (Hardcover / Paperback) and digital formats (E-book / Audiobook) of EFV.</p>

                        <strong>2. Pricing & Payments</strong>
                        <p>• All prices are listed in your selected region's currency.<br>• Payments are processed securely via Cashfree.<br>• We reserve the right to change prices.</p>

                        <strong>3. Order Confirmation</strong>
                        <p>• You will receive an email confirmation after successful payment.<br>• Orders are processed within 2-3 working days.</p>

                        <strong>4. Shipping & Delivery (For Physical Books)</strong>
                        <p>• Delivery timelines: Depends on delivery location.<br>• Delays due to courier or external factors may happen.<br>• Incorrect shipping details provided by the customer are the customer’s responsibility.</p>

                        <strong>5. Refund & Cancellation</strong>
                        <p>• Physical books: Refunds allowed only if product is damaged on delivery, opening video required. (proof required within 48 hours).<br>• Digital products (E-book / Audiobook): Non-refundable once delivered.<br>• Refund processing time: 5–7 business days.</p>

                        <strong>6. Intellectual Property</strong>
                        <p>All content of EFV is protected by copyright. Unauthorized reproduction, distribution, or sharing (especially digital formats) is strictly prohibited.</p>

                        <strong>7. Governing Law</strong>
                        <p>These terms are governed by the laws of India.</p>

                        <strong>8. Contact Information</strong>
                        <p>For support or queries:<br>
                        Email: efv@uwo24.com<br>
                        Company Name: Unified Web Options and Services Private Limited<br>
                        Project: EFV- Energy Frequency Vibration</p>
                    </div>
                    <div class="tc-footer">
                        <label class="tc-checkbox-container">
                            <input type="checkbox" id="tc-accept-check">
                            <span class="tc-checkmark"></span>
                            <span data-i18n="checkout_page.agree_terms">I agree to the Terms & Conditions</span>
                        </label>
                        <button class="tc-btn" id="tc-proceed-btn" disabled data-i18n="checkout_page.proceed_payment">PROCEED TO PAYMENT</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', tcHTML);
            tcOverlay = document.getElementById('tc-modal');
        }

        const checkbox = tcOverlay.querySelector('#tc-accept-check');
        const proceedBtn = tcOverlay.querySelector('#tc-proceed-btn');
        const closeBtn = tcOverlay.querySelector('.tc-close');

        checkbox.checked = false;
        proceedBtn.disabled = true;

        tcOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        const handleCheck = () => {
            proceedBtn.disabled = !checkbox.checked;
        };

        const handleProceed = () => {
            tcOverlay.classList.remove('active');
            document.body.style.overflow = '';
            proceedBtn.removeEventListener('click', handleProceed);
            checkbox.removeEventListener('change', handleCheck);
            if (onAccept) onAccept();
        };

        const handleClose = () => {
            tcOverlay.classList.remove('active');
            document.body.style.overflow = '';
            proceedBtn.removeEventListener('click', handleProceed);
            checkbox.removeEventListener('change', handleCheck);
        };

        checkbox.addEventListener('change', handleCheck);
        proceedBtn.addEventListener('click', handleProceed);
        closeBtn.addEventListener('click', handleClose);
    }

    // --- QR Payment Modal Logic ---


    // Helper for actual cart addition logic
    async function processAddToCart(id, card, triggerModal = true, customQty = 1, directCheckout = false) {
        if (triggerModal) {
            openProductModal(id, card);
            return;
        }

        const name = card.getAttribute('data-name');
        const price = parseFloat(card.getAttribute('data-price'));
        const language = card.getAttribute('data-language') || '';
        const subtitle = card.getAttribute('data-subtitle') || '';
        const isDigitalProduct = id.includes('audio') || id.includes('ebook');

        const quantityToAdd = parseInt(customQty) || 1;

        // Standard Cart Flow for all products (Physical & Digital)
        const type = (card.getAttribute('data-type') || 'PHYSICAL').toUpperCase();
        const existing = cart.find(item => item.id === id);

        if (existing) {
            if (!isDigitalProduct) {
                existing.quantity += quantityToAdd;
            } else {
                showToast(`"${name}" is already in your cart!`, "info");
                // toggleCart(true); // Line removed
                return;
            }
        } else {
            // Check if already in library (for digital)
            if (isDigitalProduct) {
                const libKey = getUserKey('efv_digital_library');
                const library = JSON.parse(localStorage.getItem(libKey)) || [];
                if (library.some(item => item.id === id || item.productId === id)) {
                    if (confirm(`You already own "${name}".\n\nGo to Library?`)) {
                        document.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html?tab=library';
                    }
                    return;
                }
            }
            cart.push({ id, name, price, quantity: isDigitalProduct ? 1 : quantityToAdd, type: type });
        }

        localStorage.setItem(getUserKey('efv_cart'), JSON.stringify(cart));
        updateCartUI();

        // Feed feedback
        showToast(`"${name}" added to your cart!`, "success");

        // Keep cart closed as requested, only show toast
        toggleUserProfile(false);
        // toggleCart(true); // Line removed to prevent auto-opening
    }

    // Outer Global Delegation Listener
    document.addEventListener('click', (e) => {
        // 1. VIEW INFO
        const viewBtn = e.target.closest('.view-info');
        if (viewBtn) {
            const card = viewBtn.closest('.product-card');
            const id = card.getAttribute('data-id');
            if (typeof window.openProductModal === 'function') {
                window.openProductModal(id, card);
            }
            return;
        }

        // 2. BUY NOW (From marketplace card)
        const buyBtn = e.target.closest('.buy-now');
        if (buyBtn && !buyBtn.classList.contains('pm-btn')) {
            const card = buyBtn.closest('.product-card');
            const id = card.getAttribute('data-id');

            if (typeof showTermsAndConditions === 'function') {
                showTermsAndConditions(() => {
                    const name = card.getAttribute('data-name');
                    const price = parseFloat(card.getAttribute('data-price'));
                    const item = {
                        id,
                        name,
                        price,
                        quantity: 1,
                        language: card.getAttribute('data-language') || '',
                        subtitle: card.getAttribute('data-subtitle') || '',
                        type: (card.getAttribute('data-type') || 'PHYSICAL').toUpperCase()
                    };

                    if (typeof checkoutOrder === 'function') {
                        checkoutOrder([item]);
                    } else {
                        console.error("checkoutOrder function not found");
                        window.location.href = `checkout.html?directCheckout=${encodeURIComponent(JSON.stringify(item))}`;
                    }
                });
            }
            return;
        }

        // 3. LEGACY ADD TO CART (if any left)
        const addBtn = e.target.closest('.add-to-cart');
        if (addBtn && !addBtn.classList.contains('pm-btn')) {
            const card = addBtn.closest('.product-card');
            if (card) {
                const id = card.getAttribute('data-id');
                processAddToCart(id, card, false, 1);
            }
        }
    });

    function toggleCart(show) {
        if (show) {
            cartPanel.classList.add('active');
            if (cartBackdrop) cartBackdrop.classList.add('active');
            document.body.classList.add('modal-open');
        } else {
            cartPanel.classList.remove('active');
            if (cartBackdrop) cartBackdrop.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    // Panel Toggle
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();

            // Check if user is logged in
            const user = JSON.parse(localStorage.getItem('efv_user'));
            if (user) {
                // Redirect to Dashboard
                window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html';
                return;
            }

            const isActive = cartPanel.classList.contains('active');
            toggleCart(!isActive);
        });
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => toggleCart(false));
    }

    if (cartBackdrop) {
        cartBackdrop.addEventListener('click', () => toggleCart(false));
    }

    // Auth Logic
    const checkoutBtn = document.getElementById('checkout-btn');
    const loginBtn = document.getElementById('cart-login-btn');
    const signupBtn = document.getElementById('cart-signup-btn');
    const authModal = document.getElementById('auth-modal');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Views
    const cartTotalSection = document.querySelector('.cart-total');
    const cartItemsSection = document.getElementById('cart-items-container');
    const userProfileView = document.getElementById('user-profile-view');

    // Unified Auth Modal Controller
    function openAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        if (!modal) {
            console.warn("Auth modal not found in DOM.");
            return;
        }

        // Hide cart panel if open
        if (typeof toggleCart === 'function') toggleCart(false);

        modal.classList.add('active');
        document.body.classList.add('modal-open');
        switchTab(mode);
    }
    window.openAuthModal = openAuthModal;

    function switchTab(mode) {
        // Reset forgot password state when switching tabs
        const modal = document.getElementById('auth-modal');
        if (modal) modal.classList.remove('mode-forgot');
        const forgotFlow = document.getElementById('forgot-password-flow');
        if (forgotFlow) forgotFlow.style.display = 'none';
        const ssoSection = document.getElementById('auth-sso-section');
        if (ssoSection) ssoSection.style.display = 'block';
        document.querySelectorAll('#auth-sso-section, .auth-separator, #uwo-sso-login-btn, #google-login-container').forEach(el => {
            if (el) el.style.display = '';
        });
        const mainTitle = document.querySelector('.auth-premium-title');
        if (mainTitle) mainTitle.style.display = 'block';
        const authTabs = document.querySelector('.auth-premium-tabs');
        if (authTabs) authTabs.style.display = 'flex';

        // Update tab styling
        document.querySelectorAll('.auth-tab-item').forEach(t => {
            t.classList.toggle('active', t.dataset.authTab === mode);
        });

        // Update form visibility
        document.querySelectorAll('.auth-premium-form').forEach(f => {
            f.classList.remove('active');
            f.style.display = 'none';
        });

        const activeForm = document.getElementById(`${mode}-form`);
        if (activeForm) {
            activeForm.classList.add('active');
            activeForm.style.display = 'flex';
        }

        if (mode === 'login' && typeof checkAndApplyLoginLockout === 'function') {
            checkAndApplyLoginLockout();
        }
    }
    window.switchTab = switchTab;




    // Update Library Display Helper
    function updateLibraryDisplay(playingName = null) {
        const libraryList = document.getElementById('my-library-list');
        if (!libraryList) return;

        const libKey = getUserKey('efv_digital_library');
        const library = JSON.parse(localStorage.getItem(libKey)) || [];
        if (library.length > 0) {
            libraryList.innerHTML = library.map(item => {
                const isPlaying = item.name === playingName;
                const isPaused = isPlaying && currentAudio && currentAudio.paused;

                const isAudio = item.type === 'Audiobook';
                const progressInfo = (item.type === 'E-book' && item.progress) ?
                    `<span style="margin-left: 10px; padding: 2px 6px; background: rgba(255,211,105,0.2); border-radius: 4px; color: var(--gold-energy); font-size: 0.7rem;">Page ${item.progress}</span>` : '';

                // Audiobook specific progress
                let lastListenedText = '';
                let progressBar = '';
                if (isAudio && item.lastPlayedTime) {
                    const mins = Math.floor(item.lastPlayedTime / 60);
                    const secs = Math.floor(item.lastPlayedTime % 60);
                    lastListenedText = `<div style="font-size: 0.75rem; color: var(--gold-energy); margin-top: 4px; opacity: 0.8;">
                        <i class="fas fa-history" style="font-size: 0.7rem; margin-right: 4px;"></i> Last listened: ${mins} min ${secs} sec
                    </div>`;

                    const percent = Math.min((item.lastPlayedTime / (item.totalDuration || 1)) * 100, 100);
                    progressBar = `
                        <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 8px; overflow: hidden;">
                            <div style="width: ${percent}%; height: 100%; background: var(--gold-energy); box-shadow: 0 0 10px var(--gold-energy);"></div>
                        </div>
                    `;
                }

                const imgUrl = item.thumbnail ? (item.thumbnail.startsWith('http') ? item.thumbnail : (window.API_BASE || `${API_BASE}`) + (item.thumbnail.startsWith('/') ? '' : '/') + item.thumbnail) : CONFIG.BASE_PATH + 'assets/images/placeholder.png';

                return `
                <div style="background: rgba(255, 211, 105, 0.05); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 211, 105, 0.1); display: flex; gap: 15px; align-items: center; transition: all 0.3s; margin-bottom: 10px;">
                    <div style="width: 60px; height: 85px; flex-shrink: 0; position: relative;">
                        <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                        <div style="position: absolute; top: -5px; right: -5px; width: 22px; height: 22px; background: var(--gold-energy); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: black; font-size: 0.7rem;">
                            <i class="fas ${isAudio ? 'fa-headphones' : 'fa-book'}"></i>
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1; min-width: 0;">
                                <h4 style="margin: 0; font-size: 1rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</h4>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                    <span style="font-size: 0.7rem; padding: 2px 6px; background: rgba(255,211,105,0.1); border: 1px solid rgba(255,211,105,0.2); border-radius: 4px; color: var(--gold-energy); text-transform: uppercase; font-weight: 700;">${item.type}</span>
                                    <span style="font-size: 0.7rem; opacity: 0.5;">Purchased: ${item.date}</span>
                                </div>
                                ${progressInfo}
                                ${lastListenedText}
                            </div>
                            <div style="margin-left: 10px;">
                                <button onclick="window.accessContent('${item.type}', '${item.name.replace(/'/g, "\\'")}')" 
                                        style="background: ${isPlaying ? (isPaused ? 'var(--gold-energy)' : '#ff6b6b') : 'var(--gold-energy)'}; color: black; border: none; padding: 8px 15px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 800; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                                    ${isAudio ? (isPlaying ? (isPaused ? '<i class="fas fa-play"></i> RESUME' : '<i class="fas fa-pause"></i> PAUSE') : '<i class="fas fa-play"></i> LISTEN NOW') : (item.progress ? '<i class="fas fa-book-open"></i> RESUME READ' : '<i class="fas fa-book-open"></i> READ NOW')}
                                </button>
                            </div>
                        </div>
                        ${progressBar}
                    </div>
                </div>
            `}).join('');
        } else {
            libraryList.innerHTML = '<p style="font-size: 0.8rem; opacity: 0.5; text-align: center;">No digital products yet.</p>';
        }
    }

    function updateHistoryDisplay() {
        const historyList = document.getElementById('purchase-history-list');
        if (!historyList) return;

        const historyKey = getUserKey('efv_purchase_history');
        const history = JSON.parse(localStorage.getItem(historyKey)) || [];
        if (history.length > 0) {
            historyList.innerHTML = history.map(h => `
                <div style="background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.9rem;">${h.name} ${h.quantity > 1 ? `x ${h.quantity}` : ''}</span>
                    <span class="gold-text">₹${(h.price * h.quantity).toFixed(2)}</span>
                </div>
            `).join('');
        } else {
            historyList.innerHTML = '<p style="font-size: 0.8rem; opacity: 0.5; text-align: center;">No purchase history.</p>';
        }
    }

    // --- UNIVERSAL SECURITY ENGINE ---
    let currentAudio = null;
    let currentPlayingName = null;
    let isSecurityActive = false;
    let globalFocusTracker = null;

    // Global Security Style Injection
    if (!document.getElementById('efv-security-styles')) {
        const style = document.createElement('style');
        style.id = 'efv-security-styles';
        style.innerHTML = `
            .global-security-alert {
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: #dc2626; color: white; padding: 40px 60px; border-radius: 20px;
                font-weight: 900; z-index: 20000; text-align: center; display: none;
                box-shadow: 0 0 200px rgba(220, 38, 38, 1); border: 8px solid white;
                text-transform: uppercase; letter-spacing: 3px; font-family: 'Cinzel', serif;
                animation: securityShake 0.1s ease-in-out infinite alternate;
            }
            @keyframes securityShake { from { transform: translate(-50.5%, -50%); } to { transform: translate(-49.5%, -50%); } }
            .content-lockout { filter: none !important; opacity: 0.1 !important; pointer-events: none !important; }
        `;
        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', `
            <div id="global-security-lock" class="global-security-alert">
                <i class="fas fa-biohazard" style="font-size: 5rem; display: block; margin-bottom: 20px;"></i>
                🚨 SECURE LOCK ACTIVE 🚨<br>
                <span style="font-size: 1.2rem; margin-top: 15px; display: block;">CAPTURE ATTEMPT DETECTED</span>
                <span style="font-size: 0.8rem; font-weight: 400; opacity: 0.8; margin-top: 20px; display: block;">Access suspended. Please return to active window to unlock.</span>
            </div>
        `);
    }

    const triggerGlobalLock = () => {
        if (!isSecurityActive) return;

        // 1. Pause Audio
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
            updateLibraryDisplay(currentPlayingName);
        }

        // 2. Blackout PDF
        const pdfCard = document.getElementById('pdf-content-card');
        if (pdfCard) pdfCard.classList.add('blackout');

        // 3. Show Global Alert
        document.getElementById('global-security-lock').style.display = 'block';
    };

    const releaseGlobalLock = () => {
        document.getElementById('global-security-lock').style.display = 'none';
        const pdfCard = document.getElementById('pdf-content-card');
        if (pdfCard) pdfCard.classList.remove('blackout');
    };

    const globalSecurityBlur = () => triggerGlobalLock();
    const globalSecurityFocus = () => releaseGlobalLock();

    const globalPreventShortcuts = (e) => {
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const isWinKey = e.key === 'Meta' || e.keyCode === 91 || e.keyCode === 92;

        // Block Ctrl+Shift+R (Screen record), Win+Shift+S, PrintScreen, etc.
        if (
            isWinKey || e.key === 'PrintScreen' || e.key === 'F12' ||
            (isCtrlOrMeta && e.shiftKey && (e.key === 'R' || e.key === 'r' || e.key === 'S' || e.key === 's' || e.key === 'I' || e.key === 'i')) ||
            (isCtrlOrMeta && (e.key === 'U' || e.key === 'u' || e.key === 'P' || e.key === 'p' || e.key === 'S' || e.key === 's'))
        ) {
            // Allow F12 for debugging if needed, but shield might trigger
            if (e.key === 'F12') {
                // For now, allow F12 without lock so user can see console
                return;
            }

            e.preventDefault();
            triggerGlobalLock();
            // Alert removed to be less intrusive
        }
    };

    const activateSecurityShield = () => {
        if (isSecurityActive) return;
        isSecurityActive = true;

        window.addEventListener('blur', globalSecurityBlur);
        window.addEventListener('focus', globalSecurityFocus);
        document.addEventListener('keydown', globalPreventShortcuts, true);
        document.addEventListener('contextmenu', e => e.preventDefault());
        window.addEventListener('mouseleave', globalSecurityBlur);
        window.addEventListener('mouseenter', globalSecurityFocus);

        // High frequency focus polling - DISABLED for better UX during testing/reading
        // globalFocusTracker = setInterval(() => {
        //     if (!document.hasFocus()) triggerGlobalLock();
        // }, 150);
    };

    const deactivateSecurityShield = () => {
        isSecurityActive = false;
        clearInterval(globalFocusTracker);
        window.removeEventListener('blur', globalSecurityBlur);
        window.removeEventListener('focus', globalSecurityFocus);
        document.removeEventListener('keydown', globalPreventShortcuts, true);
        window.removeEventListener('mouseleave', globalSecurityBlur);
        window.removeEventListener('mouseenter', globalSecurityFocus);
        releaseGlobalLock();
    };

    window.accessContent = function (type, name) {
        if (type === 'Audiobook') {
            // Handle same item toggle
            if (currentPlayingName === name && currentAudio) {
                if (!currentAudio.paused) {
                    currentAudio.pause();
                    updateLibraryDisplay(name);
                } else {
                    currentAudio.play();
                    updateLibraryDisplay(name);
                }
                return;
            }

            // Stop any existing audio if it's a different item
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }

            const launchAudio = (startTime = 0) => {
                const audioPath = 'assets/videos/efv-audio.mp3';
                try {
                    console.log("Attempting to play audio (MP3):", audioPath, "at", startTime);
                    currentAudio = new Audio(audioPath);
                    currentPlayingName = name;

                    currentAudio.onloadedmetadata = () => {
                        if (startTime > 0) currentAudio.currentTime = startTime;
                        currentAudio.play().then(() => {
                            updateLibraryDisplay(name);
                        }).catch(e => console.error('Audio Play Error:', e));
                    };

                    // Progress Tracking (Continuous 1s local, 5s backend)
                    let lastLocalSave = 0;
                    let lastCloudSave = 0;
                    currentAudio.ontimeupdate = () => {
                        const now = currentAudio.currentTime;

                        // 1. Local update every ~1 second for smooth UI
                        if (Math.abs(now - lastLocalSave) >= 1) {
                            lastLocalSave = now;
                            window.saveAudioProgress(name, now, currentAudio.duration, false, false); // false for syncCloud
                        }

                        // 2. Cloud update every ~5 seconds
                        if (Math.abs(now - lastCloudSave) >= 5) {
                            lastCloudSave = now;
                            window.saveAudioProgress(name, now, currentAudio.duration, false, true); // true for syncCloud
                        }
                    };

                    currentAudio.onpause = () => {
                        window.saveAudioProgress(name, currentAudio.currentTime, currentAudio.duration);
                        updateLibraryDisplay(name);
                    };

                    currentAudio.onended = () => {
                        window.saveAudioProgress(name, 0, currentAudio.duration, true);
                        currentPlayingName = null;
                        currentAudio = null;
                        updateLibraryDisplay(null);
                    };

                } catch (e) {
                    alert('⚠️ Error initializing audio: ' + e.message);
                }
            };

            const fetchAudioCloudProgress = async () => {
                const libKey = getUserKey('efv_digital_library');
                const library = JSON.parse(localStorage.getItem(libKey)) || [];
                const item = library.find(i => i.name === name);
                let localTime = (item && item.lastPlayedTime) ? parseFloat(item.lastPlayedTime) : 0;

                const user = JSON.parse(localStorage.getItem('efv_user'));
                if (user && user.email && item && item.id) {
                    try {
                        const demoToken = btoa(user.email);
                        const res = await fetch(`${API_BASE}/api/demo/progress/${item.id}`, {
                            headers: { 'Authorization': `Bearer ${demoToken}` }
                        });
                        const data = await res.json();
                        if (data && data.progress && parseFloat(data.progress) > localTime) {
                            return parseFloat(data.progress);
                        }
                    } catch (e) {
                        console.warn('Audio cloud progress fetch failed', e);
                    }
                }
                return localTime;
            };

            fetchAudioCloudProgress().then(finalTime => {
                if (finalTime > 10) {
                    // Logic for resume modal handled via showResumeOption
                    const mins = Math.floor(finalTime / 60);
                    const secs = Math.floor(finalTime % 60);
                    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

                    showResumeOption(name, timeStr,
                        () => launchAudio(finalTime),
                        () => launchAudio(0)
                    );
                } else {
                    launchAudio(0);
                }
            });
        } else {
            // E-Book Logic (Secure Viewer)
            console.log("Accessing content type:", type, "Name:", name);

            // Get saved progress (Local - Default)
            const libKey = getUserKey('efv_digital_library');
            const library = JSON.parse(localStorage.getItem(libKey)) || [];
            const item = library.find(i => i.name === name);
            let savedPage = (item && item.progress) ? parseInt(item.progress) : 1;

            // PDF Loading Strategy:
            // 1. Try Base64 data first (Works on file:// and http://)
            // 2. Fallback to file path (Works on http://, fails on file://)
            let pdfSource = 'js/pdfjs/efv-checklist.pdf';

            if (typeof EFV_PDF_DATA !== 'undefined') {
                console.log("✅ Using Base64 PDF Data (Bypasses CORS/Protocol issues)");
                pdfSource = EFV_PDF_DATA;
            } else {
                // Smart path resolution fallback
                if (window.location.protocol === 'file:') {
                    pdfSource = 'js/pdfjs/efv-checklist.pdf';
                } else {
                    pdfSource = '/js/pdfjs/efv-checklist.pdf';
                }
            }

            console.log("Attempting to open PDF with source length:", pdfSource.length > 100 ? "Base64 Data" : pdfSource);

            const launchViewer = (page) => {
                toggleCart(false); // Auto-close
                if (typeof openPdfViewer === 'function') {
                    openPdfViewer(pdfSource, name, page);
                } else {
                    console.error("openPdfViewer function not found!");
                    alert("Error: Internal viewer missing. Please reload the page.");
                }
            };

            // Async Fetch from Backend (if online & logged in)
            const fetchCloudProgress = async () => {
                const user = JSON.parse(localStorage.getItem('efv_user'));
                if (user && user.email) {
                    try {
                        const demoToken = btoa(user.email);
                        // Use Item ID if available
                        const productId = item ? item.id : null;

                        if (productId) {
                            const res = await fetch(`${API_BASE}/api/demo/progress/${productId}`, {
                                headers: { 'Authorization': `Bearer ${demoToken}` }
                            });
                            const data = await res.json();
                            if (data && data.progress && data.progress > savedPage) {
                                console.log(`☁️ Cloud progress found: Page ${data.progress} (Local: ${savedPage})`);
                                return parseInt(data.progress);
                            }
                        }
                    } catch (e) {
                        console.warn('Cloud progress fetch failed, using local.', e);
                    }
                }
                return savedPage;
            };

            // Execute Launch
            fetchCloudProgress().then(finalPage => {
                if (finalPage > 1) {
                    // Resume Option
                    if (typeof showResumeOption === 'function') {
                        showResumeOption(name, finalPage,
                            () => launchViewer(finalPage),
                            () => launchViewer(1)
                        );
                    } else {
                        // Fallback
                        if (confirm(`Resume "${name}" from page ${finalPage}? Click Cancel to start over.`)) {
                            launchViewer(finalPage);
                        } else {
                            launchViewer(1);
                        }
                    }
                } else {
                    // First time or page 1 -> Direct Open
                    launchViewer(1);
                }
            });
        }
    };

    window.saveAudioProgress = async function (bookName, time, duration, forceReset = false, syncCloud = true) {
        const libKey = getUserKey('efv_digital_library');
        const library = JSON.parse(localStorage.getItem(libKey)) || [];
        const index = library.findIndex(i => i.name === bookName);

        if (index !== -1) {
            const isDone = forceReset || (duration > 0 && time / duration >= 0.95);
            const finalTime = isDone ? 0 : time;

            library[index].lastPlayedTime = finalTime;
            library[index].totalDuration = duration;
            localStorage.setItem(libKey, JSON.stringify(library));

            // Only update UI if we are on the profile page or sidebar is open
            // This is fast so we can call it frequently
            updateLibraryDisplay(currentPlayingName);

            if (!syncCloud) return;

            const user = JSON.parse(localStorage.getItem('efv_user'));
            if (user && user.email && library[index].id) {
                try {
                    const demoToken = btoa(user.email);
                    await fetch(`${API_BASE}/api/demo/progress`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${demoToken}`
                        },
                        body: JSON.stringify({
                            productId: library[index].id,
                            progress: finalTime,
                            total: duration
                        })
                    });
                } catch (e) {
                    console.warn('Audio sync failed', e);
                }
            }
        }
    };

    window.saveEbookProgress = async function (bookName, page) {
        // 1. Local Storage Update (Immediate Feedback)
        const libKey = getUserKey('efv_digital_library');
        const library = JSON.parse(localStorage.getItem(libKey)) || [];
        const index = library.findIndex(i => i.name === bookName);

        if (index !== -1) {
            library[index].progress = page;
            localStorage.setItem(libKey, JSON.stringify(library));
            updateLibraryDisplay();
        }

        // 2. Backend Sync (Silent)
        const user = JSON.parse(localStorage.getItem('efv_user'));
        if (user && user.email) {
            try {
                // Use Name as ID for now or find the ID map
                // In demo.js we use productId, but frontend only has name easily available in this context
                // We'll try to find the ID from the library object
                let productId = null;
                if (index !== -1 && library[index].id) {
                    productId = library[index].id;
                } else {
                    // Fallback map if needed, or send name as ID (backend needs to handle it)
                    // For now, we assume library has ID
                }

                if (productId) {
                    const demoToken = btoa(user.email);
                    console.log(`📤 Syncing to backend: ${productId} -> Page ${page}`);
                    const res = await fetch(`${API_BASE}/api/demo/progress`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${demoToken}`
                        },
                        body: JSON.stringify({
                            productId: productId,
                            progress: page,
                            total: 0
                        })
                    });
                    const data = await res.json();
                    console.log('✅ Backend Response:', data);
                }
            } catch (error) {
                console.warn('❌ Backend progress sync failed:', error);
            }
        }

        // 3. UI Feedback
        const btn = document.getElementById('save-bookmark-btn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Saved';
            btn.style.background = '#10b981';
            setTimeout(() => {
                btn.innerHTML = original;
                btn.style.background = '';
            }, 2000);
        }
    };

    // Secure PDF Viewer (In-App)
    function openPdfViewer(url, title, startPage = 1) {
        console.log("PDF Viewer requested for:", url);

        // Remove existing viewer if any
        const existing = document.getElementById('pdf-viewer-modal');
        if (existing) existing.remove();

        // Inject Styles if not present
        if (!document.getElementById('pdf-viewer-styles')) {
            const style = document.createElement('style');
            style.id = 'pdf-viewer-styles';
            style.innerHTML = `
                #pdf-viewer-modal {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0,0,0,0.95); z-index: 20000; display: flex;
                    align-items: center; justify-content: center;
                    animation: fadeIn 0.3s ease-out;
                }
                .pdf-card {
                    width: 95%; height: 95%; background: #111; border: 1px solid #ffd700;
                    border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 0 50px rgba(0,0,0,0.8); position: relative;
                }
                .pdf-close-btn {
                    position: absolute; top: 15px; right: 15px; width: 40px; height: 40px;
                    background: rgba(255,0,0,0.2); border: 1px solid red; border-radius: 50%;
                    color: white; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; z-index: 100; font-size: 1.2rem; transition: all 0.3s;
                }
                .pdf-close-btn:hover {
                    background: rgba(255,0,0,0.5); transform: scale(1.1);
                }
                #pdf-viewer-container { 
                    flex: 1; width: 100%; height: 100%; 
                    user-select: none; -webkit-user-select: none; -moz-user-select: none;
                }
                #pdf-viewer-container::-webkit-scrollbar {
                    width: 8px;
                }
                #pdf-viewer-container::-webkit-scrollbar-track {
                    background: #222;
                }
                #pdf-viewer-container::-webkit-scrollbar-thumb {
                    background: var(--gold-energy);
                    border-radius: 4px;
                }
                .pdf-page-canvas {
                    display: block;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    border-radius: 4px;
                    max-width: 100%;
                    height: auto;
                    user-select: none;
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    pointer-events: none; /* Prevent right-click on canvas */
                }
                #pdf-sync-status.active {
                    opacity: 1 !important;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                /* Security Notice */
                .pdf-security-notice {
                    position: absolute;
                    bottom: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(255, 0, 0, 0.1);
                    border: 1px solid rgba(255, 0, 0, 0.3);
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    color: #ff6b6b;
                    opacity: 0.6;
                    pointer-events: none;
                    z-index: 50;
                }
            `;
            document.head.appendChild(style);
        }

        // Enhanced Viewer HTML with Controls
        const viewerHTML = `
            <div id="pdf-viewer-modal">
                <div class="pdf-card">
                    <button id="close-pdf-viewer" class="pdf-close-btn"><i class="fas fa-times"></i></button>
                    <div style="padding: 10px; text-align: center; color: #ffd700; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0;">${title}</h3>
                        <div id="pdf-controls-area" style="display: flex; gap: 10px; align-items: center;">
                            <span style="font-size: 0.9rem; opacity: 0.8;">Page <span id="current-page-num">1</span></span>
                            <button id="save-bookmark-btn" style="background: var(--gold-energy); color: black; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">
                                <i class="fas fa-bookmark"></i> Save Progress
                            </button>
                            <span id="pdf-sync-status" style="color: #10b981; font-size: 0.8rem; opacity: 0; transition: opacity 0.3s;">✓ Saved</span>
                        </div>
                    </div>
                    <div id="pdf-main-loader" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #ffd700; text-align: center; z-index: 10;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <p>Loading Secure Content...</p>
                    </div>
                    <div id="pdf-viewer-container" style="position: relative; background: #1a1a1a; overflow-y: auto; flex: 1; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <!-- PDF pages will be rendered here as canvases -->
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', viewerHTML);

        const modal = document.getElementById('pdf-viewer-modal');

        // Close Handler
        const cleanup = () => {
            if (modal) modal.remove();
            deactivateSecurityShield();
        };

        document.getElementById('close-pdf-viewer').onclick = cleanup;
        modal.onclick = (e) => { if (e.target === modal) cleanup(); };

        // Manual Bookmark Save
        const bookmarkBtn = document.getElementById('save-bookmark-btn');
        if (bookmarkBtn) {
            bookmarkBtn.onclick = () => {
                const currentPageNum = document.getElementById('current-page-num');
                if (currentPageNum) {
                    const page = parseInt(currentPageNum.textContent) || 1;
                    window.saveEbookProgress(title, page);
                }
            };
        }

        activateSecurityShield();

        // INTERNAL FALLBACK FUNCTION - Now using PDF.js instead of iframe
        const fallbackToIframe = (pdfUrl) => {
            // Don't use iframe anymore - use PDF.js for security
            if (window.pdfjsLib) {
                startPdfRendering(pdfUrl, title, startPage);
            } else {
                const container = document.getElementById('pdf-viewer-container');
                container.innerHTML = `
                    <div style="color: #ef4444; text-align: center; padding: 50px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                        <h3>PDF Library Not Loaded</h3>
                        <p>Please refresh the page to load the secure viewer.</p>
                    </div>
                `;
            }
        };

        // ALWAYS use PDF.js for security (no iframe)
        console.log('🔍 PDF Viewer Debug:');
        console.log('  - PDF.js Library loaded:', !!window.pdfjsLib);
        console.log('  - PDF URL:', url);
        console.log('  - Start Page:', startPage);

        if (window.pdfjsLib) {
            console.log('✅ Starting PDF.js rendering...');
            startPdfRendering(url, title, startPage);
        } else {
            console.error('❌ PDF.js library NOT loaded!');
            // Fallback if PDF.js didn't load
            const container = document.getElementById('pdf-viewer-container');
            container.innerHTML = `
                <div style="color: #ef4444; text-align: center; padding: 50px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>PDF Library Not Loaded</h3>
                    <p>Please refresh the page (Ctrl+R) and try again.</p>
                    <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 20px;">If issue persists, check browser console (F12) for errors.</p>
                </div>
            `;
            // Retry after delay
            setTimeout(() => {
                if (window.pdfjsLib) {
                    console.log('✅ PDF.js loaded after retry');
                    startPdfRendering(url, title, startPage);
                } else {
                    console.error('❌ PDF.js still not loaded after retry');
                }
            }, 1000);
        }
    }

    function startPdfRendering(url, title, startPage) {
        console.log('📄 startPdfRendering called with:', { url, title, startPage });

        const pdflib = window.pdfjsLib;
        if (!pdflib) {
            console.error('❌ PDF.js library not available in startPdfRendering');
            return;
        }

        pdflib.GlobalWorkerOptions.workerSrc = 'js/pdfjs/pdf.worker.min.js';
        console.log('✅ PDF.js worker configured');

        const container = document.getElementById('pdf-viewer-container');
        const loader = document.getElementById('pdf-main-loader');
        const pageNumDisplay = document.getElementById('current-page-num');
        const syncStatus = document.getElementById('pdf-sync-status');

        console.log('📦 Loading PDF from:', url);
        const loadingTask = pdflib.getDocument(url);

        loadingTask.promise.then(pdf => {
            console.log('✅ PDF loaded successfully! Pages:', pdf.numPages);
            if (loader) loader.style.display = 'none';
            const numPages = pdf.numPages;
            let pageHeights = new Array(numPages).fill(0);
            let cumulativeHeights = [0];
            let pagesLoaded = 0;

            // 1. Pre-create canvases to preserve order
            for (let i = 1; i <= numPages; i++) {
                const canvas = document.createElement('canvas');
                canvas.className = 'pdf-page-canvas';
                canvas.id = `pdf-page-${i}`;
                canvas.style.marginBottom = '20px';
                container.appendChild(canvas);

                pdf.getPage(i).then(page => {
                    const viewport = page.getViewport({ scale: 1.5 });
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    page.render(renderContext).promise.then(() => {
                        console.log(`✅ Page ${i} rendered`);
                        pageHeights[i - 1] = canvas.offsetHeight + 20;
                        pagesLoaded++;

                        // Only proceed with height-dependent logic when ALL pages are ready
                        if (pagesLoaded === numPages) {
                            console.log('✅ All pages rendered. Calculating offsets...');
                            cumulativeHeights = [0];
                            for (let j = 0; j < numPages; j++) {
                                cumulativeHeights[j + 1] = cumulativeHeights[j] + pageHeights[j];
                            }

                            // Initial scroll to startPage
                            if (startPage > 1 && startPage <= numPages) {
                                container.scrollTop = cumulativeHeights[startPage - 1];
                            }
                            console.log('✅ PDF Viewer fully initialized.');
                        }
                    }).catch(err => console.error(`❌ Render Error Pg ${i}:`, err));
                }).catch(err => console.error(`❌ Load Error Pg ${i}:`, err));
            }

            // 2. Real-time Auto-page detection logic
            let saveTimeout;
            container.addEventListener('scroll', () => {
                const scrollTop = container.scrollTop;
                const canvases = container.querySelectorAll('.pdf-page-canvas');
                let detectedPage = 1;

                // Identify page based on scroll position
                canvases.forEach((cv, idx) => {
                    // offsetTop is relative to container since container has padding/scroll
                    if (scrollTop >= (cv.offsetTop - container.offsetTop - 200)) {
                        detectedPage = idx + 1;
                    }
                });

                if (detectedPage !== parseInt(pageNumDisplay.textContent)) {
                    if (pageNumDisplay) pageNumDisplay.textContent = detectedPage;
                }

                // Debounced Auto-Save
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    console.log(`⏱ Debounced save triggered for Pg ${detectedPage}`);
                    if (syncStatus) syncStatus.classList.add('active');
                    window.saveEbookProgress(title, detectedPage);
                    setTimeout(() => {
                        if (syncStatus) syncStatus.classList.remove('active');
                    }, 1500);
                }, 1500);
            });

        }).catch(err => {
            console.error('❌ PDF Load Error:', err);
            console.error('   Error name:', err.name);
            console.error('   Error message:', err.message);
            console.error('   Attempted URL:', url);

            if (loader) {
                loader.innerHTML = `
                    <div style="color:#ef4444; text-align: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                        <h3>Error Loading PDF</h3>
                        <p>${err.message}</p>
                        <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 20px;">
                            Path: ${url}
                        </p>
                        <button onclick="location.reload()" style="margin-top: 20px; background: var(--gold-energy); color: black; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        });
    }

    // Toggle User Profile View (Redirect to Dashboard)
    function toggleUserProfile(show) {
        if (show) {
            window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html';
        }
    }

    function loadRazorpayScript() {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }

    // Event Listeners
    window.checkoutOrder = async function checkoutOrder(itemsOverride = null) {
        const user = JSON.parse(localStorage.getItem('efv_user'));

        let checkoutItems = itemsOverride || cart;
        let isDigitalOnly = false;
        if (checkoutItems && checkoutItems.length > 0) {
            const hasPhysical = checkoutItems.some(item => {
                const type = (item.type || '').toUpperCase();
                const cat = (item.category || '').toLowerCase();
                const id = (item.productId || item.id || '').toLowerCase();

                if (['EBOOK', 'AUDIOBOOK', 'DIGITAL'].includes(type) || cat === 'digital') return false;
                if (['HARDCOVER', 'PAPERBACK', 'PHYSICAL'].includes(type) || cat === 'physical') return true;

                const digs = ['ebook', 'audio', 'digital'];
                if (!digs.some(d => id.includes(d)) && (id.includes('hard') || id.includes('paper') || id.includes('vol') || id.includes('book'))) return true;
                return false;
            });
            isDigitalOnly = !hasPhysical;
        }

        const dest = isDigitalOnly ? 'pages/checkout.html' : 'pages/profile.html?checkout=true';

        if (!user) {
            localStorage.setItem('checkoutPending', dest);
            alert('Please login to proceed to checkout');
            openAuthModal('login');
            return;
        }

        if (itemsOverride) {
            // "Buy Now" path: Use only the specific item
            localStorage.setItem('directCheckout', JSON.stringify(itemsOverride));
        } else {
            // "Cart" path: Ensure we use the current cart
            localStorage.removeItem('directCheckout');
        }

        // Redirect to appropriate page
        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + dest;
    }

    // Helper to simulate token check or basic validation
    function applySecurityToken(email) {
        return email ? btoa(email) : null;
    }

    // Update Event Listener
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('efv_user'));
            if (user) {
                showTermsAndConditions(() => {
                    checkoutOrder();
                });
            } else {
                openAuthModal('signup');
            }
        });
    }
    if (loginBtn) loginBtn.addEventListener('click', () => openAuthModal('login'));
    if (signupBtn) signupBtn.addEventListener('click', () => openAuthModal('signup'));
    // --- Premium Auth Helpers ---
    window.showToast = function (message) {
        const toast = document.getElementById('auth-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3000);
    };

    window.closeAuth = function () {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.classList.remove('mode-forgot');
            const cartPanel = document.getElementById('cart-panel');
            if (!cartPanel || !cartPanel.classList.contains('active')) {
                document.body.classList.remove('modal-open');
            }
            const forgotFlow = document.getElementById('forgot-password-flow');
            if (forgotFlow) forgotFlow.style.display = 'none';
            const ssoSection = document.getElementById('auth-sso-section');
            if (ssoSection) ssoSection.style.display = 'block';
            document.querySelectorAll('#auth-sso-section, .auth-separator, #uwo-sso-login-btn, #google-login-container').forEach(el => {
                if (el) el.style.display = '';
            });
            const mainTitle = document.querySelector('.auth-premium-title');
            if (mainTitle) mainTitle.style.display = 'block';
            const authTabs = document.querySelector('.auth-premium-tabs');
            if (authTabs) authTabs.style.display = 'flex';
        }
    };

    // Modal Events
    if (closeAuthModal) closeAuthModal.onclick = closeAuth;

    document.querySelectorAll('.auth-tab-item').forEach(tab => {
        tab.onclick = () => switchTab(tab.dataset.authTab);
    });

    // Password Toggle
    document.querySelectorAll('.password-toggle').forEach(eye => {
        eye.onclick = () => {
            const input = eye.parentElement.querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                eye.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                eye.classList.replace('fa-eye-slash', 'fa-eye');
            }
        };
    });

    // Strength Checker
    const signupPass = document.getElementById('signup-password');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthContainer = document.querySelector('.strength-indicator');

    if (signupPass) {
        signupPass.oninput = () => {
            const val = signupPass.value;
            if (!val) {
                strengthContainer.style.display = 'none';
                return;
            }
            strengthContainer.style.display = 'block';

            let strength = 0;
            if (val.length >= 6) strength++;
            if (val.match(/[A-Z]/) && val.match(/[0-9]/)) strength++;
            if (val.match(/[^A-Za-z0-9]/)) strength++;

            strengthBar.className = 'strength-bar';
            if (strength === 1) strengthBar.classList.add('weak');
            else if (strength === 2) strengthBar.classList.add('medium');
            else if (strength === 3) strengthBar.classList.add('strong');
        };
    }

    // Real-time Validation
    function validateEmail(email) {
        return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }

    const signupEmail = document.getElementById('signup-email');
    if (signupEmail) {
        signupEmail.onblur = function () {
            const group = this.closest('.input-group');
            const err = group ? group.querySelector('.error-message') : null;
            if (err) {
                if (!validateEmail(this.value)) err.style.display = 'block';
                else err.style.display = 'none';
            }
        };
    }

    const signupPhone = document.getElementById('signup-phone');
    if (signupPhone) {
        signupPhone.onblur = function () {
            const group = this.closest('.input-group');
            const err = group ? group.querySelector('.error-message') : null;
            if (err) {
                if (this.value && this.value.length !== 10) err.style.display = 'block';
                else err.style.display = 'none';
            }
        };
    }

    const signupConfirm = document.getElementById('signup-confirm-password');
    if (signupConfirm) {
        signupConfirm.oninput = function () {
            const group = this.closest('.input-group');
            const err = group ? group.querySelector('.error-message') : null;
            if (err) {
                if (this.value !== signupPass.value) err.style.display = 'block';
                else err.style.display = 'none';
            }
        };
    }

    // Close on ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAuth();
    });

    // Close on Click Outside
    const authOverlay = document.getElementById('auth-modal');
    if (authOverlay) {
        authOverlay.onclick = (e) => {
            if (e.target === authOverlay) closeAuth();
        };
    }

    // --- 3-MINUTE LOGIN LOCKOUT ON 3 FAILED ATTEMPTS ---
    const LOGIN_MAX_ATTEMPTS = 3;
    const LOGIN_LOCKOUT_MS = 3 * 60 * 1000; // 3 minutes
    let loginLockTimerInterval = null;

    function getLoginLockoutData() {
        try {
            const raw = localStorage.getItem('efv_login_lockout');
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (data.lockedUntil) {
                if (Date.now() < data.lockedUntil) {
                    return data;
                } else {
                    localStorage.removeItem('efv_login_lockout');
                    return null;
                }
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    function recordFailedLoginAttempt() {
        try {
            let data = getLoginLockoutData() || { count: 0 };
            data.count = (data.count || 0) + 1;
            if (data.count >= LOGIN_MAX_ATTEMPTS) {
                data.lockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
                localStorage.setItem('efv_login_lockout', JSON.stringify(data));
                return { locked: true, remainingMs: LOGIN_LOCKOUT_MS };
            } else {
                localStorage.setItem('efv_login_lockout', JSON.stringify(data));
                return { locked: false, remainingAttempts: LOGIN_MAX_ATTEMPTS - data.count };
            }
        } catch (e) {
            return { locked: false, remainingAttempts: 1 };
        }
    }

    function clearLoginLockout() {
        try {
            localStorage.removeItem('efv_login_lockout');
            if (loginLockTimerInterval) {
                clearInterval(loginLockTimerInterval);
                loginLockTimerInterval = null;
            }
        } catch (e) {}
    }
    window.clearLoginLockout = clearLoginLockout;

    function checkAndApplyLoginLockout() {
        const lockout = getLoginLockoutData();
        const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
        const genError = document.getElementById('login-general-error');

        if (!lockout || !lockout.lockedUntil) {
            if (loginLockTimerInterval) {
                clearInterval(loginLockTimerInterval);
                loginLockTimerInterval = null;
            }
            if (submitBtn) submitBtn.disabled = false;
            return false;
        }

        const remainingMs = lockout.lockedUntil - Date.now();
        if (remainingMs <= 0) {
            clearLoginLockout();
            if (submitBtn) submitBtn.disabled = false;
            if (genError) {
                genError.innerHTML = '<span style="color: #10b981;"><i class="fas fa-unlock"></i> Lockout expired. You can now try logging in again.</span>';
                genError.style.display = 'block';
            }
            return false;
        }

        // Lockout is ACTIVE
        if (submitBtn) submitBtn.disabled = true;

        const updateTimerDisplay = () => {
            const current = getLoginLockoutData();
            if (!current || !current.lockedUntil) {
                if (loginLockTimerInterval) clearInterval(loginLockTimerInterval);
                if (submitBtn) submitBtn.disabled = false;
                if (genError) {
                    genError.innerHTML = '<span style="color: #10b981;"><i class="fas fa-unlock"></i> Lockout expired. You can now try logging in again.</span>';
                }
                return;
            }

            const diff = current.lockedUntil - Date.now();
            if (diff <= 0) {
                clearLoginLockout();
                if (submitBtn) submitBtn.disabled = false;
                if (genError) {
                    genError.innerHTML = '<span style="color: #10b981;"><i class="fas fa-unlock"></i> Lockout expired. You can now try logging in again.</span>';
                }
                return;
            }

            const totalSec = Math.ceil(diff / 1000);
            const m = Math.floor(totalSec / 60);
            const s = totalSec % 60;
            const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;

            if (genError) {
                genError.innerHTML = `
                    <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 14px; text-align: center; color: #fca5a5; font-size: 0.88rem; line-height: 1.45;">
                        <div style="font-weight: 700; margin-bottom: 4px; color: #ef4444; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-shield-alt"></i> Login Temporarily Locked
                        </div>
                        <div>Too many failed attempts (3/3). Try again in:</div>
                        <div style="font-size: 1.4rem; font-weight: 800; font-family: monospace; color: #FFD369; margin: 8px 0; letter-spacing: 2px;">${timeStr}</div>
                        <div style="font-size: 0.8rem; opacity: 0.85; margin-top: 4px;">
                            Forgot your password? <a href="#" id="lockout-reset-link" style="color: #FFD369; text-decoration: underline; font-weight: 600;">Reset Password</a>
                        </div>
                    </div>
                `;
                genError.style.display = 'block';

                const resetLnk = document.getElementById('lockout-reset-link');
                if (resetLnk) {
                    resetLnk.onclick = (e) => {
                        e.preventDefault();
                        const forgotLnk = document.querySelector('.forgot-link');
                        if (forgotLnk) forgotLnk.click();
                    };
                }
            }
        };

        updateTimerDisplay();

        if (loginLockTimerInterval) clearInterval(loginLockTimerInterval);
        loginLockTimerInterval = setInterval(updateTimerDisplay, 1000);

        return true;
    }
    window.checkAndApplyLoginLockout = checkAndApplyLoginLockout;

    // Simulate Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Guard against locked out state
            if (checkAndApplyLoginLockout()) {
                return;
            }

            const emailEl = document.getElementById('login-email');
            const passwordEl = document.getElementById('login-password');
            if (!emailEl || !passwordEl) return;
            const email = emailEl.value.trim().toLowerCase();
            const password = passwordEl.value.trim();
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            // UI Feedback
            const btnText = submitBtn.querySelector('span');
            const loader = submitBtn.querySelector('.loader');
            const genError = document.getElementById('login-general-error');

            if (btnText) btnText.style.display = 'none';
            if (loader) loader.style.display = 'block';
            if (genError) genError.style.display = 'none';
            submitBtn.disabled = true;

            try {
                // API Login
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 429 || data.locked) {
                        const lockedUntil = Date.now() + ((data.remainingSeconds || 180) * 1000);
                        localStorage.setItem('efv_login_lockout', JSON.stringify({ count: LOGIN_MAX_ATTEMPTS, lockedUntil }));
                        checkAndApplyLoginLockout();
                        return;
                    }
                    throw new Error(data.message || 'Login failed');
                }

                // Successful login: CLEAR LOCKOUT
                clearLoginLockout();

                // Success
                localStorage.setItem('authToken', data.token);
                const userObj = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone || '',
                    role: data.role,
                    _id: data._id,
                    token: data.token
                };
                localStorage.setItem('efv_user', JSON.stringify(userObj));
                localStorage.setItem('efv_auth_user', JSON.stringify(userObj));
                window.dispatchEvent(new Event('efv_user_logged_in'));

                // MERGE ANONYMOUS CART INTO USER CART
                const userCartKey = getUserKey('efv_cart');
                let userCart = JSON.parse(localStorage.getItem(userCartKey)) || [];

                // Merge current (anonymous) cart into user's cart
                cart.forEach(anonItem => {
                    const existing = userCart.find(i => i.id === anonItem.id);
                    if (existing) {
                        existing.quantity += (anonItem.quantity || 1);
                    } else {
                        userCart.push(anonItem);
                    }
                });

                // Update global cart variable and storage
                cart = userCart;
                localStorage.setItem(userCartKey, JSON.stringify(cart));
                localStorage.removeItem('efv_cart'); // Clean up anonymous cart

                closeAuth();
                showToast('Welcome back!');
                if (typeof updateAuthNavbar === 'function') updateAuthNavbar();
                updateCartUI();

                // Redirect to dashboard based on role
                setTimeout(() => {
                    const role = data.role || 'user';
                    const checkoutPending = localStorage.getItem('checkoutPending');
                    localStorage.removeItem('checkoutPending');

                    const emailLower = (data.email || '').toLowerCase();
                    if (role === 'admin' || emailLower === 'admin@uwo24.com' || emailLower === 'efv@uwo24.com') {
                        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/admin-dashboard.html';
                    } else if (checkoutPending && checkoutPending !== 'true') {
                        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + checkoutPending;
                    } else {
                        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html' + (checkoutPending === 'true' ? '?checkout=true' : '');
                    }
                }, 1000);

                // Sync library
                syncLibraryWithBackend().catch(err => console.error('Background sync failed:', err));

            } catch (error) {
                console.error('Login Error:', error);
                const genError = document.getElementById('login-general-error');
                const errMsg = error.message || '';
                const isCredError = errMsg.toLowerCase().includes('password') ||
                                    errMsg.toLowerCase().includes('incorrect') ||
                                    errMsg.toLowerCase().includes('invalid') ||
                                    errMsg.toLowerCase().includes('credential') ||
                                    errMsg.toLowerCase().includes('failed') ||
                                    errMsg.toLowerCase().includes('no account');

                if (isCredError) {
                    const status = recordFailedLoginAttempt();
                    if (status.locked) {
                        checkAndApplyLoginLockout();
                        return;
                    } else if (genError) {
                        const rem = status.remainingAttempts;
                        genError.innerHTML = `
                            <div style="color: #f87171; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>${errMsg || 'Incorrect password'}</span>
                            </div>
                            <div style="font-size: 0.78rem; color: #fca5a5; margin-top: 4px; font-weight: 500;">
                                ${rem} attempt${rem > 1 ? 's' : ''} remaining before 3-minute lock.
                            </div>
                        `;
                        genError.style.display = 'block';
                        return;
                    }
                }

                if (genError) {
                    // Show user-friendly message for server/db outages
                    let displayMsg = error.message;
                    if (displayMsg === 'Service temporarily unavailable. Please try again in a moment.' ||
                        displayMsg === 'Internal server error during login' ||
                        displayMsg?.includes('500') ||
                        displayMsg?.includes('503')) {
                        displayMsg = 'Server is temporarily unavailable. Please try again in a few minutes.';
                    }
                    genError.textContent = displayMsg;
                    genError.style.display = 'block';
                }
            } finally {
                const lockout = getLoginLockoutData();
                const isLocked = lockout && lockout.lockedUntil && Date.now() < lockout.lockedUntil;
                const btnText = submitBtn.querySelector('span');
                const loader = submitBtn.querySelector('.loader');
                if (btnText) btnText.style.display = 'block';
                if (loader) loader.style.display = 'none';
                submitBtn.disabled = isLocked ? true : false;
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameEl = document.getElementById('signup-name');
            const emailEl = document.getElementById('signup-email');
            const phoneEl = document.getElementById('signup-phone');
            const passwordEl = document.getElementById('signup-password');
            if (!nameEl || !emailEl || !passwordEl) return;
            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            const phone = phoneEl ? phoneEl.value.trim() : '';
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            // UI Feedback
            const btnText = submitBtn.querySelector('span');
            const loader = submitBtn.querySelector('.loader');
            const genError = document.getElementById('signup-general-error');

            if (btnText) btnText.style.display = 'none';
            if (loader) loader.style.display = 'block';
            if (genError) genError.style.display = 'none';
            submitBtn.disabled = true;

            try {
                // API Signup (Updated to /register with phone)
                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameEl.value.trim(),
                        email: emailEl.value.trim(),
                        phone: phoneEl ? phoneEl.value.trim() : '',
                        password: passwordEl.value
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Signup failed');
                }

                // Success
                localStorage.setItem('authToken', data.token);
                const signupUserObj = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || phone || '',
                    role: 'user',
                    token: data.token
                };
                localStorage.setItem('efv_user', JSON.stringify(signupUserObj));
                localStorage.setItem('efv_auth_user', JSON.stringify(signupUserObj));
                window.dispatchEvent(new Event('efv_user_logged_in'));

                // MERGE ANONYMOUS CART INTO NEW USER CART
                const userCartKey = getUserKey('efv_cart');
                let userCart = JSON.parse(localStorage.getItem(userCartKey)) || [];
                cart.forEach(anonItem => {
                    const existing = userCart.find(i => i.id === anonItem.id);
                    if (existing) existing.quantity += (anonItem.quantity || 1);
                    else userCart.push(anonItem);
                });
                cart = userCart;
                localStorage.setItem(userCartKey, JSON.stringify(cart));
                localStorage.removeItem('efv_cart');

                closeAuth();
                showToast('Account created successfully!');
                if (typeof updateAuthNavbar === 'function') updateAuthNavbar();
                updateCartUI();

                // Auto-login flow: Redirect to profile for dashboard access
                setTimeout(() => {
                    const checkoutPending = localStorage.getItem('checkoutPending');
                    localStorage.removeItem('checkoutPending');

                    if (checkoutPending && checkoutPending !== 'true') {
                        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + checkoutPending;
                    } else {
                        window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'pages/profile.html' + (checkoutPending === 'true' ? '?checkout=true' : '');
                    }
                }, 1500);

            } catch (error) {
                console.error('Signup Error:', error);
                const genError = document.getElementById('signup-general-error');
                if (genError) {
                    genError.textContent = error.message;
                    genError.style.display = 'block';
                }
            } finally {
                const btnText = submitBtn.querySelector('span');
                const loader = submitBtn.querySelector('.loader');
                if (btnText) btnText.style.display = 'block';
                if (loader) loader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }

    // --- UWO SSO INTEGRATION ---
    const uwoBtn = document.getElementById('uwo-sso-login-btn');
    const uwoSubmodal = document.getElementById('uwo-sso-submodal');
    const closeUwoSubmodal = document.getElementById('close-uwo-submodal');
    const uwoTabLogin = document.getElementById('uwo-tab-login');
    const uwoTabRegister = document.getElementById('uwo-tab-register');
    const uwoNameGroup = document.getElementById('uwo-name-group');
    const uwoForm = document.getElementById('uwo-sso-form');
    const uwoBtnText = document.getElementById('uwo-btn-text');
    const uwoLoader = document.getElementById('uwo-loader');
    const uwoErrorMsg = document.getElementById('uwo-error-msg');
    const uwoSuccessMsg = document.getElementById('uwo-success-msg');

    let uwoIsRegister = false;

    if (uwoBtn && uwoSubmodal) {
        uwoBtn.onclick = () => {
            uwoSubmodal.style.display = 'flex';
        };
    }

    if (closeUwoSubmodal && uwoSubmodal) {
        closeUwoSubmodal.onclick = () => {
            uwoSubmodal.style.display = 'none';
        };
    }

    if (uwoTabLogin && uwoTabRegister) {
        uwoTabLogin.onclick = () => {
            uwoIsRegister = false;
            uwoTabLogin.style.background = 'linear-gradient(135deg, rgba(255, 211, 105, 0.18) 0%, rgba(255, 211, 105, 0.08) 100%)';
            uwoTabLogin.style.color = '#FFD369';
            uwoTabLogin.style.border = '1px solid rgba(255, 211, 105, 0.25)';
            uwoTabLogin.style.textShadow = '0 0 12px rgba(255, 211, 105, 0.4)';

            uwoTabRegister.style.background = 'transparent';
            uwoTabRegister.style.color = 'rgba(255, 255, 255, 0.4)';
            uwoTabRegister.style.border = '1px solid transparent';
            uwoTabRegister.style.textShadow = 'none';

            if (uwoNameGroup) uwoNameGroup.style.display = 'none';
            if (uwoBtnText) uwoBtnText.textContent = 'Sign In with UWO';
            if (uwoErrorMsg) uwoErrorMsg.style.display = 'none';
            if (uwoSuccessMsg) uwoSuccessMsg.style.display = 'none';
        };

        uwoTabRegister.onclick = () => {
            uwoIsRegister = true;
            uwoTabRegister.style.background = 'linear-gradient(135deg, rgba(255, 211, 105, 0.18) 0%, rgba(255, 211, 105, 0.08) 100%)';
            uwoTabRegister.style.color = '#FFD369';
            uwoTabRegister.style.border = '1px solid rgba(255, 211, 105, 0.25)';
            uwoTabRegister.style.textShadow = '0 0 12px rgba(255, 211, 105, 0.4)';

            uwoTabLogin.style.background = 'transparent';
            uwoTabLogin.style.color = 'rgba(255, 255, 255, 0.4)';
            uwoTabLogin.style.border = '1px solid transparent';
            uwoTabLogin.style.textShadow = 'none';

            if (uwoNameGroup) uwoNameGroup.style.display = 'block';
            if (uwoBtnText) uwoBtnText.textContent = 'Create UWO Account';
            if (uwoErrorMsg) uwoErrorMsg.style.display = 'none';
            if (uwoSuccessMsg) uwoSuccessMsg.style.display = 'none';
        };
    }

    if (uwoForm) {
        uwoForm.onsubmit = async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('uwo-email-input');
            const passInput = document.getElementById('uwo-password-input');
            const nameInput = document.getElementById('uwo-name-input');

            if (!emailInput || !passInput) return;
            const email = emailInput.value.trim().toLowerCase();
            const password = passInput.value.trim();
            const name = nameInput ? nameInput.value.trim() : '';

            if (uwoErrorMsg) uwoErrorMsg.style.display = 'none';
            if (uwoSuccessMsg) uwoSuccessMsg.style.display = 'none';
            if (uwoBtnText) uwoBtnText.style.display = 'none';
            if (uwoLoader) uwoLoader.style.display = 'block';

            const UNIFIED_API = (typeof CONFIG !== 'undefined' && CONFIG.UNIFIED_API_URL) ? CONFIG.UNIFIED_API_URL : 'https://uwo24.com/api';
            const API_KEY = (typeof CONFIG !== 'undefined' && CONFIG.UWO_API_KEY) ? CONFIG.UWO_API_KEY : '';

            try {
                if (uwoIsRegister) {
                    const regRes = await fetch(`${UNIFIED_API}/auth/register`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Application-Key': API_KEY
                        },
                        body: JSON.stringify({ name, email, password })
                    });
                    const regData = await regRes.json();
                    if (!regRes.ok) {
                        const errMsg = regData.detail || regData.message || 'Registration failed';
                        throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
                    }
                    if (uwoSuccessMsg) {
                        uwoSuccessMsg.textContent = 'UWO Account created! Logging in...';
                        uwoSuccessMsg.style.display = 'block';
                    }
                }

                // Central UWO Login
                const loginRes = await fetch(`${UNIFIED_API}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Application-Key': API_KEY
                    },
                    body: JSON.stringify({ email, password })
                });
                const loginData = await loginRes.json();
                if (!loginRes.ok) {
                    const errMsg = loginData.detail || loginData.message || 'Invalid email or password';
                    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
                }

                const uwoToken = loginData.access_token;
                localStorage.setItem('uwo_access_token', uwoToken);

                // Provision / log into EFV backend
                let efvUser = {
                    name: name || email.split('@')[0],
                    email: email,
                    token: uwoToken
                };

                try {
                    const efvRes = await fetch(`${API_BASE}/api/auth/uwo-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: email,
                            name: name || email.split('@')[0],
                            uwo_token: uwoToken
                        })
                    });
                    const efvData = await efvRes.json();
                    if (efvRes.ok && efvData.token) {
                        efvUser = efvData;
                        localStorage.setItem('authToken', efvData.token);
                    } else {
                        localStorage.setItem('authToken', uwoToken);
                    }
                } catch (efvErr) {
                    console.warn('[UWO SSO] EFV backend sync error, continuing with central auth:', efvErr);
                    localStorage.setItem('authToken', uwoToken);
                }

                localStorage.setItem('efv_user', JSON.stringify(efvUser));
                localStorage.setItem('efv_auth_user', JSON.stringify(efvUser));
                window.dispatchEvent(new Event('efv_user_logged_in'));

                if (uwoSuccessMsg) {
                    uwoSuccessMsg.textContent = 'Signed in successfully!';
                    uwoSuccessMsg.style.display = 'block';
                }

                showToast(`Welcome, ${efvUser.name || 'User'}! 🚀`);

                setTimeout(() => {
                    closeAuth();
                    if (uwoSubmodal) uwoSubmodal.style.display = 'none';
                    syncLibraryWithBackend();
                    location.reload();
                }, 1000);

            } catch (err) {
                console.error('UWO SSO Error:', err);
                if (uwoErrorMsg) {
                    uwoErrorMsg.textContent = err.message || 'Authentication failed';
                    uwoErrorMsg.style.display = 'block';
                }
            } finally {
                if (uwoBtnText) uwoBtnText.style.display = 'inline';
                if (uwoLoader) uwoLoader.style.display = 'none';
            }
        };
    }

    // --- FORGOT PASSWORD FLOW LOGIC ---
    const forgotLink = document.querySelector('.forgot-link');
    const authTabs = document.querySelector('.auth-premium-tabs');
    const forgotFlow = document.getElementById('forgot-password-flow');
    const backToLogin = document.getElementById('back-to-login');

    // Forms
    const forgotEmailForm = document.getElementById('forgot-email-form');
    const forgotOtpForm = document.getElementById('forgot-otp-form');
    const forgotResetForm = document.getElementById('forgot-reset-form');
    const forgotSuccessView = document.getElementById('forgot-success-view');

    let resetSession = {
        email: '',
        token: ''
    };

    const showForgotStep = (step) => {
        forgotEmailForm.style.display = 'none';
        forgotOtpForm.style.display = 'none';
        forgotResetForm.style.display = 'none';
        forgotSuccessView.style.display = 'none';

        const dots = [1, 2, 3].map(n => document.getElementById(`fp-dot-${n}`));
        const stepsInfo = [
            { title: 'Forgot Password', desc: 'Enter your email address to receive a 6-digit verification code.' },
            { title: 'Verify OTP', desc: 'Enter the 6-digit verification code sent to your email.' },
            { title: 'New Password', desc: 'Create a new, strong password with at least 6 characters.' },
            { title: 'All Done!', desc: 'Your password has been successfully updated.' }
        ];
        const info = stepsInfo[step - 1] || stepsInfo[0];
        const titleEl = document.getElementById('forgot-flow-title');
        const descEl = document.getElementById('forgot-flow-desc');
        const backEl = document.getElementById('back-to-login');

        // Hide back button on success
        if (backEl) backEl.style.display = step === 4 ? 'none' : 'inline-flex';
        if (titleEl) titleEl.textContent = info.title;
        if (descEl) descEl.textContent = info.desc;

        // Update dots
        dots.forEach((dot, i) => {
            dot?.classList.remove('active', 'done');
            if (i < step - 1) dot?.classList.add('done');
            else if (i === step - 1) dot?.classList.add('active');
        });

        if (step === 1) forgotEmailForm.style.display = 'flex';
        if (step === 2) {
            forgotOtpForm.style.display = 'flex';
            const otpInput = document.getElementById('forgot-otp');
            if (otpInput) {
                otpInput.value = '';
                setTimeout(() => otpInput.focus(), 100);
            }
        }
        if (step === 3) forgotResetForm.style.display = 'flex';
        if (step === 4) forgotSuccessView.style.display = 'block';
    };

    if (forgotLink) {
        forgotLink.onclick = (e) => {
            e.preventDefault();
            const modal = document.getElementById('auth-modal');
            if (modal) modal.classList.add('mode-forgot');
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'none';
            const authTabs = document.querySelector('.auth-premium-tabs');
            if (authTabs) authTabs.style.display = 'none';
            const ssoSection = document.getElementById('auth-sso-section');
            if (ssoSection) ssoSection.style.display = 'none';
            const mainTitle = document.querySelector('.auth-premium-title');
            if (mainTitle) mainTitle.style.display = 'none';

            // Explicitly hide any individual SSO and submodal elements
            document.querySelectorAll('#auth-sso-section, .auth-separator, #uwo-sso-login-btn, #google-login-container, #uwo-sso-submodal').forEach(el => {
                if (el) el.style.display = 'none';
            });

            if (forgotFlow) forgotFlow.style.display = 'block';
            showForgotStep(1);

            // Auto-fill email entered in login form (or signup form)
            const loginEmailInput = document.getElementById('login-email');
            const signupEmailInput = document.getElementById('signup-email');
            const forgotEmailInput = document.getElementById('forgot-email');
            const enteredEmail = (loginEmailInput?.value || signupEmailInput?.value || '').trim();

            if (forgotEmailInput) {
                if (enteredEmail) {
                    forgotEmailInput.value = enteredEmail;
                }
                forgotEmailInput.focus();
            }

            const errorEl = document.getElementById('forgot-email-error');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        };
    }

    if (backToLogin) {
        backToLogin.onclick = () => {
            const modal = document.getElementById('auth-modal');
            if (modal) modal.classList.remove('mode-forgot');
            if (forgotFlow) forgotFlow.style.display = 'none';
            const authTabs = document.querySelector('.auth-premium-tabs');
            if (authTabs) authTabs.style.display = 'flex';
            const ssoSection = document.getElementById('auth-sso-section');
            if (ssoSection) ssoSection.style.display = 'block';
            const mainTitle = document.querySelector('.auth-premium-title');
            if (mainTitle) mainTitle.style.display = 'block';

            document.querySelectorAll('#auth-sso-section, .auth-separator, #uwo-sso-login-btn, #google-login-container').forEach(el => {
                if (el) el.style.display = '';
            });

            switchTab('login');

            // If user filled/updated email in forgot password flow, retain it in login input
            const forgotEmailInput = document.getElementById('forgot-email');
            const loginEmailInput = document.getElementById('login-email');
            if (forgotEmailInput && loginEmailInput && forgotEmailInput.value.trim() && !loginEmailInput.value.trim()) {
                loginEmailInput.value = forgotEmailInput.value.trim();
            }
        };
    }

    const setLoader = (form, isLoading) => {
        const btn = form.querySelector('button[type="submit"]');
        if (!btn) return;
        const text = btn.querySelector('span');
        const loader = btn.querySelector('.loader');
        btn.disabled = isLoading;
        if (isLoading) {
            btn.style.opacity = '0.85';
            btn.style.cursor = 'not-allowed';
            if (loader) loader.style.display = 'inline-block';
            if (text) {
                text.style.display = 'inline';
                if (!btn.dataset.origText) btn.dataset.origText = text.textContent;
                text.textContent = ' Sending...';
            }
        } else {
            btn.style.opacity = '';
            btn.style.cursor = '';
            if (loader) loader.style.display = 'none';
            if (text) {
                text.style.display = 'inline';
                if (btn.dataset.origText) {
                    text.textContent = btn.dataset.origText;
                }
            }
        }
    };

    // Step 1: Send OTP
    if (forgotEmailForm) {
        forgotEmailForm.onsubmit = async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('forgot-email');
            const email = emailInput ? emailInput.value.trim() : '';
            const errorEl = document.getElementById('forgot-email-error');
            if (errorEl) errorEl.style.display = 'none';
            setLoader(forgotEmailForm, true);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            try {
                const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const data = await res.json();

                if (res.ok) {
                    resetSession.email = email;
                    showForgotStep(2);
                    showToast('OTP sent to your email');
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.message || 'Unable to send OTP. Please try again.';
                        errorEl.style.display = 'block';
                    }
                }
            } catch (err) {
                clearTimeout(timeoutId);
                if (errorEl) {
                    errorEl.textContent = err.name === 'AbortError'
                        ? 'Request timed out. Please check your connection and try again.'
                        : 'Connection error. Please try again.';
                    errorEl.style.display = 'block';
                }
            } finally {
                setLoader(forgotEmailForm, false);
            }
        };
    }

    // Step 2: Verify OTP
    if (forgotOtpForm) {
        forgotOtpForm.onsubmit = async (e) => {
            e.preventDefault();
            const otpInput = document.getElementById('forgot-otp');
            const otp = otpInput ? otpInput.value.trim() : '';
            const errorEl = document.getElementById('forgot-otp-error');
            if (errorEl) errorEl.style.display = 'none';
            setLoader(forgotOtpForm, true);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            try {
                const res = await fetch(`${API_BASE}/api/auth/verify-reset-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetSession.email, otp }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const data = await res.json();

                if (res.ok) {
                    resetSession.token = data.resetToken;
                    showForgotStep(3);
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.message || 'Invalid or expired OTP.';
                        errorEl.style.display = 'block';
                    }
                }
            } catch (err) {
                clearTimeout(timeoutId);
                if (errorEl) {
                    errorEl.textContent = err.name === 'AbortError'
                        ? 'Request timed out. Please try again.'
                        : 'Verification failed. Try again.';
                    errorEl.style.display = 'block';
                }
            } finally {
                setLoader(forgotOtpForm, false);
            }
        };
    }

    // Step 3: Reset Password
    if (forgotResetForm) {
        forgotResetForm.onsubmit = async (e) => {
            e.preventDefault();
            const pass = document.getElementById('forgot-new-password').value;
            const confirm = document.getElementById('forgot-confirm-password').value;
            const errorEl = document.getElementById('forgot-reset-error');
            if (errorEl) errorEl.style.display = 'none';

            if (pass.length < 6) {
                if (errorEl) {
                    errorEl.textContent = 'Password must be at least 6 characters.';
                    errorEl.style.display = 'block';
                }
                return;
            }
            if (pass !== confirm) {
                if (errorEl) {
                    errorEl.textContent = 'Passwords do not match.';
                    errorEl.style.display = 'block';
                }
                return;
            }

            setLoader(forgotResetForm, true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            try {
                const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resetToken: resetSession.token, newPassword: pass }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const data = await res.json();

                if (res.ok) {
                    showForgotStep(4);
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.message || 'Password reset failed.';
                        errorEl.style.display = 'block';
                    }
                }
            } catch (err) {
                clearTimeout(timeoutId);
                if (errorEl) {
                    errorEl.textContent = err.name === 'AbortError'
                        ? 'Request timed out. Please try again.'
                        : 'Reset failed. Try again.';
                    errorEl.style.display = 'block';
                }
            } finally {
                setLoader(forgotResetForm, false);
            }
        };
    }

    const finishBtn = document.getElementById('finish-reset-btn');
    if (finishBtn) {
        finishBtn.onclick = () => {
            const modal = document.getElementById('auth-modal');
            if (modal) modal.classList.remove('mode-forgot');

            if (forgotFlow) forgotFlow.style.display = 'none';
            const authTabs = document.querySelector('.auth-premium-tabs');
            if (authTabs) authTabs.style.display = 'flex';
            const ssoSection = document.getElementById('auth-sso-section');
            if (ssoSection) ssoSection.style.display = 'block';
            const mainTitle = document.querySelector('.auth-premium-title');
            if (mainTitle) mainTitle.style.display = 'block';

            switchTab('login');
            if (typeof clearLoginLockout === 'function') clearLoginLockout();
            const loginEmailInput = document.getElementById('login-email');
            if (loginEmailInput && resetSession.email) {
                loginEmailInput.value = resetSession.email;
            }
        };
    }

    // Resend OTP
    const resendBtn = document.getElementById('resend-otp-btn');
    if (resendBtn) {
        resendBtn.onclick = async (e) => {
            e.preventDefault();
            showToast('Requesting new code...');
            try {
                await fetch(`${API_BASE}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: resetSession.email })
                });
                showToast('New code sent');
            } catch (err) { }
        };
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Stop Audio and Remove Shield if active
            if (window.currentAudio) {
                window.currentAudio.pause();
                window.currentAudio = null;
            }
            if (typeof deactivateSecurityShield === 'function') deactivateSecurityShield();

            sessionStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('efv_user');
            localStorage.removeItem('authToken'); // Clear auth token
            localStorage.removeItem('efv_cart'); // Clear cart on logout for demo isolation

            // Clear country selection so it pops up again for guest
            localStorage.removeItem('efv_country_selected');
            localStorage.removeItem('efv_selected_country');
            sessionStorage.removeItem('efv_country_selected');
            sessionStorage.removeItem('efv_selected_country');

            if (window.updateAdminNavbar) window.updateAdminNavbar();

            // Re-initialize cart variable and UI
            cart = [];
            updateCartUI();

            toggleUserProfile(false);

            // Optional: Reload to ensure all states are clean
            // window.location.reload();
        });
    }

    // --- AUTO LOGIN & NAVBAR SYNC ---
    // --- PREMIUM AUTO LOGIN & NAVBAR SYNC ---
    // --- PREMIUM AUTO LOGIN & NAVBAR SYNC ---
    window.updateAuthNavbar = function () {
        const user = JSON.parse(localStorage.getItem('efv_user'));
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        // Try to find a dedicated placeholder, otherwise use navActions
        const container = document.getElementById('nav-auth-container') || navActions;
        const hamburger = navActions.querySelector('.hamburger');

        let userMenu = document.getElementById('nav-user-menu');
        let loginBtn = document.getElementById('nav-login-btn');

        if (user) {
            if (loginBtn) loginBtn.remove();
            if (!userMenu) {
                userMenu = document.createElement('div');
                userMenu.id = 'nav-user-menu';
                userMenu.className = 'user-menu-container';
                userMenu.style.marginLeft = '10px';
                const isAdmin = user.role === 'admin' || user.isAdmin === true;
                userMenu.innerHTML = `
                    <button class="btn btn-outline small" id="user-menu-trigger" style="display: flex; align-items: center; gap: 8px; padding: 8px 15px; font-size: 0.8rem; border-radius: 50px;">
                        <i class="fas fa-${isAdmin ? 'user-shield' : 'user-circle'}" style="font-size: 1.2rem;"></i> 
                        <span class="user-name-short">${user.name || (typeof window.t === 'function' ? window.t('buttons.account', 'Account') : 'Account')}</span> 
                        <i class="fas fa-chevron-down" style="font-size: 0.7rem; opacity: 0.7;"></i>
                    </button>
                    <div class="user-dropdown" id="user-dropdown">
                        ${isAdmin ? `
                        <div style="padding: 10px 15px; font-size: 0.75rem; color: var(--gold-energy); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;" data-i18n="buttons.admin_panel">${typeof window.t === 'function' ? window.t('buttons.admin_panel', 'Admin Panel') : 'Admin Panel'}</div>
                        <a href="${(typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '')}pages/admin-dashboard.html?tab=dashboard" class="dropdown-item"><i class="fas fa-tachometer-alt"></i> <span data-i18n="buttons.dashboard">${typeof window.t === 'function' ? window.t('buttons.dashboard', 'Dashboard') : 'Dashboard'}</span></a>
                        ` : `
                        <div style="padding: 10px 15px; font-size: 0.75rem; color: var(--gold-energy); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;" data-i18n="buttons.account">${typeof window.t === 'function' ? window.t('buttons.account', 'Account') : 'Account'}</div>
                        <a href="${(typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '')}pages/profile.html?tab=dashboard" class="dropdown-item"><i class="fas fa-th-large"></i> <span data-i18n="buttons.dashboard">${typeof window.t === 'function' ? window.t('buttons.dashboard', 'Dashboard') : 'Dashboard'}</span></a>
                        `}
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" id="nav-logout-btn" style="color: #ff4d4d;"><i class="fas fa-sign-out-alt"></i> <span data-i18n="buttons.logout">${typeof window.t === 'function' ? window.t('buttons.logout', 'Logout') : 'Logout'}</span></a>
                    </div>
                `;

                // Smart Insertion
                if (container.id === 'nav-auth-container') {
                    container.appendChild(userMenu);
                } else if (hamburger) {
                    navActions.insertBefore(userMenu, hamburger);
                } else {
                    navActions.appendChild(userMenu);
                }

                // Dropdown Trigger
                const trigger = document.getElementById('user-menu-trigger');
                const dropdown = document.getElementById('user-dropdown');
                if (trigger && dropdown) {
                    trigger.onclick = (e) => {
                        e.stopPropagation();
                        dropdown.classList.toggle('active');
                    };
                }

                // Auto-close handle
                document.addEventListener('click', (e) => {
                    if (userMenu && !userMenu.contains(e.target)) {
                        const d = document.getElementById('user-dropdown');
                        if (d) d.classList.remove('active');
                    }
                });

                // Logout logic
                const logout = document.getElementById('nav-logout-btn');
                if (logout) {
                    logout.onclick = (e) => {
                        e.preventDefault();
                        logoutUser();
                    };
                }
            } else {
                const nameSpan = userMenu.querySelector('.user-name-short');
                if (nameSpan) nameSpan.textContent = user.name || (typeof window.t === 'function' ? window.t('buttons.account', 'Account') : 'Account');
            }
        } else {
            if (userMenu) userMenu.remove();
            if (!loginBtn) {
                loginBtn = document.createElement('a');
                loginBtn.id = 'nav-login-btn';
                loginBtn.href = 'javascript:void(0)';
                loginBtn.className = 'btn btn-gold nav-login-btn';
                loginBtn.style.padding = '10px 22px';
                loginBtn.style.fontSize = '0.8rem';
                loginBtn.style.borderRadius = '50px';
                loginBtn.style.textDecoration = 'none';
                loginBtn.style.color = 'var(--cosmic-black)';
                loginBtn.textContent = typeof window.t === 'function' ? window.t('buttons.login', 'Login') : 'Login';
                loginBtn.setAttribute('data-i18n', 'buttons.login');

                // Smart Insertion
                if (container.id === 'nav-auth-container') {
                    container.appendChild(loginBtn);
                } else if (hamburger) {
                    navActions.insertBefore(loginBtn, hamburger);
                } else {
                    navActions.appendChild(loginBtn);
                }
            }

            loginBtn.onclick = (e) => {
                if (e) e.preventDefault();
                if (typeof openAuthModal === 'function') openAuthModal('login');
                else if (typeof window.openAuthModal === 'function') window.openAuthModal('login');
            };
        }
    };

    function logoutUser() {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        if (typeof deactivateSecurityShield === 'function') deactivateSecurityShield();

        sessionStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('efv_user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('efv_cart');

        // Clear country selection so it pops up again for guest
        localStorage.removeItem('efv_country_selected');
        localStorage.removeItem('efv_selected_country');
        sessionStorage.removeItem('efv_country_selected');
        sessionStorage.removeItem('efv_selected_country');

        if (window.updateAdminNavbar) window.updateAdminNavbar();

        showToast('Logged out successfully');

        // Update UI
        updateAuthNavbar();
        updateCartUI();
        if (typeof toggleUserProfile === 'function') toggleUserProfile(false);

        // Redirect to home if on profile
        if (window.location.pathname.includes('profile.html')) {
            window.location.href = (typeof CONFIG !== 'undefined' ? CONFIG.BASE_PATH : '') + 'index.html';
        }
    }

    // Auto-login on load
    async function checkAutoLogin() {
        const token = localStorage.getItem('authToken');
        // ✅ INSTANT UI: Show profile from localStorage immediately (no waiting)
        updateAuthNavbar();

        if (!token) return;

        try {
            const res = await fetch(`${API_BASE}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const userData = await res.json();
                localStorage.setItem('efv_user', JSON.stringify(userData));
                updateAuthNavbar(); // Re-update with fresh server data
                if (typeof initializeDashboard === 'function') {
                    initializeDashboard(userData);
                }
            } else if (res.status === 401 || res.status === 403) {
                // Token definitely invalid - clear and show login button
                console.warn('Session expired, logging out.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('efv_user');
                updateAuthNavbar();
            } else {
                // Server error (500) or other - DO NOT logout. 
                // Keep showing cached user in navbar so the UI doesn't flicker/break.
                console.error(`Profile fetch failed with status ${res.status}. Keeping cached session.`);
            }
        } catch (e) {
            // Network error - keep showing cached user in navbar
            console.warn('Auto-login background check failed (network?):', e.message);
        }
    }

    checkAutoLogin();
    fetchDiscountRulesAndProducts().catch(() => updateCartUI());

    // --- GOOGLE LOGIN FRONTEND ---
    let gsiRetryCount = 0;
    function initGoogleAuth() {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
            if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    setTimeout(initGoogleAuth, 100);
                };
                document.head.appendChild(script);
                return;
            }
            if (gsiRetryCount < 20) {
                gsiRetryCount++;
                setTimeout(initGoogleAuth, 500);
            }
            return;
        }

        const clientId = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_CLIENT_ID)
            ? CONFIG.GOOGLE_CLIENT_ID
            : "246449377479-favi4q5sskhc1hnljs53aik69ftnr6bf.apps.googleusercontent.com";

        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: false
            });

            const googleLoginContainer = document.getElementById("google-login-container");
            if (googleLoginContainer) {
                google.accounts.id.renderButton(
                    googleLoginContainer,
                    {
                        theme: "outline",
                        size: "large",
                        width: 300,
                        logo_alignment: "left",
                        shape: "pill"
                    }
                );
            }
        } catch (err) {
            console.warn("Google Accounts init error:", err);
        }
    }

    async function handleGoogleCredentialResponse(response) {
        console.log("Google Auth Response Received");
        try {
            const apiUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL) ? CONFIG.API_BASE_URL : 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential })
            });

            const data = await res.json();
            if (res.ok && data.token) {
                // Success! Store user and token
                localStorage.setItem('authToken', data.token);
                const gUserObj = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    avatar: data.avatar,
                    token: data.token
                };
                localStorage.setItem('efv_user', JSON.stringify(gUserObj));
                localStorage.setItem('efv_auth_user', JSON.stringify(gUserObj));
                window.dispatchEvent(new Event('efv_user_logged_in'));

                showToast(`Welcome, ${data.name}! ✨`);

                // Close modal
                const modal = document.getElementById('auth-modal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.classList.remove('modal-open');
                }

                // Sync Library
                syncLibraryWithBackend();

                // Force UI Update
                updateCartUI();

                // Redirect if on login-specific flow or just refresh state
                setTimeout(() => {
                    location.reload(); // Refresh to update all UI components globally
                }, 1500);
            } else {
                showToast('❌ Google Login Failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Google Auth Error:', error);
            showToast('❌ Google connection error');
        }
    }

    initGoogleAuth();
});

function showResumeOption(title, progressLabel, onResume, onRestart) {
    // Remove existing
    const existing = document.getElementById('resume-modal');
    if (existing) existing.remove();

    const isAudio = progressLabel.includes(':');
    const icon = isAudio ? 'fa-headphones' : 'fa-bookmark';
    const subTitle = isAudio ? 'Continue Listening?' : 'Resume Reading?';
    const labelPrefix = isAudio ? 'You left off at' : 'You left at';
    const labelSuffix = isAudio ? 'in the audio' : `Page ${progressLabel}`;

    const html = `
    <div id="resume-modal" class="modal-overlay active" style="z-index: 30000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.4s ease-out;">
        <div class="modal-card" style="max-width: 400px; width: 90%; text-align: center; border: 1px solid var(--gold-energy); box-shadow: 0 0 30px rgba(255, 211, 105, 0.2); background: #111; padding: 30px; border-radius: 12px; position: relative;">
            <div style="font-size: 3rem; color: var(--gold-energy); margin-bottom: 20px;">
                <i class="fas ${icon}"></i>
            </div>
            <h3 style="margin-bottom: 10px; color: white; font-family: 'Cinzel', serif;">${subTitle}</h3>
            <p style="opacity: 0.8; margin-bottom: 25px; color: #ccc;">${labelPrefix} <strong>${title}</strong> at <span class="gold-text">${isAudio ? progressLabel : labelSuffix}</span>.</p>
            
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="resume-btn" style="flex: 1; min-width: 140px; padding: 12px; background: var(--gold-energy); color: black; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Cinzel', serif;">
                    <i class="fas fa-play"></i> CONTINUE
                </button>
                <button id="restart-btn" style="flex: 1; min-width: 140px; padding: 12px; background: transparent; color: var(--gold-energy); border: 1px solid var(--gold-energy); border-radius: 6px; font-weight: bold; cursor: pointer; font-family: 'Cinzel', serif;">
                    <i class="fas fa-redo"></i> START OVER
                </button>
            </div>
            <div style="margin-top: 20px;">
                 <button id="resume-cancel" style="background: none; border: none; color: #666; cursor: pointer; text-decoration: underline; font-size: 0.9rem;">Cancel</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('resume-modal');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');
    const cancelBtn = document.getElementById('resume-cancel');

    const close = () => modal.remove();

    resumeBtn.onclick = () => { close(); onResume(); };
    restartBtn.onclick = () => { close(); onRestart(); };
    cancelBtn.onclick = close;
}

// Global beforeunload to save playing audio progress
window.addEventListener('beforeunload', () => {
    if (window.currentAudio && window.currentPlayingName) {
        window.saveAudioProgress(window.currentPlayingName, window.currentAudio.currentTime, window.currentAudio.duration);
    }
});

window.addEventListener('efv-country-changed', () => {
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
});


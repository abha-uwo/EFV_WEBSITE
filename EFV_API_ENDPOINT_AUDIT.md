# EFV PLATFORM – API ENDPOINT AUDIT REPORT

**Audit Date:** November 5, 2026  
**Scope:** Complete inspection of all 35 mounted route groups and underlying endpoints in `EFV-B`.

---

## 1. API Route Coverage & Status Matrix

| Endpoint URL | Method | Purpose | Auth Required | Status | Audit Finding & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/health` | GET | Server health check | Public | **PASS** | Returns `200 OK`, `{"status":"ok","message":"API is healthy"}`. |
| `/api/auth/register` | POST | User registration | Public | **PASS** | Validates email, hashes password with bcrypt, rejects duplicates (400). |
| `/api/auth/login` | POST | User/Admin login | Public | **PASS** | Generates signed JWT with session ID; validates passwords. |
| `/api/auth/logout` | POST | User logout & session invalidation | Authenticated | **PASS** | Successfully clears session state. |
| `/api/auth/me` | GET | Profile data retrieval | Authenticated | **PASS** | Returns sanitized user profile without password hash. |
| `/api/products` | GET | Public book catalogue | Public | **PASS** | Returns active products from MongoDB Atlas (16 items). |
| `/api/products/:id` | GET | Single product details | Public | **PASS** | Resolves by ObjectId or legacyId; includes country-pricing. |
| `/api/products` | POST | Admin book creation | Admin Only | **PASS** | Validates `title, price, type`; auto-creates ObjectId if omitted. |
| `/api/products/:id` | PUT | Admin book update | Admin Only | **PASS** | Correctly updates sellingPrice, stock, and country pricing. |
| `/api/products/:id` | DELETE | Admin book deletion | Admin Only | **PASS** | Successfully removes product record from database. |
| `/api/categories` | GET | Categories list | Public | **PASS** | Returns Hardcover, Softbook, Ebook, Audiobook. |
| `/api/categories` | POST | Category creation | Admin Only | **PASS** | Enforces unique slug and digital flags. |
| `/api/orders` | GET | Admin orders list | Admin Only | **PASS** | Returns all orders with client and fulfillment details. |
| `/api/orders/my-orders` | GET | Client order history | Authenticated | **PASS** | Returns only orders matching logged-in user ID. |
| `/api/orders/cod` | POST | COD order placement | Authenticated | **PASS** | Implements 3-way location routing (Jabalpur/Nimbus/Lulu). |
| `/api/orders/cashfree` | POST | Create Cashfree order | Authenticated | **PASS** | Generates Cashfree Production `payment_session_id`. |
| `/api/orders/verify-cashfree` | POST | Cashfree payment verification | Authenticated | **PASS** | Verifies transaction before granting fulfillment/digital books. |
| `/api/orders/razorpay` | POST | Create Razorpay order | Authenticated | **PASS** | Generates Razorpay receipt and order ID with currency support. |
| `/api/orders/verify-razorpay` | POST | Razorpay signature verification | Authenticated | **PASS** | Verifies HMAC-SHA256 signature; prevents replay attacks. |
| `/api/orders/config` | GET | Gateway & mode config | Public | **PASS** | Returns `activeGateway: "cashfree"`, `cashfreeMode: "production"`. |
| `/api/orders/:id` | DELETE | Cancel/Delete order | Admin / Owner | **PASS** | Restricts deletion to cancelled/pending or authorized admin. |
| `/api/library/my-library` | GET | Unlocked digital books | Authenticated | **PASS** | Returns authorized ebooks/audiobooks with reading links. |
| `/api/library/admin/assign` | POST | Manual book grant | Admin Only | **PASS** | Creates purchase entitlement record for target client. |
| `/api/content/ebook/:id` | GET | Secure Ebook reader | Authenticated | **PASS** | `validatePurchase` middleware blocks unauthorized users (403). |
| `/api/content/audio/:id` | GET | Audiobook player data | Authenticated | **PASS** | Streams audio chapters only if book is unlocked. |
| `/api/coupons` | GET | List all coupons | Admin Only | **PASS** | Lists admin coupons, partner linkages, and usage counts. |
| `/api/coupons` | POST | Create coupon | Admin Only | **PASS** | Validates code, percentage/flat type, expiry, and partner ID. |
| `/api/coupons/verify` | POST | Validate coupon | Public | **PASS** | Validates coupon code and calculates discount accurately. |
| `/api/partners` | GET | List partners | Admin Only | **PASS** | Returns active partner directory. |
| `/api/partners` | POST | Onboard partner | Admin Only | **PASS** | Generates unique partner marketing token and invitation. |
| `/api/partner-portal/login`| POST | Partner portal login | Public | **PASS** | Authenticates partners to access commission dashboards. |
| `/api/partner-portal/dashboard` | GET | Partner metrics | Partner Only | **PASS** | Returns orders, commissions, and coupon usage records. |
| `/api/shipments/track/:awb` | GET | Nimbus tracking | Public | **PASS** | Fetches live tracking timeline from NimbusPost API. |
| `/api/homepage-books` | GET | Homepage book slider | Public | **PASS** | Dynamic slider records for Volumes 1-9. |
| `/api/settings/store` | GET | Store configuration | Public | **PASS** | Returns store name, contact info, and tax defaults. |

---

## 2. API Endpoint Recommendations & Production Hardening

1. **Uniform Validation:** `POST /api/products` correctly requires `title`, `price`, and `type`.
2. **Normalized Types:** `POST /api/coupons` now accepts case-insensitive type parameters (`percentage` or `Percentage`, `flat` or `Flat`).
3. **No Unhandled Exceptions:** All endpoints wrap database calls in structured `try/catch` blocks returning standard JSON error payloads (`{ message, error }`).


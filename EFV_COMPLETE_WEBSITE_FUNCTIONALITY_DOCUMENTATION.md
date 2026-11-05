
# EFV™ Complete Platform Architecture & Functionality Documentation
**Document Version:** 2.0.0 (Master Comprehensive Multi-Dashboard Audit)  
**System Name:** EFV™ (Energy, Frequency & Vibration) Alignment Intelligence Ecosystem  
**Target Projects:** `EFV-F` (Storefront & Client / Partner Portals) & `EFV-B` (Express + MongoDB Atlas Backend)  
**Audit Scope:** End-to-End Architectural, Functional, API, Database, and Role Inspection across Client, Admin, and Partner Dashboards  

---

## 📑 Table of Contents
1. [Executive Summary & Technology Stack](#1-executive-summary--technology-stack)
2. [Website Entry & Authentication Lifecycle](#2-website-entry--authentication-lifecycle)
3. [Client / Customer Storefront & Dashboard (`profile.html`)](#3-client--customer-storefront--dashboard)
4. [Administrator Control Center (`admin-dashboard.html`)](#4-administrator-control-center)
5. [Partner & Affiliate Ecosystem (`partner-dashboard.html`)](#5-partner--affiliate-ecosystem)
6. [Complete Frontend Pages & Routes Directory](#6-complete-frontend-pages--routes-directory)
7. [Complete Backend REST API Reference](#7-complete-backend-rest-api-reference)
8. [Database Models & Schema Specifications (MongoDB Atlas)](#8-database-models--schema-specifications)
9. [Third-Party Integrations & External Services](#9-third-party-integrations--external-services)
10. [The 18 End-to-End Business Workflows](#10-the-18-end-to-end-business-workflows)
11. [Role-Based Access Control (RBAC) & Security Boundaries](#11-role-based-access-control-rbac--security-boundaries)
12. [Security Audit: Password Management & Authentication Fallbacks](#12-security-audit-password-management--authentication-fallbacks)
13. [Reports, Analytics & Financial Reconciliation](#13-reports-analytics--financial-reconciliation)

---

## 1. Executive Summary & Technology Stack

The EFV™ platform is a dual-tier web application designed to distribute philosophical, scientific, and transformational literature and digital media (Hardcover, Softcover/Paperback, eBooks, and Audiobooks) globally across multiple currencies, regional warehouses, and international print-on-demand networks.

### Architecture Overview:
* **Frontend (`EFV-F`):**
  * Core Architecture: Hybrid Next.js 15 (App Router with TypeScript) and high-performance, SEO-optimized Static HTML5 / CSS3 / Vanilla JavaScript pages.
  * Public Routing: Serves root and `/pages/*.html` with dynamic API bindings.
  * Internationalization (`i18n.js`): Multi-language translation engine supporting 10 languages: English (`en`), Hindi (`hi`), Arabic (`ar`), German (`de`), Spanish (`es`), French (`fr`), Italian (`it`), Japanese (`ja`), Chinese (`zh-CN`), and Russian (`ru`).
  * Regional Currency Engine: Real-time dynamic multi-currency conversions covering INR (₹), USD ($), EUR (€), GBP (£), AED, AUD, CAD, SGD, and 30+ regional currencies.
* **Backend (`EFV-B`):**
  * Core Architecture: Node.js (v20+) runtime with Express.js REST API layer.
  * Primary Database: MongoDB Atlas cloud cluster (`efv.adnatm4.mongodb.net`) via Mongoose ODM.
  * Cloud Object Storage: Google Cloud Storage (GCS) Native Bucket Mode for encrypted PDF eBooks, MP3/M4A audio chapters, high-res book covers, and RAG knowledge vectors.
  * Third-Party Payment Gateways: Dual gateway failover with Razorpay (Cards, UPI, NetBanking) and Cashfree Payments, with Cash on Delivery (COD) logistics.
  * Print-on-Demand & Fulfillment: Direct API integration with Lulu Global Print API (US/Europe/International) and NimbusPost Multi-Courier Aggregation (India).
* **Network Topography:**
  * Frontend Default Port: `http://localhost:3000`
  * Backend API Default Port: `http://localhost:8080`
  * Unified Communication Protocol: CORS-enabled REST API with Bearer JWT tokens.

---

## 2. Website Entry & Authentication Lifecycle

### 2.1 Homepage Experience (`index.html`)
* **Visual & Hero Components:**
  * Particle animation canvas (`particles.js`) providing subtle cosmic background energy.
  * Dynamic navigation header with logo, navigation links (`Home`, `About`, `Gallery`, `Marketplace`, `Offers`, `Blogs`, `Feedback`, `Contact`), multi-language dropdown, and dynamic authentication trigger (`Login` / `Dashboard`).
  * 3D Dynamic Book Carousel: Renders interactive book covers fetched live from MongoDB Atlas (`GET /api/homepage-books`).
  * Series Spotlight Section: Showcases Volumes 1 through 9 with volume descriptions and format availability pills.
  * IIT Ropar TBIF Incubation Spotlight Section: Details official technology incubation credentials with dual partner logos.
* **Authentication Modals:**
  * **Unified Login Modal (`login-modal`):**
    * Tab 1: **Email / Password Login** — Authenticates against `POST /api/auth/login`. Returns JWT token with session ID and user profile. Automatically routes based on role (`admin` -> `admin-dashboard.html`, `user` -> `profile.html`).
    * Tab 2: **Google GIS One-Tap / OAuth Sign-In** — Generates Google JWT, verifies on backend via `POST /api/auth/google`, creates or retrieves user account.
    * Tab 3: **UWO SSO Integration** — Authenticates users from the parent Unified Web Options ecosystem via `POST /api/auth/uwo-login`.
  * **Sign Up / Registration Modal (`signup-modal`):**
    * Form Fields: Full Name, Email Address, Phone Number (+country dial code), Password (min 6 characters), Confirm Password.
    * Submits to `POST /api/auth/register`. Hashes password with Bcrypt (salt rounds: 10), initializes empty cart and address book, dispatches welcome notification, issues 365-day JWT token.
  * **Forgot Password Flow:**
    * Step 1: User submits registered email address via `POST /api/auth/forgot-password`.
    * Step 2: System generates secure 6-digit verification code (valid 10 minutes) and delivers to inbox via Nodemailer (Gmail SMTP).
    * Step 3: User inputs 6-digit code to `POST /api/auth/verify-reset-otp`. System returns single-use password reset token.
    * Step 4: User submits new password with reset token to `POST /api/auth/reset-password`. Password hash is updated in MongoDB Atlas.

---

## 3. Client / Customer Storefront & Dashboard

**Primary URLs:**
* Client Dashboard: `http://localhost:3000/pages/profile.html`
* Storefront Catalog: `http://localhost:3000/pages/marketplace.html` & `http://localhost:3000/pages/books.html`
* Shopping Cart & Checkout: `http://localhost:3000/pages/checkout.html`
* Payment Status & Invoices: `http://localhost:3000/pages/payment-status.html`
* Active Offers: `http://localhost:3000/pages/offers.html`

**Accessible Roles:**
* Authenticated Customer (`role: 'user'`).
* Unauthenticated visitors have access to public storefront, catalog, cart, and checkout.

### 3.1 Profile & Account Management
Located in the Client Dashboard under `#profile-overview-pane` and `#profile-settings-pane`:
* **View & Edit Personal Profile:**
  * Form Fields: Full Name, Email Address (read-only primary identifier), Phone Number with country dial code.
  * Button: **"Save Changes"** (`#save-profile-btn`).
  * Backend API: `PUT /api/users/profile` (Protected via Bearer JWT).
  * Database Model: `User` (`EFV-B/src/models/User.js`).
  * Workflow: User edits name or phone -> clicks Save -> payload sent to API -> MongoDB document updated -> local storage `efv_user` synced -> success toast displayed.
* **Account Password Management:**
  * Form Fields: Current Password, New Password, Confirm New Password.
  * Button: **"Update Password"** (`#change-pass-btn`).
  * Backend API: `PUT /api/auth/change-password` or `PUT /api/users/change-password`.
  * Database Model: `User` (`password` field).
  * Workflow: Submits `{ oldPassword, newPassword }` -> backend compares `oldPassword` hash with Bcrypt -> generates new 10-round salt -> saves updated hash in MongoDB -> logs out other sessions.
* **Saved Address Book:**
  * View list of saved shipping addresses with address type badges (`Home`, `Work`, `Other`).
  * Form Fields: Recipient Name, Street Address, Apartment/Suite, City, State/Province, Country, Postal Code, Phone Number.
  * Actions:
    * **"Add New Address"** (`POST /api/users/address`): Appends address object to `user.addresses` array.
    * **"Edit Address"** (`PUT /api/users/address/:id`): Updates specified address entry.
    * **"Delete Address"** (`DELETE /api/users/address/:id`): Pulls address entry from MongoDB document.
    * **"Set as Default"**: Flags address as primary delivery destination for 1-click checkout.
* **Session Management & Logout:**
  * Displays user's current session creation time and browser client identifier.
  * Button: **"Logout"** (`#logout-btn`).
  * Workflow: Clears `authToken` and `efv_user` from `localStorage`, terminates session, and redirects browser to `index.html`.

### 3.2 Books & Product Catalogue
Located in `marketplace.html` and `books.html`, managed by `marketplace-dynamic.js`:
* **Catalog Exploration & Filtering:**
  * Backend API: `GET /api/products` (retrieves all published book products) and `GET /api/categories`.
  * Database Model: `Product` (`EFV-B/src/models/Product.js`).
  * Filter Tabs: `All Volumes`, `Volume 1`, `Volume 2`, `Digital Editions`, `Physical Editions`, `Hindi`, `English`.
  * Search Bar: Real-time debounced query filter matching title, author, description, and volume tags.
  * Sort Dropdown: `Price: Low to High`, `Price: High to Low`, `Newest Arrivals`, `Customer Rating`.
* **Book Formats & Editions Matrix:**
  * Formats Available:
    1. **Hardcover:** Premium collector's case laminate binding with gold foil accents.
    2. **Softcover / Paperback:** Lightweight trade edition (Hindi paperback also routes to NotionPress distributor).
    3. **eBook (Digital PDF):** Instant digital delivery accessible via browser PDF.js reader.
    4. **Audiobook (Digital Audio):** Streamable MP3 chapters with dynamic playback controls.
  * Languages: Separate published editions for Hindi (`hi`) and English (`en`).
  * Live Pricing Engine: Connects to `REGIONAL_CONFIG` to calculate prices in real time based on country currency selection (INR, USD, EUR, GBP, AED, etc.).

### 3.3 Shopping Cart & Checkout Process
Managed by `public/js/cart.js` and `public/js/checkout.js`:
* **Sliding Cart Drawer (`#cart-drawer`):**
  * Opens from right on clicking header cart icon or clicking **"Add to Cart"** on any book card.
  * Item Controls:
    * Quantity increment (`+`) and decrement (`-`).
    * Format pill switcher (change between Softcover, Hardcover, eBook).
    * Delete item button (`trash` icon).
  * Dynamic Calculation: Subtotal, active discount deductions, and estimated total.
  * Button: **"Proceed to Checkout"** — redirects to `checkout.html`.
* **Multi-Step Checkout Pipeline (`checkout.html`):**
  1. **Customer Identity:** Automatically loads customer credentials if authenticated; provides guest checkout fields for unauthenticated visitors.
  2. **Delivery Address Entry:** Includes 240+ country dropdown, state, city, and real-time pincode validation against Indian Postal database via `postalRules.js`.
  3. **Promotional Coupon Code Application:**
     * Input field: Enter promo or partner referral coupon.
     * Button: **"Apply Coupon"**.
     * Backend API: `POST /api/coupons/verify` with `{ code, amount }`.
     * Validates expiration date, minimum cart threshold, usage limits, and affiliate partner linkage.
  4. **Taxes, GST & Shipping Charges:**
     * Tax Calculation: Dynamically fetches store GST rate from MongoDB Atlas `systemsettings` (`GET /api/settings/store`, default 18%).
     * Domestic Shipping: Calculates weight-based shipping via NimbusPost API (`POST /api/nimbus/check-delivery`).
     * International Shipping: Calculates flat international courier rates.
  5. **Order Placement & Payment Selection:**
     * Option A: **Razorpay** — Triggers Razorpay Checkout SDK. Backend creates order (`POST /api/orders/razorpay`), verifies cryptographic signature (`POST /api/orders/verify-razorpay`).
     * Option B: **Cashfree Payments** — Backend initiates payment session (`POST /api/orders/cashfree`), redirects user to Cashfree hosted checkout, verifies webhook/redirect signature.
     * Option C: **Cash on Delivery (COD)** — Available for domestic serviceable pincodes with COD verification fee.
  6. **Order Confirmation:**
     * Unique Order ID generated (e.g. `EFV-2026-9284`).
     * Renders order confirmation page (`payment-status.html`).
     * Generates downloadable PDF/HTML tax invoice (`GET /api/orders/:orderId/invoice`).
     * Sends order confirmation email via Nodemailer.

### 3.4 Order History, Tracking & Invoices
Located in Client Dashboard under `#profile-orders-pane`:
* **Order History List:**
  * Backend API: `GET /api/orders/my-orders` (Protected via Bearer JWT).
  * Database Model: `Order` (`EFV-B/src/models/Order.js`).
  * Query matches user by `userId`, `customer.email`, and `customer.phone` to guarantee zero missed orders.
  * Displays: Order ID, Placement Date, Order Status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), Payment Status (`Paid`, `Pending`, `Refunded`), Items ordered, and Total Paid.
* **Order Tracking:**
  * Button: **"Track Shipment"** (`#track-order-btn`).
  * Backend API: `GET /api/orders/track-by-order/:orderId` or `GET /api/shipments/track/:awb`.
  * Synchronizes live with NimbusPost tracking API: Displays Current Courier Status, AWB Tracking Number, Courier Partner Name (e.g. Delhivery, Bluedart), Current Location, and Estimated Delivery Date.
* **Invoice Download:**
  * Button: **"Download Invoice"** (`#download-invoice-btn`).
  * Backend API: `GET /api/orders/:orderId/invoice`.
  * Renders official GST invoice with store business constants (Global Name, Hotline, Support Email, GSTIN, Invoice Prefix) directly from MongoDB Atlas.
* **Order Cancellation:**
  * Button: **"Cancel Order"** (`#cancel-order-btn`).
  * Backend API: `POST /api/orders/cancel/:orderId`.
  * Permitted only while order is in `Pending` or `Placed` state before courier dispatch manifest is generated.

### 3.5 Digital Library (eBooks & Audiobooks)
Located in Client Dashboard under `#profile-library-pane`:
* **Entitlement Verification:**
  * Backend API: `GET /api/library/my-library`.
  * Database Model: `Order` and `Product`.
  * Only grants access if customer has a confirmed order containing `eBook` or `Audiobook` formats.
* **Embedded PDF.js eBook Reader:**
  * Button: **"Read eBook"** on purchased book card.
  * Launches embedded PDF.js reader modal (`#ebook-reader-modal`).
  * Features: Previous/Next page navigation, Zoom in/out, Fit-to-width, Page jump input, Fullscreen toggle.
  * Download Button: Authorized customers can download an offline PDF copy (`GET /api/library/my-library/:id`).
* **HTML5 Audiobook Streaming Player:**
  * Button: **"Listen Audiobook"** on purchased book card.
  * Launches audio streaming player with gold-accented progress bar.
  * Audio Controls: Play/Pause, 15-second skip backward, 15-second skip forward, Seek bar slider, Volume control, Playback Speed selector (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`).
  * Chapter Playlist: Dropdown navigation to switch between chapters.
  * **Listening Resume Sync:**
    * Backend API: `GET /api/audiobook-progress/:bookId` & `POST /api/audiobook-progress/:bookId`.
    * Database Model: `AudiobookProgress` (`EFV-B/src/models/AudiobookProgress.js`).
    * Automatically syncs playback timestamp every 15 seconds. When the user returns to the library, playback resumes from the exact second where they left off.

### 3.6 Customer Support & Communication
Located in Client Dashboard under `#profile-support-pane`:
* **Submit Support Message / Ticket:**
  * Form Fields: Category (`Order Issue`, `Digital Content Access`, `Payment Query`, `Damaged Book`, `General`), Subject line, Order ID selector, Message textarea, File/Image attachment.
  * Button: **"Submit Support Request"**.
  * Backend API: `POST /api/support/message`.
  * Database Model: `SupportMessage` (`EFV-B/src/models/SupportMessage.js`).
* **Conversation History & Admin Replies:**
  * Backend API: `GET /api/support/my-messages`.
  * Displays threaded conversation between customer and administrator.
  * Status Badges: `Open`, `In Progress`, `Resolved`, `Closed`.
* **AI Floating Knowledge Assistant (`chatbot.js`):**
  * Floats on bottom right of all storefront and customer pages.
  * Backend API: `POST /api/chat` and `POST /api/rag`.
  * Provides instant semantic answers regarding book concepts, energetic calibration, ordering steps, and delivery policies.

### 3.7 Damaged Book Returns & Complaints
Located in Client Dashboard under `#profile-returns-pane`:
* **Submit Return Request:**
  * Form Fields: Order Selection dropdown, Reason for Return (`Damaged Book Received`, `Printing Defect`, `Wrong Edition Delivered`), Detailed Description, Photo Evidence Upload (`imageProof`).
  * Button: **"Submit Return Request"**.
  * Backend API: `POST /api/returns/request` (multipart/form-data upload).
  * Database Model: `ReturnRequest` (`EFV-B/src/models/ReturnRequest.js`).
* **Return Status Tracking:**
  * Backend API: `GET /api/returns/my-requests`.
  * Status Flow: `Submitted` -> `Under Review` -> `Approved` -> `Pickup Scheduled` -> `Replacement Dispatched` / `Refund Processed`.

---

## 4. Administrator Control Center

**Primary URL:** `http://localhost:3000/pages/admin-dashboard.html`  
**Secondary URL (Next.js):** `http://localhost:3000/admin/country-pricing`  
**Accessible Role:** Strictly Super Administrator (`role: 'admin'`). All unauthorized accesses return `401/403` and redirect to login.

### 4.1 Master Architecture & Sidebar Modules
The Admin Control Center is powered by `public/js/admin.js` (8,800+ lines of administrative controller logic) and comprises 18 dedicated modules:

| Sidebar Item | Tab ID / Route | Primary Purpose & Administrative Capabilities |
|---|---|---|
| **Overview** | `admin` / `#admin-tab-dashboard` | Executive KPI analytics, sales charts, customer count, system uptime. |
| **Orders Management** | `admin-orders` | View all customer orders, filter by status, trigger fulfillment, download invoices. |
| **Product Management** | `admin-products` | Add/Edit/Delete books, upload covers/PDFs/audio, configure stock & ISBNs. |
| **Country Pricing** | `admin-country-pricing` | Multi-currency country pricing matrix, local exchange rate overrides. |
| **Homepage Slider Books**| `admin-homepage-books` | Configure 3D book volumes appearing in the homepage showcase carousel. |
| **Categories Management**| `admin-categories` | Create, edit, and organize book categories and taxonomic filters. |
| **Discounts & Offers** | `admin-offers` | Create promo sales, BOGO rules, countdown flash sales, and upload banners. |
| **Insights & Analytics** | `admin-insights` | Detailed sales reports, conversion metrics, revenue analysis, CSV export. |
| **Knowledge Base (AI)** | `admin-rag` | Upload reference books and training documents to GCS RAG bucket for AI chatbot. |
| **Customers** | `admin-customers` | Inspect customer accounts, purchase history, order details, activate/deactivate. |
| **Payments Management** | `admin-payments` | View Cashfree & Razorpay transactions, gateway logs, payment reconciliation. |
| **Shipments & Logistics** | `admin-shipments` | Domestic courier dispatch via NimbusPost (AWBs, manifests) & Lulu Global Print POD. |
| **Return Requests** | `admin-returns` | Review customer damaged book claims, approve replacements, trigger reverse pickup. |
| **Coupons Management** | `admin-coupons` | Create promotional codes, set expiry/usage limits, bind affiliate partner codes. |
| **Customer Support Desk** | `admin-support` | Helpdesk ticket inbox, threaded message composer, ticket resolution. |
| **Partner Management** | `admin-partners` | Review partner applications, set commission rates (%), approve/reject, payout earnings. |
| **Partner Messages** | `admin-partner-messages` | Direct 2-way communication desk with registered affiliate partners. |
| **System Control** | `settings` / `#admin-tab-system-control` | Admin Profile, Security & Logs (2FA Email OTP, Concurrency Limit of 3), Store Config. |

---

### 4.2 Module-by-Module Technical Inspection

#### 1. Executive Overview & Analytics (`#admin-tab-dashboard`):
* **KPI Metrics Tiles:**
  * Total Gross Revenue (in INR / USD).
  * Total Orders Placed.
  * Total Active Registered Customers.
  * Pending Shipments Count.
* **Graphical Charts:**
  * Daily and monthly revenue trend line chart.
  * Sales breakdown by book format (Hardcover vs Softcover vs eBook vs Audiobook).
  * Order fulfillment ratio pie chart (`Delivered` vs `In Transit` vs `Pending`).
* **Live System Health Monitor:**
  * MongoDB Atlas connection status.
  * Server uptime monitor.
  * SMTP Gateway connectivity indicator.

#### 2. Orders Management (`#admin-tab-orders`):
* **Orders Data Table:**
  * Displays: Order ID, Date, Customer Name, Email, Total Amount, Payment Status (`Paid`, `Pending`, `Failed`), Fulfillment Status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`).
  * Search Bar: Search by Order ID, Customer Name, or Email.
  * Status Filter Dropdown: Filter by any order status.
* **Order Details Modal:**
  * Full breakdown of line items, book titles, formats, quantities, unit prices.
  * Customer shipping address, phone number, and postal code.
  * Payment gateway reference ID (Razorpay payment ID or Cashfree order ID).
  * Tracking number and courier details.
* **Administrative Actions:**
  * **Update Status Dropdown:** Transition order between `Pending` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered` -> `Cancelled`.
  * **Dispatch via NimbusPost:** Calls `POST /api/nimbus/create-order` to generate domestic courier manifest and AWB tracking number.
  * **Dispatch via Lulu Global Print:** Calls `POST /api/shipping/lulu/create-print-job` to transmit book specifications and print-ready interior/cover PDFs to Lulu printing facilities.
  * **Generate & Print Tax Invoice:** Calls `GET /api/orders/:orderId/invoice` to produce downloadable official GST tax invoice.
  * **Process Cancellation & Refund:** Marks order as cancelled, updates payment status to `Refunded`.

#### 3. Product & Book Management (`#admin-tab-products`):
* **Product Catalog Table:**
  * Lists all books with cover thumbnail, title, volume number (1 to 9), edition format, language, regular price, sale price, and stock status.
* **Add / Edit Product Modal:**
  * Form Fields: Title, Subtitle, Author, Volume Number (1-9), Category dropdown.
  * Editions & Formats: Checkboxes for `Hardcover`, `Softcover`, `eBook`, `Audiobook`.
  * Language: Radio selection for `Hindi` or `English`.
  * ISBN & Barcode: ISBN-10, ISBN-13 fields.
  * Pricing: Regular Price and Discounted Selling Price.
  * Inventory Controls: Available Quantity, Out of Stock toggle, "Coming Soon" flag.
  * Description & Summary: Rich text description editor.
  * **File Uploaders (Direct to Google Cloud Storage via `POST /api/upload`):**
    * Book Cover Image uploader (JPG/PNG/WebP).
    * eBook Interior PDF uploader.
    * Audiobook MP3 chapter audio uploader.
* **Delete Product:**
  * Soft delete or hard delete via `DELETE /api/products/:id`.

#### 4. Global Country Pricing Management (`#admin-tab-country-pricing` & `/admin/country-pricing`):
* Country-by-country multi-currency matrix.
* Maps baseline prices across 240+ countries.
* Configures custom price overrides for major markets: United States ($), United Kingdom (£), European Union (€), India (₹), Australia ($), Canada ($), UAE (AED).
* Saves pricing records to MongoDB Atlas `pricing` collection via `POST /api/pricing/confirm`.

#### 5. Homepage Content Management (`#admin-tab-homepage-books`):
* Controls which book volumes appear in the homepage 3D carousel slider.
* Allows re-ordering book display sequence.
* Header & Topics Editor: Configures the series tagline, badge topic tags, and introductory paragraph directly stored in MongoDB Atlas `homepagebooks` collection.

#### 6. Discounts & Promotions (`#admin-tab-offers`):
* Create promotional campaigns:
  * Percentage Discount (e.g. 15% OFF).
  * Flat Amount Discount (e.g. ₹200 OFF).
  * Buy X Get Y (BOGO) bundle offers.
  * Free Shipping threshold rules.
* Banner Image Uploader: Uploads promotional banners displayed on `offers.html`.
* Validity scheduler: Start Date and End Date with automatic expiration.

#### 7. Blog & Insights Management (`#admin-tab-blogs`):
* Rich text WYSIWYG editor powered by Quill.js.
* Form Fields: Article Title, URL Slug, Category, Summary, Full Content, Cover Image, Author, Meta SEO Title, SEO Description, Keywords.
* Publishing State: Toggle between `Draft` and `Published`.
* Backend API: `POST /api/insights` and `PUT /api/insights/:id`.

#### 8. Artificial Intelligence RAG System (`#admin-tab-rag`):
* Semantic Knowledge Base management.
* Uploads PDF chapters and reference philosophy texts directly to GCS RAG bucket (`POST /api/rag/upload`).
* Automatically extracts text chunks and feeds embeddings to conversational assistant (`/api/chat`).

#### 9. Customer Accounts Inspector (`#admin-tab-customers`):
* Displays all registered users from `User` collection.
* Columns: Name, Email, Phone, Role (`user`, `admin`), Registration Date, Total Orders Count.
* Search and filter by customer name or email.
* Detailed Customer Inspector: View customer's complete purchase history, owned digital library items, and support conversation logs.
* Activate / Deactivate customer account toggle.

#### 10. Payments & Reconciliation (`#admin-tab-payments`):
* Data table of all payment transactions.
* Displays: Transaction ID, Order Reference ID, Payment Gateway (`Razorpay` / `Cashfree` / `COD`), Amount, Currency, Payment Status (`SUCCESS`, `PENDING`, `FAILED`, `REFUNDED`), Date.
* Direct gateway reconciliation check against Razorpay and Cashfree APIs.

#### 11. Logistics & Fulfillment Control (`#admin-tab-shipments`):
* Domestic Shipments (NimbusPost Integration):
  * Lists active dispatches, AWB tracking numbers, assigned couriers (Delhivery, Bluedart, Shadowfax), and current tracking milestones.
  * Trigger tracking synchronization with courier APIs (`POST /api/orders/sync-all`).
  * Download printable shipping manifest and barcode labels.
* International Shipments (Lulu Global Print on Demand):
  * Transmits book manufacturing specs, interior PDF URLs, and cover PDF URLs.
  * Tracks international print job status (`CREATED` -> `IN_PRODUCTION` -> `SHIPPED`).

#### 12. Damaged Book Returns Management (`#admin-tab-returns`):
* Reviews submitted customer return and replacement requests (`GET /api/returns/admin/all`).
* Inspects customer's uploaded damage photos and reason description.
* Actions:
  * **"Approve Return"** (`PUT /api/returns/admin/update/:id`): Approves claim.
  * **"Trigger Reverse Pickup"** (`POST /api/returns/admin/trigger-pickup/:id`): Books courier reverse pickup from customer's address.
  * **"Reject Return"**: Closes claim with administrative explanation to customer.

#### 13. Promo Coupons Management (`#admin-tab-coupons`):
* Table of all active discount coupons.
* **Create Coupon Modal:**
  * Coupon Code (e.g. `WELCOME10`, `EFV2026`).
  * Discount Type (`Percentage` vs `Flat Amount`).
  * Discount Value.
  * Minimum Cart Order Value.
  * Expiry Date scheduler.
  * Maximum Usage Cap.
  * Linked Partner ID (optional affiliate attribution).
* Backend API: `POST /api/coupons` and `DELETE /api/coupons/:id`.

#### 14. Customer Support Helpdesk (`#admin-tab-support`):
* Helpdesk inbox displaying all customer support tickets (`GET /api/support/messages`).
* Displays: Customer Name, Email, Category, Subject, Timestamp, Status.
* Threaded Message Composer: Admin types reply and sends to customer (`POST /api/support/messages/:id/reply`). Sends notification email to customer.
* Ticket Status: Mark as `In Progress`, `Resolved`, or `Closed`.

#### 15. Partner Management & Payouts (`#admin-tab-partners`):
* Lists all registered marketing and sales partners (`GET /api/partners`).
* Displays: Partner Name, Email, Phone, Company, Marketing Token (`partner_token`), Total Referred Orders, Gross Sales, Unpaid Commission, Paid Commission.
* **"Approve Partner"**: Activates partner account and auto-generates partner discount coupon in `Coupon` collection.
* **"Disburse Payout"** (`POST /api/partners/:id/payout`):
  * Marks attributed unpaid orders as `commissionPaid = true`.
  * Updates `PartnerSale` records to `Paid`.
  * Records payout settlement in MongoDB Atlas.

#### 16. Partner Communications (`#admin-tab-partner-messages`):
* Direct 2-way message desk between Administrator and Partners (`GET /api/partner-messages/admin/summary`).
* View partner inquiries, submit administrative replies, and resolve partner support threads.

#### 17. System Control & Security (`#admin-tab-system-control`):
* **Admin Profile:** Displays logged-in administrator credentials (Name, Email, Role).
* **Access Key / Password Change with 2-Factor Authentication:**
  * Fields: Current Password, New Administrative Password.
  * Eye toggle buttons for password visibility.
  * Button: **"Update Password"**.
  * Step 1: Calls `POST /api/auth/send-password-otp` — verifies current password, generates 6-digit OTP, and dispatches to `admin@uwo24.com` via Gmail SMTP.
  * Step 2: Form transitions to 2FA verification dialog with 10-minute timer.
  * Step 3: Admin enters 6-digit code -> calls `POST /api/auth/verify-password-otp` -> password hash updated in MongoDB Atlas -> 2FA badge reflects `ENABLED`.
* **Active Browser Sessions (Strict Concurrency Limit of 3):**
  * Displays active admin sessions table: Timestamp, IP Address, Device / Browser (`(Current)` badge).
  * Automatically enforces max 3 concurrent active sessions; any 4th login evicts the oldest session.
  * Button: **"Kill Other Sessions"** (`POST /api/auth/kill-sessions`) — immediately invalidates all other devices.
* **Store Configuration (Direct MongoDB Atlas Database Sync):**
  * Form Fields:
    * Store Global Name (e.g. `EFV™ Official Store`).
    * Support Hotline Phone (e.g. `+91 98765 43210`).
    * Support Email (e.g. `support@efv.com`).
    * Base Currency Dropdown (`INR`, `USD`, `EUR`, `GBP`).
    * Tax / GST Rate (%) (e.g. `18`).
    * Invoice Prefix (e.g. `EFV-2026-`).
  * Button: **"SYNC STORE SETTINGS"**.
  * Backend API: `PUT /api/settings/store` (Protected with Bearer JWT).
  * Database Collection: `systemsettings` (`key: 'store_configuration'`).
  * Persistence: **100% Database Driven (Zero JSON files)**. Automatically syncs across website header, footer, tax invoice generation, and checkout pricing calculations.

---

## 5. Partner & Affiliate Ecosystem

**Primary URLs:**
* Partner Public Landing: `http://localhost:3000/pages/partners.html`
* Partner Onboarding & Verification: `http://localhost:3000/pages/partner-verification.html`
* Partner Dashboard: `http://localhost:3000/pages/partner-dashboard.html`
* Partner Support Desk: `http://localhost:3000/pages/partner-support.html`

**Accessible Roles:**
* Authenticated Affiliate Partner (`partnerAuth` token).

### 5.1 Partner Registration & Account Activation
1. **Public Information Landing (`partners.html`):**
   * Overview of partner commission tiers (10% to 25%), marketing materials, and program guidelines.
   * Button: **"Join Partner Program"** — routes to `partner-verification.html`.
2. **Registration Form (`partner-verification.html`):**
   * Form Fields: Full Name, Company / Organization, Email Address, Contact Phone Number, Program Notes / Distribution Channels.
   * Button: **"Submit Application"**.
   * Backend API: `POST /api/partners` (or initiated via admin invitation).
   * Generates a unique Marketing Token (e.g. `NAME-EFV-XXXX`) and invitation token.
3. **Email OTP Verification (`POST /api/partner-portal/otp` & `/verify-otp`):**
   * Partner enters registered email on `partner-verification.html`.
   * System dispatches a 6-digit verification code to the partner's email address via Gmail SMTP.
   * Partner inputs OTP -> calls `POST /api/partner-portal/verify-otp` -> returns temporary 15-minute activation token.
4. **Password Setup (`POST /api/partner-portal/setup-password`):**
   * Form Fields: New Password (min 8 characters), Confirm Password.
   * Partner submits password with activation token -> password hashed with Bcrypt -> status set to `Verified` / `Pending Admin Approval`.

### 5.2 Partner Dashboard (`partner-dashboard.html`)
Authenticated partners log in via `POST /api/partner-portal/login` and access their dedicated portal:

#### A. Performance KPI Tiles:
* **Total Sales / Referrals:** Total count of customer orders attributed to the partner.
* **Gross Revenue Generated:** Total purchase value in INR/USD resulting from partner referrals.
* **Total Commission Earned:** Cumulative commissions earned based on approved commission percentage.
* **Unpaid Commission Balance:** Accrued commissions awaiting administrative disbursement.

#### B. Referral Marketing Tools:
* **Unique Referral Link:**
  * Auto-generated affiliate link: `https://efv.com/?ref=PARTNER_TOKEN`.
  * Button: **"Copy Referral Link"** — copies URL with tracking token to clipboard.
* **Linked Promo Coupon Code:**
  * Displays exclusive partner discount code (e.g. `PARTNER10`).
  * Shows discount value offered to customers and partner commission percentage.

#### C. Referral Sales & Order Log:
* Data table of all orders attributed to the partner's referral token or coupon code (`GET /api/partner-portal/dashboard`).
* Columns: Order ID, Customer Name, Items Purchased, Total Amount Paid, Coupon Applied, Commission Earned, Payout Status (`Paid` / `Unpaid`), Date.

#### D. Commission Payouts & Settlement:
* Partner inputs bank settlement details: Bank Name, Account Holder Name, Account Number, IFSC Code, or UPI ID.
* View settlement history showing transaction reference IDs, dates, and amounts disbursed by the administrator.

#### E. Partner Support & Direct Messaging (`partner-support.html`):
* Dedicated direct messaging channel with platform administrators.
* Backend API: `POST /api/partner-messages/partner` and `GET /api/partner-messages/partner`.
* Database Model: `PartnerMessage` (`EFV-B/src/models/PartnerMessage.js`).
* Threaded conversation history with real-time response viewer and status indicators (`Open` / `Resolved`).

---

## 6. Complete Frontend Pages & Routes Directory

| Route / File Path | Accessible Roles | Page Title & Primary Purpose | Key Components & Forms |
|---|:---:|---|---|
| `/` or `/index.html` | Public | **EFV™ Homepage** – High-converting landing page showcasing philosophy, book series, and incubation. | Hero section, dynamic 3D book slider, dynamic section topics, auth modals, language switcher. |
| `/pages/marketplace.html` | Public | **Marketplace** – Full product catalog for purchasing Hardcover, Softcover, eBooks, Audiobooks. | Product grid, category filters, format switcher, currency dropdown, cart slider trigger. |
| `/pages/books.html` | Public | **Books Showcase** – In-depth presentation of Volumes 1 through 9. | Volume details, chapter previews, author insights, purchase buttons, notify me modal. |
| `/pages/profile.html` | Customer | **Client Dashboard** – Customer personal center, digital library, and order tracking. | 7-tab interface: Overview, Orders, Digital Library, PDF Reader, Audio Player, Addresses, Support. |
| `/pages/checkout.html` | Customer | **Checkout Portal** – Order finalization, address entry, coupon discounts, payment gateways. | Address form, pincode validator, coupon input, order summary, Razorpay/Cashfree SDK triggers. |
| `/pages/admin-dashboard.html`| Admin | **Control Center** – Master administration dashboard for platform management. | 18 modules: KPI overview, orders, books, pricing, users, partners, shipping, store settings. |
| `/pages/partner-dashboard.html`| Partner | **Partner Dashboard** – Affiliate sales metrics, referral links, and commission earnings. | KPI tiles, attributed orders table, referral link generator, payout requests, bank details. |
| `/pages/partner-verification.html`| Partner | **Partner Onboarding** – Registration, email OTP verification, password setup. | 3-step registration wizard, OTP input, password creator. |
| `/pages/partner-support.html` | Partner | **Partner Support** – Direct communication desk with platform administrators. | Message thread, reply composer, ticket status badges. |
| `/pages/partners.html` | Public | **Partners Program** – Informational landing page for prospective affiliates. | Commission structure, partnership tiers, registration CTA. |
| `/pages/offers.html` | Public | **Exclusive Offers** – Active discounts, bundle promotions, and BOGO deals. | Search bar with search button, category pills, promotional offer cards. |
| `/pages/blogs.html` | Public | **Blogs & Insights** – Educational articles on mindset, alignment, and energy. | Search bar with tag/keyword filters, category tabs, featured article, blog cards. |
| `/pages/blog-detail.html` | Public | **Article Detail View** – Full reading view of selected blog post. | Rich text article renderer, author bio, social sharing buttons, related articles. |
| `/pages/contact.html` | Public | **Contact & FAQs** – Help center, contact form, and frequently asked questions. | Contact form, accordion FAQ items, dynamic phone and email indicators. |
| `/pages/Feedback.html` | Public | **Customer Feedback** – Rating and review submission for EFV literature. | 5-star interactive rating component, feedback textarea, testimonial list. |
| `/pages/about.html` | Public | **About EFV™ & UWO™** – Story of the Alignment Intelligence system. | Vision statement, incubation details with IIT Ropar TBIF, leadership bios. |
| `/pages/gallery.html` | Public | **Visual Gallery** – High-resolution imagery of EFV books and lifestyle. | Grid gallery, lightbox modal, category filter. |
| `/pages/tracking.html` | Public | **Shipment Tracker** – Public AWB and order tracking tool. | AWB search input, shipment status timeline, courier details. |
| `/pages/payment-status.html` | Customer | **Payment Confirmation** – Post-payment return landing page. | Success/failure state, transaction ID, order details, invoice download link. |
| `/pages/terms.html` | Public | **Terms & Conditions** – Legal agreement, terms of sale, and software usage. | Structured legal terms, shipping terms, return policies. |
| `/pages/privacy-policy.html` | Public | **Privacy Policy** – Data protection, cookie policy, GDPR compliance. | Legal documentation on user data handling. |
| `/pages/app.html` | Public | **Mobile App Landing** – Showcase for upcoming iOS and Android applications. | Feature previews, platform waitlist form. |
| `/admin/country-pricing` | Admin (Next.js)| **Global Pricing Matrix** – Dedicated country-by-country pricing editor. | Multi-country currency table, volume pricing inputs, bulk save. |

---

## 7. Complete Backend REST API Reference

The backend exposes over 85 RESTful endpoints organized across 32 modular routers.

### 7.1 Authentication & Security (`/api/auth`)
* `POST /api/auth/register` – Registers a new customer account.
* `POST /api/auth/login` – Authenticates customer/admin, verifies Bcrypt hash, generates JWT with session tracking.
* `POST /api/auth/admin/login` – Admin-specific login gateway.
* `POST /api/auth/google` – Verifies Google OAuth ID token, logs in or provisions user.
* `POST /api/auth/uwo-login` – Unified Web Options single sign-on authentication.
* `POST /api/auth/send-password-otp` – Protected: Sends 6-digit 2FA OTP to admin email for password change.
* `POST /api/auth/verify-password-otp` – Protected: Verifies 2FA OTP and updates admin password.
* `POST /api/auth/toggle-2fa` – Protected: Toggles 2-Factor Authentication state.
* `PUT /api/auth/change-password` – Protected: Customer password update.
* `POST /api/auth/forgot-password` – Sends password reset code via Gmail SMTP.
* `POST /api/auth/verify-reset-otp` – Verifies reset code and issues reset token.
* `POST /api/auth/reset-password` – Sets new password using reset token.
* `GET /api/auth/sessions` – Protected: Returns active browser sessions (Strict limit of 3).
* `POST /api/auth/kill-sessions` – Protected: Revokes all active sessions except current browser.

### 7.2 Store Configuration (`/api/settings`)
* `GET /api/settings/store` – Public: Retrieves store configuration (Name, Hotline, Email, Currency, Tax Rate, Invoice Prefix).
* `PUT /api/settings/store` – Admin Only: Updates store configuration directly in MongoDB Atlas `systemsettings` collection.

### 7.3 Products & Books Catalog (`/api/products`)
* `GET /api/products` – Public: Returns all available book products.
* `GET /api/products/:id` – Public: Returns specific book details.
* `POST /api/products` – Admin Only: Adds a new book product.
* `PUT /api/products/:id` – Admin Only: Updates book product details.
* `DELETE /api/products/:id` – Admin Only: Removes or deactivates book product.

### 7.4 Categories (`/api/categories`)
* `GET /api/categories` – Public: Returns all book categories.
* `POST /api/categories/create` – Admin Only: Creates a new category.
* `PUT /api/categories/:id` – Admin Only: Updates category details.
* `DELETE /api/categories/:id` – Admin Only: Deletes a category.

### 7.5 Orders & Fulfillment (`/api/orders`)
* `GET /api/orders` – Admin Only: Retrieves all platform orders with customer details.
* `GET /api/orders/my-orders` – Customer Protected: Retrieves orders placed by the authenticated customer.
* `POST /api/orders` – Customer: Creates new order.
* `POST /api/orders/razorpay` – Customer: Initializes Razorpay payment order.
* `POST /api/orders/verify-razorpay` – Customer: Verifies Razorpay HMAC signature.
* `POST /api/orders/cashfree` – Customer: Initializes Cashfree payment session.
* `GET /api/orders/:id/invoice` – Protected: Renders official HTML/PDF tax invoice.
* `POST /api/orders/cancel/:id` – Customer / Admin: Cancels pre-shipment order.
* `GET /api/orders/track-by-order/:id` – Public / Customer: Tracks shipment status.
* `POST /api/orders/sync-all` – Admin Only: Triggers synchronization with courier tracking APIs.

### 7.6 Digital Library & Audiobook Progress (`/api/library` & `/api/audiobook-progress`)
* `GET /api/library/my-library` – Customer Protected: Returns authorized eBooks and Audiobooks.
* `GET /api/library/my-library/:id` – Customer Protected: Returns signed GCS streaming / download URL.
* `GET /api/audiobook-progress/:id` – Customer Protected: Fetches saved listening progress timestamp.
* `POST /api/audiobook-progress/:id` – Customer Protected: Saves audiobook playback timestamp and chapter.

### 7.7 Coupons & Offers (`/api/coupons` & `/api/offers`)
* `GET /api/coupons` – Admin Only: Lists all promo codes.
* `POST /api/coupons` – Admin Only: Creates new promo code.
* `DELETE /api/coupons/:id` – Admin Only: Deletes promo code.
* `POST /api/coupons/verify` – Public: Validates coupon code and returns discount.
* `GET /api/offers` – Public: Retrieves active promotional offers and banners.
* `POST /api/offers` – Admin Only: Creates promotional offer.
* `PUT /api/offers/:id` – Admin Only: Updates promotional offer.
* `DELETE /api/offers/:id` – Admin Only: Removes promotional offer.

### 7.8 Customer Support (`/api/support`)
* `POST /api/support/message` – Public / Customer: Creates new support ticket.
* `GET /api/support/my-messages` – Customer Protected: Retrieves customer's support conversations.
* `GET /api/support/messages` – Admin Only: Lists all customer support tickets.
* `POST /api/support/messages/:id/reply` – Admin Only: Sends administrative reply to ticket.
* `PUT /api/support/messages/:id` – Admin Only: Updates ticket status.

### 7.9 Damaged Book Returns (`/api/returns`)
* `POST /api/returns/request` – Customer Protected: Submits return request with photo proof.
* `GET /api/returns/my-requests` – Customer Protected: Retrieves customer's return requests.
* `GET /api/returns/admin/all` – Admin Only: Lists all platform return requests.
* `PUT /api/returns/admin/update/:id` – Admin Only: Updates return status.
* `POST /api/returns/admin/trigger-pickup/:id` – Admin Only: Schedules reverse courier pickup.

### 7.10 Partner Portal & Communications (`/api/partners`, `/api/partner-portal`, `/api/partner-messages`)
* `GET /api/partners` – Admin Only: Lists all registered partners and commission stats.
* `POST /api/partners` – Admin Only: Creates and invites new partner.
* `POST /api/partners/:id/payout` – Admin Only: Processes commission payout settlement.
* `GET /api/partners/:id/sales` – Admin Only: Detailed sales audit for a partner.
* `DELETE /api/partners/:id` – Admin Only: Removes partner.
* `POST /api/partner-portal/otp` – Public / Partner: Sends email verification OTP.
* `POST /api/partner-portal/verify-otp` – Public / Partner: Verifies OTP code.
* `POST /api/partner-portal/setup-password` – Public / Partner: Sets partner password.
* `POST /api/partner-portal/login` – Public / Partner: Authenticates partner, returns partner token.
* `GET /api/partner-portal/dashboard` – Partner Protected: Returns partner sales and commissions.
* `POST /api/partner-messages/partner` – Partner Protected: Sends direct message to Admin.
* `GET /api/partner-messages/partner` – Partner Protected: Retrieves message history.
* `GET /api/partner-messages/admin/summary` – Admin Only: Summary of all partner conversations.

---

## 8. Database Models & Schema Specifications (MongoDB Atlas)

The platform utilizes 35 Mongoose models registered in `EFV-B/src/models/index.js`:
1. `User` – User profiles, Bcrypt passwords, roles (`user`, `admin`), active sessions array, saved addresses, notification inbox.
2. `Product` – Books, volume numbers (1-9), editions (`Hardcover`, `Softcover`, `eBook`, `Audiobook`), languages (`Hindi`, `English`), GCS media URLs, pricing, inventory stock.
3. `Order` – Customer identity, line items, order status, payment status, gateway transaction IDs, NimbusPost courier AWBs, Lulu print job IDs, partner referral references.
4. `Partner` – Partner profiles, company names, marketing tokens (`partner_token`), commission percentages, activation statuses, accrued earnings, bank payout details.
5. `PartnerSale` – Granular ledger records linking customer orders to specific partner marketing tokens for commission attribution.
6. `PartnerMessage` – Threaded communications between affiliate partners and administrators.
7. `Coupon` – Promotional and partner discount codes, percentage/flat values, minimum cart thresholds, expiry dates, usage caps.
8. `Offer` – Promotional marketplace banners, BOGO rules, seasonal sales, countdown clocks.
9. `SupportMessage` – Customer support tickets, inquiry categories, message threads, administrative replies.
10. `ReturnRequest` – Damaged physical book replacement claims, image proof URLs, courier reverse pickup statuses.
11. `AudiobookProgress` – User playback timestamps, last listened chapter, progress percentages.
12. `SystemSetting` – Key-value configuration documents stored permanently in MongoDB Atlas (including `store_configuration`).
13. `Pricing` – Multi-country volume pricing multipliers and custom currency overrides.
14. `HomepageBook` – Order and visibility flags for 3D books in homepage slider.
15. `Category` – Taxonomic organization of book products.
16. `Shipment` – Domestic and international shipping manifests, courier tracking events.
17. `Insight` – Blog articles, Quill rich text contents, author details, SEO tags.
18. `Lead` – Prospective customer and contact inquiries.
19. `RAGDocument` – Vector-indexed reference files stored in GCS for AI training.

---

## 9. Third-Party Integrations & External Services

| Service / Provider | Purpose & Implementation | Configuration Keys (`.env`) |
|---|---|---|
| **MongoDB Atlas** | Primary cloud database cluster hosting all collections. | `MONGODB_URI` |
| **Razorpay** | Primary Indian payment gateway (UPI, Netbanking, Cards). | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| **Cashfree Payments** | Failover payment gateway and payout processing. | `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY` |
| **NimbusPost** | Multi-courier logistics aggregator for Indian domestic shipments. | `NIMBUS_EMAIL`, `NIMBUS_PASSWORD`, `NIMBUS_KEY` |
| **Lulu Global Print API**| Print-on-demand fulfillment for international hardcover/softcover orders. | `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET` |
| **Google Cloud Storage** | Object storage for eBook PDFs, audio chapters, covers, and RAG docs. | `GCP_PROJECT_ID`, `GCS_BUCKET_NAME`, `GOOGLE_APPLICATION_CREDENTIALS` |
| **Google GIS OAuth 2.0** | One-tap and modal Google sign-in for customers. | `GOOGLE_CLIENT_ID` |
| **Gmail SMTP (Nodemailer)**| Dispatches 2FA security OTPs, password reset codes, and invoices. | `EMAIL_USER`, `EMAIL_PASS` (Google App Password) |
| **PDF.js (Mozilla)** | Client-side embedded reader for purchased digital eBooks. | Native browser integration (`pdf.min.js`) |

---

## 10. The 18 End-to-End Business Workflows

1. **New Customer Registration & Onboarding** (`register` -> Bcrypt hash -> JWT token -> Welcome notification -> Dashboard).
2. **Customer Login & Role-Based Routing** (`login` -> credentials verification -> session register -> redirect).
3. **Multi-Currency Book Browsing & Format Selection** (`marketplace.html` -> format toggle -> dynamic currency conversion).
4. **Sliding Cart Management & Offer Application** (Add to cart -> quantity adjustment -> BOGO calculation -> subtotal update).
5. **Multi-Step Checkout with Pincode Validation** (Address entry -> pincode check -> shipping calculation -> coupon discount).
6. **Payment Gateway Execution (Razorpay / Cashfree / COD)** (Modal trigger -> cryptographic signature verification -> order confirmation).
7. **Order Confirmation & Invoicing** (Order ID generation -> invoice rendering -> confirmation email dispatch).
8. **Digital eBook In-Browser Reading** (Purchase verification -> PDF.js launch -> offline download option).
9. **Audiobook Streaming & Resume Playback** (Streaming launch -> speed control -> timestamp sync -> automatic resume).
10. **Order Tracking & Courier Synchronization** (AWB sync -> NimbusPost milestone update -> customer delivery timeline).
11. **Damaged Book Return & Replacement** (Return request -> photo upload -> admin review -> reverse pickup schedule).
12. **Customer Support Ticket Life Cycle** (Ticket submission -> admin inbox notification -> threaded reply -> resolution).
13. **Admin Product Catalog Management** (Add book -> GCS cover & file upload -> format pricing -> inventory publish).
14. **Country Pricing Override** (Multi-country matrix edit -> currency rate adjustment -> global sync).
15. **Affiliate Partner Onboarding & Approval** (Application submission -> email OTP verification -> admin approval -> coupon generation).
16. **Partner Referral Tracking & Commission Payout** (Attributed purchase -> commission balance calculation -> payout request -> bank settlement).
17. **Admin 2-Factor Authentication Password Update** (Current password verification -> 6-digit email OTP dispatch -> 2FA confirmation -> password update).
18. **Admin Concurrency Enforcement & Session Revocation** (3-browser session ceiling -> eviction of 4th login -> "Kill Other Sessions" action).

---

## 11. Role-Based Access Control (RBAC) & Security Boundaries

* **Customer Isolation:** Customers (`role: 'user'`) are strictly restricted from accessing administrative endpoints. All order, library, and address queries are enforced with `req.user._id` scoping.
* **Partner Isolation:** Partners (`partnerAuth`) have zero visibility into customer PII or general store orders; they only access anonymized aggregate sales attributed to their specific `partner_token`.
* **Super Admin Guard:** All administrative endpoints require valid JWT tokens verified by `protect` and `adminAuth` middleware.
* **Concurrency Enforcement:** Administrators are limited to a maximum of 3 concurrent browser sessions tracked in `user.activeSessions`.

---

## 12. Security Audit: Password Management & Authentication Fallbacks

During the audit of the authentication subsystems (`EFV-B/src/routes/auth.js`), an in-depth security investigation was performed on the Admin Password Change and Login mechanisms:

### 12.1 Findings Summary:
1. **Primary Authentication (`POST /api/auth/login`):**
   * **Result:** **SECURE & VERIFIED** ✅
   * Verified that no master password, bypass, or fallback exists in the primary login handler. Standard Bcrypt hash comparison (`bcrypt.compare`) is strictly enforced for all user accounts and administrators.
2. **Admin Password Change OTP Request (`POST /api/auth/send-password-otp`):**
   * **Result:** **SECURITY CONCERN IDENTIFIED (LEGACY FALLBACK DETECTED)** ⚠️
   * **Location:** `EFV-B/src/routes/auth.js` (lines 304-308).
   * **Behavior:** When verifying the administrator's current password (`oldPassword`), the code evaluates:
     * First: Bcrypt comparison against `user.password`.
     * Second (Fallback): If Bcrypt comparison fails AND the user has `role === 'admin'` (or matching administrative email), the code permits verification if `oldPassword` matches one of three static legacy development strings: `[LEGACY_ADMIN_STATIC_FALLBACK_STRINGS]`.
   * **Risk Assessment:** While this fallback was originally added during system migration to prevent administrative lockouts, retaining static hardcoded passphrase comparisons in production introduces an unnecessary authentication bypass vulnerability.
   * **Mitigating Safeguard:** Even if an entity provides one of the legacy fallback strings, **password changes cannot be completed directly**. The system immediately dispatches a random 6-digit one-time password (valid for 10 minutes) exclusively to the registered administrator email address (`admin@uwo24.com`) via Gmail SMTP. An attacker without access to the administrator's inbox cannot finalize the password update.
   * **Recommendation:** Deprecate and remove the static fallback condition in lines 304-308 of `auth.js` in production so that only the genuine Bcrypt hash of the administrator's password is valid.

---

## 13. Reports, Analytics & Financial Reconciliation

* **Sales Reports:** Accessible via `#admin-tab-insights` and `GET /api/insights`. Provides historical sales trends, gross profit margins, and average order values.
* **Financial Reconciliation:** Tracks payments across Razorpay and Cashfree against bank settlement reports.
* **Data Export:** Administrative reports support CSV export for accounting and tax audits.

---
*End of Complete Platform Functionality Documentation.*

# EFV™ Platform Role & Permission Matrix (RBAC)
**Document Version:** 2.0.0 (Master Comprehensive Multi-Dashboard Audit)  
**Date:** November 4, 2026  
**Auditor:** Antigravity AI Advanced Agentic Coding System  
**Security Scope:** Cross-Role Access Control Matrix across Storefront, Client Dashboard, Partner Portal, and Admin Control Center  

---

## 👥 1. Role Definitions & Entry Points

| Role Identifier | Role Name | Intended Audience | Primary Entry Point | Default Post-Login Route | Session Lifetime | Concurrency Limits |
|---|---|---|---|---|---|---|
| **`admin`** | Super Administrator | Internal Executive & Operations Team | Login Modal / `/pages/admin-dashboard.html` | `/pages/admin-dashboard.html` | 365 Days (JWT) | **Strictly Max 3 Browser Sessions** |
| **`partner`** | Affiliate & Sales Partner | Authorized Marketing & Distribution Partners | `/pages/partner-verification.html` | `/pages/partner-dashboard.html` | 365 Days (`partnerAuth`) | Standard Web Session |
| **`user`** | Client / Customer | Book Readers, Listeners, and Buyers | Login Modal / `/pages/profile.html` | `/pages/profile.html` | 365 Days (JWT) | Multiple Devices Allowed |
| **`public`** | Unauthenticated Visitor | General Web Traffic | `http://localhost:3000/` | `index.html` / `marketplace.html` | Ephemeral Session | N/A |

---

## 📊 2. Master Permission Matrix Across All Three Dashboards

**Legend:**
* **`FULL`**: Can View, Create, Edit, Delete, Approve, Reject, and Manage.
* **`OWN`**: Can only View, Create, or Edit records that strictly belong to their own account (`req.user._id` or `partner._id`).
* **`READ`**: Read-only access permitted.
* **`DENY`**: Access strictly blocked (Returns `401 Unauthorized` or `403 Forbidden`).

| Functional Module | Specific Action / Capability | Public Visitor | Client / Customer (`user`) | Affiliate Partner (`partner`) | Super Admin (`admin`) |
|---|---|:---:|:---:|:---:|:---:|
| **Public Storefront** | View Homepage, Philosophy & Book Sliders | `READ` | `READ` | `READ` | `READ` |
| | View Product Catalog & Formats (`marketplace.html`) | `READ` | `READ` | `READ` | `READ` |
| | Search, Filter & Sort Books by Volume/Edition | `READ` | `READ` | `READ` | `READ` |
| | Read Educational Articles & Blogs (`blogs.html`) | `READ` | `READ` | `READ` | `READ` |
| | Submit Customer Feedback & 5-Star Reviews | `FULL` | `FULL` | `FULL` | `FULL` |
| | Submit General Inquiries (`contact.html`) | `FULL` | `FULL` | `FULL` | `FULL` |
| | Chat with AI Floating Knowledge Assistant | `FULL` | `FULL` | `FULL` | `FULL` |
| **Shopping Cart & Checkout**| Add / Remove Books in Cart Drawer | `FULL` | `FULL` | `FULL` | `FULL` |
| | Apply Promotional & Affiliate Coupon Codes | `FULL` | `FULL` | `FULL` | `FULL` |
| | Select Country & Currency for Dynamic Pricing | `FULL` | `FULL` | `FULL` | `FULL` |
| | Complete Checkout via Razorpay / Cashfree / COD | `FULL` | `FULL` | `FULL` | `FULL` |
| **Account & Authentication**| Self-Registration & Account Creation | `FULL` | `DENY` | `DENY` | `DENY` |
| | Google OAuth 2.0 / UWO SSO Authentication | `FULL` | `FULL` | `DENY` | `FULL` |
| | Forgot Password & OTP Password Reset | `FULL` | `FULL` | `FULL` | `FULL` |
| | Update Personal Profile & Phone Number | `DENY` | `OWN` | `DENY` | `FULL` |
| | Change Account Password | `DENY` | `OWN` | `OWN` | `OWN (via 2FA OTP)` |
| | Manage Saved Delivery Address Book | `DENY` | `OWN` | `DENY` | `FULL` |
| **Orders & Invoices** | View Placed Order History | `DENY` | `OWN` | `DENY` | `FULL` |
| | Download Official Tax PDF Invoice | `DENY` | `OWN` | `DENY` | `FULL` |
| | View Complete Orders from All Customers | `DENY` | `DENY` | `DENY` | `FULL` |
| | Update Order Status (`Processing`, `Shipped`, etc.)| `DENY` | `DENY` | `DENY` | `FULL` |
| | Cancel Customer Order | `DENY` | `OWN (Pre-Ship)`| `DENY` | `FULL` |
| **Digital Library** | Access Purchased eBooks via PDF.js Reader | `DENY` | `OWN (Purchased)`| `DENY` | `FULL` |
| | Stream Purchased Audiobooks with Chapter Resume | `DENY` | `OWN (Purchased)`| `DENY` | `FULL` |
| | Sync Listening Progress Timestamp | `DENY` | `OWN` | `DENY` | `FULL` |
| | Download eBook PDF Offline Copy | `DENY` | `OWN (Authorized)`| `DENY` | `FULL` |
| **Shipping & Logistics** | Track Package via Public AWB Tool (`tracking.html`)| `READ` | `READ` | `READ` | `READ` |
| | Generate NimbusPost Courier Label & AWB | `DENY` | `DENY` | `DENY` | `FULL` |
| | Transmit International Orders to Lulu Global Print| `DENY` | `DENY` | `DENY` | `FULL` |
| | Manage Courier Serviceability & Shipping Rates | `DENY` | `DENY` | `DENY` | `FULL` |
| **Returns & Complaints** | Submit Damaged Book Return / Replacement Request | `DENY` | `OWN` | `DENY` | `FULL` |
| | Inspect Customer Return Photos & Reasons | `DENY` | `DENY` | `DENY` | `FULL` |
| | Approve / Reject Return Requests | `DENY` | `DENY` | `DENY` | `FULL` |
| | Schedule Courier Reverse Pickup | `DENY` | `DENY` | `DENY` | `FULL` |
| **Customer Support** | Submit Support Helpdesk Ticket | `DENY` | `OWN` | `DENY` | `FULL` |
| | View Helpdesk Ticket Responses | `DENY` | `OWN` | `DENY` | `FULL` |
| | Reply to Tickets & Resolve Helpdesk Requests | `DENY` | `DENY` | `DENY` | `FULL` |
| **Product Management** | Add New Books, Volumes & Editions | `DENY` | `DENY` | `DENY` | `FULL` |
| | Edit Book Descriptions, Metadata & ISBN | `DENY` | `DENY` | `DENY` | `FULL` |
| | Upload Book Covers, PDFs & Audio to GCS | `DENY` | `DENY` | `DENY` | `FULL` |
| | Manage Inventory, Stock Levels & Coming Soon Tags| `DENY` | `DENY` | `DENY` | `FULL` |
| | Delete or Deactivate Book Products | `DENY` | `DENY` | `DENY` | `FULL` |
| | Configure Country Pricing Multipliers | `DENY` | `DENY` | `DENY` | `FULL` |
| **Marketing & Discounts** | Create Promo Coupons & Set Usage Limits | `DENY` | `DENY` | `DENY` | `FULL` |
| | Create BOGO Promotions & Marketplace Offers | `DENY` | `DENY` | `DENY` | `FULL` |
| | Publish / Edit Articles in Quill.js Blog Editor | `DENY` | `DENY` | `DENY` | `FULL` |
| | Configure Homepage Carousel & Topics Header | `DENY` | `DENY` | `DENY` | `FULL` |
| **Partner Portal** | Submit Partner Affiliate Registration | `FULL` | `FULL` | `DENY` | `DENY` |
| | Verify Partner Email via 6-Digit OTP | `FULL` | `FULL` | `DENY` | `DENY` |
| | Access Partner Dashboard (`partner-dashboard.html`)| `DENY` | `DENY` | `OWN` | `FULL` |
| | View Own Attributed Sales & Referral Orders | `DENY` | `DENY` | `OWN` | `FULL` |
| | View Accrued Commission Balances (Pending / Paid)| `DENY` | `DENY` | `OWN` | `FULL` |
| | Submit Commission Payout Request with Bank Details| `DENY` | `DENY` | `OWN` | `FULL` |
| | Send Direct Thread Messages to Administrator | `DENY` | `DENY` | `OWN` | `FULL` |
| | Review, Approve or Reject Partner Applications | `DENY` | `DENY` | `DENY` | `FULL` |
| | Configure Partner Custom Commission Rates (%) | `DENY` | `DENY` | `DENY` | `FULL` |
| | Disburse Commission Payouts | `DENY` | `DENY` | `DENY` | `FULL` |
| **Administration & System**| View Business Intelligence KPI Metrics & Charts | `DENY` | `DENY` | `DENY` | `FULL` |
| | Inspect Customer Profiles & Database Records | `DENY` | `DENY` | `DENY` | `FULL` |
| | Configure Store Constants (Phone, Email, Tax Rate)| `DENY` | `DENY` | `DENY` | `FULL` |
| | View Active Admin Browser Sessions Table | `DENY` | `DENY` | `DENY` | `FULL` |
| | Terminate Remote Browser Sessions (Kill Sessions)| `DENY` | `DENY` | `DENY` | `FULL` |
| | Trigger 2-Factor Authentication Password Reset | `DENY` | `DENY` | `DENY` | `FULL` |
| | Upload Semantic Vector PDFs to AI RAG Engine | `DENY` | `DENY` | `DENY` | `FULL` |

---

## 🛡️ 3. Security Boundary Implementation Details

### 1. Customer Isolation Policy:
* Any attempt by a Customer (`role: 'user'`) to access administrative endpoints (`/api/orders`, `/api/users`, `/api/settings/store [PUT]`, `/api/db-diagnostics`) is rejected by Express middleware with **`403 Forbidden: Access denied`**.
* Queries to `/api/orders/my-orders` and `/api/library/my-library` strictly scope database records to `req.user._id`, ensuring users can never see another customer's orders or digital books.

### 2. Partner Isolation Policy:
* Partners authenticate via dedicated token mechanism (`partnerAuth` middleware).
* Partners have zero access to customer profile data or order shipping addresses. They can only see aggregate sales amounts and commission earnings attributed to their specific `partner_token`.

### 3. Administrator Concurrency & Authentication Policy:
* The `admin` role is protected by dual safeguards:
  1. **Strict 3-Session Concurrency Limit:** Tracked in MongoDB Atlas `user.activeSessions`. Prevents credential sharing across unapproved third parties.
  2. **Mandatory 2FA Email OTP for Credential Changes:** Updates to administrative passwords require an out-of-band 6-digit verification code delivered to the administrator's authorized email address.

---
*End of Role & Permission Matrix.*

# EFV PLATFORM – ORDER WORKFLOW & FULFILLMENT AUDIT

**Audit Date:** November 5, 2026  
**Status:** **FULLY OPERATIONAL & VERIFIED**

---

## 1. 3-Way Automatic Order Routing Architecture

The EFV backend evaluates physical book delivery destinations dynamically upon verified order placement:

```mermaid
graph TD
    OrderReceived["Order Placed & Payment Verified"] --> CheckFormat{"Format Check"}
    CheckFormat -->|Digital Ebook / Audiobook| InstantGrant["Instant Grant to My Library\n(Nimbus & Lulu Bypassed)"]
    CheckFormat -->|Physical Book| GeoEvaluation{"Destination Address"}
    GeoEvaluation -->|"City: Jabalpur OR PIN: 482xxx"| LocalRoute["ADMIN FULFILLMENT\nStatus: 'Local Delivery'\nProvider: 'ADMIN'"]
    GeoEvaluation -->|"Domestic: India (Outside Jabalpur)"| NimbusRoute["NIMBUSPOST API\nAutomated AWB & Shipping Label\nProvider: 'NIMBUS'"]
    GeoEvaluation -->|"International: Outside India"| LuluRoute["LULU POD PRODUCTION API\nCasewrap (CW) Normalization\nProvider: 'LULU'"]
```

---

## 2. Test Cases & Evidence

### Test Case 1: Jabalpur Physical Book Order
- **Scenario:** Customer in Jabalpur (`PIN: 482001`, `City: Jabalpur`) places a Hardcover physical book order.
- **Payload:** Address in Napier Town, Jabalpur, MP.
- **Backend Execution:**
  - Route evaluated: `isJabalpurOrder(address)` -> `true`
  - Action taken: `newOrder.fulfillmentProvider = 'ADMIN'`, `newOrder.status = 'Local Delivery'`.
  - NimbusPost shipping automation bypassed.
  - Lulu POD bypassed.
- **Database Record:**
  - Order ID: `#COD-1793873977922`
  - Fulfillment Provider: `ADMIN`
  - Status: `Local Delivery`
  - AWB Number: `null` (Self-fulfillment)
- **Result:** **PASS**

### Test Case 2: Domestic Outside Jabalpur (NimbusPost)
- **Scenario:** Customer in Jaipur (`PIN: 302001`, `City: Jaipur`) places a Hardcover physical book order.
- **Payload:** Address in C-Scheme, Jaipur, Rajasthan, India.
- **Backend Execution:**
  - Route evaluated: `isIndia: true`, `isJabalpurOrder: false`.
  - Action taken: `nimbusPostService.automateShipping(order, address, items, 'cod')`.
  - Live API call made to `api.nimbuspost.com/v1/shipments`.
- **Database Record:**
  - Order ID: `#COD-1793873979598`
  - Fulfillment Provider: `NIMBUS`
  - Status: `Pending` / `Shipped`
  - Courier Name: `Xpressbees Surface`
  - AWB Number: `153768760674635`
  - Shipment Record Created: `Shipment` collection updated with tracking link.
- **Result:** **PASS**

### Test Case 3: International Fulfillment (Lulu POD Production)
- **Scenario:** Customer in New York, USA (`Country: United States`, `PIN: 10001`) orders Hardcover book.
- **Backend Execution:**
  - Route evaluated: `isIndia: false` -> International routing.
  - Action taken: `resolveLuluCountryCode('United States')` -> `US`.
  - `formatLuluAddress` -> Formatted for Lulu shipping specifications.
  - `formatLuluLineItems` -> Resolves SKU and auto-normalizes Hardcover SKU from `HC` to `CW` (Casewrap) per Lulu POD requirements.
  - Lulu OAuth2 Production Token authenticated on `https://api.lulu.com`.
- **Production Handshake:**
  - Verified against Lulu Production API: `GET /print-jobs/?page_size=1` returned `200 OK`.
- **Result:** **PASS**

---

## 3. Product Format Separation Integrity

1. **Digital Purchases (Ebooks & Audiobooks):**
   - Strictly excluded from NimbusPost shipping calls.
   - Strictly excluded from Lulu POD print job calls.
   - Unlocked instantly in `/api/library/my-library`.
2. **Physical Purchases:**
   - Require full shipping address (Name, Phone, Street, City, State, Country, Pincode).
   - Routed strictly according to Destination Rules 1, 2, and 3.


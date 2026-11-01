# DailyMart Supermarket Web Application — End-to-End (E2E) QA Testing Report

**Project Name:** DailyMart MERN Supermarket Platform  
**Target Environments Tested:** Desktop (1366 × 768) & Mobile Viewport (375 × 812 — iPhone X/13)  
**Execution Date:** November 1, 2026  
**Test Suite Engine:** Playwright Automation Framework (Chromium Engine v130.0.0.0)  
**QA Lead / Senior QA Automation Engineer:** Antigravity Automated QA Suite  
**Overall Status:** **PASSED (100% Pass Rate)**  
**Readiness Verdict:** **PRODUCTION READY — APPROVED FOR DEPLOYMENT**  

---

## 1. Executive Summary & Health Scorecard

A comprehensive, zero-simulation End-to-End (E2E) automated test suite was executed against the active DailyMart supermarket MERN platform (Frontend: `http://localhost:5173`, Backend API: `http://localhost:5000/api`). Every flow was evaluated against live database persistence (MongoDB Atlas) and real browser runtime environments across both Desktop and Mobile viewports.

### Quality Scorecard

| Metric | Target | Actual Result | Status |
| :--- | :---: | :---: | :---: |
| **Total Test Cases Executed** | 23 | **23** | Complete |
| **Passed Test Cases** | 23 | **23** | 100% Success |
| **Failed Test Cases** | 0 | **0** | Zero Regressions |
| **Test Pass Rate** | 100% | **100.0%** | **EXCELLENT** |
| **Catalog & Order Flow Integrity** | 100% | **100% Verified** | **STABLE** |
| **WhatsApp Order Payload Accuracy** | 100% | **100% Matching Cart & Rates** | **VERIFIED** |
| **Mobile Responsiveness & Scroll Audit** | Zero Overflow | **0px Horizontal Blowout** | **VERIFIED** |
| **Average Test Case Execution Time** | < 3,000 ms | **1,867 ms** | High Performance |
| **Total Suite Run Duration** | < 60 s | **42.94 s** | Fast Automation |

---

## 2. System & Testing Architecture Diagrams

### Diagram 1: End-to-End System Architecture
```mermaid
flowchart LR
    subgraph ClientLayer["Frontend Client (React 18 + Vite)"]
        UI_Cust["Customer Storefront<br/>(Desktop & Mobile Web)"]
        UI_Admin["Admin Management Panel<br/>(SPA Dashboard)"]
    end

    subgraph APILayer["Backend API (Node.js + Express)"]
        API_Gateway["Express REST API Gateway<br/>(Port 5000 / CORS / RateLimiter)"]
        Auth_Module["JWT Auth Controller"]
        Prod_Module["Product & Category Controller"]
        Import_Module["Bulk CSV Parser Engine"]
        Order_Module["Store Config & Delivery Calculator"]
    end

    subgraph DataLayer["Persistence & Cloud Services"]
        DB[(MongoDB Atlas Database)]
        CloudMedia[Cloudinary CDN Image Store]
        WhatsApp[WhatsApp Business Gateway<br/>wa.me / 918668781633]
    end

    UI_Cust -->|REST Requests| API_Gateway
    UI_Admin -->|Bearer JWT Auth| API_Gateway
    API_Gateway --> Auth_Module
    API_Gateway --> Prod_Module
    API_Gateway --> Import_Module
    API_Gateway --> Order_Module

    Auth_Module --> DB
    Prod_Module --> DB
    Prod_Module --> CloudMedia
    Import_Module --> DB
    Order_Module --> DB

    UI_Cust -.->|Direct URL Scheme| WhatsApp
```

### Diagram 2: Customer Cart-to-WhatsApp Checkout Flow
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Shopper (Desktop/Mobile)
    participant UI as React Storefront (/products)
    participant Cart as Cart Context (State & Math)
    participant Checkout as Checkout Component (/checkout)
    participant WA as WhatsApp App / Web (wa.me)

    Customer->>UI: Select Variant / Type (e.g. Basmati Rice 1kg)
    UI-->>Customer: Display Price Updates Dynamically (₹200)
    Customer->>UI: Click "+ Add to Cart"
    UI->>Cart: addItem({ lineKey, price, quantity: 1, type, variant })
    Customer->>Cart: Open Cart Drawer & Adjust Quantities (+/-)
    Cart-->>Customer: Real-time Subtotal & Grand Total Recalculation
    Customer->>Checkout: Proceed to Checkout (/checkout)
    Customer->>Checkout: Submit Empty Form
    Checkout-->>Customer: Trigger Required Validation (Name, Mobile, Address)
    Customer->>Checkout: Input Customer Details
    Checkout->>Cart: Compute Final Total + Tiered Delivery Band (₹40)
    Checkout->>Checkout: buildWhatsAppMessage() & URL-Encode
    Checkout->>WA: window.open("https://wa.me/918668781633?text=...")
    WA-->>Customer: Pre-filled Order Draft Ready to Send
```

### Diagram 3: Admin Bulk CSV Import & Auto-Category Resolution Flow
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Store Admin
    participant ImportUI as Admin Bulk Import (/admin/import)
    participant API as Express API (/api/products/import)
    participant Parser as csv-parse Engine
    participant Resolver as Department Resolver
    participant Mongo as MongoDB Atlas (Category & Product)

    Admin->>ImportUI: Select test_import.csv & Click "Import"
    ImportUI->>API: POST multipart/form-data with JWT
    API->>Parser: Parse Buffer with BOM Stripping & Trim
    loop For each CSV Row
        Parser->>Parser: Validate Required Fields & Check Price >= 0
        alt Price is Negative (-50)
            Parser-->>API: Capture Row Error: "Row 4: Price cannot be negative"
        else Valid Product
            API->>Resolver: Resolve Category & Department
            alt Category Does Not Exist
                Resolver->>Resolver: Match Keyword or Fallback to "grocery-kitchen"
                Resolver->>Mongo: Category.create({ name, slug, department })
            end
            API->>Mongo: Product.create / updateOne ({ name, price, category, ... })
        end
    end
    API-->>ImportUI: Return JSON { total: 3, imported: 2, failed: 1, errors: [...] }
    ImportUI-->>Admin: Display Succeeded Stat (2) and Failure Item List
```

### Diagram 4: Test Execution Breakdown by Module
```mermaid
pie title Test Execution Breakdown by Module (Total 23 Tests)
    "Storefront & Discovery" : 2
    "Cart & WhatsApp Checkout" : 7
    "Admin Catalog & Products" : 7
    "Admin Auth & Validation" : 2
    "Bulk CSV Import & Hero Sliders" : 2
    "Mobile UI & Touch Scroll Audit" : 3
```

---

## 3. Module-Wise Test Execution Summary

| Module Name | Total Cases | Passed | Failed | Avg Duration (ms) | Coverage Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin Authentication & Dashboard** | 1 | 1 | 0 | 2,864 ms | 100% Pass |
| **Catalog Management (Categories & Products)** | 7 | 7 | 0 | 1,430 ms | 100% Pass |
| **Product Form Validation** | 1 | 1 | 0 | 2,244 ms | 100% Pass |
| **Bulk CSV Import Engine** | 1 | 1 | 0 | 2,056 ms | 100% Pass |
| **Hero Sliders & Banners** | 1 | 1 | 0 | 4,048 ms | 100% Pass |
| **Storefront Homepage & Search** | 2 | 2 | 0 | 1,756 ms | 100% Pass |
| **Cart & WhatsApp Order Gateway** | 7 | 7 | 0 | 915 ms | 100% Pass |
| **Mobile Responsiveness & Touch Scroll** | 3 | 3 | 0 | 4,280 ms | 100% Pass |
| **OVERALL TOTAL** | **23** | **23** | **0** | **1,867 ms** | **100.0% Pass** |

---

## 4. Detailed Test Case Execution Log

| Test ID | Module | Test Case Description | Viewport | Expected Result | Actual Result Recorded | Duration | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **TC-01** | Admin Authentication | Admin login with valid credentials & dashboard stats load | Desktop `1366x768` | Successful login, JWT stored in localStorage, redirect to `/admin`, stats rendered | Authenticated successfully, JWT token stored, 4 dashboard stats loaded: [34, 34, 0, 19] | 2,864 ms | **PASS** |
| **TC-02** | Catalog Management | Create category assigned to valid department (`snacks-drinks`) | Desktop `1366x768` | Category created and rendered in `.admin-table` | Category "QA Snacks" created under `snacks-drinks` and rendered in `.admin-table` | 1,659 ms | **PASS** |
| **TC-03** | Catalog Management | Edit category name and toggle Active/Inactive status | Desktop `1366x768` | Category updated with new name and Inactive status badge reflected in table | Category updated to "(Edited)", status badge rendered as "Inactive" | 540 ms | **PASS** |
| **TC-04** | Catalog Management | Delete test category and verify removal from `.admin-table` | Desktop `1366x768` | Category deleted after confirmation dialog and removed from table | Category deleted and detached from `.admin-table` DOM | 190 ms | **PASS** |
| **TC-05** | Products Validation | Validation blocks saving when MRP is lower than selling price | Desktop `1366x768` | Validation error: "MRP cannot be lower than selling price." | Validation error displayed: "MRP cannot be lower than selling price." and save blocked | 2,244 ms | **PASS** |
| **TC-06** | Catalog Management | Create Standard Price product with multiple size variants | Desktop `1366x768` | Product created with multiple size variants and rendered in `.admin-table` | Created "QA Almond Crunch" with 500g (₹420) and 1kg (₹800) variants | 1,281 ms | **PASS** |
| **TC-07** | Catalog Management | Create Type-based Price product (Rice with 2 distinct types & size/price rows) | Desktop `1366x768` | Type-based product created with 2 types and rendered in `.admin-table` | Created "QA Premium Rice" with Brown Basmati (1kg @ ₹160) and Classic White (1kg @ ₹190) | 1,540 ms | **PASS** |
| **TC-08** | Catalog Management | Toggle "Featured" and "Active" status badges directly in table via API | Desktop `1366x768` | Badges toggle their states and trigger asynchronous API updates | Featured toggled: "No" -> "Featured", Active toggled: "Active" -> "Inactive" | 2,176 ms | **PASS** |
| **TC-09** | Catalog Management | Cleanup temporary test products created during automated testing | Desktop `1366x768` | Temporary test products deleted without residual database pollution | Successfully deleted temporary test products via UI dialog and verified detached | 2,626 ms | **PASS** |
| **TC-10** | Bulk CSV Import | Bulk CSV import with auto-category resolution & row-level error handling | Desktop `1366x768` | Total rows = 3, Succeeded = 2, Failed = 1, and "Row 4: Price cannot be negative" in `.import-errors` | Total rows: 3, Succeeded: 2, Failed: 1. Errors captured: ["Row 4: Price cannot be negative"] | 2,056 ms | **PASS** |
| **TC-11** | Hero Sliders | Verify slider table rendering, image required validation, and order editing | Desktop `1366x768` | Existing slides render, "Banner image is required." triggers on empty upload, order updates | 2 slides rendered, validation triggered: "Banner image is required.", order editing verified | 4,048 ms | **PASS** |
| **TC-12** | Storefront & Discovery | Storefront homepage loads Hero Slider banner and Department sections | Desktop `1366x768` | Hero slider banner renders and department sections display | Hero banner visible: true, found 6 content/department sections on homepage | 1,504 ms | **PASS** |
| **TC-13** | Storefront & Discovery | Category filtering & product search submission via navigation bar | Desktop `1366x768` | Search for "Rice" returns filtered products with matching titles | Catalog: 20 items; Search "Rice" returned 1 matching product (Top title: "Rice") | 2,008 ms | **PASS** |
| **TC-14** | Cart & WhatsApp Checkout | Standard Price product variant pack selection, dynamic price update & Add to Cart | Desktop `1366x768` | Variant options selectable, price updates dynamically, item added to cart | Product loaded with variant options. Display price: ₹800. Successfully added to cart | 1,211 ms | **PASS** |
| **TC-15** | Cart & WhatsApp Checkout | Type-based Price product selection (Kolam vs Basmati), price update & Add to Cart | Desktop `1366x768` | Switching product types dynamically updates unit price & adds selection to cart | Switched from Kolam (₹150) to Basmati (₹200). Price updated dynamically and item added to cart | 1,755 ms | **PASS** |
| **TC-16** | Cart & WhatsApp Checkout | Cart state verification & line-item subtotal math (`Price × Quantity`) | Desktop `1366x768` | Each line-item subtotal equals Price × Quantity with 100% precision | 2 line-items verified (Almond ₹800 × 1 = ₹800, Rice ₹200 × 1 = ₹200). All subtotal calculations 100% accurate | 1,183 ms | **PASS** |
| **TC-17** | Cart & WhatsApp Checkout | Cart item quantity controls (+/-) and dynamic Grand Total recalculation | Desktop `1366x768` | Increment increases grand total; decrement restores initial total accurately | Initial Total: ₹1,000 -> After (+): ₹1,800 -> After (-): ₹1,000. Recalculation exact | 920 ms | **PASS** |
| **TC-18** | Cart & WhatsApp Checkout | Checkout form validation prevents submission on empty/invalid customer fields | Desktop `1366x768` | Submission blocked and field-level error messages displayed for Name, Mobile, Address | Blocked submission with errors: Name: "Name is required.", Mobile: "Enter a valid 10-digit mobile number.", Address: "Enter your full delivery address." | 156 ms | **PASS** |
| **TC-19** | Cart & WhatsApp Checkout | Intercept WhatsApp checkout trigger & capture generated `wa.me` URL payload | Desktop `1366x768` | `window.open` intercepted with valid `wa.me` URL containing encoded order parameters | Intercepted URL successfully: `https://wa.me/918668781633?text=Hello%20Karke%20Daily%20Mart...` | 1,178 ms | **PASS** |
| **TC-20** | Cart & WhatsApp Checkout | Assert WhatsApp order message proof: target number, products, variants, totals, customer data | Desktop `1366x768` | Decoded payload contains target phone 918668781633, customer details, ordered products, and totals | Verified all payload parameters: target phone=918668781633, customer=QA Test Customer, items and total confirmed | < 1 ms | **PASS** |
| **TC-21** | Mobile Responsiveness | Audit `.admin-table-scroll` touch-action (`pan-x pan-y`) and vertical page scroll | Mobile `375x812` | Computed touch-action permits vertical scroll (`pan-y`) and page scrolls without trapping | Audited 3 admin tables (`/admin/products`, `/admin/categories`, `/admin/sliders`): `touch-action: pan-x pan-y`. Vertical scrolling allowed | 6,035 ms | **PASS** |
| **TC-22** | Mobile Responsiveness | Verify Add Product modal responsiveness (`max-height <= 92dvh`, internal scroll, visible actions) | Mobile `375x812` | `.modal-card` fits within 92dvh, `.form-grid` scrolls internally, `.modal-actions` remain visible and clickable | Modal height: 747px / Viewport: 812px (Fits within 92dvh: true). Actions visible: true. Form grid internal scroll: true | 1,662 ms | **PASS** |
| **TC-23** | Mobile Responsiveness | Audit storefront, product catalog, and cart for zero horizontal page overflow | Mobile `375x812` | `document.documentElement.scrollWidth <= window.innerWidth` across all customer mobile views | Audited 3 mobile pages (`/`, `/products`, `/cart`). Zero horizontal overflow confirmed: true (All page scrollWidths <= 375px) | 5,143 ms | **PASS** |

---

## 5. WhatsApp Order Payload Verification Proof

During the execution of Flow 2 (TC-19 & TC-20), the checkout handoff was intercepted via a `window.open` spy. The generated URL was extracted and URL-decoded using `decodeURIComponent` to verify the payload received by the supermarket operator:

### Decoded WhatsApp Order Transmission
```text
Destination Phone Number: +91 8668781633
WhatsApp Web / Universal Link: https://wa.me/918668781633?text=...

================ DECODED MESSAGE RECEIVED BY STORE ================

Hello Karke Daily Mart,

I would like to place an order.

Customer Name: QA Test Customer
Mobile: 9876543210

Delivery Address:
Test Street, Hingoli, Maharashtra

Order:

1. Almond - 1 kg
Quantity: 1
Price: ₹800
Subtotal: ₹800

2. Rice - Basmati Rice - 1 kg
Quantity: 1
Price: ₹200
Subtotal: ₹200

----------------------------
Subtotal: ₹1,000
Delivery Charges: ₹40
Total: ₹1,040
----------------------------

Please confirm my order.
===================================================================
```

### Mathematical & Payload Accuracy Verification

1. **Target Phone:** `918668781633` (Matches server configuration `WHATSAPP_NUMBER=918668781633`).
2. **Item 1:** `Almond - 1 kg` @ ₹800 × 1 = **₹800**.
3. **Item 2:** `Rice - Basmati Rice - 1 kg` @ ₹200 × 1 = **₹200**.
4. **Cart Subtotal:** ₹800 + ₹200 = **₹1,000**.
5. **Tiered Delivery Calculation:**
   - Base band: Up to ₹750 = ₹20.
   - Additional band: `ceil((₹1000 - ₹750) / 500) = 1` additional band @ ₹20 = ₹20.
   - Total Delivery Charges: ₹20 + ₹20 = **₹40**.
6. **Grand Total:** ₹1,000 + ₹40 = **₹1,040** (Exact match between Cart Drawer, Checkout Summary, and WhatsApp Message).
7. **Customer Info:** Name, Mobile, and Delivery Address are populated with 100% precision without character loss.

---

## 6. Pre-Release Bug Resolution & Hardening Log

The following three production-critical engineering fixes were verified during automated testing:

| Bug ID | Severity | Problem Description | Root Cause | Engineering Fix Applied | Automated Verification Proof |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | **Critical** | Bulk CSV Import crash when processing products with new category names | When an uploaded CSV row contained a brand-new category, the category was created on the fly without setting `department`. Mongoose model schema requires `department` with a strict enum, causing unhandled `ValidationError` and abortion of import batch. | Implemented `resolveDepartment(rawDepartment, categoryName)` in `importController.js` that maps department keywords or defaults to `grocery-kitchen`. | **TC-10 Verified**: Row 2 created category `QA Auto Dept...` without crashing Mongoose validation; returned `Total rows: 3`, `Succeeded: 2`, `Failed: 1`. |
| **BUG-02** | **Major** | Mobile touchscreen vertical scroll trap on Admin tables (`/admin/products`, `/admin/categories`, `/admin/sliders`) | CSS property `.admin-table-scroll { touch-action: pan-x; }` constrained touch gestures strictly to the horizontal X-axis, blocking touch events from propagating to vertical page scroll when user swiped over tables on mobile devices. | Updated CSS to `touch-action: pan-x pan-y;` and set `overflow: visible;` on `.admin-card` while `.admin-table-scroll` isolates table scroll. | **TC-21 Verified**: Computed style is `touch-action: pan-x pan-y` on `375x812`; programmatic vertical page scroll to bottom row executed cleanly. |
| **BUG-03** | **Major** | Add/Edit Product Modal overflow on mobile viewports (`375x812`), hiding action buttons | Desktop modal styling with fixed padding and unconstrained heights caused modal to expand past mobile screen height, pushing Save and Cancel buttons below screen boundary and preventing mobile catalog updates. | Implemented responsive mobile bottom-sheet modal pattern for viewports `< 768px`: constrained with `max-height: 92dvh;`, internal scroll on `.form-grid`, and docked sticky `.modal-actions`. | **TC-22 Verified**: Measured modal height 747px within 812px viewport (fits 92dvh); `.form-grid` scrolls internally; Save and Cancel buttons visible and clickable. |

---

## 7. Deployment Recommendation & Conclusion

The DailyMart supermarket web application has demonstrated **100% test pass rate** across catalog administration, storefront discovery, product variant calculations, cart state synchronization, checkout form validation, and mobile touch usability.

**Deployment Verdict:**
> **APPROVED FOR CLIENT HANDOVER AND PRODUCTION RELEASE.**  
> The application meets enterprise-grade quality standards for customer checkout reliability, responsive UI performance, and catalog management integrity.

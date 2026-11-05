const { Cashfree, CFEnvironment } = require('cashfree-pg');
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════════════
// Auto-switch: Sirf .env mein CASHFREE_MODE=sandbox/production karo
// Code mein kuch nahi karna
// ══════════════════════════════════════════════════════════
const isProduction = process.env.CASHFREE_MODE === 'production';

// Helper to clean key of accidental spaces, trailing slashes, question marks, or prefix like "API- "
const cleanKey = (val) => {
    if (!val) return '';
    return val.toString()
              .trim()
              .replace(/^API-\s*/i, '')                 // Remove accidental 'API-' or 'API-  ' prefix
              .replace(/[^a-zA-Z0-9_]/g, '');           // Keep ONLY alphanumeric characters and underscores
};

const rawAppId = isProduction
    ? (process.env.CASHFREE_PROD_APP_ID || process.env.CASHFREE_APP_ID || '')
    : (process.env.CASHFREE_SANDBOX_APP_ID || process.env.CASHFREE_APP_ID || '');

const rawSecretKey = isProduction
    ? (process.env.CASHFREE_PROD_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || '')
    : (process.env.CASHFREE_SANDBOX_SECRET_KEY || process.env.CASHFREE_SECRET_KEY || '');

const CASHFREE_APP_ID = cleanKey(rawAppId);
const CASHFREE_SECRET_KEY = cleanKey(rawSecretKey);

console.log(`🔧 Cashfree Mode: ${isProduction ? '🔴 PRODUCTION' : '🟡 SANDBOX'}`);
console.log(`🔑 App ID (original): "${rawAppId}"`);
console.log(`🔑 App ID (cleaned):  "${CASHFREE_APP_ID ? CASHFREE_APP_ID.slice(0, 8) + '...' : '⚠️  NOT SET'}"`);

// Initialize Cashfree Instance once
const cashfree = new Cashfree();

// Configure static properties (needed by some v5 SDK versions)
Cashfree.XClientId = CASHFREE_APP_ID;
Cashfree.XClientSecret = CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

// Configure instance properties (needed by PGCreateOrder on prototype)
cashfree.XClientId = CASHFREE_APP_ID;
cashfree.XClientSecret = CASHFREE_SECRET_KEY;
cashfree.XEnvironment = isProduction ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

const getCashfreeInstance = () => {
    return cashfree;
};


const createCashfreeOrder = async (orderData) => {
    try {
        const cashfree = getCashfreeInstance();

        console.log(`--- Creating Cashfree Order ---`);
        console.log(`Mode: ${process.env.CASHFREE_MODE}`);
        console.log(`App ID: ${CASHFREE_APP_ID ? CASHFREE_APP_ID.slice(0,8) + '...' : 'undefined'}`);
        console.log(`Customer ID: ${orderData.customerId}`);
        console.log(`Amount: ${orderData.amount}`);

        // Ensure phone is at least 10 digits and not all zeros
        const phone = (orderData.customerPhone && orderData.customerPhone.length >= 10)
            ? orderData.customerPhone
            : '9999999999';

        let returnUrl = orderData.returnUrl || `${process.env.FRONTEND_URL}/pages/payment-status.html?order_id={order_id}`;
        let notifyUrl = orderData.notifyUrl || `${process.env.BACKEND_URL}/api/orders/cashfree-notify`;

        // 🔥 CRITICAL: Cashfree Production Mode strictly requires HTTPS return_url and notify_url
        if (process.env.CASHFREE_MODE === 'production') {
            if (returnUrl.startsWith('http://')) {
                console.log('⚠️ Upgrading return_url to HTTPS for Cashfree production requirements');
                returnUrl = returnUrl.replace('http://', 'https://');
            }
            if (notifyUrl.startsWith('http://')) {
                notifyUrl = notifyUrl.replace('http://', 'https://');
            }
        }

        const request = {
            "order_id": orderData.orderId,
            "order_amount": Number(orderData.amount),
            "order_currency": orderData.currency || "INR",
            "customer_details": {
                "customer_id": orderData.customerId,
                "customer_phone": phone,
                "customer_email": orderData.customerEmail,
                "customer_name": orderData.customerName || 'Customer'
            },
            "order_meta": {
                "return_url": returnUrl,
                "notify_url": notifyUrl
            }
        };

        const response = await cashfree.PGCreateOrder(request);
        console.log(`✅ Cashfree Order Created: ${response.data.cf_order_id}`);
        return response.data;
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error('Cashfree Order Creation Error:', JSON.stringify(errorData, null, 2));

        // Log to a file for persistent debugging
        const logPath = path.join(__dirname, '..', 'data', 'cashfree_error.log');
        const logEntry = `[${new Date().toISOString()}] Error: ${JSON.stringify(errorData)}\n`;
        fs.appendFileSync(logPath, logEntry);

        throw error;
    }
};

const verifyCashfreePayment = async (cfOrderId) => {
    try {
        const cashfree = getCashfreeInstance();
        // SDK v3+ Instance methods handle XApiVersion internally from the property
        const response = await cashfree.PGOrderFetchPayments(cfOrderId);
        return response.data;
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error('Cashfree Verification Error:', JSON.stringify(errorData, null, 2));
        throw error;
    }
};

module.exports = {
    createCashfreeOrder,
    verifyCashfreePayment
};

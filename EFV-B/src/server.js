require("dotenv").config();

const express = require('express');
console.log("🚀 Server: Loading Version 1.6 (Active)... Port: 8080");
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const nimbusShipping = require("./routes/nimbusShipping").default || require("./routes/nimbusShipping");

// Load .env from parent directory (EFV-Backend/.env)
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

// Enforce mandatory production environment variables with safe fallback for Cloud Run startup probe
if (!process.env.JWT_SECRET) {
    console.warn('⚠️ WARNING: JWT_SECRET environment variable is missing! Using fallback for container health probe.');
    process.env.JWT_SECRET = 'efv_default_secure_secret_token_please_set_in_env_2026';
}
const connectDB = require('./config/db');

// Connect to Database
connectDB().then(async () => {
    // Drop problematic index if it exists (legacyId uniqueness fix)
    if (process.env.USE_JSON_DB !== 'true') {
        const mongoose = require('mongoose');
        const dropIndex = async () => {
            try {
                const collections = await mongoose.connection.db.listCollections({ name: 'products' }).toArray();
                if (collections.length > 0) {
                    await mongoose.connection.db.collection('products').dropIndex('legacyId_1');
                    console.log('🗑️ Successfully dropped legacyId_1 unique index');
                }
            } catch (e) {
                // Index might not exist, ignore
            }
        };

        if (mongoose.connection.readyState === 1) {
            dropIndex();
        } else {
            mongoose.connection.on('open', dropIndex);
        }
    }

    // Seed default categories
    try {
        const { Category } = require('./models');
        const defaultCategories = [
            { name: 'Hardcover', slug: 'HARDCOVER', isDigital: false },
            { name: 'Softbook', slug: 'PAPERBACK', isDigital: false },
            { name: 'Ebook', slug: 'EBOOK', isDigital: true },
            { name: 'Audiobook', slug: 'AUDIOBOOK', isDigital: true }
        ];

        const existing = await Category.find();
        
        // Ensure every existing item has an _id
        let updated = false;
        const migrated = [];
        for (const cat of existing) {
            let catObj = typeof cat.toObject === 'function' ? cat.toObject() : { ...cat };
            if (!catObj._id) {
                catObj._id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                updated = true;
            }
            migrated.push(catObj);
        }
        
        if (updated) {
            console.log('🔄 Migrating categories schema to include _ids...');
            await Category.deleteMany({});
            await Category.create(migrated);
        }

        const currentList = await Category.find();
        for (const def of defaultCategories) {
            const exists = currentList.some(c => c.slug.toUpperCase() === def.slug.toUpperCase());
            if (!exists) {
                await Category.create(def);
                console.log(`🌱 Seeded default category: ${def.name}`);
            }
        }
    } catch (e) {
        console.error('Error seeding categories:', e);
    }
});

// Ensure upload directories exist on startup
const fs = require('fs');
const uploadDirs = [
    path.join(__dirname, 'uploads/covers'),
    path.join(__dirname, 'uploads/ebooks'),
    path.join(__dirname, 'uploads/gallery'),
    path.join(__dirname, 'uploads/audios')
];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

const app = express();
// Enable trust proxy for trusted IP header resolution (Cloud Run, Cloudflare, Nginx)
app.set('trust proxy', true);

// Serve frontend static files (built assets)
app.use(express.static(path.join(__dirname, '..', 'public')));


console.log('--- DATABASE MODE CHECK ---');
console.log('USE_JSON_DB:', process.env.USE_JSON_DB);
console.log('---------------------------');

const allowedOrigins = [
    'https://efvframework.com',
    'https://www.efvframework.com',
    'http://efvframework.com',
    'http://www.efvframework.com'
];

// Add FRONTEND_URL from env if present
const envFrontendUrl = process.env.FRONTEND_URL;
if (envFrontendUrl) {
    const urls = envFrontendUrl.split(',').map(url => url.trim());
    urls.forEach(url => {
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        if (!allowedOrigins.includes(formattedUrl)) allowedOrigins.push(formattedUrl);
    });
}

// Add common domain variants if needed (strictly from env)
const commonDomain = process.env.EXTERNAL_DOMAIN;
if (commonDomain) {
    const domains = commonDomain.split(',').map(d => d.trim());
    domains.forEach(d => {
        if (!allowedOrigins.includes(`https://${d}`)) allowedOrigins.push(`https://${d}`);
        if (!allowedOrigins.includes(`https://www.${d}`)) allowedOrigins.push(`https://www.${d}`);
        if (!allowedOrigins.includes(`http://${d}`)) allowedOrigins.push(`http://${d}`);
        if (!allowedOrigins.includes(`http://www.${d}`)) allowedOrigins.push(`http://www.${d}`);
    });
}

app.use((req, res, next) => {
    // Support Google Login popups by allowing cross-origin-opener-policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    
    const logStr = `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin} - Referer: ${req.headers.referer} - Auth: ${req.headers.authorization ? 'Present' : 'Missing'}\n`;
    console.log(logStr);
    try {
        require('fs').appendFileSync(require('path').join(__dirname, 'data', 'requests.log'), logStr);
    } catch (e) {}
    next();
});

app.use(cors({
    origin: (origin, callback) => {
        // 1. Allow bypass for non-browser clients (Postman/Curl) or same-origin
        if (!origin) return callback(null, true);
        
        // 2. Allow Cloud Run domains (*.run.app), localhost, efvframework.com, and explicit allowedOrigins
        if (origin.endsWith('.run.app') || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('efvframework.com') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // 3. Substring/Domain checks (helpful for dev/production variations)
        const isAllowed = (process.env.EXTERNAL_DOMAIN && origin.includes(process.env.EXTERNAL_DOMAIN));

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`🚨 [CORS BLOCKED] Rejected Origin: ${origin}`);
            callback(new Error('CORS Access Denied: Origin not whitelisted'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range', 'Cache-Control', 'Pragma', 'x-uwo-visitor-id'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Range', 'X-Upload-Version', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // Preflight cache (24 hours)
}));
app.use(express.json());

// Removed frontend path resolution since this is now a standalone API

// In-memory storage for demo mode (no MongoDB required)
global.demoUsers = new Map(); // email -> { name, email, library: [] }
global.demoProgress = new Map(); // userId+productId -> { progress, total, lastUpdated }
global.demoProducts = [
    {
        _id: 'efv_v1_audiobook',
        title: 'EFV™ VOL 1: The Origin Code (Audiobook)',
        type: 'AUDIOBOOK',
        price: 199,
        originalPrice: 999,
        image: 'img/vol1-cover.png',
        chapters: 5,
        rating: 4.9,
        reviews: 245
    },
    {
        _id: 'efv_v2_hardcover',
        title: 'EFV™ VOL 1: The Origin Code (Hardcover)',
        type: 'HARDCOVER',
        price: 799,
        originalPrice: 1499,
        image: 'img/v1-physical.png',
        stock: 50,
        rating: 4.8,
        reviews: 189
    }
];

// Health check routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy', version: '1.6', timestamp: new Date() });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is healthy', timestamp: new Date() });
});
app.get('/api/db-diagnostics', require('./middleware/adminAuth'), async (req, res) => {
    const mongoose = require('mongoose');
    const rawUri = process.env.MONGO_URI || '';
    const redactedUri = rawUri.replace(/:([^@]+)@/, ':****@');
    
    let testResult = null;
    try {
        console.log('Testing MongoDB connection on-demand...');
        const tempConn = await mongoose.createConnection(rawUri, {
            family: 4,
            serverSelectionTimeoutMS: 5000
        }).asPromise();
        testResult = {
            success: true,
            host: tempConn.host,
            name: tempConn.name
        };
        await tempConn.close();
    } catch (err) {
        testResult = {
            success: false,
            message: err.message,
            name: err.name,
            stack: err.stack
        };
    }

    res.status(200).json({
        readyState: mongoose.connection.readyState,
        readyStateDescription: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
        useJsonDb: process.env.USE_JSON_DB,
        mongoUri: redactedUri,
        testConnection: testResult,
        lastError: global.mongoConnectionError || null,
        timestamp: new Date()
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
const pricingRoutes = require('./routes/pricing');
app.use('/api/products/pricing', pricingRoutes);
app.use('/api/pricing', pricingRoutes);
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/users', require('./routes/users'));
app.use('/api/library', require('./routes/library'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/content', require('./routes/content'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/support', require('./routes/support'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/partner-portal', require('./routes/partnerPortal'));
app.use('/api/partner-messages', require('./routes/partnerMessages'));
app.use('/api/audiobook-progress', require('./routes/audiobookProgress'));
app.use('/api/demo', require('./routes/demo'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/nimbus', nimbusShipping);
app.use('/api/upload', require('./routes/upload'));
app.use('/api/images', require('./routes/images'));
app.use('/api/rag', require('./routes/rag'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/leads', require('./routes/leads'));
app.post('/api/subscribe', async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Valid email is required' });
        }
        const { Lead } = require('./models');
        if (Lead) {
            const lead = new Lead({
                name: email.split('@')[0],
                email: email.trim().toLowerCase(),
                source: 'Website Waitlist',
                status: 'New'
            });
            await lead.save();
        }
        return res.status(200).json({ success: true, message: 'Subscribed successfully' });
    } catch (err) {
        console.error('Subscription error:', err);
        return res.status(500).json({ success: false, message: 'Failed to subscribe' });
    }
});
app.use('/api/homepage-books', require('./routes/homepageBooks'));
app.use('/api/shipping', require('./routes/shipping'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/geolocation', require('./routes/geolocation'));
app.use('/api/geo', require('./routes/geolocation'));

// Initial Seed (if DB empty)
setTimeout(() => {
    if (typeof productRoutes.seedProducts === 'function') {
        productRoutes.seedProducts();
    }
}, 5000);

// Dynamic Frontend Configuration
// Serving /js/api-config.js dynamically to inject BACKEND_URL from environment variables
const serveDynConfig = (req, res) => {
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    const unifiedApiUrl = process.env.UNIFIED_API_URL || 'https://uwo24.com/api';
    const uwoApiKey = process.env.UWO_MASTER_API_KEY || '';
    
    // Auto-resolve API base URL from the request itself if BACKEND_URL is not set
    // This works perfectly whether on localhost, staging, or production.
    const rawUrl = process.env.BACKEND_URL || (req.get('host') ? `${req.protocol}://${req.get('host')}` : '');
    const finalUrl = (rawUrl || '').replace(/\/+$/, '');
    
    const jsContent = `
/**
 * EFV API Configuration (Dynamically Generated by Backend)
 */
const CONFIG = {
    API_BASE_URL: '${finalUrl}',
    GOOGLE_CLIENT_ID: '${googleClientId}',
    UNIFIED_API_URL: '${unifiedApiUrl}',
    UWO_API_KEY: '${uwoApiKey}',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

console.log('🔗 EFV API connected to: ' + CONFIG.API_BASE_URL);
if (CONFIG.API_BASE_URL.includes('localhost')) {
    console.warn('⚠️ WARNING: Frontend is connecting to LOCALHOST API. If this is a live site, login will fail.');
}
    `;
    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'no-store, max-age=0');
    res.send(jsContent);
};

app.get('/js/api-config.js', serveDynConfig);
app.get('/api/config.js', serveDynConfig);


// Static files (PDFs, Audio, Images)
app.use('/content', express.static(path.join(__dirname, 'data', 'content')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Unified Monorepo / Next.js Proxy Integration
const frontendInternalUrl = process.env.FRONTEND_INTERNAL_URL || (process.env.NODE_ENV === 'production' && !process.env.STANDALONE_API ? 'http://127.0.0.1:3000' : null);

if (frontendInternalUrl) {
    const { createProxyMiddleware } = require('http-proxy-middleware');
    console.log(`🌐 Unified Service Mode: Proxying web traffic to Next.js frontend at ${frontendInternalUrl}`);

    const nextProxy = createProxyMiddleware({
        target: frontendInternalUrl,
        changeOrigin: true,
        ws: true,
        onError: (err, req, res) => {
            console.warn(`[Proxy Warning] Frontend not reachable (${err.code}). If Next.js is still booting, this will resolve shortly.`);
            if (!res.headersSent) {
                res.status(503).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta http-equiv="refresh" content="3">
                        <title>Starting EFV Service...</title>
                        <style>
                            body { background: #07090e; color: #d4af37; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                            .box { padding: 40px; border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; background: rgba(255,255,255,0.02); }
                            .spinner { border: 3px solid rgba(212,175,55,0.2); border-top-color: #d4af37; border-radius: 50%; width: 36px; height: 36px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
                            @keyframes spin { to { transform: rotate(360deg); } }
                        </style>
                    </head>
                    <body>
                        <div class="box">
                            <div class="spinner"></div>
                            <h2>EFV System Initializing</h2>
                            <p style="color: #888;">Starting up frontend services. Refreshing automatically in 3 seconds...</p>
                        </div>
                    </body>
                    </html>
                `);
            }
        }
    });

    // Any request not handled by Express API/uploads/content goes to Next.js
    app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API Endpoint Not Found', path: req.path });
        }
        return nextProxy(req, res, next);
    });
} else {
    // Fallback for API routes (Standalone Mode)
    app.use((req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API Endpoint Not Found', path: req.path });
        }
        return res.status(200).json({ status: "API Server Active", message: "EFV Backend API Service Live (Standalone API Mode)" });
    });
}

// Consolidated Nimbus Login using nimbusPostService
const nimbusPostService = require('./services/nimbusPostService');
nimbusPostService.login().then(() => {
    console.log("✅ Initial Nimbus Authentication Complete");
}).catch(err => {
    console.error("❌ Pre-emptive Nimbus Authentication Failed, will retry on use.");
});

// Direct Lulu API Authentication (no Django required)
const { testLuluAuth } = require('./utils/lulu');
console.log("🔑 Logging into Lulu...");
testLuluAuth()
    .then(() => {
        console.log("✅ Lulu Token Secured");
        console.log("✅ Initial Lulu Authentication Complete");
    })
    .catch(err => {
        console.error("❌ Pre-emptive Lulu Authentication Failed:", err.message);
    });

// Start Background Notification Worker
const notificationWorker = require('./services/notificationWorker');
const { SystemSettings } = require('./models');

// Initialize default settings if needed
const seedSettings = async () => {
    try {
        const cartRecov = await SystemSettings.findOne({ key: 'whatsapp_cart_recovery' });
        if (!cartRecov) {
            await SystemSettings.create({ 
                key: 'whatsapp_cart_recovery', 
                value: true, 
                description: 'Enable/Disable WhatsApp Abandoned Cart reminders' 
            });
        }
        const orderJobs = await SystemSettings.findOne({ key: 'whatsapp_order_jobs' });
        if (!orderJobs) {
            await SystemSettings.create({ 
                key: 'whatsapp_order_jobs', 
                value: true, 
                description: 'Enable/Disable Delayed Order confirmation messages' 
            });
        }
        const orderNotifEmails = await SystemSettings.findOne({ key: 'order_notification_emails' });
        if (!orderNotifEmails) {
            await SystemSettings.create({ 
                key: 'order_notification_emails', 
                value: '', 
                description: 'Order notification email addresses (comma separated)' 
            });
        }
    } catch (e) {}
};
seedSettings();

notificationWorker.start(60); // Check every 60 seconds

const PORT = process.env.PORT || 8080;
// Removing '0.0.0.0' to let Node decide the best interface (usually binds all, which is required by Cloud Run)
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} (Standalone API)`);
});

// INCREASE TIMEOUT for huge Audiobook Uploads!
// 30 mins = 1800000 ms (Defaults are usually fine, but big files need bigger limits)
server.timeout = 1800000;
server.keepAliveTimeout = 1800000;
server.headersTimeout = 1801000;

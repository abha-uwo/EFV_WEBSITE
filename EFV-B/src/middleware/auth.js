const jwt = require('jsonwebtoken');
const { User, Purchase, DigitalLibrary } = require('../models');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'data', 'auth_debug.log');
const debugLog = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
};

const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1] || req.query.token;

    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const mongoose = require('mongoose');
        
        const query = [];
        const isObjectId = /^[a-f\d]{24}$/i.test(decoded.id);
        if (isObjectId) {
            query.push({ _id: new mongoose.Types.ObjectId(decoded.id) });
        }
        if (decoded.id) {
            query.push({ _id: decoded.id });
            query.push({ email: decoded.id });
        }
        if (decoded.email) {
            query.push({ email: decoded.email });
        }
        
        req.user = await User.findOne({ $or: query }).select('-password');

        if (!req.user && (decoded.email === 'admin@uwo24.com' || decoded.id === 'admin@uwo24.com' || decoded.email === 'efv@uwo24.com' || decoded.id === 'efv@uwo24.com' || decoded.role === 'admin')) {
            req.user = (await User.findOne({ email: 'efv@uwo24.com' })) || (await User.findOne({ email: 'admin@uwo24.com' }));
            if (req.user && !req.user.password) {
                // already selected or json DB
            }
        }

        if (!req.user) {
            debugLog(`PROTECT FAIL: User ID ${decoded.id} not found in DB [URL: ${req.originalUrl}]`);
            return res.status(404).json({ message: 'User not found' });
        }

        // --- CONCURRENT SESSION LIMIT FOR ADMINS (MAX 3 BROWSERS) ---
        const isAdmin = req.user.role === 'admin' || 
                        req.user.email === 'admin@uwo24.com' || 
                        req.user.email === 'efv@uwo24.com';

        if (isAdmin) {
            if (!Array.isArray(req.user.activeSessions)) {
                req.user.activeSessions = [];
            }

            const tokenSessionId = decoded.sessionId;

            if (tokenSessionId) {
                const sessionExists = req.user.activeSessions.some(s => s.sessionId === tokenSessionId);
                if (!sessionExists && req.user.activeSessions.length > 0) {
                    debugLog(`SESSION TERMINATED: Admin ${req.user.email} session ${tokenSessionId} evicted (limit: 3 browsers)`);
                    return res.status(401).json({
                        message: 'Session terminated: Maximum 3 active browser sessions allowed for Admin. Please log in again.',
                        sessionTerminated: true
                    });
                }
                req.userSessionId = tokenSessionId;
            } else {
                if (req.user.activeSessions.length === 0) {
                    const crypto = require('crypto');
                    const autoId = crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Math.random().toString(36).substring(2, 9);
                    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
                    const userAgent = req.headers['user-agent'] || 'Browser';
                    const browser = userAgent.includes('Chrome') ? 'Chrome' : (userAgent.includes('Safari') ? 'Safari' : 'Browser');
                    const os = userAgent.includes('Mac') ? 'macOS' : (userAgent.includes('Windows') ? 'Windows' : 'OS');
                    
                    req.user.activeSessions.push({
                        sessionId: autoId,
                        ip,
                        device: `${browser} / ${os}`,
                        browser,
                        os,
                        createdAt: new Date(),
                        lastActive: new Date()
                    });
                    try { await req.user.save(); } catch (e) {}
                    req.userSessionId = autoId;
                } else {
                    req.userSessionId = req.user.activeSessions[req.user.activeSessions.length - 1].sessionId;
                }
            }
        }

        debugLog(`PROTECT SUCCESS: User ${req.user.email} (${req.user.role || 'no-role'}) [URL: ${req.originalUrl}]`);
        next();
    } catch (error) {
        debugLog(`PROTECT ERROR: ${error.message} [URL: ${req.originalUrl}]`);
        res.status(401).json({ message: 'Unauthorized, token expired or invalid' });
    }
};

const validatePurchase = async (req, res, next) => {
    const { productId } = req.params;

    if (!req.user) {
        debugLog(`VALIDATE FAIL: req.user is missing [URL: ${req.originalUrl}]`);
        return res.status(401).json({ message: 'User authentication failed' });
    }

    const userId = req.user._id || req.user.id;
    const userIdStr = userId.toString();
    const userEmail = req.user.email;
    const userRole = req.user.role;

    debugLog(`VALIDATING: User=${userEmail}, ID=${userIdStr}, Role=${userRole}, Product=${productId} [URL: ${req.originalUrl}]`);

    try {
        // 1. Admin bypass
        const lowerEmail = (userEmail || '').toLowerCase();
        if (userRole === 'admin' || lowerEmail === 'admin@uwo24.com' || lowerEmail === 'efv@uwo24.com') {
            debugLog(`GRANT: Admin Bypass for ${userEmail}`);
            return next();
        }

        // 2. Resolve the MongoDB product ID
        let resolvedProductId = productId;
        const isObjectId = /^[a-f\d]{24}$/i.test(productId);
        if (!isObjectId) {
            const { Product } = require('../models');
            const product = await Product.findOne({ legacyId: productId });
            if (product) {
                resolvedProductId = product._id.toString();
            }
        }

        // 3. Check user's purchasedProducts array (FASTEST)
        if (req.user.purchasedProducts && Array.isArray(req.user.purchasedProducts)) {
            const hasMatch = req.user.purchasedProducts.some(p => {
                const pStr = p.toString();
                return pStr === productId || pStr === resolvedProductId;
            });
            if (hasMatch) {
                debugLog(`GRANT: purchasedProducts array match for ${userEmail} -> ${productId}`);
                return next();
            }
        }

        // 4. Digital Library (Robust check)
        // Try multiple ID formats for userId to handle legacy JSON vs MongoDB
        const library = await DigitalLibrary.findOne({ 
            $or: [{ userId: userId }, { userId: userIdStr }]
        });

        if (library && library.items) {
            const hasAccess = library.items.some(item => {
                const itemProdId = item.productId || item.id || item._id;
                if (!itemProdId) return false;
                const itemStr = itemProdId.toString();
                return itemStr === productId || itemStr === resolvedProductId;
            });

            if (hasAccess) {
                debugLog(`GRANT: Library entry found for ${userEmail} -> ${productId}`);
                return next();
            }
        }

        // 5. Purchase History
        const purchase = await Purchase.findOne({
            $or: [
                { userId: userId, productId: resolvedProductId },
                { userId: userId, productId: productId },
                { userId: userIdStr, productId: resolvedProductId },
                { userId: userIdStr, productId: productId }
            ]
        });

        if (purchase) {
            debugLog(`GRANT: Purchase record found for ${userEmail} -> ${productId}`);
            return next();
        }

        // 6. 🔧 Order History fallback — for Cashfree/newly purchased digital items
        const { Order } = require('../models');
        const paidOrder = await Order.findOne({
            $or: [{ userId: userId }, { userId: userIdStr }, { 'customer.email': userEmail }],
            paymentStatus: 'Paid',
            'items.productId': resolvedProductId
        });

        if (paidOrder) {
            debugLog(`GRANT: Paid Order found for ${userEmail} -> ${productId}`);
            return next();
        }

        debugLog(`DENY: ${userEmail} does not own ${productId}`);
        return res.status(403).json({ message: 'Access denied: Content not purchased [REFRESH_REQUIRED]' });
    } catch (error) {
        debugLog(`ERROR: ${error.message} [URL: ${req.originalUrl}]`);
        res.status(500).json({ message: 'Server error during validation' });
    }
};

const admin = (req, res, next) => {
    const userEmailLower = (req.user?.email || '').toLowerCase().trim();
    if (req.user && (req.user.role === 'admin' || userEmailLower === 'admin@uwo24.com' || userEmailLower === 'efv@uwo24.com')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

const optionalAuth = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const mongoose = require('mongoose');
        const query = [];
        const isObjectId = /^[a-f\d]{24}$/i.test(decoded.id);
        if (isObjectId) {
            query.push({ _id: new mongoose.Types.ObjectId(decoded.id) });
        }
        if (decoded.id) {
            query.push({ _id: decoded.id });
            query.push({ email: decoded.id });
        }
        if (decoded.email) {
            query.push({ email: decoded.email });
        }
        req.user = await User.findOne({ $or: query }).select('-password');
        if (!req.user && (decoded.email === 'admin@uwo24.com' || decoded.id === 'admin@uwo24.com' || decoded.email === 'efv@uwo24.com' || decoded.id === 'efv@uwo24.com' || decoded.role === 'admin')) {
            req.user = (await User.findOne({ email: 'efv@uwo24.com' })) || (await User.findOne({ email: 'admin@uwo24.com' }));
        }
    } catch (e) {
        // Token invalid or expired, proceed unauthenticated
    }
    next();
};

module.exports = { protect, validatePurchase, admin, optionalAuth };

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
        // 1. Admin Portal Bypass ONLY (e.g. from admin.html preview)
        const isExplicitAdminPortal = (req.headers.referer || '').includes('admin.html') || 
                                      (req.headers.referer || '').includes('admin-dashboard.html') ||
                                      req.headers['x-admin-preview'] === 'true' ||
                                      req.headers['x-efv-source'] === 'admin_portal';
        if (userRole === 'admin' && isExplicitAdminPortal) {
            debugLog(`GRANT: Admin Portal Preview Bypass for ${userEmail}`);
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

        // 4. Purchase History
        const purchase = await Purchase.findOne({
            $or: [
                { userId: userId, productId: resolvedProductId },
                { userId: userId, productId: productId },
                { userId: userIdStr, productId: resolvedProductId },
                { userId: userIdStr, productId: productId },
                { userEmail: userEmail, productId: resolvedProductId },
                { userEmail: userEmail, productId: productId }
            ]
        });

        if (purchase) {
            debugLog(`GRANT: Purchase record found for ${userEmail} -> ${productId}`);
            return next();
        }

        // 5. Order History: Check for PAID order containing this DIGITAL product
        const { Order } = require('../models');
        const paidOrder = await Order.findOne({
            $and: [
                {
                    $or: [
                        { userId: userId },
                        { userId: userIdStr },
                        { 'customer.email': userEmail }
                    ]
                },
                { status: { $nin: ['Cancelled', 'Failed', 'Returned'] } },
                {
                    $or: [
                        { paymentStatus: { $regex: /^paid$/i } },
                        { status: { $in: ['Paid', 'Completed', 'Completed (Digital)'] } }
                    ]
                },
                {
                    'items.productId': { $in: [resolvedProductId, productId] }
                }
            ]
        });

        if (paidOrder) {
            // Verify that the purchased item is actually digital (not a physical hardcover/paperback)
            const matchedItem = (paidOrder.items || []).find(i => 
                (i.productId || '').toString() === resolvedProductId || 
                (i.productId || '').toString() === productId
            );
            if (matchedItem) {
                const iType = (matchedItem.type || '').toString().toUpperCase();
                const isPhysical = ['HARDCOVER', 'PAPERBACK', 'PHYSICAL', 'BOOK', 'PRINT'].some(p => iType.includes(p));
                if (!isPhysical) {
                    debugLog(`GRANT: Verified Paid Digital Order found for ${userEmail} -> ${productId}`);
                    return next();
                }
            }
        }

        // 6. Digital Library Check: only grant if backed by a valid paid order
        const library = await DigitalLibrary.findOne({ 
            $or: [{ userId: userId }, { userId: userIdStr }]
        });

        if (library && library.items) {
            const libItem = library.items.find(item => {
                const itemProdId = item.productId || item.id || item._id;
                if (!itemProdId) return false;
                const itemStr = itemProdId.toString();
                return itemStr === productId || itemStr === resolvedProductId;
            });

            if (libItem && libItem.accessStatus === 'active' && libItem.orderId) {
                const orderCheck = await Order.findOne({
                    orderId: libItem.orderId,
                    status: { $nin: ['Cancelled', 'Failed', 'Returned'] },
                    $or: [
                        { paymentStatus: { $regex: /^paid$/i } },
                        { status: { $in: ['Paid', 'Completed', 'Completed (Digital)'] } }
                    ]
                });
                if (orderCheck) {
                    debugLog(`GRANT: Verified Library entry with paid order for ${userEmail} -> ${productId}`);
                    return next();
                }
            }
        }

        debugLog(`DENY: ${userEmail} does not own digital product ${productId}`);
        return res.status(403).json({ message: 'Access denied: Content not purchased' });
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

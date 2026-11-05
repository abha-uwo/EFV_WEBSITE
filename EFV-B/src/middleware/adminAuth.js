const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../models');

const adminAuth = async (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        } else if (req.query.adminToken) {
            token = req.query.adminToken;
        }

        if (!token) {
            return res.status(401).json({ message: 'No admin token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        let adminUser = null;
        let adminQuery = [{ email: decoded.id }];
        if (mongoose.Types.ObjectId.isValid(decoded.id) || typeof decoded.id === 'string') {
            adminQuery.push({ _id: decoded.id });
        }
        adminUser = await User.findOne({ $or: adminQuery });

        // FALLBACK: Only if the token explicitly carries master admin email or admin role
        if (!adminUser && (decoded.email === 'efv@uwo24.com' || decoded.email === 'admin@uwo24.com' || decoded.role === 'admin')) {
            adminUser = await User.findOne({ email: 'efv@uwo24.com' }) || await User.findOne({ email: 'admin@uwo24.com' });
        }

        if (!adminUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userEmailLower = (adminUser.email || '').toLowerCase().trim();
        const isAdmin = adminUser.role === 'admin' || userEmailLower === 'efv@uwo24.com' || userEmailLower === 'admin@uwo24.com';

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin rights required' });
        }

        // --- CONCURRENT SESSION LIMIT FOR ADMINS (MAX 3 BROWSERS) ---
        if (!Array.isArray(adminUser.activeSessions)) {
            adminUser.activeSessions = [];
        }

        const tokenSessionId = decoded.sessionId;
        if (tokenSessionId) {
            const sessionExists = adminUser.activeSessions.some(s => s.sessionId === tokenSessionId);
            if (!sessionExists && adminUser.activeSessions.length > 0) {
                return res.status(401).json({
                    message: 'Session terminated: Maximum 3 active browser sessions allowed for Admin. Please log in again.',
                    sessionTerminated: true
                });
            }
            req.userSessionId = tokenSessionId;
        } else {
            if (adminUser.activeSessions.length === 0) {
                const crypto = require('crypto');
                const autoId = crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Math.random().toString(36).substring(2, 9);
                const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
                const userAgent = req.headers['user-agent'] || 'Browser';
                const browser = userAgent.includes('Chrome') ? 'Chrome' : (userAgent.includes('Safari') ? 'Safari' : 'Browser');
                const os = userAgent.includes('Mac') ? 'macOS' : (userAgent.includes('Windows') ? 'Windows' : 'OS');
                
                adminUser.activeSessions.push({
                    sessionId: autoId,
                    ip,
                    device: `${browser} / ${os}`,
                    browser,
                    os,
                    createdAt: new Date(),
                    lastActive: new Date()
                });
                try { await adminUser.save(); } catch (e) {}
                req.userSessionId = autoId;
            } else {
                req.userSessionId = adminUser.activeSessions[adminUser.activeSessions.length - 1].sessionId;
            }
        }

        req.user = adminUser;
        req.admin = adminUser;
        next();
    } catch (error) {
        console.error('Admin Auth Error:', error);
        res.status(401).json({ message: 'Invalid or expired admin token' });
    }
};

module.exports = adminAuth;

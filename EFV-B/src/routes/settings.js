const express = require('express');
const router = express.Router();
const { SystemSettings } = require('../models');
const { protect } = require('../middleware/auth');

// Default Business Constants
const DEFAULT_CONFIG = {
    globalName: "EFV™ Official Store",
    hotline: "+91 98765 43210",
    email: "support@efv.com",
    currency: "INR",
    taxRate: 18,
    invoicePrefix: "EFV-2026-"
};

// GET /api/settings/store (Public - for website footer, checkout, contact, etc.)
router.get('/store', async (req, res) => {
    try {
        const record = await SystemSettings.findOne({ key: 'store_configuration' });
        if (record && record.value) {
            return res.json({
                success: true,
                config: { ...DEFAULT_CONFIG, ...record.value }
            });
        }
        res.json({
            success: true,
            config: DEFAULT_CONFIG
        });
    } catch (error) {
        console.error('Error fetching store settings:', error);
        res.json({ success: true, config: DEFAULT_CONFIG });
    }
});

// PUT /api/settings/store (Admin Protected - sync & save to MongoDB Atlas)
router.put('/store', protect, async (req, res) => {
    try {
        const user = req.user;
        const isAdmin = user && (user.role === 'admin' || user.email === 'admin@uwo24.com' || user.email === 'efv@uwo24.com');
        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin privileges required' });
        }

        const { globalName, hotline, email, currency, taxRate, invoicePrefix } = req.body;

        const updatedValue = {
            globalName: (globalName || DEFAULT_CONFIG.globalName).trim(),
            hotline: (hotline || DEFAULT_CONFIG.hotline).trim(),
            email: (email || DEFAULT_CONFIG.email).trim(),
            currency: currency || DEFAULT_CONFIG.currency,
            taxRate: Number(taxRate) >= 0 ? Number(taxRate) : DEFAULT_CONFIG.taxRate,
            invoicePrefix: (invoicePrefix || DEFAULT_CONFIG.invoicePrefix).trim()
        };

        let record = await SystemSettings.findOne({ key: 'store_configuration' });
        if (record) {
            record.value = updatedValue;
            record.updatedAt = new Date();
            await record.save();
        } else {
            record = await SystemSettings.create({
                key: 'store_configuration',
                value: updatedValue,
                description: 'Store Global Constants (Name, Support Phone/Email, Tax, Currency, Invoice Prefix)',
                updatedAt: new Date()
            });
        }

        res.json({
            success: true,
            message: 'Store settings successfully synchronized and saved to database!',
            config: record.value
        });
    } catch (error) {
        console.error('Error updating store settings:', error);
        res.status(500).json({ message: 'Error saving store settings: ' + error.message });
    }
});

module.exports = router;


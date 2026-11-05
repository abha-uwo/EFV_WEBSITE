const express = require('express');
const router = express.Router();
const { Coupon, Offer } = require('../models');
const adminAuth = require('../middleware/adminAuth');

// Get all coupons (Admin Only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons' });
    }
});

// Create new coupon
router.post('/', adminAuth, async (req, res) => {
    try {
        const { code, type, value, minOrder, expiryDate, usageLimit, isPartnerCoupon, partnerId, partnerName, commissionPercent } = req.body;

        const normalizedType = (type && type.toString().toLowerCase() === 'flat') ? 'Flat' : 'Percentage';

        const couponData = {
            code: code.trim().toUpperCase(),
            type: normalizedType,
            value: Number(value),
            minOrder,
            expiryDate,
            usageLimit: Number(usageLimit) || 1000,
            isPartnerCoupon: !!isPartnerCoupon,
            partnerId,
            partnerName,
            isActive: true,
            commissionPercent: isPartnerCoupon ? (Number(commissionPercent) || 0) : 0,
            usedCount: 0
        };

        const coupon = await Coupon.create(couponData);
        res.status(201).json(coupon);
    } catch (error) {
        res.status(400).json({ message: 'Error creating coupon', error: error.message });
    }
});

// Delete coupon
router.delete('/:id', adminAuth, async (req, res) => {
    console.log(`🗑️ Admin: Deleting Coupon Request for ID: ${req.params.id}`);
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting coupon' });
    }
});

// Verify coupon (Public)
router.post('/verify', async (req, res) => {
    const { code, amount } = req.body;
    try {
        const cleanedCode = (code || '').trim().toUpperCase();
        let coupon = await Coupon.findOne({ code: cleanedCode, isActive: true });
        
        if (!coupon) {
            // Check in Premium Offers database
            const offer = await Offer.findOne({
                $or: [
                    { 'couponRules.code': cleanedCode },
                    { slug: cleanedCode.toLowerCase() },
                    { name: cleanedCode }
                ],
                offerType: 'Coupon',
                isActive: true
            });
            
            if (offer) {
                coupon = {
                    code: offer.couponRules?.code || offer.slug.toUpperCase(),
                    type: offer.couponRules?.discountType || 'Percentage',
                    value: offer.couponRules?.discountValue || offer.discountValue || 0,
                    minOrder: offer.couponRules?.minOrder || 0,
                    expiryDate: offer.endDate || null,
                    usageLimit: offer.couponRules?.usageLimit || 99999,
                    usedCount: offer.analytics?.orders || 0,
                    isActive: true,
                    _id: offer._id,
                    isOffer: true
                };
            }
        }
        
        if (!coupon) return res.status(404).json({ message: 'Invalid or inactive coupon' });

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        if (amount < (coupon.minOrder || 0)) {
            return res.status(400).json({ message: `Minimum order of ₹${coupon.minOrder} required` });
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Return coupon data - including partner info if it's a partner coupon
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Error verifying coupon' });
    }
});

module.exports = router;

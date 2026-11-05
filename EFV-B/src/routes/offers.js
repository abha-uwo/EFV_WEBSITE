const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Offer, OfferProduct, OfferBanner, OfferRule, OfferSchedule, OfferPriority, OfferAnalytics, User } = require('../models');
const adminAuth = require('../middleware/adminAuth');

// Helper to check if requester has admin rights
async function checkIsAdmin(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminUser = await User.findById(decoded.id);
        if (!adminUser) return false;
        const uEmail = (adminUser.email || '').toLowerCase().trim();
        return adminUser.role === 'admin' || uEmail === 'admin@uwo24.com' || uEmail === 'efv@uwo24.com';
    } catch (e) {
        return false;
    }
}

// GET all offers (Admins see all; public gets active, scheduled, and sorted by priority)
router.get('/', async (req, res) => {
    try {
        const isAdmin = await checkIsAdmin(req);
        const now = new Date();

        if (isAdmin) {
            const offers = await Offer.find().sort({ createdAt: -1 });
            const enhancedOffers = [];
            for (let offer of offers) {
                const offerId = offer._id || offer.id;
                const products = await OfferProduct.find({ offerId });
                const rule = await OfferRule.findOne({ offerId });
                const schedule = await OfferSchedule.findOne({ offerId });
                const priority = await OfferPriority.findOne({ offerId });
                const analytics = await OfferAnalytics.findOne({ offerId });
                
                enhancedOffers.push({
                    ...offer.toObject(),
                    products: products || [],
                    rule: rule || null,
                    schedule: schedule || null,
                    priority: priority ? priority.level : (offer.priority || 0),
                    analytics: analytics || { views: 0, orders: 0, revenue: 0 }
                });
            }
            return res.json(enhancedOffers);
        } else {
            const offers = await Offer.find({ isActive: true });
            const activeOffers = [];
            for (let offer of offers) {
                const offerId = offer._id || offer.id;
                
                // Date schedule verification (graceful timezone handling)
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (offer.startDate) {
                    const start = new Date(offer.startDate);
                    start.setHours(0, 0, 0, 0);
                    if (start > today) continue;
                }
                if (offer.endDate) {
                    const end = new Date(offer.endDate);
                    end.setHours(23, 59, 59, 999);
                    if (end < new Date()) continue;
                }
                
                const products = await OfferProduct.find({ offerId });
                const rule = await OfferRule.findOne({ offerId });
                const schedule = await OfferSchedule.findOne({ offerId });
                const priority = await OfferPriority.findOne({ offerId });
                const analytics = await OfferAnalytics.findOne({ offerId });
                
                activeOffers.push({
                    ...offer.toObject(),
                    products: products || [],
                    rule: rule || null,
                    schedule: schedule || null,
                    priority: priority ? priority.level : (offer.priority || 0),
                    analytics: analytics || { views: 0, orders: 0, revenue: 0 }
                });
            }
            // Sort by priority (higher priority levels first)
            activeOffers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            return res.json(activeOffers);
        }
    } catch (error) {
        console.warn('⚠️ [Offers API] Database unavailable, serving empty active offers:', error.message);
        res.json([]);
    }
});

// GET a single offer
router.get('/:id', async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        const offerId = offer._id || offer.id;
        const products = await OfferProduct.find({ offerId });
        const rule = await OfferRule.findOne({ offerId });
        const schedule = await OfferSchedule.findOne({ offerId });
        const priority = await OfferPriority.findOne({ offerId });
        const analytics = await OfferAnalytics.findOne({ offerId });

        res.json({
            ...offer.toObject(),
            products: products || [],
            rule: rule || null,
            schedule: schedule || null,
            priority: priority ? priority.level : (offer.priority || 0),
            analytics: analytics || { views: 0, orders: 0, revenue: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offer detail', error: error.message });
    }
});

// POST create new offer (Admin Only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            type,
            discountValue,
            isActive,
            priority,
            startDate,
            endDate,
            badgeText,
            ctaText,
            bannerUrl,
            
            // V2 fields
            offerType,
            products,
            categories,
            authors,
            publishers,
            schedule,
            discountRules,
            couponRules,
            shippingRules,
            buyXGetYRules,
            firstOrderRules,
            comboRules
        } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Offer name is required' });
        }

        const generatedSlug = slug ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const offerData = {
            name: name.trim(),
            slug: generatedSlug,
            description: description || '',
            type: type || offerType || 'Percentage',
            discountValue: Number(discountValue) || 0,
            isActive: isActive !== undefined ? !!isActive : true,
            priority: Number(priority) || 0,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            badgeText: badgeText || '',
            ctaText: ctaText || 'View Details',
            bannerUrl: bannerUrl || '',
            
            // V2 Fields
            offerType: offerType || type || 'Percentage',
            products: Array.isArray(products) ? products : [],
            categories: Array.isArray(categories) ? categories : [],
            authors: Array.isArray(authors) ? authors : [],
            publishers: Array.isArray(publishers) ? publishers : [],
            schedule: schedule || {},
            discountRules: discountRules || {},
            couponRules: couponRules || {},
            shippingRules: shippingRules || {},
            buyXGetYRules: buyXGetYRules || {},
            firstOrderRules: firstOrderRules || {},
            comboRules: comboRules || {},
            analytics: { views: 0, orders: 0, revenue: 0 }
        };

        const offer = await Offer.create(offerData);
        const offerId = offer._id || offer.id;

        // Legacy compatibility
        const assignedItems = products || [];
        for (let item of assignedItems) {
            if (!item) continue;
            await OfferProduct.create({
                offerId,
                productId: item,
                categorySlug: null
            });
        }
        const assignedCats = categories || [];
        for (let item of assignedCats) {
            if (!item) continue;
            await OfferProduct.create({
                offerId,
                productId: null,
                categorySlug: item
            });
        }

        await OfferRule.create({
            offerId,
            ruleType: offerType || 'none',
            minQuantity: 0,
            minAmount: Number(couponRules?.minOrder || shippingRules?.minAmount || 0),
            customData: { couponRules, shippingRules, buyXGetYRules, firstOrderRules, comboRules }
        });

        await OfferSchedule.create({
            offerId,
            timezone: 'UTC',
            recurring: ''
        });

        await OfferPriority.create({
            offerId,
            level: Number(priority) || 0
        });

        await OfferAnalytics.create({
            offerId,
            views: 0,
            orders: 0,
            revenue: 0
        });

        if (bannerUrl) {
            await OfferBanner.create({
                offerId,
                title: name,
                subtitle: description || '',
                imageUrl: bannerUrl,
                isActive: offer.isActive
            });
        }

        res.status(201).json(offer);
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(400).json({ message: 'Error creating offer', error: error.message });
    }
});

// PUT update offer (Admin Only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        const {
            name,
            slug,
            description,
            type,
            discountValue,
            isActive,
            priority,
            startDate,
            endDate,
            badgeText,
            ctaText,
            bannerUrl,
            
            // V2 fields
            offerType,
            products,
            categories,
            authors,
            publishers,
            schedule,
            discountRules,
            couponRules,
            shippingRules,
            buyXGetYRules,
            firstOrderRules,
            comboRules
        } = req.body;

        const generatedSlug = slug ? slug.trim() : (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : offer.slug);

        const updates = {
            name: name !== undefined ? name.trim() : offer.name,
            slug: generatedSlug,
            description: description !== undefined ? description : offer.description,
            type: type !== undefined ? type : (offer.type || 'Percentage'),
            discountValue: discountValue !== undefined ? Number(discountValue) : offer.discountValue,
            isActive: isActive !== undefined ? !!isActive : offer.isActive,
            priority: priority !== undefined ? Number(priority) : offer.priority,
            startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : offer.startDate,
            endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : offer.endDate,
            badgeText: badgeText !== undefined ? badgeText : offer.badgeText,
            ctaText: ctaText !== undefined ? ctaText : offer.ctaText,
            bannerUrl: bannerUrl !== undefined ? bannerUrl : offer.bannerUrl,
            
            // V2 Fields
            offerType: offerType !== undefined ? offerType : (offer.offerType || 'Percentage'),
            products: products !== undefined ? (Array.isArray(products) ? products : []) : offer.products,
            categories: categories !== undefined ? (Array.isArray(categories) ? categories : []) : offer.categories,
            authors: authors !== undefined ? (Array.isArray(authors) ? authors : []) : offer.authors,
            publishers: publishers !== undefined ? (Array.isArray(publishers) ? publishers : []) : offer.publishers,
            schedule: schedule !== undefined ? schedule : offer.schedule,
            discountRules: discountRules !== undefined ? discountRules : offer.discountRules,
            couponRules: couponRules !== undefined ? couponRules : offer.couponRules,
            shippingRules: shippingRules !== undefined ? shippingRules : offer.shippingRules,
            buyXGetYRules: buyXGetYRules !== undefined ? buyXGetYRules : offer.buyXGetYRules,
            firstOrderRules: firstOrderRules !== undefined ? firstOrderRules : offer.firstOrderRules,
            comboRules: comboRules !== undefined ? comboRules : offer.comboRules
        };

        const updatedOffer = await Offer.findByIdAndUpdate(offerId, updates, { new: true });

        // Update legacy database tables for consistency
        if (products !== undefined || categories !== undefined) {
            await OfferProduct.deleteMany({ offerId });
            const assignedItems = updates.products || [];
            for (let item of assignedItems) {
                if (!item) continue;
                await OfferProduct.create({
                    offerId,
                    productId: item,
                    categorySlug: null
                });
            }
            const assignedCats = updates.categories || [];
            for (let item of assignedCats) {
                if (!item) continue;
                await OfferProduct.create({
                    offerId,
                    productId: null,
                    categorySlug: item
                });
            }
        }

        if (updates.couponRules || updates.shippingRules) {
            await OfferRule.findOneAndUpdate(
                { offerId },
                {
                    offerId,
                    ruleType: updates.offerType || 'none',
                    minQuantity: 0,
                    minAmount: Number(updates.couponRules?.minOrder || updates.shippingRules?.minAmount || 0),
                    customData: {
                        couponRules: updates.couponRules,
                        shippingRules: updates.shippingRules,
                        buyXGetYRules: updates.buyXGetYRules,
                        firstOrderRules: updates.firstOrderRules,
                        comboRules: updates.comboRules
                    }
                },
                { upsert: true }
            );
        }

        if (priority !== undefined) {
            await OfferPriority.findOneAndUpdate(
                { offerId },
                { offerId, level: Number(priority) || 0 },
                { upsert: true }
            );
        }

        if (bannerUrl !== undefined) {
            if (bannerUrl) {
                await OfferBanner.findOneAndUpdate(
                    { offerId },
                    {
                        offerId,
                        title: updates.name,
                        subtitle: updates.description,
                        imageUrl: bannerUrl,
                        isActive: updates.isActive
                    },
                    { upsert: true }
                );
            } else {
                await OfferBanner.deleteMany({ offerId });
            }
        }

        res.json(updatedOffer);
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(400).json({ message: 'Error updating offer', error: error.message });
    }
});

// DELETE offer (Admin Only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findByIdAndDelete(offerId);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        await OfferProduct.deleteMany({ offerId });
        await OfferBanner.deleteMany({ offerId });
        await OfferRule.deleteMany({ offerId });
        await OfferSchedule.deleteMany({ offerId });
        await OfferPriority.deleteMany({ offerId });
        await OfferAnalytics.deleteMany({ offerId });

        res.json({ message: 'Offer and all associated configurations deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ message: 'Error deleting offer', error: error.message });
    }
});
// POST increment views (Public)
router.post('/:id/view', async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        if (!offer.analytics) {
            offer.analytics = { views: 1, claims: 0, orders: 0, revenue: 0 };
        } else {
            offer.analytics.views = (offer.analytics.views || 0) + 1;
        }
        await offer.save();

        let analytics = await OfferAnalytics.findOne({ offerId });
        if (!analytics) {
            analytics = await OfferAnalytics.create({
                offerId,
                views: 1,
                claims: 0,
                orders: 0,
                revenue: 0
            });
        } else {
            analytics.views = (analytics.views || 0) + 1;
            await analytics.save();
        }

        res.json({ success: true, views: analytics.views });
    } catch (error) {
        console.error('Error tracking offer view:', error);
        res.status(500).json({ message: 'Error tracking view', error: error.message });
    }
});

// POST increment claims (Public)
router.post('/:id/claim', async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        if (!offer.analytics) {
            offer.analytics = { views: 0, claims: 1, orders: 0, revenue: 0 };
        } else {
            offer.analytics.claims = (offer.analytics.claims || 0) + 1;
        }
        await offer.save();

        let analytics = await OfferAnalytics.findOne({ offerId });
        if (!analytics) {
            analytics = await OfferAnalytics.create({
                offerId,
                views: 0,
                claims: 1,
                orders: 0,
                revenue: 0
            });
        } else {
            analytics.claims = (analytics.claims || 0) + 1;
            await analytics.save();
        }

        res.json({ success: true, claims: analytics.claims });
    } catch (error) {
        console.error('Error tracking offer claim:', error);
        res.status(500).json({ message: 'Error tracking claim', error: error.message });
    }
});

module.exports = router;

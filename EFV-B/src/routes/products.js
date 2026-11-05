const express = require('express');
const router = express.Router();
const { Product, DigitalLibrary, User, Offer, OfferProduct, OfferPriority } = require('../models');
const adminAuth = require('../middleware/adminAuth');
const { deleteFile } = require('../utils/storageCleanup');

router.get('/sync-db-live', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const Product = require('../models').Product;

        const jsonPath = path.join(__dirname, '..', 'data', 'products.json');
        const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        let updatedCount = 0;
        for (let product of products) {
            const query = product.legacyId 
                ? { legacyId: product.legacyId } 
                : { title: product.title, type: product.type, language: product.language };
            
            const updateData = {};
            if (product.filePath) updateData.filePath = product.filePath;
            if (product.audioChapters) updateData.audioChapters = product.audioChapters;

            if (Object.keys(updateData).length > 0) {
                const result = await Product.updateOne(query, { $set: updateData });
                if (result.matchedCount > 0) updatedCount++;
            }
        }
        res.json({ success: true, message: `Synced ${updatedCount} products to MongoDB successfully!` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

async function getActiveOffers() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const offers = await Offer.find({ isActive: true });
        const activeOffers = [];
        for (let offer of offers) {
            if (offer.startDate) {
                const start = new Date(offer.startDate);
                start.setHours(0, 0, 0, 0);
                if (start > today) continue;
            }
            if (offer.endDate) {
                const end = new Date(offer.endDate);
                end.setHours(23, 59, 59, 999);
                if (end < today) continue;
            }
            const offerId = offer._id || offer.id;
            const priority = await OfferPriority.findOne({ offerId });
            const products = await OfferProduct.find({ offerId });
            const offerObj = (typeof offer.toObject === 'function') ? offer.toObject() : { ...offer };
            activeOffers.push({
                ...offerObj,
                products: [...(offerObj.products || []), ...(products || [])],
                priority: priority ? priority.level : (offer.priority || 0)
            });
        }
        activeOffers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return activeOffers;
    } catch (e) {
        console.error('Error fetching active offers for products:', e);
        return [];
    }
}

function applyOfferToProduct(productDoc, activeOffers) {
    if (!productDoc) return null;
    const p = typeof productDoc.toObject === 'function' ? productDoc.toObject() : { ...productDoc };
    const productIdStr = String(p._id || p.id);
    const productCategories = Array.isArray(p.categories) 
        ? p.categories.map(c => String(c).toUpperCase()) 
        : (p.category ? [String(p.category).toUpperCase()] : []);
    const productAuthor = (p.author || '').trim().toLowerCase();
    const productPublisher = (p.publisher || p.additionalSpecs?.Publisher || '').trim().toLowerCase();

    // Find the highest priority matching offer
    const matchingOffer = activeOffers.find(offer => {
        const type = (offer.offerType || offer.type || '').replace(/\s+/g, '');
        
        // 1. Check if the offer specifies this product directly
        if (Array.isArray(offer.products)) {
            const mapped = offer.products.map(p => {
                if (typeof p === 'string') return p;
                if (p && p.productId) return String(p.productId);
                if (p && p._doc && p._doc.productId) return String(p._doc.productId);
                return String(p);
            });
            if (mapped.includes(productIdStr)) {
                return true;
            }
        }

        // 2. Check if the offer specifies a category that this product belongs to
        if (Array.isArray(offer.categories) && offer.categories.some(cat => productCategories.includes(cat.toUpperCase()))) {
            return true;
        }

        // 3. Category / Publisher / Author Match
        if (type.includes('Category') || type.includes('Publisher') || type.includes('Author')) {
            const catMatch = Array.isArray(offer.categories) && offer.categories.some(cat => productCategories.includes(cat.toUpperCase()));
            const authorMatch = Array.isArray(offer.authors) && offer.authors.some(auth => auth.trim().toLowerCase() === productAuthor);
            const pubMatch = Array.isArray(offer.publishers) && offer.publishers.some(pub => pub.trim().toLowerCase() === productPublisher);
            if (catMatch || authorMatch || pubMatch) {
                return true;
            }
        }

        return false;
    });

    if (matchingOffer) {
        const originalPrice = Number(p.originalPrice) || Number(p.price);
        let discountedPrice = originalPrice;
        
        const type = (matchingOffer.offerType || matchingOffer.type || '').replace(/\s+/g, '');
        let percent = Number(matchingOffer.discountRules?.percentage || matchingOffer.discountValue || 0);
        let flat = Number(matchingOffer.discountRules?.flatAmount || matchingOffer.discountValue || 0);

        if (type.includes('Percentage') || type.includes('Festival') || type.includes('FlashSale') || type.includes('CategoryPublisherAuthor')) {
            discountedPrice = originalPrice * (1 - (percent / 100));
        } else if (type.includes('Flat')) {
            discountedPrice = Math.max(0, originalPrice - flat);
        } else if (type.includes('Category')) {
            discountedPrice = originalPrice * (1 - (percent / 100));
        }

        discountedPrice = Math.round(discountedPrice * 100) / 100;

        let autoBadge = 'PROMO';
        if (type.includes('Percentage')) autoBadge = `${percent}% OFF`;
        else if (type.includes('Flat')) autoBadge = `₹${flat} OFF`;
        else if (type.includes('Coupon')) autoBadge = matchingOffer.couponRules?.code || 'COUPON';
        else if (type.includes('Shipping')) autoBadge = 'FREE SHIPPING';
        else if (type.includes('BOGO') || type.includes('Combo')) autoBadge = 'BUY 1 GET 1';

        p.originalPrice = originalPrice;
        p.price = discountedPrice;
        p.offerId = String(matchingOffer._id || matchingOffer.id);
        p.offerName = matchingOffer.name;
        p.offerType = matchingOffer.offerType || matchingOffer.type;
        p.offerBadge = matchingOffer.badgeText || autoBadge;
        p.savingsAmount = Math.max(0, originalPrice - discountedPrice);
    }
    return p;
}

// Get all products (Public)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().maxTimeMS(2500);
        const activeOffers = await getActiveOffers();
        const enrichedProducts = products.map(p => applyOfferToProduct(p, activeOffers));
        res.json(enrichedProducts);
    } catch (error) {
        console.warn('⚠️ [Products API] Database unavailable, serving local fallback catalog:', error.message);
        try {
            const fs = require('fs');
            const path = require('path');
            const jsonPath = path.join(__dirname, '..', 'data', 'products.json');
            if (fs.existsSync(jsonPath)) {
                const fallbackProducts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                return res.json(fallbackProducts);
            }
        } catch (e) {}
        res.status(500).json({ message: 'Error fetching products' });
    }
});

/**
 * Seed database with default products if empty
 */
const seedProducts = async () => {
    try {
        console.log('🌱 Checking default products in database...');
        const { SystemSettings } = require('../models');
        const seededSetting = await SystemSettings.findOne({ key: 'products_seeded' });
        if (seededSetting && seededSetting.value === true) {
            console.log('ℹ️ Products already seeded. Skipping seeder to preserve admin deletions.');
            return;
        }

        const seeds = require('../data/seeds');
        let seededCount = 0;
        let patchedCount = 0;
        for (const pData of seeds) {
            // Try to find existing product by string _id first
            let exists = pData._id ? await Product.findOne({ _id: pData._id }) : null;

            // Fallback: find by title+type (handles case where product was created with auto ObjectId)
            if (!exists) {
                exists = await Product.findOne({ title: pData.title, type: pData.type });
            }

            if (!exists) {
                const newDoc = { ...pData };
                if (pData._id && pData._id.startsWith('efv_')) {
                    // Keep the string ID and also set legacyId for lookup
                    newDoc.legacyId = pData._id;
                } else {
                    delete newDoc._id;
                }
                await Product.create(newDoc);
                seededCount++;
            } else {
                // Ensure existing product has legacyId set so getProductById can find it
                if (!exists.legacyId && pData._id && pData._id.startsWith('efv_')) {
                    await Product.findOneAndUpdate(
                        { _id: exists._id },
                        { $set: { legacyId: pData._id } }
                    );
                    patchedCount++;
                }
            }
        }

        if (seededSetting) {
            seededSetting.value = true;
            await seededSetting.save();
        } else {
            await SystemSettings.create({
                key: 'products_seeded',
                value: true,
                description: 'Default products seeding status'
            });
        }

        if (seededCount > 0) {
            console.log(`✅ Seeding complete. Added ${seededCount} missing default products.`);
        } else {
            console.log('ℹ️ Seeding complete. All default products are already present.');
        }
        if (patchedCount > 0) {
            console.log(`🔧 Patched legacyId on ${patchedCount} existing products for order lookup compatibility.`);
        }
    } catch (e) {
        console.error('❌ Seeding error:', e);
    }
};

router.seedProducts = seedProducts;

// Get single product (Public)
router.get('/:id', async (req, res) => {
    try {
        let product = null;
        const id = req.params.id;

        // 1. Try as MongoDB ObjectId first
        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        if (isObjectId) {
            const mongoose = require('mongoose');
            product = await Product.findById(new mongoose.Types.ObjectId(id));
        }

        // 2. If not found, try as raw _id (for legacy string IDs like "efv_v1_audiobook")
        if (!product) {
            product = await Product.findOne({ _id: id });
        }

        // 3. If still not found, try legacyId field
        if (!product) {
            product = await Product.findOne({ legacyId: id });
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const activeOffers = await getActiveOffers();
        const enrichedProduct = applyOfferToProduct(product, activeOffers);
        res.json(enrichedProduct);
    } catch (error) {
        console.error('Fetch product error:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// Helper to determine if a product is digital based on type, category, or media files
function isDigitalProduct(product, categories = []) {
    if (!product) return false;
    const rawType = (product.type || '').toString().trim().toUpperCase();
    const cleanType = rawType.replace(/[^A-Z]/g, '');

    if (['EBOOK', 'AUDIOBOOK', 'DIGITAL', 'AUDIO'].includes(cleanType)) return true;
    if (rawType.includes('E-BOOK') || rawType.includes('AUDIOBOOK') || rawType.includes('AUDIO') || rawType.includes('DIGITAL')) return true;

    const cat = (product.category || '').toString().trim().toUpperCase();
    if (['DIGITAL', 'EBOOK', 'AUDIOBOOK', 'AUDIO', 'E-BOOK'].includes(cat)) return true;

    if (Array.isArray(product.categories)) {
        if (product.categories.some(c => ['DIGITAL', 'EBOOK', 'AUDIOBOOK', 'AUDIO', 'E-BOOK'].includes(String(c).trim().toUpperCase()))) {
            return true;
        }
    }

    if (categories && categories.length > 0) {
        const matchingCat = categories.find(c => (c.slug || '').toUpperCase() === rawType || (c.name || '').toUpperCase() === cat);
        if (matchingCat && matchingCat.isDigital) return true;
    }

    if (product.chapters && Array.isArray(product.chapters) && product.chapters.length > 0) return true;
    if (product.filePath && typeof product.filePath === 'string' && product.filePath.length > 0) return true;

    return false;
}

function getDigitalType(product) {
    if (!product) return 'EBOOK';
    const rawType = (product.type || '').toString().trim().toUpperCase();
    if (rawType.includes('AUDIO') || (product.category || '').toString().toUpperCase().includes('AUDIO') || (product.chapters && product.chapters.length > 0)) {
        return 'AUDIOBOOK';
    }
    return 'EBOOK';
}

// Create Product (Admin Only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { title, price, type } = req.body;

        if (!title || !price || !type) {
            return res.status(400).json({ message: 'Title, Price, and Type are required' });
        }

        const fs = require('fs');
        const path = require('path');
        const debugLog = (msg) => {
            const logPath = path.join(__dirname, '..', 'data', 'debug.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
        };

        debugLog(`Attempting to create product: ${title} (${type})`);
        
        // Ensure _id exists since schema defines it as Mixed and Mongoose won't auto-generate it
        if (!req.body._id) {
            const mongoose = require('mongoose');
            req.body._id = new mongoose.Types.ObjectId();
        }

        const product = await Product.create(req.body);

        console.log('📝 Created Product to DB:', product._id);

        // Automatically add to admin's library if it's a digital product
        const { Category } = require('../models');
        const categories = await Category.find();

        if (isDigitalProduct(product, categories)) {
            try {
                // Ensure product goes to admin@uwo24.com and current user
                const adminUser = await User.findOne({ email: /admin@uwo24\.com/i });
                const targets = [req.user._id];
                if (adminUser && adminUser._id.toString() !== req.user._id.toString()) {
                    targets.push(adminUser._id);
                }

                for (let userId of targets) {
                    let library = await DigitalLibrary.findOne({
                        $or: [{ userId: userId }, { userId: userId.toString() }]
                    });
                    if (!library) {
                        library = new DigitalLibrary({ userId: userId, items: [], removedItems: [] });
                    }

                    if (!library.items) library.items = [];
                    if (!library.removedItems) library.removedItems = [];

                    const pidStr = product._id.toString();

                    // Remove from removedItems
                    library.removedItems = library.removedItems.filter(id => id.toString() !== pidStr);

                    // Check if already in library
                    const exists = library.items.some(item => (item.productId || item.id || '').toString() === pidStr);
                    if (!exists) {
                        library.items.push({
                            productId: product._id,
                            title: product.title,
                            type: getDigitalType(product),
                            thumbnail: product.thumbnail,
                            filePath: product.filePath,
                            purchasedAt: new Date(),
                            accessStatus: 'active'
                        });
                    }

                    library.markModified('items');
                    library.markModified('removedItems');
                    await library.save();
                    console.log(`✅ Auto-added digital product to library for user: ${userId}`);
                }
            } catch (libErr) {
                console.error('Error adding to admin library:', libErr);
            }
        }

        // 🔔 Broadcast Notification to ALL users about the new book
        try {
            const { NotifyRequest, User } = require('../models');
            const axios = require('axios'); // For internal hit if needed, but we can do it directly
            
            // Notification Logic for people who requested to be notified
            const notifyRequests = await NotifyRequest.find({ bookTitle: title, status: 'Pending' });
            if (notifyRequests.length > 0) {
                console.log(`📢 Notifying ${notifyRequests.length} users about "${title}" release...`);
                // Use internal logic or call the route logic
                const sendEmail = require('../utils/emailService');
                for (const nr of notifyRequests) {
                    try {
                        await sendEmail({
                            email: nr.email,
                            subject: `Available Now: "${title}" - EFV™`,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff; border: 1px solid #FFD369; border-radius: 10px;">
                                    <h2 style="color: #FFD369; text-align: center;">Available Now!</h2>
                                    <p>Hello,</p>
                                    <p>Great news! The book you were waiting for, <strong>"${title}"</strong>, is now available in the EFV™ Marketplace.</p>
                                    <p>You can now browse and purchase it to continue your journey into higher frequencies.</p>
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="https://efvframework.com/pages/marketplace.html" style="background: #FFD369; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Browse Marketplace</a>
                                    </div>
                                    <p>Stay tuned for more updates.</p>
                                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; font-size: 12px; opacity: 0.6; text-align: center;">
                                        © 2026 EFV™ - Energy, Frequency, Vibration
                                    </div>
                                </div>
                            `
                        });
                        
                        // User in-app notification
                        const user = await User.findOne({ email: nr.email });
                        if (user) {
                            if (!user.notifications) user.notifications = [];
                            user.notifications.unshift({
                                _id: 'release-' + Date.now(),
                                title: 'Book Available Now! 📚',
                                message: `"${title}" is now live in the marketplace.`,
                                type: 'General',
                                link: 'marketplace.html',
                                isRead: false,
                                createdAt: new Date().toISOString()
                            });
                            await user.save();
                        }
                        
                        nr.status = 'Notified';
                        await nr.save();
                    } catch (err) { console.error('Product release notification error:', err.message); }
                }
            }

            // General broadcast
            /*
            const users = await User.find({});
            const notification = {
                _id: 'new-book-' + Date.now(),
                title: 'New Arrival! 📚',
                message: `"${product.title}" is now available in the marketplace. Check it out now!`,
                type: 'Digital',
                link: 'dashboard',
                isRead: false,
                createdAt: new Date().toISOString()
            };

            for (let user of users) {
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift(notification);
                // Keep list small
                if (user.notifications.length > 50) user.notifications = user.notifications.slice(0, 50);
                await user.save();
            }
            console.log(`📢 Broadcase new book alert to ${users.length} users.`);
            */
        } catch (noteErr) {
            console.error('Broadcast notification error:', noteErr);
        }

        res.status(201).json(product);
    } catch (error) {
        console.error('Create product error:', error);
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '..', 'data', 'debug.log');
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] ❌ ERROR: ${error.stack}\n`);
        } catch (e) { }
        res.status(500).json({ message: 'Error creating product: ' + error.message });
    }
});

// Update Product (Admin Only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const id = (req.params.id || '').trim();
        let product = null;

        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        const mongoose = require('mongoose');

        // Fetch old product for file cleanup comparison
        let oldProduct = null;
        if (isObjectId) oldProduct = await Product.findById(new mongoose.Types.ObjectId(id));
        if (!oldProduct) oldProduct = await Product.findOne({ _id: id });
        if (!oldProduct) oldProduct = await Product.findOne({ legacyId: id });

        const updatePayload = { ...req.body };
        delete updatePayload._id; // NEVER attempt to update immutable _id field
        if (req.body.countryPricing && typeof req.body.countryPricing === 'object') {
            updatePayload.countryPricing = req.body.countryPricing;
        }

        // 1. Try to update by ObjectId first
        if (isObjectId) {
            product = await Product.findByIdAndUpdate(new mongoose.Types.ObjectId(id), { $set: updatePayload }, { new: true });
        }

        // 2. Try raw _id (for string IDs)
        if (!product) {
            product = await Product.findOneAndUpdate({ _id: id }, { $set: updatePayload }, { new: true });
        }

        // 3. Try legacyId field
        if (!product) {
            product = await Product.findOneAndUpdate({ legacyId: id }, { $set: updatePayload }, { new: true });
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // GLOBAL SYNC: Update this product in EVERY user's digital library
        const { Category } = require('../models');
        const categories = await Category.find();

        if (isDigitalProduct(product, categories)) {
            try {
                const libraries = await DigitalLibrary.find({});
                let modifiedCount = 0;

                // Explicitly ensure admin@uwo24.com has it
                const masterAdmin = await User.findOne({ email: 'admin@uwo24.com' });
                const masterAdminId = masterAdmin ? masterAdmin._id.toString() : null;

                for (let lib of libraries) {
                    let changed = false;
                    let found = false;
                    if (!lib.items) lib.items = [];
                    if (!lib.removedItems) lib.removedItems = [];

                    for (let item of lib.items) {
                        if (item.productId && item.productId.toString() === product._id.toString()) {
                            changed = true;
                            found = true;
                            item.title = product.title;
                            item.thumbnail = product.thumbnail;
                            item.filePath = product.filePath;
                            item.type = getDigitalType(product);
                        }
                    }

                    // ADMIN SPECIFIC: If this is the current admin's library OR the master admin's library, ADD IT IF MISSING
                    const isCurrentAdmin = lib.userId && lib.userId.toString() === req.user._id.toString();
                    const isMasterAdmin = lib.userId && lib.userId.toString() === masterAdminId;

                    if ((isCurrentAdmin || isMasterAdmin) && !found) {
                        lib.items.push({
                            productId: product._id,
                            title: product.title,
                            type: getDigitalType(product),
                            thumbnail: product.thumbnail,
                            filePath: product.filePath,
                            purchasedAt: new Date(),
                            accessStatus: 'active'
                        });
                        lib.removedItems = (lib.removedItems || []).filter(id => id.toString() !== product._id.toString());
                        changed = true;
                    }

                    if (changed) {
                        lib.markModified('items');
                        lib.markModified('removedItems');
                        await lib.save();
                        modifiedCount++;
                    }
                }
                console.log(`🌐 Global Library Sync: Updated ${modifiedCount} users for product ${product._id}`);
            } catch (syncErr) {
                console.error('❌ Global library sync error:', syncErr);
            }
        }

        // Cleanup replaced files if they have changed
        if (oldProduct) {
            if (req.body.thumbnail && oldProduct.thumbnail && req.body.thumbnail !== oldProduct.thumbnail) {
                await deleteFile(oldProduct.thumbnail);
            }
            if (req.body.filePath && oldProduct.filePath && req.body.filePath !== oldProduct.filePath) {
                await deleteFile(oldProduct.filePath);
            }
        }

        console.log('📝 Updated Product in DB:', product._id);
        res.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Error updating product: ' + error.message });
    }
});

// Delete All Products (Admin Only)
router.delete('/delete/all-products', adminAuth, async (req, res) => {
    console.log('🗑️ Admin: Deleting ALL Products Request');
    try {
        const products = await Product.find({});
        const fs = require('fs');
        const path = require('path');
        const hasGCS = process.env.GCS_BUCKET_NAME && process.env.GCS_BUCKET_NAME !== 'efv-assets-bucket';

        const deleteFilePath = async (filePath) => {
            if (!filePath) return;
            try {
                if (filePath.startsWith('http') && hasGCS) {
                    const { Storage } = require('@google-cloud/storage');
                    const storage = new Storage({ projectId: process.env.GCS_PROJECT_ID || 'efvframework' });
                    
                    let bucketName = process.env.GCS_BUCKET_NAME;
                    if (filePath.includes('/covers/') && process.env.GCS_COVER_BUCKET_NAME) {
                        bucketName = process.env.GCS_COVER_BUCKET_NAME;
                    }
                    
                    const urlParts = filePath.split('/');
                    const filename = urlParts.slice(4).join('/');
                    if (filename) {
                        await storage.bucket(bucketName).file(filename).delete();
                        console.log(`  ✔ Deleted GCS File: ${filename}`);
                    }
                } else if (!filePath.startsWith('http')) {
                    const localPath = path.join(__dirname, '..', filePath);
                    if (fs.existsSync(localPath)) {
                        fs.unlinkSync(localPath);
                        console.log(`  ✔ Deleted Local File: ${localPath}`);
                    }
                }
            } catch (err) {
                console.error(`  ❌ Failed to delete storage file: ${filePath}`, err.message);
            }
        };

        for (const product of products) {
            if (product.thumbnail) await deleteFilePath(product.thumbnail);
            if (product.filePath) await deleteFilePath(product.filePath);
            if (Array.isArray(product.gallery)) {
                for (const g of product.gallery) {
                    await deleteFilePath(g);
                }
            }
            if (Array.isArray(product.chapters)) {
                for (const ch of product.chapters) {
                    if (ch.filePath) await deleteFilePath(ch.filePath);
                }
            }
        }

        await Product.deleteMany({});
        res.json({ message: 'All products and associated files deleted successfully' });
    } catch (error) {
        console.error('Delete all products error:', error);
        res.status(500).json({ message: 'Error deleting all products: ' + error.message });
    }
});

// Delete Product (Admin Only)
router.delete('/:id', adminAuth, async (req, res) => {
    console.log(`🗑️ Admin: Deleting Product Request for ID: ${req.params.id}`);
    try {
        const id = req.params.id;
        let product = null;

        const isObjectId = /^[a-f\d]{24}$/i.test(id);
        if (isObjectId) {
            const mongoose = require('mongoose');
            product = await Product.findByIdAndDelete(new mongoose.Types.ObjectId(id));
        }

        if (!product) {
            product = await Product.findOneAndDelete({ _id: id });
        }

        if (!product) {
            product = await Product.findOneAndDelete({ legacyId: id });
        }

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete thumbnail, main filePath, and all chapter files
        await deleteFile(product.thumbnail);
        await deleteFile(product.filePath);
        if (product.chapters && product.chapters.length > 0) {
            for (const ch of product.chapters) {
                await deleteFile(ch.filePath);
            }
        }

        // Remove from all DigitalLibrary documents
        try {
            await DigitalLibrary.updateMany(
                {},
                { $pull: { items: { productId: product._id } } }
            );
            console.log(`🌐 Global Sync: Removed product ${product._id} from all digital libraries`);
        } catch (syncErr) {
            console.error("Error cleaning up product references:", syncErr);
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { User, Purchase, Product, UserProgress, DigitalLibrary, Order } = require('../models');

// Helper to get a consistent identifier for userId (supports both ObjectId and custom Strings)
function getUserObjId(user) {
    if (!user) return null;
    const id = user._id || user.id;
    if (!id) return null;

    // If it's a valid 24-hex ObjectId, return it as one
    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
        return new mongoose.Types.ObjectId(id);
    }

    // Fallback: return as-is (e.g. for custom IDs like 'admin-efv-001')
    return id.toString();
}

// Helper to determine if a product is digital based on type, category, or media files
function isDigitalProduct(product, categories = []) {
    if (!product) return false;
    const rawType = (product.type || '').toString().trim().toUpperCase();
    const cleanType = rawType.replace(/[^A-Z]/g, '');

    // 1. Explicitly check if it's a physical book - PHYSICAL BOOKS ARE NEVER DIGITAL
    const physicalSlugs = ['HARDCOVER', 'PAPERBACK', 'PHYSICAL', 'BOOK', 'PRINT'];
    if (physicalSlugs.includes(cleanType) || physicalSlugs.some(p => rawType.includes(p))) {
        return false;
    }

    // 2. Explicitly check if it's a digital format
    const digitalSlugs = ['EBOOK', 'AUDIOBOOK', 'DIGITAL', 'AUDIO'];
    if (digitalSlugs.includes(cleanType)) return true;
    if (rawType.includes('E-BOOK') || rawType.includes('EBOOK') || rawType.includes('AUDIOBOOK') || rawType.includes('AUDIO') || rawType.includes('DIGITAL')) return true;

    const cat = (product.category || '').toString().trim().toUpperCase();
    if (['DIGITAL', 'EBOOK', 'AUDIOBOOK', 'AUDIO', 'E-BOOK'].includes(cat)) {
        // Double check not physical
        if (!physicalSlugs.some(p => rawType.includes(p))) return true;
    }

    if (Array.isArray(product.categories)) {
        if (product.categories.some(c => ['DIGITAL', 'EBOOK', 'AUDIOBOOK', 'AUDIO', 'E-BOOK'].includes(String(c).trim().toUpperCase()))) {
            if (!physicalSlugs.some(p => rawType.includes(p))) return true;
        }
    }

    if (categories && categories.length > 0) {
        const matchingCat = categories.find(c => (c.slug || '').toUpperCase() === rawType || (c.name || '').toUpperCase() === cat);
        if (matchingCat && matchingCat.isDigital) return true;
    }

    if (product.chapters && Array.isArray(product.chapters) && product.chapters.length > 0) return true;

    // Note: Do NOT check product.filePath alone, as physical book records often contain filePath references to PDFs.
    return false;
}

// Helper to determine whether digital item is Audiobook or Ebook
function getDigitalType(product) {
    if (!product) return 'EBOOK';
    const rawType = (product.type || '').toString().trim().toUpperCase();
    if (rawType.includes('AUDIO') || (product.category || '').toString().toUpperCase().includes('AUDIO') || (product.chapters && product.chapters.length > 0)) {
        return 'AUDIOBOOK';
    }
    return 'EBOOK';
}

// Get user's digital library
router.get('/test-ping', (req, res) => res.json({ message: 'Library Route v1.6 is ACTIVE', timestamp: new Date() }));

router.get('/my-library', protect, async (req, res) => {
    try {
        const userEmail = (req.user.email || '').toLowerCase().trim();
        const userObjId = getUserObjId(req.user);

        console.log(`🔍 [LIBRARY GET] Syncing for: ${userEmail} (ID: ${userObjId})`);

        const { Category, Order, Purchase, Product, DigitalLibrary } = require('../models');
        const categories = await Category.find();

        // 1. Order History Check for Unlocked Digital Items:
        // Must be a PAID order and NOT cancelled / failed / returned
        const userQueries = [
            { userId: userObjId },
            { userId: userObjId ? userObjId.toString() : null },
            { "customer.email": userEmail }
        ].filter(q => Object.values(q)[0] != null);

        let orders = await Order.find({
            $and: [
                { $or: userQueries },
                { status: { $nin: ['Cancelled', 'Failed', 'Returned'] } },
                {
                    $or: [
                        { paymentStatus: { $regex: /^paid$/i } },
                        { status: { $in: ['Paid', 'Completed', 'Completed (Digital)'] } }
                    ]
                }
            ]
        });

        // 2. Direct Purchases check
        const directPurchases = await Purchase.find({
            $or: userQueries
        });

        // 3. User document purchasedProducts array
        const userPurchasedList = Array.isArray(req.user.purchasedProducts)
            ? req.user.purchasedProducts.map(p => p.toString())
            : [];

        // Build verified product set & extract digital items from orders
        const verifiedProductIds = new Set(userPurchasedList);
        directPurchases.forEach(dp => {
            if (dp.productId) verifiedProductIds.add(dp.productId.toString());
        });

        const digitalFromOrders = [];
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                if (isDigitalProduct(item, categories)) {
                    const pid = (item.productId || item._id || '').toString();
                    if (pid) {
                        verifiedProductIds.add(pid);
                        digitalFromOrders.push({
                            productId: pid,
                            title: item.title,
                            type: getDigitalType(item),
                            purchasedAt: order.createdAt || new Date(),
                            orderId: order.orderId
                        });
                    }
                }
            });
        });

        // 4. Fetch current library data
        let libraryData = await DigitalLibrary.findOne({
            $or: [
                { userId: userObjId },
                { userId: userObjId ? userObjId.toString() : null }
            ].filter(q => Object.values(q)[0] != null)
        });

        if (!libraryData) {
            console.log(`✨ [LIBRARY GET] Initializing new record for ${userEmail}`);
            libraryData = new DigitalLibrary({ userId: userObjId, items: [], removedItems: [] });
        }

        if (!libraryData.items) libraryData.items = [];
        if (!libraryData.removedItems) libraryData.removedItems = [];

        const removedSet = new Set((libraryData.removedItems || []).map(id => id.toString()));

        // 5. Automated Fulfillment Merge (only verified purchases)
        let newlyUnlockedCount = 0;
        digitalFromOrders.forEach(di => {
            const pidStr = (di.productId || '').toString();
            if (pidStr && !removedSet.has(pidStr) && !libraryData.items.some(li => (li.productId || '').toString() === pidStr)) {
                libraryData.items.push({
                    productId: di.productId,
                    title: di.title,
                    type: di.type,
                    purchasedAt: di.purchasedAt,
                    orderId: di.orderId,
                    accessStatus: 'active'
                });
                newlyUnlockedCount++;
            }
        });

        // 6. STRICT PRUNING:
        // Any item in DigitalLibrary that is NOT in verifiedProductIds must be pruned!
        const initialCount = libraryData.items.length;
        libraryData.items = libraryData.items.filter(item => {
            const pid = (item.productId || item.id || item._id || '').toString();
            return pid && verifiedProductIds.has(pid) && !removedSet.has(pid);
        });

        if (libraryData.items.length !== initialCount || newlyUnlockedCount > 0) {
            console.log(`🛡️ [LIBRARY GET] Pruned unpurchased items or added ${newlyUnlockedCount} verified items for ${userEmail}`);
            libraryData.markModified('items');
            await libraryData.save();
        }

        // 7. Fast Bulk Sync with Marketplace
        const allProducts = await Product.find({});
        const productByIdMap = new Map();
        const productByTitleMap = new Map();
        allProducts.forEach(p => {
            productByIdMap.set(p._id.toString(), p);
            if (p.legacyId) productByIdMap.set(p.legacyId.toString(), p);
            if (p.title) {
                const cleanTitle = p.title.replace(/\(.*\)/, '').replace(/[™®]/g, '').trim().toLowerCase();
                productByTitleMap.set(cleanTitle, p);
            }
        });

        let rawItems = (libraryData.items || []).filter(item => {
            const pid = (item.productId || item.id || item._id || '').toString();
            return !!pid && verifiedProductIds.has(pid);
        });

        const syncItemWithProduct = (item) => {
            const pid = (item.productId || item.id || item._id || '').toString();
            if (!pid) return null;

            let product = productByIdMap.get(pid);
            if (!product && item.title) {
                const cleanTitle = item.title.replace(/\(.*\)/, '').replace(/[™®]/g, '').trim().toLowerCase();
                product = productByTitleMap.get(cleanTitle);
            }

            if (product) {
                return {
                    _id: product._id.toString(),
                    productId: product._id.toString(),
                    title: product.title,
                    type: getDigitalType(product),
                    thumbnail: product.thumbnail || item.thumbnail,
                    filePath: product.filePath || item.filePath,
                    purchasedAt: item.purchasedAt || item.addedAt || item.createdAt || new Date(),
                    progress: item.progress || 0,
                    language: product.language || item.language || 'English',
                    isSynced: true
                };
            }
            return {
                _id: pid,
                productId: pid,
                title: item.title,
                type: getDigitalType(item),
                thumbnail: item.thumbnail,
                filePath: item.filePath,
                purchasedAt: item.purchasedAt || new Date(),
                progress: item.progress || 0,
                language: item.language || 'English',
                isSynced: false
            };
        };

        const results = rawItems.map(syncItemWithProduct).filter(Boolean);

        // Deduplication & Sorting
        const libraryMap = new Map();
        for (const item of results) {
            if (!item) continue;
            const key = (item.productId || item.id || item._id || '').toString();
            if (key && !libraryMap.has(key)) {
                libraryMap.set(key, item);
            }
        }

        const library = Array.from(libraryMap.values());
        library.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));

        console.log(`✅ [LIBRARY GET] Success. Returning ${library.length} items to ${userEmail}`);
        res.json(library);
    } catch (error) {
        console.error('❌ [LIBRARY GET] Global Error:', error);
        res.status(500).json({ message: 'Error fetching library' });
    }
});

// Save Progress
router.post('/progress', protect, async (req, res) => {
    try {
        const { productId, progress, total } = req.body;
        const userId = req.user._id;

        const updatedProgress = await UserProgress.findOneAndUpdate(
            { userId, productId },
            { progress, total, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );

        res.json(updatedProgress);
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ message: 'Error saving progress' });
    }
});

// Get Progress
router.get('/progress/:productId', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId;

        const progress = await UserProgress.findOne({ userId, productId });

        res.json(progress || { progress: 0, total: 0 });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Error fetching progress' });
    }
});

// Add product to user's library (Manual/Instant Fulfillment - Admin Only)
router.post('/add', protect, adminAuth, async (req, res) => {
    try {
        const { productId } = req.body;
        const userObjId = getUserObjId(req.user);
        const userEmail = (req.user.email || '').toLowerCase().trim();

        if (!userObjId) return res.status(401).json({ success: false, message: 'User session invalid' });
        if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required' });

        console.log(`📥 [LIBRARY ADD] Request received: Product=${productId} | User=${userEmail} (ID: ${userObjId})`);

        let product = null;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId.toString());
        if (isObjectId) {
            product = await Product.findById(new mongoose.Types.ObjectId(productId.toString()));
        }
        if (!product) {
            product = await Product.findOne({ legacyId: productId.toString() });
        }
        if (!product) {
            try {
                product = await Product.findOne({ _id: productId.toString() });
            } catch (err) {}
        }

        if (!product) {
            console.warn(`❌ [LIBRARY ADD] Product Not Found: ${productId}`);
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        // Check if digital product
        const { Category: CatModel } = require('../models');
        const cats = await CatModel.find();
        if (!isDigitalProduct(product, cats)) {
            console.warn(`🚨 [LIBRARY ADD] Rejected Non-Digital Product: ${product.type} | ${product.title}`);
            return res.status(400).json({ success: false, message: 'Only digital products can be added to your library.' });
        }

        let library = await DigitalLibrary.findOne({
            $or: [{ userId: userObjId }, { userId: userObjId.toString() }]
        });

        if (!library) {
            console.log(`✨ [LIBRARY ADD] Creating NEW library record for ${userEmail}`);
            library = new DigitalLibrary({ userId: userObjId, items: [], removedItems: [] });
        }

        if (!library.items) library.items = [];
        if (!library.removedItems) library.removedItems = [];

        const pidStr = product._id.toString();

        // Remove from removedItems
        library.removedItems = (library.removedItems || []).filter(id => id.toString() !== pidStr && id.toString() !== productId.toString());

        // Deduplicate in items
        library.items = (library.items || []).filter(item =>
            (item.productId || '').toString() !== pidStr &&
            (item.id || '').toString() !== pidStr &&
            (item.productId || '').toString() !== productId.toString()
        );

        // Add item
        const libraryItem = {
            productId: product._id,
            title: product.title,
            type: getDigitalType(product),
            thumbnail: product.thumbnail,
            filePath: product.filePath,
            purchasedAt: new Date(),
            accessStatus: 'active'
        };

        library.items.push(libraryItem);
        library.markModified('items');
        library.markModified('removedItems');
        await library.save();

        // Also record in User purchasedProducts for verified consistency
        try {
            const mongoUser = await User.findById(req.user._id);
            if (mongoUser) {
                if (!mongoUser.purchasedProducts) mongoUser.purchasedProducts = [];
                if (!mongoUser.purchasedProducts.some(id => id.toString() === pidStr)) {
                    mongoUser.purchasedProducts.push(pidStr);
                    mongoUser.markModified('purchasedProducts');
                    await mongoUser.save();
                }
            }
        } catch (e) {
            console.warn('Could not update user purchasedProducts:', e.message);
        }

        console.log(`✅ [LIBRARY ADD] Successfully saved product: ${product.title} (${pidStr}) for user: ${userEmail}`);
        res.status(201).json({ success: true, message: 'Product added to library successfully!' });
    } catch (error) {
        console.error('❌ [LIBRARY ADD] Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error while adding to library', error: error.message });
    }
});

router.delete('/my-library/all', protect, async (req, res) => {
    try {
        const user = req.user;
        const delUserObjId = getUserObjId(user);

        console.log(`🗑️ REMOVE ALL REQUEST: User=${user.email}`);

        let library = await DigitalLibrary.findOne({
            $or: [{ userId: delUserObjId }, { userId: delUserObjId.toString() }]
        });

        if (!library) {
            return res.status(404).json({ message: 'Library not found' });
        }

        const currentItemIds = (library.items || [])
            .map(item => (item.productId || item.id || item._id || '').toString())
            .filter(id => id);

        const uEmailLower = (user.email || '').toLowerCase().trim();
        const isAdmin = user.role === 'admin' || uEmailLower === 'admin@uwo24.com' || uEmailLower === 'efv@uwo24.com';
        if (isAdmin) {
            const { Category } = require('../models');
            const categories = await Category.find();
            const allDigitalProducts = (await Product.find({})).filter(p => isDigitalProduct(p, categories));
            
            allDigitalProducts.forEach(prod => {
                const pidStr = prod._id.toString();
                if (!currentItemIds.includes(pidStr)) {
                    currentItemIds.push(pidStr);
                }
            });
        }

        if (!library.removedItems) {
            library.removedItems = [];
        }

        const existingRemoved = new Set(library.removedItems.map(id => id.toString()));
        currentItemIds.forEach(id => {
            if (!existingRemoved.has(id)) {
                library.removedItems.push(id);
            }
        });

        library.items = [];
        library.markModified('items');
        library.markModified('removedItems');
        await library.save();

        console.log(`✅ REMOVE ALL: Cleared ${currentItemIds.length} items for user: ${user.email}`);
        return res.json({ message: 'All items permanently removed from library', library });

    } catch (error) {
        console.error('ERROR in DELETE /my-library/all:', error);
        res.status(500).json({ message: 'Error removing all from library', error: error.message });
    }
});

router.delete('/my-library/:productId', protect, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = req.user;

        console.log(`🗑️ REMOVE REQUEST: Product=${productId}, User=${user.email}`);

        const delUserObjId = getUserObjId(user);
        const queryMatch = { $or: [{ userId: delUserObjId }, { userId: delUserObjId.toString() }] };

        const pulls = [productId];
        if (mongoose.Types.ObjectId.isValid(productId)) {
            pulls.push(new mongoose.Types.ObjectId(productId));
        }

        let library = await DigitalLibrary.findOne(queryMatch);
        if (!library) {
            library = new DigitalLibrary({ userId: delUserObjId, items: [], removedItems: [] });
        }

        library.items = (library.items || []).filter(item => {
            const itemProdId = item.productId || item.id || item._id;
            return itemProdId && !pulls.some(p => p.toString() === itemProdId.toString());
        });

        if (!library.removedItems) {
            library.removedItems = [];
        }
        const pidStr = productId.toString();
        if (!library.removedItems.some(id => id.toString() === pidStr)) {
            library.removedItems.push(productId);
        }

        library.markModified('items');
        library.markModified('removedItems');
        await library.save();

        return res.json({ message: 'Item permanently removed from library', library });

    } catch (error) {
        console.error('ERROR in DELETE /my-library:', error);
        res.status(500).json({ message: 'Error removing from library', error: error.message });
    }
});

router.post('/admin/assign', protect, adminAuth, async (req, res) => {
    try {
        const { userId, productId } = req.body;
        if (!userId || !productId) {
            return res.status(400).json({ message: 'User ID and Product ID are required.' });
        }

        let user = null;
        if (mongoose.Types.ObjectId.isValid(userId.toString())) {
            user = await User.findById(new mongoose.Types.ObjectId(userId.toString()));
        }
        if (!user) {
            user = await User.findOne({ email: userId.toString().trim().toLowerCase() });
        }
        if (!user) {
            try {
                user = await User.findOne({ _id: userId.toString() });
            } catch (e) {}
        }
        if (!user) return res.status(404).json({ message: 'User not found.' });

        let product = null;
        if (mongoose.Types.ObjectId.isValid(productId.toString())) {
            product = await Product.findById(new mongoose.Types.ObjectId(productId.toString()));
        }
        if (!product) {
            product = await Product.findOne({ legacyId: productId.toString() });
        }
        if (!product) {
            try {
                product = await Product.findOne({ _id: productId.toString() });
            } catch (e) {}
        }
        if (!product) return res.status(404).json({ message: 'Product not found.' });

        const userObjId = getUserObjId(user);
        let library = await DigitalLibrary.findOne({
            $or: [{ userId: userObjId }, { userId: userObjId.toString() }]
        });

        if (!library) {
            library = new DigitalLibrary({ userId: userObjId, items: [], removedItems: [] });
        }

        if (!library.items) library.items = [];
        if (!library.removedItems) library.removedItems = [];

        const pidStr = product._id.toString();

        // Remove from removedItems
        library.removedItems = (library.removedItems || []).filter(id => id.toString() !== pidStr && id.toString() !== productId.toString());

        // Update or add item in library
        const existingIdx = library.items.findIndex(item =>
            (item.productId || '').toString() === pidStr ||
            (item.id || '').toString() === pidStr ||
            (item.productId || '').toString() === productId.toString()
        );

        const libraryItem = {
            productId: product._id,
            title: product.title,
            type: getDigitalType(product),
            thumbnail: product.thumbnail,
            filePath: product.filePath,
            purchasedAt: new Date(),
            accessStatus: 'active'
        };

        if (existingIdx >= 0) {
            library.items[existingIdx] = { ...library.items[existingIdx], ...libraryItem };
        } else {
            library.items.push(libraryItem);
        }

        library.markModified('items');
        library.markModified('removedItems');
        await library.save();

        // Also record in User purchasedProducts for verified consistency
        try {
            if (!user.purchasedProducts) user.purchasedProducts = [];
            if (!user.purchasedProducts.some(id => id.toString() === pidStr)) {
                user.purchasedProducts.push(pidStr);
                user.markModified('purchasedProducts');
                await user.save();
            }
        } catch (e) {
            console.warn('Could not update user purchasedProducts:', e.message);
        }

        console.log(`✅ [ADMIN ASSIGN] Added/Updated ${product.title} to library of user: ${user.email}`);
        return res.json({ success: true, message: 'Book assigned successfully!' });

    } catch (error) {
        console.error('ERROR in POST /admin/assign:', error);
        res.status(500).json({ message: 'Error assigning book', error: error.message });
    }
});

module.exports = router;


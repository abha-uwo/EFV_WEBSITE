const express = require('express');
const router = express.Router();
const JsonDB = require('../utils/jsonDB');
const demoUsersDB = new JsonDB('demo_users.json');

// Demo purchase endpoint - adds product to user's library instantly
router.post('/add-to-library', (req, res) => {
    try {
        const { productId } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization token provided' });
        }

        // Extract email from demo token (base64 encoded)
        const token = authHeader.split(' ')[1];
        const userEmail = Buffer.from(token, 'base64').toString('utf-8');

        // Get or create user in demo DB
        let user = demoUsersDB.getById(userEmail);
        if (!user) {
            user = demoUsersDB.create({
                id: userEmail,
                _id: userEmail,
                email: userEmail,
                name: userEmail.split('@')[0],
                library: []
            });
        }

        // Find product
        const product = global.demoProducts.find(p => p._id === productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if already in library
        if (user.library.some(item => item._id === productId)) {
            return res.status(400).json({ message: 'Product already in your library' });
        }

        // Add to library
        user.library.push(product);
        demoUsersDB.update(userEmail, user);

        // Also update memory map if it's used as a flag
        if (global.demoUsers) global.demoUsers.set(userEmail, user);

        res.json({
            message: `${product.title} added to your library!`,
            product
        });
    } catch (error) {
        console.error('Demo purchase error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user library
router.get('/library', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.json({ library: [] });
        }

        const token = authHeader.split(' ')[1];
        const userEmail = Buffer.from(token, 'base64').toString('utf-8');

        const user = demoUsersDB.getById(userEmail);
        res.json({ library: user ? user.library : [] });
    } catch (error) {
        res.json({ library: [] });
    }
});

// Get library count
router.get('/library-count', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.json({ count: 0 });
        }

        const token = authHeader.split(' ')[1];
        const userEmail = Buffer.from(token, 'base64').toString('utf-8');

        const user = global.demoUsers.get(userEmail);
        res.json({ count: user ? user.library.length : 0 });
    } catch (error) {
        res.json({ count: 0 });
    }
});

// Save progress
router.post('/progress', (req, res) => {
    try {
        const { productId, progress, total } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization token provided' });
        }

        const token = authHeader.split(' ')[1];
        const userEmail = Buffer.from(token, 'base64').toString('utf-8');

        let user = demoUsersDB.getById(userEmail);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize progress map if not exists
        if (!user.progress) {
            user.progress = {};
        }

        user.progress[productId] = {
            page: progress,
            total: total || 0,
            lastUpdated: new Date().toISOString()
        };

        demoUsersDB.update(userEmail, user);

        // Update memory cache if used
        if (global.demoUsers) global.demoUsers.set(userEmail, user);

        res.json({ message: 'Progress saved', progress: user.progress[productId] });
    } catch (error) {
        console.error('Progress save error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get progress
router.get('/progress/:productId', (req, res) => {
    try {
        const { productId } = req.params;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.json({ progress: 1 });
        }

        const token = authHeader.split(' ')[1];
        const userEmail = Buffer.from(token, 'base64').toString('utf-8');

        const user = demoUsersDB.getById(userEmail);

        if (user && user.progress && user.progress[productId]) {
            return res.json({
                progress: user.progress[productId].page,
                total: user.progress[productId].total
            });
        }

        res.json({ progress: 1 });
    } catch (error) {
        console.error('Get progress error:', error);
        res.json({ progress: 1 });
    }
});

module.exports = router;

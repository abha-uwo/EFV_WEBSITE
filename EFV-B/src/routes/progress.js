const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { UserProgress } = require('../models');

// GET Progress
router.get('/:productId', protect, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({
            userId: req.user._id,
            productId: req.params.productId
        });

        if (!progress) {
            return res.json({ found: false });
        }
        res.json({ found: true, data: progress });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// SYNC Progress (Upsert)
router.post('/:productId', protect, async (req, res) => {
    try {
        const { type, progress, currentTime, totalDuration, lastPage, totalPages, scrollPosition } = req.body;

        // Find and update, or create if not exists
        const updatedProgress = await UserProgress.findOneAndUpdate(
            {
                userId: req.user._id,
                productId: req.params.productId
            },
            {
                type,
                progress,
                currentTime,
                totalDuration,
                lastPage,
                totalPages,
                scrollPosition,
                lastUpdated: Date.now()
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, data: updatedProgress });
    } catch (error) {
        console.error('Error syncing progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

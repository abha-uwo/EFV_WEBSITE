const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const adminAuth = require('../middleware/adminAuth');

const dataFile = path.join(__dirname, '../data/insights.json');
const uploadDir = path.join(__dirname, '../../public/uploads/insights');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(null, `insight-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

const readData = () => {
    try {
        if (!fs.existsSync(dataFile)) {
            fs.writeFileSync(dataFile, '[]', 'utf8');
            return [];
        }
        const data = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading insights:", e);
        return [];
    }
};

const writeData = (data) => {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
};

// GET /api/insights (Public & Admin)
// If admin is passed as query param `?admin=true` and token is valid, return all.
// Otherwise return only published.
router.get('/', async (req, res) => {
    try {
        let insights = readData();
        const isAdminRequest = req.query.admin === 'true';

        // Sort by created date descending
        insights.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (!isAdminRequest) {
            insights = insights.filter(i => i.status === 'Published');
        }

        res.json(insights);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/insights/:slug
router.get('/:slug', async (req, res) => {
    try {
        const insights = readData();
        const insight = insights.find(i => i.slug === req.params.slug);
        
        if (!insight) return res.status(404).json({ message: 'Insight not found' });
        
        // Only allow viewing published ones unless user is admin? For simplicity, we just return it.
        // Increment view count
        insight.views = (insight.views || 0) + 1;
        writeData(insights);

        res.json(insight);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/insights (Admin only)
router.post('/', adminAuth, upload.single('banner'), async (req, res) => {
    try {
        const { title, category, summary, content, status } = req.body;
        
        if (!title || !category || !content) {
            return res.status(400).json({ message: 'Title, category, and content are required' });
        }

        const insights = readData();
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
        
        const readTimeMinutes = Math.max(1, Math.ceil(content.split(' ').length / 200));

        const newInsight = {
            _id: 'ins-' + Date.now().toString(36),
            title,
            slug,
            category,
            summary: summary || '',
            content,
            status: status || 'Draft',
            author: 'EFV™ Research Team',
            banner: req.file ? `uploads/insights/${req.file.filename}` : '',
            views: 0,
            readTime: `${readTimeMinutes} min read`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        insights.push(newInsight);
        writeData(insights);

        res.status(201).json(newInsight);
    } catch (error) {
        console.error("Create Insight Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/insights/:id (Admin only)
router.put('/:id', adminAuth, upload.single('banner'), async (req, res) => {
    try {
        const insights = readData();
        const index = insights.findIndex(i => i._id === req.params.id);
        
        if (index === -1) return res.status(404).json({ message: 'Insight not found' });

        const { title, category, summary, content, status } = req.body;
        
        const insight = insights[index];
        if (title) insight.title = title;
        if (category) insight.category = category;
        if (summary) insight.summary = summary;
        if (content) {
            insight.content = content;
            insight.readTime = `${Math.max(1, Math.ceil(content.split(' ').length / 200))} min read`;
        }
        if (status) insight.status = status;
        if (req.file) insight.banner = `uploads/insights/${req.file.filename}`;
        insight.updatedAt = new Date().toISOString();

        writeData(insights);
        res.json(insight);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/insights/:id (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        let insights = readData();
        const initialLength = insights.length;
        insights = insights.filter(i => i._id !== req.params.id);
        
        if (insights.length === initialLength) {
            return res.status(404).json({ message: 'Insight not found' });
        }

        writeData(insights);
        res.json({ message: 'Insight removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/insights/upload-image (Admin only) - For Quill Editor inline images
router.post('/upload-image', adminAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        res.json({ url: `${process.env.BASE_URL || 'http://localhost:8080'}/uploads/insights/${req.file.filename}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

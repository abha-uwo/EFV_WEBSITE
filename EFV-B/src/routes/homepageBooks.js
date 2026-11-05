const express = require('express');
const router = express.Router();
const { HomepageBook } = require('../models');
const adminAuth = require('../middleware/adminAuth');
const { deleteFile } = require('../utils/storageCleanup');

const defaultBooks = [
    {
        title: 'ORIGIN CODE',
        description: 'A journey into the starting point of everything - where consciousness, energy, and existence begin. This volume lays the foundation for understanding how reality is formed.',
        status: 'purchase_now',
        thumbnail: 'assets/images/vol1-cover.png'
    },
    {
        title: 'MINDOS',
        description: 'An exploration of how thoughts and emotions shape our inner world. It breaks down the architecture of the human mind in a clear, practical way.',
        status: 'notify_me',
        thumbnail: 'assets/images/Vol 2 Cover EFV.png'
    },
    {
        title: 'UNIVERSAL ACTIVATION',
        description: 'A guide to awakening the untapped potential within you. It helps you recognize and activate the deeper frequencies that drive growth and clarity.',
        status: 'notify_me',
        thumbnail: 'assets/images/vol 3.png'
    },
    {
        title: 'RESONANCE BRIDGE',
        description: 'Bridges the gap between human awareness and universal intelligence. This volume shows how alignment creates flow, intuition, and meaningful synchronicity.',
        status: 'notify_me',
        thumbnail: 'assets/images/vol 4.png'
    },
    {
        title: 'HUMAN OS',
        description: 'A fresh look at the human operating system how we think, decide, evolve, and build the future. It connects human consciousness with the next era of AI.',
        status: 'notify_me',
        thumbnail: 'assets/images/vol 5.png'
    },
    {
        title: 'EMOTIONOS',
        description: 'Explains emotional intelligence as a powerful stabilizing force. It shows how emotional calibration creates harmony between humans and intelligent systems.',
        status: 'notify_me',
        thumbnail: 'assets/images/vol 6.png'
    },
    {
        title: 'MEMORIOS',
        description: 'Explores memory as the thread that holds identity together. It examines how continuity across time shapes who we are and who we become.',
        status: 'notify_me',
        thumbnail: 'assets/images/vol 7.jpeg'
    },
    {
        title: 'AGENTOS',
        description: 'Unpacks the rise of autonomous intelligence and intelligent agents. A practical blueprint for understanding the agent-driven world ahead.',
        status: 'notify_me',
        thumbnail: 'assets/images/vol 8.png'
    },
    {
        title: 'GOVERNANCEOS',
        description: 'Focuses on ethics, alignment, and responsibility in an AI-powered civilization. It defines the principles that ensure technology evolves with wisdom.',
        status: 'notify_me',
        thumbnail: 'assets/images/vol 9.png'
    }
];

// Seed defaults helper
async function seedDefaultBooks() {
    try {
        console.log('🌱 Seeding default homepage slider books...');
        for (const book of defaultBooks) {
            // Use upsert to avoid duplicate entries on repeated seed attempts
            await HomepageBook.findOneAndUpdate(
                { title: book.title },
                { $setOnInsert: book },
                { upsert: true, new: true }
            );
        }
        console.log('✅ Homepage books seeded successfully.');
    } catch (e) {
        console.error('❌ Error seeding homepage books:', e);
    }
}

const path = require('path');
const fs = require('fs');

const defaultHeader = {
    title: 'EFV<sup>TM</sup> Books <span class="gold-text">(Volume 1-9 Series)</span>',
    subtitle: 'Volume 1 & 2 releasing this month.<br>\n9-volume transformational system covering:',
    topics: [
        'Alignment',
        'Flow',
        'Conscious Living',
        'Energy Science',
        'Emotional Frameworks',
        'Meditation & Frequency Practices'
    ]
};

const headerFilePath = path.join(__dirname, '../data/homepage_books_header.json');

function getHeaderData() {
    try {
    try {
        if (fs.existsSync(headerFilePath)) {
            const raw = fs.readFileSync(headerFilePath, 'utf8');
            return JSON.parse(raw);
        } else {
            // Header file missing – create it with default values for future reads
            fs.writeFileSync(headerFilePath, JSON.stringify(defaultHeader, null, 2), 'utf8');
            return defaultHeader;
        }
    } catch (e) {
        console.error('Error reading homepage books header:', e);
    }
    return defaultHeader;    } catch (e) {
        console.error('Error reading homepage books header:', e);
    }
    return defaultHeader;
}

function saveHeaderData(data) {
    try {
        fs.writeFileSync(headerFilePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Error saving homepage books header:', e);
        return false;
    }
}

// GET homepage books header & topics config
router.get('/header', (req, res) => {
    try {
        const header = getHeaderData();
        res.json(header);
    } catch (error) {
        console.error('Error getting homepage books header:', error);
        res.status(500).json({ message: 'Error getting header config' });
    }
});

// POST homepage books header & topics config
router.post('/header', adminAuth, (req, res) => {
    try {
        const { title, subtitle, topics } = req.body;
        const current = getHeaderData();
        const updated = {
            title: title !== undefined ? title : current.title,
            subtitle: subtitle !== undefined ? subtitle : current.subtitle,
            topics: Array.isArray(topics) ? topics : (topics ? topics.split(',').map(s => s.trim()).filter(Boolean) : current.topics)
        };
        saveHeaderData(updated);
        res.json({ message: 'Homepage books header updated successfully', data: updated });
    } catch (error) {
        console.error('Error saving homepage books header:', error);
        res.status(500).json({ message: 'Error saving header config' });
    }
});

// GET all homepage books
router.get('/', async (req, res) => {
    try {
        let books = await HomepageBook.find();
        if (!books || books.length === 0) {
            await seedDefaultBooks();
            books = await HomepageBook.find();
        }
        res.json(books);
    } catch (error) {
        console.error('Error fetching homepage books:', error);
        res.status(500).json({ message: 'Error fetching homepage books' });
    }
});

// POST a homepage book (Create or Update)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { id, title, description, status, thumbnail, isHeader, subtitle, topics } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const bookData = { title, description, status, thumbnail };
        if (isHeader) {
            bookData.isHeader = true;
            if (subtitle !== undefined) bookData.subtitle = subtitle;
            if (topics !== undefined) bookData.topics = topics;
        }

        if (id) {
            // Fetch old book to compare thumbnail
            let oldBook = await HomepageBook.findById(id);
            if (!oldBook) oldBook = await HomepageBook.findOne({ _id: id });

            // Update
            const updated = await HomepageBook.findByIdAndUpdate(id, bookData, { new: true });
            
            let finalBook = updated;
            if (!updated) {
                // Fallback for non-ObjectId strings in JSON DB
                const fallbackUpdate = await HomepageBook.findOneAndUpdate({ _id: id }, bookData, { new: true });
                if (!fallbackUpdate) {
                    return res.status(404).json({ message: 'Book not found' });
                }
                finalBook = fallbackUpdate;
            }

            if (oldBook && bookData.thumbnail && bookData.thumbnail !== oldBook.thumbnail) {
                if (!oldBook.thumbnail.startsWith('assets/')) {
                    await deleteFile(oldBook.thumbnail);
                }
            }

            return res.json(finalBook);
        } else {
            // Create
            const newBook = await HomepageBook.create(bookData);
            res.status(201).json(newBook);
        }
    } catch (error) {
        console.error('Error saving homepage book:', error);
        res.status(500).json({ message: 'Error saving homepage book' });
    }
});

// DELETE a homepage book
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        let deleted = await HomepageBook.findByIdAndDelete(req.params.id);
        if (!deleted) {
            // Fallback for JSON DB
            deleted = await HomepageBook.findOneAndDelete({ _id: req.params.id });
        }

        if (!deleted) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (deleted.thumbnail && !deleted.thumbnail.startsWith('assets/')) {
            await deleteFile(deleted.thumbnail);
        }

        res.json({ message: 'Book deleted', book: deleted });
    } catch (error) {
        console.error('Error deleting homepage book:', error);
        res.status(500).json({ message: 'Error deleting homepage book' });
    }
});

// DELETE all homepage books
router.delete('/delete/all-books', adminAuth, async (req, res) => {
    try {
        await HomepageBook.deleteMany({});
        res.json({ message: 'All homepage books deleted successfully' });
    } catch (error) {
        console.error('Error deleting all homepage books:', error);
        res.status(500).json({ message: 'Error deleting all homepage books' });
    }
});

module.exports = router;

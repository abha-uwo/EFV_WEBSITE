const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { Lead } = require('../models');

// ─── WEBHOOK ENDPOINT ──────────────────────────────────────────────────────────
// POST /api/leads/webhook
// Called by external websites / landing pages.
// Requires header: X-Webhook-Secret: <WEBHOOK_SECRET from .env>
// No JWT auth — public endpoint, authenticated by secret only.
router.post('/webhook', async (req, res) => {
    try {
        // Extract lead data (supports both flat and nested payloads)
        const body = req.body || {};
        const name    = body.name    || body.full_name   || body.fullName   || '';
        const email   = body.email   || body.email_address || '';
        const phone   = body.phone   || body.mobile      || body.contact    || '';
        const message = body.message || body.description || body.comments   || '';
        const source  = body.source  || body.form_name   || body.page       || 'website';

        // Basic validation — at least email or phone required
        if (!email && !phone) {
            return res.status(400).json({ success: false, message: 'At least email or phone is required' });
        }

        // Save lead
        const lead = new Lead({
            name,
            email,
            phone,
            message,
            source,
            status: 'New',
            rawPayload: body
        });
        await lead.save();

        console.log(`✅ [LEADS WEBHOOK] New lead saved: ${name || 'Unknown'} <${email}> from [${source}]`);
        res.status(201).json({ success: true, message: 'Lead received successfully', id: lead._id });

    } catch (error) {
        console.error('❌ [LEADS WEBHOOK] Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ─── ADMIN: GET ALL LEADS ──────────────────────────────────────────────────────
// GET /api/leads
// Query params: status, source, search, page, limit, from, to
router.get('/', protect, adminAuth, async (req, res) => {
    try {
        const { status, source, search, page = 1, limit = 50, from, to } = req.query;

        const filter = {};
        if (status && status !== 'All') filter.status = status;
        if (source && source !== 'All') filter.source = { $regex: source, $options: 'i' };

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to)   filter.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
        }

        if (search) {
            filter.$or = [
                { name:  { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Lead.countDocuments(filter);
        const leads = await Lead.find(filter)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // Stats for dashboard cards
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [totalAll, newToday, converted, newStatus] = await Promise.all([
            Lead.countDocuments({}),
            Lead.countDocuments({ createdAt: { $gte: todayStart } }),
            Lead.countDocuments({ status: 'Converted' }),
            Lead.countDocuments({ status: 'New' })
        ]);

        // Get unique sources for filter dropdown
        const sources = await Lead.distinct('source');

        res.json({
            leads,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            stats: { totalAll, newToday, converted, newStatus },
            sources
        });
    } catch (error) {
        console.error('❌ [LEADS GET] Error:', error);
        res.status(500).json({ message: 'Error fetching leads' });
    }
});

// ─── ADMIN: UPDATE LEAD STATUS / NOTES ────────────────────────────────────────
// PATCH /api/leads/:id
router.patch('/:id', protect, adminAuth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const update = {};
        if (status) update.status = status;
        if (notes !== undefined) update.notes = notes;

        const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!lead) return res.status(404).json({ message: 'Lead not found' });

        console.log(`✏️ [LEADS PATCH] Lead ${req.params.id} → status: ${status || 'unchanged'}`);
        res.json({ success: true, lead });
    } catch (error) {
        console.error('❌ [LEADS PATCH] Error:', error);
        res.status(500).json({ message: 'Error updating lead' });
    }
});

// ─── ADMIN: DELETE LEAD ────────────────────────────────────────────────────────
// DELETE /api/leads/:id
router.delete('/:id', protect, adminAuth, async (req, res) => {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        console.log(`🗑️ [LEADS DELETE] Lead ${req.params.id} deleted`);
        res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
        console.error('❌ [LEADS DELETE] Error:', error);
        res.status(500).json({ message: 'Error deleting lead' });
    }
});

// ─── ADMIN: EXPORT CSV ─────────────────────────────────────────────────────────
// GET /api/leads/export
router.get('/export', protect, adminAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && status !== 'All') filter.status = status;

        const leads = await Lead.find(filter).sort({ createdAt: -1 });

        const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Message', 'Notes', 'Date'];
        const rows = leads.map(l => [
            `"${(l.name    || '').replace(/"/g, '""')}"`,
            `"${(l.email   || '').replace(/"/g, '""')}"`,
            `"${(l.phone   || '').replace(/"/g, '""')}"`,
            `"${(l.source  || '').replace(/"/g, '""')}"`,
            `"${(l.status  || '').replace(/"/g, '""')}"`,
            `"${(l.message || '').replace(/"/g, '""')}"`,
            `"${(l.notes   || '').replace(/"/g, '""')}"`,
            `"${new Date(l.createdAt).toLocaleString('en-IN')}"`
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="efv-leads-${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // BOM for Excel UTF-8 support
    } catch (error) {
        console.error('❌ [LEADS EXPORT] Error:', error);
        res.status(500).json({ message: 'Error exporting leads' });
    }
});

module.exports = router;

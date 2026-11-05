/**
 * geolocation.js — Express Router for Automatic Country & Geolocation Detection
 * 
 * Endpoints:
 * - GET /api/geolocation/detect  -> Detects caller's country via IPData (or fallback)
 * - GET /api/geolocation/country -> Alias to /detect
 * - GET /api/geolocation/status  -> Returns cache statistics & service health
 */

const express = require('express');
const router = express.Router();
const ipdataService = require('../services/ipdataService');
const adminAuth = require('../middleware/adminAuth');

/**
 * GET /api/geolocation/detect
 * Main automatic visitor country detection endpoint.
 * Non-blocking, fast, cached, with safe fallback.
 */
router.get('/detect', async (req, res) => {
    try {
        const geoData = await ipdataService.detectCountry(req);
        
        // Never freeze detection in browser cache so VPN changes or location changes update immediately
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).json(geoData);
    } catch (err) {
        console.error('🚨 [Geolocation API] Unexpected error in /detect:', err);
        // Guarantee safe response even in unexpected exception
        const fallback = ipdataService.getFallbackResponse(req, req.ip, 'server_error');
        return res.status(200).json(fallback);
    }
});

/**
 * GET /api/geolocation/country
 * Alias for /detect for convenience
 */
router.get('/country', async (req, res) => {
    try {
        const geoData = await ipdataService.detectCountry(req);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).json(geoData);
    } catch (err) {
        const fallback = ipdataService.getFallbackResponse(req, req.ip, 'server_error');
        return res.status(200).json(fallback);
    }
});

/**
 * GET /api/geolocation/status
 * Administrative endpoint to monitor IPData status and cache metrics
 */
router.get('/status', (req, res) => {
    const stats = ipdataService.getCacheStats();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
        status: 'active',
        service: 'IPData Geolocation Detection',
        ...stats,
        timestamp: new Date().toISOString()
    });
});

/**
 * POST /api/geolocation/clear-cache
 * Administrative endpoint to flush geolocation cache (requires admin auth)
 */
router.post('/clear-cache', adminAuth, (req, res) => {
    const result = ipdataService.clearCache();
    return res.status(200).json({
        success: true,
        message: 'Geolocation cache successfully cleared',
        ...result
    });
});

module.exports = router;


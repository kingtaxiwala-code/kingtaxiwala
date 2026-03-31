const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Gallery = require('../models/Gallery');
const Pricing = require('../models/Pricing');
const Tariff = require('../models/Tariff');
const mongoose = require('mongoose');
const { clearCache } = require('../utils/cache');

const JWT_SECRET = process.env.JWT_SECRET || 'temporary_secret_key_for_dev';
const isDbConnected = () => {
    const connected = mongoose.connection.readyState === 1;
    console.log(`Checking DB connection: ${connected ? 'CONNECTED' : 'OFFLINE'} (state: ${mongoose.connection.readyState})`);
    return connected;
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ success: false, error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.adminId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
};

// @route   POST /api/admin/login
// @desc    Admin login (Restricted to .env credentials)
router.post('/login', async (req, res) => {
    const { username, password, secretKey } = req.body;
    
    // Check if secret key is required and valid
    const requiredSecret = process.env.ADMIN_SECRET_KEY;
    if (requiredSecret && secretKey !== requiredSecret) {
        return res.status(403).json({ success: false, error: 'Invalid access key' });
    }

    const envUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPassword = process.env.ADMIN_PASSWORD || 'password123';

    try {
        // We still check the DB to maintain compatibility with existing admin records, 
        // but we enforce that the username must match the one in .env
        if (username !== envUsername) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Validate password against .env (primary security)
        if (password !== envPassword) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Find or Create admin in DB to get an ID for JWT
        let admin = await Admin.findOne({ username: envUsername });
        if (!admin) {
            // If they match .env but don't exist in DB, create them (auto-sync)
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(envPassword, salt);
            admin = await Admin.create({ username: envUsername, password: hashedPassword });
        }

        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ success: true, token });
    } catch (err) {
        console.error('[Login Error]', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route   GET /api/admin/bookings
router.get('/bookings', verifyToken, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   DELETE /api/admin/bookings/:id
router.delete('/bookings/:id', verifyToken, async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        // No cache for bookings, so no clear needed unless specifically added
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   GET /api/admin/reviews
router.get('/reviews', verifyToken, async (req, res) => {
    try {
        console.log('[DEBUG] Fetching reviews for admin dashboard...');
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', verifyToken, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        clearCache('/api/reviews');
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   GET /api/admin/gallery
router.get('/gallery', verifyToken, async (req, res) => {
    try {
        const images = await Gallery.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: images });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   POST /api/admin/gallery
router.post('/gallery', verifyToken, async (req, res) => {
    try {
        const { imageUrl, caption } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ success: false, error: 'Image URL is required' });
        }
        const newImage = await Gallery.create({ imageUrl, caption });
        clearCache('/api/gallery');
        res.status(201).json({ success: true, data: newImage });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   DELETE /api/admin/gallery/:id
router.delete('/gallery/:id', verifyToken, async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        clearCache('/api/gallery');
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Pricing Management ────────────────────────────────────────────────────────

// @route   GET /api/admin/pricing
router.get('/pricing', verifyToken, async (req, res) => {
    try {
        const prices = await Pricing.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: prices });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   POST /api/admin/pricing
router.post('/pricing', verifyToken, async (req, res) => {
    try {
        const { route, vehicleType, originalPrice, discountedPrice } = req.body;
        if (!route || !originalPrice || !discountedPrice) {
            return res.status(400).json({ success: false, error: 'route, originalPrice, and discountedPrice are required' });
        }
        const newPrice = await Pricing.create({ route, vehicleType, originalPrice, discountedPrice });
        res.status(201).json({ success: true, data: newPrice });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   PUT /api/admin/pricing/:id
router.put('/pricing/:id', verifyToken, async (req, res) => {
    try {
        const updated = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, error: 'Price entry not found' });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   DELETE /api/admin/pricing/:id
router.delete('/pricing/:id', verifyToken, async (req, res) => {
    try {
        await Pricing.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── Standard Tariff Management ────────────────────────────────────────────────────────

// @route   GET /api/admin/tariff
router.get('/tariff', verifyToken, async (req, res) => {
    try {
        const tariffs = await Tariff.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({ success: true, data: tariffs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   POST /api/admin/tariff
router.post('/tariff', verifyToken, async (req, res) => {
    try {
        const { vehicleName } = req.body;
        if (!vehicleName) {
            return res.status(400).json({ success: false, error: 'Vehicle Name is required' });
        }
        const newTariff = await Tariff.create(req.body);
        res.status(201).json({ success: true, data: newTariff });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   PUT /api/admin/tariff/:id
router.put('/tariff/:id', verifyToken, async (req, res) => {
    try {
        const updated = await Tariff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ success: false, error: 'Tariff entry not found' });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   DELETE /api/admin/tariff/:id
router.delete('/tariff/:id', verifyToken, async (req, res) => {
    try {
        await Tariff.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const mongoose = require('mongoose');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @route   GET /api/gallery
// @desc    Get all gallery images
// @access  Public
router.get('/', async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, error: 'Database is offline' });
    }

    try {
        const images = await Gallery.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: images });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error fetching gallery' });
    }
});

module.exports = router;

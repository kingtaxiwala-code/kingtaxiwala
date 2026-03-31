const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const mongoose = require('mongoose');
const { clearCache } = require('../utils/cache');

// Helper to check if DB is connected
const isDbConnected = () => mongoose.connection.readyState === 1;

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get('/', async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ 
            success: false, 
            error: 'Database is currently offline. Please try again later.' 
        });
    }
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (err) {
        console.error('Fetch Reviews Error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Public
router.post('/', async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({
            success: false,
            error: 'Database is offline. Review cannot be saved.'
        });
    }
    try {
        const review = await Review.create(req.body);
        clearCache('/api/reviews'); // Clear reviews cache on new submission
        res.status(201).json({
            success: true,
            data: review
        });
    } catch (err) {
        console.error('Create Review Error:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;

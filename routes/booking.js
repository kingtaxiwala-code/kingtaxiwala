const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const { sendBookingEmail } = require('../utils/email');

// @route   POST /api/bookings
// @desc    Create a new booking and return a WhatsApp redirect link
// @access  Public
router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('phone').trim().isLength({ min: 10, max: 15 }).withMessage('Valid phone number is required'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('pickupLocation').trim().notEmpty().withMessage('Pickup location is required').escape(),
    body('dropLocation').trim().notEmpty().withMessage('Drop location is required').escape(),
    body('travelDate').isISO8601().withMessage('Valid travel date is required').custom(value => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(value) < today) {
            throw new Error('Travel date cannot be in the past');
        }
        return true;
    }),
    body('pickupTime').notEmpty().withMessage('Pickup time is required'),
    body('captchaAnswer').notEmpty().withMessage('Captcha answer is required'),
    body('captchaCorrect').notEmpty().withMessage('Captcha missing')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, email, pickupLocation, dropLocation, vehicleType, travelDate, pickupTime, message, captchaAnswer, captchaCorrect } = req.body;

    // Simple Captcha Verification
    if (parseInt(captchaAnswer) !== parseInt(captchaCorrect)) {
        return res.status(400).json({ success: false, error: 'Incorrect captcha answer' });
    }

    try {
        // Prevent Duplicate Bookings (same phone, date, and pickup within last 15 mins)
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const duplicate = await Booking.findOne({
            phone,
            travelDate,
            pickupLocation,
            createdAt: { $gte: fifteenMinsAgo }
        });

        if (duplicate) {
            return res.status(400).json({ success: false, error: 'A similar booking was recently made. Please wait 15 minutes or call us directly.' });
        }

        // Save booking to DB (Non-blocking for WhatsApp redirection)
        let booking;
        try {
            // Only use specific fields for security
            booking = await Booking.create({
                name, phone, email, pickupLocation, dropLocation, vehicleType, travelDate, pickupTime, message
            });

            // Trigger Email Notification (Asynchronous)
            sendBookingEmail(booking).catch(err => console.error('Email Error:', err.message));
        } catch (dbErr) {
            console.error('MongoDB Error (Proceeding to WhatsApp):', dbErr.message);
            booking = { name, phone, pickupLocation, _id: 'OFFLINE_MODE' };
        }

        const whatsappText = `New Booking Request%0A%0ACustomer: ${name}%0APhone: ${phone}%0APickup Location: ${pickupLocation}%0APickup Time: ${pickupTime}%0ADrop Location: ${dropLocation}%0AVehicle: ${vehicleType}%0ADate: ${travelDate}${message ? '%0AMessage: ' + message : ''}`;
        const companyPhone = '919642095559'; 
        const whatsappLink = `https://wa.me/${companyPhone}?text=${whatsappText}`;

        res.status(201).json({
            success: true,
            data: booking,
            whatsappUrl: whatsappLink
        });
    } catch (err) {
        console.error('General Server Error:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;

const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema({
    route: {
        type: String,
        required: [true, 'Please add a route name (e.g., Vijayawada ↔ Hyderabad)'],
        trim: true
    },
    vehicleType: {
        type: String,
        required: [true, 'Please specify the vehicle type'],
        enum: ['Sedan', 'SUV', 'Innova', 'Tempo Traveller'],
        default: 'Sedan'
    },
    originalPrice: {
        type: Number,
        required: [true, 'Please add the original price']
    },
    discountedPrice: {
        type: Number,
        required: [true, 'Please add the discounted price']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Pricing', PricingSchema);

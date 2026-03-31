const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number']
    },
    email: {
        type: String
    },
    pickupLocation: {
        type: String,
        required: [true, 'Please add a pickup location']
    },
    dropLocation: {
        type: String,
        required: [true, 'Please add a drop location']
    },
    vehicleType: {
        type: String,
        required: [true, 'Please select a vehicle type']
    },
    travelDate: {
        type: String,
        required: [true, 'Please add a travel date']
    },
    pickupTime: {
        type: String,
        required: [true, 'Please add a pickup time']
    },
    message: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);

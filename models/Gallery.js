const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true,
        trim: true
    },
    caption: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Gallery', GallerySchema);

const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    propertyId: {
        type: String,
        required: true
    },
    propertyData: {
        type: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        imageLink: {
            type: String,
            required: true
        },
        bedrooms: {
            type: Number,
            required: true
        },
        bathrooms: {
            type: Number,
            required: true
        },
        area: {
            type: Number,
            required: true
        }
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});

// Compound index to prevent duplicate entries
wishlistSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);

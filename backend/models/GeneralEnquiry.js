const mongoose = require('mongoose');

const generalEnquirySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['residential', 'property'],
        required: true
    },
    propertyId: {
        type: String,
        required: true
    },
    propertyDetails: {
        type: Object,
        required: true
    },
    message: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GeneralEnquiry', generalEnquirySchema);

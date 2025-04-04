const mongoose = require('mongoose');

const membershipEnquirySchema = new mongoose.Schema({
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
    clubId: {
        type: String,
        required: true
    },
    clubName: {
        type: String,
        required: true
    },
    clubDetails: {
        type: {
            type: String,
            required: true
        },
        description: String,
        location: String,
        amenities: [String],
        imageUrl: String
    },
    membershipType: {
        type: String,
        enum: ['standard', 'premium'],
        required: true
    },
    planDetails: {
        price: String,
        features: [String]
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'not_approved'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MembershipEnquiry', membershipEnquirySchema);

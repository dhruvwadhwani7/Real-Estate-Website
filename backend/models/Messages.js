const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema({
    propertyId: {
        type: ObjectId,
        ref: 'SellingProperty',
        required: true
    },
    senderId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    propertyDetails: {
        title: String,
        location: String,
        price: String, // Changed to String to handle formatted prices
        imageUrl: String
    }
}, { 
    timestamps: true,
    strict: false // Allow flexible property details
});

module.exports = mongoose.model('messages', messageSchema);

const mongoose = require('mongoose');

const propertyChatSchema = new mongoose.Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellingProperty',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    },
    userType: {
        type: String,
        enum: ['buyer', 'seller'],
        required: true,
        validate: {
            validator: function(v) {
                return ['buyer', 'seller'].includes(v);
            },
            message: props => `${props.value} is not a valid user type`
        }
    }
});

module.exports = mongoose.model('PropertyChat', propertyChatSchema);

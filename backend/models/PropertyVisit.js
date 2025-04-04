const mongoose = require('mongoose');

const propertyVisitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userType: {
        type: String,
        required: true
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellingProperty',
        required: true,
        validate: {
            validator: function(v) {
                // Check if it's a valid ObjectId or a string that can be converted
                return mongoose.Types.ObjectId.isValid(v) || 
                       (typeof v === 'string' && v.match(/^[0-9a-fA-F]{24}$/));
            },
            message: props => `${props.value} is not a valid property ID!`
        }
    },
    visitDetails: {
        name: String,
        email: String,
        location: String,
        propertyName: String,
        visitTime: Date
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PropertyVisit', propertyVisitSchema);

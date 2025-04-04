const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    type: { type: String, required: true },
    bhk: { type: String, required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    area: { type: Number, required: true },
    price: { type: Number, required: true },
    address: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    description: { type: String, required: true },
    constructionYear: { type: Number, required: true },
    furnishing: String,
    facing: String,
    builtUpArea: Number,
    amenities: [String],
    nearby: {
        schools: [String],
        hospitals: [String],
        shopping: [String],
        transport: [String]
    },
    images: [String],
    seller: { type: String, required: true }, // seller's email
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', propertySchema);

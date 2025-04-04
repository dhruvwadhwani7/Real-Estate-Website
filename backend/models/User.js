const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    userType: { type: String, required: true, enum: ['buyer', 'seller', 'admin'] },
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    status: { type: String, default: 'active', enum: ['active', 'inactive', 'suspended'] }
}, { 
    timestamps: true,
    collection: 'users' 
});

// Add only one composite index for userType and createdAt
userSchema.index({ userType: 1, createdAt: 1 });

// The email index is already created by the unique: true option in the schema
// No need to create it again with schema.index()

module.exports = mongoose.model('User', userSchema);

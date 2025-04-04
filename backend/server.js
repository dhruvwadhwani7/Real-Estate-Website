const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const config = require('./config');
const User = require('./models/User');
const Property = require('./models/Property');
const SellingProperty = require('./models/SellingProperty');
const Message = require('./models/Messages');
const Chat = require('./models/Chat');
const PropertyChat = require('./models/PropertyChat');
const PropertyVisit = require('./models/PropertyVisit');
const Wishlist = require('./models/Wishlist');
const GeneralEnquiry = require('./models/GeneralEnquiry');
const MembershipEnquiry = require('./models/MembershipEnquiry');
const { ObjectId } = require('mongoose').Types;

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with better error handling
mongoose.connect(config.mongoURI)
    .then(() => {
        console.log('MongoDB connected successfully to Real-Estate database');
        // Log available collections
        mongoose.connection.db.listCollections().toArray(function (err, collections) {
            if (err) {
                console.log('Error getting collections:', err);
            } else {
                console.log('Available collections:', collections.map(c => c.name));
            }
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Sign-in route with improved error handling
app.post('/api/signin', async (req, res) => {
    console.log('Received signin request:', { email: req.body.email });
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for user:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        console.log('User logged in successfully:', email);
        res.json({ 
            success: true,
            message: `Welcome back, ${user.fullName}!`,
            userData: {
                _id: user._id, // Add this line
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                userType: user.userType
            }
        });

    } catch (err) {
        console.error('Signin error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error during sign in' 
        });
    }
});

// Modify the user details endpoint to include user ID
app.get('/api/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        res.json({
            success: true,
            userData: {
                _id: user._id, // Include the user ID
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                userType: user.userType
            }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching user data' 
        });
    }
});

// Sign-up route with improved error handling
app.post('/api/signup', async (req, res) => {
    console.log('Received signup request:', req.body);
    const { fullName, email, phone, password, userType } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            fullName,
            email,
            phone,
            password: hashedPassword,
            userType
        });

        await user.save();
        console.log('New user created:', email);
        
        res.status(201).json({ 
            success: true,
            message: 'Registration successful! Please sign in.' 
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration. Please try again.' 
        });
    }
});

// Add new property
app.post('/api/properties', async (req, res) => {
    try {
        const property = new Property(req.body);
        await property.save();
        res.json({ success: true, message: 'Property added successfully' });
    } catch (err) {
        console.error('Error adding property:', err);
        res.status(500).json({ success: false, message: 'Error adding property' });
    }
});

// Add new selling property
app.post('/api/selling-properties', async (req, res) => {
    try {
        const property = new SellingProperty(req.body);
        await property.save();
        res.status(201).json({ 
            success: true, 
            message: 'Property listed successfully',
            propertyId: property._id 
        });
    } catch (err) {
        console.error('Error adding property:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error listing property',
            error: err.message 
        });
    }
});

// Get properties by seller ID
app.get('/api/selling-properties/:sellerId', async (req, res) => {
    try {
        // Validate sellerId
        if (!mongoose.Types.ObjectId.isValid(req.params.sellerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid seller ID format'
            });
        }

        const properties = await SellingProperty.find({ sellerId: req.params.sellerId });
        res.json({ success: true, properties });
    } catch (err) {
        console.error('Error fetching properties:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching properties' 
        });
    }
});

// Update property endpoint
app.put('/api/selling-properties/:id', async (req, res) => {
    try {
        const updatedProperty = await SellingProperty.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedProperty) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        res.json({
            success: true,
            message: 'Property updated successfully',
            property: updatedProperty
        });
    } catch (err) {
        console.error('Error updating property:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating property'
        });
    }
});

// Update the delete property endpoint
app.delete('/api/selling-properties/:id', async (req, res) => {
    try {
        const propertyId = req.params.id;
        
        // Validate property ID
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        // Find and delete the property
        const deletedProperty = await SellingProperty.findByIdAndDelete(propertyId);
        
        if (!deletedProperty) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Also delete any associated data (visits, chats, etc.)
        await Promise.all([
            PropertyVisit.deleteMany({ propertyId }),
            PropertyChat.deleteMany({ propertyId }),
            Wishlist.deleteMany({ propertyId })
        ]);

        res.json({
            success: true,
            message: 'Property and associated data deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting property:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting property: ' + err.message
        });
    }
});

// Update newly added properties endpoint to include seller ID
app.get('/api/newly-added-properties', async (req, res) => {
    try {
        const properties = await SellingProperty.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('sellerId', 'fullName _id'); // Add _id to population

        const transformedProperties = properties.map(property => ({
            _id: property._id,
            propertyType: property.propertyType,
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            amenities: property.amenities || [],
            imageUrl: property.imageLink,
            location: property.address,
            sellerId: property.sellerId, // Include complete seller object
            sellerName: property.sellerId ? property.sellerId.fullName : 'Anonymous',
            createdAt: property.createdAt
        }));

        res.json({
            success: true,
            properties: transformedProperties
        });
    } catch (err) {
        console.error('Error fetching newly added properties:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching properties'
        });
    }
});

// Update message endpoint
app.post('/api/messages', async (req, res) => {
    try {
        const { propertyId, senderId, receiverId, message, propertyDetails } = req.body;

        // Log received data for debugging
        console.log('Received message data:', {
            propertyId, senderId, receiverId, message, propertyDetails
        });

        // Validate all required fields
        if (!propertyId || !senderId || !receiverId || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create and save message
        const newMessage = new Message({
            propertyId,
            senderId,
            receiverId,
            message,
            propertyDetails
        });

        await newMessage.save();

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            messageId: newMessage._id
        });

    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: err.message
        });
    }
});

// Update the GET messages endpoint
app.get('/api/messages/:userId', async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.params.userId },
                { receiverId: req.params.userId }
            ]
        })
        .populate('propertyId')  // Populate full property details
        .populate('senderId', 'fullName')
        .populate('receiverId', 'fullName')
        .sort({ createdAt: -1 });

        // Transform messages to include complete property details
        const transformedMessages = messages.map(message => ({
            _id: message._id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            message: message.message,
            createdAt: message.createdAt,
            propertyDetails: {
                ...message.propertyDetails,
                imageUrl: message.propertyId?.imageLink || message.propertyDetails.imageUrl,
                propertyType: message.propertyId?.propertyType || message.propertyDetails.propertyType,
                location: message.propertyId?.address || message.propertyDetails.location,
                price: message.propertyId?.price || message.propertyDetails.price
            }
        }));

        res.json({
            success: true,
            messages: transformedMessages
        });
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages'
        });
    }
});

// Get all sellers
app.get('/api/users/sellers', async (req, res) => {
    try {
        const sellers = await User.find({ userType: 'seller' })
            .select('fullName email _id'); // Changed to include _id
        res.json({ success: true, sellers });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching sellers' });
    }
});

// Send chat message
app.post('/api/chat/send', async (req, res) => {
    try {
        const chat = new Chat(req.body);
        await chat.save();
        res.json({ success: true, messageId: chat._id });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
});

// Get chat messages
app.get('/api/chat/:userId1/:userId2', async (req, res) => {
    try {
        const messages = await Chat.find({
            $or: [
                { senderId: req.params.userId1, receiverId: req.params.userId2 },
                { senderId: req.params.userId2, receiverId: req.params.userId1 }
            ]
        }).sort('timestamp');
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

// Get chat messages for specific property
app.get('/api/chat/:userId1/:userId2/:propertyId', async (req, res) => {
    try {
        const messages = await Chat.find({
            $or: [
                { senderId: req.params.userId1, receiverId: req.params.userId2 },
                { senderId: req.params.userId2, receiverId: req.params.userId1 }
            ],
            propertyId: req.params.propertyId
        })
        .sort('timestamp')
        .populate('propertyId', 'propertyType address price imageLink');
        
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
});

// Send property-specific chat message
app.post('/api/property-chat/send', async (req, res) => {
    try {
        const { propertyId, senderId, receiverId, message, userType } = req.body;
        
        // Enhanced validation
        if (!propertyId || !senderId || !receiverId || !message || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(propertyId) || 
            !mongoose.Types.ObjectId.isValid(senderId) || 
            !mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        // Validate userType
        if (!['buyer', 'seller'].includes(userType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
        }
        
        const chat = new PropertyChat({
            propertyId,
            senderId,
            receiverId,
            message,
            userType,
            timestamp: new Date()
        });
        
        await chat.save();
        
        res.status(201).json({ 
            success: true, 
            messageId: chat._id,
            timestamp: chat.timestamp,
            message: chat.message
        });
    } catch (err) {
        console.error('Error sending property chat message:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Error sending message'
        });
    }
});

// Get property-specific chat messages with enhanced property details
app.get('/api/property-chat/:propertyId/:userId1/:userId2', async (req, res) => {
    console.log('Fetching chat messages for:', req.params);
    try {
        const propertyDetails = await SellingProperty.findById(req.params.propertyId);
        if (!propertyDetails) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        const messages = await PropertyChat.find({
            propertyId: req.params.propertyId,
            $or: [
                { senderId: req.params.userId1, receiverId: req.params.userId2 },
                { senderId: req.params.userId2, receiverId: req.params.userId1 }
            ]
        })
        .sort({ timestamp: 1 })
        .populate('senderId', 'fullName')
        .populate('receiverId', 'fullName');

        console.log('Found messages:', messages.length);
        
        res.json({ 
            success: true, 
            messages,
            propertyDetails
        });
    } catch (err) {
        console.error('Error fetching property chat messages:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching messages',
            error: err.message 
        });
    }
});

// Delete property-specific chat message
app.delete('/api/property-chat/delete/:messageId', async (req, res) => {
    try {
        const messageId = req.params.messageId;
        
        // Validate message ID
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID format'
            });
        }

        const result = await PropertyChat.findByIdAndDelete(messageId);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting message',
            error: err.message
        });
    }
});

// Get all buyer inquiries for a seller
app.get('/api/seller/inquiries/:sellerId', async (req, res) => {
    try {
        // Get unique buyer-property combinations from messages
        const inquiries = await Message.aggregate([
            {
                $match: { receiverId: mongoose.Types.ObjectId(req.params.sellerId) }
            },
            {
                $group: {
                    _id: {
                        buyerId: "$senderId",
                        propertyId: "$propertyId"
                    },
                    lastMessage: { $last: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.buyerId",
                    foreignField: "_id",
                    as: "buyerInfo"
                }
            },
            {
                $lookup: {
                    from: "sellingproperties",
                    localField: "_id.propertyId",
                    foreignField: "_id",
                    as: "propertyInfo"
                }
            }
        ]);

        const formattedInquiries = inquiries.map(inquiry => ({
            buyerId: inquiry._id.buyerId,
            propertyId: inquiry._id.propertyId,
            buyerName: inquiry.buyerInfo[0]?.fullName || 'Unknown Buyer',
            propertyTitle: inquiry.propertyInfo[0]?.propertyType || 'Unknown Property',
            lastMessage: inquiry.lastMessage.message,
            timestamp: inquiry.lastMessage.timestamp
        }));

        res.json({
            success: true,
            inquiries: formattedInquiries
        });
    } catch (err) {
        console.error('Error fetching seller inquiries:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching inquiries'
        });
    }
});

// Get seller properties with inquiry counts
app.get('/api/seller/properties-with-inquiries/:sellerId', async (req, res) => {
    try {
        // First get all properties by the seller
        const properties = await SellingProperty.find({ sellerId: req.params.sellerId });

        // Get inquiry counts for each property
        const propertiesWithCounts = await Promise.all(properties.map(async (property) => {
            const inquiryCount = await PropertyChat.distinct('senderId', {
                propertyId: property._id
            }).exec();

            return {
                _id: property._id,
                propertyType: property.propertyType,
                address: property.address,
                price: property.price,
                imageLink: property.imageLink,
                inquiryCount: inquiryCount.length
            };
        }));

        res.json({
            success: true,
            properties: propertiesWithCounts
        });
    } catch (err) {
        console.error('Error fetching seller properties:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching properties'
        });
    }
});

// Get all buyer inquiries for a specific property and seller
app.get('/api/seller/property-inquiries/:sellerId', async (req, res) => {
    try {
        const inquiries = await PropertyChat.aggregate([
            {
                $match: { 
                    receiverId: mongoose.Types.ObjectId(req.params.sellerId)
                }
            },
            {
                $group: {
                    _id: {
                        buyerId: "$senderId",
                        propertyId: "$propertyId"
                    },
                    lastMessage: { $last: "$$ROOT" },
                    messageCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.buyerId",
                    foreignField: "_id",
                    as: "buyerInfo"
                }
            },
            {
                $lookup: {
                    from: "sellingproperties",
                    localField: "_id.propertyId",
                    foreignField: "_id",
                    as: "propertyInfo"
                }
            }
        ]);

        res.json({
            success: true,
            inquiries: inquiries.map(inquiry => ({
                buyerId: inquiry._id.buyerId,
                propertyId: inquiry._id.propertyId,
                buyerName: inquiry.buyerInfo[0]?.fullName || 'Unknown Buyer',
                propertyType: inquiry.propertyInfo[0]?.propertyType || 'Unknown Property',
                lastMessage: inquiry.lastMessage.message,
                messageCount: inquiry.messageCount,
                timestamp: inquiry.lastMessage.timestamp
            }))
        });
    } catch (err) {
        console.error('Error fetching inquiries:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching inquiries'
        });
    }
});

// Enhanced endpoint for fetching buyer inquiries with property details
app.get('/api/seller/buyer-inquiries/:sellerId', async (req, res) => {
    try {
        // Validate sellerId
        if (!ObjectId.isValid(req.params.sellerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid seller ID format'
            });
        }

        const inquiries = await PropertyChat.aggregate([
            {
                $match: { 
                    receiverId: new ObjectId(req.params.sellerId)
                }
            },
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        buyerId: "$senderId",
                        propertyId: "$propertyId"
                    },
                    lastMessage: { $first: "$message" },
                    messageCount: { $sum: 1 },
                    lastTimestamp: { $first: "$timestamp" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { buyerId: "$_id.buyerId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$buyerId"] } } }
                    ],
                    as: "buyerInfo"
                }
            },
            {
                $lookup: {
                    from: "sellingproperties",
                    let: { propertyId: "$_id.propertyId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$propertyId"] } } }
                    ],
                    as: "propertyInfo"
                }
            },
            {
                $project: {
                    _id: 0,
                    buyerId: "$_id.buyerId",
                    propertyId: "$_id.propertyId",
                    buyerName: { $arrayElemAt: ["$buyerInfo.fullName", 0] },
                    buyerEmail: { $arrayElemAt: ["$buyerInfo.email", 0] },
                    propertyType: { $arrayElemAt: ["$propertyInfo.propertyType", 0] },
                    propertyAddress: { $arrayElemAt: ["$propertyInfo.address", 0] },
                    propertyImage: { $arrayElemAt: ["$propertyInfo.imageLink", 0] },
                    lastMessage: 1,
                    messageCount: 1,
                    lastTimestamp: 1
                }
            }
        ]);

        res.json({
            success: true,
            inquiries: inquiries
        });
    } catch (err) {
        console.error('Error fetching buyer inquiries:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching inquiries'
        });
    }
});

// Add property visit route with enhanced error handling
app.post('/api/property-visits', async (req, res) => {
    try {
        console.log('Received visit request:', req.body);

        // Validate required fields
        const { userId, userType, propertyId, visitDetails } = req.body;
        if (!userId || !userType || !propertyId || !visitDetails) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Convert property ID format
        let formattedPropertyId;
        try {
            // If it starts with 'property', extract the number and create ObjectId
            if (propertyId.startsWith('property')) {
                const propertyNumber = propertyId.replace('property', '');
                formattedPropertyId = new mongoose.Types.ObjectId(propertyNumber.padStart(24, '0'));
            } else if (propertyId.startsWith('PROP')) {
                // Handle PROP format
                const propertyNumber = propertyId.replace('PROP', '');
                formattedPropertyId = new mongoose.Types.ObjectId(propertyNumber.padStart(24, '0'));
            } else {
                // Try to use as is if it's a valid ObjectId
                formattedPropertyId = new mongoose.Types.ObjectId(propertyId);
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        // Create new visit document with formatted property ID
        const visit = new PropertyVisit({
            userId: new mongoose.Types.ObjectId(userId),
            userType,
            propertyId: formattedPropertyId,
            visitDetails: {
                name: visitDetails.name,
                email: visitDetails.email,
                location: visitDetails.location,
                propertyName: visitDetails.propertyName,
                visitTime: new Date(visitDetails.visitTime)
            },
            status: 'pending'
        });

        await visit.save();
        console.log('Visit scheduled successfully:', visit._id);
        
        res.status(201).json({
            success: true,
            message: 'Property visit scheduled successfully',
            visitId: visit._id
        });
    } catch (err) {
        console.error('Error scheduling property visit:', err);
        res.status(500).json({
            success: false,
            message: 'Error scheduling property visit: ' + err.message
        });
    }
});

// Update Get property visits for a user endpoint
app.get('/api/property-visits/:userId', async (req, res) => {
    try {
        const visits = await PropertyVisit.find({ 
            userId: req.params.userId 
        })
        .sort({ 'visitDetails.visitTime': -1 })
        .populate({
            path: 'propertyId',
            model: 'SellingProperty',
            select: 'propertyType address price'
        });

        const formattedVisits = visits.map(visit => ({
            _id: visit._id,
            status: visit.status,
            visitDetails: {
                ...visit.visitDetails,
                propertyName: visit.propertyId ? `${visit.propertyId.propertyType} at ${visit.propertyId.address}` : visit.visitDetails.propertyName,
                location: visit.propertyId ? visit.propertyId.address : visit.visitDetails.location,
                price: visit.propertyId ? visit.propertyId.price : null
            },
            createdAt: visit.createdAt
        }));
        
        res.json({
            success: true,
            visits: formattedVisits
        });
    } catch (err) {
        console.error('Error fetching property visits:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching property visits'
        });
    }
});

// Add wishlist routes before app.listen()

// Update Add to wishlist route
app.post('/api/wishlist', async (req, res) => {
    try {
        const { userId, propertyId, propertyData } = req.body;

        // Enhanced validation
        if (!userId || !propertyId || !propertyData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({ userId, propertyId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Property already in wishlist'
            });
        }

        // Create new wishlist entry
        const wishlistItem = new Wishlist({
            userId,
            propertyId,
            propertyData
        });

        await wishlistItem.save();

        res.status(201).json({
            success: true,
            message: 'Added to wishlist successfully'
        });

    } catch (err) {
        console.error('Wishlist error:', err);
        res.status(500).json({
            success: false,
            message: 'Error adding to wishlist'
        });
    }
});

// Remove from wishlist
app.delete('/api/wishlist', async (req, res) => {
    try {
        const { userId, propertyId } = req.body;
        
        await Wishlist.findOneAndDelete({ userId, propertyId });
        
        res.json({
            success: true,
            message: 'Removed from wishlist'
        });

    } catch (err) {
        console.error('Wishlist removal error:', err);
        res.status(500).json({
            success: false,
            message: 'Error removing from wishlist'
        });
    }
});

// Update Check wishlist route
app.get('/api/wishlist/check/:userId/:propertyId', async (req, res) => {
    try {
        const { userId, propertyId } = req.params;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const wishlistItem = await Wishlist.findOne({ 
            userId,
            propertyId 
        });
        
        res.json({
            success: true,
            isInWishlist: !!wishlistItem
        });

    } catch (err) {
        console.error('Wishlist check error:', err);
        res.status(500).json({
            success: false,
            message: 'Error checking wishlist status'
        });
    }
});

// Get user's wishlist
app.get('/api/wishlist/:userId', async (req, res) => {
    try {
        const wishlistItems = await Wishlist.find({ userId: req.params.userId });
        
        res.json({
            success: true,
            wishlistItems
        });
    } catch (err) {
        console.error('Error fetching wishlist:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching wishlist'
        });
    }
});

// Add email routes
const emailRoutes = require('./routes/emailRoutes');
app.use('/api', emailRoutes);

// Enhanced user statistics endpoint
app.get('/api/users/stats', async (req, res) => {
    try {
        // Get counts with explicit queries
        const [sellers, buyers, admins] = await Promise.all([
            User.find({ userType: 'seller' }).countDocuments(),
            User.find({ userType: 'buyer' }).countDocuments(),
            User.find({ userType: 'admin' }).countDocuments()
        ]);

        // Get user growth data for the graph
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastMonth }
                }
            },
            {
                $group: {
                    _id: {
                        userType: "$userType",
                        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.day": 1 }
            }
        ]);

        res.json({
            success: true,
            stats: {
                sellers,
                buyers,
                admins,
                total: sellers + buyers + admins,
                growthData: userGrowth
            }
        });
    } catch (err) {
        console.error('Error fetching user statistics:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics'
        });
    }
});

// Update Get all users list endpoint
app.get('/api/users/list', async (req, res) => {
    try {
        const users = await User.find({}, {
            _id: 1,  // Include _id field
            fullName: 1,
            email: 1,
            phone: 1,
            userType: 1
        }).sort({ userType: 1, fullName: 1 }); // Sort by userType and then by name

        if (!users || users.length === 0) {
            return res.json({
                success: true,
                users: [],
                message: 'No users found'
            });
        }

        res.json({
            success: true,
            users: users.map(user => ({
                _id: user._id, // Include _id in response
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                userType: user.userType.toLowerCase() // Ensure consistent casing
            }))
        });
    } catch (err) {
        console.error('Error fetching users list:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching users list'
        });
    }
});

// Delete user endpoint
app.delete('/api/users/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deletion of admin users
        if (user.userType === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin users cannot be deleted'
            });
        }

        await User.findByIdAndDelete(req.params.userId);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
});

// Add new admin endpoints for property management
app.get('/api/admin/property-stats', async (req, res) => {
    try {
        const [total, residential, commercial] = await Promise.all([
            SellingProperty.countDocuments(),
            SellingProperty.countDocuments({ propertyType: /residential/i }),
            SellingProperty.countDocuments({ propertyType: /commercial/i })
        ]);

        res.json({
            success: true,
            stats: { total, residential, commercial }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching property statistics'
        });
    }
});

app.get('/api/admin/location-stats', async (req, res) => {
    try {
        const locations = await SellingProperty.aggregate([
            {
                $group: {
                    _id: "$address",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.json({
            success: true,
            locations
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching location statistics'
        });
    }
});

app.get('/api/admin/all-properties', async (req, res) => {
    try {
        const properties = await SellingProperty.find()
            .sort({ createdAt: -1 })
            .populate('sellerId', 'fullName email');
        
        res.json({
            success: true,
            properties
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching properties'
        });
    }
});

// Add new endpoint for seller properties summary
app.get('/api/admin/seller-properties-summary', async (req, res) => {
    try {
        const sellerSummary = await SellingProperty.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'sellerId',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            {
                $unwind: '$sellerInfo'
            },
            {
                $group: {
                    _id: '$sellerId',
                    sellerName: { $first: '$sellerInfo.fullName' },
                    sellerEmail: { $first: '$sellerInfo.email' },
                    totalProperties: { $sum: 1 },
                    propertyTypes: { $addToSet: '$propertyType' },
                    totalValue: { $sum: '$price' }
                }
            },
            {
                $project: {
                    _id: 1,
                    sellerName: 1,
                    sellerEmail: 1,
                    totalProperties: 1,
                    propertyTypes: 1,
                    totalValue: 1
                }
            }
        ]);

        res.json({
            success: true,
            summary: sellerSummary
        });
    } catch (err) {
        console.error('Error fetching seller summary:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching seller summary'
        });
    }
});

app.delete('/api/admin/property/:id', async (req, res) => {
    try {
        const propertyId = req.params.id;
        
        // Validate property ID
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid property ID format'
            });
        }

        // Find and delete the property
        const deletedProperty = await SellingProperty.findByIdAndDelete(propertyId);
        
        if (!deletedProperty) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Also delete any associated data (visits, chats, etc.)
        await Promise.all([
            PropertyVisit.deleteMany({ propertyId }),
            PropertyChat.deleteMany({ propertyId }),
            Wishlist.deleteMany({ propertyId })
        ]);

        res.json({
            success: true,
            message: 'Property and associated data deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting property:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting property'
        });
    }
});

// Get all property visits for admin
app.get('/api/admin/property-visits', async (req, res) => {
    try {
        const visits = await PropertyVisit.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email');

        res.json({
            success: true,
            visits
        });
    } catch (err) {
        console.error('Error fetching property visits:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching property visits'
        });
    }
});

// Update visit status
app.put('/api/admin/property-visits/:visitId', async (req, res) => {
    try {
        const { status } = req.body;
        
        const visit = await PropertyVisit.findByIdAndUpdate(
            req.params.visitId,
            { status },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.json({
            success: true,
            message: 'Visit status updated successfully',
            visit
        });
    } catch (err) {
        console.error('Error updating visit status:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating visit status'
        });
    }
});

// Delete visit
app.delete('/api/admin/property-visits/:visitId', async (req, res) => {
    try {
        const visit = await PropertyVisit.findByIdAndDelete(req.params.visitId);
        
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        res.json({
            success: true,
            message: 'Visit deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting visit:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting visit'
        });
    }
});

// Add general enquiry endpoint
app.post('/api/general-enquiries', async (req, res) => {
    try {
        const {
            userId,
            name,
            email,
            location,
            type,
            propertyId,
            propertyDetails,
            message
        } = req.body;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Validate required fields
        if (!name || !email || !location || !type || !propertyId || !propertyDetails) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const enquiry = new GeneralEnquiry({
            userId,
            name,
            email,
            location,
            type,
            propertyId,
            propertyDetails,
            message
        });

        await enquiry.save();

        res.status(201).json({
            success: true,
            message: 'Enquiry submitted successfully',
            enquiryId: enquiry._id
        });

    } catch (err) {
        console.error('Error submitting enquiry:', err);
        res.status(500).json({
            success: false,
            message: 'Error submitting enquiry'
        });
    }
});

// Get enquiries by user ID
app.get('/api/general-enquiries/:userId', async (req, res) => {
    try {
        const enquiries = await GeneralEnquiry.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            enquiries
        });
    } catch (err) {
        console.error('Error fetching enquiries:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching enquiries'
        });
    }
});

// Club membership application endpoint
app.post('/api/club-memberships', async (req, res) => {
    try {
        const {
            userId,
            name,
            email,
            clubId,
            clubName,
            membershipType,
            plan,
            clubDetails
        } = req.body;

        // Validate user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create new membership enquiry
        const membershipEnquiry = new MembershipEnquiry({
            userId,
            name,
            email,
            clubId,
            clubName,
            clubDetails: {
                type: clubDetails.type,
                description: clubDetails.description,
                location: clubDetails.location,
                amenities: clubDetails.amenities,
                imageUrl: clubDetails.imageUrl
            },
            membershipType,
            planDetails: {
                price: plan.price,
                features: plan.features
            }
        });

        await membershipEnquiry.save();

        res.status(201).json({
            success: true,
            message: 'Club membership application submitted successfully',
            enquiryId: membershipEnquiry._id
        });

    } catch (err) {
        console.error('Error submitting club membership:', err);
        res.status(500).json({
            success: false,
            message: 'Error submitting club membership application'
        });
    }
});

// Get user's club membership applications
app.get('/api/club-memberships/:userId', async (req, res) => {
    try {
        const memberships = await MembershipEnquiry.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            memberships
        });
    } catch (err) {
        console.error('Error fetching club memberships:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching club memberships'
        });
    }
});

// Update the Get all general enquiries for admin endpoint
app.get('/api/admin/general-enquiries', async (req, res) => {
    try {
        const enquiries = await GeneralEnquiry.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email')
            .lean();

        // Get property and residential data
        const propertyData = require('../frontend/js/propertyData.json');
        const residentialData = require('../frontend/js/residentialData.json');

        // Transform and validate each enquiry's data
        const transformedEnquiries = await Promise.all(enquiries.map(async (enquiry) => {
            let propertyDetails = enquiry.propertyDetails || {};
            
            // Find matching property/residential data
            if (enquiry.type === 'property') {
                const propertyMatch = propertyData.find(p => p['Property ID'] === enquiry.propertyId);
                if (propertyMatch) {
                    propertyDetails = {
                        ...propertyDetails,
                        propertyType: propertyMatch.Type,
                        imageUrl: propertyMatch['Image Link'],
                        location: propertyMatch.Address
                    };
                }
            } else {
                const residentialMatch = residentialData.find(r => r['Property ID'] === enquiry.propertyId);
                if (residentialMatch) {
                    propertyDetails = {
                        ...propertyDetails,
                        propertyType: residentialMatch.Name,
                        imageUrl: residentialMatch['Image Link'],
                        location: residentialMatch.Location.Address
                    };
                }
            }

            return {
                ...enquiry,
                propertyDetails: {
                    ...propertyDetails,
                    propertyType: propertyDetails.propertyType || 'Property',
                    imageUrl: propertyDetails.imageUrl || '../../img/default-property.jpg',
                    location: propertyDetails.location || 'Location not specified'
                }
            };
        }));

        res.json({
            success: true,
            enquiries: transformedEnquiries
        });
    } catch (err) {
        console.error('Error fetching enquiries:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching enquiries'
        });
    }
});

// Delete general enquiry
app.delete('/api/admin/general-enquiries/:enquiryId', async (req, res) => {
    try {
        const enquiry = await GeneralEnquiry.findByIdAndDelete(req.params.enquiryId);
        
        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        res.json({
            success: true,
            message: 'Enquiry deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting enquiry:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting enquiry'
        });
    }
});

// Add new admin endpoints for club memberships
app.get('/api/admin/club-membership-stats', async (req, res) => {
    try {
        const [total, golfClub, healthCentre, sportsCentre, clubHouse] = await Promise.all([
            MembershipEnquiry.countDocuments(),
            MembershipEnquiry.countDocuments({ clubId: 'CLUB1' }),
            MembershipEnquiry.countDocuments({ clubId: 'CLUB2' }),
            MembershipEnquiry.countDocuments({ clubId: 'CLUB3' }),
            MembershipEnquiry.countDocuments({ clubId: 'CLUB4' })
        ]);

        res.json({
            success: true,
            stats: { 
                total, 
                golfClub, 
                healthCentre, 
                sportsCentre, 
                clubHouse 
            }
        });
    } catch (err) {
        console.error('Error fetching membership stats:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching membership statistics'
        });
    }
});

app.get('/api/admin/club-memberships', async (req, res) => {
    try {
        const memberships = await MembershipEnquiry.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email');

        res.json({
            success: true,
            memberships
        });
    } catch (err) {
        console.error('Error fetching memberships:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching memberships'
        });
    }
});

app.put('/api/admin/club-memberships/:membershipId', async (req, res) => {
    try {
        const { status } = req.body;
        
        // Validate status
        if (!['pending', 'approved', 'not_approved'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const membership = await MembershipEnquiry.findByIdAndUpdate(
            req.params.membershipId,
            { 
                status,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership application not found'
            });
        }

        // Send email notification based on status change
        const emailSubject = `Club Membership Application ${status.replace('_', ' ')}`;
        const emailContent = `Your club membership application for ${membership.clubName} has been ${status.replace('_', ' ')}.`;
        
        // Assuming you have an email service
        // await sendEmail(membership.email, emailSubject, emailContent);

        res.json({
            success: true,
            message: `Membership status updated to ${status}`,
            membership
        });
    } catch (err) {
        console.error('Error updating membership:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating membership status'
        });
    }
});

app.delete('/api/admin/club-memberships/:membershipId', async (req, res) => {
    try {
        const membership = await MembershipEnquiry.findByIdAndDelete(req.params.membershipId);
        
        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership application not found'
            });
        }

        res.json({
            success: true,
            message: 'Membership application deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting membership:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting membership'
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route to get user profile data
router.get('/profile/:email', async (req, res) => {
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
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                userType: user.userType
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching user data'
        });
    }
});

// Get user statistics with time range filter
router.get('/stats', async (req, res) => {
    try {
        const { timeRange = '30' } = req.query; // Default to 30 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));

        const [userCounts, dailyGrowth, userTypes] = await Promise.all([
            // Get total counts
            User.aggregate([
                {
                    $group: {
                        _id: '$userType',
                        count: { $sum: 1 }
                    }
                }
            ]),
            // Get daily growth
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            userType: '$userType'
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.date': 1 }
                }
            ]),
            // Get user type distribution
            User.aggregate([
                {
                    $group: {
                        _id: '$userType',
                        total: { $sum: 1 },
                        active: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                            }
                        }
                    }
                }
            ])
        ]);

        // Process data for charts
        const processedData = {
            totalCounts: {
                sellers: userCounts.find(u => u._id === 'seller')?.count || 0,
                buyers: userCounts.find(u => u._id === 'buyer')?.count || 0,
                admins: userCounts.find(u => u._id === 'admin')?.count || 0
            },
            dailyGrowth: dailyGrowth.reduce((acc, curr) => {
                const { date } = curr._id;
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        seller: 0,
                        buyer: 0,
                        admin: 0
                    };
                }
                acc[date][curr._id.userType] = curr.count;
                return acc;
            }, {}),
            userTypeDistribution: userTypes
        };

        res.json({
            success: true,
            data: processedData,
            metadata: {
                timeRange,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
});

// Get active users trend
router.get('/active-trend', async (req, res) => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const activeUsers = await User.aggregate([
            {
                $match: {
                    lastActive: { $gte: last24Hours }
                }
            },
            {
                $group: {
                    _id: {
                        hour: { $hour: '$lastActive' },
                        userType: '$userType'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.hour': 1 }
            }
        ]);

        res.json({
            success: true,
            data: activeUsers
        });
    } catch (error) {
        console.error('Error fetching active users trend:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active users trend'
        });
    }
});

module.exports = router;

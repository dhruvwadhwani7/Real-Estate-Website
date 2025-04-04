const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // Ensure the path to the User model is correct

const secretKey = 'your_secret_key'; // Replace with your actual secret key

// Sign Up
exports.signup = async (req, res) => {
    try {
        const { fullName, email, phone, password, userType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            fullName,
            email,
            phone,
            password: hashedPassword,
            userType
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Sign In
exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token with user type
        const token = jwt.sign({ 
            userId: user._id,
            userType: user.userType 
        }, secretKey, { expiresIn: '1h' });

        res.status(200).json({ 
            success: true,
            token,
            userData: {
                fullName: user.fullName,
                email: user.email,
                userType: user.userType,
                _id: user._id
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

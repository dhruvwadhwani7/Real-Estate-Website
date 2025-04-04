const express = require('express');
const router = express.Router();
const authController = require('./auth');

// Authentication routes
router.post('/api/signup', authController.signup);
router.post('/api/signin', authController.signin);

module.exports = router;
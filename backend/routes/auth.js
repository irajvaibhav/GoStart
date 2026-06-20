// routes/auth.js
// handles signup, login, and getting current user
// passwords are hashed with bcrypt, auth uses JWT tokens

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me - get current logged in user
router.get('/me', auth, authController.getMe);

module.exports = router;

// routes/users.js
// profile management - update profile, preferences, verification
// all routes are protected (need auth token)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// multer setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file || !file.originalname) {
      return cb(new Error('No file name provided'));
    }
    const allowed = /\.(jpeg|jpg|png|webp)$/i;
    const isPhoto = allowed.test(file.originalname) || (file.mimetype && file.mimetype.startsWith('image/'));
    if (isPhoto) return cb(null, true);
    cb(new Error('Only images allowed (jpeg, jpg, png, webp)'));
  }
});

// PUT /api/users/profile - update profile fields
router.put('/profile', auth, userController.updateProfile);

// POST /api/users/photos - upload photos via multipart form
router.post('/photos', auth, upload.array('photos', 6), userController.uploadPhotos);

// PUT /api/users/preferences - update what they're looking for
router.put('/preferences', auth, userController.updatePreferences);

// POST /api/users/verify - mock verification (just flips the flag)
router.post('/verify', auth, userController.verify);

module.exports = router;

// routes/users.js
// profile management - update profile, preferences, verification
// all routes are protected (need auth token)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');

// multer setup for photo uploads
// saves to /uploads with a unique filename
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
router.put('/profile', auth, async (req, res) => {
  try {
    // allowlist, not blocklist: if we just did `User.findByIdAndUpdate(req.user, req.body)`
    // anyone could send { credits: 999999 } or { password: 'x' } in the
    // request body and overwrite it. only fields named here can ever be touched.
    const allowed = [
      'name', 'phone', 'photos', 'bio', 'age', 'gender',
      'height', 'religion', 'city', 'profession', 'college',
      'interests', 'weekendVibe', 'firstDateIdea', 'loveLanguage'
    ];

    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // cap photos at 6
    if (updates.photos && updates.photos.length > 6) {
      return res.status(400).json({ error: 'Max 6 photos allowed' });
    }

    const user = await User.findByIdAndUpdate(req.user, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/photos - upload photos via multipart form
router.post('/photos', auth, upload.array('photos', 6), async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded. Make sure the field name is "photos"' });
    }

    // build URLs from uploaded files
    const newPhotos = req.files.map(f => `/uploads/${f.filename}`);
    const allPhotos = [...(user.photos || []), ...newPhotos];

    if (allPhotos.length > 6) {
      return res.status(400).json({ error: 'Max 6 photos allowed. You have ' + user.photos.length + ' already.' });
    }

    user.photos = allPhotos;
    await user.save();

    res.json({ photos: user.photos });
  } catch (err) {
    console.error('Upload photos error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/preferences - update what they're looking for
router.put('/preferences', auth, async (req, res) => {
  try {
    const { lookingFor, ageMin, ageMax, location } = req.body;

    // 'preferences.lookingFor' (string with a dot) is mongo's dot-notation
    // for "set this one nested field" - using $set with this means we only
    // touch the specific sub-fields passed in, instead of overwriting the
    // whole preferences object (which would wipe out any fields not sent)
    const prefs = {};
    if (lookingFor) prefs['preferences.lookingFor'] = lookingFor;
    if (ageMin !== undefined) prefs['preferences.ageMin'] = ageMin;
    if (ageMax !== undefined) prefs['preferences.ageMax'] = ageMax;
    if (location) prefs['preferences.location'] = location;

    const user = await User.findByIdAndUpdate(req.user, { $set: prefs }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Update preferences error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/users/verify - mock verification (just flips the flag)
router.post('/verify', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user, { isVerified: true }, { new: true }).select('-password');
    res.json({ message: 'Profile verified!', isVerified: user.isVerified });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

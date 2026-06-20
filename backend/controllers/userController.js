const User = require('../models/User');

// Update profile fields
exports.updateProfile = async (req, res) => {
  try {
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

    if (updates.photos && updates.photos.length > 6) {
      return res.status(400).json({ error: 'Max 6 photos allowed' });
    }

    const user = await User.findByIdAndUpdate(req.user, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload photos via multipart form
exports.uploadPhotos = async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded. Make sure the field name is "photos"' });
    }

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
};

// Update preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { lookingFor, ageMin, ageMax, location } = req.body;

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
};

// Mock verification
exports.verify = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user, { isVerified: true }, { new: true }).select('-password');
    res.json({ message: 'Profile verified!', isVerified: user.isVerified });
  } catch (err) {
    console.error('Verify error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

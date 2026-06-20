// routes/auth.js
// handles signup, login, and getting current user
// passwords are hashed with bcrypt, auth uses JWT tokens

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// a JWT is just a signed JSON blob - { userId } gets encoded into the token
// itself (base64, NOT encrypted, so never put secrets in here) plus a
// signature made with JWT_SECRET. anyone can read the userId out of it, but
// nobody can fake a valid signature without knowing the secret. expiresIn
// just adds an "exp" timestamp the server checks on every request.
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// quick, plain check that a string at least looks like an email -
// "something@something.something". not trying to be a perfect RFC regex,
// just enough to catch obvious typos/garbage before it hits the database.
const EMAIL_SHAPE = /^\S+@\S+\.\S+$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, gender } = req.body;

    // nothing below this point should run on bad input - check everything
    // up front and bail out early with a clear message for each problem.
    // without this, a missing password would crash bcrypt.hash() below with
    // a confusing 500 error instead of a clean "Password is required".
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !EMAIL_SHAPE.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const ageNum = Number(age);
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      return res.status(400).json({ error: 'Age must be between 18 and 99' });
    }
    if (gender && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
      return res.status(400).json({ error: 'Gender must be male, female, or other' });
    }

    // check if email already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // never save the plain password - hash it first. bcrypt adds a random
    // "salt" so two users with the same password get different hashes, and
    // it's a one-way function (can't reverse a hash back to the password).
    // 10 is the "cost factor" - higher = slower to compute = harder to brute force.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      age: ageNum, // use the validated number, not the raw req.body value (could be a string like "25")
      // lowercase because the User schema's gender enum only allows
      // 'male'/'female'/'other' - frontend sends 'Male'/'Female'/'Other'
      gender: gender ? gender.toLowerCase() : gender
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        credits: user.credits
      }
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // don't bother hitting the database with an empty/missing field
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // bcrypt.compare hashes the typed password with the SAME salt that's
    // embedded in the stored hash, then checks if the result matches -
    // that's how it verifies a password without ever decrypting anything
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        credits: user.credits
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me - get current logged in user
router.get('/me', auth, async (req, res) => {
  try {
    // exclude password from response
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

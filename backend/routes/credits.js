// routes/credits.js
// in-app currency system - users spend credits to like and message
// purchase is mocked (no real payment gateway), just adds credits

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// hardcoded credit packages - in production these would come from a DB or config
const PACKAGES = [
  { id: 1, credits: 10, price: 99, label: '10 Credits' },
  { id: 2, credits: 25, price: 199, label: '25 Credits' },
  { id: 3, credits: 50, price: 349, label: '50 Credits' }
];

// GET /api/credits/balance - how many credits the user has
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('credits');
    res.json({ credits: user.credits });
  } catch (err) {
    console.error('Get balance error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/credits/packages - available credit packs to buy
router.get('/packages', auth, async (req, res) => {
  res.json(PACKAGES);
});

// POST /api/credits/purchase - buy a credit pack (mock - no real payment)
router.post('/purchase', auth, async (req, res) => {
  try {
    const { packageId } = req.body;

    const pkg = PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package' });
    }

    // $inc = atomic increment (credits = credits + pkg.credits) done in one
    // db operation, instead of read-modify-write which could race if two
    // requests hit at the same instant. { new: true } returns the doc AFTER
    // the update, not the stale pre-update version.
    const user = await User.findByIdAndUpdate(
      req.user,
      { $inc: { credits: pkg.credits } },
      { new: true }
    ).select('credits');

    res.json({
      message: `Purchased ${pkg.label}!`,
      credits: user.credits
    });
  } catch (err) {
    console.error('Purchase error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

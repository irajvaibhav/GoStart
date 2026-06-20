// routes/credits.js
// in-app currency system - users spend credits to like and message
// purchase is mocked (no real payment gateway), just adds credits

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const creditsController = require('../controllers/creditsController');

// GET /api/credits/balance - how many credits the user has
router.get('/balance', auth, creditsController.getBalance);

// GET /api/credits/packages - available credit packs to buy
router.get('/packages', auth, creditsController.getPackages);

// POST /api/credits/purchase - buy a credit pack (mock - no real payment)
router.post('/purchase', auth, creditsController.purchase);

module.exports = router;

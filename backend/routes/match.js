// routes/match.js
// the core dating logic - discover profiles, like/pass, check matches
// all routes protected

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const matchController = require('../controllers/matchController');

// GET /api/match/discover - get profiles to swipe on
router.get('/discover', auth, matchController.discover);

// GET /api/match/likers - get profiles of users who liked current user
router.get('/likers', auth, matchController.getLikers);

// POST /api/match/like - like a user (costs 1 credit)
router.post('/like', auth, matchController.like);

// POST /api/match/pass - skip a user
router.post('/pass', auth, matchController.pass);

// GET /api/match/matches - get all your matches
router.get('/matches', auth, matchController.getMatches);

module.exports = router;

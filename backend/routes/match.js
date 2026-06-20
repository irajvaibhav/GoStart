// routes/match.js
// the core dating logic - discover profiles, like/pass, check matches
// all routes protected

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Like = require('../models/Like');
const Match = require('../models/Match');
const auth = require('../middleware/auth');

const DAILY_SWIPE_LIMIT = 10; // free users get 10 swipes/day

// GET /api/match/discover - get profiles to swipe on
router.get('/discover', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    // reset daily swipes if it's a new day
    // toDateString() drops the time, leaving just "Mon Jan 01 2024" - so this
    // is just "is lastReset's calendar day different from today's calendar day"
    const now = new Date();
    const lastReset = user.lastSwipeReset ? new Date(user.lastSwipeReset) : null;
    if (!lastReset || lastReset.toDateString() !== now.toDateString()) {
      user.dailySwipesUsed = 0;
      user.lastSwipeReset = now;
      await user.save();
    }

    // check if they've hit the daily limit
    if (user.dailySwipesUsed >= DAILY_SWIPE_LIMIT) {
      return res.status(429).json({
        error: 'Daily swipe limit reached',
        resetAt: 'tomorrow',
        swipesUsed: user.dailySwipesUsed
      });
    }

    // get all user IDs we already swiped on (like or pass)
    const alreadySwiped = await Like.find({ fromUser: req.user }).select('toUser');
    const swipedIds = alreadySwiped.map(l => l.toUser);

    // build filter - exclude self and already swiped
    // $nin = "not in this list" - mongo filter operator
    const filter = {
      _id: { $nin: [req.user, ...swipedIds] }
    };

    // filter by what user is looking for
    // FiltersScreen saves "men"/"women" (friendlier UI copy) but the gender
    // field on User is "male"/"female"/"other" - map between the two
    if (user.preferences && user.preferences.lookingFor) {
      const GENDER_MAP = { men: 'male', women: 'female' };
      filter.gender = GENDER_MAP[user.preferences.lookingFor] || user.preferences.lookingFor;
    }

    // filter by age range
    if (user.preferences) {
      const ageMin = user.preferences.ageMin || 18;
      const ageMax = user.preferences.ageMax || 35;
      filter.age = { $gte: ageMin, $lte: ageMax };
    }

    // grab a bigger pool than we need (50) so we can rank them by
    // compatibility before cutting down to the 10 we actually send back.
    // doing the ranking in plain JS here is simpler than writing a mongo
    // aggregation pipeline for what's really just "count and sort".
    const candidates = await User.find(filter)
      .select('-password')
      .limit(50);

    const myInterests = user.interests || [];

    // simple compatibility score: how many interests do we have in common?
    // more shared interests = ranked higher. no ML, just a count and a sort -
    // makes "who shows up first" actually mean something instead of being
    // whatever order mongo happened to return.
    const ranked = candidates
      .map(candidate => {
        const theirInterests = candidate.interests || [];
        const sharedCount = theirInterests.filter(i => myInterests.includes(i)).length;
        return { candidate, sharedCount };
      })
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .slice(0, 10)
      .map(entry => entry.candidate);

    res.json({
      profiles: ranked,
      swipesRemaining: DAILY_SWIPE_LIMIT - user.dailySwipesUsed
    });
  } catch (err) {
    console.error('Discover error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/match/like - like a user (costs 1 credit)
router.post('/like', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const user = await User.findById(req.user);

    // can't like yourself
    if (targetUserId === req.user) {
      return res.status(400).json({ error: "Can't like yourself" });
    }

    // check they have credits
    if (user.credits < 1) {
      return res.status(403).json({ error: 'Not enough credits. Buy more!' });
    }

    // check if already liked this person
    const alreadyLiked = await Like.findOne({ fromUser: req.user, toUser: targetUserId });
    if (alreadyLiked) {
      return res.status(400).json({ error: 'Already swiped on this user' });
    }

    // deduct credit and bump swipe count
    user.credits -= 1;
    user.dailySwipesUsed += 1;
    await user.save();

    // save the like
    await Like.create({
      fromUser: req.user,
      toUser: targetUserId,
      action: 'like'
    });

    // THE WHOLE MATCHING ALGORITHM IS THIS ONE QUERY: did the other person
    // already swipe "like" on me, before I liked them? if both directions
    // exist (their like + the one we just saved above) -> it's a match.
    // no ML, no scoring - just "did both people say yes".
    const theyLikedUs = await Like.findOne({
      fromUser: targetUserId,
      toUser: req.user,
      action: { $in: ['like', 'superlike'] }
    });

    if (theyLikedUs) {
      // it's a match!
      const match = await Match.create({
        user1: req.user,
        user2: targetUserId
      });

      // .populate() swaps the raw ObjectId refs for the actual user
      // documents (just the fields listed) so the app can show a name/photo
      // immediately instead of making a second request to look them up
      const populatedMatch = await Match.findById(match._id)
        .populate('user1', 'name photos city')
        .populate('user2', 'name photos city');

      return res.json({
        matched: true,
        match: populatedMatch,
        creditsRemaining: user.credits
      });
    }

    // no match yet
    res.json({
      matched: false,
      creditsRemaining: user.credits
    });
  } catch (err) {
    console.error('Like error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/match/pass - skip a user
router.post('/pass', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    // save as pass so we don't show them again
    await Like.create({
      fromUser: req.user,
      toUser: targetUserId,
      action: 'pass'
    });

    // bump swipe count (passes count as swipes too)
    await User.findByIdAndUpdate(req.user, { $inc: { dailySwipesUsed: 1 } });

    res.json({ success: true });
  } catch (err) {
    console.error('Pass error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/match/matches - get all your matches
router.get('/matches', auth, async (req, res) => {
  try {
    // I could be stored as either user1 or user2 depending on who liked
    // second (see the create() above), so this $or checks both spots
    const matches = await Match.find({
      $or: [{ user1: req.user }, { user2: req.user }],
      isActive: true
    })
      .populate('user1', 'name photos city bio age')
      .populate('user2', 'name photos city bio age')
      .sort({ matchedAt: -1 });

    // format response - show the OTHER person's info, not your own
    const formatted = matches.map(m => {
      const otherUser = m.user1._id.toString() === req.user ? m.user2 : m.user1;
      return {
        matchId: m._id,
        matchedAt: m.matchedAt,
        user: otherUser
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Get matches error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

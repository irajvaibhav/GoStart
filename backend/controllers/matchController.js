const User = require('../models/User');
const Like = require('../models/Like');
const Match = require('../models/Match');

const DAILY_SWIPE_LIMIT = 10; // free users get 10 swipes/day

// Discover profiles to swipe on
exports.discover = async (req, res) => {
  try {
    const user = await User.findById(req.user);

    // reset daily swipes if it's a new day
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
    const filter = {
      _id: { $nin: [req.user, ...swipedIds] }
    };

    // filter by what user is looking for
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

    const candidates = await User.find(filter)
      .select('-password')
      .limit(50);

    const myInterests = user.interests || [];

    // simple compatibility score: shared interests count
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
};

// Like a user (costs 1 credit)
exports.like = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const user = await User.findById(req.user);

    if (targetUserId === req.user) {
      return res.status(400).json({ error: "Can't like yourself" });
    }

    if (user.credits < 1) {
      return res.status(403).json({ error: 'Not enough credits. Buy more!' });
    }

    const alreadyLiked = await Like.findOne({ fromUser: req.user, toUser: targetUserId });
    if (alreadyLiked) {
      return res.status(400).json({ error: 'Already swiped on this user' });
    }

    user.credits -= 1;
    user.dailySwipesUsed += 1;
    await user.save();

    await Like.create({
      fromUser: req.user,
      toUser: targetUserId,
      action: 'like'
    });

    const theyLikedUs = await Like.findOne({
      fromUser: targetUserId,
      toUser: req.user,
      action: { $in: ['like', 'superlike'] }
    });

    if (theyLikedUs) {
      const match = await Match.create({
        user1: req.user,
        user2: targetUserId
      });

      const populatedMatch = await Match.findById(match._id)
        .populate('user1', 'name photos city')
        .populate('user2', 'name photos city');

      return res.json({
        matched: true,
        match: populatedMatch,
        creditsRemaining: user.credits
      });
    }

    res.json({
      matched: false,
      creditsRemaining: user.credits
    });
  } catch (err) {
    console.error('Like error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Pass on a user
exports.pass = async (req, res) => {
  try {
    const { targetUserId } = req.body;

    await Like.create({
      fromUser: req.user,
      toUser: targetUserId,
      action: 'pass'
    });

    await User.findByIdAndUpdate(req.user, { $inc: { dailySwipesUsed: 1 } });

    res.json({ success: true });
  } catch (err) {
    console.error('Pass error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all mutual matches
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ user1: req.user }, { user2: req.user }],
      isActive: true
    })
      .populate('user1', 'name photos city bio age')
      .populate('user2', 'name photos city bio age')
      .sort({ matchedAt: -1 });

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
};

// Get all users who liked the logged-in user, but whom the logged-in user hasn't swiped on yet
exports.getLikers = async (req, res) => {
  try {
    // 1. Find all Likes where toUser is current user and action is 'like'
    const likesReceived = await Like.find({ toUser: req.user, action: 'like' }).select('fromUser');
    const likerIds = likesReceived.map(l => l.fromUser);

    if (likerIds.length === 0) {
      return res.json([]);
    }

    // 2. Find all Likes where fromUser is current user (swipes already made by current user)
    const swipesMade = await Like.find({ fromUser: req.user }).select('toUser');
    const swipedIds = swipesMade.map(l => l.toUser.toString());

    // 3. Filter out users who have already been liked/passed by current user
    const pendingLikerIds = likerIds.filter(id => !swipedIds.includes(id.toString()));

    if (pendingLikerIds.length === 0) {
      return res.json([]);
    }

    // 4. Fetch the user details of these pending likers
    const users = await User.find({ _id: { $in: pendingLikerIds } }).select('name photos city bio age gender height religion college profession interests weekendVibe firstDateIdea loveLanguage isVerified');

    res.json(users);
  } catch (err) {
    console.error('Get likers error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

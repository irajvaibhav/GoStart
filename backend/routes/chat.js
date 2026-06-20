// routes/chat.js
// messaging between matched users
// first message in a conversation costs 1 credit (ice-breaker fee)
// real-time delivery happens via socket.io in server.js, this just handles persistence

const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/chat/conversations - list all conversations (matches + last message)
router.get('/conversations', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ user1: req.user }, { user2: req.user }],
      isActive: true
    })
      .populate('user1', 'name photos city')
      .populate('user2', 'name photos city')
      .sort({ matchedAt: -1 });

    // for each match, grab the last message
    const conversations = await Promise.all(
      matches.map(async (m) => {
        const lastMessage = await Message.findOne({ matchId: m._id })
          .sort({ createdAt: -1 })
          .select('text sender createdAt');

        const otherUser = m.user1._id.toString() === req.user ? m.user2 : m.user1;

        return {
          matchId: m._id,
          matchedAt: m.matchedAt,
          user: otherUser,
          lastMessage: lastMessage || null
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/chat/messages/:matchId - get all messages for a match
router.get('/messages/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;

    // make sure this user is part of this match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // security check: without this, anyone with a valid login could pass any
    // matchId in the URL and read someone else's messages. the JWT proves
    // WHO you are, but not that you're allowed to see THIS conversation -
    // that's a separate check we have to do ourselves on every route.
    const isPartOfMatch =
      match.user1.toString() === req.user || match.user2.toString() === req.user;
    if (!isPartOfMatch) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    const messages = await Message.find({ matchId })
      .sort({ createdAt: 1 }) // oldest first
      .populate('sender', 'name photos');

    res.json(messages);
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/chat/messages/:matchId - send a message
// note: this route ONLY saves the message to the db and returns it. the
// actual real-time push to the other person's screen happens separately -
// ChatScreen.js calls this route AND emits a socket.io 'sendMessage' event
// (see server.js) right after, so the other person sees it instantly
// instead of having to refresh/poll.
router.post('/messages/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // verify user is in this match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const isPartOfMatch =
      match.user1.toString() === req.user || match.user2.toString() === req.user;
    if (!isPartOfMatch) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    // first message costs 1 credit (ice breaker) - "first" meaning the
    // first message *I've* sent in this match, not the first message ever.
    // counting my own past messages in this matchId tells us if this is #1.
    const existingMessages = await Message.countDocuments({
      matchId,
      sender: req.user
    });

    if (existingMessages === 0) {
      const user = await User.findById(req.user);
      if (user.credits < 1) {
        return res.status(403).json({ error: 'Need 1 credit to send first message' });
      }
      user.credits -= 1;
      await user.save();
    }

    const message = await Message.create({
      matchId,
      sender: req.user,
      text: text.trim()
    });

    // populate sender info for the response
    const populated = await Message.findById(message._id)
      .populate('sender', 'name photos');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

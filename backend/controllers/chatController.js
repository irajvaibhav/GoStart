const Match = require('../models/Match');
const Message = require('../models/Message');
const User = require('../models/User');

// List all conversations (matches + last message)
exports.getConversations = async (req, res) => {
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
};

// Get all messages for a match
exports.getMessages = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

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
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const isPartOfMatch =
      match.user1.toString() === req.user || match.user2.toString() === req.user;
    if (!isPartOfMatch) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

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

    const populated = await Message.findById(message._id)
      .populate('sender', 'name photos');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

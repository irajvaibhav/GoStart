// routes/chat.js
// messaging between matched users
// first message in a conversation costs 1 credit (ice-breaker fee)
// real-time delivery happens via socket.io in server.js, this just handles persistence

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// GET /api/chat/conversations - list all conversations (matches + last message)
router.get('/conversations', auth, chatController.getConversations);

// GET /api/chat/messages/:matchId - get all messages for a match
router.get('/messages/:matchId', auth, chatController.getMessages);

// POST /api/chat/messages/:matchId - send a message
router.post('/messages/:matchId', auth, chatController.sendMessage);

module.exports = router;

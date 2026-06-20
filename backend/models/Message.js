// models/Message.js
// chat messages tied to a match
// only matched users can message each other
// first message costs 1 credit (checked in chat route)

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  matchId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true }, // which conversation this belongs to
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // who sent it (the other person is whoever the match's "other user" is)
  text:      { type: String, required: true },
  createdAt: { type: Date, default: Date.now } // used to sort messages oldest -> newest in the chat
});

module.exports = mongoose.model('Message', messageSchema);

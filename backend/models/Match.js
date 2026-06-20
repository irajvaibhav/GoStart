// models/Match.js
// created when two users both like each other
// user1 is whoever liked second (triggered the match)
// isActive lets us soft-delete if someone unmatches

const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchedAt: { type: Date, default: Date.now },
  // not used to delete the row - if someone unmatches we just flip this to
  // false so the chat history still technically exists in the db but the
  // routes filter it out everywhere they query matches
  isActive:  { type: Boolean, default: true }
});

// note: there's no single "otherUser" field - since either person could be
// user1 or user2, every route that reads a match has to check both:
// const otherUserId = match.user1.toString() === myId ? match.user2 : match.user1;

module.exports = mongoose.model('Match', matchSchema);

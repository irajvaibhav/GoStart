// models/Like.js
// tracks every swipe action - like, pass, or superlike
// we check this to avoid showing already-swiped profiles
// and to detect mutual likes (= match)

const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  // ObjectId + ref: 'User' = this field just stores the _id of a User doc.
  // it's basically a foreign key. ref lets us .populate() to pull the full
  // user doc later if we ever need it, but right now we just store the id.
  fromUser:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who swiped
  toUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // who they swiped on
  action:    { type: String, enum: ['like', 'pass', 'superlike'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// one row per swipe. match.js checks this collection two ways:
// 1. find rows where fromUser = me  -> profiles I've already seen, exclude them from discover
// 2. find a row where fromUser = them AND toUser = me AND action = 'like' -> did they like me back?

module.exports = mongoose.model('Like', likeSchema);

// models/User.js
// the main user profile - stores everything from auth info to dating preferences
// photos array holds URLs (uploaded via multer or external links)
// credits system: users spend credits to like/message, buy more in credits route

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true },
  phone:      { type: String },
  photos:     [{ type: String }], // max 6, enforced in route
  bio:        { type: String },
  age:        { type: Number },
  gender:     { type: String, enum: ['male', 'female', 'other'] },
  height:     { type: String }, // like "5'4"
  religion:   { type: String },
  city:       { type: String },
  profession: { type: String },
  college:    { type: String },
  interests:  [{ type: String }],

  // what they're looking for
  preferences: {
    lookingFor: { type: String }, // male, female, other
    ageMin:     { type: Number, default: 18 },
    ageMax:     { type: Number, default: 35 },
    location:   { type: String, default: 'nearby' }
  },

  // fun profile prompts
  weekendVibe:   { type: String },
  firstDateIdea: { type: String },
  loveLanguage:  { type: String },

  isVerified:     { type: Boolean, default: false }, // flipped true by POST /api/users/verify, no real ID check happens
  credits:        { type: Number, default: 5 },      // spent on likes + first messages, see match.js / chat.js
  dailySwipesUsed:{ type: Number, default: 0 },       // counts up each like/pass, capped at 10/day in match.js
  lastSwipeReset: { type: Date },                     // last time dailySwipesUsed was zeroed - compared to "today" to know when to reset
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

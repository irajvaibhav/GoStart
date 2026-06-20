// config/db.js
// just connects to mongo using the URI from .env
// called once in server.js at startup

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGO_URI here points at a MongoDB Atlas cloud cluster (see backend/.env),
    // not a local mongod - so no need to install/run Mongo locally for this to work
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // if the db is unreachable there's nothing useful the server can do,
    // so exit instead of starting up half-broken
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

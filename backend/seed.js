// seed.js
// just 2 demo profiles - enough to demo the actual logic live (discover ->
// like -> match detection -> chat) instead of a big dataset that's mostly
// there to look full. run with: npm run seed

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Like = require('./models/Like');
const Match = require('./models/Match');
const Message = require('./models/Message');

const profiles = [
  {
    name: 'Priya Sharma',
    email: 'priya@gostart.com',
    gender: 'female',
    age: 24,
    city: 'Delhi',
    bio: 'Chai over coffee, always. Looking for someone to explore old Delhi lanes with.',
    profession: 'UX Designer',
    college: 'LSR',
    interests: ['Chai Lover', 'Traveller', 'Photographer', 'Foodie'],
    weekendVibe: 'Exploring cafes and flea markets',
    firstDateIdea: 'Street food walk in Chandni Chowk',
    loveLanguage: 'Quality Time',
    height: "5'4",
    religion: 'Hindu'
  },
  {
    name: 'Arjun Malhotra',
    email: 'arjun@gostart.com',
    gender: 'male',
    age: 26,
    city: 'Gurgaon',
    bio: 'Consultant by day, guitarist by night. Will write you a song if you ask nicely.',
    profession: 'Management Consultant',
    college: 'IIT Delhi',
    interests: ['Music Lover', 'Gym Rat', 'Traveller', 'Photographer'],
    weekendVibe: 'Jam sessions with friends',
    firstDateIdea: 'Live music gig',
    loveLanguage: 'Words of Affirmation',
    height: "5'11",
    religion: 'Hindu'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // destructive: wipes ALL users/likes/matches/messages, including any
    // real accounts you signed up with through the app. only run this when
    // you actually want a fresh demo dataset, not on a "real" deployment.
    await User.deleteMany({});
    await Like.deleteMany({});
    await Match.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data');

    // hash the shared password once (both seed users get 'password123')
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany(
      profiles.map((p) => ({
        ...p,
        password: hashedPassword,
        credits: 5,
        photos: [
          `https://picsum.photos/seed/${p.name.split(' ')[0].toLowerCase()}1/400/600`,
          `https://picsum.photos/seed/${p.name.split(' ')[0].toLowerCase()}2/400/600`,
          `https://picsum.photos/seed/${p.name.split(' ')[0].toLowerCase()}3/400/600`
        ],
        preferences: {
          lookingFor: p.gender === 'female' ? 'male' : 'female',
          ageMin: 21,
          ageMax: 30,
          location: 'nearby'
        }
      }))
    );

    console.log(`Created ${users.length} users`);

    const [priya, arjun] = users;

    // Arjun already likes Priya, one-sided, from the seed - on purpose.
    // this is set up for a LIVE demo: log in as Priya, hit "Find Match",
    // discover shows Arjun, and the moment she likes him back, match.js's
    // mutual-like check finds Arjun's like from here and creates a real
    // match right then - nothing about that match itself is pre-faked.
    await Like.create({ fromUser: arjun._id, toUser: priya._id, action: 'like' });

    console.log('Created 1 pending like: Arjun -> Priya (one-sided, on purpose)');
    console.log('\n--- Demo Accounts (password: password123) ---');
    console.log('priya@gostart.com  -> log in as her, hit "Find Match" -> she');
    console.log('                      swipes on Arjun -> live mutual match,');
    console.log('                      since he already liked her from the seed');
    console.log('arjun@gostart.com  -> already used his one swipe on Priya');
    console.log('                      during seeding, so his own discover is empty');
    console.log('-----------------------------------------------\n');

    await mongoose.disconnect();
    console.log('Done! Database seeded successfully.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();

# 💛 Gostart — Dating App

A full-stack dating app built with **React Native (Expo)** + **Node.js/Express** + **MongoDB**.

Runs on **both iOS and Android** via Expo Go.

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install

# make sure MongoDB is running locally, or update .env with your Atlas URI
# then seed the database with 2 demo profiles:
npm run seed

# start the server:
npm run dev
```

Server runs on `http://localhost:5000`

### 2. Mobile App Setup

```bash
cd mobile
npm install

# start Expo dev server:
npx expo start
```

Scan the QR code with **Expo Go** app (Android) or Camera app (iOS).

### Demo Login
Seeding creates exactly 2 accounts, set up so the match happens live instead
of being pre-faked: Arjun already likes Priya (one-sided) from the seed, so
logging in as Priya and hitting "Find Match" triggers a real mutual match
the moment she swipes on him.
- **Email:** priya@gostart.com
- **Password:** password123

---

## Tech Stack & Why

| What | Tool | Why |
|------|------|-----|
| Mobile | React Native + Expo | One codebase, runs on iOS + Android. Expo removes Xcode/Android Studio pain. |
| Navigation | React Navigation | Standard for RN. Gives us tab bar + stack navigation. |
| Swipe gestures | react-native-gesture-handler + reanimated | Gestures run on native thread → smooth 60fps, not laggy. |
| Backend | Node.js + Express | Simple, fast to build, same language (JS) as frontend. |
| Database | MongoDB + Mongoose | Flexible schema — user profiles have varying fields, Mongo handles that well. |
| Auth | JWT | Stateless tokens work great with mobile — no cookie/session issues. |
| Real-time chat | Socket.IO | Instant two-way messaging. No polling needed. |
| File uploads | Multer | Simple middleware to handle photo uploads. |

---

## Project Structure

```
gostart/
├── backend/                    # Node.js API server
│   ├── server.js               # entry point, Express + Socket.IO
│   ├── config/db.js            # MongoDB connection
│   ├── middleware/auth.js       # JWT verification
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js             # user profile + preferences + credits
│   │   ├── Like.js             # swipe records (like/pass)
│   │   ├── Match.js            # mutual matches
│   │   └── Message.js          # chat messages
│   ├── routes/                 # API endpoints (logic is in here, no controllers)
│   │   ├── auth.js             # register, login, get current user
│   │   ├── users.js            # profile update, photo upload, verification
│   │   ├── match.js            # discover, like, pass, matches list
│   │   ├── chat.js             # conversations, messages, send
│   │   └── credits.js          # balance, packages, purchase
│   └── seed.js                 # seeds 2 demo profiles set up for a live match demo
│
├── mobile/                     # React Native (Expo) app
│   ├── App.js                  # loads fonts, wraps with AuthProvider
│   ├── src/
│   │   ├── theme.js            # all design tokens (colors, fonts, spacing)
│   │   ├── api.js              # all API calls in one file (axios)
│   │   ├── AuthContext.js      # auth state (user, token, login/logout)
│   │   ├── navigation/
│   │   │   └── AppNavigator.js # all navigation in one file
│   │   └── screens/
│   │       ├── LoginScreen.js
│   │       ├── SignupScreen.js
│   │       ├── FindMatchScreen.js       # main hero screen ⭐
│   │       ├── MatchFoundScreen.js      # profile card after match
│   │       ├── StartConversationScreen.js
│   │       ├── DailyResetScreen.js      # empty state
│   │       ├── FiltersScreen.js         # preferences
│   │       ├── BuyCreditsScreen.js      # credit packages
│   │       ├── ChatListScreen.js        # conversations list
│   │       ├── ChatScreen.js            # 1:1 messaging
│   │       ├── CommunityScreen.js       # placeholder
│   │       ├── ProfileScreen.js         # own profile
│   │       └── VerificationScreen.js    # mock verification
│   └── package.json
```

---

## Backend Features (What's actually working)

### 1. Auth (JWT)
**How it works:** User registers with email + password. Password gets hashed with bcrypt before saving. On login, server compares hashed passwords and returns a JWT token. Every protected route checks this token via middleware.

**Why JWT:** Mobile apps can't use browser cookies easily. JWT is a self-contained token that the app stores in AsyncStorage and sends with every request.

### 2. Profile Management
- Update name, bio, photos, interests, preferences
- Upload photos via Multer (saved to /uploads folder)
- Set match preferences (looking for, age range, location)

### 3. Discovery Engine (Find My Match)
**How it works:**
1. User hits GET /api/match/discover
2. Server checks daily swipe limit (10/day for free users). Resets if new day.
3. Finds everyone this user already swiped on (Like collection)
4. Queries remaining users, filtering by preferences (gender, age range)
5. Returns up to 10 profiles

**Simple algorithm:** Just MongoDB queries with `$nin` (not in) to exclude seen profiles, plus `$gte`/`$lte` for age filtering. No ML or fancy matching.

### 4. Like / Pass / Match Logic
**How it works:**
1. User likes someone → POST /api/match/like
2. Server deducts 1 credit, saves Like record
3. **Key check:** Server looks if the OTHER person already liked THIS user
4. If yes → mutual match! Creates Match document, returns `{ matched: true }`
5. If no → returns `{ matched: false }`, they might match later

**This is the core dating app logic.** Two simple DB queries: save the like, check for the reverse like.

### 5. Credits System
- Every user starts with 5 free credits
- Swiping costs 1 credit
- First message to a match costs 1 credit
- Can "buy" more credits (mock purchase — no real payment)
- Daily swipe limit: 10/day (resets at midnight)

**Why credits:** Gamification + monetization model. Same as apps like Bumble/Hinge.

### 6. Real-Time Chat (Socket.IO)
**How it works:**
1. When user opens a chat, client connects to Socket.IO and joins a "room" (room ID = match ID)
2. When user sends a message: message saved to MongoDB via REST API, AND emitted via Socket.IO
3. Other user in the same room receives it instantly via `newMessage` event
4. Also supports typing indicators

**Why Socket.IO over polling:** Real-time. User A sends message → User B sees it in <100ms. With polling, there'd be a delay of whatever the poll interval is.

### 7. Verification (Mock)
User taps "Verify" → server flips `isVerified: true`. In production this would do face matching, but for demo it's instant.

### 8. Seed Data
2 profiles (Priya + Arjun) instead of a big dataset, on purpose — Arjun
already likes Priya from the seed, so logging in as Priya and swiping on him
triggers a real, live mutual match instead of showing one that's pre-faked.

---

## Frontend Approach

### Navigation Structure
One file (`AppNavigator.js`) handles everything:
- **Not logged in** → AuthStack (Login ↔ Signup)
- **Logged in** → 4-tab bottom nav:
  - Find Match → MatchFound → StartConversation → DailyReset / Filters / BuyCredits
  - Messages → Chat
  - Community (placeholder)
  - Profile → Verification

### Design System
All colors, fonts, spacing defined in `theme.js` — imported everywhere. Matches Figma's design tokens:
- Dark obsidian backgrounds (#0D0D0D)
- Golden accent gradients
- Crimson (dark red) buttons
- DMSerifDisplay for headings, Outfit for body text
- White-at-10% borders

### API Layer
Single `api.js` file with all backend calls. Axios interceptor auto-attaches JWT token. Android emulator uses special IP (10.0.2.2) to reach localhost.

### State Management
Simple React Context (`AuthContext`) — no Redux. Stores user + token. Persists to AsyncStorage for auto-login.

---

## API Endpoints Reference

| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, get JWT |
| GET | /api/auth/me | Get current user |
| PUT | /api/users/profile | Update profile |
| PUT | /api/users/preferences | Update match filters |
| POST | /api/users/verify | Mock verification |
| GET | /api/match/discover | Get swipeable profiles |
| POST | /api/match/like | Like (checks mutual match) |
| POST | /api/match/pass | Pass/skip |
| GET | /api/match/matches | Get all matches |
| GET | /api/chat/conversations | List chat threads |
| GET | /api/chat/messages/:id | Message history |
| POST | /api/chat/messages/:id | Send message |
| GET | /api/credits/balance | Credit balance |
| GET | /api/credits/packages | Available packages |
| POST | /api/credits/purchase | Buy credits (mock) |

---

## Running on iOS vs Android

- **Android:** Use Expo Go app from Play Store. API calls use `10.0.2.2` to reach localhost.
- **iOS:** Use Expo Go from App Store. API calls use `localhost` directly.
- **Physical device:** Update `BASE_URL` in `api.js` to your computer's local IP (e.g., `192.168.1.X`).

// api.js — axios instance + all API calls in one place
// urls must match what backend actually has in routes/

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// backend is deployed on Render (free tier) instead of pointing at a local
// LAN IP - works from any network now, not just while this laptop is on and
// running the server. free tier spins down after ~15 min idle, so the
// FIRST request after a quiet period can take 30-50s to respond while it
// wakes back up - that's normal, not a bug.
const BASE_URL = 'https://gostart-8ytm.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  // 60s, not the usual 10s - Render's free tier can take 30-50s to wake up
  // from a cold start, a short timeout would fail the very first request
  // after any idle period
  timeout: 60000,
});

// an axios "interceptor" runs before every single request made through this
// `api` instance. instead of manually adding the auth header to all ~15
// calls below, we do it once here - every api.get/post automatically gets
// `Authorization: Bearer <token>` attached if a token is saved
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── AUTH ────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const register = (name, email, password, age, gender) =>
  api.post('/auth/register', { name, email, password, age, gender });

export const getMe = () =>
  api.get('/auth/me');

// ─── PROFILE (backend: routes/users.js → /api/users) ──
export const updateProfile = (data) =>
  api.put('/users/profile', data);

export const updatePreferences = (data) =>
  api.put('/users/preferences', data);

export const verify = () =>
  api.post('/users/verify');

// ─── DISCOVER / MATCHING (backend: routes/match.js → /api/match) ──
export const getDiscover = () =>
  api.get('/match/discover');

export const likeUser = (targetUserId) =>
  api.post('/match/like', { targetUserId });

export const passUser = (targetUserId) =>
  api.post('/match/pass', { targetUserId });

export const getMatches = () =>
  api.get('/match/matches');

// ─── CHAT (backend: routes/chat.js → /api/chat) ─────
export const getConversations = () =>
  api.get('/chat/conversations');

export const getMessages = (matchId) =>
  api.get(`/chat/messages/${matchId}`);

export const sendMessage = (matchId, text) =>
  api.post(`/chat/messages/${matchId}`, { text });

// ─── CREDITS (backend: routes/credits.js → /api/credits) ──
export const getCredits = () =>
  api.get('/credits/balance');

export const getPackages = () =>
  api.get('/credits/packages');

export const purchaseCredits = (packageId) =>
  api.post('/credits/purchase', { packageId });

export default api;

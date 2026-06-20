// api.js — axios instance + all API calls in one place
// urls must match what backend actually has in routes/

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Testing on a real phone (not a simulator/emulator), so "localhost" and the
// emulator-only 10.0.2.2 alias won't reach this computer — use its LAN IP.
// Find yours with `ipconfig` (Windows) / `ifconfig` (Mac/Linux); phone and
// computer must be on the same Wi-Fi network.
const BASE_URL = 'http://192.168.1.5:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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

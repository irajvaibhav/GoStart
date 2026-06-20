// AuthContext.js — global auth state
// stores user + token, persists to AsyncStorage so user stays logged in

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, getMe } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true until we check stored token

  // on app launch, check if we have a saved token
  // this is what makes "stay logged in" work - without this, the app would
  // forget you and show the login screen every time it's reopened, even
  // though AsyncStorage still has a valid token from last time
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        // a saved token could be expired/revoked, so don't just trust it -
        // actually hit the backend once to confirm it still works, and grab
        // fresh user data (credits etc may have changed since last login)
        const res = await getMe();
        setUser(res.data.user || res.data);
      }
    } catch (err) {
      // token expired or invalid, clear it
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      // AppNavigator should wait on this `loading` flag before deciding
      // whether to show the login screen or the main app - while this is
      // still true, `token` is null (its initial value) even for an
      // already-logged-in user, so `isLoggedIn` would briefly read false
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    const { token: newToken, user: userData } = res.data;
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, age, gender) => {
    const res = await apiRegister(name, email, password, age, gender);
    const { token: newToken, user: userData } = res.data;
    await AsyncStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // refresh user data from backend
  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data.user || res.data);
    } catch (err) {
      // silently fail, user will see stale data
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// shortcut hook so screens don't have to import useContext + AuthContext
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export default AuthContext;

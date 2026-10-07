// context/AuthContext.jsx
// Global authentication state: who is logged in, and functions to
// log in / register / log out. Stored in React Context so any component
// can read it without prop drilling.

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'linkgraveyard_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know the session state

  // On first load: if a token exists, ask the backend who it belongs to.
  // This keeps the user logged in across page refreshes.
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        // Token is invalid/expired — the api interceptor already cleared it.
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  async function updateProfileName(name) {
    const { data } = await api.put('/auth/profile', { name });
    setUser(data.user);
    return data.user;
  }

  const value = { user, loading, login, register, logout, updateProfileName, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

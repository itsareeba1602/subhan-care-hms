import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

// SR-04: automatic session timeout after 15 minutes of inactivity.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    const session = authService.getSession();
    setUser(session);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const session = await authService.login(credentials);
    setSessionExpired(false);
    setUser(session);
    return session;
  };

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setSessionExpired(true);
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    if (!user) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }
    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetIdleTimer));
    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user, sessionExpired, clearSessionExpired: () => setSessionExpired(false) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * AuthContext — global auth state for the entire app.
 * Provides: { user, token, login, logout, loading }
 * 
 * Reads JWT from localStorage on mount, decodes it to get user info.
 * No secret required client-side — we only read the payload.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ws_jwt');
    if (stored) {
      try {
        const decoded = jwtDecode(stored);
        // Check expiry
        if (decoded.exp * 1000 > Date.now()) {
          setToken(stored);
          setUser(decoded); // { user_id, role, iat, exp }
        } else {
          localStorage.removeItem('ws_jwt');
        }
      } catch {
        localStorage.removeItem('ws_jwt');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((tokenStr, userData = null) => {
    localStorage.setItem('ws_jwt', tokenStr);
    setToken(tokenStr);
    try {
      const decoded = jwtDecode(tokenStr);
      setUser(userData ? { ...decoded, ...userData } : decoded);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ws_jwt');
    localStorage.removeItem('ws_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

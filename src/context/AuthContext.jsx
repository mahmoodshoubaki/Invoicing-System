'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '@/services/authService';

/**
 * AuthContext — provides authentication state and actions to the component tree.
 *
 * Shape:
 *   user           — the current user object or null
 *   isAuthenticated — boolean derived from user presence + token validity
 *   isLoading      — true while the session is being restored on first mount
 *   error          — last login/logout error string or null
 *   login(email, password) — async, returns { user, token }
 *   logout()       — synchronous, clears state
 */
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: async () => { },
  logout: () => { },
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore session from sessionStorage on first mount.
  useEffect(() => {
    try {
      if (authService.isAuthenticated()) {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Attempt to authenticate the user.
   * On success, updates context state and returns { user, token }.
   * On failure, sets error state and re-throws so callers can react.
   */
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear auth state and session storage.
   */
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const isAuthenticated = Boolean(user) && authService.isAuthenticated();

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

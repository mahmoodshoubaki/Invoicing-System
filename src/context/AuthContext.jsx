'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { identityRepository } from '@/repositories/identityRepository';

/**
 * AuthContext — provides authentication state and actions to the component tree.
 *
 * Neither the access nor the refresh token is ever visible here — both are
 * httpOnly cookies the browser manages. The only way to know who's logged
 * in (or whether anyone is) is to ask the backend, via Identity/me, which
 * doubles as the capabilities fetch.
 *
 * Shape:
 *   user               — the current user object or null
 *   isAuthenticated    — Boolean(user)
 *   isLoading          — true while Identity/me is in flight (mount or login)
 *   error              — last login error string or null
 *   capabilities       — { [module]: { [action]: boolean } }, from the same call as user
 *   can(module, action) — reads a single capability, defaults to false
 *   login(username, password) — async
 *   logout()           — async
 */
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  capabilities: {},
  can: () => false,
  login: async () => { },
  logout: async () => { },
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [capabilities, setCapabilities] = useState({});
  // Starts true: a client-side route guard consuming isAuthenticated could
  // render before this component's own mount effect (below) has even run —
  // it must see "still checking" rather than "checked, and you're logged
  // out", or it would redirect to /login before Identity/me is even called.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * The single source of truth for "am I logged in" — there's no local
   * token to inspect, so this always asks the backend. Called on mount and
   * right after a successful login.
   */
  const fetchMe = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user: me, capabilities: caps } = await identityRepository.getMe();
      setUser(me);
      setCapabilities(caps);
    } catch {
      // Not logged in (or the session couldn't be refreshed) — not an error to surface.
      setUser(null);
      setCapabilities({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  /**
   * Attempt to authenticate the user, then load their profile/capabilities.
   * On failure, sets error state and re-throws so callers can react.
   */
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(username, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
      setIsLoading(false);
      throw err;
    }
    await fetchMe();
  }, [fetchMe]);

  /**
   * End the session: tell the backend, then clear local state regardless.
   */
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setError(null);
    setCapabilities({});
  }, []);

  const can = useCallback(
    (module, action) => capabilities?.[module]?.[action] === true,
    [capabilities]
  );

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        capabilities,
        can,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

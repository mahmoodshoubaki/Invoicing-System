'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '@/services/authService';
import { identityRepository } from '@/repositories/identityRepository';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user: me, capabilities: caps } = await identityRepository.getMe();
      setUser(me);
      setCapabilities(caps);
    } catch {
      setUser(null);
      setCapabilities({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

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

import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

/**
 * useAuth — consume authentication state and actions from AuthContext.
 *
 * Must be used inside an <AuthProvider> tree.
 *
 * Returns:
 *   user           {object|null}  — current authenticated user
 *   isAuthenticated {boolean}     — true when a valid session exists
 *   isLoading      {boolean}      — true while session is being restored on mount
 *   error          {string|null}  — last error message from login attempt
 *   login          {Function}     — async (email, password) => { user, token }
 *   logout         {Function}     — () => void, clears session
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {

    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}

export default useAuth;

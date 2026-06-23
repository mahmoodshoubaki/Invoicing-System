import { createSlice } from '@reduxjs/toolkit';

/**
 * authSlice — mirrors the AuthContext state in the Redux store.
 *
 * Auth logic (login/logout, session persistence) is handled by
 * authService + AuthContext. This slice is the Redux mirror so
 * other slices / selectors can access auth state without prop drilling.
 */
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user and mark as authenticated.
     * Payload: user object
     */
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.error = null;
    },

    /**
     * Clear the current session.
     */
    clearUser(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    /**
     * Toggle the loading indicator.
     * Payload: boolean
     */
    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    /**
     * Set an error message.
     * Payload: string | null
     */
    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setUser, clearUser, setLoading, setError } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserRoles = (state) => state.auth.user?.roles ?? [];

export default authSlice.reducer;

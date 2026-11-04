import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { identityRepository } from '@/repositories/identityRepository';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

/**
 * @param {Object} [options] passed straight to the endpoint — notably
 *   `includeInactive`, which the admin screen needs: the endpoint returns
 *   active users by default, and a deactivated user has to be visible there
 *   in order to be reactivated.
 */
export const fetchAuthorizedUsers = createAsyncThunk(
  'users/fetchAuthorizedUsers',
  async (options = {}, { rejectWithValue }) => {
    try {
      return await identityRepository.getAuthorizedUsers(options);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch users.');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async (data, { rejectWithValue }) => {
    try {
      return await identityRepository.updateUser(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update user.');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (data, { rejectWithValue }) => {
    try {
      return await identityRepository.createUser(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create user.');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  users: [],
  usersLoading: false,
  usersError: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthorizedUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchAuthorizedUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchAuthorizedUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload;
      })
      .addCase(updateUser.pending, (state) => {
        state.usersError = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.usersError = action.payload;
      })
      .addCase(createUser.pending, (state) => {
        state.usersError = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.usersError = action.payload;
      });
  },
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectUsers = (state) => state.users.users;
export const selectUsersLoading = (state) => state.users.usersLoading;

export default usersSlice.reducer;

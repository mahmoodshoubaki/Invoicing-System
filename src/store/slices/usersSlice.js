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

export const fetchUnregisteredADUsers = createAsyncThunk(
  'users/fetchUnregisteredADUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await identityRepository.getUnregisteredADUsers();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch AD users.');
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
  adCandidates: [],
  adCandidatesLoading: false,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearAdCandidates(state) {
      state.adCandidates = [];
    },
  },
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
      })
      .addCase(fetchUnregisteredADUsers.pending, (state) => {
        state.adCandidatesLoading = true;
      })
      .addCase(fetchUnregisteredADUsers.fulfilled, (state, action) => {
        state.adCandidatesLoading = false;
        state.adCandidates = action.payload;
      })
      .addCase(fetchUnregisteredADUsers.rejected, (state, action) => {
        state.adCandidatesLoading = false;
        state.usersError = action.payload;
      });
  },
});

export const { clearAdCandidates } = usersSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectUsers = (state) => state.users.users;
export const selectUsersLoading = (state) => state.users.usersLoading;
export const selectAdCandidates = (state) => state.users.adCandidates;
export const selectAdCandidatesLoading = (state) => state.users.adCandidatesLoading;

export default usersSlice.reducer;

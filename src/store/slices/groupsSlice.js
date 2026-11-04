import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { identityRepository } from '@/repositories/identityRepository';

export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      return await identityRepository.getAllGroups();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load groups.');
    }
  }
);

const groupsSlice = createSlice({
  name: 'groups',
  initialState: { items: [], isLoading: false, loaded: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.loaded = true;
        state.items = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.loaded = true;
        state.error = action.payload;
      });
  },
});

export const selectGroups = (state) => state.groups.items;
export const selectGroupsLoading = (state) => state.groups.isLoading;
export const selectGroupsLoaded = (state) => state.groups.loaded;
export const selectGroupsError = (state) => state.groups.error;

export default groupsSlice.reducer;

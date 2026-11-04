import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationRepository } from '@/repositories/notificationRepository';

export const fetchUnseenCount = createAsyncThunk(
  'notifications/fetchUnseenCount',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationRepository.getMyUnseenCount();
    } catch (err) {
      return rejectWithValue(err.message || 'Could not check for new notifications.');
    }
  }
);

export const markAllSeen = createAsyncThunk(
  'notifications/markAllSeen',
  async (_, { rejectWithValue }) => {
    try {
      await notificationRepository.markAllSeen();
      return true;
    } catch (err) {
      return rejectWithValue(err.message || 'Could not mark notifications as seen.');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    unseenCount: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnseenCount.fulfilled, (state, action) => {
        state.unseenCount = action.payload;
      })
      .addCase(markAllSeen.pending, (state) => {
        state.unseenCount = 0;
      });
  },
});

export const selectUnseenCount = (state) => state.notifications.unseenCount;

export default notificationsSlice.reducer;

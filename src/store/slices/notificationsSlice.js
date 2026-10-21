import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationRepository } from '@/repositories/notificationRepository';

/**
 * The one number the whole shell shares: how many bell notifications this
 * person has not SEEN yet (opened the bell while they were there). The red
 * badge on the bell and on the sidebar's Notifications row both read it.
 *
 * Lists live in the components that show them — the bell panel and the inbox
 * page each ask for exactly the page they draw, and nothing else needs them.
 */
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

/**
 * Opening the bell marks everything in it seen. The badge drops to zero at
 * once — waiting for the next poll would show a count for things the person is
 * looking at.
 */
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
      // Optimistic: the person is looking at them now. A failed call leaves the
      // next poll to correct it rather than flashing the badge back.
      .addCase(markAllSeen.pending, (state) => {
        state.unseenCount = 0;
      });
  },
});

export const selectUnseenCount = (state) => state.notifications.unseenCount;

export default notificationsSlice.reducer;

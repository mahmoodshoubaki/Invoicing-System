import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
};

/**
 * Recompute unreadCount from the items array.
 * Supports both `read` (repository/mock field) and `isRead` (legacy) field names.
 */
function recalcUnread(state) {
  state.unreadCount = state.items.filter((n) => !(n.read ?? n.isRead)).length;
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    /**
     * Replace the full list of notifications.
     * Payload: notification[]
     */
    setNotifications(state, action) {
      state.items = action.payload;
      recalcUnread(state);
      state.isLoading = false;
    },

    /**
     * Mark a single notification as read.
     * Payload: string (notification id)
     */
    markAsRead(state, action) {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification) {
        // Support both field names; prefer `read` to match the data layer
        notification.read = true;
        notification.isRead = true;
      }
      recalcUnread(state);
    },

    /**
     * Mark all notifications as read.
     */
    markAllAsRead(state) {
      state.items.forEach((n) => {
        n.read = true;
        n.isRead = true;
      });
      state.unreadCount = 0;
    },

    /**
     * Prepend a new notification to the list.
     * Payload: notification object
     */
    addNotification(state, action) {
      state.items.unshift(action.payload);
      recalcUnread(state);
    },

    /**
     * Remove a notification by id.
     * Payload: string (notification id)
     */
    removeNotification(state, action) {
      state.items = state.items.filter((n) => n.id !== action.payload);
      recalcUnread(state);
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setNotifications,
  markAsRead,
  markAllAsRead,
  addNotification,
  removeNotification,
  setLoading,
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state) => state.notifications.isLoading;
export const selectUnreadNotifications = (state) =>
  state.notifications.items.filter((n) => !(n.read ?? n.isRead));

export default notificationsSlice.reducer;

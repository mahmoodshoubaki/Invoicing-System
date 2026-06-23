// REAL INTEGRATION POINT: Replace mock import and all method bodies with real
// API calls to your notification service (e.g., Azure Notification Hubs, SendGrid, etc.).
import { mockNotifications } from '@/mock/notifications';

/** In-memory mutable store — reset on each server/module reload. */
let notifications = [...mockNotifications];

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const notificationRepository = {
  /**
   * Return all notifications for a specific user, sorted newest first.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async getNotifications(userId) {
    await delay(200);
    return notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((n) => ({ ...n }));
  },

  /**
   * Mark a single notification as read.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async markAsRead(id) {
    await delay(150);

    const idx = notifications.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Notification not found: ${id}`);

    notifications[idx] = { ...notifications[idx], read: true };
    return { ...notifications[idx] };
  },

  /**
   * Mark all notifications for a user as read.
   * @param {string} userId
   * @returns {Promise<number>}  Number of notifications updated.
   */
  async markAllAsRead(userId) {
    await delay(200);

    let count = 0;
    notifications = notifications.map((n) => {
      if (n.userId === userId && !n.read) {
        count++;
        return { ...n, read: true };
      }
      return n;
    });

    return count;
  },

  /**
   * Create a new notification record.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createNotification(data) {
    await delay(150);

    if (!data.userId) throw new Error('Notification must have a userId.');
    if (!data.title) throw new Error('Notification must have a title.');
    if (!data.message) throw new Error('Notification must have a message.');

    const newNotif = {
      ...data,
      id: generateId(),
      read: false,
      createdAt: new Date().toISOString(),
    };

    notifications.unshift(newNotif);
    return { ...newNotif };
  },

  /**
   * Delete a notification by id.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteNotification(id) {
    await delay(150);
    notifications = notifications.filter((n) => n.id !== id);
  },

  /**
   * Return the count of unread notifications for a user.
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    await delay(100);
    return notifications.filter((n) => n.userId === userId && !n.read).length;
  },
};

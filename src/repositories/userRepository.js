// REAL INTEGRATION POINT: Replace mock import and all method bodies with real
// API calls (e.g., Microsoft Graph API for Azure AD users, or your own user management service).
import { mockUsers } from '@/mock/users';

/** In-memory mutable store — reset on each server/module reload. */
let users = [...mockUsers];

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

function generateId() {
  return `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const userRepository = {
  /**
   * Return all users.
   * @returns {Promise<object[]>}
   */
  async getUsers() {
    await delay(250);
    return users.map((u) => ({ ...u }));
  },

  /**
   * Find a single user by id.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getUser(id) {
    await delay(200);
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error(`User not found: ${id}`);
    return { ...user };
  },

  /**
   * Create a new user record.
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createUser(data) {
    await delay(400);

    // Check for duplicate email
    const existing = users.find(
      (u) => u.email.toLowerCase() === data.email?.toLowerCase()
    );
    if (existing) throw new Error(`A user with email "${data.email}" already exists.`);

    const now = new Date().toISOString();
    const newUser = {
      ...data,
      id: generateId(),
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    return { ...newUser };
  },

  /**
   * Update a user by id.
   * @param {string} id
   * @param {object} data  Partial fields to merge.
   * @returns {Promise<object>}
   */
  async updateUser(id, data) {
    await delay(350);

    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error(`User not found: ${id}`);

    users[idx] = {
      ...users[idx],
      ...data,
      id,                                     // Prevent id overwrite
      updatedAt: new Date().toISOString(),
    };

    return { ...users[idx] };
  },

  /**
   * Deactivate a user (soft delete).
   * @param {string} id
   * @returns {Promise<object>}
   */
  async deactivateUser(id) {
    return userRepository.updateUser(id, { isActive: false });
  },

  /**
   * Return all users who hold the given role.
   * @param {string} role
   * @returns {Promise<object[]>}
   */
  async getUsersByRole(role) {
    await delay(200);
    return users
      .filter((u) => Array.isArray(u.roles) && u.roles.includes(role))
      .map((u) => ({ ...u }));
  },

  /**
   * Return all active users.
   * @returns {Promise<object[]>}
   */
  async getActiveUsers() {
    await delay(200);
    return users.filter((u) => u.isActive).map((u) => ({ ...u }));
  },
};

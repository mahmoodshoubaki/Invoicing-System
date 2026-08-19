import { createApiClient } from '@/lib/apiClient';

const api = createApiClient('/api/auth');

/**
 * Known test accounts, kept for manual testing against the backend.
 * Not used by the login flow itself — login always hits the real API.
 */
export const TEST_USERS = [
  {
    id: '1',
    name: 'Ahmed Al-Rashidi',
    email: 'ahmed.rashidi@devoteam.com',
    employeeNumber: 'EMP001',
    department: 'Projects',
    roles: ['Administrator'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Sara Al-Otaibi',
    email: 'sara.otaibi@devoteam.com',
    employeeNumber: 'EMP002',
    department: 'Projects',
    roles: ['Project Manager'],
    isActive: true,
  },
  {
    id: '3',
    name: 'Khalid Al-Zahrani',
    email: 'khalid.zahrani@devoteam.com',
    employeeNumber: 'EMP003',
    department: 'Finance',
    roles: ['Invoicing Team'],
    isActive: true,
  },
  {
    id: '4',
    name: 'Noura Al-Ghamdi',
    email: 'noura.ghamdi@devoteam.com',
    employeeNumber: 'EMP004',
    department: 'Business Development',
    roles: ['BDM'],
    isActive: true,
  },
  {
    id: '5',
    name: 'Omar Al-Shehri',
    email: 'omar.shehri@devoteam.com',
    employeeNumber: 'EMP005',
    department: 'Operations',
    roles: ['DRM'],
    isActive: true,
  },
  {
    id: '6',
    name: 'Fatima Al-Saud',
    email: 'fatima.saud@devoteam.com',
    employeeNumber: 'EMP006',
    department: 'Finance',
    roles: ['CRP'],
    isActive: true,
  },
  {
    id: '7',
    name: 'Abdullah Al-Malik',
    email: 'abdullah.malik@devoteam.com',
    employeeNumber: 'EMP007',
    department: 'Executive',
    roles: ['BU Head'],
    isActive: true,
  },
  {
    id: '8',
    name: 'Maha Al-Dosari',
    email: 'maha.dosari@devoteam.com',
    employeeNumber: 'EMP008',
    department: 'IT',
    roles: ['Viewer'],
    isActive: true,
  },
];

export const authService = {
  /**
   * Authenticate against the real backend. Both the access and refresh
   * tokens are set server-side as httpOnly cookies — the frontend never
   * sees either, and the response body carries nothing to store. Whether
   * login actually worked is confirmed separately, by calling Identity/me
   * (see AuthContext) once this resolves without throwing.
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  async login(username, password) {
    // The login call itself must go out unauthenticated — there's no session yet.
    await api.post('/Login', { username, password }, { skipRefresh: true });
  },

  /**
   * End the session. Both cookies are cleared server-side when the backend
   * handles this call — there's nothing left for the frontend to delete.
   */
  async logout() {
    try {
      await api.post('/Logout', undefined, { skipRefresh: true });
    } catch {
      // Best-effort — the caller clears local UI state regardless.
    }
  },
};

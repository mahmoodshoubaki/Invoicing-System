// REAL INTEGRATION POINT: Replace with @azure/msal-browser PublicClientApplication
// configured with your Azure AD tenant.
//
// Example real setup:
// import { PublicClientApplication } from '@azure/msal-browser';
// const msalConfig = {
//   auth: { clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID, authority: process.env.NEXT_PUBLIC_AZURE_AUTHORITY },
//   cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false },
// };
// export const msalInstance = new PublicClientApplication(msalConfig);

const SESSION_USER_KEY = 'invoicing_user';
const SESSION_TOKEN_KEY = 'invoicing_token';

const MOCK_USERS = [
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

/** Generate a lightweight mock JWT-like token string. */
function generateMockToken(user) {
  const header = btoa(JSON.stringify({ alg: 'MOCK', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      iat: Date.now(),
      exp: Date.now() + 8 * 60 * 60 * 1000, // 8-hour session
    })
  );
  const signature = btoa(`mock-sig-${user.id}`);
  return `${header}.${payload}.${signature}`;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Authenticate a user by email (password is ignored in mock mode).
   * REAL INTEGRATION POINT: Replace body with MSAL acquireTokenPopup / acquireTokenRedirect flow.
   *
   * @param {string} email
   * @param {string} _password  - unused in mock; present for API compatibility
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login(email, _password) {
    await delay(800);

    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      throw new Error('Invalid credentials. User not found.');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact your administrator.');
    }

    const token = generateMockToken(user);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      // Write cookie so the server-side proxy can verify the session
      document.cookie = `auth-token=${token}; path=/; SameSite=Strict`;
    }

    return { user, token };
  },

  /**
   * Clear the current session.
   * REAL INTEGRATION POINT: Also call msalInstance.logoutPopup() or msalInstance.logoutRedirect().
   */
  logout() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_USER_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    }
  },

  /**
   * Restore the current user from sessionStorage.
   * @returns {object|null}
   */
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(SESSION_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check whether a valid session exists.
   * @returns {boolean}
   */
  isAuthenticated() {
    if (typeof window === 'undefined') return false;
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return false;

    try {
      // Decode mock token payload and check expiry
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp > Date.now();
    } catch {
      return false;
    }
  },

  /**
   * Return the raw token string.
   * @returns {string|null}
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(SESSION_TOKEN_KEY);
  },
};

// ---------------------------------------------------------------------------
// REAL INTEGRATION POINT: Azure AD / MSAL stubs
// Uncomment and configure when replacing mock auth with real MSAL flows.
// ---------------------------------------------------------------------------

/**
 * Trigger MSAL popup login and return the resulting account/token.
 * Replace body with: await msalInstance.acquireTokenPopup(loginRequest);
 */
export async function msalLogin() {
  // REAL: const result = await msalInstance.acquireTokenPopup({ scopes: ['User.Read'] });
  // REAL: store result.account and result.accessToken, then call authService.getCurrentUser()
  throw new Error('msalLogin: not yet configured. Provide Azure AD tenant details.');
}

/**
 * Sign out via MSAL and clear local session.
 */
export async function msalLogout() {
  // REAL: await msalInstance.logoutPopup();
  authService.logout();
  throw new Error('msalLogout: not yet configured. Provide Azure AD tenant details.');
}

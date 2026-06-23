import { ROLES } from '../constants/roles';

export const mockUsers = [
  {
    id: 'usr-001',
    name: 'Ahmed Al-Rashidi',
    email: 'a.alrashidi@devoteam.com',
    employeeNumber: 'EMP-1001',
    department: 'IT',
    roles: [ROLES.ADMIN],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-15T08:22:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'usr-002',
    name: 'Sara Al-Otaibi',
    email: 's.alotaibi@devoteam.com',
    employeeNumber: 'EMP-1002',
    department: 'Projects',
    roles: [ROLES.PROJECT_MANAGER],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-14T10:45:00Z',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'usr-003',
    name: 'Khalid Al-Zahrani',
    email: 'k.alzahrani@devoteam.com',
    employeeNumber: 'EMP-1003',
    department: 'Finance',
    roles: [ROLES.INVOICING_TEAM],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-15T09:10:00Z',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 'usr-004',
    name: 'Noura Al-Ghamdi',
    email: 'n.alghamdi@devoteam.com',
    employeeNumber: 'EMP-1004',
    department: 'Business Development',
    roles: [ROLES.BDM],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-13T14:30:00Z',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 'usr-005',
    name: 'Omar Al-Shehri',
    email: 'o.alshehri@devoteam.com',
    employeeNumber: 'EMP-1005',
    department: 'Operations',
    roles: [ROLES.DRM],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-12T11:00:00Z',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'usr-006',
    name: 'Fatima Al-Saud',
    email: 'f.alsaud@devoteam.com',
    employeeNumber: 'EMP-1006',
    department: 'Finance',
    roles: [ROLES.CRP],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-11T16:20:00Z',
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
  },
  {
    id: 'usr-007',
    name: 'Abdullah Al-Malik',
    email: 'a.almalik@devoteam.com',
    employeeNumber: 'EMP-1007',
    department: 'Operations',
    roles: [ROLES.BU_HEAD],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-15T07:55:00Z',
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-07T00:00:00Z',
  },
  {
    id: 'usr-008',
    name: 'Maha Al-Dosari',
    email: 'm.aldosari@devoteam.com',
    employeeNumber: 'EMP-1008',
    department: 'IT',
    roles: [ROLES.VIEWER],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-10T13:40:00Z',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: 'usr-009',
    name: 'Turki Al-Qarni',
    email: 't.alqarni@devoteam.com',
    employeeNumber: 'EMP-1009',
    department: 'Business Development',
    roles: [ROLES.BDM, ROLES.PROJECT_MANAGER],
    avatar: null,
    isActive: true,
    lastLogin: '2025-06-14T15:15:00Z',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'usr-010',
    name: 'Hessa Al-Mutairi',
    email: 'h.almutairi@devoteam.com',
    employeeNumber: 'EMP-1010',
    department: 'Finance',
    roles: [ROLES.INVOICING_TEAM, ROLES.ADMIN],
    avatar: null,
    isActive: false,
    lastLogin: '2025-05-28T09:00:00Z',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2025-05-28T09:00:00Z',
  },
];

/**
 * Find a user by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getUserById(id) {
  return mockUsers.find((u) => u.id === id);
}

/**
 * Find users by role.
 * @param {string} role
 * @returns {object[]}
 */
export function getUsersByRole(role) {
  return mockUsers.filter((u) => u.roles.includes(role));
}

/**
 * Get display name for a user ID.
 * @param {string} id
 * @returns {string}
 */
export function getUserName(id) {
  const user = getUserById(id);
  return user ? user.name : 'Unknown User';
}

import { NextResponse } from 'next/server';
import { ROLE_PERMISSIONS } from '@/constants/permissions';

const PUBLIC_PATHS = ['/login', '/unauthorized', '/_next', '/favicon.ico', '/api'];

// First match wins — put more-specific prefixes before broader ones.
const ROUTE_PERMISSIONS = [
  { prefix: '/projects/new',                                permission: 'project.create' },
  { test: (path) => /^\/projects\/[^/]+\/boq(\/|$)/.test(path),      permission: 'boq.read'     },
  { test: (path) => /^\/projects\/[^/]+\/invoices\/new(\/|$)/.test(path), permission: 'invoice.submit' },
  { prefix: '/projects',                                    permission: 'project.read'    },
  { prefix: '/invoices',       permission: 'invoice.read'         },
  { prefix: '/workflow',       permission: 'workflow.read'        },
  { prefix: '/notifications',  permission: 'notification.read'   },
  { prefix: '/reports',        permission: 'report.read'          },
  { prefix: '/admin',          permission: 'admin.manage'         },
];

function getRolesFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Array.isArray(payload.roles) ? payload.roles : [];
  } catch {
    return [];
  }
}

function canAccess(roles, permission) {
  return roles.some((role) => (ROLE_PERMISSIONS[role] ?? []).includes(permission));
}

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Authenticated users visiting /login → send straight to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Public paths — no auth needed
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // No token → redirect to login, preserving intended destination
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access: check if the user's roles grant the required permission
  const route = ROUTE_PERMISSIONS.find(({ prefix, test }) => (test ? test(pathname) : pathname.startsWith(prefix)));
  if (route) {
    const roles = getRolesFromToken(token);
    if (!canAccess(roles, route.permission)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

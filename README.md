# Enterprise Invoicing & Tracking System
### Devoteam Middle East

A production-ready, enterprise-grade web application for managing projects, BOQ, invoice requests, workflows, and approvals.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | JavaScript (ES2022+) |
| State Management | Redux Toolkit |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |
| Authentication | Mock MSAL / Active Directory |

---

## Modules

| Module | Status | Description |
|---|---|---|
| Authentication | Complete | AD/LDAP mock with MSAL-ready architecture |
| RBAC | Complete | 8 roles, dynamic permissions engine |
| Dashboard | Complete | Executive KPIs, charts, SLA widgets |
| Projects | Complete | Full CRUD, archiving, detail view |
| BOQ | Complete | BOQ items, approval workflow, bulk ops |
| Invoice Requests | Complete | Submit, approve, reject flow |
| Workflow Engine | Complete | Node-based visual builder |
| Admin Portal | Complete | Users, roles, permissions matrix |
| Notifications | Complete | System + Email notification center |
| SLA Engine | Complete | Violation tracking, escalation levels |
| Etimad Integration | Complete | Mock architecture, ready for real API |
| Reports | Complete | Exportable reports |

---

## Roles & Permissions

| Role | Key Permissions |
|---|---|
| Administrator | All permissions |
| Project Manager | project.*, boq.create/edit, invoice.submit |
| Invoicing Team | boq.approve, invoice.approve/reject |
| BDM | project.create/edit, report.read |
| DRM | project.edit, report.read |
| CRP | project.read, invoice.read |
| BU Head | boq.approve, invoice.approve, report.read |
| Viewer | *.read only |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/          # All protected pages
│   │   ├── dashboard/        # Executive dashboard
│   │   ├── projects/         # Project CRUD
│   │   ├── boq/              # BOQ management
│   │   ├── invoices/         # Invoice requests
│   │   ├── workflow/         # Workflow engine
│   │   ├── admin/            # Admin portal
│   │   ├── notifications/    # Notifications
│   │   └── reports/          # Reports
│   └── unauthorized/         # 403 page
├── components/
│   ├── layout/               # Sidebar, Header, AppShell
│   ├── common/               # Button, Card, Table, Modal, Badge, etc.
│   ├── forms/                # FormField, Input, Select, Textarea
│   ├── charts/               # RevenueChart, InvoiceStatusChart, BOQProgressChart
│   └── workflow/             # Workflow node components
├── context/
│   └── AuthContext.jsx       # Authentication context provider
├── hooks/
│   ├── useAuth.js            # Auth hook
│   ├── usePermission.js      # RBAC permission hook
│   ├── useToast.js           # Toast notification hook
│   ├── usePagination.js      # Pagination hook
│   └── useDebounce.js        # Debounce hook
├── store/
│   ├── index.js              # Redux store
│   └── slices/               # projectsSlice, boqSlice, invoicesSlice, etc.
├── services/
│   ├── authService.js        # Auth (mock MSAL)
│   ├── projectService.js     # Project business logic
│   ├── boqService.js         # BOQ business logic
│   ├── invoiceService.js     # Invoice business logic
│   ├── workflowService.js    # Workflow engine
│   ├── notificationService.js # Notifications (mock)
│   ├── slaService.js         # SLA tracking
│   ├── etimadService.js      # Etimad integration (mock)
│   └── permissionService.js  # RBAC engine
├── repositories/             # Data access layer (swap for real APIs)
├── constants/                # Roles, permissions, routes, statuses
├── utils/                    # Formatters, date utils, cn
├── theme/                    # Brand colors and theme config
└── mock/                     # All mock/dummy data
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open http://localhost:3000 — you will be redirected to the login page.

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Administrator | ahmed.rashidi@devoteam.com | any |
| Project Manager | sara.otaibi@devoteam.com | any |
| Invoicing Team | khalid.zahrani@devoteam.com | any |
| BDM | noura.ghamdi@devoteam.com | any |
| DRM | omar.shehri@devoteam.com | any |
| CRP | fatima.saud@devoteam.com | any |
| BU Head | abdullah.malik@devoteam.com | any |
| Viewer | maha.dosari@devoteam.com | any |

---

## Real API Integration Points

Every file that contains mock data or simulated behavior is marked with:

```js
// REAL INTEGRATION POINT: <description of what to replace>
```

### Authentication (authService.js)
Replace MOCK_USERS lookup with @azure/msal-browser PublicClientApplication:
```js
import { PublicClientApplication } from '@azure/msal-browser';
const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
  }
};
```

### Repository Layer (repositories/)
Replace mock imports with fetch calls:
```js
// After (real API):
const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`);
return response.json();
```

### Etimad Integration (services/etimadService.js)
Replace dummy returns with actual HTTP calls to the Etimad government API.

### Notifications (services/notificationService.js)
Replace console logs with your email/push notification provider (SendGrid, Azure Communication Services, etc.).

---

## Branding

| Token | Value |
|---|---|
| Primary | #f8485e |
| Accent | #fcc354 |
| Secondary | #fca2ae |
| Dark Grey | #3c3c3a |
| Background | #efeeee |
| White | #ffffff |

Fonts: Montserrat (English) · Tajawal (Arabic)

---

## Internationalization

Language toggle is in the top header bar. Switching to Arabic sets document.dir = 'rtl' and switches the font to Tajawal. To add more Arabic translations, extend the labelAr fields in Sidebar.jsx and page components.

---

## Environment Variables

Copy .env.local and fill in production values. All NEXT_PUBLIC_ variables are exposed to the browser.

---

## License

Proprietary — Devoteam Middle East. All rights reserved.

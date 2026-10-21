'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import ToastContainer from '@/components/common/Toast';
import PreferencesSync from '@/components/layout/PreferencesSync';
import LookupsSync from '@/components/layout/LookupsSync';
import CapabilityGuard from '@/components/layout/CapabilityGuard';
import AuthGuard from '@/components/layout/AuthGuard';
import WorkflowTasksSync from '@/components/layout/WorkflowTasksSync';
import NotificationsSync from '@/components/layout/NotificationsSync';

export default function DashboardLayout({ children }) {
  return (
    <Provider store={store}>
      <PreferencesSync />
      <LookupsSync />
      <AuthProvider>
        <AuthGuard>
          {/* Inside AuthGuard: it reads capabilities, which only exist once
              Identity/me has resolved. */}
          <WorkflowTasksSync />
          <NotificationsSync />
          <CapabilityGuard>
            <AppShell>
              {children}
            </AppShell>
          </CapabilityGuard>
        </AuthGuard>
        <ToastContainer />
      </AuthProvider>
    </Provider>
  );
}

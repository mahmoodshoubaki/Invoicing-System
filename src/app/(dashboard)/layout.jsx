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

export default function DashboardLayout({ children }) {
  return (
    <Provider store={store}>
      <PreferencesSync />
      <LookupsSync />
      <AuthProvider>
        <AuthGuard>
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

'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import ToastContainer from '@/components/common/Toast';

export default function DashboardLayout({ children }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppShell>
          {children}
        </AppShell>
        <ToastContainer />
      </AuthProvider>
    </Provider>
  );
}

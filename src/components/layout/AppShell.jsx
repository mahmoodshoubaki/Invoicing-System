'use client';

import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }) {
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen);

  return (
    <div className="min-h-screen bg-app flex">
      <Sidebar />

      {/* Main content area — shifts right based on sidebar width */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '256px' : '64px' }}
      >
        <Header />

        {/* Page content */}
        <main className="flex-1 pt-16 overflow-auto">
          <div className="page-container">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-3 px-6 border-t border-gray-100 bg-white mt-auto">
          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} Devoteam Middle East · Enterprise Invoicing & Tracking System
          </p>
        </footer>
      </div>
    </div>
  );
}

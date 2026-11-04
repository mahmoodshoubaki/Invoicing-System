'use client';

import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-app flex flex-col">
      <Header />

      {/* Sidebar and page side by side, between the fixed header and the footer.
          Reversed in RTL so the sidebar stays on the left, as before. */}
      <div className="flex flex-1 pt-16 rtl:flex-row-reverse">
        <Sidebar />

        <main className="flex-1 min-w-0 overflow-auto">
          <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Footer, full width under the sidebar */}
      <footer className="py-3 px-6 border-t border-gray-100 bg-white">
        <p className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Devoteam Middle East · Enterprise Invoicing & Tracking System
        </p>
      </footer>
    </div>
  );
}

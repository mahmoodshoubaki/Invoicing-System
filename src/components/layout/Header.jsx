'use client';

import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import LanguageToggle from './LanguageToggle';
import { Currencies } from '@/constants/currencies';
import CurrencyMenu from './CurrencyMenu';
import NotificationBell from '@/components/notifications/NotificationBell';
import logo from '@/theme/assets/devoteam-logo.png';

export default function Header() {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Hard reload, not router.push — this wipes the entire Redux store
    // (invoices/projects/BOQ/users, all still in memory from the logged-out
    // session) instead of leaving it dangling through a soft navigation,
    // matching how handleSessionExpired (apiClient.js) already redirects
    // on session loss.
    window.location.href = '/login';
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-100 z-20 flex items-center px-4 gap-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <Image src={logo} alt="Devoteam logo" width={32} height={32} className="rounded-full" />
        </div>
        <div className="min-w-0 hidden sm:block">
          <p className="text-xs font-bold text-dark leading-tight truncate">Devoteam</p>
          <p className="text-[10px] text-gray-400 leading-tight truncate">Invoicing System</p>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <LanguageToggle />
        <CurrencyMenu />
        <NotificationBell />

        <UserMenu user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
}

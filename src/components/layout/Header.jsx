'use client';

import { useRouter } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const unreadCount = useSelector((s) => s.notifications.unreadCount);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <LanguageToggle />

        <button
          onClick={() => router.push('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <UserMenu user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
}

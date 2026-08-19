'use client';

import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Menu from './Menu';

export default function UserMenu({ user, onLogout }) {
  return (
    <Menu
      menuButtonElement={
        <>
          <Avatar name={user?.displayName} size={32} />
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {user?.displayName}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {user?.roles?.[0]}
            </p>
          </div>
          <ChevronDown size={14} className="text-gray-500 hidden md:block" />
        </>
      }
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">{user?.displayName}</p>
        {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{user?.username}</p>
      </div>
      {/* <div className="py-1">
            <button
              onClick={() => { router.push('/profile'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={14} /> My Profile
            </button>
            <button
              onClick={() => { router.push('/admin/settings'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={14} /> Settings
            </button>
          </div> */}
      <div className="border-t border-gray-100 py-1">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </Menu>
  );
}

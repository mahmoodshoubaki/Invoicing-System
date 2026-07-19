'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import Menu from './Menu';

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <Menu
      menuButtonElement={
        <>
          <Avatar name={user?.name} size={32} />
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {user?.name}
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
        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.email}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Emp# {user?.employeeNumber}
        </p>
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
          onClick={() => {
            onLogout();
            setOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </Menu>
  );
}

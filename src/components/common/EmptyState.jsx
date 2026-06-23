'use client';

import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-600 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-400 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

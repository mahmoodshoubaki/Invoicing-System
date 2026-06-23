'use client';

import { useRouter } from 'next/navigation';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-2xl mb-6">
          <ShieldOff size={40} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          You don't have permission to access this page. Please contact your system administrator to request access.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-medium"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
}

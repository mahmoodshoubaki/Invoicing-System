'use client';

export default function LoadingSpinner({ size = 'md', center = false, message }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const Spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizeMap[size] || sizeMap.md} border-[3px] border-gray-200 border-t-primary rounded-full animate-spin`} />
      {message && <p className="text-sm text-gray-400">{message}</p>}
    </div>
  );

  if (center) {
    return <div className="flex items-center justify-center min-h-40">{Spinner}</div>;
  }

  return Spinner;
}

export function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
}

'use client';

const VARIANTS = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-red-50 text-primary',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  dark: 'bg-gray-800 text-white',
  accent: 'bg-amber-50 text-amber-700',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const STATUS_VARIANT_MAP = {
  // BOQ statuses
  Draft: 'default',
  'Pending Verification': 'warning',
  'Pending Request': 'info',
  Invoiced: 'success',
  Delayed: 'danger',
  // Invoice statuses
  Submitted: 'info',
  'Under Review': 'warning',
  Rejected: 'danger',
  // Project statuses
  'In Progress': 'success',
  'On Hold': 'warning',
  Completed: 'info',
  // Workflow statuses
  Inactive: 'default',
  Approved: 'success',
  // General
  Pending: 'warning',
};

export function getBadgeVariant(status) {
  return STATUS_VARIANT_MAP[status] || 'default';
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const v = typeof variant === 'string' && VARIANTS[variant] ? variant : 'default';
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${VARIANTS[v]} ${SIZES[size]} ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          v === 'success' ? 'bg-green-500' :
          v === 'danger' ? 'bg-red-500' :
          v === 'warning' ? 'bg-yellow-500' :
          v === 'info' ? 'bg-blue-500' :
          v === 'primary' ? 'bg-primary' :
          'bg-gray-400'
        }`} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status, size = 'md' }) {
  return (
    <Badge variant={getBadgeVariant(status)} size={size} dot>
      {status}
    </Badge>
  );
}

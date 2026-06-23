'use client';

export function FormField({ label, required, error, hint, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-primary ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
    </div>
  );
}

export function Input({
  label, required, error, hint, className = '', ...props
}) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <input
        className={`
          w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-800 placeholder-gray-400
          transition-colors
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 focus:border-primary'
          }
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    </FormField>
  );
}

export function Select({ label, required, error, hint, options = [], placeholder, className = '', ...props }) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <select
        className={`
          w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-800
          transition-colors appearance-none
          ${error ? 'border-red-400' : 'border-gray-200 focus:border-primary'}
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export function Textarea({ label, required, error, hint, rows = 3, className = '', ...props }) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <textarea
        rows={rows}
        className={`
          w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-800 placeholder-gray-400 resize-none
          transition-colors
          ${error ? 'border-red-400' : 'border-gray-200 focus:border-primary'}
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
    </FormField>
  );
}

export function Checkbox({ label, description, error, className = '', ...props }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        type="checkbox"
        className="w-4 h-4 mt-0.5 accent-primary rounded shrink-0"
        {...props}
      />
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      )}
    </div>
  );
}

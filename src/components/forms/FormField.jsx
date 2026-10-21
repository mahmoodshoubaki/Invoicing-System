'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

// `data-field` and `data-problem` let a form find its first problem and scroll to it (2026-10-20).
export function FormField({ label, required, error, hint, children, className = '' }) {
  return (
    <div data-field className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-primary ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p data-problem className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
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

/**
 * Numeric text input that displays thousands separators ("1,234.56") while
 * unfocused, and the plain editable number while typing. A native
 * `type="number"` input can never show commas — browsers reject non-numeric
 * characters outright — and reformatting live on every keystroke causes the
 * cursor to jump mid-edit, so this only reformats on blur/focus instead.
 * `value`/`onChange` behave like Input's: `value` is a plain numeric
 * string, and `onChange` receives `{ target: { value } }` with the comma
 * formatting already stripped back out, so existing `set(field)`-style
 * handlers (`(e) => setForm(f => ({...f, [field]: e.target.value}))`) work
 * unchanged.
 */
export function NumberInput({
  label, required, error, hint, value, onChange, decimals = 2, className = '', onFocus, onBlur, ...props
}) {
  const [focused, setFocused] = useState(false);

  const displayValue = (() => {
    if (focused) return value ?? '';
    const num = Number(value);
    if (value === '' || value == null || Number.isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  })();

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, '');
    onChange?.({ target: { value: raw } });
  };

  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
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

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Which date the calendar should open on: the selected value if there is
 * one, otherwise `min` (clamped to `max`) so a fresh picker for e.g. a new
 * tracker cycle opens right around the next available date instead of
 * whatever month today happens to be — which could be many clicks away for
 * a contract running a year or more out. */
function initialViewIso(value, min, max) {
  if (value) return value;
  if (min && (!max || min <= max)) return min;
  if (max) return max;
  return null;
}

/** Always returns a full 6-row (42-cell) Monday-first grid, padded with
 * adjacent-month days so the calendar height never shifts between months. */
function buildCalendarGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const leadingCount = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = leadingCount; i > 0; i--) cells.push(new Date(year, month, 1 - i));
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return cells;
}

/**
 * DD/MM/YYYY date picker. A native `<input type="date">` displays in
 * whatever format the OS/browser locale dictates, which can't be forced to
 * DD/MM/YYYY — so this renders a formatted trigger plus a self-built
 * calendar popover instead. `value`/`onChange` behave like Input's: `value`
 * is a plain ISO date string ('YYYY-MM-DD') and `onChange` receives
 * `{ target: { value } }` with an ISO string, so existing `set(field)`-style
 * handlers work unchanged. `min`/`max` are ISO date strings.
 */
const POPOVER_WIDTH = 288;
const POPOVER_HEIGHT_ESTIMATE = 340;

export function DatePicker({
  label, required, error, hint, value, onChange, min, max, disabled, className = '', placeholder = 'DD/MM/YYYY',
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseIsoDate(initialViewIso(value, min, max)) ?? new Date());
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Renders the calendar into a portal at a fixed, viewport-relative
  // position instead of as a normal in-flow child. Positioned absolutely
  // inside the trigger (the original approach), the popover's height was
  // part of the table row's/section's layout, so opening it inside a table
  // cell pushed the row taller and the page scrolled to follow — jarring,
  // especially many rows deep. A portal sidesteps that entirely: it can
  // never affect the layout of anything it's opened from.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < POPOVER_HEIGHT_ESTIMATE && rect.top > spaceBelow;
    const left = Math.min(
      Math.max(rect.left, 8),
      window.innerWidth - POPOVER_WIDTH - 8
    );
    setCoords({
      left,
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      openUpward,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setViewDate(parseIsoDate(initialViewIso(value, min, max)) ?? new Date());

    function handleClick(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    // Scroll can happen on the trigger's own ancestors (a table wrapper, the
    // page, etc.) — closing rather than tracking it keeps the popover from
    // ever drifting away from a trigger that's scrolled out from under it.
    function handleScroll() { setOpen(false); }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const emit = (iso) => onChange?.({ target: { value: iso } });
  const isOutOfRange = (iso) => (min && iso < min) || (max && iso > max);

  const handleSelectDay = (day) => {
    const iso = toIsoDate(day);
    if (isOutOfRange(iso)) return;
    emit(iso);
    setOpen(false);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildCalendarGrid(year, month);
  const selectedIso = value ? String(value).slice(0, 10) : '';
  const todayIso = toIsoDate(new Date());

  // Year options span min/max when given (so the dropdown can't jump
  // somewhere entirely out of range), padded out to a plain +/-10 window
  // otherwise — always including the currently-viewed year even if it
  // happens to sit outside that.
  const minYear = parseIsoDate(min)?.getFullYear();
  const maxYear = parseIsoDate(max)?.getFullYear();
  const yearRangeStart = Math.min(minYear ?? year - 10, year);
  const yearRangeEnd = Math.max(maxYear ?? year + 10, year);
  const yearOptions = [];
  for (let y = yearRangeStart; y <= yearRangeEnd; y++) yearOptions.push(y);

  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen((o) => !o); }
        }}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm border rounded-lg bg-white
          transition-colors select-none
          ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
          ${error
            ? 'border-red-400 focus:border-red-500'
            : 'border-gray-200 focus:border-primary'
          }
          ${className}
        `}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); emit(''); }}
              className="text-gray-300 hover:text-gray-500"
              title="Clear date"
            >
              <X size={13} />
            </button>
          )}
          <Calendar size={14} className="text-gray-400" />
        </span>
      </div>

      {open && !disabled && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3"
          style={{
            left: coords.left,
            top: coords.openUpward ? undefined : coords.top,
            bottom: coords.openUpward ? window.innerHeight - coords.top : undefined,
          }}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 shrink-0"
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1 min-w-0">
              <select
                value={month}
                onChange={(e) => setViewDate(new Date(year, Number(e.target.value), 1))}
                className="text-sm font-semibold text-gray-700 bg-transparent border-none rounded-md px-1 py-0.5 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 cursor-pointer"
              >
                {MONTH_LABELS.map((label, i) => (
                  <option key={label} value={i}>{label}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setViewDate(new Date(Number(e.target.value), month, 1))}
                className="text-sm font-semibold text-gray-700 bg-transparent border-none rounded-md px-1 py-0.5 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 shrink-0"
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[11px] font-medium text-gray-400 text-center py-1">{w}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day) => {
              const iso = toIsoDate(day);
              const inMonth = day.getMonth() === month;
              const isSelected = iso === selectedIso;
              const isToday = iso === todayIso;
              const outOfRange = isOutOfRange(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={outOfRange}
                  onClick={() => handleSelectDay(day)}
                  className={`
                    text-xs rounded-md py-1.5 transition-colors
                    ${!inMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${outOfRange ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary/10 cursor-pointer'}
                    ${isSelected ? 'bg-primary text-white hover:bg-primary' : ''}
                    ${isToday && !isSelected ? 'ring-1 ring-primary/40' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { emit(''); setOpen(false); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { if (!isOutOfRange(todayIso)) { emit(todayIso); setOpen(false); } }}
              className="text-xs text-primary font-medium hover:underline"
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
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

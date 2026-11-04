'use client';

import { STATUS } from '@/theme/vizPalette';
import { SELECTION_COLOR } from './canvasStyles';
import { useListSorting } from './Sortable';

/**
 * @param {{ label: string, verb?: string, blockedReason?: string|null, onPaste: () => void, edge?: 'top'|'bottom' }} props
 */
export function PasteSlot({ label, verb = 'Paste', blockedReason = null, onPaste, edge = 'top' }) {
  // Cards collapse while their list is dragged; a slot would mark a gap that moves.
  const sorting = useListSorting();
  if (sorting) return null;

  const blocked = Boolean(blockedReason);
  const text = blocked ? `Can't ${verb.toLowerCase()} here: ${blockedReason}` : label;
  const color = blocked ? STATUS.critical : SELECTION_COLOR;
  const reveal = 'opacity-0 transition-opacity group-hover/slot:opacity-100 group-focus-visible/slot:opacity-100';

  return (
    <button
      type="button"
      onClick={blocked ? undefined : onPaste}
      aria-disabled={blocked}
      aria-label={text}
      title={text}
      className={`group/slot absolute inset-x-0 z-10 flex h-3.5 items-center focus:outline-none ${
        edge === 'top' ? '-top-2.5' : '-bottom-2.5'
      } ${blocked ? 'cursor-not-allowed' : 'cursor-copy'}`}
    >
      <span className={`h-0.5 w-full rounded-full ${reveal}`} style={{ backgroundColor: color }} />
      <span
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${reveal}`}
        style={{ backgroundColor: color }}
      >
        {blocked ? `Can't ${verb.toLowerCase()} here` : `${verb} here`}
      </span>
    </button>
  );
}

/**
 * @param {{ checked: boolean, label: string, onPick: (options: { range: boolean }) => void }} props
 */
export function SelectBox({ checked, label, onPick }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onPick({ range: Boolean(e.nativeEvent?.shiftKey) })}
      aria-label={label}
      title="Select to copy. Shift selects a range."
      className="h-3.5 w-3.5 shrink-0 cursor-pointer"
      style={{ accentColor: SELECTION_COLOR }}
    />
  );
}

/**
 * @param {(options: { range: boolean }) => void} onPick
 */
export function selectOnModifierClick(onPick) {
  return (e) => {
    if (e.button !== 0 || !(e.ctrlKey || e.metaKey || e.shiftKey)) return;
    if (e.target.closest?.('button:not([data-open]), select, input[type="checkbox"]')) return;
    if (e.shiftKey && !(e.ctrlKey || e.metaKey) && e.target === document.activeElement) return;

    e.preventDefault();
    e.stopPropagation();
    onPick({ range: e.shiftKey });
  };
}

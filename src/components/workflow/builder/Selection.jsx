'use client';

import { STATUS } from '@/theme/vizPalette';
import { SELECTION_COLOR } from './canvasStyles';
import { useListSorting } from './Sortable';

/**
 * A "Paste here" line in the gap between two cards, for while something is
 * copied.
 *
 * It sits OVER the gap rather than in it — absolutely placed on the edge of the
 * card it is attached to — so having something copied never moves a single card
 * on the canvas. Hovering the gap (or tabbing to it) draws the line; clicking
 * pastes exactly there, with nothing to tick first, and above the first card too.
 *
 * `edge` says which edge of its card it hangs off: the top, for "before this
 * one", or the bottom of the last card, for "after everything".
 *
 * A paste that could never be accepted here — a delay into a parallel branch —
 * draws the line in red and says why instead of pasting.
 *
 * `verb` is "Paste" for a copy and "Move" for a cut — the line says which is about
 * to happen.
 *
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
 * The tick box on a stage or step header, for copying.
 *
 * Always visible. A control revealed only on hover is one a mouse can miss
 * entirely — "Set as start" spent its whole life invisible that way.
 *
 * Shift-ticking selects everything between this box and the last one ticked in
 * the same list.
 *
 * @param {{ checked: boolean, label: string, onPick: (options: { range: boolean }) => void }} props
 */
export function SelectBox({ checked, label, onPick }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      // A checkbox's change event is fired by a click, so the click's own
      // modifier keys are on the native event.
      onChange={(e) => onPick({ range: Boolean(e.nativeEvent?.shiftKey) })}
      aria-label={label}
      title="Select to copy. Shift selects a range."
      className="h-3.5 w-3.5 shrink-0 cursor-pointer"
      style={{ accentColor: SELECTION_COLOR }}
    />
  );
}

/**
 * Ctrl+click (⌘ on a Mac) or Shift+click anywhere on a header selects it.
 *
 * Handled on mouse DOWN so it can be taken before the title input grabs focus —
 * most of a header is that input, and Ctrl+clicking a name should select the
 * card, not put a caret in it. Buttons and the tick box keep their own meaning
 * — except the header's title button (`data-open`), which is most of the
 * header — and Shift inside a title already being typed in still selects text.
 *
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

/**
 * How a card on the canvas answers the mouse and the keyboard:
 *
 *   click its header      opens it in the side panel
 *   right-click it        opens its menu
 *   Ctrl / Shift + click  selects it for copying (Selection.selectOnModifierClick)
 *
 * The header's title is a real button marked `data-open`, so Enter and Space
 * open it too, and the Menu key or Shift+F10 on it opens the menu.
 */

import { isTypingIn } from '@/components/workflow/builder/page/keyboard';

/**
 * A click on a card's header opens it — unless it landed on one of the
 * header's own controls (the tick box, the ⋯ button, the chevron), or carried
 * the keys that select instead.
 *
 * @param {(options: { focus: boolean }) => void} open  `focus` when the click came from the keyboard
 */
export function openOnHeaderClick(open) {
  return (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest?.('button:not([data-open]), input, select, textarea, a')) return;
    open({ focus: e.detail === 0 });
  };
}

/**
 * Right-click opens the card's own menu, and only the innermost card's — a step
 * inside a branch inside a stage opens the step's. In a text box the browser's
 * menu is left alone: that is where somebody wants Copy and Paste of text.
 *
 * From the keyboard (Menu key, Shift+F10) there is no pointer position, so the
 * menu opens at the focused element instead.
 *
 * @param {(from: {x: number, y: number}|Element) => void} openMenu
 */
export function menuOnRightClick(openMenu) {
  return (e) => {
    if (isTypingIn(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    openMenu(e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : e.target);
  };
}

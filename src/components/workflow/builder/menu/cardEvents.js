import { isTypingIn } from '@/components/workflow/builder/page/keyboard';

/**
 * @param {(options: { focus: boolean }) => void} open
 */
export function openOnHeaderClick(open) {
  return (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest?.('button:not([data-open]), input, select, textarea, a')) return;
    open({ focus: e.detail === 0 });
  };
}

/**
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

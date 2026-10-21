'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * The canvas's one context menu — whichever card was right-clicked, or had its
 * ⋯ pressed. One at a time, drawn once by the page (CardMenu).
 *
 * The items are built when it opens, by whoever opens it, so nothing is worked
 * out for the cards nobody right-clicks.
 */
export function useCardMenu() {
  const [menu, setMenu] = useState(null);
  // Each opening is a fresh menu, measured and focused anew — even on the same card.
  const seq = useRef(0);

  /**
   * @param {{x: number, y: number}|Element} from  where the pointer was, or the
   *   element it opens from (the ⋯ button, or the focused title)
   * @param {Array} items  see CardMenu
   * @param {string} label  what a screen reader announces
   */
  const open = useCallback((from, items, label) => {
    const returnFocus = typeof document === 'undefined' ? null : document.activeElement;
    seq.current += 1;
    const key = seq.current;

    if (typeof from?.getBoundingClientRect === 'function') {
      const rect = from.getBoundingClientRect();
      // Under the element, right edges lined up; above it if there is no room below.
      setMenu({ x: rect.right, y: rect.bottom + 4, alignRight: true, flipY: rect.top - 4, items, label, returnFocus: from, key });
      return;
    }
    setMenu({ x: from.x, y: from.y, alignRight: false, flipY: from.y, items, label, returnFocus, key });
  }, []);

  const close = useCallback(() => setMenu(null), []);

  return { menu, open, close };
}

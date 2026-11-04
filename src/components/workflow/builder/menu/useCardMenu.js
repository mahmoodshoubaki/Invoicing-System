'use client';

import { useCallback, useRef, useState } from 'react';

export function useCardMenu() {
  const [menu, setMenu] = useState(null);
  // Each opening is a fresh menu, measured and focused anew — even on the same card.
  const seq = useRef(0);

  /**
   * @param {{x: number, y: number}|Element} from
   * @param {Array} items
   * @param {string} label
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

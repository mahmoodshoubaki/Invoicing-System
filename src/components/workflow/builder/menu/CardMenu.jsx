'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CHROME, STATUS } from '@/theme/vizPalette';

const MARGIN = 8;

const enabledItems = (root) => [...(root?.querySelectorAll('[role="menuitem"]:not([disabled])') ?? [])];

/** One row of the menu. */
function MenuItem({ item, onPick }) {
  const Icon = item.icon;
  const tone = item.danger ? STATUS.critical : CHROME.textPrimary;

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={item.disabled}
      title={item.hint ?? undefined}
      onClick={() => onPick(item)}
      className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[#f6f5f3] focus:bg-[#f6f5f3] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      style={{ color: tone }}
    >
      {Icon ? (
        <Icon size={13} className="mt-px shrink-0" style={{ color: item.danger ? STATUS.critical : CHROME.textMuted }} aria-hidden="true" />
      ) : (
        <span className="w-[13px] shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.hint && (
          <span className="block text-[10px] leading-snug" style={{ color: CHROME.textMuted }}>{item.hint}</span>
        )}
      </span>
    </button>
  );
}

/**
 * The popup. Placed where it was asked for, then nudged back inside the window
 * — written straight onto the element once it can be measured, so it never
 * draws a frame in the wrong place.
 */
function MenuPopup({ menu, onClose }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    let left = menu.alignRight ? menu.x - width : menu.x;
    let top = menu.y;
    if (top + height > window.innerHeight - MARGIN) top = Math.max(MARGIN, menu.flipY - height);
    left = Math.min(Math.max(MARGIN, left), window.innerWidth - width - MARGIN);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = 'visible';
    enabledItems(el)[0]?.focus();
  }, [menu]);

  // It closes the moment anything else happens: a press outside it, a scroll, the window changing.
  useEffect(() => {
    const outside = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    const away = () => onClose();
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('scroll', outside, true);
    window.addEventListener('resize', away);
    window.addEventListener('blur', away);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      window.removeEventListener('scroll', outside, true);
      window.removeEventListener('resize', away);
      window.removeEventListener('blur', away);
    };
  }, [onClose]);

  const giveFocusBack = () => {
    const back = menu.returnFocus;
    if (back && back.isConnected && typeof back.focus === 'function') back.focus();
  };

  const pick = (item) => {
    onClose();
    // Back to where the menu came from first — an action that moves focus
    // somewhere of its own (opening the side panel) then wins.
    giveFocusBack();
    item.onSelect?.();
  };

  const onKeyDown = (e) => {
    const items = enabledItems(ref.current);
    const at = items.indexOf(document.activeElement);
    const go = (index) => {
      e.preventDefault();
      items[(index + items.length) % items.length]?.focus();
    };

    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Escape') {
      e.preventDefault();
      // Esc here closes the menu and nothing else — not the selection behind it.
      e.stopPropagation();
      onClose();
      giveFocusBack();
    } else if (e.key === 'Tab') {
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={menu.label}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-50 w-60 rounded-lg border border-[#e6e4dd] bg-white py-1 shadow-lg"
      style={{ left: menu.x, top: menu.y, visibility: 'hidden' }}
    >
      {menu.items.map((item, index) =>
        item.separator ? (
          // A separator first, last, or next to another draws nothing.
          index > 0 && index < menu.items.length - 1 && !menu.items[index - 1].separator ? (
            <div key={`sep-${index}`} role="separator" className="my-1 h-px bg-[#f1f0ee]" />
          ) : null
        ) : (
          <MenuItem key={item.key} item={item} onPick={pick} />
        )
      )}
    </div>
  );
}

/**
 * The menu a card opens on right-click or from its ⋯ (see useCardMenu).
 *
 * Arrow keys move through it, Enter picks, Esc closes it and puts focus back.
 *
 * Each item: `{ key, label, icon?, hint?, danger?, disabled?, onSelect }`, or
 * `{ separator: true }`.
 *
 * @param {{ menu: Object|null, onClose: () => void }} props
 */
export default function CardMenu({ menu, onClose }) {
  if (!menu) return null;
  return createPortal(<MenuPopup key={menu.key} menu={menu} onClose={onClose} />, document.body);
}

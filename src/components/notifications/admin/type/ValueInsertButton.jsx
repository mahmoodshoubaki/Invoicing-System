'use client';

import { useEffect, useRef, useState } from 'react';

import ValueMenu from '@/components/ui/richText/ValueMenu';

/**
 * The visual editor's Value menu, for a plain text box: inserts `{{ Name }}`
 * where the cursor is. The menu keeps the box focused while it is open (its
 * buttons take no focus), so the cursor is still there to insert at.
 *
 * @param {{
 *   names: string[],  what the words may use — the listed placeholders and the built-ins
 *   inputRef: React.RefObject<HTMLInputElement|HTMLTextAreaElement>,
 *   value: string, onChange: (value: string) => void,
 * }} props
 */
export default function ValueInsertButton({ names, inputRef, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (names.length === 0) return null;

  const insert = (name) => {
    const text = `{{ ${name} }}`;
    const el = inputRef.current;
    const start = typeof el?.selectionStart === 'number' ? el.selectionStart : value.length;
    const end = typeof el?.selectionEnd === 'number' ? el.selectionEnd : start;
    onChange(`${value.slice(0, start)}${text}${value.slice(end)}`);
    setOpen(false);

    // The cursor goes after what was inserted, so typing carries on from there.
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  };

  return (
    <span ref={rootRef}>
      <ValueMenu open={open} onToggle={() => setOpen((v) => !v)} names={names} onInsert={insert} align="right" />
    </span>
  );
}

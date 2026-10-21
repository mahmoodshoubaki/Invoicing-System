'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Braces } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';

/** Where a token comes from, in the order the menu lists them. */
const GROUPS = [
  ['record', 'This record'],
  ['item', 'The item this loop is on'],
  ['variable', 'Workflow variables'],
  ['outcome', 'Step answers'],
  // A notification's own values — WorkflowName, a task's TaskTitle, a failed
  // run's FailureReason — offered only where one is being typed for.
  ['notification', 'Sent with this notification'],
];

/**
 * Inserts a `{{token}}` into the field beside it.
 *
 * A step input, an http.call URL, a request body — all of them accept
 * placeholders the engine fills in at run time, and until now the only way to
 * learn what could go in one was to be told. The hint said
 * "{{variableName}} fills in a value the run holds", which names the syntax and
 * not one single thing you could actually write.
 *
 * So the names live in a menu instead of in somebody's memory. What it lists is
 * exactly what a condition at the same place could compare against — the same
 * catalog, so the two can never drift — plus secrets, which are resolvable in
 * an input and deliberately not readable in a condition.
 *
 * Insertion goes at the caret when there is one, because a URL is usually
 * built around a token rather than ended with it.
 */
function TokenPicker({ fields = [], inputRef, value = '', onInsert, allowSecrets = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onDocPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const insert = (token) => {
    const text = `{{${token}}}`;
    const el = inputRef?.current;

    // Without a live element to read a caret from, appending is the only honest
    // option — guessing a position would drop the token somewhere arbitrary.
    if (!el || typeof el.selectionStart !== 'number') {
      onInsert(`${value}${text}`);
      setOpen(false);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd ?? start;
    onInsert(`${value.slice(0, start)}${text}${value.slice(end)}`);
    setOpen(false);

    // Put the caret after what was just inserted, so typing continues where the
    // author was rather than at the end of the field.
    requestAnimationFrame(() => {
      el.focus();
      const at = start + text.length;
      el.setSelectionRange(at, at);
    });
  };

  const groups = GROUPS
    .map(([key, label]) => [label, fields.filter((f) => (f.source ?? 'record') === key)])
    .filter(([, list]) => list.length > 0);

  const nothingToOffer = groups.length === 0 && !allowSecrets;

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={nothingToOffer}
        aria-expanded={open}
        aria-haspopup="menu"
        title={nothingToOffer ? 'Nothing to insert yet' : 'Insert a value the run holds'}
        aria-label="Insert a value"
        className="rounded-md border border-gray-200 bg-white p-1.5 transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-30"
        style={{ color: CHROME.textMuted }}
      >
        <Braces size={13} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 max-h-72 w-64 overflow-y-auto rounded-lg border border-[#e6e4dd] bg-white py-1 shadow-lg"
        >
          {groups.map(([label, list]) => (
            <div key={label}>
              <p
                className="px-2.5 pb-0.5 pt-1.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: CHROME.textMuted }}
              >
                {label}
              </p>
              {list.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  role="menuitem"
                  onClick={() => insert(f.name)}
                  className="block w-full px-2.5 py-1 text-left transition-colors hover:bg-[#f1f0ee]"
                >
                  <span className="block truncate text-[11px]" style={{ color: CHROME.textPrimary }}>
                    {f.label ?? f.name}
                  </span>
                  <span className="block truncate font-mono text-[10px]" style={{ color: CHROME.textMuted }}>
                    {`{{${f.name}}}`}
                  </span>
                </button>
              ))}
            </div>
          ))}

          {allowSecrets && (
            <div className="mt-1 border-t border-[#f1f0ee] pt-1">
              <p
                className="px-2.5 pb-0.5 pt-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ color: CHROME.textMuted }}
              >
                Credentials
              </p>
              {/* A secret is not a value the builder can list — the names live
                  on the server and the values never reach the browser. So this
                  inserts the shape and leaves the name to be typed. */}
              <button
                type="button"
                role="menuitem"
                onClick={() => insert('secrets.NAME')}
                className="block w-full px-2.5 py-1 text-left transition-colors hover:bg-[#f1f0ee]"
              >
                <span className="block text-[11px]" style={{ color: CHROME.textPrimary }}>
                  A stored credential
                </span>
                <span className="block font-mono text-[10px]" style={{ color: CHROME.textMuted }}>
                  {'{{secrets.NAME}}'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(TokenPicker);

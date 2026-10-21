'use client';

/** The address bar under the toolbar, for a link, an image or a button. */

import { useEffect, useRef } from 'react';

import { controlClass } from '@/components/ui/kit';
import { IMAGE_SOURCE, LINK_TARGET } from '@/lib/richTextExtensions';
import { CHROME, STATUS } from '@/theme/vizPalette';

/** The address bar under the toolbar, for a link, an image or a button. */
export function AddressBar({ bar, setBar, onApply, onRemove }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, [bar.kind]);

  const pattern = bar.kind === 'image' ? IMAGE_SOURCE : LINK_TARGET;
  const valid = pattern.test(bar.url.trim()) && (bar.kind !== 'button' || bar.text.trim());
  const apply = () => { if (valid) onApply(); };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-[#f1f0ee] px-2 py-1.5">
      {bar.kind === 'button' && (
        <input
          value={bar.text}
          onChange={(e) => setBar({ ...bar, text: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } if (e.key === 'Escape') setBar(null); }}
          placeholder="Button text"
          aria-label="Button text"
          className={`${controlClass} w-36 py-1 text-xs`}
        />
      )}
      <input
        ref={inputRef}
        value={bar.url}
        onChange={(e) => setBar({ ...bar, url: e.target.value })}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } if (e.key === 'Escape') setBar(null); }}
        placeholder={bar.kind === 'image' ? 'https://… image address' : 'https://… or mailto:…'}
        aria-label={bar.kind === 'image' ? 'Image address' : 'Link address'}
        className={`${controlClass} min-w-0 flex-1 py-1 font-mono text-xs`}
        style={bar.url.trim() && !pattern.test(bar.url.trim()) ? { borderColor: STATUS.critical } : undefined}
      />
      {bar.kind !== 'image' && (
        <button
          type="button"
          onClick={() => setBar({ ...bar, url: '{{ ActionUrl }}' })}
          className="rounded-md px-1.5 py-1 text-[11px] hover:bg-[#f1f0ee]"
          style={{ color: STATUS.info }}
          title="The page this notification opens — filled in when it is sent"
        >
          The notification&rsquo;s link
        </button>
      )}
      <button type="button" onClick={apply} disabled={!valid} className="rounded-md bg-[#3c3c3a] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40">
        {bar.kind === 'link' && bar.editing ? 'Update' : 'Insert'}
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} className="rounded-md px-1.5 py-1 text-[11px] hover:bg-[#f1f0ee]" style={{ color: STATUS.critical }}>
          Remove link
        </button>
      )}
      <button type="button" onClick={() => setBar(null)} className="rounded-md px-1.5 py-1 text-[11px] hover:bg-[#f1f0ee]" style={{ color: CHROME.textMuted }}>
        Cancel
      </button>
    </div>
  );
}

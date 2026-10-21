'use client';

import { RotateCcw, Save, Search } from 'lucide-react';

import Button from '@/components/common/Button';
import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * Above the Workflow fields table: the search (by name or label, on the
 * server), how many fields match, how many are changed, and — for whoever may
 * change them — Undo and Save.
 *
 * @param {{
 *   total: number, changedCount: number, query: string, onQuery: (text: string) => void,
 *   canEdit: boolean, saving: boolean, canSave: boolean, onDiscard: () => void, onSave: () => void,
 * }} props
 */
export default function FieldSettingsBar({
  total, changedCount, query, onQuery, canEdit, saving, canSave, onDiscard, onSave,
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2" style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Name or label"
          aria-label="Search fields"
          className={`${controlClass} w-56 pl-6`}
        />
      </div>
      <p className="text-xs" style={{ color: CHROME.textMuted }}>
        {total} field{total === 1 ? '' : 's'}
        {changedCount > 0 && <span style={{ color: STATUS.info }}> · {changedCount} changed</span>}
      </p>
      {canEdit && (
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onDiscard} disabled={!changedCount || saving}>
            Undo changes
          </Button>
          <Button size="sm" icon={Save} onClick={onSave} loading={saving} disabled={!canSave}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

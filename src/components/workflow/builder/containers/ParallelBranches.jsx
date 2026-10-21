'use client';

/**
 * A parallel step on the canvas: its branches, each a list of steps. Naming,
 * adding, removing and reordering branches happens here, because the branches
 * ARE the shape of the flow. When it stops early is in the side panel
 * (ParallelEditor).
 */

import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import SortableList, { SortableItem } from '@/components/workflow/builder/Sortable';
import StepList from '@/components/workflow/builder/StepList';
import { BUILDER_LIMITS } from '@/constants/workflow';
import { CHROME } from '@/theme/vizPalette';
import { uniqueSlug } from '@/utils/slug';

import { nested } from './shared';

export const ParallelBranches = memo(function ParallelBranches(props) {
  const { step, onChange } = props;
  const branches = step.branches ?? [];

  const patchBranch = (branchIndex, patch) =>
    onChange({ branches: branches.map((b, i) => (i === branchIndex ? { ...b, ...patch } : b)) });

  const addBranch = () => {
    const id = uniqueSlug(`branch ${branches.length + 1}`, branches.map((b) => b.id), 'branch');
    onChange({ branches: [...branches, { id, title: `Branch ${branches.length + 1}`, steps: [] }] });
  };

  return (
    <div className="flex flex-col gap-2">
      <SortableList
        ids={branches.map((b) => b.id)}
        onReorder={(from, to) => {
          const next = [...branches];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          onChange({ branches: next });
        }}
      >
      <div className="flex flex-col gap-2">
        {branches.map((branch, branchIndex) => (
          <SortableItem key={branch.id} id={branch.id}>
          <div className="rounded-lg border border-[#f1f0ee] p-2.5">
            <div className="mb-2 flex items-center gap-1.5">
              <input
                value={branch.title ?? ''}
                onChange={(e) => {
                  // The id follows the title and is never shown — it only has to be
                  // unique within this step, and appears in a run's branch map.
                  const title = e.target.value;
                  const taken = branches.filter((_, i) => i !== branchIndex).map((b) => b.id);
                  patchBranch(branchIndex, { title, id: uniqueSlug(title, taken, `branch-${branchIndex + 1}`) });
                }}
                placeholder="Branch name"
                aria-label="Branch name"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-semibold outline-none"
                style={{ color: CHROME.textPrimary }}
              />
              <button
                type="button"
                onClick={() => onChange({ branches: branches.filter((_, i) => i !== branchIndex) })}
                disabled={branches.length <= BUILDER_LIMITS.MIN_PARALLEL_BRANCHES}
                title={
                  branches.length <= BUILDER_LIMITS.MIN_PARALLEL_BRANCHES
                    ? 'A parallel step needs at least two branches'
                    : 'Remove branch'
                }
                aria-label="Remove branch"
                className="shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee] disabled:cursor-not-allowed disabled:opacity-30"
                style={{ color: CHROME.textMuted }}
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </div>

            <StepList
              {...nested(props, 'branches', { branchIndex })}
              steps={branch.steps ?? []}
              label="Steps"
              emptyText="Empty — a branch needs at least one step."
              // Everything below here is inside a branch, however deep.
              insideParallelBranch
            />
          </div>
          </SortableItem>
        ))}
      </div>
      </SortableList>

      <button
        type="button"
        onClick={addBranch}
        className="inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f1f0ee]"
        style={{ color: CHROME.textSecondary }}
      >
        <Plus size={11} aria-hidden="true" />
        Add branch
      </button>
    </div>
  );
});

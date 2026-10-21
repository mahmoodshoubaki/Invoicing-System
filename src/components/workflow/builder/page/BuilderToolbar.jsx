'use client';

import { ClipboardPaste, Copy, Redo2, Scissors, Undo2, X } from 'lucide-react';

import Button from '@/components/common/Button';
import { SELECTION_COLOR } from '@/components/workflow/builder/canvasStyles';
import { CHROME } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { CLIP_KIND, describeClip } from '@/lib/workflowClipboard';

/**
 * Undo / redo, and copy / cut / paste.
 *
 * Discoverability: the shortcuts are the real controls, but a keyboard-only
 * affordance is one nobody finds. Disabled states double as a readout of
 * whether there is anything to go back to.
 *
 * @param {{
 *   canUndo: boolean, canRedo: boolean, onUndo: () => void, onRedo: () => void,
 *   clip: ReturnType<import('./useBuilderClipboard').useBuilderClipboard>,
 * }} props
 */
export default function BuilderToolbar({ canUndo, canRedo, onUndo, onRedo, clip }) {
  const { selection, clipboard, isCut, clipLabel, clipVerb, pasteTarget } = clip;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1">
      <Button variant="ghost" size="sm" icon={Undo2} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        Undo
      </Button>
      <Button variant="ghost" size="sm" icon={Redo2} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        Redo
      </Button>

      <span className="mx-1 h-4 w-px bg-[#e6e4dd]" aria-hidden="true" />

      {/* Copy, cut and paste. With nothing ticked, a line saying how — the
          tick boxes are visible, Ctrl+click is not. */}
      {selection.ids.length > 0 ? (
        <>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: withAlpha(SELECTION_COLOR, 0.1), color: SELECTION_COLOR }}
          >
            {describeClip(selection.kind, selection.ids.length)} selected
          </span>
          <Button variant="ghost" size="sm" icon={Copy} onClick={clip.handleCopy} title="Copy (Ctrl+C)">
            Copy
          </Button>
          <Button variant="ghost" size="sm" icon={Scissors} onClick={clip.handleCut} title="Cut, to move somewhere else (Ctrl+X)">
            Cut
          </Button>
          <Button variant="ghost" size="sm" icon={X} onClick={clip.clearSelection} title="Clear the selection (Esc)">
            Clear
          </Button>
        </>
      ) : !clipboard ? (
        <span className="px-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          Click a stage or step to edit it; right-click it for more. Tick several, or Ctrl+click them, to copy or move them together.
        </span>
      ) : null}

      {/* The button names where the paste will land before anything happens —
          the ticked item is the cursor, and this is how to see it. */}
      {clipboard && (
        <>
          <Button
            variant="ghost"
            size="sm"
            icon={isCut ? Scissors : ClipboardPaste}
            onClick={clip.handlePaste}
            disabled={clipboard.kind === CLIP_KIND.STEP && !pasteTarget}
            title={pasteTarget ? 'Ctrl+V' : undefined}
            className="max-w-full"
          >
            <span className="truncate">
              {clipVerb} {clipLabel}
              {pasteTarget ? ` ${pasteTarget.where}` : ''}
            </span>
          </Button>
          {/* A cut leaves the originals faded on the canvas; this is the way
              back out without moving anything. */}
          {isCut && (
            <Button variant="ghost" size="sm" icon={X} onClick={clip.cancelCut} title="Leave them where they are (Esc)">
              Cancel move
            </Button>
          )}
          {!pasteTarget && (
            <span className="px-1 text-[11px]" style={{ color: CHROME.textMuted }}>
              Tick the step it goes under, or hover between steps and click {clipVerb} here.
            </span>
          )}
        </>
      )}
    </div>
  );
}

import {
  ArrowDown, ArrowUp, BellRing, ClipboardPaste, Copy, CopyPlus, Flag, ListPlus, Scissors,
  SlidersHorizontal, TextCursorInput, Trash2, Users, Variable,
} from 'lucide-react';

const SEPARATOR = { separator: true };

const TAB_ICONS = { fields: TextCursorInput, notifications: BellRing, recipients: Users, variables: Variable };

function editingItems(noun, facts, run) {
  const many = facts.copyCount > 1 ? ` ${facts.copyCount} ${noun}s` : '';
  const paste = facts.paste;

  return [
    { key: 'duplicate', label: 'Duplicate', icon: CopyPlus, hint: `A copy right below this ${noun}`, onSelect: run.duplicate },
    { key: 'copy', label: `Copy${many}`, icon: Copy, onSelect: run.copy },
    { key: 'cut', label: `Cut${many}`, icon: Scissors, hint: 'To move somewhere else', onSelect: run.cut },
    ...(paste
      ? [{
          key: 'paste',
          label: `${paste.verb} ${paste.label} below`,
          icon: paste.verb === 'Move' ? Scissors : ClipboardPaste,
          disabled: Boolean(paste.blocked),
          hint: paste.blocked ? `Can't ${paste.verb.toLowerCase()} here: ${paste.blocked}` : undefined,
          onSelect: run.paste,
        }]
      : []),
    SEPARATOR,
    { key: 'up', label: 'Move up', icon: ArrowUp, disabled: facts.index <= 0, onSelect: () => run.move(-1) },
    { key: 'down', label: 'Move down', icon: ArrowDown, disabled: facts.index >= facts.total - 1, onSelect: () => run.move(1) },
    SEPARATOR,
    {
      key: 'delete',
      label: `Delete ${noun}`,
      icon: Trash2,
      danger: true,
      disabled: facts.canDelete === false,
      hint: facts.canDelete === false ? facts.cannotDelete : undefined,
      onSelect: run.remove,
    },
  ];
}

/**
 * @param {{ tabs: Array<{key: string, label: string}>, index: number, total: number, copyCount: number, paste: null | { verb: string, label: string, blocked: string|null }, }} facts
 * @param {{ open(tab), duplicate(), copy(), cut(), paste(), move(delta), remove() }} run
 */
export function stepMenuItems(facts, run) {
  return [
    ...facts.tabs.map((tab, i) => ({
      key: `tab-${tab.key}`,
      label: i === 0 ? 'Properties…' : `${tab.label}…`,
      icon: i === 0 ? SlidersHorizontal : TAB_ICONS[tab.key] ?? SlidersHorizontal,
      onSelect: () => run.open(tab.key),
    })),
    SEPARATOR,
    ...editingItems('step', facts, run),
  ];
}

/**
 * @param {{ index: number, total: number, isStart: boolean, copyCount: number, paste: null | { verb: string, label: string, blocked: null }, pasteSteps: null | { verb: string, label: string, blocked: string|null }, }} facts
 * @param {{ open(), setStart(), duplicate(), copy(), cut(), paste(), pasteSteps(), move(delta), remove() }} run
 */
export function stageMenuItems(facts, run) {
  const steps = facts.pasteSteps;
  return [
    { key: 'properties', label: 'Properties…', icon: SlidersHorizontal, hint: 'Name, deadline, where it goes next', onSelect: run.open },
    ...(facts.isStart
      ? []
      : [{ key: 'start', label: 'Make it the start', icon: Flag, hint: 'Every run begins here', onSelect: run.setStart }]),
    ...(steps
      ? [{
          key: 'paste-steps',
          label: `${steps.verb} ${steps.label} into this stage`,
          icon: ListPlus,
          disabled: Boolean(steps.blocked),
          hint: steps.blocked ? `Can't ${steps.verb.toLowerCase()} here: ${steps.blocked}` : 'At the end of its steps',
          onSelect: run.pasteSteps,
        }]
      : []),
    SEPARATOR,
    ...editingItems('stage', { ...facts, canDelete: facts.total > 1, cannotDelete: 'A workflow needs at least one stage' }, run),
  ];
}

export function workflowMenuItems(run) {
  return [
    { key: 'settings', label: 'Settings…', icon: SlidersHorizontal, hint: 'Name, what it tracks, what starts it', onSelect: () => run.open('settings') },
    { key: 'notifications', label: 'Notifications…', icon: BellRing, hint: 'When a run fails, pauses or resumes', onSelect: () => run.open('notifications') },
    { key: 'variables', label: 'Variables…', icon: Variable, onSelect: () => run.open('variables') },
  ];
}

'use client';

import { createContext, memo, useContext, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { CHROME } from '@/theme/vizPalette';

/**
 * Whether the NEAREST sortable list is mid-drag, and whether it draws a preview.
 *
 * Nearest matters: lists nest (a stage's steps sit inside the stage list), and a
 * step card must collapse when its own list is dragged, not when the stages
 * around it are.
 */
const SortingContext = createContext({ sorting: false, hasOverlay: false });

/**
 * True while an item in the enclosing list is being dragged.
 *
 * A row reads this to render itself collapsed — header only — for the length of
 * the drag. Rows with their editors open are all different heights, and dragging
 * a tall stage across them made the list jump by hundreds of pixels at a time.
 * Collapsed, every row is one header tall and the order is what is left to see.
 */
export function useListSorting() {
  return useContext(SortingContext).sorting;
}

/**
 * What follows the pointer during a drag: one compact card, the same height
 * whatever the row it stands for looked like.
 *
 * @param {{ accent?: string, title: string, meta?: string }} props
 */
export function DragPreview({ accent = CHROME.textMuted, title, meta }) {
  return (
    <div
      className="flex cursor-grabbing items-center gap-2 rounded-xl border bg-white px-3 py-2.5"
      style={{ borderColor: '#e6e4dd', boxShadow: '0 12px 28px rgba(16,15,14,0.18)' }}
    >
      <GripVertical size={13} style={{ color: CHROME.textMuted }} aria-hidden="true" />
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden="true" />
      <span className="min-w-0 truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
        {title}
      </span>
      {meta && (
        <span className="ml-auto shrink-0 text-[11px]" style={{ color: CHROME.textMuted }}>{meta}</span>
      )}
    </div>
  );
}

/*
 * Rects re-measured throughout the drag. Rows collapse the moment a drag starts,
 * so positions measured at the start are wrong a frame later; without this the
 * drop targets would still be where the expanded rows used to be.
 */
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };

/**
 * Drag-to-reorder for one list.
 *
 * Deliberately **one context per list** rather than one for the whole builder.
 * Steps nest arbitrarily — a branch inside a parallel branch inside a stage —
 * and a single context spanning all of them would need every list to agree on a
 * flat id space and handle cross-container moves. Reordering within a list is
 * what "change the order" asks for, and it works identically at every depth
 * with no special cases.
 *
 * **Pass `renderOverlay` and the list collapses while dragging.** The dragged row
 * is then drawn as a floating preview that stays under the pointer. That part is
 * not optional once rows collapse: when the rows ABOVE the dragged one shrink,
 * the dragged row itself moves up the page, and without an overlay it would
 * slide out from under the cursor by however much height they lost. A list with
 * no `renderOverlay` drags exactly as it always did.
 *
 * Keyboard works too: tab to a handle, space to lift, arrows to move, space to
 * drop. Reordering that only works with a mouse is reordering half the people
 * cannot do.
 *
 * @param {{
 *   ids: string[],
 *   onReorder: (from: number, to: number) => void,
 *   renderOverlay?: (id: string) => React.ReactNode,
 * }} props
 */
function SortableList({ ids, onReorder, renderOverlay, children }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    // A small distance before a drag starts, so clicking a control inside a row
    // is not swallowed as the beginning of a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const modifiers = useMemo(() => [restrictToVerticalAxis, restrictToParentElement], []);

  const hasOverlay = typeof renderOverlay === 'function';
  const context = useMemo(
    () => ({ sorting: hasOverlay && activeId !== null, hasOverlay }),
    [activeId, hasOverlay]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={modifiers}
      measuring={hasOverlay ? MEASURING : undefined}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={({ active, over }) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const from = ids.indexOf(active.id);
        const to = ids.indexOf(over.id);
        if (from !== -1 && to !== -1) onReorder(from, to);
      }}
    >
      <SortingContext.Provider value={context}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </SortingContext.Provider>

      {hasOverlay && (
        // No drop animation: the preview is a different shape from the row it
        // lands as, so animating one into the other only draws attention to it.
        <DragOverlay dropAnimation={null}>
          {activeId !== null ? renderOverlay(activeId) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
}

/**
 * One draggable row. Renders `children` with a grip that appears on hover.
 *
 * The handle is a handle, not the whole row: these rows are full of inputs,
 * selects and buttons, and making the body draggable would fight every one of
 * them.
 *
 * The grip sits level with the row's HEADER, not its vertical middle. On a tall
 * expanded stage the middle is hundreds of pixels below the title, and a grab
 * there lands nowhere near the header the row collapses to.
 */
export const SortableItem = memo(function SortableItem({ id, children, className = '' }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { hasOverlay } = useContext(SortingContext);

  // With a preview following the pointer, the row left in the list is only a
  // placeholder showing where it will land — so it is faded, not lifted.
  const draggingStyle = hasOverlay
    ? { opacity: 0.35 }
    : {
        zIndex: 20,
        opacity: 0.85,
        boxShadow: '0 8px 24px rgba(16,15,14,0.16)',
        borderRadius: 12,
      };

  return (
    <div
      ref={setNodeRef}
      className={`group/sortable relative ${className}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...(isDragging ? draggingStyle : null),
      }}
    >
      <button
        type="button"
        aria-label="Reorder"
        className="absolute -left-5 top-3 hidden cursor-grab touch-none rounded p-0.5 opacity-0 transition-opacity focus:opacity-100 group-hover/sortable:opacity-100 active:cursor-grabbing sm:block"
        style={{ color: CHROME.textMuted }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={13} aria-hidden="true" />
      </button>
      {children}
    </div>
  );
});

export default memo(SortableList);

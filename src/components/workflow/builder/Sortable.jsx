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

const SortingContext = createContext({ sorting: false, hasOverlay: false });

export function useListSorting() {
  return useContext(SortingContext).sorting;
}

/**
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

const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } };

/**
 * @param {{ ids: string[], onReorder: (from: number, to: number) => void, renderOverlay?: (id: string) => React.ReactNode, }} props
 */
function SortableList({ ids, onReorder, renderOverlay, children }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
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
        <DragOverlay dropAnimation={null}>
          {activeId !== null ? renderOverlay(activeId) : null}
        </DragOverlay>
      )}
    </DndContext>
  );
}

export const SortableItem = memo(function SortableItem({ id, children, className = '' }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { hasOverlay } = useContext(SortingContext);

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

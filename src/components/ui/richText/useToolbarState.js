'use client';

import { useEditorState } from '@tiptap/react';

/**
 * What the toolbar shows as on, off or unavailable, read from the editor —
 * re-read on every change of selection or content, so a button reflects where
 * the cursor is. Null until the editor exists.
 */
export function useToolbarState(editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      const style = e.getAttributes('textStyle');
      return {
        bold: e.isActive('bold'),
        italic: e.isActive('italic'),
        underline: e.isActive('underline'),
        strike: e.isActive('strike'),
        bulletList: e.isActive('bulletList'),
        orderedList: e.isActive('orderedList'),
        blockquote: e.isActive('blockquote'),
        link: e.isActive('link'),
        href: e.getAttributes('link').href ?? '',
        block: [1, 2, 3].find((level) => e.isActive('heading', { level })) ?? 0,
        align: ['center', 'right', 'justify'].find((a) => e.isActive({ textAlign: a })) ?? 'left',
        color: style.color ?? null,
        background: style.backgroundColor ?? null,
        fontSize: style.fontSize ?? '',
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        inTable: e.isActive('table'),
        canMerge: e.can().mergeCells(),
        canSplit: e.can().splitCell(),
      };
    },
  });
}

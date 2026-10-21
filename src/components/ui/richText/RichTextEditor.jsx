'use client';

/** The visual editor for an HTML body. */

import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';

import { fromEditorHtml, toEditorHtml } from '@/lib/richText';
import { RICH_TEXT_EXTENSIONS } from '@/lib/richTextExtensions';
import { STATUS } from '@/theme/vizPalette';

import { Toolbar } from './Toolbar';

/**
 * A visual editor for an HTML body — formatting, colours, alignment, lists,
 * links, buttons and images — that reads and writes the same HTML string a
 * code field would. Content is held in the editor's own document model, so a
 * stored body is parsed into it (scripts, handlers and unknown markup never
 * reach the page) rather than injected as HTML.
 *
 * @param {{
 *   value: string, onChange: (html: string) => void,
 *   dir?: 'ltr'|'rtl', readOnly?: boolean, invalid?: boolean,
 *   valueNames?: string[],  offered by the "Value" menu
 *   ariaLabel?: string,
 * }} props
 */
export default function RichTextEditor({ value, onChange, dir = 'ltr', readOnly = false, invalid = false, valueNames = [], ariaLabel }) {
  const lastEmitted = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: RICH_TEXT_EXTENSIONS,
    content: toEditorHtml(value),
    editorProps: {
      attributes: { class: 'rt-content', dir, role: 'textbox', 'aria-multiline': 'true', 'aria-label': ariaLabel ?? 'Message' },
    },
    onUpdate: ({ editor: e }) => {
      const html = fromEditorHtml(e.getHTML());
      lastEmitted.current = html;
      onChangeRef.current(html);
    },
  });

  // A value set from outside (another version picked, changes discarded) replaces the content.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => { editor?.setEditable(!readOnly); }, [editor, readOnly]);

  return (
    <div
      className="rt-editor rounded-lg border bg-white transition-shadow focus-within:shadow-[0_0_0_3px_rgb(248_72_94/0.15)]"
      style={{ borderColor: invalid ? STATUS.critical : '#e1e0d9' }}
    >
      {editor && !readOnly && <Toolbar editor={editor} valueNames={valueNames} />}
      <EditorContent editor={editor} />
    </div>
  );
}

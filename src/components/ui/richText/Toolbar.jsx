'use client';

/**
 * The rich text editor's toolbar: text style and size, formatting, colours,
 * alignment, lists, links, buttons, images, tables and values — plus, while
 * the cursor is in a table, its own row of table actions.
 */

import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  RectangleHorizontal,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react';

import { BUTTON_STYLE } from '@/lib/richTextExtensions';
import { CHROME } from '@/theme/vizPalette';

import { AddressBar } from './AddressBar';
import { FILL_COLORS, SIZES, TEXT_COLORS } from './palettes';
import { Swatches } from './Swatches';
import { TablePicker } from './TablePicker';
import TableBar from './TableBar';
import { Divider, ToolButton } from './toolbarParts';
import { useToolbarState } from './useToolbarState';
import ValueMenu from './ValueMenu';

export function Toolbar({ editor, valueNames }) {
  const [menu, setMenu] = useState(null);
  const [bar, setBar] = useState(null);
  const toolbarRef = useRef(null);

  const s = useToolbarState(editor);

  // A menu closes on any click outside the toolbar.
  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (!toolbarRef.current?.contains(e.target)) setMenu(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  if (!s) return null;
  const chain = () => editor.chain().focus();
  const toggleMenu = (name) => setMenu((m) => (m === name ? null : name));

  const applyBar = () => {
    const url = bar.url.trim();
    if (bar.kind === 'image') {
      chain().setImage({ src: url }).run();
    } else if (bar.kind === 'button') {
      chain().insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: bar.text.trim(), marks: [{ type: 'link', attrs: { href: url, style: BUTTON_STYLE } }, { type: 'bold' }] }],
      }).run();
    } else if (editor.state.selection.empty && !s.link) {
      // Nothing selected: the address itself becomes the link's text.
      chain().insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }).run();
    } else {
      chain().extendMarkRange('link').setLink({ href: url }).run();
    }
    setBar(null);
  };

  return (
    <div ref={toolbarRef} className="rt-toolbar sticky top-0 z-10 rounded-t-lg border-b border-[#eceae4] bg-[#fbfaf9]">
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1">
        <ToolButton icon={Undo2} label="Undo" disabled={!s.canUndo} onClick={() => chain().undo().run()} />
        <ToolButton icon={Redo2} label="Redo" disabled={!s.canRedo} onClick={() => chain().redo().run()} />
        <Divider />

        <select
          value={s.block}
          onChange={(e) => {
            const level = Number(e.target.value);
            if (level) chain().setHeading({ level }).run(); else chain().setParagraph().run();
          }}
          aria-label="Text style"
          className="h-7 rounded-md border-0 bg-transparent px-1.5 text-xs hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textSecondary }}
        >
          <option value={0}>Normal text</option>
          <option value={1}>Heading 1</option>
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
        </select>
        <select
          value={s.fontSize}
          onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}
          aria-label="Text size"
          className="h-7 rounded-md border-0 bg-transparent px-1.5 text-xs hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textSecondary }}
        >
          {SIZES.map((size) => <option key={size.label} value={size.value}>{size.label}</option>)}
        </select>
        <Divider />

        <ToolButton icon={Bold} label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()} />
        <ToolButton icon={Italic} label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()} />
        <ToolButton icon={Underline} label="Underline" active={s.underline} onClick={() => chain().toggleUnderline().run()} />
        <ToolButton icon={Strikethrough} label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()} />

        <span className="relative">
          <ToolButton icon={Baseline} label="Text colour" active={menu === 'color'} onClick={() => toggleMenu('color')} />
          <span className="pointer-events-none absolute bottom-1 left-1.5 right-1.5 h-0.5 rounded" style={{ backgroundColor: s.color ?? CHROME.textPrimary }} />
          {menu === 'color' && (
            <Swatches
              colors={TEXT_COLORS}
              current={s.color}
              clearLabel="Default colour"
              onPick={(c, custom) => {
                // The custom picker must not pull focus back into the editor, or it closes.
                if (custom) { editor.chain().setColor(c).run(); return; }
                chain().setColor(c).run();
                setMenu(null);
              }}
              onClear={() => { chain().unsetColor().run(); setMenu(null); }}
            />
          )}
        </span>
        <span className="relative">
          <ToolButton icon={Highlighter} label="Highlight" active={menu === 'fill'} onClick={() => toggleMenu('fill')} />
          {menu === 'fill' && (
            <Swatches
              colors={FILL_COLORS}
              current={s.background}
              clearLabel="No highlight"
              onPick={(c, custom) => {
                if (custom) { editor.chain().setBackgroundColor(c).run(); return; }
                chain().setBackgroundColor(c).run();
                setMenu(null);
              }}
              onClear={() => { chain().unsetBackgroundColor().run(); setMenu(null); }}
            />
          )}
        </span>
        <Divider />

        <ToolButton icon={AlignLeft} label="Align left" active={s.align === 'left'} onClick={() => chain().unsetTextAlign().run()} />
        <ToolButton icon={AlignCenter} label="Centre" active={s.align === 'center'} onClick={() => chain().setTextAlign('center').run()} />
        <ToolButton icon={AlignRight} label="Align right" active={s.align === 'right'} onClick={() => chain().setTextAlign('right').run()} />
        <ToolButton icon={AlignJustify} label="Justify" active={s.align === 'justify'} onClick={() => chain().setTextAlign('justify').run()} />
        <Divider />

        <ToolButton icon={List} label="Bulleted list" active={s.bulletList} onClick={() => chain().toggleBulletList().run()} />
        <ToolButton icon={ListOrdered} label="Numbered list" active={s.orderedList} onClick={() => chain().toggleOrderedList().run()} />
        <ToolButton icon={Quote} label="Quote" active={s.blockquote} onClick={() => chain().toggleBlockquote().run()} />
        <ToolButton icon={Minus} label="Divider line" onClick={() => chain().setHorizontalRule().run()} />
        <Divider />

        <ToolButton
          icon={Link2}
          label={s.link ? 'Edit link' : 'Link'}
          active={s.link || bar?.kind === 'link'}
          onClick={() => setBar({ kind: 'link', url: s.href, text: '', editing: s.link })}
        />
        {s.link && <ToolButton icon={Unlink} label="Remove link" onClick={() => chain().extendMarkRange('link').unsetLink().run()} />}
        <ToolButton icon={RectangleHorizontal} label="Button" active={bar?.kind === 'button'} onClick={() => setBar({ kind: 'button', url: '{{ ActionUrl }}', text: 'Open', editing: false })} />
        <ToolButton icon={ImagePlus} label="Image (from a web address)" active={bar?.kind === 'image'} onClick={() => setBar({ kind: 'image', url: '', text: '', editing: false })} />
        <span className="relative">
          <ToolButton icon={Table} label="Table" active={menu === 'table'} onClick={() => toggleMenu('table')} />
          {menu === 'table' && (
            <TablePicker
              onPick={(rows, cols, withHeaderRow) => {
                chain().insertTable({ rows, cols, withHeaderRow }).run();
                setMenu(null);
              }}
            />
          )}
        </span>

        <ValueMenu
          open={menu === 'values'}
          onToggle={() => toggleMenu('values')}
          names={valueNames}
          onInsert={(name) => { chain().insertContent(`{{ ${name} }}`).run(); setMenu(null); }}
        />

        <span className="ml-auto" />
        <ToolButton icon={RemoveFormatting} label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()} />
      </div>

      {/* While the cursor is in a table: its rows, columns and cells. */}
      {s.inTable && <TableBar chain={chain} canMerge={s.canMerge} canSplit={s.canSplit} />}

      {bar && (
        <AddressBar
          bar={bar}
          setBar={setBar}
          onApply={applyBar}
          onRemove={bar.kind === 'link' && bar.editing ? () => { chain().extendMarkRange('link').unsetLink().run(); setBar(null); } : null}
        />
      )}
    </div>
  );
}

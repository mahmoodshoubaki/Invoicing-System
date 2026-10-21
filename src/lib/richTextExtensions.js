import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { BackgroundColor, Color, FontSize, TextStyle } from '@tiptap/extension-text-style';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';

import { CELL_STYLE, HEADER_CELL_STYLE, TABLE_STYLE } from '@/lib/richText';

/**
 * What the template body editor can do — kept apart from the component so the
 * same set parses and writes HTML in tests exactly as it does on screen.
 */

/**
 * A button for emails: a styled link. The backend recognises this shape —
 * a link drawn with `display:inline-block` — and points one that has no
 * address at the notification's own link.
 *
 * No font-weight here: the editor would read that as bold and add a tag on the
 * next load. The button's text is made bold instead.
 */
export const BUTTON_STYLE = 'display:inline-block;padding:10px 20px;background-color:#f8485e;color:#ffffff;border-radius:8px;text-decoration:none';

/** Addresses a link or button may point at: web, mail, or a value such as {{ ActionUrl }}. */
export const LINK_TARGET = /^(https?:\/\/\S+|mailto:\S+|\{\{[^{}]+\}\})$/i;
/** An image comes from a web address (emails cannot carry uploads here). */
export const IMAGE_SOURCE = /^(https?:\/\/\S+|\{\{[^{}]+\}\})$/i;

/** `{{ … }}` shown as a value chip while editing (display only — the saved text is unchanged). */
const ValueChips = Extension.create({
  name: 'valueChips',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const found = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText) return;
              for (const m of node.text.matchAll(/\{\{[^{}]*\}\}/g)) {
                found.push(Decoration.inline(pos + m.index, pos + m.index + m[0].length, { class: 'rt-value' }));
              }
            });
            return DecorationSet.create(state.doc, found);
          },
        },
      }),
    ];
  },
});

/** A link that keeps its own style — that is what a button is. */
const EmailLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute('style'),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

/**
 * A column width dragged in the editor is kept as `colwidth` (what the editor
 * reads back) and also written as `width` — the one width every mail client,
 * Outlook included, respects on a cell.
 */
const withEmailWidth = (Cell) => Cell.extend({
  addAttributes() {
    const parent = this.parent?.() ?? {};
    return {
      ...parent,
      colwidth: {
        ...parent.colwidth,
        renderHTML: (attrs) => {
          const widths = Array.isArray(attrs.colwidth) ? attrs.colwidth.filter((w) => w > 0) : [];
          if (widths.length === 0) return {};
          return { colwidth: attrs.colwidth.join(','), width: String(widths.reduce((sum, w) => sum + w, 0)) };
        },
      },
    };
  },
});

export const RICH_TEXT_EXTENSIONS = [
  StarterKit.configure({ link: false, code: false, codeBlock: false }),
  // Not autolink: an autolinked mark grows as you type after it, which a button must not.
  // No target/rel added to every link: mail clients open links in a new window
  // anyway, and the 40 characters each would come out of the 2,000 allowed.
  EmailLink.configure({
    openOnClick: false,
    autolink: false,
    linkOnPaste: true,
    HTMLAttributes: { target: null, rel: null, class: null },
  }),
  Image.configure({
    inline: false,
    allowBase64: false,
    resize: {
      enabled: true,
      directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      minWidth: 40,
      minHeight: 20,
      alwaysPreserveAspectRatio: true,
    },
  }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Table.configure({ resizable: true, cellMinWidth: 40, HTMLAttributes: { style: TABLE_STYLE } }),
  TableRow,
  withEmailWidth(TableHeader).configure({ HTMLAttributes: { style: HEADER_CELL_STYLE } }),
  withEmailWidth(TableCell).configure({ HTMLAttributes: { style: CELL_STYLE } }),
  TextStyle,
  Color,
  BackgroundColor,
  FontSize,
  ValueChips,
];

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

export const BUTTON_STYLE = 'display:inline-block;padding:10px 20px;background-color:#f8485e;color:#ffffff;border-radius:8px;text-decoration:none';

export const LINK_TARGET = /^(https?:\/\/\S+|mailto:\S+|\{\{[^{}]+\}\})$/i;
export const IMAGE_SOURCE = /^(https?:\/\/\S+|\{\{[^{}]+\}\})$/i;

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

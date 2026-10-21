/**
 * Between a template body as the server stores it — an HTML string with
 * Scriban `{{ … }}` inside — and the visual editor.
 *
 * The editor works on a document model, not on the HTML text, so two things
 * need care on the way back out:
 *   - A value is plain text to the editor, so `{{ if a > b }}` comes back as
 *     `{{ if a &gt; b }}`, and a bolded half of `{{ Name }}` comes back with a
 *     tag inside the braces. Scriban would refuse both. They are put right.
 *   - An empty editor is `<p></p>`, which is not "no text" to the server.
 * And on the way in, HTML the editor cannot hold (tables, layout blocks,
 * classes, most inline styles) would be dropped at the first keystroke — so
 * that is detected first, and such a body opens in the HTML view instead.
 */

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** Tags that end a line or a block — a `{{ … }}` spanning one is not a value, so it is left alone. */
const BLOCK_TAG = /<\/?(p|h[1-6]|li|ul|ol|blockquote|div|hr|img|br|table|tr|td|th)\b/i;

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * A stored body made ready for the editor. Plain text (a body written before
 * HTML was ticked) keeps its lines as paragraphs.
 * @param {string} value
 * @returns {string}
 */
export function toEditorHtml(value) {
  const text = String(value ?? '');
  if (!text.trim()) return '';
  if (/<[a-zA-Z!/][^>]*>/.test(text)) return text;
  return text.split(/\r?\n/).map((line) => `<p>${escapeHtml(line)}</p>`).join('');
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/*
 * How a table looks in an email. Mail clients ignore the page's stylesheet, so
 * borders and padding are written onto the table and every cell — the editor
 * applies these on output; a cell's own style is not kept.
 */
export const TABLE_STYLE = 'border-collapse:collapse;width:100%';
export const CELL_STYLE = 'border:1px solid #e2e0dc;padding:6px 10px;vertical-align:top';
export const HEADER_CELL_STYLE = `${CELL_STYLE};background-color:#f6f5f3;text-align:start`;

/**
 * A cell holding only plain paragraphs. The editor always puts a paragraph in
 * a cell, but in an email a paragraph brings its own margins and every row
 * comes out tall — so on save such a cell holds the text, lines joined by
 * <br>. Read back in, the editor wraps it in a paragraph again.
 */
const CELL_OF_PARAGRAPHS = /(<t[dh]\b[^>]*>)((?:<p>(?:(?!<\/?p\b)[\s\S])*?<\/p>)+)(<\/t[dh]>)/g;

const unwrapCellParagraphs = (html) => html.replace(
  CELL_OF_PARAGRAPHS,
  (_, open, paragraphs, close) => `${open}${paragraphs.slice(3, -4).split('</p><p>').join('<br>')}${close}`
);

/**
 * The editor's HTML made ready to save.
 * @param {string} html what `editor.getHTML()` gave
 * @returns {string} '' for an empty editor
 */
export function fromEditorHtml(html) {
  const text = String(html ?? '').trim();
  if (/^(<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>)*$/.test(text)) return '';
  return unwrapCellParagraphs(text).replace(/\{\{([\s\S]*?)\}\}/g, (whole, inner) => {
    if (BLOCK_TAG.test(inner)) return whole;
    // Formatting that starts or ends inside the braces is moved just outside
    // them, so the whole value carries it and every tag still pairs up.
    const opening = [];
    const closing = [];
    const cleaned = inner
      .replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => {
        (tag.startsWith('</') ? closing : opening).push(tag);
        return '';
      })
      .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
      .replace(/\u00a0/g, ' ');
    return `${opening.join('')}{{${cleaned}}}${closing.join('')}`;
  });
}

// ---------------------------------------------------------------------------
// What the visual editor can hold
// ---------------------------------------------------------------------------

/** `a:b; c:d` → Map { a → 'b', c → 'd' }, values lower-cased with spaces collapsed. */
function styleMap(style) {
  const map = new Map();
  for (const rule of String(style ?? '').split(';')) {
    const at = rule.indexOf(':');
    if (at < 0) continue;
    const prop = rule.slice(0, at).trim().toLowerCase();
    if (prop) map.set(prop, rule.slice(at + 1).trim().toLowerCase().replace(/\s+/g, ' '));
  }
  return map;
}

/**
 * A cell's style survives only if it is the editor's own (which is re-applied
 * on save) — plus an alignment, which a cell keeps. Anything else is replaced.
 */
const cellStyleKept = (standard) => {
  const ours = styleMap(standard);
  return (prop, value) => prop === 'text-align' || ours.get(prop) === value;
};

/**
 * Per tag: the attributes it keeps, and for `style`, which properties — a list
 * (any value), null (all of it), or a check of property and value.
 */
const KEEPS = {
  table: { attrs: ['style'], styles: ['border-collapse', 'width', 'min-width'] },
  colgroup: {},
  col: { attrs: ['style'], styles: ['width', 'min-width'] },
  thead: {}, tbody: {}, tr: {},
  td: { attrs: ['colspan', 'rowspan', 'colwidth', 'width', 'style'], styles: cellStyleKept(CELL_STYLE) },
  th: { attrs: ['colspan', 'rowspan', 'colwidth', 'width', 'style'], styles: cellStyleKept(HEADER_CELL_STYLE) },
  p: { attrs: ['style'], styles: ['text-align'] },
  h1: { attrs: ['style'], styles: ['text-align'] },
  h2: { attrs: ['style'], styles: ['text-align'] },
  h3: { attrs: ['style'], styles: ['text-align'] },
  h4: { attrs: ['style'], styles: ['text-align'] },
  h5: { attrs: ['style'], styles: ['text-align'] },
  h6: { attrs: ['style'], styles: ['text-align'] },
  span: { attrs: ['style'], styles: ['color', 'background-color', 'font-size'] },
  // A link keeps its whole style — that is how a button is drawn.
  a: { attrs: ['href', 'target', 'rel', 'style'], styles: null },
  img: { attrs: ['src', 'alt', 'title', 'width', 'height'], styles: [] },
  ol: { attrs: ['start', 'type'], styles: [] },
  strong: {}, b: {}, em: {}, i: {}, u: {}, s: {}, strike: {}, del: {},
  ul: {}, li: {}, blockquote: {}, hr: {}, br: {},
};

const LABELS = {
  div: 'layout blocks', font: 'old <font> tags', style: 'a <style> block',
  center: 'old <center> tags', section: 'layout blocks',
};

/**
 * What the visual editor would drop from this HTML, in words — or null when it
 * keeps everything. Browser only (it parses with DOMParser).
 * @param {string} html
 * @returns {string|null}
 */
export function visualEditorProblem(html) {
  const text = String(html ?? '');
  if (!text.trim() || typeof DOMParser === 'undefined') return null;

  const doc = new DOMParser().parseFromString(`<body>${text}</body>`, 'text/html');
  const lost = new Set();

  // Template text between rows — `<table>{{ for … }}<tr>…</tr>{{ end }}</table>` —
  // is not allowed there in HTML: parsing moves it out of the table, breaking the loop.
  if (/<(table|thead|tbody|tfoot|tr|\/tr|\/td|\/th)\b[^>]*>\s*\{\{/i.test(text)
      || /\}\}\s*<\/?(tr|thead|tbody|tfoot|table)\b/i.test(text)) {
    lost.add('a loop between table rows');
  }

  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 8) { lost.add('comments'); continue; }
      if (child.nodeType !== 1) continue;
      const tag = child.tagName.toLowerCase();
      const keep = KEEPS[tag];
      if (!keep) {
        lost.add(LABELS[tag] ?? `<${tag}> tags`);
      } else {
        for (const attr of child.attributes) {
          const name = attr.name.toLowerCase();
          if (!(keep.attrs ?? []).includes(name)) {
            lost.add(name === 'class' || name === 'id' ? 'classes' : `the ${name} setting`);
          } else if (name === 'style' && typeof keep.styles === 'function') {
            for (const [prop, value] of styleMap(attr.value)) {
              if (!keep.styles(prop, value)) lost.add('custom table cell styles');
            }
          } else if (name === 'style' && keep.styles) {
            for (const prop of styleMap(attr.value).keys()) {
              if (!keep.styles.includes(prop)) lost.add(`some styles (${prop})`);
            }
          }
        }
      }
      walk(child);
    }
  };
  walk(doc.body);

  if (lost.size === 0) return null;
  const list = [...lost];
  return list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

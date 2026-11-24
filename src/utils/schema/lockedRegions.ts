/* eslint-disable @typescript-eslint/no-explicit-any */
import { isMap, isNode, isPair, isScalar, isSeq, Node, Parser, Scalar } from 'yaml';
import { parseYamlCached } from './yamlPathLocator';

/**
 * Parts of an entity's YAML the user cannot change in the YAML pane:
 *
 *   - `fixed`: a value whose schema is a `const` — the only allowed value
 *     (YAC pins stored values the user may not write that way, e.g. missing
 *     `yac_perms` or `yac_editable: false`; spec authors can also write one).
 *     Required in its object: neither changeable nor removable.
 *   - `fixed-optional`: the same, but the key may be removed as a whole (e.g.
 *     stored keys the schema does not define, which `cln` holders may clean
 *     up) — the value itself can't be changed either.
 *   - `comment`: a comment; without the `cln` permission YAC rejects any change
 *     of comments (adding, editing, removing), so it is locked too.
 *
 * Ranges are character offsets into the YAML text.
 */
export type LockedRegionKind = 'fixed' | 'fixed-optional' | 'comment';

export interface LockedRegion {
  kind: LockedRegionKind;
  start: number;
  end: number;
  /** For comments: the comment has its own line (not after a value). */
  standalone?: boolean;
}

/** Whether a subschema pins its value (a field's own `const`, not a choice of a `oneOf`). */
function isFixed(schema: any): boolean {
  return schema != null && typeof schema === 'object' && 'const' in schema;
}

function keyName(key: unknown): string | null {
  if (isScalar(key)) return key.value == null ? null : String(key.value);
  return typeof key === 'string' || typeof key === 'number' ? String(key) : null;
}

function nodeEnd(node: Node): number {
  // [start, valueEnd, nodeEnd]: the value end leaves out trailing comments.
  return node.range ? node.range[1] : 0;
}

/** `end` moved back over trailing whitespace (block values end after their newline). */
function trimEnd(yamlText: string, end: number): number {
  while (end > 0 && /\s/.test(yamlText[end - 1])) end--;
  return end;
}

function collectFixed(yamlText: string, schema: any, node: unknown, out: LockedRegion[]): void {
  if (schema == null || typeof schema !== 'object') return;
  if (isMap(node)) {
    const props = schema.properties;
    if (props == null || typeof props !== 'object') return;
    const required: string[] = Array.isArray(schema.required) ? schema.required : [];
    for (const pair of node.items) {
      if (!isPair(pair) || !isNode(pair.key) || pair.key.range == null) continue;
      const name = keyName(pair.key);
      if (name == null || !(name in props)) continue;
      const sub = props[name];
      if (isFixed(sub)) {
        const end = isNode(pair.value) ? nodeEnd(pair.value) : nodeEnd(pair.key);
        out.push({
          kind: required.includes(name) ? 'fixed' : 'fixed-optional',
          start: pair.key.range[0],
          end: trimEnd(yamlText, Math.max(end, nodeEnd(pair.key))),
        });
      } else {
        collectFixed(yamlText, sub, pair.value, out);
      }
    }
  } else if (isSeq(node)) {
    const items = schema.items;
    if (items == null || typeof items !== 'object' || Array.isArray(items)) return;
    for (const item of node.items) collectFixed(yamlText, items, item, out);
  }
}

/** The `fixed` / `fixed-optional` regions of the document for the schema. */
export function fixedValueRegions(yamlText: string, jsonSchema: any): LockedRegion[] {
  if (jsonSchema == null || typeof jsonSchema !== 'object') return [];
  let doc;
  try {
    doc = parseYamlCached(yamlText);
  } catch {
    return [];
  }
  if (doc.errors.length > 0) return [];
  const out: LockedRegion[] = [];
  collectFixed(yamlText, jsonSchema, doc.contents, out);
  return out;
}

/**
 * The comments of the document (from the YAML CST, so a `#` inside a string,
 * a value like `#fff` or a block scalar is no comment).
 */
export function commentRegions(yamlText: string): LockedRegion[] {
  const out: LockedRegion[] = [];
  const visit = (token: any) => {
    if (token == null || typeof token !== 'object') return;
    if (Array.isArray(token)) {
      for (const t of token) visit(t);
      return;
    }
    if (token.type === 'comment' && typeof token.offset === 'number') {
      const lineStart = yamlText.lastIndexOf('\n', token.offset - 1) + 1;
      out.push({
        kind: 'comment',
        start: token.offset,
        end: token.offset + String(token.source).length,
        standalone: yamlText.slice(lineStart, token.offset).trim() === '',
      });
      return;
    }
    for (const value of Object.values(token)) {
      if (value != null && typeof value === 'object') visit(value);
    }
  };
  try {
    for (const token of new Parser().parse(yamlText)) visit(token);
  } catch {
    return [];
  }
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Whether typing `#` at `offset` would start a comment: after whitespace (or
 * at the start of a line) and not inside a quoted or block scalar, where `#`
 * is just text.
 */
export function startsComment(yamlText: string, offset: number): boolean {
  const before = offset === 0 ? '\n' : yamlText[offset - 1];
  if (!/\s/.test(before)) return false;
  try {
    const doc = parseYamlCached(yamlText);
    let inText = false;
    const check = (node: unknown) => {
      if (inText || !isNode(node)) return;
      if (isScalar(node)) {
        const type = (node as Scalar).type;
        if (
          node.range &&
          type !== Scalar.PLAIN &&
          offset > node.range[0] &&
          offset < node.range[1]
        ) {
          inText = true;
        }
      } else if (isMap(node) || isSeq(node)) {
        for (const item of node.items as any[]) {
          if (isPair(item)) {
            check(item.key);
            check(item.value);
          } else check(item);
        }
      }
    };
    check(doc.contents);
    return !inText;
  } catch {
    return true;
  }
}

/**
 * The region that blocks an edit of the selection `[start, end)`, or of the
 * text around a cursor (start === end) strictly inside a region — at the
 * edges of a region typing is free (e.g. Enter after a fixed value or a
 * comment adds a line), see `edgeRegion` for the keys that would still change
 * it there. `wholeLines` tells whether the selection spans complete lines:
 * deleting whole lines may take inline comments along (YAC drops a key's
 * comment with the key) or an optional fixed value (removing the key), but
 * never a required fixed value or a standalone comment line.
 */
export function blockingRegion(
  regions: LockedRegion[],
  start: number,
  end: number,
  wholeLines: boolean,
): LockedRegion | null {
  for (const r of regions) {
    const touches =
      start === end ? start > r.start && start < r.end : start < r.end && end > r.start;
    if (!touches) continue;
    const removable = r.kind === 'fixed-optional' || (r.kind === 'comment' && !r.standalone);
    if (removable && wholeLines && start <= r.start && end >= r.end) continue;
    return r;
  }
  return null;
}

/**
 * The region a key press at the cursor `offset` would change although the
 * cursor is at its edge: a printable character right before or after it,
 * Backspace at its end, Delete at its start. Null if the key is harmless
 * there (e.g. Enter, arrows).
 */
export function edgeRegion(
  regions: LockedRegion[],
  offset: number,
  key: string,
): LockedRegion | null {
  const printable = key.length === 1;
  for (const r of regions) {
    if (offset === r.end && (printable || key === 'Backspace')) return r;
    if (offset === r.start && (printable || key === 'Delete')) return r;
  }
  return null;
}

/** A replacement of `[start, end)` by `text`, in offsets of the text BEFORE the change. */
export interface TextChange {
  start: number;
  end: number;
  text: string;
}

function isLineBreak(ch: string): boolean {
  return ch === '\n' || ch === '\r';
}

/**
 * The region a set of simultaneous changes (typing, paste, shortcuts,
 * multi-cursor, replace-all) to `oldText` would violate, or null. A locked
 * region must keep its text and its direct neighbours, except that a line
 * break may be put next to it (so lines can be added around it, but nothing
 * joined to it). Like for selections (see `blockingRegion`), inline comments
 * and optional fixed values may go with a change replacing their whole lines.
 */
export function violatedRegion(
  oldText: string,
  regions: LockedRegion[],
  changes: TextChange[],
): LockedRegion | null {
  const sorted = [...changes].sort((a, b) => a.start - b.start || a.end - b.end);
  let newText = '';
  let pos = 0;
  for (const c of sorted) {
    newText += oldText.slice(pos, c.start) + c.text;
    pos = c.end;
  }
  newText += oldText.slice(pos);

  const wholeLines = (c: TextChange) =>
    c.end > c.start &&
    (c.start === 0 || oldText[c.start - 1] === '\n') &&
    (c.end === oldText.length || oldText[c.end] === '\n' || oldText[c.end - 1] === '\n');

  for (const r of regions) {
    let shift = 0;
    let gone = false;
    for (const c of sorted) {
      const touches =
        c.start === c.end
          ? c.start > r.start && c.start < r.end
          : c.start < r.end && c.end > r.start;
      if (touches) {
        const removable = r.kind === 'fixed-optional' || (r.kind === 'comment' && !r.standalone);
        if (removable && wholeLines(c) && c.start <= r.start && c.end >= r.end) {
          gone = true;
          break;
        }
        return r;
      }
      // An insertion right at the start of the region lands before it.
      if (c.end <= r.start) shift += c.text.length - (c.end - c.start);
    }
    if (gone) continue;
    const before = (text: string, at: number) => (at > 0 ? text[at - 1] : '');
    const after = (text: string, at: number) => (at < text.length ? text[at] : '');
    const prev = before(newText, r.start + shift);
    const next = after(newText, r.end + shift);
    if (prev !== '' && !isLineBreak(prev) && prev !== before(oldText, r.start)) return r;
    if (next !== '' && !isLineBreak(next) && next !== after(oldText, r.end)) return r;
  }
  return null;
}

/**
 * Whether `newText` has a comment that `oldText` does not have (new or
 * edited): without `cln` comments may at most disappear with their lines.
 */
export function addsComment(oldText: string, newText: string): boolean {
  const texts = (yaml: string) => commentRegions(yaml).map((r) => yaml.slice(r.start, r.end));
  const old = texts(oldText);
  for (const comment of texts(newText)) {
    const i = old.indexOf(comment);
    if (i < 0) return true;
    old.splice(i, 1);
  }
  return false;
}

export const LOCK_MESSAGES: Record<LockedRegionKind, string> = {
  fixed: "This value is fixed and can't be changed or removed here.",
  'fixed-optional':
    "This value is fixed and can't be changed here, but the key may be removed (select its whole lines and delete them).",
  comment:
    'Changing comments needs the `cln` permission (it covers comments, key order and formatting).',
};

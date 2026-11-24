import { isMap, isNode, isScalar, isSeq, parseDocument, stringify, visit } from 'yaml';

/** Character-offset range in a YAML text. */
export interface TextRange {
  start: number;
  end: number;
}

/**
 * Locate the text range of the value at `instancePath` (AJV style, e.g.
 * `/ssh_keys/0/key`) in a YAML document. When the exact node does not exist
 * (or carries no range), the closest existing ancestor is used, so an error
 * on a just-removed leaf still points at its container. Returns null for the
 * document root, unresolvable paths, or unparseable documents — the caller
 * then leaves the error to the footer only.
 *
 * Used to surface backend-located validation errors (YAC's `data_loc`) as
 * Monaco markers: custom YAC formats (e.g. `ssh_key`) are server-side
 * plugins, so monaco-yaml's local schema validation cannot know them.
 */
export function locateInstancePathInYaml(yamlText: string, instancePath: string): TextRange | null {
  const segments = instancePath
    .split('/')
    .filter((s) => s !== '')
    // Sequence indices must be numbers for the yaml AST lookup.
    .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
  if (segments.length === 0) return null;

  let doc;
  try {
    doc = parseDocument(yamlText);
  } catch {
    return null;
  }

  for (let depth = segments.length; depth > 0; depth--) {
    const node = doc.getIn(segments.slice(0, depth), true);
    if (isNode(node) && node.range) {
      return { start: node.range[0], end: node.range[1] };
    }
  }
  return null;
}

/**
 * The text range of the node at `segments`, with NO ancestor fallback (unlike
 * `locateInstancePathInYaml`): a missing key yields null instead of pinning to
 * its container. Used to anchor per-field decorations (the limit-usage gutter
 * glyphs), where a wrong-line anchor is worse than no anchor.
 */
export function locateDataPathExact(
  yamlText: string,
  segments: (string | number)[],
): TextRange | null {
  if (segments.length === 0) return null;
  try {
    const doc = parseDocument(yamlText);
    const node = doc.getIn(segments, true);
    return isNode(node) && node.range ? { start: node.range[0], end: node.range[1] } : null;
  } catch {
    return null;
  }
}

/**
 * The inverse of `locateInstancePathInYaml`: the data path (as segments, e.g.
 * `['ssh_keys', 0, 'key']`) of the innermost map entry / sequence item at the
 * given character offset. An offset on a map KEY resolves to that key's path
 * (not into its value), which is what field-level help wants. Returns null for
 * unparseable documents or offsets outside any entry (e.g. blank lines).
 */
export function yamlPathAtOffset(yamlText: string, offset: number): (string | number)[] | null {
  let doc;
  try {
    doc = parseDocument(yamlText);
  } catch {
    return null;
  }

  const path: (string | number)[] = [];
  let node: unknown = doc.contents;

  for (;;) {
    if (isMap(node)) {
      // The last entry starting at or before the offset: an entry's range runs
      // up to the start of the next one, so the first match would be the
      // PREVIOUS entry when the offset is on the first character of a key.
      let pair = null;
      for (const p of node.items) {
        const start = isNode(p.key) && p.key.range ? p.key.range[0] : null;
        if (start != null && start <= offset) pair = p;
      }
      if (pair == null || !isScalar(pair.key) || !pair.key.range) break;
      // The pair spans from its key to the end of its value (or the key
      // itself for empty values). range[2] includes trailing space/comments.
      const end = isNode(pair.value) && pair.value.range ? pair.value.range[2] : pair.key.range[2];
      if (offset > end) break;
      path.push(String(pair.key.value));
      // Descend only when the offset is inside the VALUE of the pair; on the
      // key itself this entry is the innermost result.
      if (isNode(pair.value) && pair.value.range && offset >= pair.value.range[0]) {
        node = pair.value;
        continue;
      }
      break;
    }
    if (isSeq(node)) {
      let idx = -1;
      node.items.forEach((item, i) => {
        if (isNode(item) && item.range && item.range[0] <= offset) idx = i;
      });
      const item = idx < 0 ? null : node.items[idx];
      if (!isNode(item) || !item.range || offset > item.range[2]) break;
      path.push(idx);
      node = item;
      continue;
    }
    break;
  }

  return path.length > 0 ? path : null;
}

/** A replacement of the text range `[start, end)`. */
export interface TextEdit extends TextRange {
  text: string;
}

/**
 * The edit that sets the existing entry at `path` to `value`, touching only
 * that entry's value: everything else (comments, formatting, long lines)
 * stays byte for byte. Returns null when the entry does not exist, the
 * document cannot be parsed or the value cannot be placed that way (e.g. a
 * comment sits between key and value).
 */
export function valueEditInYaml(
  yamlText: string,
  path: (string | number)[],
  value: unknown,
): TextEdit | null {
  if (path.length === 0) return null;
  let doc;
  try {
    doc = parseDocument(yamlText);
  } catch {
    return null;
  }
  if (doc.errors.length > 0) return null;
  const node = doc.getIn(path, true);
  const parent = path.length > 1 ? doc.getIn(path.slice(0, -1), true) : doc.contents;
  if (!isNode(node) || !node.range) return null;
  const range = node.range;

  const column = (offset: number) => offset - (yamlText.lastIndexOf('\n', offset - 1) + 1);
  const indentLines = (lines: string[], indent: number) =>
    lines.map((l) => (l === '' ? l : ' '.repeat(indent) + l));
  // A block value's range ends after its last line break.
  const valueEnd = (from: number) => {
    let end = Math.max(range[1], from);
    while (end > from && /\s/.test(yamlText[end - 1])) end--;
    return end;
  };
  const isCollection = value != null && typeof value === 'object';
  const isEmpty = isCollection && Object.keys(value as object).length === 0;

  let edit: TextEdit;
  if ((isMap(parent) || isSeq(parent)) && parent.flow) {
    // Inside a flow collection: JSON is valid flow YAML.
    edit = { start: range[0], end: range[1], text: JSON.stringify(value) };
  } else {
    const lines = stringify(value).replace(/\n$/, '').split('\n');
    if (isMap(parent)) {
      const pair = parent.items.find((p) => p.value === node);
      if (!pair || !isScalar(pair.key) || !pair.key.range) return null;
      const colon = yamlText.indexOf(':', pair.key.range[1]);
      if (colon < 0) return null;
      const start = colon + 1;
      const end = valueEnd(start);
      if (yamlText.slice(start, range[0]).includes('#')) return null;
      const indent = column(pair.key.range[0]) + 2;
      const text =
        isCollection && !isEmpty
          ? '\n' + indentLines(lines, indent).join('\n')
          : ' ' + [lines[0], ...indentLines(lines.slice(1), indent)].join('\n');
      edit = { start, end, text };
    } else if (isSeq(parent)) {
      const indent = column(range[0]);
      edit = {
        start: range[0],
        end: valueEnd(range[0]),
        text: [lines[0], ...indentLines(lines.slice(1), indent)].join('\n'),
      };
    } else {
      return null;
    }
  }

  // Only an edit that provably yields the value is good enough.
  try {
    const updated = yamlText.slice(0, edit.start) + edit.text + yamlText.slice(edit.end);
    const check = parseDocument(updated);
    if (check.errors.length > 0) return null;
    const got = check.getIn(path);
    const js = isNode(got) ? got.toJSON() : got;
    if (JSON.stringify(js) !== JSON.stringify(value)) return null;
  } catch {
    return null;
  }
  return edit;
}

/**
 * The line-start offset of the document's root node (its first key for block
 * maps). Used to decide whether a marker is anchored on the ROOT object:
 * comparing by line (not exact position) tolerates markers whose column was
 * shifted by edits (monaco tracks markers as decorations through edits).
 * Returns null for unparseable or empty documents.
 */
export function yamlRootStartOffset(yamlText: string): number | null {
  try {
    const doc = parseDocument(yamlText);
    const c = doc.contents;
    return isNode(c) && c.range ? c.range[0] : null;
  } catch {
    return null;
  }
}

/**
 * An object (YAML map) that is the value of a map entry, e.g. the value of
 * `monitoring_notification_mail:`. monaco-yaml anchors a violated `required`
 * of such an object on the entry's KEY (vscode-json-languageservice heritage)
 * — for a top-level key that is column 1, just like the root object's anchor.
 */
export interface NestedObjectAnchor {
  /** The entry's key: where monaco-yaml anchors "Missing property". */
  key: TextRange;
  /** The keys the object already has. */
  keys: string[];
}

/**
 * Every object that is the value of a map entry (at any depth, also inside
 * sequence items), see `NestedObjectAnchor`. Returns [] for unparseable
 * documents.
 */
export function nestedObjectAnchors(yamlText: string): NestedObjectAnchor[] {
  let doc;
  try {
    doc = parseDocument(yamlText);
  } catch {
    return [];
  }

  const anchors: NestedObjectAnchor[] = [];
  visit(doc, {
    Pair(_, pair) {
      if (!isScalar(pair.key) || !pair.key.range || !isMap(pair.value)) return;
      anchors.push({
        key: { start: pair.key.range[0], end: pair.key.range[1] },
        keys: pair.value.items.flatMap((p) => (isScalar(p.key) ? [String(p.key.value)] : [])),
      });
    },
  });
  return anchors;
}

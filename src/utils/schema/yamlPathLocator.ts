import { isMap, isNode, isScalar, isSeq, parseDocument } from 'yaml';

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
      const pair = node.items.find((p) => {
        const start = isNode(p.key) && p.key.range ? p.key.range[0] : null;
        // The pair spans from its key to the end of its value (or the key
        // itself for empty values). range[2] includes trailing space/comments.
        const end =
          isNode(p.value) && p.value.range
            ? p.value.range[2]
            : isNode(p.key) && p.key.range
              ? p.key.range[2]
              : null;
        return start != null && end != null && offset >= start && offset <= end;
      });
      if (pair == null || !isScalar(pair.key)) break;
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
      const idx = node.items.findIndex(
        (item) => isNode(item) && item.range && offset >= item.range[0] && offset <= item.range[2],
      );
      if (idx < 0) break;
      path.push(idx);
      node = node.items[idx];
      continue;
    }
    break;
  }

  return path.length > 0 ? path : null;
}

/**
 * Set the value at `path` in a YAML document, preserving comments, key order
 * and formatting of everything else (the `yaml` document round-trip). Returns
 * the updated text, or null when the document cannot be parsed.
 */
export function setValueInYaml(
  yamlText: string,
  path: (string | number)[],
  value: unknown,
): string | null {
  try {
    const doc = parseDocument(yamlText);
    doc.setIn(path, value);
    return String(doc);
  } catch {
    return null;
  }
}

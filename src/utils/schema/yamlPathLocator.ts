import { isNode, parseDocument } from 'yaml';

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

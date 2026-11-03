/**
 * Placeholder substitution for the `template_text` renderer.
 *
 * A template is plain text with `{...}` placeholders that reference form data:
 *
 *   - `{key}` / `{key/sub/0}` — relative to the object that contains the
 *     rendered field (its siblings), e.g. the current array item.
 *   - `{../key}` — `..` walks up one level (`.` stays), from that object.
 *   - `{/key/sub}` — absolute, from the data root (JSON pointer, `~1` = `/`,
 *     `~0` = `~`).
 *
 * Only strings, numbers and booleans are substituted; anything else (missing,
 * `null`, `''`, objects, arrays) leaves the placeholder unresolved.
 *
 * Note: in YAC specs the template is rendered by Jinja2 first, so `{{ ... }}`
 * never reaches VAYS and `{#` would open a Jinja comment.
 */

export interface TemplatePart {
  text: string;
  /** Set for a placeholder that could not be resolved; `text` is the placeholder itself. */
  missing?: boolean;
}

const PLACEHOLDER_RE = /\{([^{}]*)\}/g;

/** Data path segments of the object containing the field at `path` (JSON Forms dot path). */
function parentSegments(path: string | undefined): string[] {
  if (!path) return [];
  return path.split('.').slice(0, -1);
}

function unescapePointer(seg: string): string {
  return seg.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** Resolves a placeholder reference to absolute data path segments, or null if invalid. */
export function resolveRef(ref: string, fieldPath: string | undefined): string[] | null {
  if (ref === '') return null;
  if (ref.startsWith('/')) return ref.slice(1).split('/').map(unescapePointer);
  const segs = parentSegments(fieldPath);
  for (const seg of ref.split('/').map(unescapePointer)) {
    if (seg === '.') continue;
    if (seg === '..') {
      if (segs.length === 0) return null;
      segs.pop();
    } else {
      segs.push(seg);
    }
  }
  return segs;
}

function lookup(data: unknown, segs: string[]): unknown {
  let cur = data;
  for (const seg of segs) {
    if (cur === null || typeof cur !== 'object') return undefined;
    if (!Object.prototype.hasOwnProperty.call(cur, seg)) return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value === '' ? undefined : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

/** Splits `template` into literal text and substituted / unresolved placeholders. */
export function renderTemplate(
  template: string,
  data: unknown,
  fieldPath: string | undefined,
): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const pushText = (text: string) => {
    if (text === '') return;
    const last = parts[parts.length - 1];
    if (last && !last.missing) last.text += text;
    else parts.push({ text });
  };
  let pos = 0;
  for (const m of template.matchAll(PLACEHOLDER_RE)) {
    pushText(template.slice(pos, m.index));
    pos = m.index + m[0].length;
    const segs = resolveRef(m[1].trim(), fieldPath);
    const value = segs === null ? undefined : asText(lookup(data, segs));
    if (value === undefined) parts.push({ text: m[0], missing: true });
    else pushText(value);
  }
  pushText(template.slice(pos));
  return parts;
}

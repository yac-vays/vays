/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';
import { isRFC3339Date } from '../dateUtils';
import { DEFAULT_RANDOM_STRING_FORMAT, RANDOM_STRING_FORMATS } from '../randomString';

/**
 * Schema lint: admin-facing checks over the JSON-Schema + UI-Schema pair that
 * YAC delivers for an entity type. The findings feed the "Schema Warnings"
 * bell (shown when `production: false`) and point spec authors at things that
 * silently degrade the form: renderers that do not apply, defaults that can
 * never validate, options the renderer ignores, missing descriptions, ...
 *
 * This is a pure function over the validate response, run by the edit
 * controller after every validation (so `yac_if`-revealed fields are covered
 * too) — NOT inside the renderers, which only see the fields currently on
 * screen.
 */

export interface LintFinding {
  /** 1 (hint) … 10 (broken). Above 1 lights up the header dot. */
  priority: number;
  title: string;
  message: string;
  /** Human-readable location, e.g. `network.ipv4` or `users[].name`. */
  key: string;
}

/** The explicit renderers VAYS knows (`vays_options.renderer`). */
export const EXPLICIT_RENDERERS = [
  'age_secret',
  'big_string_list',
  'info_box',
  'list_as_string',
  'mac_address',
  'multi_checkbox',
  'password',
  'random_string',
  'ssh_key',
  'text_area',
  'unavailable',
] as const;

/** Explicit renderers whose tester requires `type: string` (or no type). */
const STRING_RENDERERS = new Set([
  'age_secret',
  'info_box',
  'list_as_string',
  'mac_address',
  'password',
  'random_string',
  'ssh_key',
  'text_area',
]);

/** Explicit renderers whose tester requires `type: array`. */
const ARRAY_RENDERERS = new Set(['big_string_list', 'multi_checkbox']);

/**
 * Renderers documented to ignore `vays_options.initial` /
 * `initial_editable` (see the renderer docs).
 */
const RENDERERS_IGNORING_INITIAL = new Set([
  'password',
  'info_box',
  'list_as_string',
  'big_string_list',
]);

/** Soft limits from the "Guarantees and Limitations" page. */
export const MAX_CATEGORIES = 8;
export const MAX_FIELDS_PER_CATEGORY = 25;

interface UiControl {
  type: 'Control';
  scope: string;
  options?: { [key: string]: any };
}

interface UiLayout {
  type: string;
  label?: string;
  elements?: UiNode[];
}

type UiNode = UiControl | UiLayout;

/** One form control as the lint sees it. */
interface Field {
  /** Property key (last path segment). */
  name: string;
  /** Display location, e.g. `users[].name`. */
  key: string;
  /** The resolved subschema (undefined if the scope does not resolve). */
  schema: any;
  /** The `vays_options` YAC copied into the UI-Schema (`renderer`, ...). */
  options: { [key: string]: any };
  /** Whether the parent object lists the property as required. */
  required: boolean;
  /** The current data value (undefined for array-row controls). */
  data: unknown;
  hasData: boolean;
}

/**
 * Lint a validate response. Returns the findings in no particular order (the
 * warnings buffer sorts by priority).
 */
export function lintSchema(jsonSchema: any, uiSchema: any, data: unknown): LintFinding[] {
  const findings: LintFinding[] = [];
  const seen = new Set<string>();

  lintLayout(uiSchema, findings);
  collectControls(uiSchema, jsonSchema, [], data, findings, seen);
  lintUnrendered(jsonSchema, [], seen, findings);

  return findings;
}

// ---------------------------------------------------------------------------
// Traversal

function lintLayout(uiSchema: any, findings: LintFinding[]) {
  if (uiSchema?.type !== 'Categorization' || !Array.isArray(uiSchema.elements)) return;
  const categories = uiSchema.elements.filter((e: UiNode) => e.type === 'Category');
  if (categories.length > MAX_CATEGORIES) {
    findings.push({
      priority: 2,
      title: 'Potentially too many categories',
      message:
        `The form has more than ${MAX_CATEGORIES} categories (tabs), which become hard to scan. ` +
        'Consider merging related fields into the same category.',
      key: 'Form',
    });
  }
  for (const cat of categories) {
    if (countControls(cat) > MAX_FIELDS_PER_CATEGORY) {
      findings.push({
        priority: 2,
        title: 'Potentially big category',
        message:
          `This category has more than ${MAX_FIELDS_PER_CATEGORY} fields. Consider splitting it ` +
          'into new categories (adding them conditionally) or using vays_group.',
        key: cat.label ?? 'Category',
      });
    }
  }
}

/**
 * Report schema properties the UI-Schema never reaches (no `vays_category`,
 * or a nested object's `detail` layout that omits them): they never land in
 * the form. Properties YAC pinned as read-only `const` (no perms / not
 * editable) and `not: {}` placeholders are intentionally data-only.
 */
function lintUnrendered(schema: any, path: string[], seen: Set<string>, findings: LintFinding[]) {
  const props = schema?.properties;
  if (props == null || typeof props !== 'object') return;
  for (const [name, sub] of Object.entries<any>(props)) {
    const subPath = [...path, name];
    if (seen.has(subPath.join('/'))) {
      if (sub?.type === 'object') lintUnrendered(sub, subPath, seen, findings);
      else if (sub?.type === 'array' && sub.items?.type === 'object') {
        lintUnrendered(sub.items, [...subPath, ITEMS_MARKER], seen, findings);
      }
      continue;
    }
    if (sub == null || typeof sub !== 'object' || 'const' in sub || 'not' in sub) continue;
    findings.push({
      priority: 4,
      title: 'Property is not shown in the form',
      message:
        'The UI-Schema has no control for this property, so it never appears in the form ' +
        '(it can only be edited in the YAML editor). Add vays_category to it (or, for a ' +
        "nested property, include it in the parent's layout) if it should be editable.",
      key: displayKey(subPath),
    });
  }
}

function countControls(node: UiNode): number {
  if (node.type === 'Control') return 1;
  return ((node as UiLayout).elements ?? []).reduce((n, e) => n + countControls(e), 0);
}

/**
 * Walk the UI-Schema, resolve every Control against `base` (the schema its
 * scope is relative to), and lint it. Nested objects and array rows are
 * descended into as well, so fields YAC did not emit a Control for (no
 * `vays_options`, hence no `detail`/`details`) are still covered.
 */
function collectControls(
  node: any,
  base: any,
  basePath: string[],
  baseData: unknown,
  findings: LintFinding[],
  seen: Set<string>,
) {
  if (node == null || typeof node !== 'object') return;
  if (node.type === 'Control' && typeof node.scope === 'string') {
    const segments = scopeToPath(node.scope);
    const path = [...basePath, ...segments];
    const pointer = path.join('/');
    if (seen.has(pointer)) return;
    seen.add(pointer);

    const parent = segments.length > 0 ? resolveProperties(base, segments.slice(0, -1)) : null;
    const schema = segments.length > 0 ? resolveProperties(base, segments) : base;
    const name =
      segments.length > 0
        ? segments[segments.length - 1]
        : [...basePath].reverse().find((p) => p !== ITEMS_MARKER);
    const { data, hasData } = lookupData(baseData, segments);
    const field: Field = {
      name: name ?? 'key',
      key: displayKey(path),
      schema,
      options: node.options ?? {},
      required: Array.isArray(parent?.required) && parent.required.includes(name),
      data,
      hasData,
    };
    lintField(field, findings);
    descend(field, node.options ?? {}, path, findings, seen);
    return;
  }
  if (Array.isArray(node.elements)) {
    for (const e of node.elements) collectControls(e, base, basePath, baseData, findings, seen);
  }
}

/** Lint the children of an object / array-of-objects control. */
function descend(
  field: Field,
  options: { [key: string]: any },
  path: string[],
  findings: LintFinding[],
  seen: Set<string>,
) {
  const s = field.schema;
  if (s == null || typeof s !== 'object') return;

  if (s.type === 'object' && s.properties && typeof s.properties === 'object') {
    // Explicit `detail` layout (from vays_options below), else synthesize one.
    const layout = options.detail ?? syntheticLayout(Object.keys(s.properties));
    collectControls(layout, s, path, field.data, findings, seen);
  } else if (s.type === 'array' && s.items && typeof s.items === 'object') {
    const items = s.items;
    const rowPath = [...path, ITEMS_MARKER];
    if (items.type === 'object' && items.properties && typeof items.properties === 'object') {
      const layout = options.details?.elements
        ? { type: 'VerticalLayout', elements: options.details.elements }
        : syntheticLayout(Object.keys(items.properties));
      collectControls(layout, items, rowPath, undefined, findings, seen);
    } else if (options.details?.elements) {
      // Primitive rows carrying vays_options: a single `#` control.
      collectControls(
        { type: 'VerticalLayout', elements: options.details.elements },
        items,
        rowPath,
        undefined,
        findings,
        seen,
      );
    }
  }
}

const ITEMS_MARKER = '[]';

function syntheticLayout(keys: string[]): UiLayout {
  return {
    type: 'VerticalLayout',
    elements: keys.map((k) => ({ type: 'Control', scope: `#/properties/${k}`, options: {} })),
  };
}

/** `#/properties/a/properties/b` → `['a', 'b']`; `#` → `[]`. */
function scopeToPath(scope: string): string[] {
  const parts = scope.replace(/^#\/?/, '').split('/').filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'properties' && i + 1 < parts.length) {
      out.push(parts[++i]);
    } else {
      out.push(parts[i]);
    }
  }
  return out;
}

function resolveProperties(schema: any, segments: string[]): any {
  let cur = schema;
  for (const seg of segments) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur.properties?.[seg];
  }
  return cur;
}

function lookupData(data: unknown, segments: string[]): { data: unknown; hasData: boolean } {
  let cur: any = data;
  for (const seg of segments) {
    if (cur == null || typeof cur !== 'object' || !(seg in cur)) {
      return { data: undefined, hasData: false };
    }
    cur = cur[seg];
  }
  return { data: cur, hasData: cur !== undefined };
}

function displayKey(path: string[]): string {
  let out = '';
  for (const p of path) {
    if (p === ITEMS_MARKER) out += '[]';
    else out += out === '' ? p : `.${p}`;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-field checks

function lintField(f: Field, findings: LintFinding[]) {
  const add = (priority: number, title: string, message: string) =>
    findings.push({ priority, title, message, key: f.key });

  if (f.schema == null || typeof f.schema !== 'object') {
    add(
      9,
      'Empty schema to be rendered',
      'The UI-Schema references a subschema that does not exist (or is empty). ' +
        'The field cannot be rendered.',
    );
    return;
  }
  const s = f.schema;
  const opts = f.options;
  const renderer: string | undefined =
    typeof opts.renderer === 'string' ? opts.renderer : undefined;
  const ropts: { [key: string]: any } =
    opts.renderer_options && typeof opts.renderer_options === 'object' ? opts.renderer_options : {};
  const type = schemaType(s);
  const isString = type === 'string' || (type === undefined && s.pattern != undefined);
  const isChoice = Array.isArray(s.enum) || Array.isArray(s.oneOf);
  const title: string = typeof s.title === 'string' ? s.title : f.name;
  const label = title.toLowerCase();

  // --- renderer selection -------------------------------------------------
  if (renderer !== undefined) {
    if (!(EXPLICIT_RENDERERS as readonly string[]).includes(renderer)) {
      add(
        9,
        'Unknown renderer',
        `The renderer '${renderer}' does not exist; VAYS silently falls back to the default ` +
          `renderer for the type. Known renderers: ${EXPLICIT_RENDERERS.join(', ')}.`,
      );
    } else if (STRING_RENDERERS.has(renderer) && type !== undefined && type !== 'string') {
      add(
        9,
        'Renderer does not match the type',
        `The renderer '${renderer}' only applies to 'type: string' fields; on '${type}' it is silently ` +
          'ignored and the default renderer is used.',
      );
    } else if (ARRAY_RENDERERS.has(renderer) && type !== 'array') {
      add(
        9,
        'Renderer does not match the type',
        `The renderer '${renderer}' only applies to 'type: array' fields; here it is silently ` +
          'ignored and the default renderer is used.',
      );
    } else if (renderer === 'multi_checkbox' && s.uniqueItems !== true) {
      add(
        9,
        "Renderer 'multi_checkbox' requires uniqueItems",
        "The 'multi_checkbox' renderer only applies with 'uniqueItems: true'; without it the " +
          'field silently falls back to the multi-select dropdown.',
      );
    }
  }

  // --- enum / oneOf -------------------------------------------------------
  let oneOfBroken = false;
  if (Array.isArray(s.oneOf) && s.oneOf.length > 0) {
    const withConst = s.oneOf.filter((e: any) => e && typeof e === 'object' && 'const' in e);
    oneOfBroken = withConst.length < s.oneOf.length;
    if (withConst.length === 0) {
      add(
        6,
        'oneOf is not rendered as a form control',
        'A oneOf without const entries is not supported at property level; use yac_if / ' +
          'yac_types to gate properties, or oneOf with const/title pairs for a dropdown.',
      );
    } else if (withConst.length < s.oneOf.length) {
      add(
        9,
        'oneOf entry without const',
        'Every oneOf entry of a dropdown must declare a const (the stored value); entries ' +
          'without one cannot be selected.',
      );
    }
  }
  if (
    isChoice &&
    !oneOfBroken &&
    f.required &&
    choiceValues(s)?.length === 1 &&
    renderer !== 'unavailable'
  ) {
    add(
      2,
      'Single-choice dropdown',
      'A required enum / oneOf with exactly one entry gives the user nothing to choose; ' +
        'consider const plus default instead.',
    );
  }

  // --- default / initial ---------------------------------------------------
  if ('default' in s) {
    const values = choiceValues(s);
    if (values && !values.some((v) => _.isEqual(v, s.default))) {
      add(
        7,
        'Default value is not an allowed choice',
        'The default is not contained in the enum / oneOf values, so a newly created entity ' +
          'is invalid before the user touches the field.',
      );
    } else if (!matchesSchemaType(s.default, s.type)) {
      add(
        7,
        'Potentially incorrect type for default value',
        `The default value has a type the schema does not allow ('${type}'), so a newly ` +
          'created entity is invalid before the user touches the field.',
      );
    }
  }
  if ('initial' in opts) {
    if (renderer !== undefined && RENDERERS_IGNORING_INITIAL.has(renderer)) {
      add(
        3,
        'initial is ignored by this renderer',
        `The renderer '${renderer}' ignores vays_options.initial / initial_editable; seed the ` +
          'field through a JSON-Schema default instead.',
      );
    } else if (type === 'array' && renderer === undefined) {
      add(
        3,
        'initial is ignored by this renderer',
        'The array renderers ignore vays_options.initial at the array level; pre-fill items ' +
          'through a JSON-Schema default or set initial on the item properties.',
      );
    } else if (
      renderer === 'multi_checkbox'
        ? !Array.isArray(opts.initial)
        : !matchesSchemaType(opts.initial, s.type)
    ) {
      add(
        5,
        'Potentially incorrect type for initial value',
        'The vays_options.initial value has a type the schema does not allow; it cannot be ' +
          'committed as-is.',
      );
    }
    if ('default' in s && opts.initial_editable) {
      add(
        2,
        'Potentially overshadowing editable default',
        'The schema specifies both a default for this key and an editable initial value ' +
          '(which is not written into the YAML). In this case the latter is ignored.',
      );
    }
  }

  // --- renderer-specific options -----------------------------------------
  switch (renderer) {
    case 'text_area':
      if (ropts.rows !== undefined && !Number.isInteger(ropts.rows)) {
        add(
          5,
          'Potentially incorrect type for rows option',
          'renderer_options.rows must be an integer (visible row count).',
        );
      }
      break;
    case 'password':
      if (ropts.save_password_as === 'plaintext') {
        add(
          6,
          'Password stored in plaintext',
          'renderer_options.save_password_as: plaintext writes the cleartext verbatim into the YAML ' +
            'file, which defeats the purpose of the password renderer. Only use it when the ' +
            'storing system genuinely cannot consume a hash.',
        );
      }
      break;
    case 'random_string': {
      const format = ropts.format ?? DEFAULT_RANDOM_STRING_FORMAT;
      if (!(RANDOM_STRING_FORMATS as readonly string[]).includes(format)) {
        add(
          9,
          "Invalid renderer_options for renderer 'random_string'",
          `Unknown format '${format}'. Valid formats: ${RANDOM_STRING_FORMATS.join(', ')}.`,
        );
      } else if (format === 'custom' && typeof ropts.charset !== 'string') {
        add(
          9,
          "Invalid renderer_options for renderer 'random_string'",
          "Format 'custom' requires renderer_options.charset.",
        );
      }
      if ('default' in s) {
        add(
          5,
          "Renderer 'random_string' with a default",
          'When the schema has a default nothing is ever generated; the field just carries ' +
            'the default. Drop the default if a random value is intended.',
        );
      }
      break;
    }
    case 'age_secret':
      if (typeof ropts.age_public_key !== 'string' || ropts.age_public_key === '') {
        add(
          9,
          "Missing age_public_key for renderer 'age_secret'",
          'The age_secret renderer requires renderer_options.age_public_key to be set to an ' +
            "AGE recipient (e.g. 'age1...'). The field cannot generate or encrypt secrets until this is fixed.",
        );
      }
      break;
    case 'info_box':
      if (f.required) {
        add(
          8,
          "Required 'info_box' field",
          'An info_box never carries data, but the property is required, so the form can ' +
            "never validate. Mark it 'yac_optional: true' (and add 'not: {}').",
        );
      } else if (!('not' in s)) {
        add(
          3,
          "'info_box' without 'not: {}'",
          "Add 'not: {}' so YAC rejects data stored under this purely informational property.",
        );
      }
      if (typeof s.description !== 'string' || s.description.trim() === '') {
        add(
          5,
          "'info_box' without description",
          'The info_box renders only title and description; without a description the box is empty.',
        );
      }
      break;
    case 'list_as_string': {
      const sep =
        typeof ropts.separator === 'string' && ropts.separator !== '' ? ropts.separator : ',';
      if (typeof s.pattern === 'string' && !patternAllowsSeparator(s.pattern, sep)) {
        add(
          6,
          "Pattern rejects the 'list_as_string' separator",
          `The pattern is validated against the joined string, but it does not accept the separator ` +
            `'${sep}', so any list with two or more items is invalid.`,
        );
      }
      break;
    }
    default:
      break;
  }

  // Implicit date renderer: `format: date`.
  if (type === 'string' && s.format === 'date') {
    for (const which of ['enable_range', 'disable_range']) {
      const range = ropts[which];
      if (range === undefined) continue;
      const problem = describeRangeProblem(range);
      if (problem) {
        add(
          5,
          `Invalid ${which} for the date renderer`,
          `renderer_options.${which}: ${problem} (dates must be 'YYYY-MM-DD').`,
        );
      }
    }
  }

  // Nested array cards: item_label_prop must name an item property.
  if (type === 'array' && typeof ropts.item_label_prop === 'string') {
    const props = s.items?.properties;
    if (!props || typeof props !== 'object' || !(ropts.item_label_prop in props)) {
      add(
        5,
        'item_label_prop names an unknown property',
        `renderer_options.item_label_prop '${ropts.item_label_prop}' is not a property of the ` +
          'array items, so cards silently fall back to their index as title.',
      );
    }
  }

  // --- plain-text heuristics (text / text_area) ---------------------------
  const isTextLike = isString && !isChoice && (renderer === undefined || renderer === 'text_area');
  if (isTextLike) {
    if (/\bpassword\b/.test(label)) {
      add(
        9,
        'Potentially unsafe handling of Passwords',
        'It seems that you are showing and storing a password in plaintext. Consider using the ' +
          'dedicated password renderer: it does not show the password and stores only the hash. If ' +
          'you still want to store the password in plain text or in another format, contact the VAYS maintainers.',
      );
    }
    if (/\b(date|due)\b/.test(label) && s.format === undefined) {
      add(
        3,
        'Potentially handling a Date as a String',
        "It seems that you are requiring a date. In this case, you may choose to set 'format: date' " +
          'to get the calendar picker.',
      );
    }
    if (
      renderer === undefined &&
      typeof f.data === 'string' &&
      f.data.includes(', ') &&
      !f.data.includes('\n')
    ) {
      add(
        6,
        'Potentially having a list as string',
        'The input appears to be a comma-separated enumeration. If this is the case, consider ' +
          'the custom renderer list_as_string. This improves the user experience significantly.',
      );
    }
  }

  // --- description ---------------------------------------------------------
  if (
    type !== 'object' &&
    renderer !== 'info_box' &&
    (typeof s.description !== 'string' || s.description.trim() === '')
  ) {
    add(
      1,
      'No description available',
      'This key does not have a description. Providing one may improve the user experience.',
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers

function schemaType(s: any): string | undefined {
  if (typeof s.type === 'string') return s.type;
  if (Array.isArray(s.type) && s.type.length > 0) {
    const nonNull = s.type.filter((t: unknown) => t !== 'null');
    return nonNull.length === 1 ? nonNull[0] : undefined;
  }
  return undefined;
}

/** The set of allowed values of an enum / oneOf-const field, if it is one. */
function choiceValues(s: any): unknown[] | null {
  if (Array.isArray(s.enum)) return s.enum;
  if (Array.isArray(s.oneOf)) {
    const consts = s.oneOf
      .filter((e: any) => e && typeof e === 'object' && 'const' in e)
      .map((e: any) => e.const);
    return consts.length > 0 ? consts : null;
  }
  return null;
}

/** `type` as written in the schema: a single type, a list of types, or absent. */
function matchesSchemaType(value: unknown, type: unknown): boolean {
  if (Array.isArray(type)) {
    return type.length === 0 || type.some((t) => matchesType(value, String(t)));
  }
  return matchesType(value, typeof type === 'string' ? type : undefined);
}

function matchesType(value: unknown, type: string | undefined): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'integer':
      return Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return true;
  }
}

/**
 * Heuristic: a pattern that accepts a single item but rejects two items
 * joined by the separator cannot validate any real list.
 */
function patternAllowsSeparator(pattern: string, sep: string): boolean {
  let re: RegExp;
  try {
    re = new RegExp(pattern, 'u');
  } catch {
    return true; // Not our concern here.
  }
  const single = re.test('a');
  const joined = re.test(`a${sep}a`);
  return !single || joined;
}

function describeRangeProblem(range: unknown): string | null {
  if (range === null || typeof range !== 'object') return 'must be an object with from / to';
  const r = range as { from?: unknown; to?: unknown };
  for (const k of ['from', 'to'] as const) {
    const v = r[k];
    if (v !== undefined && (typeof v !== 'string' || !isRFC3339Date(v))) {
      return `'${k}' is not a valid date`;
    }
  }
  if (typeof r.from === 'string' && typeof r.to === 'string' && r.from > r.to) {
    return "'from' is after 'to'";
  }
  return null;
}

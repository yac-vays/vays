/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Schema-driven field help for the YAML editor's context menu ("Show Field
 * Help"): resolve the subschema of the field under the cursor and render
 * everything the schema knows about it (title, description, type, possible
 * values, default, examples, pattern, required) as markdown for the modal.
 */

/**
 * Descend `schema` along a data path (e.g. `['ssh_keys', 0, 'key']`).
 * Understands `properties`, `patternProperties`, object-form
 * `additionalProperties`, `items` (object and tuple form) and searches
 * `oneOf` / `anyOf` / `allOf` branches. Returns null when the path has no
 * subschema.
 */
export function subschemaAtPath(schema: any, path: (string | number)[]): any | null {
  if (schema == null || typeof schema !== 'object') return null;
  if (path.length === 0) return schema;
  const [head, ...rest] = path;

  const descend = (s: any): any | null => {
    if (s == null || typeof s !== 'object') return null;
    if (typeof head === 'number') {
      if (Array.isArray(s.items)) return subschemaAtPath(s.items[head], rest);
      if (s.items != null) return subschemaAtPath(s.items, rest);
    } else {
      if (s.properties != null && s.properties[head] != null) {
        return subschemaAtPath(s.properties[head], rest);
      }
      if (s.patternProperties != null) {
        for (const [pattern, sub] of Object.entries(s.patternProperties)) {
          try {
            if (new RegExp(pattern).test(head)) return subschemaAtPath(sub, rest);
          } catch {
            // Broken pattern in the schema: skip it.
          }
        }
      }
      if (typeof s.additionalProperties === 'object' && s.additionalProperties != null) {
        return subschemaAtPath(s.additionalProperties, rest);
      }
    }
    for (const comb of ['oneOf', 'anyOf', 'allOf']) {
      if (Array.isArray(s[comb])) {
        for (const branch of s[comb]) {
          const found = descend(branch);
          if (found != null) return found;
        }
      }
    }
    return null;
  };

  return descend(schema);
}

/** Whether `key` is required by the PARENT subschema (if there is one). */
export function isRequiredIn(parentSchema: any, key: string | number): boolean {
  return (
    typeof key === 'string' &&
    parentSchema != null &&
    Array.isArray(parentSchema.required) &&
    parentSchema.required.includes(key)
  );
}

const asCode = (v: unknown): string => '`' + JSON.stringify(v) + '`';

/** The values a schema permits, collected from const/enum and combinator branches. */
function possibleValues(schema: any): string[] {
  const out: string[] = [];
  if (schema.const !== undefined) out.push(asCode(schema.const));
  if (Array.isArray(schema.enum)) out.push(...schema.enum.map(asCode));
  for (const comb of ['oneOf', 'anyOf']) {
    if (Array.isArray(schema[comb])) {
      for (const branch of schema[comb]) {
        if (branch == null || typeof branch !== 'object') continue;
        if (branch.const !== undefined) {
          const label = branch.title ? ` — ${branch.title}` : '';
          out.push(`${asCode(branch.const)}${label}`);
        } else if (Array.isArray(branch.enum)) {
          out.push(...branch.enum.map(asCode));
        }
      }
    }
  }
  return out;
}

/**
 * Markdown help text for a field. `fieldName` is the last path segment (used
 * when the schema has no title); `parentSchema` (optional) provides the
 * required-ness.
 */
export function fieldHelpMarkdown(
  fieldName: string | number,
  schema: any,
  parentSchema?: any,
): string {
  const parts: string[] = [];

  if (schema.description) parts.push(String(schema.description));

  const facts: string[] = [];
  if (schema.type) {
    facts.push(
      `**Type:** ${Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type}` +
        (isRequiredIn(parentSchema, fieldName) ? ' (required)' : ''),
    );
  } else if (isRequiredIn(parentSchema, fieldName)) {
    facts.push('**Required**');
  }
  if (schema.default !== undefined) facts.push(`**Default:** ${asCode(schema.default)}`);
  if (schema.pattern) facts.push(`**Pattern:** \`${schema.pattern}\``);
  if (schema.format) facts.push(`**Format:** \`${schema.format}\``);
  if (facts.length > 0) parts.push(facts.join('\n\n'));

  const values = possibleValues(schema);
  if (values.length > 0) {
    parts.push('**Possible values:**\n\n' + values.map((v) => `- ${v}`).join('\n'));
  }

  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    parts.push('**Examples:**\n\n' + schema.examples.map((e: any) => `- ${asCode(e)}`).join('\n'));
  }

  if (parts.length === 0) {
    return 'The schema has no further information about this field.';
  }
  return parts.join('\n\n');
}

/** The modal title for a field: its schema title, else the field name itself. */
export function fieldHelpTitle(fieldName: string | number, schema: any): string {
  return schema?.title ? String(schema.title) : String(fieldName);
}

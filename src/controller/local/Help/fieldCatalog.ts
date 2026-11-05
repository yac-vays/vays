/* eslint-disable @typescript-eslint/no-explicit-any */
import { typeCheck } from 'type-check';
import { sendRequest } from '../../../utils/authRequest';
import { APIValidateResponse, EntityTypeDecl, TYPE_CHECK_VALIDATE_RESP } from '../../../utils/types/api';
import { YACBackend } from '../../../utils/types/config';
import { joinUrl } from '../../../utils/urlUtils';

export type FieldAccessTier = 'editable' | 'create_only' | 'support_only';

export interface CatalogField {
  /** Dot/bracket path in the YAML configuration (e.g. `users_root`, `ssh_keys[].key`). */
  key: string;
  /** Human-readable field title from the JSON Schema. */
  title: string;
  /** Markdown/text description from the JSON Schema. */
  description: string;
  /** Category tab name from the UI Schema (or `'General'`). */
  category: string;
  /** Group name inside the category from the UI Schema (or `'-'`). */
  group: string;
  /** Formatted data type (e.g. `string`, `boolean`, `array[string]`, `object`). */
  type: string;
  /** Whether the field is required in its parent object. */
  required: boolean;
  /** Formatted default value when specified in the schema. */
  defaultValue?: string;
  /** Allowed enum / oneOf values formatted for display. */
  allowedValues: string[];
  /** Validation constraints (`pattern`, `format`, `min`, `max`, `uniqueItems`, etc.). */
  constraints: string[];
  /** Condition note when a field only appears under specific configuration values (`yac_if`). */
  conditionHint?: string;
  /** Whether the user can edit the field, only set it on creation/action, or must request via support. */
  accessTier: FieldAccessTier;
  /** Human-readable access/restriction badge text. */
  accessLabel: string;
  /** True when the field cannot be freely edited and requires support group assistance. */
  requiresSupportRequest: boolean;
}

interface UiControlMeta {
  category: string;
  group: string;
  options: Record<string, any>;
}

interface ExtractedProperty {
  key: string;
  schema: Record<string, any>;
  required: boolean;
  isConstPin: boolean;
  isUnavailable: boolean;
}

const MAX_EXPANSION_PROBES = 12;

function scopeToPath(scope: unknown): string[] | null {
  if (typeof scope !== 'string') return null;
  const parts = scope.replace(/^#\/?/, '').split('/').filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'properties' && i + 1 < parts.length) {
      out.push(parts[++i]);
    } else {
      out.push(parts[i]);
    }
  }
  return out.length > 0 ? out : null;
}

/**
 * Walk a JSONForms UI Schema and record the Category, Group, and `vays_options`
 * for every Control scope.
 */
export function extractUiControlMap(
  node: any,
  category = 'General',
  group = '-',
  basePath: string[] = [],
  out: Map<string, UiControlMeta> = new Map(),
): Map<string, UiControlMeta> {
  if (node == null || typeof node !== 'object') return out;

  const nextCategory =
    node.type === 'Category' && typeof node.label === 'string' ? node.label : category;
  const nextGroup = node.type === 'Group' && typeof node.label === 'string' ? node.label : group;

  if (node.type === 'Control' && typeof node.scope === 'string') {
    const rel = scopeToPath(node.scope);
    if (rel != null) {
      const fullPath = [...basePath, ...rel];
      const key = fullPath.join('.');
      const options =
        node.options != null && typeof node.options === 'object' ? node.options : {};
      if (!out.has(key)) {
        out.set(key, { category: nextCategory, group: nextGroup, options });
      }
      if (options.detail != null && typeof options.detail === 'object') {
        extractUiControlMap(options.detail, nextCategory, nextGroup, fullPath, out);
      }
      if (options.details?.elements != null && Array.isArray(options.details.elements)) {
        extractUiControlMap(
          { type: 'VerticalLayout', elements: options.details.elements },
          nextCategory,
          nextGroup,
          [...fullPath.slice(0, -1), `${fullPath[fullPath.length - 1]}[]`],
          out,
        );
      }
    }
    return out;
  }

  if (Array.isArray(node.elements)) {
    for (const child of node.elements) {
      extractUiControlMap(child, nextCategory, nextGroup, basePath, out);
    }
  }

  return out;
}

function isConstPinSchema(sub: Record<string, any>): boolean {
  return 'const' in sub && !('type' in sub) && !('title' in sub);
}

function isUnavailableSchema(sub: Record<string, any>, uiMeta?: UiControlMeta): boolean {
  if (uiMeta?.options?.renderer === 'unavailable') return true;
  if (
    sub.not != null &&
    typeof sub.not === 'object' &&
    Object.keys(sub.not).length === 0
  ) {
    return true;
  }
  return false;
}

/**
 * Flatten a Draft-7 JSON Schema into a map of YAML field paths to their schema definitions.
 */
export function flattenJsonSchema(
  schema: any,
  uiMap: Map<string, UiControlMeta>,
  prefix = '',
  out: Map<string, ExtractedProperty> = new Map(),
): Map<string, ExtractedProperty> {
  if (schema == null || typeof schema !== 'object') return out;
  const props = schema.properties;
  if (props == null || typeof props !== 'object') return out;

  const requiredSet = new Set<string>(Array.isArray(schema.required) ? schema.required : []);

  for (const [propName, sub] of Object.entries<any>(props)) {
    if (sub == null || typeof sub !== 'object') continue;
    const path = prefix ? `${prefix}.${propName}` : propName;
    const uiMeta = uiMap.get(path);
    const isConstPin = isConstPinSchema(sub);
    const isUnavailable = isUnavailableSchema(sub, uiMeta);

    out.set(path, {
      key: path,
      schema: sub,
      required: requiredSet.has(propName),
      isConstPin,
      isUnavailable,
    });

    if (sub.type === 'object' || (sub.properties != null && typeof sub.properties === 'object')) {
      flattenJsonSchema(sub, uiMap, path, out);
    } else if (sub.type === 'array' && sub.items != null && typeof sub.items === 'object' && !Array.isArray(sub.items)) {
      const items = sub.items;
      if (items.type === 'object' || (items.properties != null && typeof items.properties === 'object')) {
        flattenJsonSchema(items, uiMap, `${path}[]`, out);
      }
    }
  }

  return out;
}

function formatSchemaType(sub: Record<string, any>): string {
  if (sub.type === 'array') {
    const items = sub.items;
    if (items != null && typeof items === 'object' && !Array.isArray(items) && typeof items.type === 'string') {
      return `array[${items.type}]`;
    }
    return 'array';
  }
  if (Array.isArray(sub.type)) {
    return sub.type.join(' | ');
  }
  if (typeof sub.type === 'string') {
    if (Array.isArray(sub.enum) || Array.isArray(sub.oneOf)) {
      return `${sub.type} (enum)`;
    }
    return sub.type;
  }
  if (Array.isArray(sub.enum) || Array.isArray(sub.oneOf)) {
    return 'enum';
  }
  return 'any';
}

function extractAllowedValues(sub: Record<string, any>): string[] {
  const values: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (val: string) => {
    if (!seen.has(val)) {
      seen.add(val);
      values.push(val);
    }
  };

  const collectFrom = (node: any) => {
    if (node == null || typeof node !== 'object') return;
    if ('const' in node && node.const !== undefined && !isConstPinSchema(node)) {
      const label = typeof node.title === 'string' && node.title !== String(node.const) ? ` (${node.title})` : '';
      pushUnique(`${String(node.const)}${label}`);
    }
    if (Array.isArray(node.enum)) {
      for (const item of node.enum) {
        pushUnique(String(item));
      }
    }
    for (const comb of ['oneOf', 'anyOf'] as const) {
      if (Array.isArray(node[comb])) {
        for (const branch of node[comb]) {
          if (branch != null && typeof branch === 'object') {
            if ('const' in branch && branch.const !== undefined) {
              const label =
                typeof branch.title === 'string' && branch.title !== String(branch.const)
                  ? ` (${branch.title})`
                  : '';
              pushUnique(`${String(branch.const)}${label}`);
            } else if (Array.isArray(branch.enum)) {
              for (const item of branch.enum) {
                pushUnique(String(item));
              }
            }
          }
        }
      }
    }
  };

  collectFrom(sub);
  if (sub.type === 'array' && sub.items != null && typeof sub.items === 'object') {
    collectFrom(sub.items);
  }

  return values;
}

function extractConstraints(sub: Record<string, any>): string[] {
  const constraints: string[] = [];

  const collect = (node: Record<string, any>, prefix = '') => {
    if (typeof node.pattern === 'string') {
      constraints.push(`${prefix}pattern: ${node.pattern}`);
    }
    if (typeof node.format === 'string') {
      constraints.push(`${prefix}format: ${node.format}`);
    }
    if (typeof node.minimum === 'number') {
      constraints.push(`${prefix}min: ${node.minimum}`);
    }
    if (typeof node.maximum === 'number') {
      constraints.push(`${prefix}max: ${node.maximum}`);
    }
    if (typeof node.exclusiveMinimum === 'number') {
      constraints.push(`${prefix}> ${node.exclusiveMinimum}`);
    }
    if (typeof node.exclusiveMaximum === 'number') {
      constraints.push(`${prefix}< ${node.exclusiveMaximum}`);
    }
    if (typeof node.multipleOf === 'number') {
      constraints.push(`${prefix}step: ${node.multipleOf}`);
    }
    if (typeof node.minLength === 'number') {
      constraints.push(`${prefix}minLength: ${node.minLength}`);
    }
    if (typeof node.maxLength === 'number') {
      constraints.push(`${prefix}maxLength: ${node.maxLength}`);
    }
    if (typeof node.minItems === 'number') {
      constraints.push(`${prefix}minItems: ${node.minItems}`);
    }
    if (typeof node.maxItems === 'number') {
      constraints.push(`${prefix}maxItems: ${node.maxItems}`);
    }
    if (node.uniqueItems === true) {
      constraints.push(`${prefix}uniqueItems: true`);
    }
  };

  collect(sub);
  if (
    sub.type === 'array' &&
    sub.items != null &&
    typeof sub.items === 'object' &&
    !Array.isArray(sub.items)
  ) {
    collect(sub.items, 'item ');
  }

  return constraints;
}

function rawChoiceValues(sub: Record<string, any>): unknown[] {
  if (Array.isArray(sub.enum)) return sub.enum;
  if (Array.isArray(sub.oneOf)) {
    return sub.oneOf
      .filter((b: any) => b != null && typeof b === 'object' && 'const' in b)
      .map((b: any) => b.const);
  }
  return [];
}

/**
 * Build synthetic data objects from discovered boolean and enum/oneOf fields
 * to trigger conditional `yac_if` branches during `operation: "read"` probes.
 */
function buildExpansionProbes(baseSchema: any): { label: string; data: Record<string, unknown> }[] {
  const props = baseSchema?.properties;
  if (props == null || typeof props !== 'object') return [];

  const boolTrueData: Record<string, unknown> = {};
  const boolFlippedDefaults: Record<string, unknown> = {};
  const choiceFields: { key: string; values: unknown[] }[] = [];

  for (const [key, sub] of Object.entries<any>(props)) {
    if (sub == null || typeof sub !== 'object' || isConstPinSchema(sub)) continue;
    if (sub.type === 'boolean') {
      boolTrueData[key] = true;
      if (sub.default === true) {
        boolFlippedDefaults[key] = false;
      }
    } else if (sub.type === 'string' || Array.isArray(sub.enum) || Array.isArray(sub.oneOf)) {
      const choices = rawChoiceValues(sub);
      if (choices.length > 0 && choices.length <= 12) {
        choiceFields.push({ key, values: choices });
      }
    }
  }

  const probes: { label: string; data: Record<string, unknown> }[] = [];

  if (Object.keys(boolTrueData).length > 0) {
    probes.push({
      label: 'when optional features are enabled',
      data: { ...boolTrueData },
    });
  }

  if (Object.keys(boolFlippedDefaults).length > 0) {
    probes.push({
      label: `when ${Object.keys(boolFlippedDefaults)
        .map((k) => `${k}=false`)
        .join(', ')}`,
      data: { ...boolTrueData, ...boolFlippedDefaults },
    });
  }

  for (const cf of choiceFields) {
    for (const val of cf.values) {
      if (probes.length >= MAX_EXPANSION_PROBES) break;
      probes.push({
        label: `when ${cf.key}=${String(val)}`,
        data: { ...boolTrueData, [cf.key]: val },
      });
    }
    if (probes.length >= MAX_EXPANSION_PROBES) break;
  }

  return probes;
}

async function callValidateSilent(
  backendUrl: string,
  payload: Record<string, unknown>,
): Promise<APIValidateResponse | null> {
  const resp = await sendRequest(joinUrl(backendUrl, '/validate'), 'POST', JSON.stringify(payload));
  if (resp == null || resp.status < 200 || resp.status >= 300) {
    return null;
  }
  try {
    const json: unknown = await resp.json();
    if (typeCheck(TYPE_CHECK_VALIDATE_RESP, json)) {
      return json as APIValidateResponse;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Discover all configuration fields and classify their editability/support restrictions
 * for a given YAC backend and entity type.
 */
export async function discoverEntityFields(
  backend: YACBackend,
  entityType: EntityTypeDecl,
): Promise<CatalogField[]> {
  if (!backend.url) return [];

  const exampleName = entityType.name_example || 'example-entity';
  const allActionNames = (entityType.actions ?? []).map((a) => a.name);

  // 1. Base read probe (with actions so action-gated fields are included)
  let baseReadResp = await callValidateSilent(backend.url, {
    operation: 'read',
    type: entityType.name,
    name: null,
    actions: allActionNames,
    entity: { name: exampleName, data: {} },
  });

  if (baseReadResp == null) {
    baseReadResp = await callValidateSilent(backend.url, {
      operation: 'read',
      type: entityType.name,
      name: null,
      actions: [],
      entity: null,
    });
  }

  if (baseReadResp == null) return [];

  const uiMap = extractUiControlMap(baseReadResp.schemas.ui_schema);
  const baseReadFields = flattenJsonSchema(baseReadResp.schemas.json_schema, uiMap);
  const masterReadFields = new Map<string, ExtractedProperty>(baseReadFields);
  const conditionHints = new Map<string, string>();

  // 2. Conditional yac_if expansion probes in parallel
  const expansionProbes = buildExpansionProbes(baseReadResp.schemas.json_schema);
  const combinedProbeData: Record<string, unknown> = {};
  for (const p of expansionProbes) {
    Object.assign(combinedProbeData, p.data);
  }

  if (expansionProbes.length > 0) {
    const expansionResults = await Promise.all(
      expansionProbes.map(async (probe) => ({
        label: probe.label,
        resp: await callValidateSilent(backend.url, {
          operation: 'read',
          type: entityType.name,
          name: null,
          actions: allActionNames,
          entity: { name: exampleName, data: probe.data },
        }),
      })),
    );

    const secondPassBooleans: Record<string, unknown> = {};

    for (const { label, resp } of expansionResults) {
      if (resp == null) continue;
      extractUiControlMap(resp.schemas.ui_schema, 'General', '-', [], uiMap);
      const flat = flattenJsonSchema(resp.schemas.json_schema, uiMap);
      for (const [k, prop] of flat.entries()) {
        if (!masterReadFields.has(k)) {
          masterReadFields.set(k, prop);
          conditionHints.set(k, label);
          if (prop.schema.type === 'boolean') {
            secondPassBooleans[k] = true;
          }
        } else {
          const existing = masterReadFields.get(k);
          // Upgrade const-pin or unavailable entry if a richer definition was found
          if (existing && (existing.isConstPin || existing.isUnavailable) && !prop.isConstPin && !prop.isUnavailable) {
            masterReadFields.set(k, prop);
          } else if (existing && !prop.isConstPin) {
            // Merge any newly discovered enum/oneOf choices
            const existingChoices = extractAllowedValues(existing.schema);
            const newChoices = extractAllowedValues(prop.schema);
            if (newChoices.length > existingChoices.length) {
              masterReadFields.set(k, prop);
            }
          }
        }
      }
    }

    // If newly unlocked boolean flags were found (e.g. packages_snap -> packages_snap_present),
    // run one follow-up read probe with those booleans enabled as well.
    if (Object.keys(secondPassBooleans).length > 0) {
      Object.assign(combinedProbeData, secondPassBooleans);
      const followUpResp = await callValidateSilent(backend.url, {
        operation: 'read',
        type: entityType.name,
        name: null,
        actions: allActionNames,
        entity: { name: exampleName, data: combinedProbeData },
      });
      if (followUpResp != null) {
        extractUiControlMap(followUpResp.schemas.ui_schema, 'General', '-', [], uiMap);
        const flat = flattenJsonSchema(followUpResp.schemas.json_schema, uiMap);
        for (const [k, prop] of flat.entries()) {
          if (!masterReadFields.has(k)) {
            masterReadFields.set(k, prop);
            conditionHints.set(k, 'when dependent option is enabled');
          }
        }
      }
    }
  }

  // 3. Compare with `create` and `edit` (without install/special actions) to classify restrictions
  const [createBaseResp, createExpandedResp, editBaseResp, editExpandedResp] = await Promise.all([
    entityType.create
      ? callValidateSilent(backend.url, {
          operation: 'create',
          type: entityType.name,
          name: null,
          actions: [],
          entity: { name: exampleName, data: {} },
        })
      : Promise.resolve(null),
    entityType.create && Object.keys(combinedProbeData).length > 0
      ? callValidateSilent(backend.url, {
          operation: 'create',
          type: entityType.name,
          name: null,
          actions: [],
          entity: { name: exampleName, data: combinedProbeData },
        })
      : Promise.resolve(null),
    entityType.edit
      ? callValidateSilent(backend.url, {
          operation: 'edit',
          type: entityType.name,
          name: exampleName,
          actions: [],
          entity: { name: exampleName, data: {} },
        })
      : Promise.resolve(null),
    entityType.edit && Object.keys(combinedProbeData).length > 0
      ? callValidateSilent(backend.url, {
          operation: 'edit',
          type: entityType.name,
          name: exampleName,
          actions: [],
          entity: { name: exampleName, data: combinedProbeData },
        })
      : Promise.resolve(null),
  ]);

  const activeInCreate = new Set<string>();
  const activeInEdit = new Set<string>();

  for (const resp of [createBaseResp, createExpandedResp]) {
    if (resp == null) continue;
    const localUi = extractUiControlMap(resp.schemas.ui_schema);
    const flat = flattenJsonSchema(resp.schemas.json_schema, localUi);
    for (const [k, prop] of flat.entries()) {
      if (!prop.isConstPin && !prop.isUnavailable) {
        activeInCreate.add(k);
      }
    }
  }

  for (const resp of [editBaseResp, editExpandedResp]) {
    if (resp == null) continue;
    const localUi = extractUiControlMap(resp.schemas.ui_schema);
    const flat = flattenJsonSchema(resp.schemas.json_schema, localUi);
    for (const [k, prop] of flat.entries()) {
      if (!prop.isConstPin && !prop.isUnavailable) {
        activeInEdit.add(k);
      }
    }
  }

  // If neither create nor edit returned any fields (e.g. when edit on a synthetic
  // entity name is rejected before schema diffing), check whether create had fields.
  const hasCreateComparison = activeInCreate.size > 0;
  const hasEditComparison = activeInEdit.size > 0;

  // 4. Build CatalogField list
  const catalog: CatalogField[] = [];

  for (const [key, prop] of masterReadFields.entries()) {
    const sub = prop.schema;
    const uiMeta = uiMap.get(key);

    // Skip pure info_box display nodes that carry no data (`not: {}` + `renderer: 'info_box'`)
    if (uiMeta?.options?.renderer === 'info_box') {
      continue;
    }

    let accessTier: FieldAccessTier = 'editable';
    let accessLabel = 'Editable by user';

    if (!entityType.create && !entityType.edit) {
      accessTier = 'support_only';
      accessLabel = 'Read-only entity type — Request via Support Group';
    } else if (prop.isUnavailable || prop.isConstPin) {
      accessTier = 'support_only';
      accessLabel = 'Request via Support Group (restricted)';
    } else if (hasCreateComparison || hasEditComparison) {
      const inCreate = activeInCreate.has(key);
      const inEdit = activeInEdit.has(key);

      if (!inCreate && !inEdit) {
        accessTier = 'support_only';
        accessLabel = 'Request via Support Group (restricted)';
      } else if (inCreate && hasEditComparison && !inEdit) {
        accessTier = 'create_only';
        accessLabel = 'Locked on edit — Request via Support Group / Reinstall';
      }
    }

    const leafName = key.split('.').pop()?.replace(/\[\]$/, '') ?? key;
    const title = typeof sub.title === 'string' && sub.title.trim() !== '' ? sub.title : leafName;
    const description = typeof sub.description === 'string' ? sub.description.trim() : '';

    // Inherit category/group from parent path if nested property has no direct top-level Category entry
    const topLevelKey = key.split('.')[0].replace(/\[\]$/, '');
    const effectiveUiMeta = uiMeta ?? uiMap.get(topLevelKey);

    const defaultValue =
      sub.default !== undefined ? JSON.stringify(sub.default) : undefined;

    catalog.push({
      key,
      title,
      description,
      category: effectiveUiMeta?.category ?? 'General',
      group: effectiveUiMeta?.group ?? '-',
      type: formatSchemaType(sub),
      required: prop.required,
      ...(defaultValue !== undefined ? { defaultValue } : {}),
      allowedValues: extractAllowedValues(sub),
      constraints: extractConstraints(sub),
      ...(conditionHints.has(key) ? { conditionHint: conditionHints.get(key) } : {}),
      accessTier,
      accessLabel,
      requiresSupportRequest: accessTier !== 'editable',
    });
  }

  return catalog;
}

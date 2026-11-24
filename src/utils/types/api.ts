/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Contains all type definitions from the API and also the type check versions for
 * these types (runtime checking). Please note that the type_check ones are
 * indeed necessary to be specified seperately. The reason is that the typescript types are
 * stripped away at compile time, thus they cannot be used for runtime typwe checking of the IO.
 *
 * Every object pattern ends with `...` (further keys allowed), so a newer YAC
 * that sends additional fields still works with this VAYS.
 */
import { JsonSchema } from '@jsonforms/core';
import { Nullable } from './typeUtils';

export type APIOperation = 'create' | 'edit' | 'delete';

/**
 * One `limits` rule's computed usage for the current operation, as returned
 * by the backend in the `/validate` response. `used` already includes the
 * entity being created/changed (see the YAC `limits` docs).
 */
export const TYPE_CHECK_LIMIT_USAGE =
  '{title: String, used: Number, max: Number, ok: Boolean, path: Maybe String, ...}';

export interface LimitUsage {
  title: string;
  used: number;
  max: number;
  ok: boolean;
  /** Data-loc of the entity-data property this limit relates to (a UI hint
   * from the limit spec, in YAC's usual `#/key/subkey` syntax like
   * `data_loc`); null/absent when the limit is not tied to a field. */
  path?: Nullable<string>;
}

export const TYPE_CHECK_VALIDATE_RESP = `{
  schemas: {
    json_schema: Object,
    ui_schema: {
        type: Maybe String,
        elements: Maybe *,
      ...
    },
    data: Object,
    valid: Boolean,
    message: Maybe String,
    validator: Maybe String,
    json_schema_loc: Maybe String,
    data_loc: Maybe String,
    yaml: Maybe String,
    ...
  },
  request: {
    valid: Boolean,
    message: Maybe String,
    ...
  },
  usages: Maybe [${TYPE_CHECK_LIMIT_USAGE}],
  perms: Maybe [String],
  ...
}`;

export interface APIValidateResponse {
  schemas: {
    json_schema: JsonSchema;
    /**
     * Empty (`{}`) when no field of the type has a `vays_category`: the type
     * has no form fields (see `normalizeUiSchema`).
     */
    ui_schema: {
      type?: string;
      elements?: {
        type: string;
        label: string;
        elements: any[];
      }[];
    };

    data: { [key: string]: any };
    valid: boolean;
    message?: string;
    // which component has failed (format, required, ...)
    validator?: string;
    json_schema_loc?: string;
    data_loc?: string;
    /** Canonical (ruamel-normalized) YAML for `data`, comments preserved. */
    yaml?: string;
  };

  request: {
    valid: boolean;
    message?: string;
  };

  usages?: LimitUsage[];

  /** The user's (expanded) permissions for this entity (e.g. offers "adm"). */
  perms?: string[];
}

export enum NameGeneratedCond {
  never = 'never',
  optional = 'optional',
  enforced = 'enforced',
}

export const TYPE_CHECK_ACTION_DECL =
  '{name: String, title: String, description: String, dangerous: Boolean, icon: String, ' +
  'perms: [String], force: Boolean, hooks: [String], ...}';

export interface ActionDecl {
  name: string;
  title: string;
  description: string;
  dangerous: boolean;
  icon: string;
  perms: (Permission | string)[];
  force: boolean;
  hooks: string[];
}

export const TYPE_CHECK_LINK_DECL = '{name: String, title: String, icon: String, ...}';

/**
 * An external link of an entity type; the per-entity URL comes with the
 * entity ({@link EntityObject.links}).
 */
export interface LinkDecl {
  name: string;
  title: string;
  /** SVG image, rendered like an action icon. */
  icon: string;
}

export const TYPE_CHECK_FAVOP_OBJECT = '{name: String, action: Boolean, ...}';

export interface FavOpObject {
  name: string;
  action: boolean;
}

export const TYPE_CHECK_LOG_DECL =
  '{name: String, title: String, description: String, renderer: String, options: Object, ...}';

/**
 * A log of an entity type, as declared in the YAC specs. Which UI renderer
 * shows it (`renderer`) is independent of where YAC gets the entries from.
 */
export interface LogDecl {
  name: string;
  title: string;
  /** Markdown description shown in the log details below the title. */
  description: string;
  /** The log renderer, see `view/components/EntityList/Logs/renderers`. */
  renderer: string;
  /** Renderer-specific options from the specs. */
  options: Record<string, unknown>;
}

export const TYPE_CHECK_ENTITY_TYPE_DECL = `{
  name: String,
  title: String,
  name_pattern: String,
  name_example: String,
  name_generated: String,
  description: String,
  create: Boolean,
  delete: Boolean,
  edit: Boolean,
  options: [Object],
  logs: [${TYPE_CHECK_LOG_DECL}],
  links: Maybe [${TYPE_CHECK_LINK_DECL}],
  actions: [${TYPE_CHECK_ACTION_DECL}],
  favorites: [${TYPE_CHECK_FAVOP_OBJECT}],
  ...
}`;

/**
 * Entity Type definition, as it is returned by the YAC backend.
 */
export interface EntityTypeDecl {
  name: string;
  title: string;
  name_pattern: string; // TODO: RegExp
  name_example: string;
  name_generated: NameGeneratedCond;
  description: string;
  create: boolean;
  edit: boolean;
  delete: boolean;
  options: {
    title: string;
    name: string;
    default?: string;
    aliases: { [key: string]: string };
  }[];
  logs: LogDecl[];
  /** Missing on YAC versions before `links` were introduced. */
  links?: LinkDecl[];
  actions: ActionDecl[];
  favorites: FavOpObject[];
}

export type Permission =
  'see' | 'add' | 'rnm' | 'cpy' | 'lnk' | 'edt' | 'cln' | 'del' | 'act' | 'adm';

export const TYPE_CHECK_ENTITY_OBJECT =
  '{name: String, link: String | Null, options: Object, links: Maybe Object, perms: [String], ...}';

export interface EntityObject {
  name: string;
  link: Nullable<string>;
  /**
   * The per-entity values of the type's `options` columns, keyed by option
   * name. Values come straight from the YAML, so they may be of any scalar
   * or list type (or missing).
   */
  options: Record<string, unknown>;
  /**
   * The rendered URLs of the type's `links`, keyed by link name. Links that
   * do not apply to this entity are missing (as is the whole field on YAC
   * versions before `links` were introduced).
   */
  links?: Record<string, string>;
  perms: string[];
}

export const TYPE_CHECK_ENTITY_LOG =
  '{name: String, message: String, time: String, progress: Null | Number, problem: Null | Boolean, has_content: Boolean, ...}';

export type EntityLog = {
  name: string;
  message: string;
  time: string;
  /** 0 to 100, or null if the log does not report a progress. */
  progress: Nullable<number>;
  /** Whether the entry indicates a problem, or null if not reported. */
  problem: Nullable<boolean>;
  /** Whether the log has a content document (see {@link EntityLogContent}). */
  has_content: boolean;
};

export const TYPE_CHECK_ENTITY_LOG_CONTENT = '{name: String, time: String, content: String, ...}';

/** The content document of a log, fetched on demand (it may be big). */
export type EntityLogContent = {
  name: string;
  /** Timestamp of the document, may be empty. */
  time: string;
  content: string;
};

export const TYPE_CHECK_ENTITY_DATA = `{
  name: String,
  link: String | Null,
  options: Object,
  links: Maybe Object,
  perms: [String],
  data: Object,
  yaml: Maybe String,
  hash: Maybe String,
  ...
}`;

export interface EntityData {
  name: string;
  link: Nullable<string>;
  options: object;
  /** See {@link EntityObject.links}. */
  links?: Record<string, string>;
  perms: string[];
  data: { [key: string]: any };
  /** Null in the API for an entity without a file; read as ''. */
  yaml: string;
  hash?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Contains all type definitions from the API and also the type check versions for
 * these types (runtime checking). Please note that the type_check ones are
 * indeed necessary to be specified seperately. The reason is that the typescript types are
 * stripped away at compile time, thus they cannot be used for runtime typwe checking of the IO.
 */
import { JsonSchema } from '@jsonforms/core';
import { Nullable, SafeSource } from './typeUtils';

export type APIOperation = 'create' | 'change' | 'delete';

export const TYPE_CHECK_VALIDATE_RESP = `{
  schemas: {
    json_schema: Object,
    ui_schema: {
        type: String,
        elements: *,
    },
    data: Object,
    valid: Boolean,
    message: Maybe String,
    validator: Maybe String,
    json_schema_loc: Maybe String,
    data_loc: Maybe String,
  },
  request: {
    valid: Boolean,
    message: Maybe String
  }
}`;

export interface APIValidateResponse {
  schemas: {
    json_schema: JsonSchema;
    ui_schema: {
      type: string;
      elements: {
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
  };

  request: {
    valid: boolean;
    message?: string;
  };
}

export enum NameGeneratedCond {
  never = 'never',
  optional = 'optional',
  enforced = 'enforced',
}

export const TYPE_CHECK_ACTION_DECL =
  '{name: String, title: String, description: String, dangerous: Boolean, icon: String, ' +
  'perms: [String], force: Boolean, hooks: [String]}';

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

export const TYPE_CHECK_FAVOP_OBJECT = '{name: String, action: Boolean}';

export interface FavOpObject {
  name: string;
  action: boolean;
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
  change: Boolean,
  options: [Object],
  logs: [{name: String, title: String, progress: Boolean, problem: Boolean}],
  actions: [${TYPE_CHECK_ACTION_DECL}],
  favorites: [${TYPE_CHECK_FAVOP_OBJECT}]
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
  description: SafeSource<string>;
  create: boolean;
  delete: boolean;
  options: {
    title: string;
    name: string;
    default?: string;
    aliases: { [key: string]: SafeSource<string> };
  }[];
  logs: {
    name: string;
    title: string;
    progress: boolean;
    problem: boolean;
  }[];
  actions: ActionDecl[];
  favorites: FavOpObject[];
}

export type Permission =
  | 'see'
  | 'add'
  | 'rnm'
  | 'cpy'
  | 'lnk'
  | 'edt'
  | 'mod'
  | 'cln'
  | 'del'
  | 'act'
  | 'adm';

export const TYPE_CHECK_ENTITY_OBJECT =
  '{name: String, link: String | Null, options: Object, perms: [String]}';

export interface EntityObject {
  name: string;
  link: Nullable<string>;
  options: object;
  perms: string[];
}

export const TYPE_CHECK_ENTITY_LOG =
  '{name: String, message: String, time: String, progress: Null | Number, problem: Null | Boolean}';

export type EntityLog = {
  name: string;
  message: string;
  time: string;
  progress: Nullable<number>;
  problem: Nullable<boolean>;
};

export const TYPE_CHECK_ENTITY_DATA = `{
  name: String,
  link: String | Null,
  options: Object,
  perms: [String],
  data: Object,
  yaml: String,
  hash: Maybe String
}`;

export interface EntityData {
  name: string;
  link: Nullable<string>;
  options: object;
  perms: string[];
  data: { [key: string]: any };
  yaml: string;
}

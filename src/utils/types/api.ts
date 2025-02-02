import { JsonSchema } from "@jsonforms/core";
import { Nullable } from "./typeUtils";


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

    data: { [key: string]: any; };
    valid: boolean;
    message?: string;
    // which component has failed (format, required, ...)
    validator: string;
    json_schema_loc: string;
    doc_loc: string;
  };

  request: {
    valid: boolean;
    message?: string;
  };
}export interface EntityData {
  name: string;
  link: string;
  options: any;
  perms: string[];
  logs: any[];
  data: any;
  yaml: string;
}
export enum NameGeneratedCond {
  never = 'never',
  optional = 'optional',
  enforced = 'enforced'
}
/**
 * Entity Type definition, as it is returned by the YAC backend.
 */

export interface EntityTypeDecl {
  name: string;
  title: string;
  name_pattern: string; // TODO: RegExp
  name_example: string;
  name_generated: NameGeneratedCond;
  example: string;
  description: string;
  create: boolean;
  delete: boolean;
  options: object[]; // TODO: Besseres Typing
  logs: {
    name: string;
    title: string;
    progress: boolean;
    problem: boolean;
  }[];
  actions: ActionDecl[];
  favorites: FavOpObject[];
}

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

export type Permission = 'see' |
  'add' |
  'rnm' |
  'cpy' |
  'lnk' |
  'edt' |
  'mod' |
  'cln' |
  'del' |
  'act' |
  'adm';

export interface EntityObject {
  name: string;
  link: Nullable<string>;
  options: object;
  perms: string[];
}

export interface FavOpObject {
  name: string;
  action: boolean;
}
export type EntityLog = {
  name: string;
  message: string;
  time: string;
  progress: Nullable<number>;
  problem: Nullable<boolean>;
};


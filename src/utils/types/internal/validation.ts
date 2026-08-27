import { JsonSchema } from "@jsonforms/core";
import { LimitUsage } from "../api";


export type ValidateResponse = {
  json_schema: JsonSchema;
  // json_schema : {
  //     //type : string,
  //     required : string[],
  //     properties : any,
  //     [key: string] : any
  // };
  ui_schema: {
    type: string;
    elements: {
      type: string;
      label: string;
      elements: unknown[];
    }[];
  };
  data: { [key: string]: unknown; };
  valid: boolean;
  detail: string;
  usages?: LimitUsage[];
  yaml?: string;
  /**
   * Location of a schema-validation error inside the data, as reported by YAC
   * (e.g. `#/users_root`). Only set when the failure is a schema error that has
   * a concrete location (not for request-level errors such as perms/limits).
   * Used to surface the error on the matching form control instead of (only)
   * the footer status bar.
   */
  data_loc?: string;
  /** Location of the same error inside the JSON schema (e.g. `#/properties/users_root/type`). */
  json_schema_loc?: string;
};

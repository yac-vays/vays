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
      elements: any[];
    }[];
  };
  data: { [key: string]: any; };
  valid: boolean;
  detail: string;
  usages?: LimitUsage[];
  yaml?: string;
};

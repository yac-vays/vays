/* eslint-disable @typescript-eslint/no-explicit-any */
import { isTriggable } from '../actionUtils';
import { ActionDecl } from '../types/api';
import { RequestContext, RequestEditContext } from '../types/internal/request';
import { ValidateResponse } from '../types/internal/validation';
import { injectControls, injectGeneralUICategory } from './injectName';

const INJECTED_ACTION_BASENAME = 'action39242yiwqj3enionsoiufn3i4d2q';
const SEP = '$$$';

function getActionName(actionName: string, idx: number): string {
  return INJECTED_ACTION_BASENAME + SEP + idx.toString() + SEP + actionName;
}

function uiActionControl(actionName: string, idx: number) {
  return {
    type: 'Control',
    scope: `#/properties/${getActionName(actionName, idx)}`,
  };
}

export function injectAction(valResp: ValidateResponse, requestContext: RequestEditContext) {
  const actions: ActionDecl[] | undefined = requestContext.rc.accessedEntityType?.actions.filter(
    (v) => isTriggable('change', v),
  );
  if (!actions) return valResp;

  valResp = structuredClone(valResp);
  injectGeneralUICategory(valResp);

  const uielts = actions.map((act, idx) => uiActionControl(act.name, idx));
  injectControls(valResp, uielts);

  if (valResp.json_schema.properties == undefined) {
    valResp.json_schema.properties = {};
  }

  actions.forEach((act, idx) => {
    //@ts-expect-error For some reason, the linter does not understand the line above and says, properties may be undefined.
    valResp.json_schema.properties[getActionName(act.name, idx)] = {
      title: act.title,
      type: 'boolean',
    };
  });

  return valResp;
}

export type EditActionSnapshot = { [key: string]: { action: ActionDecl; dataEntryValue: boolean } };

export function popActions(data: any, requestContext: RequestContext): EditActionSnapshot {
  const values: EditActionSnapshot = {};

  for (const key of Object.keys(data)) {
    if (key.startsWith(INJECTED_ACTION_BASENAME)) {
      const actionName = key.split(SEP)[2];
      const act = requestContext.accessedEntityType?.actions.find((v) => v.name === actionName);
      if (!act) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete data[key];
        continue;
      }
      values[key] = { action: act, dataEntryValue: data[key] };
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete data[key];
    }
  }

  return values;
}

export function insertActionData(valResp: ValidateResponse, actions: EditActionSnapshot) {
  for (const act of Object.keys(actions)) {
    valResp.data[act] = actions[act].dataEntryValue;
  }
  return valResp;
}

export function dumpEditActions(actions: EditActionSnapshot): string[] {
  const selectedActions = Object.keys(actions)
    .map((actEntry) => {
      if (actions[actEntry].dataEntryValue) {
        return actions[actEntry].action.name;
      }
      return undefined;
    })
    .filter((v) => v !== undefined);

  return selectedActions;
}

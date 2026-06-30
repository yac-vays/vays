import { isNameGeneratedByYAC } from './nameUtils';
import { RequestEditContext } from './types/internal/request';
import { Nullable } from './types/typeUtils';

export function stringifyEntityInfoForAPI(
  requestEditContext: RequestEditContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any = {},
  name: Nullable<string> = null,
  actions: string[] = [],
  yaml_new?: string,
  yaml_old?: string,
  // The YAML the form's `data` patch should be merged into (the content the user
  // is currently editing). Lets the backend preserve its comments / formatting
  // instead of regenerating the YAML from the data. Only used by the form path.
  yamlBase?: string,
): string {
  if (
    requestEditContext.mode === 'create' &&
    isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)
  ) {
    name = null;
  } else if (isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) {
    name = requestEditContext.entityName ?? null;
  }
  // The request shape follows the supplied payload: the form (`validate`, data)
  // and the YAML editor (`validateYAML`, yaml_new) both validate against the same
  // context. `validateYAML` always passes `yaml_new`; `validate` never does.
  if (yaml_new !== undefined) {
    return getEntityObjectExpertMode(requestEditContext, name, actions, yaml_new, yaml_old);
  } else {
    return getEntityObjectStdMode(requestEditContext, data, name, actions, yamlBase);
  }
}

function getEntityObjectExpertMode(
  requestEditContext: RequestEditContext,
  name: Nullable<string>,
  actions: string[],
  yaml_new?: string,
  yaml_old?: string,
): string {
  // YAML editor (Expert mode)
  if (requestEditContext.mode === 'edit') {
    return JSON.stringify({
      operation: 'edit',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: requestEditContext.entityName ?? null,
      entity: {
        name: name,
        yaml_new: yaml_new ?? '',
        yaml_old: yaml_old ?? '',
      },
    });
  } else {
    return JSON.stringify({
      operation: 'create',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: null,
      entity: {
        name: name,
        yaml: yaml_new ?? '',
      },
    });
  }
}

function getEntityObjectStdMode(
  requestEditContext: RequestEditContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any = {},
  name: Nullable<string> = null,
  actions: string[] = [],
  yamlBase?: string,
): string {
  // Both create and change send an `UpdateEntity` (data patch). `yaml_base`, when
  // present, is the YAML the patch is merged into so the backend preserves the
  // editor's comments/formatting (see `UpdateEntity.yaml_base` on the backend).
  const base = yamlBase !== undefined ? { yaml_base: yamlBase } : {};

  if (requestEditContext.mode === 'create') {
    return JSON.stringify({
      operation: 'create',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: null,
      entity: { name: name, data: data, ...base },
    });
  } else if (requestEditContext.mode === 'edit') {
    return JSON.stringify({
      operation: 'edit',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: requestEditContext.entityName ?? null,
      entity: { name: name, data: data, ...base },
    });
  }

  return JSON.stringify({
    operation: 'read',
    type: requestEditContext.rc.entityTypeName,
    actions: actions,
    name: requestEditContext.entityName ?? null,
    entity: null,
  });
}

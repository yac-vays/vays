import { isNameGeneratedByYAC } from './nameUtils';
import { RequestEditContext } from './types/internal/request';
import { Nullable } from './types/typeUtils';

export function getEntityObject(
  requestEditContext: RequestEditContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any = {},
  name: Nullable<string> = null,
  actions: string[] = [],
  yaml_new?: string,
  yaml_old?: string,
) {
  if (
    requestEditContext.mode === 'create' &&
    isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)
  ) {
    name = null;
  } else if (isNameGeneratedByYAC(requestEditContext.rc.accessedEntityType)) {
    name = requestEditContext.entityName ?? null;
  }
  if (requestEditContext.viewMode === 'expert') {
    // YAML editor (Expert mode)
    if (requestEditContext.mode === 'change') {
      return JSON.stringify({
        operation: 'change',
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
  } else if (requestEditContext.mode === 'create') {
    // CreateEntity
    return JSON.stringify({
      operation: 'create',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: null,
      entity: {
        name: name,
        yaml: JSON.stringify(data),
      },
    });
  } else if (requestEditContext.mode === 'change') {
    return JSON.stringify({
      operation: 'change',
      type: requestEditContext.rc.entityTypeName,
      actions: actions,
      name: requestEditContext.entityName ?? null,
      entity: {
        name: name,
        data: data,
      },
    });
  }
}

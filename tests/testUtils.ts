import { NameGeneratedCond } from '../src/utils/types/api';
import { RequestEditContext } from '../src/utils/types/internal/request';

export function getTestEditRequestContext(
  yacURL: string,
  backendName: string,
  entityName: string,
  entityTypeName: string,
  mode: 'create' | 'change',
  viewmode: 'standard' | 'expert',
): RequestEditContext {
  const t = {
    name: entityTypeName,
    title: 'test',
    name_pattern: '.*',
    name_example: '',
    name_generated: NameGeneratedCond.never,
    description: '',
    create: false,
    delete: false,
    options: [],
    logs: [],
    actions: [],
    favorites: [],
  };
  return {
    entityName: entityName,
    mode: mode,
    rc: {
      yacURL: yacURL,
      entityTypeName: entityTypeName,
      accessedEntityType: t,
      backendObject: { url: yacURL, name: backendName, title: 'Test', icon: '' },
      entityTypeList: [t],
    },
    viewMode: viewmode,
  };
}

export function createFetchResponse(data: object) {
  return { json: () => new Promise((resolve) => resolve(data)), status: 200 };
}

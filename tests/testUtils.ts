import { ActionDecl, FavOpObject, NameGeneratedCond } from '../src/utils/types/api';
import { RequestEditContext } from '../src/utils/types/internal/request';

export function getTestEditRequestContext(
  yacURL: string,
  backendName: string,
  entityName: string | null,
  entityTypeName: string,
  mode: 'create' | 'change',
  viewmode: 'standard' | 'expert',
  favorites: FavOpObject[] = [
    { name: 'change', action: false },
    { name: 'act', action: true },
  ],
  actions: ActionDecl[] = [
    {
      name: 'change',
      title: '',
      description: '',
      dangerous: false,
      icon: '',
      perms: ['mod'],
      hooks: [],
      force: false,
    },
    {
      name: 'act',
      title: '',
      description: '',
      dangerous: true,
      icon: '',
      perms: ['act'],
      hooks: [],
      force: false,
    },
  ],
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
    actions: actions,
    favorites: favorites,
  };
  return {
    entityName: entityName == null ? undefined : entityName,
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
  const a = { json: () => new Promise((resolve) => resolve(data)), status: 200, clone: () => {} };
  a.clone = () => {
    a.clone = () => a;
    return a;
  };
  return a;
}

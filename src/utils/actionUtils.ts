import { ActionDecl } from './types/api';

export function isTriggable(ctx: 'create' | 'change' | 'delete', act: ActionDecl) {
  let hasHook = false;
  for (let hook of act.hooks) {
    if (hook.startsWith(ctx)) {
      hasHook = true;
      break;
    }
  }
  return !act.force && hasHook; //
}

export function actions2URLQuery(actions: ActionDecl[]): string {
  if (actions.length == 0) return '';

  return '?' + actions.map((v) => `run=${v.name}`).join('&');
}

export function actionNames2URLQuery(actions: string[]): string {
  if (actions.length == 0) return '';

  return '?' + actions.map((v) => `run=${v}`).join('&');
}

import { ActionDecl } from './types/api';

export function getTriggerableActions(acts: ActionDecl[], ctx: 'create' | 'change' | 'delete') {
  return acts.filter((v) => isTriggable(ctx, v));
}

/**
 * Return whether this function can be triggered manually by the user in some context.
 * @param ctx
 * @param act
 * @returns
 */
export function isTriggable(ctx: 'create' | 'change' | 'delete', act: ActionDecl) {
  let hasHook = false;
  for (const hook of act.hooks) {
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

export function getActionNames(actions: ActionDecl[]): string[] {
  return actions.map((v) => v.name);
}

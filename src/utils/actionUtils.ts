import { ActionDecl } from './types/api';

export function getTriggerableActions(
  acts: ActionDecl[],
  ctx: 'read' | 'create' | 'edit' | 'delete',
) {
  if (ctx === 'read') return [];
  return acts.filter((v) => isTriggable(ctx, v));
}

/**
 * Return whether this function can be triggered manually by the user in some context.
 * @param ctx
 * @param act
 * @returns
 */
export function isTriggable(ctx: 'create' | 'edit' | 'delete', act: ActionDecl) {
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
  return commitURLQuery(actions, false);
}

/**
 * Query string for a write request: the selected actions plus, when the admin
 * override is unlocked, the `force` flag (commit past a failing schema
 * validation; requires the "adm" permission, which YAC enforces).
 */
export function commitURLQuery(actions: ActionDecl[], force: boolean): string {
  const parts = actions.map((v) => `run=${v.name}`);
  if (force) parts.push('force=true');
  if (parts.length == 0) return '';

  return '?' + parts.join('&');
}

export function getActionNames(actions: ActionDecl[]): string[] {
  return actions.map((v) => v.name);
}

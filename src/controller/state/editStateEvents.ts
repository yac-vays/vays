/**
 * Change notifications for the parts of the edit state the YAML editor's
 * locked regions depend on: the JSON schema of the latest validation, the
 * user's permissions on the entity and the admin override. Separate from the
 * single-listener bridges in EditController/status.ts (owned by the edit
 * view), so editor plugins can subscribe without taking those over.
 */
const subscribers = new Set<() => void>();

export function notifyEditStateChange(): void {
  for (const cb of subscribers) cb();
}

/** Calls `cb` on every change; returns the unsubscribe function. */
export function subscribeToEditStateChange(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

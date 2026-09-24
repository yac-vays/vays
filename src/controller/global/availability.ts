/**
 * Tracks, per YAC backend, whether its git repository is reachable.
 *
 * Every response that comes back through `sendRequest` is inspected: a 503
 * marks the backend unavailable (with YAC's title/message), a successful
 * response carrying the stale-data `Warning` header marks it stale, and any
 * other successful response clears the mark. The layout shows a banner for
 * the backend of the current page (see `view/components/AvailabilityBanner`),
 * which replaces the per-request error toasts for these two situations.
 */

import { getCachedConfig } from '../../model/config';
import { Nullable } from '../../utils/types/typeUtils';
import availabilityState, { BackendAvailability } from '../state/AvailabilityState';

/**
 * The header YAC sets on responses served from the last known state while
 * its git repository is unreachable (RFC 7234 warn-code 110, "Response is
 * Stale"), and the one carrying the unix time of the last successful sync.
 */
export const STALE_WARNING_HEADER = 'Warning';
export const STALE_SYNCED_HEADER = 'X-YAC-Repo-Synced';

/**
 * The configured backend URL a request URL belongs to (the longest backend
 * URL that is a prefix of it), or null if it is none of them.
 */
export function backendURLOf(requestURL: string): Nullable<string> {
  const backends = getCachedConfig()?.backends ?? [];
  let best: Nullable<string> = null;
  for (const backend of backends) {
    const base = backend.url.endsWith('/') ? backend.url.slice(0, -1) : backend.url;
    if (
      (requestURL === base || requestURL.startsWith(base + '/')) &&
      (best === null || base.length > best.length)
    ) {
      best = base;
    }
  }
  return best;
}

function normalize(backendURL: string): string {
  return backendURL.endsWith('/') ? backendURL.slice(0, -1) : backendURL;
}

function set(backendURL: string, next: BackendAvailability) {
  const key = normalize(backendURL);
  const current = availabilityState.entries.get(key) ?? { state: 'ok' };
  if (current.state === next.state) {
    // Same situation as before (polls repeat it every few seconds): only a
    // changed sync time is worth re-rendering, and then with the original
    // `since` so the banner does not flicker.
    if (current.state !== 'stale' || next.state !== 'stale') return;
    if (next.syncedAt?.getTime() === current.syncedAt?.getTime()) return;
    next = { ...next, since: current.since };
  }
  if (next.state === 'ok') availabilityState.entries.delete(key);
  else availabilityState.entries.set(key, next);
  for (const listener of [...availabilityState.listeners]) listener();
}

/**
 * Record what a YAC response tells about its backend's repository. Called
 * for every response by `sendRequest`; responses whose URL belongs to no
 * configured backend are ignored.
 */
export async function reportResponse(requestURL: string, resp: Response): Promise<void> {
  const backendURL = backendURLOf(requestURL);
  if (backendURL === null) return;

  if (resp.status === 503) {
    let title = 'Data Repository Unavailable';
    let message = 'Please try again later.';
    try {
      const body = await resp.clone().json();
      if (body && typeof body === 'object') {
        if (typeof body.title === 'string' && body.title) title = body.title;
        if (typeof body.message === 'string' && body.message) message = body.message;
      }
    } catch {
      // Non-JSON 503 (e.g. from a proxy): keep the generic wording.
    }
    set(backendURL, { state: 'unavailable', title, message, since: new Date() });
    return;
  }

  if (resp.ok) {
    if (resp.headers.get(STALE_WARNING_HEADER)?.startsWith('110')) {
      const synced = resp.headers.get(STALE_SYNCED_HEADER);
      const syncedAt = synced && /^\d+$/.test(synced) ? new Date(parseInt(synced) * 1000) : null;
      set(backendURL, { state: 'stale', syncedAt, since: new Date() });
    } else {
      set(backendURL, { state: 'ok' });
    }
  }
  // Other statuses say nothing about the repository.
}

export function getAvailability(backendURL: Nullable<string>): BackendAvailability {
  if (!backendURL) return { state: 'ok' };
  return availabilityState.entries.get(normalize(backendURL)) ?? { state: 'ok' };
}

/** Subscribe to availability changes of any backend. Returns the unsubscribe function. */
export function subscribeAvailability(listener: () => void): () => void {
  availabilityState.listeners.add(listener);
  return () => {
    availabilityState.listeners.delete(listener);
  };
}

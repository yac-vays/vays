import { Nullable } from '../../utils/types/typeUtils';

/**
 * What VAYS knows about a backend's ability to serve data from its git
 * repository, derived from the responses it gets (see
 * `controller/global/availability.ts`).
 */
export type BackendAvailability =
  /** Requests are answered normally. */
  | { state: 'ok' }
  /**
   * YAC cannot reach its git repository but still answers reads from the
   * last known state (it flags such responses with a `Warning` header).
   * Writes will fail until the repository is back.
   */
  | { state: 'stale'; syncedAt: Nullable<Date>; since: Date }
  /**
   * YAC answered 503: the git repository is unavailable (typically in
   * maintenance) and the request could not be served at all. `title` and
   * `message` are YAC's own wording.
   */
  | { state: 'unavailable'; title: string; message: string; since: Date };

/**
 * The state for the availability controller: one entry per backend URL, plus
 * the views that want to know when an entry changes.
 */
class AvailabilityState {
  public entries: Map<string, BackendAvailability> = new Map();
  public listeners: Set<() => void> = new Set();
}

const availabilityState = new AvailabilityState();
export default availabilityState;

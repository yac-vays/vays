import type { RequestContext } from './types/internal/request';

/**
 * Determines whether the accessed entity type defines any logs.
 *
 * Used to decide whether the 'Status' (logs) column should be shown in the
 * overview table at all: if no logs are defined, the column is omitted entirely.
 *
 * Kept in a leaf utility module (types-only imports) so both the controller
 * and the view can use it without creating a circular dependency.
 *
 * @param requestContext - The context of the request, including accessed entity type.
 * @returns true if at least one log is defined, false otherwise.
 */
export function hasLogsDefined(requestContext: RequestContext): boolean {
  return (requestContext.accessedEntityType?.logs?.length ?? 0) > 0;
}

/**
 * Formats a log timestamp as `YYYY-MM-DD HH:MM:SS` in the viewer's local time.
 * Returns a placeholder when the time is missing or unparseable.
 */
export function formatLogTime(time: string | null | undefined): string {
  if (!time) return 'No time available';
  const d = new Date(Date.parse(time));
  if (isNaN(d.getTime())) return 'No time available';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * Compact "time ago" for a log timestamp: seconds (`2s`), minutes (`5m`), hours
 * (`3h`) or days (`672d`). Returns null when the time is missing or unparseable,
 * so the caller can fall back to showing the raw string.
 */
export function formatRelativeTime(time: string | null | undefined): string | null {
  if (!time) return null;
  const t = Date.parse(time);
  if (isNaN(t)) return null;
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

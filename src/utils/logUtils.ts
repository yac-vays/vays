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

/** Red → orange → green anchors for the progress ring (same red/green as the bool indicator). */
const PROGRESS_COLOR_STOPS: [number, [number, number, number]][] = [
  [0, [0xdc, 0x35, 0x45]], // #DC3545 red
  [50, [0xf5, 0x9e, 0x0b]], // #F59E0B orange
  [100, [0x10, 0xb9, 0x81]], // #10B981 green
];

/**
 * Maps a progress percentage (0-100) to a hex color: red at 0%, orange at 50%,
 * green at 100%, with linear blending in between. Values outside 0-100 are
 * clamped.
 */
export function progressColor(progress: number): string {
  const p = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress));
  let from = PROGRESS_COLOR_STOPS[0];
  let to = PROGRESS_COLOR_STOPS[PROGRESS_COLOR_STOPS.length - 1];
  for (let i = 0; i < PROGRESS_COLOR_STOPS.length - 1; i++) {
    if (p <= PROGRESS_COLOR_STOPS[i + 1][0]) {
      from = PROGRESS_COLOR_STOPS[i];
      to = PROGRESS_COLOR_STOPS[i + 1];
      break;
    }
  }
  const t = to[0] === from[0] ? 0 : (p - from[0]) / (to[0] - from[0]);
  const hex = (a: number, b: number) =>
    Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(from[1][0], to[1][0])}${hex(from[1][1], to[1][1])}${hex(from[1][2], to[1][2])}`.toUpperCase();
}

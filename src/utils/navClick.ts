import { MouseEvent } from 'react';

/**
 * Whether a click on an anchor should be left to the browser rather than
 * intercepted for in-app (SPA) navigation. True for modified clicks
 * (Ctrl/Cmd/Shift/Alt) and non-primary buttons — i.e. the gestures a user makes
 * to open a link in a new tab/window — so those keep their native behaviour.
 *
 * Note: middle-click opens a new tab natively and fires `auxclick`, not
 * `click`, so it never reaches an `onClick` handler in the first place.
 */
export function isModifiedClick(e: MouseEvent): boolean {
  return e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

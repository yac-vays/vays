import { logError } from '../../../../../utils/logger';
import type { LogDecl } from '../../../../../utils/types/api';
import { documentRenderer } from './document';
import { messagesRenderer, problemRenderer, progressRenderer } from './list';
import { markdownRenderer } from './markdown';
import type { LogRenderer } from './types';

export type { LogIndicatorProps, LogRenderer, LogViewProps } from './types';

/**
 * All log renderers, by the name used as `renderer` of a log in the YAC specs.
 * To add one, implement {@link LogRenderer} and register it here (see the
 * VAYS docs, "Log Renderers").
 */
export const LOG_RENDERERS: Record<string, LogRenderer> = Object.fromEntries(
  [messagesRenderer, problemRenderer, progressRenderer, documentRenderer, markdownRenderer].map(
    (r) => [r.name, r],
  ),
);

const warned = new Set<string>();

/** The renderer of a log; unknown names fall back to `messages`. */
export function getLogRenderer(decl: LogDecl): LogRenderer {
  // Own entries only: the name comes from the specs ("constructor", ...).
  if (Object.hasOwn(LOG_RENDERERS, decl.renderer)) return LOG_RENDERERS[decl.renderer];
  if (!warned.has(decl.renderer)) {
    warned.add(decl.renderer);
    logError(
      `Unknown log renderer "${decl.renderer}" (log "${decl.name}"), using "messages"`,
      'getLogRenderer',
    );
  }
  return messagesRenderer;
}

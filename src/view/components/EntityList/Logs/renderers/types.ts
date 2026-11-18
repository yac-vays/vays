import type { FC } from 'react';
import type { EntityLog, LogDecl } from '../../../../../utils/types/api';
import type { RequestContext } from '../../../../../utils/types/internal/request';

export interface LogIndicatorProps {
  decl: LogDecl;
  /** The newest entry of the log (indicators are only shown if there is one). */
  latest: EntityLog;
}

export interface LogViewProps {
  decl: LogDecl;
  /** All entries of the log, newest first. */
  entries: EntityLog[];
  entityName: string;
  requestContext: RequestContext;
  /** Closes the view (only used by `window` renderers). */
  onClose: () => void;
}

/**
 * A log renderer: how a log of an entity is shown in the overview's status
 * column (`renderer` of the log in the YAC specs). The common parts — the
 * loading spinner, the placeholder of a log without entries and the polling —
 * are handled by `LogsField`.
 */
export interface LogRenderer {
  /** The name used in the specs. */
  name: string;
  /** The symbol in the status column, built from the newest entry. */
  Indicator: FC<LogIndicatorProps>;
  /**
   * Where `View` opens when the symbol is clicked: `popover` next to the
   * symbol (for short content), `window` a large dialog (e.g. documents).
   */
  display: 'popover' | 'window';
  View: FC<LogViewProps>;
}

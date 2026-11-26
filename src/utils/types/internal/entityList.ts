import { Nullable } from '../typeUtils';
import { ActionsColumnResults } from './actions';

export interface OverviewListCellEntry {
  value: string;
  isMarkdown: boolean;
  /** Plain-text tooltip of an alias (only set when there is one). */
  tooltip?: string;
}

export interface QueryResult {
  entityName: string;
  isLink: Nullable<string>;
  elt: OverviewListCellEntry[];
  actionPair: ActionsColumnResults;
  /** URLs of the type's links for this entity, keyed by link name. */
  links: Record<string, string>;
}

export interface QueryResponse {
  entityTypeName: string | null;
  partialResults: QueryResult[];
  totalNumberOfResults: number;
}

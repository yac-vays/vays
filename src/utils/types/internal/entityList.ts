import { Nullable } from '../typeUtils';
import { ActionsColumnResults } from './actions';

export interface OverviewListCellEntry {
  value: string;
  isMarkdown: boolean;
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
  entityName: string | null;
  partialResults: QueryResult[];
  totalNumberOfResults: number;
}

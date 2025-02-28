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
}

export interface QueryResponse {
  entityName: string | null;
  partialResults: QueryResult[];
  totalNumberOfResults: number;
}

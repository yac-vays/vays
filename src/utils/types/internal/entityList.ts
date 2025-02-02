import { ActionsColumnResults } from './actions';
import { Nullable } from "../typeUtils";


export interface QueryResult {
  entityName: string;
  isLink: Nullable<string>;
  elt: string[];
  actionPair: ActionsColumnResults;
  
}

export interface QueryResponse {
  entityName: string | null;
  partialResults: QueryResult[];
  totalNumberOfResults: number;
}

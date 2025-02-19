import { EntityTypeDecl } from '../api';
import { YACBackend } from '../config';

export type EditViewMode = 'create' | 'change' | 'read';

export interface RequestOverviewContext {
  searchQueries?: { [key: string]: string };
  pageNumber: number;
  numPerPage: number;
  rc: RequestContext;
}

export interface RequestEditContext {
  entityName?: string;
  mode: EditViewMode;
  rc: RequestContext;
  viewMode: 'standard' | 'expert';
}
/**
 * Stores the context of the request as per URL.
 */

export interface RequestContext {
  yacURL: string | null | undefined; // TODO: Remove undefined when also redoing the index thing.
  entityTypeName: string | null;
  accessedEntityType: EntityTypeDecl | null;
  // isSearch: boolean; // TODO: Currently not supplied.
  // searchProperty: string | null; // TODO: CURRENTLY NOT SUPPLIED
  // searchQuery: string | null; // TODO: CURRENTLY NOT SUPPLIED
  backendObject: YACBackend | null;
  entityTypeList: EntityTypeDecl[] | null; // The list of entities that this particular backend defines
}

/**
 * Data Object Type for temporarily storing authentication information.
 */
export interface AuthDiscConfig {
  nonce: string;
  clientID: string;
  code_verifier: string;
}

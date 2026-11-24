import { EntityTypeDecl } from '../api';
import { YACBackend } from '../config';

export type EditViewMode = 'create' | 'edit' | 'read';

export interface RequestOverviewContext {
  rc: RequestContext;
}

export interface RequestEditContext {
  entityName?: string;
  mode: EditViewMode;
  rc: RequestContext;
}
/**
 * Stores the context of the request as per URL.
 */

export interface RequestContext {
  /** Base URL of the backend's API (`backendObject.url`), null while unknown. */
  yacURL: string | null;
  entityTypeName: string | null;
  accessedEntityType: EntityTypeDecl | null;
  backendObject: YACBackend | null;
  entityTypeList: EntityTypeDecl[] | null; // The list of entities that this particular backend defines
}

/**
 * Data Object Type for temporarily storing authentication information.
 */
export interface AuthDiscConfig {
  nonce: string;
  code_verifier: string;
}

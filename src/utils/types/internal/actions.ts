import { ActionDecl } from '../api';
import { RequestContext } from './request';


export interface OperationsMetaInfo {
  [key: string]: {
    getOperationCallback: (
      entityName: string,
      requestContext: RequestContext
    ) => () => Promise<boolean>;
    /**
     * For operations that navigate to another page (edit/view), the target URL.
     * Lets the GUI render them as real links (openable in a new tab) instead of
     * plain click handlers. Absent for operations that act in place (copy, link,
     * delete, custom actions).
     */
    getOperationURL?: (entityName: string, requestContext: RequestContext) => string;
  };
}export interface GUIActionButtonArg {
  action: ActionDecl;
  isAllowed: boolean;
  /**
   *
   * @param requestContext
   * @param entityName
   * @param actionName
   * @returns A boolean, indicating, whether the action worked.
   */
  performAction: () => Promise<boolean>;
  /** Target URL when the action navigates to another page (edit/view). */
  href?: string;
}

export interface GUIActionDropdownArg {
  action: ActionDecl;
  performAction: () => Promise<boolean>;
  /** Target URL when the action navigates to another page (edit/view). */
  href?: string;
}

export interface ActionsColumnResults {
  favActs: GUIActionButtonArg[];
  dropdownActs: GUIActionDropdownArg[];
}


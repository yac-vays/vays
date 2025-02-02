import { ActionDecl } from '../api';
import { RequestContext } from './request';


export interface OperationsMetaInfo {
  [key: string]: {
    getOperationCallback: (
      entityName: string,
      requestContext: RequestContext
    ) => () => Promise<boolean>;
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
}

export interface GUIActionDropdownArg {
  action: ActionDecl;
  performAction: () => Promise<boolean>;
}

export interface ActionsColumnResults {
  favActs: GUIActionButtonArg[];
  dropdownActs: GUIActionDropdownArg[];
}


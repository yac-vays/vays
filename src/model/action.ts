import { showModalMessage } from '../controller/global/modal';
import { navigateToURL } from '../controller/global/url';
import { showError, showSuccess } from '../controller/local/notification';
import { isTriggable } from '../utils/actionUtils';
import { sendRequest } from '../utils/authRequest';
import { ActionDecl } from '../utils/types/api';
import { OperationsMetaInfo } from '../utils/types/internal/actions';
import { RequestContext } from '../utils/types/internal/request';
import { Nullable } from '../utils/types/typeUtils';
import { joinUrl } from '../utils/urlUtils';
import { copyEntity } from './copy';
import { deleteEntity } from './delete';
import { invalidateEntityListCache } from './entityList';
import { linkEntity } from './link';

export function getActionCallback(
  requestContext: RequestContext,
  entityName: string,
  actionObj: ActionDecl,
): () => Promise<boolean> {
  return async () => {
    const doAction = async () => {
      const successfullySubmitted = await sendAction(requestContext, entityName, actionObj.name);
      if (successfullySubmitted) {
        showSuccess(
          `Action '${actionObj.title}' has been submitted successfully.`,
          'It may take a while for the process to complete. Please stand by.',
        );
      } else if (successfullySubmitted == null) {
        // Skip, the error was printed
      } else {
        showError(
          `Action '${actionObj.title}' could not be submitted.`,
          'Please stand by and try again later. If this keeps occuring, please contact your admin.',
        );
      }
    };
    if (actionObj.dangerous) {
      showModalMessage(
        `Are you sure to ${actionObj.title.toLowerCase()} on \n'${entityName}'?`,
        actionObj.description,
        doAction,
        async () => {},
        actionObj.title,
        false,
      );
    } else {
      await doAction();
    }

    return true;
  };
}

/**
 * @param permsAvailable The available permissions for this corresponding host.
 * @param permsRequ The required permissions for the corresponding action.
 * @returns Boolean, whether this action can be executed.
 */
export function checkPermissions(permsAvailable: string[], permsRequ: string[]): boolean {
  const setB = new Set(permsAvailable);
  return [...new Set(permsRequ)].filter((x) => setB.has(x)).length > 0;
}

/**
 * The list of operations, represented as action objects.
 *
 * This allows uniform treatment at the view level.
 */
export const OPERATIONS_META: OperationsMetaInfo = {
  /**
   * Copy operation. This operation copies an entity.
   **/
  create_copy: {
    getOperationCallback: (entityName: string, requestContext: RequestContext) => {
      return async () => {
        showModalMessage(
          `Creating a Copy of ${entityName}`,
          'Please enter a name of this new copy:',
          async (newName?: string, actionsSelected?: ActionDecl[]) => {
            if (newName == undefined) return;
            const success = await copyEntity(
              newName,
              entityName,
              actionsSelected ?? [],
              requestContext,
            );
            if (success) {
              showSuccess(
                `Success Copying ${entityName}`,
                'The entry is now available in the entity list.',
              );
            } else if (success !== null) {
              showError(`Could not create link ${newName}`, 'Please try again.');
            }
          },
          async () => {},
          'Create Copy',
          true,
          requestContext.accessedEntityType?.actions.filter((v) => isTriggable('create', v)),
        );
        return true;
      };
    },
  },
  /**
   * Change operation. This operation is the modification.
   *
   */
  change: {
    getOperationCallback: (entityName: string, requestContext: RequestContext) => {
      return async () => {
        navigateToURL(
          `/${requestContext.backendObject?.name}/${requestContext.entityTypeName}/modify/${entityName}`,
        );
        return true;
      };
    },
  },
  /**
   * Delete operation. This operation deletes an entity.
   */
  delete: {
    getOperationCallback: (entityName: string, requestContext: RequestContext) => {
      return async () => {
        const del = async () => {
          const success = await deleteEntity(entityName, requestContext);
          if (success) {
            // TODO: Need to change the cachin structure...
            invalidateEntityListCache(requestContext.yacURL, requestContext.entityTypeName);
            showSuccess(`Deleted ${entityName}`, 'The entity was successfully deleted.');
            return;
          }
          if (success == null) return;
          showError(
            'Deletion error',
            `Could not delete entity ${entityName}. (TODO: Add more information.)`,
          );
        };
        showModalMessage(
          `Are you sure to delete \n'${entityName}'?`,
          OPERATIONS['delete'].description,
          del,
          async () => {},
          'Delete',
          false,
          requestContext.accessedEntityType?.actions.filter((v) => isTriggable('delete', v)),
        );

        return true;
      };
    },
  },
  /**
   * Linking operation. Creates a link to an existing entity.
   **/
  create_link: {
    getOperationCallback: (entityName: string, requestContext: RequestContext) => {
      return async () => {
        showModalMessage(
          `Creating a Link to ${entityName}`,
          'Please enter a name of this new link entity:',
          async (newName?: string, actionsSelected?: ActionDecl[]) => {
            if (newName == undefined) return;
            const success = await linkEntity(
              newName,
              entityName,
              actionsSelected ?? [],
              requestContext,
            );
            if (success) {
              showSuccess(`Successfully created link ${newName}`, '');
            } else if (success !== null) {
              showError(`Could not create link ${newName}`, 'Please try again.');
            }
          },
          async () => {},
          'Create Link',
          true,
          requestContext.accessedEntityType?.actions.filter((v) => isTriggable('create', v)),
        );

        return true;
      };
    },
  },
};

export const OPERATIONS: { [key: string]: ActionDecl } = {
  create_copy: {
    name: 'create_copy',
    title: 'Copy Entity',
    perms: ['cpy'],
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
    dangerous: false,
    force: true,
    hooks: [],
    description: '',
  },
  change: {
    name: 'change',
    title: 'Edit',
    perms: ['edt'],
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
    dangerous: false,
    force: true,
    hooks: [],
    description: '',
  },
  delete: {
    name: 'delete',
    title: 'Delete Entity',
    perms: ['del'],
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
    dangerous: true,
    force: true,
    hooks: [],
    description: `Deleting the entity will remove it from the index. This action cannot be undone without direct admin support.`,
  },
  create_link: {
    name: 'create_link',
    title: 'Create Link',
    perms: ['lnk'],
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M680-160v-120H560v-80h120v-120h80v120h120v80H760v120h-80ZM440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm560-40h-80q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480Z"/></svg>',
    dangerous: false,
    force: true,
    hooks: [],
    description: `Creating a link of an entity will create a new 'shallow' entity which takes all values from this entity.`,
  },
};

/**
 * @param requestContext
 * @param entityName
 * @param actionName
 * @returns
 */
export async function sendAction(
  requestContext: RequestContext,
  entityName: string,
  actionName: string,
): Promise<Nullable<boolean>> {
  const url: string | null | undefined = requestContext.yacURL;

  if (url == undefined || url == null) return false;

  const resp: Nullable<Response> = await sendRequest(
    joinUrl(url, `/entity/${requestContext.entityTypeName}/${entityName}/run/${actionName}`),
    'POST',
  );
  if (resp?.status == 204) return true;
  if (resp != null && resp.status >= 400) {
    const ans = await resp.json();
    showError(
      `${requestContext.backendObject?.title}: ` +
        (ans.title ?? `Action could not be sent (Status ${resp.status})`),
      ans.message ?? 'Action cannot be sent. Please contact the admin to resolve this issue.',
    );
    return null;
  }
  return false;
}

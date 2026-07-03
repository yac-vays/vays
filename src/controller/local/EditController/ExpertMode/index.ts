import { createNewEntity } from '../../../../model/create';
import { invalidateEntityListCache } from '../../../../model/entityList';
import { putYAMLEntity } from '../../../../model/put';
import { validateYAML } from '../../../../model/validate';
import { getActionNames } from '../../../../utils/actionUtils';
import { ActionDecl } from '../../../../utils/types/api';
import { RequestContext, RequestEditContext } from '../../../../utils/types/internal/request';
import { ValidateResponse } from '../../../../utils/types/internal/validation';
import { Nullable } from '../../../../utils/types/typeUtils';
import { showModalMessage } from '../../../global/modal';
import { showError } from '../../../global/notification';
import { buildOverviewHighlightURL, navigateToURL } from '../../../global/url';
import editingState from '../../../state/EditCtrlState';
import { flushPendingDebouncedCommits } from '../debounceRegistry';
import { isStaleValidation, whenValidationIdle } from '../session';
import { beginPaneSession, clearEditDirty, getInitialEntityYAML, setYACStatus } from '../shared';
import {
  getActivatedActions,
  getEntityName,
  getEntityYAML,
  hasUncommittedChanges,
  setErrorMessageCallback,
  setIsValidatingCallback,
} from './access';

/**
 * The confirm dialogue's body: what committing will additionally trigger. The
 * activated actions' (markdown) descriptions are shown exactly like running an
 * action standalone shows them (see `model/action.ts`), so the user confirms
 * the side effects — not just the write.
 */
function describeActivatedActions(acts: ActionDecl[]): string {
  if (acts.length === 0) return '';
  const details = acts
    .map((act) => {
      const title = `#### ${act.title || act.name}`;
      return act.description ? `${title}\n\n${act.description}` : title;
    })
    .join('\n\n');
  return `This will also trigger the following action${acts.length > 1 ? 's' : ''}:\n\n${details}`;
}

/**
 * Send validation for the yaml.
 * @param name
 * @param yaml
 * @param requestEditContext
 * @param seq The validation-seq stamp of the editor edit driving this call. A
 *    response superseded by a newer edit must not write the global YAC status
 *    (validity / footer / Commit gate) — that would describe the wrong document.
 * @returns
 */
export async function updateYAMLschema(
  name: Nullable<string>,
  yaml: string,
  requestEditContext: RequestEditContext,
  acts: ActionDecl[],
  seq?: number,
): Promise<Nullable<ValidateResponse>> {
  const valResp = await validateYAML(requestEditContext, name, yaml, getInitialEntityYAML(), acts);
  if (valResp == null) return null;
  if (seq === undefined || !isStaleValidation(seq)) {
    setYACStatus(valResp.valid, valResp.detail, valResp.usages);
  }

  return valResp;
}

/**
 * Callback for the edit view.
 * @param requestContext
 * @returns
 */
export async function sendYAMLData(requestContext: RequestEditContext) {
  // An edit may still be sitting in a renderer's debounce window; commit it now
  // so the YAML read below includes the user's last keystrokes.
  flushPendingDebouncedCommits();
  // The flushed edits reach the save payload (`entityYAML`) only through their
  // validation round-trip (the backend returns the merged canonical YAML), and
  // a form flush additionally crosses a React state tick before it even
  // dispatches. Give that tick room, then wait for every in-flight validation
  // to settle — otherwise what is saved is older than what the user sees.
  await new Promise((resolve) => setTimeout(resolve, 80));
  await whenValidationIdle();
  // Validity may have changed with the just-settled validations; the Commit
  // button state predates them.
  if (!editingState.isValidYAC) {
    return;
  }
  // No-op guard (edit only): the backend rejects a PUT whose content equals
  // the stored file with a 400. The Commit button is already disabled in that
  // state; this covers the gap where the just-settled validations reverted
  // the payload back to the stored content.
  if (requestContext.mode === 'edit' && !hasUncommittedChanges()) {
    return;
  }
  showModalMessage(
    'Are You Sure You Want to Send the Data?',
    describeActivatedActions(getActivatedActions()),
    async () => {
      // A validation may have been dispatched while the modal was open (e.g.
      // the editor's debounce fired); its response updates the payload.
      await whenValidationIdle();
      if (!editingState.isValidYAC) {
        showError(
          'Not saved: the document changed and is no longer valid',
          'Please fix the reported error and commit again.',
        );
        return;
      }
      let success = false;
      // Remember the affected entity so we can scroll to it in the overview.
      let entityName: Nullable<string> = null;
      if (requestContext.mode === 'create') {
        const res = await sendCreateNewEntity(getEntityYAML() ?? '', requestContext.rc);
        success = res.success;
        entityName = res.name;
      } else {
        entityName = requestContext.entityName ?? null;
        success = await sendPutEntity(getEntityYAML() ?? getInitialEntityYAML(), requestContext);
      }

      if (success) {
        // Saved: the session is no longer dirty, so leaving the page (the
        // navigation below) must not trigger the unsaved-changes warning.
        clearEditDirty();
        invalidateEntityListCache(requestContext.rc.yacURL, requestContext.rc.entityTypeName);
        navigateToURL(
          buildOverviewHighlightURL(
            requestContext.rc.backendObject?.name,
            requestContext.rc.entityTypeName,
            entityName,
          ),
        );
      }
    },
    async () => {},
    'Confirm',
    false,
  );
}

/**
 * Helper function which tells the model to send a new entity request.
 * @param yaml
 * @param requestContext
 * @returns
 */
async function sendCreateNewEntity(
  yaml: string | undefined,
  requestContext: RequestContext,
): Promise<{ success: boolean; name: Nullable<string> }> {
  const name: Nullable<string> = getEntityName();
  const res = await createNewEntity(
    name,
    {},
    requestContext,
    yaml,
    getActionNames(getActivatedActions()),
  );
  // Only a successful create ends the session (navigation follows). On failure
  // the session continues and the panel still displays the name — clearing the
  // global would make every subsequent validate/retry send name=null.
  if (res.success) {
    editingState.entityName = null;
  }
  return res;
}

/**
 * Helper function which tells the model to send a put API call.
 * @param yaml
 * @param requestEditContext
 * @returns
 */
async function sendPutEntity(
  yaml: string,
  requestEditContext: RequestEditContext,
): Promise<boolean> {
  const name: string | undefined = getEntityName() ?? requestEditContext.entityName;
  if (name == undefined) {
    showError('Could not send the update!', '');
    return false;
  }
  return await putYAMLEntity(
    name,
    yaml,
    getInitialEntityYAML(),
    requestEditContext,
    getActionNames(getActivatedActions()),
  );
}

/**
 * Initializes the internal state for a new expert mode editing session.
 * @param requestEditContext
 * @param setIsValidating
 * @param setEditErrorMsg
 */
export function startExpertModeSession(
  requestEditContext: RequestEditContext,
  setIsValidating: (v: boolean) => void,
  setEditErrorMsg: (v: string) => void,
) {
  // Activates the session and — only when a NEW session actually begins —
  // performs the one-time resets (status, dirty flag, activated actions, name
  // from the context/URL). The Monaco chunk loads lazily, so this often runs
  // late into a session the form pane already started: it must not wipe
  // actions/name/validity the user set in the meantime.
  beginPaneSession(requestEditContext);
  setIsValidatingCallback(setIsValidating);
  setErrorMessageCallback(setEditErrorMsg);

  setEditErrorMsg(''); // Start with no error message, please
}

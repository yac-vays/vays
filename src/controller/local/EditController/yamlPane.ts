import { validateYAML } from '../../../model/validate';
import { ActionDecl } from '../../../utils/types/api';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import { Nullable } from '../../../utils/types/typeUtils';
import { reportSchemaWarnings } from '../../global/troubleshoot';
import { setErrorMessageCallback } from './editState';
import { isStaleValidation } from './session';
import { beginPaneSession, getInitialEntityYAML, setEntityPerms, setYACStatus } from './shared';

/**
 * Validate the YAML pane's text against the backend.
 * @param seq The validation-seq stamp of the editor edit driving this call. A
 *    response superseded by a newer edit must not write the global YAC status
 *    (validity / footer / Commit gate) — that would describe the wrong document.
 */
export async function validateYAMLText(
  name: Nullable<string>,
  yaml: string,
  requestEditContext: RequestEditContext,
  acts: ActionDecl[],
  seq?: number,
): Promise<Nullable<ValidateResponse>> {
  const valResp = await validateYAML(requestEditContext, name, yaml, getInitialEntityYAML(), acts);
  if (valResp == null) return null;
  if (seq === undefined || !isStaleValidation(seq)) {
    setYACStatus(valResp.valid, valResp.usages, valResp.data);
    if (valResp.perms) setEntityPerms(valResp.perms);
    reportSchemaWarnings(valResp, requestEditContext);
  }

  return valResp;
}

/** Join the editing session from the YAML pane and register its footer callback. */
export function startYamlPaneSession(
  requestEditContext: RequestEditContext,
  setEditErrorMsg: (v: string) => void,
) {
  // Activates the session and — only when a NEW session actually begins —
  // performs the one-time resets (status, dirty flag, activated actions, name
  // from the context/URL). The Monaco chunk loads lazily, so this often runs
  // late into a session the form pane already started: it must not wipe
  // actions/name/validity the user set in the meantime.
  beginPaneSession(requestEditContext);
  setErrorMessageCallback(setEditErrorMsg);

  setEditErrorMsg(''); // Start with no error message, please
}

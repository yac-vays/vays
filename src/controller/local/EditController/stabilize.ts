/* eslint-disable @typescript-eslint/no-explicit-any */
/** Validating form data until defaults and cleanup no longer change it. */
import { validate } from '../../../model/validate';
import { logError } from '../../../utils/logger';
import {
  DataPath,
  extractPatch,
  getAllErrors,
  hasAtPath,
  markRemovedKeys,
  removeOldData,
  setUndefinedAtPath,
} from '../../../utils/schema/dataUtils';
import {
  fillDefaults,
  mergeDefaults,
  updateDefaults,
} from '../../../utils/schema/defaultsHandling';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import { Nullable } from '../../../utils/types/typeUtils';
import { showError } from '../../global/notification';
import { reportSchemaWarnings } from '../../global/troubleshoot';
import { navigateToURL } from '../../global/url';
import editingState from '../../state/EditCtrlState';
import { getValidationAJV } from './editState';
import { currentSession, isStaleSession, isStaleValidation } from './session';
import { setEntityPerms, setYACStatus } from './status';

/**
 * Safety net for `coreUpdate`'s stabilization loop: deep nesting can
 * legitimately need many passes, but a pass count this high means the
 * defaults/cleanup handling oscillates instead of converging.
 */
const CORE_UPDATE_MAX_PASSES = 100;

export interface CoreUpdateOptions {
  /** Validate again until the data no longer changes (defaults, cleanup). */
  doRevalidate: boolean;
  /** Names of the actions to run with the write. */
  actions: string[];
  name: Nullable<string>;
  /**
   * The YAML the form patch is merged into (comment-preserving). Passed for
   * user form edits; omitted on initial loads (then the stored YAML is used).
   */
  yamlBase?: string;
  /**
   * The validation-seq stamp of the user edit driving this update (loads pass
   * none). A newer stamped edit supersedes the whole stabilization.
   */
  seq?: number;
  /**
   * Whether to diff against the canonical pair (user edits, merged into the
   * LIVE editor document; the default) or the session-load baseline (schema
   * loads, merged into the STORED file). Must match what `yamlBase` carries.
   */
  useCanonicalBaseline?: boolean;
  /** The session the update belongs to; defaults to the current one. */
  epoch?: number;
}

/**
 * Validate the data as often as it takes to stabilize it: a validation may
 * bring new defaults or remove properties, which changes the data to validate.
 *
 * @note Internal (controller) use only.
 */
export async function coreUpdate(
  entityData: { [key: string]: unknown },
  requestEditContext: RequestEditContext,
  {
    doRevalidate,
    actions,
    name,
    yamlBase,
    seq,
    useCanonicalBaseline = true,
    epoch = currentSession(),
  }: CoreUpdateOptions,
) {
  for (let pass = 0; ; pass++) {
    let data = entityData;
    if (requestEditContext.mode === 'edit') {
      // The patch is merged into `yaml_base`, so it must be diffed against THAT
      // document's data. For user edits that is the canonical pair — diffing
      // against the load baseline instead makes "change a value back to its
      // stored state" an EMPTY patch, so the previous change would survive in
      // the merged YAML forever. Loads (and anything racing in before the
      // canonical seed) merge into the stored file and diff against its data.
      const baseline =
        useCanonicalBaseline && editingState.canonicalSeeded
          ? editingState.canonicalData
          : editingState.initialData;
      data = extractPatch(baseline, data);
    } else if (yamlBase !== undefined && useCanonicalBaseline && editingState.canonicalSeeded) {
      // Create sends the full data, but YAC merges it ADDITIVELY into
      // `yaml_base` as well: a key the user removed in the form (e.g. reset to
      // its initial) would survive in the merged YAML and bounce back into the
      // form with the response. Unset what is gone since the canonical data.
      data = markRemovedKeys(editingState.canonicalData, data);
    }

    // Re-emit session-stripped keys as `~undefined` so the additive YAML merge
    // (`yaml.update` on `yaml_base`) actually unsets them. Without this, a default
    // that appeared and disappeared (e.g. a toggled `yac_if`) leaves its now-illegal
    // value lingering in the editor YAML and blocks the commit. `entityData` is a
    // clone owned by `validateFormData`, so mutating `data` (which may alias it in
    // create mode) never touches the live form state.
    applyStrippedPaths(data, entityData);

    const valResp: Nullable<ValidateResponse> = await validate(
      name,
      data,
      requestEditContext,
      actions,
      yamlBase,
    );
    if (valResp == null) return null;

    // The session changed while the request was in flight (navigation to another
    // entity): none of the writes below may touch the new session's state.
    if (isStaleSession(epoch)) return null;

    // A newer user edit was dispatched meanwhile: stop the stabilization. Its
    // status, defaults bookkeeping and stripped-path records would describe a
    // document the panes no longer show; the newer edit's own run (which set
    // out from the newer data) replaces all of it. The caller re-checks the seq
    // and drops the returned response.
    if (seq !== undefined && isStaleValidation(seq)) return valResp;

    setYACStatus(valResp.valid, valResp.usages, valResp.data);
    if (valResp.perms) setEntityPerms(valResp.perms);
    reportSchemaWarnings(valResp, requestEditContext);
    const didChange = handleDefaults(entityData, valResp, requestEditContext);

    if (!doRevalidate || !didChange) return valResp;
    if (pass >= CORE_UPDATE_MAX_PASSES) {
      logError(
        `coreUpdate did not stabilize after ${CORE_UPDATE_MAX_PASSES} passes; aborting revalidation loop`,
        'EditController/stabilize.ts coreUpdate',
      );
      return valResp;
    }
    entityData = valResp.data;
  }
}

/**
 * Checks whether some defaults have been changed.
 * Will save the current default object to the state.
 *
 *
 * @param previousData
 * @param valResp
 * @param requestEditContext
 * @returns
 */
function handleDefaults(
  previousData: any,
  valResp: ValidateResponse,
  requestEditContext: RequestEditContext,
) {
  let didChange: boolean;

  if (requestEditContext.mode === 'edit') {
    valResp.data = previousData; //frontData;
    didChange = mergeDefaults(valResp);
  } else {
    didChange = updateDefaults(valResp);
    if (requestEditContext.mode === 'create') {
      // Defaults inside objects and array items the user added meanwhile.
      const didFill = fillDefaults(valResp);
      didChange ||= didFill;
    }
  }
  // Note: seperate calculate and store here, avoiding short circuiting.
  const didRemove = cleanData(valResp);
  didChange ||= didRemove;
  return didChange;
}

/**
 * Removes the data which is no longer allowed by the new schema.
 * This is necessary due to `yac_if`.
 *
 * Each removed key is also recorded in `editingState.strippedPaths` so the next
 * patch can re-emit it as `~undefined` (see `applyStrippedPaths`), keeping the
 * merged YAML in sync with the cleaned data.
 * @param valResp
 * @returns Whether the data object has been altered.
 */
function cleanData(valResp: ValidateResponse): boolean {
  const removed = removeOldData(
    valResp.data,
    getAllErrors(valResp.data, valResp.json_schema, getValidationAJV(), (e: any) => {
      showError('Faulty YAC Config: Schema Error', e.toString());
      navigateToURL('/');
    }),
  );
  for (const path of removed) {
    editingState.strippedPaths.add(JSON.stringify(path));
  }
  return removed.length > 0;
}

/**
 * Inject `~undefined` into the outgoing `patch` for every key that was stripped
 * this session and is still absent from the current form `data`. A key that has
 * reappeared (its `yac_if` condition is met again) is dropped from the pending
 * set so its real value flows through the normal patch instead.
 */
function applyStrippedPaths(patch: { [key: string]: unknown }, data: any) {
  for (const encoded of [...editingState.strippedPaths]) {
    const path: DataPath = JSON.parse(encoded);
    if (hasAtPath(data, path)) {
      editingState.strippedPaths.delete(encoded);
    } else {
      setUndefinedAtPath(patch, path);
    }
  }
}

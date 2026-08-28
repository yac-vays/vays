/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { getEntityData } from '../../../model/entityData';
import { getSchema, validate } from '../../../model/validate';
import {
  extractPatch,
  getAllErrors,
  hasAtPath,
  removeOldData,
  setUndefinedAtPath,
} from '../../../utils/schema/dataUtils';
import {
  insertDefaults,
  mergeDefaults,
  updateDefaults,
} from '../../../utils/schema/defaultsHandling';
import {
  injectEagerRandomStrings,
  resetEagerGenerated,
} from '../../../utils/schema/eagerValues';
import { EditActionSnapshot, NO_ACTIONS } from '../../../utils/schema/injectActions';
import { LimitUsage } from '../../../utils/types/api';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { logError } from '../../../utils/logger';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import { Nullable } from '../../../utils/types/typeUtils';
import { showError } from '../../global/notification';
import { navigateToURL } from '../../global/url';
import editingState from '../../state/EditCtrlState';
import { emitChangeState, seedCanonical } from './ExpertMode/access';
import {
  activateEditingSession,
  currentSession,
  isStaleSession,
  isStaleValidation,
} from './session';
import { updateSchema } from './StandardMode';

/**
 * Reset internal status storing the most recent YAC response (the one
 * which is also displayed in the footer of the edit view)
 */
export function clearYACStatus() {
  setYACValidateResponse('');
  setYACValidStatus(true);
  setLocalValidity(true);
  setYACUsages([]);
  setEntityPerms([]);
  // The admin override is per-commit intent: a fresh session starts locked.
  setAdminOverride(false);
  emitValidity();
  // A fresh editing session starts clean (called on both panes' init).
  clearEditDirty();
  // Pending schema-forbidden removals are scoped to a single session.
  editingState.strippedPaths.clear();
}

/**
 * Activate the editing session for `ctx` on behalf of a pane and return the
 * session epoch. Exactly the FIRST activation of a new session performs the
 * one-time session resets; a pane initializing late into a running session
 * (e.g. the lazily-loaded Monaco chunk) is a no-op here and cannot wipe state
 * the user already changed (activated actions, dirty flag, validity).
 */
export function beginPaneSession(requestEditContext: RequestEditContext): number {
  const { epoch, isNewSession } = activateEditingSession(requestEditContext);
  if (isNewSession) {
    clearYACStatus();
    // Session-scoped fields left behind by the previous session. The canonical
    // pair / save payload are re-seeded by this session's schema load; until
    // then `canonicalSeeded` keeps consumers (revalidateMeta) from reading the
    // previous document.
    editingState.activatedActions = [];
    editingState.entityName = requestEditContext.entityName ?? null;
    editingState.canonicalData = {};
    editingState.canonicalYAML = '';
    editingState.canonicalSeeded = false;
    editingState.entityYAML = undefined;
    editingState.currentJsonSchema = null;
    editingState.previousDefaultsObject = null;
    editingState.suppressNextFormChange = false;
    editingState.suppressNextYamlChange = false;
    resetEagerGenerated();
    // No payload yet in the fresh session — nothing to commit until seeded.
    emitChangeState();
  }
  return epoch;
}

/** Mark the editing session as having unsaved user edits. */
export function setEditDirty() {
  editingState.isDirty = true;
}

/** Clear the unsaved-edits flag (on session init and after a successful save). */
export function clearEditDirty() {
  editingState.isDirty = false;
}

/** Whether the editor currently holds unsaved user edits. */
export function isEditDirty(): boolean {
  return editingState.isDirty;
}

export function setYACStatus(valid: boolean, detail: string, usages: LimitUsage[] = []) {
  setYACValidateResponse(detail);
  setYACValidStatus(valid);
  setYACUsages(usages);
  emitValidity();
}

/**
 * Reactive bridge for overall form validity, mirroring `usagesListener`. The
 * edit view (`EditFrame`) registers a listener to enable/disable the Commit
 * button. Validity combines the backend verdict (`isValidYAC`, from every
 * `setYACStatus`) with the form's own JSON Forms error count (`isValidLocal`,
 * pushed from the standard-mode `onChange`).
 */
let validityListener: ((valid: boolean) => void) | null = null;

export function setValidityListener(cb: ((valid: boolean) => void) | null) {
  validityListener = cb;
}

/** True when both the backend and the live form report no errors. */
export function isFormValid(): boolean {
  return editingState.isValidYAC && editingState.isValidLocal;
}

/** Record whether the form's own (JSON Forms) validation currently has errors. */
export function setLocalValidity(valid: boolean) {
  editingState.isValidLocal = valid;
}

export function emitValidity() {
  validityListener?.(isFormValid());
}

/**
 * Reactive bridge for the `limits` usage indicator. Both edit modes funnel
 * their validation results through `setYACStatus`, so a single listener
 * registered by the edit view (`EditFrame`) receives every update for free.
 */
let usagesListener: ((usages: LimitUsage[]) => void) | null = null;

export function setUsagesListener(cb: ((usages: LimitUsage[]) => void) | null) {
  usagesListener = cb;
}

export function setYACUsages(usages: LimitUsage[]) {
  editingState.yacUsages = usages;
  usagesListener?.(usages);
}

/**
 * Reactive bridge for the entity permissions reported by validations, mirroring
 * `usagesListener`. The edit view uses them to decide whether to OFFER the
 * admin override ("adm" permission); the backend re-checks on commit anyway.
 * Registering immediately pushes the current state.
 */
let entityPermsListener: ((perms: string[]) => void) | null = null;

export function setEntityPermsListener(cb: ((perms: string[]) => void) | null) {
  entityPermsListener = cb;
  cb?.(editingState.entityPerms);
}

export function setEntityPerms(perms: string[]) {
  editingState.entityPerms = perms;
  entityPermsListener?.(perms);
}

/**
 * Reactive bridge for the admin override ("admin mode") state. Owned by the
 * controller (not the view) so the save path can auto-relock after a
 * successful commit and the session reset can relock on navigation.
 * Registering immediately pushes the current state.
 */
let adminOverrideListener: ((active: boolean) => void) | null = null;

export function setAdminOverrideListener(cb: ((active: boolean) => void) | null) {
  adminOverrideListener = cb;
  cb?.(editingState.adminOverride);
}

export function setAdminOverride(active: boolean) {
  editingState.adminOverride = active;
  adminOverrideListener?.(active);
}

export function isAdminOverride(): boolean {
  return editingState.adminOverride;
}

// The form pane and the (lazily loaded) Monaco editor both request the schema
// when the edit view mounts, so the same load runs twice concurrently. The
// stabilization loop works on module-global state (initialData,
// previousDefaultsObject, strippedPaths); a second in-flight run for the same
// context can therefore race the first one: its defaults patch is computed
// against the baseline the finished run already replaced, so the injected
// defaults never reach its YAML. Concurrent duplicates share one promise
// instead; late callers get a copy so the panes never alias the same objects.
const inflightSchemaLoads = new Map<string, Promise<ValidateResponse | null>>();

function schemaLoadKey(
  requestEditContext: RequestEditContext,
  startEditingSession: boolean,
): string {
  return [
    requestEditContext.rc.yacURL ?? '',
    requestEditContext.rc.entityTypeName,
    requestEditContext.mode,
    requestEditContext.entityName ?? '',
    startEditingSession,
  ].join('|');
}

/**
 * Get the schema (and validated data) for the current entity. Name + actions are
 * never injected into the schema/data: they live in the always-visible
 * MetaInfoPanel (see `view/.../ExpertMode/MetaInfoPanel`).
 *
 * @param requestEditContext
 * @param [startEditingSession=true] If true, records the initial data + YAML
 *    (the baseline used for the YAML diff and concurrency detection).
 */
export async function retreiveSchema(
  requestEditContext: RequestEditContext,
  startEditingSession: boolean = true,
): Promise<ValidateResponse | null> {
  if (requestEditContext.rc.yacURL == null) return null;

  // The load belongs to the session that dispatched it. If the user navigates
  // to another entity while it is in flight, the result must neither be
  // rendered nor have touched the session baselines (checked again inside).
  const epoch = currentSession();

  const key = schemaLoadKey(requestEditContext, startEditingSession);
  const running = inflightSchemaLoads.get(key);
  if (running !== undefined) {
    const resp = await running;
    if (resp == null || isStaleSession(epoch)) return null;
    return structuredClone(resp);
  }

  const load =
    requestEditContext.mode === 'create'
      ? retreiveNewCreateSchema(requestEditContext, epoch)
      : retreiveEditSchema(requestEditContext, startEditingSession, epoch);
  inflightSchemaLoads.set(key, load);
  try {
    const resp = await load;
    return isStaleSession(epoch) ? null : resp;
  } finally {
    inflightSchemaLoads.delete(key);
  }
}

/**
 * Get the editing schema for an existing entity.
 */
async function retreiveEditSchema(
  requestEditContext: RequestEditContext,
  startEditingSession: boolean = true,
  epoch: number = currentSession(),
): Promise<ValidateResponse | null> {
  if (requestEditContext.entityName == null) return null;

  const entityData = await getEntityData(requestEditContext.entityName, requestEditContext.rc);
  if (entityData == null) {
    return null;
  }
  // The user navigated away while the entity was being fetched: the session
  // baselines below belong to the NEW session and must not be overwritten.
  if (isStaleSession(epoch)) return null;

  // Read mode is a pure view: show the stored YAML verbatim and never materialize
  // defaults into it.
  const isReadMode = requestEditContext.mode === 'read';

  // The stabilization patch/diff must be relative to what is actually stored, so
  // seed the baseline with the stored data before the loop runs (in edit mode it
  // is replaced with the stabilized state below).
  editingState.initialData = structuredClone(entityData.data);

  const valResp = await coreUpdate(
    entityData.data,
    requestEditContext,
    true,
    NO_ACTIONS,
    requestEditContext.entityName,
    // In edit mode, merge any missing defaults INTO the stored YAML
    // (comment-preserving) so the *displayed* document already contains them. In
    // read mode we keep the stored YAML as-is.
    isReadMode ? undefined : entityData.yaml,
    undefined,
    // Loads merge into the STORED file, so they diff against the stored data
    // (`initialData` seeded above) — even on a same-session re-load where the
    // canonical pair is already seeded.
    false,
    0,
    epoch,
  );

  if (valResp == null || isStaleSession(epoch)) {
    return null;
  }

  if (startEditingSession) {
    // The diff/commit baseline is ALWAYS the original stored YAML. It is sent to
    // the backend as `yaml_old`, which must equal what is on disk or conflict
    // detection false-fires ("data has changed in the meantime"); and keeping it
    // as the stored file makes the editor highlight the injected defaults as
    // additions, so the user can see that what is shown is not verbatim on disk.
    setInitialEntityYAML(entityData.yaml);
    // Keep the stabilized data as the session baseline. (User edits diff
    // against the canonical pair seeded below; this remains the fallback for
    // any validation racing in before the seed.)
    editingState.initialData = structuredClone(isReadMode ? entityData.data : valResp.data);
  }

  // Editor display: the defaulted YAML in edit mode (diffed green against the
  // stored baseline above), the stored YAML verbatim in read mode.
  valResp.yaml = isReadMode ? entityData.yaml : (valResp.yaml ?? entityData.yaml);

  if (startEditingSession) {
    // Seed the canonical pair right here (not only in the lazily-loaded
    // Monaco pane's initializer): a form edit made before the editor mounts
    // must already diff against this document and merge into this YAML.
    seedCanonical(structuredClone(valResp.data), valResp.yaml);
  }

  return valResp;
}

/**
 * Get the create schema for a new entity.
 */
async function retreiveNewCreateSchema(
  requestEditContext: RequestEditContext,
  epoch: number = currentSession(),
): Promise<ValidateResponse | null> {
  const valResp: Nullable<ValidateResponse> = await getSchema(requestEditContext);
  if (valResp == null) {
    return null;
  }
  // Navigated away mid-fetch: insertDefaults would seed the NEW session's
  // previousDefaultsObject with this (abandoned) schema's defaults.
  if (isStaleSession(epoch)) return null;

  insertDefaults(valResp);
  // Generate `random_string` values for ALL tabs now (the renderer's own
  // mount-time generation only reaches controls on the currently open tab).
  injectEagerRandomStrings(valResp);

  return await updateSchema(valResp.data, requestEditContext, false, false);
}

/**
 * Update URL to include the new name.
 * Should only be called for the create mode. (will not do anything for editing.)
 * @param name
 * @param requestEditContext
 */
export function editViewNavigateToNewName(
  name: Nullable<string>,
  requestEditContext: RequestEditContext,
) {
  if (
    requestEditContext.mode == 'create' &&
    // This fixes the latent redirect when the user just navigated away
    window.location.pathname.startsWith(
      `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}`,
    )
  ) {
    if (name != null) {
      navigateToURL(
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/${name}`,
      );
    } else {
      navigateToURL(
        `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/${requestEditContext.mode}/`,
      );
    }
  }
}

export function setYACValidateResponse(yacResponse: string) {
  editingState.yacResponse = yacResponse;
}

export function setYACValidStatus(valid: boolean) {
  editingState.isValidYAC = valid;
}

export function getYACValidateResponse() {
  return editingState.yacResponse;
}

export function getInitialEntityYAML() {
  return editingState.initialYAML;
}

export function setInitialEntityYAML(yaml: string) {
  editingState.initialYAML = yaml;
  // The commit baseline moved: re-derive whether there is anything to commit.
  emitChangeState();
}

export function getPreviousDefaultsObject() {
  return editingState.previousDefaultsObject;
}

export function setPreviousDefaultsObject(data: unknown) {
  editingState.previousDefaultsObject = data;
}

export function getAJV(): Ajv {
  return editingState.ajv;
}

/** Display-validation Ajv (no `useDefaults`) — see EditCtrlState.ajvValidate. */
export function getValidationAJV(): Ajv {
  return editingState.ajvValidate;
}

/**
 * Safety net for `coreUpdate`'s stabilization loop: deep nesting can
 * legitimately need many passes, but a pass count this high means the
 * defaults/cleanup handling oscillates instead of converging.
 */
const CORE_UPDATE_MAX_PASSES = 100;

/**
 * Subroutine which performs as many validates as it
 * is necessary to stabilize out the data object. That is, it validates and if new parameters
 * with defaults appear or parameters are removed and the data needs to be cleared up.
 * @param entityData
 * @param requestEditContext
 * @param doRevalidate
 * @param editActions
 * @param name
 * @returns
 *
 * @note Internal (controller) use only.
 */
export async function coreUpdate(
  entityData: { [key: string]: unknown },
  requestEditContext: RequestEditContext,
  doRevalidate: boolean,
  editActions: EditActionSnapshot,
  name: Nullable<string>,
  // The YAML the form patch should be merged into (comment-preserving). Passed
  // for user form edits; omitted on initial loads (then the stored YAML is used).
  yamlBase?: string,
  // The validation-seq stamp of the user edit driving this update (loads pass
  // none). A newer stamped edit supersedes this whole stabilization chain.
  seq?: number,
  // Whether to diff against the canonical pair (user edits, merged into the
  // LIVE editor document) or the session-load baseline (schema loads, merged
  // into the STORED file). Must match what `yamlBase` carries.
  useCanonicalBaseline: boolean = true,
  // Internal: number of stabilization passes already performed.
  pass: number = 0,
  // The session this update belongs to; captured at the first pass.
  epoch: number = currentSession(),
) {
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
  }

  // Re-emit session-stripped keys as `~undefined` so the additive YAML merge
  // (`yaml.update` on `yaml_base`) actually unsets them. Without this, a default
  // that appeared and disappeared (e.g. a toggled `yac_if`) leaves its now-illegal
  // value lingering in the editor YAML and blocks the commit. `entityData` is a
  // clone owned by `updateSchema`, so mutating `data` (which may alias it in
  // create mode) never touches the live form state.
  applyStrippedPaths(data, entityData);

  const valResp: Nullable<ValidateResponse> = await validate(
    name,
    data,
    requestEditContext,
    editActions,
    yamlBase,
  );
  if (valResp == null) return null;

  // The session changed while the request was in flight (navigation to another
  // entity): none of the writes below may touch the new session's state.
  if (isStaleSession(epoch)) return null;

  // A newer user edit was dispatched meanwhile: stop this stabilization chain.
  // Its status, defaults bookkeeping and stripped-path records would describe a
  // document the panes no longer show; the newer edit's own chain (which set
  // out from the newer data) replaces all of it. The caller re-checks the seq
  // and drops the returned response.
  if (seq !== undefined && isStaleValidation(seq)) return valResp;

  setYACStatus(valResp.valid, valResp.detail, valResp.usages);
  if (valResp.perms) setEntityPerms(valResp.perms);
  const didChange = handleDefaults(entityData, valResp, requestEditContext);

  // do revalidation here!
  // See ephemeral property problem.
  if (doRevalidate && didChange) {
    if (pass >= CORE_UPDATE_MAX_PASSES) {
      logError(
        `coreUpdate did not stabilize after ${CORE_UPDATE_MAX_PASSES} passes; aborting revalidation loop`,
        'EditController/shared.ts coreUpdate',
      );
      return valResp;
    }
    return await coreUpdate(
      valResp.data,
      requestEditContext,
      doRevalidate,
      editActions,
      name,
      yamlBase,
      seq,
      useCanonicalBaseline,
      pass + 1,
      epoch,
    );
  }
  return valResp;
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
    getAllErrors(valResp.data, valResp.json_schema, getAJV(), (e: any) => {
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
    const path: string[] = JSON.parse(encoded);
    if (hasAtPath(data, path)) {
      editingState.strippedPaths.delete(encoded);
    } else {
      setUndefinedAtPath(patch, path);
    }
  }
}

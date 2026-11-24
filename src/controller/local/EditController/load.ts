/** Loading the entity of an editing session. */
import { getEntityData } from '../../../model/entityData';
import { getSchema } from '../../../model/validate';
import { insertDefaults } from '../../../utils/schema/defaultsHandling';
import { injectEagerRandomStrings } from '../../../utils/schema/eagerValues';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { ValidateResponse } from '../../../utils/types/internal/validation';
import { Nullable } from '../../../utils/types/typeUtils';
import editingState from '../../state/EditCtrlState';
import { seedCanonical, setInitialEntityYAML } from './editState';
import { validateFormData } from './formPane';
import { currentSession, isStaleSession } from './session';
import { coreUpdate } from './stabilize';

// The form pane and the (lazily loaded) Monaco editor both request the schema
// of the session. The load works on module-global state (baselines, defaults,
// stripped paths, generated values) and must run exactly once per session:
// both panes share its result, each getting its own copy.
const sessionSchemaLoads = new Map<string, Promise<ValidateResponse | null>>();

function schemaLoadKey(requestEditContext: RequestEditContext, epoch: number): string {
  return [
    epoch,
    requestEditContext.rc.yacURL ?? '',
    requestEditContext.rc.entityTypeName,
    requestEditContext.mode,
    requestEditContext.entityName ?? '',
  ].join('|');
}

/**
 * Load the entity of the session: its schema, the validated data (with
 * defaults) and the YAML to show. Sets the session's commit baseline and the
 * canonical pair. Name and actions are not part of the data (see
 * `view/pages/Edit/MetaInfoPanel`).
 */
export async function loadEntitySchema(
  requestEditContext: RequestEditContext,
): Promise<ValidateResponse | null> {
  if (requestEditContext.rc.yacURL == null) return null;

  // The load belongs to the session that dispatched it. If the user navigates
  // to another entity while it is in flight, the result must neither be
  // rendered nor have touched the session baselines (checked again inside).
  const epoch = currentSession();

  const key = schemaLoadKey(requestEditContext, epoch);
  let load = sessionSchemaLoads.get(key);
  if (load === undefined) {
    load =
      requestEditContext.mode === 'create'
        ? loadCreateSchema(requestEditContext, epoch)
        : loadEditSchema(requestEditContext, epoch);
    // Only the current session's loads are worth keeping.
    for (const k of sessionSchemaLoads.keys()) {
      if (!k.startsWith(`${epoch}|`)) sessionSchemaLoads.delete(k);
    }
    sessionSchemaLoads.set(key, load);
  }
  const resp = await load;
  if (resp == null || isStaleSession(epoch)) return null;
  return structuredClone(resp);
}

/**
 * Get the editing schema for an existing entity.
 */
async function loadEditSchema(
  requestEditContext: RequestEditContext,
  epoch: number,
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

  const valResp = await coreUpdate(entityData.data, requestEditContext, {
    doRevalidate: true,
    actions: [],
    name: requestEditContext.entityName,
    // In edit mode, merge any missing defaults INTO the stored YAML
    // (comment-preserving) so the *displayed* document already contains them. In
    // read mode we keep the stored YAML as-is.
    yamlBase: isReadMode ? undefined : entityData.yaml,
    // Loads merge into the STORED file, so they diff against the stored data
    // (`initialData` seeded above) — even on a same-session re-load where the
    // canonical pair is already seeded.
    useCanonicalBaseline: false,
    epoch,
  });

  if (valResp == null || isStaleSession(epoch)) {
    return null;
  }

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

  // Editor display: the defaulted YAML in edit mode (diffed green against the
  // stored baseline above), the stored YAML verbatim in read mode.
  valResp.yaml = isReadMode ? entityData.yaml : (valResp.yaml ?? entityData.yaml);

  // Seed the canonical pair right here (not only in the lazily-loaded
  // Monaco pane's initializer): a form edit made before the editor mounts
  // must already diff against this document and merge into this YAML.
  seedCanonical(structuredClone(valResp.data), valResp.yaml);

  return valResp;
}

/**
 * Get the create schema for a new entity.
 */
async function loadCreateSchema(
  requestEditContext: RequestEditContext,
  epoch: number,
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

  return await validateFormData(valResp.data, requestEditContext, false);
}

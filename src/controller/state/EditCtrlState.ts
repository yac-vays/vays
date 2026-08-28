/* eslint-disable @typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { ActionDecl, LimitUsage } from '../../utils/types/api';
import { RequestEditContext } from '../../utils/types/internal/request';

/**
 * The single state of the entity editor. The editor has one form pane and one
 * YAML pane (previously separate "standard"/"expert" modes); their state is
 * unified here.
 */
class EditControlState {
  /**
   * Whether the most recent validation has returned, that the data is valid.
   */
  public isValidYAC: boolean = false;

  /**
   * The most recent YAC response.
   */
  public yacResponse: string = '';

  /**
   * The `limits` usages from the most recent validation (for the UI usage
   * indicator). Empty for read/delete and types without limits.
   */
  public yacUsages: LimitUsage[] = [];

  /**
   * Whether the most recent local validation has worked out.
   */
  public isValidLocal: boolean = false;

  /**
   * The user's (expanded) permissions for the edited entity, as reported by
   * the most recent validation (`ValidationResult.perms`). Used to decide
   * whether to offer the admin override; the backend re-checks on commit.
   */
  public entityPerms: string[] = [];

  /**
   * Admin override ("admin mode"): when unlocked (requires the "adm"
   * permission), the commit is sent with `force=true` and the Commit button
   * ignores validation errors. Reset on every new session and after each
   * successful commit — the override is per-commit intent, not a mode.
   */
  public adminOverride: boolean = false;

  /**
   * The Ajv object used for inserting the defaults.
   */
  readonly ajv = new Ajv({ allErrors: true, useDefaults: true, strict: false });

  /**
   * The object containing all defaults for the schema of the most recent validation.
   */
  public previousDefaultsObject: any = null;

  /**
   * The data as it was received before any editing has taken place.
   */
  public initialData: any = {};

  /**
   * Paths (as JSON-encoded `string[]` segment arrays) of keys that the schema
   * forbade and that `removeOldData` stripped from the form data this session —
   * typically session-added `yac_if` defaults that became illegal when their
   * condition flipped back to false.
   *
   * The form data is cleaned in place, but the YAML the backend writes is the
   * additive merge of a patch into `yaml_base`; a key that is absent from both
   * `initialData` and the current data produces no patch entry, so it would
   * linger in the YAML and block the commit. We re-emit each of these paths as
   * `~undefined` in the outgoing patch so the merge actually unsets them. An
   * entry is dropped once its key reappears in the data (condition re-met).
   * Reset at the start of every editing session (see `clearYACStatus`).
   */
  public strippedPaths: Set<string> = new Set();

  /**
   * The most recently fetched YAML file content
   */
  public initialYAML: string = '';

  /**
   * Whether the user has made unsaved edits in the current editing session.
   * Used to warn before navigating away (see `EditFrame`'s navigation blocker).
   */
  public isDirty: boolean = false;

  //
  // Side-by-side (form + YAML) synchronization.
  //
  // Both panes are projections of a single canonical `{data, yaml}` pair that
  // the `/validate` endpoint produces. The pane the user edits is authoritative;
  // the other pane is rewritten from the canonical projection. See
  // `controller/local/EditController/sync.ts`.
  //

  /** The data object from the most recent (canonical) validation. */
  public canonicalData: any = {};

  /** The canonical YAML from the most recent validation (comments preserved). */
  public canonicalYAML: string = '';

  /** Which pane the user is currently editing (for focus styling / reconcile). */
  public activePane: 'form' | 'yaml' | null = null;

  /**
   * Monotonic id stamped on every validation dispatch. A response whose id is
   * older than the latest dispatch is dropped (latest-wins), so a slow form
   * validation cannot clobber a newer YAML edit (or vice versa).
   */
  public validationSeq: number = 0;

  /**
   * The editing-session epoch (see `EditController/session.ts`). Bumped when a
   * new session starts (view mount or target change); async flows capture it
   * at dispatch and must not write to this state once it has moved on.
   */
  public sessionSeq: number = 0;

  /**
   * Whether the canonical `{data, yaml}` pair has been seeded for the CURRENT
   * session. Meta-triggered revalidation (`revalidateMeta`) reads the canonical
   * data as its input; before the session's schema load has seeded it, that
   * would validate the previous session's document — so it waits for this.
   */
  public canonicalSeeded: boolean = false;

  /**
   * Programmatic-write guards. When one pane is rewritten from the canonical
   * projection, its change event must not be treated as a user edit (which
   * would re-validate and bounce back, looping). The writer sets the flag; the
   * change handler consumes it and bails out once.
   */
  public suppressNextFormChange: boolean = false;
  public suppressNextYamlChange: boolean = false;

  //
  // Form pane state.
  //

  /** The entity data object currently held by the form. */
  public entityDataObject: any = {};

  /** Whether the user is currently editing a string (adjusts the loading hint). */
  public userIsEditingString: boolean = false;

  /** The selected form tab, kept across schema re-renders. */
  public currentTab: number = 0;

  /** Listener that receives per-category error flags (for tab error dots). */
  public onUpdateCategoryErrors: (v: boolean[]) => void = () => {};

  /** Latest per-category error flags. */
  public catErrs?: boolean[] = undefined;

  //
  // YAML pane state.
  //

  /** The edit context, needed by the (long-lived) Monaco update plugin. */
  public currentEditContext: RequestEditContext | null = null;

  /** The configured monaco-yaml instance. */
  public monacoyaml: any = null;

  /**
   * The (unpatched) JSON schema of the most recent validation — for the
   * editor's schema-driven features (context-menu field help).
   */
  public currentJsonSchema: any = null;

  /** The YAML currently held by the editor (also the save payload). */
  public entityYAML: string | undefined = undefined;

  /** The entity name (owned by the MetaInfoPanel). */
  public entityName: string | null = null;

  /** The triggerable actions activated in the MetaInfoPanel. */
  public activatedActions: ActionDecl[] = [];

  /** Callbacks bridging controller -> view (validation spinner, error text). */
  public _setIsValidating: (v: boolean) => void = () => {};
  public _setErrorMessage: (v: string) => void = () => {};
}

const editingState = new EditControlState();
export default editingState;

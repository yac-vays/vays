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

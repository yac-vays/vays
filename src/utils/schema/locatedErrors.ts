/* eslint-disable @typescript-eslint/no-explicit-any */
import { toDataPath } from '@jsonforms/core';
import { ErrorObject } from 'ajv';
import { ValidateResponse } from '../types/internal/validation';

/**
 * Bridges a YAC (backend) schema-validation error onto the JSON Forms UI.
 *
 * YAC validates the *merged* data and reports a single error together with its
 * location (`data_loc`, e.g. `#/users_root`). JSON Forms, on the other hand,
 * routes errors to the renderer of a control by the control's instance path.
 * This helper converts the backend error into an `additionalErrors` entry that
 * JSON Forms can route, and tells the caller whether a control actually exists
 * for that location -- so the footer status bar is only used as a fallback when
 * the error cannot be shown inline.
 */

/**
 * Convert a YAC data location (`#/users_root/0`) into an AJV instance path
 * (`/users_root/0`). Returns `''` for the document root (`#`) / empty input.
 */
export function dataLocToInstancePath(dataLoc: string | undefined): string {
  if (!dataLoc) return '';
  return dataLoc.replace(/^#/, '');
}

/** Collect the dotted instance paths of every Control in a UI schema. */
export function collectControlPaths(uiSchema: any, acc: string[] = []): string[] {
  if (uiSchema == null || typeof uiSchema !== 'object') return acc;
  if (uiSchema.type === 'Control' && typeof uiSchema.scope === 'string') {
    acc.push(toDataPath(uiSchema.scope));
  }
  if (Array.isArray(uiSchema.elements)) {
    for (const el of uiSchema.elements) collectControlPaths(el, acc);
  }
  return acc;
}

/** Convert an AJV instance path (`/users_root/0`) to a dotted path (`users_root.0`). */
export function instancePathToDotted(instancePath: string): string {
  return instancePath.replace(/^\//, '').replace(/\//g, '.');
}

/**
 * Whether an error at `dottedErrorPath` belongs to the control at `controlPath`:
 * the control sits exactly at the location or is an ancestor of it (e.g. an
 * array control owning an item error, or an object control owning a field error).
 */
export function controlOwnsPath(controlPath: string, dottedErrorPath: string): boolean {
  return (
    controlPath !== '' &&
    (dottedErrorPath === controlPath || dottedErrorPath.startsWith(controlPath + '.'))
  );
}

export interface LocatedBackendError {
  /** Errors to hand to `<JsonForms additionalErrors=...>` (empty if none). */
  additionalErrors: ErrorObject[];
  /** Whether the error is shown inline on a control (vs. the footer fallback). */
  shownInForm: boolean;
}

const NONE: LocatedBackendError = { additionalErrors: [], shownInForm: false };

/**
 * Decide how to present a validation response's error. When the response is
 * valid, or the error has no in-form location (request-level error, document
 * root, a control that is not rendered, or a keyword JSON Forms handles
 * generically), the error is left to the footer status bar.
 */
export function locateBackendError(resp: ValidateResponse): LocatedBackendError {
  if (resp.valid) return NONE;

  const instancePath = dataLocToInstancePath(resp.data_loc);
  if (instancePath === '') return NONE; // request-level error or document root

  const dotted = instancePathToDotted(instancePath);
  const controlPaths = collectControlPaths(resp.ui_schema);

  // The error is displayable inline if a control sits exactly at the location
  // or is an ancestor of it (e.g. an array control showing an item error).
  const shownInForm = controlPaths.some((cp) => controlOwnsPath(cp, dotted));
  if (!shownInForm) return NONE;

  // Use a neutral keyword so JSON Forms does not filter the error away as one
  // of the combinator/additionalProperties keywords it handles generically.
  const error: ErrorObject = {
    instancePath,
    schemaPath: (resp.json_schema_loc ?? '#').replace(/^#/, ''),
    keyword: 'yac',
    params: {},
    message: resp.detail,
  };
  return { additionalErrors: [error], shownInForm: true };
}

/**
 * The message for the always-visible footer status bar. Inline control errors
 * only show when the offending field's tab is open *and* the control is rendered
 * (JSON Forms mounts only the active categorization tab), so an inline-only error
 * is invisible whenever the user is on another tab — yet the commit stays
 * blocked. The footer is tab-independent, so it is the reliable explainer: show
 * the reason here whenever the response is invalid.
 *
 * For a locatable schema error the field path is prefixed (e.g.
 * `monitoring_enabled: 'no' is not of type 'boolean'`) so the user knows where to
 * look; request-level / document-root errors fall back to the bare detail.
 */
export function footerErrorMessage(resp: ValidateResponse): string {
  if (resp.valid) return '';
  const instancePath = dataLocToInstancePath(resp.data_loc);
  if (instancePath === '') return resp.detail;
  return `${instancePathToDotted(instancePath)}: ${resp.detail}`;
}

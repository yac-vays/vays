import { describe, expect, it } from 'vitest';
import {
  collectControlPaths,
  controlOwnsPath,
  dataLocToInstancePath,
  instancePathToDotted,
  locateBackendError,
} from './locatedErrors';
import { ValidateResponse } from '../types/internal/validation';

const baseUiSchema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/users_root' },
    {
      type: 'Group',
      elements: [{ type: 'Control', scope: '#/properties/networking/properties/gateway' }],
    },
  ],
};

const resp = (over: Partial<ValidateResponse>): ValidateResponse => ({
  json_schema: {},
  ui_schema: baseUiSchema as ValidateResponse['ui_schema'],
  data: {},
  valid: false,
  detail: "'~undefined' is not of type 'array'",
  ...over,
});

describe('dataLocToInstancePath', () => {
  it('strips the leading # and keeps an AJV instance path', () => {
    expect(dataLocToInstancePath('#/users_root')).toBe('/users_root');
    expect(dataLocToInstancePath('#/users_root/0')).toBe('/users_root/0');
    expect(dataLocToInstancePath('#')).toBe('');
    expect(dataLocToInstancePath(undefined)).toBe('');
  });
});

describe('locateBackendError', () => {
  it('routes a located error to a matching control', () => {
    const { additionalErrors, shownInForm } = locateBackendError(
      resp({ data_loc: '#/users_root', json_schema_loc: '#/properties/users_root/type' }),
    );
    expect(shownInForm).toBe(true);
    expect(additionalErrors).toHaveLength(1);
    expect(additionalErrors[0].instancePath).toBe('/users_root');
    expect(additionalErrors[0].message).toContain('array');
  });

  it('routes an array-item error to its ancestor array control', () => {
    const { shownInForm, additionalErrors } = locateBackendError(resp({ data_loc: '#/users_root/2' }));
    expect(shownInForm).toBe(true);
    expect(additionalErrors[0].instancePath).toBe('/users_root/2');
  });

  it('routes a nested control error through a Group', () => {
    expect(locateBackendError(resp({ data_loc: '#/networking/gateway' })).shownInForm).toBe(true);
  });

  it('falls back to the footer when no control matches', () => {
    expect(locateBackendError(resp({ data_loc: '#/unknown_field' }))).toEqual({
      additionalErrors: [],
      shownInForm: false,
    });
  });

  it('falls back to the footer for document-root / request-level errors', () => {
    expect(locateBackendError(resp({ data_loc: '#' })).shownInForm).toBe(false);
    expect(locateBackendError(resp({ data_loc: undefined })).shownInForm).toBe(false);
  });

  it('does nothing for a valid response', () => {
    expect(locateBackendError(resp({ valid: true, data_loc: '#/users_root' }))).toEqual({
      additionalErrors: [],
      shownInForm: false,
    });
  });
});

describe('control-path helpers (shared with tab mapping)', () => {
  it('instancePathToDotted converts AJV paths', () => {
    expect(instancePathToDotted('/users_root')).toBe('users_root');
    expect(instancePathToDotted('/users_root/0')).toBe('users_root.0');
    expect(instancePathToDotted('')).toBe('');
  });

  it('collectControlPaths gathers dotted scopes from a nested UI schema', () => {
    expect(collectControlPaths(baseUiSchema)).toEqual(['users_root', 'networking.gateway']);
  });

  it('controlOwnsPath matches exact and descendant paths', () => {
    expect(controlOwnsPath('users_root', 'users_root')).toBe(true);
    expect(controlOwnsPath('users_root', 'users_root.0')).toBe(true);
    expect(controlOwnsPath('networking', 'networking.gateway')).toBe(true);
  });

  it('controlOwnsPath does NOT match on a shared prefix (the tab-dot regression)', () => {
    // `system` must not own an error on the distinct field `system_type`.
    expect(controlOwnsPath('system', 'system_type')).toBe(false);
    expect(controlOwnsPath('users', 'users_root')).toBe(false);
    expect(controlOwnsPath('', 'anything')).toBe(false);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  consumeEagerGenerated,
  injectEagerRandomStrings,
  resetEagerGenerated,
} from './eagerValues';
import { ValidateResponse } from '../types/internal/validation';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const control = (scope: string, options?: any) => ({ type: 'Control', scope, options });

const resp = (uiElements: any[], data: any = {}, jsonSchema: any = {}): ValidateResponse =>
  ({
    json_schema: jsonSchema,
    ui_schema: {
      type: 'Categorization',
      elements: [{ type: 'Category', label: 'Tab', elements: uiElements }],
    },
    data,
  }) as ValidateResponse;

describe('injectEagerRandomStrings', () => {
  beforeEach(() => resetEagerGenerated());

  it('generates for a random_string control on any (unmounted) tab', () => {
    const r = resp([
      control('#/properties/token', {
        renderer: 'random_string',
        renderer_options: { format: 'uuid' },
      }),
    ]);
    injectEagerRandomStrings(r);
    expect(r.data.token).toMatch(UUID_RE);
    expect(consumeEagerGenerated('token')).toBe(true);
    // one-shot
    expect(consumeEagerGenerated('token')).toBe(false);
  });

  it('uses the default format/length without renderer_options', () => {
    const r = resp([control('#/properties/token', { renderer: 'random_string' })]);
    injectEagerRandomStrings(r);
    expect(r.data.token).toMatch(/^[A-Za-z0-9]{32}$/);
  });

  it('follows a nested object Control options.detail (vays_object_details shape)', () => {
    const r = resp([
      control('#/properties/identity', {
        detail: {
          type: 'Group',
          label: 'Identity',
          elements: [
            control('#/properties/uuid', {
              renderer: 'random_string',
              renderer_options: { format: 'uuid' },
            }),
            control('#/properties/hostname'),
          ],
        },
      }),
    ]);
    injectEagerRandomStrings(r);
    expect(r.data.identity.uuid).toMatch(UUID_RE);
    expect(r.data.identity.hostname).toBeUndefined();
    expect(consumeEagerGenerated('identity.uuid')).toBe(true);
  });

  it('keeps existing data and respects a schema default', () => {
    const withData = resp(
      [control('#/properties/token', { renderer: 'random_string' })],
      { token: 'kept' },
    );
    injectEagerRandomStrings(withData);
    expect(withData.data.token).toBe('kept');
    expect(consumeEagerGenerated('token')).toBe(false);

    const withDefault = resp(
      [control('#/properties/token', { renderer: 'random_string' })],
      {},
      { type: 'object', properties: { token: { type: 'string', default: 'from-spec' } } },
    );
    injectEagerRandomStrings(withDefault);
    expect(withDefault.data.token).toBeUndefined();
  });

  it('skips spec errors and non-random_string controls', () => {
    const r = resp([
      control('#/properties/bad', {
        renderer: 'random_string',
        renderer_options: { format: 'nope' },
      }),
      control('#/properties/custom', {
        renderer: 'random_string',
        renderer_options: { format: 'custom' }, // missing charset
      }),
      control('#/properties/plain'),
    ]);
    injectEagerRandomStrings(r);
    expect(r.data).toEqual({});
  });

  it('skips array row templates (options.details)', () => {
    const r = resp([
      control('#/properties/keys', {
        details: {
          elements: [control('#', { renderer: 'random_string' })],
        },
      }),
    ]);
    injectEagerRandomStrings(r);
    expect(r.data).toEqual({});
  });
});

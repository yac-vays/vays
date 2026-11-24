import { typeCheck } from 'type-check';
import { expect, test } from 'vitest';
import {
  TYPE_CHECK_ENTITY_DATA,
  TYPE_CHECK_ENTITY_LOG,
  TYPE_CHECK_ENTITY_LOG_CONTENT,
  TYPE_CHECK_ENTITY_OBJECT,
  TYPE_CHECK_ENTITY_TYPE_DECL,
  TYPE_CHECK_LINK_DECL,
  TYPE_CHECK_LOG_DECL,
  TYPE_CHECK_VALIDATE_RESP,
} from '../../src/utils/types/api';
import { normalizeUiSchema } from '../../src/model/validate';

const LISTED = {
  name: 'isg-kiosk',
  link: null,
  options: { '#/spec/users': ['alice'] },
  links: { gitlab: 'https://git.example.com/isg/kiosk' },
  perms: ['see', 'edt'],
};
const DETAILED = { ...LISTED, data: { spec: {} }, yaml: 'spec: {}\n', hash: 'h' };

test('entities with links pass the checks', () => {
  expect(typeCheck(`[${TYPE_CHECK_ENTITY_OBJECT}]`, [LISTED])).toBe(true);
  expect(typeCheck(TYPE_CHECK_ENTITY_DATA, DETAILED)).toBe(true);
});

test('entities from YAC versions without links still pass', () => {
  const { links: _l, ...listed } = LISTED;
  const { links: _d, ...detailed } = DETAILED;
  expect(typeCheck(`[${TYPE_CHECK_ENTITY_OBJECT}]`, [listed])).toBe(true);
  expect(typeCheck(TYPE_CHECK_ENTITY_DATA, detailed)).toBe(true);
});

test('link declarations pass the check', () => {
  expect(typeCheck(TYPE_CHECK_LINK_DECL, { name: 'a', title: 'A', icon: '<svg/>' })).toBe(true);
});

test('logs as YAC sends them pass the checks', () => {
  const decl = {
    name: 'facts',
    title: 'Facts',
    description: '',
    renderer: 'document',
    options: { language: 'yaml' },
  };
  expect(typeCheck(TYPE_CHECK_LOG_DECL, decl)).toBe(true);

  const log = {
    name: 'facts',
    message: '',
    time: 'Wed, 18 Nov 2026 13:12:55 GMT',
    progress: null,
    problem: false,
    has_content: true,
  };
  expect(typeCheck(`[${TYPE_CHECK_ENTITY_LOG}]`, [log])).toBe(true);
  const withoutContent: Partial<typeof log> = { ...log };
  delete withoutContent.has_content;
  expect(typeCheck(`[${TYPE_CHECK_ENTITY_LOG}]`, [withoutContent])).toBe(false);

  expect(
    typeCheck(TYPE_CHECK_ENTITY_LOG_CONTENT, { name: 'facts', time: '', content: 'a: 1\n' }),
  ).toBe(true);
});

test('a validation of a type without form fields (empty ui_schema) is accepted', () => {
  const resp = {
    schemas: {
      json_schema: { type: 'object', properties: { owner: { type: 'string' } } },
      ui_schema: {}, // YAC: no field has a vays_category
      data: { owner: 'alice' },
      valid: true,
      message: null,
      yaml: 'owner: alice\n',
    },
    request: { valid: true, message: null },
    usages: [],
    perms: ['see', 'edt'],
  };
  expect(typeCheck(TYPE_CHECK_VALIDATE_RESP, resp)).toBe(true);
  expect(normalizeUiSchema(resp.schemas.ui_schema)).toEqual({
    type: 'VerticalLayout',
    elements: [],
  });
  const layout = {
    type: 'Categorization',
    elements: [{ type: 'Category', label: 'General', elements: [] }],
  };
  expect(normalizeUiSchema(layout)).toBe(layout);
});

test('fields added by a newer YAC are tolerated, on every level', () => {
  expect(typeCheck(`[${TYPE_CHECK_ENTITY_OBJECT}]`, [{ ...LISTED, future: 1 }])).toBe(true);
  expect(typeCheck(TYPE_CHECK_ENTITY_DATA, { ...DETAILED, future: 1 })).toBe(true);
  const type = {
    name: 'host',
    title: 'Host',
    name_pattern: '.*',
    name_example: 'a',
    name_generated: 'never',
    description: '',
    create: true,
    delete: true,
    edit: true,
    options: [],
    logs: [{ name: 'l', title: 'L', description: '', renderer: 'list', options: {}, future: 1 }],
    actions: [],
    favorites: [{ name: 'edit', action: false, future: 1 }],
    future: 1,
  };
  expect(typeCheck(TYPE_CHECK_ENTITY_TYPE_DECL, type)).toBe(true);
  const validation = {
    schemas: { json_schema: {}, ui_schema: { future: 1 }, data: {}, valid: true, future: 1 },
    request: { valid: true, future: 1 },
    usages: [{ title: 't', used: 1, max: 2, ok: true, future: 1 }],
    future: 1,
  };
  expect(typeCheck(TYPE_CHECK_VALIDATE_RESP, validation)).toBe(true);
});

test('missing or mistyped fields are still rejected', () => {
  const { perms: _p, ...noPerms } = LISTED;
  expect(typeCheck(`[${TYPE_CHECK_ENTITY_OBJECT}]`, [noPerms])).toBe(false);
  expect(typeCheck(TYPE_CHECK_ENTITY_DATA, { ...DETAILED, data: 'x' })).toBe(false);
});

test('an entity without stored YAML (null) passes', () => {
  expect(typeCheck(TYPE_CHECK_ENTITY_DATA, { ...DETAILED, yaml: null })).toBe(true);
});

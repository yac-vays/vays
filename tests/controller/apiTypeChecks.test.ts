import { typeCheck } from 'type-check';
import { expect, test } from 'vitest';
import {
  TYPE_CHECK_ENTITY_DATA,
  TYPE_CHECK_ENTITY_OBJECT,
  TYPE_CHECK_LINK_DECL,
} from '../../src/utils/types/api';

// type-check rejects unknown keys, so every field YAC sends must be declared.
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

import { expect, it } from 'vitest';
import { clampTab } from '../../src/renderers/utils/dataSanitization';

it('clamps the active tab to the tabs that exist', () => {
  expect(clampTab(1, 3)).toBe(1);
  expect(clampTab(2, 2)).toBe(1); // the last tab disappeared
  expect(clampTab(4, 0)).toBe(0);
  expect(clampTab(-1, 3)).toBe(0);
});

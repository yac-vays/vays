/* eslint-disable @typescript-eslint/no-explicit-any */
import { JsonSchema, NOT_APPLICABLE, RankedTester, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vitest';
import { ArrayControlTester } from '../../src/renderers/combined/ArrayRenderer/ArrayRenderer';
import { TextControlTester } from '../../src/renderers/control/TextControlRenderer';
import { BigStringArrayTester } from '../../src/renderers/control/special/BigStringArray';
import { InfoBoxTester } from '../../src/renderers/control/special/InfoBoxRenderer';
import { PasswordRendererTester } from '../../src/renderers/control/special/PasswordRenderer';
import { SSHKeyRendererTester } from '../../src/renderers/control/special/SSHKeyRenderer';
import { customRenderers } from '../../src/renderers';

/**
 * Renderer selection ("tester") tests: JSON Forms dispatches each control to
 * the registered renderer whose tester returns the highest rank. These tests
 * lock in the winners for representative schema/uischema pairs, so a rank
 * shuffle (e.g. InfoBox tying with TextControl at 21, or BigStringArray
 * losing to the generic ArrayRenderer) is caught.
 */

const rootSchema: JsonSchema = {
  type: 'object',
  properties: {
    comment: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

function control(scope: string, options?: Record<string, any>): UISchemaElement {
  return { type: 'Control', scope, ...(options ? { options } : {}) } as UISchemaElement;
}

/** Returns the registered tester(s) achieving the maximum rank for this pair. */
function winners(uischema: UISchemaElement, schema: JsonSchema = rootSchema) {
  const context = { rootSchema: schema, config: {} } as any;
  let best = NOT_APPLICABLE;
  let winning: RankedTester[] = [];
  for (const { tester } of customRenderers) {
    const rank = tester(uischema, schema, context);
    if (rank > best) {
      best = rank;
      winning = [tester];
    } else if (rank === best && rank !== NOT_APPLICABLE) {
      winning.push(tester);
    }
  }
  return { rank: best, testers: winning };
}

describe('renderer tester selection', () => {
  it('plain string control: TextControl wins, InfoBox does not even match', () => {
    const ui = control('#/properties/comment');
    const { testers } = winners(ui);
    expect(testers).toEqual([TextControlTester]); // sole winner, no rank tie
    expect(InfoBoxTester(ui, rootSchema, { rootSchema, config: {} } as any)).toEqual(
      NOT_APPLICABLE,
    );
  });

  it("string control with options.renderer 'info_box': InfoBox beats TextControl", () => {
    const ui = control('#/properties/comment', { renderer: 'info_box' });
    const { rank, testers } = winners(ui);
    expect(testers).toEqual([InfoBoxTester]);
    // The regression: InfoBox used to rank 21 and tie-lose to TextControl.
    expect(rank).toBeGreaterThan(
      TextControlTester(ui, rootSchema, { rootSchema, config: {} } as any),
    );
  });

  it("string control with options.renderer 'password': PasswordRenderer beats TextControl", () => {
    const ui = control('#/properties/comment', { renderer: 'password' });
    const { rank, testers } = winners(ui);
    expect(testers).toEqual([PasswordRendererTester]);
    expect(rank).toBeGreaterThan(
      TextControlTester(ui, rootSchema, { rootSchema, config: {} } as any),
    );
  });

  it("string control with options.renderer 'ssh_key': SSHKeyRenderer beats TextControl", () => {
    const ui = control('#/properties/comment', { renderer: 'ssh_key' });
    const { rank, testers } = winners(ui);
    expect(testers).toEqual([SSHKeyRendererTester]);
    expect(rank).toBeGreaterThan(
      TextControlTester(ui, rootSchema, { rootSchema, config: {} } as any),
    );
  });

  it("primitive string array with options.renderer 'big_string_list': BigStringArray beats ArrayRenderer", () => {
    const ui = control('#/properties/tags', { renderer: 'big_string_list' });
    const { rank, testers } = winners(ui);
    expect(testers).toEqual([BigStringArrayTester]);
    expect(rank).toBeGreaterThan(
      ArrayControlTester(ui, rootSchema, { rootSchema, config: {} } as any),
    );
  });

  it('primitive string array without the option: generic ArrayRenderer wins', () => {
    const ui = control('#/properties/tags');
    const { testers } = winners(ui);
    expect(testers).toEqual([ArrayControlTester]);
  });
});

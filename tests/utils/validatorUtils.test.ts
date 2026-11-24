import { expect, it } from 'vitest';
import { RequestEditContext } from '../../src/utils/types/internal/request';
import { buildValidateRequestBody } from '../../src/utils/validatorUtils';

function ctx(mode: string): RequestEditContext {
  return {
    mode,
    entityName: 'web01',
    rc: { entityTypeName: 'host', accessedEntityType: { name_generated: 'never' } },
  } as unknown as RequestEditContext;
}

it('validates the stored entity in read mode, from the form and from the YAML pane', () => {
  const expected = { operation: 'read', type: 'host', actions: [], name: 'web01', entity: null };
  expect(JSON.parse(buildValidateRequestBody(ctx('read'), { a: 1 }, 'web01'))).toEqual(expected);
  expect(JSON.parse(buildValidateRequestBody(ctx('read'), {}, 'web01', [], 'a: 1\n'))).toEqual(
    expected,
  );
});

it('sends the YAML of a new entity as a create', () => {
  const body = JSON.parse(buildValidateRequestBody(ctx('create'), {}, 'web02', [], 'a: 1\n'));
  expect(body).toMatchObject({ operation: 'create', entity: { name: 'web02', yaml: 'a: 1\n' } });
});

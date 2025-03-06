import { render } from 'react-dom';
import { describe, expect, it, vi } from 'vitest';
import EntityList from '../../src/view/components/EntityList';
import { LIST_RESPONSE } from '../controller/list.test';
import { createFetchResponse, getTestEditRequestContext } from '../testUtils';

global.fetch = vi.fn();

describe('Renders list', async () => {
  it('Should render list and correctly display 3 items', async () => {
    const screen = new window.DocumentFragment();
    //@ts-expect-error The method has been injected above.
    global.fetch.mockResolvedValue(createFetchResponse(LIST_RESPONSE));

    render(
      <EntityList
        requestContext={
          getTestEditRequestContext(
            'https://fantasyurl-for-vays.com',
            'test',
            null,
            'testType',
            'create',
            'standard',
          ).rc
        }
      />,

      screen,
    );

    expect(fetch).toBeCalledTimes(1);
    await new Promise((res) => setTimeout(res, 1000));

    expect(
      screen.textContent?.includes('a-0') &&
        screen.textContent?.includes('a-1') &&
        screen.textContent?.includes('a-2'),
    ).toBeTruthy();
  });
});

import _ from 'lodash';
import { expect, test, vi } from 'vitest';
import { fetchEntities } from '../../src/controller/local/Overview/list';
import { createFetchResponse, getTestEditRequestContext } from '../testUtils';

global.fetch = vi.fn();

export const LIST_RESPONSE = {
  hash: '4d6864798cd156ab3011da35b8ff9ecdde34d343',
  list: [
    {
      name: 'a-0',
      link: null,
      options: {
        inventory_groups: ['all'],
        host_description: '#233377',
        mac_address: '12-12-12-12-12-21',
      },
      perms: ['act', 'add', 'cln', 'cpy', 'del', 'edt', 'lnk', 'rnm', 'see', 'wipe'],
    },
    {
      name: 'a-1',
      link: null,
      options: {
        inventory_groups: ['all', 'headless', 'niggis_test2', 'noble'],
        host_description: '#121212',
        mac_address: '12-12-12-12-12-12',
      },
      perms: ['act', 'add', 'cln', 'cpy', 'del', 'edt', 'lnk', 'rnm', 'see', 'wipe'],
    },
    {
      name: 'a-2',
      link: null,
      options: {
        inventory_groups: [],
        host_description: 'hello#this#is#some#description',
        mac_address: '12:22:12:12:12:12',
      },
      perms: ['act', 'add', 'cln', 'cpy', 'del', 'edt', 'lnk', 'rnm', 'see', 'wipe'],
    },
  ],
};

const RESPONSE = {
  entityName: 'testType',
  partialResults: [
    {
      actionPair: {
        dropdownActs: [
          {
            action: {
              dangerous: false,
              description: '',
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
              name: 'create_copy',
              perms: ['cpy'],
              title: 'Copy Entity',
            },
            performAction: () => {},
          },
          {
            action: {
              dangerous: true,
              description:
                'Deleting the entity will remove it from the index. This action cannot be undone without direct admin support.',
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
              name: 'delete',
              perms: ['del'],
              title: 'Delete Entity',
            },
            performAction: () => {},
          },
          {
            action: {
              dangerous: false,
              description:
                "Creating a link of an entity will create a new 'shallow' entity which takes all values from this entity.",
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M680-160v-120H560v-80h120v-120h80v120h120v80H760v120h-80ZM440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm560-40h-80q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480Z"/></svg>',
              name: 'create_link',
              perms: ['lnk'],
              title: 'Create Link',
            },
            performAction: () => {},
          },
        ],
        favActs: [
          {
            action: {
              dangerous: false,
              description: '',
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
              name: 'change',
              perms: ['edt'],
              title: 'Edit',
            },
            isAllowed: true,
            performAction: () => {},
          },
          {
            action: {
              dangerous: true,
              description: '',
              force: false,
              hooks: [],
              icon: '',
              name: 'act',
              perms: ['act'],
              title: '',
            },
            isAllowed: true,
            performAction: () => {},
          },
        ],
      },
      elt: [
        {
          isMarkdown: false,
          value: 'a-0',
        },
        {
          isMarkdown: false,
          value: 'Logs',
        },
        {
          isMarkdown: false,
          value: 'Actions',
        },
      ],
      entityName: 'a-0',
      isLink: null,
    },
    {
      actionPair: {
        dropdownActs: [
          {
            action: {
              dangerous: false,
              description: '',
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
              name: 'create_copy',
              perms: ['cpy'],
              title: 'Copy Entity',
            },
            performAction: () => {},
          },
          {
            action: {
              dangerous: true,
              description:
                'Deleting the entity will remove it from the index. This action cannot be undone without direct admin support.',
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
              name: 'delete',
              perms: ['del'],
              title: 'Delete Entity',
            },
            performAction: () => {},
          },
          {
            action: {
              dangerous: false,
              description:
                "Creating a link of an entity will create a new 'shallow' entity which takes all values from this entity.",
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M680-160v-120H560v-80h120v-120h80v120h120v80H760v120h-80ZM440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm560-40h-80q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480Z"/></svg>',
              name: 'create_link',
              perms: ['lnk'],
              title: 'Create Link',
            },
            performAction: () => {},
          },
        ],
        favActs: [
          {
            action: {
              dangerous: false,
              description: '',
              force: true,
              hooks: [],
              icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
              name: 'change',
              perms: ['edt'],
              title: 'Edit',
            },
            isAllowed: true,
            performAction: () => {},
          },
          {
            action: {
              dangerous: true,
              description: '',
              force: false,
              hooks: [],
              icon: '',
              name: 'act',
              perms: ['act'],
              title: '',
            },
            isAllowed: true,
            performAction: () => {},
          },
        ],
      },
      elt: [
        {
          isMarkdown: false,
          value: 'a-1',
        },
        {
          isMarkdown: false,
          value: 'Logs',
        },
        {
          isMarkdown: false,
          value: 'Actions',
        },
      ],
      entityName: 'a-1',
      isLink: null,
    },
  ],
  totalNumberOfResults: 3,
};
/**
 * Note: URL validation (ensuring that the URL has https protocol) happens at the validateConfig
 * stage.
 */
const URL = 'https://yac_no_token.com';

test('tests the listing of entities', async () => {
  //@ts-expect-error The method has been injected above.
  global.fetch.mockResolvedValue(createFetchResponse(LIST_RESPONSE));

  const valResp = await fetchEntities(
    getTestEditRequestContext(URL, 'test', null, 'testType', 'create', 'standard').rc,
    2,
    0,
    [],
  );

  expect(
    _.isEqualWith(RESPONSE, valResp, (a, b) => {
      if (_.isFunction(a) && _.isFunction(b)) return true;
      return undefined;
    }),
  ).toEqual(true);
});

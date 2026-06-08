import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { getActions } from '../../src/controller/local/Overview/action';
import { getTestEditRequestContext } from '../testUtils';
import { VALIDATE_01_NAME, VALIDATE_01_OPERATION } from './data';

const URL = 'https://yac_no_token.com';
const fn = async function anonymous() {};
const A = {
  dropdownActs: [],
  favActs: [
    {
      action: {
        dangerous: false,
        description: '',
        force: true,
        hooks: [],
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>',
        name: 'view',
        perms: ['see'],
        title: 'View',
      },
      isAllowed: true,
      performAction: fn,
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
      performAction: fn,
    },
  ],
};

const B = {
  dropdownActs: [
    {
      action: {
        dangerous: false,
        description: '',
        force: false,
        hooks: [],
        icon: '',
        name: 'change',
        perms: ['mod'],
        title: '',
      },
      performAction: fn,
    },
  ],
  favActs: [
    {
      action: {
        dangerous: false,
        description: '',
        force: true,
        hooks: [],
        icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="grey"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>',
        name: 'view',
        perms: ['see'],
        title: 'View',
      },
      isAllowed: true,
      performAction: fn,
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
      isAllowed: false,
      performAction: fn,
    },
  ],
};

// Tests
describe('Check whether the actions are filtered properly', async () => {
  it('Should filter the actions with action allowed, mod operation disallowed, replacing it with view', async () => {
    const res = getActions(
      getTestEditRequestContext(
        URL,
        'test',
        VALIDATE_01_NAME,
        'testType',
        VALIDATE_01_OPERATION,
      ).rc,
      { name: 'blub', link: null, options: {}, perms: ['act'] },
    );

    expect(
      _.isEqualWith(A, res, (a, b) => {
        if (_.isFunction(a) && _.isFunction(b)) return true;
        return undefined;
      }),
    ).toEqual(true);
  });
  it('Should filter the actions with one disallowed fav action', async () => {
    const res = getActions(
      getTestEditRequestContext(
        URL,
        'test',
        VALIDATE_01_NAME,
        'testType',
        VALIDATE_01_OPERATION,
      ).rc,
      { name: 'blub', link: null, options: {}, perms: [] },
    );
    A.favActs[1].isAllowed = false;
    expect(
      _.isEqualWith(A, res, (a, b) => {
        if (_.isFunction(a) && _.isFunction(b)) return true;
        return undefined;
      }),
    ).toEqual(true);
  });
  it('Should filter the actions with mod operation allowed', async () => {
    const res = getActions(
      getTestEditRequestContext(
        URL,
        'test',
        VALIDATE_01_NAME,
        'testType',
        VALIDATE_01_OPERATION,
      ).rc,
      { name: 'blub', link: null, options: {}, perms: ['mod'] },
    );
    expect(
      _.isEqualWith(B, res, (a, b) => {
        if (_.isFunction(a) && _.isFunction(b)) return true;
        return undefined;
      }),
    ).toEqual(true);
  });

  it('Removes copy/link/delete entirely when create/delete are disabled for the type', async () => {
    const ctx = getTestEditRequestContext(
      URL,
      'test',
      VALIDATE_01_NAME,
      'testType',
      VALIDATE_01_OPERATION,
    );
    // Disable both at the entity-type level; the user still has the per-entity
    // permissions, which on their own would show (greyed) buttons.
    if (ctx.rc.accessedEntityType) {
      ctx.rc.accessedEntityType.create = false;
      ctx.rc.accessedEntityType.delete = false;
    }

    const res = getActions(ctx.rc, {
      name: 'blub',
      link: null,
      options: {},
      perms: ['cpy', 'lnk', 'del', 'edt', 'see', 'act'],
    });
    const names = [...res.favActs, ...res.dropdownActs].map((a) => a.action.name);

    expect(names).not.toContain('create_copy');
    expect(names).not.toContain('create_link');
    expect(names).not.toContain('delete');
  });

  it('Keeps copy/link/delete (per permissions) when enabled for the type', async () => {
    const ctx = getTestEditRequestContext(
      URL,
      'test',
      VALIDATE_01_NAME,
      'testType',
      VALIDATE_01_OPERATION,
    );
    const res = getActions(ctx.rc, {
      name: 'blub',
      link: null,
      options: {},
      perms: ['cpy', 'lnk', 'del', 'edt', 'see', 'act'],
    });
    const names = [...res.favActs, ...res.dropdownActs].map((a) => a.action.name);

    expect(names).toContain('create_copy');
    expect(names).toContain('create_link');
    expect(names).toContain('delete');
  });

  it('Degrades Edit to View when change is disabled for the type, even with edit permission', async () => {
    const ctx = getTestEditRequestContext(
      URL,
      'test',
      VALIDATE_01_NAME,
      'testType',
      VALIDATE_01_OPERATION,
    );
    if (ctx.rc.accessedEntityType) ctx.rc.accessedEntityType.change = false;

    const res = getActions(ctx.rc, {
      name: 'blub',
      link: null,
      options: {},
      perms: ['edt', 'see', 'act'],
    });
    const favNames = res.favActs.map((a) => a.action.name);

    expect(favNames).toContain('view');
    expect(favNames).not.toContain('change');
  });
});

/**
 * Commit dialogue features:
 *  - the confirm modal explains what committing will trigger: the activated
 *    actions' titles + (markdown) descriptions, like running an action
 *    standalone would show them;
 *  - edit-mode no-op guard: with the payload equal to the stored file the
 *    backend would 400 ("Cannot write without changing anything"), so no
 *    modal opens (the Commit button is disabled via the same predicate).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { registerModalCallback } from '../../src/controller/global/modal';
import { ModalCallback } from '../../src/view/components/Modal/ModalContext';
import {
  hasUncommittedChanges,
  setChangeListener,
  setEntityYAML,
} from '../../src/controller/local/EditController/ExpertMode/access';
import { sendYAMLData } from '../../src/controller/local/EditController/ExpertMode';
import { setInitialEntityYAML } from '../../src/controller/local/EditController/shared';
import editingState from '../../src/controller/state/EditCtrlState';
import { ActionDecl } from '../../src/utils/types/api';
import { getTestEditRequestContext } from '../testUtils';

const INSTALL_ACTION: ActionDecl = {
  name: 'install',
  title: 'Start Installation',
  description: 'You need to **boot the computer via network** to start.',
  dangerous: true,
  icon: '',
  perms: ['inst'],
  hooks: ['edit:after'],
  force: false,
};

const modalCalls: { title: string; text: string }[] = [];

describe('commit confirm dialogue', () => {
  beforeEach(() => {
    modalCalls.length = 0;
    const record: ModalCallback = (title, text) => {
      modalCalls.push({ title, text });
    };
    registerModalCallback(record);
    editingState.isValidYAC = true;
    editingState.activatedActions = [];
    setInitialEntityYAML('owner: alice\n');
    setEntityYAML('owner: alice\nfirewall_enabled: true\n'); // changed payload
  });

  it('shows the activated actions title + description in the modal body', async () => {
    editingState.activatedActions = [INSTALL_ACTION];
    const ctx = getTestEditRequestContext('https://x', 'test', 'web01', 'host', 'edit');
    await sendYAMLData(ctx);

    expect(modalCalls).toHaveLength(1);
    expect(modalCalls[0].text).toContain('will also trigger the following action:');
    expect(modalCalls[0].text).toContain('#### Start Installation');
    expect(modalCalls[0].text).toContain('**boot the computer via network**');
  });

  it('keeps the body empty without activated actions', async () => {
    const ctx = getTestEditRequestContext('https://x', 'test', 'web01', 'host', 'edit');
    await sendYAMLData(ctx);
    expect(modalCalls).toHaveLength(1);
    expect(modalCalls[0].text).toBe('');
  });

  it('does not open the modal for an edit-mode no-op commit', async () => {
    setEntityYAML('owner: alice\n'); // payload equals the stored file
    const ctx = getTestEditRequestContext('https://x', 'test', 'web01', 'host', 'edit');
    await sendYAMLData(ctx);
    expect(modalCalls).toHaveLength(0);
  });

  it('still opens the modal for create mode even with an unchanged template', async () => {
    setInitialEntityYAML('defaults: template\n');
    setEntityYAML('defaults: template\n');
    const ctx = getTestEditRequestContext('https://x', 'test', null, 'host', 'create');
    await sendYAMLData(ctx);
    expect(modalCalls).toHaveLength(1);
  });
});

describe('uncommitted-change tracking', () => {
  it('compares payload against the commit baseline and notifies the listener', () => {
    const seen: boolean[] = [];
    setInitialEntityYAML('a: 1\n');
    setEntityYAML('a: 1\n');
    setChangeListener((v) => seen.push(v));
    expect(seen).toStrictEqual([false]); // pushed on registration
    expect(hasUncommittedChanges()).toBe(false);

    setEntityYAML('a: 2\n');
    expect(hasUncommittedChanges()).toBe(true);
    setInitialEntityYAML('a: 2\n'); // baseline catches up (e.g. after reload)
    expect(hasUncommittedChanges()).toBe(false);
    expect(seen).toStrictEqual([false, true, false]);
    setChangeListener(null);
  });
});

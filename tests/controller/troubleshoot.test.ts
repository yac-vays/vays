import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearWarningMessageBuffer,
  getWarningMessageBuffer,
  tsAddWarningMessage,
} from '../../src/controller/global/troubleshoot';
import troubleshootCtrlState from '../../src/controller/state/TroubleShootState';

describe('Schema warnings buffer', () => {
  afterEach(() => {
    troubleshootCtrlState.messageBuffer = [];
    troubleshootCtrlState.update = () => {};
  });

  it('Pushes a priority-1 warning to the dropdown without lighting the dot', () => {
    // Regression: priority-1 warnings (e.g. "No description available") used
    // to be buffered but never handed to the dropdown, so a schema whose only
    // findings are low-priority showed an empty warnings list forever.
    const update = vi.fn();
    troubleshootCtrlState.update = update;

    tsAddWarningMessage(1, 'No description available', 'msg', 'inventory_number', 'Inventory');

    expect(getWarningMessageBuffer()).toHaveLength(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenLastCalledWith(false);
  });

  it('Lights the dot for warnings above priority 1', () => {
    const update = vi.fn();
    troubleshootCtrlState.update = update;

    tsAddWarningMessage(9, 'Potentially unsafe handling of Passwords', 'msg', 'pw', 'Inventory');

    expect(update).toHaveBeenLastCalledWith(true);
  });

  it('Groups the same warning per key and backend, sorted by priority', () => {
    tsAddWarningMessage(1, 'No description available', 'msg', 'a', 'B1');
    tsAddWarningMessage(1, 'No description available', 'msg', 'b', 'B1');
    tsAddWarningMessage(1, 'No description available', 'msg', 'a', 'B1'); // duplicate
    tsAddWarningMessage(5, 'Something worse', 'msg', 'a', 'B1');

    const buf = getWarningMessageBuffer();
    expect(buf.map((m) => m.prop.priority)).toEqual([5, 1]);
    expect(buf[1].prop.affectedKeys).toEqual([
      ['a', 'B1'],
      ['b', 'B1'],
    ]);
  });

  it('Clear empties the buffer', () => {
    tsAddWarningMessage(3, 'x', 'msg', 'a', 'B1');
    clearWarningMessageBuffer();
    expect(getWarningMessageBuffer()).toEqual([]);
  });
});

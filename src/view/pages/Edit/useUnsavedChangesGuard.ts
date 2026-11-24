import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { showModalMessage } from '../../../controller/global/modal';
import { leavesEditedDocument } from '../../../controller/global/url';
import { clearEditDirty, isEditDirty } from '../../../controller/local/EditController/status';
import { RequestEditContext } from '../../../utils/types/internal/request';

/** Ask before the user leaves the editor with unsaved changes. */
export function useUnsavedChangesGuard(requestEditContext: RequestEditContext) {
  // Warn before leaving the edited document with unsaved changes (the URL
  // gaining the new name while creating is not leaving).
  const createBase = `/${requestEditContext.rc.backendObject?.name}/${requestEditContext.rc.entityTypeName}/create`;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isEditDirty() &&
      leavesEditedDocument(
        requestEditContext.mode,
        createBase,
        currentLocation.pathname,
        nextLocation.pathname,
      ),
  );
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    showModalMessage(
      'Discard unsaved changes?',
      'You have unsaved changes in this editor. If you leave now, they will be lost.',
      async () => {
        clearEditDirty();
        blocker.proceed();
      },
      async () => {
        blocker.reset();
      },
      'Leave',
    );
  }, [blocker]);

  // Cover full-page navigations (refresh, tab close, external URL) with the
  // browser's native prompt while there are unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isEditDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
}

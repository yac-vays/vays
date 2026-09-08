import { createTwoFilesPatch } from 'diff';
import { getStoredEntity } from '../../../model/entityData';
import { validateYAML } from '../../../model/validate';
import { footerErrorMessage } from '../../../utils/schema/locatedErrors';
import { entityToastTitle } from '../../../utils/toastUtils';
import { EntityData } from '../../../utils/types/api';
import { RequestEditContext } from '../../../utils/types/internal/request';
import { showDiffViewer } from '../../global/diffViewer';
import { showModalMessage } from '../../global/modal';
import { showError } from '../../global/notification';
import editingState from '../../state/EditCtrlState';
import {
  getActivatedActions,
  getEntityName,
  getEntityYAML,
  setErrorMessage,
  setIsValidating,
} from './ExpertMode/access';
import {
  beginValidationDispatch,
  currentSession,
  endValidationDispatch,
  isStaleSession,
  isStaleValidation,
  nextValidationSeq,
  reloadEditingView,
} from './session';
import {
  clearEditDirty,
  getInitialEntityYAML,
  isEditDirty,
  setEntityPerms,
  setInitialEntityYAML,
  setYACStatus,
} from './shared';

/**
 * Edit conflicts ("someone else committed this entity while I was editing").
 *
 * Every edit session carries the stored YAML it started from as its baseline
 * (`initialYAML`); it is sent along as `yaml_old`, and YAC answers 409 (or
 * fails the validation) when the stored file no longer matches. This module
 * turns that into a dialog with three ways out instead of a bare error toast:
 *
 *  - Show their changes: a unified diff baseline -> stored, in the diff viewer.
 *  - Keep my version: the stored version becomes the new baseline while the
 *    user's document stays as it is. The YAML pane then highlights every line
 *    where the document differs from what is stored — the user's own edits AND
 *    the other party's changes (which a commit would revert), so the decision
 *    to overwrite is visible line by line. Then the user commits again.
 *  - Reload: discard the session and load the stored version.
 *
 * There is deliberately no automatic three-way merge.
 */

// YAC's wording for a stale `yaml_old` (see `validator/conflicts.py` and the
// repo plugin's `_write`); there is no machine-readable error code, so the
// footer's "Resolve" affordance keys off the text. `CONFLICT_DETAIL` is what
// this module itself stores as the status after a 409, in the same wording.
const CONFLICT_RE = /(changed|deleted) in the meantime/i;
const CONFLICT_DETAIL = 'The data has changed in the meantime.';

/** Whether a validation/commit error message reports an edit conflict. */
export function isConflictMessage(msg: string): boolean {
  return CONFLICT_RE.test(msg);
}

/**
 * Run the conflict flow: fetch the stored version and, if it really differs
 * from the session baseline, open the conflict dialog.
 *
 * Called after a 409 on commit (with `fallbackDetail`, the toast text for a
 * 409 that turns out NOT to be a stale baseline — e.g. a rename onto an
 * existing name) and from the footer's "Resolve" link (without).
 */
export async function handleEditConflict(
  requestEditContext: RequestEditContext,
  fallbackDetail?: string,
): Promise<void> {
  const name = requestEditContext.entityName;
  const toastTitle = entityToastTitle(requestEditContext.rc, name);
  if (requestEditContext.mode !== 'edit' || name == null) {
    if (fallbackDetail) showError(toastTitle, fallbackDetail);
    return;
  }
  const epoch = currentSession();
  const stored = await getStoredEntity(name, requestEditContext.rc);
  if (isStaleSession(epoch)) return;

  if (stored.kind === 'error') {
    if (fallbackDetail) showError(toastTitle, fallbackDetail);
    return;
  }
  if (stored.kind === 'gone') {
    showError(
      toastTitle,
      `${name} was deleted on the server while you were editing. Nothing was saved. ` +
        'Your document is still in the editor; copy it if you want to keep it.',
    );
    return;
  }

  const baseline = getInitialEntityYAML();
  if (stored.entity.yaml === baseline) {
    // The baseline is current: the 409 had another reason (its toast is the
    // fallback), or the conflict shown in the footer is already resolved.
    if (fallbackDetail) showError(toastTitle, fallbackDetail);
    else await revalidateAgainstBaseline(requestEditContext);
    return;
  }

  // Block committing until the user picked a way out: the footer shows the
  // conflict (with its "Resolve" link) and the Commit button is disabled. The
  // YAML editor's own validations report the same thing; the form's do not
  // send `yaml_old`, so the 409 path has to record it here.
  setYACStatus(false, CONFLICT_DETAIL);
  setErrorMessage(CONFLICT_DETAIL);

  // The commit dialog hides itself once its confirm callback settles; a dialog
  // opened from inside that callback would be hidden along with it.
  await new Promise((resolve) => setTimeout(resolve, 0));
  if (isStaleSession(epoch)) return;
  showConflictModal(requestEditContext, name, baseline, stored.entity, epoch);
}

function showConflictModal(
  requestEditContext: RequestEditContext,
  name: string,
  baseline: string,
  stored: EntityData,
  epoch: number,
) {
  const body =
    `While you were editing, **${name}** was modified on the server. Nothing of yours ` +
    'has been saved, and your document is unchanged.\n\n' +
    '- **Show their changes** displays what changed on the server since you opened the entity.\n' +
    '- **Keep my version** keeps your document and makes the stored version the new ' +
    'baseline: the YAML pane then highlights every line where your document differs ' +
    'from it — including their changes, which committing would revert. Review, then ' +
    'commit again.\n' +
    '- **Reload** discards your edits and loads the stored version.';

  showModalMessage(
    `Someone else changed ${name}`,
    body,
    async () => {
      if (isStaleSession(epoch)) return;
      await keepMyVersion(requestEditContext, stored);
    },
    async () => {},
    'Keep my version',
    false,
    undefined,
    undefined,
    [
      {
        label: 'Show their changes',
        title: 'What changed on the server since you opened the entity',
        onClick: () =>
          showDiffViewer(
            `What changed on the server: ${name}`,
            createTwoFilesPatch(
              `${name} (when you opened it)`,
              `${name} (stored now)`,
              baseline,
              stored.yaml,
            ),
            // The viewer replaces the dialog rather than stacking on top of it;
            // bring the dialog back once the viewer is dismissed.
            () => {
              if (!isStaleSession(epoch)) {
                showConflictModal(requestEditContext, name, baseline, stored, epoch);
              }
            },
          ),
      },
      {
        label: 'Reload',
        title: 'Discard your edits and load the stored version',
        onClick: () => reloadAfterConfirm(),
      },
    ],
  );
}

/**
 * Re-baseline the running session onto the stored version, keeping the user's
 * document. The diff highlighting follows the baseline (see
 * `subscribeToBaseline`); a validation against the new `yaml_old` clears the
 * conflict status and re-enables Commit.
 */
async function keepMyVersion(requestEditContext: RequestEditContext, stored: EntityData) {
  setInitialEntityYAML(stored.yaml);
  editingState.initialData = structuredClone(stored.data);
  await revalidateAgainstBaseline(requestEditContext);
}

function reloadAfterConfirm() {
  if (!isEditDirty()) {
    reloadEditingView();
    return;
  }
  // The conflict dialog is closing in this same tick; open the confirmation
  // after it has gone.
  setTimeout(
    () =>
      showModalMessage(
        'Discard unsaved changes?',
        'Your edits in this editor will be lost and the stored version is loaded.',
        async () => {
          clearEditDirty();
          reloadEditingView();
        },
        async () => {},
        'Discard and reload',
      ),
    0,
  );
}

/**
 * Validate the current save payload against the (new) baseline, updating the
 * YAC status, the footer and the Commit gate — the same bookkeeping as the
 * YAML editor's own validation, minus rewriting any pane (the document did
 * not change).
 */
async function revalidateAgainstBaseline(requestEditContext: RequestEditContext) {
  const yaml = getEntityYAML();
  if (yaml == null) return;
  const epoch = currentSession();
  const seq = nextValidationSeq();
  beginValidationDispatch();
  setIsValidating(true);
  try {
    const rep = await validateYAML(
      requestEditContext,
      getEntityName(),
      yaml,
      getInitialEntityYAML(),
      getActivatedActions(),
    );
    if (rep == null || isStaleSession(epoch) || isStaleValidation(seq)) return;
    setYACStatus(rep.valid, rep.detail, rep.usages);
    if (rep.perms) setEntityPerms(rep.perms);
    setErrorMessage(footerErrorMessage(rep));
  } finally {
    if (!isStaleValidation(seq)) setIsValidating(false);
    endValidationDispatch();
  }
}

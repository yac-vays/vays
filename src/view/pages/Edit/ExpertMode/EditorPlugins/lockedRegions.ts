/* eslint-disable @typescript-eslint/no-explicit-any */
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { getCurrentJsonSchema } from '../../../../../controller/local/EditController/ExpertMode/access';
import {
  getEntityPerms,
  isAdminOverride,
} from '../../../../../controller/local/EditController/shared';
import { subscribeToEditStateChange } from '../../../../../controller/state/editStateEvents';
import {
  blockingRegion,
  commentRegions,
  edgeRegion,
  fixedValueRegions,
  LOCK_MESSAGES,
  LockedRegion,
  startsComment,
} from '../../../../../utils/schema/lockedRegions';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

/**
 * Locked regions of the YAML editor (see utils/schema/lockedRegions.ts):
 * values whose schema is a `const` (unless the admin override is on) and —
 * without the `cln` permission — comments. They get a lock in the gutter,
 * greyed text and an explanation on hover; edits inside are refused with
 * Monaco's read-only message (the editor is read-only while a cursor or
 * selection is in a locked region), so the user learns it right away instead
 * of from the next validation. The form is not affected.
 */

let subscriptions: (monaco.IDisposable | (() => void))[] = [];
let collection: monaco.editor.IEditorDecorationsCollection | null = null;

export function disposeLockedRegions() {
  for (const s of subscriptions) {
    if (typeof s === 'function') s();
    else s.dispose();
  }
  subscriptions = [];
  collection?.clear();
  collection = null;
}

function currentRegions(text: string): LockedRegion[] {
  const regions: LockedRegion[] = [];
  if (!isAdminOverride()) regions.push(...fixedValueRegions(text, getCurrentJsonSchema()));
  if (!getEntityPerms().includes('cln')) regions.push(...commentRegions(text));
  return regions;
}

function showMessage(ed: monaco.editor.IStandaloneCodeEditor, text: string) {
  const position = ed.getPosition();
  const controller: any = ed.getContribution('editor.contrib.messageController');
  if (controller != null && position != null) controller.showMessage(text, position);
}

export default async function editorLockedRegions(
  ed: monaco.editor.IStandaloneCodeEditor,
  requestEditContext: RequestEditContext,
) {
  // Per session (the schema and perms are session state): always re-register.
  disposeLockedRegions();
  if (requestEditContext.mode === 'read') return; // read mode is read-only anyway
  collection = ed.createDecorationsCollection([]);

  let regions: LockedRegion[] = [];
  let lockedByUs = false;

  const toOffsets = (sel: monaco.Selection, model: monaco.editor.ITextModel) => {
    const start = model.getOffsetAt(sel.getStartPosition());
    const end = model.getOffsetAt(sel.getEndPosition());
    const endsLine =
      sel.endColumn === 1
        ? sel.endLineNumber > sel.startLineNumber
        : sel.endColumn === model.getLineMaxColumn(sel.endLineNumber);
    return { start, end, wholeLines: start !== end && sel.startColumn === 1 && endsLine };
  };

  // Read-only while any cursor / selection is in a locked region.
  const updateReadOnly = () => {
    const model = ed.getModel();
    if (model == null) return;
    let blocking: LockedRegion | null = null;
    for (const sel of ed.getSelections() ?? []) {
      const { start, end, wholeLines } = toOffsets(sel, model);
      blocking = blockingRegion(regions, start, end, wholeLines);
      if (blocking) break;
    }
    if (blocking) {
      ed.updateOptions({
        readOnly: true,
        readOnlyMessage: { value: LOCK_MESSAGES[blocking.kind] },
        // keep the error squiggles (Monaco hides them in read-only editors)
        renderValidationDecorations: 'on',
      });
      lockedByUs = true;
    } else if (lockedByUs) {
      ed.updateOptions({ readOnly: false, renderValidationDecorations: 'editable' });
      lockedByUs = false;
    }
  };

  const recompute = () => {
    const model = ed.getModel();
    if (model == null) {
      collection?.set([]);
      return;
    }
    const text = model.getValue();
    regions = currentRegions(text);
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    for (const r of regions) {
      const start = model.getPositionAt(r.start);
      const end = model.getPositionAt(r.end);
      const hoverMessage = { value: LOCK_MESSAGES[r.kind] };
      decorations.push({
        range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
        options: { inlineClassName: 'locked-text', hoverMessage },
      });
      // A lock in the gutter on every line that is locked as a whole (all
      // lines of a multi-line value, like consecutive comment lines).
      if (r.kind !== 'comment' || r.standalone) {
        for (let line = start.lineNumber; line <= end.lineNumber; line++) {
          decorations.push({
            range: new monaco.Range(line, 1, line, 1),
            options: {
              glyphMarginClassName: `locked-glyph${r.kind === 'fixed-optional' ? ' locked-glyph-optional' : ''}`,
              glyphMarginHoverMessage: hoverMessage,
            },
          });
        }
      }
    }
    collection?.set(decorations);
    updateReadOnly();
  };

  // At the edge of a region the cursor is free (Enter adds a line), only keys
  // that would still change it are refused; and without `cln` no new comments.
  const onKeyDown = (e: monaco.IKeyboardEvent) => {
    const model = ed.getModel();
    const selection = ed.getSelection();
    if (model == null || selection == null || !selection.isEmpty()) return;
    const event = e.browserEvent;
    const altGraph = event.getModifierState?.('AltGraph') ?? false;
    if ((event.ctrlKey || event.metaKey) && !altGraph) return; // shortcuts
    const offset = model.getOffsetAt(selection.getPosition());

    let message: string | null = null;
    const edge = edgeRegion(regions, offset, event.key);
    if (edge) {
      message = LOCK_MESSAGES[edge.kind];
    } else if (
      event.key === '#' &&
      !getEntityPerms().includes('cln') &&
      startsComment(model.getValue(), offset)
    ) {
      message = LOCK_MESSAGES.comment;
    }
    if (message) {
      e.preventDefault();
      e.stopPropagation();
      showMessage(ed, message);
    }
  };

  subscriptions = [
    ed.onDidChangeModelContent(recompute),
    ed.onDidChangeCursorSelection(updateReadOnly),
    ed.onKeyDown(onKeyDown),
    subscribeToEditStateChange(recompute),
    () => {
      if (lockedByUs)
        ed.updateOptions({ readOnly: false, renderValidationDecorations: 'editable' });
    },
  ];
  recompute();
}

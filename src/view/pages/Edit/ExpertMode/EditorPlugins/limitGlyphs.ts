import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import {
  getYACUsages,
  subscribeToUsages,
} from '../../../../../controller/local/EditController/shared';
import { formatLimitLong, limitLevel, limitPathSegments } from '../../../../../utils/limitUtils';
import { locateDataPathExact } from '../../../../../utils/schema/yamlPathLocator';
import { LimitUsage } from '../../../../../utils/types/api';

/**
 * Colored gutter dots for the `limits` usages anchored on a field (via the
 * limit's `path`): green while within the cap, amber when close, red once
 * exceeded, with the spelled-out usage on hover — the YAML pane's counterpart
 * of the form's per-field chips. Limits whose key is absent from the YAML get
 * no dot; they still show next to the entity name (see `metaPanelUsages`).
 */

// Per-session subscriptions/collection; module-level so the editor teardown
// can dispose them (see Editor.tsx cleanup), mirroring errorDecoration.
let usagesUnsub: (() => void) | null = null;
let contentSub: monaco.IDisposable | null = null;
let collection: monaco.editor.IEditorDecorationsCollection | null = null;

export function disposeLimitGlyphs() {
  usagesUnsub?.();
  usagesUnsub = null;
  contentSub?.dispose();
  contentSub = null;
  collection?.clear();
  collection = null;
}

export default async function editorLimitGlyphs(ed: monaco.editor.IStandaloneCodeEditor) {
  // Unlike the global marker listeners, these subscriptions are per SESSION
  // (usages are session state), so re-invocation on a reused editor must
  // re-register: dispose first, never early-return on `reInvoked`.
  disposeLimitGlyphs();
  collection = ed.createDecorationsCollection([]);

  const recompute = (usages: LimitUsage[]) => {
    const model = ed.getModel();
    if (model == null) {
      collection?.set([]);
      return;
    }
    const text = model.getValue();
    const decs: monaco.editor.IModelDeltaDecoration[] = [];
    for (const u of usages) {
      if (u.path == null) continue;
      const range = locateDataPathExact(text, limitPathSegments(u.path));
      if (range == null) continue;
      // The value's range starts on the key's line for scalar fields (and at
      // worst on the first content line of a block value).
      const line = model.getPositionAt(range.start).lineNumber;
      decs.push({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: `limit-glyph limit-glyph-${limitLevel(u)}`,
          glyphMarginHoverMessage: { value: formatLimitLong(u) },
        },
      });
    }
    collection?.set(decs);
  };

  // Refresh on every validation round (both panes funnel through
  // `setYACStatus`; subscribing pushes the current state immediately) and on
  // every content change (user keystrokes AND the programmatic `setValue` of
  // form -> YAML projections shift lines).
  usagesUnsub = subscribeToUsages(recompute);
  contentSub = ed.onDidChangeModelContent(() => recompute(getYACUsages()));
}

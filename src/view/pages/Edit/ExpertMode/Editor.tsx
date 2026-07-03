/**
 * Sets up the Monaco workers, the YAML grammar and the curated feature
 * contributions (side-effect import). Keep it before the editor.api import so
 * everything is registered by the time an editor is created below.
 */
import './monacoSetup';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { memo, useEffect, useRef, useState } from 'react';

import {
  getMonacoYaml,
  setMonacoYaml,
} from '../../../../controller/local/EditController/ExpertMode/access';
import { getInitialEntityYAML } from '../../../../controller/local/EditController/shared';
import {
  registerYamlInputPendingProbe,
  registerYamlWriter,
  setActivePane,
} from '../../../../controller/local/EditController/sync';
import { patchSchemaForMonaco } from '../../../../utils/schema/monacoSchemaFix';
import { RequestEditContext } from '../../../../utils/types/internal/request';
import { computeDiffDecorations } from './EditorPlugins/diffDecoration';
import editorPlugins, { editorSetupPlugins } from './EditorPlugins';
import { getUpdateCallback, setupMonacoYAMLPlugin } from './utils/setup.js';

import { startExpertModeSession } from '../../../../controller/local/EditController/ExpertMode/index.js';
import { disposeErrorMarkersListener } from './EditorPlugins/errorDecoration';
import './glyph.css';
import { getEditor, getModel } from './utils/factory.js';

export const Editor = ({
  requestEditContext,
  setEditErrorMsg,
  setIsValidating,
  setLoading,
  setFocused,
  visible = true,
}: {
  requestEditContext: RequestEditContext;
  setEditErrorMsg: (v: string) => void;
  setIsValidating: (b: boolean) => void;
  // Reports the initial setup state to the frame's unified loader.
  setLoading: (b: boolean) => void;
  // Reports whether the editor text is focused (the frame dims the inactive pane).
  setFocused: (b: boolean) => void;
  // The YAML pane can be hidden (resized to zero width); Monaco needs an
  // explicit relayout when it becomes visible again.
  visible?: boolean;
}) => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef<HTMLDivElement>(null);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(true);

  const update = getUpdateCallback();

  useEffect(() => {
    startExpertModeSession(requestEditContext, setIsValidating, setEditErrorMsg);

    if (monacoEl && requestEditContext.rc.yacURL != null) {
      setIsSettingUp(true);

      let monacoYaml = getMonacoYaml();
      if (!monacoYaml) {
        monacoYaml = setupMonacoYAMLPlugin();
        setMonacoYaml(monacoYaml);
      }

      const model = getModel(update);
      for (const plugin of editorSetupPlugins) plugin();
      const [ed, newEditor] = getEditor(model, monacoEl);
      setEditor(ed);

      (async () => {
        for (const plugin of editorPlugins) {
          await plugin(ed, requestEditContext, !newEditor);
        }
      })().finally(() => {
        setIsSettingUp(false);
      });

      // Dispose the editor (and the global markers listener registered by the
      // error-decoration plugin) on teardown; otherwise every navigation into
      // the edit view leaks a live editor instance.
      return () => {
        disposeErrorMarkersListener();
        // A keystroke may still sit in the debounce window; it belongs to THIS
        // session (the epoch stamp would drop it anyway) — cancel it so it
        // does not fire into the next session at all.
        update.cancel();
        ed.dispose();
      };
    }
  }, [
    requestEditContext.mode === 'edit' ? requestEditContext.entityName : '',
    requestEditContext.mode,
    requestEditContext.rc.entityTypeName,
    requestEditContext.rc.yacURL,
  ]);

  // Register this editor as the "YAML pane" so form edits can be projected into
  // it (and track focus so it becomes the active pane). Only the inactive pane
  // is ever rewritten, so the user's cursor in the focused pane is preserved.
  useEffect(() => {
    if (!editor) return;
    // Widget-level focus (not just the text area) so the editor stays "active"
    // while using its find/replace widget.
    const focusSub = editor.onDidFocusEditorWidget(() => {
      setActivePane('yaml');
      setFocused(true);
    });
    const blurSub = editor.onDidBlurEditorWidget(() => setFocused(false));
    registerYamlWriter((resp) => {
      if (resp.yaml == null) return;
      const scrollTop = editor.getScrollTop();
      editor.setValue(resp.yaml);
      editor.setScrollTop(scrollTop);
      getMonacoYaml()?.update({
        schemas: [
          {
            uri: 'inmemory://schema.json',
            schema: patchSchemaForMonaco(resp.json_schema),
            fileMatch: ['*'],
          },
        ],
      });
    });
    // Lets the sync layer see un-validated keystrokes waiting in the debounce
    // window, so a cross-pane rewrite never destroys them.
    registerYamlInputPendingProbe(() => update.pending());
    return () => {
      focusSub.dispose();
      blurSub.dispose();
      registerYamlWriter(null);
      registerYamlInputPendingProbe(null);
    };
  }, [editor]);

  // Monaco does not render correctly while in a zero-width container; force a
  // relayout when this pane becomes visible again.
  useEffect(() => {
    if (editor && visible) editor.layout();
  }, [editor, visible]);

  // Report initial setup state to the frame's single loading indicator.
  useEffect(() => {
    setLoading(isSettingUp);
  }, [isSettingUp, setLoading]);

  // Highlight, in green, everything that differs from the original entity YAML.
  // Recomputed on every content change (user edits *and* form -> YAML pushes).
  useEffect(() => {
    if (!editor) return;
    const collection = editor.createDecorationsCollection([]);
    const recompute = () =>
      collection.set(
        computeDiffDecorations(getInitialEntityYAML(), editor.getModel()?.getValue() ?? ''),
      );
    const sub = editor.onDidChangeModelContent(() => recompute());
    recompute();
    return () => {
      sub.dispose();
      collection.clear();
    };
  }, [editor]);

  return (
    // The frame shows a single unified loader while `isSettingUp`; keep the
    // editor container mounted (hidden) so Monaco can initialize underneath.
    <div className={`flex flex-col h-full relative grow ${isSettingUp ? 'hidden' : ''}`}>
      <div className="relative overflow-visible rounded grow">
        <div className="absolute h-full w-full overflow-visible" ref={monacoEl}></div>
      </div>
    </div>
  );
};

export default memo(Editor);

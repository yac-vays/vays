import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { getCurrentJsonSchema } from '../../../../../controller/local/EditController/ExpertMode/access';
import {
  exampleValueForSchema,
  fieldHelpHoverMarkdown,
  subschemaAtPath,
} from '../../../../../utils/schema/fieldHelp';
import { setValueInYaml, yamlPathAtOffset } from '../../../../../utils/schema/yamlPathLocator';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

/**
 * Schema-driven field help, shown in Monaco's BUILT-IN hover widget:
 *
 * - A hover provider contributes the schema facts (type, required, default,
 *   possible values, examples) of the field under the cursor. It merges into
 *   the same hover as monaco-yaml's own section (title + description), so a
 *   plain mouse-hover shows the complete picture.
 * - A context-menu action ("Show Field Help") opens that hover at the cursor,
 *   for keyboard/menu-driven use.
 */

// The provider is monaco-global (per language, not per editor): register once.
let hoverProviderRegistered = false;

export default async function editorFieldHelp(
  ed: monaco.editor.IStandaloneCodeEditor,
  _ctx: RequestEditContext,
  reInvoked: boolean = false,
) {
  if (!hoverProviderRegistered) {
    hoverProviderRegistered = true;
    monaco.languages.registerHoverProvider('yaml', {
      provideHover: (model, position) => {
        const schema = getCurrentJsonSchema();
        if (schema == null) return null;
        const path = yamlPathAtOffset(model.getValue(), model.getOffsetAt(position));
        if (path == null || path.length === 0) return null;
        const sub = subschemaAtPath(schema, path);
        if (sub == null || typeof sub !== 'object') return null;
        const parent = path.length > 1 ? subschemaAtPath(schema, path.slice(0, -1)) : schema;
        const markdown = fieldHelpHoverMarkdown(path[path.length - 1], sub, parent);
        if (markdown === '') return null;
        return { contents: [{ value: markdown }] };
      },
    });
  }

  // Actions live on the editor instance: a reused editor still has it.
  if (reInvoked) return;

  ed.addAction({
    id: 'vays.showFieldHelp',
    label: 'Show Field Help',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
    run: (editor) => {
      editor.trigger('vays.showFieldHelp', 'editor.action.showHover', null);
    },
  });

  ed.addAction({
    id: 'vays.fillExampleValue',
    label: 'Fill with Example Value',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 2,
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyE],
    run: (editor) => {
      const model = editor.getModel();
      const position = editor.getPosition();
      if (model == null || position == null) return;
      const text = model.getValue();
      const path = yamlPathAtOffset(text, model.getOffsetAt(position));
      const schema = getCurrentJsonSchema();
      if (path == null || path.length === 0 || schema == null) return;
      const sub = subschemaAtPath(schema, path);
      if (sub == null) return;
      const value = exampleValueForSchema(sub);
      if (value === undefined) return;
      // The yaml document round-trip keeps comments/order and produces correct
      // block indentation for nested structures; applied as ONE undoable edit.
      const updated = setValueInYaml(text, path, value);
      if (updated == null || updated === text) return;
      editor.pushUndoStop();
      editor.executeEdits('vays.fillExampleValue', [
        { range: model.getFullModelRange(), text: updated },
      ]);
      editor.pushUndoStop();
      editor.setPosition(position);
    },
  });
}

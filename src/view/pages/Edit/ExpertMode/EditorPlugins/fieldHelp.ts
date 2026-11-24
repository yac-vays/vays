import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { getCurrentJsonSchema } from '../../../../../controller/local/EditController/ExpertMode/access';
import { getYACUsages } from '../../../../../controller/local/EditController/shared';
import { formatLimitLong, limitMatchesYamlPath } from '../../../../../utils/limitUtils';
import {
  exampleValueForSchema,
  fieldHelpHoverMarkdown,
  subschemaAtPath,
} from '../../../../../utils/schema/fieldHelp';
import { valueEditInYaml, yamlPathAtOffset } from '../../../../../utils/schema/yamlPathLocator';
import { lockMessageForEdit, showMessage } from './lockedRegions';
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
        // The provider serves every YAML model (e.g. a log document viewer),
        // the schema and usages only describe the entity document.
        if (model !== monaco.editor.getModel(monaco.Uri.parse('inmemory://schema.json'))) {
          return null;
        }
        const schema = getCurrentJsonSchema();
        if (schema == null) return null;
        const path = yamlPathAtOffset(model.getValue(), model.getOffsetAt(position));
        if (path == null || path.length === 0) return null;
        const sub = subschemaAtPath(schema, path);
        let markdown = '';
        if (sub != null && typeof sub === 'object') {
          const parent = path.length > 1 ? subschemaAtPath(schema, path.slice(0, -1)) : schema;
          markdown = fieldHelpHoverMarkdown(path[path.length - 1], sub, parent);
        }
        // Live usage of the limits anchored on this field (matching the form's
        // per-field chips and the gutter glyphs).
        const limits = getYACUsages()
          .filter((u) => u.path != null && limitMatchesYamlPath(u.path, path))
          .map((u) => `**Limit** — ${formatLimitLong(u)}`)
          .join('\n\n');
        const value = [markdown, limits].filter((s) => s !== '').join('\n\n---\n\n');
        if (value === '') return null;
        return { contents: [{ value }] };
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
      // Replace just this entry's value (one undoable edit): the rest of the
      // document keeps its formatting, which the user may not be allowed to
      // change.
      const edit = valueEditInYaml(text, path, value);
      if (edit == null || text.slice(edit.start, edit.end) === edit.text) return;
      const locked = lockMessageForEdit(text, edit.start, edit.end);
      if (locked != null) {
        showMessage(editor as monaco.editor.IStandaloneCodeEditor, locked);
        return;
      }
      const from = model.getPositionAt(edit.start);
      const to = model.getPositionAt(edit.end);
      editor.pushUndoStop();
      editor.executeEdits('vays.fillExampleValue', [
        {
          range: new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
          text: edit.text,
        },
      ]);
      editor.pushUndoStop();
      editor.setPosition(position);
    },
  });
}

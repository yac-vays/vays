import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { showModalMessage } from '../../../../../controller/global/modal';
import { getCurrentJsonSchema } from '../../../../../controller/local/EditController/ExpertMode/access';
import {
  fieldHelpMarkdown,
  fieldHelpTitle,
  subschemaAtPath,
} from '../../../../../utils/schema/fieldHelp';
import { yamlPathAtOffset } from '../../../../../utils/schema/yamlPathLocator';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

/**
 * Context-menu action "Show Field Help": resolves the field under the cursor
 * to its subschema (of the most recent validation's JSON schema) and shows
 * everything the schema knows about it — title, description, type, possible
 * values, default, examples — in the modal.
 */
export default async function editorFieldHelp(
  ed: monaco.editor.IStandaloneCodeEditor,
  _ctx: RequestEditContext,
  reInvoked: boolean = false,
) {
  // Actions live on the editor instance: a reused editor still has it.
  if (reInvoked) return;

  ed.addAction({
    id: 'vays.showFieldHelp',
    label: 'Show Field Help',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
    run: (editor) => {
      const model = editor.getModel();
      const position = editor.getPosition();
      if (model == null || position == null) return;

      const path = yamlPathAtOffset(model.getValue(), model.getOffsetAt(position));
      const schema = getCurrentJsonSchema();
      const noHelp = () =>
        showModalMessage(
          'Field Help',
          'No schema information is available for this position.',
          async () => {},
          async () => {},
          'Close',
        );
      if (path == null || path.length === 0 || schema == null) return noHelp();

      const sub = subschemaAtPath(schema, path);
      if (sub == null || typeof sub !== 'object') return noHelp();
      const parent = path.length > 1 ? subschemaAtPath(schema, path.slice(0, -1)) : schema;
      const fieldName = path[path.length - 1];
      showModalMessage(
        fieldHelpTitle(fieldName, sub),
        fieldHelpMarkdown(fieldName, sub, parent),
        async () => {},
        async () => {},
        'Close',
      );
    },
  });
}

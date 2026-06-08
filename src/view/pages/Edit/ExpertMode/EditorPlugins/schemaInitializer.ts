import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  getCurrentContext,
  getMonacoYaml,
} from '../../../../../controller/local/EditController/ExpertMode/access';
import {
  retreiveSchema,
  setInitialEntityYAML,
} from '../../../../../controller/local/EditController/shared';
import { seedCanonical } from '../../../../../controller/local/EditController/sync';
import { getDefaultsAsYAML } from '../../../../../utils/schema/defaultsHandling';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

export default async function editorInitializeSchema(
  ed: monaco.editor.IStandaloneCodeEditor,
  requestEditContext: RequestEditContext,
) {
  requestEditContext = getCurrentContext() ?? requestEditContext;
  const v = await retreiveSchema(requestEditContext);
  const defaultStr = "---\n\n# Please enter here... (btw couldn't fetch the data in time, sorry)";

  if (v == null) {
    ed.setValue(defaultStr);
    await getMonacoYaml().update({
      schemas: [
        {
          uri: `inmemory://schema.json`,
          schema: {},
          fileMatch: ['*'],
        },
      ],
    });
    return;
  }
  if (requestEditContext.mode === 'create') {
    const str = getDefaultsAsYAML(v.json_schema);
    // Seed before setValue so the resulting change event is recognized as
    // already-canonical (no redundant validate, no bounce to the form pane).
    seedCanonical(v.data, str);
    // Use the defaults template as the diff baseline: in create mode the green
    // highlight then shows what the user added beyond the generated defaults
    // (rather than the whole document). This is the exact text shown below.
    setInitialEntityYAML(str);
    ed.setValue(str);
  } else {
    const initialYaml = v.yaml ?? defaultStr;
    seedCanonical(v.data, initialYaml);
    ed.setValue(initialYaml);
  }

  await getMonacoYaml().update({
    schemas: [
      {
        uri: `inmemory://schema.json`,
        schema: v.json_schema,
        fileMatch: ['*'],
      },
    ],
  });
}

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  getCurrentContext,
  getMonacoYaml,
} from '../../../../../controller/local/EditController/ExpertMode/access';
import {
  currentSession,
  isStaleSession,
} from '../../../../../controller/local/EditController/session';
import {
  retreiveSchema,
  setInitialEntityYAML,
} from '../../../../../controller/local/EditController/shared';
import { seedCanonical } from '../../../../../controller/local/EditController/sync';
import { getDefaultsAsYAML } from '../../../../../utils/schema/defaultsHandling';
import { patchSchemaForMonaco } from '../../../../../utils/schema/monacoSchemaFix';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

export default async function editorInitializeSchema(
  ed: monaco.editor.IStandaloneCodeEditor,
  requestEditContext: RequestEditContext,
) {
  requestEditContext = getCurrentContext() ?? requestEditContext;
  const epoch = currentSession();
  const v = await retreiveSchema(requestEditContext);
  // The user navigated on while the schema loaded: everything below (canonical
  // seed, save payload, the SINGLETON monaco-yaml schema) would land in the
  // next session — that session's own initializer takes care of it.
  if (isStaleSession(epoch)) return;
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
        schema: patchSchemaForMonaco(v.json_schema),
        fileMatch: ['*'],
      },
    ],
  });
}

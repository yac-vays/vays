import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {
  getCurrentContext,
  getMonacoYaml,
} from '../../../../../controller/local/EditController/ExpertMode/access';
import { retreiveSchema } from '../../../../../controller/local/EditController/shared';
import { getDefaultsAsYAML } from '../../../../../utils/schema/defaultsHandling';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

export default async function editorInitializeSchema(
  ed: monaco.editor.IStandaloneCodeEditor,
  requestEditContext: RequestEditContext,
) {
  requestEditContext = getCurrentContext() ?? requestEditContext;
  const v = await retreiveSchema(requestEditContext, false, false);
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
    ed.setValue(str);
  } else {
    ed.setValue(v.yaml ?? defaultStr);
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

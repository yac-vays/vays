import { debounce } from 'lodash';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { retreiveSchema } from '../../../../../controller/local/EditController/shared';
import { RequestEditContext } from '../../../../../utils/types/internal/request';
import { getDefaultsAsYAML } from '../../../../../utils/schema/defaultsHandling';
import {
  getCurrentContext,
  setEntityYAML,
} from '../../../../../controller/local/EditController/ExpertMode/access';

import { updateYAMLschema } from '../../../../../controller/local/EditController/ExpertMode';

export default async function editorSchemaHandler(
  ed: monaco.editor.IStandaloneCodeEditor,
  requestEditContext: RequestEditContext,
) {
  // handleChange('', requestEditContext);
  // retreiveSchema(requestEditContext).then((v) => {
  //   if (v == null) {
  //     ed.setValue("---\n\n# Please enter here... (btw couldn't fetch the schema in time, sorry)");
  //   } else {
  //     const str = getDefaultsAsYAML(v.json_schema);
  //     ed.getModel()!.setValue(str);
  //   }
  // });
  console.error('Calling schema handler');
  requestEditContext = getCurrentContext() ?? requestEditContext;
  const v = await retreiveSchema(requestEditContext, true, true);
  const defaultStr = "---\n\n# Please enter here... (btw couldn't fetch the data in time, sorry)";
  console.error('Retreiving the schema');
  console.error(requestEditContext);
  console.error(v);

  if (v == null) {
    ed.setValue(defaultStr);
    await (window as any).monacoYaml.update({
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

  console.error(v.json_schema);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (window as any).monacoYaml.update({
    schemas: [
      {
        uri: `inmemory://schema.json`,
        schema: v.json_schema,
        fileMatch: ['*'],
      },
    ],
  });
}

export function registerInputCallback(model: any, handleChange: (v: string) => void) {
  const update = debounce(async (value: string) => {
    handleChange(value);
  }, 1000);
  model.onDidChangeContent(() => {
    update(model.getValue());
  });
}

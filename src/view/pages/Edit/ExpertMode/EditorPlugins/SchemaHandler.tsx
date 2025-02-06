import { debounce } from 'lodash';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { getCurrentContext } from '../../../../../controller/local/EditController/ExpertMode/access';
import { retreiveSchema } from '../../../../../controller/local/EditController/shared';
import { getDefaultsAsYAML } from '../../../../../utils/schema/defaultsHandling';
import { RequestEditContext } from '../../../../../utils/types/internal/request';

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
  console.log('Calling schema handler');
  requestEditContext = getCurrentContext() ?? requestEditContext;
  const v = await retreiveSchema(requestEditContext, true, true);
  const defaultStr = "---\n\n# Please enter here... (btw couldn't fetch the data in time, sorry)";
  console.log('Retreiving the schema');
  console.log(requestEditContext);

  if (v == null) {
    ed.setValue(defaultStr);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerInputCallback(model: any, handleChange: (v: string) => void) {
  const update = debounce(async (value: string) => {
    handleChange(value);
  }, 1000);
  model.onDidChangeContent(() => {
    update(model.getValue());
  });
}

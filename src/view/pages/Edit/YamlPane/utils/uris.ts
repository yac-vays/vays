import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { SchemasSettings } from 'monaco-yaml';
import {
  getMonacoYaml,
  setCurrentJsonSchema,
} from '../../../../../controller/local/EditController/editState';
import { patchSchemaForMonaco } from '../../../../../utils/schema/monacoSchemaFix';

/** URI of the Monaco model holding the entity's YAML document. */
export const ENTITY_MODEL_URI = 'inmemory://schema.json';

/** URI under which the entity's JSON schema is registered with monaco-yaml. */
export const YAML_SCHEMA_URI = 'inmemory://schema.json';

export function getEntityModel(): monaco.editor.ITextModel | null {
  return monaco.editor.getModel(monaco.Uri.parse(ENTITY_MODEL_URI));
}

/** The monaco-yaml options that validate the YAML against `schema`. */
export function yamlSchemaOptions(schema: SchemasSettings['schema']): {
  schemas: SchemasSettings[];
} {
  return { schemas: [{ uri: YAML_SCHEMA_URI, schema, fileMatch: ['*'] }] };
}

/** Make `jsonSchema` (as sent by YAC) the schema of the YAML editor. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setEditorSchema(jsonSchema: any): Promise<void> | undefined {
  setCurrentJsonSchema(jsonSchema);
  return getMonacoYaml()?.update(yamlSchemaOptions(patchSchemaForMonaco(jsonSchema)));
}

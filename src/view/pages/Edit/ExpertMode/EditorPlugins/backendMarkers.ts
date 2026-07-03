import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { dataLocToInstancePath } from '../../../../../utils/schema/locatedErrors';
import { locateInstancePathInYaml } from '../../../../../utils/schema/yamlPathLocator';

/**
 * Marker owner for backend-located validation errors. Separate from
 * monaco-yaml's own markers, so the two validation sources never overwrite
 * each other; the glyph/decoration listener (errorDecoration.ts) renders
 * markers of every owner alike.
 */
const OWNER = 'yac-backend';

/**
 * Mirror the backend's located validation error into the YAML editor.
 *
 * monaco-yaml validates locally against the JSON schema, but custom YAC
 * `format`s (e.g. `ssh_key`) are server-side plugins the local validator
 * ignores ("unknown format ... ignored") — such errors were visible in the
 * form (via `locateBackendError`) but not in the editor. Whenever a validate
 * response arrives, the located error (if any) is set as a Monaco marker at
 * the offending value; a valid response clears it.
 */
export function setBackendValidationMarkers(
  model: monaco.editor.ITextModel | null,
  resp: { valid: boolean; detail?: string; data_loc?: string },
) {
  if (model == null) return;

  const markers: monaco.editor.IMarkerData[] = [];
  const instancePath = dataLocToInstancePath(resp.data_loc);
  if (!resp.valid && instancePath !== '') {
    const range = locateInstancePathInYaml(model.getValue(), instancePath);
    if (range != null) {
      const start = model.getPositionAt(range.start);
      const end = model.getPositionAt(range.end);
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: resp.detail || 'The backend rejected this value.',
        source: 'YAC',
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      });
    }
  }
  monaco.editor.setModelMarkers(model, OWNER, markers);
}

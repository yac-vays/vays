import { getCachedConfig } from '../../model/config';
import { hashCode } from '../../utils/hashUtils';
import { isInjectedNameKey } from '../../utils/schema/injectName';
import { lintSchema } from '../../utils/schema/schemaLint';
import { RequestEditContext } from '../../utils/types/internal/request';
import { ValidateResponse } from '../../utils/types/internal/validation';
import troubleshootCtrlState from '../state/TroubleShootState';

/**
 * Run the schema lint over a validate response and file every finding as a
 * schema warning. No-op on production instances (the bell is hidden there
 * anyway, so the work would only fill a buffer nobody sees).
 */
export function reportSchemaWarnings(
  valResp: ValidateResponse,
  requestEditContext: RequestEditContext,
) {
  if (getCachedConfig()?.production !== false) return;
  const backend = requestEditContext.rc.backendObject?.title ?? 'Unknown';
  for (const f of lintSchema(valResp.json_schema, valResp.ui_schema, valResp.data)) {
    tsAddWarningMessage(f.priority, f.title, f.message, f.key, backend);
  }
}

export function tsAddWarningMessage(
  priority: number,
  title: string,
  message: string,
  yamlKey: string,
  backendName: string,
) {
  if (isInjectedNameKey(yamlKey)) {
    return;
  }
  const messageKey = hashCode(title + message + priority.toString()).toString();
  const ret = troubleshootCtrlState.messageBuffer.findIndex((v) => v.msgKey === messageKey);

  if (ret > -1) {
    const keys = troubleshootCtrlState.messageBuffer[ret].prop.affectedKeys;
    for (const e of keys) {
      if (e[0] + e[1] === yamlKey + backendName) {
        return;
      }
    }
    troubleshootCtrlState.messageBuffer[ret].prop.affectedKeys.push([yamlKey, backendName]);
  } else {
    troubleshootCtrlState.messageBuffer.push({
      msgKey: messageKey,
      prop: {
        title: title,
        priority: priority,
        subtitle: message,
        affectedKeys: [[yamlKey, backendName]],
      },
    });
    troubleshootCtrlState.messageBuffer.sort((a, b) => -(a.prop.priority - b.prop.priority));
  }
  // Always push the new buffer to the dropdown; only priorities above 1
  // light up the "new warnings" dot in the header.
  troubleshootCtrlState.update(priority > 1);
}

export function getWarningMessageBuffer() {
  return troubleshootCtrlState.messageBuffer;
}

export function clearWarningMessageBuffer() {
  troubleshootCtrlState.messageBuffer = [];
  troubleshootCtrlState.update(false);
}

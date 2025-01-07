import { isInjectedNameKey } from '../../schema/injectName';
import { hashCode } from '../../utils/hashUtils';
import troubleshootCtrlState from '../state/TroubleShootState';

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
  if (priority > 1) troubleshootCtrlState.update();
}

export function getWarningMessageBuffer() {
  return troubleshootCtrlState.messageBuffer;
}

export function clearWarningMessageBuffer() {
  troubleshootCtrlState.messageBuffer = [];
  troubleshootCtrlState.update(false);
}

import { TroubleShootMessageProps } from '../../view/components/SchemaWarningMessage/SchemaWarningMessage';

/**
 * The State for the Notification controller.
 */
class TroubleShootCtrlState {
  /**
   * Buffer for messages.
   */
  public messageBuffer: { prop: TroubleShootMessageProps; msgKey: string }[] = [];

  public update: (b?: boolean) => void = () => {};
}

const troubleshootCtrlState = new TroubleShootCtrlState();
export default troubleshootCtrlState;

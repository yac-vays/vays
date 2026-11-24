import { TroubleShootMessageProps } from '../../view/components/SchemaWarningMessage';

/**
 * The state of the troubleshoot controller (schema warnings).
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

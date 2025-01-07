import { Nullable } from '../../utils/typeUtils';
import { TroubleShootMessageProps } from '../../view/thirdparty-based-components/Header/TroubleShootMessage';

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

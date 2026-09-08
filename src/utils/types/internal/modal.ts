import { ActionDecl } from '../api';

export type CallbackSuccessType = (
  enteredName?: string,
  actionsSelected?: ActionDecl[],
) => Promise<void>;

/**
 * An additional (secondary) button of a modal, rendered in its own row above
 * the Cancel / confirm pair. Unless `keepOpen` is set, the modal closes before
 * `onClick` runs — a handler that opens another overlay therefore does not
 * race with this modal hiding itself.
 */
export interface ModalExtraButton {
  label: string;
  /** Native tooltip. */
  title?: string;
  onClick: () => void | Promise<void>;
  keepOpen?: boolean;
}

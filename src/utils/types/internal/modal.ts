import { ActionDecl } from '../api';

export type CallbackSuccessType = (
  enteredName?: string,
  actionsSelected?: ActionDecl[],
) => Promise<void>;

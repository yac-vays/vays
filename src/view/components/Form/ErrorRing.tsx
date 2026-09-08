import React from 'react';
import { useFormReadonly, visibleFormErrors } from './useFormReadonly';

/**
 * Wraps a form control's input and draws a red ring around it when the control
 * has a validation error. A ring (drawn outside the box) is used rather than a
 * border so it does not fight with each input component's own border.
 *
 * This is the single, consistent error affordance for every renderer; the
 * accompanying error message is shown via the red info-button in the control's
 * label (see {@link OverheadLabelWithMarkdownDescr} / `FormComponentTitle`).
 * Suppressed in a read-only form, except for "value the form cannot display"
 * findings (see {@link visibleFormErrors}).
 */
const ErrorRing = ({ errors, children }: { errors?: string; children: React.ReactNode }) => {
  const shown = visibleFormErrors(errors, useFormReadonly());
  return <div className={shown ? 'rounded-md ring-2 ring-[#d32f2f]' : ''}>{children}</div>;
};

export default ErrorRing;

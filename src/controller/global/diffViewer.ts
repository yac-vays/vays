import { Nullable } from '../../utils/types/typeUtils';
import { ToastLink } from '../../view/components/ToastNotification/ToastContext';

/**
 * Controller for the global diff viewer overlay (see
 * `view/components/DiffViewer`), following the same register-a-callback
 * pattern as the modal and toast controllers. Used to show the unified diff
 * (`patch`) that YAC returns from a successful create/edit.
 */

export type DiffViewerCallback = (title: string, patch: string) => void;

let diffViewerCallback: Nullable<DiffViewerCallback> = null;

export function registerDiffViewerCallback(callback: Nullable<DiffViewerCallback>) {
  diffViewerCallback = callback;
}

/** Open the diff viewer overlay with the given unified diff. */
export function showDiffViewer(title: string, patch: string) {
  diffViewerCallback?.(title, patch);
}

/**
 * Build the "Show changes" link for a success toast, or undefined when the
 * response carried no patch (so the toast stays link-less).
 */
export function diffToastLink(title: string, patch: string | undefined): ToastLink | undefined {
  if (patch == null || patch === '') return undefined;
  return { label: 'Show changes', onClick: () => showDiffViewer(title, patch) };
}

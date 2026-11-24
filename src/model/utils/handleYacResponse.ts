/**
 * Shared handling for YAC REST responses.
 *
 * Every model function used to re-implement the same status ladder
 * (success / 422 / >=500 / 401 / 403 / >=400) with slightly different body
 * decodings. This module decodes the YAC error envelope exactly once and
 * returns a discriminated result, showing the toasts that are common to all
 * call sites (server errors, missing permission) and triggering the re-login
 * flow on an expired session.
 */

import { showError, showWarning } from '../../controller/global/notification';
import { handleAuthFailed, userIsLoggedIn } from '../../session/login/tokenHandling';
import { Nullable } from '../../utils/types/typeUtils';

/** Set by YAC on a successful write when one of its `*:after` actions failed. */
export const YAC_WARNING_HEADER = 'YAC-Warning';

/** The error envelope YAC returns for non-2xx responses. */
export interface YacErrorBody {
  title?: string;
  message?: string;
  /** FastAPI-style fallback field, set by some framework-level errors. */
  detail?: string;
}

export type YacResponseResult =
  /** The fetch itself failed ({@link sendRequest} returned null). */
  | { kind: 'network-error' }
  /** The expected success status; the body has *not* been consumed. */
  | { kind: 'success'; resp: Response }
  /** 422 — the request shape was rejected, i.e. a frontend bug. No toast shown. */
  | { kind: 'invalid-request'; status: number; body: YacErrorBody }
  /** 401 — expired/invalid session; the re-login flow has been triggered. */
  | { kind: 'auth-expired'; status: number; body: YacErrorBody }
  /** 403 — valid session but missing permission; an error toast was shown. */
  | { kind: 'forbidden'; status: number; body: YacErrorBody }
  /**
   * 503 — the backend's git repository is unavailable (typically in
   * maintenance). No toast: the availability banner of the page shows the
   * backend's title/message instead (see `controller/global/availability`).
   */
  | { kind: 'unavailable'; status: number; body: YacErrorBody }
  /** >= 500 (other than 503) — an error toast was shown. */
  | { kind: 'server-error'; status: number; body: YacErrorBody }
  /**
   * Any other non-success status (mostly the remaining 4xx). No toast shown
   * unless {@link YacResponseContext.genericClientErrors} is set.
   */
  | { kind: 'client-error'; status: number; body: YacErrorBody };

export interface YacResponseContext {
  /**
   * Toast title: the `{backend} / {type} / {entityName}` breadcrumb of the
   * affected resource (see `entityToastTitle`).
   */
  title: string;
  /**
   * First part of the toast detail, stating what failed in operation terms and
   * without trailing punctuation, e.g. `Create of foo failed`. The status and
   * the backend's explanation are appended (see {@link yacErrorDetail}).
   */
  errorText: string;
  /** Fallback explanation used when the envelope carries neither title nor message. */
  errorMessage?: string;
  /**
   * Custom composer for the error-toast detail, replacing the uniform
   * {@link yacErrorDetail} format in every toast branch. For call sites whose
   * wording deviates (e.g. action runs, which show the backend's message
   * verbatim without the status/title boilerplate).
   */
  errorDetail?: (status: number, body: YacErrorBody) => string;
  /** The status code counting as success. Defaults to 200. */
  successStatus?: number;
  /**
   * When true, `invalid-request` and `client-error` results also get the
   * standard backend-titled error toast (used by call sites that treat every
   * >= 400 alike, such as copy/link/delete/run-action).
   */
  genericClientErrors?: boolean;
  /** Show no error toast at all (the re-login flow of a 401 still runs). */
  quiet?: boolean;
}

/**
 * Compose the uniform error-toast detail: `{errorText} (Status {status}):
 * {explanation}`, where the explanation is the YAC error envelope (title and
 * message joined) or `fallback` when the envelope is empty.
 */
export function yacErrorDetail(
  errorText: string,
  status: number,
  body: YacErrorBody,
  fallback: string,
): string {
  const explanation = [body.title, body.message ?? body.detail].filter(Boolean).join(': ');
  return `${errorText} (Status ${status}): ${explanation || fallback}`;
}

/**
 * Classify a YAC response and perform the error handling that is common to
 * all call sites. See {@link YacResponseResult} for which kinds already had a
 * toast shown; call sites only need to handle their specific cases (success
 * body, 422 wording, special 4xx) and map kinds to return values.
 */
export async function handleYacResponse(
  resp: Nullable<Response>,
  ctx: YacResponseContext,
): Promise<YacResponseResult> {
  if (resp == null) return { kind: 'network-error' };
  if (resp.status === (ctx.successStatus ?? 200)) {
    // A committed write whose after-action failed: still a success.
    const warning = resp.headers?.get(YAC_WARNING_HEADER);
    if (warning && !ctx.quiet) showWarning(ctx.title, warning);
    return { kind: 'success', resp };
  }

  const status = resp.status;
  const body = await decodeErrorBody(resp);

  if (status === 503) {
    return { kind: 'unavailable', status, body };
  }

  if (status >= 500) {
    if (!ctx.quiet)
      showError(
        ctx.title,
        ctx.errorDetail?.(status, body) ??
          yacErrorDetail(
            ctx.errorText,
            status,
            body,
            ctx.errorMessage ?? 'Please contact your admin on this issue.',
          ),
      );
    return { kind: 'server-error', status, body };
  }

  if (status === 401) {
    // Expired or invalid session: trigger the existing re-login flow.
    handleAuthFailed(body.title ?? body.detail, body.message);
    return { kind: 'auth-expired', status, body };
  }

  if (status === 403) {
    if (!userIsLoggedIn()) {
      // No credentials were attached (the user is not signed in); a YAC
      // without its own answer for that rejects such requests with 403
      // "Not authenticated". That is not a permission problem — the user is
      // simply logged out and already on (or being routed to) the login
      // page, so this goes through the silent re-login flow instead of a
      // noisy permission toast.
      handleAuthFailed(body.title ?? body.detail, body.message);
      return { kind: 'auth-expired', status, body };
    }
    // The session itself is fine — the user merely lacks permission for this
    // operation. Surface the backend's explanation instead of re-logging-in.
    if (!ctx.quiet)
      showError(
        ctx.title,
        ctx.errorDetail?.(status, body) ??
          yacErrorDetail(
            ctx.errorText,
            status,
            body,
            ctx.errorMessage ?? 'You do not have permission to perform this operation.',
          ),
      );
    return { kind: 'forbidden', status, body };
  }

  const kind = status === 422 ? ('invalid-request' as const) : ('client-error' as const);
  if (ctx.genericClientErrors) {
    showError(
      ctx.title,
      ctx.errorDetail?.(status, body) ??
        yacErrorDetail(
          ctx.errorText,
          status,
          body,
          ctx.errorMessage ??
            'Please try again later or click on the help button (?) for support information.',
        ),
    );
  }
  return { kind, status, body };
}

export async function decodeErrorBody(resp: Response): Promise<YacErrorBody> {
  try {
    const body = await resp.json();
    if (body != null && typeof body === 'object') {
      const envelope = body as YacErrorBody;
      if (typeof envelope.detail !== 'string') envelope.detail = detailText(envelope.detail);
      return envelope;
    }
  } catch {
    // Non-JSON error body (e.g. a proxy error page) — treat as empty envelope.
  }
  return {};
}

/**
 * FastAPI reports request-validation errors (422) as a list of
 * `{loc, msg, ...}` in `detail`: flatten it to one line.
 */
function detailText(detail: unknown): string | undefined {
  if (!Array.isArray(detail)) return undefined;
  const lines = detail
    .map((d) => {
      if (typeof d === 'string') return d;
      if (d == null || typeof d.msg !== 'string') return '';
      const loc = Array.isArray(d.loc) ? d.loc.join('.') : '';
      return loc ? `${loc}: ${d.msg}` : d.msg;
    })
    .filter(Boolean);
  return lines.length > 0 ? lines.join('; ') : undefined;
}

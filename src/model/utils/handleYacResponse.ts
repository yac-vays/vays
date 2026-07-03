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

import { showError } from '../../controller/global/notification';
import { handleAuthFailed, userIsLoggedIn } from '../../session/login/tokenHandling';
import { Nullable } from '../../utils/types/typeUtils';

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
  /** >= 500 — an error toast was shown. */
  | { kind: 'server-error'; status: number; body: YacErrorBody }
  /**
   * Any other non-success status (mostly the remaining 4xx). No toast shown
   * unless {@link YacResponseContext.genericClientErrors} is set.
   */
  | { kind: 'client-error'; status: number; body: YacErrorBody };

export interface YacResponseContext {
  /** Title of the backend (`requestContext.backendObject?.title`); prefixes 5xx/403 toasts. */
  backendTitle?: string;
  /**
   * Fallback toast title used when the envelope carries no `title`, e.g.
   * `Cannot create foo`. The status code is appended automatically.
   */
  errorTitle: string;
  /** Fallback toast message used when the envelope carries no `message`. */
  errorMessage?: string;
  /** Appended to the server-error toast message (e.g. a "data is cached" note). */
  serverErrorSuffix?: string;
  /** The status code counting as success. Defaults to 200. */
  successStatus?: number;
  /**
   * When true, `invalid-request` and `client-error` results also get the
   * standard backend-titled error toast (used by call sites that treat every
   * >= 400 alike, such as copy/link/delete/run-action).
   */
  genericClientErrors?: boolean;
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
  if (resp.status === (ctx.successStatus ?? 200)) return { kind: 'success', resp };

  const status = resp.status;
  const body = await decodeErrorBody(resp);
  const fallbackTitle = `${ctx.errorTitle} (Status ${status})`;

  if (status >= 500) {
    showError(
      `${ctx.backendTitle}: ` + (body.title ?? fallbackTitle),
      (body.message ?? ctx.errorMessage ?? 'Please contact your admin on this issue. ') +
        (ctx.serverErrorSuffix ?? ''),
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
      // No credentials were attached (the user is not signed in), and
      // FastAPI's security scheme rejects such requests with 403
      // "Not authenticated". That is not a permission problem — the user is
      // simply logged out and already on (or being routed to) the login
      // page, so this goes through the silent re-login flow instead of a
      // noisy permission toast.
      handleAuthFailed(body.title ?? body.detail, body.message);
      return { kind: 'auth-expired', status, body };
    }
    // The session itself is fine — the user merely lacks permission for this
    // operation. Surface the backend's explanation instead of re-logging-in.
    showError(
      `${ctx.backendTitle}: ` + (body.title ?? fallbackTitle),
      body.message ??
        body.detail ??
        ctx.errorMessage ??
        'You do not have permission to perform this operation.',
    );
    return { kind: 'forbidden', status, body };
  }

  const kind = status === 422 ? ('invalid-request' as const) : ('client-error' as const);
  if (ctx.genericClientErrors) {
    showError(
      `${ctx.backendTitle}: ` + (body.title ?? fallbackTitle),
      body.message ?? ctx.errorMessage ?? 'Waking up the admin, please stand by...',
    );
  }
  return { kind, status, body };
}

async function decodeErrorBody(resp: Response): Promise<YacErrorBody> {
  try {
    const body = await resp.json();
    if (body != null && typeof body === 'object') return body as YacErrorBody;
  } catch {
    // Non-JSON error body (e.g. a proxy error page) — treat as empty envelope.
  }
  return {};
}

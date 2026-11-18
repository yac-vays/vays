import { useCallback, useEffect, useState } from 'react';
import { getEntityLogContent } from '../../../../../model/logs';
import type { EntityLogContent } from '../../../../../utils/types/api';
import type { RequestContext } from '../../../../../utils/types/internal/request';

export type LogContentState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; content: EntityLogContent };

/**
 * Loads the content document of a log once the view is opened (it is never
 * polled). `retry` loads it again.
 */
export function useLogContent(
  entityName: string,
  logName: string,
  requestContext: RequestContext,
): [LogContentState, () => void] {
  const [state, setState] = useState<LogContentState>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    setState({ kind: 'loading' });
    getEntityLogContent(entityName, logName, requestContext).then((result) => {
      if (!mounted) return;
      setState(
        result.kind === 'success'
          ? { kind: 'success', content: result.content }
          : { kind: 'error', message: result.message },
      );
    });
    return () => {
      mounted = false;
    };
  }, [entityName, logName, requestContext.yacURL, requestContext.entityTypeName, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return [state, retry];
}

/** What a window shows while its content is loading or failed to load. */
export const LogContentStatus = ({
  state,
  retry,
}: {
  state: LogContentState;
  retry: () => void;
}) => {
  if (state.kind === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center" role="status" aria-label="Loading">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#a8a8a8] border-t-transparent" />
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-solid">{state.message}</p>
        <button
          type="button"
          className="rounded-sm border border-stroke px-3 py-1 text-sm text-solid hover:bg-gray-500/10"
          onClick={retry}
        >
          Retry
        </button>
      </div>
    );
  }
  return null;
};

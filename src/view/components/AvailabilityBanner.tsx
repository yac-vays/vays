import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAvailability, subscribeAvailability } from '../../controller/global/availability';
import { BackendAvailability } from '../../controller/state/AvailabilityState';
import { formatLogTime } from '../../utils/logUtils';
import { YACBackend } from '../../utils/types/config';

/**
 * The backend the current page belongs to: routes are
 * `/:backendName/:entityTypeName/...`, so it is the first path segment.
 */
function currentBackend(pathname: string, backendList: YACBackend[]): YACBackend | undefined {
  const name = decodeURIComponent(pathname.split('/')[1] ?? '');
  return backendList.find((backend) => backend.name === name);
}

/**
 * A banner across the top of the page content, shown while the backend of
 * the current page cannot use its git repository: either it answers 503
 * (maintenance) — then YAC's own title and message are shown — or it serves
 * the last known state and flags it as stale. Pages that do not need the
 * repository (login, help) never show it, because they are not tied to a
 * backend.
 */
const AvailabilityBanner = ({ backendList }: { backendList: YACBackend[] }) => {
  const { pathname } = useLocation();
  const backend = currentBackend(pathname, backendList);
  const [availability, setAvailability] = useState<BackendAvailability>(
    getAvailability(backend?.url),
  );

  useEffect(() => {
    setAvailability(getAvailability(backend?.url));
    return subscribeAvailability(() => setAvailability(getAvailability(backend?.url)));
  }, [backend?.url]);

  if (!backend || availability.state === 'ok') return null;

  let title: string;
  let message: string;
  if (availability.state === 'unavailable') {
    title = availability.title;
    message = availability.message;
  } else {
    title = 'Data repository unreachable';
    const from = availability.syncedAt
      ? ` from ${formatLogTime(availability.syncedAt.toISOString())}`
      : '';
    message =
      `Showing the last known state${from}. ` +
      'Changes cannot be saved until the repository is reachable again.';
  }

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-sm border border-primary bg-primary-10 p-4 text-plainfont shadow-default"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="mt-0.5 shrink-0 fill-primary"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
      >
        <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
      </svg>
      <div>
        <p className="font-semibold">
          {backend.title}: {title}
        </p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

export default AvailabilityBanner;

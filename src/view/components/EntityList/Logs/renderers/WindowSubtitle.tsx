import { formatLogTime, formatRelativeTime } from '../../../../../utils/logUtils';
import type { EntityLog } from '../../../../../utils/types/api';

/**
 * Subtitle of a log window: the entity, the time of the document (relative,
 * absolute on hover) and the message of the newest entry — with a warning sign
 * if that entry reports a problem.
 */
const WindowSubtitle = ({
  entityName,
  time,
  latest,
}: {
  entityName: string;
  time: string;
  latest: EntityLog | undefined;
}) => {
  const relative = formatRelativeTime(time);
  return (
    <span className="flex flex-wrap items-center gap-x-2">
      <span className="font-medium">{entityName}</span>
      {relative && (
        <>
          <span aria-hidden="true">·</span>
          <span title={formatLogTime(time)}>{relative}</span>
        </>
      )}
      {latest?.message && (
        <>
          <span aria-hidden="true">·</span>
          <span className={latest.problem === true ? 'text-[#b07d00] dark:text-[#e0a100]' : ''}>
            {latest.problem === true && <span aria-label="Warning">⚠ </span>}
            {latest.message}
          </span>
        </>
      )}
    </span>
  );
};

export default WindowSubtitle;

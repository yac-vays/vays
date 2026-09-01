import { getCurrentJsonSchema } from '../../controller/local/EditController/ExpertMode/access';
import {
  LIMIT_CHIP_STYLE,
  formatLimitShort,
  limitLevel,
  metaPanelUsages,
  usagesForFormPath,
} from '../../utils/limitUtils';
import { LimitUsage } from '../../utils/types/api';
import { useYACUsages } from '../hooks/useYACUsages';
import InfoPanel from './InfoPanel';

/**
 * One `limits` usage as a small always-visible chip (e.g. "3/5"), green while
 * within the cap, amber when close, red once exceeded. Hovering shows the
 * limit's title and the spelled-out usage, matching the (i)/error indicators.
 */
export const LimitChip = ({ usage }: { usage: LimitUsage }): JSX.Element => (
  <InfoPanel title={usage.title} description={`${usage.used} of ${usage.max} used`}>
    <span
      className="inline-flex items-center whitespace-nowrap rounded px-1.5 text-xs font-medium cursor-help"
      style={LIMIT_CHIP_STYLE[limitLevel(usage)]}
    >
      {formatLimitShort(usage)}
    </span>
  </InfoPanel>
);

/** The chips for the limits anchored (via their `path`) on one form field. */
export const FormFieldLimitChips = ({ path }: { path?: string }): JSX.Element => {
  const usages = usagesForFormPath(useYACUsages(), path);
  if (usages.length === 0) return <></>;
  return (
    <span className="inline-flex items-center gap-1">
      {usages.map((u) => (
        <LimitChip key={u.title} usage={u} />
      ))}
    </span>
  );
};

/**
 * The chips shown next to the entity name: limits without a `path`, plus
 * limits whose path does not resolve in the current schema (typo or
 * `yac_if`-hidden field) so no limit ever silently disappears.
 */
export const MetaLimitChips = (): JSX.Element => {
  const usages = metaPanelUsages(useYACUsages(), getCurrentJsonSchema());
  if (usages.length === 0) return <></>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {usages.map((u) => (
        <LimitChip key={u.title} usage={u} />
      ))}
    </span>
  );
};

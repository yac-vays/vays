import { LimitUsage } from '../../../utils/types/api';

/**
 * Renders the current `limits` usage of an entity type as small chips
 * (e.g. "VMs per owner: 3/5"), green while within the cap and red once it is
 * exceeded. Hidden when there are no applicable limits.
 *
 * The data comes from the backend `/validate` response and is updated live on
 * every validation round (see the reactive listener in `EditController/shared`).
 */
const UsageIndicator = ({ usages }: { usages: LimitUsage[] }): JSX.Element => {
  if (!usages || usages.length === 0) return <></>;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {usages.map((u) => (
        <span
          key={u.title}
          title={`${u.title}: ${u.used} of ${u.max} used`}
          className="inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: u.ok ? 'rgb(34 197 94 / 0.15)' : 'rgb(239 68 68 / 0.15)',
            color: u.ok ? 'rgb(21 128 61)' : 'rgb(185 28 28)',
          }}
        >
          {u.title}: {u.used}/{u.max}
        </span>
      ))}
    </div>
  );
};

export default UsageIndicator;

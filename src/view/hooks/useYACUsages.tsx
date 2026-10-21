import { useEffect, useState } from 'react';
import {
  getYACUsages,
  getYACUsagesData,
  subscribeToUsages,
} from '../../controller/local/EditController/shared';
import { LimitUsage } from '../../utils/types/api';

/**
 * The current `limits` usages of the edit session, updated live on every
 * validation round (see the reactive bridge in `EditController/shared`).
 */
export function useYACUsages(): LimitUsage[] {
  const [usages, setUsages] = useState<LimitUsage[]>(getYACUsages());
  useEffect(() => subscribeToUsages(setUsages), []);
  return usages;
}

export interface YACUsageSnapshot {
  usages: LimitUsage[];
  /** The entity data the usages were measured for (null when unknown). */
  data: unknown;
}

/** Like {@link useYACUsages}, plus the entity data the usages belong to. */
export function useYACUsageSnapshot(): YACUsageSnapshot {
  const [snapshot, setSnapshot] = useState<YACUsageSnapshot>(() => ({
    usages: getYACUsages(),
    data: getYACUsagesData(),
  }));
  useEffect(
    () => subscribeToUsages((usages) => setSnapshot({ usages, data: getYACUsagesData() })),
    [],
  );
  return snapshot;
}

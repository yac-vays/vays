import { useEffect, useState } from 'react';
import {
  getYACUsages,
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

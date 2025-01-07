/**
 * The global controller for the YAC backend logic.
 */

import { getConfig, YACBackend } from '../../model/ConfigFetcher';

/**
 * @returns A list of the YAC backends.
 */
export async function getBackends(): Promise<YACBackend[]> {
  return (await getConfig())?.backends ?? [];
}

export function isValidEntityType(backendUID: string): boolean {
  return false;
}

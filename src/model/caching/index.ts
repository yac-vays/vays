import { AppCache } from './AppCache';
import {
  ENTITY_LIST_CACHE_KEY,
  ENTITY_TYPE_CACHE_KEY,
  LOGS_CACHE_KEY,
  LOGS_CACHE_TTL,
} from './cachekeys';

/**
 * Needs to be defined here to avoid some circular imports.
 *
 * EntityType needs authedRequest (for sending requests) which in turn
 */

const VAYS_CACHE = new AppCache();
VAYS_CACHE.registerContext(ENTITY_TYPE_CACHE_KEY);
VAYS_CACHE.registerContext(ENTITY_LIST_CACHE_KEY);
VAYS_CACHE.registerContext(LOGS_CACHE_KEY, LOGS_CACHE_TTL);
export default VAYS_CACHE;

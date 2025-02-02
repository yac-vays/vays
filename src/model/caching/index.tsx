import { AppCache } from './AppCache';
import { ENTITY_LIST_CACHE_KEY } from '../entityList';
import { LOGS_CACHE_KEY, LOGS_CACHE_TTL } from '../logs';

const VAYS_CACHE = new AppCache();
VAYS_CACHE.registerContext('EntityType');
VAYS_CACHE.registerContext(ENTITY_LIST_CACHE_KEY);
VAYS_CACHE.registerContext(LOGS_CACHE_KEY, LOGS_CACHE_TTL);
export default VAYS_CACHE;

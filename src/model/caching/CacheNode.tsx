import { Nullable } from '../../utils/types/typeUtils';

export interface CacheFetchResult {
  found: boolean;
  value: any;
}

class CacheNode {
  _cache: { [key: string]: any } = {};
  _hooks: { [key: string]: () => void } = {};
  _isWrittenTo: { [key: string]: boolean } = {};
  _cacheTime: { [key: string]: number } = {};
  ttl: number = 0; // 0 is off

  /**
   *
   * @param ttl TTL in milliseconds. If 0 (the default) then no ttl is enforced.
   */
  constructor(ttl: number = 0) {
    this.ttl = ttl;
  }

  /**
   * Add an entry to this cache node.
   * @param id
   * @param value
   * @param hook
   */
  cache(id: string, value: any, hook: Nullable<() => void>): void {
    this._cache[id] = value;
    if (hook) this._hooks[id] = hook;
    this._isWrittenTo[id] = false;
    if (this.ttl > 0) {
      this._cacheTime[id] = new Date().getTime();
    }
  }

  isCached(id: string): boolean {
    return id in this._cache;
  }

  registerInvHook(id: string, hook: () => void): void {
    this._hooks[id] = hook;
  }

  hasRegistration(id: string): boolean {
    return this._isWrittenTo[id] ?? false;
  }

  /**
   * @param id
   */
  register(id: string): boolean {
    if (!this._isWrittenTo[id]) {
      this._isWrittenTo[id] = true;
      return true;
    }
    return false;
  }

  unregister(id: string) {
    this._isWrittenTo[id] = false;
  }

  /**
   * Fetch an entry from tihs cache node.
   * @param id
   * @returns
   */
  fetch(id: string): CacheFetchResult {
    if (id in this._cache) {
      if (this.ttl > 0 && new Date().getTime() - this._cacheTime[id] >= this.ttl) {
        this.invalidate(id);
      } else {
        return {
          found: true,
          value: this._cache[id],
        };
      }
    }
    return { found: false, value: null };
  }

  /**
   * Invalidate an entry from this cache node.
   * @param id
   * @returns
   */
  invalidate(id: string): boolean {
    let ret = this._cache[id] != undefined;
    delete this._cache[id];
    if (id in this._cacheTime) delete this._cacheTime[id];

    this._isWrittenTo[id] = false;

    if (id in this._hooks) {
      this._hooks[id]();
    }

    return ret;
  }
}

export default CacheNode;

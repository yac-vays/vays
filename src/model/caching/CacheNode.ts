import { Nullable } from '../../utils/types/typeUtils';

export interface CacheFetchResult<T = unknown> {
  found: boolean;
  value: Nullable<T>;
}

class CacheNode<T = unknown> {
  _cache = new Map<string, T>();
  _hooks = new Map<string, () => void>();
  _isWrittenTo = new Map<string, boolean>();
  _cacheTime = new Map<string, number>();
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
  cache(id: string, value: T, hook: Nullable<() => void>): void {
    this._cache.set(id, value);
    if (hook) this._hooks.set(id, hook);
    this._isWrittenTo.set(id, false);
    if (this.ttl > 0) {
      this._cacheTime.set(id, new Date().getTime());
    }
  }

  isCached(id: string): boolean {
    return this._cache.has(id);
  }

  registerInvHook(id: string, hook: () => void): void {
    this._hooks.set(id, hook);
  }

  hasRegistration(id: string): boolean {
    return this._isWrittenTo.get(id) ?? false;
  }

  /**
   * @param id
   */
  register(id: string): boolean {
    if (!this._isWrittenTo.get(id)) {
      this._isWrittenTo.set(id, true);
      return true;
    }
    return false;
  }

  unregister(id: string) {
    this._isWrittenTo.set(id, false);
  }

  /**
   * Fetch an entry from this cache node.
   * @param id
   * @returns
   */
  fetch(id: string): CacheFetchResult<T> {
    if (this._cache.has(id)) {
      if (this.ttl > 0 && new Date().getTime() - (this._cacheTime.get(id) ?? 0) >= this.ttl) {
        this.invalidate(id);
      } else {
        return {
          found: true,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          value: this._cache.get(id)!,
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
    const ret = this._cache.get(id) != undefined;
    this._cache.delete(id);
    this._cacheTime.delete(id);

    this._isWrittenTo.set(id, false);

    this._hooks.get(id)?.();

    return ret;
  }
}

export default CacheNode;

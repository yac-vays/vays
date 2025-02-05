import { hashCode } from '../../utils/hashUtils';
import { Nullable } from '../../utils/types/typeUtils';
import CacheNode from './CacheNode';

const BLOCKINGWAIT_DURATION = 100;

/**
 * Class which provides a multi-context cache with TTL.
 */
export class AppCache {
  private _nodes: { [key: string]: CacheNode } = {};

  registerContext(ctx: string, ttl: number = 0): boolean {
    if (!(ctx in this._nodes)) {
      this._nodes[ctx] = new CacheNode(ttl);
      return true;
    }

    return false;
  }

  isCached(ctx: string, id: string): boolean {
    if (!(ctx in this._nodes)) return false;

    return this._nodes[ctx].isCached(id);
  }

  cache(
    ctx: string,
    id: string,
    value: unknown,
    invalidateHook: Nullable<() => void> = null,
  ): boolean {
    if (ctx in this._nodes) {
      this._nodes[ctx].cache(id, value, invalidateHook);
      return true;
    } else {
      this.registerContext(ctx);
      return this.cache(ctx, id, value, invalidateHook);
    }
  }

  async retreive(ctx: string, id: string): Promise<unknown> {
    if (ctx in this._nodes) {
      while (this._nodes[ctx].hasRegistration(id)) {
        await new Promise((res) => setTimeout(res, BLOCKINGWAIT_DURATION));
      }
      return this._nodes[ctx].fetch(id).value;
    }

    return null;
  }

  registerInvHook(ctx: string, id: string, hook: () => void): boolean {
    if (ctx in this._nodes) {
      this._nodes[ctx].registerInvHook(id, hook);
      return true;
    }
    return false;
  }

  /**
   * Will cause subsequent accesses to block asynchronously
   * until the thread which has registered is either
   * cancelling the registration or the data was written to cache.
   * @param ctx
   * @param id
   *
   * @returns boolean, whether the registration was successful. If true, then there is no
   * other ongoing registration.
   */
  preCacheRegister(ctx: string, id: string): boolean {
    if (ctx in this._nodes && !this._nodes[ctx].hasRegistration(id)) {
      this._nodes[ctx].register(id);
      return true;
    }
    return false;
  }

  preCacheUnregister(ctx: string, id: string): boolean {
    if (ctx in this._nodes && this._nodes[ctx].hasRegistration(id)) {
      this._nodes[ctx].unregister(id);
      return true;
    }
    return false;
  }

  invalidate(ctx: string, id: string): void {
    if (ctx in this._nodes) {
      this._nodes[ctx].invalidate(id);
    }
  }

  invalidateAll(): void {
    for (const ctx of Object.keys(this._nodes)) {
      this._nodes[ctx] = new CacheNode(this._nodes[ctx].ttl);
    }
    console.error(this._nodes);
  }

  getIDFromRequest(yacBackendURL: string, apiCall: string) {
    return hashCode(yacBackendURL + apiCall);
  }
}

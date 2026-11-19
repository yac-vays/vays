/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The column filters of an entity list, by column: `name` for the entity name,
 * `options` by the name of the type's option (not by position, so they survive
 * changes of the columns). Only non-empty filters are stored.
 */
export interface StoredListFilters {
  name?: string;
  options: Record<string, string>;
}

class ISessionStorage {
  public KEYS: readonly string[] = ['eMostRecentURL', 'entityListFilters.*'];

  /**
   * ephemeral information: Will vanish after a single read access.
   */
  public setMostRecentURL(v: string) {
    this.set('eMostRecentURL', v);
  }

  public getMostRecentURL(reset: boolean = false): string | undefined {
    const ret = this.get('eMostRecentURL');
    if (reset) sessionStorage.removeItem('eMostRecentURL');

    return ret;
  }

  /**
   * The column filters of the entity list of a type (per tab, gone on logout
   * as `clearSession` empties the session storage).
   */
  public getListFilters(yacURL: string, entityTypeName: string): StoredListFilters | null {
    const v = this.get(this.listFiltersKey(yacURL, entityTypeName));
    if (v == null || typeof v !== 'object' || typeof v.options !== 'object' || v.options == null) {
      return null;
    }
    return v as StoredListFilters;
  }

  /** Store the column filters; `null` removes them. */
  public setListFilters(
    yacURL: string,
    entityTypeName: string,
    filters: StoredListFilters | null,
  ): void {
    const key = this.listFiltersKey(yacURL, entityTypeName);
    if (filters == null) sessionStorage.removeItem(key);
    else this.set(key, filters);
  }

  private listFiltersKey(yacURL: string, entityTypeName: string): string {
    return `entityListFilters.${JSON.stringify([yacURL, entityTypeName])}`;
  }

  private set(key: string, v: any) {
    sessionStorage.setItem(key, JSON.stringify(v));
  }

  private get(key: string): any | undefined {
    const v = sessionStorage.getItem(key);
    if (!v) return undefined;
    try {
      return JSON.parse(v);
    } catch {
      return undefined;
    }
  }
}

const iSessionStorage = new ISessionStorage();
export default iSessionStorage;

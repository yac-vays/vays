/* eslint-disable @typescript-eslint/no-explicit-any */
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

  public getEntityListFilters(
    yacURL: string | null | undefined,
    entityTypeName: string | null | undefined,
  ): (string | null)[] {
    if (!yacURL || !entityTypeName) return [];
    const saved = this.get(`entityListFilters.${yacURL}.${entityTypeName}`);
    return Array.isArray(saved) ? saved : [];
  }

  public setEntityListFilters(
    yacURL: string | null | undefined,
    entityTypeName: string | null | undefined,
    terms: (string | null)[],
  ): void {
    if (!yacURL || !entityTypeName) return;
    const key = `entityListFilters.${yacURL}.${entityTypeName}`;
    if (terms.every((t) => t == null || t === '')) {
      sessionStorage.removeItem(key);
    } else {
      this.set(key, terms);
    }
  }

  private set(key: string, v: any) {
    sessionStorage.setItem(key, JSON.stringify(v));
  }

  private get(key: string): any | undefined {
    const v = sessionStorage.getItem(key);
    if (!v) return undefined;
    return JSON.parse(v);
  }
}

const iSessionStorage = new ISessionStorage();
export default iSessionStorage;

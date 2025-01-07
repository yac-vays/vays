class ISessionStorage {
  public KEYS: readonly string[] = ['isLoggedIn', 'token', 'eMostRecentURL'];

  public setIsLoggedIn(v: boolean) {
    this.set('isLoggedIn', v);
  }

  public isLoggedIn(): boolean | undefined {
    return this.get('isLoggedIn');
  }

  public setToken(v: string) {
    this.set('token', v);
  }

  public getToken(): string | undefined {
    return this.get('token');
  }

  /**
   * ephemeral information: Will vanish after a single read access.
   */
  public setMostRecentURL(v: string) {
    console.log('Setting the most recently visited URL to ' + v);
    this.set('eMostRecentURL', v);
  }

  public getMostRecentURL(reset: boolean = false): string | undefined {
    const ret = this.get('eMostRecentURL');
    if (reset) sessionStorage.removeItem('eMostRecentURL');

    return ret;
  }

  public getIsExpertMode(): boolean {
    return this.get('isExpertMode') ?? false;
  }

  public setIsExpertMode(v: boolean) {
    this.set('isExpertMode', v);
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

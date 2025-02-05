class ILocalStorage {
  public KEYS: readonly string[] = ['isSidebarGroupExpanded.*', 'isLoggedIn', 'token'];

  public setIsSidebarGroupExpanded(backendName: string, v: boolean): void {
    this.set(`ìsSidebarGroupExpanded.${backendName}`, v);
  }

  public isSidebarGroupExpanded(backendName: string): boolean | undefined {
    return this.get(`ìsSidebarGroupExpanded.${backendName}`);
  }

  private set(key: string, v: any) {
    localStorage.setItem(key, JSON.stringify(v));
  }

  private get(key: string): any | undefined {
    const v = localStorage.getItem(key);
    if (!v) return undefined;
    return JSON.parse(v);
  }

  public setIsLoggedIn(v: boolean) {
    console.error('Setting is logged in to ' + v);
    this.set('isLoggedIn', v);
  }

  public isLoggedIn(): boolean | undefined {
    return this.get('isLoggedIn');
  }

  public setToken(v: string) {
    console.error('Setting the token');
    this.set('token', v);
  }

  public getToken(): string | undefined {
    return this.get('token');
  }
}

const iLocalStorage = new ILocalStorage();
export default iLocalStorage;

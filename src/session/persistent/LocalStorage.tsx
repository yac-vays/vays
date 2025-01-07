class ILocalStorage {
  public KEYS: readonly string[] = ['isSidebarGroupExpanded.*'];

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
}

const iLocalStorage = new ILocalStorage();
export default iLocalStorage;

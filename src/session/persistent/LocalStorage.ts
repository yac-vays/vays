/* eslint-disable @typescript-eslint/no-explicit-any */
import { EditorLayout } from '../../utils/types/config';

class ILocalStorage {
  public KEYS: readonly string[] = [
    'isSidebarGroupExpanded.*',
    'isLoggedIn',
    'token',
    'isOverviewDescriptionShown',
    'editorLayout',
    'editorSplitRatio',
    'numEntriesPerPage',
  ];

  /**
   * UI preferences we deliberately keep across logout/login: they describe how
   * the user likes the app to look, not who is logged in. Everything else in
   * local/session storage is session state and is wiped on logout (see
   * {@link clearSession}) so the app looks exactly as if never logged in.
   */
  private PERSISTENT_KEYS: readonly string[] = [
    'isOverviewDescriptionShown',
    'editorLayout',
    'editorSplitRatio',
    'numEntriesPerPage',
  ];

  /**
   * Wipe all local- and session-storage except the persistent UI preferences.
   * Called on logout so no entity data, token or navigation state lingers.
   */
  public clearSession(): void {
    for (const key of Object.keys(localStorage)) {
      if (!this.PERSISTENT_KEYS.includes(key)) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  }

  public setIsSidebarGroupExpanded(backendName: string, v: boolean): void {
    this.set(`isSidebarGroupExpanded.${backendName}`, v);
  }

  public isSidebarGroupExpanded(backendName: string): boolean | undefined {
    return this.get(`isSidebarGroupExpanded.${backendName}`);
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

  public setIsOverviewDescriptionShown(v: boolean) {
    this.set('isOverviewDescriptionShown', v);
  }

  public isOverviewDescriptionShown(): boolean {
    return this.get('isOverviewDescriptionShown') ?? true;
  }

  /** The user's chosen editor pane layout (once they change it from default). */
  public setEditorLayout(v: EditorLayout) {
    this.set('editorLayout', v);
  }

  /**
   * The persisted editor layout, or `fallback` (the config default) when the
   * user has not chosen one yet.
   */
  public getEditorLayout(fallback: EditorLayout = 'both'): EditorLayout {
    return this.get('editorLayout') ?? fallback;
  }

  /** The form's width fraction in the split (both-panes) layout. */
  public setEditorSplitRatio(v: number) {
    this.set('editorSplitRatio', v);
  }

  public getEditorSplitRatio(): number {
    return this.get('editorSplitRatio') ?? 0.5;
  }

  /** The number of entities shown per page in the overview table. */
  public setNumEntriesPerPage(v: number) {
    this.set('numEntriesPerPage', v);
  }

  public getNumEntriesPerPage(): number {
    return this.get('numEntriesPerPage') ?? 10;
  }
}

const iLocalStorage = new ILocalStorage();
export default iLocalStorage;

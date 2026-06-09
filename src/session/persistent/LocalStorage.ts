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
  ];

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
}

const iLocalStorage = new ILocalStorage();
export default iLocalStorage;

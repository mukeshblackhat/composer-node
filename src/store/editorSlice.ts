import type { SliceCreator } from './types';

/** Where the editor preview takes its inputs from: the wired canvas, or one CSV row. */
export type InputSource = 'graph' | number;

export type Panel = 'presets' | 'runs' | null;

export type EditorSlice = {
  editorOpen: boolean;
  selectedLayerId: string | null;
  inputSource: InputSource;
  panel: Panel;
  openEditor(): void;
  closeEditor(): void;
  selectLayer(id: string | null): void;
  setInputSource(source: InputSource): void;
  setPanel(panel: Panel): void;
};

export const createEditorSlice: SliceCreator<EditorSlice> = (set) => ({
  editorOpen: false,
  selectedLayerId: null,
  inputSource: 'graph',
  panel: null,
  openEditor: () => set({ editorOpen: true, panel: null }),
  closeEditor: () => set({ editorOpen: false, selectedLayerId: null }),
  selectLayer: (id) => set({ selectedLayerId: id }),
  setInputSource: (source) => set({ inputSource: source }),
  setPanel: (panel) => set({ panel }),
});

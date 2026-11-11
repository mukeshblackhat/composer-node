import type { StateCreator } from 'zustand';
import type { EditorSlice } from './editorSlice';
import type { GraphSlice } from './graphSlice';
import type { PresetSlice } from './presetSlice';
import type { RunSlice } from './runSlice';

export type StoreState = GraphSlice & PresetSlice & EditorSlice & RunSlice;

/** Each slice sees the whole store, so cross-slice actions stay in one place. */
export type SliceCreator<T> = StateCreator<StoreState, [['zustand/persist', unknown]], [], T>;

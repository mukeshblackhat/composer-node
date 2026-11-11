import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { validatePreset, type Preset } from '../engine';
import { createEditorSlice } from './editorSlice';
import { createGraphSlice } from './graphSlice';
import { pruneEdges } from './graphOps';
import type { AppEdge, AppNode } from './graphTypes';
import { createPresetSlice } from './presetSlice';
import { createRunSlice } from './runSlice';
import type { StoreState } from './types';

export type { StoreState } from './types';

/** What is kept between visits. Everything else starts fresh. */
type Saved = { nodes: AppNode[]; edges: AppEdge[]; preset: Preset; savedPresets: Preset[] };

/**
 * Load saved state, but never trust it: a preset that fails the check is
 * dropped and the default is used instead.
 */
function mergeSaved(saved: unknown, current: StoreState): StoreState {
  const s = (saved ?? {}) as Partial<Saved>;
  const valid = (p: unknown): Preset | null => {
    try {
      return validatePreset(p);
    } catch {
      return null;
    }
  };

  const preset = valid(s.preset) ?? current.preset;
  const savedPresets = Array.isArray(s.savedPresets)
    ? s.savedPresets.map(valid).filter((p): p is Preset => p !== null)
    : current.savedPresets;
  const graphOk = Array.isArray(s.nodes) && Array.isArray(s.edges) && s.nodes.some((n) => n.type === 'composer');
  const nodes = graphOk ? s.nodes! : current.nodes;
  const edges = graphOk ? pruneEdges(s.edges!, nodes, preset) : current.edges;

  return { ...current, preset, savedPresets, nodes, edges };
}

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createGraphSlice(...a),
      ...createPresetSlice(...a),
      ...createEditorSlice(...a),
      ...createRunSlice(...a),
    }),
    {
      name: 'composer-node',
      version: 1,
      partialize: (s): Saved => ({ nodes: s.nodes, edges: s.edges, preset: s.preset, savedPresets: s.savedPresets }),
      merge: mergeSaved,
    },
  ),
);

/** Clear saved state and go back to the starting graph and presets. */
export function resetApp() {
  useStore.persist.clearStorage();
  window.location.reload();
}

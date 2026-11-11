import { PresetError, validatePreset, type Frame, type Layer, type Preset, type SlotType } from '../engine';
import { seedPresets } from '../presets';
import { pruneEdges, renameHandle } from './graphOps';
import * as ops from './presetOps';
import type { SliceCreator } from './types';

const HISTORY_LIMIT = 100;

export type PresetSlice = {
  /** The preset on the canvas and in the editor. */
  preset: Preset;
  savedPresets: Preset[];

  // Undo history covers the preset only, not the node graph.
  past: Preset[];
  future: Preset[];
  /** Edits with the same tag in a row become one undo step, such as one drag. */
  lastTag: string | null;

  /** Every preset change goes through here. */
  editPreset(recipe: (preset: Preset) => Preset, tag?: string): void;
  undo(): void;
  redo(): void;

  updateLayer(id: string, patch: Partial<Layer>, tag?: string): void;
  setFrame(id: string, frame: Frame, tag?: string): void;
  moveLayer(id: string, delta: number): void;
  /** Adds a slot and its layer. Returns the new layer's id. */
  addLayer(type: SlotType): string;
  removeLayer(id: string): void;
  /** Returns an error message, or null when the rename worked. */
  renameSlot(from: string, to: string): string | null;
  setSlotLabel(key: string, label: string): void;
  setPresetName(name: string): void;
  /** Layers do not move or scale with the artboard. */
  setArtboardSize(width: number, height: number): void;

  /** Save over the saved preset with the same id, or add it. */
  savePreset(): void;
  saveAsNew(name: string): void;
  applyPreset(id: string): void;
  /** Returns an error message, or null when the import worked. */
  importPreset(value: unknown): string | null;
  deleteSavedPreset(id: string): void;
};

export const createPresetSlice: SliceCreator<PresetSlice> = (set, get) => {
  /**
   * Swap in a new preset. Pushes the old one onto the undo stack unless this
   * edit continues the last one, and unplugs wires into slots that are gone.
   */
  const commit = (next: Preset, tag?: string, edges = get().edges) => {
    const { preset, past, lastTag, nodes } = get();
    if (next === preset && edges === get().edges) return;
    const merge = tag !== undefined && tag === lastTag;
    set({
      preset: next,
      past: merge ? past : [...past, preset].slice(-HISTORY_LIMIT),
      future: [],
      lastTag: tag ?? null,
      edges: next.slots === preset.slots ? edges : pruneEdges(edges, nodes, next),
    });
  };

  return {
    preset: structuredClone(seedPresets[0]),
    savedPresets: structuredClone(seedPresets),
    past: [],
    future: [],
    lastTag: null,

    editPreset: (recipe, tag) => commit(recipe(get().preset), tag),

    undo: () => {
      const { past, preset, future, edges, nodes } = get();
      const previous = past.at(-1);
      if (!previous) return;
      set({
        preset: previous,
        past: past.slice(0, -1),
        future: [preset, ...future],
        lastTag: null,
        edges: pruneEdges(edges, nodes, previous),
      });
    },

    redo: () => {
      const { past, preset, future, edges, nodes } = get();
      const next = future[0];
      if (!next) return;
      set({
        preset: next,
        past: [...past, preset],
        future: future.slice(1),
        lastTag: null,
        edges: pruneEdges(edges, nodes, next),
      });
    },

    updateLayer: (id, patch, tag) => commit(ops.updateLayer(get().preset, id, patch), tag),
    setFrame: (id, frame, tag) => commit(ops.setFrame(get().preset, id, frame), tag),
    moveLayer: (id, delta) => commit(ops.moveLayer(get().preset, id, delta)),

    addLayer: (type) => {
      const { preset, layerId } = ops.addLayer(get().preset, type);
      commit(preset);
      return layerId;
    },

    removeLayer: (id) => commit(ops.removeLayer(get().preset, id)),

    renameSlot: (from, to) => {
      try {
        const next = ops.renameSlot(get().preset, from, to);
        commit(next, undefined, renameHandle(get().edges, from, to));
        return null;
      } catch (e) {
        if (e instanceof PresetError) return e.message;
        throw e;
      }
    },

    setSlotLabel: (key, label) => commit(ops.setSlotLabel(get().preset, key, label), `slot-label:${key}`),
    setPresetName: (name) => commit({ ...get().preset, name }, 'preset-name'),
    setArtboardSize: (width, height) => commit(ops.setArtboardSize(get().preset, width, height)),

    savePreset: () => {
      const { preset, savedPresets } = get();
      const exists = savedPresets.some((p) => p.id === preset.id);
      set({
        savedPresets: exists ? savedPresets.map((p) => (p.id === preset.id ? preset : p)) : [...savedPresets, preset],
      });
    },

    saveAsNew: (name) => {
      const { preset, savedPresets } = get();
      const id = ops.uniqueKey(savedPresets.map((p) => p.id), ops.slugify(name));
      const copy: Preset = { ...preset, id, name };
      // The working copy becomes the new preset, so later saves go to it.
      set({ preset: copy, savedPresets: [...savedPresets, copy], lastTag: null });
    },

    applyPreset: (id) => {
      const saved = get().savedPresets.find((p) => p.id === id);
      if (saved) commit(structuredClone(saved));
    },

    importPreset: (value) => {
      try {
        const imported = validatePreset(value);
        const { savedPresets } = get();
        const taken = savedPresets.some((p) => p.id === imported.id);
        const preset = taken ? { ...imported, id: ops.uniqueKey(savedPresets.map((p) => p.id), imported.id) } : imported;
        set({ savedPresets: [...savedPresets, preset] });
        commit(structuredClone(preset));
        return null;
      } catch (e) {
        if (e instanceof PresetError) return e.message;
        return 'That file is not valid JSON.';
      }
    },

    deleteSavedPreset: (id) => set({ savedPresets: get().savedPresets.filter((p) => p.id !== id) }),
  };
};

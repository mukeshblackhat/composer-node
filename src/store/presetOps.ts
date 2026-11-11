// Pure functions that return a changed copy of a preset. Every edit the
// editor makes goes through one of these.

import { layerTypes, PresetError, type Frame, type Layer, type Preset, type SlotType } from '../engine';

export function updateLayer(preset: Preset, id: string, patch: Partial<Layer>): Preset {
  return {
    ...preset,
    layers: preset.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
  };
}

/** Frames are whole pixels and at least 1 px on each side. */
export function roundFrame(f: Frame): Frame {
  return {
    x: Math.round(f.x),
    y: Math.round(f.y),
    w: Math.max(1, Math.round(f.w)),
    h: Math.max(1, Math.round(f.h)),
  };
}

export function setFrame(preset: Preset, id: string, frame: Frame): Preset {
  return updateLayer(preset, id, { frame: roundFrame(frame) });
}

/**
 * Move a layer in the stack. +1 brings it one step forward (drawn later),
 * -1 sends it one step back. Moving past either end does nothing.
 */
export function moveLayer(preset: Preset, id: string, delta: number): Preset {
  const from = preset.layers.findIndex((l) => l.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= preset.layers.length) return preset;
  const layers = [...preset.layers];
  const [layer] = layers.splice(from, 1);
  layers.splice(to, 0, layer);
  return { ...preset, layers };
}

/** `base`, or `base_2`, `base_3` and so on, whichever is free first. */
export function uniqueKey(taken: Iterable<string>, base: string): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

/**
 * Add a slot and a layer that draws it, on top of the stack. The new layer
 * gets its type's default style and sits in the middle of the artboard.
 */
export function addLayer(preset: Preset, type: SlotType): { preset: Preset; layerId: string } {
  const key = uniqueKey(preset.slots.map((s) => s.key), type);
  const count = preset.slots.filter((s) => s.type === type).length + 1;
  const label = `${type === 'image' ? 'Image' : 'Text'} ${count}`;
  const layerId = uniqueKey(preset.layers.map((l) => l.id), `layer-${key}`);

  const { width, height } = preset.artboard;
  const w = Math.round(width * (type === 'image' ? 0.4 : 0.6));
  const h = Math.round(type === 'image' ? height * 0.4 : height * 0.1);
  const frame = { x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), w, h };

  const layerType = layerTypes.find((t) => t.type === type)!;
  const layer = layerType.defaults({ id: layerId, slot: key, frame });

  return {
    preset: {
      ...preset,
      slots: [...preset.slots, { key, label, type, placeholder: type === 'text' ? label : undefined }],
      layers: [...preset.layers, layer],
    },
    layerId,
  };
}

/** Remove a layer. Its slot goes too, unless another layer still draws it. */
export function removeLayer(preset: Preset, id: string): Preset {
  const layer = preset.layers.find((l) => l.id === id);
  if (!layer) return preset;
  const layers = preset.layers.filter((l) => l.id !== id);
  const slotStillUsed = layers.some((l) => l.slot === layer.slot);
  return {
    ...preset,
    layers,
    slots: slotStillUsed ? preset.slots : preset.slots.filter((s) => s.key !== layer.slot),
  };
}

/**
 * Change a slot's key. The key is also the CSV column name, so it has to be
 * unique and simple. Throws a PresetError with a reason if it is not.
 */
export function renameSlot(preset: Preset, from: string, to: string): Preset {
  if (from === to) return preset;
  if (!/^[A-Za-z0-9_-]+$/.test(to)) throw new PresetError('Use letters, numbers, _ or - only.');
  if (preset.slots.some((s) => s.key === to)) throw new PresetError(`A slot called "${to}" already exists.`);
  return {
    ...preset,
    slots: preset.slots.map((s) => (s.key === from ? { ...s, key: to } : s)),
    layers: preset.layers.map((l) => (l.slot === from ? { ...l, slot: to } : l)),
  };
}

export function setSlotLabel(preset: Preset, key: string, label: string): Preset {
  return { ...preset, slots: preset.slots.map((s) => (s.key === key ? { ...s, label } : s)) };
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'preset'
  );
}

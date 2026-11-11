import { describe, expect, it } from 'vitest';
import { PresetError, validatePreset, type Preset } from '../../src/engine';
import { seedPresets } from '../../src/presets';
import { addLayer, moveLayer, removeLayer, renameSlot, setArtboardSize, setFrame, uniqueKey } from '../../src/store/presetOps';

const hero = (): Preset => structuredClone(seedPresets[0]);
const ids = (p: Preset) => p.layers.map((l) => l.id);

describe('validatePreset', () => {
  it('accepts every seed preset', () => {
    for (const p of seedPresets) expect(() => validatePreset(structuredClone(p))).not.toThrow();
  });

  it('says what is wrong with a bad preset', () => {
    const bad = hero();
    bad.layers[0].frame.w = 10.5;
    expect(() => validatePreset(bad)).toThrow(/layers\[0\]\.frame needs whole-pixel/);

    const orphan = hero();
    orphan.layers[1].slot = 'nope';
    expect(() => validatePreset(orphan)).toThrow(/must name a slot/);

    const mismatch = hero();
    mismatch.slots[0].type = 'text';
    expect(() => validatePreset(mismatch)).toThrow(PresetError);

    expect(() => validatePreset({ version: 2 })).toThrow(/version 1/);
  });
});

describe('preset operations', () => {
  it('never change the preset they are given', () => {
    const p = hero();
    const before = JSON.stringify(p);
    moveLayer(p, 'layer-title', -1);
    setFrame(p, 'layer-title', { x: 1, y: 2, w: 3, h: 4 });
    addLayer(p, 'text');
    removeLayer(p, 'layer-title');
    renameSlot(p, 'title', 'headline');
    setArtboardSize(p, 1080, 1350);
    expect(JSON.stringify(p)).toBe(before);
  });

  it('reorders layers and stops at either end', () => {
    const p = hero();
    expect(ids(moveLayer(p, 'layer-product', 1))).toEqual(['layer-backdrop', 'layer-title', 'layer-product', 'layer-tagline']);
    expect(ids(moveLayer(p, 'layer-product', -1))).toEqual(['layer-product', 'layer-backdrop', 'layer-title', 'layer-tagline']);
    expect(moveLayer(p, 'layer-tagline', 1)).toBe(p);
    expect(moveLayer(p, 'layer-backdrop', -1)).toBe(p);
  });

it('resizes the artboard and leaves the layers where they are', () => {
    const p = hero();
    const next = setArtboardSize(p, 1080, 1350);
    expect(next.artboard).toEqual({ ...p.artboard, width: 1080, height: 1350 });
    expect(next.layers).toBe(p.layers);
    expect(() => validatePreset(structuredClone(next))).not.toThrow();
    expect(setArtboardSize(p, p.artboard.width, p.artboard.height)).toBe(p);
    expect(setArtboardSize(p, 1200.4, 0).artboard).toMatchObject({ width: 1200, height: 1 });
  });

    it('rounds frames to whole pixels', () => {
    const next = setFrame(hero(), 'layer-title', { x: 10.4, y: 10.6, w: 0.2, h: 99.5 });
    expect(next.layers[2].frame).toEqual({ x: 10, y: 11, w: 1, h: 100 });
  });

  it('adds a slot and a layer on top, with a free key', () => {
    const once = addLayer(hero(), 'text');
    const twice = addLayer(once.preset, 'text');
    expect(once.preset.slots.at(-1)).toMatchObject({ key: 'text', type: 'text' });
    expect(twice.preset.slots.at(-1)?.key).toBe('text_2');
    expect(twice.preset.layers.at(-1)?.id).toBe(twice.layerId);
    expect(() => validatePreset(twice.preset)).not.toThrow();
  });

  it('removes the slot with its last layer', () => {
    const next = removeLayer(hero(), 'layer-tagline');
    expect(next.slots.map((s) => s.key)).toEqual(['backdrop', 'product', 'title']);
    expect(() => validatePreset(next)).not.toThrow();
  });

  it('renames a slot and the layers that draw it', () => {
    const next = renameSlot(hero(), 'title', 'headline');
    expect(next.slots[2].key).toBe('headline');
    expect(next.layers[2].slot).toBe('headline');
    expect(() => renameSlot(hero(), 'title', 'tagline')).toThrow(/already exists/);
    expect(() => renameSlot(hero(), 'title', 'two words')).toThrow(PresetError);
  });

  it('finds a free key', () => {
    expect(uniqueKey(['a'], 'b')).toBe('b');
    expect(uniqueKey(['a', 'a_2'], 'a')).toBe('a_3');
  });
});

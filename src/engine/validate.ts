import type { Layer, Preset, Slot } from './types';

// Presets come from localStorage and from files people import, so they are
// checked before the engine ever sees them. A bad preset fails here with a
// message that says what is wrong, not later as a blank or broken render.

export class PresetError extends Error {}

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

function need(ok: boolean, message: string): asserts ok {
  if (!ok) throw new PresetError(message);
}

function oneOf<T extends string>(v: unknown, options: readonly T[]): v is T {
  return isStr(v) && (options as readonly string[]).includes(v);
}

function checkSlot(s: unknown, i: number): asserts s is Slot {
  need(isObject(s), `slots[${i}] must be an object.`);
  need(isStr(s.key) && /^[A-Za-z0-9_-]+$/.test(s.key), `slots[${i}].key must use letters, numbers, _ or -.`);
  need(isStr(s.label), `slots[${i}].label must be text.`);
  need(oneOf(s.type, ['image', 'text'] as const), `slots[${i}].type must be "image" or "text".`);
}

function checkLayer(l: unknown, i: number, slots: Map<string, Slot>): asserts l is Layer {
  const at = `layers[${i}]`;
  need(isObject(l), `${at} must be an object.`);
  need(isStr(l.id) && l.id.length > 0, `${at}.id must be text.`);
  need(isStr(l.slot) && slots.has(l.slot), `${at}.slot must name a slot in this preset.`);
  need(typeof l.visible === 'boolean', `${at}.visible must be true or false.`);

  const f = l.frame;
  need(isObject(f) && isInt(f.x) && isInt(f.y) && isInt(f.w) && isInt(f.h), `${at}.frame needs whole-pixel x, y, w and h.`);
  need((f.w as number) > 0 && (f.h as number) > 0, `${at}.frame must have a width and height above 0.`);

  const slotType = slots.get(l.slot)!.type;
  need(l.type === slotType, `${at} is type "${String(l.type)}" but its slot "${l.slot}" is "${slotType}".`);

  if (l.type === 'image') {
    need(isNum(l.opacity) && l.opacity >= 0 && l.opacity <= 1, `${at}.opacity must be between 0 and 1.`);
    need(oneOf(l.blend, ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'] as const), `${at}.blend is not a known blend mode.`);
    need(oneOf(l.fit, ['contain', 'cover'] as const), `${at}.fit must be "contain" or "cover".`);
    const a = l.anchor;
    need(isObject(a) && isNum(a.x) && isNum(a.y), `${at}.anchor needs x and y.`);
    return;
  }

  need(isStr(l.family) && l.family.length > 0, `${at}.family must be text.`);
  need(isInt(l.weight), `${at}.weight must be a whole number.`);
  need(isInt(l.size) && l.size > 0, `${at}.size must be a whole number above 0.`);
  need(isStr(l.color), `${at}.color must be text.`);
  need(oneOf(l.align, ['left', 'center', 'right'] as const), `${at}.align must be left, center or right.`);
  need(oneOf(l.valign, ['top', 'middle', 'bottom'] as const), `${at}.valign must be top, middle or bottom.`);
  need(isNum(l.lineHeight) && l.lineHeight > 0, `${at}.lineHeight must be above 0.`);
  need(isNum(l.letterSpacing), `${at}.letterSpacing must be a number.`);
  const o = l.overflow;
  need(isObject(o) && isInt(o.minSize) && isInt(o.maxLines), `${at}.overflow needs whole-number minSize and maxLines.`);
  need((o.minSize as number) > 0 && (o.maxLines as number) > 0, `${at}.overflow values must be above 0.`);
}

/** Throws a PresetError that says what is wrong, or returns the preset. */
export function validatePreset(value: unknown): Preset {
  need(isObject(value), 'A preset must be a JSON object.');
  need(value.version === 1, 'Only preset version 1 is supported.');
  need(isStr(value.id) && value.id.length > 0, 'The preset needs an id.');
  need(isStr(value.name), 'The preset needs a name.');

  const a = value.artboard;
  need(isObject(a) && isInt(a.width) && isInt(a.height), 'artboard needs a whole-pixel width and height.');
  need((a.width as number) > 0 && (a.width as number) <= 4096 && (a.height as number) > 0 && (a.height as number) <= 4096, 'artboard must be between 1 and 4096 pixels on each side.');
  need(isStr(a.background), 'artboard.background must be a colour.');

  need(Array.isArray(value.slots), 'slots must be a list.');
  value.slots.forEach(checkSlot);
  const slots = new Map((value.slots as Slot[]).map((s) => [s.key, s]));
  need(slots.size === value.slots.length, 'Two slots have the same key.');

  need(Array.isArray(value.layers), 'layers must be a list.');
  value.layers.forEach((l, i) => checkLayer(l, i, slots));
  const ids = new Set((value.layers as Layer[]).map((l) => l.id));
  need(ids.size === value.layers.length, 'Two layers have the same id.');

  return value as Preset;
}

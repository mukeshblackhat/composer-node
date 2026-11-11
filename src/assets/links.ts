import type { InputSet, Preset } from '../engine';

/** An image input is a bundled asset id or an http(s) link. */
export function isImageLink(value: string | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

/** The values wired into a preset's image slots. */
export function imageValues(preset: Preset, inputs: InputSet): string[] {
  return preset.slots.flatMap((slot) => (slot.type === 'image' && inputs[slot.key] ? [inputs[slot.key]] : []));
}

/** The different links among a preset's image inputs, in slot order. */
export function imageLinks(preset: Preset, inputs: InputSet): string[] {
  return [...new Set(imageValues(preset, inputs).filter(isImageLink))];
}

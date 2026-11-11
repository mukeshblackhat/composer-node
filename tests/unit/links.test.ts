import { describe, expect, it } from 'vitest';
import { imageLinks, imageValues, isImageLink } from '../../src/assets/links';
import { seedPresets } from '../../src/presets';

const preset = seedPresets[0];

describe('image links', () => {
  it('tells a link from an asset id', () => {
    expect(isImageLink('https://example.com/a.png')).toBe(true);
    expect(isImageLink('HTTP://example.com/a.png')).toBe(true);
    expect(isImageLink('backdrop-warm')).toBe(false);
    expect(isImageLink('ftp://example.com/a.png')).toBe(false);
    expect(isImageLink('')).toBe(false);
    expect(isImageLink(undefined)).toBe(false);
  });

  it('reads only the image slots of an input set', () => {
    const inputs = { backdrop: 'backdrop-warm', product: 'https://example.com/p.png', title: 'https://not-an-image.example' };
    expect(imageValues(preset, inputs)).toEqual(['backdrop-warm', 'https://example.com/p.png']);
    expect(imageLinks(preset, inputs)).toEqual(['https://example.com/p.png']);
  });

  it('lists a link used in two slots once, and skips empty slots', () => {
    const link = 'https://example.com/same.png';
    expect(imageLinks(preset, { backdrop: link, product: link })).toEqual([link]);
    expect(imageLinks(preset, { title: 'Only text' })).toEqual([]);
  });
});

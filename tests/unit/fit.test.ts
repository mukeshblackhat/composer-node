import { describe, expect, it } from 'vitest';
import { fitImage } from '../../src/engine/fit';

const wideSlot = { x: 100, y: 50, w: 800, h: 400 };

describe('fitImage contain', () => {
  it('fits a tall image inside a wide slot without stretching', () => {
    const p = fitImage({ width: 300, height: 800 }, wideSlot, 'contain', { x: 0.5, y: 0.5 });
    expect(p.dh).toBe(400);
    expect(p.dw).toBe(150);
    // Same ratio as the source.
    expect(p.dw / p.dh).toBeCloseTo(300 / 800);
    // Centred, and the whole source is used.
    expect(p.dx).toBe(100 + (800 - 150) / 2);
    expect(p.dy).toBe(50);
    expect([p.sx, p.sy, p.sw, p.sh]).toEqual([0, 0, 300, 800]);
  });

  it('uses the anchor to place the spare room', () => {
    const src = { width: 800, height: 200 };
    const slot = { x: 0, y: 0, w: 400, h: 400 };
    expect(fitImage(src, slot, 'contain', { x: 0.5, y: 0 }).dy).toBe(0);
    expect(fitImage(src, slot, 'contain', { x: 0.5, y: 1 }).dy).toBe(300);
  });

  it('never draws outside the frame', () => {
    const p = fitImage({ width: 1234, height: 777 }, wideSlot, 'contain', { x: 1, y: 1 });
    expect(p.dx).toBeGreaterThanOrEqual(wideSlot.x);
    expect(p.dy).toBeGreaterThanOrEqual(wideSlot.y);
    expect(p.dx + p.dw).toBeLessThanOrEqual(wideSlot.x + wideSlot.w);
    expect(p.dy + p.dh).toBeLessThanOrEqual(wideSlot.y + wideSlot.h);
  });
});

describe('fitImage cover', () => {
  const square = { x: 0, y: 0, w: 1080, h: 1080 };

  it('fills the frame and crops the sides of a wide image', () => {
    const p = fitImage({ width: 1600, height: 900 }, square, 'cover', { x: 0.5, y: 0.5 });
    expect([p.dx, p.dy, p.dw, p.dh]).toEqual([0, 0, 1080, 1080]);
    expect(p.sh).toBe(900);
    expect(p.sw).toBe(900);
    expect(p.sx).toBe(350);
    expect(p.sy).toBe(0);
  });

  it('crops from the side the anchor points away from', () => {
    const src = { width: 1600, height: 900 };
    expect(fitImage(src, square, 'cover', { x: 0, y: 0.5 }).sx).toBe(0);
    expect(fitImage(src, square, 'cover', { x: 1, y: 0.5 }).sx).toBe(700);
  });
});

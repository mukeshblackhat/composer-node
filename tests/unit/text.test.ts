import { describe, expect, it } from 'vitest';
import { layoutPreset } from '../../src/engine/render';
import { ellipsize, fitText, wrapLines } from '../../src/engine/text';
import type { Preset, RenderEnv, TextLayer } from '../../src/engine/types';

// A fake font where every character is half the font size wide.
const measureAt = (text: string, size: number) => text.length * size * 0.5;
const at10 = (text: string) => measureAt(text, 10);

describe('wrapLines', () => {
  it('breaks between words when a line is full', () => {
    // 5 px per character, 50 px wide: 10 characters per line.
    expect(wrapLines('aaaa bbbb cccc', 50, at10)).toEqual(['aaaa bbbb', 'cccc']);
  });

  it('keeps a word that is too wide whole, on its own line', () => {
    expect(wrapLines('hi extraordinarily ok', 50, at10)).toEqual(['hi', 'extraordinarily', 'ok']);
  });

  it('starts a new line at a line break', () => {
    expect(wrapLines('one\ntwo', 500, at10)).toEqual(['one', 'two']);
  });
});

describe('ellipsize', () => {
  it('cuts until the text and the ellipsis fit', () => {
    const out = ellipsize('abcdefghijklmnop', 50, at10);
    expect(out).toBe('abcdefghi…');
    expect(at10(out)).toBeLessThanOrEqual(50);
  });
});

describe('fitText', () => {
  const options = { size: 40, minSize: 20, maxLines: 2, lineHeight: 1.2 };
  const box = { w: 400, h: 100 };

  it('leaves text that fits alone', () => {
    const out = fitText('Slow mornings', box, options, measureAt);
    expect(out).toMatchObject({ size: 40, lines: ['Slow mornings'], shrunk: false, truncated: false });
    expect(out.linePx).toBe(48);
  });

  it('shrinks text that is 3 times too long before it cuts anything', () => {
    const long = 'Slow mornings start with one small and very calm ritual';
    const out = fitText(long, box, options, measureAt);
    expect(out.shrunk).toBe(true);
    expect(out.truncated).toBe(false);
    expect(out.size).toBeLessThan(40);
    expect(out.size).toBeGreaterThanOrEqual(20);
    expect(out.lines.join(' ')).toBe(long);
    expect(out.lines.length * out.linePx).toBeLessThanOrEqual(box.h);
    // One pixel larger would not have fitted.
    const bigger = wrapLines(long, box.w, (t) => measureAt(t, out.size + 1));
    expect(bigger.length > 2 || bigger.length * Math.round((out.size + 1) * 1.2) > box.h).toBe(true);
  });

  it('cuts with an ellipsis when the smallest size is still too big', () => {
    const huge = Array.from({ length: 40 }, () => 'word').join(' ');
    const out = fitText(huge, box, options, measureAt);
    expect(out).toMatchObject({ size: 20, shrunk: true, truncated: true });
    expect(out.lines).toHaveLength(2);
    expect(out.lines[1].endsWith('…')).toBe(true);
    for (const line of out.lines) expect(measureAt(line, 20)).toBeLessThanOrEqual(box.w);
  });

  it('cuts one word that is wider than the box at the smallest size', () => {
    const out = fitText('a'.repeat(100), box, options, measureAt);
    expect(out.truncated).toBe(true);
    expect(out.lines).toHaveLength(1);
    expect(measureAt(out.lines[0], 20)).toBeLessThanOrEqual(box.w);
  });

  it('gives the same answer every time', () => {
    const text = 'Hands that work hard all day and still deserve a little kindness';
    expect(fitText(text, box, options, measureAt)).toEqual(fitText(text, box, options, measureAt));
  });
});

describe('text layer layout', () => {
  const env: RenderEnv = {
    measure: (text, style) => measureAt(text, style.size),
    metrics: (style) => ({ ascent: style.size * 0.8, descent: style.size * 0.2 }),
    image: () => undefined,
  };

  const title: TextLayer = {
    id: 't',
    type: 'text',
    slot: 'title',
    frame: { x: 100, y: 100, w: 400, h: 100 },
    visible: true,
    family: 'Test',
    weight: 400,
    size: 40,
    color: '#000',
    align: 'center',
    valign: 'middle',
    lineHeight: 1,
    letterSpacing: 0,
    overflow: { minSize: 20, maxLines: 2 },
  };

  const preset = (layer: TextLayer): Preset => ({
    version: 1,
    id: 'p',
    name: 'p',
    artboard: { width: 600, height: 300, background: '#fff' },
    slots: [{ key: 'title', label: 'Title', type: 'text' }],
    layers: [layer],
  });

  it('centres a line and puts the baseline on a whole pixel', () => {
    const { items, warnings } = layoutPreset(preset(title), { title: 'abcd' }, env);
    expect(warnings).toEqual([]);
    // 4 characters at 20 px each = 80 wide, centred in 400: starts at 100 + 160.
    // One 40 px line centred in 100: top at 130, baseline 32 lower.
    expect(items[0].resolved).toMatchObject({ lines: [{ text: 'abcd', x: 260, baseline: 162 }] });
    expect(items[0].contentBox).toEqual({ x: 260, y: 130, w: 80, h: 40 });
  });

  it('aligns right', () => {
    const { items } = layoutPreset(preset({ ...title, align: 'right' }), { title: 'abcd' }, env);
    expect(items[0].resolved).toMatchObject({ lines: [{ x: 420 }] });
  });

  it('warns and draws nothing when the input is missing', () => {
    const { items, warnings } = layoutPreset(preset(title), {}, env);
    expect(items[0].resolved).toBeNull();
    expect(warnings).toEqual([{ layerId: 't', slot: 'title', code: 'missing-input' }]);
  });

  it('skips hidden layers', () => {
    const { items } = layoutPreset(preset({ ...title, visible: false }), { title: 'abcd' }, env);
    expect(items).toEqual([]);
  });
});

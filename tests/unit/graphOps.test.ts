import { describe, expect, it } from 'vitest';
import type { Preset } from '../../src/engine';
import { seedPresets } from '../../src/presets';
import { applyValues, canConnect, connect, pruneEdges, renameHandle, resolveInputs } from '../../src/store/graphOps';
import { COMPOSER_ID, OUTPUT_ID } from '../../src/store/graphTypes';
import { initialGraph } from '../../src/store/initialGraph';
import { removeLayer } from '../../src/store/presetOps';

const hero = (): Preset => structuredClone(seedPresets[0]);
const wire = (source: string, targetHandle: string) => ({ source, target: COMPOSER_ID, sourceHandle: 'out', targetHandle });

describe('resolveInputs', () => {
  it('collects one value per wired slot', () => {
    const { nodes, edges } = initialGraph();
    expect(resolveInputs(nodes, edges)).toEqual({
      backdrop: 'backdrop-warm',
      product: 'product-bottle',
      title: 'Slow mornings',
      tagline: 'Daily oat cleanser',
    });
  });

  it('leaves out slots with no wire', () => {
    const { nodes, edges } = initialGraph();
    const inputs = resolveInputs(nodes, edges.filter((e) => e.targetHandle !== 'title'));
    expect(inputs).not.toHaveProperty('title');
  });
});

describe('wiring rules', () => {
  const { nodes } = initialGraph();

  it('plugs image into image and text into text only', () => {
    expect(canConnect(wire('in-product', 'backdrop'), nodes, hero())).toBe(true);
    expect(canConnect(wire('in-title', 'tagline'), nodes, hero())).toBe(true);
    expect(canConnect(wire('in-title', 'product'), nodes, hero())).toBe(false);
    expect(canConnect(wire('in-product', 'missing'), nodes, hero())).toBe(false);
    expect(canConnect({ source: COMPOSER_ID, target: OUTPUT_ID, sourceHandle: 'out', targetHandle: 'in' }, nodes, hero())).toBe(true);
  });

  it('replaces the old wire when a slot gets a new one', () => {
    const { edges } = initialGraph();
    const next = connect(edges, wire('in-tagline', 'title'), nodes);
    const intoTitle = next.filter((e) => e.targetHandle === 'title');
    expect(intoTitle).toHaveLength(1);
    expect(intoTitle[0].source).toBe('in-tagline');
    expect(resolveInputs(nodes, next).title).toBe('Daily oat cleanser');
  });

  it('unplugs wires into a slot that was removed', () => {
    const { edges } = initialGraph();
    const next = pruneEdges(edges, nodes, removeLayer(hero(), 'layer-tagline'));
    expect(next.map((e) => e.targetHandle)).toEqual(['backdrop', 'product', 'title', 'in']);
  });

  it('keeps a wire plugged in when its slot is renamed', () => {
    const { edges } = initialGraph();
    const next = renameHandle(edges, 'title', 'headline');
    expect(resolveInputs(nodes, next)).toMatchObject({ headline: 'Slow mornings' });
  });

  it('writes a CSV row into the wired input nodes', () => {
    const { edges } = initialGraph();
    const row = { backdrop: 'backdrop-cool', product: 'product-jar', title: 'Night shift', tagline: 'Repair cream' };
    expect(resolveInputs(applyValues(nodes, edges, row), edges)).toEqual(row);
  });
});

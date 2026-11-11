// Pure functions over the node graph. The store calls these; tests call them
// directly.

import type { Connection } from '@xyflow/react';
import type { InputSet, Preset, SlotType } from '../engine';
import { COMPOSER_ID, OUTPUT_ID, type AppEdge, type AppNode } from './graphTypes';

const WIRE_COLOURS = { image: '#3b82f6', text: '#f97316', output: '#3b82f6' } as const;

export function makeEdge(source: string, target: string, targetHandle: string | null, kind: 'image' | 'text' | 'output'): AppEdge {
  return {
    id: `e-${source}-${target}-${targetHandle ?? 'in'}`,
    source,
    target,
    sourceHandle: 'out',
    targetHandle: targetHandle ?? 'in',
    data: { kind },
    style: { stroke: WIRE_COLOURS[kind], strokeWidth: 2 },
  };
}

/** The kind of value an input node gives, or null for non-input nodes. */
export function outputTypeOf(node: AppNode | undefined): SlotType | null {
  if (node?.type === 'imageInput') return 'image';
  if (node?.type === 'textInput') return 'text';
  return null;
}

/**
 * Walk the wires into the Composer node and collect one value per slot.
 * This is the only place the graph turns into engine inputs.
 */
export function resolveInputs(nodes: AppNode[], edges: AppEdge[]): InputSet {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const inputs: InputSet = {};
  for (const edge of edges) {
    if (edge.target !== COMPOSER_ID || !edge.targetHandle) continue;
    const source = byId.get(edge.source);
    if (source?.type === 'imageInput') inputs[edge.targetHandle] = source.data.assetId;
    else if (source?.type === 'textInput') inputs[edge.targetHandle] = source.data.text;
  }
  return inputs;
}

/** Image inputs only plug into image slots, text into text, and the Composer into the Output. */
export function canConnect(connection: Connection, nodes: AppNode[], preset: Preset): boolean {
  if (connection.source === COMPOSER_ID) return connection.target === OUTPUT_ID;
  if (connection.target !== COMPOSER_ID) return false;
  const slot = preset.slots.find((s) => s.key === connection.targetHandle);
  const sourceType = outputTypeOf(nodes.find((n) => n.id === connection.source));
  return !!slot && slot.type === sourceType;
}

/** Add a wire. A slot takes one input, so any old wire into the same slot is replaced. */
export function connect(edges: AppEdge[], connection: Connection, nodes: AppNode[]): AppEdge[] {
  const kind = connection.source === COMPOSER_ID ? 'output' : outputTypeOf(nodes.find((n) => n.id === connection.source));
  if (!kind) return edges;
  const kept = edges.filter((e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle));
  return [...kept, makeEdge(connection.source, connection.target, connection.targetHandle, kind)];
}

/** Drop wires into slots that no longer exist or no longer take that kind of value. */
export function pruneEdges(edges: AppEdge[], nodes: AppNode[], preset: Preset): AppEdge[] {
  const slots = new Map(preset.slots.map((s) => [s.key, s.type]));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.filter((e) => {
    if (e.target !== COMPOSER_ID) return true;
    const slotType = e.targetHandle ? slots.get(e.targetHandle) : undefined;
    return slotType !== undefined && slotType === outputTypeOf(byId.get(e.source));
  });
}

/** Follow a slot that was renamed, so its wire stays plugged in. */
export function renameHandle(edges: AppEdge[], from: string, to: string): AppEdge[] {
  return edges.map((e) =>
    e.target === COMPOSER_ID && e.targetHandle === from
      ? { ...e, id: `e-${e.source}-${e.target}-${to}`, targetHandle: to }
      : e,
  );
}

/** Write one input set into the input nodes that are wired to those slots. */
export function applyValues(nodes: AppNode[], edges: AppEdge[], values: InputSet): AppNode[] {
  const valueFor = new Map<string, string>();
  for (const e of edges) {
    if (e.target === COMPOSER_ID && e.targetHandle && values[e.targetHandle] !== undefined) {
      valueFor.set(e.source, values[e.targetHandle]);
    }
  }
  return nodes.map((n): AppNode => {
    const value = valueFor.get(n.id);
    if (value === undefined) return n;
    if (n.type === 'imageInput') return { ...n, data: { ...n.data, assetId: value } };
    if (n.type === 'textInput') return { ...n, data: { ...n.data, text: value } };
    return n;
  });
}

import { applyEdgeChanges, applyNodeChanges, type OnConnect, type OnEdgesChange, type OnNodesChange } from '@xyflow/react';
import { imageAssets } from '../assets/manifest';
import type { InputSet } from '../engine';
import { applyValues, canConnect, connect } from './graphOps';
import type { AppEdge, AppNode, ImageInputData, InputNode, TextInputData } from './graphTypes';
import { initialGraph } from './initialGraph';
import type { SliceCreator } from './types';

export type GraphSlice = {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: OnConnect;
  addInputNode(kind: 'image' | 'text'): void;
  updateInputNode(id: string, data: Partial<ImageInputData> | Partial<TextInputData>): void;
  /** Put one input set (such as a CSV row) into the wired input nodes. */
  loadValues(values: InputSet): void;
  resetGraph(): void;
};

export const createGraphSlice: SliceCreator<GraphSlice> = (set, get) => ({
  ...initialGraph(),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) => {
    const { nodes, edges, preset } = get();
    if (!canConnect(connection, nodes, preset)) return;
    set({ edges: connect(edges, connection, nodes) });
  },

  addInputNode: (kind) => {
    const nodes = get().nodes;
    const inputs = nodes.filter((n): n is InputNode => n.type === 'imageInput' || n.type === 'textInput');
    const ids = new Set(nodes.map((n) => n.id));
    let n = inputs.length + 1;
    while (ids.has(`in-${kind}-${n}`)) n++;

    const lowest = Math.max(0, ...inputs.map((i) => i.position.y + (i.measured?.height ?? 120)));
    const position = { x: 0, y: lowest + 30 };
    const node: InputNode =
      kind === 'image'
        ? { id: `in-${kind}-${n}`, type: 'imageInput', position, data: { label: `Image ${n}`, assetId: imageAssets[0].id } }
        : { id: `in-${kind}-${n}`, type: 'textInput', position, data: { label: `Text ${n}`, text: 'New text' } };
    set({ nodes: [...nodes, node] });
  },

  updateInputNode: (id, data) =>
    set({
      nodes: get().nodes.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, ...data } } as AppNode) : n)),
    }),

  loadValues: (values) => set({ nodes: applyValues(get().nodes, get().edges, values) }),

  resetGraph: () => set(initialGraph()),
});

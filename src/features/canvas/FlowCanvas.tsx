import { Background, BackgroundVariant, Controls, Panel, ReactFlow, type IsValidConnection, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Image, Type } from 'lucide-react';
import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../../store';
import { canConnect } from '../../store/graphOps';
import type { AppEdge } from '../../store/graphTypes';
import { Button } from '../../ui/Button';
import { ComposerNode } from './nodes/ComposerNode';
import { ImageInputNode } from './nodes/ImageInputNode';
import { OutputNode } from './nodes/OutputNode';
import { TextInputNode } from './nodes/TextInputNode';

const nodeTypes: NodeTypes = {
  imageInput: ImageInputNode,
  textInput: TextInputNode,
  composer: ComposerNode,
  outputImage: OutputNode,
};

/** The workflow: inputs wired into one Composer, wired into one Output. */
export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addInputNode } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      onNodesChange: s.onNodesChange,
      onEdgesChange: s.onEdgesChange,
      onConnect: s.onConnect,
      addInputNode: s.addInputNode,
    })),
  );

  // Checked while dragging a wire, so a wrong drop is refused before it happens.
  const isValidConnection = useCallback<IsValidConnection<AppEdge>>((connection) => {
    const { nodes, preset } = useStore.getState();
    return canConnect(
      {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      },
      nodes,
      preset,
    );
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2}
      defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
      connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#d4d4d8" />
      <Controls showInteractive={false} />
      <Panel position="top-left" className="flex gap-2">
        <Button icon={<Image size={14} />} onClick={() => addInputNode('image')} data-testid="add-image-input">
          Image input
        </Button>
        <Button icon={<Type size={14} />} onClick={() => addInputNode('text')} data-testid="add-text-input">
          Text input
        </Button>
      </Panel>
    </ReactFlow>
  );
}

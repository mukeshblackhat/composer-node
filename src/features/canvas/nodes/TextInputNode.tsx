import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Type } from 'lucide-react';
import { useStore } from '../../../store';
import type { TextInputNode as TextNode } from '../../../store/graphTypes';
import { handleStyle, NodeLabel, TEXT_ORANGE } from './NodeLabel';

export function TextInputNode({ id, data, selected }: NodeProps<TextNode>) {
  const updateInputNode = useStore((s) => s.updateInputNode);

  return (
    <div className="w-44" data-testid={`node-${id}`}>
      <NodeLabel icon={<Type size={12} />}>
        <input
          className="nodrag min-w-0 flex-1 bg-transparent outline-none focus:text-neutral-900"
          value={data.label}
          aria-label="Input name"
          onChange={(e) => updateInputNode(id, { label: e.target.value })}
        />
      </NodeLabel>
      <div className={`rounded-xl border bg-white p-2 shadow-sm ${selected ? 'border-blue-500' : 'border-neutral-200'}`}>
        <textarea
          className="nodrag nowheel block w-full resize-none rounded-md bg-neutral-50 px-2 py-1.5 text-sm text-neutral-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30"
          rows={2}
          value={data.text}
          aria-label={data.label}
          onChange={(e) => updateInputNode(id, { text: e.target.value })}
        />
      </div>
      <Handle type="source" position={Position.Right} id="out" style={{ ...handleStyle(TEXT_ORANGE), top: 'auto', bottom: 30 }} />
    </div>
  );
}

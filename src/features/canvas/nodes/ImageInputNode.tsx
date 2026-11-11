import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Image } from 'lucide-react';
import { imageAssets } from '../../../assets/manifest';
import { useStore } from '../../../store';
import type { ImageInputNode as ImageNode } from '../../../store/graphTypes';
import { handleStyle, IMAGE_BLUE, NodeLabel } from './NodeLabel';

export function ImageInputNode({ id, data, selected }: NodeProps<ImageNode>) {
  const updateInputNode = useStore((s) => s.updateInputNode);
  const asset = imageAssets.find((a) => a.id === data.assetId);

  return (
    <div className="w-44" data-testid={`node-${id}`}>
      <NodeLabel icon={<Image size={12} />}>
        <input
          className="nodrag min-w-0 flex-1 bg-transparent outline-none focus:text-neutral-900"
          value={data.label}
          aria-label="Input name"
          onChange={(e) => updateInputNode(id, { label: e.target.value })}
        />
      </NodeLabel>
      <div className={`rounded-xl border bg-white p-2 shadow-sm ${selected ? 'border-blue-500' : 'border-neutral-200'}`}>
        <div className="checker flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg">
          {asset ? (
            <img src={asset.url} alt={asset.label} className="h-full w-full object-contain" draggable={false} />
          ) : (
            <span className="text-xs text-red-600">Missing: {data.assetId}</span>
          )}
        </div>
        <select
          className="nodrag mt-2 h-7 w-full rounded-md border border-neutral-200 bg-white px-1.5 text-xs"
          value={data.assetId}
          aria-label="Image"
          onChange={(e) => updateInputNode(id, { assetId: e.target.value })}
        >
          {imageAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.kind === 'backdrop' ? 'Backdrop' : 'Product'}: {a.label}
            </option>
          ))}
        </select>
      </div>
      <Handle type="source" position={Position.Right} id="out" style={{ ...handleStyle(IMAGE_BLUE), top: 'auto', bottom: 52 }} />
    </div>
  );
}
